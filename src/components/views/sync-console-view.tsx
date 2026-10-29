'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToastIfy } from '@/components/toastify';
import { useSyncStore, fullSync, type OutboxOperation } from '@/lib/client-sync';
import { RefreshCw, CloudOff, CheckCircle2, AlertTriangle, Trash2, Inbox, Clock, RadioTower } from 'lucide-react';

export default function SyncConsoleView() {
  const { outbox, online, lastSyncAt, lastSyncResult, syncing, cursor } = useSyncStore();
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    try {
      const r = await fullSync();
      const pushed = Object.keys(r.pushed).length;
      ToastIfy.success(`Synced — ${pushed} ops processed, ${r.pulled} changes pulled`);
    } catch {
      ToastIfy.error('Sync failed — will retry');
    } finally {
      setBusy(false);
    }
  }

  const grouped = outbox.reduce<Record<string, OutboxOperation[]>>((acc, op) => {
    (acc[op.entityType] = acc[op.entityType] ?? []).push(op);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sync console</h1>
          <p className="text-sm text-muted-foreground">Offline operation queue and device synchronization status</p>
        </div>
        <Button onClick={sync} disabled={busy || syncing}>
          {(busy || syncing) ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RadioTower className="w-4 h-4 mr-2" />}
          Sync now
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-sm">
              {online ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <CloudOff className="w-4 h-4 text-amber-600" />}
              <span className="font-medium">{online ? 'Connected' : 'Offline'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {online ? 'Operations send immediately and queue retries automatically.' : 'Captured work is stored durably on this device and will sync when the connection returns.'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold">{outbox.length}</div>
            <div className="text-xs text-muted-foreground">pending operations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{lastSyncAt ? new Date(lastSyncAt).toLocaleString('en-GB') : 'Never synced'}</span>
            </div>
            {lastSyncResult && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {lastSyncResult.applied > 0 && <Badge className="bg-emerald-600">applied {lastSyncResult.applied}</Badge>}
                {lastSyncResult.duplicate > 0 && <Badge variant="secondary">dup {lastSyncResult.duplicate}</Badge>}
                {lastSyncResult.conflict > 0 && <Badge variant="destructive">conflict {lastSyncResult.conflict}</Badge>}
                {lastSyncResult.rejected > 0 && <Badge variant="destructive">rejected {lastSyncResult.rejected}</Badge>}
              </div>
            )}
            {cursor && <p className="text-[10px] text-muted-foreground mt-1.5 font-mono truncate">cursor: {cursor}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="w-4 h-4" /> Operation outbox
          </CardTitle>
          <CardDescription>
            Each operation has a globally unique ID for exactly-one application. Conflicts stay visible for review — never silently overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {outbox.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
              All captured work is synchronized.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([entity, ops]) => (
                <div key={entity}>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">{entity} ({ops.length})</div>
                  <div className="rounded-lg border divide-y">
                    {ops.map((op) => (
                      <div key={op.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-sm font-mono truncate">{op.id.slice(0, 18)}…</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(op.clientTimestamp).toLocaleString('en-GB')} · attempt {op.attempts + 1}
                            {op.lastError && <span className="text-destructive"> · {op.lastError}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {op.status === 'failed' && op.lastError?.includes('conflict') ? (
                            <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Conflict</Badge>
                          ) : op.status === 'failed' ? (
                            <Badge variant="destructive">Failed</Badge>
                          ) : (
                            <Badge variant="secondary">Queued</Badge>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => useSyncStore.getState().removeOperation(op.id)} title="Discard after review">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
