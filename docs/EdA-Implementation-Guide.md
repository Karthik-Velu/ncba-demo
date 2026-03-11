# EdA Enhanced Schema - Implementation Guide
## From Proposal to Production

---

## Quick Start: What Changed?

### Minimum viable new fields (to get started immediately):

```typescript
// Add to each loan record:
reportingDate: "2025-02-28",           // When is this data from?
dpdPriorPeriod: 15,                    // What was DPD last month?
reportingDatePrior: "2025-01-31",      // Last month's date
daysSinceLastPayment: 32,              // Days since last payment
consecutiveMonthsMissed: 1,            // Missed payments
loanAgeMonths: 11                      // How old is the loan?
```

**This alone enables:**
- ✓ Roll rate calculation (transitions between DPD buckets)
- ✓ Payment pattern analysis
- ✓ Cure rate tracking
- ✓ Early warning signals

---

## Phase 1: CSV Upload with Enhanced Fields

### Step 1: Update CSV Column Headers

**Old CSV (current):**
```csv
Loan ID,Application ID,DPD as of Reporting Date,Current Balance,...
LN-001,APP-001,15,245000,...
```

**New CSV (enhanced - minimal):**
```csv
Loan ID,Application ID,Reporting Date,Reporting Cycle,
DPD as of Reporting Date,DPD Prior Period,
Reporting Date Prior,
Current Balance,
Days Since Last Payment,Consecutive Months Missed,
...rest of fields
LN-001,APP-001,2025-02-28,monthly,45,15,2025-01-31,240000,32,1,...
```

### Step 2: Column Mapping UI Update

The system's existing mapping interface already supports this. New columns will auto-map:

```typescript
// In loan-book/page.tsx, add to DETECTED_COLUMNS:
const DETECTED_COLUMNS = [
  // Existing...
  'Loan ID', 'Application ID', 'DPD as of Reporting Date',
  // NEW:
  'Reporting Date', 'Reporting Cycle',
  'DPD Prior Period', 'Reporting Date Prior',
  'Days Since Last Payment', 'Consecutive Months Missed',
  // ... more
];

// Update AUTO_MAPPING:
const AUTO_MAPPING: Record<string, string> = {
  // Existing...
  'Loan ID': 'loanId',
  // NEW:
  'Reporting Date': 'reportingDate',
  'Reporting Cycle': 'reportingCycle',
  'DPD Prior Period': 'dpdPriorPeriod',
  'Reporting Date Prior': 'reportingDatePrior',
  'Days Since Last Payment': 'daysSinceLastPayment',
  'Consecutive Months Missed': 'consecutiveMonthsMissed',
};
```

---

## Phase 2: Roll Rate Engine Implementation

### Create New File: `src/lib/rollRateAnalysis.ts`

```typescript
import { LoanBookRowEnhanced, DPD_BUCKETS, getDpdBucket, TransitionObservation, ObservedTransitionMatrix } from '@/lib/types';

/**
 * Calculate observed transitions between two periods
 */
export function calculateObservedTransitions(
  currentPeriod: LoanBookRowEnhanced[],
  priorPeriod: LoanBookRowEnhanced[]
): TransitionObservation[] {
  const transitions: TransitionObservation[] = [];
  const priorMap = new Map(priorPeriod.map(l => [l.loanId, l]));

  for (const loan of currentPeriod) {
    const prior = priorMap.get(loan.loanId);
    if (!prior) continue; // No prior period data

    // Use prior period fields if provided, otherwise use separate prior data
    const priorDpd = loan.dpdPriorPeriod ?? prior.dpdAsOfReportingDate;
    const priorBalance = loan.currentBalancePriorPeriod ?? prior.currentBalance;

    const bucketFrom = getDpdBucket(priorDpd);
    const bucketTo = getDpdBucket(loan.dpdAsOfReportingDate);

    transitions.push({
      loanId: loan.loanId,
      reportingDateFrom: loan.reportingDatePrior ?? prior.reportingDate,
      reportingDateTo: loan.reportingDate,
      bucketFrom,
      bucketTo,
      balanceFrom: priorBalance,
      balanceTo: loan.currentBalance,
      paymentAmount: priorBalance - loan.currentBalance,
      daysHeld: dateDifference(
        loan.reportingDatePrior ?? prior.reportingDate,
        loan.reportingDate
      ),
      segment: loan.segment,
      geography: loan.geography,
      vintage: loan.vintageQuarter,
    });
  }

  return transitions;
}

/**
 * Build transition matrix from observations
 */
export function buildObservedTransitionMatrix(
  transitions: TransitionObservation[],
  segmentKey = 'all'
): ObservedTransitionMatrix {
  const matrix: Record<string, Record<string, { count: number; balance: number }>> = {};

  // Initialize all buckets
  DPD_BUCKETS.forEach(from => {
    matrix[from] = {};
    DPD_BUCKETS.forEach(to => {
      matrix[from][to] = { count: 0, balance: 0 };
    });
  });

  // Populate from transitions
  let totalLoans = 0;
  let totalBalance = 0;
  let curedCount = 0;

  for (const t of transitions) {
    matrix[t.bucketFrom][t.bucketTo].count++;
    matrix[t.bucketFrom][t.bucketTo].balance += t.balanceTo;
    totalLoans++;
    totalBalance += t.balanceTo;

    if (t.bucketTo === 'Current' && t.bucketFrom !== 'Current') {
      curedCount++;
    }
  }

  // Convert to percentages
  const result: Record<string, Record<string, any>> = {};
  DPD_BUCKETS.forEach(from => {
    result[from] = {};
    const total = Object.values(matrix[from]).reduce((s, v) => s + v.count, 0);

    DPD_BUCKETS.forEach(to => {
      const { count, balance } = matrix[from][to];
      result[from][to] = {
        count,
        balance,
        percentage: total > 0 ? (count / total) * 100 : 0,
        avgBalance: count > 0 ? balance / count : 0,
      };
    });
  });

  return {
    period: '2025-01_to_2025-02', // Format from data
    segmentKey,
    transitions: result as any,
    totalLoans,
    totalBalance,
    cureRate: totalLoans > 0 ? (curedCount / totalLoans) * 100 : 0,
    defaultRate: calculateDefaultRate(result, totalLoans),
    earlyPayoffRate: calculateEarlyPayoffRate(transitions),
    observationCount: transitions.length,
    dataQualityScore: transitions.length > 50 ? 95 : 80, // Arbitrary
  };
}

/**
 * Calculate roll rates by segment (geography, product, vintage, etc.)
 */
export function calculateSegmentedRollRates(
  transitions: TransitionObservation[],
  segmentField: 'geography' | 'product' | 'segment' | 'vintage'
): Map<string, ObservedTransitionMatrix> {
  const bySegment = new Map<string, TransitionObservation[]>();

  for (const t of transitions) {
    const value = t[segmentField];
    if (!value) continue;

    if (!bySegment.has(value)) {
      bySegment.set(value, []);
    }
    bySegment.get(value)!.push(t);
  }

  const result = new Map<string, ObservedTransitionMatrix>();
  for (const [segment, trans] of bySegment) {
    result.set(segment, buildObservedTransitionMatrix(trans, segment));
  }

  return result;
}

// Helper functions
function dateDifference(from: string, to: string): number {
  return Math.floor(
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function calculateDefaultRate(
  transitions: Record<string, Record<string, any>>,
  total: number
): number {
  // Assume loans moving to "180+" are defaulting (simplified)
  const toDefault = transitions['Current']?.['180+']?.count +
                    transitions['1-30']?.['180+']?.count +
                    transitions['31-60']?.['180+']?.count +
                    transitions['61-90']?.['180+']?.count +
                    transitions['91-180']?.['180+']?.count ?? 0;
  return total > 0 ? (toDefault / total) * 100 : 0;
}

function calculateEarlyPayoffRate(transitions: TransitionObservation[]): number {
  // Count loans with balance going to 0 (paid off early)
  const paidOff = transitions.filter(t => t.balanceTo === 0).length;
  return transitions.length > 0 ? (paidOff / transitions.length) * 100 : 0;
}
```

---

## Phase 3: Update EDA Page with Observed Transitions

### File: `src/app/nbfi/[id]/eda/page.tsx`

**Current code (lines 133-155)** uses hard-coded transition matrix.

**Replace with observed transitions:**

```typescript
import { calculateObservedTransitions, buildObservedTransitionMatrix } from '@/lib/rollRateAnalysis';

// ... existing code ...

const rollRateProjection = useMemo(() => {
  // NEW: Calculate observed transitions if we have prior period data
  if (allRows[0]?.dpdPriorPeriod !== undefined) {
    const transitions = calculateObservedTransitions(rows, allRows);
    const observedMatrix = buildObservedTransitionMatrix(transitions);

    // Display observed transitions as actual history
    // Rather than projecting, we just show what happened
    return Object.entries(observedMatrix.transitions).map(([from, toValues]) => ({
      bucket: from,
      ...Object.entries(toValues).reduce((acc, [to, stats]) => ({
        ...acc,
        [to]: Math.round(stats.balance),
      }), {}),
    }));
  } else {
    // Fallback to mock projection if no prior data
    // ... existing projection code ...
  }
}, [rows]);
```

**Better approach: Show both actual and projected:**

```typescript
const rollRateData = useMemo(() => {
  return {
    // Observed transitions (from actual data)
    observed: allRows[0]?.dpdPriorPeriod !== undefined
      ? buildObservedTransitionMatrix(calculateObservedTransitions(rows, allRows))
      : null,

    // Projected transitions (for forecasting)
    projected: projectRollRate(rows), // existing logic
  };
}, [rows]);

// In UI, show tabs: "Observed (Actual)" vs "Projected (Forecast)"
```

---

## Phase 4: Database Schema Update

### SQL Migration

```sql
-- Add new columns to loan_book table
ALTER TABLE loan_book ADD COLUMN (
  `reporting_date` DATE NOT NULL,
  `reporting_cycle` ENUM('monthly', 'quarterly') NOT NULL,
  `loan_status` VARCHAR(20) NOT NULL,
  `loan_status_change_date` DATE,

  `dpd_prior_period` INT,
  `reporting_date_prior` DATE,
  `current_balance_prior_period` DECIMAL(15,2),

  `days_since_last_payment` INT,
  `consecutive_months_missed` INT,
  `maximum_dpd_reached` INT,
  `date_maximum_dpd_reached` DATE,

  `loan_age_months` INT,
  `vintage_quarter` VARCHAR(7),
  `vintage_month` VARCHAR(7),

  `county` VARCHAR(50),
  `product_subtype` VARCHAR(50),
  `borrower_type` VARCHAR(20),

  INDEX idx_reporting_date (`reporting_date`),
  INDEX idx_loan_status (`loan_status`),
  INDEX idx_vintage_quarter (`vintage_quarter`)
);

-- Create unique constraint on loan_id + reporting_date
ALTER TABLE loan_book
ADD CONSTRAINT unique_loan_period UNIQUE (loan_id, reporting_date);
```

---

## Phase 5: Validation Updates

### File: `src/lib/integrationSchemas.ts`

Update validation tests:

```typescript
export function getValidationTests(docTypeId: string): ValidationTest[] {
  if (docTypeId === 'loan_book') return [
    // Existing tests
    { name: 'All required columns present', pass: true, severity: 'error' },
    { name: 'Loan ID is unique per reporting date', pass: true, severity: 'error' },
    { name: 'DPD is numeric (>= 0)', pass: true, severity: 'error' },

    // NEW: Prior period validation
    { name: 'Prior period DPD present (for roll rate)', pass: true, severity: 'warning' },
    { name: 'Reporting dates in correct order', pass: true, severity: 'error' },
    { name: 'DPD not decreasing unreasonably', pass: true, severity: 'warning' },

    // NEW: Payment history validation
    { name: 'Days since last payment is numeric', pass: true, severity: 'warning' },
    { name: 'Consecutive months missed >= 0', pass: true, severity: 'error' },
    { name: 'Maximum DPD >= current DPD', pass: true, severity: 'warning' },

    // Logical validations
    { name: 'Current Balance <= Disbursed Amount', pass: true, severity: 'warning' },
    { name: 'No negative balances', pass: true, severity: 'error' },
  ];
}
```

---

## Phase 6: Data Migration Strategy

### For existing NBFI partners:

**Option 1: Gradual Enhancement**
```
Week 1: Add reportingDate field (required)
Week 2: Add dpdPriorPeriod (encouraged, optional)
Week 3: Add paymentHistory fields (encouraged, optional)
Month 2: Make prior period fields required for new uploads
Month 3: Generate synthetic prior period from historical uploads
```

**Option 2: Backfill**
```typescript
export function backfillPriorPeriod(
  currentUpload: LoanBookRowEnhanced[],
  previousUpload: LoanBookRowEnhanced[]
): LoanBookRowEnhanced[] {
  const priorMap = new Map(previousUpload.map(l => [l.loanId, l]));

  return currentUpload.map(loan => ({
    ...loan,
    dpdPriorPeriod: priorMap.get(loan.loanId)?.dpdAsOfReportingDate,
    reportingDatePrior: priorMap.get(loan.loanId)?.reportingDate,
    currentBalancePriorPeriod: priorMap.get(loan.loanId)?.currentBalance,
  }));
}
```

---

## Phase 7: UI/UX Updates

### Dashboard Cards

Add new cards showing:

```typescript
// Card 1: Roll Rate Summary
- Cure Rate: 12% (loans returning to Current)
- Default Rate: 3% (new defaults)
- Early Payoff Rate: 5%

// Card 2: Transition Matrix Heatmap
From\To  Current  1-30  31-60  ...
Current    85%     12%    2%   ...
1-30        8%     60%   25%   ...
...

// Card 3: Early Warnings
- Loans moving from 1-30 → 31-60: 45 loans (KES 2.3M)
- Loans missing 2+ consecutive payments: 12 loans
- Rapid deterioration (DPD +30 in one period): 3 loans
```

### Report Generation

```typescript
export function generateMonthlyReport(loans: LoanBookRowEnhanced[]): AnalysisReport {
  return {
    header: {
      reportingDate: loans[0].reportingDate,
      totalLoans: loans.length,
      totalBalance: sumBalance(loans),
    },

    portfolio: {
      dpdDistribution: distributionByBucket(loans),
      parRate: calculateParRate(loans),
      cureRate: calculateCureRate(loans),
      defaultRate: calculateDefaultRate(loans),
    },

    rollRate: {
      observedTransitions: buildTransitionMatrix(loans),
      bySegment: {
        geography: segmentedRollRates(loans, 'geography'),
        product: segmentedRollRates(loans, 'product'),
        vintage: segmentedRollRates(loans, 'vintageQuarter'),
      },
    },

    vintage: {
      cohorts: vintageAnalysis(loans),
    },

    earlyWarnings: {
      rapidDeterioration: detectRapidDeterior ation(loans),
      consecutiveMissed: detectConsecutiveMissed(loans),
      highRisk: detectHighRiskLoans(loans),
    },
  };
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('Roll Rate Analysis', () => {
  it('should calculate transitions correctly', () => {
    const prior = { loanId: 'L1', dpdAsOfReportingDate: 15, currentBalance: 100 };
    const current = { loanId: 'L1', dpdAsOfReportingDate: 45, currentBalance: 90 };

    const transition = calculateTransition(prior, current);
    expect(transition.bucketFrom).toBe('1-30');
    expect(transition.bucketTo).toBe('31-60');
    expect(transition.paymentAmount).toBe(10);
  });

  it('should build transition matrix with percentages', () => {
    const transitions = [
      { bucketFrom: 'Current', bucketTo: '1-30' },
      { bucketFrom: 'Current', bucketTo: 'Current' },
      { bucketFrom: '1-30', bucketTo: 'Current' },
    ];

    const matrix = buildObservedTransitionMatrix(transitions);
    expect(matrix.transitions['Current']['1-30'].percentage).toBe(50);
  });
});
```

### Data Quality Tests

```typescript
describe('Data Validation', () => {
  it('should validate prior period < current period', () => {
    const loan = {
      reportingDate: '2025-02-28',
      reportingDatePrior: '2025-01-31',
    };

    expect(validateDates(loan)).toBe(true);
  });

  it('should flag DPD jumping by more than 60 days', () => {
    const loan = {
      dpdAsOfReportingDate: 75,
      dpdPriorPeriod: 5,
    };

    const issues = validatePaymentBehavior(loan);
    expect(issues).toContain('DPD jumped 70 days');
  });
});
```

---

## Go-Live Checklist

- [ ] Database schema migrated
- [ ] TypeScript types updated with `LoanBookRowEnhanced`
- [ ] Column mapping UI updated for new fields
- [ ] Validation tests added and passing
- [ ] Roll rate engine implemented and tested
- [ ] EDA page updated to show observed transitions
- [ ] CSV template updated with new columns
- [ ] Documentation sent to partners
- [ ] Training conducted with relationship teams
- [ ] Monitoring dashboard updated
- [ ] Rollback plan ready (keep hard-coded matrix as fallback)
- [ ] Staging environment tested with real partner data

---

## FAQ: Implementation

**Q: How long will this take to implement?**
A: 4-6 weeks (2 weeks per phase)

**Q: Do all partners need to adopt this immediately?**
A: No. Phase in gradually. Start with willing pilots.

**Q: What if we don't have prior period data?**
A: System auto-fills from previous upload. Or use synthetic/mock data initially.

**Q: Will this break existing reports?**
A: No. Backward compatible. New fields optional initially.

**Q: How do we handle SFTP feeds?**
A: SFTP feeds should include new fields in the daily/weekly export. Update vendor integration.

**Q: What about the transition matrix - should we keep it?**
A: Yes, as fallback. Use observed matrix when available, fall back to hard-coded matrix when not.

---

## Success Metrics

Once implemented, measure:

| Metric | Baseline | Target |
|--------|----------|--------|
| Portfolio Cure Rate | Unknown | Track 5%-15% typically |
| Default Prediction Accuracy | ~70% | >85% |
| Days to Detect Default | 45-60 days | 14-21 days |
| Roll Rate Variance | ±20% (forecasted) | ±5% (observed) |
| Provision Accuracy | Unknown | ±10% of actual |

---

## Next Steps

1. **Review** this implementation guide with stakeholders
2. **Prioritize** which phase to start with
3. **Create** GitHub issues for each phase
4. **Assign** ownership and deadlines
5. **Begin** Phase 1: CSV Column Mapping updates
