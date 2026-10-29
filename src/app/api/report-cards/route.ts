import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { formatMoney } from '@/lib/money';

type Descriptor = { band: string; range: [number, number] };

function bandFor(score: number | null, descriptors: Descriptor[] | null): string | null {
  if (score == null || !descriptors) return null;
  for (const d of descriptors) {
    if (score >= d.range[0] && score <= d.range[1]) return d.band;
  }
  return null;
}

// GET /api/report-cards?classId=&studentId=&termId=
// Staff roles: any student in tenant. Parent/student: own wards only.
export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const termId = searchParams.get('termId');
    if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 });

    const cls = await db.classGroup.findUnique({
      where: { id: classId },
      include: { campus: { select: { name: true } } },
    });
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    // class teacher is a plain FK (classTeacherId) — resolve via Staff
    const classTeacher = cls.classTeacherId
      ? await db.staff.findUnique({ where: { id: cls.classTeacherId }, select: { firstName: true, lastName: true } })
      : null;

    const tenantIds = auth.memberships.map((m) => m.tenantId);
    if (!tenantIds.includes(cls.tenantId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    const tenantId = cls.tenantId;
    const roles = auth.memberships.map((m) => m.roleKey);
    const isStaffRole = roles.some((r) => ['teacher', 'class_teacher', 'academic_head', 'headteacher', 'proprietor', 'accountant', 'bursar'].includes(r));

    // roster for the class (current enrollment)
    const enrollments = await db.enrollment.findMany({
      where: { classId, isCurrent: true },
      include: { student: true },
      orderBy: { rollNo: 'asc' },
    });

    // parent/student scoping: only their wards
    let allowedStudentIds: string[] | null = null;
    let suggestedClassId: string | null = null;
    if (!isStaffRole) {
      const links = await db.guardianStudent.findMany({
        where: { student: { tenantId } },
        include: { guardian: true },
      });
      const myGuardianIds = links
        .filter((l) => l.guardian.userId === auth.user.id)
        .map((l) => l.studentId);
      allowedStudentIds = myGuardianIds.length > 0 ? myGuardianIds : ['__none__'];
      // suggest the ward's own class so the selector opens on the right one
      const wardEnrollment = await db.enrollment.findFirst({
        where: { studentId: { in: myGuardianIds }, isCurrent: true, classId },
      });
      if (!wardEnrollment) {
        const anyWard = await db.enrollment.findFirst({
          where: { studentId: { in: myGuardianIds }, isCurrent: true },
        });
        suggestedClassId = anyWard?.classId ?? null;
      }
    }

    const term = termId
      ? await db.academicTerm.findUnique({ where: { id: termId }, include: { year: true } })
      : await db.academicTerm.findFirst({ where: { year: { tenantId, isCurrent: true }, isCurrent: true }, include: { year: true } });
    if (!term) return NextResponse.json({ error: 'No academic term found' }, { status: 404 });

    // assessment profile for the stage
    const stageFamily = ['lower_primary', 'upper_primary'].includes(cls.stageKey)
      ? ['lower_primary', 'upper_primary']
      : [cls.stageKey];
    const profile = await db.assessmentProfile.findFirst({
      where: { tenantId, OR: [{ stageKey: { in: stageFamily } }, { stageKey: null }] },
      orderBy: [{ provenance: 'asc' }, { createdAt: 'asc' }],
    });
    const components: { code: string; name: string; weight: number; maxScore: number }[] = profile ? JSON.parse(profile.components) : [];
    const descriptors: Descriptor[] | null = profile?.descriptors ? JSON.parse(profile.descriptors) : null;

    // gradebook entries for the whole class (for positions)
    const entries = await db.gradebookEntry.findMany({
      where: { classId, termId: term.id },
      include: { subjectClass: { include: { subject: true } } },
    });

    // attendance for the term
    const attRecords = await db.attendanceRecord.findMany({
      where: { tenantId, classId, date: { gte: term.startDate, lte: term.endDate ?? new Date() } },
      select: { studentId: true, status: true },
    });
    const attByStudent = new Map<string, { present: number; absent: number; late: number; excused: number }>();
    for (const r of attRecords) {
      const cur = attByStudent.get(r.studentId) ?? { present: 0, absent: 0, late: 0, excused: 0 };
      if (r.status === 'present') cur.present += 1;
      else if (r.status === 'late') cur.late += 1;
      else if (r.status === 'excused') cur.excused += 1;
      else cur.absent += 1;
      attByStudent.set(r.studentId, cur);
    }

    // fees for term
    const invoices = await db.invoice.findMany({
      where: { tenantId, termId: term.id },
      select: { studentId: true, total: true, amountPaid: true, status: true },
    });
    const feesByStudent = new Map<string, { billed: number; paid: number }>();
    for (const inv of invoices) {
      const cur = feesByStudent.get(inv.studentId) ?? { billed: 0, paid: 0 };
      cur.billed += inv.total;
      cur.paid += inv.amountPaid;
      feesByStudent.set(inv.studentId, cur);
    }

    // per-student subject rows with weighted totals
    type SubjectRow = {
      subjectId: string; code: string; name: string;
      components: { code: string; name: string; score: number | null; max: number; status: string; weight: number }[];
      total: number | null; grade: string | null;
    };
    const subjectClasses = await db.subjectClass.findMany({ where: { classId }, include: { subject: true } });

    function subjectRowsFor(studentId: string): SubjectRow[] {
      return subjectClasses.map((sc) => {
        const mine = entries.filter((e) => e.studentId === studentId && e.subjectClassId === sc.id);
        const comps = components.map((c) => {
          const e = mine.find((m) => m.component === c.code);
          return { code: c.code, name: c.name, score: e?.rawScore ?? null, max: e?.maxScore ?? c.maxScore, status: e?.status ?? 'missing', weight: c.weight };
        });
        const marked = comps.filter((c) => c.score != null && c.status === 'marked');
        let total: number | null = null;
        if (marked.length > 0) {
          const weightSum = comps.reduce((s, c) => s + c.weight, 0);
          // weighted percentage of marked components over full weight (missing = 0)
          total = Math.round(comps.reduce((s, c) => s + ((c.score ?? 0) / (c.max || 100)) * 100 * c.weight, 0) / weightSum);
        }
        return {
          subjectId: sc.subjectId, code: sc.subject.code, name: sc.subject.name,
          components: comps, total, grade: bandFor(total, descriptors),
        };
      });
    }

    function averageFor(studentId: string): number | null {
      const rows = subjectRowsFor(studentId);
      const scored = rows.filter((r) => r.total != null);
      if (scored.length === 0) return null;
      return Math.round(scored.reduce((s, r) => s + (r.total ?? 0), 0) / scored.length);
    }

    // positions across the class
    const classAverages = enrollments
      .map((e) => ({ studentId: e.studentId, avg: averageFor(e.studentId) }))
      .filter((x): x is { studentId: string; avg: number } => x.avg != null)
      .sort((a, b) => b.avg - a.avg);
    const positionOf = (studentId: string): number | null => {
      const idx = classAverages.findIndex((x) => x.studentId === studentId);
      return idx >= 0 ? idx + 1 : null;
    };

    const school = await db.school.findUnique({ where: { id: cls.schoolId }, select: { name: true, motto: true } });

    // roster summary (id, name, has scores) — used by selector
    const roster = enrollments
      .filter((e) => (allowedStudentIds ? allowedStudentIds.includes(e.studentId) : true))
      .map((e) => ({
        id: e.studentId,
        name: `${e.student.firstName} ${e.student.lastName}`,
        rollNo: e.rollNo,
        gender: e.student.gender,
      }));

    // if a specific student is requested, produce the full report card
    if (studentId) {
      if (allowedStudentIds && !allowedStudentIds.includes(studentId)) {
        return NextResponse.json({ error: 'Not authorized for this student' }, { status: 403 });
      }
      const enrollment = enrollments.find((e) => e.studentId === studentId);
      if (!enrollment) return NextResponse.json({ error: 'Student not in this class' }, { status: 404 });
      const s = enrollment.student;

      const subjects = subjectRowsFor(studentId);
      const scored = subjects.filter((r) => r.total != null);
      const average = scored.length > 0 ? Math.round(scored.reduce((sum, r) => sum + (r.total ?? 0), 0) / scored.length) : null;
      const attendance = attByStudent.get(studentId) ?? { present: 0, absent: 0, late: 0, excused: 0 };
      const fees = feesByStudent.get(studentId) ?? { billed: 0, paid: 0 };

      // KG observations
      let observations: { domain: string; indicator: string; observation: string; observedAt: string }[] = [];
      if (cls.stageKey === 'kindergarten' || cls.stageKey === 'early_care') {
        const obs = await db.kgObservation.findMany({
          where: { studentId, tenantId },
          orderBy: { observedAt: 'desc' },
          take: 12,
        });
        observations = obs.map((o) => ({ domain: o.domain, indicator: o.indicator, observation: o.observation, observedAt: o.observedAt.toISOString() }));
      }

      // auto remark based on average
      const remark = average == null ? 'Awaiting assessment records.'
        : average >= 90 ? 'Excellent performance. Keep it up.'
        : average >= 80 ? 'Very good performance. Aim higher.'
        : average >= 70 ? 'Good performance. More effort will improve results.'
        : average >= 50 ? 'Satisfactory. Needs closer supervision at home.'
        : 'Needs significant improvement. Please meet the class teacher.';

      return NextResponse.json({
        school: { name: school?.name ?? 'School', motto: school?.motto ?? null, campus: cls.campus.name },
        term: { id: term.id, name: term.name, year: term.year.name },
        class: { id: cls.id, name: cls.name, stageKey: cls.stageKey, classTeacher: classTeacher ? `${classTeacher.firstName} ${classTeacher.lastName}` : null },
        student: {
          id: s.id, studentIdNo: s.studentIdNo, name: `${s.firstName} ${s.lastName}`,
          gender: s.gender, dateOfBirth: s.dateOfBirth?.toISOString() ?? null, rollNo: enrollment.rollNo,
        },
        profile: { name: profile?.name ?? 'School assessment', components, descriptors },
        subjects, average, grade: bandFor(average, descriptors),
        position: positionOf(studentId), classSize: classAverages.length,
        attendance: { ...attendance, rate: (attendance.present + attendance.late + attendance.absent + attendance.excused) > 0 ? Math.round(((attendance.present + attendance.late) / (attendance.present + attendance.late + attendance.absent + attendance.excused)) * 100) : null },
        fees: { billed: fees.billed, paid: fees.paid, balance: fees.billed - fees.paid, billedFormatted: formatMoney(fees.billed), paidFormatted: formatMoney(fees.paid), balanceFormatted: formatMoney(fees.billed - fees.paid) },
        observations, remark,
        publishedAt: entries.find((e) => e.studentId === studentId && e.publishedAt)?.publishedAt ?? null,
      });
    }

    return NextResponse.json({
      class: { id: cls.id, name: cls.name, stageKey: cls.stageKey },
      term: { id: term.id, name: term.name, year: term.year.name },
      roster,
      suggestedClassId,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Failed to build report card' }, { status: 500 });
  }
}
