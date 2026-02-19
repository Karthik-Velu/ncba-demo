// ============================================================
// Core NBFI / Originator Types
// ============================================================

export type NBFIStatus =
  | 'draft'
  | 'uploading'
  | 'spreading'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'pool_selected'
  | 'setup_complete'
  | 'monitoring';

export interface NBFIRecord {
  id: string;
  name: string;
  keyContacts: string;
  fundingAmount: number;
  description: string;
  status: NBFIStatus;
  dateOnboarded: string;
  financialData?: FinancialData;
  commentary?: CommentaryEntry[];
  recommendation?: string;
  approverComments?: string;
  covenants?: CovenantDef[];
  covenantReadings?: CovenantReading[];
  documents?: DocumentRequirement[];
  provisioningRules?: {
    nbfi: ProvisioningRule[];
    lender: ProvisioningRule[];
  };
  earlyWarnings?: EarlyWarningAlert[];
  monitoringData?: MonitoringData;
  setupCompleted?: boolean;
  loanBookMeta?: LoanBookUploadMeta;
  transactionType?: TransactionType;
  securitisationStructure?: SecuritisationStructure;
}

export interface CommentaryEntry {
  id: string;
  author: string;
  role: 'analyst' | 'approver';
  text: string;
  timestamp: string;
}

// ============================================================
// Financial Data Structures
// ============================================================

export interface FinancialData {
  inputTemplate: InputTemplateData;
  nbfiOutput: NBFIOutputData;
  cashFlow: CashFlowData;
}

// ---- Input Template ----

export interface InputTemplateData {
  orgName: string;
  periods: PeriodInfo[];
  partA: {
    balanceSheet: FinancialSection;
    profitAndLoss: FinancialSection;
  };
  partB: FinancialSection[];
  metadata: {
    investmentInGroup: number[];
    monthsInYear: number[];
  };
}

export interface PeriodInfo {
  date: string;
  type: string;
  months: number;
}

export interface FinancialSection {
  title: string;
  rows: FinancialRow[];
}

export interface FinancialRow {
  label: string;
  indent: number;
  isHeader: boolean;
  isTotal: boolean;
  isEditable: boolean;
  values: (number | null)[];
  key: string;
}

// ---- NBFI Output ----

export interface NBFIOutputData {
  periods: PeriodInfo[];
  balanceSheet: NBFIOutputSection;
  incomeStatement: NBFIOutputSection;
  cashflowSummary: NBFIOutputSection;
  dscr: DSCRData;
  bccSummary: BCCSummaryRow[];
}

export interface NBFIOutputSection {
  title: string;
  rows: NBFIOutputRow[];
}

export interface NBFIOutputRow {
  label: string;
  values: (number | null)[];
  pctChanges: (number | null)[];
  isHeader: boolean;
  isTotal: boolean;
  indent: number;
  key: string;
}

export interface DSCRData {
  title: string;
  cashflowFromOps: DSCRSection;
  loanRepayments: DSCRSection;
  dscrResult: (number | string | null)[];
}

export interface DSCRSection {
  rows: NBFIOutputRow[];
}

export interface BCCSummaryRow {
  label: string;
  values: (number | string | null)[];
  pctChanges: (number | string | null)[];
  key: string;
  format?: 'number' | 'percent' | 'ratio' | 'text';
}

// ---- Cash Flow Statement ----

export interface CashFlowData {
  periods: PeriodInfo[];
  sections: CashFlowSection[];
}

export interface CashFlowSection {
  title: string;
  rows: FinancialRow[];
  subtotal?: FinancialRow;
}

// ============================================================
// Loan-level / Portfolio EDA Types
// ============================================================

export interface LoanLevelRow {
  loanId: string;
  applicationId: string;
  dpdAsOfReportingDate: number;
  currentBalance: number;
  loanDisbursedAmount: number;
  totalOverdueAmount: number;
  loanDisbursedDate: string;
  interestRate: number;
  loanWrittenOff: boolean;
  repossession: boolean;
  recoveryAfterWriteoff: number;
  geography?: string;
  product?: string;
  segment?: string;
  borrowerName?: string;
  residualTenureMonths?: number;
}

export function getDpdBucket(dpd: number): string {
  if (dpd <= 0) return 'Current';
  if (dpd <= 30) return '1-30';
  if (dpd <= 60) return '31-60';
  if (dpd <= 90) return '61-90';
  if (dpd <= 180) return '91-180';
  return '180+';
}

export const DPD_BUCKETS = ['Current', '1-30', '31-60', '61-90', '91-180', '180+'] as const;

export interface PoolSelectionState {
  excludedSegments: string[];
  filterSnapshot: {
    loanAmountMin?: number;
    loanAmountMax?: number;
    tenureMin?: number;
    tenureMax?: number;
    rateMin?: number;
    rateMax?: number;
    dpdBuckets?: string[];
    geographies: string[];
    products: string[];
  };
  confirmedAt?: string;
}

export interface LoanBookUploadMeta {
  source: 'sftp' | 'lender_upload' | 'nbfi_portal';
  uploadedAt: string;
  uploadedBy: string;
  rowCount: number;
  totalBalance: number;
  filename?: string;
}

// ============================================================
// Covenant & Setup Types
// ============================================================

export interface CovenantDef {
  id: string;
  metric: string;
  operator: '>=' | '<=' | '>' | '<';
  threshold: number;
  frequency: 'monthly' | 'quarterly' | 'annually';
  format: 'percent' | 'ratio' | 'number';
}

export interface CovenantReading {
  covenantId: string;
  value: number;
  date: string;
  status: 'compliant' | 'breached' | 'watch';
}

export interface DocumentRequirement {
  id: string;
  name: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  nextDueDate: string;
  status: 'submitted' | 'pending' | 'overdue';
  submittedDate?: string;
  submittedBy?: string;
  submissions?: { date: string; filename: string; uploadedBy: string }[];
}

export interface ProvisioningRule {
  bucket: 'normal' | 'watch' | 'substandard' | 'doubtful' | 'loss';
  dpdMin: number;
  dpdMax: number;
  provisionPercent: number;
}

// ============================================================
// Early Warning Types
// ============================================================

export interface EarlyWarningAlert {
  id: string;
  metric: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  predictedBreachDate?: string;
  trend: 'deteriorating' | 'stable' | 'improving';
}

// ============================================================
// Monitoring Types
// ============================================================

export interface MonitoringData {
  principalOutstanding: number;
  collectionEfficiency: number;
  liveLoans: number;
  delinquencyByVintage: { vintage: string; rate: number }[];
  delinquencyByGeo: { geo: string; rate: number }[];
  compositionByPurpose: { purpose: string; pct: number }[];
  compositionByCounty: { county: string; pct: number }[];
  wholesaleLoan?: {
    facilityAmount: number;
    principalOutstanding: number;
    disbursementDate: string;
    maturityDate: string;
    interestRate: number;
    nextRepaymentDate: string;
    nextRepaymentAmount: number;
    repaymentSchedule: { date: string; amount: number; status: string }[];
  };
  impactMetrics?: {
    totalBorrowers: number;
    femaleBorrowers: number;
    ruralBorrowers: number;
    avgLoanSize: number;
    jobsSupported: number;
  };
}

// ============================================================
// Securitisation Types
// ============================================================

export type TransactionType = 'wholesale' | 'securitisation';

export interface SecuritisationStructure {
  seniorPct: number;
  mezzaninePct: number;
  equityPct: number;
  overCollateralisationPct: number;
  seniorCoupon: number;
  mezzanineCoupon: number;
  finalised: boolean;
}


// ============================================================
// Auth / User Types
// ============================================================

export type UserRole = 'analyst' | 'approver' | 'nbfi_user';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  nbfiId?: string;
}

// ============================================================
// Template Schema (for driving the UI dynamically)
// ============================================================

export interface TemplateSchema {
  inputTemplate: {
    partA: SectionSchema[];
    partB: SectionSchema[];
  };
  cashFlow: SectionSchema[];
  nbfiOutput: SectionSchema[];
}

export interface SectionSchema {
  title: string;
  key: string;
  rows: RowSchema[];
}

export interface RowSchema {
  label: string;
  key: string;
  indent: number;
  isHeader: boolean;
  isTotal: boolean;
  isEditable: boolean;
  formula?: string;
}
