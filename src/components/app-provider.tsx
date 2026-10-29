'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSyncStore, fullSync } from '@/lib/client-sync';

// ============================================================================
// App shell context: auth + sync status shared across portal views
// ============================================================================

export type Me = {
  user: { id: string; name: string; email: string };
  tenantId: string | null;
  roles: string[];
  primaryRole: string | null;
  memberships: { tenantId: string; roleKey: string; scopeType: string; scopeId: string | null; scopeName: string | null }[];
};

type AppCtx = {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
};

const Ctx = createContext<AppCtx>({ me: null, loading: true, refresh: async () => {}, sync: async () => {} });

export function useApp() {
  return useContext(Ctx);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMe(data);
        try {
          localStorage.setItem('iedupro-cache:/api/auth/me', JSON.stringify({ at: Date.now(), data }));
        } catch { /* quota */ }
      } else if (res.status === 401) {
        setMe(null);
        localStorage.removeItem('iedupro-cache:/api/auth/me');
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      // network failure — fall back to the cached identity so an authorized
      // user can continue offline work. Server re-verifies on reconnect.
      try {
        const raw = localStorage.getItem('iedupro-cache:/api/auth/me');
        if (raw) {
          const parsed = JSON.parse(raw) as { at: number; data: Me };
          if (Date.now() - parsed.at < 1000 * 60 * 60 * 24 * 14) {
            setMe(parsed.data);
          } else setMe(null);
        } else setMe(null);
      } catch {
        setMe(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const sync = useCallback(async () => {
    await fullSync();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // register service worker for offline app shell (PWA)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  // online/offline listeners
  useEffect(() => {
    const setOnline = useSyncStore.getState().setOnline;
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // auto-sync on reconnect and periodically when online
  useEffect(() => {
    const unsub = useSyncStore.subscribe((state, prev) => {
      if (state.online && !prev.online) {
        fullSync();
      }
    });
    const interval = setInterval(() => {
      const state = useSyncStore.getState();
      if (state.online && state.outbox.some((o) => o.status === 'queued')) {
        fullSync();
      }
    }, 30000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  return <Ctx.Provider value={{ me, loading, refresh, sync }}>{children}</Ctx.Provider>;
}
