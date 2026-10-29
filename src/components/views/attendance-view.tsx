'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastIfy } from '@/components/toastify';
import { Check, Save, Loader2, CloudOff, Users, CalendarDays } from 'lucide-react';
import { enqueueOperation, useSyncStore } from '@/lib/client-sync';
import { cachedFetch } from '@/lib/cached-fetch';

type ClassInfo = { id: string; name: string; section: string | null; stageKey: string; campus: string; enrolled: number };
type Roster = {
  class: { id: string; name: string };
  date: string;
  dayType: string;
  roster: { studentId: string; name: string; rollNo: number | null; status: string | null; note: string | null }[];
};

const STATUSES = [
  { key: 'present', label: 'Present', cls: 'bg-emerald-600' },
  { key: 'late', label: 'Late', cls: 'bg-amber-500' },
  { key: 'absent', label: 'Absent', cls: 'bg-red-600' },
  { key: 'excused', label: 'Excused', cls: 'bg-sky-600' },
  { key: 'sick_home', label: 'Sick @ home', cls: 'bg-violet-600' },
  { key: 'sick_clinic', label: 'Sick @ clinic', cls: 'bg-fuchsia-600' },
];

export default function AttendanceView() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [classId, setClassId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState<Roster | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const online = useSyncStore((s) => s.online);

  useEffect(() => {
    cachedFetch<{ classes: ClassInfo[] }>('/api/classes').then((d) => {
      if (d?.classes) {
        setClasses(d.classes);
        if (d.classes[0]) setClassId(d.classes[0].id);
      }
    });
  }, []);

  const load = useCallback(async () => {
    if (!classId) return;
    setRoster(null);
    const data = await cachedFetch<Roster>(`/api/attendance?classId=${classId}&date=${date}`);
    if (data) {
      setRoster(data);
      const m: Record<string, string> = {};
      for (const r of data.roster) m[r.studentId] = r.status ?? '';
      setMarks(m);
      setDirty(false);
    }
  }, [classId, date]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    let marked = 0;
    for (const s of STATUSES) counts[s.key] = 0;
    for (const r of roster?.roster ?? []) {
      const m = marks[r.studentId];
      if (m) {
        counts[m] = (counts[m] ?? 0) + 1;
        marked += 1;
      }
    }
    return { counts, marked, total: roster?.roster.length ?? 0 };
  }, [marks, roster]);

  async function save() {
    if (!roster || !classId) return;
    setSaving(true);
    const entries = roster.roster
      .filter((r) => marks[r.studentId] && marks[r.studentId] !== r.status)
      .map((r) => ({ studentId: r.studentId, status: marks[r.studentId], date, sessionType: 'morning' }));

    if (entries.length === 0) {
      setSaving(false);
      return;
    }

    if (online) {
      // direct bulk save (fast path)
      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, date, sessionType: 'morning', marks: entries }),
      });
      if (res.ok) {
        const d = await res.json();
        ToastIfy.success(`Attendance saved — ${d.created} new, ${d.updated} corrected`);
        await load();
      } else {
        ToastIfy.error('Save failed — queued locally');
        for (const e of entries) {
          await enqueueOperation({ entityType: 'attendance', opType: 'create', payload: { ...e, clientTimestamp: new Date().toISOString() } });
        }
      }
    } else {
      // offline: queue durable outbox operations (atomic local persistence)
      for (const e of entries) {
        await enqueueOperation({ entityType: 'attendance', opType: 'create', payload: { ...e, clientTimestamp: new Date().toISOString() } });
      }
      ToastIfy.info(`Recorded locally — ${entries.length} marks queued for sync`);
      setDirty(false);
    }
    setSaving(false);
  }

  function setAll(status: string) {
    if (!roster) return;
    const m = { ...marks };
    for (const r of roster.roster) {
      if (!m[r.studentId]) m[r.studentId] = status; // don't overwrite individual marks
    }
    setMarks(m);
    setDirty(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily attendance</h1>
          <p className="text-sm text-muted-foreground">Mark the morning register — works offline, syncs later</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          />
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent className="max-h-96">
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}{c.section ? ` (${c.section})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {roster && roster.dayType !== 'school_day' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
          Note: this date is marked as <strong>{roster.dayType.replace('_', ' ')}</strong> in the school calendar.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setAll('present')}><Users className="w-4 h-4 mr-1.5" /> Mark remaining present</Button>
        {stats.total > 0 && (
          <span className="text-sm text-muted-foreground">
            {stats.marked}/{stats.total} marked
          </span>
        )}
        <div className="flex-1" />
        {STATUSES.filter((s) => stats.counts[s.key] > 0).map((s) => (
          <Badge key={s.key} variant="secondary">{s.label}: {stats.counts[s.key]}</Badge>
        ))}
      </div>

      {!roster ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{roster.class.name} — {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> {stats.total} on roll
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {roster.roster.map((r, i) => (
              <div key={r.studentId} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${marks[r.studentId] ? '' : 'bg-muted/30'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground w-6 text-right">{r.rollNo ?? i + 1}</span>
                  <span className="font-medium text-sm truncate">{r.name}</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {STATUSES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => { setMarks({ ...marks, [r.studentId]: s.key }); setDirty(true); }}
                      className={`h-7 px-2 rounded-md text-[11px] font-medium transition-all ${
                        marks[r.studentId] === s.key
                          ? `${s.cls} text-white shadow-sm`
                          : 'bg-muted hover:bg-muted/70 text-muted-foreground'
                      }`}
                      title={s.label}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} disabled={saving || !dirty || !roster} size="lg" className="shadow-lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : online ? <Save className="w-4 h-4 mr-2" /> : <CloudOff className="w-4 h-4 mr-2" />}
          {online ? 'Save attendance' : 'Record locally'}
        </Button>
      </div>
    </div>
  );
}
