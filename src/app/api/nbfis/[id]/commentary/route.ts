import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

type Params = { params: Promise<{ id: string }> };

// POST /api/nbfis/[id]/commentary
// Body: { id?, author, role, text, timestamp? }
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const entryId = body.id || uuidv4();
    const timestamp = body.timestamp || new Date().toISOString();

    await db.commentary.create({
      data: {
        id: entryId,
        nbfiId: id,
        author: body.author,
        role: body.role,
        text: body.text,
        timestamp,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        nbfiId: id,
        userId: body.userId || 'system',
        userName: body.author || 'Unknown',
        action: 'commentary_added',
        notes: body.text.slice(0, 200),
      },
    });

    return NextResponse.json({ id: entryId, timestamp }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/nbfis/[id]/commentary]', err);
    return NextResponse.json({ error: 'Failed to add commentary' }, { status: 500 });
  }
}
