'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Phone, Printer, MailOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Debtor = {
  studentId: string; studentIdNo: string; name: string; className: string;
  guardianName: string | null; guardianPhone: string | null;
  billed: number; paid: number; balance: number;
  oldestDue: string | null; invoiceCount: number;
  current: number; d1_30: number; d31_60: number; d60plus: number;
  balanceFormatted: string; currentFormatted: string; d1_30Formatted: string; d31_60Formatted: string; d60plusFormatted: string;
};

type DebtorsData = {
  school: { name: string; phone: string | null };
  debtors: Debtor[];
  totals: { debtors: number; outstanding: number; current: number; d1_30: number; d31_60: number; d60plus: number };
  totalsFormatted: { outstanding: string; current: string; d1_30: string; d31_60: string; d60plus: string };
};

export default function DebtorsView() {
  const [data, setData] = useState<DebtorsData | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [classFilter, setClassFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Debtor | null>(null);
  const [reminderNote, setReminderNote] = useState('');

  useEffect(() => {
    fetch('/api/classes', { cache: 'no-store' }).then((r) => r.json()).then((d) => setClasses(d.classes ?? [])).catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/debtors?classId=${classFilter}`, { cache: 'no-store' });
      if (res.ok) {
        setData(await res.json());
        setError(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Debtors report unavailable for your role.');
      }
    } catch {
      setError('Debtors report unavailable offline.');
    } finally {
      setLoading(false);
    }
  }, [classFilter]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (error || !data) return <div className="text-muted-foreground p-8 text-center">{error ?? 'Debtors report unavailable.'}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Debtors &amp; arrears</h1>
          <p className="text-sm text-muted-foreground">Outstanding balances with aging analysis and guardian contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-96">
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => window.print()} className="gap-2 print:hidden">
            <Printer className="w-4 h-4" /> Print report
          </Button>
        </div>
      </div>

      {/* Aging summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AgingCard label="Total outstanding" value={data.totalsFormatted.outstanding} count={`${data.totals.debtors} students`} tone="rose" />
        <AgingCard label="Current (not yet due)" value={data.totalsFormatted.current} tone="emerald" />
        <AgingCard label="1–30 days past due" value={data.totalsFormatted.d1_30} tone="amber" />
        <AgingCard label="31–60 / 60+ days" value={`${data.totalsFormatted.d31_60} / ${data.totalsFormatted.d60plus}`} tone="rose" />
      </div>

      {/* Table */}
      <Card className="print-area">
        <CardContent className="pt-6">
          <div className="hidden print:block mb-4 text-center">
            <h2 className="text-lg font-bold">{data.school.name}</h2>
            <p className="text-sm text-muted-foreground">Debtors report — {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="rounded-lg border overflow-x-auto print:border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs">Guardian</TableHead>
                  <TableHead className="text-xs text-right">Current</TableHead>
                  <TableHead className="text-xs text-right">1–30d</TableHead>
                  <TableHead className="text-xs text-right">31–60d</TableHead>
                  <TableHead className="text-xs text-right">60+d</TableHead>
                  <TableHead className="text-xs text-right">Balance</TableHead>
                  <TableHead className="text-xs print:hidden" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.debtors.map((d) => (
                  <TableRow key={d.studentId}>
                    <TableCell>
                      <div className="font-medium text-sm">{d.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{d.studentIdNo}</div>
                    </TableCell>
                    <TableCell className="text-sm">{d.className}</TableCell>
                    <TableCell>
                      {d.guardianName ? (
                        <div>
                          <div className="text-sm">{d.guardianName}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{d.guardianPhone ?? '—'}</div>
                        </div>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{d.current > 0 ? d.currentFormatted : '—'}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-amber-600 dark:text-amber-400">{d.d1_30 > 0 ? d.d1_30Formatted : '—'}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-orange-600 dark:text-orange-400">{d.d31_60 > 0 ? d.d31_60Formatted : '—'}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-rose-600 dark:text-rose-400">{d.d60plus > 0 ? d.d60plusFormatted : '—'}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums font-semibold">{d.balanceFormatted}</TableCell>
                    <TableCell className="print:hidden">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5 text-xs"
                        onClick={() => {
                          setSelected(d);
                          setReminderNote(
                            `Kindly settle the outstanding balance of ${d.balanceFormatted} on ${d.name}'s account at your earliest convenience. ` +
                            `Payments are accepted at the school office (cash), via mobile money, or by bank transfer. ` +
                            `Please quote the admission number ${d.studentIdNo} when paying.`
                          );
                        }}
                      >
                        <MailOpen className="w-3.5 h-3.5" /> Remind
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {data.debtors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">No outstanding balances — fully collected.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="hidden print:block text-xs text-muted-foreground mt-4">
            Total outstanding: {data.totalsFormatted.outstanding} across {data.totals.debtors} students · Generated by iEduPro
          </p>
        </CardContent>
      </Card>

      {/* Reminder letter dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Fee reminder letter</DialogTitle>
            <DialogDescription>Review, edit and print the reminder for {selected?.name}. The school keeps full discretion over tone and follow-up.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Guardian</label>
                <Input value={`${selected.guardianName ?? 'Parent / Guardian'} — ${selected.className}`} readOnly className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <Textarea value={reminderNote} onChange={(e) => setReminderNote(e.target.value)} rows={6} className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            <Button onClick={() => window.print()} className="gap-2">
              <Printer className="w-4 h-4" /> Print letter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable letter area */}
      {selected && (
        <div className="print-area fixed inset-0 -z-10 opacity-0 pointer-events-none print:opacity-100 print:z-50 print:static">
          <div className="p-10 bg-white text-black max-w-[680px] mx-auto">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h2 className="text-xl font-bold">{data.school.name}</h2>
              <p className="text-sm">{data.school.phone ? `Tel: ${data.school.phone} · ` : ''}Adenta Municipal Road, Accra</p>
            </div>
            <div className="text-sm space-y-4">
              <p>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p><strong>{selected.guardianName ?? 'Parent / Guardian'}</strong><br />{data.school.name}<br />Accra</p>
              <p>Dear {selected.guardianName ? selected.guardianName.split(' ')[0] : 'Parent'},</p>
              <p><strong>RE: Outstanding school fees — {selected.name} ({selected.studentIdNo}, {selected.className})</strong></p>
              <p className="leading-relaxed">{reminderNote}</p>
              <p className="leading-relaxed">If you have already made arrangements or expect to have difficulty meeting this obligation, kindly contact the school office so we can discuss a payment plan.</p>
              <p>Thank you for your continued partnership.</p>
              <p className="pt-4">Yours faithfully,</p>
              <p className="pt-6 border-t border-black inline-block pr-20"><strong>Bursar</strong><br />{data.school.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgingCard({ label, value, count, tone }: { label: string; value: string; count?: string; tone?: 'rose' | 'amber' | 'emerald' }) {
  const cls = tone === 'rose' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : tone === 'amber' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls}`}><AlertTriangle className="w-4 h-4" /></div>
        </div>
        <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
        {count && <div className="text-xs text-muted-foreground mt-1">{count}</div>}
      </CardContent>
    </Card>
  );
}
