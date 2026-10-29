'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Receipt, ArrowUpDown } from 'lucide-react';
import { formatMoney } from '@/lib/money';

type InvoiceRow = {
  id: string; invoiceNo: string; student: { name: string; studentIdNo: string };
  issueDate: string; dueDate: string; total: number; amountPaid: number; balance: number;
  balanceFormatted: string; status: string; totalFormatted: string;
  lines: { id: string; description: string; amount: number; cadence: string }[];
  discounts: { id: string; label: string; amount: number }[];
};

const STATUS_BADGE: Record<string, string> = {
  paid: 'default',
  outstanding: 'destructive',
  partially_paid: 'secondary',
  void: 'outline',
};

export default function FeesView() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '25' });
    if (status !== 'all') params.set('status', status);
    const res = await fetch(`/api/fees/invoices?${params}`, { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      setInvoices(d.invoices ?? []);
    }
    setLoading(false);
  }, [status, page]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  function exportCsv() {
    const rows = [['Invoice', 'Student', 'Admission No', 'Total (GHS)', 'Paid (GHS)', 'Balance (GHS)', 'Status', 'Due Date']];
    for (const inv of invoices) {
      rows.push([
        inv.invoiceNo, inv.student.name, inv.student.studentIdNo,
        (inv.total / 100).toFixed(2), (inv.amountPaid / 100).toFixed(2), (inv.balance / 100).toFixed(2),
        inv.status, new Date(inv.dueDate).toLocaleDateString('en-GB'),
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totals = invoices.reduce(
    (acc, i) => ({ billed: acc.billed + i.total, collected: acc.collected + i.amountPaid }),
    { billed: 0, collected: 0 }
  );

  return (
    <div className="space-y-4" id="fees">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fees &amp; invoices</h1>
          <p className="text-sm text-muted-foreground">
            {invoices.length > 0 && <>Billed {formatMoney(totals.billed)} · Collected {formatMoney(totals.collected)} · Outstanding {formatMoney(totals.billed - totals.collected)}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="outstanding">Outstanding</SelectItem>
              <SelectItem value="partially_paid">Partially paid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <FileDown className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : invoices.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No invoices found for this filter.</CardContent></Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <>
                  <TableRow key={inv.id} className="cursor-pointer" onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                    <TableCell className="font-medium">{inv.invoiceNo}</TableCell>
                    <TableCell>
                      <div className="text-sm">{inv.student.name}</div>
                      <div className="text-xs text-muted-foreground">{inv.student.studentIdNo}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{inv.totalFormatted}</TableCell>
                    <TableCell className={`text-right font-medium ${inv.balance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>{inv.balanceFormatted}</TableCell>
                    <TableCell><Badge variant={STATUS_BADGE[inv.status] as never ?? 'outline'} className="capitalize">{inv.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-sm">{new Date(inv.dueDate).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell><ArrowUpDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded === inv.id ? 'rotate-180' : ''}`} /></TableCell>
                  </TableRow>
                  {expanded === inv.id && (
                    <TableRow key={inv.id + '-detail'}>
                      <TableCell colSpan={7} className="bg-muted/30">
                        <div className="py-2 space-y-2">
                          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Line items — why this student is charged</div>
                          {inv.lines.map((l) => (
                            <div key={l.id} className="flex justify-between text-sm">
                              <span>{l.description} <Badge variant="outline" className="ml-1 text-[10px] capitalize">{l.cadence}</Badge></span>
                              <span>{formatMoney(l.amount)}</span>
                            </div>
                          ))}
                          {inv.discounts.map((d) => (
                            <div key={d.id} className="flex justify-between text-sm text-emerald-700 dark:text-emerald-400">
                              <span>{d.label}</span>
                              <span>-{formatMoney(d.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-semibold border-t pt-2">
                            <span>Total</span>
                            <span>{inv.totalFormatted}</span>
                          </div>
                        </div>
                      </TableCell>
                    </ TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button variant="outline" size="sm" disabled={invoices.length < 25} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
