import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toNBFIRecord, NBFI_INCLUDE } from '@/lib/dbHelpers';

type Params = { params: Promise<{ id: string }> };

// GET /api/nbfis/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const n = await db.nbfi.findUnique({ where: { id }, include: NBFI_INCLUDE });
    if (!n) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(toNBFIRecord(n));
  } catch (err) {
    console.error('[GET /api/nbfis/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch NBFI' }, { status: 500 });
  }
}

// PATCH /api/nbfis/[id] — generic field updates
// Accepts: { field, value } where field is a scalar top-level JSON column
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();

    // Build update data — only allow known JSON/scalar fields
    const allowed = [
      'transactionType',
      'securitisationStructure',
      'monitoringData',
      'earlyWarnings',
      'loanBookMeta',
    ] as const;

    type AllowedField = (typeof allowed)[number];
    const updateData: Partial<Record<AllowedField | 'financialData', string | null>> = {};

    for (const field of allowed) {
      if (field in body) {
        const val = body[field];
        updateData[field] = val !== null && val !== undefined ? JSON.stringify(val) : null;
      }
    }

    if ('financialData' in body) {
      updateData.financialData = body.financialData ? JSON.stringify(body.financialData) : null;
    }

    await db.nbfi.update({ where: { id }, data: updateData });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/nbfis/[id]]', err);
    return NextResponse.json({ error: 'Failed to update NBFI' }, { status: 500 });
  }
}

// DELETE /api/nbfis/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await db.nbfi.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/nbfis/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete NBFI' }, { status: 500 });
  }
}
