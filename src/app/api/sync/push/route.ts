import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

// POST /api/sync/push — device pushes captured offline operations
// At-least-once delivery with idempotent application (operation id = idempotency key)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { deviceId, operations } = await req.json();
    if (!deviceId || !Array.isArray(operations)) {
      return NextResponse.json({ error: 'deviceId and operations[] required' }, { status: 400 });
    }

    const results: { operationId: string; status: 'applied' | 'duplicate' | 'rejected' | 'conflict'; detail?: string }[] = [];

    for (const op of operations) {
      const { id: opId, entityType, opType, payload, clientTimestamp } = op;
      if (!opId || !entityType || !opType) {
        results.push({ operationId: opId ?? 'unknown', status: 'rejected', detail: 'missing fields' });
        continue;
      }

      // idempotency: same operation id already applied?
      const existing = await db.syncOperation.findUnique({ where: { id: opId } });
      if (existing && existing.status === 'applied') {
        results.push({ operationId: opId, status: 'duplicate' });
        continue;
      }

      if (!existing && auth.tenantId) {
        await db.syncOperation.create({
          data: {
            id: opId, tenantId: auth.tenantId, userId: auth.user.id, deviceId,
            entityType, entityId: payload?.entityId ?? null, opType,
            payload: JSON.stringify(payload ?? {}), clientTimestamp: new Date(clientTimestamp ?? Date.now()),
            status: 'pending',
          },
        });
      }

      // apply domain operation with server-side authority checks
      try {
        const outcome = await applyOperation(auth, { opId, entityType, opType, payload: payload ?? {}, deviceId });
        await db.syncOperation.update({ where: { id: opId }, data: { status: outcome.status, serverAppliedAt: new Date(), conflictReason: outcome.detail ?? null } });
        results.push({ operationId: opId, status: outcome.status, detail: outcome.detail });
      } catch (e) {
        await db.syncOperation.update({ where: { id: opId }, data: { status: 'rejected', conflictReason: (e as Error).message } });
        results.push({ operationId: opId, status: 'rejected', detail: (e as Error).message });
      }
    }

    return NextResponse.json({ results });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Sync push failed' }, { status: 500 });
  }
}

type AuthCtx = { user: { id: string }; memberships: { tenantId: string; roleKey: string; scopeType: string; scopeId: string | null }[]; tenantId: string | null };

async function applyOperation(
  auth: AuthCtx,
  op: { opId: string; entityType: string; opType: string; payload: Record<string, unknown>; deviceId: string }
): Promise<{ status: 'applied' | 'rejected' | 'conflict'; detail?: string }> {
  const tenantId = auth.tenantId;
  if (!tenantId) return { status: 'rejected', detail: 'no tenant context' };

  switch (op.entityType) {
    case 'attendance': {
      const roles = auth.memberships.map((m) => m.roleKey);
      if (!roles.some((r) => ['teacher', 'academic_head', 'headteacher', 'class_teacher'].includes(r))) {
        return { status: 'rejected', detail: 'role not authorized to mark attendance' };
      }
      const { studentId, date, sessionType, status } = op.payload as { studentId: string; date: string; sessionType?: string; status: string };
      if (!studentId || !date || !status) return { status: 'rejected', detail: 'missing attendance fields' };
      const student = await db.student.findUnique({ where: { id: studentId } });
      if (!student || student.tenantId !== tenantId) return { status: 'rejected', detail: 'student not in tenant' };
      const enrollment = await db.enrollment.findFirst({ where: { studentId, isCurrent: true } });
      if (!enrollment) return { status: 'rejected', detail: 'no active enrollment' };
      const dayDate = new Date(`${date}T00:00:00.000Z`);
      let calDay = await db.attendanceDay.findFirst({ where: { tenantId, date: dayDate } });
      if (!calDay) {
        const year = await db.academicYear.findFirst({ where: { tenantId, isCurrent: true } });
        if (!year) return { status: 'rejected', detail: 'no academic year' };
        const term = await db.academicTerm.findFirst({ where: { yearId: year.id, isCurrent: true } });
        calDay = await db.attendanceDay.create({ data: { tenantId, yearId: year.id, termId: term?.id ?? null, date: dayDate, dayType: 'school_day' } });
      }
      const existing = await db.attendanceRecord.findUnique({
        where: { tenantId_studentId_date_sessionType: { tenantId, studentId, date: dayDate, sessionType: sessionType ?? 'morning' } },
      });
      if (existing) {
        if (existing.status === status) return { status: 'applied', detail: 'idempotent — same value' };
        // conflict: server value differs → visible conflict, not silent overwrite
        return { status: 'conflict', detail: `Server has "${existing.status}"; offline captured "${status}" — needs review` };
      }
      await db.attendanceRecord.create({
        data: {
          tenantId, studentId, classId: enrollment.classId, calendarDayId: calDay.id,
          date: dayDate, sessionType: sessionType ?? 'morning', status,
          markedById: auth.user.id, markedVia: 'offline_device', offlineCaptureAt: new Date(op.payload.clientTimestamp as string ?? Date.now()),
        },
      });
      return { status: 'applied' };
    }

    case 'payment': {
      const roles = auth.memberships.map((m) => m.roleKey);
      if (!roles.some((r) => ['cashier', 'accountant', 'bursar', 'headteacher'].includes(r))) {
        return { status: 'rejected', detail: 'role not authorized to collect payments' };
      }
      const { studentId, method, amount, offlineReceiptNo } = op.payload as { studentId: string; method: string; amount: number; offlineReceiptNo?: string };
      if (!studentId || !method || !amount) return { status: 'rejected', detail: 'missing payment fields' };
      const student = await db.student.findUnique({ where: { id: studentId } });
      if (!student || student.tenantId !== tenantId) return { status: 'rejected', detail: 'student not in tenant' };
      // duplicate receipt = return original, never double-post money
      if (offlineReceiptNo) {
        const dup = await db.payment.findFirst({ where: { tenantId, offlineReceiptNo } });
        if (dup) return { status: 'applied', detail: `duplicate receipt — original ${dup.paymentRef} returned` };
      }
      // collision-safe ref generation
      let posted = false;
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 3 && !posted; attempt++) {
        const seq = (await db.payment.count({ where: { schoolId: student.schoolId } })) + 1 + attempt;
        try {
          await db.payment.create({
            data: {
              tenantId, schoolId: student.schoolId, studentId,
              paymentRef: `PAY-${new Date().getFullYear().toString().slice(2)}-${String(seq).padStart(5, '0')}`,
              offlineReceiptNo: offlineReceiptNo ?? null, deviceSerial: op.deviceId,
              method, amount: Math.round(amount), status: 'posted',
              businessDate: new Date(), receivedById: auth.user.id, verifiedAt: new Date(),
              note: 'synced from offline device',
            },
          });
          posted = true;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!posted) {
        try {
          await db.payment.create({
            data: {
              tenantId, schoolId: student.schoolId, studentId,
              paymentRef: `PAY-${Date.now().toString(36).toUpperCase()}`,
              offlineReceiptNo: offlineReceiptNo ?? null, deviceSerial: op.deviceId,
              method, amount: Math.round(amount), status: 'posted',
              businessDate: new Date(), receivedById: auth.user.id, verifiedAt: new Date(),
              note: 'synced from offline device',
            },
          });
          posted = true;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!posted) throw lastErr instanceof Error ? lastErr : new Error('payment create failed');
      return { status: 'applied' };
    }

    case 'observation': {
      const roles = auth.memberships.map((m) => m.roleKey);
      if (!roles.some((r) => ['teacher', 'academic_head', 'headteacher'].includes(r))) {
        return { status: 'rejected', detail: 'role not authorized' };
      }
      const { studentId, domain, indicator, observation } = op.payload as { studentId: string; domain: string; indicator: string; observation: string };
      if (!studentId || !domain || !indicator) return { status: 'rejected', detail: 'missing observation fields' };
      const student = await db.student.findUnique({ where: { id: studentId } });
      if (!student || student.tenantId !== tenantId) return { status: 'rejected', detail: 'student not in tenant' };
      await db.kgObservation.create({
        data: { tenantId, studentId, domain, indicator, observation: observation ?? '', observedById: auth.user.id },
      });
      return { status: 'applied' };
    }

    default:
      return { status: 'rejected', detail: `unknown entity type ${op.entityType}` };
  }
}
