import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

// GET /api/students?classId=&q=&status=
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const q = searchParams.get('q');
    const status = searchParams.get('status') ?? 'ACTIVE';
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 50));

    // tenant isolation: only students in tenants where user has membership
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    if (tenantIds.length === 0) return NextResponse.json({ students: [], total: 0 });

    const where = {
      tenantId: { in: tenantIds },
      ...(status !== 'ALL' ? { status: status as never } : {}),
      ...(classId ? {} : {}),
    };

    const students = await db.student.findMany({
      where,
      include: {
        enrollments: { where: { isCurrent: true }, include: { classGroup: { include: { campus: true } } } },
        guardianLinks: { include: { guardian: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // class filter needs post-join (SQLite prisma lacks filtered relation filters here)
    const filtered = classId ? students.filter((s) => s.enrollments.some((e) => e.classId === classId)) : students;
    const searched = q
      ? filtered.filter((s) =>
          `${s.firstName} ${s.middleName ?? ''} ${s.lastName} ${s.studentIdNo}`.toLowerCase().includes(q.toLowerCase()))
      : filtered;

    return NextResponse.json({
      students: searched.map((s) => ({
        id: s.id,
        studentIdNo: s.studentIdNo,
        name: `${s.firstName} ${s.middleName ?? ''} ${s.lastName}`.replace(/\s+/g, ' ').trim(),
        firstName: s.firstName, middleName: s.middleName, lastName: s.lastName,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
        status: s.status,
        class: s.enrollments[0]?.classGroup ? { id: s.enrollments[0].classGroup.id, name: s.enrollments[0].classGroup.name, campus: s.enrollments[0].classGroup.campus.name } : null,
        guardians: s.guardianLinks.map((gl) => ({
          id: gl.guardian.id,
          name: `${gl.guardian.firstName} ${gl.guardian.lastName}`,
          phone: gl.guardian.phone,
          relationship: gl.relationship,
          isBillingResponsible: gl.isBillingResponsible,
          hasPickupAuthority: gl.hasPickupAuthority,
        })),
      })),
      total: searched.length,
      page, pageSize,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Failed to list students' }, { status: 500 });
  }
}
