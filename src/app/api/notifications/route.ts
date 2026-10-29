import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

// GET /api/notifications — user notification feed
export async function GET() {
  try {
    const auth = await requireAuth();
    const notifications = await db.notification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    const unread = notifications.filter((n) => !n.isRead).length;
    return NextResponse.json({ notifications, unread });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PATCH — mark read
export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth();
    const { ids } = await req.json();
    if (Array.isArray(ids) && ids.length > 0) {
      await db.notification.updateMany({ where: { id: { in: ids }, userId: auth.user.id }, data: { isRead: true } });
    } else {
      await db.notification.updateMany({ where: { userId: auth.user.id }, data: { isRead: true } });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
