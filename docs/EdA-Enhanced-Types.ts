/**
 * Enhanced EdA (Exploratory Data Analysis) Types
 *
 * This file extends the basic LoanLevelRow with comprehensive fields
 * needed for true roll rate, vintage, and loss analysis.
 *
 * Backward compatible: Existing LoanLevelRow fields remain unchanged.
 */

// ============================================================
// Loan Status Enum
// ============================================================

export type LoanStatus =
  | 'active'          // Loan in good standing or delinquent but performing
  | 'paid_off'        // Fully repaid before maturity
  | 'defaulted'       // In default (DPD > 90 + creditor action)
  | 'written_off'     // Charged off by lender
  | 'cured'           // Returned to current after prior delinquency
  | 'restructured'    // Terms modified (e.g., extended tenure)
  | 'refinanced'      // Original loan paid off by new loan
  | 'dormant'         // No activity for extended period
  | 'matured';        // Reached end of original tenure

export type StatusChangeReason =
  | 'full_repayment'
  | 'partial_repayment'
  | 'forced_closure'
  | 'covenant_breach'
  | 'regulatory_action'
  | 'voluntary_restructure'
  | 'automatic_cure'
  | 'write_off_directive';

export type LoanPurposeCategory =
  | 'agriculture'
  | 'business_expansion'
  | 'working_capital'
  | 'equipment_purchase'
  | 'real_estate'
  | 'education'
  | 'healthcare'
  | 'trade_finance'
  | 'personal'
  | 'other';

export type BorrowerType = 'individual' | 'sme' | 'corporation' | 'cooperative' | 'other';

export type CollateralType =
  | 'motor_vehicle'
  | 'real_estate'
  | 'equipment'
  | 'inventory'
  | 'receivables'
  | 'personal_guarantee'
  | 'none'
  | 'other';

// ============================================================
// Core Loan Record - Enhanced
// ============================================================

/**
 * Enhanced Loan Book Row with temporal tracking and payment history
 *
 * Usage:
 * - Backward compatible with LoanLevelRow
 * - New fields are optional (marked with ?)
 * - Prior period fields enable roll rate calculation
 * - Payment history fields enable loss prediction
 */
export interface LoanBookRowEnhanced {
  // ─────────────────────────────────────────
  // 1. CORE IDENTIFIERS (Required)
  // ─────────────────────────────────────────

  loanId: string;                    // Unique immutable loan identifier
  applicationId: string;             // Application reference
  borrowerIdHash?: string;           // Hashed borrower ID for PII safety

  // ─────────────────────────────────────────
  // 2. REPORTING PERIOD & LIFECYCLE (Enhanced)
  // ─────────────────────────────────────────

  reportingDate: string;             // NEW: YYYY-MM-DD, end of period
  reportingCycle: 'monthly' | 'quarterly'; // NEW: frequency of this feed
  loanStatus: LoanStatus;            // NEW: replaces simple loanWrittenOff
  loanStatusChangeDate?: string;     // NEW: when status last changed
  statusChangeReason?: StatusChangeReason; // NEW: why status changed

  // ─────────────────────────────────────────
  // 3. CURRENT PERIOD (Existing + Enhanced)
  // ─────────────────────────────────────────

  dpdAsOfReportingDate: number;      // ✓ Days past due (>= 0)
  currentBalance: number;            // ✓ Outstanding balance in KES
  loanDisbursedAmount: number;       // ✓ Original disbursed amount
  totalOverdueAmount: number;        // ✓ Total overdue
  loanDisbursedDate: string;         // ✓ Disbursement date (YYYY-MM-DD)
  interestRate: number;              // ✓ Annual interest rate (0-100%)
  loanWrittenOff: boolean;           // ✓ For backward compatibility
  repossession: boolean;             // ✓ Collateral repossessed
  recoveryAfterWriteoff: number;     // ✓ Recovery amount post write-off

  interestAccrued?: number;          // NEW: Interest accrued but unpaid
  penaltyCharges?: number;           // NEW: Late payment penalties
  provisioning?: number;             // NEW: Provisioning % against balance

  // ─────────────────────────────────────────
  // 4. PRIOR PERIOD PERFORMANCE (NEW)
  // ─────────────────────────────────────────
  // Critical for roll rate analysis - enables transition calculation

  reportingDatePrior?: string;                // Previous period date
  dpdPriorPeriod?: number;                    // DPD in prior period
  loanStatusPrior?: LoanStatus;               // Loan status in prior period
  currentBalancePriorPeriod?: number;         // Balance prior period
  totalOverdueAmountPriorPeriod?: number;     // Overdue prior period
  daysInArrearsPriorPeriod?: number;          // Days in arrears prior

  // ─────────────────────────────────────────
  // 5. PAYMENT HISTORY (NEW - For Loss Prediction)
  // ─────────────────────────────────────────

  daysSinceLastPayment?: number;             // Days since last principal payment
  daysSinceLastInterestPayment?: number;     // Days since last interest payment
  consecutiveMonthsMissed?: number;          // Consecutive missed payments
  totalPaymentsMissed?: number;              // Cumulative missed payments (lifetime)
  numberOfPaymentsDueInPeriod?: number;      // Regular payments due in period
  numberOfPaymentsMadeInPeriod?: number;     // Payments made in period
  numberOfPartialPaymentsMade?: number;      // Count of partial (not full) payments
  loanAgeMonths?: number;                    // Months since disbursement
  residualTenureMonths?: number;             // ✓ Remaining loan tenure (months)
  maximumDpdReached?: number;                // Worst DPD loan has ever hit (lifetime)
  dateMaximumDpdReached?: string;            // When loan hit worst DPD
  cureSinceLastDefault?: number;             // Days since curing from default
  numberOfLoansForBorrower?: number;         // Active loans for borrower
  totalOutstandingForBorrower?: number;      // Total exposure to borrower

  // ─────────────────────────────────────────
  // 6. GEOGRAPHIC & OPERATIONAL DIMENSIONS
  // ─────────────────────────────────────────

  geography?: string;                // ✓ Broad region (e.g., Nairobi)
  county?: string;                   // NEW: Specific county
  subcounty?: string;                // NEW: Sub-county level
  branchId?: string;                 // NEW: Originating branch
  relationshipOfficer?: string;      // NEW: Account officer

  // ─────────────────────────────────────────
  // 7. PRODUCT & BORROWER DIMENSIONS
  // ─────────────────────────────────────────

  product?: string;                  // ✓ Product type (e.g., SME Loan)
  productSubtype?: string;           // NEW: Specific variant
  loanPurpose?: string;              // NEW: Use of funds
  loanPurposeCategory?: LoanPurposeCategory; // NEW: Standardized category
  segment?: string;                  // ✓ Customer segment (e.g., Micro, SME)
  borrowerType?: BorrowerType;       // NEW: Individual vs. Business
  borrowerIndustry?: string;         // NEW: Industry classification
  borrowerName?: string;             // ✓ Borrower name

  // ─────────────────────────────────────────
  // 8. COLLATERAL & RISK DIMENSIONS
  // ─────────────────────────────────────────

  collateralType?: CollateralType;   // NEW: Type of collateral
  collateralValue?: number;          // NEW: Estimated current value
  loanToValue?: number;              // NEW: LTV ratio at origination
  currentLtv?: number;               // NEW: Current LTV ratio

  // ─────────────────────────────────────────
  // 9. VINTAGE & COHORT DIMENSIONS
  // ─────────────────────────────────────────

  vintageQuarter?: string;           // NEW: YYYY-Qn for cohort analysis
  vintageMonth?: string;             // NEW: YYYY-MM for more granular bucketing
}

// ============================================================
// Legacy Type (for backward compatibility)
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

// ============================================================
// Roll Rate Analysis Types
// ============================================================

/**
 * Represents a single loan's transition across periods
 */
export interface TransitionObservation {
  loanId: string;
  reportingDateFrom: string;
  reportingDateTo: string;
  bucketFrom: string;        // e.g., "1-30"
  bucketTo: string;          // e.g., "31-60"
  balanceFrom: number;
  balanceTo: number;
  paymentAmount: number;     // Balance difference (after payment)
  daysHeld: number;          // Days between observations
  loanStatus?: LoanStatus;
  segment?: string;          // For segmented roll rate
  geography?: string;        // For geographic roll rate
  vintage?: string;          // For vintage-specific transitions
}

/**
 * Observed transition matrix for a specific segment/period
 */
export interface ObservedTransitionMatrix {
  period: string;                    // "2025-01_to_2025-02"
  segmentKey: string;                // "geo:Nairobi|product:SME" or "all"
  segmentValues?: Record<string, string>; // {"geography": "Nairobi", "product": "SME"}

  // Transition matrix: from_bucket → {to_bucket: {count, balance, percentage}}
  transitions: Record<string, Record<string, {
    count: number;           // Number of loans
    balance: number;         // Total balance carried
    percentage: number;      // % of loans that made this transition
    avgBalance: number;      // Average balance of transitioned loans
  }>>;

  totalLoans: number;
  totalBalance: number;

  // Key metrics
  cureRate: number;          // % that moved back to Current
  defaultRate: number;       // % that moved to Default/Written Off
  earlyPayoffRate: number;   // % that paid off

  // Data quality
  observationCount: number;  // Number of transitions observed
  dataQualityScore: number;  // 0-100, lower if missing prior data
}

/**
 * Loss Rate by DPD Bucket (observed)
 */
export interface ObservedLossRateByBucket {
  period: string;
  bucket: string;            // "Current", "1-30", "31-60", etc.

  defaultRate: number;       // % that eventually defaulted
  writeoffRate: number;      // % that were written off
  recoveryRate: number;      // % of written off that recovered something

  avgDaysToDefault: number;  // Average time to default from this bucket

  loanCount: number;
  balanceAtRisk: number;
}

/**
 * Vintage Analysis Results
 */
export interface VintageAnalysis {
  vintage: string;           // "2024-Q1" or "2024-01"

  // Origination metrics
  originalLoanCount: number;
  originalTotalBalance: number;

  // Current status
  currentLoanCount: number;
  currentLiveLoans: number;
  currentBalance: number;

  // Performance metrics
  currentDpdDistribution: Record<string, number>; // bucket → count
  parRate: number;           // % PAR 30+
  defaultRate: number;       // % that have defaulted
  writeoffRate: number;      // % written off

  // Loss metrics
  estimatedLossRate: number;
  expectedLossAmount: number;
  actualLossAmount: number;  // If data available

  // Cure metrics
  cureRate: number;          // % that returned to current from delinquency
  relapsePct: number;        // % that returned to delinquency after cure
}

/**
 * Segmented Performance Comparison
 */
export interface SegmentedPerformance {
  segmentValue: string;      // e.g., "Nairobi", "SME Loan"

  // Portfolio stats
  loanCount: number;
  totalBalance: number;

  // Performance
  parRate: number;
  defaultRate: number;

  // Loss
  estimatedLossRate: number;
  estimatedLossAmount: number;

  // Historical trend (if multiple periods available)
  trend?: {
    previousPeriod: number;
    currentPeriod: number;
    percentChange: number;
    direction: 'improving' | 'stable' | 'deteriorating';
  };
}

// ============================================================
// Validation & Quality Types
// ============================================================

export interface DataQualityIssue {
  loanId: string;
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestedValue?: string;
}

export interface LoanBookValidationResult {
  totalRecords: number;
  validRecords: number;
  issuedCount: number;
  issues: DataQualityIssue[];
  qualityScore: number; // 0-100

  recommendations: string[];
  readyForAnalysis: boolean;
}

// ============================================================
// Helper Functions
// ============================================================

export function getDpdBucket(dpd: number): string {
  if (dpd <= 0) return 'Current';
  if (dpd <= 30) return '1-30';
  if (dpd <= 60) return '31-60';
  if (dpd <= 90) return '61-90';
  if (dpd <= 180) return '91-180';
  return '180+';
}

export const DPD_BUCKETS = ['Current', '1-30', '31-60', '61-90', '91-180', '180+'] as const;

/**
 * Calculate transition from two loan observations
 */
export function calculateTransition(
  priorLoan: LoanBookRowEnhanced,
  currentLoan: LoanBookRowEnhanced
): TransitionObservation | null {
  if (priorLoan.loanId !== currentLoan.loanId) {
    return null; // Different loans
  }

  const bucketFrom = getDpdBucket(priorLoan.dpdAsOfReportingDate);
  const bucketTo = getDpdBucket(currentLoan.dpdAsOfReportingDate);

  const paymentAmount =
    (priorLoan.currentBalancePriorPeriod || priorLoan.currentBalance) -
    currentLoan.currentBalance;

  return {
    loanId: currentLoan.loanId,
    reportingDateFrom: priorLoan.reportingDate,
    reportingDateTo: currentLoan.reportingDate,
    bucketFrom,
    bucketTo,
    balanceFrom: priorLoan.currentBalancePriorPeriod || priorLoan.currentBalance,
    balanceTo: currentLoan.currentBalance,
    paymentAmount,
    daysHeld: priorLoan.reportingDatePrior ? dateDifference(priorLoan.reportingDatePrior, currentLoan.reportingDate) : 0,
    loanStatus: currentLoan.loanStatus,
    segment: currentLoan.segment,
    geography: currentLoan.geography,
    vintage: currentLoan.vintageQuarter,
  };
}

/**
 * Calculate days between two date strings (YYYY-MM-DD)
 */
function dateDifference(dateFrom: string, dateTo: string): number {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determine if a loan is in early warning status
 */
export function getEarlyWarningStatus(loan: LoanBookRowEnhanced): {
  level: 'green' | 'yellow' | 'orange' | 'red';
  signals: string[];
} {
  const signals: string[] = [];

  // DPD signals
  if (loan.dpdAsOfReportingDate > 90) {
    signals.push('DPD > 90 days');
  } else if (loan.dpdAsOfReportingDate > 60) {
    signals.push('DPD > 60 days');
  } else if (loan.dpdAsOfReportingDate > 30) {
    signals.push('DPD > 30 days');
  }

  // Payment history signals
  if (loan.daysSinceLastPayment && loan.daysSinceLastPayment > 45) {
    signals.push(`No payment for ${loan.daysSinceLastPayment} days`);
  }

  if (loan.consecutiveMonthsMissed && loan.consecutiveMonthsMissed >= 2) {
    signals.push(`${loan.consecutiveMonthsMissed} consecutive months missed`);
  }

  // Deterioration signals
  if (
    loan.dpdPriorPeriod !== undefined &&
    loan.dpdAsOfReportingDate > loan.dpdPriorPeriod + 20
  ) {
    signals.push(`Rapid deterioration (DPD +${loan.dpdAsOfReportingDate - loan.dpdPriorPeriod})`);
  }

  // LTV signals
  if (loan.currentLtv && loan.currentLtv > 95) {
    signals.push(`Very high LTV: ${loan.currentLtv.toFixed(1)}%`);
  }

  // Status signals
  if (loan.loanStatus === 'defaulted' || loan.loanStatus === 'written_off') {
    signals.push(`Status: ${loan.loanStatus}`);
  }

  // Determine level
  let level: 'green' | 'yellow' | 'orange' | 'red' = 'green';
  if (signals.length >= 3) {
    level = 'red';
  } else if (signals.length >= 2) {
    level = 'orange';
  } else if (signals.length >= 1) {
    level = 'yellow';
  }

  return { level, signals };
}
