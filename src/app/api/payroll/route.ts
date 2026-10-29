import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole, audit, AuthError } from '@/lib/auth';
import { computePayrollLine, sumPayroll, payrollJournalLines } from '@/lib/payroll';
import { postJournal } from '@/lib/fee-engine';
import { formatMoney } from '@/lib/money';
import { GHANA_PAYROLL_PACK } from '@/lib/ghana-config';

// GET /api/payroll?month=YYYY-MM — pay runs list + preview computation for a month
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole('bursar', 'accountant', 'headteacher', 'proprietor');
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    const school = await db.school.findFirst({ where: { tenantId: { in: tenantIds } } });
    if (!school) return NextResponse.json({ error: 'No school for tenant' }, { status: 404 });
    const tenantId = school.tenantId;

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(monthParam)) return NextResponse.json({ error: 'month must be YYYY-MM' }, { status: 400 });

    // existing pay runs (most recent first)
    const payRuns = await db.payRun.findMany({
      where: { tenantId },
      orderBy: { month: 'desc' },
      take: 12,
      include: { _count: { select: { items: true } } },
    });

    const existing = payRuns.find((p) => p.month === monthParam);
    let items: {
      staffId: string; name: string; position: string; gross: number; allowances: number;
      ssnitTier1Employee: number; ssnitTier2Employer: number; paye: number; totalDeductions: number; net: number;
    }[] = [];
    let status = existing?.status ?? null;

    if (existing) {
      const rows = await db.payrollItem.findMany({ where: { payRunId: existing.id }, include: { staff: true }, orderBy: { staff: { lastName: 'asc' } } });
      items = rows.map((r) => ({
        staffId: r.staffId, name: `${r.staff.firstName} ${r.staff.lastName}`, position: r.staff.position,
        gross: r.grossSalary, allowances: r.allowances,
        ssnitTier1Employee: r.ssnitTier1, ssnitTier2Employer: r.ssnitTier2,
        paye: r.paye, totalDeductions: r.ssnitTier1 + r.paye + r.otherDeductions, net: r.netPay,
      }));
    } else {
      // live preview from active staff with a configured salary
      const staff = await db.staff.findMany({ where: { tenantId, status: 'active', baseSalary: { not: null } }, orderBy: { lastName: 'asc' } });
      items = staff.map((s) => {
        const line = computePayrollLine({
          staffId: s.id, staffName: `${s.firstName} ${s.lastName}`, position: s.position,
          baseSalary: s.baseSalary ?? 0, allowances: s.allowances,
        });
        return {
          staffId: line.staffId, name: line.staffName, position: line.position,
          gross: line.gross, allowances: line.allowances,
          ssnitTier1Employee: line.ssnitTier1Employee, ssnitTier2Employer: line.ssnitTier2Employer,
          paye: line.paye, totalDeductions: line.totalDeductions, net: line.net,
        };
      });
    }

    const totals = sumPayroll(items.map((i) => ({ ...i, employerCost: 0 })));
    return NextResponse.json({
      month: monthParam,
      status,
      payRunId: existing?.id ?? null,
      rulePack: { version: GHANA_PAYROLL_PACK.version, effectiveFrom: GHANA_PAYROLL_PACK.effectiveFrom },
      items,
      totals: {
        gross: totals.gross, deductions: totals.deductions, net: totals.net,
        tier1Employee: totals.tier1Employee, tier2Employer: totals.tier2Employer, paye: totals.paye,
        headcount: items.length,
      },
      totalsFormatted: {
        gross: formatMoney(totals.gross), deductions: formatMoney(totals.deductions), net: formatMoney(totals.net),
        tier1Employee: formatMoney(totals.tier1Employee), tier2Employer: formatMoney(totals.tier2Employer), paye: formatMoney(totals.paye),
      },
      payRuns: payRuns.map((p) => ({
        id: p.id, month: p.month, status: p.status, headcount: p._count.items,
        totalGross: p.totalGross, totalNet: p.totalNet,
        totalGrossFormatted: formatMoney(p.totalGross), totalNetFormatted: formatMoney(p.totalNet),
        approvedAt: p.approvedAt,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('payroll GET failed:', e);
    return NextResponse.json({ error: 'Payroll failed' }, { status: 500 });
  }
}

// POST /api/payroll — { action: 'save' | 'approve', month, items? }
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole('bursar', 'accountant', 'headteacher', 'proprietor');
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    const school = await db.school.findFirst({ where: { tenantId: { in: tenantIds } } });
    if (!school) return NextResponse.json({ error: 'No school for tenant' }, { status: 404 });
    const tenantId = school.tenantId;

    const body = await req.json();
    const { action, month } = body as { action: string; month: string };
    if (!action || !/^\d{4}-\d{2}$/.test(month ?? '')) {
      return NextResponse.json({ error: 'action and month (YYYY-MM) required' }, { status: 400 });
    }

    let payRun = await db.payRun.findUnique({ where: { tenantId_schoolId_month: { tenantId, schoolId: school.id, month } } });

    if (action === 'save' || action === 'approve') {
      if (payRun && ['approved', 'disbursing', 'paid'].includes(payRun.status)) {
        return NextResponse.json({ error: `Pay run for ${month} is already ${payRun.status} — immutable` }, { status: 409 });
      }
      // (re)compute from staff of record
      const staff = await db.staff.findMany({ where: { tenantId, status: 'active', baseSalary: { not: null } }, orderBy: { lastName: 'asc' } });
      if (staff.length === 0) return NextResponse.json({ error: 'No salaried staff configured' }, { status: 400 });
      const computed = staff.map((s) => computePayrollLine({
        staffId: s.id, staffName: `${s.firstName} ${s.lastName}`, position: s.position,
        baseSalary: s.baseSalary ?? 0, allowances: s.allowances,
      }));
      const totals = sumPayroll(computed);

      payRun = await db.$transaction(async (tx) => {
        if (payRun) {
          await tx.payrollItem.deleteMany({ where: { payRunId: payRun!.id } });
          return tx.payRun.update({
            where: { id: payRun!.id },
            data: { status: action === 'approve' ? 'approved' : 'previewed', totalGross: totals.gross, totalDeductions: totals.deductions, totalNet: totals.net, rulePackVersion: GHANA_PAYROLL_PACK.version },
          });
        }
        return tx.payRun.create({
          data: {
            tenantId, schoolId: school.id, month,
            status: action === 'approve' ? 'approved' : 'previewed',
            rulePackVersion: GHANA_PAYROLL_PACK.version,
            totalGross: totals.gross, totalDeductions: totals.deductions, totalNet: totals.net,
          },
        });
      });

      await db.payrollItem.createMany({
        data: computed.map((c) => ({
          tenantId, payRunId: payRun!.id, staffId: c.staffId,
          grossSalary: c.gross, allowances: c.allowances, overtime: 0,
          ssnitTier1: c.ssnitTier1Employee, ssnitTier2: c.ssnitTier2Employer, paye: c.paye,
          otherDeductions: 0, netPay: c.net,
          snapshot: JSON.stringify({ rulePack: GHANA_PAYROLL_PACK.version, baseSalary: c.baseSalary, employerCost: c.employerCost }),
        })),
      });

      if (action === 'approve') {
        await db.payRun.update({ where: { id: payRun.id }, data: { approvedById: auth.user.id, approvedAt: new Date() } });
        // balanced journal posting: Dr 5001 salaries, Cr SSNIT/PAYE payables + net payable
        const lines = payrollJournalLines(totals, month);
        const entryId = await postJournal(db, {
          tenantId, schoolId: school.id, date: new Date(),
          memo: `Payroll ${month} — approved pay run`,
          sourceModule: 'payroll', sourceRef: payRun.id,
          lines, postedById: auth.user.id,
        });
        await audit({ tenantId, userId: auth.user.id, action: 'payroll.approve', entityType: 'payRun', entityId: payRun.id, after: { month, totals, journalEntryId: entryId } });
        return NextResponse.json({ ok: true, payRunId: payRun.id, status: 'approved', journalEntryId: entryId, totals, totalsFormatted: { net: formatMoney(totals.net) } });
      }

      await audit({ tenantId, userId: auth.user.id, action: 'payroll.save_preview', entityType: 'payRun', entityId: payRun.id, after: { month, totals } });
      return NextResponse.json({ ok: true, payRunId: payRun.id, status: 'previewed', totals });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
