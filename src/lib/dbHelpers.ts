/**
 * Helpers to convert between Prisma DB rows and the NBFIRecord / AppContext types.
 * The Prisma schema stores nested/JSON data as String columns (SQLite has no JSON type).
 * These helpers parse/stringify as needed.
 */

import type {
  NBFIRecord,
  LoanLevelRow,
  PoolSelectionState,
  CovenantDef,
  CovenantReading,
  DocumentRequirement,
  ProvisioningRule,
} from './types';

// --------------------------------------------------------------------------
// Types for the full Prisma include result we use throughout the API
// --------------------------------------------------------------------------
type PrismaSubmission = {
  id: string;
  documentId: string;
  date: string;
  filename: string;
  uploadedBy: string;
};

type PrismaDocument = {
  id: string;
  nbfiId: string;
  name: string;
  frequency: string;
  nextDueDate: string;
  status: string;
  submittedDate: string | null;
  submittedBy: string | null;
  submissions: PrismaSubmission[];
};

type PrismaCovenantDef = {
  id: string;
  nbfiId: string;
  metric: string;
  operator: string;
  threshold: number;
  frequency: string;
  format: string;
  readings: PrismaCovenantReading[];
};

type PrismaCovenantReading = {
  id: string;
  nbfiId: string;
  covenantId: string;
  value: number;
  date: string;
  status: string;
};

type PrismaCommentary = {
  id: string;
  nbfiId: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
};

type PrismaProvRule = {
  id: string;
  nbfiId: string;
  policyType: string;
  bucket: string;
  dpdMin: number;
  dpdMax: number;
  provisionPercent: number;
};

export type PrismaNbfiFull = {
  id: string;
  name: string;
  keyContacts: string;
  fundingAmount: number;
  description: string;
  status: string;
  dateOnboarded: string;
  recommendation: string | null;
  approverComments: string | null;
  setupCompleted: boolean;
  transactionType: string | null;
  loanBookMeta: string | null;
  securitisationStructure: string | null;
  monitoringData: string | null;
  earlyWarnings: string | null;
  financialData: string | null;
  commentaries: PrismaCommentary[];
  covenantDefs: PrismaCovenantDef[];
  covenantReadings: PrismaCovenantReading[];
  documents: PrismaDocument[];
  provRules: PrismaProvRule[];
  poolSelection: {
    id: string;
    nbfiId: string;
    excludedSegments: string;
    filterSnapshot: string;
    confirmedAt: string | null;
  } | null;
};

// --------------------------------------------------------------------------
// Convert Prisma row → NBFIRecord (AppContext shape)
// --------------------------------------------------------------------------
export function toNBFIRecord(n: PrismaNbfiFull): NBFIRecord {
  const covenants: CovenantDef[] = n.covenantDefs.map((c) => ({
    id: c.id,
    metric: c.metric,
    operator: c.operator as CovenantDef['operator'],
    threshold: c.threshold,
    frequency: c.frequency as CovenantDef['frequency'],
    format: c.format as CovenantDef['format'],
  }));

  const covenantReadings: CovenantReading[] = n.covenantReadings.map((r) => ({
    covenantId: r.covenantId,
    value: r.value,
    date: r.date,
    status: r.status as CovenantReading['status'],
  }));

  const documents: DocumentRequirement[] = n.documents.map((d) => ({
    id: d.id,
    name: d.name,
    frequency: d.frequency as DocumentRequirement['frequency'],
    nextDueDate: d.nextDueDate,
    status: d.status as DocumentRequirement['status'],
    submittedDate: d.submittedDate ?? undefined,
    submittedBy: d.submittedBy ?? undefined,
    submissions: d.submissions.map((s) => ({
      date: s.date,
      filename: s.filename,
      uploadedBy: s.uploadedBy,
    })),
  }));

  const nbfiProvRules = n.provRules
    .filter((r) => r.policyType === 'nbfi')
    .map((r) => ({ bucket: r.bucket as ProvisioningRule['bucket'], dpdMin: r.dpdMin, dpdMax: r.dpdMax, provisionPercent: r.provisionPercent }));

  const lenderProvRules = n.provRules
    .filter((r) => r.policyType === 'lender')
    .map((r) => ({ bucket: r.bucket as ProvisioningRule['bucket'], dpdMin: r.dpdMin, dpdMax: r.dpdMax, provisionPercent: r.provisionPercent }));

  const record: NBFIRecord = {
    id: n.id,
    name: n.name,
    keyContacts: n.keyContacts,
    fundingAmount: n.fundingAmount,
    description: n.description,
    status: n.status as NBFIRecord['status'],
    dateOnboarded: n.dateOnboarded,
    recommendation: n.recommendation ?? undefined,
    approverComments: n.approverComments ?? undefined,
    setupCompleted: n.setupCompleted,
    transactionType: (n.transactionType as NBFIRecord['transactionType']) ?? undefined,
    commentary: n.commentaries.map((c) => ({
      id: c.id,
      author: c.author,
      role: c.role as 'analyst' | 'approver',
      text: c.text,
      timestamp: c.timestamp,
    })),
  };

  if (covenants.length) record.covenants = covenants;
  if (covenantReadings.length) record.covenantReadings = covenantReadings;
  if (documents.length) record.documents = documents;
  if (nbfiProvRules.length || lenderProvRules.length) {
    record.provisioningRules = { nbfi: nbfiProvRules, lender: lenderProvRules };
  }
  if (n.loanBookMeta) record.loanBookMeta = JSON.parse(n.loanBookMeta);
  if (n.securitisationStructure) record.securitisationStructure = JSON.parse(n.securitisationStructure);
  if (n.monitoringData) record.monitoringData = JSON.parse(n.monitoringData);
  if (n.earlyWarnings) record.earlyWarnings = JSON.parse(n.earlyWarnings);
  if (n.financialData) record.financialData = JSON.parse(n.financialData);

  return record;
}

// --------------------------------------------------------------------------
// Convert Prisma PoolSelection → PoolSelectionState
// --------------------------------------------------------------------------
export function toPoolSelectionState(ps: {
  excludedSegments: string;
  filterSnapshot: string;
  confirmedAt: string | null;
}): PoolSelectionState {
  return {
    excludedSegments: JSON.parse(ps.excludedSegments),
    filterSnapshot: JSON.parse(ps.filterSnapshot),
    confirmedAt: ps.confirmedAt ?? undefined,
  };
}

// --------------------------------------------------------------------------
// The standard Prisma include object for full NBFI queries
// --------------------------------------------------------------------------
export const NBFI_INCLUDE = {
  commentaries: true,
  covenantDefs: {
    include: { readings: true },
  },
  covenantReadings: true,
  documents: {
    include: { submissions: true },
  },
  provRules: true,
  poolSelection: true,
} as const;

// --------------------------------------------------------------------------
// Parse loan book rows from DB
// --------------------------------------------------------------------------
export function parseLoanRows(loanBooks: { rows: string }[]): LoanLevelRow[] {
  if (!loanBooks.length) return [];
  // Use the most recent loan book
  return JSON.parse(loanBooks[loanBooks.length - 1].rows) as LoanLevelRow[];
}
