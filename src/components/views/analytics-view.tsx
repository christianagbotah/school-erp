'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Wallet, TrendingUp, AlertTriangle, GraduationCap, BookOpenCheck } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { formatMoney } from '@/lib/money';

type AnalyticsData = {
  term: { id: string; name: string } | null;
  kpis: { students: number; male: number; female: number; billed: number; collected: number; outstanding: number; collectionRate: number; arrearsStudents: number; marksCoverage: number };
  kpisFormatted: { billed: string; collected: string; outstanding: string };
  enrollmentByStage: { stage: string; male: number; female: number }[];
  attendanceTrend: { date: string; rate: number; present: number; marked: number }[];
  attendanceByClass: { class: string; rate: number; marked: number }[];
  attendanceDay: string | null;
  collectionByMonth: { month: string; amount: number }[];
  collectionByMethod: { method: string; amount: number }[];
  arrearsByClass: { name: string; count: number; amount: number; amountFormatted: string }[];
};

const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const ROSE = '#f43f5e';
const TEAL = '#14b8a6';
const PIE_COLORS = [EMERALD, AMBER, ROSE, TEAL, '#84cc16', '#a3a3a3'];

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtMonth(iso: string): string {
  return new Date(`${iso}-01`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--popover-foreground)',
} as const;

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' });
      if (res.ok) {
        setData(await res.json());
        setError(null);
      } else {
        setError('Analytics unavailable for your role.');
      }
    } catch {
      setError('Analytics unavailable offline.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }
  if (error || !data) return <div className="text-muted-foreground p-8 text-center">{error ?? 'Analytics unavailable.'}</div>;

  const genderData = [
    { name: 'Girls', value: data.kpis.female },
    { name: 'Boys', value: data.kpis.male },
  ];
  const methodLabels: Record<string, string> = { cash: 'Cash', momo: 'Mobile Money', bank_transfer: 'Bank Transfer', cheque: 'Cheque', card: 'Card', pos: 'POS' };
  const methodData = data.collectionByMethod.map((m) => ({ name: methodLabels[m.method] ?? m.method, value: Math.round(m.amount / 100) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Cross-module insights{data.term ? ` · ${data.term.name}` : ''} · {data.kpis.students} learners
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Users className="w-4 h-4" />} label="Enrollment" value={String(data.kpis.students)} sub={`${data.kpis.male} boys · ${data.kpis.female} girls`} />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Collection rate" value={`${data.kpis.collectionRate}%`} sub={`${data.kpisFormatted.collected} of ${data.kpisFormatted.billed}`} tone="emerald" />
        <Kpi icon={<AlertTriangle className="w-4 h-4" />} label="Outstanding" value={data.kpisFormatted.outstanding} sub={`${data.kpis.arrearsStudents} students in arrears`} tone={data.kpis.outstanding > 0 ? 'rose' : 'emerald'} />
        <Kpi icon={<BookOpenCheck className="w-4 h-4" />} label="Marks captured" value={String(data.kpis.marksCoverage)} sub="current term SBA entries" tone="teal" />
      </div>

      {/* Attendance trend + gender split */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance trend</CardTitle>
            <CardDescription>Last 14 school days — present + late as % of marked register</CardDescription>
          </CardHeader>
          <CardContent>
            {data.attendanceTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No attendance recorded yet.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.attendanceTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={EMERALD} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={EMERALD} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => fmtDay(l as string)} formatter={(v: number | string) => [`${v}%`, 'Attendance']} />
                    <Area type="monotone" dataKey="rate" stroke={EMERALD} strokeWidth={2} fill="url(#attFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gender distribution</CardTitle>
            <CardDescription>Active learners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={3} strokeWidth={0}>
                    <Cell fill={ROSE} />
                    <Cell fill={EMERALD} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={(v) => <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collections + enrollment */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Collections by month</CardTitle>
            <CardDescription>Posted payments (₵)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.collectionByMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No payments recorded.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.collectionByMonth.map((m) => ({ ...m, cedi: Math.round(m.amount / 100) }))} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => fmtMonth(l as string)} formatter={(v: number | string) => [`₵${Number(v).toLocaleString()}`, 'Collected']} />
                    <Bar dataKey="cedi" fill={EMERALD} radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Enrollment by stage</CardTitle>
            <CardDescription>Current placement, boys and girls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.enrollmentByStage} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={0} angle={-12} dy={8} height={44} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={(v) => <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{v}</span>} />
                  <Bar dataKey="male" name="Boys" stackId="s" fill={EMERALD} radius={[0, 0, 0, 0]} maxBarSize={44} />
                  <Bar dataKey="female" name="Girls" stackId="s" fill={ROSE} radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arrears + attendance by class */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fee arrears by class</CardTitle>
            <CardDescription>Outstanding balances (top 8)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.arrearsByClass.slice(0, 8).map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">{c.name} <Badge variant="secondary" className="text-[10px]">{c.count}</Badge></span>
                  <span className="font-medium">{c.amountFormatted}</span>
                </div>
                <Progress value={(c.amount / Math.max(1, data.arrearsByClass[0]?.amount ?? 1)) * 100} className="h-1.5" />
              </div>
            ))}
            {data.arrearsByClass.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No arrears — fully collected. 🎉</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance by class</CardTitle>
            <CardDescription>{data.attendanceDay ? `Register of ${fmtDay(data.attendanceDay)}` : 'Latest register'}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.attendanceByClass.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No registers marked recently.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.attendanceByClass} layout="vertical" margin={{ top: 4, right: 16, left: 18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} unit="%" />
                    <YAxis type="category" dataKey="class" width={78} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string) => [`${v}%`, 'Attendance']} />
                    <Bar dataKey="rate" radius={[0, 6, 6, 0]} maxBarSize={18}>
                      {data.attendanceByClass.map((c, i) => (
                        <Cell key={i} fill={c.rate >= 90 ? EMERALD : c.rate >= 75 ? AMBER : ROSE} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment methods */}
      {methodData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Collections by payment channel</CardTitle>
            <CardDescription>Share of posted payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 items-center">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={methodData} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="78%" paddingAngle={3} strokeWidth={0}>
                      {methodData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string) => [`₵${Number(v).toLocaleString()}`, 'Collected']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {methodData.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm flex-1">{m.name}</span>
                    <span className="text-sm font-medium">₵{m.value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="pt-2 border-t text-sm text-muted-foreground">
                  Total posted: <span className="font-semibold text-foreground">{formatMoney(data.kpis.collected)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: 'emerald' | 'rose' | 'teal' }) {
  const bg = tone === 'rose' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : tone === 'teal' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-primary/10 text-primary';
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>{icon}</div>
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
