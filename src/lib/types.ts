// ============================================================
// Core NBFI / Originator Types
// ============================================================

export type NBFIStatus = 'draft' | 'uploading' | 'spreading' | 'pending_review' | 'approved' | 'rejected';

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
  date: string;       // e.g. "2023-12-31"
  type: string;       // "Audited" | "Unaudited" | etc.
  months: number;     // typically 12
}

export interface FinancialSection {
  title: string;
  rows: FinancialRow[];
}

export interface FinancialRow {
  label: string;
  indent: number;          // 0 = top-level, 1 = sub, 2 = sub-sub, etc.
  isHeader: boolean;       // section headers (not editable)
  isTotal: boolean;        // computed total rows
  isEditable: boolean;     // whether the user can edit the value
  values: (number | null)[]; // one value per period
  key: string;             // unique identifier for this row
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
  values: (number | null)[];         // one per period
  pctChanges: (number | null)[];     // % annual change between periods
  isHeader: boolean;
  isTotal: boolean;
  indent: number;
  key: string;
}

export interface DSCRData {
  title: string;
  cashflowFromOps: DSCRSection;
  loanRepayments: DSCRSection;
  dscrResult: (number | string | null)[];  // one per period, can be "#DIV/0!"
}

export interface DSCRSection {
  rows: NBFIOutputRow[];
}

export interface BCCSummaryRow {
  label: string;
  values: (number | string | null)[];       // one per period
  pctChanges: (number | string | null)[];   // % annual change
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
// Auth / User Types
// ============================================================

export type UserRole = 'analyst' | 'approver';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
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
  formula?: string; // optional: formula description for computed rows
}
