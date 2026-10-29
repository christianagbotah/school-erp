'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CalendarDays, Printer, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/components/app-provider';

type TimetableData = {
  classes: { id: string; name: string; stageKey: string }[];
  subjects: { id: string; code: string; name: string }[];
  staff: { id: string; name: string; position: string; isTeaching: boolean }[];
  slots: { id: string; dayOfWeek: number; period: number; startTime: string | null; endTime: string | null; room: string | null; subjectId: string | null; subjectCode: string | null; teacherId: string | null; teacherName: string | null }[];
  mySlots: { dayOfWeek: number; period: number; startTime: string | null; endTime: string | null; room: string | null; className: string; subject: string }[];
};

const DAYS = [
  { dow: 1, label: 'Monday', short: 'Mon' },
  { dow: 2, label: 'Tuesday', short: 'Tue' },
  { dow: 3, label: 'Wednesday', short: 'Wed' },
  { dow: 4, label: 'Thursday', short: 'Thu' },
  { dow: 5, label: 'Friday', short: 'Fri' },
];
const PERIODS = [1, 2, 3, 4, 5, 6];
const SUBJECT_COLORS = [
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-900',
  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900',
  'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300 border-lime-200 dark:border-lime-900',
  'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
  'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 border-pink-200 dark:border-pink-900',
];

function colorFor(code: string | null): string {
  if (!code) return 'bg-muted text-muted-foreground border-border';
  const sum = [...code].reduce((s, c) => s + c.charCodeAt(0), 0);
  return SUBJECT_COLORS[sum % SUBJECT_COLORS.length];
}

export default function TimetableView() {
  const { me } = useApp();
  const [mode, setMode] = useState<'class' | 'mine'>('class');
  const [data, setData] = useState<TimetableData | null>(null);
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // edit dialog state
  const [editCell, setEditCell] = useState<{ day: number; period: number; slotId: string | null; subjectId: string; teacherId: string; room: string; startTime: string; endTime: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const canEdit = me?.roles.some((r) => ['academic_head', 'headteacher', 'proprietor'].includes(r)) ?? false;

  useEffect(() => {
    fetch('/api/timetable', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: TimetableData) => {
        setData(d);
        const firstWithSlots = d.classes[0]?.id ?? '';
        setClassId(firstWithSlots);
      })
      .catch(() => setError('Timetable unavailable offline.'))
      .finally(() => setLoading(false));
  }, []);

  const reload = useCallback(async () => {
    try {
      const url = `/api/timetable?classId=${classId}&mine=${mode === 'mine' ? 1 : 0}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } catch { /* offline */ }
  }, [classId, mode]);

  useEffect(() => {
    if (classId) reload();
  }, [classId, mode, reload]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[560px]" />
      </div>
    );
  }
  if (error || !data) return <div className="text-muted-foreground p-8 text-center">{error ?? 'Timetable unavailable.'}</div>;

  const isTeacher = me?.roles.some((r) => ['teacher', 'class_teacher'].includes(r));
  const className = data.classes.find((c) => c.id === classId)?.name ?? '';

  function slotAt(dow: number, period: number) {
    return data?.slots.find((s) => s.dayOfWeek === dow && s.period === period) ?? null;
  }

  function mySlotAt(dow: number, period: number) {
    return data?.mySlots.find((s) => s.dayOfWeek === dow && s.period === period) ?? null;
  }

  async function saveSlot(deleteIt = false) {
    if (!editCell) return;
    setSaving(true);
    try {
      const body = deleteIt
        ? { delete: true, id: editCell.slotId }
        : {
            classId, dayOfWeek: editCell.day, period: editCell.period,
            subjectId: editCell.subjectId || null, teacherId: editCell.teacherId || null,
            room: editCell.room || null, startTime: editCell.startTime || null, endTime: editCell.endTime || null,
          };
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: 'Save failed', description: d.error ?? 'Unknown error', variant: 'destructive' });
        return;
      }
      toast({ title: deleteIt ? 'Slot cleared' : 'Timetable updated', description: `${DAYS.find((x) => x.dow === editCell!.day)?.label} · Period ${editCell.period}` });
      setEditCell(null);
      reload();
    } catch {
      toast({ title: 'Network error', description: 'Could not save the slot.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
          <p className="text-sm text-muted-foreground">Weekly teaching schedule — periods 1–6, Monday to Friday</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isTeacher && data.mySlots.length > 0 && (
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setMode('class')}
                className={`h-9 px-3 text-sm font-medium transition-colors ${mode === 'class' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              >
                Class timetable
              </button>
              <button
                onClick={() => setMode('mine')}
                className={`h-9 px-3 text-sm font-medium transition-colors ${mode === 'mine' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              >
                My timetable
              </button>
            </div>
          )}
          {mode === 'class' && (
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent className="max-h-96">{data.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <div className="hidden print:block mb-4">
        <h2 className="text-lg font-bold">{mode === 'mine' ? 'My teaching timetable' : `${className} — weekly timetable`}</h2>
      </div>

      <Card className="print-area">
        <CardHeader className="pb-3 print:hidden">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {mode === 'mine' ? 'My teaching schedule' : `${className} timetable`}
          </CardTitle>
          <CardDescription>
            {mode === 'mine'
              ? 'Your lessons across all classes'
              : canEdit ? 'Click a cell to assign subject, teacher and room' : 'Class schedule — managed by the academic office'}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[720px]">
            <thead>
              <tr>
                <th className="w-20 border bg-muted/60 text-xs font-medium p-2">Period</th>
                {DAYS.map((d) => (
                  <th key={d.dow} className="border bg-muted/60 text-xs font-medium p-2">{d.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period}>
                  <td className="border bg-muted/30 p-2 text-center">
                    <div className="text-sm font-semibold">P{period}</div>
                    <div className="text-[10px] text-muted-foreground">{`${String(7 + period).padStart(2, '0')}:30`}</div>
                  </td>
                  {DAYS.map((d) => {
                    if (mode === 'mine') {
                      const s = mySlotAt(d.dow, period);
                      return (
                        <td key={d.dow} className="border p-1.5 align-top">
                          {s ? (
                            <div className={`rounded-md border px-2 py-1.5 h-full ${colorFor(s.subject)}`}>
                              <div className="text-xs font-semibold leading-tight">{s.subject}</div>
                              <div className="text-[10px] opacity-80">{s.className}</div>
                              <div className="text-[10px] opacity-70">{s.room ? `Room ${s.room}` : s.startTime ?? ''}</div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground text-center py-2.5">—</div>
                          )}
                        </td>
                      );
                    }
                    const s = slotAt(d.dow, period);
                    const subject = s?.subjectId ? data.subjects.find((x) => x.id === s.subjectId) : null;
                    return (
                      <td key={d.dow} className="border p-1.5 align-top">
                        {canEdit ? (
                          <button
                            className={`w-full text-left rounded-md border px-2 py-1.5 transition-all hover:ring-2 hover:ring-primary/40 ${s ? colorFor(s.subjectCode) : 'bg-muted/40 border-dashed text-muted-foreground'}`}
                            onClick={() => setEditCell({
                              day: d.dow, period, slotId: s?.id ?? null,
                              subjectId: s?.subjectId ?? '',
                              teacherId: s?.teacherId ?? '',
                              room: s?.room ?? '',
                              startTime: s?.startTime ?? `${String(7 + period).padStart(2, '0')}:30`,
                              endTime: s?.endTime ?? `${String(8 + period).padStart(2, '0')}:20`,
                            })}
                          >
                            {s ? (
                              <>
                                <div className="text-xs font-semibold leading-tight flex items-center justify-between gap-1">
                                  {s.subjectCode ?? '—'}
                                  <Pencil className="w-3 h-3 opacity-50" />
                                </div>
                                <div className="text-[10px] opacity-80 truncate">{s.teacherName ?? 'Unassigned'}</div>
                                {s.room && <div className="text-[10px] opacity-70">Room {s.room}</div>}
                              </>
                            ) : (
                              <div className="text-[11px] text-center py-1.5 flex items-center justify-center gap-1">
                                <Pencil className="w-3 h-3 opacity-50" /> Assign
                              </div>
                            )}
                          </button>
                        ) : s ? (
                          <div className={`rounded-md border px-2 py-1.5 ${colorFor(s.subjectCode)}`}>
                            <div className="text-xs font-semibold leading-tight">{s.subjectCode ?? '—'}</div>
                            <div className="text-[10px] opacity-80 truncate">{s.teacherName ?? 'Unassigned'}</div>
                            {s.room && <div className="text-[10px] opacity-70">Room {s.room}</div>}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground text-center py-2.5">—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* legend */}
          {mode === 'class' && (
            <div className="flex flex-wrap gap-2 mt-4">
              {[...new Map(data.slots.filter((s) => s.subjectId).map((s) => [s.subjectCode, s.subjectId])).entries()].slice(0, 12).map(([code, sid]) => (
                <span key={sid} className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${colorFor(code)}`}>
                  {code}
                  <span className="ml-1 font-normal opacity-70">{data.subjects.find((x) => x.id === sid)?.name}</span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* edit dialog */}
      <Dialog open={!!editCell} onOpenChange={(o) => !o && setEditCell(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {DAYS.find((d) => d.dow === editCell?.day)?.label} · Period {editCell?.period}
            </DialogTitle>
            <DialogDescription>
              {editCell?.slotId ? 'Update this slot' : 'Assign a subject to this slot'} — {className}
            </DialogDescription>
          </DialogHeader>
          {editCell && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="slot-subject" className="text-xs">Subject</Label>
                <Select value={editCell.subjectId || 'none'} onValueChange={(v) => setEditCell({ ...editCell, subjectId: v === 'none' ? '' : v })}>
                  <SelectTrigger id="slot-subject" className="mt-1"><SelectValue placeholder="Choose subject" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none">— Free period —</SelectItem>
                    {data.subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="slot-teacher" className="text-xs">Teacher</Label>
                <Select value={editCell.teacherId || 'none'} onValueChange={(v) => setEditCell({ ...editCell, teacherId: v === 'none' ? '' : v })}>
                  <SelectTrigger id="slot-teacher" className="mt-1"><SelectValue placeholder="Choose teacher" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none">— Unassigned —</SelectItem>
                    {data.staff.filter((s) => s.isTeaching).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="slot-room" className="text-xs">Room</Label>
                  <Input id="slot-room" value={editCell.room} onChange={(e) => setEditCell({ ...editCell, room: e.target.value })} placeholder="R1" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="slot-start" className="text-xs">Start</Label>
                  <Input id="slot-start" type="time" value={editCell.startTime} onChange={(e) => setEditCell({ ...editCell, startTime: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="slot-end" className="text-xs">End</Label>
                  <Input id="slot-end" type="time" value={editCell.endTime} onChange={(e) => setEditCell({ ...editCell, endTime: e.target.value })} className="mt-1" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
            {editCell?.slotId ? (
              <Button variant="outline" onClick={() => saveSlot(true)} disabled={saving} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" /> Clear
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditCell(null)}>Cancel</Button>
              <Button onClick={() => saveSlot(false)} disabled={saving}>Save slot</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
