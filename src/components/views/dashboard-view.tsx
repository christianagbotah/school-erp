'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, GraduationCap, Wallet, TrendingUp, CalendarDays, Megaphone, CircleDollarSign } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { useApp } from '@/components/app-provider';

type DashboardData = {
  school: { name: string; motto: string | null };
  role: string;
  kpis: { students: number; staff: number; classes: number; billed: number; collected: number; outstanding: number; collectionRate: number; attendanceToday: number | null };
  kpisFormatted: { billed: string; collected: string; outstanding: string };
  arrearsByClass: { name: string; count: number; amount: number; amountFormatted: string }[];
  announcements: { id: string; title: string; body: string; audience: string; createdAt: string }[];
  attendanceTrend: { date: string; rate: number }[];
  wards: { id: string; name: string; class: string; balance: number }[];
  todaysClasses: { period: number; subject: string; className: string; time: string }[];
};

export default function DashboardView() {
  const { me } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!data) return <div className="text-muted-foreground p-8 text-center">Dashboard unavailable.</div>;

  const isParent = data.role === 'parent';
  const isTeacher = ['teacher', 'class_teacher'].includes(data.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isParent ? 'Family overview' : isTeacher ? 'Teaching today' : 'School overview'}
        </h1>
        <p className="text-muted-foreground text-sm">{data.school.name} · {data.school.motto}</p>
      </div>

      {isParent && data.wards.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.wards.map((w) => (
            <Card key={w.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{w.name}</CardTitle>
                <CardDescription>{w.class}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Outstanding balance</div>
                  <div className={`text-xl font-bold ${w.balance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    {formatMoney(w.balance)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isTeacher && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Today&apos;s classes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.todaysClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes scheduled today.</p>
            ) : (
              <div className="space-y-2">
                {data.todaysClasses.map((c) => (
                  <div key={c.period} className="flex items-center justify-between rounded-lg border px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">P{c.period}</Badge>
                      <div>
                        <div className="font-medium text-sm">{c.subject}</div>
                        <div className="text-xs text-muted-foreground">{c.className}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.time}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isParent && !isTeacher && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={<Users className="w-4 h-4" />} label="Students enrolled" value={String(data.kpis.students)} sub={`${data.kpis.classes} classes`} />
            <KpiCard icon={<GraduationCap className="w-4 h-4" />} label="Staff" value={String(data.kpis.staff)} sub="teaching + support" />
            <KpiCard icon={<Wallet className="w-4 h-4" />} label="Collected (Term)" value={data.kpisFormatted.collected} sub={`${data.kpis.collectionRate}% of billed`} />
            <KpiCard icon={<CircleDollarSign className="w-4 h-4" />} label="Outstanding" value={data.kpisFormatted.outstanding} sub={`${data.arrearsByClass.reduce((s, c) => s + c.count, 0)} students in arrears`} danger={data.kpis.outstanding > 0} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Attendance trend</CardTitle>
                <CardDescription>Last 7 school days — present + late / marked</CardDescription>
              </CardHeader>
              <CardContent>
                {data.attendanceTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
                ) : (
                  <AttendanceSparkline trend={data.attendanceTrend} />
                )}
                {data.kpis.attendanceToday !== null && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Today: <span className="font-semibold text-foreground">{data.kpis.attendanceToday}%</span> present
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Fee arrears by class</CardTitle>
                <CardDescription>Top 6 — outstanding balances</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.arrearsByClass.map((c) => (
                  <div key={c.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{c.name}</span>
                      <span className="font-medium">{c.amountFormatted}</span>
                    </div>
                    <Progress value={(c.count / Math.max(1, data.kpis.students / 6)) * 100} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Megaphone className="w-4 h-4" /> Notice board</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.announcements.map((a) => (
            <div key={a.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm">{a.title}</div>
                <Badge variant="secondary" className="capitalize">{a.audience}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, danger }: { icon: React.ReactNode; label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
        </div>
        <div className={`mt-2 text-2xl font-bold ${danger ? 'text-destructive' : ''}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function AttendanceSparkline({ trend }: { trend: { date: string; rate: number }[] }) {
  const max = 100;
  return (
    <div className="flex items-end gap-2 h-40">
      {trend.map((t) => (
        <div key={t.date} className="flex-1 flex flex-col items-center gap-1.5 group">
          <div className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">{t.rate}%</div>
          <div
            className={`w-full rounded-t-md ${t.rate >= 90 ? 'bg-emerald-500' : t.rate >= 75 ? 'bg-amber-400' : 'bg-destructive'}`}
            style={{ height: `${(t.rate / max) * 100}%` }}
          />
          <div className="text-[10px] text-muted-foreground">{new Date(t.date).getDate()}/{new Date(t.date).getMonth() + 1}</div>
        </div>
      ))}
    </div>
  );
}
