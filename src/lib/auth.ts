import 'server-only';
import { db } from '@/lib/db';
import { Session, User, Membership } from '@prisma/client';
import { cookies } from 'next/headers';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cache } from 'react';

// ============================================================================
// Password hashing (scrypt — no external deps)
// ============================================================================

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// ============================================================================
// Sessions
// ============================================================================

const SESSION_COOKIE = 'iedupro_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: string, userAgent?: string, ip?: string): Promise<Session> {
  const token = randomBytes(32).toString('hex');
  const session = await db.session.create({
    data: {
      token,
      userId,
      userAgent: userAgent ?? null,
      ip: ip ?? null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return session;
}

export async function getSessionFromToken(token: string): Promise<Session | null> {
  const session = await db.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (session.revokedAt) return null;
  return session;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

// ============================================================================
// Auth context — cached per request
// ============================================================================

export type AuthContext = {
  user: User;
  memberships: Membership[];
  /** primary tenant for this login (first active membership's tenant) */
  tenantId: string | null;
  roles: string[];
};

export const getAuth = cache(async (): Promise<AuthContext | null> => {
  const token = await getSessionToken();
  if (!token) return null;
  const session = await getSessionFromToken(token);
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status !== 'active') return null;
  const memberships = await db.membership.findMany({
    where: { userId: user.id, status: 'active', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
  });
  const roles = [...new Set(memberships.map((m) => m.roleKey))];
  const tenantId = memberships[0]?.tenantId ?? user.tenantId ?? null;
  return { user, memberships, tenantId, roles };
});

/** Require any authentication */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuth();
  if (!auth) throw new AuthError('Not authenticated');
  return auth;
}

/** Require one of the given roles (any membership) */
export async function requireRole(...roleKeys: string[]): Promise<AuthContext> {
  const auth = await requireAuth();
  if (roleKeys.length === 0) return auth;
  const has = auth.memberships.some((m) => roleKeys.includes(m.roleKey));
  if (!has) throw new AuthError(`Requires role: ${roleKeys.join(' or ')}`, 403);
  return auth;
}

/** Require a specific tenant scope — the tenant isolation boundary */
export async function requireTenant(tenantId?: string | null): Promise<AuthContext & { tenantId: string }> {
  const auth = await requireAuth();
  if (!tenantId) throw new AuthError('Tenant context required', 400);
  const member = auth.memberships.find((m) => m.tenantId === tenantId);
  if (!member) throw new AuthError('Not a member of this tenant', 403);
  return { ...auth, tenantId };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

// ============================================================================
// Audit helper
// ============================================================================

export async function audit(params: {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string;
}) {
  await db.auditLog.create({
    data: {
      tenantId: params.tenantId ?? null,
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      before: params.before ? JSON.stringify(params.before) : null,
      after: params.after ? JSON.stringify(params.after) : null,
      reason: params.reason ?? null,
    },
  }).catch(() => undefined); // audit must not break the request path
}
