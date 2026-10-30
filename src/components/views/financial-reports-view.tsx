'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Landmark, Printer, CheckCircle2, XCircle } from 'lucide-react';
import { formatMoney } from '@/lib/money';

type StatementRow = { code: string; name: string; type: string; amount: number; hasActivity: boolean };
type TBRow = {
  code: string; name: string; type: string;
  debits: number; credits: number; balanceDebit: number; balanceCredit: number; hasActivity: boolean;
};

type TrialBalanceData = {
  rows: TBRow[];
  totals: { debits: number; credits: number };
  balanced: boolean;
};
type IncomeStatementData = {
  revenue: { rows: StatementRow[]; total: number };
  expense: { rows: StatementRow[]; total: number };
  totalRevenue: number; totalExpense: number; netIncome: number;
  period: { from: string; to: string };
};
type BalanceSheetData = {
  assets: { rows: StatementRow[]; total: number };
  liabilities: { rows: StatementRow[]; total: number };
  equity: { rows: StatementRow[]; total: number };
  netIncomeToDate: number;
  totals: { assets: number; liabilitiesAndEquity: number };
  balanced: boolean;
  asOf: string;
};

type ReportType = 'trial-balance' | 'income-statement' | 'balance-sheet';

const TYPE_LABELS: Record<ReportType, string> = {
  'trial-balance': 'Trial Balance',
  'income-statement': 'Income Statement',
  'balance-sheet': 'Balance Sheet',
};

export default function FinancialReportsView() {
  const [type, setType] = useState<ReportType>('trial-balance');
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(`${today.slice(0, 4)}-01-01`);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<{
    school: { name: string };
    trialBalance?: TrialBalanceData;
    incomeStatement?: IncomeStatementData;
    balanceSheet?: BalanceSheetData;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/reports?type=${type}&from=${from}&to=${to}`, { cache: 'no-store' });
      if (res.ok) {
        setData(await res.json());
        setError(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? 'Financial reports are unavailable for your role.');
      }
    } catch {
      setError('Financial reports are unavailable offline.');
    } finally {
      setLoading(false);
    }
  }, [type, from, to]);

  useEffect(() => { load(); }, [load]);

  const balancedBadge = (balanced: boolean) => (
    <Badge variant="outline" className={balanced
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800'}>
      {balanced ? <><CheckCircle2 className="w-3 h-3 mr-1" />Balanced</> : <><XCircle className="w-3 h-3 mr-1" />Out of balance</>}
    </Badge>
  );

  const periodLabel = type === 'balance-sheet' ? `As at ${to}` : `${from} → ${to}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" /> Financial reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Statements built from the posted double-entry ledger — trial balance, income statement, balance sheet
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" aria-label="From date" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" aria-label="To date" />
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <Tabs value={type} onValueChange={(v) => setType(v as ReportType)} className="print:hidden">
        <TabsList>
          <TabsTrigger value="trial-balance">Trial balance</TabsTrigger>
          <TabsTrigger value="income-statement">Income statement</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance sheet</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-96" />
        </div>
      ) : error || !data ? (
        <div className="text-muted-foreground p-8 text-center">{error ?? 'Financial reports unavailable.'}</div>
      ) : (
        <Card className="print-area">
          <CardContent className="pt-6">
            <div className="hidden print:block mb-4 text-center">
              <h2 className="text-lg font-bold">{data.school.name}</h2>
              <p className="text-sm text-muted-foreground">{TYPE_LABELS[type]} — {periodLabel}</p>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">{TYPE_LABELS[type]}</h2>
                <p className="text-xs text-muted-foreground">{periodLabel} · posted entries only</p>
              </div>
              {type === 'trial-balance' && data.trialBalance && balancedBadge(data.trialBalance.balanced)}
              {type === 'balance-sheet' && data.balanceSheet && balancedBadge(data.balanceSheet.balanced)}
            </div>

            {type === 'trial-balance' && data.trialBalance && <TrialBalanceTable d={data.trialBalance} />}
            {type === 'income-statement' && data.incomeStatement && <IncomeStatementTable d={data.incomeStatement} />}
            {type === 'balance-sheet' && data.balanceSheet && <BalanceSheetTable d={data.balanceSheet} />}

            <p className="hidden print:block text-xs text-muted-foreground mt-4">
              Generated by iEduPro · Lightworld Technologies Ltd.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TrialBalanceTable({ d }: { d: TrialBalanceData }) {
  const active = d.rows.filter((r) => r.hasActivity || r.debits !== 0 || r.credits !== 0);
  return (
    <div className="rounded-lg border overflow-x-auto print:border-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Code</TableHead>
            <TableHead className="text-xs">Account</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs text-right">Debits</TableHead>
            <TableHead className="text-xs text-right">Credits</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {active.map((r) => (
            <TableRow key={r.code}>
              <TableCell className="font-mono text-xs">{r.code}</TableCell>
              <TableCell className="text-sm">{r.name}</TableCell>
              <TableCell className="text-xs capitalize text-muted-foreground">{r.type}</TableCell>
              <TableCell className="text-sm text-right tabular-nums">{r.debits !== 0 ? formatMoney(r.debits) : '—'}</TableCell>
              <TableCell className="text-sm text-right tabular-nums">{r.credits !== 0 ? formatMoney(r.credits) : '—'}</TableCell>
            </TableRow>
          ))}
          {active.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">No posted journal activity yet.</TableCell></TableRow>
          )}
          <TableRow className="font-semibold border-t-2">
            <TableCell colSpan={3} className="text-sm">Totals</TableCell>
            <TableCell className="text-sm text-right tabular-nums">{formatMoney(d.totals.debits)}</TableCell>
            <TableCell className="text-sm text-right tabular-nums">{formatMoney(d.totals.credits)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function StatementSection({ title, amountLabel, rows, total }: { title: string; amountLabel: string; rows: StatementRow[]; total: number }) {
  return (
    <>
      <TableRow className="bg-muted/50">
        <TableCell colSpan={2} className="text-xs font-semibold uppercase tracking-wide">{title}</TableCell>
        <TableCell className="text-xs text-right text-muted-foreground">{amountLabel}</TableCell>
      </TableRow>
      {rows.map((r, i) => (
        <TableRow key={`${r.code}-${i}`}>
          <TableCell className="font-mono text-xs w-20">{r.code}</TableCell>
          <TableCell className="text-sm">{r.name}</TableCell>
          <TableCell className="text-sm text-right tabular-nums">{formatMoney(r.amount)}</TableCell>
        </TableRow>
      ))}
      {rows.length === 0 && (
        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4 text-sm">No activity in this period.</TableCell></TableRow>
      )}
      <TableRow className="font-medium border-t">
        <TableCell colSpan={2} className="text-sm">Total {title.toLowerCase()}</TableCell>
        <TableCell className="text-sm text-right tabular-nums">{formatMoney(total)}</TableCell>
      </TableRow>
    </>
  );
}

function IncomeStatementTable({ d }: { d: IncomeStatementData }) {
  return (
    <div className="rounded-lg border overflow-x-auto print:border-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs w-20">Code</TableHead>
            <TableHead className="text-xs">Account</TableHead>
            <TableHead className="text-xs text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <StatementSection title="Revenue" amountLabel="Amount" rows={d.revenue.rows} total={d.revenue.total} />
          <StatementSection title="Expenses" amountLabel="Amount" rows={d.expense.rows} total={d.expense.total} />
          <TableRow className="font-bold border-t-2 bg-primary/5">
            <TableCell colSpan={2} className="text-sm">
              {d.netIncome >= 0 ? 'Net surplus for the period' : 'Net deficit for the period'}
            </TableCell>
            <TableCell className={`text-sm text-right tabular-nums ${d.netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatMoney(d.netIncome)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function BalanceSheetTable({ d }: { d: BalanceSheetData }) {
  return (
    <div className="rounded-lg border overflow-x-auto print:border-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs w-20">Code</TableHead>
            <TableHead className="text-xs">Account</TableHead>
            <TableHead className="text-xs text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <StatementSection title="Assets" amountLabel="Balance" rows={d.assets.rows} total={d.assets.total} />
          <StatementSection title="Liabilities" amountLabel="Balance" rows={d.liabilities.rows} total={d.liabilities.total} />
          <StatementSection title="Equity" amountLabel="Balance" rows={d.equity.rows} total={d.equity.total} />
          <TableRow className="font-bold border-t-2 bg-primary/5">
            <TableCell colSpan={2} className="text-sm">Assets = Liabilities + Equity</TableCell>
            <TableCell className={`text-sm text-right tabular-nums ${d.balanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatMoney(d.totals.assets)} = {formatMoney(d.totals.liabilitiesAndEquity)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
