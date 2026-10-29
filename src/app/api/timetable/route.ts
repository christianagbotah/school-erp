import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole, audit, AuthError } from '@/lib/auth';

// GET /api/timetable?classId=&mine=1 — weekly timetable grid
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine') === '1';
    const classId = searchParams.get('classId');

    const tenantIds = auth.memberships.map((m) => m.tenantId);
    const school = await db.school.findFirst({ where: { tenantId: { in: tenantIds } } });
    if (!school) return NextResponse.json({ error: 'No school for tenant' }, { status: 404 });
    const tenantId = school.tenantId;

    const classes = await db.classGroup.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, stageKey: true, classTeacherId: true },
    });

    const subjects = await db.subject.findMany({ where: { tenantId }, orderBy: { sortOrder: 'asc' }, select: { id: true, code: true, name: true } });
    const staff = await db.staff.findMany({ where: { tenantId, status: 'active' }, orderBy: { lastName: 'asc' }, select: { id: true, firstName: true, lastName: true, position: true, isTeaching: true } });

    // my slots (teacher linked to the logged-in user)
    let mySlots: { dayOfWeek: number; period: number; startTime: string | null; endTime: string | null; room: string | null; className: string; subject: string }[] = [];
    if (mine) {
      const me = await db.staff.findFirst({ where: { tenantId, userId: auth.user.id } });
      if (me) {
        const slots = await db.timetableSlot.findMany({
          where: { tenantId, teacherId: me.id },
          include: { subject: true, classGroup: true },
          orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
        });
        mySlots = slots.map((s) => ({
          dayOfWeek: s.dayOfWeek, period: s.period, startTime: s.startTime, endTime: s.endTime, room: s.room,
          className: s.classGroup.name, subject: s.subject?.name ?? '—',
        }));
      }
    }

    // class grid
    let slots: { id: string; dayOfWeek: number; period: number; startTime: string | null; endTime: string | null; room: string | null; subjectId: string | null; subjectCode: string | null; teacherId: string | null; teacherName: string | null }[] = [];
    if (classId && classId !== 'all') {
      const cls = await db.classGroup.findUnique({ where: { id: classId } });
      if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });
      if (!tenantIds.includes(cls.tenantId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      const rows = await db.timetableSlot.findMany({
        where: { tenantId, classId },
        include: { subject: true, teacher: true },
        orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
      });
      slots = rows.map((s) => ({
        id: s.id, dayOfWeek: s.dayOfWeek, period: s.period, startTime: s.startTime, endTime: s.endTime, room: s.room,
        subjectId: s.subjectId, subjectCode: s.subject?.code ?? null,
        teacherId: s.teacherId, teacherName: s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : null,
      }));
    }

    return NextResponse.json({
      classes: classes.map((c) => ({ id: c.id, name: c.name, stageKey: c.stageKey, classTeacherId: c.classTeacherId })),
      subjects: subjects,
      staff: staff.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, position: s.position, isTeaching: s.isTeaching })),
      slots,
      mySlots,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Timetable failed' }, { status: 500 });
  }
}

// POST /api/timetable — upsert one slot { classId, dayOfWeek, period, subjectId?, teacherId?, room?, startTime?, endTime? }
// POST body { delete: true, id } removes a slot
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole('academic_head', 'headteacher', 'proprietor');
    const body = await req.json();

    if (body?.delete === true && body.id) {
      const slot = await db.timetableSlot.findUnique({ where: { id: body.id } });
      if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
      const tenantIds = auth.memberships.map((m) => m.tenantId);
      if (!tenantIds.includes(slot.tenantId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      await db.timetableSlot.delete({ where: { id: slot.id } });
      await audit({ tenantId: slot.tenantId, userId: auth.user.id, action: 'timetable.remove_slot', entityType: 'timetableSlot', entityId: slot.id, before: slot });
      return NextResponse.json({ ok: true, deleted: true });
    }

    const { classId, dayOfWeek, period, subjectId, teacherId, room, startTime, endTime } = body;
    if (!classId || !dayOfWeek || !period) return NextResponse.json({ error: 'classId, dayOfWeek, period required' }, { status: 400 });
    if (dayOfWeek < 1 || dayOfWeek > 7) return NextResponse.json({ error: 'dayOfWeek 1–7' }, { status: 400 });
    if (period < 1 || period > 12) return NextResponse.json({ error: 'period 1–12' }, { status: 400 });

    const cls = await db.classGroup.findUnique({ where: { id: classId } });
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    if (!tenantIds.includes(cls.tenantId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const existing = await db.timetableSlot.findFirst({ where: { tenantId: cls.tenantId, classId, dayOfWeek, period } });
    const data = {
      subjectId: subjectId || null,
      teacherId: teacherId || null,
      room: room || null,
      startTime: startTime || null,
      endTime: endTime || null,
    };

    let slot;
    if (existing) {
      slot = await db.timetableSlot.update({ where: { id: existing.id }, data });
      await audit({ tenantId: cls.tenantId, userId: auth.user.id, action: 'timetable.update_slot', entityType: 'timetableSlot', entityId: slot.id, before: existing, after: slot });
    } else {
      slot = await db.timetableSlot.create({ data: { tenantId: cls.tenantId, schoolId: cls.schoolId, classId, dayOfWeek, period, ...data } });
      await audit({ tenantId: cls.tenantId, userId: auth.user.id, action: 'timetable.create_slot', entityType: 'timetableSlot', entityId: slot.id, after: slot });
    }
    return NextResponse.json({ ok: true, slot: { id: slot.id, dayOfWeek: slot.dayOfWeek, period: slot.period } });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
