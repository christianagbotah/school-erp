import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/bootstrap — public landing data (school directory for login page)
export async function GET() {
  const tenants = await db.tenant.findMany({
    where: { status: 'ACTIVE' },
    include: { organizations: { include: { schools: { select: { id: true, name: true, motto: true, address: true, region: true } } } } },
    take: 20,
  });
  return NextResponse.json({
    product: { name: 'iEduPro', owner: 'Lightworld Technologies Ltd.', country: 'Ghana' },
    tenants: tenants.map((t) => ({
      code: t.code,
      name: t.name,
      schools: t.organizations.flatMap((o) => o.schools),
    })),
  });
}
