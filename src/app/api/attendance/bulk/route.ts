import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, audit, AuthError } from '@/lib/auth';

// POST /api/attendance/bulk — mark a whole class in one request
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole('teacher', 'academic_head', 'headteacher', 'class_teacher');
    const { classId, date, sessionType = 'morning', marks } = await req.json();
    if (!classId || !date || !Array.isArray(marks)) {
      return NextResponse.json({ error: 'classId, date and marks[] required' }, { status: 400 });
    }

    const cls = await db.classGroup.findUnique({ where: { id: classId } });
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    if (!tenantIds.includes(cls.tenantId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const dayDate = new Date(`${date}T00:00:00.000Z`);
    let calDay = await db.attendanceDay.findFirst({ where: { tenantId: cls.tenantId, date: dayDate } });
    if (!calDay) {
      const year = await db.academicYear.findFirst({ where: { tenantId: cls.tenantId, isCurrent: true } });
      const term = year ? await db.academicTerm.findFirst({ where: { yearId: year.id, isCurrent: true } }) : null;
      calDay = await db.attendanceDay.create({
        data: { tenantId: cls.tenantId, yearId: year!.id, termId: term?.id ?? null, date: dayDate, dayType: 'school_day' },
      });
    }

    let created = 0, updated = 0;
    for (const m of marks) {
      const { studentId, status, note } = m;
      if (!studentId || !status) continue;
      const enrollment = await db.enrollment.findFirst({ where: { studentId, classId, isCurrent: true } });
      if (!enrollment) continue;
      const existing = await db.attendanceRecord.findUnique({
        where: { tenantId_studentId_date_sessionType: { tenantId: cls.tenantId, studentId, date: dayDate, sessionType } },
      });
      if (existing) {
        if (existing.status !== status) {
          const history = existing.correctionHistory ? JSON.parse(existing.correctionHistory) : [];
          history.push({ status: existing.status, note: existing.note, at: existing.updatedAt, by: auth.user.id });
          await db.attendanceRecord.update({
            where: { id: existing.id },
            data: { status, note: note ?? null, correctionHistory: JSON.stringify(history), markedById: auth.user.id },
          });
          updated += 1;
        }
      } else {
        await db.attendanceRecord.create({
          data: {
            tenantId: cls.tenantId, studentId, classId, calendarDayId: calDay.id,
            date: dayDate, sessionType, status, note: note ?? null, markedById: auth.user.id,
          },
        });
        created += 1;
      }
    }
    await audit({ tenantId: cls.tenantId, userId: auth.user.id, action: 'attendance.bulk_mark', entityType: 'class_group', entityId: classId, after: { date, sessionType, count: marks.length } });
    return NextResponse.json({ created, updated });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Bulk mark failed' }, { status: 500 });
  }
}
