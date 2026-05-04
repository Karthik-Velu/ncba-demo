# Climate Due Diligence Brief

**ki monitor — Climate Portfolio Intelligence for Guarantee Providers**

*Prepared for: BII Climate & Impact Due Diligence Team*

---

## Executive Summary

This brief describes the climate monitoring, early warning, and growth intelligence capabilities of ki monitor — a loan-level portfolio intelligence platform — as they apply to the fund structure under guarantee review. The platform classifies every loan in the underlying portfolio against a proprietary three-tier climate taxonomy aligned to MDB/IDFC Common Principles, tracks CO₂e avoidance at the loan level, surfaces climate early warning indicators (EWIs) to both investors and originators, and identifies climate growth opportunities across the originator network.

The fund's climate performance is visible in real time. When a climate stress event occurs — a drought in Machakos, flooding in Kisumu — the platform detects the signal in repayment behaviour before it reaches covenant breach level, and surfaces differentiated actions to each user type.

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

## 2. Early Warning Indicators (EWI)

The platform runs four leading climate EWIs continuously against the loan-level book. These indicators fire before a covenant breach — giving both the investor and the originator time to act.

### 2.1 The Four EWI Indicators

**1. Geographic Concentration in High-Risk Zones**
Measures the share of the portfolio in drought- and flood-prone regions (Kisumu, Eldoret, Machakos). Status thresholds: Watch at >35%, Alert at >55% of the portfolio. Elevated concentration means that a single climate event can affect correlated borrower repayment across multiple originators simultaneously — the central systemic risk for this fund.

**2. Seasonal Repayment Deviation**
Tracks agri-finance PAR 30+ against a harvest-adjusted seasonal baseline (April = main harvest month). When repayment stress exceeds the seasonal norm, it is a leading signal of a localised climate event or delayed harvest before that stress propagates into loan delinquency at scale.

**3. Crop Cycle Alignment**
Compares agri-loan performance to the Kenya harvest calendar (main harvest: March–May). If agri loans are underperforming the overall portfolio during the expected harvest income period, this may indicate rainfall anomaly or crop failure in specific geographic corridors.

**4. Portfolio Migration Toward Climate-Exposed Segments**
Tracks the 3-month growth rate in the climate-vulnerable share of new origination. A rising vulnerable share is not automatically a problem — but it is a leading indicator of structural exposure drift that the guarantee provider should monitor against the fund's stated climate risk appetite.

Each EWI displays a status: **OK / Watch / Alert**, with the underlying metric value, a plain-English interpretation, and the data sources driving the calculation.

### 2.2 Investor View

When an investor logs into ki monitor, the EWI dashboard provides:

- **Portfolio health overview**: current status across all four EWI indicators, with trend lines showing direction of travel
- **Geographic risk heat map**: which geographies within the portfolio are accumulating climate stress, with composite risk scores (drought probability, flood probability, crop-failure probability) derived from IGAD, CHIRPS v2.0, ESA CCI Soil Moisture, and IRI Seasonal Forecasts
- **EWI-driven actions**: for each alert that fires, the platform surfaces the recommended portfolio-level response — whether to request restructuring from specific originators, flag a moratorium zone, or escalate to watchlist monitoring
- **Capital deployment signals**: where in the network climate risk is low and originator capacity exists to absorb additional disbursements — supporting active portfolio rebalancing away from high-concentration geographies
- **High-risk area identification**: clear flagging of geographies approaching concentration thresholds, with originator-level exposure breakdown, so the investor can engage the right counterparty with the right information

The investor view is designed for portfolio-level decision-making: where to deploy more capital, where to pull back, and which originators require direct engagement.

### 2.3 Originator View

When an originator logs into ki monitor, the EWI output is translated into borrower-facing actions:

- **At-risk geography and segment identification**: which districts or borrower segments within their own book are showing early signs of climate-related repayment stress, cross-referenced with the climate geography risk matrix
- **Borrower-level action recommendations**: for each flagged geography, the platform recommends an action type based on the composite climate score:
  - **Restructure** (composite score ≥ 45): proactive loan restructuring for borrowers in highest-stress zones before default
  - **Moratorium** (composite score ≥ 35): temporary repayment moratorium for borrowers in identified flood or drought corridors
  - **Watchlist** (composite score ≥ 25): enhanced monitoring and borrower contact cadence
  - **Monitor** (composite score < 25): standard monitoring with elevated climate awareness
- **Seasonal context**: disbursement and collection timing recommendations aligned to Kenya's agricultural calendar, reducing avoidable climate-driven delinquency
- **End-borrower engagement prompts**: for originators operating group lending models, the platform surfaces which groups in high-risk zones warrant proactive field officer visits

The originator view converts the portfolio-level climate signal into operational, borrower-level actions — closing the loop between climate risk detection and credit management response.

---

## 3. Climate Geography Risk Matrix

The platform runs a quantitative climate probability matrix across all geographies represented in the portfolio. This is the primary tool for the guarantee provider's climate stress assessment.

**Probability scores** are derived from historical climate frequency data (IGAD Climate Prediction & Applications Centre, CHIRPS v2.0, ESA CCI Soil Moisture, IRI Seasonal Forecasts) and expressed as 0–100 probability scores for three hazard types:
- Drought probability
- Flood probability
- Crop-failure probability

**Composite score formula:**
> Composite = 0.35 × max(drought, flood) + 0.40 × crop failure + 0.25 × max(all three)

Composite scores are dynamically adjusted upward when the portfolio's agri-finance PAR 30+ meaningfully exceeds the overall portfolio baseline — reflecting live credit signal amplifying the climate probability estimate. This prevents the matrix from being a static historical snapshot divorced from current portfolio performance.

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

## 4. Climate Growth Opportunities

ki monitor is not only a risk management tool — it maps climate opportunity across the originator network. This section is relevant to the guarantee provider's assessment of the fund's ability to grow its climate finance share over time.

### 4.1 New Originator Identification

The platform tracks climate product demand signals across geographies — identifying counties and borrower segments where demand for EV finance, solar home systems, and climate-resilient agri credit is unmet by any originator in the current network. These signals include:

- Geographic whitespace analysis: high-density rural populations in low-to-medium climate-risk zones not served by any current network originator
- Borrower-level climate product take-up rates in comparable geographies, used to project demand in unserved areas
- Concentration risk relief: introducing new originators in geographies that are currently under-represented in the network reduces systemic correlated climate exposure

This enables the fund to grow its originator base in a climate-aligned way — prioritising onboarding of originators that serve underpenetrated segments where the climate opportunity is highest and portfolio correlation risk is lowest.

### 4.2 Product Expansion for Existing Originators

For originators already in the network, ki monitor surfaces signals indicating which of their existing borrower populations are ready to transition to or expand into climate-positive products:

- **EV and e-boda upsell signals**: originators with existing transport-sector borrowers (petrol boda-boda, personal transport) are identified as candidates for EV loan product launch; historic repayment profiles validate credit worthiness for the asset type
- **Solar home system cross-sell**: originators serving rural borrowers in energy-poor counties (measured by low grid connection proxies) are flagged as candidates for solar home system product deployment
- **Agri-resilient product deepening**: originators with agri-finance books in medium-risk geographies are prompted to expand crop-cycle aligned disbursements and consider bundled crop-insurance products

Product expansion within the existing network is typically the fastest route to increasing the fund's climate finance share — because the originator relationship, credit infrastructure, and borrower data already exist.

### 4.3 Capital Deployment Targeting

For the guarantee provider and fund manager, ki monitor generates a capital deployment opportunity view across the network:

- **Under-deployed originators in low-risk geographies**: where climate risk is low, originator capacity exists, and the climate product mix is expanding — these originators are candidates for increased facility drawdown
- **Climate finance share headroom**: at the fund level, the platform tracks actual vs. target climate finance share (% of portfolio balance under MDB Common Principles) and shows which originator-product combinations can most efficiently close the gap
- **Impact-per-dollar efficiency**: ranks deployment opportunities by CO₂e avoided per USD deployed, crop-cycle alignment rate, and women-borrower reach — enabling the guarantee provider to assess whether capital is flowing to highest-impact applications

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

## 6. Reporting and Standards Alignment

| Standard | Coverage |
|---|---|
| MDB/IDFC Common Principles for Climate Finance Tracking (Dec 2023) | Climate Positive (mitigation) classification and CO₂e reporting |
| IPCC AR6 (2022) | Emission factors for fossil fuel displacement |
| IRENA Kenya Grid Factor (2022) | EV and e-boda grid electricity emission factor (0.48 kgCO₂/kWh) |
| GOGLA Sector Impact Framework (2023) | Solar home system displacement methodology |
| IFC Lighting Africa / Solar Irrigation (2022) | Solar-pump diesel displacement methodology |
| IGAD / CHIRPS v2.0 / ESA CCI / IRI | Geographic climate probability scores |
| 2X Women's Initiative | Women-borrower proxy reporting |

The platform is designed so that the guarantee provider can extract loan-level climate classification data for independent third-party verification at any point in the fund's life. All methodology assumptions are disclosed within the platform and in this brief.

---

## 7. Summary: What the Guarantee Provider Can Rely On

| Capability | Description |
|---|---|
| Real-time climate classification | Every loan classified as Positive, Resilient, Vulnerable, or Unclassified on each portfolio update |
| MDB-aligned CO₂e reporting | Loan-level avoided emissions, by product type, with disclosed methodology |
| Four leading EWIs | Geographic concentration, seasonal deviation, crop cycle alignment, portfolio migration — firing before covenant breach |
| Investor EWI dashboard | Portfolio health, geographic risk heat map, EWI-driven actions, capital deployment signals |
| Originator EWI dashboard | Borrower-level restructure / moratorium / watchlist / monitor recommendations by geography |
| Climate geography risk matrix | Quantitative drought / flood / crop-failure probability scores, composite action score, stress-adjusted for live portfolio PAR |
| Growth opportunity mapping | New originator identification, product expansion signals, capital deployment targeting by climate impact efficiency |
| Socioeconomic impact tracking | Women borrowers, rural reach, NTC, micro-entrepreneurs — DFI impact framework aligned |
| Data export | Loan-level climate data exportable for third-party verification |

---

*All figures shown in this brief are illustrative of platform outputs using the current portfolio dataset. Actual fund metrics will reflect the live loan book as of each reporting date.*

*For methodology queries or data access requests, please raise them through the fund manager.*
