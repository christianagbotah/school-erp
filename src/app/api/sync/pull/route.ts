import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

// GET /api/sync/pull?cursor=&scope= — change feed for device pull
// Ordered by createdAt with a stable high-watermark cursor.
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor'); // ISO timestamp high-watermark
    const take = Math.min(200, Number(searchParams.get('take') ?? 100));

    if (!auth.tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

    const since = cursor ? new Date(cursor) : new Date(0);

    // change feed across key entities (bounded, scope-filtered)
    const [attendance, payments, announcements, invoices] = await Promise.all([
      db.attendanceRecord.findMany({
        where: { tenantId: auth.tenantId, updatedAt: { gt: since } },
        orderBy: { updatedAt: 'asc' },
        take,
        select: { id: true, studentId: true, date: true, sessionType: true, status: true, updatedAt: true },
      }),
      db.payment.findMany({
        where: { tenantId: auth.tenantId, updatedAt: { gt: since } },
        orderBy: { updatedAt: 'asc' },
        take,
        select: { id: true, studentId: true, paymentRef: true, amount: true, method: true, status: true, updatedAt: true },
      }),
      db.announcement.findMany({
        where: { tenantId: auth.tenantId, createdAt: { gt: since } },
        orderBy: { createdAt: 'asc' },
        take,
        select: { id: true, title: true, body: true, audience: true, createdAt: true },
      }),
      db.invoice.findMany({
        where: { tenantId: auth.tenantId, updatedAt: { gt: since } },
        orderBy: { updatedAt: 'asc' },
        take,
        select: { id: true, studentId: true, invoiceNo: true, total: true, amountPaid: true, status: true, dueDate: true, updatedAt: true },
      }),
    ]);

    const changes = [
      ...attendance.map((a) => ({ entity: 'attendance', id: a.id, at: a.updatedAt, data: a })),
      ...payments.map((p) => ({ entity: 'payment', id: p.id, at: p.updatedAt, data: p })),
      ...announcements.map((a) => ({ entity: 'announcement', id: a.id, at: a.createdAt, data: a })),
      ...invoices.map((i) => ({ entity: 'invoice', id: i.id, at: i.updatedAt, data: i })),
    ].sort((a, b) => a.at.getTime() - b.at.getTime());

    // high-watermark = last change time; client advances only after durable apply
    const nextCursor = changes.length > 0 ? changes[changes.length - 1].at.toISOString() : (cursor ?? new Date().toISOString());

    return NextResponse.json({
      changes: changes.map((c) => ({ entity: c.entity, id: c.id, at: c.at.toISOString(), data: c.data })),
      nextCursor,
      hasMore: changes.length === take,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Sync pull failed' }, { status: 500 });
  }
}
