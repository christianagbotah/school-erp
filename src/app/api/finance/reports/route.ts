import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth';
import {
  buildTrialBalance, buildIncomeStatement, buildBalanceSheet,
  type LedgerEntry, type LedgerAccount,
} from '@/lib/finance-reports';

// GET /api/finance/reports?type=trial-balance|income-statement|balance-sheet
//   &from=YYYY-MM-DD&to=YYYY-MM-DD
// Statements are built strictly from POSTED journal entries of the tenant.
export async function GET(req: Request) {
  try {
    const auth = await requireRole('bursar', 'accountant', 'headteacher', 'proprietor');
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    const school = await db.school.findFirst({ where: { tenantId: { in: tenantIds } } });
    if (!school) return NextResponse.json({ error: 'No school for tenant' }, { status: 404 });
    const tenantId = school.tenantId;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') ?? 'trial-balance';
    const today = new Date().toISOString().slice(0, 10);
    const yearStart = `${today.slice(0, 4)}-01-01`;
    const from = searchParams.get('from') ?? yearStart;
    const to = searchParams.get('to') ?? today;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }
    if (from > to) {
      return NextResponse.json({ error: 'from must be on or before to' }, { status: 400 });
    }

    const accounts = await db.glAccount.findMany({
      where: { tenantId, schoolId: school.id },
      orderBy: { code: 'asc' },
    });
    const accs: LedgerAccount[] = accounts.map((a) => ({
      code: a.code, name: a.name, type: a.type, subtype: a.subtype,
    }));

    if (type === 'trial-balance') {
      const lines = await db.journalLine.findMany({
        where: { tenantId, entry: { tenantId, schoolId: school.id, status: 'posted' } },
        select: { accountCode: true, debit: true, credit: true },
      });
      const tb = buildTrialBalance(accs, lines);
      return NextResponse.json({
        school: { name: school.name },
        type,
        generatedFor: today,
        trialBalance: tb,
      });
    }

    if (type === 'income-statement') {
      const entries = await db.journalEntry.findMany({
        where: {
          tenantId, schoolId: school.id, status: 'posted',
          date: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T23:59:59.999Z`) },
        },
        select: {
          date: true, status: true,
          lines: { select: { accountCode: true, debit: true, credit: true } },
        },
        take: 20000,
      });
      const ledger: LedgerEntry[] = entries.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        status: e.status,
        lines: e.lines,
      }));
      const is = buildIncomeStatement(accs, ledger, { from, to });
      return NextResponse.json({
        school: { name: school.name },
        type,
        generatedFor: today,
        incomeStatement: is,
      });
    }

    if (type === 'balance-sheet') {
      // Position as of `to`: every posted entry up to that date, regardless of `from`.
      const all = await db.journalEntry.findMany({
        where: {
          tenantId, schoolId: school.id, status: 'posted',
          date: { lte: new Date(`${to}T23:59:59.999Z`) },
        },
        select: {
          date: true, status: true,
          lines: { select: { accountCode: true, debit: true, credit: true } },
        },
        take: 20000,
      });
      const bs = buildBalanceSheet(
        accs,
        all.map((e) => ({ date: e.date.toISOString().slice(0, 10), status: e.status, lines: e.lines })),
        to,
      );
      return NextResponse.json({
        school: { name: school.name },
        type,
        generatedFor: today,
        balanceSheet: bs,
      });
    }

    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Financial reports failed' }, { status: 500 });
  }
}
