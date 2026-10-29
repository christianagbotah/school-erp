'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Loader2 } from 'lucide-react';
import { ToastIfy } from '@/components/toastify';
import { cachedFetch } from '@/lib/cached-fetch';

type MarkData = {
  class: { id: string; name: string; stageKey: string };
  term: { id: string; name: string } | null;
  subjects: { id: string; code: string; name: string }[];
  profiles: { id: string; name: string; provenance: string; components: { code: string; name: string; weight: number; maxScore: number }[] }[];
  students: { id: string; name: string; rollNo: number | null; entries: { subjectClassId: string; component: string; rawScore: number | null; maxScore: number; status: string }[] }[];
};

const STATUS_COLORS: Record<string, string> = {
  marked: '',
  missing: 'bg-amber-100 dark:bg-amber-950',
  absent: 'bg-red-100 dark:bg-red-950',
  exempt: 'bg-violet-100 dark:bg-violet-950',
};

export default function MarksView() {
  const [data, setData] = useState<MarkData | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string; stageKey: string }[]>([]);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({}); // "studentId:component" → raw value
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cachedFetch<{ classes: MarkData['class'][] }>('/api/classes').then((d) => {
      const cls = (d?.classes ?? []).filter((c) => ['lower_primary', 'upper_primary', 'jhs'].includes(c.stageKey));
      setClasses(cls);
      if (cls[0]) setClassId(cls[0].id);
    });
  }, []);

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    const res = await fetch(`/api/marks?classId=${classId}${subjectId ? `&subjectClassId=${subjectId}` : ''}`, { cache: 'no-store' });
    if (res.ok) {
      setData(await res.json());
      if (!subjectId && (await res.json()).subjects) {
        // set default subject after load
      }
    }
    setLoading(false);
  }, [classId, subjectId]);

  // two-step load to pick default subject
  useEffect(() => {
    if (!classId) return;
    (async () => {
      setLoading(true);
      const d = await cachedFetch<MarkData>(`/api/marks?classId=${classId}`);
      if (d) {
        setData(d);
        if (!subjectId && d.subjects[0]) setSubjectId(d.subjects[0].id);
      }
      setLoading(false);
    })();
  }, [classId]);

  useEffect(() => {
    if (!classId || !subjectId) return;
    (async () => {
      setLoading(true);
      const d = await cachedFetch<MarkData>(`/api/marks?classId=${classId}&subjectClassId=${subjectId}`);
      if (d) setData(d);
      setLoading(false);
      setEdits({});
    })();
  }, [classId, subjectId]);

  const profile = useMemo(() => data?.profiles[0], [data]);
  const components = profile?.components ?? [];

  function cellKey(studentId: string, component: string) {
    return `${studentId}:${component}`;
  }

  function getEntry(student: MarkData['students'][number], component: string) {
    return student.entries.find((e) => e.subjectClassId === subjectId && e.component === component);
  }

  async function save() {
    if (!data || !data.term || !classId) return;
    setSaving(true);
    const entries = Object.entries(edits)
      .map(([key, value]) => {
        const [studentId, component] = key.split(':');
        const comp = components.find((c) => c.code === component);
        const parsed = value === '' ? null : Number(value);
        return {
          studentId, subjectClassId: subjectId, classId, termId: data.term!.id, component,
          rawScore: parsed, maxScore: comp?.maxScore ?? 100, status: parsed === null ? 'missing' : 'marked',
        };
      })
      .filter((e) => e.rawScore === null || (!Number.isNaN(e.rawScore) && e.rawScore >= 0 && e.rawScore <= e.maxScore));

    if (entries.length === 0) {
      ToastIfy.warning('No valid edits to save');
      setSaving(false);
      return;
    }
    const res = await fetch('/api/marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    });
    const d = await res.json();
    if (res.ok) {
      ToastIfy.success(`Saved — ${d.created} new, ${d.updated} updated${d.rejected.length ? `, ${d.rejected.length} rejected` : ''}`);
      setEdits({});
      // reload
      const r2 = await fetch(`/api/marks?classId=${classId}&subjectClassId=${subjectId}`, { cache: 'no-store' });
      if (r2.ok) setData(await r2.json());
    } else {
      ToastIfy.error(d.error ?? 'Save failed');
    }
    setSaving(false);
  }

  const dirtyCount = Object.keys(edits).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SBA gradebook</h1>
          <p className="text-sm text-muted-foreground">
            {profile ? `${profile.name} — raw marks preserved, weighted totals computed per policy` : 'Continuous assessment entry grid'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={classId} onValueChange={(v) => { setClassId(v); setSubjectId(''); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent className="max-h-96">
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent className="max-h-96">
              {(data?.subjects ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading || !data ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{data.class.name} — {data.subjects.find((s) => s.id === subjectId)?.name}</CardTitle>
            <CardDescription>
              {components.map((c) => (
                <Badge key={c.code} variant="outline" className="mr-1.5 text-[10px]">
                  {c.name} · {c.weight}% (max {c.maxScore})
                </Badge>
              ))}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-2 font-medium w-10">#</th>
                  <th className="text-left py-2 pr-2 font-medium min-w-[160px]">Student</th>
                  {components.map((c) => (
                    <th key={c.code} className="text-center py-2 px-1 font-medium min-w-[90px]">{c.name}</th>
                  ))}
                  <th className="text-center py-2 px-1 font-medium min-w-[70px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((student, i) => {
                  const marks = components.map((c) => {
                    const entry = getEntry(student, c.code);
                    const editKey = cellKey(student.id, c.code);
                    const editVal = edits[editKey];
                    return { entry, editVal, editKey };
                  });
                  // weighted total from saved + unsaved edits
                  const parts = marks.map((m, idx) => {
                    const val = m.editVal !== undefined ? (m.editVal === '' ? null : Number(m.editVal)) : m.entry?.rawScore ?? null;
                    return { amount: val ?? 0, weight: components[idx].weight, has: val !== null };
                  });
                  const totalWeight = parts.filter((p) => p.has).reduce((s, p) => s + p.weight, 0);
                  const total = totalWeight > 0 ? Math.round(parts.reduce((s, p) => s + p.amount * p.weight, 0) / totalWeight) : null;
                  return (
                    <tr key={student.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-1.5 pr-2 text-xs text-muted-foreground">{student.rollNo ?? i + 1}</td>
                      <td className="py-1.5 pr-2 font-medium">{student.name}</td>
                      {marks.map((m) => {
                        const status = m.entry?.status;
                        return (
                          <td key={m.editKey} className={`px-1 py-1 text-center ${status ? STATUS_COLORS[status] ?? '' : ''}`}>
                            <input
                              value={m.editVal ?? (m.entry?.rawScore ?? '')}
                              onChange={(e) => setEdits({ ...edits, [m.editKey]: e.target.value })}
                              inputMode="numeric"
                              className={`w-14 h-8 text-center rounded-md border ${m.editVal !== undefined ? 'border-primary ring-1 ring-primary' : 'border-input'} bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/40`}
                              placeholder={status === 'absent' ? 'A' : status === 'exempt' ? 'E' : '—'}
                            />
                          </td>
                        );
                      })}
                      <td className="px-1 py-1 text-center font-semibold">{total ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {dirtyCount > 0 && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={save} disabled={saving} size="lg" className="shadow-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save {dirtyCount} mark{dirtyCount > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
}
