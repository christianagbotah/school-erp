// Testable exports that don't require Prisma/db (pure functions re-exported)
export { applyDiscounts } from '@/lib/fee-engine';
export { GHANA_PAYROLL_PACK as GHANA_PAYROLL_PACK_VALUE, computePaye } from '@/lib/ghana-config';
