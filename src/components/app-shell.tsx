'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useApp } from '@/components/app-provider';
import { useSyncStore, fullSync } from '@/lib/client-sync';
import { VIEW_META, type ViewKey } from '@/components/command-palette';
import { CommandPalette } from '@/components/command-palette';
import { NotificationBell } from '@/components/notification-bell';
import { useTheme } from 'next-themes';
import {
  School, LogOut, Menu, WifiOff, Wifi, CloudUpload, ChevronDown, RefreshCw,
  Moon, Sun, Search, Command,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const GROUPS = ['General', 'Academics', 'Finance', 'Communications', 'System'];

export function AppShell({
  view, setView, availableViews, children,
}: {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  availableViews: ViewKey[];
  children: React.ReactNode;
}) {
  const { me } = useApp();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const online = useSyncStore((s) => s.online);
  const outboxCount = useSyncStore((s) => s.outbox.filter((o) => o.status !== 'sending').length);
  const syncing = useSyncStore((s) => s.syncing);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  }

  const roleLabel = me?.primaryRole?.replace('_', ' ') ?? 'user';
  const initials = me?.user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() ?? 'U';

  const renderNav = (onNavigate?: () => void) => (
    <nav className="space-y-4" aria-label="Main navigation">
      {GROUPS.map((group) => {
        const items = availableViews.filter((v) => VIEW_META[v].group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-1">{group}</div>
            <div className="space-y-1">
              {items.map((key) => {
                const { label, icon: Icon } = VIEW_META[key];
                return (
                  <button
                    key={key}
                    onClick={() => { setView(key); onNavigate?.(); }}
                    aria-current={view === key ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      view === key
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                    {key === 'sync' && outboxCount > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-[10px]">{outboxCount}</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} availableViews={availableViews} onNavigate={setView} />

      {/* Top bar */}
      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 print:hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 overflow-y-auto">
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

          {/* Command palette trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex h-9 w-72 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Open command palette"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>

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

          <Button variant="ghost" size="icon" onClick={() => fullSync()} title="Sync now" disabled={syncing} aria-label="Sync now">
            <CloudUpload className={`w-4 h-4 ${syncing ? 'animate-pulse' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            aria-label="Toggle dark mode"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <NotificationBell />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border p-0.5 pr-2 hover:bg-muted transition-colors" aria-label="Account menu">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium max-w-28 truncate">{me?.user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-sm font-medium">{me?.user.name}</div>
                <div className="text-xs text-muted-foreground font-normal truncate">{me?.user.email}</div>
                <div className="text-xs text-muted-foreground font-normal capitalize mt-0.5">{roleLabel}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setView('sync')}>
                <RefreshCw className="w-4 h-4 mr-2" /> Sync console
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaletteOpen(true)}>
                <Search className="w-4 h-4 mr-2" /> Command palette
                <span className="ml-auto text-[10px] text-muted-foreground">⌘K</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex print:block">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 flex-col border-r p-3 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto print:hidden">
          <div className="mb-5 px-2 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <School className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-sm leading-none">iEduPro</div>
              <div className="text-[10px] text-muted-foreground mt-1">Lightworld Academy</div>
            </div>
          </div>
          {renderNav()}
          <div className="mt-auto pt-4">
            <button
              onClick={() => setPaletteOpen(true)}
              className="w-full flex items-center gap-2.5 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              Quick actions
              <kbd className="ml-auto font-mono text-[10px] border rounded px-1 py-0.5 bg-background">⌘K</kbd>
            </button>
            <div className="mt-3 p-3 rounded-lg bg-muted/50 text-[11px] text-muted-foreground leading-relaxed">
              iEduPro · Lightworld Technologies Ltd.
              <br />Ghana basic education platform
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 md:p-6 max-w-6xl w-full mx-auto print:max-w-none print:p-0">
          {children}
        </main>
      </div>

      <footer className="border-t mt-auto print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>© 2026 Lightworld Technologies Ltd.</span>
          <span className="capitalize">{roleLabel} portal</span>
        </div>
      </footer>
    </div>
  );
}
