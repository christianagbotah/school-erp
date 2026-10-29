import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, audit, AuthError } from '@/lib/auth';
import { generateInvoices } from '@/lib/fee-engine';

// POST /api/fees/generate — bulk invoice generation with dry-run support
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole('accountant', 'bursar', 'headteacher');
    const { schoolId, academicYearId, termId, planId, dueDate, studentIds, dryRun } = await req.json();
    if (!schoolId || !academicYearId || !planId) {
      return NextResponse.json({ error: 'schoolId, academicYearId, planId required' }, { status: 400 });
    }
    const school = await db.school.findUnique({ where: { id: schoolId } });
    if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    if (!tenantIds.includes(school.tenantId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const result = await generateInvoices(db, {
      tenantId: school.tenantId,
      schoolId,
      academicYearId,
      termId: termId ?? null,
      planId,
      dueDate: new Date(dueDate),
      studentIds,
      createdById: auth.user.id,
      dryRun: !!dryRun,
    });
    if (!dryRun) {
      await audit({ tenantId: school.tenantId, userId: auth.user.id, action: 'fees.generate_invoices', entityType: 'fee_plan', entityId: planId, after: result });
    }
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
