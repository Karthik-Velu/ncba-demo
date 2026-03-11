# Enhanced EdA File Format Schema
## Supporting True Roll Rate, Vintage, and Loss Analysis

**Version:** 1.0
**Date:** 2026-02-19
**Status:** Proposed

---

## Executive Summary

The current EdA file format captures a single point-in-time snapshot, which is insufficient for roll rate analysis. This document proposes an enhanced schema that:

1. **Supports temporal tracking** — Track the same loan across reporting periods
2. **Enables roll rate calculation** — Calculate observed transitions from actual data
3. **Maintains backward compatibility** — Existing required fields still present
4. **Supports segmented analysis** — Better dimensions for cuts by geography, vintage, product
5. **Improves loss prediction** — More payment history for loss estimation

---

## Schema Structure

The enhanced schema is organized into **5 logical sections**:

1. **Core Identifiers** — Unique loan identification
2. **Reporting Period & Status** — When data is from, current state
3. **Current Period Performance** — Existing fields + new enhancements
4. **Prior Period Performance** — NEW: For roll rate calculation
5. **Loan Lifecycle & Payment History** — NEW: For loss and default prediction
6. **Dimensional Data** — Segmentation for analysis cuts

---

## Detailed Field Specifications

### 1. CORE IDENTIFIERS (Required)

| Field | Type | Length | Example | Purpose |
|-------|------|--------|---------|---------|
| `loanId` | String(50) | 1-50 | `LN-2025-001234` | Unique immutable loan identifier |
| `applicationId` | String(50) | 1-50 | `APP-2024-5678` | Unique application reference |
| `borrowerIdHash` | String(64) | OPTIONAL | `5d41402abc4b2a76b9719d911017c592` | Hashed borrower ID (PII safe, enables tracking same borrower) |

**Notes:**
- `loanId` must remain constant across all reporting periods
- `applicationId` links to original credit application
- `borrowerIdHash` allows cross-loan analysis without storing PII

---

### 2. REPORTING PERIOD & LIFECYCLE (NEW/Enhanced)

| Field | Type | Format | Example | Purpose | Validation |
|-------|------|--------|---------|---------|-----------|
| `reportingDate` | Date | YYYY-MM-DD | `2025-02-28` | **NEW:** End date of reporting period | Must be month-end or quarter-end |
| `reportingCycle` | String(10) | monthly\|quarterly | `monthly` | **NEW:** Frequency of this feed | |
| `loanStatus` | String(20) | *see below | `active` | **NEW:** Current lifecycle status | Required; must match enum |
| `loanStatusChangeDate` | Date | YYYY-MM-DD | `2025-02-28` | **NEW:** Date status last changed | ISO format |
| `statusChangeReason` | String(100) | *see below | `full_repayment` | **NEW:** Why status changed | Optional; enum values |

**`loanStatus` Enum (replaces simple `loanWrittenOff` boolean):**
- `active` — Loan in good standing or delinquent but performing
- `paid_off` — Fully repaid before maturity
- `defaulted` — In default (typically DPD > 90 days + creditor action)
- `written_off` — Charged off by lender
- `cured` — Returned to current after prior delinquency
- `restructured` — Terms modified (e.g., extended tenure)
- `refinanced` — Original loan paid off by new loan
- `dormant` — No activity for extended period
- `matured` — Reached end of original tenure

**`statusChangeReason` Enum Examples:**
- `full_repayment`, `partial_repayment`, `forced_closure`, `covenant_breach`, `regulatory_action`, `voluntary_restructure`, `automatic_cure`, `write_off_directive`

---

### 3. CURRENT PERIOD PERFORMANCE (Existing + Enhanced)

| Field | Type | Example | Status | Notes |
|-------|------|---------|--------|-------|
| `dpdAsOfReportingDate` | Integer | 45 | ✓ EXISTING | Days past due (>= 0) |
| `currentBalance` | Decimal(15,2) | 245000.00 | ✓ EXISTING | Outstanding balance in KES |
| `loanDisbursedAmount` | Decimal(15,2) | 300000.00 | ✓ EXISTING | Original disbursed amount in KES |
| `totalOverdueAmount` | Decimal(15,2) | 12500.00 | ✓ EXISTING | Total amount overdue |
| `loanDisbursedDate` | Date | 2024-03-15 | ✓ EXISTING | Disbursement date |
| `interestRate` | Decimal(5,3) | 18.500 | ✓ EXISTING | Annual interest rate (0-100%) |
| `loanWrittenOff` | Boolean | false | ✓ EXISTING | Write-off indicator (for backward compat) |
| `repossession` | Boolean | false | ✓ EXISTING | Collateral repossessed |
| `recoveryAfterWriteoff` | Decimal(15,2) | 0.00 | ✓ EXISTING | Recovery post write-off |
| `interestAccrued` | Decimal(15,2) | 3250.50 | **NEW** | Interest accrued but not paid |
| `penaltyCharges` | Decimal(15,2) | 500.00 | **NEW** | Late payment penalties in period |
| `provisioning` | Decimal(5,2) | 15.00 | **NEW** | Provisioning % against balance |

**New Fields Rationale:**
- `interestAccrued` — Shows accumulated unpaid interest (indicator of deterioration)
- `penaltyCharges` — Collection effectiveness metric
- `provisioning` — Links to bank's internal provisioning policy

---

### 4. PRIOR PERIOD PERFORMANCE (NEW - Critical for Roll Rate)

These fields enable calculation of observed transitions without requiring separate historical uploads.

| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| `reportingDatePrior` | Date | `2025-01-31` | Date of prior period snapshot |
| `dpdPriorPeriod` | Integer | `15` | DPD in prior period (for transition calculation) |
| `loanStatusPrior` | String | `active` | Loan status in prior period |
| `currentBalancePriorPeriod` | Decimal | `250000.00` | Outstanding balance prior period |
| `totalOverdueAmountPriorPeriod` | Decimal | `0.00` | Overdue amount prior period |
| `daysInArrearsPriorPeriod` | Integer | `0` | Days in arrears (prior) |

**Critical for Roll Rate Calculation:**
These fields allow computing:
```
Transition = DPD_Bucket(dpdPriorPeriod) → DPD_Bucket(dpdAsOfReportingDate)
Balance Flow = currentBalancePriorPeriod → currentBalance (with adjustments for payments)
```

**Example Transition:**
```
Loan LN-001: 2025-01-31 (DPD=15, Bucket=1-30, Balance=250K)
           → 2025-02-28 (DPD=45, Bucket=31-60, Balance=240K)

Observed Transition: 1-30 → 31-60
Balance carried forward: 250K → 240K (with 10K payment)
```

---

### 5. LOAN LIFECYCLE & PAYMENT HISTORY (NEW - For Loss Prediction)

| Field | Type | Example | Purpose | Notes |
|-------|------|---------|---------|-------|
| `daysSinceLastPayment` | Integer | `32` | Days since last principal payment | 0 = paid this period |
| `daysSinceLastInterestPayment` | Integer | `15` | Days since last interest paid | Separate from principal |
| `consecutiveMonthsMissed` | Integer | `2` | Consecutive months of missed payments | Key delinquency indicator |
| `totalPaymentsMissed` | Integer | `3` | Cumulative missed payments (lifetime) | Ever |
| `numberOfPaymentsDueInPeriod` | Integer | `1` | Regular payments due in this period | Based on amortization schedule |
| `numberOfPaymentsMadeInPeriod` | Integer | `1` | Payments actually made in period | Full or partial |
| `numberOfPartialPaymentsMade` | Integer | `0` | Count of partial (not full) payments | Indicator of distress |
| `loanAgeMonths` | Integer | `12` | Months since disbursement | For vintage analysis |
| `residualTenureMonths` | Integer | `18` | Remaining loan tenure | From origination |
| `maximumDpdReached` | Integer | `120` | Worst DPD loan has ever hit | Lifetime worst |
| `dateMaximumDpdReached` | Date | `2025-01-15` | When loan hit worst DPD | Context for cure analysis |
| `cureSinceLastDefault` | Integer | `45` | Days since curing from last default | If status=cured |
| `numberOfLoansForBorrower` | Integer | `2` | Count of active loans for this borrower | Cross-borrower risk |
| `totalOutstandingForBorrower` | Decimal | `450000.00` | Total exposure to borrower | Portfolio concentration |

**Loss Prediction Uses:**
- `daysSinceLastPayment` — Predicts default likelihood (longer = higher risk)
- `consecutiveMonthsMissed` — Key trigger for loss provisions
- `maximumDpdReached` + `dateMaximumDpeached` — Shows recovery ability
- `numberOfLoansForBorrower` — Multiple loans = higher default correlation

---

### 6. DIMENSIONAL DATA (Existing + Enhanced)

#### 6A. Geographic & Operational Dimensions

| Field | Type | Example | Status | Notes |
|-------|------|---------|--------|-------|
| `geography` | String(50) | `Nairobi` | ✓ EXISTING | Broad region |
| `county` | String(50) | `Nairobi County` | **NEW** | Specific county (Kenya context) |
| `subcounty` | String(50) | `Westlands` | **NEW** | Sub-county level |
| `branchId` | String(20) | `NBR-001` | **NEW** | Originating branch |
| `relationshipOfficer` | String(50) | `John Kipchoge` | **NEW** | Account officer (for outreach) |

#### 6B. Product & Borrower Dimensions

| Field | Type | Example | Status | Notes |
|-------|------|---------|--------|-------|
| `product` | String(50) | `SME Loan` | ✓ EXISTING | Product type |
| `productSubtype` | String(50) | `Machinery Finance` | **NEW** | Specific product variant |
| `loanPurpose` | String(100) | `Business Expansion` | **NEW** | Use of funds |
| `loanPurposeCategory` | String(20) | *see enum | **NEW** | Standardized category |
| `segment` | String(50) | `Micro` | ✓ EXISTING | Customer segment |
| `borrowerType` | String(20) | `individual` | **NEW** | Individual vs. Business |
| `borrowerIndustry` | String(50) | `Retail Trade` | **NEW** | Industry classification |
| `borrowerName` | String(100) | `Jane Mwangi` | ✓ EXISTING | Borrower name |

**`loanPurposeCategory` Enum:**
- `agriculture`, `business_expansion`, `working_capital`, `equipment_purchase`, `real_estate`, `education`, `healthcare`, `trade_finance`, `personal`, `other`

#### 6C. Collateral & Risk Dimensions

| Field | Type | Example | Status | Notes |
|-------|------|---------|--------|-------|
| `collateralType` | String(50) | `Motor Vehicle` | **NEW** | Type of collateral |
| `collateralValue` | Decimal(15,2) | `350000.00` | **NEW** | Current estimated value |
| `loanToValue` | Decimal(5,2) | `85.71` | **NEW** | LTV ratio at origination |
| `currentLtv` | Decimal(5,2) | `70.20` | **NEW** | LTV ratio current |

#### 6D. Vintage & Cohort Dimensions

| Field | Type | Format | Example | Purpose |
|-------|------|--------|---------|---------|
| `vintageQuarter` | String(7) | YYYY-Qn | `2024-Q1` | **NEW:** Cohort for vintage analysis |
| `vintageMonth` | String(7) | YYYY-MM | `2024-03` | **NEW:** More granular vintage bucket |

---

## Data Validation Rules

### Required Field Validation

**Always Required:**
- `loanId`, `applicationId`
- `reportingDate`, `reportingCycle`
- `loanStatus`, `dpdAsOfReportingDate`
- `currentBalance`, `loanDisbursedAmount`, `loanDisbursedDate`
- `interestRate`, `loanWrittenOff`, `repossession`

**Conditionally Required:**
- If `reportingCycle == monthly`, `reportingDate` must be month-end (±2 days)
- If `reportingCycle == quarterly`, `reportingDate` must be quarter-end (±2 days)
- If `loanStatus == written_off`, then `loanWrittenOff = true`
- If `loanStatus == defaulted`, then `dpdAsOfReportingDate >= 90`

### Numeric Validation

| Field | Min | Max | Decimals | Notes |
|-------|-----|-----|----------|-------|
| `dpdAsOfReportingDate` | 0 | 9999 | 0 | Days past due |
| `dpdPriorPeriod` | 0 | 9999 | 0 | |
| `interestRate` | 0 | 100 | 3 | Percentage |
| `currentBalance` | 0 | 999,999,999.99 | 2 | KES |
| `currentLtv` | 0 | 999.99 | 2 | Percentage |
| `numberOfPaymentsMadeInPeriod` | 0 | 99 | 0 | |
| `consecutiveMonthsMissed` | 0 | 999 | 0 | |

### Logical Validation

```
✓ currentBalance <= loanDisbursedAmount (generally, unless penalties added)
✓ currentBalance > 0 if loanStatus = "active"
✓ currentBalance = 0 if loanStatus = "paid_off"
✓ dpdAsOfReportingDate > dpdPriorPeriod (can increase or decrease, but patterns matter)
✓ reportingDate > reportingDatePrior
✓ totalOutstandingForBorrower >= currentBalance (if multiple loans)
✓ loanAgeMonths = months between disbursedDate and reportingDate
✓ residualTenureMonths <= original tenure
✓ maximumDpdReached >= dpdAsOfReportingDate
✓ If numberOfPaymentsDueInPeriod > 0, then numberOfPaymentsMadeInPeriod <= numberOfPaymentsDueInPeriod
```

---

## Sample Data

### Example 1: Active Loan Deteriorating

```json
{
  "loanId": "LN-2024-005234",
  "applicationId": "APP-2024-001892",
  "borrowerIdHash": "a1b2c3d4e5f6...",

  "reportingDate": "2025-02-28",
  "reportingCycle": "monthly",
  "loanStatus": "active",
  "loanStatusChangeDate": "2024-03-15",
  "statusChangeReason": null,

  "dpdAsOfReportingDate": 45,
  "currentBalance": 240000.00,
  "loanDisbursedAmount": 300000.00,
  "totalOverdueAmount": 12500.00,
  "loanDisbursedDate": "2024-03-15",
  "interestRate": 18.500,
  "loanWrittenOff": false,
  "repossession": false,
  "recoveryAfterWriteoff": 0.00,
  "interestAccrued": 2150.50,
  "penaltyCharges": 500.00,
  "provisioning": 10.00,

  "reportingDatePrior": "2025-01-31",
  "dpdPriorPeriod": 15,
  "loanStatusPrior": "active",
  "currentBalancePriorPeriod": 250000.00,
  "totalOverdueAmountPriorPeriod": 0.00,
  "daysInArrearsPriorPeriod": 0,

  "daysSinceLastPayment": 32,
  "daysSinceLastInterestPayment": 25,
  "consecutiveMonthsMissed": 1,
  "totalPaymentsMissed": 1,
  "numberOfPaymentsDueInPeriod": 1,
  "numberOfPaymentsMadeInPeriod": 0,
  "numberOfPartialPaymentsMade": 0,
  "loanAgeMonths": 11,
  "residualTenureMonths": 13,
  "maximumDpdReached": 45,
  "dateMaximumDpdReached": "2025-02-28",
  "cureSinceLastDefault": null,
  "numberOfLoansForBorrower": 1,
  "totalOutstandingForBorrower": 240000.00,

  "geography": "Nairobi",
  "county": "Nairobi County",
  "subcounty": "Westlands",
  "branchId": "NBR-001",
  "relationshipOfficer": "John Kipchoge",
  "product": "SME Loan",
  "productSubtype": "Machinery Finance",
  "loanPurpose": "Equipment Purchase",
  "loanPurposeCategory": "equipment_purchase",
  "segment": "Micro",
  "borrowerType": "individual",
  "borrowerIndustry": "Manufacturing",
  "borrowerName": "Jane Mwangi",
  "collateralType": "Motor Vehicle",
  "collateralValue": 350000.00,
  "loanToValue": 85.71,
  "currentLtv": 68.57,
  "vintageQuarter": "2024-Q1",
  "vintageMonth": "2024-03"
}
```

**Analysis from this record:**
- ✓ Transition observed: DPD 15 → 45 (from 1-30 bucket to 31-60)
- ⚠️ One missed payment, trend deteriorating
- ⚠️ Days since last payment = 32 days (about 1 month)
- ✓ LTV improving (85.71% → 68.57%) as balance paid down
- Default risk: Moderate (could escalate if misses next 2 payments)

### Example 2: Loan Cured After Default

```json
{
  "loanId": "LN-2023-008567",
  "applicationId": "APP-2023-003421",
  "reportingDate": "2025-02-28",
  "reportingCycle": "monthly",
  "loanStatus": "cured",
  "loanStatusChangeDate": "2025-02-15",
  "statusChangeReason": "automatic_cure",

  "dpdAsOfReportingDate": 0,
  "currentBalance": 155000.00,
  "loanDisbursedAmount": 200000.00,
  "totalOverdueAmount": 0.00,
  "dpdPriorPeriod": 92,
  "loanStatusPrior": "defaulted",
  "currentBalancePriorPeriod": 160000.00,

  "daysSinceLastPayment": 15,
  "daysSinceLastInterestPayment": 10,
  "consecutiveMonthsMissed": 0,
  "totalPaymentsMissed": 3,
  "maximumDpdReached": 125,
  "dateMaximumDpdReached": "2025-01-31",
  "cureSinceLastDefault": 28,

  "vintageQuarter": "2023-Q2",
  "loanAgeMonths": 22
}
```

**Analysis from this record:**
- ✓ Strong recovery: Default (DPD 92) → Cured (DPD 0) in one month
- ✓ Made catch-up payment (160K → 155K balance)
- ⚠️ Worst DPD was 125 days (severe delinquency)
- Key metric: "cureSinceLastDefault": 28 days shows borrower ability to recover
- Vintage analysis: 22 months old, recovered after 2-year delinquency

---

## File Format Support

### CSV Format Example

```csv
loanId,applicationId,borrowerIdHash,reportingDate,reportingCycle,loanStatus,dpdAsOfReportingDate,currentBalance,dpdPriorPeriod,reportingDatePrior,loanStatusPrior,daysSinceLastPayment,consecutiveMonthsMissed,geography,county,product,segment,vintageQuarter
LN-2024-005234,APP-2024-001892,a1b2c3d4e5,2025-02-28,monthly,active,45,240000.00,15,2025-01-31,active,32,1,Nairobi,Nairobi County,SME Loan,Micro,2024-Q1
LN-2023-008567,APP-2023-003421,b2c3d4e5f6,2025-02-28,monthly,cured,0,155000.00,92,2025-01-31,defaulted,15,0,Nairobi,Nairobi County,SME Loan,Micro,2023-Q2
```

### XLSX Format

Multiple sheets recommended:
- **Loan Data** — Core loan fields
- **Prior Period** — Optional sheet with just loanId + prior period fields
- **Metadata** — Data dictionary and upload summary

### JSON Format

```json
{
  "metadata": {
    "reportingDate": "2025-02-28",
    "reportingCycle": "monthly",
    "totalRecords": 520,
    "uploadedBy": "System (SFTP)",
    "dataQualityScore": 98.5
  },
  "loans": [
    { /* loan record 1 */ },
    { /* loan record 2 */ }
  ]
}
```

---

## Column Mapping Reference

Updated auto-mapping for common column names:

```typescript
const ENHANCED_AUTO_MAPPING: Record<string, string> = {
  // Core Identifiers
  'Loan ID': 'loanId',
  'Application ID': 'applicationId',
  'Borrower ID Hash': 'borrowerIdHash',

  // Reporting Period
  'Reporting Date': 'reportingDate',
  'Reporting Cycle': 'reportingCycle',
  'Loan Status': 'loanStatus',
  'Status Change Date': 'loanStatusChangeDate',

  // Current Period
  'DPD as of Reporting Date': 'dpdAsOfReportingDate',
  'Current Balance': 'currentBalance',
  'Loan Disbursed Amount': 'loanDisbursedAmount',
  'Total Overdue Amount': 'totalOverdueAmount',
  'Loan Disbursed Date': 'loanDisbursedDate',
  'Interest Rate': 'interestRate',
  'Interest Accrued': 'interestAccrued',
  'Penalty Charges': 'penaltyCharges',
  'Provisioning %': 'provisioning',

  // Prior Period
  'DPD Prior Period': 'dpdPriorPeriod',
  'Reporting Date Prior': 'reportingDatePrior',
  'Loan Status Prior': 'loanStatusPrior',
  'Current Balance Prior Period': 'currentBalancePriorPeriod',
  'Total Overdue Prior Period': 'totalOverdueAmountPriorPeriod',

  // Payment History
  'Days Since Last Payment': 'daysSinceLastPayment',
  'Consecutive Months Missed': 'consecutiveMonthsMissed',
  'Total Payments Missed': 'totalPaymentsMissed',
  'Payments Due in Period': 'numberOfPaymentsDueInPeriod',
  'Payments Made in Period': 'numberOfPaymentsMadeInPeriod',
  'Maximum DPD Reached': 'maximumDpdReached',
  'Loan Age Months': 'loanAgeMonths',
  'Residual Tenure': 'residualTenureMonths',

  // Dimensions
  'Geography': 'geography',
  'County': 'county',
  'Branch ID': 'branchId',
  'Product': 'product',
  'Product Subtype': 'productSubtype',
  'Loan Purpose': 'loanPurpose',
  'Loan Purpose Category': 'loanPurposeCategory',
  'Segment': 'segment',
  'Borrower Type': 'borrowerType',
  'Borrower Industry': 'borrowerIndustry',
  'Borrower Name': 'borrowerName',
  'Collateral Type': 'collateralType',
  'Collateral Value': 'collateralValue',
  'Vintage Quarter': 'vintageQuarter',
  'Vintage Month': 'vintageMonth'
};
```

---

## Implementation Roadmap

### Phase 1: Schema Definition ✓
- [ ] Approve enhanced schema (this document)
- [ ] Update TypeScript types

### Phase 2: Backward Compatibility
- [ ] Make new fields optional
- [ ] Support existing single-period format
- [ ] Auto-generate prior period fields from prior uploads if not provided

### Phase 3: Roll Rate Engine
- [ ] Implement observed transition matrix calculation
- [ ] Calculate transitions by segment, vintage, geography
- [ ] Replace hard-coded transition matrix

### Phase 4: Loss Prediction
- [ ] Build loss models using payment history fields
- [ ] Segment loss rates by product, segment, vintage
- [ ] Implement LGD (Loss Given Default) calculation

### Phase 5: Vintage Analysis
- [ ] Improve cohort analysis using `vintageMonth` buckets
- [ ] Track cure rates by vintage
- [ ] Analyze payment patterns by age

---

## Benefits Summary

| Capability | Before | After |
|-----------|--------|-------|
| **Roll Rate Analysis** | Hard-coded matrix | Observed from data |
| **Loan Tracking** | No | Yes (via loanId across periods) |
| **Loss Prediction** | Basic DPD only | Payment history + lifecycle |
| **Cure Analysis** | No | Yes (via statusChangeDate, cureSinceLastDefault) |
| **Vintage Segmentation** | Generic | By quarter, by month |
| **Default Detection** | Based on DPD only | Multi-factor (missed payments, status, max DPD) |
| **Portfolio Concentration** | N/A | Visible (numberOfLoansForBorrower, totalOutstanding) |
| **Dimensional Cuts** | 3 (geo, product, segment) | 10+ (county, branch, industry, purpose, collateral type, vintage, etc.) |

---

## Transition Strategy

### For Existing Systems

1. **Minimal Change** — Existing required fields remain unchanged
2. **Additive** — New fields are optional initially
3. **Phased** — Mandate new fields in phases:
   - **Phase 1 (Month 1):** Make prior period + payment history optional
   - **Phase 2 (Month 3):** Strongly recommend prior period fields
   - **Phase 3 (Month 6):** Mandate prior period for monthly uploads

### For New Implementations

Implement full schema from the start.

---

## FAQ

**Q: Will existing CSV files still work?**
A: Yes. Existing 11 required fields will continue to work. New fields are optional initially.

**Q: How do we get prior period data for historical uploads?**
A: Option 1: Include in new uploads. Option 2: System tracks uploads over time and auto-generates from previous month's data.

**Q: Can we keep our existing column names?**
A: Yes. The column mapping table supports your existing names. You can add the new fields gradually.

**Q: Will this break existing roll rate reports?**
A: No. The hard-coded transition matrix will continue to work. You can opt-in to observed transition matrices once data is sufficient.

**Q: How much historical data do we need for good roll rate analysis?**
A: Ideally 12-24 months of monthly snapshots. Quarterly is minimum. This gives you enough observations to see patterns across interest rate cycles and borrower behaviors.

**Q: What's the minimum viable schema to get started?**
A: Core + Current Period + Prior Period (6 fields) is enough to calculate roll rate. Add payment history gradually.

---

## Appendix A: SQL Schema

```sql
CREATE TABLE loan_book (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,

  -- Core identifiers
  loan_id VARCHAR(50) NOT NULL,
  application_id VARCHAR(50) NOT NULL,
  borrower_id_hash VARCHAR(64),

  -- Reporting period
  reporting_date DATE NOT NULL,
  reporting_cycle ENUM('monthly', 'quarterly') NOT NULL,
  loan_status VARCHAR(20) NOT NULL,
  loan_status_change_date DATE,
  status_change_reason VARCHAR(100),

  -- Current period
  dpd_as_of_reporting_date INT NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL,
  loan_disbursed_amount DECIMAL(15,2) NOT NULL,
  total_overdue_amount DECIMAL(15,2) NOT NULL,
  loan_disbursed_date DATE NOT NULL,
  interest_rate DECIMAL(5,3) NOT NULL,
  loan_written_off BOOLEAN NOT NULL,
  repossession BOOLEAN NOT NULL,
  recovery_after_writeoff DECIMAL(15,2),
  interest_accrued DECIMAL(15,2),
  penalty_charges DECIMAL(15,2),
  provisioning DECIMAL(5,2),

  -- Prior period
  reporting_date_prior DATE,
  dpd_prior_period INT,
  loan_status_prior VARCHAR(20),
  current_balance_prior_period DECIMAL(15,2),
  total_overdue_amount_prior_period DECIMAL(15,2),
  days_in_arrears_prior_period INT,

  -- Payment history
  days_since_last_payment INT,
  days_since_last_interest_payment INT,
  consecutive_months_missed INT,
  total_payments_missed INT,
  num_payments_due_in_period INT,
  num_payments_made_in_period INT,
  num_partial_payments INT,
  loan_age_months INT,
  residual_tenure_months INT,
  maximum_dpd_reached INT,
  date_maximum_dpd_reached DATE,
  cure_since_last_default INT,
  num_loans_for_borrower INT,
  total_outstanding_for_borrower DECIMAL(15,2),

  -- Dimensions
  geography VARCHAR(50),
  county VARCHAR(50),
  subcounty VARCHAR(50),
  branch_id VARCHAR(20),
  relationship_officer VARCHAR(100),
  product VARCHAR(50),
  product_subtype VARCHAR(50),
  loan_purpose VARCHAR(100),
  loan_purpose_category VARCHAR(20),
  segment VARCHAR(50),
  borrower_type VARCHAR(20),
  borrower_industry VARCHAR(50),
  borrower_name VARCHAR(100),
  collateral_type VARCHAR(50),
  collateral_value DECIMAL(15,2),
  loan_to_value DECIMAL(5,2),
  current_ltv DECIMAL(5,2),
  vintage_quarter VARCHAR(7),
  vintage_month VARCHAR(7),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_loan_period (loan_id, reporting_date),
  INDEX idx_loan_id (loan_id),
  INDEX idx_reporting_date (reporting_date),
  INDEX idx_loan_status (loan_status),
  INDEX idx_vintage_quarter (vintage_quarter),
  INDEX idx_geography (geography),
  INDEX idx_borrower_hash (borrower_id_hash)
);
```

---

## Appendix B: TypeScript Types

```typescript
export interface LoanBookRowEnhanced extends LoanLevelRow {
  // Reporting Period
  reportingDate: string;
  reportingCycle: 'monthly' | 'quarterly';
  loanStatus: LoanStatus;
  loanStatusChangeDate?: string;
  statusChangeReason?: string;

  // Current Period Enhancements
  interestAccrued?: number;
  penaltyCharges?: number;
  provisioning?: number;

  // Prior Period (NEW)
  reportingDatePrior?: string;
  dpdPriorPeriod?: number;
  loanStatusPrior?: LoanStatus;
  currentBalancePriorPeriod?: number;
  totalOverdueAmountPriorPeriod?: number;
  daysInArrearsPriorPeriod?: number;

  // Payment History (NEW)
  daysSinceLastPayment?: number;
  daysSinceLastInterestPayment?: number;
  consecutiveMonthsMissed?: number;
  totalPaymentsMissed?: number;
  numberOfPaymentsDueInPeriod?: number;
  numberOfPaymentsMadeInPeriod?: number;
  numberOfPartialPaymentsMade?: number;
  loanAgeMonths?: number;
  residualTenureMonths?: number;
  maximumDpdReached?: number;
  dateMaximumDpdReached?: string;
  cureSinceLastDefault?: number;
  numberOfLoansForBorrower?: number;
  totalOutstandingForBorrower?: number;

  // Enhanced Dimensions
  county?: string;
  subcounty?: string;
  branchId?: string;
  relationshipOfficer?: string;
  productSubtype?: string;
  loanPurpose?: string;
  loanPurposeCategory?: string;
  borrowerType?: string;
  borrowerIndustry?: string;
  collateralType?: string;
  collateralValue?: number;
  loanToValue?: number;
  currentLtv?: number;
  vintageMonth?: string;
  borrowerIdHash?: string;
}

export type LoanStatus =
  | 'active'
  | 'paid_off'
  | 'defaulted'
  | 'written_off'
  | 'cured'
  | 'restructured'
  | 'refinanced'
  | 'dormant'
  | 'matured';

export interface TransitionObservation {
  loanId: string;
  reportingDateFrom: string;
  reportingDateTo: string;
  bucketFrom: string;
  bucketTo: string;
  balancFrom: number;
  balanceTo: number;
  paymentAmount: number;
  daysHeld: number;
}

export interface ObservedTransitionMatrix {
  period: string; // "2025-01_2025-02"
  segmentKey: string; // "geo:Nairobi|product:SME Loan" or "all"
  transitions: Record<string, Record<string, {count: number; balance: number; avgBalance: number}>>;
  totalLoans: number;
  totalBalance: number;
  cureRate: number; // % that moved back to Current
}
```

---

## Appendix C: Validation Schema (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Enhanced EdA Loan Book Schema",
  "type": "object",
  "required": [
    "loanId", "applicationId", "reportingDate", "reportingCycle",
    "loanStatus", "dpdAsOfReportingDate", "currentBalance",
    "loanDisbursedAmount", "loanDisbursedDate", "interestRate",
    "loanWrittenOff", "repossession"
  ],
  "properties": {
    "loanId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50,
      "pattern": "^[A-Z0-9\\-]+$"
    },
    "dpdAsOfReportingDate": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9999
    },
    "currentBalance": {
      "type": "number",
      "minimum": 0,
      "multipleOf": 0.01
    },
    "loanStatus": {
      "type": "string",
      "enum": ["active", "paid_off", "defaulted", "written_off", "cured", "restructured", "refinanced", "dormant", "matured"]
    },
    "reportingDate": {
      "type": "string",
      "format": "date"
    },
    "reportingCycle": {
      "type": "string",
      "enum": ["monthly", "quarterly"]
    },
    "dpdPriorPeriod": {
      "type": ["integer", "null"],
      "minimum": 0
    }
  }
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-19 | Claude Code | Initial proposal |
| 1.0 | 2026-02-19 | Claude Code | Ready for review |

---

## Next Steps

1. **Review** — Stakeholder feedback on proposed fields
2. **Prioritize** — Which new fields to mandate first
3. **Implement** — Update database schema, API validations, UI
4. **Migrate** — Gradual rollout with backward compatibility
5. **Train** — Documentation for upload partners (NBFIs, relationship teams)
6. **Monitor** — Data quality metrics, adoption rates

---

**Contact:** For questions or clarifications on this schema proposal, please refer to the development team.
