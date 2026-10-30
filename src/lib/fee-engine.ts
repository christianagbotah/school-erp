// ============================================================================
// iEduPro Fee Engine — policy-driven billing with applicability inheritance
// Precedence: student > class > category > campus > school
// Money = integer pesewas. Invoice-wide discounts allocate with remainder
// distribution so the sum of line discounts always equals the discount total.
// ============================================================================

import { Prisma, PrismaClient } from '@prisma/client';
import { allocateProportional } from '@/lib/money';

export type FeeScope = { schoolId: string; campusId?: string | null; categoryId?: string | null; classId?: string | null; studentId?: string | null };

export type PlanResolution = {
  planId: string;
  planName: string;
  items: {
    feePlanItemId: string;
    feeItemCode: string;
    feeItemName: string;
    amount: number;
    cadence: string;
    reason: string; // "why this student is charged this item"
    source: string; // student | class | category | campus | school
    revenueAccountCode: string; // GL revenue account for accrual posting
  }[];
};

/**
 * Resolve the applicable fee plan + items for one student.
 * A specific override replaces the intended inherited rule — it must not bill both.
 */
export async function resolveStudentPlan(
  prisma: PrismaClient,
  scope: FeeScope,
  academicYearId: string,
  termId?: string | null
): Promise<PlanResolution | null> {
  // candidate plans ordered by specificity — most specific wins per fee item
  const scopeFilters = [
    { scopeType: 'student', scopeId: scope.studentId! },
    scope.classId ? { scopeType: 'class', scopeId: scope.classId } : null,
    scope.categoryId ? { scopeType: 'category', scopeId: scope.categoryId } : null,
    scope.campusId ? { scopeType: 'campus', scopeId: scope.campusId } : null,
    { scopeType: 'school', scopeId: scope.schoolId },
  ].filter(Boolean) as { scopeType: string; scopeId: string }[];

  const plans = await prisma.feePlan.findMany({
    where: {
      schoolId: scope.schoolId,
      academicYearId,
      status: 'published',
      OR: [
        { termId: null },
        ...(termId ? [{ termId }] : []),
      ],
    },
    include: { items: { include: { feeItem: true } } },
    orderBy: { version: 'desc' },
  });

  if (plans.length === 0) return null;

  // per-fee-item precedence: first matching scope wins
  const chosen = new Map<string, PlanResolution['items'][number]>();
  let chosenPlan: (typeof plans)[number] | null = null;

  for (const sf of scopeFilters) {
    const plan = plans.find(
      (p) => p.scopeType === sf.scopeType && p.scopeId === sf.scopeId
    );
    if (!plan) continue;
    for (const item of plan.items) {
      if (!item.isActive || !item.feeItem.isActive) continue;
      if (chosen.has(item.feeItem.code)) continue; // higher-precedence already chosen
      if (chosenPlan === null) chosenPlan = plan;
      chosen.set(item.feeItem.code, {
        feePlanItemId: item.id,
        feeItemCode: item.feeItem.code,
        feeItemName: item.feeItem.name,
        amount: item.amount,
        cadence: item.cadence,
        reason: `Charged from plan "${plan.name}" (${plan.scopeType} scope)`,
        source: plan.scopeType,
        revenueAccountCode: item.feeItem.revenueAccountCode ?? '4002',
      });
    }
  }

  // Fallback: school-wide default plan items for anything not yet covered
  const schoolPlan = plans.find((p) => p.scopeType === 'school');
  if (schoolPlan) {
    for (const item of schoolPlan.items) {
      if (!item.isActive || !item.feeItem.isActive) continue;
      if (chosen.has(item.feeItem.code)) continue;
      if (chosenPlan === null) chosenPlan = schoolPlan;
      chosen.set(item.feeItem.code, {
        feePlanItemId: item.id,
        feeItemCode: item.feeItem.code,
        feeItemName: item.feeItem.name,
        amount: item.amount,
        cadence: item.cadence,
        reason: `Inherited from school plan "${schoolPlan.name}"`,
        source: 'school',
        revenueAccountCode: item.feeItem.revenueAccountCode ?? '4002',
      });
    }
  }

  if (!chosenPlan || chosen.size === 0) return null;
  return {
    planId: chosenPlan.id,
    planName: chosenPlan.name,
    items: [...chosen.values()],
  };
}

/**
 * Apply discounts to invoice items.
 * Order: fee_item scope → selected_items → invoice scope → student_policy.
 * Percentage discounts round per-line with remainder allocation to keep totals exact.
 */
export type DiscountApplication = {
  policyId: string;
  label: string;
  amount: number; // total pesewas granted by this policy
  lineAmounts: Record<string, number>; // feePlanItemId → granted pesewas
  reason?: string;
};

export function applyDiscounts(
  lines: { feePlanItemId: string; amount: number }[],
  policies: {
    id: string;
    label: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    scope: string;
    feeItemIds?: string[];
    priority: number;
  }[]
): DiscountApplication[] {
  const sorted = [...policies].sort((a, b) => a.priority - b.priority || a.scope.localeCompare(b.scope));
  const applications: DiscountApplication[] = [];
  const remaining = new Map(lines.map((l) => [l.feePlanItemId, l.amount]));

  for (const pol of sorted) {
    let targetLines: string[];
    if (pol.scope === 'fee_item') {
      targetLines = lines.filter((l) => pol.feeItemIds?.includes(l.feePlanItemId)).map((l) => l.feePlanItemId);
    } else if (pol.scope === 'selected_items') {
      targetLines = lines.filter((l) => pol.feeItemIds?.includes(l.feePlanItemId)).map((l) => l.feePlanItemId);
    } else {
      targetLines = lines.map((l) => l.feePlanItemId); // invoice / student_policy
    }
    if (targetLines.length === 0) continue;

    const targets = targetLines
      .map((id) => ({ id, amount: remaining.get(id) ?? 0 }))
      .filter((t) => t.amount > 0);
    if (targets.length === 0) continue;

    const weights = targets.map((t) => t.amount);
    let total = 0;
    if (pol.type === 'percentage') {
      total = Math.round(targets.reduce((s, t) => s + Math.round((t.amount * pol.value) / 100), 0));
    } else {
      total = Math.min(pol.value, targets.reduce((s, t) => s + t.amount, 0));
    }

    const alloc = allocateProportional(total, weights);
    const lineAmounts: Record<string, number> = {};
    targets.forEach((t, i) => {
      const granted = Math.min(alloc[i], t.amount);
      lineAmounts[t.id] = granted;
      remaining.set(t.id, t.amount - granted);
    });
    const grantedTotal = Object.values(lineAmounts).reduce((a, b) => a + b, 0);
    if (grantedTotal > 0) {
      applications.push({ policyId: pol.id, label: pol.label, amount: grantedTotal, lineAmounts });
    }
  }
  return applications;
}

/**
 * Generate invoices in bulk with duplicate prevention.
 * Returns per-student results; never throws on a single student failure.
 */
export async function generateInvoices(
  prisma: PrismaClient,
  params: {
    tenantId: string;
    schoolId: string;
    academicYearId: string;
    termId?: string | null;
    planId: string;
    dueDate: Date;
    issueDate?: Date;
    studentIds?: string[]; // empty = all active students
    createdById?: string;
    dryRun?: boolean;
  }
): Promise<{ generated: number; skipped: { studentId: string; reason: string }[]; preview?: unknown[] }> {
  const { tenantId, schoolId, academicYearId, termId, planId, dueDate } = params;
  const issueDate = params.issueDate ?? new Date();

  const plan = await prisma.feePlan.findFirst({
    where: { id: planId, schoolId, tenantId },
    include: { items: { include: { feeItem: true } } },
  });
  if (!plan) throw new Error('Fee plan not found');

  const students = params.studentIds?.length
    ? await prisma.student.findMany({ where: { id: { in: params.studentIds }, schoolId, tenantId, status: 'ACTIVE' } })
    : await prisma.student.findMany({ where: { schoolId, tenantId, status: 'ACTIVE' } });

  const results: { generated: number; skipped: { studentId: string; reason: string }[] } = { generated: 0, skipped: [] };
  const previews: unknown[] = [];

  for (const student of students) {
    // current enrollment determines class/scope
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, isCurrent: true },
      include: { classGroup: true },
    });
    if (!enrollment) {
      results.skipped.push({ studentId: student.id, reason: 'No active enrollment' });
      continue;
    }
    const resolution = await resolveStudentPlan(prisma, {
      schoolId,
      campusId: enrollment.classGroup.campusId,
      categoryId: enrollment.classGroup.categoryId,
      classId: enrollment.classGroup.id,
      studentId: student.id,
    }, academicYearId, termId);
    if (!resolution || resolution.items.length === 0) {
      results.skipped.push({ studentId: student.id, reason: 'No applicable fee plan' });
      continue;
    }

    // duplicate prevention: one invoice per student/plan
    const existing = await prisma.invoice.findFirst({
      where: { studentId: student.id, planId, status: { notIn: ['void'] } },
    });
    if (existing) {
      results.skipped.push({ studentId: student.id, reason: `Already invoiced (${existing.invoiceNo})` });
      continue;
    }

    const subtotal = resolution.items.reduce((s, i) => s + i.amount, 0);

    if (params.dryRun) {
      previews.push({
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        class: enrollment.classGroup.name,
        items: resolution.items.map((i) => ({ code: i.feeItemCode, name: i.feeItemName, amount: i.amount, cadence: i.cadence, why: i.reason })),
        subtotal,
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const seq = await nextInvoiceSeq(tx, schoolId);
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          schoolId,
          studentId: student.id,
          planId,
          invoiceNo: `INV-${year2(issueDate)}-${String(seq).padStart(5, '0')}`,
          academicYearId,
          termId: termId ?? null,
          issueDate,
          dueDate,
          subtotal,
          total: subtotal,
          status: 'outstanding',
          createdById: params.createdById ?? null,
        },
      });
      await tx.invoiceLine.createMany({
        data: resolution!.items.map((i) => ({
          tenantId,
          invoiceId: invoice.id,
          feeItemId: i.feePlanItemId,
          description: i.feeItemName,
          quantity: 1,
          unitAmount: i.amount,
          lineTotal: i.amount,
          cadence: i.cadence,
        })),
      });

      // Accrual journal, atomic with the invoice: Dr Accounts Receivable /
      // Cr revenue accounts (TUITION → 4001, feeding → 4010, other → 4002).
      const revenueByAccount = new Map<string, number>();
      for (const i of resolution!.items) {
        revenueByAccount.set(i.revenueAccountCode, (revenueByAccount.get(i.revenueAccountCode) ?? 0) + i.amount);
      }
      await postJournalOn(tx, {
        tenantId,
        schoolId,
        date: issueDate,
        memo: `Invoice ${invoice.invoiceNo} — ${student.firstName} ${student.lastName} (${resolution!.planName})`,
        sourceModule: 'fees',
        sourceRef: `invoice:${invoice.id}`,
        postedById: params.createdById ?? null,
        lines: [
          { accountCode: '1100', debit: subtotal, entityType: 'invoice', entityId: invoice.id },
          ...[...revenueByAccount.entries()].map(([code, amount]) => ({
            accountCode: code, credit: amount, entityType: 'invoice', entityId: invoice.id,
          })),
        ],
      });

      return invoice;
    });
    results.generated += 1;
  }

  return params.dryRun ? { generated: 0, skipped: results.skipped, preview: previews } : results;
}

function year2(d: Date): string {
  return String(d.getFullYear()).slice(2);
}

async function nextInvoiceSeq(tx: Prisma.TransactionClient, schoolId: string): Promise<number> {
  const count = await tx.invoice.count({ where: { schoolId } });
  return count + 1;
}

/**
 * Post payment allocations atomically with overpayment protection.
 * Cumulative allocations can never exceed the invoice total.
 */
export async function allocatePayment(
  prisma: PrismaClient,
  params: { paymentId: string; allocations: { invoiceId: string; amount: number }[] }
) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: params.paymentId } });
    const alreadyAllocated = await tx.paymentAllocation.aggregate({
      where: { paymentId: payment.id },
      _sum: { amount: true },
    });
    const allocated = alreadyAllocated._sum.amount ?? 0;
    const requested = params.allocations.reduce((s, a) => s + a.amount, 0);
    if (allocated + requested > payment.amount) {
      throw new Error('Allocation exceeds payment amount');
    }
    for (const alloc of params.allocations) {
      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: alloc.invoiceId } });
      const invAllocated = await tx.paymentAllocation.aggregate({
        where: { invoiceId: invoice.id },
        _sum: { amount: true },
      });
      const invPaid = (invAllocated._sum.amount ?? 0) + alloc.amount;
      if (invPaid > invoice.total) {
        throw new Error(`Allocation exceeds invoice ${invoice.invoiceNo} total`);
      }
      await tx.paymentAllocation.create({
        data: { tenantId: payment.tenantId, paymentId: payment.id, invoiceId: invoice.id, amount: alloc.amount },
      });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: invPaid,
          status: invPaid >= invoice.total ? 'paid' : invPaid > 0 ? 'partially_paid' : 'outstanding',
        },
      });
    }
    return { ok: true };
  });
}

/**
 * Double-entry journal posting — rejects unbalanced entries.
 * Dr/Cr per line; total debit must equal total credit.
 */
type JournalParams = {
  tenantId: string;
  schoolId: string;
  date: Date;
  memo: string;
  sourceModule?: string;
  sourceRef?: string;
  lines: { accountCode: string; debit?: number; credit?: number; memo?: string; entityType?: string; entityId?: string }[];
  postedById?: string;
};
type ExecutableClient = PrismaClient | Prisma.TransactionClient;

/**
 * Post a journal within the caller's transaction. Validates balance and
 * account codes, then writes the entry header + lines. Use this variant when
 * the journal must be atomic with other writes (e.g. invoice creation).
 */
export async function postJournalOn(tx: Prisma.TransactionClient, params: JournalParams): Promise<string> {
  const totalDebit = params.lines.reduce((s, l) => s + (l.debit ?? 0), 0);
  const totalCredit = params.lines.reduce((s, l) => s + (l.credit ?? 0), 0);
  if (totalDebit !== totalCredit) {
    throw new Error(`Unbalanced journal: Dr ${totalDebit} ≠ Cr ${totalCredit}`);
  }
  const accounts = await tx.glAccount.findMany({ where: { tenantId: params.tenantId, schoolId: params.schoolId } });
  const byCode = new Map(accounts.map((a) => [a.code, a]));
  for (const line of params.lines) {
    if (!byCode.has(line.accountCode)) throw new Error(`Unknown GL account ${line.accountCode}`);
  }
  const seq = (await tx.journalEntry.count({ where: { schoolId: params.schoolId } })) + 1;
  const entry = await tx.journalEntry.create({
    data: {
      tenantId: params.tenantId,
      schoolId: params.schoolId,
      entryNo: `JE-${year2(params.date)}-${String(seq).padStart(5, '0')}`,
      date: params.date,
      memo: params.memo,
      sourceModule: params.sourceModule,
      sourceRef: params.sourceRef,
      postedById: params.postedById ?? null,
    },
  });
  await tx.journalLine.createMany({
    data: params.lines.map((l) => ({
      tenantId: params.tenantId,
      entryId: entry.id,
      accountCode: l.accountCode,
      accountId: byCode.get(l.accountCode)!.id,
      debit: l.debit ?? 0,
      credit: l.credit ?? 0,
      memo: l.memo ?? null,
      entityType: l.entityType ?? null,
      entityId: l.entityId ?? null,
    })),
  });
  return entry.id;
}

/** Post a balanced journal in its own transaction. */
export async function postJournal(
  prisma: ExecutableClient,
  params: JournalParams
): Promise<string> {
  return prisma.$transaction((tx) => postJournalOn(tx, params));
}
