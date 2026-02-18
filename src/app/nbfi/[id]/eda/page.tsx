'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, BarChart3, PieChart, Shield, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { LoanLevelRow } from '@/lib/types';
import { generateMockLoanBook } from '@/lib/mockLoanBook';

function useLoanData(nbfiId: string, loanBookData: Record<string, LoanLevelRow[]>) {
  return useMemo(() => {
    const rows = loanBookData[nbfiId]?.length ? loanBookData[nbfiId] : generateMockLoanBook(120);
    return rows;
  }, [nbfiId, loanBookData]);
}

function PortfolioQualitySummary({ rows }: { rows: LoanLevelRow[] }) {
  const metrics = useMemo(() => {
    const totalBalance = rows.reduce((s, r) => s + r.balance, 0);
    const avgBalance = rows.length > 0 ? totalBalance / rows.length : 0;
    const par30Count = rows.filter(r => !['0-30'].includes(r.dpdBucket)).length;
    const par30Pct = rows.length > 0 ? (par30Count / rows.length * 100) : 0;
    const par90Count = rows.filter(r => ['61-90', '90+'].includes(r.dpdBucket)).length;
    const par90Pct = rows.length > 0 ? (par90Count / rows.length * 100) : 0;
    const avgKi = rows.filter(r => r.kiScore != null).reduce((s, r) => s + (r.kiScore || 0), 0) / (rows.filter(r => r.kiScore != null).length || 1);
    const avgRate = rows.filter(r => r.interestRate != null).reduce((s, r) => s + (r.interestRate || 0), 0) / (rows.filter(r => r.interestRate != null).length || 1);

    const geos = new Set(rows.map(r => r.geography));
    const products = new Set(rows.map(r => r.product));

    const qualityScore = Math.max(0, Math.min(100, 100 - par30Pct * 2 - par90Pct * 5));
    const qualityLabel = qualityScore >= 80 ? 'Strong' : qualityScore >= 60 ? 'Acceptable' : qualityScore >= 40 ? 'Watch' : 'Weak';
    const qualityColor = qualityScore >= 80 ? 'text-green-600' : qualityScore >= 60 ? 'text-blue-600' : qualityScore >= 40 ? 'text-amber-600' : 'text-red-600';

    return {
      totalBalance, avgBalance, par30Pct, par90Pct, avgKi, avgRate,
      geoCount: geos.size, productCount: products.size,
      qualityScore, qualityLabel, qualityColor, loanCount: rows.length,
    };
  }, [rows]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[#003366] flex items-center gap-2">
          <Shield className="w-4 h-4" /> Portfolio Quality Summary
        </h2>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
          metrics.qualityScore >= 80 ? 'bg-green-100 text-green-700' :
          metrics.qualityScore >= 60 ? 'bg-blue-100 text-blue-700' :
          metrics.qualityScore >= 40 ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {metrics.qualityScore >= 60 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {metrics.qualityLabel} ({metrics.qualityScore.toFixed(0)}/100)
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <MetricBox label="Total Loans" value={metrics.loanCount.toLocaleString()} />
        <MetricBox label="Total Balance" value={`KES ${(metrics.totalBalance / 1e6).toFixed(1)}M`} />
        <MetricBox label="Avg Loan Size" value={`KES ${Math.round(metrics.avgBalance).toLocaleString()}`} />
        <MetricBox label="Avg Interest Rate" value={`${metrics.avgRate.toFixed(1)}%`} />
        <MetricBox label="PAR 30+" value={`${metrics.par30Pct.toFixed(1)}%`} warn={metrics.par30Pct > 10} />
        <MetricBox label="PAR 90+" value={`${metrics.par90Pct.toFixed(1)}%`} warn={metrics.par90Pct > 5} />
        <MetricBox label="Avg KI Score" value={metrics.avgKi.toFixed(1)} warn={metrics.avgKi > 40} />
        <MetricBox label="Diversification" value={`${metrics.geoCount} regions, ${metrics.productCount} products`} />
      </div>
    </div>
  );
}

function MetricBox({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${warn ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${warn ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
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
  const balances = useMemo(() => {
    const b: Record<string, number> = {};
    buckets.forEach(bk => (b[bk] = 0));
    rows.forEach(r => {
      if (buckets.includes(r.dpdBucket)) b[r.dpdBucket] += r.balance;
    });
    return b;
  }, [rows]);
  const total = rows.length;
  const totalBal = rows.reduce((s, r) => s + r.balance, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 font-medium text-gray-600">DPD bucket</th>
            {buckets.map(b => (
              <th key={b} className="text-right py-2 font-medium text-gray-600">{b}</th>
            ))}
            <th className="text-right py-2 font-medium text-gray-600">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-2 font-medium">Loan count</td>
            {buckets.map(b => (
              <td key={b} className="text-right py-2">{counts[b] ?? 0}</td>
            ))}
            <td className="text-right py-2 font-bold">{total}</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-2 font-medium">% of portfolio</td>
            {buckets.map(b => (
              <td key={b} className="text-right py-2">{total ? ((counts[b] ?? 0) / total * 100).toFixed(1) : 0}%</td>
            ))}
            <td className="text-right py-2 font-bold">100%</td>
          </tr>
          <tr>
            <td className="py-2 font-medium">Balance (KES M)</td>
            {buckets.map(b => (
              <td key={b} className="text-right py-2 font-mono text-xs">{((balances[b] ?? 0) / 1e6).toFixed(1)}</td>
            ))}
            <td className="text-right py-2 font-bold font-mono text-xs">{(totalBal / 1e6).toFixed(1)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function VintageTable({ rows }: { rows: LoanLevelRow[] }) {
  const byVintage = useMemo(() => {
    const map: Record<string, { count: number; dpd90: number; balance: number }> = {};
    rows.forEach(r => {
      const y = r.disbursementDate.slice(0, 7);
      if (!map[y]) map[y] = { count: 0, dpd90: 0, balance: 0 };
      map[y].count++;
      map[y].balance += r.balance;
      if (['61-90', '90+'].includes(r.dpdBucket)) map[y].dpd90++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 font-medium text-gray-600">Vintage</th>
            <th className="text-right py-2 font-medium text-gray-600">Loans</th>
            <th className="text-right py-2 font-medium text-gray-600">Balance (KES)</th>
            <th className="text-right py-2 font-medium text-gray-600">60+ DPD</th>
            <th className="text-right py-2 font-medium text-gray-600">% 60+ DPD</th>
          </tr>
        </thead>
        <tbody>
          {byVintage.map(([v, d]) => (
            <tr key={v} className="border-b border-gray-100">
              <td className="py-2 font-mono text-xs">{v}</td>
              <td className="text-right py-2">{d.count}</td>
              <td className="text-right py-2 font-mono text-xs">{d.balance.toLocaleString()}</td>
              <td className="text-right py-2">{d.dpd90}</td>
              <td className="text-right py-2">
                <span className={d.count && (d.dpd90 / d.count * 100) > 5 ? 'text-red-600 font-semibold' : ''}>
                  {d.count ? (d.dpd90 / d.count * 100).toFixed(1) : 0}%
                </span>
              </td>
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
    return Object.entries(map).sort(([, a], [, b]) => b.balance - a.balance);
  }, [rows]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 font-medium text-gray-600">Segment</th>
            <th className="text-right py-2 font-medium text-gray-600">Loans</th>
            <th className="text-right py-2 font-medium text-gray-600">Balance (KES)</th>
            <th className="text-right py-2 font-medium text-gray-600">Est. Loss (KES)</th>
            <th className="text-right py-2 font-medium text-gray-600">Loss %</th>
          </tr>
        </thead>
        <tbody>
          {bySegment.map(([seg, d]) => (
            <tr key={seg} className="border-b border-gray-100">
              <td className="py-2 font-medium">{seg}</td>
              <td className="text-right py-2">{d.count}</td>
              <td className="text-right py-2 font-mono text-xs">{d.balance.toLocaleString()}</td>
              <td className="text-right py-2 font-mono text-xs">{d.estLoss.toLocaleString()}</td>
              <td className="text-right py-2">
                <span className={d.balance && (d.estLoss / d.balance * 100) > 5 ? 'text-red-600 font-semibold' : ''}>
                  {d.balance ? (d.estLoss / d.balance * 100).toFixed(2) : 0}%
                </span>
              </td>
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
      if (cut === 'loanSize') return r.loanSize < 50000 ? '<50k' : r.loanSize < 150000 ? '50k-150k' : r.loanSize < 300000 ? '150k-300k' : '300k+';
      if (cut === 'geography') return r.geography || 'Other';
      if (cut === 'product') return r.product || 'Other';
      if (cut === 'segment') return r.segment || 'Other';
      return 'Other';
    };
    const map: Record<string, { count: number; balance: number }> = {};
    rows.forEach(r => {
      const k = getKey(r);
      if (!map[k]) map[k] = { count: 0, balance: 0 };
      map[k].count++;
      map[k].balance += r.balance;
    });
    return Object.entries(map).sort(([, a], [, b]) => b.balance - a.balance);
  }, [rows, cut]);

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
            <h1 className="text-xl font-bold text-gray-800">Portfolio EDA & Quality Assessment</h1>
            <p className="text-sm text-gray-500 mt-1">
              {nbfi.name} — {rows.length} loans analyzed
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/nbfi/${id}/loan-book`} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100">Upload</Link>
            <Link href={`/nbfi/${id}/selection`} className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99]">
              Asset Selection &rarr;
            </Link>
          </div>
        </div>

        <PortfolioQualitySummary rows={rows} />

        <div className="grid gap-8">
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Roll Rate Analysis (DPD Buckets)
            </h2>
            <RollRateTable rows={rows} />
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Vintage Analysis (Cohort Performance)
            </h2>
            <VintageTable rows={rows} />
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4" /> Portfolio Composition
            </h2>
            <div className="flex gap-2 mb-4">
              {(['geography', 'product', 'segment', 'loanSize'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCut(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${cut === c ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {c === 'loanSize' ? 'Loan Size' : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-600">{cut === 'loanSize' ? 'Bucket' : cut.charAt(0).toUpperCase() + cut.slice(1)}</th>
                  <th className="text-right py-2 font-medium text-gray-600">Loans</th>
                  <th className="text-right py-2 font-medium text-gray-600">Balance (KES)</th>
                  <th className="text-right py-2 font-medium text-gray-600">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {cutSummary.map(([k, v]) => {
                  const totalBal = rows.reduce((s, r) => s + r.balance, 0);
                  return (
                    <tr key={k} className="border-b border-gray-100">
                      <td className="py-2 font-medium">{k}</td>
                      <td className="text-right py-2">{v.count}</td>
                      <td className="text-right py-2 font-mono text-xs">{v.balance.toLocaleString()}</td>
                      <td className="text-right py-2">{totalBal > 0 ? (v.balance / totalBal * 100).toFixed(1) : 0}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] mb-3">Estimated Loss by Segment</h2>
            <LossByBucketTable rows={rows} />
          </section>
        </div>
      </main>
    </div>
  );
}
