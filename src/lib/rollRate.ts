import type { LoanLevelRow } from './types';
import { getDpdBucket, DPD_BUCKETS } from './types';

export const TRANSITION_MATRIX: Record<string, Record<string, number>> = {
  Current: { Current: 0.92, '1-30': 0.08 },
  '1-30': { Current: 0.40, '1-30': 0.30, '31-60': 0.30 },
  '31-60': { '1-30': 0.15, '31-60': 0.35, '61-90': 0.50 },
  '61-90': { '31-60': 0.05, '61-90': 0.25, '91-180': 0.70 },
  '91-180': { '91-180': 0.20, '180+': 0.80 },
  '180+': { '180+': 1.0 },
};

export const LOSS_RATES: Record<string, number> = {
  Current: 0, '1-30': 0.01, '31-60': 0.1, '61-90': 0.25, '91-180': 0.5, '180+': 1.0,
};

export const NCBA_PROVISION_RATES: Record<string, number> = {
  Current: 0.01, '1-30': 0.01, '31-60': 0.1, '61-90': 0.5, '91-180': 0.75, '180+': 1.0,
};

export const TICKET_SIZES = ['<50K', '50-100K', '100-200K', '200K+'] as const;

export function ticketBucket(amount: number): string {
  if (amount < 50000) return '<50K';
  if (amount < 100000) return '50-100K';
  if (amount < 200000) return '100-200K';
  return '200K+';
}

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
    loss12m += r.currentBalance * rate * 0.12;
    lossLifetime += r.currentBalance * rate;
  }
  return { ecl12m: loss12m, eclLifetime: lossLifetime, totalBal };
}

export function computeProvisions(rows: LoanLevelRow[]) {
  let total = 0;
  for (const r of rows) {
    const bucket = getDpdBucket(r.dpdAsOfReportingDate);
    total += r.currentBalance * (NCBA_PROVISION_RATES[bucket] ?? 0);
  }
  return total;
}

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

export function rollRateProjection(rows: LoanLevelRow[], periods = 2) {
  const current: Record<string, number> = {};
  DPD_BUCKETS.forEach(b => (current[b] = 0));
  rows.forEach(r => { current[getDpdBucket(r.dpdAsOfReportingDate)] += r.currentBalance; });
  const result = [{ ...current }];
  for (let p = 0; p < periods; p++) {
    const next: Record<string, number> = {};
    DPD_BUCKETS.forEach(b => (next[b] = 0));
    for (const from of DPD_BUCKETS) {
      const trans = TRANSITION_MATRIX[from] || {};
      for (const [to, pct] of Object.entries(trans)) {
        next[to] = (next[to] || 0) + (result[result.length - 1][from] || 0) * pct;
      }
    }
    result.push(next);
  }
  return result.map((p, i) => ({
    period: i === 0 ? 'Current' : `Period ${i}`,
    ...Object.fromEntries(DPD_BUCKETS.map(b => [b, Math.round(p[b] || 0)])),
  }));
}

export function computeVintageData(rows: LoanLevelRow[]) {
  const map: Record<string, { count: number; disbursed: number; balance: number; dpd30: number; dpd90: number }> = {};
  rows.forEach(r => {
    const q = r.loanDisbursedDate.slice(0, 4) + '-Q' + Math.ceil((parseInt(r.loanDisbursedDate.slice(5, 7)) || 1) / 3);
    if (!map[q]) map[q] = { count: 0, disbursed: 0, balance: 0, dpd30: 0, dpd90: 0 };
    map[q].count++;
    map[q].disbursed += r.loanDisbursedAmount;
    map[q].balance += r.currentBalance;
    if (r.dpdAsOfReportingDate > 30) map[q].dpd30++;
    if (r.dpdAsOfReportingDate > 90) map[q].dpd90++;
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([vintage, d]) => ({
    vintage, ...d,
    dpd30Pct: d.count > 0 ? (d.dpd30 / d.count) * 100 : 0,
    dpd90Pct: d.count > 0 ? (d.dpd90 / d.count) * 100 : 0,
    estLossRate: d.balance > 0 ? estimateLoss(rows.filter(r => (r.loanDisbursedDate.slice(0, 4) + '-Q' + Math.ceil((parseInt(r.loanDisbursedDate.slice(5, 7)) || 1) / 3)) === vintage)).rate * 100 : 0,
  }));
}

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
      const total = grp.length;
      const defaulted = grp.filter(r => r.dpdAsOfReportingDate > 90).length;
      const simRate = total > 0 ? (defaulted / total) * 100 * Math.min(mob / 12, 1.0) : 0;
      mobPoints[`${mob}`][v] = Math.round(simRate * 100) / 100;
    }
  }
  return { vintages, data: Object.entries(mobPoints).map(([mob, vals]) => ({ mob: parseInt(mob), ...vals })) };
}

export function computeDimensionData(rows: LoanLevelRow[], keyFn: (r: LoanLevelRow) => string) {
  const map: Record<string, { count: number; balance: number; dpd30: number; dpd90: number; overdue: number }> = {};
  rows.forEach(r => {
    const k = keyFn(r);
    if (!map[k]) map[k] = { count: 0, balance: 0, dpd30: 0, dpd90: 0, overdue: 0 };
    map[k].count++;
    map[k].balance += r.currentBalance;
    map[k].overdue += r.totalOverdueAmount;
    if (r.dpdAsOfReportingDate > 30) map[k].dpd30++;
    if (r.dpdAsOfReportingDate > 90) map[k].dpd90++;
  });
  return Object.entries(map).map(([name, d]) => ({
    name, ...d,
    par30: d.count > 0 ? (d.dpd30 / d.count) * 100 : 0,
    par90: d.count > 0 ? (d.dpd90 / d.count) * 100 : 0,
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

export function generateTrendData(rows: LoanLevelRow[], months = 12) {
  const baseP30 = rows.length > 0 ? (rows.filter(r => r.dpdAsOfReportingDate > 30).length / rows.length) * 100 : 8;
  const baseP90 = rows.length > 0 ? (rows.filter(r => r.dpdAsOfReportingDate > 90).length / rows.length) * 100 : 3;
  const baseBal = rows.reduce((s, r) => s + r.currentBalance, 0);
  const baseNpl = baseBal > 0 ? (rows.filter(r => r.dpdAsOfReportingDate > 90).reduce((s, r) => s + r.currentBalance, 0) / baseBal) * 100 : 3;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const data = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const seed = d.getMonth() + d.getFullYear() * 12;
    const drift = Math.sin(seed * 0.4) * 1.2;
    data.push({
      month: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
      par30: Math.max(0, +(baseP30 + drift + (Math.sin(seed * 0.7) * 0.8)).toFixed(1)),
      par90: Math.max(0, +(baseP90 + drift * 0.4 + (Math.sin(seed * 0.5) * 0.4)).toFixed(1)),
      collection: Math.min(100, Math.max(90, +(97.5 - drift * 0.3).toFixed(1))),
      npl: Math.max(0, +(baseNpl + drift * 0.5).toFixed(1)),
      balance: Math.round(baseBal * (1 + (months - 1 - i) * 0.01 + drift * 0.005)),
      loanCount: Math.round(rows.length * (1 + (months - 1 - i) * 0.008)),
    });
  }
  return data;
}
