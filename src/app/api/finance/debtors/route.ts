import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole, AuthError } from '@/lib/auth';
import { formatMoney } from '@/lib/money';

// GET /api/finance/debtors?classId= — outstanding balances with aging + guardian contact
export async function GET(req: Request) {
  try {
    const auth = await requireRole('bursar', 'accountant', 'headteacher', 'proprietor', 'cashier');
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    const school = await db.school.findFirst({ where: { tenantId: { in: tenantIds } } });
    if (!school) return NextResponse.json({ error: 'No school for tenant' }, { status: 404 });
    const tenantId = school.tenantId;

    const { searchParams } = new URL(req.url);
    const classFilter = searchParams.get('classId');

    const invoices = await db.invoice.findMany({
      where: { tenantId, status: { in: ['outstanding', 'partially_paid'] } },
      include: {
        student: {
          include: {
            enrollments: { where: { isCurrent: true }, include: { classGroup: true } },
            guardianLinks: { include: { guardian: true }, where: { isBillingResponsible: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 600,
    });

    const today = new Date();
    const DAY = 1000 * 60 * 60 * 24;

    // roll up per student (multiple invoices per term/year possible)
    const byStudent = new Map<string, {
      studentId: string; studentIdNo: string; name: string; className: string; classId: string;
      guardianName: string | null; guardianPhone: string | null;
      billed: number; paid: number; balance: number;
      oldestDue: string | null; current: number; d1_30: number; d31_60: number; d60plus: number; invoiceCount: number;
    }>();

    for (const inv of invoices) {
      const s = inv.student;
      const cls = s.enrollments[0]?.classGroup;
      if (classFilter && classFilter !== 'all' && cls?.id !== classFilter) continue;
      const g = s.guardianLinks[0]?.guardian;
      const balance = inv.total - inv.amountPaid;
      const key = s.id;
      const cur = byStudent.get(key) ?? {
        studentId: s.id, studentIdNo: s.studentIdNo,
        name: `${s.firstName} ${s.lastName}`,
        className: cls?.name ?? '—', classId: cls?.id ?? '',
        guardianName: g ? `${g.firstName} ${g.lastName}` : null,
        guardianPhone: g?.phone ?? null,
        billed: 0, paid: 0, balance: 0, oldestDue: null, current: 0, d1_30: 0, d31_60: 0, d60plus: 0, invoiceCount: 0,
      };
      cur.billed += inv.total;
      cur.paid += inv.amountPaid;
      cur.balance += balance;
      cur.invoiceCount += 1;
      const due = inv.dueDate ?? inv.issueDate;
      const dueStr = due.toISOString().slice(0, 10);
      if (!cur.oldestDue || dueStr < cur.oldestDue) cur.oldestDue = dueStr;
      const ageDays = Math.floor((today.getTime() - due.getTime()) / DAY);
      if (ageDays <= 0) cur.current += balance;
      else if (ageDays <= 30) cur.d1_30 += balance;
      else if (ageDays <= 60) cur.d31_60 += balance;
      else cur.d60plus += balance;
      byStudent.set(key, cur);
    }

    const debtors = [...byStudent.values()]
      .sort((a, b) => b.balance - a.balance)
      .map((d) => ({
        ...d,
        balanceFormatted: formatMoney(d.balance),
        currentFormatted: formatMoney(d.current),
        d1_30Formatted: formatMoney(d.d1_30),
        d31_60Formatted: formatMoney(d.d31_60),
        d60plusFormatted: formatMoney(d.d60plus),
      }));

    const totals = {
      debtors: debtors.length,
      outstanding: debtors.reduce((s, d) => s + d.balance, 0),
      current: debtors.reduce((s, d) => s + d.current, 0),
      d1_30: debtors.reduce((s, d) => s + d.d1_30, 0),
      d31_60: debtors.reduce((s, d) => s + d.d31_60, 0),
      d60plus: debtors.reduce((s, d) => s + d.d60plus, 0),
    };

    return NextResponse.json({
      school: { name: school.name, phone: school.phone ?? null },
      debtors,
      totals,
      totalsFormatted: {
        outstanding: formatMoney(totals.outstanding),
        current: formatMoney(totals.current),
        d1_30: formatMoney(totals.d1_30),
        d31_60: formatMoney(totals.d31_60),
        d60plus: formatMoney(totals.d60plus),
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Debtors report failed' }, { status: 500 });
  }
}
