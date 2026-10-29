// ============================================================================
// iEduPro demo data seeding — fabricated demonstration school (no real records)
// Run: bunx tsx scripts/seed.ts (or via bootstrap API in dev)
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { scryptSync, randomBytes } from 'crypto';
import { GHANA_STAGES, DEFAULT_CLASS_STRUCTURE, NATIONAL_SUBJECTS, ASSESSMENT_PROFILES } from '../src/lib/ghana-config';

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// Deterministic pseudo-random for reproducible demo data
let seedState = 42;
function rnd(): number {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function pickInt(min: number, max: number): number {
  return min + Math.floor(rnd() * (max - min + 1));
}

const FIRST_NAMES_M = ['Kwame', 'Kofi', 'Yaw', 'Kojo', 'Kwesi', 'Nana', 'Akwasi', 'Elikem', 'Eugene', 'Daniel', 'Michael', 'Samuel', 'Joseph', 'Emmanuel', 'Isaac', 'Prince', 'Kelvin', 'Divine', 'Caleb', 'Nathaniel', 'Gabriel', 'Theophilus', 'Benjamin', 'Josiah'];
const FIRST_NAMES_F = ['Akosua', 'Ama', 'Abena', 'Afia', 'Adwoa', 'Esi', 'Yaa', 'Keren', 'Gifty', 'Grace', 'Blessing', 'Efua', 'Linda', 'Doris', 'Esther', 'Naomi', 'Priscilla', 'Rebecca', 'Sarah', 'Comfort', 'Felicia', 'Gladys', 'Josephine', 'Serwaa'];
const LAST_NAMES = ['Mensah', 'Owusu', 'Asante', 'Boateng', 'Darko', 'Appiah', 'Agyeman', 'Osei', 'Amoah', 'Addo', 'Tetteh', 'Lamptey', 'Nkrumah', 'Adeyemi', 'Antwi', 'Baidoo', 'Cudjoe', 'Dzikunu', 'Essuman', 'Frimpong', 'Gyamfi', 'Hagan', 'Issahaku', 'Johnson'];
const STREETS = ['Adenta Municipal Rd', 'Madina Market St', 'East Legon Hills Ave', 'Ashiyie Block Factory Rd', 'Oyibi Crossing St', 'Kweiman Main St'];

async function main() {
  console.log('🌱 Seeding iEduPro demo data...');

  const tablenames = ['SyncOperation', 'Notification', 'Announcement', 'PayrollItem', 'PayRun', 'Trip', 'TransportEnrollment', 'Route', 'Vehicle', 'KgObservation', 'ExamAttempt', 'ExamClassAssignment', 'ExamSlot', 'GradebookEntry', 'AssessmentProfile', 'JournalLine', 'JournalEntry', 'GlAccount', 'ServiceCharge', 'ServiceEnrollment', 'ServiceSchedule', 'PaymentAllocation', 'Payment', 'InvoiceDiscount', 'InvoiceLine', 'Invoice', 'DiscountPolicy', 'FeePlanItem', 'FeePlan', 'FeeItem', 'AttendanceRecord', 'AttendanceDay', 'TimetableSlot', 'SubjectClass', 'Subject', 'Staff', 'GuardianStudent', 'Guardian', 'Enrollment', 'Student', 'ClassGroup', 'Stage', 'BillingCategory', 'AcademicTerm', 'AcademicYear', 'Campus', 'School', 'Organization', 'Membership', 'Session', 'User', 'AuditLog', 'Tenant'];
  for (const t of tablenames) {
    await db.$executeRawUnsafe(`DELETE FROM "${t}"`);
  }

  // ------------------------------------------------------------------ tenant
  const tenant = await db.tenant.create({
    data: {
      code: 'LW-DEMO',
      name: 'Lightworld Academy Group (Demo)',
      legalName: 'Lightworld Academy Ltd.',
      contactEmail: 'admin@lightworld.edu.gh',
      contactPhone: '+233244000001',
      status: 'ACTIVE',
      plan: 'standard',
      dbAssignment: 'school-erp-main',
    },
  });

  const org = await db.organization.create({
    data: { tenantId: tenant.id, name: 'Lightworld Academy Ltd.', legalName: 'Lightworld Academy Ltd.', tin: 'C0001234567' },
  });

  const school = await db.school.create({
    data: {
      tenantId: tenant.id,
      organizationId: org.id,
      name: 'Lightworld Academy',
      shortName: 'LWA',
      type: 'private',
      motto: 'Knowledge, Character, Service',
      address: 'Adenta Municipal Road, Accra',
      region: 'Greater Accra',
      district: 'Adenta Municipal',
      phone: '+233244000001',
      email: 'info@lightworld.edu.gh',
      website: 'www.lightworld.edu.gh',
      licenseNumber: 'NaSIA/REG/2024/0012',
      licenseExpiry: new Date('2027-08-31'),
      headteacherName: 'Mr. Samuel Adjei',
    },
  });

  const campusMain = await db.campus.create({
    data: { tenantId: tenant.id, schoolId: school.id, name: 'Main Campus (Adenta)', address: 'Adenta Municipal Road', phone: '+233244000001', isMain: true },
  });
  const campusBranch = await db.campus.create({
    data: { tenantId: tenant.id, schoolId: school.id, name: 'Ashiyie Branch', address: 'Ashiyie Block Factory Road', phone: '+233244000002', isMain: false },
  });

  // ------------------------------------------------------------------ academic year 2026–2027
  const year = await db.academicYear.create({
    data: { tenantId: tenant.id, schoolId: school.id, name: '2026–2027', startDate: new Date('2026-09-14'), endDate: new Date('2027-07-30'), isCurrent: true },
  });

  const term1 = await db.academicTerm.create({
    data: { tenantId: tenant.id, yearId: year.id, name: 'Term 1', sequence: 1, startDate: new Date('2026-09-14'), endDate: new Date('2026-12-18'), vacationDate: new Date('2026-12-18'), isCurrent: true },
  });
  await db.academicTerm.create({
    data: { tenantId: tenant.id, yearId: year.id, name: 'Term 2', sequence: 2, startDate: new Date('2027-01-11'), endDate: new Date('2027-04-08'), vacationDate: new Date('2027-04-08') },
  });
  await db.academicTerm.create({
    data: { tenantId: tenant.id, yearId: year.id, name: 'Term 3', sequence: 3, startDate: new Date('2027-04-26'), endDate: new Date('2027-07-30'), vacationDate: new Date('2027-07-30') },
  });

  // Calendar
  const calDays: { date: Date; dayType: string; note?: string }[] = [];
  const d = new Date('2026-09-14T00:00:00Z');
  const end = new Date('2026-11-30T00:00:00Z');
  const holidays: Record<string, string> = {
    '2026-09-21': 'Founder’s Day (observed)',
  };
  while (d <= end) {
    const dow = d.getUTCDay();
    const iso = d.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6) {
      if (holidays[iso]) calDays.push({ date: new Date(d), dayType: 'holiday', note: holidays[iso] });
      else calDays.push({ date: new Date(d), dayType: 'school_day' });
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  await db.attendanceDay.createMany({
    data: calDays.map((c) => ({ tenantId: tenant.id, yearId: year.id, termId: term1.id, date: c.date, dayType: c.dayType, note: c.note ?? null })),
  });

  // ------------------------------------------------------------------ stages + billing categories
  for (const s of GHANA_STAGES) {
    await db.stage.create({ data: { tenantId: tenant.id, schoolId: school.id, key: s.key, name: s.name, description: s.description, sortOrder: s.sortOrder } });
  }
  const catPre = await db.billingCategory.create({ data: { tenantId: tenant.id, schoolId: school.id, name: 'Pre-school', description: 'Crèche, Nursery, KG', stageMin: 1, sortOrder: 1 } });
  const catLower = await db.billingCategory.create({ data: { tenantId: tenant.id, schoolId: school.id, name: 'Lower Primary', description: 'Basic 1–3', stageMin: 2, sortOrder: 2 } });
  const catUpper = await db.billingCategory.create({ data: { tenantId: tenant.id, schoolId: school.id, name: 'Upper Primary', description: 'Basic 4–6', stageMin: 3, sortOrder: 3 } });
  const catJhs = await db.billingCategory.create({ data: { tenantId: tenant.id, schoolId: school.id, name: 'JHS', description: 'Basic 7–9', stageMin: 4, sortOrder: 4 } });

  // ------------------------------------------------------------------ subjects
  const subjectMap = new Map<string, string>();
  for (const s of NATIONAL_SUBJECTS) {
    const sub = await db.subject.create({
      data: { tenantId: tenant.id, schoolId: school.id, code: s.code, name: s.name, learningArea: s.learningArea, provenance: 'national', isBeceSubject: s.bece, sortOrder: 0 },
    });
    subjectMap.set(s.code, sub.id);
  }

  // ------------------------------------------------------------------ staff
  const staffData = [
    { first: 'Samuel', last: 'Adjei', position: 'Headteacher', dept: 'Administration', teaching: false },
    { first: 'Grace', last: 'Ofori-Atta', position: 'Deputy Headteacher (Academics)', dept: 'Administration', teaching: true },
    { first: 'Daniel', last: 'Boateng', position: 'Teacher — JHS Mathematics & Science', dept: 'JHS', teaching: true },
    { first: 'Akosua', last: 'Dartey', position: 'Teacher — Primary', dept: 'Primary', teaching: true },
    { first: 'Kwesi', last: 'Amankwah', position: 'Teacher — Primary', dept: 'Primary', teaching: true },
    { first: 'Gifty', last: 'Asamoah', position: 'Teacher — KG', dept: 'Early Years', teaching: true },
    { first: 'Abena', last: 'Nyarko', position: 'Teacher — Early Care', dept: 'Early Years', teaching: true },
    { first: 'Michael', last: 'Tetteh', position: 'Bursar', dept: 'Finance', teaching: false },
    { first: 'Esther', last: 'Mensah', position: 'Cashier', dept: 'Finance', teaching: false },
    { first: 'Yaw', last: 'Preprah', position: 'ICT Coordinator', dept: 'Administration', teaching: true },
  ];
  const staffIds: string[] = [];
  for (let i = 0; i < staffData.length; i++) {
    const s = staffData[i];
    const st = await db.staff.create({
      data: {
        tenantId: tenant.id, schoolId: school.id,
        staffIdNo: `LWA-STF-${String(i + 1).padStart(3, '0')}`,
        firstName: s.first, lastName: s.last, gender: i % 2 === 0 ? 'male' : 'female',
        phone: `+23324400${String(10 + i).padStart(4, '0')}`,
        email: `${s.first.toLowerCase()}.${s.last.toLowerCase()}@lightworld.edu.gh`.replace(/[^a-z.@]/g, ''),
        position: s.position, isTeaching: s.teaching, department: s.dept,
        dateOfEmployment: new Date(`202${pickInt(1, 5)}-01-15`),
        status: 'active',
      },
    });
    staffIds.push(st.id);
  }

  // ------------------------------------------------------------------ users
  const mkUser = async (email: string, name: string, roleKey: string, scopeType: string, scopeName: string) => {
    const u = await db.user.create({
      data: { email, passwordHash: hashPassword('Demo1234!'), fullName: name, phone: null, status: 'active', tenantId: tenant.id },
    });
    await db.membership.create({
      data: { userId: u.id, tenantId: tenant.id, roleKey, scopeType, scopeId: school.id, scopeName },
    });
    return u;
  };

  await mkUser('head@lightworld.edu.gh', 'Samuel Adjei', 'headteacher', 'school', 'Lightworld Academy');
  await mkUser('academics@lightworld.edu.gh', 'Grace Ofori-Atta', 'academic_head', 'school', 'Lightworld Academy');
  await mkUser('teacher@lightworld.edu.gh', 'Daniel Boateng', 'teacher', 'school', 'Lightworld Academy');
  await mkUser('bursar@lightworld.edu.gh', 'Michael Tetteh', 'accountant', 'school', 'Lightworld Academy');
  await mkUser('cashier@lightworld.edu.gh', 'Esther Mensah', 'cashier', 'school', 'Lightworld Academy');
  await mkUser('parent@lightworld.edu.gh', 'Kwabena Frimpong', 'parent', 'school', 'Lightworld Academy');
  await mkUser('student@lightworld.edu.gh', 'Kofi Frimpong', 'student', 'school', 'Lightworld Academy');
  await mkUser('proprietor@lightworld.edu.gh', 'Christian Agbotah', 'proprietor', 'school', 'Lightworld Academy');
  await mkUser('admin@lightworldtech.com', 'Platform Operator', 'platform_owner', 'tenant', 'Lightworld Academy Group');

  // ------------------------------------------------------------------ classes + students
  console.log('  creating classes and students...');
  const classIds: { id: string; name: string; stageKey: string }[] = [];
  for (const group of DEFAULT_CLASS_STRUCTURE) {
    for (const c of group.classes) {
      let categoryId: string | null = null;
      if (group.stageKey === 'early_care' || group.stageKey === 'kindergarten') categoryId = catPre.id;
      else if (group.stageKey === 'lower_primary') categoryId = catLower.id;
      else if (group.stageKey === 'upper_primary') categoryId = catUpper.id;
      else if (group.stageKey === 'jhs') categoryId = catJhs.id;

      const campus = group.stageKey === 'jhs' ? campusBranch : campusMain;
      const cls = await db.classGroup.create({
        data: {
          tenantId: tenant.id, schoolId: school.id, campusId: campus.id, academicYearId: year.id,
          categoryId, stageKey: group.stageKey, name: c.name, sectionLabel: c.section ?? null,
          capacity: pickInt(24, 35), classTeacherId: null, roomName: `Room ${pickInt(1, 12)}`,
        },
      });
      classIds.push({ id: cls.id, name: c.name, stageKey: group.stageKey });
      const teacher = ['lower_primary', 'upper_primary', 'jhs'].includes(group.stageKey) ? staffIds[3] : group.stageKey === 'kindergarten' ? staffIds[5] : staffIds[6];
      await db.classGroup.update({ where: { id: cls.id }, data: { classTeacherId: teacher } });

      const subjectCodes = group.stageKey === 'jhs'
        ? ['ENG', 'MATH', 'SCI', 'CAREER', 'COMPUTING', 'RME', 'CREATIVE', 'FRENCH', 'Ghanaian', 'PEH', 'HIST']
        : ['lower_primary', 'upper_primary'].includes(group.stageKey)
          ? ['ENG', 'MATH', 'SCI', 'SOC', 'COMPUTING', 'RME', 'CREATIVE', 'Ghanaian', 'PEH']
          : [];
      for (const code of subjectCodes) {
        await db.subjectClass.create({ data: { tenantId: tenant.id, subjectId: subjectMap.get(code)!, classId: cls.id, teacherId: pick(staffIds.slice(2, 7)) } });
      }
    }
  }

  let studentCounter = 0;
  const createdStudents: { id: string; classId: string; name: string }[] = [];
  for (const cls of classIds) {
    const n = pickInt(12, 18);
    for (let i = 0; i < n; i++) {
      studentCounter += 1;
      const gender = rnd() > 0.5 ? 'female' : 'male';
      const first = gender === 'male' ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
      const middle = rnd() > 0.5 ? (gender === 'male' ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F)) : null;
      const last = pick(LAST_NAMES);
      const ageByStage: Record<string, [number, number]> = {
        early_care: [2, 4], kindergarten: [4, 6], lower_primary: [6, 9], upper_primary: [9, 12], jhs: [12, 16],
      };
      const [amin, amax] = ageByStage[cls.stageKey] ?? [6, 12];
      const dobYear = 2026 - pickInt(amin, amax);
      const student = await db.student.create({
        data: {
          tenantId: tenant.id, schoolId: school.id,
          studentIdNo: `LWA/2026/${String(studentCounter).padStart(4, '0')}`,
          firstName: first, middleName: middle, lastName: last,
          gender, dateOfBirth: new Date(`${dobYear}-${String(pickInt(1, 12)).padStart(2, '0')}-${String(pickInt(1, 28)).padStart(2, '0')}`),
          dobAccuracy: rnd() > 0.9 ? 'approximate' : 'verified',
          status: 'ACTIVE',
        },
      });
      await db.enrollment.create({
        data: { tenantId: tenant.id, studentId: student.id, classId: cls.id, rollNo: i + 1, startDate: new Date('2026-09-14'), isCurrent: true },
      });
      const gFirst = pick(rnd() > 0.5 ? FIRST_NAMES_M : FIRST_NAMES_F);
      const guardian = await db.guardian.create({
        data: {
          tenantId: tenant.id, firstName: gFirst, lastName: last,
          phone: `+2332${pickInt(0, 9)}${pickInt(10000000, 99999999)}`,
          email: null, occupation: pick(['Trader', 'Teacher', 'Driver', 'Nurse', 'Tailor', 'Civil Servant', 'Farmer', 'Engineer']),
          address: `${pickInt(1, 120)} ${pick(STREETS)}, Accra`,
        },
      });
      await db.guardianStudent.create({
        data: {
          tenantId: tenant.id, guardianId: guardian.id, studentId: student.id,
          relationship: rnd() > 0.85 ? 'father' : 'mother',
          isLegalGuardian: true, isBillingResponsible: true, hasPortalAccess: rnd() > 0.4, hasPickupAuthority: rnd() > 0.1,
        },
      });
      createdStudents.push({ id: student.id, classId: cls.id, name: `${first} ${last}` });
    }
  }
  console.log(`  ${createdStudents.length} students created`);

  // Link demo parent & student portal users to records — deterministic "Kofi Frimpong"
  let kofi = createdStudents.find((s) => s.name.startsWith('Kofi'));
  if (kofi) {
    await db.student.update({ where: { id: kofi.id }, data: { firstName: 'Kofi', middleName: 'Kwabena', lastName: 'Frimpong' } });
    kofi = { ...kofi, name: 'Kofi Frimpong' };
  } else {
    const target = createdStudents[0];
    await db.student.update({ where: { id: target.id }, data: { firstName: 'Kofi', middleName: 'Kwabena', lastName: 'Frimpong' } });
    kofi = { ...target, name: 'Kofi Frimpong' };
  }
  const parentUser = await db.user.findUnique({ where: { email: 'parent@lightworld.edu.gh' } });
  const studentUser = await db.user.findUnique({ where: { email: 'student@lightworld.edu.gh' } });
  const gs = await db.guardianStudent.findFirst({ where: { studentId: kofi.id }, include: { guardian: true } });
  if (gs && parentUser) {
    await db.guardian.update({ where: { id: gs.guardianId }, data: { userId: parentUser.id, email: 'parent@lightworld.edu.gh', firstName: 'Kwabena', lastName: 'Frimpong' } });
  }
  if (studentUser) {
    await db.membership.create({
      data: { userId: studentUser.id, tenantId: tenant.id, roleKey: 'student', scopeType: 'student', scopeId: kofi.id, scopeName: 'Kofi Frimpong' },
    });
  }

  // ------------------------------------------------------------------ timetable
  for (const cls of classIds.filter((c) => ['jhs', 'upper_primary', 'lower_primary'].includes(c.stageKey)).slice(0, 4)) {
    const subs = await db.subjectClass.findMany({ where: { classId: cls.id } });
    for (let day = 1; day <= 5; day++) {
      for (let period = 1; period <= 6; period++) {
        const sc = subs[(day + period) % subs.length];
        if (!sc) continue;
        await db.timetableSlot.create({
          data: { tenantId: tenant.id, schoolId: school.id, classId: cls.id, subjectId: sc.subjectId, teacherId: sc.teacherId, dayOfWeek: day, period, startTime: `${String(7 + period).padStart(2, '0')}:30`, endTime: `${String(8 + period).padStart(2, '0')}:20`, room: `R${pickInt(1, 12)}` },
        });
      }
    }
  }

  // ------------------------------------------------------------------ fees
  console.log('  creating fee plans...');
  const feeItems = [
    { code: 'TUITION', name: 'Tuition Fee', service: false, cadence: 'termly' },
    { code: 'DEVELOPMENT', name: 'Development Levy', service: false, cadence: 'termly' },
    { code: 'EXAM', name: 'Examination Fee', service: false, cadence: 'termly' },
    { code: 'PTA', name: 'PTA Dues', service: false, cadence: 'termly' },
    { code: 'FEEDING', name: 'Feeding (Lunch)', service: true, cadence: 'daily' },
    { code: 'BREAKFAST', name: 'Breakfast', service: true, cadence: 'daily' },
    { code: 'WATER', name: 'Water', service: true, cadence: 'weekly' },
    { code: 'ICT', name: 'ICT Lab Fee', service: false, cadence: 'termly' },
    { code: 'TRANSPORT', name: 'Transport', service: true, cadence: 'termly' },
  ];
  const feeItemMap = new Map<string, string>();
  for (const f of feeItems) {
    const fi = await db.feeItem.create({
      data: { tenantId: tenant.id, schoolId: school.id, code: f.code, name: f.name, isService: f.service, serviceCadence: f.cadence, revenueAccountCode: f.code === 'TUITION' ? '4001' : '4002', isActive: true },
    });
    feeItemMap.set(f.code, fi.id);
  }

  const schoolPlan = await db.feePlan.create({
    data: {
      tenantId: tenant.id, schoolId: school.id, academicYearId: year.id, termId: term1.id,
      name: '2026–2027 Term 1 — School Base', version: 1, status: 'published',
      scopeType: 'school', scopeId: school.id, scopeName: 'Lightworld Academy',
      publishedAt: new Date(), approvedAt: new Date(),
    },
  });
  const baseItems: { code: string; amount: number }[] = [
    { code: 'TUITION', amount: 800_00 },
    { code: 'DEVELOPMENT', amount: 100_00 },
    { code: 'EXAM', amount: 60_00 },
    { code: 'PTA', amount: 30_00 },
  ];
  for (const bi of baseItems) {
    await db.feePlanItem.create({
      data: { tenantId: tenant.id, planId: schoolPlan.id, feeItemId: feeItemMap.get(bi.code)!, amount: bi.amount, cadence: 'termly', dueDate: new Date('2026-09-25') },
    });
  }

  const catPlans: { catId: string; name: string; tuition: number; extra?: { code: string; amount: number }[] }[] = [
    { catId: catPre.id, name: 'Pre-school Fees', tuition: 550_00 },
    { catId: catLower.id, name: 'Lower Primary Fees', tuition: 750_00 },
    { catId: catUpper.id, name: 'Upper Primary Fees', tuition: 850_00 },
    { catId: catJhs.id, name: 'JHS Fees (incl. BECE prep)', tuition: 950_00, extra: [{ code: 'ICT', amount: 50_00 }] },
  ];
  for (const cp of catPlans) {
    const plan = await db.feePlan.create({
      data: {
        tenantId: tenant.id, schoolId: school.id, academicYearId: year.id, termId: term1.id,
        name: `2026–2027 Term 1 — ${cp.name}`, version: 1, status: 'published',
        scopeType: 'category', scopeId: cp.catId, scopeName: cp.name,
        publishedAt: new Date(), approvedAt: new Date(),
      },
    });
    await db.feePlanItem.create({ data: { tenantId: tenant.id, planId: plan.id, feeItemId: feeItemMap.get('TUITION')!, amount: cp.tuition, cadence: 'termly', dueDate: new Date('2026-09-25') } });
    for (const ex of cp.extra ?? []) {
      await db.feePlanItem.create({ data: { tenantId: tenant.id, planId: plan.id, feeItemId: feeItemMap.get(ex.code)!, amount: ex.amount, cadence: 'termly', dueDate: new Date('2026-09-25') } });
    }
  }

  await db.discountPolicy.createMany({
    data: [
      { tenantId: tenant.id, schoolId: school.id, name: 'Sibling Discount (10%)', type: 'percentage', value: 10, scope: 'invoice', reason: 'sibling', requiresApproval: true, stackable: false, priority: 10 },
      { tenantId: tenant.id, schoolId: school.id, name: 'Staff Child (15%)', type: 'percentage', value: 15, scope: 'invoice', reason: 'staff_child', requiresApproval: true, stackable: false, priority: 20 },
      { tenantId: tenant.id, schoolId: school.id, name: 'Hardship Bursary (₵100)', type: 'fixed_amount', value: 100_00, scope: 'invoice', reason: 'hardship', requiresApproval: true, stackable: false, priority: 30 },
    ],
  });

  // ------------------------------------------------------------------ GL
  const glAccounts: { code: string; name: string; type: string; subtype?: string }[] = [
    { code: '1000', name: 'Cash on Hand', type: 'asset', subtype: 'cash' },
    { code: '1010', name: 'Bank — Main Account', type: 'asset', subtype: 'bank' },
    { code: '1020', name: 'Mobile Money Wallet', type: 'asset', subtype: 'momo' },
    { code: '1100', name: 'Accounts Receivable — Fees', type: 'asset', subtype: 'receivable' },
    { code: '1150', name: 'Customer Advances (Unearned)', type: 'liability', subtype: 'unearned' },
    { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '2100', name: 'SSNIT Payable', type: 'liability', subtype: 'statutory' },
    { code: '2110', name: 'PAYE Payable', type: 'liability', subtype: 'statutory' },
    { code: '3000', name: 'Accumulated Fund', type: 'equity' },
    { code: '4001', name: 'Tuition Revenue', type: 'income', subtype: 'revenue' },
    { code: '4002', name: 'Other Fee Revenue', type: 'income', subtype: 'revenue' },
    { code: '4010', name: 'Feeding Revenue', type: 'income', subtype: 'revenue' },
    { code: '5001', name: 'Salaries and Wages', type: 'expense' },
    { code: '5002', name: 'Utilities', type: 'expense' },
    { code: '5003', name: 'Transport Running Costs', type: 'expense' },
  ];
  for (const a of glAccounts) {
    await db.glAccount.create({ data: { tenantId: tenant.id, schoolId: school.id, code: a.code, name: a.name, type: a.type, subtype: a.subtype ?? null } });
  }

  // ------------------------------------------------------------------ services
  const feedingSchedule = await db.serviceSchedule.create({
    data: { tenantId: tenant.id, schoolId: school.id, feeItemId: feeItemMap.get('FEEDING')!, academicYearId: year.id, name: 'Lunch Feeding (Daily)', cadence: 'daily', weekdays: JSON.stringify([1, 2, 3, 4, 5]), amount: 8_00 },
  });
  const waterSchedule = await db.serviceSchedule.create({
    data: { tenantId: tenant.id, schoolId: school.id, feeItemId: feeItemMap.get('WATER')!, academicYearId: year.id, name: 'Water (Weekly)', cadence: 'weekly', amount: 5_00 },
  });
  for (const s of createdStudents) {
    if (rnd() > 0.4) {
      await db.serviceEnrollment.create({ data: { tenantId: tenant.id, studentId: s.id, scheduleId: feedingSchedule.id, classId: s.classId, status: 'active' } });
    }
    if (rnd() > 0.5) {
      await db.serviceEnrollment.create({ data: { tenantId: tenant.id, studentId: s.id, scheduleId: waterSchedule.id, classId: s.classId, status: 'active' } });
    }
  }

  // ------------------------------------------------------------------ invoices + payments
  console.log('  generating invoices...');
  let invCount = 0;
  for (const s of createdStudents) {
    const enrollment = await db.enrollment.findFirst({ where: { studentId: s.id }, include: { classGroup: true } });
    if (!enrollment) continue;
    const catId = enrollment.classGroup.categoryId;
    const catPlan = await db.feePlan.findFirst({ where: { scopeType: 'category', scopeId: catId ?? 'none', status: 'published' }, include: { items: true } });
    const schoolPlanItems = await db.feePlanItem.findMany({ where: { planId: schoolPlan.id } });
    const lines: { feeItemId: string; description: string; amount: number; cadence: string }[] = [];
    if (catPlan) {
      for (const it of catPlan.items) {
        const fi = await db.feeItem.findUnique({ where: { id: it.feeItemId } });
        lines.push({ feeItemId: it.id, description: fi!.name, amount: it.amount, cadence: it.cadence });
      }
    }
    for (const it of schoolPlanItems) {
      const fi = await db.feeItem.findUnique({ where: { id: it.feeItemId } });
      if (lines.some((l) => l.description === fi!.name)) continue;
      lines.push({ feeItemId: it.id, description: fi!.name, amount: it.amount, cadence: it.cadence });
    }
    const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
    invCount += 1;
    const invoice = await db.invoice.create({
      data: {
        tenantId: tenant.id, schoolId: school.id, studentId: s.id, planId: catPlan?.id ?? schoolPlan.id,
        invoiceNo: `INV-26-${String(invCount).padStart(5, '0')}`,
        academicYearId: year.id, termId: term1.id,
        issueDate: new Date('2026-09-14'), dueDate: new Date('2026-09-25'),
        subtotal, total: subtotal, status: 'outstanding',
      },
    });
    for (const l of lines) {
      await db.invoiceLine.create({
        data: { tenantId: tenant.id, invoiceId: invoice.id, feeItemId: l.feeItemId, description: l.description, quantity: 1, unitAmount: l.amount, lineTotal: l.amount, cadence: l.cadence },
      });
    }
    const r = rnd();
    if (r > 0.45) {
      const method = pick(['cash', 'momo', 'bank_transfer']);
      const payment = await db.payment.create({
        data: {
          tenantId: tenant.id, schoolId: school.id, studentId: s.id,
          paymentRef: `PAY-26-${String(invCount).padStart(5, '0')}`,
          method, amount: subtotal, status: 'posted',
          businessDate: new Date('2026-09-20'), verifiedAt: new Date('2026-09-20'),
        },
      });
      await db.paymentAllocation.create({ data: { tenantId: tenant.id, paymentId: payment.id, invoiceId: invoice.id, amount: subtotal } });
      await db.invoice.update({ where: { id: invoice.id }, data: { amountPaid: subtotal, status: 'paid' } });
    } else if (r > 0.3) {
      const partial = Math.round(subtotal * 0.5);
      const payment = await db.payment.create({
        data: {
          tenantId: tenant.id, schoolId: school.id, studentId: s.id,
          paymentRef: `PAY-26-${String(10000 + invCount).padStart(5, '0')}`,
          method: pick(['cash', 'momo']), amount: partial, status: 'posted',
          businessDate: new Date('2026-09-22'), verifiedAt: new Date('2026-09-22'),
        },
      });
      await db.paymentAllocation.create({ data: { tenantId: tenant.id, paymentId: payment.id, invoiceId: invoice.id, amount: partial } });
      await db.invoice.update({ where: { id: invoice.id }, data: { amountPaid: partial, status: 'partially_paid' } });
    }
  }
  console.log(`  ${invCount} invoices created`);

  // ------------------------------------------------------------------ attendance (last 10 school days)
  console.log('  generating attendance...');
  const calSchoolDays = await db.attendanceDay.findMany({
    where: { dayType: 'school_day', tenantId: tenant.id, yearId: year.id },
    orderBy: { date: 'desc' },
    take: 10,
  });
  const statuses = ['present', 'present', 'present', 'present', 'present', 'present', 'late', 'absent', 'excused', 'sick_home'];
  for (const day of calSchoolDays) {
    for (const s of createdStudents) {
      if (rnd() > 0.97) continue;
      const enrollment = await db.enrollment.findFirst({ where: { studentId: s.id } });
      await db.attendanceRecord.create({
        data: {
          tenantId: tenant.id, studentId: s.id, classId: enrollment!.classId, calendarDayId: day.id,
          date: day.date, sessionType: 'morning', status: pick(statuses), markedVia: 'web', source: 'manual',
        },
      }).catch(() => undefined);
    }
  }

  // ------------------------------------------------------------------ assessment profiles + marks
  console.log('  generating marks...');
  for (const prof of ASSESSMENT_PROFILES) {
    await db.assessmentProfile.create({
      data: {
        tenantId: tenant.id, schoolId: school.id, name: prof.name, provenance: prof.provenance,
        stageKey: prof.stageKey, components: JSON.stringify(prof.components),
        descriptors: prof.descriptors, isImmutable: false, version: 1,
        sourceDoc: prof.note,
      },
    });
  }
  const profiles = await db.assessmentProfile.findMany({ where: { tenantId: tenant.id } });
  const b4Class = classIds.find((c) => c.name === 'Basic 4');
  const b7Class = classIds.find((c) => c.name === 'Basic 7');
  for (const cls of [b4Class, b7Class].filter(Boolean)) {
    const profile = profiles.find((p) => (cls!.stageKey === 'jhs' ? p.stageKey === 'jhs' : p.stageKey !== 'jhs' && p.stageKey !== 'kindergarten'))!;
    const students = await db.enrollment.findMany({ where: { classId: cls!.id } });
    const subjectClasses = await db.subjectClass.findMany({ where: { classId: cls!.id }, include: { subject: true } });
    const components = JSON.parse(profile.components) as { code: string; name: string; weight: number; maxScore: number }[];
    for (const sc of subjectClasses.slice(0, 5)) {
      for (const comp of components) {
        for (const e of students) {
          const roll = rnd();
          const status = roll > 0.96 ? 'missing' : roll > 0.93 ? 'absent' : 'marked';
          await db.gradebookEntry.create({
            data: {
              tenantId: tenant.id, studentId: e.studentId, classId: cls!.id, subjectClassId: sc.id,
              termId: term1.id, profileId: profile.id, component: comp.code,
              rawScore: status === 'marked' ? pickInt(35, 100) : null, maxScore: comp.maxScore, status,
              markedById: sc.teacherId,
            },
          }).catch(() => undefined);
        }
      }
    }
  }

  // KG observations
  const kgClasses = classIds.filter((c) => c.stageKey === 'kindergarten');
  const kgDomains = ['physical', 'cognitive', 'language', 'social_emotional', 'self_help'];
  const kgIndicators = ['Pretend play with peers', 'Holds crayon correctly', 'Counts objects 1–10', 'Follows two-step instructions', 'Dresses with minimal help'];
  for (const cls of kgClasses) {
    const students = await db.enrollment.findMany({ where: { classId: cls.id } });
    for (const e of students.slice(0, 8)) {
      for (let i = 0; i < pickInt(2, 4); i++) {
        await db.kgObservation.create({
          data: {
            tenantId: tenant.id, studentId: e.studentId, domain: pick(kgDomains),
            indicator: pick(kgIndicators), observation: pick(['Consistently demonstrates during play.', 'Developing; needs occasional prompts.', 'Emerging skill, practised with support.']),
            observedAt: new Date(`2026-10-${String(pickInt(1, 28)).padStart(2, '0')}`),
          },
        });
      }
    }
  }

  // ------------------------------------------------------------------ transport
  const vehicle = await db.vehicle.create({
    data: { tenantId: tenant.id, schoolId: school.id, plateNumber: 'GR 4521-20', make: 'Toyota', model: 'Hiace', capacity: 30, insuranceExpiry: new Date('2027-03-31'), roadworthyExpiry: new Date('2027-01-15'), status: 'active' },
  });
  const route = await db.route.create({
    data: {
      tenantId: tenant.id, schoolId: school.id, vehicleId: vehicle.id, name: 'Adenta – Madina Circuit',
      zone: 'Adenta', stops: JSON.stringify([
        { name: 'Adenta Barrier', order: 1, eta: '06:15' },
        { name: 'Sakora Junction', order: 2, eta: '06:30' },
        { name: 'Madina Market', order: 3, eta: '06:45' },
        { name: 'Legon Gate', order: 4, eta: '07:00' },
      ]),
      morningStartTime: '06:15', afternoonStartTime: '15:30', fare: 250_00,
    },
  });
  for (const s of createdStudents.slice(0, 25)) {
    await db.transportEnrollment.create({
      data: { tenantId: tenant.id, studentId: s.id, routeId: route.id, direction: 'both', stopName: pick(['Adenta Barrier', 'Sakora Junction', 'Madina Market']), fareCharged: 250_00, status: 'active' },
    });
  }
  await db.trip.create({
    data: { tenantId: tenant.id, routeId: route.id, direction: 'morning', tripDate: new Date('2026-10-28'), driverId: staffIds[4], status: 'completed', startedAt: new Date('2026-10-28T06:15:00Z'), completedAt: new Date('2026-10-28T07:10:00Z'), events: JSON.stringify([{ stop: 'Adenta Barrier', boarded: 12 }]) },
  });

  // ------------------------------------------------------------------ announcements
  await db.announcement.createMany({
    data: [
      { tenantId: tenant.id, schoolId: school.id, title: 'Term 1 Mid-Semester Break', body: 'School closes for mid-semester break on Friday, 30 October 2026 and reopens on Monday, 9 November 2026.', audience: 'all', channel: 'in_app', deliveryStatus: 'sent', sentById: staffIds[0] },
      { tenantId: tenant.id, schoolId: school.id, title: 'PTA General Meeting', body: 'The first PTA general meeting of the 2026–2027 academic year comes off on Saturday, 7 November 2026 at 9:00 AM in the school hall.', audience: 'parents', channel: 'in_app', deliveryStatus: 'sent' },
      { tenantId: tenant.id, schoolId: school.id, title: 'Staff Briefing — Exam Preparation', body: 'All teachers are reminded to submit mid-semester assessment marks by Wednesday.', audience: 'teachers', channel: 'in_app', deliveryStatus: 'sent' },
    ],
  });

  console.log('✅ Seed complete.');
  console.log(`   Tenant: ${tenant.code} | School: ${school.name}`);
  console.log('   Login: head@lightworld.edu.gh / Demo1234! (also teacher, bursar, cashier, parent, student, proprietor, admin)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
