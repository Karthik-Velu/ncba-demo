import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/nbfis/[id]/status
// Body: { status, userId, userName, recommendation?, approverComments?, notes? }
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, userId, userName, recommendation, approverComments, notes } = body;

    // Get current status for audit log
    const current = await db.nbfi.findUnique({ where: { id }, select: { status: true } });
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updateData: Record<string, unknown> = { status };
    if (recommendation !== undefined) updateData.recommendation = recommendation;
    if (approverComments !== undefined) updateData.approverComments = approverComments;

    await db.nbfi.update({ where: { id }, data: updateData });

    // Write immutable audit log entry
    await db.auditLog.create({
      data: {
        nbfiId: id,
        userId: userId || 'system',
        userName: userName || 'System',
        action: 'status_change',
        fromStatus: current.status,
        toStatus: status,
        notes: notes || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/nbfis/[id]/status]', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
