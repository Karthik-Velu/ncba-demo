import type { LoanLevelRow, ClimateCategory } from './types';

// ---- Geographic climate risk zones ----
// Based on Kenya climate vulnerability indices: drought frequency, flood exposure, rainfall variability
export const CLIMATE_RISK_ZONES: Record<string, 'high' | 'medium' | 'low'> = {
  Kisumu: 'high',    // Lake Victoria flooding + drought cycles
  Eldoret: 'high',  // Highland drought, high rainfall variability
  Machakos: 'high', // Semi-arid, severe drought-prone
  Mombasa: 'medium', // Coastal flooding risk
  Nakuru: 'medium',  // Rift Valley climate variability
  Nairobi: 'low',
  Nyeri: 'low',
};

const HIGH_RISK_GEOS = new Set(
  Object.entries(CLIMATE_RISK_ZONES)
    .filter(([, v]) => v === 'high')
    .map(([k]) => k),
);

// ---- Product → climate category ----
// Boda-Boda: assumed to represent e-boda/electric motorcycle lending per Kaleidofin Africa
//   portfolio composition (zero direct tailpipe emissions, MDB Common Principles activity 8.6)
// Agri-Finance: Climate Resilient (income diversification, harvest-linked repayment)
//   In high-risk geographies → also Climate Vulnerable (geo-tagged exposure)
// MSME: Climate Resilient; in high-risk geos → Climate Vulnerable
// SACCO: Climate Resilient (cooperative savings/lending in climate-exposed communities)
// Check-off: payroll-linked, no material climate exposure → unclassified
export function assignClimateCategory(loan: LoanLevelRow): ClimateCategory {
  if (loan.climateCategory !== undefined) return loan.climateCategory;
  const product = loan.product ?? '';
  const geo = loan.geography ?? '';
  const isHighRisk = HIGH_RISK_GEOS.has(geo);

  if (product === 'Boda-Boda') return 'positive';
  if (product === 'Agri-Finance') return isHighRisk ? 'vulnerable' : 'resilient';
  if (product === 'MSME') return isHighRisk ? 'vulnerable' : 'resilient';
  if (product === 'SACCO') return 'resilient';
  return null;
}

// ---- CO2e proxy emission factors ----
// Boda-Boda (e-boda): petrol boda ~15,000 km/yr at 30 km/L → 500 L × 2.31 kgCO2/L = 1,155 kgCO2e/yr
// E-boda: 0.08 kWh/km × 15,000 km = 1,200 kWh × 0.48 kgCO2/kWh (Kenya grid, IRENA 2022) = 576 kgCO2e/yr
// Net saving: ~579 kgCO2e/yr ≈ 0.58 tCO2e per active loan per year
// Sources: IPCC AR6 (2022), IRENA Kenya grid factor (2022), MDB Common Principles activity 8.6
export const CO2E_FACTORS: Record<string, { tCO2ePerLoanPerYear: number; methodology: string }> = {
  'Boda-Boda': {
    tCO2ePerLoanPerYear: 0.58,
    methodology:
      'Electric motorcycle vs petrol boda-boda. Assumes 15,000 km/yr, Kenya grid emission factor ' +
      '0.48 kgCO2/kWh (IRENA 2022), petrol emission factor 2.31 kgCO2/L (IPCC AR6). ' +
      'Net avoided: ~579 kgCO2e per active loan per year. ' +
      'Eligible under MDB/IDFC Common Principles activity 8.6 (zero direct emission vehicles).',
  },
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
  // Common Principles basis: Climate Positive only counts as mitigation finance
  climatePositiveSharePct: number;
  // All three categories as share of portfolio
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

  // 1. Geographic concentration in high-risk zones (directly computed)
  const highRiskLoans = loans.filter(l => HIGH_RISK_GEOS.has(l.geography ?? ''));
  const highRiskPct = (highRiskLoans.length / loans.length) * 100;
  const geoStatus: ClimateEWI['status'] =
    highRiskPct > 55 ? 'alert' : highRiskPct > 35 ? 'watch' : 'ok';

  // 2. Seasonal repayment deviation — simulated against harvest-adjusted baseline
  // Kenya main harvest: Mar–May. Reporting period: April 2026 (harvest season).
  // Expected: agri PAR should be tracking down. Simulated baseline = current PAR × 0.82.
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

  // 3. Crop cycle alignment — simulated
  // April = harvest income month; agri PAR should sit at or below overall portfolio PAR.
  const overallPar30 = (loans.filter(l => l.dpdAsOfReportingDate > 30).length / loans.length) * 100;
  const agriVsOverall = overallPar30 > 0 ? agriPar30 / overallPar30 : 1;
  const cropStatus: ClimateEWI['status'] =
    agriVsOverall > 1.3 ? 'alert' : agriVsOverall > 1.1 ? 'watch' : 'ok';
  const cropValueLabel =
    agriVsOverall <= 1
      ? `${((1 - agriVsOverall) * 100).toFixed(0)}% below portfolio avg`
      : `${((agriVsOverall - 1) * 100).toFixed(0)}% above portfolio avg`;

  // 4. Portfolio migration toward climate-exposed segments — simulated trend
  const vulnerablePct = (loans.filter(l => assignClimateCategory(l) === 'vulnerable').length / loans.length) * 100;
  // Simulated 3-month growth rate: deterministic proxy based on portfolio composition
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
      description: 'Agri portfolio PAR vs harvest-adjusted seasonal baseline',
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
        `Reporting period falls within Kenya's main harvest season. Agri loans are ` +
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

// ---- Socioeconomic Impact ----
// Urban: Nairobi, Mombasa | Peri-urban: Nakuru, Kisumu, Eldoret | Rural: Machakos, Nyeri
const URBAN_GEOS = new Set(['Nairobi', 'Mombasa']);
const PERI_URBAN_GEOS = new Set(['Nakuru', 'Kisumu', 'Eldoret']);
// Low-income proxy: disbursed amount below KES 50,000
const LOW_INCOME_THRESHOLD_KES = 50_000;

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
  cooperativeBorrowers: number; // SACCO + Group (community finance proxy)
}

export function computeSocioeconomicMetrics(loans: LoanLevelRow[]): SocioeconomicMetrics {
  if (loans.length === 0) {
    return {
      totalBorrowers: 0, womenBorrowers: 0, womenPct: 0,
      ruralBorrowers: 0, ruralPct: 0, periUrbanBorrowers: 0, urbanBorrowers: 0,
      lowIncomeBorrowers: 0, lowIncomePct: 0, avgLoanSizeKES: 0,
      jobsSupported: 0, groupLendingCount: 0, cooperativeBorrowers: 0,
    };
  }

  let womenProxy = 0;
  let ruralCount = 0, urbanCount = 0, periUrbanCount = 0;
  let lowIncomeCount = 0;
  let jobsProxy = 0;

  for (const loan of loans) {
    const seg = loan.segment ?? '';
    const geo = loan.geography ?? '';
    const product = loan.product ?? '';
    const disbursed = loan.loanDisbursedAmount ?? loan.currentBalance;

    // Women borrower proxy rates (based on segment composition in East African MFI context)
    const womenRate = seg === 'Group' ? 0.85 : seg === 'Individual' ? 0.50 : 0.40;
    womenProxy += womenRate;

    if (URBAN_GEOS.has(geo)) urbanCount++;
    else if (PERI_URBAN_GEOS.has(geo)) periUrbanCount++;
    else ruralCount++;

    if (disbursed < LOW_INCOME_THRESHOLD_KES) lowIncomeCount++;

    // Jobs supported proxy (direct + indirect employment)
    if (product === 'MSME' || seg === 'Enterprise') jobsProxy += 1.8;
    else if (product === 'Boda-Boda') jobsProxy += 1.0;
    else if (product === 'Agri-Finance') jobsProxy += 1.2;
    else jobsProxy += 0.5;
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
  };
}

// ---- Climate baseline trajectory data (portfolio-level, from document Section 8) ----
// Values in USD millions; used for the portfolio-scope trend chart
export const CLIMATE_BASELINE_TRAJECTORY = [
  { fy: 'FY23', resilient: 0.22, vulnerable: 0.09 },
  { fy: 'FY24', resilient: 0.51, vulnerable: 0.20 },
  { fy: 'FY25', resilient: 0.73, vulnerable: 0.29 },
  { fy: 'FY26 est.', resilient: 1.27, vulnerable: 0.50 },
];
