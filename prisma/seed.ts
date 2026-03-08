import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const db = new PrismaClient({ adapter });

// Lazy imports for seed data (loaded at runtime)
async function loadSeedData() {
  const { NBFI_SEEDS, getAllSeedLoanBooks } = await import('../src/lib/seedTransactions.js');
  const inputTemplate = await import('../data/input-template.json', { with: { type: 'json' } });
  const nbfiOutput = await import('../data/nbfi-output.json', { with: { type: 'json' } });
  const cashflow = await import('../data/cashflow.json', { with: { type: 'json' } });
  const mockCovenants = await import('../data/mock-covenants.json', { with: { type: 'json' } });
  const mockDocuments = await import('../data/mock-documents.json', { with: { type: 'json' } });
  const mockMonitoring = await import('../data/mock-monitoring.json', { with: { type: 'json' } });
  const mockEarlyWarnings = await import('../data/mock-early-warnings.json', { with: { type: 'json' } });

  return {
    NBFI_SEEDS,
    allLoanBooks: getAllSeedLoanBooks(),
    inputTemplate: inputTemplate.default,
    nbfiOutput: nbfiOutput.default,
    cashflow: cashflow.default,
    mockCovenants: mockCovenants.default,
    mockDocuments: mockDocuments.default,
    mockMonitoring: mockMonitoring.default,
    mockEarlyWarnings: mockEarlyWarnings.default,
  };
}

const NBFI_PROVISIONING = [
  { bucket: 'normal', dpdMin: 0, dpdMax: 30, provisionPercent: 1 },
  { bucket: 'watch', dpdMin: 31, dpdMax: 60, provisionPercent: 5 },
  { bucket: 'substandard', dpdMin: 61, dpdMax: 90, provisionPercent: 25 },
  { bucket: 'doubtful', dpdMin: 91, dpdMax: 180, provisionPercent: 50 },
  { bucket: 'loss', dpdMin: 181, dpdMax: 9999, provisionPercent: 100 },
];

const LENDER_PROVISIONING = [
  { bucket: 'normal', dpdMin: 0, dpdMax: 30, provisionPercent: 1 },
  { bucket: 'watch', dpdMin: 31, dpdMax: 60, provisionPercent: 10 },
  { bucket: 'substandard', dpdMin: 61, dpdMax: 90, provisionPercent: 50 },
  { bucket: 'doubtful', dpdMin: 91, dpdMax: 120, provisionPercent: 75 },
  { bucket: 'loss', dpdMin: 121, dpdMax: 9999, provisionPercent: 100 },
];

const DEFAULT_COVENANTS = [
  { metric: 'CRAR (Capital to Risk-weighted Assets)', operator: '>=', threshold: 15, frequency: 'quarterly', format: 'percent' },
  { metric: 'Net NPA Ratio', operator: '<=', threshold: 3, frequency: 'quarterly', format: 'percent' },
  { metric: 'Collection Efficiency', operator: '>=', threshold: 98, frequency: 'monthly', format: 'percent' },
  { metric: 'PAR 30', operator: '<=', threshold: 5, frequency: 'monthly', format: 'percent' },
  { metric: 'Debt-to-Equity Ratio', operator: '<=', threshold: 4.0, frequency: 'quarterly', format: 'ratio' },
];

const DEFAULT_DOCUMENTS = [
  { name: 'MIS Portfolio Report', frequency: 'monthly', nextDueDate: '2025-12-05' },
  { name: 'Compliance Certificate', frequency: 'quarterly', nextDueDate: '2025-12-31' },
  { name: 'Unaudited Quarterly Financials', frequency: 'quarterly', nextDueDate: '2025-12-31' },
  { name: 'Audited Annual Financials', frequency: 'annually', nextDueDate: '2026-03-31' },
  { name: 'Tax Compliance Certificate', frequency: 'annually', nextDueDate: '2026-06-30' },
  { name: 'Management Accounts', frequency: 'quarterly', nextDueDate: '2025-12-31' },
];

async function main() {
  console.log('🌱 Seeding database...');

  const {
    NBFI_SEEDS,
    allLoanBooks,
    inputTemplate,
    nbfiOutput,
    cashflow,
    mockCovenants,
    mockDocuments,
    mockMonitoring,
    mockEarlyWarnings,
  } = await loadSeedData();

  // Clear existing data
  await db.auditLog.deleteMany();
  await db.poolSelection.deleteMany();
  await db.loanBook.deleteMany();
  await db.provisioningRule.deleteMany();
  await db.documentSubmission.deleteMany();
  await db.document.deleteMany();
  await db.covenantReading.deleteMany();
  await db.covenantDefinition.deleteMany();
  await db.commentary.deleteMany();
  await db.nbfi.deleteMany();

  const financialData = { inputTemplate, nbfiOutput, cashFlow: cashflow };

  for (let idx = 0; idx < NBFI_SEEDS.length; idx++) {
    const s = NBFI_SEEDS[idx];
    const isFirst = idx === 0;

    console.log(`  Creating ${s.name}...`);

    // Create NBFI
    await db.nbfi.create({
      data: {
        id: s.id,
        name: s.name,
        keyContacts: s.keyContacts,
        fundingAmount: s.fundingAmount,
        description: s.description,
        status: s.status,
        dateOnboarded: s.dateOnboarded,
        setupCompleted: s.status === 'monitoring' || s.status === 'setup_complete',
        financialData: JSON.stringify(financialData),
        monitoringData: isFirst ? JSON.stringify(mockMonitoring) : null,
        earlyWarnings: isFirst ? JSON.stringify({ alerts: (mockEarlyWarnings as { alerts: unknown[] }).alerts }) : null,
        loanBookMeta: isFirst
          ? JSON.stringify({ source: 'nbfi_portal', uploadedAt: '2025-11-15T09:30:00Z', uploadedBy: 'Alice Wanjiku', rowCount: 520, totalBalance: 892000000, filename: 'apex_finance_loanbook_Q4_2025.csv' })
          : null,
        recommendation: isFirst ? 'Approved for KES 150M facility based on strong financial performance.' : undefined,
        approverComments: isFirst ? 'Approved. Solid track record and adequate capital ratios.' : undefined,
      },
    });

    // Commentary for first NBFI
    if (isFirst) {
      await db.commentary.create({
        data: {
          id: 'c1',
          nbfiId: s.id,
          author: 'Sarah Kimani',
          role: 'analyst',
          text: 'Strong financials with consistent growth. Recommend for approval.',
          timestamp: '2024-08-20T10:00:00Z',
        },
      });
    }

    // Covenants (for monitoring/setup_complete NBFIs)
    if (s.status === 'monitoring' || s.status === 'setup_complete') {
      const covDefs = isFirst
        ? (mockCovenants as { definitions: { id: string; metric: string; operator: string; threshold: number; frequency: string; format: string }[] }).definitions
        : DEFAULT_COVENANTS.map((c, i) => ({ id: `${s.id}-cov-${i + 1}`, ...c }));

      for (const c of covDefs) {
        await db.covenantDefinition.create({
          data: {
            id: c.id || uuidv4(),
            nbfiId: s.id,
            metric: c.metric,
            operator: c.operator,
            threshold: c.threshold,
            frequency: c.frequency,
            format: c.format,
          },
        });
      }

      // Covenant readings for first NBFI
      if (isFirst && (mockCovenants as { readings: { covenantId: string; value: number; date: string; status: string }[] }).readings) {
        for (const r of (mockCovenants as { readings: { covenantId: string; value: number; date: string; status: string }[] }).readings) {
          await db.covenantReading.create({
            data: {
              id: uuidv4(),
              nbfiId: s.id,
              covenantId: r.covenantId,
              value: r.value,
              date: r.date,
              status: r.status,
            },
          });
        }
      }

      // Documents
      type DocSeed = { id: string; name: string; frequency: string; nextDueDate: string; status: string; submittedDate?: string; submittedBy?: string };
      const docs: DocSeed[] = isFirst
        ? (mockDocuments as DocSeed[])
        : DEFAULT_DOCUMENTS.map((d, i) => ({ id: `${s.id}-doc-${i + 1}`, ...d, status: 'pending' }));

      for (const d of docs) {
        await db.document.create({
          data: {
            id: d.id || uuidv4(),
            nbfiId: s.id,
            name: d.name,
            frequency: d.frequency,
            nextDueDate: d.nextDueDate,
            status: d.status,
            submittedDate: d.submittedDate || null,
            submittedBy: d.submittedBy || null,
          },
        });
      }

      // Provisioning rules
      for (const r of NBFI_PROVISIONING) {
        await db.provisioningRule.create({
          data: { nbfiId: s.id, policyType: 'nbfi', ...r },
        });
      }
      for (const r of LENDER_PROVISIONING) {
        await db.provisioningRule.create({
          data: { nbfiId: s.id, policyType: 'lender', ...r },
        });
      }
    }

    // Loan books
    const loanRows = allLoanBooks[s.id];
    if (loanRows && loanRows.length > 0) {
      await db.loanBook.create({
        data: {
          nbfiId: s.id,
          rows: JSON.stringify(loanRows),
        },
      });
    }

    // Pool selection for first NBFI (confirmed)
    if (isFirst) {
      await db.poolSelection.create({
        data: {
          nbfiId: s.id,
          excludedSegments: JSON.stringify(['MSME']),
          filterSnapshot: JSON.stringify({
            loanAmountMin: 20000,
            loanAmountMax: 500000,
            geographies: ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu'],
            products: ['Boda-Boda', 'Agri-Finance', 'Check-off', 'SACCO'],
          }),
          confirmedAt: '2024-09-10T14:00:00Z',
        },
      });
    }

    // Audit log entry
    await db.auditLog.create({
      data: {
        nbfiId: s.id,
        userId: 'seed',
        userName: 'System Seed',
        action: 'created',
        toStatus: s.status,
        notes: 'Seeded from initial data',
      },
    });
  }

  const count = await db.nbfi.count();
  console.log(`✅ Seeded ${count} NBFIs successfully.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
