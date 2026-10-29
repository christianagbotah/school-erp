'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Offline-first client store: connection state, outbox queue, sync cursor
// ============================================================================

export type OutboxOperation = {
  id: string; // uuid — idempotency key
  entityType: 'attendance' | 'payment' | 'observation';
  opType: 'create' | 'update';
  payload: Record<string, unknown>;
  clientTimestamp: string;
  status: 'queued' | 'sending' | 'failed';
  attempts: number;
  lastError?: string;
};

export type PulledChange = {
  entity: string;
  id: string;
  at: string;
  data: Record<string, unknown>;
};

type SyncState = {
  online: boolean;
  outbox: OutboxOperation[];
  cursor: string | null;
  lastSyncAt: string | null;
  lastSyncResult: { applied: number; duplicate: number; conflict: number; rejected: number } | null;
  syncing: boolean;
  setOnline: (online: boolean) => void;
  queueOperation: (op: Omit<OutboxOperation, 'id' | 'status' | 'attempts' | 'clientTimestamp'>) => string;
  markSending: (id: string) => void;
  markFailed: (id: string, error: string) => void;
  removeOperation: (id: string) => void;
  setCursor: (cursor: string) => void;
  setLastSync: (result: SyncState['lastSyncResult']) => void;
  setSyncing: (s: boolean) => void;
};

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      online: true,
      outbox: [],
      cursor: null,
      lastSyncAt: null,
      lastSyncResult: null,
      syncing: false,
      setOnline: (online) => set({ online }),
      queueOperation: (op) => {
        const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `op-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set({ outbox: [...get().outbox, { ...op, id, status: 'queued', attempts: 0, clientTimestamp: new Date().toISOString() }] });
        return id;
      },
      markSending: (id) => set({ outbox: get().outbox.map((o) => (o.id === id ? { ...o, status: 'sending' } : o)) }),
      markFailed: (id, error) => set({ outbox: get().outbox.map((o) => (o.id === id ? { ...o, status: 'failed', attempts: o.attempts + 1, lastError: error } : o)) }),
      removeOperation: (id) => set({ outbox: get().outbox.filter((o) => o.id !== id) }),
      setCursor: (cursor) => set({ cursor }),
      setLastSync: (result) => set({ lastSyncResult: result, lastSyncAt: new Date().toISOString() }),
      setSyncing: (s) => set({ syncing: s }),
    }),
    { name: 'iedupro-sync' }
  )
);

/** Queue an operation; if online, attempt immediate flush */
export async function enqueueOperation(op: Omit<OutboxOperation, 'id' | 'status' | 'attempts' | 'clientTimestamp'>): Promise<{ queuedLocally: boolean; serverResult?: { status: string; detail?: string } }> {
  const store = useSyncStore.getState();
  const opId = store.queueOperation(op);

  if (!store.online) {
    return { queuedLocally: true };
  }
  // try immediate send
  const flush = await flushOutbox();
  if (flush.results[opId]) {
    return { queuedLocally: false, serverResult: flush.results[opId] };
  }
  return { queuedLocally: true };
}

/** Push all queued operations to /api/sync/push */
export async function flushOutbox(): Promise<{ results: Record<string, { status: string; detail?: string }> }> {
  const store = useSyncStore.getState();
  const queued = store.outbox.filter((o) => o.status !== 'sending');
  const results: Record<string, { status: string; detail?: string }> = {};
  if (queued.length === 0) return { results };

  const deviceId = getDeviceId();
  try {
    store.setSyncing(true);
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        operations: queued.map((o) => ({ id: o.id, entityType: o.entityType, opType: o.opType, payload: o.payload, clientTimestamp: o.clientTimestamp })),
      }),
    });
    if (!res.ok) throw new Error(`push failed: ${res.status}`);
    const data = await res.json();
    let applied = 0, duplicate = 0, conflict = 0, rejected = 0;
    for (const r of data.results as { operationId: string; status: string; detail?: string }[]) {
      results[r.operationId] = { status: r.status, detail: r.detail };
      if (r.status === 'applied' || r.status === 'duplicate') {
        useSyncStore.getState().removeOperation(r.operationId);
        if (r.status === 'applied') applied += 1;
        else duplicate += 1;
      } else if (r.status === 'conflict') {
        conflict += 1;
        // conflicts stay visible in the outbox for review
        useSyncStore.getState().markFailed(r.operationId, r.detail ?? 'conflict');
      } else {
        rejected += 1;
        useSyncStore.getState().markFailed(r.operationId, r.detail ?? 'rejected');
      }
    }
    useSyncStore.getState().setLastSync({ applied, duplicate, conflict, rejected });
    return { results };
  } catch (e) {
    for (const o of queued) {
      useSyncStore.getState().markFailed(o.id, (e as Error).message);
    }
    return { results };
  } finally {
    useSyncStore.getState().setSyncing(false);
  }
}

/** Pull server changes (cursor-based) */
export async function pullChanges(): Promise<{ changes: PulledChange[]; nextCursor: string }> {
  const store = useSyncStore.getState();
  const cursor = store.cursor;
  const take = 100;
  const res = await fetch(`/api/sync/pull?${new URLSearchParams({ ...(cursor ? { cursor } : {}), take: String(take) })}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`pull failed: ${res.status}`);
  const data = await res.json();
  // advance cursor only after durable application — here localStorage persistence is the durable store
  useSyncStore.getState().setCursor(data.nextCursor);
  return { changes: data.changes, nextCursor: data.nextCursor };
}

/** Full sync: push then pull */
export async function fullSync(): Promise<{ pushed: Record<string, { status: string }>; pulled: number }> {
  const push = await flushOutbox();
  let pulled = 0;
  try {
    const pull = await pullChanges();
    pulled = pull.changes.length;
  } catch {
    // pull failure doesn't invalidate push results
  }
  return { pushed: push.results, pulled };
}

function getDeviceId(): string {
  const KEY = 'iedupro-device-id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `DEV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}
