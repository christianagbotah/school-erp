import { NextResponse } from 'next/server';
import { clearSessionCookie, getSessionToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST() {
  const token = await getSessionToken();
  if (token) {
    await db.session.updateMany({ where: { token }, data: { revokedAt: new Date() } }).catch(() => undefined);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
