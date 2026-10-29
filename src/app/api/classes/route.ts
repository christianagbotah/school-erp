import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

// GET /api/classes — classes with stage/category/campus for the current year
export async function GET() {
  try {
    const auth = await requireAuth();
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    const classes = await db.classGroup.findMany({
      where: { tenantId: { in: tenantIds } },
      include: { campus: true, category: true, academicYear: true, _count: { select: { enrollments: { where: { isCurrent: true } } } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        section: c.sectionLabel,
        stageKey: c.stageKey,
        campus: c.campus.name,
        category: c.category?.name ?? null,
        year: c.academicYear.name,
        capacity: c.capacity,
        enrolled: c._count.enrollments,
        room: c.roomName,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
