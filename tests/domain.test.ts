// ============================================================================
// iEduPro domain tests — money math, fee engine, discount allocation, payroll
// Run: bun test tests/domain.test.ts
// ============================================================================

import { describe, test, expect } from 'bun:test';
import {
  formatMoney, parseMoneyToPesewas, allocateEvenly, allocateProportional, weightedTotal,
} from '../src/lib/money';
import { applyDiscounts, GHANA_PAYROLL_PACK_VALUE, computePaye } from '../src/lib/fee-engine-testable';

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
