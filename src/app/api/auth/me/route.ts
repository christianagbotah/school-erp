import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';

export async function GET() {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ authenticated: false }, { status: 401 });
  const primaryMembership = auth.memberships[0];
  return NextResponse.json({
    authenticated: true,
    user: {
      id: auth.user.id,
      name: auth.user.fullName,
      email: auth.user.email,
    },
    tenantId: auth.tenantId,
    roles: auth.roles,
    memberships: auth.memberships.map((m) => ({
      tenantId: m.tenantId,
      roleKey: m.roleKey,
      scopeType: m.scopeType,
      scopeId: m.scopeId,
      scopeName: m.scopeName,
    })),
    primaryRole: primaryMembership?.roleKey ?? null,
  });
}
