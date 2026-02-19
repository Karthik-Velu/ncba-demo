import { LoanLevelRow, PoolSelectionState, getDpdBucket } from './types';

export function applyPoolSelection(
  rows: LoanLevelRow[],
  selection: PoolSelectionState | undefined,
): LoanLevelRow[] {
  if (!selection || !selection.confirmedAt) return rows;
  const f = selection.filterSnapshot;
  const excl = selection.excludedSegments;
  return rows.filter(r => {
    if (excl.includes(r.segment || r.product || 'Other')) return false;
    if (f.loanAmountMin != null && r.loanDisbursedAmount < f.loanAmountMin) return false;
    if (f.loanAmountMax != null && r.loanDisbursedAmount > f.loanAmountMax) return false;
    if (f.tenureMin != null && r.residualTenureMonths != null && r.residualTenureMonths < f.tenureMin) return false;
    if (f.tenureMax != null && r.residualTenureMonths != null && r.residualTenureMonths > f.tenureMax) return false;
    if (f.rateMin != null && r.interestRate < f.rateMin) return false;
    if (f.rateMax != null && r.interestRate > f.rateMax) return false;
    if (f.geographies.length > 0 && !f.geographies.includes(r.geography || 'Unknown')) return false;
    if (f.products.length > 0 && !f.products.includes(r.product || 'Unknown')) return false;
    if (f.dpdBuckets && f.dpdBuckets.length > 0 && !f.dpdBuckets.includes(getDpdBucket(r.dpdAsOfReportingDate))) return false;
    return true;
  });
}

export function applyPoolSelectionForPortfolio<T extends LoanLevelRow & { _nbfiId?: string }>(
  rows: T[],
  selectedPoolByNbfi: Record<string, PoolSelectionState>,
): T[] {
  return rows.filter(r => {
    const nbfiId = r._nbfiId ?? '';
    const sel = selectedPoolByNbfi[nbfiId];
    if (!sel || !sel.confirmedAt) return true;
    const f = sel.filterSnapshot;
    const excl = sel.excludedSegments;
    if (excl.includes(r.segment || r.product || 'Other')) return false;
    if (f.loanAmountMin != null && r.loanDisbursedAmount < f.loanAmountMin) return false;
    if (f.loanAmountMax != null && r.loanDisbursedAmount > f.loanAmountMax) return false;
    if (f.tenureMin != null && r.residualTenureMonths != null && r.residualTenureMonths < f.tenureMin) return false;
    if (f.tenureMax != null && r.residualTenureMonths != null && r.residualTenureMonths > f.tenureMax) return false;
    if (f.rateMin != null && r.interestRate < f.rateMin) return false;
    if (f.rateMax != null && r.interestRate > f.rateMax) return false;
    if (f.geographies.length > 0 && !f.geographies.includes(r.geography || 'Unknown')) return false;
    if (f.products.length > 0 && !f.products.includes(r.product || 'Unknown')) return false;
    if (f.dpdBuckets && f.dpdBuckets.length > 0 && !f.dpdBuckets.includes(getDpdBucket(r.dpdAsOfReportingDate))) return false;
    return true;
  });
}
