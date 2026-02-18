'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Filter, CheckCircle2, Shield, Download, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { LoanLevelRow, PoolSelectionState } from '@/lib/types';
import { getDpdBucket, DPD_BUCKETS } from '@/lib/types';
import { generateMockLoanBook } from '@/lib/mockLoanBook';

const LOSS_RATES: Record<string, number> = {
  'Current': 0, '1-30': 0.01, '31-60': 0.10, '61-90': 0.25, '91-180': 0.50, '180+': 1.0,
};

function estimateLoss(rows: LoanLevelRow[]): { amount: number; rate: number } {
  let totalBal = 0, totalLoss = 0;
  for (const r of rows) {
    const bucket = getDpdBucket(r.dpdAsOfReportingDate);
    totalBal += r.currentBalance;
    totalLoss += r.currentBalance * (LOSS_RATES[bucket] ?? 0);
  }
  return { amount: totalLoss, rate: totalBal > 0 ? totalLoss / totalBal : 0 };
}

function useLoanData(nbfiId: string, loanBookData: Record<string, LoanLevelRow[]>) {
  return useMemo(() => {
    return loanBookData[nbfiId]?.length ? loanBookData[nbfiId] : generateMockLoanBook(120);
  }, [nbfiId, loanBookData]);
}

export default function SelectionPage() {
  const { user, getNBFI, loanBookData, selectedPoolByNbfi, setPoolSelection } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const rows = useLoanData(id, loanBookData);
  const selection = selectedPoolByNbfi[id];

  const [loanAmountMin, setLoanAmountMin] = useState(selection?.filterSnapshot?.loanAmountMin ?? 0);
  const [loanAmountMax, setLoanAmountMax] = useState(selection?.filterSnapshot?.loanAmountMax ?? 500000);
  const [tenureMin, setTenureMin] = useState(selection?.filterSnapshot?.tenureMin ?? 0);
  const [tenureMax, setTenureMax] = useState(selection?.filterSnapshot?.tenureMax ?? 36);
  const [rateMin, setRateMin] = useState(selection?.filterSnapshot?.rateMin ?? 0);
  const [rateMax, setRateMax] = useState(selection?.filterSnapshot?.rateMax ?? 30);
  const [selectedGeos, setSelectedGeos] = useState<string[]>(selection?.filterSnapshot?.geographies ?? []);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(selection?.filterSnapshot?.products ?? []);
  const [selectedDpdBuckets, setSelectedDpdBuckets] = useState<string[]>(selection?.filterSnapshot?.dpdBuckets ?? []);
  const [excludedSegments, setExcludedSegments] = useState<string[]>(selection?.excludedSegments ?? []);
  const [confirmed, setConfirmed] = useState(!!selection?.confirmedAt);

  useEffect(() => { if (!user) router.push('/'); }, [user, router]);
  const nbfi = getNBFI(id);
  useEffect(() => { if (user && id && !nbfi) router.replace('/dashboard'); }, [user, id, nbfi, router]);

  const geoOptions = useMemo(() => [...new Set(rows.map(r => r.geography || 'Unknown'))].sort(), [rows]);
  const prodOptions = useMemo(() => [...new Set(rows.map(r => r.product || 'Unknown'))].sort(), [rows]);
  const segOptions = useMemo(() => [...new Set(rows.map(r => r.segment || r.product || 'Other'))].sort(), [rows]);

  const toggleExclusion = (seg: string) => {
    setExcludedSegments(prev => prev.includes(seg) ? prev.filter(s => s !== seg) : [...prev, seg]);
  };
  const toggleGeo = (g: string) => setSelectedGeos(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);
  const toggleProduct = (p: string) => setSelectedProducts(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleDpd = (b: string) => setSelectedDpdBuckets(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (excludedSegments.includes(r.segment || r.product || 'Other')) return false;
      if (r.loanDisbursedAmount < loanAmountMin || r.loanDisbursedAmount > loanAmountMax) return false;
      if (r.residualTenureMonths != null && (r.residualTenureMonths < tenureMin || r.residualTenureMonths > tenureMax)) return false;
      if (r.interestRate < rateMin || r.interestRate > rateMax) return false;
      if (selectedGeos.length > 0 && !selectedGeos.includes(r.geography || 'Unknown')) return false;
      if (selectedProducts.length > 0 && !selectedProducts.includes(r.product || 'Unknown')) return false;
      if (selectedDpdBuckets.length > 0 && !selectedDpdBuckets.includes(getDpdBucket(r.dpdAsOfReportingDate))) return false;
      return true;
    });
  }, [rows, excludedSegments, loanAmountMin, loanAmountMax, tenureMin, tenureMax, rateMin, rateMax, selectedGeos, selectedProducts, selectedDpdBuckets]);

  const totalBalance = useMemo(() => filtered.reduce((s, r) => s + r.currentBalance, 0), [filtered]);
  const excludedCount = rows.length - filtered.length;
  const excludedBalance = useMemo(
    () => rows.filter(r => !filtered.includes(r)).reduce((s, r) => s + r.currentBalance, 0),
    [rows, filtered]
  );

  const loss = useMemo(() => estimateLoss(filtered), [filtered]);

  const poolMetrics = useMemo(() => {
    if (filtered.length === 0) return null;
    const avgRate = filtered.reduce((s, r) => s + r.interestRate, 0) / filtered.length;
    const par30 = filtered.filter(r => r.dpdAsOfReportingDate > 30).length;
    const geos = new Set(filtered.map(r => r.geography));
    const products = new Set(filtered.map(r => r.product));
    const avgTenure = filtered.filter(r => r.residualTenureMonths != null).reduce((s, r) => s + (r.residualTenureMonths || 0), 0) /
      (filtered.filter(r => r.residualTenureMonths != null).length || 1);
    return {
      avgRate: avgRate.toFixed(1),
      par30Pct: (par30 / filtered.length * 100).toFixed(1),
      geoCount: geos.size,
      productCount: products.size,
      avgTenure: avgTenure.toFixed(0),
      coverageRatio: totalBalance > 0 ? ((totalBalance / (nbfi?.fundingAmount || 1)) * 100).toFixed(0) : '0',
    };
  }, [filtered, totalBalance, nbfi]);

  const handleConfirm = () => {
    const state: PoolSelectionState = {
      excludedSegments: [...excludedSegments],
      filterSnapshot: {
        loanAmountMin, loanAmountMax, tenureMin, tenureMax, rateMin, rateMax,
        dpdBuckets: selectedDpdBuckets.length > 0 ? [...selectedDpdBuckets] : undefined,
        geographies: [...selectedGeos],
        products: [...selectedProducts],
      },
      confirmedAt: new Date().toISOString(),
    };
    setPoolSelection(id, state);
    setConfirmed(true);
  };

  if (!user || !nbfi) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Asset Selection &amp; Exclusions</h1>
            <p className="text-sm text-gray-500 mt-1">{nbfi.name} — Define the collateral pool and security package</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/nbfi/${id}/eda`} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100">&larr; EDA</Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] mb-4 flex items-center gap-2"><Filter className="w-4 h-4" /> Selection Filters</h2>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Loan amount min (KES)</label>
                  <input type="number" min={0} value={loanAmountMin} onChange={e => setLoanAmountMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Loan amount max (KES)</label>
                  <input type="number" min={0} value={loanAmountMax} onChange={e => setLoanAmountMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Interest Rate range (%)</label>
                  <div className="flex gap-2">
                    <input type="number" min={0} max={50} value={rateMin} onChange={e => setRateMin(Number(e.target.value))}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Min" />
                    <input type="number" min={0} max={50} value={rateMax} onChange={e => setRateMax(Number(e.target.value))}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Residual Tenure (months)</label>
                  <div className="flex gap-2">
                    <input type="number" min={0} value={tenureMin} onChange={e => setTenureMin(Number(e.target.value))}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Min" />
                    <input type="number" min={0} value={tenureMax} onChange={e => setTenureMax(Number(e.target.value))}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Max" />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Geography</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {geoOptions.map(g => (
                      <button key={g} onClick={() => toggleGeo(g)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${selectedGeos.includes(g) ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Product / Purpose</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {prodOptions.map(p => (
                      <button key={p} onClick={() => toggleProduct(p)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${selectedProducts.includes(p) ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">DPD Buckets (include only)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DPD_BUCKETS.map(b => (
                      <button key={b} onClick={() => toggleDpd(b)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${selectedDpdBuckets.includes(b) ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Segment Exclusion */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] mb-2">Collateral Exclusions</h2>
              <p className="text-xs text-gray-500 mb-4">Click segments to exclude them from the security package</p>
              <div className="flex flex-wrap gap-2">
                {segOptions.map(seg => (
                  <button key={seg} type="button" onClick={() => toggleExclusion(seg)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      excludedSegments.includes(seg) ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                    }`}>
                    {excludedSegments.includes(seg) ? 'Excluded: ' : ''}{seg}
                  </button>
                ))}
              </div>
            </section>

            {/* Security Package Summary */}
            {confirmed && poolMetrics && (
              <section className="bg-white rounded-xl border-2 border-[#003366] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-[#003366]" />
                  <h2 className="text-sm font-bold text-[#003366]">Confirmed Security Package</h2>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <MetricBox label="Selected Loans" value={filtered.length.toLocaleString()} />
                  <MetricBox label="Pool Balance" value={`KES ${(totalBalance / 1e6).toFixed(1)}M`} />
                  <MetricBox label="Coverage Ratio" value={`${poolMetrics.coverageRatio}%`} />
                  <MetricBox label="PAR 30+" value={`${poolMetrics.par30Pct}%`} />
                  <MetricBox label="Avg Interest Rate" value={`${poolMetrics.avgRate}%`} />
                  <MetricBox label="Avg Residual Tenure" value={`${poolMetrics.avgTenure} months`} />
                  <MetricBox label="Est. Loss Rate" value={`${(loss.rate * 100).toFixed(2)}%`} />
                  <MetricBox label="Diversification" value={`${poolMetrics.geoCount} regions, ${poolMetrics.productCount} products`} />
                </div>
                <div className="text-xs text-gray-500">
                  <p>Exclusions: {excludedSegments.length > 0 ? excludedSegments.join(', ') : 'None'}</p>
                  <p>Filters: Amount {loanAmountMin.toLocaleString()}–{loanAmountMax.toLocaleString()}, Rate {rateMin}–{rateMax}%
                    {selectedGeos.length > 0 ? `, Geo: ${selectedGeos.join(', ')}` : ''}
                    {selectedProducts.length > 0 ? `, Products: ${selectedProducts.join(', ')}` : ''}
                    {selectedDpdBuckets.length > 0 ? `, DPD: ${selectedDpdBuckets.join(', ')}` : ''}
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Right Panel - Pool Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-sm font-bold text-[#003366] mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Pool Summary
              </h3>
              <div className="space-y-3 text-sm">
                <SummaryRow label="Total loans" value={rows.length.toLocaleString()} />
                <SummaryRow label="Selected loans" value={filtered.length.toLocaleString()} highlight />
                <SummaryRow label="Selected balance" value={`KES ${(totalBalance / 1e6).toFixed(1)}M`} highlight />
                <SummaryRow label="Excluded loans" value={excludedCount.toLocaleString()} muted />
                <SummaryRow label="Excluded balance" value={`KES ${(excludedBalance / 1e6).toFixed(1)}M`} muted />
                <div className="border-t border-gray-200 pt-3">
                  <SummaryRow label="Facility amount" value={`KES ${((nbfi?.fundingAmount || 0) / 1e6).toFixed(0)}M`} />
                  <SummaryRow label="Coverage ratio" value={poolMetrics ? `${poolMetrics.coverageRatio}%` : '—'} />
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <SummaryRow label="Est. Loss Amount" value={`KES ${(loss.amount / 1e6).toFixed(1)}M`} />
                  <SummaryRow label="Est. Loss Rate" value={`${(loss.rate * 100).toFixed(2)}%`} highlight={loss.rate > 0.05} />
                </div>
                {poolMetrics && (
                  <div className="border-t border-gray-200 pt-3">
                    <SummaryRow label="Avg Interest Rate" value={`${poolMetrics.avgRate}%`} />
                    <SummaryRow label="PAR 30+" value={`${poolMetrics.par30Pct}%`} />
                    <SummaryRow label="Avg Tenure" value={`${poolMetrics.avgTenure} mo`} />
                    <SummaryRow label="Diversification" value={`${poolMetrics.geoCount} geo, ${poolMetrics.productCount} prod`} />
                  </div>
                )}
              </div>
              <button onClick={handleConfirm} disabled={confirmed || filtered.length === 0}
                className="mt-6 w-full py-3 bg-[#003366] text-white rounded-lg font-medium text-sm hover:bg-[#004d99] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {confirmed ? <><CheckCircle2 className="w-4 h-4" /> Pool Confirmed</> : 'Confirm Security Package'}
              </button>
              {confirmed && (
                <button className="mt-2 w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Export Pool Details
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold mt-0.5 text-gray-900">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-xs ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-[#003366]' : muted ? 'text-gray-400' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}
