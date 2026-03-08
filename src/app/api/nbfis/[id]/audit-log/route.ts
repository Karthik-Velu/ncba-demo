import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// GET /api/nbfis/[id]/audit-log — returns full audit trail for one NBFI
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const entries = await db.auditLog.findMany({
      where: { nbfiId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ entries });
  } catch (err) {
    console.error('[GET /api/nbfis/[id]/audit-log]', err);
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
