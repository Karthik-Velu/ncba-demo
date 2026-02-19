import type { SecuritisationStructure, LoanLevelRow } from './types';

export interface TrancheResult {
  tranche: 'Senior' | 'Mezzanine' | 'Equity';
  initialBalance: number;
  interestPaid: number;
  principalPaid: number;
  endBalance: number;
  shortfall: number;
  coverageRatio: number;
  status: 'ok' | 'partial' | 'impaired';
}

export interface WaterfallResult {
  poolBalance: number;
  totalCollections: number;
  totalLosses: number;
  lossRate: number;
  prepayRate: number;
  tranches: TrancheResult[];
  equityResidual: number;
}

export function runWaterfall(
  poolBalance: number,
  avgRate: number,
  structure: SecuritisationStructure,
  lossRate: number,
  prepayRate: number,
  periods: number = 12,
): WaterfallResult {
  const ocFactor = 1 + structure.overCollateralisationPct / 100;
  const noteBalance = poolBalance / ocFactor;

  let seniorBal = noteBalance * (structure.seniorPct / 100);
  let mezzBal = noteBalance * (structure.mezzaninePct / 100);
  let equityBal = noteBalance * (structure.equityPct / 100);

  const seniorCoupon = structure.seniorCoupon / 100 / 12;
  const mezzCoupon = structure.mezzanineCoupon / 100 / 12;

  let runningPool = poolBalance;
  let totalCollections = 0;
  let totalLosses = 0;

  let seniorIntPaid = 0, seniorPrinPaid = 0, seniorShortfall = 0;
  let mezzIntPaid = 0, mezzPrinPaid = 0, mezzShortfall = 0;
  let equityIntPaid = 0;

  const monthlyLossRate = 1 - Math.pow(1 - lossRate / 100, 1 / 12);
  const monthlyPrepay = prepayRate / 100 / 12;

  for (let m = 0; m < periods; m++) {
    const periodLoss = runningPool * monthlyLossRate;
    const periodPrepay = runningPool * monthlyPrepay;
    const scheduledPrincipal = runningPool / Math.max(periods - m, 1);
    const interestIncome = runningPool * (avgRate / 100 / 12);
    const actualPrincipal = scheduledPrincipal + periodPrepay;

    runningPool -= (actualPrincipal + periodLoss);
    if (runningPool < 0) runningPool = 0;

    const availableCash = interestIncome + actualPrincipal - periodLoss;
    totalCollections += interestIncome + actualPrincipal;
    totalLosses += periodLoss;

    let remaining = Math.max(availableCash, 0);

    const seniorIntDue = seniorBal * seniorCoupon;
    const seniorIntActual = Math.min(remaining, seniorIntDue);
    remaining -= seniorIntActual;
    seniorIntPaid += seniorIntActual;
    if (seniorIntActual < seniorIntDue) seniorShortfall += seniorIntDue - seniorIntActual;

    const mezzIntDue = mezzBal * mezzCoupon;
    const mezzIntActual = Math.min(remaining, mezzIntDue);
    remaining -= mezzIntActual;
    mezzIntPaid += mezzIntActual;
    if (mezzIntActual < mezzIntDue) mezzShortfall += mezzIntDue - mezzIntActual;

    const seniorPrinDue = Math.min(seniorBal, scheduledPrincipal * (structure.seniorPct / 100));
    const seniorPrinActual = Math.min(remaining, seniorPrinDue);
    remaining -= seniorPrinActual;
    seniorBal -= seniorPrinActual;
    seniorPrinPaid += seniorPrinActual;
    if (seniorPrinActual < seniorPrinDue) seniorShortfall += seniorPrinDue - seniorPrinActual;

    const mezzPrinDue = Math.min(mezzBal, scheduledPrincipal * (structure.mezzaninePct / 100));
    const mezzPrinActual = Math.min(remaining, mezzPrinDue);
    remaining -= mezzPrinActual;
    mezzBal -= mezzPrinActual;
    mezzPrinPaid += mezzPrinActual;
    if (mezzPrinActual < mezzPrinDue) mezzShortfall += mezzPrinDue - mezzPrinActual;

    equityIntPaid += remaining;
    equityBal = Math.max(equityBal - periodLoss * (structure.equityPct / 100), 0);
  }

  const initSenior = noteBalance * (structure.seniorPct / 100);
  const initMezz = noteBalance * (structure.mezzaninePct / 100);
  const initEquity = noteBalance * (structure.equityPct / 100);

  const buildTranche = (
    name: 'Senior' | 'Mezzanine' | 'Equity',
    init: number, intPaid: number, prinPaid: number, endBal: number, shortfall: number,
  ): TrancheResult => {
    const annualDue = name === 'Equity' ? 0 : init * ((name === 'Senior' ? structure.seniorCoupon : structure.mezzanineCoupon) / 100);
    const coverage = annualDue > 0 ? (intPaid + prinPaid) / (annualDue + init / (periods / 12)) : (name === 'Equity' ? (equityIntPaid > 0 ? 999 : 0) : 999);
    return {
      tranche: name,
      initialBalance: Math.round(init),
      interestPaid: Math.round(intPaid),
      principalPaid: Math.round(prinPaid),
      endBalance: Math.round(endBal),
      shortfall: Math.round(shortfall),
      coverageRatio: Math.round(coverage * 100) / 100,
      status: shortfall <= 0 ? 'ok' : shortfall < init * 0.05 ? 'partial' : 'impaired',
    };
  };

  return {
    poolBalance: Math.round(poolBalance),
    totalCollections: Math.round(totalCollections),
    totalLosses: Math.round(totalLosses),
    lossRate,
    prepayRate,
    tranches: [
      buildTranche('Senior', initSenior, seniorIntPaid, seniorPrinPaid, seniorBal, seniorShortfall),
      buildTranche('Mezzanine', initMezz, mezzIntPaid, mezzPrinPaid, mezzBal, mezzShortfall),
      buildTranche('Equity', initEquity, equityIntPaid, 0, equityBal, 0),
    ],
    equityResidual: Math.round(equityIntPaid),
  };
}

export function runStressGrid(
  poolBalance: number,
  avgRate: number,
  structure: SecuritisationStructure,
  lossRates: number[] = [3, 6, 9, 12],
  prepayRates: number[] = [0, 10, 20, 30],
): { lossRate: number; prepayRate: number; result: WaterfallResult }[] {
  const grid: { lossRate: number; prepayRate: number; result: WaterfallResult }[] = [];
  for (const lr of lossRates) {
    for (const pr of prepayRates) {
      grid.push({ lossRate: lr, prepayRate: pr, result: runWaterfall(poolBalance, avgRate, structure, lr, pr) });
    }
  }
  return grid;
}

export function poolMetricsFromLoans(rows: LoanLevelRow[]) {
  const totalBalance = rows.reduce((s, r) => s + r.currentBalance, 0);
  const avgRate = rows.length > 0 ? rows.reduce((s, r) => s + r.interestRate, 0) / rows.length : 15;
  const avgTenure = rows.filter(r => r.residualTenureMonths != null).length > 0
    ? rows.filter(r => r.residualTenureMonths != null).reduce((s, r) => s + (r.residualTenureMonths || 0), 0) / rows.filter(r => r.residualTenureMonths != null).length
    : 12;
  return { totalBalance, avgRate, avgTenure };
}
