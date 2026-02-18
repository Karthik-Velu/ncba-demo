'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, BarChart3, PieChart } from 'lucide-react';
import Link from 'next/link';
import type { LoanLevelRow } from '@/lib/types';
import { generateMockLoanBook } from '@/lib/mockLoanBook';

function useLoanData(nbfiId: string, loanBookData: Record<string, LoanLevelRow[]>) {
  return useMemo(() => {
    const rows = loanBookData[nbfiId]?.length ? loanBookData[nbfiId] : generateMockLoanBook(120);
    return rows;
  }, [nbfiId, loanBookData]);
}

function RollRateTable({ rows }: { rows: LoanLevelRow[] }) {
  const buckets = ['0-30', '31-60', '61-90', '90+'];
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    buckets.forEach(b => (c[b] = 0));
    rows.forEach(r => {
      if (buckets.includes(r.dpdBucket)) c[r.dpdBucket]++;
    });
    return c;
  }, [rows]);
  const total = rows.length;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 font-medium text-gray-600">DPD bucket</th>
            {buckets.map(b => (
              <th key={b} className="text-right py-2 font-medium text-gray-600">{b}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-2">Loan count</td>
            {buckets.map(b => (
              <td key={b} className="text-right py-2">{counts[b] ?? 0}</td>
            ))}
          </tr>
          <tr>
            <td className="py-2">% of portfolio</td>
            {buckets.map(b => (
              <td key={b} className="text-right py-2">{total ? ((counts[b] ?? 0) / total * 100).toFixed(1) : 0}%</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function VintageTable({ rows }: { rows: LoanLevelRow[] }) {
  const byVintage = useMemo(() => {
    const map: Record<string, { count: number; dpd90: number }> = {};
    rows.forEach(r => {
      const y = r.disbursementDate.slice(0, 7);
      if (!map[y]) map[y] = { count: 0, dpd90: 0 };
      map[y].count++;
      if (['61-90', '90+'].includes(r.dpdBucket)) map[y].dpd90++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 font-medium text-gray-600">Vintage (disbursement)</th>
            <th className="text-right py-2 font-medium text-gray-600">Loans</th>
            <th className="text-right py-2 font-medium text-gray-600">60+ DPD count</th>
            <th className="text-right py-2 font-medium text-gray-600">% 60+ DPD</th>
          </tr>
        </thead>
        <tbody>
          {byVintage.map(([v, d]) => (
            <tr key={v} className="border-b border-gray-100">
              <td className="py-2">{v}</td>
              <td className="text-right py-2">{d.count}</td>
              <td className="text-right py-2">{d.dpd90}</td>
              <td className="text-right py-2">{d.count ? (d.dpd90 / d.count * 100).toFixed(1) : 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LossByBucketTable({ rows }: { rows: LoanLevelRow[] }) {
  const bySegment = useMemo(() => {
    const map: Record<string, { count: number; balance: number; estLoss: number }> = {};
    rows.forEach(r => {
      const seg = r.segment || r.product || 'Other';
      if (!map[seg]) map[seg] = { count: 0, balance: 0, estLoss: 0 };
      map[seg].count++;
      map[seg].balance += r.balance;
      if (['61-90', '90+'].includes(r.dpdBucket)) map[seg].estLoss += r.balance * 0.5;
      else if (r.dpdBucket === '31-60') map[seg].estLoss += r.balance * 0.15;
    });
    return Object.entries(map);
  }, [rows]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 font-medium text-gray-600">Segment</th>
            <th className="text-right py-2 font-medium text-gray-600">Loans</th>
            <th className="text-right py-2 font-medium text-gray-600">Balance (KES)</th>
            <th className="text-right py-2 font-medium text-gray-600">Est. loss %</th>
          </tr>
        </thead>
        <tbody>
          {bySegment.map(([seg, d]) => (
            <tr key={seg} className="border-b border-gray-100">
              <td className="py-2">{seg}</td>
              <td className="text-right py-2">{d.count}</td>
              <td className="text-right py-2">{d.balance.toLocaleString()}</td>
              <td className="text-right py-2">{d.balance ? (d.estLoss / d.balance * 100).toFixed(2) : 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EDAPage() {
  const { user, getNBFI, loanBookData } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [cut, setCut] = useState<'geography' | 'product' | 'segment' | 'loanSize'>('geography');

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);
  useEffect(() => {
    if (user && id && !nbfi) router.replace('/dashboard');
  }, [user, id, nbfi, router]);

  const rows = useLoanData(id, loanBookData);

  const cutSummary = useMemo(() => {
    const getKey = (r: LoanLevelRow): string => {
      if (cut === 'loanSize') return r.loanSize < 50000 ? '<50k' : r.loanSize < 150000 ? '50k-150k' : '150k+';
      if (cut === 'geography') return r.geography || 'Other';
      if (cut === 'product') return r.product || 'Other';
      if (cut === 'segment') return r.segment || 'Other';
      return 'Other';
    };
    const map: Record<string, number> = {};
    rows.forEach(r => {
      const k = getKey(r);
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [rows, cut]);

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
            <h1 className="text-xl font-bold text-gray-800">Portfolio EDA & quality assessment</h1>
            <p className="text-sm text-gray-500 mt-1">
              {nbfi.name} — {rows.length} loans. Use this to assess overall portfolio quality and identify the best security package.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/nbfi/${id}/loan-book`} className="text-sm text-gray-500 hover:text-gray-700">Upload</Link>
            <Link href={`/nbfi/${id}/selection`} className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99]">
              Asset selection
            </Link>
          </div>
        </div>

        <div className="grid gap-8">
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Roll rate analysis (30→60→90+ DPD)
            </h2>
            <RollRateTable rows={rows} />
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Vintage analysis (cohort performance)
            </h2>
            <VintageTable rows={rows} />
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4" /> Cuts by geography, product, segment, loan size
            </h2>
            <div className="flex gap-2 mb-4">
              {(['geography', 'product', 'segment', 'loanSize'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCut(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${cut === c ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {c === 'loanSize' ? 'Loan size' : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-600">{cut === 'loanSize' ? 'Bucket' : cut}</th>
                  <th className="text-right py-2 font-medium text-gray-600">Loan count</th>
                </tr>
              </thead>
              <tbody>
                {cutSummary.map(([k, v]) => (
                  <tr key={k} className="border-b border-gray-100">
                    <td className="py-2">{k}</td>
                    <td className="text-right py-2">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] mb-3">Estimated loss rates by bucket (segment)</h2>
            <LossByBucketTable rows={rows} />
          </section>
        </div>
      </main>
    </div>
  );
}
