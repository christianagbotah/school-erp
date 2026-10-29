import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { formatMoney } from '@/lib/money';

// GET /api/dashboard — role-aware KPI summary
export async function GET() {
  try {
    const auth = await requireAuth();
    const tenantIds = auth.memberships.map((m) => m.tenantId);
    const primaryRole = auth.memberships[0]?.roleKey ?? 'teacher';

    const school = await db.school.findFirst({ where: { tenantId: { in: tenantIds } } });
    if (!school) return NextResponse.json({ error: 'No school for tenant' }, { status: 404 });
    const tenantId = school.tenantId;

    const [studentCount, staffCount, classCount] = await Promise.all([
      db.student.count({ where: { tenantId, status: 'ACTIVE' } }),
      db.staff.count({ where: { tenantId, status: 'active' } }),
      db.classGroup.count({ where: { tenantId } }),
    ]);

    // finance aggregates
    const [invoiceAgg, paidAgg] = await Promise.all([
      db.invoice.aggregate({ where: { tenantId, status: { notIn: ['void', 'credited'] } }, _sum: { total: true } }),
      db.invoice.aggregate({ where: { tenantId, status: { notIn: ['void', 'credited'] } }, _sum: { amountPaid: true } }),
    ]);
    const billed = invoiceAgg._sum.total ?? 0;
    const collected = paidAgg._sum.amountPaid ?? 0;

    // attendance today
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const attToday = await db.attendanceRecord.findMany({ where: { tenantId, date: today } });
    const presentish = attToday.filter((r) => ['present', 'late'].includes(r.status)).length;
    const attendanceRate = attToday.length > 0 ? Math.round((presentish / attToday.length) * 100) : null;

    // arrears by category (top classes)
    const outstandingInvoices = await db.invoice.findMany({
      where: { tenantId, status: { in: ['outstanding', 'partially_paid'] } },
      include: { student: { include: { enrollments: { where: { isCurrent: true }, include: { classGroup: true } } } } },
      take: 500,
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

    // recent announcements
    const announcements = await db.announcement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // attendance trend last 7 school days
    const calDays = await db.attendanceDay.findMany({
      where: { tenantId, dayType: 'school_day' },
      orderBy: { date: 'desc' },
      take: 7,
    });
    const trend: { date: string; rate: number }[] = [];
    for (const day of calDays) {
      const recs = await db.attendanceRecord.findMany({ where: { tenantId, date: day.date } });
      if (recs.length === 0) continue;
      const p = recs.filter((r) => ['present', 'late'].includes(r.status)).length;
      trend.push({ date: day.date.toISOString().slice(0, 10), rate: Math.round((p / recs.length) * 100) });
    }
    trend.reverse();

    // role-specific scoping for parents
    let wards: { id: string; name: string; class: string; balance: number }[] = [];
    if (primaryRole === 'parent') {
      const guardians = await db.guardian.findMany({ where: { userId: auth.user.id }, include: { students: { include: { student: { include: { enrollments: { where: { isCurrent: true }, include: { classGroup: true } }, invoices: true } } } } } });
      wards = guardians.flatMap((g) =>
        g.students.map((gs) => {
          const s = gs.student;
          const balance = s.invoices.reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
          return {
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            class: s.enrollments[0]?.classGroup.name ?? '—',
            balance,
          };
        })
      );
    }

    // teacher: today's classes
    let todaysClasses: { period: number; subject: string; className: string; time: string }[] = [];
    if (primaryRole === 'teacher' || primaryRole === 'class_teacher') {
      const staff = await db.staff.findFirst({ where: { tenantId } });
      if (staff) {
        const dow = new Date().getDay();
        const slots = await db.timetableSlot.findMany({
          where: { tenantId, teacherId: staff.id, dayOfWeek: dow === 0 ? 7 : dow },
          include: { subject: true, classGroup: true },
          orderBy: { period: 'asc' },
        });
        todaysClasses = slots.map((s) => ({ period: s.period, subject: s.subject?.name ?? '—', className: s.classGroup.name, time: `${s.startTime ?? ''}–${s.endTime ?? ''}` }));
      }
    }

    return NextResponse.json({
      school: { id: school.id, name: school.name, motto: school.motto, campus: 'Main' },
      role: primaryRole,
      kpis: {
        students: studentCount,
        staff: staffCount,
        classes: classCount,
        billed, collected,
        outstanding: billed - collected,
        collectionRate: billed > 0 ? Math.round((collected / billed) * 100) : 0,
        attendanceToday: attendanceRate,
      },
      kpisFormatted: {
        billed: formatMoney(billed),
        collected: formatMoney(collected),
        outstanding: formatMoney(billed - collected),
      },
      arrearsByClass: [...arrearsByClass.values()].sort((a, b) => b.amount - a.amount).slice(0, 6).map((c) => ({ ...c, amountFormatted: formatMoney(c.amount) })),
      announcements: announcements.map((a) => ({ id: a.id, title: a.title, body: a.body, audience: a.audience, createdAt: a.createdAt })),
      attendanceTrend: trend,
      wards,
      todaysClasses,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Dashboard failed' }, { status: 500 });
  }
}
