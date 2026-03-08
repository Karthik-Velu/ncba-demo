import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toPoolSelectionState } from '@/lib/dbHelpers';

type Params = { params: Promise<{ id: string }> };

// GET /api/nbfis/[id]/pool-selection
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ps = await db.poolSelection.findUnique({ where: { nbfiId: id } });
    if (!ps) return NextResponse.json({ poolSelection: null });
    return NextResponse.json({ poolSelection: toPoolSelectionState(ps) });
  } catch (err) {
    console.error('[GET /api/nbfis/[id]/pool-selection]', err);
    return NextResponse.json({ error: 'Failed to fetch pool selection' }, { status: 500 });
  }
}

// PUT /api/nbfis/[id]/pool-selection — upsert pool selection
// Body: { excludedSegments, filterSnapshot, confirmedAt?, userId, userName }
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { excludedSegments, filterSnapshot, confirmedAt, userId, userName } = body;

    await db.poolSelection.upsert({
      where: { nbfiId: id },
      create: {
        nbfiId: id,
        excludedSegments: JSON.stringify(excludedSegments),
        filterSnapshot: JSON.stringify(filterSnapshot),
        confirmedAt: confirmedAt || null,
      },
      update: {
        excludedSegments: JSON.stringify(excludedSegments),
        filterSnapshot: JSON.stringify(filterSnapshot),
        confirmedAt: confirmedAt || null,
      },
    });

    if (confirmedAt) {
      await db.nbfi.update({ where: { id }, data: { status: 'pool_selected' } });
      await db.auditLog.create({
        data: {
          nbfiId: id,
          userId: userId || 'system',
          userName: userName || 'System',
          action: 'pool_confirmed',
          toStatus: 'pool_selected',
          notes: `Pool confirmed at ${confirmedAt}`,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/nbfis/[id]/pool-selection]', err);
    return NextResponse.json({ error: 'Failed to save pool selection' }, { status: 500 });
  }
}
