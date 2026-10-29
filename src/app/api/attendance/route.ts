import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole, audit, AuthError } from '@/lib/auth';

// POST /api/attendance — mark single student
// PATCH semantics via POST with existing record = correction with history
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole('teacher', 'academic_head', 'headteacher', 'class_teacher');
    const body = await req.json();
    const { studentId, date, sessionType = 'morning', status, note, markedVia = 'web' } = body;
    if (!studentId || !date || !status) {
      return NextResponse.json({ error: 'studentId, date and status are required' }, { status: 400 });
    }

    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // verify the user's tenant covers this student (isolation)
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    if (!tenantIds.includes(student.tenantId)) {
      return NextResponse.json({ error: 'Not authorized for this student' }, { status: 403 });
    }

    const enrollment = await db.enrollment.findFirst({ where: { studentId, isCurrent: true } });
    if (!enrollment) return NextResponse.json({ error: 'No active enrollment' }, { status: 400 });

    const dayDate = new Date(`${date}T00:00:00.000Z`);
    let calDay = await db.attendanceDay.findFirst({
      where: { tenantId: student.tenantId, date: dayDate },
    });
    if (!calDay) {
      // auto-create calendar entry as school_day (weekdays assumed)
      const year = await db.academicYear.findFirst({ where: { tenantId: student.tenantId, isCurrent: true } });
      const term = year ? await db.academicTerm.findFirst({ where: { yearId: year.id, isCurrent: true } }) : null;
      if (!year) return NextResponse.json({ error: 'No academic year' }, { status: 400 });
      calDay = await db.attendanceDay.create({
        data: { tenantId: student.tenantId, yearId: year.id, termId: term?.id ?? null, date: dayDate, dayType: 'school_day' },
      });
    }

    const existing = await db.attendanceRecord.findUnique({
      where: { tenantId_studentId_date_sessionType: { tenantId: student.tenantId, studentId, date: dayDate, sessionType } },
    });

    if (existing) {
      // correction — preserve history
      const history = existing.correctionHistory ? JSON.parse(existing.correctionHistory) : [];
      history.push({ status: existing.status, note: existing.note, at: existing.updatedAt, by: auth.user.id });
      const updated = await db.attendanceRecord.update({
        where: { id: existing.id },
        data: { status, note: note ?? null, correctionHistory: JSON.stringify(history), markedById: auth.user.id, markedVia },
      });
      await audit({ tenantId: student.tenantId, userId: auth.user.id, action: 'attendance.correct', entityType: 'attendance_record', entityId: existing.id, before: { status: existing.status }, after: { status } });
      return NextResponse.json({ record: updated, corrected: true });
    }

    const record = await db.attendanceRecord.create({
      data: {
        tenantId: student.tenantId, studentId, classId: enrollment.classId, calendarDayId: calDay.id,
        date: dayDate, sessionType, status, note: note ?? null,
        markedById: auth.user.id, markedVia,
      },
    });
    await audit({ tenantId: student.tenantId, userId: auth.user.id, action: 'attendance.mark', entityType: 'attendance_record', entityId: record.id, after: { status } });
    return NextResponse.json({ record, created: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
  }
}

// GET /api/attendance?classId=&date= — roster with today's marks
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
    if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 });

    const cls = await db.classGroup.findUnique({ where: { id: classId } });
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    if (!tenantIds.includes(cls.tenantId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const dayDate = new Date(`${date}T00:00:00.000Z`);
    const enrollments = await db.enrollment.findMany({
      where: { classId, isCurrent: true },
      include: { student: true },
      orderBy: { rollNo: 'asc' },
    });
    const records = await db.attendanceRecord.findMany({
      where: { classId, date: dayDate },
    });
    const byStudent = new Map(records.map((r) => [r.studentId, r]));

    // calendar day type for denominator honesty
    const calDay = await db.attendanceDay.findFirst({ where: { tenantId: cls.tenantId, date: dayDate } });

    return NextResponse.json({
      class: { id: cls.id, name: cls.name },
      date,
      dayType: calDay?.dayType ?? 'school_day',
      roster: enrollments.map((e) => {
        const r = byStudent.get(e.studentId);
        return {
          studentId: e.studentId,
          name: `${e.student.firstName} ${e.student.lastName}`,
          rollNo: e.rollNo,
          status: r?.status ?? null,
          recordId: r?.id ?? null,
          note: r?.note ?? null,
        };
      }),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Failed to load attendance' }, { status: 500 });
  }
}
