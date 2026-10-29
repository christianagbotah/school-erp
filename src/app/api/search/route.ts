import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

// GET /api/search?q= — global student/invoice lookup (cashier speed)
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const q = new URL(req.url).searchParams.get('q')?.trim();
    if (!q || q.length < 2) return NextResponse.json({ students: [] });
    const tenantIds = auth.memberships.map((m) => m.tenantId);

    const students = await db.student.findMany({
      where: {
        tenantId: { in: tenantIds },
        status: 'ACTIVE',
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { middleName: { contains: q } },
          { studentIdNo: { contains: q } },
        ],
      },
      include: {
        enrollments: { where: { isCurrent: true }, include: { classGroup: true } },
        guardianLinks: { include: { guardian: true } },
        invoices: { where: { status: { in: ['outstanding', 'partially_paid'] } } },
      },
      take: 20,
    });

    return NextResponse.json({
      students: students.map((s) => {
        const arrears = s.invoices.reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
        return {
          id: s.id,
          studentIdNo: s.studentIdNo,
          name: `${s.firstName} ${s.middleName ?? ''} ${s.lastName}`.replace(/\s+/g, ' ').trim(),
          class: s.enrollments[0]?.classGroup.name ?? '—',
          arrears,
          guardianPhone: s.guardianLinks[0]?.guardian.phone ?? null,
        };
      }),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
