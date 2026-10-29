'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useApp } from '@/components/app-provider';
import { useSyncStore, fullSync } from '@/lib/client-sync';
import type { ViewKey } from '@/components/portal';
import {
  School, Home, CheckSquare, BookOpen, Wallet, Coins, Users, RefreshCw,
  LogOut, Menu, WifiOff, Wifi, CloudUpload, ChevronDown, Settings,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home, check: CheckSquare, book: BookOpen, wallet: Wallet, coins: Coins, users: Users, refresh: RefreshCw,
};

export function AppShell({
  view, setView, availableViews, children,
}: {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  availableViews: ViewKey[];
  children: React.ReactNode;
}) {
  const { me } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const online = useSyncStore((s) => s.online);
  const outboxCount = useSyncStore((s) => s.outbox.filter((o) => o.status !== 'sending').length);
  const syncing = useSyncStore((s) => s.syncing);

  const NAV_LABELS: Record<ViewKey, string> = {
    dashboard: 'Overview', attendance: 'Attendance', marks: 'SBA Gradebook',
    fees: 'Fees & Invoices', cashier: 'Collections', students: 'Students', sync: 'Sync Console',
  };

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  }

  const roleLabel = me?.primaryRole?.replace('_', ' ') ?? 'user';
  const initials = me?.user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() ?? 'U';

  const renderNav = (onNavigate?: () => void) => (
    <nav className="space-y-1">
      {availableViews.map((key) => {
        const Icon = ICONS[key === 'dashboard' ? 'home' : key === 'attendance' ? 'check' : key === 'marks' ? 'book' : key === 'fees' ? 'wallet' : key === 'cashier' ? 'coins' : key === 'students' ? 'users' : 'refresh'] ?? Home;
        return (
          <button
            key={key}
            onClick={() => { setView(key); onNavigate?.(); }}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              view === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {NAV_LABELS[key]}
            {key === 'sync' && outboxCount > 0 && (
              <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-[10px]">{outboxCount}</Badge>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="flex h-14 items-center gap-3 px-4">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <div className="flex items-center gap-2 mb-6 mt-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <School className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold">iEduPro</span>
              </div>
              {renderNav(() => setMobileOpen(false))}
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <School className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">iEduPro</span>
          </div>

          <div className="flex-1" />

          {/* Sync status */}
          <button
            onClick={() => setView('sync')}
            className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-medium transition-colors ${
              !online ? 'text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950' : 'text-muted-foreground'
            }`}
            title={online ? 'Online — click for sync console' : 'Offline — captured work is stored locally'}
          >
            {!online ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
            {outboxCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] text-destructive-foreground">
                {outboxCount}
              </span>
            )}
          </button>

          <Button variant="ghost" size="icon" onClick={() => fullSync()} title="Sync now" disabled={syncing}>
            <CloudUpload className={`w-4 h-4 ${syncing ? 'animate-pulse' : ''}`} />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border p-0.5 pr-2 hover:bg-muted transition-colors">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium max-w-28 truncate">{me?.user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="text-sm font-medium">{me?.user.name}</div>
                <div className="text-xs text-muted-foreground font-normal capitalize">{roleLabel}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setView('sync')}>
                <RefreshCw className="w-4 h-4 mr-2" /> Sync console
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 flex-col border-r p-3 sticky top-14 h-[calc(100vh-3.5rem)]">
          <div className="mb-4 px-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1">Workspace</div>
          </div>
          {renderNav()}
          <div className="mt-auto p-3 rounded-lg bg-muted/50 text-[11px] text-muted-foreground leading-relaxed">
            iEduPro · Lightworld Technologies Ltd.
            <br />Ghana basic education platform
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 md:p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      <footer className="border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>© 2026 Lightworld Technologies Ltd.</span>
          <span className="capitalize">{roleLabel} portal</span>
        </div>
      </footer>
    </div>
  );
}
