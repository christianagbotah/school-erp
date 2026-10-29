// ============================================================================
// iEduPro incremental data enrichment — run AFTER the main seed.
// 1. Staff salaries (baseSalary + allowances, HR demo records)
// 2. Timetable slots for every class (main seed only covers 4 classes)
// 3. Demo in-app notifications for portal users
// Idempotent: safe to re-run.
// Run: bunx tsx scripts/seed-extras.ts
// ============================================================================

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Enriching iEduPro demo data...');

  const tenant = await db.tenant.findFirst({ where: { code: 'LW-DEMO' } });
  if (!tenant) {
    console.error('Demo tenant not found — run scripts/seed.ts first.');
    process.exit(1);
  }
  const school = await db.school.findFirst({ where: { tenantId: tenant.id } });
  if (!school) process.exit(1);

  // -------------------------------------------------------------- 1. salaries
  const staff = await db.staff.findMany({ where: { tenantId: tenant.id } });
  // Ghana private-basic-school demo salary bands (monthly GHS -> pesewas)
  const salaryByPosition: { match: RegExp; base: number; allowance: number }[] = [
    { match: /headteacher/i, base: 5200_00, allowance: 800_00 },
    { match: /deputy headteacher/i, base: 4600_00, allowance: 500_00 },
    { match: /bursar/i, base: 3900_00, allowance: 400_00 },
    { match: /cashier/i, base: 2600_00, allowance: 200_00 },
    { match: /ict coordinator/i, base: 3600_00, allowance: 300_00 },
    { match: /teacher — jhs/i, base: 3500_00, allowance: 250_00 },
    { match: /teacher — primary/i, base: 3000_00, allowance: 200_00 },
    { match: /teacher — kg/i, base: 2800_00, allowance: 200_00 },
    { match: /teacher — early care/i, base: 2600_00, allowance: 150_00 },
    { match: /teacher/i, base: 2900_00, allowance: 200_00 },
  ];
  let salaryCount = 0;
  for (const s of staff) {
    const band = salaryByPosition.find((b) => b.match.test(s.position)) ?? salaryByPosition[salaryByPosition.length - 1];
    if (s.baseSalary == null) {
      await db.staff.update({ where: { id: s.id }, data: { baseSalary: band.base, allowances: band.allowance } });
      salaryCount += 1;
    }
  }
  console.log(`  salaries: ${salaryCount} staff updated`);

  // ----------------------------------------------------------- 2. timetables
  const classes = await db.classGroup.findMany({ where: { tenantId: tenant.id } });
  let slotCount = 0;
  for (const cls of classes) {
    const existing = await db.timetableSlot.count({ where: { classId: cls.id } });
    if (existing > 0) continue;
    const subs = await db.subjectClass.findMany({ where: { classId: cls.id } });
    if (subs.length === 0) continue;
    const rows: Parameters<typeof db.timetableSlot.createMany>[0]['data'] = [];
    for (let day = 1; day <= 5; day++) {
      for (let period = 1; period <= 6; period++) {
        const sc = subs[(day * 2 + period) % subs.length];
        if (!sc) continue;
        rows.push({
          tenantId: tenant.id, schoolId: school.id, classId: cls.id,
          subjectId: sc.subjectId, teacherId: sc.teacherId,
          dayOfWeek: day, period,
          startTime: `${String(7 + period).padStart(2, '0')}:30`,
          endTime: `${String(8 + period).padStart(2, '0')}:20`,
          room: cls.roomName ?? `R${((day * 3 + period) % 12) + 1}`,
        });
      }
    }
    if (rows.length > 0) {
      await db.timetableSlot.createMany({ data: rows });
      slotCount += rows.length;
    }
  }
  console.log(`  timetables: ${slotCount} slots created for ${classes.filter(async c => (await db.timetableSlot.count({ where: { classId: c.id } })) > 0).length ? 'remaining classes' : 'classes'}`);

  // -------------------------------------------------------- 3b. SBA marks
  // Main seed only marks Basic 4 / Basic 7 partially — enrich so every
  // primary/JHS learner has complete current-term SBA entries for report cards.
  const profiles = await db.assessmentProfile.findMany({ where: { tenantId: tenant.id } });
  const year = await db.academicYear.findFirst({ where: { tenantId: tenant.id, isCurrent: true } });
  const term = year ? await db.academicTerm.findFirst({ where: { yearId: year.id, isCurrent: true } }) : null;
  let marksCount = 0;
  if (term) {
    for (const cls of classes) {
      if (!['lower_primary', 'upper_primary', 'jhs'].includes(cls.stageKey)) continue;
      const profile = profiles.find((p) =>
        cls.stageKey === 'jhs' ? p.stageKey === 'jhs' : (p.stageKey === 'lower_primary' || p.stageKey === 'upper_primary')
      );
      if (!profile) continue;
      const comps = JSON.parse(profile.components) as { code: string; name: string; weight: number; maxScore: number }[];
      const enrollments = await db.enrollment.findMany({ where: { classId: cls.id, isCurrent: true } });
      const subjectClasses = await db.subjectClass.findMany({ where: { classId: cls.id } });
      for (const sc of subjectClasses) {
        for (const comp of comps) {
          for (const e of enrollments) {
            const exists = await db.gradebookEntry.findUnique({
              where: {
                tenantId_studentId_subjectClassId_termId_component: {
                  tenantId: tenant.id, studentId: e.studentId, subjectClassId: sc.id, termId: term.id, component: comp.code,
                },
              },
            });
            if (exists) continue;
            // deterministic pseudo-random per (class, subject, student, component)
            const h = `${e.studentId}${sc.id}${comp.code}`;
            let hash = 0;
            for (const ch of h) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
            const r = ((Math.abs(hash) % 1000) / 1000);
            const status = r > 0.97 ? 'missing' : r > 0.94 ? 'absent' : 'marked';
            const base = 38 + ((Math.abs(hash) >> 3) % 55); // 38–92
            await db.gradebookEntry.create({
              data: {
                tenantId: tenant.id, studentId: e.studentId, classId: cls.id,
                subjectClassId: sc.id, termId: term.id, profileId: profile.id,
                component: comp.code, rawScore: status === 'marked' ? base : null,
                maxScore: comp.maxScore, status, markedById: null,
              },
            });
            marksCount += 1;
          }
        }
      }
    }
  }
  console.log(`  marks: ${marksCount} SBA entries created`);

  // -------------------------------------------------------- 3c. KG observations
  let obsCount = 0;
  if (term) {
    for (const cls of classes.filter((c) => ['kindergarten', 'early_care'].includes(c.stageKey))) {
      const enrollments = await db.enrollment.findMany({ where: { classId: cls.id, isCurrent: true }, take: 6 });
      const obsTemplates = [
        { domain: 'physical', indicator: 'Gross motor coordination', observation: 'Runs, jumps and balances confidently during outdoor play.' },
        { domain: 'cognitive', indicator: 'Problem solving', observation: 'Sorts objects by size and colour; completes simple puzzles.' },
        { domain: 'language', indicator: 'Expressive language', observation: 'Speaks in full sentences; retells short stories with prompting.' },
        { domain: 'social_emotional', indicator: 'Cooperation', observation: 'Plays cooperatively in groups; takes turns willingly.' },
        { domain: 'self_help', indicator: 'Personal hygiene', observation: 'Washes hands and manages personal items independently.' },
      ];
      for (const e of enrollments) {
        const existing = await db.kgObservation.count({ where: { studentId: e.studentId } });
        if (existing > 0) continue;
        for (const t of obsTemplates) {
          await db.kgObservation.create({
            data: {
              tenantId: tenant.id, studentId: e.studentId,
              domain: t.domain, indicator: t.indicator, observation: t.observation,
              observedAt: new Date(Date.now() - Math.floor(Math.random() * 12) * 86400000),
            },
          });
          obsCount += 1;
        }
      }
    }
  }
  console.log(`  observations: ${obsCount} KG records created`);

  // -------------------------------------------------------- 3. notifications
  const notifications: { email: string; items: { title: string; body: string; type: string; read?: boolean }[] }[] = [
    {
      email: 'head@lightworld.edu.gh',
      items: [
        { title: 'Term 1 fee collection at 71%', body: 'Collection rate stands at 71% of billed fees. 34 students are in arrears — the Debtors report shows aging by class.', type: 'fee' },
        { title: 'Attendance flag: Basic 5', body: 'Basic 5 attendance dipped below 85% twice this week. Review the Analytics view for the 14-day trend.', type: 'attendance' },
        { title: 'Payroll ready to preview', body: 'October 2026 payroll can be previewed in the Payroll module. Rule pack gh-2026.1 (SSNIT + PAYE).', type: 'system' },
      ],
    },
    {
      email: 'parent@lightworld.edu.gh',
      items: [
        { title: 'Term 1 report card available', body: 'Kofi Frimpong\'s Term 1 report card is ready to view in Report Cards.', type: 'result' },
        { title: 'Fees reminder', body: 'A balance remains on this term\'s invoice. Kindly settle at the school office or via mobile money.', type: 'fee' },
      ],
    },
    {
      email: 'teacher@lightworld.edu.gh',
      items: [
        { title: 'Marks entry deadline', body: 'End-of-term exam marks close Friday. Complete your SBA gradebook entries for all subjects.', type: 'result' },
        { title: 'Timetable published', body: 'The Term 1 timetable for your classes is now available in Timetable.', type: 'system', read: true },
      ],
    },
    {
      email: 'cashier@lightworld.edu.gh',
      items: [
        { title: 'Daily reconciliation', body: 'Yesterday\'s collections reconcile with the cash journal. Receipt book #0042 is in use.', type: 'fee', read: true },
      ],
    },
    {
      email: 'bursar@lightworld.edu.gh',
      items: [
        { title: 'Debtors aging report', body: '34 students carry outstanding balances totaling ₵14,000+. Open the Debtors view for the aging breakdown.', type: 'fee' },
      ],
    },
    {
      email: 'student@lightworld.edu.gh',
      items: [
        { title: 'Your Term 1 report card', body: 'Your end-of-term report is available under Report Cards.', type: 'result' },
      ],
    },
  ];

  let notifCount = 0;
  for (const n of notifications) {
    const user = await db.user.findUnique({ where: { email: n.email } });
    if (!user) continue;
    for (const item of n.items) {
      const dup = await db.notification.findFirst({ where: { userId: user.id, title: item.title } });
      if (dup) continue;
      await db.notification.create({
        data: { userId: user.id, title: item.title, body: item.body, type: item.type, isRead: item.read ?? false },
      });
      notifCount += 1;
    }
  }
  console.log(`  notifications: ${notifCount} created`);

  console.log('✅ Seed extras complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
