'use client';

import { useEffect, useState, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, Wallet, CalendarCheck, FileText, Info, Settings2, Bus } from 'lucide-react';

type Notification = {
  id: string; title: string; body: string; type: string; isRead: boolean; createdAt: string;
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  fee: Wallet, attendance: CalendarCheck, result: FileText, transport: Bus, system: Settings2, info: Info,
};

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        setItems(d.notifications ?? []);
        setUnread(d.unread ?? 0);
      }
    } catch { /* offline */ }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  // light polling: refresh unread count every 45s while online
  useEffect(() => {
    const t = setInterval(() => {
      if (navigator.onLine) load();
    }, 45000);
    return () => clearInterval(t);
  }, [load]);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: items.filter((i) => !i.isRead).map((i) => i.id) }),
      });
    } catch { /* offline — optimistic only */ }
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) { setLoading(true); load().finally(() => setLoading(false)); } }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notifications" aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}>
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 print:hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-sm font-semibold">Notifications</div>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {loading ? (
            <div className="space-y-2 p-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Bell className="w-7 h-7 mx-auto mb-2 opacity-30" />
              No notifications yet.
            </div>
          ) : (
            items.map((n) => {
              const Icon = TYPE_ICONS[n.type] ?? Info;
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 rounded-lg px-3 py-2.5 transition-colors ${n.isRead ? 'opacity-70' : 'bg-primary/5'}`}
                >
                  <div className={`mt-0.5 w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${n.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-snug">{n.title}</div>
                    <div className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">{n.body}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.isRead && <span className="ml-auto mt-1.5 w-2 h-2 shrink-0 rounded-full bg-primary" />}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
