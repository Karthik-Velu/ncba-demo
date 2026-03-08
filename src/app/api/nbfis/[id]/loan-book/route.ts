import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// GET /api/nbfis/[id]/loan-book — returns the latest loan book rows
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const loanBook = await db.loanBook.findFirst({
      where: { nbfiId: id },
      orderBy: { uploadedAt: 'desc' },
    });
    const rows = loanBook ? JSON.parse(loanBook.rows) : [];
    return NextResponse.json({ rows });
  } catch (err) {
    console.error('[GET /api/nbfis/[id]/loan-book]', err);
    return NextResponse.json({ error: 'Failed to fetch loan book' }, { status: 500 });
  }
}

// POST /api/nbfis/[id]/loan-book — upload / replace loan book
// Body: { rows: LoanLevelRow[], meta?, userId, userName }
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { rows, meta, userId, userName } = body;

    await db.loanBook.create({
      data: {
        nbfiId: id,
        rows: JSON.stringify(rows),
      },
    });

    if (meta) {
      await db.nbfi.update({
        where: { id },
        data: { loanBookMeta: JSON.stringify(meta) },
      });
    }

    await db.auditLog.create({
      data: {
        nbfiId: id,
        userId: userId || 'system',
        userName: userName || 'System',
        action: 'loan_book_uploaded',
        notes: `${rows.length} loan rows uploaded`,
      },
    });

    return NextResponse.json({ ok: true, count: rows.length }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/nbfis/[id]/loan-book]', err);
    return NextResponse.json({ error: 'Failed to upload loan book' }, { status: 500 });
  }
}
