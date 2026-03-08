import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { CovenantDef, DocumentRequirement, ProvisioningRule } from '@/lib/types';

type Params = { params: Promise<{ id: string }> };

// PUT /api/nbfis/[id]/covenant-setup — save covenants, documents, provisioning rules atomically
// Body: { covenants: CovenantDef[], documents: DocumentRequirement[], provisioningRules: { nbfi, lender }, userId, userName }
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      covenants,
      documents,
      provisioningRules,
      userId,
      userName,
    }: {
      covenants: CovenantDef[];
      documents: DocumentRequirement[];
      provisioningRules: { nbfi: ProvisioningRule[]; lender: ProvisioningRule[] };
      userId: string;
      userName: string;
    } = body;

    await db.$transaction(async (tx) => {
      // 1. Replace covenant definitions
      await tx.covenantDefinition.deleteMany({ where: { nbfiId: id } });
      for (const c of covenants) {
        await tx.covenantDefinition.create({
          data: {
            id: c.id || uuidv4(),
            nbfiId: id,
            metric: c.metric,
            operator: c.operator,
            threshold: c.threshold,
            frequency: c.frequency,
            format: c.format,
          },
        });
      }

      // 2. Replace documents
      await tx.document.deleteMany({ where: { nbfiId: id } });
      for (const d of documents) {
        await tx.document.create({
          data: {
            id: d.id || uuidv4(),
            nbfiId: id,
            name: d.name,
            frequency: d.frequency,
            nextDueDate: d.nextDueDate,
            status: d.status || 'pending',
            submittedDate: d.submittedDate || null,
            submittedBy: d.submittedBy || null,
          },
        });
      }

      // 3. Replace provisioning rules
      await tx.provisioningRule.deleteMany({ where: { nbfiId: id } });
      for (const r of provisioningRules.nbfi) {
        await tx.provisioningRule.create({
          data: { nbfiId: id, policyType: 'nbfi', bucket: r.bucket, dpdMin: r.dpdMin, dpdMax: r.dpdMax, provisionPercent: r.provisionPercent },
        });
      }
      for (const r of provisioningRules.lender) {
        await tx.provisioningRule.create({
          data: { nbfiId: id, policyType: 'lender', bucket: r.bucket, dpdMin: r.dpdMin, dpdMax: r.dpdMax, provisionPercent: r.provisionPercent },
        });
      }

      // 4. Mark setup complete
      await tx.nbfi.update({ where: { id }, data: { setupCompleted: true, status: 'setup_complete' } });

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          nbfiId: id,
          userId: userId || 'system',
          userName: userName || 'System',
          action: 'covenant_setup',
          toStatus: 'setup_complete',
          notes: `${covenants.length} covenants, ${documents.length} docs, provisioning rules saved`,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/nbfis/[id]/covenant-setup]', err);
    return NextResponse.json({ error: 'Failed to save covenant setup' }, { status: 500 });
  }
}
