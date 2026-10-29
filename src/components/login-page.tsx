'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { School, Loader2, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, CloudOff } from 'lucide-react';
import { useSyncStore, fullSync } from '@/lib/client-sync';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const online = useSyncStore((s) => s.online);
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Login failed');
        return;
      }
      window.location.reload();
    } catch {
      setError('Network error — check your connection');
    } finally {
      setBusy(false);
    }
  }

  const demos = [
    { email: 'head@lightworld.edu.gh', role: 'Headteacher' },
    { email: 'teacher@lightworld.edu.gh', role: 'Teacher' },
    { email: 'bursar@lightworld.edu.gh', role: 'Bursar' },
    { email: 'cashier@lightworld.edu.gh', role: 'Cashier' },
    { email: 'parent@lightworld.edu.gh', role: 'Parent' },
    { email: 'student@lightworld.edu.gh', role: 'Student' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-background dark:via-background dark:to-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <School className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">iEduPro</div>
              <div className="text-[11px] text-muted-foreground leading-tight">Lightworld Technologies Ltd. · Ghana</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {online ? (
              <Badge variant="outline" className="gap-1.5 text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950">
                <CheckCircle2 className="w-3 h-3" /> Online
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950">
                <WifiOff className="w-3 h-3" /> Offline
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => fullSync()} title="Sync now">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 items-start">
          <Card className="md:mt-8">
            <CardHeader>
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <CardDescription>Access your school portal</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@school.edu.gh"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={busy || !online}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sign in
                </Button>
                {!online && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CloudOff className="w-3.5 h-3.5" />
                    You are offline. Sign-in requires a connection the first time on this device.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">The complete basic-school platform</CardTitle>
                <CardDescription>
                  Admissions · Attendance · SBA &amp; exams · Fees &amp; receipts · Offline-first · Transport · GH&nbsp;₵ accounting
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Built for Ghanaian crèche through JHS 3 — NaCCA-aligned stage structure, GES-ready reporting, and durable offline collection.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Demo accounts</CardTitle>
                <CardDescription>Password: <code className="bg-muted px-1.5 py-0.5 rounded">Demo1234!</code></CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {demos.map((d) => (
                    <button
                      key={d.email}
                      type="button"
                      onClick={() => { setEmail(d.email); setPassword('Demo1234!'); }}
                      className="text-left px-3 py-2 rounded-lg border hover:bg-muted/60 transition-colors"
                    >
                      <div className="text-sm font-medium">{d.role}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{d.email}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Lightworld Technologies Ltd. — iEduPro</span>
          <span>{lastSyncAt ? `Last sync: ${new Date(lastSyncAt).toLocaleTimeString()}` : ''}</span>
        </div>
      </footer>
    </div>
  );
}
