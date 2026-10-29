'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/components/app-provider';

type Announcement = {
  id: string; title: string; body: string; audience: string; channel: string;
  deliveryStatus: string; createdAt: string; author: string | null;
};

const AUDIENCE_LABELS: Record<string, { label: string; description: string }> = {
  all: { label: 'Everyone', description: 'All portal users of the school' },
  staff: { label: 'Staff', description: 'Teaching and non-teaching staff' },
  teachers: { label: 'Teachers', description: 'Teachers and the academic head' },
  parents: { label: 'Parents / guardians', description: 'Guardians with portal access' },
  students: { label: 'Students', description: 'Learners with portal access' },
};

export default function AnnouncementsView() {
  const { me } = useApp();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [sending, setSending] = useState(false);

  const canPublish = me?.roles.some((r) => ['headteacher', 'proprietor', 'academic_head'].includes(r)) ?? false;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements', { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        setItems(d.announcements ?? []);
        setError(null);
      } else {
        setError('Notice board unavailable.');
      }
    } catch {
      setError('Notice board unavailable offline.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function publish() {
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Title and message required', description: 'Fill both fields before publishing.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), audience }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: 'Publish failed', description: d.error ?? 'Unknown error', variant: 'destructive' });
        return;
      }
      toast({ title: 'Notice published', description: `Delivered as in-app notification to ${d.notified} recipient${d.notified === 1 ? '' : 's'}.` });
      setTitle('');
      setBody('');
      load();
    } catch {
      toast({ title: 'Network error', description: 'Could not publish the notice.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notices &amp; announcements</h1>
        <p className="text-sm text-muted-foreground">School notice board — published in-app and fanned out as notifications</p>
      </div>

      {canPublish && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Megaphone className="w-4 h-4" /> Publish a notice</CardTitle>
            <CardDescription>Recipients receive an in-app notification immediately</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="notice-title" className="text-xs">Title</Label>
              <Input id="notice-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-term break begins Friday" className="mt-1" maxLength={120} />
            </div>
            <div>
              <Label htmlFor="notice-body" className="text-xs">Message</Label>
              <Textarea id="notice-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the notice body…" rows={4} className="mt-1" maxLength={800} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <Label className="text-xs">Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="mt-1 w-full sm:w-[260px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <div>
                          <div className="text-sm">{v.label}</div>
                          <div className="text-[11px] text-muted-foreground">{v.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={publish} disabled={sending} className="gap-2 h-9">
                <Send className="w-4 h-4" /> {sending ? 'Publishing…' : 'Publish notice'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : error ? (
        <div className="text-muted-foreground p-8 text-center">{error}</div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-40" />
                No notices published yet.
              </CardContent>
            </Card>
          )}
          {items.map((a) => (
            <Card key={a.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] capitalize">{AUDIENCE_LABELS[a.audience]?.label ?? a.audience}</Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">{a.deliveryStatus}</Badge>
                  </div>
                </div>
                <CardDescription>
                  {a.author ? `By ${a.author} · ` : ''}
                  {new Date(a.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-line">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
