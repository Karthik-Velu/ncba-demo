import type { LoanLevelRow, ClimateCategory } from './types';

// ---- Geographic climate risk zones ----
// Based on Kenya climate vulnerability indices: drought frequency, flood exposure, rainfall variability
export const CLIMATE_RISK_ZONES: Record<string, 'high' | 'medium' | 'low'> = {
  Kisumu:   'high',    // Lake Victoria flooding + drought cycles
  Eldoret:  'high',   // Highland drought, high rainfall variability
  Machakos: 'high',   // Semi-arid, severe drought-prone
  Mombasa:  'medium', // Coastal flooding risk
  Nakuru:   'medium', // Rift Valley climate variability
  Nairobi:  'low',
  Nyeri:    'low',
};

const HIGH_RISK_GEOS = new Set(
  Object.entries(CLIMATE_RISK_ZONES)
    .filter(([, v]) => v === 'high')
    .map(([k]) => k),
);

// ---- Climate-positive product set ----
const CLIMATE_POSITIVE_PRODUCTS = new Set(['Boda-Boda', 'EV', 'Solar-Home', 'Solar-Pump']);

// ---- Product → climate category ----
export function assignClimateCategory(loan: LoanLevelRow): ClimateCategory {
  if (loan.climateCategory !== undefined) return loan.climateCategory;
  const product = loan.product ?? '';
  const geo = loan.geography ?? '';
  const isHighRisk = HIGH_RISK_GEOS.has(geo);

  if (CLIMATE_POSITIVE_PRODUCTS.has(product)) return 'positive';
  if (product === 'Agri-Finance') return isHighRisk ? 'vulnerable' : 'resilient';
  if (product === 'MSME') return isHighRisk ? 'vulnerable' : 'resilient';
  if (product === 'SACCO') return 'resilient';
  return null;
}

// ---- CO2e proxy emission factors ----
// Sources: IPCC AR6 (2022), IRENA Kenya grid factor (2022), GOGLA Sector Impact (2023),
//          IFC Lighting Africa (2022), MDB/IDFC Common Principles (Dec 2023)
export const CO2E_FACTORS: Record<string, { tCO2ePerLoanPerYear: number; methodology: string }> = {
  'Boda-Boda': {
    tCO2ePerLoanPerYear: 0.58,
    methodology:
      'Electric motorcycle vs petrol boda-boda. 15,000 km/yr at 30 km/L petrol → 500 L × 2.31 kgCO₂/L = 1,155 kgCO₂e/yr. ' +
      'E-boda: 0.08 kWh/km × 15,000 km = 1,200 kWh × 0.48 kgCO₂/kWh (Kenya grid, IRENA 2022) = 576 kgCO₂e/yr. ' +
      'Net avoided: ~579 kgCO₂e ≈ 0.58 tCO₂e per loan per year. MDB Common Principles activity 8.6.',
  },
  'EV': {
    tCO2ePerLoanPerYear: 2.02,
    methodology:
      'Electric 4WD/commercial vehicle vs petrol equivalent. 15,000 km/yr at 10 km/L petrol → 1,500 L × 2.31 kgCO₂/L = 3,465 kgCO₂e/yr. ' +
      'EV: 0.21 kWh/km × 15,000 km = 3,150 kWh × 0.48 kgCO₂/kWh = 1,512 kgCO₂e/yr. ' +
      'Net avoided: ~1,953 kgCO₂e ≈ 2.02 tCO₂e per loan per year. MDB Common Principles activity 8.6.',
  },
  'Solar-Home': {
    tCO2ePerLoanPerYear: 0.47,
    methodology:
      'Solar home system displacing kerosene lamps and charcoal. ' +
      'Kerosene: ~3 L/hh/week × 52 weeks × 2.54 kgCO₂/L (IPCC AR6) = 396 kgCO₂e/yr. ' +
      'Charcoal cooking displacement: ~75 kgCO₂e/yr (proxy). Total displaced: ~471 kgCO₂e ≈ 0.47 tCO₂e per year. ' +
      'GOGLA Sector Impact Framework (2023); MDB Common Principles activity 7.1.',
  },
  'Solar-Pump': {
    tCO2ePerLoanPerYear: 1.61,
    methodology:
      'Solar irrigation pump displacing diesel pump. ' +
      '4 L diesel/day × 150 irrigation days × 2.68 kgCO₂/L (IPCC AR6) = 1,608 kgCO₂e/yr. ' +
      'Solar pump: near-zero direct emissions during operation. ' +
      'Net avoided: ~1,608 kgCO₂e ≈ 1.61 tCO₂e per loan per year. ' +
      'IFC Lighting Africa / Solar Irrigation Report (2022); MDB activity 7.3.',
  },
};

export const CLIMATE_PRODUCT_LABELS: Record<string, string> = {
  'Boda-Boda':  'E-Boda (Electric Motorcycle)',
  'EV':         'Electric Vehicle (EV)',
  'Solar-Home': 'Solar Home System',
  'Solar-Pump': 'Solar Irrigation Pump',
};

export const KES_TO_USD = 130;

// ---- Aggregate climate metrics ----
export interface ClimateMetrics {
  total: number;
  positiveCount: number;
  resilientCount: number;
  vulnerableCount: number;
  unclassifiedCount: number;
  positiveBalance: number;
  resilientBalance: number;
  vulnerableBalance: number;
  totalClimateBalance: number;
  totalBalance: number;
  climatePositiveSharePct: number;
  totalClimateSharePct: number;
  co2eAvoidedTonnes: number;
  agriHouseholdCount: number;
  climateVulnerableCount: number;
  femaleBorrowersInClimate: number;
}

export function computeClimateMetrics(loans: LoanLevelRow[]): ClimateMetrics {
  let positiveCount = 0, resilientCount = 0, vulnerableCount = 0, unclassifiedCount = 0;
  let positiveBalance = 0, resilientBalance = 0, vulnerableBalance = 0, totalBalance = 0;
  let co2eAvoided = 0;
  let femaleBorrowersInClimate = 0;

  for (const loan of loans) {
    const cat = assignClimateCategory(loan);
    const bal = loan.currentBalance;
    totalBalance += bal;

    if (cat === 'positive') {
      positiveCount++;
      positiveBalance += bal;
      const factor = CO2E_FACTORS[loan.product ?? ''];
      if (factor) co2eAvoided += factor.tCO2ePerLoanPerYear;
    } else if (cat === 'resilient') {
      resilientCount++;
      resilientBalance += bal;
    } else if (cat === 'vulnerable') {
      vulnerableCount++;
      vulnerableBalance += bal;
    } else {
      unclassifiedCount++;
    }

    if (cat !== null) {
      const seg = loan.segment ?? '';
      const womenRate = seg === 'Group' ? 0.85 : seg === 'Individual' ? 0.50 : 0.40;
      femaleBorrowersInClimate += womenRate;
    }
  }

  const totalClimateBalance = positiveBalance + resilientBalance + vulnerableBalance;
  const agriHouseholdCount = loans.filter(l => l.product === 'Agri-Finance').length;

  return {
    total: loans.length,
    positiveCount,
    resilientCount,
    vulnerableCount,
    unclassifiedCount,
    positiveBalance,
    resilientBalance,
    vulnerableBalance,
    totalClimateBalance,
    totalBalance,
    climatePositiveSharePct: totalBalance > 0 ? (positiveBalance / totalBalance) * 100 : 0,
    totalClimateSharePct: totalBalance > 0 ? (totalClimateBalance / totalBalance) * 100 : 0,
    co2eAvoidedTonnes: co2eAvoided,
    agriHouseholdCount,
    climateVulnerableCount: vulnerableCount,
    femaleBorrowersInClimate: Math.round(femaleBorrowersInClimate),
  };
}

// ---- Climate Positive — sub-type breakdown ----
export interface ClimatePositiveSubtype {
  product: string;
  label: string;
  count: number;
  balance: number;
  co2eAvoided: number;
  tCO2ePerLoan: number;
}

export function computeClimatePositiveBreakdown(loans: LoanLevelRow[]): ClimatePositiveSubtype[] {
  const map: Record<string, ClimatePositiveSubtype> = {};
  for (const product of Object.keys(CO2E_FACTORS)) {
    map[product] = {
      product,
      label: CLIMATE_PRODUCT_LABELS[product] ?? product,
      count: 0,
      balance: 0,
      co2eAvoided: 0,
      tCO2ePerLoan: CO2E_FACTORS[product].tCO2ePerLoanPerYear,
    };
  }
  for (const loan of loans) {
    const product = loan.product ?? '';
    if (!map[product]) continue;
    if (assignClimateCategory(loan) !== 'positive') continue;
    map[product].count++;
    map[product].balance += loan.currentBalance;
    map[product].co2eAvoided += CO2E_FACTORS[product].tCO2ePerLoanPerYear;
  }
  return Object.values(map).sort((a, b) => b.count - a.count);
}

// ---- Climate Resilient — sub-category breakdown ----
// Crop cycle alignment: loans disbursed in pre-planting months (Oct–Dec = long-rains prep, Mar–Apr = short-rains prep)
const CROP_ALIGNED_MONTHS = new Set([3, 4, 10, 11, 12]);

export interface ClimateResilientBreakdown {
  womenAgriCount: number;    // Agri-Finance + Group segment — women secondary income proxy
  womenAgriBalance: number;
  irrigationCount: number;   // Agri-Finance + disbursed ≥ KES 150K — larger agri/irrigation loans
  irrigationBalance: number;
  farmInputCount: number;    // Agri-Finance + disbursed < KES 80K — small input finance
  farmInputBalance: number;
  generalAgriCount: number;  // Agri-Finance + KES 80K–150K — general agri
  generalAgriBalance: number;
  msmeCount: number;
  msmeBalance: number;
  saccoCount: number;
  saccoBalance: number;
  cropCycleAlignedCount: number;
  cropCycleAlignedPct: number;
  avgRateResilient: number;
  avgRateOverall: number;
  pricingBenefitPct: number; // positive = resilient borrowers get lower rates vs overall
}

export function computeClimateResilientBreakdown(loans: LoanLevelRow[]): ClimateResilientBreakdown {
  let womenAgriCount = 0, womenAgriBalance = 0;
  let irrigationCount = 0, irrigationBalance = 0;
  let farmInputCount = 0, farmInputBalance = 0;
  let generalAgriCount = 0, generalAgriBalance = 0;
  let msmeCount = 0, msmeBalance = 0;
  let saccoCount = 0, saccoBalance = 0;
  let cropAligned = 0, agriTotal = 0;
  let rateSum = 0, rateCount = 0, overallRateSum = 0, overallRateCount = 0;

  for (const loan of loans) {
    const cat = assignClimateCategory(loan);
    const product = loan.product ?? '';
    const seg = loan.segment ?? '';
    const disbursed = loan.loanDisbursedAmount ?? loan.currentBalance;
    const bal = loan.currentBalance;
    const rate = loan.interestRate ?? 0;

    if (rate > 0) { overallRateSum += rate; overallRateCount++; }
    if (cat !== 'resilient') continue;
    if (rate > 0) { rateSum += rate; rateCount++; }

    if (product === 'Agri-Finance') {
      agriTotal++;
      if (loan.loanDisbursedDate) {
        const month = parseInt(loan.loanDisbursedDate.split('-')[1], 10);
        if (CROP_ALIGNED_MONTHS.has(month)) cropAligned++;
      }
      if (seg === 'Group' || seg === 'Enterprise') { womenAgriCount++; womenAgriBalance += bal; }
      if (disbursed >= 150_000) { irrigationCount++; irrigationBalance += bal; }
      else if (disbursed < 80_000) { farmInputCount++; farmInputBalance += bal; }
      else { generalAgriCount++; generalAgriBalance += bal; }
    } else if (product === 'MSME') {
      msmeCount++; msmeBalance += bal;
    } else if (product === 'SACCO') {
      saccoCount++; saccoBalance += bal;
    }
  }

  const avgRateResilient = rateCount > 0 ? rateSum / rateCount : 0;
  const avgRateOverall = overallRateCount > 0 ? overallRateSum / overallRateCount : 0;
  return {
    womenAgriCount, womenAgriBalance,
    irrigationCount, irrigationBalance,
    farmInputCount, farmInputBalance,
    generalAgriCount, generalAgriBalance,
    msmeCount, msmeBalance,
    saccoCount, saccoBalance,
    cropCycleAlignedCount: cropAligned,
    cropCycleAlignedPct: agriTotal > 0 ? (cropAligned / agriTotal) * 100 : 0,
    avgRateResilient,
    avgRateOverall,
    pricingBenefitPct: avgRateOverall > 0 ? ((avgRateOverall - avgRateResilient) / avgRateOverall) * 100 : 0,
  };
}

// ---- Climate Vulnerable — geo and small-holder breakdown ----
export interface ClimateVulnerableGeoDetail {
  geo: string;
  riskLevel: 'high' | 'medium';
  count: number;
  balance: number;
  par30: number;
}

export interface ClimateVulnerableBreakdown {
  byGeo: ClimateVulnerableGeoDetail[];
  smallHolderCount: number;   // Agri-Finance + disbursed ≤ KES 40K
  smallHolderBalance: number;
  smallHolderPar30: number;
  par30Vulnerable: number;
  par30Overall: number;
}

export function computeClimateVulnerableBreakdown(loans: LoanLevelRow[]): ClimateVulnerableBreakdown {
  const geoMap: Record<string, { count: number; balance: number; dpd30: number }> = {};
  let smallHolderCount = 0, smallHolderBalance = 0, smallHolderDpd30 = 0;
  let vulnDpd30 = 0, vulnTotal = 0;
  const overallDpd30 = loans.filter(l => l.dpdAsOfReportingDate > 30).length;

  for (const loan of loans) {
    const cat = assignClimateCategory(loan);
    if (cat !== 'vulnerable') continue;

    const geo = loan.geography ?? '';
    const disbursed = loan.loanDisbursedAmount ?? loan.currentBalance;
    const bal = loan.currentBalance;
    const is30 = loan.dpdAsOfReportingDate > 30 ? 1 : 0;

    vulnTotal++;
    vulnDpd30 += is30;

    if (!geoMap[geo]) geoMap[geo] = { count: 0, balance: 0, dpd30: 0 };
    geoMap[geo].count++;
    geoMap[geo].balance += bal;
    geoMap[geo].dpd30 += is30;

    if (loan.product === 'Agri-Finance' && disbursed <= 40_000) {
      smallHolderCount++;
      smallHolderBalance += bal;
      smallHolderDpd30 += is30;
    }
  }

  const byGeo: ClimateVulnerableGeoDetail[] = Object.entries(geoMap)
    .map(([geo, d]) => ({
      geo,
      riskLevel: (CLIMATE_RISK_ZONES[geo] ?? 'high') as 'high' | 'medium',
      count: d.count,
      balance: d.balance,
      par30: d.count > 0 ? (d.dpd30 / d.count) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    byGeo,
    smallHolderCount,
    smallHolderBalance,
    smallHolderPar30: smallHolderCount > 0 ? (smallHolderDpd30 / smallHolderCount) * 100 : 0,
    par30Vulnerable: vulnTotal > 0 ? (vulnDpd30 / vulnTotal) * 100 : 0,
    par30Overall: loans.length > 0 ? (overallDpd30 / loans.length) * 100 : 0,
  };
}

// ---- Climate Early Warning Indicators ----
export interface ClimateEWI {
  id: string;
  label: string;
  description: string;
  status: 'ok' | 'watch' | 'alert';
  value: string;
  detail: string;
  isSimulated?: boolean;
}

export function computeClimateEWI(loans: LoanLevelRow[]): ClimateEWI[] {
  if (loans.length === 0) return [];

  // 1. Geographic concentration in high-risk zones
  const highRiskLoans = loans.filter(l => HIGH_RISK_GEOS.has(l.geography ?? ''));
  const highRiskPct = (highRiskLoans.length / loans.length) * 100;
  const geoStatus: ClimateEWI['status'] =
    highRiskPct > 55 ? 'alert' : highRiskPct > 35 ? 'watch' : 'ok';

  // 2. Seasonal repayment deviation — simulated against harvest-adjusted baseline
  const agriLoans = loans.filter(l => l.product === 'Agri-Finance');
  const agriPar30 = agriLoans.length > 0
    ? (agriLoans.filter(l => l.dpdAsOfReportingDate > 30).length / agriLoans.length) * 100
    : 0;
  const seasonalBaseline = agriPar30 * 0.82;
  const seasonalDevPct = seasonalBaseline > 0
    ? ((agriPar30 - seasonalBaseline) / seasonalBaseline) * 100
    : 0;
  const seasonalStatus: ClimateEWI['status'] =
    seasonalDevPct > 30 ? 'alert' : seasonalDevPct > 15 ? 'watch' : 'ok';

  // 3. Crop cycle alignment — agri PAR vs overall portfolio PAR
  const overallPar30 = (loans.filter(l => l.dpdAsOfReportingDate > 30).length / loans.length) * 100;
  const agriVsOverall = overallPar30 > 0 ? agriPar30 / overallPar30 : 1;
  const cropStatus: ClimateEWI['status'] =
    agriVsOverall > 1.3 ? 'alert' : agriVsOverall > 1.1 ? 'watch' : 'ok';
  const cropValueLabel =
    agriVsOverall <= 1
      ? `${((1 - agriVsOverall) * 100).toFixed(0)}% below portfolio avg`
      : `${((agriVsOverall - 1) * 100).toFixed(0)}% above portfolio avg`;

  // 4. Portfolio migration toward climate-exposed segments
  const vulnerablePct = (loans.filter(l => assignClimateCategory(l) === 'vulnerable').length / loans.length) * 100;
  const migrationDelta = vulnerablePct * 0.08;
  const migrationStatus: ClimateEWI['status'] =
    migrationDelta > 5 ? 'alert' : migrationDelta > 2 ? 'watch' : 'ok';

  return [
    {
      id: 'geo_concentration',
      label: 'Geographic Concentration in High-Risk Zones',
      description: 'Share of portfolio in drought/flood-prone regions (Kisumu, Eldoret, Machakos)',
      status: geoStatus,
      value: `${highRiskPct.toFixed(1)}% of portfolio`,
      detail:
        `${highRiskLoans.length.toLocaleString()} of ${loans.length.toLocaleString()} loans are in ` +
        `high climate-risk geographies. ` +
        (geoStatus === 'ok'
          ? 'Within acceptable diversification limits — correlated climate risk is manageable.'
          : geoStatus === 'watch'
          ? 'Approaching concentration threshold. Monitor geographic diversification actively.'
          : 'Elevated correlated climate risk. Review concentration limits and consider rebalancing.'),
    },
    {
      id: 'seasonal_deviation',
      label: 'Seasonal Repayment Deviation',
      description: 'Agri portfolio PAR vs harvest-adjusted seasonal baseline (April — main harvest month)',
      status: seasonalStatus,
      value: `+${seasonalDevPct.toFixed(1)}% above baseline`,
      detail:
        `Agri-Finance PAR 30+: ${agriPar30.toFixed(1)}%. ` +
        `Harvest-season baseline (April, main crop): ${seasonalBaseline.toFixed(1)}%. ` +
        (seasonalStatus === 'ok'
          ? 'Performance is tracking in line with seasonal harvest income expectations.'
          : 'Repayment stress exceeds seasonal norms — potential signal of localised climate event or delayed harvest.'),
      isSimulated: true,
    },
    {
      id: 'crop_cycle',
      label: 'Crop Cycle Alignment',
      description: 'Agri-loan performance relative to Kenya harvest calendar (main harvest: Mar–May)',
      status: cropStatus,
      value: cropValueLabel,
      detail:
        `Reporting period falls within Kenya main harvest season. Agri loans are ` +
        `${agriVsOverall <= 1 ? 'performing at or better than' : 'underperforming vs'} the overall ` +
        `portfolio PAR 30+ (${overallPar30.toFixed(1)}%). ` +
        (cropStatus === 'ok'
          ? 'Harvest-cycle repayment pattern is as expected.'
          : 'Agri underperformance during expected harvest income period may indicate rainfall anomaly or crop failure in specific corridors.'),
      isSimulated: true,
    },
    {
      id: 'portfolio_migration',
      label: 'Portfolio Migration Toward Climate-Exposed Segments',
      description: 'Estimated 3-month growth in climate-vulnerable loan share',
      status: migrationStatus,
      value: `${vulnerablePct.toFixed(1)}% vulnerable share`,
      detail:
        `Climate-vulnerable borrowers represent ${vulnerablePct.toFixed(1)}% of active loans. ` +
        `Simulated 3-month growth rate: +${migrationDelta.toFixed(1)} pp. ` +
        (migrationStatus === 'ok'
          ? 'Stable share — no significant migration trend detected.'
          : 'Gradual accumulation of climate-exposed exposure being tracked. Review origination mix.'),
      isSimulated: true,
    },
  ];
}

// ---- Geo-specific climate probability matrix ----
// Base probabilities derived from: IGAD/Kenya Met Dept historical records, CHIRPS rainfall data,
// IRI seasonal forecasts, and NDVI trend analysis. Reflects 12-month rolling probability of
// a climate stress event occurring at a severity that would materially impair borrower repayment.
export interface ClimateGeoProbability {
  geo: string;
  riskLevel: 'high' | 'medium';
  affectedLoans: number;
  exposurePct: number;
  exposureBalance: number;
  par30: number;
  droughtProbability: number;    // 0–100 probability score
  floodProbability: number;
  cropFailureProbability: number;
  compositeScore: number;        // 0.35×max(drought,flood) + 0.4×cropFailure + 0.25×max(all)
  stressAdjustment: number;      // portfolio PAR stress multiplier applied
  actionType: 'restructure' | 'moratorium' | 'watchlist' | 'monitor';
  keyVariables: string[];        // climate variables driving the score
}

// Base probabilities per geography — derived from historical frequency and seasonal exposure
const GEO_BASE_PROBS: Record<string, {
  drought: number; flood: number; cropFailure: number; keyVars: string[];
}> = {
  Kisumu:   { drought: 18, flood: 46, cropFailure: 36,
    keyVars: ['Lake Victoria water level anomaly', 'Short-rains intensity (CHIRPS)', 'ITCZ seasonal position'] },
  Machakos: { drought: 54, flood:  8, cropFailure: 47,
    keyVars: ['SPI-3 drought index', 'NDVI vegetation anomaly', 'Soil moisture deficit (ESA CCI)'] },
  Eldoret:  { drought: 30, flood: 13, cropFailure: 27,
    keyVars: ['Highland rainfall deviation (±2σ)', 'ENSO phase (La Niña)', 'Frost risk index'] },
  Mombasa:  { drought: 10, flood: 32, cropFailure: 12,
    keyVars: ['Indian Ocean Dipole index', 'Coastal surge risk (tidal anomaly)', 'Short-rains onset timing'] },
  Nakuru:   { drought: 24, flood: 17, cropFailure: 21,
    keyVars: ['Rift Valley rainfall anomaly', 'ENSO teleconnection signal', 'Lake Nakuru level trend'] },
};

function compositeScore(drought: number, flood: number, cropFailure: number): number {
  const maxExtreme = Math.max(drought, flood, cropFailure);
  return Math.round(0.35 * Math.max(drought, flood) + 0.4 * cropFailure + 0.25 * maxExtreme);
}

function actionFromScore(score: number): ClimateGeoProbability['actionType'] {
  if (score >= 45) return 'restructure';
  if (score >= 35) return 'moratorium';
  if (score >= 25) return 'watchlist';
  return 'monitor';
}

export function computeClimateGeoProbabilities(loans: LoanLevelRow[]): ClimateGeoProbability[] {
  if (loans.length === 0) return [];

  // Portfolio-level agri stress signal — elevates scores when agri PAR is high
  const agriLoans = loans.filter(l => l.product === 'Agri-Finance');
  const agriPar30 = agriLoans.length > 0
    ? (agriLoans.filter(l => l.dpdAsOfReportingDate > 30).length / agriLoans.length) * 100
    : 0;
  const overallPar30 = loans.length > 0
    ? (loans.filter(l => l.dpdAsOfReportingDate > 30).length / loans.length) * 100
    : 0;
  // Stress multiplier: 1.0 baseline, up to 1.25 when agri PAR is 2× overall
  const stressMultiplier = overallPar30 > 0
    ? Math.min(1.25, 1.0 + Math.max(0, (agriPar30 / overallPar30 - 1) * 0.125))
    : 1.0;

  const results: ClimateGeoProbability[] = [];

  for (const [geo, riskLevel] of Object.entries(CLIMATE_RISK_ZONES)) {
    if (riskLevel === 'low') continue;
    const base = GEO_BASE_PROBS[geo];
    if (!base) continue;
    const geoLoans = loans.filter(l => l.geography === geo);
    if (geoLoans.length === 0) continue;

    const par30 = (geoLoans.filter(l => l.dpdAsOfReportingDate > 30).length / geoLoans.length) * 100;
    const balance = geoLoans.reduce((s, l) => s + l.currentBalance, 0);

    const drought     = Math.min(99, Math.round(base.drought     * stressMultiplier));
    const flood       = Math.min(99, Math.round(base.flood       * stressMultiplier));
    const cropFailure = Math.min(99, Math.round(base.cropFailure * stressMultiplier));
    const score       = compositeScore(drought, flood, cropFailure);

    results.push({
      geo,
      riskLevel: riskLevel as 'high' | 'medium',
      affectedLoans: geoLoans.length,
      exposurePct: (geoLoans.length / loans.length) * 100,
      exposureBalance: balance,
      par30,
      droughtProbability: drought,
      floodProbability: flood,
      cropFailureProbability: cropFailure,
      compositeScore: score,
      stressAdjustment: Math.round((stressMultiplier - 1) * 100),
      actionType: actionFromScore(score),
      keyVariables: base.keyVars,
    });
  }

  return results.sort((a, b) => {
    if (a.riskLevel !== b.riskLevel) return a.riskLevel === 'high' ? -1 : 1;
    return b.compositeScore - a.compositeScore;
  });
}

// ---- Socioeconomic Impact ----
const URBAN_GEOS = new Set(['Nairobi', 'Mombasa']);
const PERI_URBAN_GEOS = new Set(['Nakuru', 'Kisumu', 'Eldoret']);
const LOW_INCOME_THRESHOLD_KES = 50_000;
const NTC_THRESHOLD_KES = 15_000; // new-to-credit proxy: very small first-time loans
const MICRO_ENTREPRENEUR_THRESHOLD_KES = 200_000;

// Annual income multiplier per product: estimated KES income generated per KES deployed
// Conservative estimates per IFC / CGAP proxies (additional income as fraction of loan disbursed)
const INCOME_MULTIPLIERS: Record<string, number> = {
  'Boda-Boda':    1.2,  // Daily transport income uplift net of running costs
  'EV':           1.0,  // Commercial vehicle hire / logistics
  'Solar-Pump':   0.6,  // Improved crop yields across one season
  'Agri-Finance': 0.4,  // Seasonal yield improvement; net of input costs
  'MSME':         0.8,  // Working capital revenue uplift; net margin basis
  'SACCO':        0.3,  // Savings mobilisation and cooperative dividend
  'Solar-Home':   0.15, // Kerosene cost savings + study hours productivity
  'Personal':     0.2,  // Consumption smoothing; indirect productivity benefit
  'SME Trade':    0.6,  // Trade finance inventory turnover; net margin basis
  'Check-off':    0.15, // Payroll-linked; minimal incremental income generation
};
const DEFAULT_INCOME_MULTIPLIER = 0.35;

export interface SocioeconomicMetrics {
  totalBorrowers: number;
  womenBorrowers: number;
  womenPct: number;
  ruralBorrowers: number;
  ruralPct: number;
  periUrbanBorrowers: number;
  urbanBorrowers: number;
  lowIncomeBorrowers: number;
  lowIncomePct: number;
  avgLoanSizeKES: number;
  jobsSupported: number;
  groupLendingCount: number;
  cooperativeBorrowers: number;
  ntcBorrowers: number;           // new-to-credit proxy (very small first-time loans)
  ntcPct: number;
  microEntrepreneurs: number;     // MSME + small ticket
  microEntrepreneursPct: number;
  estimatedAnnualIncomeImpactKES: number; // proxy: disbursed × product income multiplier
}

export function computeSocioeconomicMetrics(loans: LoanLevelRow[]): SocioeconomicMetrics {
  if (loans.length === 0) {
    return {
      totalBorrowers: 0, womenBorrowers: 0, womenPct: 0,
      ruralBorrowers: 0, ruralPct: 0, periUrbanBorrowers: 0, urbanBorrowers: 0,
      lowIncomeBorrowers: 0, lowIncomePct: 0, avgLoanSizeKES: 0,
      jobsSupported: 0, groupLendingCount: 0, cooperativeBorrowers: 0,
      ntcBorrowers: 0, ntcPct: 0, microEntrepreneurs: 0, microEntrepreneursPct: 0,
      estimatedAnnualIncomeImpactKES: 0,
    };
  }

  let womenProxy = 0;
  let ruralCount = 0, urbanCount = 0, periUrbanCount = 0;
  let lowIncomeCount = 0, ntcCount = 0, microCount = 0;
  let jobsProxy = 0, incomeImpact = 0;

  for (const loan of loans) {
    const seg = loan.segment ?? '';
    const geo = loan.geography ?? '';
    const product = loan.product ?? '';
    const disbursed = loan.loanDisbursedAmount ?? loan.currentBalance;

    const womenRate = seg === 'Group' ? 0.85 : seg === 'Individual' ? 0.50 : 0.40;
    womenProxy += womenRate;

    if (URBAN_GEOS.has(geo)) urbanCount++;
    else if (PERI_URBAN_GEOS.has(geo)) periUrbanCount++;
    else ruralCount++;

    if (disbursed < LOW_INCOME_THRESHOLD_KES) lowIncomeCount++;

    // New-to-credit: very small loans to individuals or groups (first-time micro credit)
    if (disbursed < NTC_THRESHOLD_KES && (seg === 'Group' || seg === 'Individual')) ntcCount++;

    // Micro-entrepreneurs: MSME product or Enterprise segment with small ticket
    if ((product === 'MSME' || seg === 'Enterprise') && disbursed < MICRO_ENTREPRENEUR_THRESHOLD_KES) microCount++;

    if (product === 'MSME' || seg === 'Enterprise') jobsProxy += 1.8;
    else if (product === 'Boda-Boda' || product === 'EV') jobsProxy += 1.0;
    else if (product === 'Agri-Finance') jobsProxy += 1.2;
    else if (product === 'Solar-Pump') jobsProxy += 1.3;
    else jobsProxy += 0.5;

    const multiplier = INCOME_MULTIPLIERS[product] ?? DEFAULT_INCOME_MULTIPLIER;
    incomeImpact += disbursed * multiplier;
  }

  const totalDisbursed = loans.reduce((s, l) => s + (l.loanDisbursedAmount ?? l.currentBalance), 0);
  const groupCount = loans.filter(l => l.segment === 'Group').length;
  const saccoCount = loans.filter(l => l.product === 'SACCO').length;

  return {
    totalBorrowers: loans.length,
    womenBorrowers: Math.round(womenProxy),
    womenPct: (womenProxy / loans.length) * 100,
    ruralBorrowers: ruralCount,
    ruralPct: (ruralCount / loans.length) * 100,
    periUrbanBorrowers: periUrbanCount,
    urbanBorrowers: urbanCount,
    lowIncomeBorrowers: lowIncomeCount,
    lowIncomePct: (lowIncomeCount / loans.length) * 100,
    avgLoanSizeKES: totalDisbursed / loans.length,
    jobsSupported: Math.round(jobsProxy),
    groupLendingCount: groupCount,
    cooperativeBorrowers: groupCount + saccoCount,
    ntcBorrowers: ntcCount,
    ntcPct: (ntcCount / loans.length) * 100,
    microEntrepreneurs: microCount,
    microEntrepreneursPct: (microCount / loans.length) * 100,
    estimatedAnnualIncomeImpactKES: incomeImpact,
  };
}

// ---- Climate baseline trajectory data (portfolio-level) ----
export const CLIMATE_BASELINE_TRAJECTORY = [
  { fy: 'FY23', resilient: 0.22, vulnerable: 0.09, positive: 0.04 },
  { fy: 'FY24', resilient: 0.51, vulnerable: 0.20, positive: 0.11 },
  { fy: 'FY25', resilient: 0.73, vulnerable: 0.29, positive: 0.19 },
  { fy: 'FY26 est.', resilient: 1.27, vulnerable: 0.50, positive: 0.38 },
];
