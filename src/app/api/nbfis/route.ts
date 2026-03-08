import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toNBFIRecord, toPoolSelectionState, NBFI_INCLUDE, parseLoanRows } from '@/lib/dbHelpers';
import { v4 as uuidv4 } from 'uuid';

// GET /api/nbfis — returns all NBFIs + loanBooks + poolSelections for AppContext hydration
export async function GET() {
  try {
    const nbfis = await db.nbfi.findMany({
      include: {
        ...NBFI_INCLUDE,
        loanBooks: { orderBy: { uploadedAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const nbfiRecords = nbfis.map(toNBFIRecord);

    const loanBooks: Record<string, unknown[]> = {};
    const poolSelections: Record<string, unknown> = {};

    for (const n of nbfis) {
      const rows = parseLoanRows(n.loanBooks);
      if (rows.length) loanBooks[n.id] = rows;

      if (n.poolSelection) {
        poolSelections[n.id] = toPoolSelectionState(n.poolSelection);
      }
    }

    return NextResponse.json({ nbfis: nbfiRecords, loanBooks, poolSelections });
  } catch (err) {
    console.error('[GET /api/nbfis]', err);
    return NextResponse.json({ error: 'Failed to load NBFIs' }, { status: 500 });
  }
}

// POST /api/nbfis — create a new NBFI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, keyContacts, fundingAmount, description, userId, userName } = body;

    const id = uuidv4();
    const dateOnboarded = new Date().toISOString().split('T')[0];

    await db.nbfi.create({
      data: {
        id,
        name,
        keyContacts,
        fundingAmount,
        description,
        status: 'draft',
        dateOnboarded,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        nbfiId: id,
        userId: userId || 'system',
        userName: userName || 'System',
        action: 'created',
        toStatus: 'draft',
        notes: `NBFI "${name}" created`,
      },
    });

    return NextResponse.json({ id, dateOnboarded }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/nbfis]', err);
    return NextResponse.json({ error: 'Failed to create NBFI' }, { status: 500 });
  }
}
