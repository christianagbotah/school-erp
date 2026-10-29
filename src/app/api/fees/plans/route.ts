import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

// GET /api/fees/plans — published fee plans with items (for invoice generation UI)
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    const plans = await db.feePlan.findMany({
      where: { tenantId: { in: tenantIds }, status: 'published' },
      include: { items: { include: { feeItem: true } }, term: true, academicYear: true },
      orderBy: { createdAt: 'desc' },
    });
    const years = await db.academicYear.findMany({ where: { tenantId: { in: tenantIds } }, include: { terms: true }, orderBy: { startDate: 'desc' } });
    return NextResponse.json({
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        scope: `${p.scopeType}${p.scopeName ? `: ${p.scopeName}` : ''}`,
        year: p.academicYear.name,
        term: p.term?.name ?? null,
        items: p.items.map((i) => ({ code: i.feeItem.code, name: i.feeItem.name, amount: i.amount, cadence: i.cadence })),
      })),
      years: years.map((y) => ({ id: y.id, name: y.name, isCurrent: y.isCurrent, terms: y.terms.map((t) => ({ id: t.id, name: t.name, isCurrent: t.isCurrent })) })),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
