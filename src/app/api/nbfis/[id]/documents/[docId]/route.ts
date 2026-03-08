import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

type Params = { params: Promise<{ id: string; docId: string }> };

// PATCH /api/nbfis/[id]/documents/[docId]
// Body: { status, date?, uploadedBy?, userId, userName }
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, docId } = await params;
  try {
    const body = await request.json();
    const { status, date, uploadedBy, userId, userName } = body;

    const updateData: Record<string, unknown> = { status };
    if (status === 'submitted' && date) {
      updateData.submittedDate = date;
      updateData.submittedBy = uploadedBy || 'Unknown';
    }

    await db.document.update({ where: { id: docId }, data: updateData });

    if (status === 'submitted' && date) {
      const doc = await db.document.findUnique({ where: { id: docId }, select: { name: true } });
      await db.documentSubmission.create({
        data: {
          id: uuidv4(),
          documentId: docId,
          date,
          filename: `${(doc?.name || 'document').replace(/\s+/g, '_')}_${date}.pdf`,
          uploadedBy: uploadedBy || 'Unknown',
        },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        nbfiId: id,
        userId: userId || 'system',
        userName: userName || 'System',
        action: 'document_updated',
        notes: `Document ${docId} status changed to ${status}`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/nbfis/[id]/documents/[docId]]', err);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}
