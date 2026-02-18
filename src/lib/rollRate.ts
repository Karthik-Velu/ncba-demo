import type { LoanLevelRow } from './types';
import { getDpdBucket, DPD_BUCKETS } from './types';

/* ================================================================
   Transition Matrices — Base, Stress, Severe
   Rows sum to 1.0 for each source bucket.
   Includes cure paths (back-transitions) for realism.
   ================================================================ */

export const TRANSITION_MATRIX: Record<string, Record<string, number>> = {
  Current:  { Current: 0.94, '1-30': 0.06 },
  '1-30':   { Current: 0.45, '1-30': 0.30, '31-60': 0.25 },
  '31-60':  { Current: 0.10, '1-30': 0.15, '31-60': 0.40, '61-90': 0.35 },
  '61-90':  { '1-30': 0.05, '31-60': 0.10, '61-90': 0.45, '91-180': 0.40 },
  '91-180': { '61-90': 0.05, '91-180': 0.35, '180+': 0.60 },
  '180+':   { '180+': 1.0 },
};

export const STRESS_MATRIX: Record<string, Record<string, number>> = {
  Current:  { Current: 0.90, '1-30': 0.10 },
  '1-30':   { Current: 0.30, '1-30': 0.30, '31-60': 0.40 },
  '31-60':  { Current: 0.05, '1-30': 0.10, '31-60': 0.35, '61-90': 0.50 },
  '61-90':  { '31-60': 0.05, '61-90': 0.30, '91-180': 0.65 },
  '91-180': { '91-180': 0.25, '180+': 0.75 },
  '180+':   { '180+': 1.0 },
};

export const SEVERE_MATRIX: Record<string, Record<string, number>> = {
  Current:  { Current: 0.85, '1-30': 0.15 },
  '1-30':   { Current: 0.20, '1-30': 0.25, '31-60': 0.55 },
  '31-60':  { '1-30': 0.05, '31-60': 0.25, '61-90': 0.70 },
  '61-90':  { '61-90': 0.20, '91-180': 0.80 },
  '91-180': { '91-180': 0.15, '180+': 0.85 },
  '180+':   { '180+': 1.0 },
};

export type ScenarioKey = 'base' | 'stress' | 'severe';
export const SCENARIO_MATRICES: Record<ScenarioKey, Record<string, Record<string, number>>> = {
  base: TRANSITION_MATRIX,
  stress: STRESS_MATRIX,
  severe: SEVERE_MATRIX,
};

export const LOSS_RATES: Record<string, number> = {
  Current: 0, '1-30': 0.01, '31-60': 0.05, '61-90': 0.20, '91-180': 0.50, '180+': 1.0,
};

export const LENDER_PROVISION_RATES: Record<string, number> = {
  Current: 0.01, '1-30': 0.01, '31-60': 0.10, '61-90': 0.50, '91-180': 0.75, '180+': 1.0,
};

export const ADVANCE_RATES: Record<string, number> = {
  Current: 0.80, '1-30': 0.60, '31-60': 0.40, '61-90': 0.10, '91-180': 0, '180+': 0,
};

export const TICKET_SIZES = ['<50K', '50-100K', '100-200K', '200K+'] as const;

export function ticketBucket(amount: number): string {
  if (amount < 50000) return '<50K';
  if (amount < 100000) return '50-100K';
  if (amount < 200000) return '100-200K';
  return '200K+';
}

/* ================================================================
   Core Loss / Provision / ECL
   ================================================================ */

export function estimateLoss(rows: LoanLevelRow[]): { amount: number; rate: number } {
  let totalBal = 0, totalLoss = 0;
  for (const r of rows) {
    const bucket = getDpdBucket(r.dpdAsOfReportingDate);
    totalBal += r.currentBalance;
    totalLoss += r.currentBalance * (LOSS_RATES[bucket] ?? 0);
  }
  return { amount: totalLoss, rate: totalBal > 0 ? totalLoss / totalBal : 0 };
}

export function computeECL(rows: LoanLevelRow[]) {
  let totalBal = 0, loss12m = 0, lossLifetime = 0;
  for (const r of rows) {
    const bucket = getDpdBucket(r.dpdAsOfReportingDate);
    const rate = LOSS_RATES[bucket] ?? 0;
    totalBal += r.currentBalance;
    const pd12m = Math.min(rate * 1.0, 1.0);
    const lgd = bucket === 'Current' || bucket === '1-30' ? 0.45 : 0.65;
    loss12m += r.currentBalance * pd12m * lgd;
    lossLifetime += r.currentBalance * rate;
  }
  return { ecl12m: loss12m, eclLifetime: lossLifetime, totalBal };
}

export function computeProvisions(rows: LoanLevelRow[]) {
  let total = 0;
  for (const r of rows) {
    const bucket = getDpdBucket(r.dpdAsOfReportingDate);
    total += r.currentBalance * (LENDER_PROVISION_RATES[bucket] ?? 0);
  }
  return total;
}

/* ================================================================
   Financial Summary
   ================================================================ */

export function computeFinancialSummary(rows: LoanLevelRow[]) {
  const totalBal = rows.reduce((s, r) => s + r.currentBalance, 0);
  const writtenOff = rows.filter(r => r.loanWrittenOff);
  const grossLoss = writtenOff.reduce((s, r) => s + r.currentBalance, 0);
  const recovery = rows.reduce((s, r) => s + r.recoveryAfterWriteoff, 0);
  const netLoss = grossLoss - recovery;
  const provisions = computeProvisions(rows);
  const totalOverdue = rows.reduce((s, r) => s + r.totalOverdueAmount, 0);
  const avgInterest = rows.length > 0 ? rows.reduce((s, r) => s + r.interestRate * r.currentBalance, 0) / totalBal : 0;
  const writeOffCount = writtenOff.length;
  const writeOffRate = rows.length > 0 ? (writeOffCount / rows.length) * 100 : 0;
  const recoveryRate = grossLoss > 0 ? (recovery / grossLoss) * 100 : 0;
  const overdueRatio = totalBal > 0 ? (totalOverdue / totalBal) * 100 : 0;
  return { totalBal, grossLoss, netLoss, recovery, provisions, totalOverdue, avgInterest, writeOffCount, writeOffRate, recoveryRate, overdueRatio };
}

/* ================================================================
   Roll Rate Projection (Markov chain forward)
   ================================================================ */

export function rollRateProjection(rows: LoanLevelRow[], periods = 3, scenario: ScenarioKey = 'base') {
  const matrix = SCENARIO_MATRICES[scenario];
  const current: Record<string, number> = {};
  DPD_BUCKETS.forEach(b => (current[b] = 0));
  rows.forEach(r => { current[getDpdBucket(r.dpdAsOfReportingDate)] += r.currentBalance; });
  const result = [{ ...current }];
  for (let p = 0; p < periods; p++) {
    const next: Record<string, number> = {};
    DPD_BUCKETS.forEach(b => (next[b] = 0));
    for (const from of DPD_BUCKETS) {
      const trans = matrix[from] || {};
      for (const [to, pct] of Object.entries(trans)) {
        next[to] = (next[to] || 0) + (result[result.length - 1][from] || 0) * pct;
      }
    }
    result.push(next);
  }
  return result.map((p, i) => ({
    period: i === 0 ? 'Current' : `Month ${i}`,
    ...Object.fromEntries(DPD_BUCKETS.map(b => [b, Math.round(p[b] || 0)])),
  }));
}

/* ================================================================
   Cure Rate — percentage of delinquent balance that cured
   ================================================================ */

export function computeCureRate(rows: LoanLevelRow[]) {
  const delinquent = rows.filter(r => r.dpdAsOfReportingDate > 0);
  if (delinquent.length === 0) return { rate: 0, curedBalance: 0, delinquentBalance: 0 };
  const delinqBal = delinquent.reduce((s, r) => s + r.currentBalance, 0);
  const curedBal = delinquent
    .filter(r => r.dpdAsOfReportingDate <= 30)
    .reduce((s, r) => s + r.currentBalance, 0);
  return { rate: delinqBal > 0 ? (curedBal / delinqBal) * 100 : 0, curedBalance: curedBal, delinquentBalance: delinqBal };
}

/* ================================================================
   Vintage Analysis — balance-weighted PAR
   ================================================================ */

export function computeVintageData(rows: LoanLevelRow[]) {
  const map: Record<string, { count: number; disbursed: number; balance: number; dpd30Bal: number; dpd90Bal: number; chargeoffs: number; recoveries: number }> = {};
  rows.forEach(r => {
    const q = r.loanDisbursedDate.slice(0, 4) + '-Q' + Math.ceil((parseInt(r.loanDisbursedDate.slice(5, 7)) || 1) / 3);
    if (!map[q]) map[q] = { count: 0, disbursed: 0, balance: 0, dpd30Bal: 0, dpd90Bal: 0, chargeoffs: 0, recoveries: 0 };
    map[q].count++;
    map[q].disbursed += r.loanDisbursedAmount;
    map[q].balance += r.currentBalance;
    if (r.dpdAsOfReportingDate > 30) map[q].dpd30Bal += r.currentBalance;
    if (r.dpdAsOfReportingDate > 90) map[q].dpd90Bal += r.currentBalance;
    if (r.loanWrittenOff) map[q].chargeoffs += r.currentBalance;
    map[q].recoveries += r.recoveryAfterWriteoff;
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([vintage, d]) => ({
    vintage, ...d,
    dpd30Pct: d.balance > 0 ? (d.dpd30Bal / d.balance) * 100 : 0,
    dpd90Pct: d.balance > 0 ? (d.dpd90Bal / d.balance) * 100 : 0,
    cnl: d.disbursed > 0 ? ((d.chargeoffs - d.recoveries) / d.disbursed) * 100 : 0,
    estLossRate: d.balance > 0 ? estimateLoss(rows.filter(r => (r.loanDisbursedDate.slice(0, 4) + '-Q' + Math.ceil((parseInt(r.loanDisbursedDate.slice(5, 7)) || 1) / 3)) === vintage)).rate * 100 : 0,
  }));
}

/* ================================================================
   Vintage CNL Curves (by months-on-book)
   ================================================================ */

export function computeVintageCurves(rows: LoanLevelRow[]) {
  const vintageGroups: Record<string, LoanLevelRow[]> = {};
  rows.forEach(r => {
    const q = r.loanDisbursedDate.slice(0, 4) + '-Q' + Math.ceil((parseInt(r.loanDisbursedDate.slice(5, 7)) || 1) / 3);
    if (!vintageGroups[q]) vintageGroups[q] = [];
    vintageGroups[q].push(r);
  });
  const vintages = Object.keys(vintageGroups).sort().slice(-6);
  const mobPoints: Record<string, Record<string, number>> = {};
  for (let mob = 1; mob <= 18; mob++) {
    mobPoints[`${mob}`] = {};
    for (const v of vintages) {
      const grp = vintageGroups[v];
      const origVol = grp.reduce((s, r) => s + r.loanDisbursedAmount, 0);
      const chargeoffs = grp.filter(r => r.loanWrittenOff).reduce((s, r) => s + r.currentBalance, 0);
      const recoveries = grp.reduce((s, r) => s + r.recoveryAfterWriteoff, 0);
      const cnlFull = origVol > 0 ? ((chargeoffs - recoveries) / origVol) * 100 : 0;
      const ramp = Math.min(mob / 18, 1.0);
      const cnl = Math.round(Math.max(0, cnlFull * ramp) * 100) / 100;
      mobPoints[`${mob}`][v] = cnl;
    }
  }
  return { vintages, data: Object.entries(mobPoints).map(([mob, vals]) => ({ mob: parseInt(mob), ...vals })) };
}

/* ================================================================
   Dimension Data — balance-weighted PAR
   ================================================================ */

export function computeDimensionData(rows: LoanLevelRow[], keyFn: (r: LoanLevelRow) => string) {
  const map: Record<string, { count: number; balance: number; dpd30Bal: number; dpd90Bal: number; overdue: number }> = {};
  rows.forEach(r => {
    const k = keyFn(r);
    if (!map[k]) map[k] = { count: 0, balance: 0, dpd30Bal: 0, dpd90Bal: 0, overdue: 0 };
    map[k].count++;
    map[k].balance += r.currentBalance;
    map[k].overdue += r.totalOverdueAmount;
    if (r.dpdAsOfReportingDate > 30) map[k].dpd30Bal += r.currentBalance;
    if (r.dpdAsOfReportingDate > 90) map[k].dpd90Bal += r.currentBalance;
  });
  return Object.entries(map).map(([name, d]) => ({
    name, ...d,
    par30: d.balance > 0 ? (d.dpd30Bal / d.balance) * 100 : 0,
    par90: d.balance > 0 ? (d.dpd90Bal / d.balance) * 100 : 0,
    estLoss: estimateLoss(rows.filter(r => keyFn(r) === name)).rate * 100,
  })).sort((a, b) => b.estLoss - a.estLoss);
}

export function computeStressIndicators(rows: LoanLevelRow[]) {
  return {
    geography: computeDimensionData(rows, r => r.geography || 'Unknown'),
    product: computeDimensionData(rows, r => r.product || 'Unknown'),
    segment: computeDimensionData(rows, r => r.segment || 'Unknown'),
    ticketSize: computeDimensionData(rows, r => ticketBucket(r.loanDisbursedAmount)),
  };
}

/* ================================================================
   Cumulative Net Loss (CNL) — per vintage
   CNL = (ChargeOffs - Recoveries) / Original Origination Volume
   ================================================================ */

export function computeCNL(rows: LoanLevelRow[]) {
  const origVol = rows.reduce((s, r) => s + r.loanDisbursedAmount, 0);
  const chargeoffs = rows.filter(r => r.loanWrittenOff).reduce((s, r) => s + r.currentBalance, 0);
  const recoveries = rows.reduce((s, r) => s + r.recoveryAfterWriteoff, 0);
  return { cnl: origVol > 0 ? ((chargeoffs - recoveries) / origVol) * 100 : 0, chargeoffs, recoveries, origVol };
}

/* ================================================================
   Conditional Default Rate (CDR) — annualized
   CDR = 1 - (1 - NewDefaults / PoolBalance)^12
   ================================================================ */

export function computeCDR(rows: LoanLevelRow[]) {
  const poolBal = rows.reduce((s, r) => s + r.currentBalance, 0);
  const newDefaults = rows.filter(r => r.dpdAsOfReportingDate > 90 && !r.loanWrittenOff).reduce((s, r) => s + r.currentBalance, 0);
  const monthlyDefault = poolBal > 0 ? newDefaults / poolBal : 0;
  const cdr = 1 - Math.pow(1 - monthlyDefault, 12);
  return { cdr: cdr * 100, monthlyDefault: monthlyDefault * 100, newDefaults, poolBal };
}

/* ================================================================
   HHI — Herfindahl-Hirschman Index for concentration
   HHI = Sum(share_k^2) where share is balance proportion
   ================================================================ */

export function computeHHI(rows: LoanLevelRow[], keyFn: (r: LoanLevelRow) => string) {
  const totalBal = rows.reduce((s, r) => s + r.currentBalance, 0);
  if (totalBal === 0) return { hhi: 0, normalized: 0, segments: [] as { name: string; share: number; balance: number }[] };
  const map: Record<string, number> = {};
  rows.forEach(r => { const k = keyFn(r); map[k] = (map[k] || 0) + r.currentBalance; });
  const segments = Object.entries(map).map(([name, balance]) => ({ name, share: balance / totalBal, balance })).sort((a, b) => b.share - a.share);
  const hhi = segments.reduce((s, seg) => s + seg.share * seg.share, 0);
  const n = segments.length;
  const normalized = n > 1 ? (hhi - 1 / n) / (1 - 1 / n) : 1;
  return { hhi: Math.round(hhi * 10000) / 10000, normalized: Math.round(normalized * 10000) / 10000, segments };
}

export function hhiLabel(hhi: number): { label: string; color: string } {
  if (hhi < 0.10) return { label: 'Well Diversified', color: 'text-green-600' };
  if (hhi < 0.18) return { label: 'Moderate Concentration', color: 'text-amber-600' };
  return { label: 'High Concentration', color: 'text-red-600' };
}

/* ================================================================
   Repayment Velocity
   Vp = Sum(ActualPayments) / Sum(ScheduledPayments)
   Simulated from balance, rate, and tenure data
   ================================================================ */

export function computeRepaymentVelocity(rows: LoanLevelRow[]) {
  let scheduledTotal = 0, actualTotal = 0;
  for (const r of rows) {
    const monthlyRate = (r.interestRate || 15) / 100 / 12;
    const tenure = r.residualTenureMonths || 12;
    const emi = r.currentBalance > 0 ? (r.currentBalance * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1) : 0;
    scheduledTotal += emi;
    const dpd = r.dpdAsOfReportingDate;
    let actualRatio: number;
    if (dpd === 0) actualRatio = 1.0 + (r.recoveryAfterWriteoff > 0 ? 0.05 : 0);
    else if (dpd <= 30) actualRatio = 0.92;
    else if (dpd <= 60) actualRatio = 0.75;
    else if (dpd <= 90) actualRatio = 0.50;
    else if (dpd <= 180) actualRatio = 0.20;
    else actualRatio = 0.05;
    actualTotal += emi * actualRatio;
  }
  const vp = scheduledTotal > 0 ? actualTotal / scheduledTotal : 1.0;
  return { vp: Math.round(vp * 1000) / 1000, scheduledTotal: Math.round(scheduledTotal), actualTotal: Math.round(actualTotal) };
}

export function vpInterpretation(vp: number): { label: string; color: string; detail: string } {
  if (vp >= 1.0) return { label: 'Prepaying', color: 'text-green-600', detail: 'Borrowers repaying ahead of schedule' };
  if (vp >= 0.98) return { label: 'Healthy', color: 'text-green-600', detail: 'Collections in line with schedule' };
  if (vp >= 0.95) return { label: 'Marginal', color: 'text-amber-600', detail: 'Slight shortfall in collections' };
  return { label: 'Liquidity Stress', color: 'text-red-600', detail: 'Significant collection shortfall \u2014 possible hidden forbearance' };
}

/* ================================================================
   Borrowing Base
   BB = Sum(min(Balance x AdvanceRate, Cap)) - Reserves
   ================================================================ */

export function computeBorrowingBase(rows: LoanLevelRow[], facilityAmount: number) {
  const totalBal = rows.reduce((s, r) => s + r.currentBalance, 0);
  const singleLoanCap = totalBal * 0.01;
  let eligible = 0, ineligible = 0, eligibleCount = 0, ineligibleCount = 0;

  for (const r of rows) {
    const bucket = getDpdBucket(r.dpdAsOfReportingDate);
    const ar = ADVANCE_RATES[bucket] ?? 0;
    if (ar === 0 || r.loanWrittenOff) {
      ineligible += r.currentBalance;
      ineligibleCount++;
      continue;
    }
    const contrib = Math.min(r.currentBalance * ar, singleLoanCap);
    eligible += contrib;
    eligibleCount++;
  }

  const reserves = eligible * 0.05;
  const borrowingBase = eligible - reserves;
  const headroom = borrowingBase - facilityAmount;
  const utilizationPct = borrowingBase > 0 ? (facilityAmount / borrowingBase) * 100 : 100;

  return {
    borrowingBase: Math.round(borrowingBase),
    eligible: Math.round(eligible),
    ineligible: Math.round(ineligible),
    reserves: Math.round(reserves),
    headroom: Math.round(headroom),
    utilizationPct: Math.round(utilizationPct * 10) / 10,
    totalBalance: Math.round(totalBal),
    eligibleCount,
    ineligibleCount,
    facilityAmount,
  };
}

/* ================================================================
   Eligibility Waterfall
   ================================================================ */

export interface EligibilityStep { criteria: string; passCount: number; failCount: number; passBalance: number; failBalance: number; cumEligibleBalance: number }

export function computeEligibilityWaterfall(rows: LoanLevelRow[]): EligibilityStep[] {
  const totalBal = rows.reduce((s, r) => s + r.currentBalance, 0);
  const singleLoanCap = totalBal * 0.01;
  let remaining = [...rows];
  const steps: EligibilityStep[] = [];

  const criteria: { name: string; test: (r: LoanLevelRow) => boolean }[] = [
    { name: 'DPD \u2264 60 days', test: r => r.dpdAsOfReportingDate <= 60 },
    { name: 'Not written off', test: r => !r.loanWrittenOff },
    { name: 'Balance within 1% pool cap', test: r => r.currentBalance <= singleLoanCap },
    { name: 'No repossession flag', test: r => !r.repossession },
    { name: 'Residual tenure > 0', test: r => (r.residualTenureMonths || 0) > 0 },
  ];

  for (const c of criteria) {
    const pass = remaining.filter(c.test);
    const fail = remaining.filter(r => !c.test(r));
    steps.push({
      criteria: c.name,
      passCount: pass.length,
      failCount: fail.length,
      passBalance: Math.round(pass.reduce((s, r) => s + r.currentBalance, 0)),
      failBalance: Math.round(fail.reduce((s, r) => s + r.currentBalance, 0)),
      cumEligibleBalance: Math.round(pass.reduce((s, r) => s + r.currentBalance, 0)),
    });
    remaining = pass;
  }
  return steps;
}

/* ================================================================
   Shadow Accounting — Three-Way Reconciliation (simulated)
   ================================================================ */

export function computeShadowReconciliation(rows: LoanLevelRow[]) {
  const totalBal = rows.reduce((s, r) => s + r.currentBalance, 0);
  const totalDisbursed = rows.reduce((s, r) => s + r.loanDisbursedAmount, 0);
  const principalRepaid = totalDisbursed - totalBal;
  const avgRate = rows.length > 0 ? rows.reduce((s, r) => s + r.interestRate, 0) / rows.length : 15;
  const interestCalc = Math.round(totalBal * (avgRate / 100) / 12);
  const collections = Math.round(principalRepaid * 0.08 + interestCalc);
  const shadowPrincipal = Math.round(collections - interestCalc);
  const tapePrincipal = Math.round(principalRepaid * 0.08);
  const delinquencyAdj = Math.round(rows.filter(r => r.dpdAsOfReportingDate > 30).reduce((s, r) => s + r.totalOverdueAmount, 0) * 0.02);
  const cashDrag = tapePrincipal - (collections - interestCalc - delinquencyAdj);
  const cashDragPct = tapePrincipal > 0 ? (cashDrag / tapePrincipal) * 100 : 0;
  const status: 'reconciled' | 'minor_variance' | 'material_variance' = Math.abs(cashDragPct) < 1 ? 'reconciled' : Math.abs(cashDragPct) < 5 ? 'minor_variance' : 'material_variance';

  return {
    loanTape: { principalReduction: tapePrincipal, totalBalance: Math.round(totalBal), loanCount: rows.length },
    shadowLedger: { expectedPrincipal: shadowPrincipal, interestCalc, expectedCollections: collections },
    bankStatement: { cashCollections: collections + Math.round(cashDrag * 0.3), deposits: collections },
    reconciliation: { cashDrag: Math.round(cashDrag), cashDragPct: Math.round(cashDragPct * 100) / 100, delinquencyAdj, status },
  };
}

/* ================================================================
   Trend Data Generation
   ================================================================ */

export function generateTrendData(rows: LoanLevelRow[], months = 12) {
  const totalBal = rows.reduce((s, r) => s + r.currentBalance, 0);
  const dpd30Bal = rows.filter(r => r.dpdAsOfReportingDate > 30).reduce((s, r) => s + r.currentBalance, 0);
  const dpd90Bal = rows.filter(r => r.dpdAsOfReportingDate > 90).reduce((s, r) => s + r.currentBalance, 0);
  const baseP30 = totalBal > 0 ? (dpd30Bal / totalBal) * 100 : 8;
  const baseP90 = totalBal > 0 ? (dpd90Bal / totalBal) * 100 : 3;
  const baseNpl = baseP90;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const data = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const seed = d.getMonth() + d.getFullYear() * 12;
    const drift = Math.sin(seed * 0.4) * 0.8;
    data.push({
      month: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
      par30: Math.max(0, +(baseP30 + drift + (Math.sin(seed * 0.7) * 0.5)).toFixed(1)),
      par90: Math.max(0, +(baseP90 + drift * 0.3 + (Math.sin(seed * 0.5) * 0.3)).toFixed(1)),
      collection: Math.min(100, Math.max(90, +(97.5 - drift * 0.2).toFixed(1))),
      npl: Math.max(0, +(baseNpl + drift * 0.4).toFixed(1)),
      balance: Math.round(totalBal * (1 + (months - 1 - i) * 0.008 + drift * 0.003)),
      loanCount: Math.round(rows.length * (1 + (months - 1 - i) * 0.006)),
    });
  }
  return data;
}
