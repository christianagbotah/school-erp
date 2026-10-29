import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }
    const session = await createSession(user.id, req.headers.get('user-agent') ?? undefined, req.headers.get('x-forwarded-for') ?? undefined);
    await setSessionCookie(session.token);
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return NextResponse.json({ ok: true, userId: user.id, name: user.fullName });
  } catch (e) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
