'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Printer, CloudOff, Receipt, CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { formatMoney, parseMoneyToPesewas } from '@/lib/money';
import { enqueueOperation, useSyncStore } from '@/lib/client-sync';
import { ToastIfy } from '@/components/toastify';

type SearchHit = { id: string; studentIdNo: string; name: string; class: string; arrears: number; guardianPhone: string | null };
type InvoiceRow = { id: string; invoiceNo: string; student: { name: string; studentIdNo: string }; total: number; amountPaid: number; balance: number; balanceFormatted: string; status: string; dueDate: string };

export default function CashierView() {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchHit | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState<InvoiceRow | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [posting, setPosting] = useState(false);
  const [receipt, setReceipt] = useState<{ ref: string; amount: string; student: string; offline?: boolean } | null>(null);
  const online = useSyncStore((s) => s.online);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const d = await res.json();
        setHits(d.students ?? []);
      }
      setSearching(false);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function openStudent(s: SearchHit) {
    setSelected(s);
    setQuery('');
    setHits([]);
    const res = await fetch(`/api/fees/invoices?studentId=${s.id}&pageSize=50`);
    if (res.ok) {
      const d = await res.json();
      setInvoices(d.invoices ?? []);
    }
  }

  function startPayment(inv: InvoiceRow) {
    setPayInvoice(inv);
    setAmount((inv.balance / 100).toFixed(2));
    setPayOpen(true);
  }

  async function submitPayment() {
    if (!payInvoice || !selected) return;
    let pesewas: number;
    try {
      pesewas = parseMoneyToPesewas(amount);
    } catch {
      ToastIfy.error('Invalid amount');
      return;
    }
    setPosting(true);
    try {
      if (online) {
        const res = await fetch('/api/fees/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: selected.id, invoiceId: payInvoice.id, method, amount: pesewas }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        setReceipt({ ref: d.payment.paymentRef, amount: formatMoney(pesewas), student: selected.name });
        setPayOpen(false);
        // refresh invoices
        const r2 = await fetch(`/api/fees/invoices?studentId=${selected.id}&pageSize=50`);
        if (r2.ok) setInvoices((await r2.json()).invoices);
      } else {
        // offline: durable local receipt with unique number; sync later
        const offlineReceiptNo = `OFF-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        await enqueueOperation({
          entityType: 'payment',
          opType: 'create',
          payload: { studentId: selected.id, invoiceId: payInvoice.id, method, amount: pesewas, offlineReceiptNo, clientTimestamp: new Date().toISOString() },
        });
        setReceipt({ ref: offlineReceiptNo, amount: formatMoney(pesewas), student: selected.name, offline: true });
        setPayOpen(false);
      }
    } catch (e) {
      ToastIfy.error((e as Error).message || 'Payment failed');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
        <p className="text-sm text-muted-foreground">Fast fee collection — search, collect, receipt. Works offline with durable local receipts.</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student by name or admission number…"
              className="pl-9 h-11 text-base"
              autoFocus
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          {hits.length > 0 && (
            <div className="mt-2 rounded-lg border divide-y max-h-96 overflow-y-auto">
              {hits.map((h) => (
                <button key={h.id} onClick={() => openStudent(h)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 text-left">
                  <div>
                    <div className="font-medium text-sm">{h.name}</div>
                    <div className="text-xs text-muted-foreground">{h.studentIdNo} · {h.class}</div>
                  </div>
                  <div className={`text-sm font-semibold ${h.arrears > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    {h.arrears > 0 ? formatMoney(h.arrears) : 'Cleared'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected student: invoice list */}
      {selected && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{selected.name}</CardTitle>
            <CardDescription>
              {selected.studentIdNo} · {selected.class}
              {selected.arrears > 0 && <span className="text-destructive font-medium"> — owes {formatMoney(selected.arrears)}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices on record.</p>
            ) : (
              <div className="rounded-lg border divide-y">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <div className="font-medium text-sm">{inv.invoiceNo}</div>
                      <div className="text-xs text-muted-foreground">Due {new Date(inv.dueDate).toLocaleDateString('en-GB')}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'partially_paid' ? 'secondary' : 'destructive'} className="capitalize">
                        {inv.status.replace('_', ' ')}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatMoney(inv.total)}</div>
                        {inv.balance > 0 && <div className="text-xs text-destructive">Bal {inv.balanceFormatted}</div>}
                      </div>
                      {inv.balance > 0 && (
                        <Button size="sm" onClick={() => startPayment(inv)}>
                          <Wallet className="w-4 h-4 mr-1.5" /> Collect
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect payment</DialogTitle>
            <DialogDescription>
              {payInvoice?.invoiceNo} · {selected?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amt">Amount (₵)</Label>
              <Input id="amt" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="text-lg font-semibold h-12" />
              {payInvoice && (
                <p className="text-xs text-muted-foreground">Balance: {payInvoice.balanceFormatted}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="momo">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={submitPayment} disabled={posting}>
              {posting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : online ? null : <CloudOff className="w-4 h-4 mr-2" />}
              {online ? 'Post payment' : 'Record locally & receipt'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt */}
      <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" /> Receipt
            </DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="space-y-3 font-mono text-sm">
              <div className="text-center border-b pb-3">
                <div className="font-sans font-bold">Lightworld Academy</div>
                <div className="text-xs text-muted-foreground">Adenta Municipal Road, Accra</div>
              </div>
              <div className="flex justify-between"><span>Ref:</span><span className="font-bold">{receipt.ref}</span></div>
              <div className="flex justify-between"><span>Student:</span><span>{receipt.student}</span></div>
              <div className="flex justify-between"><span>Amount:</span><span className="font-bold">{receipt.amount}</span></div>
              <div className="flex justify-between"><span>Date:</span><span>{new Date().toLocaleString('en-GB')}</span></div>
              {receipt.offline && (
                <div className="rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs p-2 flex items-center gap-1.5">
                  <CloudOff className="w-3.5 h-3.5" /> Recorded locally — will sync when online
                </div>
              )}
              <div className="border-t pt-2 text-center text-xs text-muted-foreground">Thank you — powered by iEduPro</div>
              <Button variant="outline" className="w-full" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
