import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { formatMoney } from '@/lib/money';

// GET /api/analytics — cross-module analytics for leadership dashboards
export async function GET() {
  try {
    const auth = await requireAuth();
    const tenantIds = auth.memberships.map((m) => m.tenantId);

    const school = await db.school.findFirst({ where: { tenantId: { in: tenantIds } } });
    if (!school) return NextResponse.json({ error: 'No school for tenant' }, { status: 404 });
    const tenantId = school.tenantId;

    // ---- Enrollment by stage & gender -------------------------------------
    const students = await db.student.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true, gender: true, enrollments: { where: { isCurrent: true }, include: { classGroup: { select: { stageKey: true } } } } },
    });
    const stageLabels: Record<string, string> = {
      early_care: 'Crèche / Nursery', kindergarten: 'Kindergarten', lower_primary: 'Lower Primary (B1–3)',
      upper_primary: 'Upper Primary (B4–6)', jhs: 'JHS (B7–9)',
    };
    const enrollmentByStage = new Map<string, { stage: string; male: number; female: number }>();
    let male = 0; let female = 0;
    for (const s of students) {
      const stage = s.enrollments[0]?.classGroup.stageKey ?? 'early_care';
      const key = stageLabels[stage] ?? stage;
      const cur = enrollmentByStage.get(key) ?? { stage: key, male: 0, female: 0 };
      if (s.gender === 'female') { cur.female += 1; female += 1; } else { cur.male += 1; male += 1; }
      enrollmentByStage.set(key, cur);
    }

    // ---- Attendance trend (last 14 school days) + per-class today ---------
    const calDays = await db.attendanceDay.findMany({
      where: { tenantId, dayType: 'school_day' },
      orderBy: { date: 'desc' },
      take: 14,
    });
    const attendanceTrend: { date: string; rate: number; present: number; marked: number }[] = [];
    for (const day of calDays) {
      const recs = await db.attendanceRecord.findMany({ where: { tenantId, date: day.date }, select: { status: true } });
      if (recs.length === 0) continue;
      const p = recs.filter((r) => ['present', 'late'].includes(r.status)).length;
      attendanceTrend.push({ date: day.date.toISOString().slice(0, 10), rate: Math.round((p / recs.length) * 100), present: p, marked: recs.length });
    }
    attendanceTrend.reverse();

    // attendance by class (last school day with records)
    const lastDay = calDays[0];
    const attendanceByClass: { class: string; rate: number; marked: number }[] = [];
    if (lastDay) {
      const recs = await db.attendanceRecord.findMany({
        where: { tenantId, date: lastDay.date },
        include: { classGroup: { select: { name: true } } },
      });
      const byClass = new Map<string, { present: number; marked: number }>();
      for (const r of recs) {
        const cur = byClass.get(r.classGroup.name) ?? { present: 0, marked: 0 };
        cur.marked += 1;
        if (['present', 'late'].includes(r.status)) cur.present += 1;
        byClass.set(r.classGroup.name, cur);
      }
      for (const [name, v] of byClass) attendanceByClass.push({ class: name, rate: Math.round((v.present / v.marked) * 100), marked: v.marked });
      attendanceByClass.sort((a, b) => b.rate - a.rate);
    }

    // ---- Finance: billed vs collected vs outstanding ----------------------
    const invoices = await db.invoice.findMany({
      where: { tenantId, status: { notIn: ['void', 'credited'] } },
      select: { total: true, amountPaid: true },
    });
    const billed = invoices.reduce((s, i) => s + i.total, 0);
    const collected = invoices.reduce((s, i) => s + i.amountPaid, 0);

    // collections by month (from payments)
    const payments = await db.payment.findMany({
      where: { tenantId, status: { notIn: ['failed', 'reversed', 'refunded', 'disputed'] } },
      select: { amount: true, businessDate: true, method: true },
    });
    const byMonth = new Map<string, number>();
    for (const p of payments) {
      const key = p.businessDate.toISOString().slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? 0) + p.amount);
    }
    const collectionByMonth = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([month, amount]) => ({ month, amount }));

    // by payment method
    const byMethod = new Map<string, number>();
    for (const p of payments) {
      byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount);
    }
    const byMethodArr = [...byMethod.entries()].map(([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount);

    // arrears by class
    const outstandingInvoices = await db.invoice.findMany({
      where: { tenantId, status: { in: ['outstanding', 'partially_paid'] } },
      include: { student: { include: { enrollments: { where: { isCurrent: true }, include: { classGroup: true } } } } },
      take: 600,
    });
    const arrearsByClass = new Map<string, { name: string; count: number; amount: number }>();
    for (const inv of outstandingInvoices) {
      const cls = inv.student.enrollments[0]?.classGroup;
      if (!cls) continue;
      const cur = arrearsByClass.get(cls.id) ?? { name: cls.name, count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += inv.total - inv.amountPaid;
      arrearsByClass.set(cls.id, cur);
    }
    const arrearsByClassArr = [...arrearsByClass.values()].sort((a, b) => b.amount - a.amount);

    // ---- Assessment coverage (current term) -------------------------------
    const year = await db.academicYear.findFirst({ where: { tenantId, isCurrent: true } });
    const term = year ? await db.academicTerm.findFirst({ where: { yearId: year.id, isCurrent: true } }) : null;
    let marksCoverage = 0;
    if (term) {
      marksCoverage = await db.gradebookEntry.count({ where: { tenantId, termId: term.id, status: 'marked' } });
    }

    return NextResponse.json({
      role: auth.memberships[0]?.roleKey ?? 'teacher',
      term: term ? { id: term.id, name: term.name } : null,
      kpis: {
        students: students.length,
        male, female,
        billed, collected,
        outstanding: billed - collected,
        collectionRate: billed > 0 ? Math.round((collected / billed) * 100) : 0,
        arrearsStudents: outstandingInvoices.length,
        marksCoverage,
      },
      kpisFormatted: { billed: formatMoney(billed), collected: formatMoney(collected), outstanding: formatMoney(billed - collected) },
      enrollmentByStage: [...enrollmentByStage.values()],
      attendanceTrend,
      attendanceByClass: attendanceByClass.slice(0, 13),
      attendanceDay: lastDay ? lastDay.date.toISOString().slice(0, 10) : null,
      collectionByMonth,
      collectionByMethod: byMethodArr,
      arrearsByClass: arrearsByClassArr.map((c) => ({ ...c, amountFormatted: formatMoney(c.amount) })),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Analytics failed' }, { status: 500 });
  }
}
