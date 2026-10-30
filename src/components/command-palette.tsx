'use client';

import { useEffect, useState } from 'react';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import {
  Home, CheckSquare, BookOpen, Wallet, Coins, Users, RefreshCw, BarChart3, FileText,
  Banknote, AlertTriangle, CalendarDays, Megaphone, Moon, Sun, LogOut, CloudUpload, Landmark,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { fullSync } from '@/lib/client-sync';

export type ViewKey =
  | 'dashboard' | 'attendance' | 'marks' | 'fees' | 'cashier' | 'students' | 'sync'
  | 'analytics' | 'reports' | 'payroll' | 'debtors' | 'timetable' | 'notices'
  | 'financials';

export const VIEW_META: Record<ViewKey, { label: string; icon: React.ComponentType<{ className?: string }>; group: string }> = {
  dashboard: { label: 'Overview', icon: Home, group: 'General' },
  analytics: { label: 'Analytics', icon: BarChart3, group: 'General' },
  attendance: { label: 'Attendance', icon: CheckSquare, group: 'Academics' },
  marks: { label: 'SBA Gradebook', icon: BookOpen, group: 'Academics' },
  reports: { label: 'Report Cards', icon: FileText, group: 'Academics' },
  timetable: { label: 'Timetable', icon: CalendarDays, group: 'Academics' },
  students: { label: 'Students', icon: Users, group: 'Academics' },
  fees: { label: 'Fees & Invoices', icon: Wallet, group: 'Finance' },
  cashier: { label: 'Collections', icon: Coins, group: 'Finance' },
  debtors: { label: 'Debtors & Arrears', icon: AlertTriangle, group: 'Finance' },
  payroll: { label: 'Payroll', icon: Banknote, group: 'Finance' },
  financials: { label: 'Financial Reports', icon: Landmark, group: 'Finance' },
  notices: { label: 'Notices', icon: Megaphone, group: 'Communications' },
  sync: { label: 'Sync Console', icon: RefreshCw, group: 'System' },
};

export function CommandPalette({
  open, setOpen, availableViews, onNavigate,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
  availableViews: ViewKey[];
  onNavigate: (v: ViewKey) => void;
}) {
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  function run(fn: () => void) {
    setOpen(false);
    fn();
  }

  const groups = ['General', 'Academics', 'Finance', 'Communications', 'System'];
  const visible = availableViews.filter((v) => v !== 'dashboard' || true);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="print:hidden">
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((g) => {
          const items = visible.filter((v) => VIEW_META[v].group === g);
          if (items.length === 0) return null;
          return (
            <CommandGroup key={g} heading={g}>
              {items.map((v) => {
                const Icon = VIEW_META[v].icon;
                return (
                  <CommandItem key={v} value={`${VIEW_META[v].label} ${v}`} onSelect={() => run(() => onNavigate(v))}>
                    <Icon className="w-4 h-4" />
                    {VIEW_META[v].label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem value="sync now synchronize" onSelect={() => run(() => fullSync())}>
            <CloudUpload className="w-4 h-4" />
            Sync now
          </CommandItem>
          <CommandItem
            value="toggle theme dark light mode"
            onSelect={() => run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} mode
          </CommandItem>
          <CommandItem
            value="sign out logout"
            onSelect={() => run(async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.reload();
            })}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
