# Climate Due Diligence Brief

**ki monitor — Climate Portfolio Intelligence for Guarantee Providers**

*Prepared for: BII Climate & Impact Due Diligence Team*

---

> **[REVISED]**

## Executive Summary

This brief describes the climate intelligence capabilities of ki monitor — a loan-level portfolio intelligence platform — as they apply to the fund structure under guarantee review. The platform is designed around a core principle that aligns with BII's Paris-aligned investment strategy: that climate risk management and climate impact generation are not competing objectives but mutually reinforcing ones. A portfolio that anticipates and manages climate stress protects the capital that enables more climate finance to flow to underserved borrowers.

The platform delivers this across four capabilities:

1. **Climate taxonomy**: every loan classified against MDB/IDFC Common Principles — Positive (mitigation), Resilient (adaptation), or Vulnerable — with loan-level CO₂e tracking
2. **Predictive Early Warning**: a two-tier EWI system combining external climate forecasts (seasonal rainfall probability, vegetation stress, ENSO phase) with portfolio-level performance signals — detecting climate stress 2–6 months before it reaches the loan book
3. **Differentiated user actions**: the investor sees portfolio-level risk and deployment signals; the originator sees borrower-level actions to protect climate-vulnerable borrowers proactively
4. **Climate growth intelligence**: identifying where more climate finance can be deployed safely — new originators, product expansion, and capital deployment targeting aligned to Paris commitments

> **[END REVISED]**

---

## 1. Climate Taxonomy

The platform classifies every loan in the portfolio against a three-tier climate taxonomy aligned to MDB/IDFC Common Principles for Climate Finance Tracking (December 2023 edition).

### 1.1 Climate Positive

Loans that directly avoid or reduce greenhouse gas emissions relative to the counterfactual baseline. This is the *Common Principles* mitigation category.

| Product | Label | tCO₂e Avoided / Loan / Year | Methodology Basis |
|---|---|---|---|
| Boda-Boda (electric) | E-Boda — Electric Motorcycle | 0.58 | IPCC AR6 + IRENA Kenya grid factor (2022). Petrol boda-boda: 500 L/yr × 2.31 kgCO₂/L. E-boda: 1,200 kWh/yr × 0.48 kgCO₂/kWh. Net: ~0.58 tCO₂e. MDB activity 8.6. |
| EV (commercial) | Electric Vehicle | 2.02 | IPCC AR6 + IRENA (2022). Petrol 4WD: 1,500 L/yr × 2.31 kgCO₂/L. EV: 3,150 kWh/yr × 0.48 kgCO₂/kWh. Net: ~2.02 tCO₂e. MDB activity 8.6. |
| Solar-Home System | Solar Home System | 0.47 | GOGLA Sector Impact Framework (2023). Displaces kerosene (~396 kgCO₂e/yr) and charcoal (~75 kgCO₂e/yr). Net: ~0.47 tCO₂e. MDB activity 7.1. |
| Solar-Pump | Solar Irrigation Pump | 1.61 | IFC Lighting Africa / Solar Irrigation (2022). Displaces diesel pump: 4 L/day × 150 days × 2.68 kgCO₂/L. Net: ~1.61 tCO₂e. MDB activity 7.3. |

**Reporting outputs available to the guarantee provider:**
- Climate finance share (% of portfolio balance) under MDB Common Principles
- Total CO₂e avoided per year (tonnes), by product type
- Loan-level climate classification, exportable for third-party verification

All emission factors are proxy-based estimates consistent with published MDB methodologies. Actual savings depend on utilisation, grid factor trajectory, and verified local baselines.

### 1.2 Climate Resilient

Loans that strengthen borrower adaptive capacity in the face of climate variability — aligning to the Common Principles adaptation category.

**Qualifying segments:**
- Agri-Finance loans in low-to-medium climate-risk geographies (Nairobi, Nyeri; Mombasa, Nakuru)
- MSME loans in low-to-medium risk geographies
- SACCO / cooperative lending (community income pooling reduces household climate shock)

**Metrics tracked:**
- Crop-cycle aligned disbursements: proportion of agri loans disbursed in pre-planting months (October–December for long-rains; March–April for short-rains), which correlates with improved repayment performance
- Women in agriculture: group-lending proxy (Group segment, Agri-Finance) — primary women smallholder income signal
- Risk-based pricing benefit: whether resilient-classified borrowers receive lower average interest rates than the overall portfolio, consistent with a concessional climate pricing framework

### 1.3 Climate Vulnerable

Loans to borrowers in high climate-risk geographies where physical climate hazards materially elevate default probability. This population requires active monitoring and protective action, not exclusion.

**High climate-risk geographies (Kenya):**
| Geography | Primary Hazard | Risk Classification | Key Climate Variables |
|---|---|---|---|
| Kisumu | Flooding | High | Lake Victoria water level anomaly; ITCZ seasonal position; short-rains intensity (CHIRPS) |
| Machakos | Drought | High | SPI-3 drought index; NDVI vegetation anomaly; soil moisture deficit (ESA CCI) |
| Eldoret | Drought / Rainfall variability | High | Highland rainfall deviation (±2σ); ENSO phase; frost risk index |
| Mombasa | Coastal flooding | Medium | Indian Ocean Dipole index; coastal surge (tidal anomaly); short-rains onset timing |
| Nakuru | Rift Valley variability | Medium | Rift Valley rainfall anomaly; ENSO teleconnection; Lake Nakuru level trend |

Climate-vulnerable borrowers are reported separately so the guarantee provider can assess concentrated climate exposure against provisioning assumptions, and evaluate whether protective lending practices (crop-loss insurance, moratorium clauses) are active.

---

> **[REVISED]**

## 2. Early Warning Indicators (EWI)

The platform's EWI system is structured across two tiers. **Tier 1** uses external climate science data to predict stress 2–6 months before it reaches the loan book. **Tier 2** uses loan-level performance data to confirm that a climate event is translating into borrower behaviour and calibrate the severity. Together they close the loop from climate prediction through to portfolio response.

This distinction matters for the guarantee provider: by the time a portfolio metric deteriorates, the response window has narrowed significantly. Tier 1 indicators create the lead time needed for originators to engage at-risk borrowers, restructure exposures, and deploy protective measures before defaults accumulate.

---

### Tier 1 — Climate Lead Indicators
*Predict stress before it reaches the portfolio. Source: external climate science data feeds.*

**L1 — Seasonal Rainfall Forecast**

The platform ingests IRI / NOAA probabilistic seasonal rainfall forecasts, which are published 1–3 months before each agricultural season. These forecasts express the probability of below-normal, near-normal, or above-normal rainfall for the coming 3-month period across East African geographies.

The indicator fires when the probability of below-normal rainfall exceeds 55% in a geography that carries more than 10% of the portfolio's outstanding balance. This gives the investor and the relevant originators a full growing season of lead time to prepare — before a single loan shows delinquency.

*Status thresholds:* Watch when P(below-normal) is 45–55% in a high-exposure geography. Alert when P(below-normal) > 55%.

**L2 — In-Season Vegetation and Rainfall Stress**

During the active growing season, the platform tracks two complementary signals from satellite and remote sensing data:

- **CHIRPS rainfall anomaly**: current-season cumulative rainfall vs. the long-run seasonal baseline for each geography. A deficit of more than 1 standard deviation below baseline during the growing season is a reliable predictor of reduced harvest yield 6–10 weeks later.
- **NDVI anomaly (NASA MODIS)**: the Normalised Difference Vegetation Index measures actual crop canopy development relative to the seasonal norm. An NDVI anomaly below -0.05 during the critical growth window indicates likely crop stress regardless of whether rainfall data has yet signalled the problem — it is what the plants are actually doing.

When either signal fires in a geography carrying material portfolio exposure, originators in that geography are notified to begin proactive borrower outreach, and the guarantee provider sees the geographic flag on the investor dashboard.

*Status thresholds:* Watch when CHIRPS deficit is 0.5–1.0σ below baseline or NDVI anomaly is -0.03 to -0.05. Alert when CHIRPS is >1.0σ below or NDVI anomaly is below -0.05.

**L3 — ENSO Phase Alignment**

El Niño–Southern Oscillation (ENSO) phase is forecast reliably 3–6 months in advance by NOAA CPC and has well-documented, asymmetric impacts across Kenya's agricultural zones:

- **La Niña**: elevated rainfall and flood risk in Lake Victoria basin (Kisumu) and coastal zones (Mombasa). Agri-finance and MSME borrowers in these areas face input loss and transport disruption even as total rainfall increases.
- **El Niño**: suppressed long-rains in eastern and highland Kenya (Machakos, Eldoret). Drought stress drives crop failure and smallholder income collapse 3–5 months after an El Niño signal is confirmed.
- **Neutral phase**: baseline climate risk; no ENSO adjustment applied.

The platform cross-references the current and forecast ENSO phase against the fund's geographic exposure map and adjusts the composite climate risk scores in the Geography Risk Matrix accordingly. This means the risk matrix reflects where the climate is heading, not just where it has historically been.

*Status thresholds:* Watch when ENSO is moving into La Niña or El Niño phase with a geography exposure >15% of portfolio. Alert when a strong La Niña or El Niño event is forecast with confirmed signal.

---

### Tier 2 — Portfolio Response Indicators
*Confirm the climate signal is reaching the loan book. Source: loan-level portfolio data.*

**P1 — Collection Efficiency in Climate-Exposed Geographies**

Collection efficiency — the ratio of actual collections received to scheduled collections due in a given period — is the most repayment-structure-agnostic measure of borrower stress available. Unlike PAR 30+, it does not penalise harvest-aligned repayment schedules where payments are intentionally deferred during the growing season; it measures whether borrowers are paying what is due *when* it is due.

The indicator compares collection efficiency in geographies flagged by Tier 1 against the portfolio-level baseline. A meaningful divergence — geographies with active climate signals showing collections 5–10 percentage points below the portfolio average — confirms that the climate event is translating into financial stress. This is the signal that moves recommended borrower actions from watchlist to restructuring or moratorium.

*Status thresholds:* Watch when flagged-geography collection efficiency falls 5pp below portfolio baseline. Alert when divergence exceeds 10pp.

**P2 — Portfolio Concentration in Active Climate Risk Zones**

This indicator measures the share of outstanding portfolio balance in geographies where Tier 1 indicators are currently elevated — combining static historical risk classification with the live forecast signal. A geography that is historically high-risk but currently in a neutral ENSO phase with normal rainfall forecasts carries different active risk than the same geography during a confirmed El Niño.

Weighting exposure by active climate probability (rather than historical category alone) gives the guarantee provider a more accurate picture of correlated risk at any given moment. Elevated concentration with active climate signals is the central systemic risk scenario for the guarantee.

*Status thresholds:* Watch when active-risk-weighted concentration exceeds 35% of portfolio. Alert above 50%.

**P3 — Climate Finance Share Trajectory**

For a Paris-aligned fund, the direction of travel of the climate-positive and climate-resilient share of origination is as important as its current level. This indicator tracks the month-on-month change in the climate-classified share of new disbursements across the originator network.

A declining trajectory — even from a high starting point — is an early signal that the fund's climate thesis is being diluted by the product mix of new lending. Conversely, a growing trajectory demonstrates that the fund's guarantee structure is working as intended: enabling originators to extend more climate finance with confidence. This is the indicator most directly relevant to Paris alignment reporting.

*Status thresholds:* Watch when climate share has declined for two consecutive months. Alert when climate share has declined more than 5pp over a rolling quarter.

---

### 2.2 Investor View

When an investor logs into ki monitor, the EWI dashboard integrates both tiers into a single portfolio intelligence view:

- **Tier 1 climate signals panel**: current status of the three lead indicators — seasonal rainfall forecast, in-season vegetation stress, and ENSO phase — with geographic exposure mapped against each active signal. This answers the question: *what climate events are coming and where is the portfolio exposed?*
- **Tier 2 portfolio response panel**: collection efficiency by geography, active-risk-weighted concentration, and climate finance share trend — showing whether earlier signals have reached the book and whether the portfolio is on track against its climate targets
- **EWI-driven portfolio actions**: when Tier 1 and Tier 2 signals align in the same geography, the platform surfaces recommended responses — engaging specific originators, flagging moratorium zones, or rebalancing deployment toward lower-risk geographies
- **Capital deployment signals**: where Tier 1 signals are benign and originator capacity exists, the platform identifies opportunities to accelerate climate-positive disbursements — supporting the fund's growth objectives alongside its risk management ones
- **Impact trajectory**: the climate finance share trend (P3) is prominently displayed as the fund's primary Paris alignment indicator

The investor view is designed for portfolio-level decision-making that serves both the fund's risk and impact mandates simultaneously.

### 2.3 Originator View

When an originator logs into ki monitor, the EWI output is translated into borrower-facing actions relevant to their specific book:

- **Active climate signal alerts**: which geographies in their portfolio are currently flagged by Tier 1 indicators, with the underlying forecast data (e.g., "IRI forecast: 62% probability of below-normal short-rains in Machakos — season begins October")
- **Borrower-level action recommendations**: for each flagged geography, the platform recommends a response scaled to the combined Tier 1 and Tier 2 signal strength:
  - **Restructure** (strong Tier 1 signal + Tier 2 collection efficiency Alert): proactive loan restructuring for borrowers in highest-stress zones before default
  - **Moratorium** (strong Tier 1 signal + Tier 2 Watch): temporary repayment moratorium for borrowers in confirmed drought or flood corridors
  - **Enhanced engagement** (Tier 1 Watch, Tier 2 within normal range): increased field officer contact and early repayment support before stress materialises
  - **Monitor** (Tier 1 neutral): standard monitoring with elevated awareness in the season ahead
- **Seasonal disbursement guidance**: recommendations on timing new agri-finance disbursements to align with planting windows — maximising borrower income alignment and reducing avoidable climate-driven delinquency
- **End-borrower engagement prompts**: for originators operating group lending models, the platform surfaces which groups in climate-flagged zones warrant proactive field visits, with suggested talking points around crop insurance, alternative income support, and repayment flexibility options

The originator view closes the loop between external climate prediction and on-the-ground borrower relationship management — the mechanism by which climate risk is actively managed rather than passively absorbed.

> **[END REVISED]**

---

## 3. Climate Geography Risk Matrix

The platform runs a quantitative climate probability matrix across all geographies represented in the portfolio. This is the primary tool for the guarantee provider's climate stress assessment.

**Probability scores** are derived from historical climate frequency data (IGAD Climate Prediction & Applications Centre, CHIRPS v2.0, ESA CCI Soil Moisture, IRI Seasonal Forecasts) and expressed as 0–100 probability scores for three hazard types:
- Drought probability
- Flood probability
- Crop-failure probability

**Composite score formula:**
> Composite = 0.35 × max(drought, flood) + 0.40 × crop failure + 0.25 × max(all three)

Composite scores are dynamically adjusted upward when the portfolio's agri-finance collection efficiency meaningfully falls below the portfolio baseline in that geography — reflecting the live credit signal amplifying the climate probability estimate. This prevents the matrix from being a static historical snapshot divorced from current portfolio performance.

**Sample output (illustrative):**

| Geography | Risk Level | Drought | Flood | Crop Failure | Composite | Action |
|---|---|---|---|---|---|---|
| Machakos | High | 54% | 8% | 47% | 41 | Moratorium |
| Kisumu | High | 18% | 46% | 36% | 37 | Moratorium |
| Eldoret | High | 30% | 13% | 27% | 27 | Watchlist |
| Mombasa | Medium | 10% | 32% | 12% | 18 | Monitor |
| Nakuru | Medium | 24% | 17% | 21% | 21 | Monitor |

The matrix is visible to the guarantee provider at both the individual originator level (transaction scope) and the full network level (portfolio scope) for consolidated climate stress assessment.

---

> **[REVISED]**

## 4. Climate Growth Opportunities: Identifying Supply Gaps

For a Paris-aligned investor, expanding the reach of climate finance is as central to the mandate as managing its risks. ki monitor facilitates this without requiring massive external data acquisition. By cross-referencing the climate intelligence already generated for the Early Warning System with the fund's internal portfolio data, the platform identifies underserved geographies and borrower segments where the demand for climate lending outstrips current supply.

Armed with this pragmatic, market-level intelligence, the investor can strategically source new originators or incentivize existing ones to deploy capital exactly where the climate impact is highest.

### 4.1 Geographic Demand Mapping (Whitespace Analysis)

Rather than mapping the entire continent, the platform identifies geographic "whitespaces" by looking for misalignments between climate suitability and current portfolio penetration.

- **Agricultural Resilience Whitespaces**: The platform takes the Tier 1 EWS baseline data (which maps where rainfall is most reliable and drought risk is lowest) and overlays the fund's current agri-finance portfolio. Geographies that score as "Low Risk" in the Climate Risk Matrix but have less than 2% of the fund's deployed capital represent immediate, safe targets for scaling climate-resilient agri-finance.

- **Off-Grid Energy Gaps**: To target Solar Home System (SHS) deployment, the platform cross-references basic, publicly available national electrification statistics (e.g., from the Ministry of Energy or the World Bank) with the portfolio map. Counties with grid access below 30% but zero SHS loans in the portfolio are flagged as primary supply gaps.

- **Correlated Risk Relief**: Using the same ENSO forecasts used for risk management, the platform identifies regions that react differently to climate shocks than the fund's current core markets. Deploying capital into these geographically uncorrelated zones naturally hedges the existing portfolio.

### 4.2 Segment-Level Climate Finance Needs

The most efficient way to find a supply gap is to look within the existing, un-transitioned borrower base. ki monitor mines the existing loan-level data to identify segments primed for climate transition products.

- **The E-Mobility Transition**: The platform scans the existing network's portfolio for traditional commercial transport loans (e.g., standard petrol boda-boda or 4WD asset finance). High concentrations of these traditional loans signal a captive, credit-proven market ready for Electric Vehicle (EV) transition financing.

- **Agri-Product Deepening**: For originators already issuing general agricultural loans in medium-risk geographies (identified by the Risk Matrix), the platform flags an immediate supply gap for complementary adaptation products — specifically, the need to cross-sell drought-resistant seed financing or solar-irrigation equipment to their existing borrowers.

- **Targeting Women Borrowers**: Using the demographic flags already required in standard loan reporting, the platform identifies regions where the current portfolio heavily skews male in the agricultural sector. This flags a structural supply gap, prompting the investor to seek out originators (like SACCOs or localised microfinance institutions) that specifically target women smallholder farmers in those exact counties.

### 4.3 Intelligence-Led Originator Sourcing

By clearly defining where and to whom climate finance needs to flow using simple, high-confidence data, ki monitor transforms how the guarantee provider approaches market growth.

- **Targeted Originator Onboarding**: Instead of reviewing originators based solely on institutional size, the investor can actively seek out local originators that already possess physical branches in the specific "whitespace" counties identified by the platform.

- **Product Mandates for Existing Originators**: Where the platform identifies a segment-level gap (e.g., high petrol boda-boda loans but zero EV loans), the investor can use this data to confidently structure product-specific deployment incentives or technical assistance for that specific originator.

- **Impact-per-Dollar Optimisation**: This approach allows the guarantee provider to prioritise capital allocation toward the combinations of geography and product that yield the highest CO₂e avoided or the greatest resilience built, without relying on complex, unproven proxy data.

> **[END REVISED]**

---

## 5. Socioeconomic Impact Monitoring

In addition to climate classification, the platform tracks the fund's development finance impact across five dimensions aligned to standard DFI impact frameworks (IFC AIMM, 2X Women's Initiative, MSME finance proxies):

| Metric | Definition | Reporting Cadence |
|---|---|---|
| Women borrowers (est.) | Group-segment proxy: 85% women rate (Group lending); 50% Individual; 40% Enterprise | Per portfolio update |
| Rural borrowers | Borrowers in non-urban, non-peri-urban counties | Per portfolio update |
| New-to-credit (NTC) | Individual/Group borrowers with loan < KES 15,000 — first-time micro-credit access proxy | Per portfolio update |
| Micro-entrepreneurs | MSME product or Enterprise segment with loan < KES 200,000 | Per portfolio update |
| Low-income borrowers | Loan disbursed < KES 50,000 (~$385) | Per portfolio update |

**Estimated annual income impact** is calculated using conservative CGAP/IFC income multipliers per product type (Boda-Boda 1.2×, EV 1.0×, MSME 0.8×, Agri-Finance 0.4×) applied to the disbursed loan balance. This is a proxy metric; actual impact requires borrower-level survey validation, which the platform's data structure supports.

---

> **[REVISED]**

## 6. Reporting and Standards Alignment

| Standard | Coverage |
|---|---|
| Paris Agreement (2015) | Fund climate finance trajectory and CO₂e avoidance reporting; alignment with 1.5°C pathway through mitigation and adaptation lending |
| MDB/IDFC Common Principles for Climate Finance Tracking (Dec 2023) | Climate Positive (mitigation) classification and CO₂e reporting |
| IPCC AR6 (2022) | Emission factors for fossil fuel displacement |
| IRENA Kenya Grid Factor (2022) | EV and e-boda grid electricity emission factor (0.48 kgCO₂/kWh) |
| GOGLA Sector Impact Framework (2023) | Solar home system displacement methodology |
| IFC Lighting Africa / Solar Irrigation (2022) | Solar-pump diesel displacement methodology |
| IGAD / CHIRPS v2.0 / ESA CCI / IRI / NOAA CPC | Geographic climate probability scores and Tier 1 EWI lead indicators |
| NASA MODIS NDVI | In-season vegetation stress indicator (Tier 1 EWI L2) |
| 2X Women's Initiative | Women-borrower proxy reporting |

The platform is designed so that the guarantee provider can extract loan-level climate classification data for independent third-party verification at any point in the fund's life. All methodology assumptions are disclosed within the platform and in this brief.

> **[END REVISED]**

---

> **[REVISED]**

## 7. Summary: What the Guarantee Provider Can Rely On

| Capability | Description |
|---|---|
| Real-time climate classification | Every loan classified as Positive, Resilient, Vulnerable, or Unclassified on each portfolio update |
| MDB-aligned CO₂e reporting | Loan-level avoided emissions, by product type, with disclosed methodology |
| Tier 1 — Climate Lead Indicators | Three predictive EWIs using external climate data: seasonal rainfall forecast (IRI/NOAA), in-season vegetation and rainfall stress (CHIRPS + NASA MODIS NDVI), and ENSO phase alignment (NOAA CPC) — firing 2–6 months before portfolio stress materialises |
| Tier 2 — Portfolio Response Indicators | Three confirmatory EWIs: collection efficiency in climate-exposed geographies, active-risk-weighted geographic concentration, and climate finance share trajectory |
| Investor EWI dashboard | Integrated Tier 1 + Tier 2 view: climate signals incoming, portfolio response, capital deployment signals, and Paris alignment trajectory |
| Originator EWI dashboard | Borrower-level restructure / moratorium / enhanced engagement / monitor recommendations, driven by combined Tier 1 forecast and Tier 2 collection efficiency signal |
| Climate geography risk matrix | Quantitative drought / flood / crop-failure probability scores, composite action score, ENSO-adjusted for current climate conditions |
| Growth opportunity mapping | New originator identification, product expansion signals, capital deployment targeting by climate impact efficiency — aligned to fund's Paris commitments |
| Socioeconomic impact tracking | Women borrowers, rural reach, NTC, micro-entrepreneurs — DFI impact framework aligned |
| Data export | Loan-level climate data exportable for third-party verification |

> **[END REVISED]**

---

*All figures shown in this brief are illustrative of platform outputs using the current portfolio dataset. Actual fund metrics will reflect the live loan book as of each reporting date.*

*For methodology queries or data access requests, please raise them through the fund manager.*
