// ============================================================================
// iEduPro domain tests — money math, fee engine, discount allocation, payroll
// Run: bun test tests/domain.test.ts
// ============================================================================

import { describe, test, expect } from 'bun:test';
import {
  formatMoney, parseMoneyToPesewas, allocateEvenly, allocateProportional, weightedTotal,
} from '../src/lib/money';
import { applyDiscounts, GHANA_PAYROLL_PACK_VALUE, computePaye } from '../src/lib/fee-engine-testable';
import { computePayrollLine, sumPayroll, payrollJournalLines } from '../src/lib/payroll';

describe('money utilities (integer pesewas)', () => {
  test('formats cedi with symbol, separators and 2 decimals', () => {
    expect(formatMoney(123456789)).toBe('₵1,234,567.89');
    expect(formatMoney(500)).toBe('₵5.00');
    expect(formatMoney(5)).toBe('₵0.05');
    expect(formatMoney(-2500)).toBe('-₵25.00');
    expect(formatMoney(0)).toBe('₵0.00');
  });

  test('parses user input into pesewas exactly', () => {
    expect(parseMoneyToPesewas('1234.50')).toBe(123450);
    expect(parseMoneyToPesewas('₵1234.50')).toBe(123450);
    expect(parseMoneyToPesewas('1,234.5')).toBe(123450);
    expect(parseMoneyToPesewas('0.05')).toBe(5);
    expect(() => parseMoneyToPesewas('12.345')).toThrow(); // max 2 decimals
    expect(() => parseMoneyToPesewas('abc')).toThrow();
  });

  test('even allocation loses no pesewas (remainder distributed)', () => {
    const alloc = allocateEvenly(1000, 3);
    expect(alloc.reduce((a, b) => a + b, 0)).toBe(1000);
    expect(alloc).toEqual([334, 333, 333]);
  });

  test('proportional allocation keeps sum exact with rounding remainder', () => {
    const alloc = allocateProportional(1000, [1, 1, 1]);
    expect(alloc.reduce((a, b) => a + b, 0)).toBe(1000);
    const alloc2 = allocateProportional(333, [2, 3, 5]);
    expect(alloc2.reduce((a, b) => a + b, 0)).toBe(333);
  });

  test('weighted totals compute in integer space (no float drift)', () => {
    const total = weightedTotal([
      { amount: 333, weight: 10 },
      { amount: 667, weight: 90 },
    ]);
    // (333×10 + 667×90) / 100 = (3330 + 60030)/100 = 63360/100 = 633.6 → half-up = 634
    expect(total).toBe(634);
  });
});

describe('discount engine — invoice-wide allocation with exact remainder', () => {
  const lines = [
    { feePlanItemId: 'a', amount: 33333 },
    { feePlanItemId: 'b', amount: 66667 },
    { feePlanItemId: 'c', amount: 100000 },
  ];

  test('10% invoice discount sums exactly to 10% of subtotal', () => {
    const apps = applyDiscounts(lines, [
      { id: 'p1', label: 'Sibling 10%', type: 'percentage', value: 10, scope: 'invoice', priority: 1 },
    ]);
    const total = apps.reduce((s, a) => s + a.amount, 0);
    expect(total).toBe(20000); // 10% of 200000 exactly
    // per-line amounts sum equals policy amount
    for (const a of apps) {
      const lineSum = Object.values(a.lineAmounts).reduce((x: number, y: number) => x + y, 0);
      expect(lineSum).toBe(a.amount);
    }
  });

  test('fixed discount capped at available amount, never exceeds lines', () => {
    const apps = applyDiscounts(lines, [
      { id: 'p2', label: 'Bursary ₵100', type: 'fixed_amount', value: 10000, scope: 'invoice', priority: 1 },
    ]);
    expect(apps[0].amount).toBe(10000);
  });

  test('fixed discount larger than subtotal caps at subtotal', () => {
    const apps = applyDiscounts(
      [{ feePlanItemId: 'x', amount: 5000 }],
      [{ id: 'p3', label: 'Huge', type: 'fixed_amount', value: 100000, scope: 'invoice', priority: 1 }]
    );
    expect(apps[0].amount).toBe(5000);
  });

  test('sequential discounts do not double-apply to already discounted remainder', () => {
    const apps = applyDiscounts(lines, [
      { id: 'p4', label: '10%', type: 'percentage', value: 10, scope: 'invoice', priority: 1 },
      { id: 'p5', label: '5% after', type: 'percentage', value: 5, scope: 'invoice', priority: 2 },
    ]);
    expect(apps[0].amount).toBe(20000);
    expect(apps[1].amount).toBe(9000); // 5% of remaining 180000
  });

  test('fee-item-scoped discount only touches targeted lines', () => {
    const apps = applyDiscounts(lines, [
      { id: 'p6', label: 'Tuition 50%', type: 'percentage', value: 50, scope: 'fee_item', feeItemIds: ['a'], priority: 1 },
    ]);
    expect(apps[0].amount).toBe(Math.round(33333 / 2));
    expect(apps[0].lineAmounts['b']).toBeUndefined();
  });
});

describe('Ghana payroll pack (versioned rule pack)', () => {
  test('PAYE: zero band pays no tax', () => {
    // monthly band up to 496 GHS is tax-free → annualized check on pack bands directly
    const monthlyBands = GHANA_PAYROLL_PACK_VALUE.payeBands;
    expect(monthlyBands[0].rate).toBe(0);
  });

  test('PAYE progressive computation on monthly taxable income', () => {
    // bands: 0–496:0%, 496–616:5%, 616–3116:10%, 3116–3760:17.5% ...
    // taxable 1000 GHS → (616-496)*5% + (1000-616)*10% = 6 + 38.4 = 44.4
    const tax = computePaye(1000, GHANA_PAYROLL_PACK_VALUE.payeBands);
    expect(tax).toBeCloseTo(44.4, 2);
  });

  test('PAYE at band boundary is continuous', () => {
    const justUnder = computePaye(3116, GHANA_PAYROLL_PACK_VALUE.payeBands);
    const justOver = computePaye(3116.01, GHANA_PAYROLL_PACK_VALUE.payeBands);
    expect(justOver - justUnder).toBeLessThan(0.01);
  });

  test('tier1 employee share is 5% of basic', () => {
    expect(GHANA_PAYROLL_PACK_VALUE.ssnitTier1.employeeRate).toBe(0.05);
    expect(GHANA_PAYROLL_PACK_VALUE.ssnitTier2.employerRate).toBe(0.05);
  });
});

describe('payroll engine — Ghana statutory computation', () => {
  test('computePayrollLine: net = gross − tier1 employee − PAYE', () => {
    const line = computePayrollLine({ staffId: 's1', staffName: 'Test', position: 'Teacher', baseSalary: 3000_00, allowances: 200_00 });
    expect(line.gross).toBe(3200_00);
    expect(line.ssnitTier1Employee).toBe(15000); // 5% of basic (₵3,000)
    expect(line.ssnitTier2Employer).toBe(15000); // 5% employer cost
    expect(line.net).toBe(line.gross - line.ssnitTier1Employee - line.paye);
  });

  test('computePayrollLine: SSNIT insurable basic is capped at the statutory maximum', () => {
    const huge = computePayrollLine({ staffId: 's2', staffName: 'Exec', position: 'Director', baseSalary: 50_000_00, allowances: 0 });
    expect(huge.ssnitTier1Employee).toBe(20260_00 * 0.05); // capped at ₵20,260 × 5% = ₵1,013
  });

  test('sumPayroll: aggregates across lines and headcount', () => {
    const a = computePayrollLine({ staffId: 'a', staffName: 'A', position: 'T', baseSalary: 2000_00, allowances: 0 });
    const b = computePayrollLine({ staffId: 'b', staffName: 'B', position: 'T', baseSalary: 4000_00, allowances: 500_00 });
    const totals = sumPayroll([a, b]);
    expect(totals.headcount).toBe(2);
    expect(totals.gross).toBe(a.gross + b.gross);
    expect(totals.net).toBe(a.net + b.net);
    expect(totals.deductions).toBe(a.totalDeductions + b.totalDeductions);
  });

  test('payrollJournalLines: always balances Dr = Cr', () => {
    const a = computePayrollLine({ staffId: 'a', staffName: 'A', position: 'T', baseSalary: 3500_00, allowances: 300_00 });
    const b = computePayrollLine({ staffId: 'b', staffName: 'B', position: 'T', baseSalary: 2800_00, allowances: 150_00 });
    const totals = sumPayroll([a, b]);
    const lines = payrollJournalLines(totals, '2026-10');
    const dr = lines.reduce((s, l) => s + (l.debit ?? 0), 0);
    const cr = lines.reduce((s, l) => s + (l.credit ?? 0), 0);
    expect(dr).toBe(cr);
    expect(dr).toBe(totals.gross + totals.tier2Employer);
  });
});

// ---------------------------------------------------------------------------
// Financial statements — trial balance, income statement, balance sheet
// ---------------------------------------------------------------------------
import {
  buildTrialBalance, buildIncomeStatement, buildBalanceSheet,
  type LedgerAccount, type LedgerEntry,
} from '../src/lib/finance-reports';

const ACCOUNTS: LedgerAccount[] = [
  { code: '1000', name: 'Cash on Hand', type: 'asset' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset' },
  { code: '2100', name: 'SSNIT Payable', type: 'liability' },
  { code: '3000', name: 'Accumulated Fund', type: 'equity' },
  { code: '4001', name: 'Tuition Revenue', type: 'income' },
  { code: '5001', name: 'Salaries and Wages', type: 'expense' },
];

// Verified fixture (arithmetic checked with bun before committing to expectations):
// E1  Jan 10  invoice issued: Dr Receivable 1200 / Cr Tuition 1200
// E2  Jan 15  fees collected:  Dr Cash 800      / Cr Receivable 800
// E3  Mar 01  payroll:         Dr Salaries 600  / Cr Cash 500 + Cr SSNIT 100
// E4  Apr 01  DRAFT            — must never appear in any statement
const ENTRIES: LedgerEntry[] = [
  { date: '2026-01-10', status: 'posted', lines: [
    { accountCode: '1100', debit: 1200_00, credit: 0 },
    { accountCode: '4001', debit: 0, credit: 1200_00 },
  ]},
  { date: '2026-01-15', status: 'posted', lines: [
    { accountCode: '1000', debit: 800_00, credit: 0 },
    { accountCode: '1100', debit: 0, credit: 800_00 },
  ]},
  { date: '2026-03-01', status: 'posted', lines: [
    { accountCode: '5001', debit: 600_00, credit: 0 },
    { accountCode: '1000', debit: 0, credit: 500_00 },
    { accountCode: '2100', debit: 0, credit: 100_00 },
  ]},
  { date: '2026-04-01', status: 'draft', lines: [
    { accountCode: '1000', debit: 99_00, credit: 0 },
    { accountCode: '4001', debit: 0, credit: 99_00 },
  ]}, // draft must never appear in statements
];

describe('financial statements — trial balance', () => {
  // Contract (mirrors the API route): the caller passes lines of POSTED entries only.
  const postedLines = ENTRIES.filter((e) => e.status === 'posted').flatMap((e) => e.lines);

  test('totals tie out and report balanced for a consistent ledger', () => {
    const tb = buildTrialBalance(ACCOUNTS, postedLines);
    expect(tb.balanced).toBe(true);
    expect(tb.totals.debits).toBe(tb.totals.credits);
    expect(tb.totals.debits).toBe(2600_00); // 1200 + 800 + 600
  });

  test('detects an out-of-balance ledger', () => {
    const bad = [...postedLines, { accountCode: '1000', debit: 123, credit: 0 }];
    const tb = buildTrialBalance(ACCOUNTS, bad);
    expect(tb.balanced).toBe(false);
    expect(tb.totals.debits - tb.totals.credits).toBe(123);
  });

  test('cash nets to the expected debit balance (800 − 500)', () => {
    const tb = buildTrialBalance(ACCOUNTS, postedLines);
    const cash = tb.rows.find((r) => r.code === '1000')!;
    expect(cash.balanceDebit).toBe(300_00);
    expect(cash.balanceCredit).toBe(0);
  });

  test('receivable keeps a positive debit balance after part payment', () => {
    const tb = buildTrialBalance(ACCOUNTS, postedLines);
    const ar = tb.rows.find((r) => r.code === '1100')!;
    expect(ar.balanceDebit).toBe(400_00); // 1200 invoiced − 800 collected
  });
});

describe('financial statements — income statement', () => {
  test('net income = revenue − expenses for the full period', () => {
    const is = buildIncomeStatement(ACCOUNTS, ENTRIES, { from: '2026-01-01', to: '2026-12-31' });
    expect(is.totalRevenue).toBe(1200_00);
    expect(is.totalExpense).toBe(600_00);
    expect(is.netIncome).toBe(600_00);
  });

  test('excludes entries outside the period and non-posted entries', () => {
    const is = buildIncomeStatement(ACCOUNTS, ENTRIES, { from: '2026-02-01', to: '2026-12-31' });
    expect(is.totalRevenue).toBe(0); // invoice entry was January; April draft ignored
    expect(is.totalExpense).toBe(600_00);
    expect(is.netIncome).toBe(-600_00); // deficit shown honestly
  });
});

describe('financial statements — balance sheet', () => {
  test('assets equal liabilities + equity + net income to date', () => {
    const bs = buildBalanceSheet(ACCOUNTS, ENTRIES, '2026-12-31');
    expect(bs.balanced).toBe(true);
    expect(bs.totals.assets).toBe(700_00); // cash 300 + receivable 400
    expect(bs.liabilities.total).toBe(100_00); // SSNIT payable
    expect(bs.equity.total).toBe(600_00); // current-year surplus (accumulated fund has no movement)
    expect(bs.netIncomeToDate).toBe(600_00);
    expect(bs.totals.assets).toBe(bs.totals.liabilitiesAndEquity);
  });

  test('position as of an earlier date ignores later entries', () => {
    const bs = buildBalanceSheet(ACCOUNTS, ENTRIES, '2026-02-28');
    expect(bs.totals.assets).toBe(1200_00); // cash 800 + receivable 400
    expect(bs.netIncomeToDate).toBe(1200_00); // invoiced revenue, payroll not yet posted
    expect(bs.balanced).toBe(true);
  });
});
