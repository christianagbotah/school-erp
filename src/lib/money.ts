// Money utilities — all amounts are integer pesewas (GHS minor units)
export const CURRENCY = 'GHS';
export const CEDI_SYMBOL = '₵';

/** Format integer pesewas as Ghana cedi: ₵1,234.50 */
export function formatMoney(pesewas: number, opts?: { compact?: boolean }): string {
  const neg = pesewas < 0;
  const v = Math.abs(pesewas);
  const whole = Math.floor(v / 100);
  const frac = v % 100;
  const wholeStr = whole.toLocaleString('en-GH');
  const out = `${CEDI_SYMBOL}${wholeStr}.${String(frac).padStart(2, '0')}`;
  return neg ? `-${out}` : out;
}

/** Parse user input like "1234.50" into pesewas. Throws on invalid. */
export function parseMoneyToPesewas(input: string): number {
  const cleaned = input.replace(/[₵,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) throw new Error(`Invalid amount: ${input}`);
  const [w, f] = cleaned.split('.');
  const frac = (f ?? '').padEnd(2, '0').slice(0, 2);
  return Number(w) * 100 + Number(frac || '0');
}

/** Decimal-safe weighted total: returns integer pesewas using banker-free half-up rounding */
export function weightedTotal(parts: { amount: number; weight: number }[]): number {
  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  if (totalWeight === 0) return 0;
  // work in scaled integers to avoid float drift: sum(amount * weight) / totalWeight
  const numerator = parts.reduce((s, p) => s + p.amount * p.weight, 0);
  return Math.round(numerator / totalWeight);
}

/** Allocate a total across n parts with correct remainder distribution (no lost/created money) */
export function allocateEvenly(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const rem = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

/** Allocate proportionally by weights, distributing rounding remainder to largest fractions */
export function allocateProportional(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return allocateEvenly(total, weights.length);
  const raw = weights.map((w) => (total * w) / sum);
  const floors = raw.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  let k = 0;
  while (remainder > 0 && order.length > 0) {
    floors[order[k % order.length].i] += 1;
    remainder -= 1;
    k += 1;
  }
  return floors;
}

export type Money = number; // pesewas

/** Banker's-free comparison with epsilon for pesewas (integers — exact) */
export function moneyEquals(a: number, b: number): boolean {
  return a === b;
}
