# NCBA Platform — Product Backlog
*Derived from competitive gap analysis vs Moody's Structured Finance and Credit Portfolio Management*  
*Date: February 2026*

---

## How to Read This Backlog

Each item maps to a specific gap from the research document (`competitive-analysis.md`). The priority score is derived from:
- Severity (Critical = 3, Significant = 2, Incremental = 1)
- Strategic Fit (Core = 3, Adjacency = 2, Out of Scope = 0)
- Combined score = Severity x Fit (max 9)

Items are sequenced so that foundational infrastructure comes first — the backlog is not just priority-ordered but dependency-ordered.

---

## TIER 1: Foundation (Must Do Before Anything Else)

These items are prerequisites. Every Tier 2 and Tier 3 item depends on them being done.

---

### EPIC-01: Backend Data Persistence Layer

**Gap:** GAP-01 | **Priority Score:** 9 (Critical x Core) | **Effort:** XL

**Problem:** The entire platform runs in browser memory. Page refresh destroys all data. No enterprise deployment is possible in this state.

**Moody's equivalent:** Table stakes for all Moody's SaaS products (ABS Suite Plus, Manager Module, CPM — all cloud-hosted with persistent stores).

**User Stories:**

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-01a | As a credit analyst, I want my NBFI records, loan books, and covenant readings to persist between sessions so that I do not lose work when I close the browser. | NBFI records survive page refresh; data stored server-side. |
| US-01b | As an approver, I want to see the full approval history of an NBFI with timestamps so that I can demonstrate an audit trail to internal audit. | Every status transition timestamped and stored with acting user. |
| US-01c | As an NCBA administrator, I want multiple analysts to work on different NBFIs simultaneously without data collisions. | Multi-user concurrency without state overwriting. |
| US-01d | As an analyst, I want pool selection and securitisation structure decisions to be retrievable after weeks or months. | Pool selections persist with confirmedAt timestamp. |

**Scope:** Database (PostgreSQL or equivalent), server-side API layer (Next.js API routes with proper persistence), authentication with session persistence, migration of current `AppContext` state to server-sourced data.

---

### EPIC-02: Real Data Validation Engine

**Gap:** GAP-11 | **Priority Score:** 6 (Significant x Core) | **Effort:** M

**Problem:** All 12-46 validation tests per document type return hardcoded mock results. Corrupt data goes undetected.

**Moody's equivalent:** Recon — "Seamlessly extract and normalise data from trustee and source systems. Define user-specific validation rules to ensure data integrity."

**User Stories:**

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-02a | As a credit analyst, I want the system to automatically detect missing required columns when I upload a loan book so that data quality issues are caught before analysis runs. | All 11 required loan_book columns checked against actual uploaded CSV; failing uploads blocked with specific column names listed. |
| US-02b | As a data manager, I want contiguous monthly period checks on loan performance history uploads so that sequence gaps are flagged before vintage analysis runs. | Gap detection compares actual reporting dates; non-contiguous sequences produce a warning with specific missing months identified. |
| US-02c | As an analyst, I want negative current balance errors to surface specific loan IDs so that the NBFI can correct the source data. | Validation output includes row number and loanId for each failed check, not generic messages. |
| US-02d | As a system, I want balance sheet reconciliation (assets = liabilities + equity) to be checked on financial statement uploads. | The sum Total_Assets vs Total_Eq_Liab check runs against actual uploaded figures. |

**Scope:** Replace all hardcoded `pass/fail` in `integrationSchemas.ts` with functions that operate on actual `LoanLevelRow[]`, `HistoricalLoanRow[]`, and financial statement data. Retain existing test schema structure.

---

## TIER 2: Analytical Credibility

These items transform the platform from demo-grade to analytically defensible. They depend on EPIC-01 (persistence) because calibration requires stored historical data.

---

### EPIC-03: Model Calibration from Historical Data

**Gap:** GAP-02 | **Priority Score:** 9 (Critical x Core) | **Effort:** L

**Problem:** Transition matrices, loss rates, LGDs, and advance rates are hardcoded constants unrelated to any NBFI's actual performance.

**Moody's equivalent:** SFW — "monthly updates with validated loan-level and pool-level data from surveillance reports." CDOEdge simulates Moody's Ratings quantitative approach.

**User Stories:**

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-03a | As a credit analyst, I want the system to compute an empirical transition matrix for each NBFI from its historical loan performance data so that roll-rate projections reflect that NBFI's actual observed behaviour rather than generic assumptions. | System computes observed DPD-bucket transitions from HistoricalLoanRow data; displays computed matrix alongside the hardcoded reference matrix; uses computed matrix in projections when sufficient history exists (minimum 12 periods). |
| US-03b | As a risk manager, I want empirically observed loss rates per DPD bucket per NBFI so that ECL and provisioning reflect actual credit performance. | System computes observed cumulative loss by bucket from historical tapes; flags NBFIs where observed rates differ materially (>50% relative) from system defaults. |
| US-03c | As an analyst, I want the repayment velocity ratios to be derived from actual payment records rather than hardcoded by DPD bucket so that Vp reflects true collection behaviour. | When payment history data is available, actual payment ratios per DPD bucket are computed; hardcoded defaults used only as fallback. |
| US-03d | As a system, I want to distinguish "first upload — no history" from "calibrated from N months of history" in all analytical outputs so that users understand the confidence level of each metric. | Every analytics panel shows a data confidence indicator: "Hardcoded defaults (no history)" vs "Calibrated from N months of data." |

---

### EPIC-04: IFRS 9 Compliant ECL Computation

**Gap:** GAP-04 | **Priority Score:** 9 (Critical x Core) | **Effort:** L

**Problem:** ECL is computed using simplified loss rates and fixed LGDs. The IFRS 9 label in the UI is inaccurate. CBK requires IFRS 9-compliant provisioning.

**Moody's equivalent:** SF Portal Regulatory Module — "Run SPPI tests, IFRS 9 impairment and staging." Data Feed — IFRS 9/CECL fields at loan level.

**User Stories:**

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-04a | As a credit analyst, I want IFRS 9 Stage classification (Stage 1 / Stage 2 / Stage 3) computed for each loan using the 30-day DPD rebuttable presumption as the SICR indicator so that the staging is defensible under IFRS 9.5.5.11. | Every loan assigned Stage 1, 2, or 3 based on DPD; Stage 2 triggered at DPD > 30; Stage 3 triggered at DPD > 90; staging shown in loan-level export. |
| US-04b | As a risk manager, I want 12-month PD term structure derived from the empirically calibrated transition matrix (EPIC-03) so that Stage 1 ECL reflects the NBFI's actual observed default rates. | Stage 1 ECL = 12-month PD (from empirical matrix) x LGD x EAD; Stage 2 and 3 ECL = lifetime PD x LGD x EAD. |
| US-04c | As a reporting user, I want the ECL label in the UI to accurately describe the computation method so that NCBA avoids presenting approximate estimates as IFRS 9-compliant figures. | All labels changed to "Simplified DPD-based ECL" until full IFRS 9 implementation is live; change deployed immediately as a hotfix. |
| US-04d | As a compliance officer, I want a reconciliation between the NBFI-reported provision and NCBA's computed ECL so that I can identify material differences requiring escalation. | Side-by-side comparison table: NBFI provision (from their policy) vs NCBA IFRS 9 ECL vs NCBA lender provision; with variance flags. |

---

### EPIC-05: Kenya Macro Scenario Engine

**Gap:** GAP-03 | **Priority Score:** 6 (Significant x Core) | **Effort:** L

**Problem:** Stress scenarios are hardcoded matrix adjustments with no macroeconomic grounding. ICAAP and investor stress tests require macro-linked scenarios.

**Moody's equivalent:** SFW Economy.com integration — "GDP, regional GDP, unemployment, interest rates across five economic scenarios." CPM — "multi-period scenario analysis" with macro-conditional PD/LGD.

**User Stories:**

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-05a | As a risk manager, I want to define a stress scenario by specifying Kenyan GDP growth, CBK policy rate, inflation rate, and KES/USD exchange rate so that portfolio stress tests are grounded in macroeconomic conditions rather than arbitrary matrix adjustments. | Scenario editor accepts 4 macro inputs (GDP growth %, CBK rate %, CPI %, KES/USD); applies a mapping function to translate macro inputs to DPD transition probability adjustments; displays resulting transition matrix. |
| US-05b | As a credit analyst, I want to see the impact of a 2% GDP growth scenario on portfolio PAR 30, ECL, and waterfall coverage ratios so that I can demonstrate stress resilience to the credit committee. | Running a macro scenario produces: PAR 30 shift, ECL shift (KES), and waterfall tranche coverage under the scenario. |
| US-05c | As a system, I want three pre-built reference scenarios (Base: current CBK projections; Moderate Stress: GDP -2pp, rate +200bps; Severe Stress: GDP -5pp, rate +400bps, FX -20%) so that analysts have a consistent starting point without needing to build scenarios from scratch. | Pre-built scenarios selectable from dropdown; parameters displayed and editable. |

---

## TIER 3: Compliance and Commercial Output

These items make the platform audit-ready and investment-grade. They depend on Tier 2 being done (accurate outputs must precede formatted outputs).

---

### EPIC-06: Regulatory Reporting Templates and Deal Package Export

**Gap:** GAP-05 | **Priority Score:** 9 (Critical x Core) | **Effort:** L

**Problem:** No regulatory output. No deal package. No board-ready documents. The Download button in the selection page has no implementation.

**Moody's equivalent:** ABS Suite Plus — XML investor reports, monthly close, automated regulatory reporting. Recon — audit-compliant exception reports. CPM Report module — board-level reporting.

**User Stories:**

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-06a | As a credit analyst, I want to export a Credit Memorandum PDF for any NBFI that includes: NBFI overview, financial summary (3-year trend), loan book quality metrics, pool selection details, securitisation structure, covenant schedule, and analyst recommendation so that I can submit a single document to the credit committee without manual compilation. | One-click PDF export from the review page covering all sections; NCBA and Kaleidofin branding; date and version stamped. |
| US-06b | As a risk manager, I want to export a Quarterly Review Report per NBFI showing covenant status, classification table, provisioning comparison, and early warning alerts so that the quarterly credit review is a formatted document, not a screen presentation. | PDF export from covenants page; includes as-at date, NBFI name, all covenant readings, classification table with amounts, and any breach escalation notes. |
| US-06c | As a portfolio manager, I want to export a Portfolio Dashboard Report showing all NBFI exposures, aggregate PAR metrics, concentration analysis (HHI), and limit utilisation so that I can present portfolio health to the Board Risk Committee. | PDF export from dashboard page; covers all sections visible in the portfolio monitoring view. |
| US-06d | As a compliance officer, I want an immutable time-stamped audit log of all approval and rejection decisions, with acting user, timestamp, and recommendation text stored in the database so that NCBA satisfies internal audit requirements. | Every status transition (approve/reject/covenant breach acknowledgement) creates a server-side immutable record with userId, timestamp, and text. |

---

### EPIC-07: Portfolio Limits and Risk Appetite Framework

**Gap:** GAP-06 | **Priority Score:** 6 (Significant x Core) | **Effort:** M

**Problem:** No portfolio-level limit framework. No exposure utilisation view. Raw totals shown with no Board-approved limit comparison.

**Moody's equivalent:** CPM ACT — "Review credit risk appetite and set limits and targets accordingly." "Define target portfolios in terms of product, customer, and segment mix."

**User Stories:**

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-07a | As a Chief Risk Officer, I want to define portfolio exposure limits by NBFI type (microfinance, asset finance, agricultural, consumer), geography (county), and product so that the credit team enforces the Board-approved risk appetite. | Limit configuration page for approved roles; limits stored server-side; at least 3 limit dimensions (NBFI type, geography, product). |
| US-07b | As a credit analyst, I want to see utilisation percentage (current exposure / approved limit) for each limit dimension on the dashboard so that I can identify concentration headroom before recommending a new facility. | Dashboard shows limit utilisation bars: green < 70%, amber 70-90%, red > 90%. |
| US-07c | As a system, I want to prevent an analyst from completing a credit approval when the resulting exposure would breach a portfolio limit so that limit breaches require an explicit override with documented justification. | Approval workflow checks limit utilisation; if breach occurs, analyst must enter override justification before approval proceeds; justification stored in audit log. |

---

### EPIC-08: NBFI Sector Benchmarking

**Gap:** GAP-08 | **Priority Score:** 6 (Significant x Core) | **Effort:** S

**Problem:** Covenant thresholds set without sector context. No reference for what CRAR, PAR 30, or D/E ratios are typical for Kenyan microfinance institutions.

**Moody's equivalent:** SF Portal — "Compare your tranche against its peers using scatter plots and distributions across key performance metrics."

**User Stories:**

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-08a | As a credit analyst, I want to see industry quartile benchmarks (P25/P50/P75) for key NBFI metrics (CRAR, Net NPA, PAR 30, Collection Efficiency, D/E, Cost-to-Income) alongside the specific NBFI's values so that I can contextualise the NBFI's performance against its peer group. | Covenant display panel shows benchmark bar with NBFI value plotted; benchmark data sourced from static quarterly reference table initially; updated quarterly. |
| US-08b | As a risk manager, I want covenant thresholds pre-populated with sector medians when setting up a new NBFI so that default thresholds are grounded in market practice rather than arbitrary values. | Setup page suggests sector-median-based thresholds as defaults; analyst can override. |
| US-08c | As a system, I want the benchmark reference data to be updateable by an admin user quarterly so that benchmarks remain current without a code deployment. | Admin interface for uploading updated benchmark tables; version history maintained. |

---

## TIER 4: Market Expansion (Adjacency)

These items are not required for the core wholesale NBFI lending use case but become important as the platform expands to support securitisation as a primary funding mechanism.

---

### EPIC-09: Production-Grade Waterfall Engine

**Gap:** GAP-10 | **Priority Score:** 4 (Significant x Adjacency) | **Effort:** XL

**Problem:** Current waterfall has no reserve accounts, no trigger mechanisms, and no multi-period amortisation profile. Cannot represent a real securitisation transaction.

**Moody's equivalent:** CDOEdge — OC/IC test modules, reinvestment assumptions, multi-currency. ABS Suite Plus — full waterfall calculations for warehouse, term, covered bonds.

**User Stories:**

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-09a | As a structurer, I want to configure a liquidity reserve account (funded at issuance, used to cover senior interest shortfalls) so that the waterfall model reflects standard securitisation structural protections. | Liquidity reserve input (KES or % of pool) added to securitisation structure config; waterfall draws from reserve before recording senior shortfall. |
| US-09b | As a structurer, I want OC/IC trigger levels so that the waterfall model redirects principal to senior tranche paydown when coverage ratios breach a specified threshold. | OC trigger threshold configurable; when pool balance / note balance falls below threshold, pro-rata switches to sequential; clearly shown in period-by-period waterfall table. |
| US-09c | As a portfolio manager, I want a period-by-period cash flow table for the full transaction life (not just 12 months) showing pool balance, collections, losses, tranche balances, and reserve account balance at each period. | Full-term waterfall table exportable to Excel; period count configurable up to 60 months. |

---

### EPIC-10: Investor and Warehouse Lender Portal

**Gap:** GAP-09 | **Priority Score:** 4 (Significant x Adjacency) | **Effort:** L

**Problem:** No investor-facing view. Securitisation requires investors to access pool statistics, tranche performance, and covenant history.

**Moody's equivalent:** Global Portal (STS/BoE disclosure). SF Portal (deal analytics for buy-side). Manager Module (trustee collaboration).

**User Stories:**

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-10a | As an investor in an NCBA securitisation, I want read-only access to pool statistics (balance, PAR, vintage CNL, DPD distribution), tranche performance (coupon paid, principal outstanding, coverage ratio), and covenant status for my transaction so that I can monitor the deal without calling NCBA for updates. | Investor-role portal restricted to the specific transaction(s) the investor is named on; no loan-level PII visible; pool stats updated on each loan book upload. |
| US-10b | As a warehouse lender, I want access to the borrowing base certificate showing eligible collateral, advance rates, and headroom so that I can monitor my facility utilisation daily. | Borrowing base certificate view (from EPIC-01 persisted data) accessible to warehouse lender role; exportable as PDF. |
| US-10c | As an auditor, I want read-only access to document submission history, covenant readings, and classification decisions so that I can verify compliance without requiring NCBA to prepare a data pack. | Read-only auditor role with access to document history, covenant log, and classification log for specified NBFIs only. |

---

## Gap Items Not Recommended for Backlog

The following gaps from the analysis are **Out of Scope** or specifically inapplicable to NCBA's context and are excluded from the backlog:

| Gap | Reason Excluded |
|---|---|
| CCAR/DFAST stress testing | US Federal Reserve-specific; not applicable to CBK-regulated institution |
| Solvency II | EU insurance regulation; not applicable |
| RBC/ICS capital management | Insurance-specific; not applicable |
| CDOEdge WARF sensitivity | CLO-specific metric; NCBA pool is NBFI receivables not corporate bonds |
| Covered bonds | Requires specific legal framework; not relevant to NBFI securitisation |
| Sanctions screening / geopolitical risk | Relevant at portfolio level but separate system; not a core credit risk gap |
| Cyber risk ratings per holding | Buy-side investor use case; not applicable to wholesale lending |
| 30,000 securitisation deal library | Relevant only if NCBA invests in public securitisation markets |
| News and sentiment feeds | Relevant to buy-side; not a lender priority at this scale |

---

## Summary: Prioritised Backlog

| Epic | Title | Gap | Score | Effort | Tier |
|---|---|---|---|---|---|
| EPIC-01 | Backend Data Persistence Layer | GAP-01 | 9 | XL | 1 |
| EPIC-03 | Model Calibration from Historical Data | GAP-02 | 9 | L | 2 |
| EPIC-04 | IFRS 9 Compliant ECL Computation | GAP-04 | 9 | L | 2 |
| EPIC-06 | Regulatory Reporting and Deal Package Export | GAP-05 | 9 | L | 3 |
| EPIC-02 | Real Data Validation Engine | GAP-11 | 6 | M | 1 |
| EPIC-05 | Kenya Macro Scenario Engine | GAP-03 | 6 | L | 2 |
| EPIC-07 | Portfolio Limits and Risk Appetite Framework | GAP-06 | 6 | M | 3 |
| EPIC-08 | NBFI Sector Benchmarking | GAP-08 | 6 | S | 3 |
| EPIC-09 | Production-Grade Waterfall Engine | GAP-10 | 4 | XL | 4 |
| EPIC-10 | Investor and Warehouse Lender Portal | GAP-09 | 4 | L | 4 |
| — | Deal Package PDF (sub-item of EPIC-06) | GAP-07 | — | — | 3 |

---

*This backlog is derived from the research document at `research/competitive-analysis.md`. Any changes to gap classifications in that document should trigger a review of the priority scores here.*
