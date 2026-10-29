'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Printer, FileText, GraduationCap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type RosterData = {
  class: { id: string; name: string; stageKey: string };
  term: { id: string; name: string; year: string };
  roster: { id: string; name: string; rollNo: number | null; gender: string }[];
  suggestedClassId?: string | null;
};

type ReportCard = {
  school: { name: string; motto: string | null; campus: string };
  term: { id: string; name: string; year: string };
  class: { id: string; name: string; stageKey: string; classTeacher: string | null };
  student: { id: string; studentIdNo: string; name: string; gender: string; dateOfBirth: string | null; rollNo: number | null };
  profile: { name: string; components: { code: string; name: string; weight: number; maxScore: number }[]; descriptors: { band: string; range: [number, number] }[] | null };
  subjects: {
    subjectId: string; code: string; name: string;
    components: { code: string; name: string; score: number | null; max: number; status: string; weight: number }[];
    total: number | null; grade: string | null;
  }[];
  average: number | null;
  grade: string | null;
  position: number | null;
  classSize: number;
  attendance: { present: number; absent: number; late: number; excused: number; rate: number | null };
  fees: { billed: number; paid: number; balance: number; billedFormatted: string; paidFormatted: string; balanceFormatted: string };
  observations: { domain: string; indicator: string; observation: string; observedAt: string }[];
  remark: string;
  publishedAt: string | null;
};

export default function ReportCardsView() {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [classId, setClassId] = useState<string>('');
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [studentId, setStudentId] = useState<string>('');
  const [report, setReport] = useState<ReportCard | null>(null);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    fetch('/api/classes', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setClasses(d.classes ?? []);
        if (d.classes?.length > 0) setClassId(d.classes[0].id);
      })
      .catch(() => undefined);
  }, []);

  const loadRoster = useCallback(async (cid: string) => {
    setLoadingRoster(true);
    setReport(null);
    try {
      const res = await fetch(`/api/report-cards?classId=${cid}`, { cache: 'no-store' });
      if (res.ok) {
        const d: RosterData = await res.json();
        // parent/student: jump to the ward's own class when this one has no accessible learners
        if (d.suggestedClassId && d.roster.length === 0) {
          setClassId(d.suggestedClassId);
          return;
        }
        setRoster(d);
        setStudentId(d.roster[0]?.id ?? '');
      } else {
        setRoster(null);
      }
    } catch {
      setRoster(null);
    } finally {
      setLoadingRoster(false);
    }
  }, []);

  useEffect(() => {
    if (classId) loadRoster(classId);
  }, [classId, loadRoster]);

  const loadReport = useCallback(async (cid: string, sid: string) => {
    if (!cid || !sid) return;
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/report-cards?classId=${cid}&studentId=${sid}`, { cache: 'no-store' });
      if (res.ok) {
        setReport(await res.json());
      } else {
        const d = await res.json().catch(() => ({}));
        toast({ title: 'Could not open report card', description: d.error ?? 'Try another student.', variant: 'destructive' });
        setReport(null);
      }
    } catch {
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    if (classId && studentId) loadReport(classId, studentId);
  }, [classId, studentId, loadReport]);

  const isKG = report ? ['kindergarten', 'early_care'].includes(report.class.stageKey) : false;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report cards</h1>
          <p className="text-sm text-muted-foreground">Terminal reports — SBA weighted totals, attendance and fees position</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent className="max-h-96">{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={studentId} onValueChange={setStudentId} disabled={!roster?.roster.length}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Student" /></SelectTrigger>
            <SelectContent className="max-h-96">
              {roster?.roster.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {report && (
            <Button onClick={() => window.print()} className="gap-2 print:hidden">
              <Printer className="w-4 h-4" /> Print
            </Button>
          )}
        </div>
      </div>

      {loadingReport || loadingRoster ? (
        <Skeleton className="h-[820px]" />
      ) : report ? (
        <div className="print-area">
          <ReportCardSheet report={report} isKG={isKG} />
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-3 opacity-40" />
            {roster && roster.roster.length === 0
              ? 'No accessible learners in this class.'
              : 'Select a class and student to open their terminal report.'}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportCardSheet({ report, isKG }: { report: ReportCard; isKG: boolean }) {
  const compCols = isKG ? [] : report.profile.components;
  const domainLabels: Record<string, string> = {
    physical: 'Physical Development', cognitive: 'Cognitive Development', language: 'Language & Literacy',
    social_emotional: 'Social & Emotional', self_help: 'Self-help Skills',
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm mx-auto max-w-[820px] print:shadow-none print:border-0 print:rounded-none">
      {/* School header */}
      <div className="border-b-2 border-primary px-8 pt-8 pb-5 text-center">
        <div className="flex items-center justify-center gap-3 print:mb-2">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold tracking-tight leading-tight">{report.school.name}</h2>
            <p className="text-[11px] text-muted-foreground">{report.school.campus} · {report.school.motto}</p>
          </div>
        </div>
        <h3 className="mt-3 text-sm font-semibold uppercase tracking-widest">Terminal Report — {report.term.name}, {report.term.year}</h3>
      </div>

      {/* Student meta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 px-8 py-4 border-b text-sm">
        <Field label="Student name" value={report.student.name} wide />
        <Field label="Admission no" value={report.student.studentIdNo} />
        <Field label="Class" value={report.class.name} />
        <Field label="Roll no" value={report.student.rollNo != null ? String(report.student.rollNo) : '—'} />
        <Field label="Gender" value={report.student.gender === 'female' ? 'Female' : 'Male'} />
        <Field label="Position in class" value={report.position ? `${ordinal(report.position)} of ${report.classSize}` : '—'} />
        <Field label="Average score" value={report.average != null ? `${report.average}%` : '—'} />
        <Field label="Overall grade" value={report.grade ?? '—'} />
      </div>

      {/* Subjects or observations */}
      <div className="px-8 py-5">
        {isKG ? (
          <>
            <h4 className="text-sm font-semibold mb-3">Learning & development observations</h4>
            {report.observations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">No observation records captured for this learner yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Domain</TableHead>
                    <TableHead className="text-xs">Indicator</TableHead>
                    <TableHead className="text-xs">Observation</TableHead>
                    <TableHead className="text-xs text-right">Observed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.observations.map((o, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium">{domainLabels[o.domain] ?? o.domain}</TableCell>
                      <TableCell className="text-xs">{o.indicator}</TableCell>
                      <TableCell className="text-xs">{o.observation}</TableCell>
                      <TableCell className="text-xs text-muted-foreground text-right">{new Date(o.observedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        ) : (
          <>
            <h4 className="text-sm font-semibold mb-3">Subject performance — {report.profile.name}</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Subject</TableHead>
                  {compCols.map((c) => (
                    <TableHead key={c.code} className="text-xs text-center">
                      {c.name}
                      <div className="text-[10px] font-normal text-muted-foreground">{c.weight}% · max {c.maxScore}</div>
                    </TableHead>
                  ))}
                  <TableHead className="text-xs text-center">Total</TableHead>
                  <TableHead className="text-xs text-center">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.subjects.map((s) => (
                  <TableRow key={s.subjectId}>
                    <TableCell className="text-xs font-medium whitespace-nowrap">{s.name}</TableCell>
                    {compCols.map((c) => {
                      const cell = s.components.find((x) => x.code === c.code);
                      return (
                        <TableCell key={c.code} className={`text-xs text-center ${cell?.status === 'marked' ? '' : 'text-muted-foreground'}`}>
                          {cell?.status === 'marked' && cell?.score != null ? cell.score : cell?.status === 'exempt' ? 'EX' : cell?.status === 'absent' ? 'AB' : '—'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-xs text-center font-semibold">{s.total != null ? `${s.total}%` : '—'}</TableCell>
                    <TableCell className="text-xs text-center"><GradeBadge grade={s.grade} /></TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell className="text-xs">Overall average</TableCell>
                  {compCols.map((c) => <TableCell key={c.code} />)}
                  <TableCell className="text-xs text-center">{report.average != null ? `${report.average}%` : '—'}</TableCell>
                  <TableCell className="text-xs text-center"><GradeBadge grade={report.grade} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {report.profile.descriptors && (
              <div className="mt-3 flex flex-wrap gap-2">
                {report.profile.descriptors.map((d) => (
                  <Badge key={d.band} variant="outline" className="text-[10px] font-normal">
                    {d.band}: {d.range[0]}–{d.range[1]}
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Attendance + fees */}
      <div className="grid sm:grid-cols-2 gap-6 px-8 pb-5">
        <div className="border rounded-lg p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Attendance — {report.term.name}</h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="Present" value={report.attendance.present} tone="emerald" />
            <Stat label="Late" value={report.attendance.late} tone="amber" />
            <Stat label="Absent" value={report.attendance.absent} tone="rose" />
            <Stat label="Excused" value={report.attendance.excused} />
          </div>
          {report.attendance.rate != null && (
            <p className="text-xs text-muted-foreground mt-3">Attendance rate: <span className="font-semibold text-foreground">{report.attendance.rate}%</span></p>
          )}
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Fees position — {report.term.name}</h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Billed</span><span className="font-medium">{report.fees.billedFormatted}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-emerald-600 dark:text-emerald-400">{report.fees.paidFormatted}</span></div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="text-muted-foreground">Balance</span>
              <span className={`font-semibold ${report.fees.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{report.fees.balanceFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Remark + signatures */}
      <div className="px-8 pb-8">
        <div className="border rounded-lg p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Class teacher&apos;s remark</h4>
          <p className="text-sm leading-relaxed">{report.remark}</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8 mt-8 text-center text-xs">
          <div className="border-t pt-1.5">
            <span className="font-medium">{report.class.classTeacher ?? 'Class Teacher'}</span>
            <div className="text-muted-foreground">Class Teacher</div>
          </div>
          <div className="border-t pt-1.5">
            <span className="font-medium">Academic Head</span>
            <div className="text-muted-foreground">Academic Head</div>
          </div>
          <div className="border-t pt-1.5">
            <span className="font-medium">Headteacher</span>
            <div className="text-muted-foreground">Headteacher</div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-6">
          Generated by iEduPro · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · uncontrolled when printed
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'amber' | 'rose' }) {
  const cls = tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : tone === 'rose' ? 'text-rose-600 dark:text-rose-400' : '';
  return (
    <div>
      <div className={`text-lg font-bold ${cls}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-muted-foreground">—</span>;
  const tone = grade.startsWith('P') || grade.startsWith('Secure') ? 'default' : grade.startsWith('BB') || grade.startsWith('Developing') ? 'destructive' : 'secondary';
  return <Badge variant={tone} className="text-[10px]">{grade}</Badge>;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
