'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Filter, CheckCircle2 } from 'lucide-react';
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
      <main className="flex-1 p-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Asset selection & exclusions</h1>
            <p className="text-sm text-gray-500 mt-1">
              {nbfi.name} — Define the collateral pool. Exclude segments (e.g. MSME) and apply filters to identify the best security package.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/nbfi/${id}/eda`} className="text-sm text-gray-500 hover:text-gray-700">EDA</Link>
            <Link href={`/nbfi/${id}/loan-book`} className="text-sm text-gray-500 hover:text-gray-700">Upload</Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">KI Score max (lower is better)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={kiScoreMax}
                    onChange={e => setKiScoreMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Loan amount min (KES)</label>
                  <input
                    type="number"
                    min={0}
                    value={loanAmountMin}
                    onChange={e => setLoanAmountMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Loan amount max (KES)</label>
                  <input
                    type="number"
                    min={0}
                    value={loanAmountMax}
                    onChange={e => setLoanAmountMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] mb-4">Exclude from collateral</h2>
              <p className="text-xs text-gray-500 mb-3">Exclude specific segments (e.g. MSME if underperforming) from the security package.</p>
              <div className="flex flex-wrap gap-2">
                {segmentsAvailable.map(seg => (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => toggleExclusion(seg)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      excludedSegments.includes(seg)
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {excludedSegments.includes(seg) ? 'Exclude: ' : ''}{seg}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div>
            <section className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
              <h2 className="text-sm font-bold text-[#003366] mb-4">Pool summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected loans</span>
                  <span className="font-medium">{filtered.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected balance</span>
                  <span className="font-medium">KES {totalBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Excluded loans</span>
                  <span>{excludedCount}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Excluded balance</span>
                  <span>KES {excludedBalance.toLocaleString()}</span>
                </div>
              </div>
              {!confirmed ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="mt-6 w-full py-2.5 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99]"
                >
                  Confirm security package
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
