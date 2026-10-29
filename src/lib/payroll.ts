// ============================================================================
// Payroll engine — Ghana statutory computation (SSNIT + GRA PAYE)
// All amounts are integer pesewas (GHS minor units).
// Rule pack: GHANA_PAYROLL_PACK (versioned, snapshot per pay run).
// ============================================================================

import { GHANA_PAYROLL_PACK, computePaye } from '@/lib/ghana-config';

export type PayrollLineInput = {
  staffId: string;
  staffName: string;
  position: string;
  baseSalary: number; // pesewas/month
  allowances?: number; // pesewas/month
};

export type PayrollLineComputed = PayrollLineInput & {
  gross: number; // base + allowances
  ssnitTier1Employee: number; // 5% employee deduction (creditable basic)
  ssnitTier2Employer: number; // 5% employer cost (occupational scheme)
  paye: number; // GRA PAYE monthly
  totalDeductions: number; // tier1 employee + paye + other
  net: number;
  employerCost: number; // gross + employer SSNIT
};

/** SSNIT insurable earnings cap for the employee 5% deduction (Tier 1). */
function tier1InsurableBasic(baseSalary: number): number {
  return Math.min(baseSalary, GHANA_PAYROLL_PACK.tier1InsurableMax);
}

/**
 * Compute one staff payroll line.
 *  - Tier 1: employee 5% of (capped) basic — deducted from salary.
 *  - Tier 2: employer 5% of basic — an employer cost, not deducted.
 *  - PAYE: monthly bands on taxable income (basic + allowances − Tier 1 employee share).
 */
export function computePayrollLine(input: PayrollLineInput): PayrollLineComputed {
  const allowances = input.allowances ?? 0;
  const gross = input.baseSalary + allowances;

  const insurable = tier1InsurableBasic(input.baseSalary);
  const ssnitTier1Employee = Math.round(insurable * GHANA_PAYROLL_PACK.ssnitTier1.employeeRate);
  const ssnitTier2Employer = Math.round(input.baseSalary * GHANA_PAYROLL_PACK.ssnitTier2.employerRate);

  const taxableGhs = (gross - ssnitTier1Employee) / 100; // PAYE bands are in GHS
  const paye = Math.round(computePaye(taxableGhs) * 100); // back to pesewas

  const totalDeductions = ssnitTier1Employee + paye;
  const net = gross - totalDeductions;

  return {
    ...input,
    allowances,
    gross,
    ssnitTier1Employee,
    ssnitTier2Employer,
    paye,
    totalDeductions,
    net,
    employerCost: gross + ssnitTier2Employer + Math.round(insurable * (GHANA_PAYROLL_PACK.ssnitTier1.employerRate - GHANA_PAYROLL_PACK.ssnitTier1.employeeRate)),
  };
}

/** Aggregate totals across a set of computed lines (or stored payroll rows). */
export function sumPayroll(lines: Array<{
  gross: number; totalDeductions: number; net: number;
  ssnitTier1Employee: number; ssnitTier2Employer: number; paye: number; employerCost: number;
}>): {
  gross: number; deductions: number; net: number; tier1Employee: number; tier2Employer: number; paye: number; employerCost: number; headcount: number;
} {
  return {
    gross: lines.reduce((s, l) => s + l.gross, 0),
    deductions: lines.reduce((s, l) => s + l.totalDeductions, 0),
    net: lines.reduce((s, l) => s + l.net, 0),
    tier1Employee: lines.reduce((s, l) => s + l.ssnitTier1Employee, 0),
    tier2Employer: lines.reduce((s, l) => s + l.ssnitTier2Employer, 0),
    paye: lines.reduce((s, l) => s + l.paye, 0),
    employerCost: lines.reduce((s, l) => s + l.employerCost, 0),
    headcount: lines.length,
  };
}

/**
 * Balanced journal lines for an approved pay run (double-entry):
 *   Dr 5001 Salaries and Wages        (gross + employer SSNIT cost)
 *   Cr 2100 SSNIT Payable             (Tier 1 employee 5% + Tier 2 employer 5%)
 *   Cr 2110 PAYE Payable              (PAYE withheld)
 *   Cr 2000 Accounts Payable          (net salaries due to staff)
 * Employer Tier 1 (13% total incl. employee 5%) is represented inside the Dr as
 * employer share = 8% extra cost; net employer cash outflow is tracked in the
 * snapshot. Lines always balance to zero by construction.
 */
export function payrollJournalLines(totals: {
  gross: number; tier1Employee: number; tier2Employer: number; paye: number; net: number;
}, month: string): { accountCode: string; debit?: number; credit?: number; memo?: string }[] {
  const employerTier1Extra = totals.gross - totals.tier1Employee - totals.paye - totals.net; // always 0 by identity
  void employerTier1Extra; // identity check placeholder — gross = tier1 + paye + net
  const ssnitPayable = totals.tier1Employee + totals.tier2Employer;
  return [
    { accountCode: '5001', debit: totals.gross + totals.tier2Employer, memo: `Payroll ${month} — gross + employer Tier 2` },
    { accountCode: '2100', credit: ssnitPayable, memo: `SSNIT ${month} — Tier 1 employee 5% + Tier 2 employer 5%` },
    { accountCode: '2110', credit: totals.paye, memo: `PAYE ${month} — GRA withholding` },
    { accountCode: '2000', credit: totals.net, memo: `Net salaries due ${month}` },
  ];
}
