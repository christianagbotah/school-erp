// ============================================================================
// Financial statements from the double-entry ledger — pure logic, no DB.
// All amounts are integer pesewas. Debit-positive convention internally.
// Mirrors src/lib/fee-engine-testable.ts: keep this file free of I/O so the
// arithmetic is unit-testable (see tests/domain.test.ts finance-report cases).
// ============================================================================

export type LedgerAccount = {
  code: string;
  name: string;
  type: string; // asset | liability | equity | income | expense
  subtype?: string | null;
};

export type LedgerLine = { accountCode: string; debit: number; credit: number };

export type LedgerEntry = {
  date: string; // YYYY-MM-DD (ISO date string — lexicographic compare is safe)
  status: string; // posted | draft | reversed
  lines: LedgerLine[];
};

export type StatementRow = {
  code: string;
  name: string;
  type: string;
  amount: number; // natural balance: assets/expenses debit-positive, others credit-positive
  hasActivity: boolean;
};

export type TrialBalanceRow = {
  code: string;
  name: string;
  type: string;
  debits: number;
  credits: number;
  balanceDebit: number; // amount only when debit-normal side larger
  balanceCredit: number; // amount only when credit-normal side larger
  hasActivity: boolean;
};

export type TrialBalance = {
  rows: TrialBalanceRow[];
  totals: { debits: number; credits: number };
  balanced: boolean;
};

export type IncomeStatementSection = {
  rows: StatementRow[];
  total: number;
};

export type IncomeStatement = {
  revenue: IncomeStatementSection;
  expense: IncomeStatementSection;
  totalRevenue: number;
  totalExpense: number;
  netIncome: number; // positive = surplus, negative = deficit
  period: { from: string; to: string };
};

export type BalanceSheetSection = {
  rows: StatementRow[];
  total: number;
};

export type BalanceSheet = {
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection; // includes current-year surplus line when nonzero
  netIncomeToDate: number;
  totals: { assets: number; liabilitiesAndEquity: number };
  balanced: boolean;
  asOf: string;
};

const TYPE_ORDER: Record<string, number> = {
  asset: 0,
  liability: 1,
  equity: 2,
  income: 3,
  expense: 4,
};

function isDebitNormal(type: string): boolean {
  return type === 'asset' || type === 'expense';
}

function sortByCodeThenType<T extends { code: string; type: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const t = (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9);
    if (t !== 0) return t;
    return a.code.localeCompare(b.code);
  });
}

function entryInRange(e: LedgerEntry, from: string | null, to: string): boolean {
  if (e.status !== 'posted') return false;
  const d = e.date.slice(0, 10);
  if (d > to) return false;
  if (from && d < from) return false;
  return true;
}

/** Signed movement on an account within a set of lines: debit-positive. */
function signedMovement(lines: LedgerLine[]): number {
  return lines.reduce((s, l) => s + (l.debit - l.credit), 0);
}

// ---------------------------------------------------------------------------
// Trial balance — every account's cumulative debits and credits must tie out.
// ---------------------------------------------------------------------------

export function buildTrialBalance(accounts: LedgerAccount[], lines: LedgerLine[]): TrialBalance {
  const byCode = new Map<string, { debits: number; credits: number }>();
  for (const l of lines) {
    const cur = byCode.get(l.accountCode) ?? { debits: 0, credits: 0 };
    cur.debits += l.debit;
    cur.credits += l.credit;
    byCode.set(l.accountCode, cur);
  }

  const rows: TrialBalanceRow[] = accounts.map((a) => {
    const agg = byCode.get(a.code) ?? { debits: 0, credits: 0 };
    const net = agg.debits - agg.credits;
    const hasActivity = agg.debits !== 0 || agg.credits !== 0;
    return {
      code: a.code,
      name: a.name,
      type: a.type,
      debits: agg.debits,
      credits: agg.credits,
      balanceDebit: net > 0 ? net : 0,
      balanceCredit: net < 0 ? -net : 0,
      hasActivity,
    };
  });

  // Columns reflect the actual balance direction, so an abnormal balance
  // (e.g. overdrawn cash) is surfaced honestly on the opposite side.
  const totals = {
    debits: rows.reduce((s, r) => s + r.debits, 0),
    credits: rows.reduce((s, r) => s + r.credits, 0),
  };

  return { rows: sortByCodeThenType(rows), totals, balanced: totals.debits === totals.credits };
}

// ---------------------------------------------------------------------------
// Income statement — revenue and expenses for a period [from, to].
// ---------------------------------------------------------------------------

export function buildIncomeStatement(
  accounts: LedgerAccount[],
  entries: LedgerEntry[],
  period: { from: string; to: string },
): IncomeStatement {
  const inPeriod = entries.filter((e) => entryInRange(e, period.from, period.to));
  const movement = new Map<string, number>(); // accountCode -> signed (debit-positive)
  for (const e of inPeriod) {
    for (const l of e.lines) {
      movement.set(l.accountCode, (movement.get(l.accountCode) ?? 0) + (l.debit - l.credit));
    }
  }

  const section = (type: 'income' | 'expense'): IncomeStatementSection => {
    const rows: StatementRow[] = accounts
      .filter((a) => a.type === type)
      .map((a) => {
        const net = movement.get(a.code) ?? 0;
        const natural = isDebitNormal(type) ? net : -net; // income/expense reported positive
        return {
          code: a.code,
          name: a.name,
          type,
          amount: natural,
          hasActivity: movement.has(a.code),
        };
      })
      .filter((r) => r.amount !== 0 || r.hasActivity);
    return {
      rows: sortByCodeThenType(rows),
      total: rows.reduce((s, r) => s + r.amount, 0),
    };
  };

  const revenue = section('income');
  const expense = section('expense');

  return {
    revenue,
    expense,
    totalRevenue: revenue.total,
    totalExpense: expense.total,
    netIncome: revenue.total - expense.total,
    period,
  };
}

// ---------------------------------------------------------------------------
// Balance sheet — position as of a date, with current-year surplus derived
// from the ledger (no separate retained-earnings account needed).
// ---------------------------------------------------------------------------

export function buildBalanceSheet(
  accounts: LedgerAccount[],
  entries: LedgerEntry[],
  asOf: string,
): BalanceSheet {
  const upToAsOf = entries.filter((e) => entryInRange(e, null, asOf));
  const movement = new Map<string, number>();
  for (const e of upToAsOf) {
    for (const l of e.lines) {
      movement.set(l.accountCode, (movement.get(l.accountCode) ?? 0) + (l.debit - l.credit));
    }
  }

  const naturalBalance = (a: LedgerAccount): number => {
    const net = movement.get(a.code) ?? 0;
    return isDebitNormal(a.type) ? net : -net;
  };

  const section = (type: 'asset' | 'liability' | 'equity'): BalanceSheetSection => {
    const rows: StatementRow[] = accounts
      .filter((a) => a.type === type)
      .map((a) => ({
        code: a.code,
        name: a.name,
        type,
        amount: naturalBalance(a),
        hasActivity: movement.has(a.code),
      }))
      .filter((r) => r.amount !== 0 || r.hasActivity);
    return {
      rows: sortByCodeThenType(rows),
      total: rows.reduce((s, r) => s + r.amount, 0),
    };
  };

  const assets = section('asset');
  const liabilities = section('liability');
  const equity = section('equity');

  // Net income to date feeds equity as the current-year surplus line.
  let netIncomeToDate = 0;
  for (const a of accounts) {
    if (a.type === 'income') netIncomeToDate += -(movement.get(a.code) ?? 0); // revenue: credit balance
    if (a.type === 'expense') netIncomeToDate -= movement.get(a.code) ?? 0; // expenses reduce surplus
  }
  if (netIncomeToDate !== 0) {
    equity.rows.push({
      code: '—',
      name: 'Current-year surplus (revenue less expenses to date)',
      type: 'equity',
      amount: netIncomeToDate,
      hasActivity: true,
    });
    equity.total += netIncomeToDate;
  }

  const totals = {
    assets: assets.total,
    liabilitiesAndEquity: liabilities.total + equity.total,
  };

  return {
    assets,
    liabilities,
    equity: { rows: sortByCodeThenType(equity.rows), total: equity.total },
    netIncomeToDate,
    totals,
    balanced: totals.assets === totals.liabilitiesAndEquity,
    asOf,
  };
}
