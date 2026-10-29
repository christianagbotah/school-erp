'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { cachedFetch } from '@/lib/cached-fetch';

type StudentRow = {
  id: string; studentIdNo: string; name: string; firstName: string; middleName: string | null; lastName: string;
  gender: string; dateOfBirth: string | null; status: string;
  class: { id: string; name: string; campus: string } | null;
  guardians: { name: string; phone: string | null; relationship: string; isBillingResponsible: boolean; hasPickupAuthority: boolean }[];
};

export default function StudentsView() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [classId, setClassId] = useState('all');
  const [classes, setClasses] = useState<{ id: string; name: string; campus: string }[]>([]);

  useEffect(() => {
    cachedFetch<{ classes: { id: string; name: string; campus: string }[] }>('/api/classes').then((d) => setClasses(d?.classes ?? []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: '100', status: 'ACTIVE' });
    if (q) params.set('q', q);
    const d = await cachedFetch<{ students: StudentRow[] }>(`/api/students?${params}`);
    if (d) {
      const all: StudentRow[] = d.students ?? [];
      setStudents(classId === 'all' ? all : all.filter((s) => s.class?.id === classId));
    }
    setLoading(false);
  }, [q, classId]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">{students.length} active learners</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or ID…" className="pl-8 w-[220px]" />
          </div>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-96">
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Pickup</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const g = s.guardians[0];
                const initials = `${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase();
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={`text-xs ${s.gender === 'female' ? 'bg-pink-100 dark:bg-pink-900' : 'bg-emerald-100 dark:bg-emerald-900'}`}>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{s.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{s.gender} {s.dateOfBirth ? `· ${new Date(s.dateOfBirth).getFullYear()}` : ''}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{s.studentIdNo}</TableCell>
                    <TableCell>
                      <div className="text-sm">{s.class?.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{s.class?.campus}</div>
                    </TableCell>
                    <TableCell>
                      {g ? (
                        <div>
                          <div className="text-sm">{g.name} <span className="text-xs text-muted-foreground capitalize">({g.relationship})</span></div>
                          <div className="text-xs text-muted-foreground">{g.phone}</div>
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {g && <Badge variant={g.hasPickupAuthority ? 'default' : 'destructive'} className="text-[10px]">{g.hasPickupAuthority ? 'Authorized' : 'Restricted'}</Badge>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
