import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// GET /api/nbfis/[id]/financial-data
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const n = await db.nbfi.findUnique({ where: { id }, select: { financialData: true } });
    if (!n) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = n.financialData ? JSON.parse(n.financialData) : null;
    return NextResponse.json({ financialData: data });
  } catch (err) {
    console.error('[GET /api/nbfis/[id]/financial-data]', err);
    return NextResponse.json({ error: 'Failed to fetch financial data' }, { status: 500 });
  }
}

// POST /api/nbfis/[id]/financial-data — load / save financial data + advance status to 'spreading'
// Body: { financialData, userId, userName }
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { financialData, userId, userName } = body;

    await db.nbfi.update({
      where: { id },
      data: {
        financialData: JSON.stringify(financialData),
        status: 'spreading',
      },
    });

    await db.auditLog.create({
      data: {
        nbfiId: id,
        userId: userId || 'system',
        userName: userName || 'System',
        action: 'status_change',
        fromStatus: 'uploading',
        toStatus: 'spreading',
        notes: 'Financial data loaded',
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/nbfis/[id]/financial-data]', err);
    return NextResponse.json({ error: 'Failed to save financial data' }, { status: 500 });
  }
}
