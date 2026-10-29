'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Banknote, FileCheck2, Landmark, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/components/app-provider';

type PayrollData = {
  month: string;
  status: string | null;
  payRunId: string | null;
  rulePack: { version: string; effectiveFrom: string };
  items: {
    staffId: string; name: string; position: string; gross: number; allowances: number;
    ssnitTier1Employee: number; ssnitTier2Employer: number; paye: number; totalDeductions: number; net: number;
  }[];
  totals: { gross: number; deductions: number; net: number; tier1Employee: number; tier2Employer: number; paye: number; headcount: number };
  totalsFormatted: { gross: string; deductions: string; net: string; tier1Employee: string; tier2Employer: string; paye: string };
  payRuns: { id: string; month: string; status: string; headcount: number; totalGrossFormatted: string; totalNetFormatted: string; approvedAt: string | null }[];
};

export default function PayrollView() {
  const { me } = useApp();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${m}`, { cache: 'no-store' });
      if (res.ok) {
        setData(await res.json());
        setError(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Payroll unavailable for your role.');
        setData(null);
      }
    } catch {
      setError('Payroll unavailable offline.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(month); }, [month, load]);

  async function act(action: 'save' | 'approve') {
    setBusy(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, month }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: 'Payroll action failed', description: d.error ?? 'Unknown error', variant: 'destructive' });
        return;
      }
      if (action === 'approve') {
        toast({
          title: `Pay run for ${month} approved`,
          description: `Net ₵${(d.totals.net / 100).toLocaleString()} · journal entry posted (Dr 5001 / Cr 2100 · 2110 · 2000)`,
        });
      } else {
        toast({ title: 'Preview saved', description: `Draft pay run for ${month} computed with rule pack ${data?.rulePack.version}.` });
      }
      load(month);
    } catch {
      toast({ title: 'Network error', description: 'Could not reach the payroll API.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  const canAct = me?.roles.some((r) => ['bursar', 'accountant', 'headteacher', 'proprietor'].includes(r)) ?? false;
  const approved = data?.status === 'approved' || data?.status === 'paid';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (error || !data) return <div className="text-muted-foreground p-8 text-center">{error ?? 'Payroll unavailable.'}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-sm text-muted-foreground">
            Ghana statutory computation — rule pack {data.rulePack.version} (SSNIT 5% employee / 5% employer Tier 2 · GRA PAYE)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[170px]" />
          {data.status && (
            <Badge variant={approved ? 'default' : 'secondary'} className="capitalize h-9 px-3">
              {data.status}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Users className="w-4 h-4" />} label="Staff on payroll" value={String(data.totals.headcount)} />
        <Kpi icon={<Banknote className="w-4 h-4" />} label="Gross (base + allowances)" value={data.totalsFormatted.gross} />
        <Kpi icon={<Landmark className="w-4 h-4" />} label="Statutory deductions" value={data.totalsFormatted.deductions} sub={`SSNIT ${data.totalsFormatted.tier1Employee} · PAYE ${data.totalsFormatted.paye}`} tone="amber" />
        <Kpi icon={<FileCheck2 className="w-4 h-4" />} label="Net pay" value={data.totalsFormatted.net} sub={`Employer Tier 2 cost ${data.totalsFormatted.tier2Employer}`} tone="emerald" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Pay schedule — {month}</CardTitle>
              <CardDescription>
                {approved ? 'Approved pay run — immutable. Journal posted to the general ledger.' : 'Live computation from staff salary records. Save a preview, then approve to post the journal.'}
              </CardDescription>
            </div>
            {canAct && !approved && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => act('save')} disabled={busy}>Save preview</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={busy || data.items.length === 0} className="gap-2">
                      <FileCheck2 className="w-4 h-4" /> Approve &amp; post journal
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Approve payroll for {month}?</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2">
                          <p>
                            This will approve net pay of <strong>{data.totalsFormatted.net}</strong> across {data.totals.headcount} staff
                            and post a balanced journal entry: Dr 5001 Salaries ({data.totalsFormatted.gross} + Tier 2 employer {data.totalsFormatted.tier2Employer}),
                            Cr 2100 SSNIT Payable, Cr 2110 PAYE Payable, Cr 2000 Net Salaries Payable.
                          </p>
                          <p>The approved pay run becomes immutable. Verify SSNIT/GRA notices for the applicable month before a live disbursement.</p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => act('approve')}>Approve pay run</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No salaried staff configured for this school yet.</p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Staff</TableHead>
                    <TableHead className="text-xs text-right">Gross</TableHead>
                    <TableHead className="text-xs text-right">Allowances</TableHead>
                    <TableHead className="text-xs text-right">SSNIT Tier 1 (5%)</TableHead>
                    <TableHead className="text-xs text-right">PAYE</TableHead>
                    <TableHead className="text-xs text-right">Total deductions</TableHead>
                    <TableHead className="text-xs text-right">Net pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((i) => (
                    <TableRow key={i.staffId}>
                      <TableCell>
                        <div className="font-medium text-sm">{i.name}</div>
                        <div className="text-xs text-muted-foreground">{i.position}</div>
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{fmt(i.gross)}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums text-muted-foreground">{fmt(i.allowances)}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{fmt(i.ssnitTier1Employee)}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{fmt(i.paye)}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums text-rose-600 dark:text-rose-400">−{fmt(i.totalDeductions)}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{fmt(i.net)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell className="text-sm">Totals</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{fmt(data.totals.gross)}</TableCell>
                    <TableCell />
                    <TableCell className="text-sm text-right tabular-nums">{fmt(data.totals.tier1Employee)}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{fmt(data.totals.paye)}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">−{fmt(data.totals.deductions)}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(data.totals.net)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pay run history</CardTitle>
          <CardDescription>Immutable approved and previewed runs</CardDescription>
        </CardHeader>
        <CardContent>
          {data.payRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No pay runs yet — save a preview above to start.</p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Month</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Staff</TableHead>
                    <TableHead className="text-xs text-right">Gross</TableHead>
                    <TableHead className="text-xs text-right">Net</TableHead>
                    <TableHead className="text-xs text-right">Approved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payRuns.map((p) => (
                    <TableRow key={p.id} className={p.month === month ? 'bg-muted/40' : ''}>
                      <TableCell className="text-sm font-medium">{p.month}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{p.headcount}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{p.totalGrossFormatted}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{p.totalNetFormatted}</TableCell>
                      <TableCell className="text-xs text-muted-foreground text-right">{p.approvedAt ? new Date(p.approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved' || status === 'paid') return <Badge className="text-[10px] capitalize">{status}</Badge>;
  if (status === 'failed') return <Badge variant="destructive" className="text-[10px] capitalize">{status}</Badge>;
  return <Badge variant="secondary" className="text-[10px] capitalize">{status}</Badge>;
}

function Kpi({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: 'emerald' | 'amber' }) {
  const bg = tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : tone === 'amber' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-primary/10 text-primary';
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>{icon}</div>
        </div>
        <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function fmt(pesewas: number): string {
  return `₵${(pesewas / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
