import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, requireAuth, audit, AuthError } from '@/lib/auth';

// GET /api/marks?classId=&subjectClassId= — SBA filling grid
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const subjectClassId = searchParams.get('subjectClassId');
    if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 });

    const cls = await db.classGroup.findUnique({ where: { id: classId } });
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    if (!tenantIds.includes(cls.tenantId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const year = await db.academicYear.findFirst({ where: { tenantId: cls.tenantId, isCurrent: true } });
    const term = year ? await db.academicTerm.findFirst({ where: { yearId: year.id, isCurrent: true } }) : null;

    const subjects = await db.subjectClass.findMany({
      where: { classId },
      include: { subject: true },
    });

    const targetSubject = subjectClassId ? subjects.find((s) => s.id === subjectClassId) : null;
    const subjectScope = targetSubject ? [targetSubject] : subjects;

    const enrollments = await db.enrollment.findMany({
      where: { classId, isCurrent: true },
      include: { student: true },
      orderBy: { rollNo: 'asc' },
    });

    const entries = await db.gradebookEntry.findMany({
      where: {
        classId,
        ...(targetSubject ? { subjectClassId: targetSubject.id } : {}),
        ...(term ? { termId: term.id } : {}),
      },
    });

    // profiles applicable to this stage (primary profiles cover lower AND upper primary)
    const stageFamily = ['lower_primary', 'upper_primary'].includes(cls.stageKey)
      ? ['lower_primary', 'upper_primary']
      : [cls.stageKey];
    const profiles = await db.assessmentProfile.findMany({
      where: { tenantId: cls.tenantId, OR: [{ stageKey: { in: stageFamily } }, { stageKey: null }] },
      orderBy: [{ provenance: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      class: { id: cls.id, name: cls.name, stageKey: cls.stageKey },
      term: term ? { id: term.id, name: term.name } : null,
      subjects: subjects.map((s) => ({ id: s.id, code: s.subject.code, name: s.subject.name })),
      profiles: profiles.map((p) => ({ id: p.id, name: p.name, provenance: p.provenance, components: JSON.parse(p.components), descriptors: p.descriptors ? JSON.parse(p.descriptors) : null })),
      students: enrollments.map((e) => ({
        id: e.studentId,
        name: `${e.student.firstName} ${e.student.lastName}`,
        rollNo: e.rollNo,
        entries: subjectScope.flatMap((sc) =>
          entries
            .filter((en) => en.studentId === e.studentId && en.subjectClassId === sc.id)
            .map((en) => ({ subjectClassId: sc.id, component: en.component, rawScore: en.rawScore, maxScore: en.maxScore, status: en.status }))
        ),
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Failed to load marks' }, { status: 500 });
  }
}

// POST /api/marks — save grid cell(s)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole('teacher', 'academic_head', 'headteacher');
    const { entries } = await req.json();
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'entries[] required' }, { status: 400 });
    }

    const results: { created: number; updated: number; rejected: string[] } = { created: 0, updated: 0, rejected: [] };
    for (const en of entries) {
      const { studentId, subjectClassId, classId, termId, component, rawScore, maxScore, status, profileId, note } = en;
      if (!studentId || !subjectClassId || !termId || !component || !maxScore) {
        results.rejected.push(`${JSON.stringify(en).slice(0, 80)}: missing fields`);
        continue;
      }
      // validation: raw within max
      if (rawScore != null && (rawScore < 0 || rawScore > maxScore)) {
        results.rejected.push(`Student ${studentId} ${component}: score ${rawScore} exceeds max ${maxScore}`);
        continue;
      }
      const existing = await db.gradebookEntry.findUnique({
        where: { tenantId_studentId_subjectClassId_termId_component: { tenantId: (await db.subjectClass.findUniqueOrThrow({ where: { id: subjectClassId } })).tenantId, studentId, subjectClassId, termId, component } },
      });
      if (existing) {
        // published marks cannot be silently overwritten
        if (existing.publishedAt) {
          results.rejected.push(`Student ${studentId} ${component}: published — needs moderation workflow`);
          continue;
        }
        await db.gradebookEntry.update({
          where: { id: existing.id },
          data: { rawScore: rawScore ?? null, status: status ?? 'marked', note: note ?? null, markedById: auth.user.id },
        });
        results.updated += 1;
      } else {
        const sc = await db.subjectClass.findUniqueOrThrow({ where: { id: subjectClassId } });
        await db.gradebookEntry.create({
          data: {
            tenantId: sc.tenantId, studentId, classId, subjectClassId, termId, component,
            rawScore: rawScore ?? null, maxScore, status: status ?? 'marked',
            note: note ?? null, markedById: auth.user.id, profileId: profileId ?? null,
          },
        });
        results.created += 1;
      }
    }
    await audit({ userId: auth.user.id, action: 'marks.save_grid', entityType: 'gradebook', after: results });
    return NextResponse.json(results);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
