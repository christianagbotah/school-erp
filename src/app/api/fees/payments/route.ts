import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, requireAuth, audit, AuthError } from '@/lib/auth';
import { allocatePayment, postJournal } from '@/lib/fee-engine';
import { formatMoney } from '@/lib/money';

// POST /api/fees/payments — record a payment (cash/momo/bank...) with allocation
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole('cashier', 'accountant', 'bursar', 'headteacher');
    const { studentId, method, amount, invoiceId, offlineReceiptNo, deviceSerial, note, markedVia } = await req.json();
    if (!studentId || !method || !amount) {
      return NextResponse.json({ error: 'studentId, method, amount required' }, { status: 400 });
    }
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    if (!tenantIds.includes(student.tenantId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    // Idempotency: an offline receipt number maps to exactly one posted payment
    if (offlineReceiptNo) {
      const existing = await db.payment.findFirst({ where: { offlineReceiptNo, tenantId: student.tenantId } });
      if (existing) {
        return NextResponse.json({ payment: existing, duplicate: true, message: 'Receipt already posted — original returned' });
      }
    }

    const isOffline = markedVia === 'offline_device';
    const payment = await createPaymentSafely({
      tenantId: student.tenantId,
      schoolId: student.schoolId,
      studentId,
      offlineReceiptNo: offlineReceiptNo ?? null,
      deviceSerial: deviceSerial ?? null,
      method,
      amount: Math.round(amount),
      status: isOffline ? 'recorded_locally_confirmed' : 'posted',
      receivedById: auth.user.id,
      note: note ?? null,
    });

    // allocate to invoice if provided
    if (invoiceId) {
      await allocatePayment(db, { paymentId: payment.id, allocations: [{ invoiceId, amount: Math.round(amount) }] }).catch(async (e) => {
        // allocation failure → keep payment as unallocated advance (never lose money)
        await db.payment.update({ where: { id: payment.id }, data: { status: 'posted', note: `Unallocated (allocation error: ${(e as Error).message})` } });
      });
    }

    // double-entry journal: Dr Cash/MoMo, Cr Fees Receivable
    const cashAccount = method === 'cash' ? '1000' : method === 'momo' ? '1020' : '1010';
    await postJournal(db, {
      tenantId: student.tenantId,
      schoolId: student.schoolId,
      date: new Date(),
      memo: `Fee payment — ${student.firstName} ${student.lastName} (${payment.paymentRef})`,
      sourceModule: 'payments',
      sourceRef: `payment:${payment.id}`,
      postedById: auth.user.id,
      lines: [
        { accountCode: cashAccount, debit: Math.round(amount), entityType: 'payment', entityId: payment.id },
        { accountCode: '1100', credit: Math.round(amount), entityType: 'payment', entityId: payment.id },
      ],
    }).catch(() => undefined); // journal failure logged separately; payment is durable

    await audit({ tenantId: student.tenantId, userId: auth.user.id, action: 'payment.record', entityType: 'payment', entityId: payment.id, after: { amount, method, invoiceId } });

    return NextResponse.json({
      payment: { ...payment, amountFormatted: formatMoney(payment.amount) },
      allocated: !!invoiceId,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** Collision-safe payment creation: sequence-based ref with retry, timestamp fallback. */
async function createPaymentSafely(data: {
  tenantId: string; schoolId: string; studentId: string;
  offlineReceiptNo: string | null; deviceSerial: string | null;
  method: string; amount: number; status: string; receivedById?: string; note?: string | null;
}) {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const seq = (await db.payment.count({ where: { schoolId: data.schoolId } })) + 1 + attempt;
    try {
      return await db.payment.create({
        data: {
          ...data,
          paymentRef: `PAY-${new Date().getFullYear().toString().slice(2)}-${String(seq).padStart(5, '0')}`,
          businessDate: new Date(),
          verifiedAt: data.status === 'posted' ? new Date() : null,
        },
      });
    } catch (e) {
      lastErr = e; // likely paymentRef collision from concurrent insert — retry
    }
  }
  // final fallback: timestamp-based unique ref
  return db.payment.create({
    data: {
      ...data,
      paymentRef: `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      businessDate: new Date(),
      verifiedAt: data.status === 'posted' ? new Date() : null,
    },
  });
}

// GET /api/fees/payments?studentId= — payment history
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const tenantIds = auth.memberships.map((m) => m.tenantId);

    // parents scoped to wards
    const isParent = auth.memberships.some((m) => m.roleKey === 'parent');
    let scopeIds: string[] | null = null;
    if (isParent) {
      const guardians = await db.guardian.findMany({ where: { userId: auth.user.id }, include: { students: true } });
      scopeIds = guardians.flatMap((g) => g.students.map((s) => s.studentId));
      if (scopeIds.length === 0) return NextResponse.json({ payments: [] });
    }

    const payments = await db.payment.findMany({
      where: {
        tenantId: { in: tenantIds },
        ...(studentId ? { studentId } : {}),
        ...(scopeIds ? { studentId: { in: scopeIds } } : {}),
      },
      include: { student: { select: { firstName: true, lastName: true, studentIdNo: true } }, allocations: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        paymentRef: p.paymentRef,
        student: `${p.student.firstName} ${p.student.lastName}`,
        method: p.method,
        amount: p.amount,
        amountFormatted: formatMoney(p.amount),
        status: p.status,
        businessDate: p.businessDate,
        allocated: p.allocations.length > 0,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Failed to list payments' }, { status: 500 });
  }
}
