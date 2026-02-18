'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Filter, CheckCircle2, Shield, Download, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { LoanLevelRow, PoolSelectionState } from '@/lib/types';
import { generateMockLoanBook } from '@/lib/mockLoanBook';

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

  const [kiScoreMax, setKiScoreMax] = useState(selection?.filterSnapshot?.kiScoreMax ?? 50);
  const [loanAmountMin, setLoanAmountMin] = useState(selection?.filterSnapshot?.loanAmountMin ?? 0);
  const [loanAmountMax, setLoanAmountMax] = useState(selection?.filterSnapshot?.loanAmountMax ?? 500000);
  const [excludedSegments, setExcludedSegments] = useState<string[]>(selection?.excludedSegments ?? []);
  const [confirmed, setConfirmed] = useState(!!selection?.confirmedAt);

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);
  useEffect(() => {
    if (user && id && !nbfi) router.replace('/dashboard');
  }, [user, id, nbfi, router]);

  const segmentsAvailable = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => set.add(r.segment || r.product || 'Other'));
    return Array.from(set).sort();
  }, [rows]);

  const toggleExclusion = (seg: string) => {
    setExcludedSegments(prev =>
      prev.includes(seg) ? prev.filter(s => s !== seg) : [...prev, seg]
    );
  };

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (excludedSegments.includes(r.segment || r.product || 'Other')) return false;
      if (r.kiScore != null && r.kiScore > kiScoreMax) return false;
      if (r.loanSize < loanAmountMin || r.loanSize > loanAmountMax) return false;
      return true;
    });
  }, [rows, excludedSegments, kiScoreMax, loanAmountMin, loanAmountMax]);

  const totalBalance = useMemo(() => filtered.reduce((s, r) => s + r.balance, 0), [filtered]);
  const excludedCount = rows.length - filtered.length;
  const excludedBalance = useMemo(
    () => rows.filter(r => !filtered.includes(r)).reduce((s, r) => s + r.balance, 0),
    [rows, filtered]
  );

  const poolMetrics = useMemo(() => {
    if (filtered.length === 0) return null;
    const avgKi = filtered.filter(r => r.kiScore != null).reduce((s, r) => s + (r.kiScore || 0), 0) / (filtered.filter(r => r.kiScore != null).length || 1);
    const avgRate = filtered.filter(r => r.interestRate != null).reduce((s, r) => s + (r.interestRate || 0), 0) / (filtered.filter(r => r.interestRate != null).length || 1);
    const par30 = filtered.filter(r => !['0-30'].includes(r.dpdBucket)).length;
    const geos = new Set(filtered.map(r => r.geography));
    const products = new Set(filtered.map(r => r.product));
    const avgTenure = filtered.filter(r => r.residualTenureMonths != null).reduce((s, r) => s + (r.residualTenureMonths || 0), 0) / (filtered.filter(r => r.residualTenureMonths != null).length || 1);

    return {
      avgKi: avgKi.toFixed(1),
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
        kiScoreMax,
        loanAmountMin,
        loanAmountMax,
        geographies: [],
        products: [],
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
            <h1 className="text-xl font-bold text-gray-800">Asset Selection & Exclusions</h1>
            <p className="text-sm text-gray-500 mt-1">
              {nbfi.name} — Define the collateral pool and security package
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/nbfi/${id}/eda`} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100">&larr; EDA</Link>
            <Link href={`/nbfi/${id}/loan-book`} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100">Upload</Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Selection Filters
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">KI Score max (lower is better)</label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={kiScoreMax}
                    onChange={e => setKiScoreMax(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#003366]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>10</span>
                    <span className="font-bold text-[#003366]">{kiScoreMax}</span>
                    <span>100</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Loan amount min (KES)</label>
                  <input
                    type="number"
                    min={0}
                    value={loanAmountMin}
                    onChange={e => setLoanAmountMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Loan amount max (KES)</label>
                  <input
                    type="number"
                    min={0}
                    value={loanAmountMax}
                    onChange={e => setLoanAmountMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/20 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Segment Exclusion */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] mb-2">Collateral Exclusions</h2>
              <p className="text-xs text-gray-500 mb-4">Click segments to exclude them from the security package (e.g. high-risk MSME loans)</p>
              <div className="flex flex-wrap gap-2">
                {segmentsAvailable.map(seg => (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => toggleExclusion(seg)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      excludedSegments.includes(seg)
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                    }`}
                  >
                    {excludedSegments.includes(seg) ? 'Excluded: ' : ''}{seg}
                  </button>
                ))}
              </div>
            </section>

            {/* Security Package Summary Artifact */}
            {confirmed && poolMetrics && (
              <section className="bg-white rounded-xl border-2 border-green-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-green-700 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Security Package Summary
                  </h2>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003366] text-white rounded-md text-xs font-medium hover:bg-[#004d99]">
                    <Download className="w-3 h-3" /> Export Report
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-[10px] text-green-600 uppercase tracking-wide">Selected Loans</p>
                    <p className="text-lg font-bold text-green-800">{filtered.length.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-[10px] text-green-600 uppercase tracking-wide">Pool Balance</p>
                    <p className="text-lg font-bold text-green-800">KES {(totalBalance / 1e6).toFixed(1)}M</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-[10px] text-green-600 uppercase tracking-wide">Coverage Ratio</p>
                    <p className="text-lg font-bold text-green-800">{poolMetrics.coverageRatio}%</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-[10px] text-green-600 uppercase tracking-wide">PAR 30+</p>
                    <p className="text-lg font-bold text-green-800">{poolMetrics.par30Pct}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pool Characteristics</h3>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-gray-100"><td className="py-1.5 text-gray-500">Avg KI Score</td><td className="py-1.5 text-right font-medium">{poolMetrics.avgKi}</td></tr>
                        <tr className="border-b border-gray-100"><td className="py-1.5 text-gray-500">Avg Interest Rate</td><td className="py-1.5 text-right font-medium">{poolMetrics.avgRate}%</td></tr>
                        <tr className="border-b border-gray-100"><td className="py-1.5 text-gray-500">Avg Residual Tenure</td><td className="py-1.5 text-right font-medium">{poolMetrics.avgTenure} months</td></tr>
                        <tr><td className="py-1.5 text-gray-500">Diversification</td><td className="py-1.5 text-right font-medium">{poolMetrics.geoCount} regions, {poolMetrics.productCount} products</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Exclusions Applied</h3>
                    {excludedSegments.length > 0 ? (
                      <div className="space-y-1.5">
                        {excludedSegments.map(seg => (
                          <div key={seg} className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            <span className="text-gray-700">{seg}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No segment exclusions</p>
                    )}
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-500">
                      <strong>Filter:</strong> KI Score &le; {kiScoreMax}, Loan: KES {loanAmountMin.toLocaleString()} – {loanAmountMax.toLocaleString()}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Panel */}
          <div>
            <section className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
              <h2 className="text-sm font-bold text-[#003366] mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Pool Summary
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total loans in book</span>
                  <span className="font-medium">{rows.length}</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected loans</span>
                  <span className="font-bold text-[#003366]">{filtered.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected balance</span>
                  <span className="font-bold text-[#003366]">KES {(totalBalance / 1e6).toFixed(1)}M</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Excluded loans</span>
                  <span>{excludedCount}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Excluded balance</span>
                  <span>KES {(excludedBalance / 1e6).toFixed(1)}M</span>
                </div>
                {nbfi && (
                  <>
                    <hr className="border-gray-100" />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Facility amount</span>
                      <span className="font-medium">KES {(nbfi.fundingAmount / 1e6).toFixed(0)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coverage ratio</span>
                      <span className={`font-bold ${totalBalance >= nbfi.fundingAmount ? 'text-green-600' : 'text-amber-600'}`}>
                        {nbfi.fundingAmount > 0 ? (totalBalance / nbfi.fundingAmount * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </>
                )}
              </div>
              {!confirmed ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="mt-6 w-full py-2.5 bg-[#003366] text-white rounded-lg text-sm font-semibold hover:bg-[#004d99] transition-colors"
                >
                  Confirm Security Package
                </button>
              ) : (
                <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Security package confirmed
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
