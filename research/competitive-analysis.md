# NCBA Platform vs. Moody's: Competitive Analysis Research Document

**Date:** February 2026  
**Scope:** Moody's Structured Finance product suite and Credit Portfolio Management solution vs. Kaleidofin's NCBA Risk Infrastructure Platform  
**Sources:** Moody's official product brochures (PDF), capability pages, case studies; NCBA platform source code (direct file audit)

---

## 1. Executive Summary

### Headline Finding
The NCBA Risk Infrastructure Platform is a purpose-built, workflow-first product for wholesale NBFI lending. It covers the decisioning-to-monitoring journey end-to-end with genuine depth in loan-level analytics. Moody's, by contrast, is an enterprise analytics and data infrastructure company whose products address a fundamentally different buyer: large institutional investors, CLO managers, and multi-asset-class banks operating at global scale.

The two platforms are not direct competitors today. However, as NCBA and its borrower NBFIs grow, and as securitisation becomes a meaningful funding channel, the gaps between what this platform offers and what institutional-grade infrastructure provides will become blockers to enterprise adoption, regulatory credibility, and investor confidence.

### Five Key Findings

1. **The analytics engine is demo-grade, not production-grade.** All transition matrices, loss rates, LGDs, trend data, early warning projections, and the shadow reconciliation factor are hardcoded constants or synthetic simulations. No computation is calibrated from actual historical data. This is the most fundamental gap.

2. **No macroeconomic linkage anywhere in the model.** Moody's macro scenario engine (Economy.com) drives PD, prepayment, and LGD estimates at the loan level across five economic scenarios. The NCBA platform has three fixed stress scenarios (Base/Stress/Severe) with hardcoded transition matrices that bear no relationship to macro conditions.

3. **Regulatory output is aspirational, not operational.** The platform labels its provisioning methodology as IFRS 9 and references Basel staging rules in text, but produces no IFRS 9-compliant ECL computation, no ICAAP output, no CBK or CMA regulatory templates, and no audit-ready deal documentation.

4. **The securitisation module is a proof of concept.** The waterfall is a single-period, three-tranche model with no reserve accounts, no trigger mechanisms, no multi-period amortisation profile, no investor reporting, and no trustee reconciliation. Moody's ABS Suite Plus handles issuance of covered bonds, warehouse facilities, and term deals end-to-end including accounting and XML-format investor reports.

5. **The platform has genuine, defensible advantages** in NBFI-specific workflow, dual provisioning policy views, loan-level pool selection with eligibility waterfall, and the two-tier monitoring concept (wholesale loan + retail portfolio). These are not replicated by any Moody's product.

---

## 2. Moody's Capability Inventory

*This section documents exactly what Moody's offers across its Structured Finance and Credit Portfolio Management product lines, sourced from official brochures and capability pages.*

### 2.1 ABS Suite Plus
**Source:** abs-suite-plus-brochure.pdf  
**Delivery:** SaaS  
**Target customers:** Global issuers and trustees, from first-time issuers to multi-asset-class portfolios

ABS Suite Plus is positioned as an end-to-end platform for structured finance administration, accounting, funding optimisation, and analytics. Its core assertion is that users can launch new deals or modify existing ones without IT or third-party support.

**Core modules:**
- **Funding Optimisation:** True pool optimisation using deal-specific compliance and eligibility criteria alongside funding analytics, supporting warehouses, term deals, and covered bonds.
- **Collateral Import and Servicing:** Automated ingestion and management of collateral data.
- **Investor Reporting and XML Reporter:** Supports waterfall calculations, investor reporting, and monthly close processes with an auditable framework. Generates XML-format reports for distribution.
- **Accounting and Payment Management:** Automates accounting entries and payment processing.
- **Collateral and Transaction Forecast:** Forward-looking collateral and transaction-level projections.
- **Workflow Processing Engine:** Fully integrated, centralised manual input management with live notification updates.
- **User-managed waterfalls:** Explicitly described as 'intuitive user-managed waterfalls' — business users can configure waterfall logic without IT.

**Issuance types supported:** Warehouse funding, term deals, covered bonds, private issuance.

**Key customer outcome (Suncorp Bank):** Doubled its on-balance sheet trust from undisclosed to A$12 billion using ABS Suite, was the first Australian bank to pass RBA level-two reporting requirements when they became mandatory in 2015, and was described as 'the first bank to do it successfully' when APRA requested increased self-securitisation during COVID-19.

**Key customer outcome (T-Mobile):** Manages two privately-placed revolving securitisations of approximately US$1 billion each backed by mobile phone contracts. Manual alternative would have 'taken a couple of years to build internally.'

---

### 2.2 CDOEdge
**Source:** cdoedge-2024.pdf  
**Delivery:** Desktop application + API  
**Target customers:** CLO structurers, CLO managers, underwriters, global banks

CDOEdge is a CLO/CDO credit modelling platform that explicitly 'simulates Moody's Ratings quantitative approach to CLO transaction ratings' — meaning users can estimate how Moody's would rate a structure before formal submission.

**Core functionalities:**
- **Structured Engine and Waterfall:** Create and modify any structure or waterfall including multi-currency transactions; run cashflows 'faster-than-Excel'; incorporate reinvestment assumptions; point-and-click interface for tranche, fee, hedge, OC/IC test modules.
- **Binomial Analytics:** Two distinct binomial methods for single- and multi-currency deals incorporating interest rate scenarios and default timing profiles; estimate ratings of potential structures based on expected loss; implement internal ratings-based approaches; perform secondary market ratings-based analysis.
- **Optimizer:** Optimise tranche balances, spreads, coupons, collateral covenants, asset quality matrices, and OC levels simultaneously.
- **WARF Sensitivity:** Evaluate the impact of Weighted Average Rating Factor changes on tranche implied ratings.
- **CDOEdge Enhanced API:** Full developer access to the cash flow engine for integration with internal tools.

**Key differentiator:** The direct methodological link to Moody's Ratings criteria means a CLO manager can assess likely rating outcomes before paying for an official rating — a significant cost and time advantage.

---

### 2.3 Structured Finance Workstation (SFW / Models)
**Source:** sfw-brochure.pdf  
**Delivery:** Desktop, Web Services API, Consulting services  
**Target customers:** Buy-side investors, banks, insurance, government agencies

SFW is a cash flow analytics and valuation platform covering over 12,000 ABS, RMBS, CDO, and CMBS deals with over 10,000 incorporated waterfalls.

**Core capabilities:**
- **Macroeconomic Scenarios:** Five economic scenarios from Moody's Economy.com driving home price movements, regional GDP, unemployment, and interest rates, which in turn drive mortgage loan default rates, prepayments, and loss severity.
- **Loan-Level Credit Model:** Estimates default rates, loss given default rates, and prepayment rates at the individual loan level for each of the five macroeconomic scenarios.
- **Cash Flow Waterfall Engine:** Processes prepayment, default, and severity vectors through deal-specific waterfall scripts that mirror deal prospectuses.
- **Flexible Modeling:** Create custom prepayment, default, and interest rate vectors; create and analyse custom portfolios by combining tranches from multiple deals.
- **Robust Analytics:** Scalar/vector prepayment and default rates, loss rates, price/yield tables, sensitivity analysis, first-loss calculators, break-even analysis, advanced automation features.
- **Comprehensive Reporting:** Cash flow reports, deal summaries, profitability analyses, bond and collateral graphs, static pool reports, stratifications, investor and servicer reports.
- **Excel Integration:** Web Services API for automating tasks and building custom Excel macros.

**Data platform:** Monthly updated, validated loan-level and pool-level data from servicer/trustee surveillance reports.

---

### 2.4 Recon
**Source:** recon-brochure.pdf  
**Delivery:** SaaS + optional Portfolio Analysis module  
**Target customers:** CLO collateral managers, trustees, asset managers

Recon is a fully automated reconciliation tool specifically designed to resolve data discrepancies between collateral manager and trustee data — the persistent operational problem in CLO management.

**Core features:**
- **Automated data processing:** Extracts and normalises data from trustee and source systems.
- **Flexible data schema:** Accommodates assets, coverage tests, quality tests, and other data types.
- **Customisable business validation:** User-defined validation rules for data integrity and compliance.
- **Automated reconciliation:** Compares trustee and source system data with online exception reporting.
- **Comprehensive audit logging:** Full history of changes for transparency and compliance, traceable to source.
- **Robust data APIs:** Bidirectional integration with upstream and downstream systems.

**Optional Portfolio Analysis module:** Real-time calculations, trending and reporting at deal and portfolio level from both source system and trustee perspectives.

**Key outcome (CLO Manager Module case study, applicable to Recon):** A large US and London investment firm achieved a 16x reduction in time to generate a typical hypothetical trade after deploying Moody's CLO tooling.

---

### 2.5 Portfolio View
**Source:** portfolio-view-brochure.pdf  
**Delivery:** SaaS  
**Target customers:** Asset managers (buy-side)

Portfolio View maps emerging risk data to a client's existing portfolio, functioning as a real-time risk dashboard that goes beyond traditional credit risk.

**Risk categories:**
- **Sanctions/Geopolitical:** Pre-trade compliance screening, ongoing portfolio monitoring, 'go beyond the sanction list to uncover sanctions-by-extension.'
- **Cyber Risk:** Security-level cyber risk ratings including likelihood of ransomware incident, likelihood of data breach, current security rating, benchmarking against industry average, and security performance history. Described as 'a proven source of alpha.'
- **News and Sentiment:** Access to over 27,000 breaking news sources, trade publications, transcripts, market reports, and blogs; processes over one million items daily; enriched with over 5,000 granular topic codes, sentiment analysis, entity identifiers, and trading impact codes.
- **Credit Decision Analytics:** Moody's credit risk models and early warning signals covering 75,000 public entities and over 44 million private firms.

---

### 2.6 SF Portal (Global Portal)
**Source:** sfp-brochure.pdf  
**Delivery:** SaaS, API, Excel Add-In, direct data feeds  
**Target customers:** Buy-side, banks, insurance  
**Quantitative scale:** Over 12,000 deals globally

The SF Portal is a web-based structured finance analytics platform covering all asset classes (Auto ABS, CDO/CLOs, Credit Card ABS, CMBS, RMBS, Student Loan ABS, Esoteric ABS).

**Three modules:**
- **Cash Flow Module:** Cash flow engine, loan-level data, deal libraries, pricing, credit models, macroeconomic scenarios.
- **Monitoring Module:** Manager style and performance, portfolio-level reporting, benchmarking, complete asset coverage.
- **Regulatory Module:** SSFA, ERBA, SEC-SA, IFRS 9/CECL/SPPI, OTTI assessments, CCAR/DFAST stress testing.

**Key capabilities:**
- Benchmarking: 'Compare your tranche against its peers using scatter plots and distributions across key performance metrics.'
- Loan-level data: Default probabilities and financial ratios on underlying loans; which deals and managers are most exposed to a loan and who has been trading it recently.
- Portfolio-level reporting: Visualise portfolio exposures, identify industry concentrations, high-risk underlying loans; dynamic batch cash flow analysis.
- Regulatory metrics: Capital charge calculations (SSFA, ERBA, SEC-SA), CCAR/DFAST stress testing, SPPI tests, IFRS 9 impairment and staging.
- Excel Add-In: 'Simple in-cell formulas with no coding needed.'

**Regulatory frameworks:** IFRS 9, CECL, SPPI, SSFA, ERBA, SEC-SA, OTTI/OCI, CCAR/DFAST, STS (Simple Transparent Standardised), Bank of England disclosure.

---

### 2.7 Manager Module (and Lender)
**Source:** manager-module-brochure.pdf  
**Delivery:** SaaS (cloud)  
**Target instruments:** BSL CLOs, Middle Market CLOs, BDCs, SMAs, private credit structures

Manager Module is an all-in-one compliance monitoring and portfolio management platform for CLO and private credit managers.

**Core features:**
- **Rapid Hypothetical Trade Results:** Real-time pre- and post-trade impact analysis across portfolios; indenture-specific calculations; loan drill-down details.
- **Front/Middle/Back Office Integration:** Centralised data repositories; portfolio managers, loan traders, operations analysts, and trustees collaborate on a single platform.
- **Borrowing Base Calculations:** Automated using eligibility criteria, compliance rules, and advance rates.
- **Portfolio Business Analytics:** Deal- and asset-level metrics.
- **Customised Reporting:** User-specific reports updated from the UI without IT support.
- **Data Ingestion:** Direct cloud connectivity, APIs, and SFTPs.
- **Compliance checks completed in seconds** across the entire portfolio.

**Service offering includes:** Pre/New Issuance Models, Ongoing Deal Remediation, Customised Visualisation and Reporting, Enhanced Cyber Security.

**Key quantitative outcome:** 16x reduction in hypothetical trade generation time (case study, large US/London CLO manager).

---

### 2.8 Structured Finance API
**Source:** sf-api-brochure.pdf  
**Delivery:** RESTful cloud-hosted API + Local on-premises library (Windows/Linux)  
**Target customers:** Technology integrators, banks, institutional investors

**Six core value propositions:**
- **Cash Flow Models and Analytics:** Proprietary database of waterfall models covering global structured finance markets (public and private); calculation engines for credit, market, and regulatory metrics.
- **Credit Models and Economic Scenarios:** Macroeconomic scenarios fuelling global credit models that produce default, severity, and prepayments at the loan or pool level.
- **Public Data and Documents:** 30-year history of loan and pool performance data; access to trustee reports, notices, offering memorandums, and research.
- **Private Data Automation:** Extraction, normalisation, and validation of performance data for private deals; dashboarding of homogeneous asset classes.
- **Compliance and Reporting:** Generates reports from client's internal data systems for redistribution; portfolio optimisation under deal document rules.
- **Flexible Implementation:** On-premises multi-threaded analytics; stochastic simulations; configurable for loan-level data or rep-lines.

**Performance benchmarks:** CDO/CLO average 0.182 seconds; CMBS/RMBS/ABS average 0.128 seconds; Agency Pool 0.001 seconds. At 1,000 securities with 100 pods: 33 seconds total.

**Integrations:** ImpairmentStudio, Axis, RiskFrontier, RiskConfidence (all Moody's Analytics products).

---

### 2.9 Structured Finance Data Feed
**Source:** data-feed-2024.pdf  
**Delivery:** FTP, web access  
**Scale:** 30,000 securitisations, 600,000 CUSIPs, 99% of CDOs/CLOs/Consumer ABS/RMBS/CMBS globally

**Asset classes:** Auto Floor Plans, Auto Loans, Auto Lease, CDO, CLO, CMBS, Credit Cards, Equipment Lease, Equipment Loans, Non-Auto Floor Plans, RMBS, Student Loans

**Data categories:**
- Premium fields: Appraisals, Financial Ratios, Manager Style, Servicer Charge, Default data, FICO scores
- Regulatory fields: Attachment/Detachment Points, CCAR/DFAST/EBA/PRA, SFA, SSFA; IFRS 9/CECL, OTTI/OCI, SPPI; PD/LGD/Prepayment at loan level (CLO/RMBS/CMBS) or pool level (Consumer ABS); Solvency II
- Market risk fields: 30+ bond analytics metrics including OAS, DV01, Modified Duration, Nominal Spread, Yield to Worst, Effective Duration, ZVO

**Data freshness:** Approximately 95% of data available within 1-2 days of reporting.

---

### 2.10 Credit Portfolio Management (CPM)
**Source:** credit-portfolio-management.html  
**Delivery:** Cloud SaaS  
**Target customers:** Banks, insurers, asset managers  
**Award:** #1 Chartis RiskTech100 2024 (second consecutive year)

Moody's CPM combines risk analytics with portfolio steering tools across an 'Analyse, Act, Report' framework.

**ANALYSE capabilities:**
- Portfolio-level credit risk and return measurement and benchmarking.
- Credit risk factor modelling: pricing models, risk concentrations, correlations, hedging, stress tests.
- Asset correlation estimation for publicly traded firms, private firms, retail borrowers, commercial real estate, and emerging markets.
- Real-time portfolio monitoring with early warning indicators.
- Physical and transition (climate) risk scenario analysis: test impact on asset values, sustainability objectives, capital, and earnings.

**ACT capabilities:**
- **Portfolio Steering:** Define target portfolios by product/customer/segment mix; analyse risk/return balance; perform risk transfers for balance sheet optimisation; set credit risk appetite and limits.
- **What-if analysis:** Multi-period scenario analysis and stress testing across all asset classes.
- **Final Basel RWA Optimisation:** Turn RWA calculation results into a portfolio risk/reward optimisation strategy; connect portfolio management to lending and balance sheet management workflows.
- **RBC/ICS Capital Management:** Manage RBC or ICS capital over time; identify upgrades/downgrades; evaluate RBC/ICS impact on new investment opportunities.

**REPORT capabilities:**
- **ICAAP:** Integration into strategic decision-making; transforms regulatory requirement into a business value driver.
- **IFRS 9/CECL:** Sophisticated tools for financial forecasting; more accurate credit impairment risk assessment.
- **Risk and Sector Committee Reviews:** Board-level reporting of historical trends, future direction, and recommendations.

**Regulatory frameworks:** IFRS 9, CECL, ICAAP, Basel IV, RWA, RBC, ICS, physical and transition risk (OSFI's SCSE, Federal Reserve CSA exercise, ECB cyber stress tests).

---

## 3. NCBA Platform Capability Inventory

*This section documents exactly what the NCBA platform does today, based on direct source code audit. All claims are grounded in specific files and functions.*

### 3.1 Data Ingestion and Integration
**Source files:** `src/lib/integrationSchemas.ts`, `src/lib/types.ts`

The platform defines four document types with formal schemas and validation test suites:

**Loan Book (daily loan tape):** 16 fields (11 required), auto-mapping from 30+ source column aliases, daily SFTP delivery schedule defined. Validation: 12 tests covering required fields, uniqueness, format, range, and logical consistency.

**Loan Performance History (historical tape):** Supports long format (one row per loan per reporting period) and wide format (one row per loan with dynamic `dpd_YYYY_MM` / `bal_YYYY_MM` columns), auto-detected on upload. Minimum 12 reporting periods required; 24-36 recommended. 14 validation tests including contiguous sequence checks, monotonicity checks, and cohort survival rates.

**Financial Statements (audited annual):** 80+ line items across metadata, balance sheet (27 fields), P&L (13 fields), and cash flow (36 fields). XLSX format, 2-3 consecutive years required.

**Monthly MIS (management accounts):** 20 fields covering P&L summary, balance sheet summary, and operational KPIs (headcount, branch count, cost-to-income), due by the 5th business day of the following month.

**Critical limitation:** All validation tests return hardcoded mock pass/fail results — they are not evaluated against actual uploaded data. SFTP integration is UI-only; the hostname `sftp.wholesalelender.co.ke` is a placeholder with no actual connection. Feed history records are generated via seeded pseudorandom functions. No data persists beyond the React context session.

---

### 3.2 Credit Risk Analytics
**Source files:** `src/lib/rollRate.ts`, `src/lib/types.ts`

The platform computes the following metrics from loan-level data:

**Loss estimation:** Applies hardcoded LOSS_RATES by DPD bucket to currentBalance. Rates: Current 0%, 1-30 DPD 1%, 31-60 DPD 5%, 61-90 DPD 20%, 91-180 DPD 50%, 180+ DPD 100%.

**ECL computation (`computeECL`):** 12-month ECL = currentBalance x PD12m x LGD, where LGD is hardcoded at 0.45 for Current/1-30 DPD and 0.65 for all other buckets. Lifetime ECL = currentBalance x LOSS_RATES. Does not apply IFRS 9 Stage 1/2/3 PD term structure curves or macro-conditional PD estimates.

**Provisioning (`computeProvisions`):** Applies LENDER_PROVISION_RATES by DPD bucket: Current 1%, 1-30 1%, 31-60 10%, 61-90 50%, 91-180 75%, 180+ 100%.

**Roll-rate projection (`rollRateProjection`):** Markov chain forward projection for 3 periods using one of three hardcoded transition matrices. Base matrix example: Current stays Current 94%, transitions to 1-30 DPD 6%; 180+ DPD is absorbing (100% stays). Stress and Severe matrices increase transition probabilities to deeper DPD buckets by 4-15 percentage points.

**HHI concentration (`computeHHI`):** Standard Herfindahl-Hirschman Index with normalisation. Labels: below 0.10 = Well Diversified (green), 0.10-0.18 = Moderate Concentration (amber), above 0.18 = High Concentration (red). Applied to geography and product dimensions.

**CDR (`computeCDR`):** Monthly default rate = new defaults (DPD > 90, not written off) / pool balance. Annualised CDR = 1 - (1 - monthlyDefault)^12.

**CNL (`computeCNL`):** (ChargeOffs - Recoveries) / OriginalOriginationVolume x 100.

**Repayment Velocity (`computeRepaymentVelocity`):** Scheduled EMI vs actual payments by DPD bucket (actual ratios hardcoded: Current 1.0, 1-30 DPD 0.92, 31-60 DPD 0.75, 61-90 DPD 0.50, 91-180 DPD 0.20, 180+ DPD 0.05).

**Borrowing Base (`computeBorrowingBase`):** Eligible loans = DPD <= 60 AND not written off AND balance <= 1% of pool (single-loan cap). Eligible contribution = balance x ADVANCE_RATES by bucket (Current 80%, 1-30 60%, 31-60 40%, 61-90 10%, 91-180 and 180+ 0%). Reserves = 5% of eligible. Borrowing base = eligible - reserves.

**Financial summary (`computeFinancialSummary`):** Total balance, gross loss, net loss, recovery, provisions, overdue, average interest rate (balance-weighted), write-off count/rate, recovery rate, overdue ratio.

**Critical limitations:** All transition matrices, loss rates, LGDs, advance rates, and repayment velocity ratios are hardcoded constants — not calibrated from actual historical data. Shadow reconciliation uses a hardcoded 8% principal reduction factor. Trend data (generateTrendData) is generated using trigonometric (sin) seeding — not derived from historical snapshots. CRAR is not computed from balance sheet data; all EWS covenant values are static mock values.

---

### 3.3 Scenario and Stress Testing
**Source files:** `src/lib/rollRate.ts`, `src/lib/securitisationWaterfall.ts`, `src/app/nbfi/[id]/covenants/page.tsx`

**Roll-rate scenarios:** Three fixed scenarios (Base/Stress/Severe) using hardcoded transition matrices. Stress increases transition out of Current by 4pp; Severe by 9pp. No macroeconomic linkage.

**Waterfall stress grid:** `runStressGrid` runs the waterfall across all combinations of 4-5 loss rates (3-15%) and 4 prepayment rates (0-30%) = 16-20 scenarios. Results are colour-coded: green = All OK, amber = Mezz stress, red = Senior impaired.

**What-if slider (EWS page):** A single slider for Collection Efficiency (95-100%). PAR 30 impact = max(0, 5.2 - (slider - 98.2) x 2). CRAR impact = 14.7 + (slider - 98.2) x 0.5. Both are linear approximations using hardcoded base values — not derived from any model.

---

### 3.4 Structured Finance and Securitisation
**Source files:** `src/lib/securitisationWaterfall.ts`, `src/app/nbfi/[id]/selection/page.tsx`

**Waterfall model (`runWaterfall`):** 12-period single-scenario model. Inputs: pool balance, average rate, structure (3 tranche percentages + OC), loss rate, prepayment rate. Waterfall priority: Senior Interest -> Mezzanine Interest -> Senior Principal -> Mezzanine Principal -> Equity Residual. Outputs per tranche: initial balance, interest paid, principal paid, end balance, shortfall, coverage ratio, and status (ok / partial / impaired).

**Tranche structure:** Three tranches only (Senior, Mezzanine, Equity) with percentages, OC percentage, and per-tranche coupon inputs. Structure is finalisable (immutable once confirmed).

**Stress grid:** 20 scenarios (loss rates 3/6/9/12/15% x prepay rates 0/10/20/30%). Colour-coded grid showing which tranche is first to experience impairment.

**Limitations:** No reserve account (liquidity reserve, cash reserve). No trigger mechanisms (sequential-to-pro-rata switches, OC/IC breach triggers that redirect cash flow). No reinvestment assumptions. No multi-currency. No multi-period amortisation profile customisation. No investor reporting output. No accounting entries. No trustee reconciliation. No XML or regulatory-format report generation. The pool metrics function (`poolMetricsFromLoans`) uses simple averages and hardcoded defaults (15% rate if missing, 12 months tenure if missing).

---

### 3.5 Portfolio Monitoring and Early Warnings
**Source files:** `src/app/nbfi/[id]/monitoring/page.tsx`, `src/app/nbfi/[id]/covenants/page.tsx`, `src/lib/rollRate.ts`

The monitoring page is the platform's most developed component. It supports three scope modes (Transaction / NBFI / Portfolio) and two view modes (Overall / Security Package).

**KPI metrics shown:** Total loans, total balance, PAR 30+, PAR 90+, NPL ratio, gross loss, net loss, provisions, total overdue, overdue ratio, write-off rate, recovery rate, ECL 12-month, ECL lifetime, average interest rate.

**Additional analytics panels:** DPD distribution chart, performance trend chart (PAR 30/90/NPL/Collection over 3M/6M/12M), roll-rate projection (3-period Markov, 3 scenarios), vintage analysis table and CNL curves, stress indicators by geography/product/segment/ticket size, repayment velocity (Vp), cure rate, CNL, CDR, borrowing base and eligibility waterfall (5 criteria), HHI for geography and product, shadow reconciliation.

**Portfolio-scope extras:** Risk ranking table (composite score = NPL x 0.4 + PAR90 x 0.3 + LossRate x 0.3), risk heatmap for top-10 NBFIs.

**Covenant monitoring:** All defined covenants tracked with latest reading, trend, headroom, and status. Breach alerts with hardcoded escalation recommendation ('Escalate to credit committee, request remediation plan from NBFI within 14 days'). Dual provisioning policy comparison (NBFI vs Lender).

**Early warning system:** Five metrics tracked (CRAR, Net NPA, Collection Efficiency, PAR 30, Debt-to-Equity). Projected breach dates shown. What-if collection efficiency slider. All current values and projections are hardcoded from static JSON (`mock-early-warnings.json`) — not computed from loan tape.

**Two-tier monitoring concept:** The data model (`MonitoringData` type) explicitly captures both wholesale loan details (facility amount, principal outstanding, repayment schedule) and retail portfolio metrics, enabling NCBA to monitor NBFI-level credit risk alongside underlying borrower performance.

---

### 3.6 Regulatory and Compliance Reporting
**Source files:** `src/app/nbfi/[id]/setup/page.tsx`, `src/app/nbfi/[id]/covenants/page.tsx`, `src/lib/rollRate.ts`

**IFRS 9 references:** The setup page displays explanatory text: 'Stage 1 (Normal, 0-30 DPD) = 12-month ECL; Stage 2 (Watch/Substandard, 31-90 DPD) = lifetime ECL; Stage 3 (Doubtful/Loss, 90+ DPD) = lifetime ECL. DPD-based staging uses the 30-day past-due rebuttable presumption per IFRS 9.5.5.11.' The EDA page labels ECL methodology as IFRS 9. However, the actual ECL computation does not use IFRS 9 Stage PD curves, does not apply SICR criteria beyond DPD, and uses fixed hardcoded LGDs (0.45/0.65) with no macro-conditional adjustment.

**Classification framework:** Quarterly review generates Normal/Watch/Substandard/Doubtful/Loss classifications by DPD bucket. Provision amounts computed. Table exported as on-screen display; no regulatory filing format produced.

**Exports:** Single CSV download of loan-level data (10 columns). No deal package PDF. No board report template. No CBK/CMA filing template. No ICAAP output. No Basel RWA computation.

---

### 3.7 Workflow and Decisioning
**Source files:** `src/lib/types.ts` (NBFIStatus, UserRole), `src/app/nbfi/[id]/review/page.tsx`, `src/app/nbfi/[id]/setup/page.tsx`, `src/app/nbfi/[id]/documents/page.tsx`

The platform implements a 9-state workflow: draft -> uploading -> spreading -> pending_review -> approved -> rejected -> pool_selected -> setup_complete -> monitoring.

**Role-based access:** Three roles (analyst, approver, nbfi_user). Analyst submits recommendations and commentary. Approver sees approve/reject buttons only when NBFI is in pending_review status. NBFI user has access to the upload portal only.

**Credit commentary thread:** Sequential comments from analyst and approver, colour-coded by role.

**Document management:** Six default document types (MIS Portfolio Report, Compliance Certificate, Unaudited Quarterly Financials, Audited Annual Financials, Tax Compliance Certificate, Management Accounts) with status tracking (submitted/pending/overdue), automated alerts for overdue submissions, time-stamped submission history.

**Covenant and provisioning setup:** Fully configurable covenants (metric name, operator, threshold, frequency, format) and provisioning rules (two independent policy sets: NBFI and Lender) per NBFI.

**NBFI partner portal:** Separate portal at /nbfi-portal for NBFI users to upload loan books, submit documents, and configure SFTP settings.

**Limitations:** No email notifications. No persistence beyond React context (page refresh loses all state). No audit log of approvals with timestamps. No multi-user concurrency. Pool confirmation is irreversible; no unlock mechanism.

---

### 3.8 Investor and Multi-Party Access
**Source files:** `src/app/nbfi-portal/` (reviewed via codebase exploration)

The NBFI portal is one-directional: NBFIs upload data and documents to NCBA. There is no investor-facing view, no warehouse lender view, no auditor access, and no permissioned data room concept.

---

### 3.9 Market Data and Benchmarking
No external data integration of any kind. No peer benchmarking. No credit bureau or external rating integration. No macro data feeds (CBK, World Bank). No market pricing. No sector quartile reference data.

---

## 4. Capability Comparison Matrix

*Each cell cites the specific source: Moody's brochure/page or NCBA file/function name.*

### Dimension 1: Data Ingestion and Integration

| Sub-capability | Moody's | NCBA Platform | Evidence |
|---|---|---|---|
| External data history | 30-year loan/pool/bond history; 30,000 securitisations; 600,000 CUSIPs | None | Moody's: data-feed-2024.pdf; NCBA: no external feeds |
| Real-time loan tape ingestion | Yes — SFTP, API, cloud connectivity (Manager Module) | Schema defined (4 types) but SFTP is UI-only placeholder | NCBA: integrationSchemas.ts — `sftp.wholesalelender.co.ke` placeholder |
| Data validation | Automated exception reporting; audit-logged (Recon) | 12-46 tests per document type but all return hardcoded mock results | NCBA: integrationSchemas.ts — all test results are static mock strings |
| Trustee-manager reconciliation | Fully automated (Recon product) | Shadow reconciliation using hardcoded 8% principal factor | NCBA: rollRate.ts computeShadowReconciliation |
| External ratings data | Moody's Ratings integration; secondary market ratings via CDOEdge | None | Moody's: CDOEdge brochure |
| Market/pricing data | 30+ bond analytics fields (OAS, DV01, duration, yield) | None | Moody's: data-feed-2024.pdf market risk fields |
| News and sentiment | 27,000+ sources, 1M items/day, 5,000+ topic codes (Portfolio View) | None | Moody's: portfolio-view-brochure.pdf |
| Macroeconomic feeds | Economy.com: GDP, HPI, unemployment, interest rates (5 scenarios) | None | Moody's: sfw-brochure.pdf |
| Private firm coverage | 44+ million private firms (Portfolio View) | NBFI-specific records only | Moody's: portfolio-view-brochure.pdf |
| Audit trail persistence | Full change history, traceable to source (Recon) | UI-only; no persistence beyond React context | NCBA: types.ts — no database layer |


### Dimension 2: Credit Risk Analytics

| Sub-capability | Moody's | NCBA Platform | Evidence |
|---|---|---|---|
| Loan-level PD estimation | Loan-level PD per macroeconomic scenario (SFW credit model) | Not computed — loss rates hardcoded by DPD bucket | Moody's: sfw-brochure.pdf; NCBA: rollRate.ts LOSS_RATES constant |
| LGD estimation | Loan-level LGD per macro scenario | Fixed: 0.45 (Current/1-30), 0.65 (all others) | NCBA: rollRate.ts computeECL |
| IFRS 9 ECL — Stage PD curves | Full IFRS 9/CECL staging with macro-conditional PD term structure | Simplified loss-rate only; referenced in text but not computed | NCBA: rollRate.ts computeECL vs setup/page.tsx IFRS 9 text |
| Asset correlations | Estimated for public firms, private firms, retail, CRE, emerging markets (CPM) | Not modelled | Moody's: CPM ANALYSE section |
| Economic capital / VaR / ES | Full economic capital workflow; portfolio loss distribution (CPM) | Not modelled | Moody's: CPM "Economic capital workflow" |
| HHI concentration | Yes (CPM concentration risk analysis) | Yes — geography and product HHI with normalisation and labels | NCBA: rollRate.ts computeHHI |
| Roll-rate / Markov projection | Not named as a product feature | Yes — 3-period Markov, 3 fixed scenarios | NCBA: rollRate.ts rollRateProjection |
| CDR / CNL computation | Not named as a specific feature | Yes — CDR annualised; CNL as (chargeoffs-recoveries)/origVol | NCBA: rollRate.ts computeCDR, computeCNL |
| Borrowing base | Automated in Manager Module with indenture-specific eligibility | Yes — 5-step eligibility waterfall, advance rates, 1% cap, 5% reserve | NCBA: rollRate.ts computeBorrowingBase, computeEligibilityWaterfall |
| Repayment velocity | Not described as a named metric | Yes — Vp = actual/scheduled EMI ratio with interpretation labels | NCBA: rollRate.ts computeRepaymentVelocity |
| Dual provisioning views | Not described | Yes — NBFI policy vs Lender policy, side-by-side, both configurable | NCBA: setup/page.tsx DEFAULT_NBFI_PROVISIONING and DEFAULT_LENDER_PROVISIONING |
| Composite portfolio risk score | Not described as a named feature | Yes — NPL x 0.4 + PAR90 x 0.3 + LossRate x 0.3 | NCBA: monitoring/page.tsx risk ranking section |


### Dimension 3: Scenario and Stress Testing

| Sub-capability | Moody's | NCBA Platform | Evidence |
|---|---|---|---|
| Macroeconomic scenario linkage | Economy.com: GDP, HPI, unemployment, rates drive loan-level PD/LGD/prepayment across 5 scenarios | None — scenarios are hardcoded matrix variants only | Moody's: sfw-brochure.pdf; NCBA: rollRate.ts STRESS_MATRIX |
| Number of scenarios | 5 macroeconomic (SFW); unlimited custom (CPM) | 3 scenarios with hardcoded matrices | NCBA: rollRate.ts TRANSITION_MATRIX, STRESS_MATRIX, SEVERE_MATRIX |
| Multi-period forward projection | Multi-period in CPM; periodic waterfalls in SFW | 3-period roll-rate; 12-period waterfall | NCBA: rollRateProjection, securitisationWaterfall.ts |
| Regulatory stress test output | CCAR/DFAST, EBA/PRA, Basel IV, ICAAP scenario generation | None | Moody's: SF Portal Regulatory Module; CPM ICAAP section |
| Physical/transition risk scenarios | Full climate scenario analysis aligned to OSFI SCSE framework | None | Moody's: CPM physical/transition risk section |
| What-if analysis (portfolio steering) | Portfolio-wide: product/segment/customer mix, limit changes, risk transfers | Single slider (Collection Efficiency), linear formula, hardcoded base values | NCBA: covenants/page.tsx what-if section |
| RWA / capital optimisation | Basel IV RWA optimisation connecting portfolio management to lending | None | Moody's: CPM "Final Basel RWA Optimization" |
| Waterfall stress grid | Multi-scenario cashflows in SFW/CDOEdge | 20-scenario grid (5 loss rates x 4 prepay rates), colour-coded | NCBA: securitisationWaterfall.ts runStressGrid |


### Dimension 4: Structured Finance and Securitisation

| Sub-capability | Moody's | NCBA Platform | Evidence |
|---|---|---|---|
| Waterfall complexity | Multi-period; reinvestment; multi-currency; trigger mechanisms; OC/IC tests; reserve accounts | 12-period; 3 tranches; OC input; no reserve accounts; no triggers | Moody's: CDOEdge brochure; NCBA: securitisationWaterfall.ts |
| Issuance types | Warehouse, term, covered bonds, private, CLOs, BDCs, SMAs | Pool-based securitisation only | Moody's: ABS Suite Plus brochure |
| Rating simulation | Moody's rating methodology simulation (CDOEdge) | None | Moody's: CDOEdge "simulates Moody's Ratings quantitative approach" |
| Investor reporting | XML-format investor reports, monthly close (ABS Suite) | None | Moody's: ABS Suite Plus investor reporting module |
| Trustee reconciliation | Fully automated (Recon) | Mock shadow reconciliation (hardcoded 8% factor) | NCBA: rollRate.ts computeShadowReconciliation |
| Accounting and payment management | Full module in ABS Suite | None | Moody's: ABS Suite Plus accounting module |
| Indenture compliance monitoring | Real-time per-CLO indenture compliance in seconds (Manager Module) | Configurable covenant compliance per NBFI | NCBA is general-purpose; Moody's is indenture-specific |
| Hypothetical trade testing | Real-time pre/post-trade impact (Manager Module) | None | Moody's: Manager Module "Rapid Hypothetical Trade Results" |
| WARF sensitivity and optimiser | Tranche optimiser and WARF sensitivity (CDOEdge) | None | Moody's: CDOEdge WARF Sensitivity and Optimization |
| Deal library | 10,000+ incorporated waterfalls; 12,000+ deals (SFW/SF Portal) | Single deal per NBFI; no library | Moody's: SFW brochure |
| Pool selection with eligibility waterfall | Automated in Manager Module and ABS Suite | 10-criterion filter, 5-step eligibility waterfall, live pool summary | NCBA: poolSelection.ts; selection/page.tsx |


### Dimension 5: Portfolio Monitoring and Early Warnings

| Sub-capability | Moody's | NCBA Platform | Evidence |
|---|---|---|---|
| Real-time monitoring | Real-time portfolio monitoring with early warning indicators (CPM) | Computed from uploaded loan tapes; no real-time feed | Moody's: CPM ANALYSE section |
| Scope hierarchy | Portfolio-wide (CPM) | Transaction / NBFI / Portfolio — three-level scope | NCBA: monitoring/page.tsx scope selector |
| Two-tier monitoring (wholesale + retail) | Not described | Explicit — wholesale loan details + retail portfolio metrics in same view | NCBA: types.ts MonitoringData; monitoring/page.tsx |
| Covenant tracking | Not a named CPM feature | Configurable covenants with breach detection, headroom, trend, dual provisioning | NCBA: covenants/page.tsx; types.ts CovenantDef |
| Early warning indicators | Named CPM feature — "real-time portfolio monitoring tools" | 5 metrics tracked but values are static mock JSON | NCBA: covenants/page.tsx; mock-early-warnings.json |
| Vintage analysis and CNL curves | Not described as a named feature | Cohort table and CNL curves (MOB 1-18, last 6 vintages) | NCBA: rollRate.ts computeVintageData, computeVintageCurves |
| Portfolio risk ranking | Not described as a named feature | Composite risk score ranking table + heatmap for top-10 NBFIs | NCBA: monitoring/page.tsx |
| Sector/geographic stress indicators | Concentration risk analysis in CPM | Stress indicators by geography, product, segment, ticket size | NCBA: rollRate.ts computeStressIndicators |
| Credit rating-driven early warnings | Upgrades/downgrades identification (CPM) | None | Moody's: CPM "Identify potential upgrades and downgrades" |


### Dimension 6: Regulatory and Compliance Reporting

| Sub-capability | Moody's | NCBA Platform | Evidence |
|---|---|---|---|
| IFRS 9 ECL (computed) | Full IFRS 9 staging, SPPI, macro-conditional PD (SF Portal, API) | Text references only; computation uses simplified hardcoded loss rates | NCBA: rollRate.ts computeECL vs setup/page.tsx IFRS 9 text |
| CECL | Full CECL computation (SF Portal, API) | Not implemented | Moody's: SF Portal brochure |
| ICAAP output | Full ICAAP integration into strategic decision-making (CPM) | Not implemented | Moody's: CPM REPORT section |
| Basel IV / RWA | RWA optimisation; SSFA, ERBA, SEC-SA capital charges | Not implemented | Moody's: CPM "Final Basel RWA Optimization" |
| STS / Bank of England disclosure | Global Portal specifically built for this | Not implemented | Moody's: capability page Global Portal description |
| CBK / CMA templates | Not mentioned (Kenya-specific) | Not implemented | Gap — neither vendor addresses Kenya-specific regulatory templates |
| Quarterly classification report | Not named | Normal/Watch/Substandard/Doubtful/Loss table with provision amounts | NCBA: covenants/page.tsx quarterly review section |
| Deal package / credit note export | XML investor reports in ABS Suite; board-level reporting in CPM | Text-only; no structured export; selection page Download button not wired | NCBA: review/page.tsx; selection/page.tsx |
| Audit trail | Comprehensive audit logging (Recon); change history | Commentary thread in-memory; no timestamp persistence | NCBA: review/page.tsx — React context only |


### Dimension 7: Workflow and Decisioning

| Sub-capability | Moody's | NCBA Platform | Evidence |
|---|---|---|---|
| End-to-end origination-to-monitoring | ABS Suite covers execution through monitoring (no underwriting) | Full 9-state workflow from NBFI assessment to live monitoring | NCBA: types.ts NBFIStatus enum |
| No-IT deal modification | "Bring new deals to market without IT" (ABS Suite) | Covenant/provisioning/securitisation structure all configurable in-app | NCBA: setup/page.tsx; selection/page.tsx |
| Role-based access | Team-by-team permissions (Suncorp case study; ABS Suite) | Analyst / Approver / NBFI User with conditional UI | NCBA: types.ts UserRole; review/page.tsx |
| Multi-party collaboration | Portfolio managers, traders, operations, trustees (Manager Module) | NBFI upload portal only; no co-lender or trustee role | Moody's: Manager Module brochure |
| Document management | Not described as a named feature | 6 default types, overdue alerts, submission history | NCBA: types.ts DocumentRequirement |
| Financial statement spreading | Not described | Upload and spread balance sheet, P&L, cash flow (80+ line items) | NCBA: integrationSchemas.ts financial_statements schema |
| Credit approval workflow | Not described | Commentary thread, analyst recommendation, approver approval/rejection | NCBA: review/page.tsx |
| Data persistence | Cloud SaaS with persistent stores | React context only — data lost on page refresh | NCBA: platform-wide technical constraint |


### Dimension 8: Investor and Multi-Party Access

| Sub-capability | Moody's | NCBA Platform | Evidence |
|---|---|---|---|
| Investor-facing portal | Global Portal (STS/BoE disclosure); SF Portal (deal analytics) | None | Moody's: capability page; sfp-brochure.pdf |
| Warehouse lender access | Not explicitly named but implied in Manager Module multi-party | None | Gap |
| Trustee access | Manager Module and Recon | None | Moody's: Recon; Manager Module brochures |
| Auditor access | Audit logging in Recon | None | Moody's: Recon "Facilitates audit compliance" |
| NBFI upload portal | Not applicable | Yes — /nbfi-portal for data/document upload and SFTP config | NCBA: src/app/nbfi-portal/ |


### Dimension 9: Market Data and Benchmarking

| Sub-capability | Moody's | NCBA Platform | Evidence |
|---|---|---|---|
| Sector benchmarking | Tranche peer comparison via scatter plots and distributions (SF Portal) | None | Moody's: sfp-brochure.pdf benchmarking section |
| NBFI covenant benchmarks | Not described | None — absolute thresholds only, no sector quartile context | Gap |
| External credit ratings | Moody's Ratings integration; secondary market ratings | None | Moody's: CDOEdge; Data Feed |
| Market pricing / bond analytics | 30+ fields per bond (OAS, DV01, duration, yield) | None | Moody's: Data Feed market risk fields |
| Private firm database | 44 million+ private firms (Portfolio View) | NBFI-specific records only | Moody's: Portfolio View brochure |
| News / sentiment feed | 27,000+ sources, 1M items/day (Portfolio View) | None | Moody's: Portfolio View brochure |
| Historical deal performance | 30+ years, 30,000 securitisations, 95% within 1-2 days | None | Moody's: Data Feed brochure |


## 5. Gap Analysis

*Each gap is identified by ID, described precisely with evidence citations, and classified by Severity and Strategic Fit.*

**Severity levels:**
- Critical — Moody's offers this; NCBA has nothing equivalent; it creates regulatory, audit, or enterprise-sales risk today
- Significant — Moody's offers this; NCBA has a partial or inferior version; it limits commercial credibility
- Incremental — Moody's offers this; NCBA could close the gap with moderate effort

**Strategic Fit:**
- Core — Directly serves the NBFI wholesale lending use case today
- Adjacency — Serves a use case NCBA can expand into with the same platform
- Out of Scope — Only relevant to developed-market institutional use cases not applicable to NCBA


### GAP-01: Production-Grade Data Persistence and Backend

**Severity:** Critical | **Strategic Fit:** Core

The platform is entirely client-side Next.js with React context state. All NBFIs, loan books, covenants, pool selections, and monitoring data exist only in the browser session and are destroyed on page refresh. There is no database, no server-side API, no authentication persistence, and no multi-user concurrency.

**Evidence (NCBA):** `src/lib/types.ts` — no ORM or database types. Every page uses `'use client'`. All state mutations go through `AppContext`. The `saveCovenantSetup` function in `src/app/nbfi/[id]/setup/page.tsx` updates in-memory context only. SFTP hostname `sftp.wholesalelender.co.ke` in `integrationSchemas.ts` is a UI placeholder.

**Why it matters:** This is not a feature gap — it is an architectural prerequisite. No regulated bank would deploy a credit risk system that loses data on browser refresh. Every other gap in this analysis is downstream of this one.


### GAP-02: Calibrated Credit Models (Replacing Hardcoded Constants)

**Severity:** Critical | **Strategic Fit:** Core

All analytical outputs use hardcoded constants that were likely set as reasonable approximations. Transition matrices, LGDs, loss rates, advance rates, and repayment velocity ratios are fixed constants, not calibrated from any NBFI's actual historical performance.

**Evidence (NCBA):** `src/lib/rollRate.ts` — `TRANSITION_MATRIX`, `STRESS_MATRIX`, `SEVERE_MATRIX`, `LOSS_RATES`, `LENDER_PROVISION_RATES`, `ADVANCE_RATES` are all module-level constants. `computeECL` uses `LGD_CURRENT = 0.45` and `LGD_STANDARD = 0.65`. `computeShadowReconciliation` uses hardcoded `0.08` principal reduction factor (comment notes it is a "mock approximation"). `generateTrendData` generates data using `Math.sin()` oscillation.

**Evidence (Moody's):** SFW brochure — "Moody's maintains one of the industry's most comprehensive structured finance data platforms, undergoing monthly updates with validated loan-level and pool-level data from surveillance reports." CDOEdge "simulates Moody's Ratings quantitative approach to CLO transaction ratings."

**Why it matters:** An ECL computed from hardcoded loss rates rather than the NBFI's actual historical default experience is not auditor-defensible. It also means the system cannot show how different NBFIs have different risk profiles — a core value proposition.


### GAP-03: Macroeconomic Scenario Engine

**Severity:** Significant | **Strategic Fit:** Core

The three scenarios (Base/Stress/Severe) are hand-tuned changes to the transition matrix with no connection to macroeconomic inputs. Users cannot model "what if Kenyan GDP growth drops to 2%?" or "what if the CBK rate rises to 12%?"

**Evidence (NCBA):** `src/lib/rollRate.ts` — `STRESS_MATRIX` changes Current-to-Current from 0.94 to 0.90; `SEVERE_MATRIX` changes it to 0.85. These are fixed — not driven by any macro variable. The what-if slider in `src/app/nbfi/[id]/covenants/page.tsx` moves only one metric (Collection Efficiency) and uses the linear formula `projectedPar = max(0, 5.2 - (slider - 98.2) * 2)` with hardcoded base values.

**Evidence (Moody's):** SFW brochure — "Moody's Economy.com provides forecasts for home price movements, regional GDP, unemployment, and interest rates across five economic scenarios, driving predictions of mortgage loan defaults, prepayments, and loss severity." CPM — multi-period scenario analysis; physical/transition risk scenario analysis aligned to OSFI SCSE framework.

**Why it matters:** ICAAP and regulatory stress tests require scenarios linked to macroeconomic assumptions. Investors performing due diligence on a securitisation expect stress tests grounded in macro conditions, not arbitrary matrix adjustments.


### GAP-04: Proper IFRS 9 ECL Computation

**Severity:** Critical | **Strategic Fit:** Core

The platform labels its provisioning as IFRS 9-aligned but the actual computation does not comply. It uses a simplified loss-rate approximation with fixed LGDs, does not apply Significant Increase in Credit Risk (SICR) criteria beyond DPD, and has no macro-conditional forward-looking adjustment as required under IFRS 9 paragraphs 5.5.9 and B5.5.48.

**Evidence (NCBA):** `src/lib/rollRate.ts` `computeECL` — `LGD` is selected based only on DPD bucket (`LGD_CURRENT = 0.45` if Current or 1-30; `LGD_STANDARD = 0.65` otherwise). PD12m is `min(LOSS_RATES[bucket], 1.0)`. The EDA page (`src/app/nbfi/[id]/eda/page.tsx`) labels the methodology "Stage 1: 0-30 DPD -> 12-month ECL; Stage 2/3: 30+ DPD -> lifetime ECL per SICR rebuttable presumption" — presenting an accurate regulatory framework that the code does not actually implement.

**Evidence (Moody's):** SF Portal brochure — "Run SPPI tests, IFRS 9 impairment and staging." API brochure — "Macroeconomic scenarios fuel global credit models that produce default, severity and prepayments at the loan or pool level." Both enable IFRS 9-compliant computation.

**Why it matters:** NCBA is a CBK-regulated institution. Characterising a simplified DPD-based provision as IFRS 9-compliant creates audit risk. The label should be corrected immediately; the computation should be upgraded to full IFRS 9 compliance.


### GAP-05: Regulatory Reporting Templates (CBK / CMA)

**Severity:** Critical | **Strategic Fit:** Core

The platform produces no regulatory output. The only export is a 10-column CSV of loan-level data. There are no CBK credit risk reporting templates, no CMA securitisation disclosure formats, no board-level credit committee packs, and no deal package PDFs.

**Evidence (NCBA):** `src/app/nbfi/[id]/monitoring/page.tsx` `handleExport` — single CSV with columns: `loanId, product, geography, segment, currentBalance, dpdAsOfReportingDate, totalOverdueAmount, interestRate, loanWrittenOff, recoveryAfterWriteoff`. `src/app/nbfi/[id]/selection/page.tsx` — Download button has Lucide Download icon but no onClick handler implemented. `src/app/nbfi/[id]/review/page.tsx` — recommendation text displayed on screen; no export function.

**Evidence (Moody's):** ABS Suite Plus — XML-format investor reports, monthly close process, automated reporting for term/warehouse/covered bond issuance. Global Portal — STS and Bank of England disclosure compliance. Recon — "Facilitates audit compliance: tracks and logs historical data discrepancies to support audit processes with full transparency and traceability."

**Why it matters:** A system used for structured lending decisions at a regulated bank must produce audit-ready outputs. Manual recreation of reports from screen data is not acceptable at NCBA's scale.


### GAP-06: Portfolio Limits and Risk Appetite Framework

**Severity:** Significant | **Strategic Fit:** Core

The platform monitors individual NBFI metrics but has no portfolio-level limit framework. There is no view of exposure utilisation against Board-approved limits by NBFI type, geography, or sector. The dashboard shows raw exposure totals only.

**Evidence (NCBA):** `src/app/dashboard/page.tsx` — "Total Exposure" card shows `sum of fundingAmount` with no limit comparison. No limit data structure in `src/lib/types.ts`. HHI is computed (in `rollRate.ts computeHHI`) but not linked to any limit threshold or enforcement mechanism.

**Evidence (Moody's):** CPM ACT section — "Review credit risk appetite and set limits and targets accordingly," "Define target portfolios in terms of product, customer, and segment mix." Chartis RiskTech100 description cites limit setting as a core CPM capability.

**Why it matters:** Portfolio limit management is a Board governance requirement. A credit committee needs to see "we are at 78% of our NBFI-microfinance sector limit" before approving incremental exposure.


### GAP-07: Deal Package and Board-Ready Export

**Severity:** Significant | **Strategic Fit:** Core

After completing a full credit assessment, pool selection, securitisation structuring, and covenant setup, the platform has no mechanism to produce a structured credit memorandum. Commentary, recommendations, financial summaries, pool statistics, and covenant schedules all exist as screen-displayed data with no unified export.

**Evidence (NCBA):** `src/app/nbfi/[id]/review/page.tsx` — displays commentary and status; no export function. `src/app/nbfi/[id]/selection/page.tsx` — Download icon present but `onClick` handler not implemented. No PDF generation library (e.g., jsPDF, puppeteer) in `package.json` dependencies.

**Evidence (Moody's):** ABS Suite Plus investor reporting module generates XML reports for investor distribution and monthly close processing. CPM Report module — "Articulate portfolio management strategies and analysis to stakeholders with detailed reporting; present historical trends, future direction, and recommendations for internal reviews."


### GAP-08: Sector Benchmarking for NBFI Metrics

**Severity:** Significant | **Strategic Fit:** Core

When a credit analyst sees CRAR of 14.7%, PAR 30 of 5.2%, or D/E of 3.7x for an NBFI, they have no context for whether these are strong or weak metrics for a Kenyan microfinance institution. Covenant thresholds are set without sector reference data.

**Evidence (NCBA):** `src/app/nbfi/[id]/covenants/page.tsx` — covenant values displayed as absolute numbers vs threshold only. No benchmark or sector comparison data type in `src/lib/types.ts`. No external API calls in any component file.

**Evidence (Moody's):** SF Portal brochure — "Compare your tranche against its peers using scatter plots and distributions across key performance metrics." CPM — "Measure and benchmark portfolio-level credit risks and returns across the entire portfolio." Data Feed — 30+ years of structured data for benchmarking.

**Why it matters:** Without sector context, a threshold of "CRAR >= 15%" might be overly conservative or dangerously permissive depending on the Kenyan MFI sector average. This gap is relatively cheap to close: a static quarterly reference dataset from AMFI-K or CBK prudential reports would immediately add value.


### GAP-09: Investor and Warehouse Lender Portal

**Severity:** Significant | **Strategic Fit:** Adjacency

Securitisation transactions require investors to access pool statistics, tranche performance, covenant status, and document submission history. The platform has no investor-facing view. The current NBFI portal is one-directional.

**Evidence (NCBA):** `src/app/nbfi-portal/` — designed for NBFIs to upload documents and loan books to NCBA. `src/lib/types.ts` UserRole type has three roles: `'analyst' | 'approver' | 'nbfi_user'` — no investor role. No read-only permissioned view component in the codebase.

**Evidence (Moody's):** Global Portal — "enables Issuers, Originators and Sponsors to comply with STS and Bank of England disclosure requirements." SF Portal — deal analytics accessible to buy-side investors. Manager Module — trustee and portfolio manager collaboration.


### GAP-10: Production-Grade Waterfall (Reserve Accounts, Triggers)

**Severity:** Significant | **Strategic Fit:** Adjacency

The current waterfall model cannot accurately represent a real securitisation deal. Real deals require liquidity reserve accounts, cash reserve accounts, OC/IC trigger levels that redirect cash to principal paydown, and sequential vs pro-rata switches.

**Evidence (NCBA):** `src/lib/securitisationWaterfall.ts` `runWaterfall` — waterfall logic is `Senior Interest -> Mezzanine Interest -> Senior Principal -> Mezzanine Principal -> Equity Residual` with no reserve account logic and no trigger mechanism. `SecuritisationStructure` type in `src/lib/types.ts` has no trigger field. `poolMetricsFromLoans` uses `avgRate = simple average`, `avgTenure = simple average`, both with hardcoded defaults of 15% and 12 months.

**Evidence (Moody's):** CDOEdge — "Create and modify any structures or waterfalls including multi-currency transactions; incorporate reinvestment assumptions; point-and-click interface for OC/IC test modules." ABS Suite Plus — "Supports waterfall calculations, investor reporting, and monthly close processes for structured issuances."


### GAP-11: Automated Real-Time Data Validation

**Severity:** Significant | **Strategic Fit:** Core

The integration schema defines detailed validation tests per document type, but all test results are hardcoded mock values. No validation logic actually runs against uploaded data. A corrupt loan tape, a missing period, or a monotonicity violation would not be detected.

**Evidence (NCBA):** `src/lib/integrationSchemas.ts` — each test in the `tests` array contains hardcoded `pass: false` or `pass: true` values with static `details` strings like "Found at row 142: balance = -500" that are not computed from data. For example, `loan_book` Test 10 ("No negative Current Balance") returns `pass: false, details: "1 row found with negative balance (row 142): balance = -500"` — a string literal.

**Evidence (Moody's):** Recon — "Seamlessly extract and normalise data from trustee and source systems to ensure consistency and efficiency." "Define user-specific validation rules to ensure data integrity and compliance with business logic." "Comprehensive audit logging: track data back to its source."


## 6. Where NCBA Wins

The following capabilities represent genuine advantages of the NCBA platform that no Moody's product replicates. These should be preserved, deepened, and used in commercial positioning.

### 6.1 NBFI-Specific Underwriting Workflow

Moody's products are designed for institutional investors, CLO managers, and multi-asset-class banks. None address the specific workflow of a bank underwriting credit to an NBFI: spreading the NBFI's financials, assessing its loan book quality, defining an eligible pool, and setting bespoke covenants. The 9-state workflow from assessment through to live monitoring is unique to this use case and has no Moody's equivalent.

### 6.2 Dual Provisioning Policy Views

Side-by-side comparison of NBFI provisioning policy vs Lender (NCBA) provisioning policy — independently configurable per NBFI — has no Moody's equivalent. This captures a real business reality: the NBFI classifies its book on its regulatory standards; NCBA applies a more conservative lender view. Showing both simultaneously creates immediate analytical value.

**Evidence:** `src/app/nbfi/[id]/setup/page.tsx` `DEFAULT_NBFI_PROVISIONING` and `DEFAULT_LENDER_PROVISIONING` — two independent configurable provisioning tables. `src/app/nbfi/[id]/covenants/page.tsx` — side-by-side tables per bucket showing loan count, balance, and provision amount under both policies.

### 6.3 Two-Tier Monitoring Architecture

The `MonitoringData` type models both the wholesale loan (NCBA -> NBFI: facility amount, principal outstanding, disbursement date, repayment schedule) and the retail portfolio (end-borrower PAR, vintage analysis, geographic breakdown) in a single data structure. The monitoring page renders both tiers together. This is conceptually correct for wholesale lending and is not present in any Moody's product.

**Evidence:** `src/lib/types.ts` `MonitoringData` — `wholesaleLoan` field (facilityAmount, principalOutstanding, disbursementDate, maturityDate, repaymentSchedule) alongside `delinquencyByVintage`, `delinquencyByGeo`, and `compositionByPurpose`.

### 6.4 Loan-Level Pool Selection with Eligibility Waterfall

The five-step eligibility waterfall (`computeEligibilityWaterfall`) with pass/fail counts and cumulative eligible balance at each stage, combined with the 10-criterion interactive filter and live pool summary (coverage ratio, loss rate, diversification), is a purpose-built tool for defining a security package. The UX — showing exactly how many loans are eliminated at each eligibility step and why — has direct operational value for a credit officer.

**Evidence:** `src/lib/rollRate.ts` `computeEligibilityWaterfall` — five criteria: DPD <= 60, not written off, balance within 1% pool cap, no repossession, residual tenure > 0. `src/app/nbfi/[id]/selection/page.tsx` — 10 filter controls with live pool summary sidebar.

### 6.5 Impact Metrics Layer

The `impactMetrics` fields in `MonitoringData` (total borrowers, female borrowers, rural borrowers, average loan size, jobs supported) reflect that NBFI lending in East Africa has a development finance dimension beyond pure credit risk. No Moody's product tracks these metrics. This is a differentiator when reporting to DFI co-lenders, impact investors, or NCBA's own social mandate reporting.

**Evidence:** `src/lib/types.ts` `MonitoringData.impactMetrics` — `totalBorrowers`, `femaleBorrowers`, `ruralBorrowers`, `avgLoanSize`, `jobsSupported`.

### 6.6 Borrowing Base with Advance Rate Waterfall

The `computeBorrowingBase` function implements a proper advance rate framework (Current 80%, 1-30 DPD 60%, 31-60 DPD 40%, 61-90 DPD 10%, deeper DPD 0%) with a single-loan concentration cap (1% of pool) and a 5% reserve. The `computeEligibilityWaterfall` breaks down how the eligible balance is arrived at step-by-step. This is a well-designed feature that mirrors how real warehouse lenders think about collateral value.

**Evidence:** `src/lib/rollRate.ts` `computeBorrowingBase` and `computeEligibilityWaterfall` with `ADVANCE_RATES` constant.


## 7. Strategic Observations

### Observation 1: The analytics engine needs calibration before the platform is auditable

The most urgent investment is not a new feature but making what exists accurate. Every analytical output — ECL, provisions, loss estimates, roll-rate projections — carries an asterisk because it is computed from hardcoded constants rather than the NBFI's actual historical performance. Calibrating the transition matrices and loss rates from the loan performance history uploads (which the data schema already supports) would transform the quality of every output simultaneously.

### Observation 2: The IFRS 9 labelling is a regulatory risk, not just a product gap

The platform describes its computation as IFRS 9-aligned in multiple places. This is inaccurate. The computation does not implement Stage PD curves, SICR criteria, or forward-looking macro adjustments. If NCBA's internal audit or external auditors review the system, this discrepancy would be flagged. The immediate action is to change the label to "DPD-based simplified ECL estimate" and put proper IFRS 9 computation on the near-term roadmap.

### Observation 3: Regulatory output is the most direct monetisation unlock

CBK and CMA regulatory reporting output — formatted templates, audit trails, deal documentation — is the capability most directly tied to NCBA's institutional willingness to pay for a system. Every credit decision produces documents that go to the credit committee and potentially to the regulator. A system that generates these documents automatically and with an audit trail replaces significant manual work and reduces institutional risk.

### Observation 4: Moody's is not the real competitive threat

Moody's CPM and structured finance products cost hundreds of thousands to millions of dollars annually with multi-month enterprise implementations. They are not competing for NCBA's budget. The actual competitive baseline is an experienced credit analyst with Excel, a structured Word template, a well-configured MIS system, and deep market knowledge. The platform wins when it is materially faster, more consistent, and more auditable than that alternative — not when it approaches Moody's feature parity.

### Observation 5: The securitisation module is a strategic placeholder that needs a credible upgrade path

The current waterfall model introduces the concept and gives credit teams familiarity with tranche structuring and stress analysis. It is not sufficient for a real transaction. If NCBA securitises its NBFI book as the portfolio scales — a logical step — the platform needs reserve accounts, OC/IC triggers, multi-period amortisation, and investor reporting. This should be planned now with a clear build sequence, even if execution is 12-18 months away.

### Observation 6: The benchmarking gap is the cheapest gap to close with the highest signal value

NBFI sector benchmarking — CRAR quartiles, PAR 30 norms, D/E ratios for Kenyan microfinance — does not require a real-time data feed. A static reference table updated quarterly from AMFI-K publications or CBK prudential reports would immediately improve the quality of covenant threshold-setting and give analysts a defensible basis for their recommendations. This is a one-sprint effort.

### Observation 7: Data persistence unlocks everything else

Without a proper backend, every feature in the roadmap is constrained. Pool selections reset. Covenant readings disappear. Approval decisions leave no trace. The architectural upgrade to a proper backend (database + API layer) is the single change that unblocks the entire roadmap — calibrated models require stored historical data; regulatory reporting requires stored decisions; multi-user workflows require server-side state; investor portals require access control.

