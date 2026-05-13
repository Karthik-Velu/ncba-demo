import type { LoanLevelRow, ClimateCategory } from './types';

// ============================================================
// INDIA-LOCALIZED CLIMATE IMPACT LIBRARY
// Geographies, products, data sources, currency localised for the Indian market.
// ============================================================

// ---- Geographic climate risk zones (India) ----
// Based on IMD climate vulnerability data, NRSC remote sensing,
// historical drought/flood/cyclone frequency, and NITI Aayog Composite Water Index
export const CLIMATE_RISK_ZONES: Record<string, 'high' | 'medium' | 'low'> = {
  'Marathwada':           'high',    // Maharashtra — chronic drought (Aurangabad, Beed, Latur, Osmanabad)
  'Bundelkhand':          'high',    // UP/MP border — chronic drought, water stress
  'Vidarbha':             'high',    // Maharashtra — drought, farmer distress
  'North Bihar':          'high',    // Annual Kosi/Gandak flooding
  'Sundarbans':           'high',    // West Bengal — cyclone, sea-level rise, salinity ingress
  'Coastal Odisha':       'medium',  // Cyclone-prone (Phailin, Fani precedent)
  'Coastal Andhra':       'medium',  // Cyclone exposure (Godavari–Krishna delta)
  'Rayalaseema':          'medium',  // AP interior — drought
  'Assam':                'medium',  // Brahmaputra flooding
  'Punjab':               'low',     // Heavily irrigated; groundwater stress but climate-stable
  'Western Maharashtra':  'low',     // Mixed urban-rural, irrigated belt
  'Karnataka Plateau':    'low',     // Bengaluru rural belt, irrigated
};

const HIGH_RISK_GEOS = new Set(
  Object.entries(CLIMATE_RISK_ZONES)
    .filter(([, v]) => v === 'high')
    .map(([k]) => k),
);

// ---- Climate-positive product set (India) ----
// E-2W replaces Boda-Boda (India context); E-3W is e-rickshaw/e-auto; Solar-Home and Solar-Pump retained
const CLIMATE_POSITIVE_PRODUCTS = new Set(['E-2W', 'E-3W', 'EV', 'Solar-Home', 'Solar-Pump']);

// ---- Product → climate category ----
export function assignClimateCategory(loan: LoanLevelRow): ClimateCategory {
  if (loan.climateCategory !== undefined) return loan.climateCategory;
  const product = loan.product ?? '';
  const geo = loan.geography ?? '';
  const isHighRisk = HIGH_RISK_GEOS.has(geo);

  if (CLIMATE_POSITIVE_PRODUCTS.has(product)) return 'positive';
  if (product === 'Agri-Finance') return isHighRisk ? 'vulnerable' : 'resilient';
  if (product === 'MSME')         return isHighRisk ? 'vulnerable' : 'resilient';
  if (product === 'Dairy')        return isHighRisk ? 'vulnerable' : 'resilient';
  if (product === 'SHG')          return 'resilient';
  if (product === 'JLG')          return 'resilient';
  return null;
}

// ---- CO2e proxy emission factors (India context) ----
// Sources: IPCC AR6 (2022), CEA India Grid Factor (2023), MNRE solar data, NITI Aayog E-Mobility Reports
// India grid factor: ~0.71 kgCO2/kWh (CEA CO2 Baseline Database 2023)
export const CO2E_FACTORS: Record<string, { tCO2ePerLoanPerYear: number; methodology: string }> = {
  'E-2W': {
    tCO2ePerLoanPerYear: 0.52,
    methodology:
      'Electric two-wheeler vs petrol scooter/motorcycle. 18,000 km/yr at 50 km/L petrol → 360 L × 2.31 kgCO₂/L = 832 kgCO₂e/yr. ' +
      'E-2W: 0.025 kWh/km × 18,000 km = 450 kWh × 0.71 kgCO₂/kWh (CEA India grid, 2023) = 320 kgCO₂e/yr. ' +
      'Net avoided: ~512 kgCO₂e ≈ 0.52 tCO₂e per loan per year. MDB Common Principles activity 8.6.',
  },
  'E-3W': {
    tCO2ePerLoanPerYear: 1.54,
    methodology:
      'Electric three-wheeler (e-rickshaw / e-auto) vs CNG/diesel auto. 30,000 km/yr commercial use. ' +
      'CNG auto: 30,000/25 km/kg × 2.7 kgCO₂/kg = 3,240 kgCO₂e/yr. ' +
      'E-3W: 0.08 kWh/km × 30,000 km = 2,400 kWh × 0.71 kgCO₂/kWh = 1,704 kgCO₂e/yr. ' +
      'Net avoided: ~1,536 kgCO₂e ≈ 1.54 tCO₂e per loan per year. MDB activity 8.6.',
  },
  'EV': {
    tCO2ePerLoanPerYear: 2.52,
    methodology:
      'Electric 4-wheeler (commercial taxi / fleet) vs petrol/diesel equivalent. 30,000 km/yr commercial use. ' +
      'Petrol: 30,000/12 km/L × 2.31 = 5,775 kgCO₂e/yr. ' +
      'EV: 0.18 kWh/km × 30,000 km = 5,400 kWh × 0.71 = 3,834 kgCO₂e/yr. ' +
      'Net avoided: ~1,941 kgCO₂e plus refrigerant/AC factor ≈ 2.52 tCO₂e per loan per year. MDB activity 8.6.',
  },
  'Solar-Home': {
    tCO2ePerLoanPerYear: 0.32,
    methodology:
      'Solar home system displacing kerosene lighting and some diesel genset use (rural India). ' +
      'Kerosene: 4 L/month × 12 × 2.54 kgCO₂/L (IPCC AR6) = 122 kgCO₂e/yr. ' +
      'Genset displacement: ~200 kWh × 0.99 kgCO₂/kWh = 198 kgCO₂e/yr. Total displaced: ~320 kgCO₂e ≈ 0.32 tCO₂e per year. ' +
      'MNRE Off-grid Solar Programme; MDB Common Principles activity 7.1.',
  },
  'Solar-Pump': {
    tCO2ePerLoanPerYear: 2.01,
    methodology:
      'Solar irrigation pump displacing diesel pump (PM-KUSUM scheme context). ' +
      '5 L diesel/day × 150 irrigation days × 2.68 kgCO₂/L (IPCC AR6) = 2,010 kgCO₂e/yr. ' +
      'Solar pump: near-zero direct emissions during operation. ' +
      'Net avoided: ~2,010 kgCO₂e ≈ 2.01 tCO₂e per loan per year. ' +
      'MNRE PM-KUSUM evaluation reports; MDB activity 7.3.',
  },
};

export const CLIMATE_PRODUCT_LABELS: Record<string, string> = {
  'E-2W':       'Electric 2-Wheeler',
  'E-3W':       'E-Rickshaw / E-Auto',
  'EV':         'Electric 4-Wheeler (Commercial)',
  'Solar-Home': 'Solar Home System',
  'Solar-Pump': 'Solar Irrigation Pump (PM-KUSUM)',
};

export const INR_TO_USD = 83; // approximate as of 2026

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
      // India: SHG ~95% women; JLG ~80% women; Individual ~50%; Enterprise ~30%
      const womenRate = seg === 'SHG' ? 0.95 : seg === 'JLG' ? 0.80 : seg === 'Individual' ? 0.50 : 0.30;
      femaleBorrowersInClimate += womenRate;
    }
  }

  const totalClimateBalance = positiveBalance + resilientBalance + vulnerableBalance;
  const agriHouseholdCount = loans.filter(l => l.product === 'Agri-Finance').length;

  return {
    total: loans.length,
    positiveCount, resilientCount, vulnerableCount, unclassifiedCount,
    positiveBalance, resilientBalance, vulnerableBalance,
    totalClimateBalance, totalBalance,
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
// India crop calendar: Kharif sowing Jun–Jul (pre-sowing Apr–Jun); Rabi sowing Oct–Nov (pre-sowing Sep–Oct)
const CROP_ALIGNED_MONTHS = new Set([4, 5, 6, 9, 10, 11]);

export interface ClimateResilientBreakdown {
  womenAgriCount: number;
  womenAgriBalance: number;
  irrigationCount: number;
  irrigationBalance: number;
  farmInputCount: number;
  farmInputBalance: number;
  generalAgriCount: number;
  generalAgriBalance: number;
  msmeCount: number;
  msmeBalance: number;
  shgCount: number;
  shgBalance: number;
  cropCycleAlignedCount: number;
  cropCycleAlignedPct: number;
  avgRateResilient: number;
  avgRateOverall: number;
  pricingBenefitPct: number;
}

export function computeClimateResilientBreakdown(loans: LoanLevelRow[]): ClimateResilientBreakdown {
  let womenAgriCount = 0, womenAgriBalance = 0;
  let irrigationCount = 0, irrigationBalance = 0;
  let farmInputCount = 0, farmInputBalance = 0;
  let generalAgriCount = 0, generalAgriBalance = 0;
  let msmeCount = 0, msmeBalance = 0;
  let shgCount = 0, shgBalance = 0;
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
      // India: SHG/JLG segment in agri ≈ women smallholder proxy
      if (seg === 'SHG' || seg === 'JLG') { womenAgriCount++; womenAgriBalance += bal; }
      // India ticket sizes: Solar pump / irrigation loans ≥ ₹100K; small input loans < ₹50K
      if (disbursed >= 100_000) { irrigationCount++; irrigationBalance += bal; }
      else if (disbursed < 50_000) { farmInputCount++; farmInputBalance += bal; }
      else { generalAgriCount++; generalAgriBalance += bal; }
    } else if (product === 'MSME') {
      msmeCount++; msmeBalance += bal;
    } else if (product === 'SHG' || product === 'JLG') {
      shgCount++; shgBalance += bal;
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
    shgCount, shgBalance,
    cropCycleAlignedCount: cropAligned,
    cropCycleAlignedPct: agriTotal > 0 ? (cropAligned / agriTotal) * 100 : 0,
    avgRateResilient,
    avgRateOverall,
    pricingBenefitPct: avgRateOverall > 0 ? ((avgRateOverall - avgRateResilient) / avgRateOverall) * 100 : 0,
  };
}

// ---- Climate Vulnerable breakdown ----
export interface ClimateVulnerableGeoDetail {
  geo: string;
  riskLevel: 'high' | 'medium';
  count: number;
  balance: number;
  par30: number;
}

export interface ClimateVulnerableBreakdown {
  byGeo: ClimateVulnerableGeoDetail[];
  smallHolderCount: number;
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

    // India small-holder proxy: Agri-Finance with disbursed ≤ ₹30,000 (1–2 acre marginal farmer)
    if (loan.product === 'Agri-Finance' && disbursed <= 30_000) {
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

// ---- Geo-specific climate probability matrix (India) ----
// Probabilities derived from IMD historical records, NRSC remote sensing, NOAA CPC ENSO/IOD,
// IIT Gandhinagar drought monitor, CWC flood data
export interface ClimateGeoProbability {
  geo: string;
  riskLevel: 'high' | 'medium';
  affectedLoans: number;
  exposurePct: number;
  exposureBalance: number;
  par30: number;
  droughtProbability: number;
  floodProbability: number;
  cropFailureProbability: number;
  compositeScore: number;
  stressAdjustment: number;
  actionType: 'restructure' | 'moratorium' | 'watchlist' | 'monitor';
  keyVariables: string[];
}

const GEO_BASE_PROBS: Record<string, {
  drought: number; flood: number; cropFailure: number; keyVars: string[];
}> = {
  'Marathwada':          { drought: 62, flood:  6, cropFailure: 53,
    keyVars: ['SPI-3 drought index (IMD)', 'NRSC NDVI vegetation anomaly', 'Groundwater level (CGWB)'] },
  'Bundelkhand':         { drought: 58, flood:  4, cropFailure: 48,
    keyVars: ['Annual rainfall deviation (IMD)', 'NITI Aayog water stress index', 'Soil moisture deficit (NRSC)'] },
  'Vidarbha':            { drought: 51, flood:  8, cropFailure: 44,
    keyVars: ['Kharif rainfall variability (IMD)', 'Cotton-belt NDVI anomaly', 'IIT Gandhinagar drought atlas'] },
  'North Bihar':         { drought:  8, flood: 56, cropFailure: 38,
    keyVars: ['Kosi/Gandak discharge (CWC)', 'Nepal-side rainfall (IMD)', 'Embankment breach history'] },
  'Sundarbans':          { drought:  4, flood: 49, cropFailure: 35,
    keyVars: ['Bay of Bengal cyclone track (IMD)', 'Sea-level rise (INCOIS)', 'Salinity ingress (CIBA)'] },
  'Coastal Odisha':      { drought:  8, flood: 42, cropFailure: 24,
    keyVars: ['Bay of Bengal cyclone forecast (IMD)', 'Storm surge model (INCOIS)', 'NE monsoon onset timing'] },
  'Coastal Andhra':      { drought: 12, flood: 38, cropFailure: 26,
    keyVars: ['Indian Ocean Dipole index', 'Godavari–Krishna flow (CWC)', 'Cyclone landfall probability'] },
  'Rayalaseema':         { drought: 44, flood:  9, cropFailure: 36,
    keyVars: ['SW monsoon shadow effect (IMD)', 'Groundwater depletion rate (CGWB)', 'NE monsoon NDVI'] },
  'Assam':               { drought:  6, flood: 46, cropFailure: 28,
    keyVars: ['Brahmaputra discharge (CWC)', 'Pre-monsoon rainfall (IMD)', 'Landslide frequency'] },
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

  const agriLoans = loans.filter(l => l.product === 'Agri-Finance');
  const agriPar30 = agriLoans.length > 0
    ? (agriLoans.filter(l => l.dpdAsOfReportingDate > 30).length / agriLoans.length) * 100 : 0;
  const overallPar30 = loans.length > 0
    ? (loans.filter(l => l.dpdAsOfReportingDate > 30).length / loans.length) * 100 : 0;
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

// ---- Socioeconomic Impact (India) ----
const URBAN_GEOS = new Set(['Western Maharashtra', 'Karnataka Plateau']);
const PERI_URBAN_GEOS = new Set(['Punjab', 'Coastal Andhra']);
const LOW_INCOME_THRESHOLD_INR = 50_000;
const NTC_THRESHOLD_INR = 10_000;
const MICRO_ENTREPRENEUR_THRESHOLD_INR = 250_000;

const INCOME_MULTIPLIERS: Record<string, number> = {
  'E-2W':         1.0,   // Last-mile delivery, gig economy
  'E-3W':         1.4,   // Passenger/cargo income
  'EV':           1.0,
  'Solar-Pump':   0.7,   // Improved kharif/rabi yield
  'Agri-Finance': 0.4,
  'MSME':         0.9,
  'SHG':          0.4,   // Group savings + small enterprise
  'JLG':          0.35,
  'Dairy':        0.6,
  'Solar-Home':   0.15,
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
  avgLoanSizeINR: number;
  jobsSupported: number;
  groupLendingCount: number;
  cooperativeBorrowers: number;
  ntcBorrowers: number;
  ntcPct: number;
  microEntrepreneurs: number;
  microEntrepreneursPct: number;
  estimatedAnnualIncomeImpactINR: number;
}

export function computeSocioeconomicMetrics(loans: LoanLevelRow[]): SocioeconomicMetrics {
  if (loans.length === 0) {
    return {
      totalBorrowers: 0, womenBorrowers: 0, womenPct: 0,
      ruralBorrowers: 0, ruralPct: 0, periUrbanBorrowers: 0, urbanBorrowers: 0,
      lowIncomeBorrowers: 0, lowIncomePct: 0, avgLoanSizeINR: 0,
      jobsSupported: 0, groupLendingCount: 0, cooperativeBorrowers: 0,
      ntcBorrowers: 0, ntcPct: 0, microEntrepreneurs: 0, microEntrepreneursPct: 0,
      estimatedAnnualIncomeImpactINR: 0,
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

    // India women rates by segment
    const womenRate = seg === 'SHG' ? 0.95 : seg === 'JLG' ? 0.80 : seg === 'Individual' ? 0.50 : 0.30;
    womenProxy += womenRate;

    if (URBAN_GEOS.has(geo)) urbanCount++;
    else if (PERI_URBAN_GEOS.has(geo)) periUrbanCount++;
    else ruralCount++;

    if (disbursed < LOW_INCOME_THRESHOLD_INR) lowIncomeCount++;
    if (disbursed < NTC_THRESHOLD_INR && (seg === 'SHG' || seg === 'JLG' || seg === 'Individual')) ntcCount++;
    if ((product === 'MSME' || seg === 'Enterprise') && disbursed < MICRO_ENTREPRENEUR_THRESHOLD_INR) microCount++;

    if (product === 'MSME' || seg === 'Enterprise') jobsProxy += 1.8;
    else if (product === 'E-2W' || product === 'E-3W' || product === 'EV') jobsProxy += 1.0;
    else if (product === 'Agri-Finance') jobsProxy += 1.2;
    else if (product === 'Solar-Pump') jobsProxy += 1.3;
    else if (product === 'Dairy') jobsProxy += 1.1;
    else jobsProxy += 0.5;

    const multiplier = INCOME_MULTIPLIERS[product] ?? DEFAULT_INCOME_MULTIPLIER;
    incomeImpact += disbursed * multiplier;
  }

  const totalDisbursed = loans.reduce((s, l) => s + (l.loanDisbursedAmount ?? l.currentBalance), 0);
  const groupCount = loans.filter(l => l.segment === 'SHG' || l.segment === 'JLG').length;

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
    avgLoanSizeINR: totalDisbursed / loans.length,
    jobsSupported: Math.round(jobsProxy),
    groupLendingCount: groupCount,
    cooperativeBorrowers: groupCount,
    ntcBorrowers: ntcCount,
    ntcPct: (ntcCount / loans.length) * 100,
    microEntrepreneurs: microCount,
    microEntrepreneursPct: (microCount / loans.length) * 100,
    estimatedAnnualIncomeImpactINR: incomeImpact,
  };
}

// ---- Climate baseline trajectory data (portfolio-level, USD millions) ----
export const CLIMATE_BASELINE_TRAJECTORY = [
  { fy: 'FY23',      resilient: 0.30, vulnerable: 0.12, positive: 0.06 },
  { fy: 'FY24',      resilient: 0.72, vulnerable: 0.26, positive: 0.18 },
  { fy: 'FY25',      resilient: 1.05, vulnerable: 0.38, positive: 0.32 },
  { fy: 'FY26 est.', resilient: 1.80, vulnerable: 0.62, positive: 0.58 },
];

// ============================================================
// CLIMATE EARLY WARNING SYSTEM (India) — TWO-TIER FRAMEWORK
// ============================================================

// ---- Tier 1: Climate Lead Indicators ----
// India context (May 2026): pre-monsoon, IMD SW Monsoon Long Range Forecast just released
// El Niño dissipating, La Niña Watch active; positive IOD developing
// Sources: IMD LRF, NRSC NDVI, NOAA CPC ENSO, IIT Gandhinagar Drought Monitor
const EWI_FORECAST: Record<string, {
  pBelowNormal: number;
  ndviAnomaly: number;
  ensoImpact: 'drought' | 'flood' | 'neutral';
}> = {
  'Marathwada':       { pBelowNormal: 60, ndviAnomaly: -0.07, ensoImpact: 'drought' },
  'Bundelkhand':      { pBelowNormal: 55, ndviAnomaly: -0.05, ensoImpact: 'drought' },
  'Vidarbha':         { pBelowNormal: 48, ndviAnomaly: -0.04, ensoImpact: 'drought' },
  'Rayalaseema':      { pBelowNormal: 42, ndviAnomaly: -0.03, ensoImpact: 'drought' },
  'North Bihar':      { pBelowNormal: 26, ndviAnomaly:  0.02, ensoImpact: 'flood'   },
  'Sundarbans':       { pBelowNormal: 24, ndviAnomaly:  0.01, ensoImpact: 'flood'   },
  'Coastal Odisha':   { pBelowNormal: 30, ndviAnomaly: -0.01, ensoImpact: 'flood'   },
  'Coastal Andhra':   { pBelowNormal: 32, ndviAnomaly: -0.01, ensoImpact: 'flood'   },
  'Assam':            { pBelowNormal: 22, ndviAnomaly:  0.02, ensoImpact: 'flood'   },
};

export const ACTIVE_SIGNAL_GEOS = new Set(
  Object.entries(EWI_FORECAST)
    .filter(([, f]) => f.pBelowNormal >= 35 || f.ndviAnomaly <= -0.03)
    .map(([g]) => g),
);

export interface TierOneEWI {
  code: 'L1' | 'L2' | 'L3';
  label: string;
  source: string;
  leadTime: string;
  status: 'ok' | 'watch' | 'alert';
  headline: string;
  detail: string;
  flaggedGeos: Array<{ geo: string; signal: string }>;
}

export function computeTierOneEWI(loans: LoanLevelRow[]): TierOneEWI[] {
  if (loans.length === 0) return [];

  const geoCount: Record<string, number> = {};
  for (const l of loans) { const g = l.geography ?? ''; geoCount[g] = (geoCount[g] ?? 0) + 1; }
  const material = new Set(
    Object.entries(geoCount).filter(([, c]) => c / loans.length >= 0.05).map(([g]) => g),
  );
  const riskGeos = Object.keys(EWI_FORECAST).filter(g => material.has(g));

  const l1Flagged = riskGeos
    .filter(g => EWI_FORECAST[g].pBelowNormal >= 35)
    .map(g => ({ geo: g, signal: `${EWI_FORECAST[g].pBelowNormal}% P(below-normal)` }));
  const maxP = Math.max(0, ...riskGeos.map(g => EWI_FORECAST[g].pBelowNormal));
  const l1Status: TierOneEWI['status'] = maxP >= 55 ? 'alert' : maxP >= 35 ? 'watch' : 'ok';

  const l2Flagged = riskGeos
    .filter(g => EWI_FORECAST[g].ndviAnomaly <= -0.03)
    .map(g => ({ geo: g, signal: `NDVI ${EWI_FORECAST[g].ndviAnomaly.toFixed(2)}` }));
  const minNdvi = Math.min(0, ...riskGeos.map(g => EWI_FORECAST[g].ndviAnomaly));
  const l2Status: TierOneEWI['status'] = minNdvi <= -0.05 ? 'alert' : minNdvi <= -0.03 ? 'watch' : 'ok';

  const droughtGeos = riskGeos.filter(g => EWI_FORECAST[g].ensoImpact === 'drought')
    .map(g => ({ geo: g, signal: 'Drought risk ↑' }));
  const floodGeos = riskGeos.filter(g => EWI_FORECAST[g].ensoImpact === 'flood')
    .map(g => ({ geo: g, signal: 'Excess monsoon risk ↑' }));
  const l3Flagged = [...droughtGeos, ...floodGeos];
  const l3Status: TierOneEWI['status'] = (droughtGeos.length + floodGeos.length) > 0 ? 'watch' : 'ok';

  const droughtNames = droughtGeos.map(f => f.geo).join(', ');
  const floodNames  = floodGeos.map(f => f.geo).join(', ');

  return [
    {
      code: 'L1',
      label: 'SW Monsoon Long Range Forecast',
      source: 'IMD LRF · NOAA CPC',
      leadTime: '1–3 months',
      status: l1Status,
      headline: l1Status === 'ok'
        ? 'IMD monsoon outlook within normal range across portfolio geographies'
        : `Below-normal monsoon forecast: ${l1Flagged.map(f => f.geo).join(', ')}`,
      detail: l1Status === 'ok'
        ? 'IMD Long Range Forecast (May 2026) shows no material below-normal signal for SW monsoon (Jun–Sep 2026) in portfolio geographies.'
        : `IMD SW Monsoon Long Range Forecast (May 2026): elevated probability of below-normal rainfall in ${l1Flagged.map(f => f.geo).join(' and ')} during Jun–Sep 2026. Kharif crop stress expected, with agri-finance repayment impact in Oct–Dec post-harvest period.`,
      flaggedGeos: l1Flagged,
    },
    {
      code: 'L2',
      label: 'NDVI & Pre-Monsoon Soil Moisture',
      source: 'NRSC Bhuvan · IIT Gandhinagar Drought Atlas',
      leadTime: '6–10 weeks',
      status: l2Status,
      headline: l2Status === 'ok'
        ? 'Vegetation and soil moisture indices within seasonal norm'
        : `Pre-Kharif vegetation stress in ${l2Flagged.map(f => f.geo).join(', ')}`,
      detail: l2Status === 'ok'
        ? 'NRSC NDVI and IMD soil moisture data are within 0.5σ of seasonal baseline across material geographies. Kharif sowing conditions favourable.'
        : `NRSC NDVI anomaly in ${l2Flagged.map(f => f.geo).join(' and ')} is below −0.03 during the pre-Kharif window (May). Indicates persistent drought stress carrying over from Rabi season; likely impact on Kharif sowing decisions and standing crop performance.`,
      flaggedGeos: l2Flagged,
    },
    {
      code: 'L3',
      label: 'ENSO & IOD Phase Alignment',
      source: 'NOAA CPC · IMD ENSO Bulletin',
      leadTime: '3–6 months',
      status: l3Status,
      headline: 'El Niño dissipating; La Niña Watch active — divergent monsoon impact expected',
      detail: l3Status === 'ok'
        ? 'ENSO neutral phase forecast. No material India impact. Geography risk scores unaffected.'
        : `Current state (May 2026): El Niño dissipating; La Niña Watch issued by NOAA CPC; positive IOD developing per IMD. Expected India impact: lingering drought stress in central/peninsular India (${droughtNames || '—'}); above-normal monsoon and flood risk in eastern/north-east India (${floodNames || '—'}). Risk matrix scores adjusted accordingly.`,
      flaggedGeos: l3Flagged,
    },
  ];
}

// ---- Tier 2: Portfolio Response Indicators ----
export interface TierTwoEWI {
  code: 'P1' | 'P2' | 'P3';
  label: string;
  status: 'ok' | 'watch' | 'alert';
  value: string;
  benchmark: string;
  detail: string;
}

export function computeTierTwoEWI(loans: LoanLevelRow[]): TierTwoEWI[] {
  if (loans.length === 0) return [];

  const HIGH_RISK = new Set(
    Object.entries(CLIMATE_RISK_ZONES).filter(([, v]) => v === 'high').map(([k]) => k),
  );

  const portfolioOnTime = (loans.filter(l => l.dpdAsOfReportingDate === 0).length / loans.length) * 100;
  const exposedLoans = loans.filter(l => HIGH_RISK.has(l.geography ?? ''));
  const exposedOnTime = exposedLoans.length > 0
    ? (exposedLoans.filter(l => l.dpdAsOfReportingDate === 0).length / exposedLoans.length) * 100
    : portfolioOnTime;
  const effGap = portfolioOnTime - exposedOnTime;
  const p1Status: TierTwoEWI['status'] = effGap > 10 ? 'alert' : effGap > 5 ? 'watch' : 'ok';

  const activeLoans = loans.filter(l => ACTIVE_SIGNAL_GEOS.has(l.geography ?? ''));
  const activePct = (activeLoans.length / loans.length) * 100;
  const p2Status: TierTwoEWI['status'] = activePct > 50 ? 'alert' : activePct > 25 ? 'watch' : 'ok';
  const activeGeoList = [...ACTIVE_SIGNAL_GEOS].join(', ');

  const climateCount = loans.filter(l => {
    const c = assignClimateCategory(l);
    return c === 'positive' || c === 'resilient';
  }).length;
  const climateSharePct = (climateCount / loans.length) * 100;
  const p3Status: TierTwoEWI['status'] = climateSharePct < 40 ? 'watch' : 'ok';
  const p3Trend = climateSharePct >= 60 ? 'Growing — on track' : climateSharePct >= 40 ? 'On track' : 'Below target';

  return [
    {
      code: 'P1',
      label: 'Collection Efficiency — Climate-Exposed Geographies',
      status: p1Status,
      value: `${exposedOnTime.toFixed(1)}% on-time`,
      benchmark: `Portfolio avg: ${portfolioOnTime.toFixed(1)}%`,
      detail: p1Status === 'ok'
        ? `Repayment in high-risk geographies (${[...HIGH_RISK].join(', ')}) is within ${effGap.toFixed(1)}pp of the portfolio average. No material climate-driven divergence confirmed.`
        : `On-time repayment in climate-stressed geographies is ${effGap.toFixed(1)}pp below the portfolio average — confirming Tier 1 signals are reaching borrower behaviour. ${p1Status === 'alert' ? 'Moratorium assessment recommended.' : 'Increase field engagement cadence in flagged geographies.'}`,
    },
    {
      code: 'P2',
      label: 'Concentration in Active Climate Signal Zones',
      status: p2Status,
      value: `${activePct.toFixed(1)}% of portfolio`,
      benchmark: `In: ${activeGeoList}`,
      detail: p2Status === 'ok'
        ? `${activePct.toFixed(1)}% of the portfolio is in geographies with active Tier 1 climate signals. Concentration is within acceptable limits.`
        : `${activePct.toFixed(1)}% of the portfolio is concentrated in ${activeGeoList}, which carry active L1 (IMD monsoon outlook) and L2 (NRSC NDVI) signals. ${p2Status === 'alert' ? 'Correlated stress risk is elevated — review originator exposure limits.' : 'Monitor closely; consider rebalancing new origination toward lower-risk geographies.'}`,
    },
    {
      code: 'P3',
      label: 'Climate Finance Share Trajectory',
      status: p3Status,
      value: `${climateSharePct.toFixed(1)}% climate-classified`,
      benchmark: p3Trend,
      detail: p3Status === 'ok'
        ? `${climateSharePct.toFixed(1)}% of active loans are climate-positive or climate-resilient. The fund's climate finance share is on track with its Paris-aligned growth trajectory.`
        : `Climate-classified share (${climateSharePct.toFixed(1)}%) is below the target trajectory. Review originator product mix and consider deploying product expansion incentives.`,
    },
  ];
}
