import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { formatMoney } from '@/lib/money';

// GET /api/fees/invoices?studentId=&status=&page=
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 30));

    const tenantIds = auth.memberships.map((m) => m.tenantId);

    // Parents: scope to linked wards only
    const isParent = auth.memberships.some((m) => m.roleKey === 'parent');
    const isStudent = auth.memberships.some((m) => m.roleKey === 'student');

    let scopeStudentIds: string[] | null = null;
    if (isParent) {
      const user = auth.user;
      const guardians = await db.guardian.findMany({ where: { userId: user.id }, include: { students: true } });
      scopeStudentIds = guardians.flatMap((g) => g.students.map((s) => s.studentId));
      if (scopeStudentIds.length === 0) return NextResponse.json({ invoices: [], total: 0 });
    } else if (isStudent && !auth.memberships.some((m) => ['headteacher', 'accountant', 'cashier', 'proprietor', 'academic_head', 'bursar'].includes(m.roleKey))) {
      const studentMembership = auth.memberships.find((m) => m.roleKey === 'student' && m.scopeType === 'student');
      scopeStudentIds = studentMembership ? [studentMembership.scopeId!] : [];
      if (scopeStudentIds.length === 0) return NextResponse.json({ invoices: [], total: 0 });
    }

    const where = {
      tenantId: { in: tenantIds },
      ...(studentId ? { studentId } : {}),
      ...(status ? { status } : {}),
      ...(scopeStudentIds ? { studentId: { in: scopeStudentIds } } : {}),
    };

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentIdNo: true } },
          lines: true,
          discounts: true,
        },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        student: { id: inv.student.id, name: `${inv.student.firstName} ${inv.student.lastName}`, studentIdNo: inv.student.studentIdNo },
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        subtotal: inv.subtotal,
        discountTotal: inv.discountTotal,
        total: inv.total,
        amountPaid: inv.amountPaid,
        balance: inv.total - inv.amountPaid,
        status: inv.status,
        totalFormatted: formatMoney(inv.total),
        balanceFormatted: formatMoney(inv.total - inv.amountPaid),
        lines: inv.lines.map((l) => ({ id: l.id, description: l.description, amount: l.lineTotal, cadence: l.cadence })),
        discounts: inv.discounts.map((d) => ({ id: d.id, label: d.label, amount: d.amount })),
      })),
      total, page, pageSize,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Failed to list invoices' }, { status: 500 });
  }
}
