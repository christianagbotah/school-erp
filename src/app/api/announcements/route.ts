import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole, audit, AuthError } from '@/lib/auth';

// GET /api/announcements — notice board for the tenant
export async function GET() {
  try {
    const auth = await requireAuth();
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    const school = await db.school.findFirst({ where: { tenantId: { in: tenantIds } } });
    if (!school) return NextResponse.json({ error: 'No school for tenant' }, { status: 404 });
    const tenantId = school.tenantId;

    const announcements = await db.announcement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    // resolve author names (sentById is a plain FK, no relation defined)
    const authorIds = [...new Set(announcements.map((a) => a.sentById).filter((x): x is string => !!x))];
    const authors = authorIds.length > 0
      ? await db.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, fullName: true } })
      : [];
    const authorName = new Map(authors.map((a) => [a.id, a.fullName]));

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a.id, title: a.title, body: a.body, audience: a.audience, channel: a.channel,
        deliveryStatus: a.deliveryStatus, createdAt: a.createdAt.toISOString(),
        author: a.sentById ? authorName.get(a.sentById) ?? null : null,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Announcements failed' }, { status: 500 });
  }
}

// POST /api/announcements — publish a notice { title, body, audience }
// Fans out in-app Notifications to the targeted audience users.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole('headteacher', 'proprietor', 'academic_head');
    const { title, body, audience } = await req.json() as { title?: string; body?: string; audience?: string };
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'title and body required' }, { status: 400 });
    }
    const aud = ['all', 'staff', 'parents', 'teachers', 'students'].includes(audience ?? '') ? audience! : 'all';

    const tenantIds = auth.memberships.map((m) => m.tenantId);
    const school = await db.school.findFirst({ where: { tenantId: { in: tenantIds } } });
    if (!school) return NextResponse.json({ error: 'No school for tenant' }, { status: 404 });
    const tenantId = school.tenantId;

    const announcement = await db.announcement.create({
      data: {
        tenantId, schoolId: school.id,
        title: title.trim(), body: body.trim(), audience: aud,
        channel: 'in_app', deliveryStatus: 'sent', sentById: auth.user.id,
        scheduledAt: new Date(),
      },
    });

    // fan-out: resolve recipient portal users by audience
    const memberships = await db.membership.findMany({
      where: { tenantId, status: 'active' },
      select: { userId: true, roleKey: true },
    });
    const unique = new Map<string, string>(); // userId -> roleKey (first)
    for (const m of memberships) if (!unique.has(m.userId)) unique.set(m.userId, m.roleKey);

    const roleTargets: Record<string, string[]> = {
      all: ['headteacher', 'academic_head', 'teacher', 'class_teacher', 'bursar', 'accountant', 'cashier', 'parent', 'student', 'proprietor'],
      staff: ['headteacher', 'academic_head', 'bursar', 'accountant', 'cashier', 'proprietor', 'teacher', 'class_teacher'],
      teachers: ['teacher', 'class_teacher', 'academic_head'],
      parents: ['parent'],
      students: ['student'],
    };
    const targets = [...unique.entries()].filter(([, role]) => (roleTargets[aud] ?? []).includes(role));

    if (targets.length > 0) {
      await db.notification.createMany({
        data: targets.map(([userId]) => ({
          userId, title: title.trim(), body: body.trim(), type: 'info',
        })),
      });
    }

    await audit({ tenantId, userId: auth.user.id, action: 'announcement.publish', entityType: 'announcement', entityId: announcement.id, after: { title, audience: aud, notified: targets.length } });
    return NextResponse.json({ ok: true, id: announcement.id, notified: targets.length });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
