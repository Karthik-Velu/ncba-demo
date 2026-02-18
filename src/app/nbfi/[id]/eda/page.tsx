'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, BarChart3, Shield, TrendingUp, AlertTriangle, CheckCircle2, Filter, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import type { LoanLevelRow } from '@/lib/types';
import { getDpdBucket, DPD_BUCKETS } from '@/lib/types';
import { generateMockLoanBook } from '@/lib/mockLoanBook';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

const LOSS_RATES: Record<string, number> = {
  'Current': 0, '1-30': 0.01, '31-60': 0.10, '61-90': 0.25, '91-180': 0.50, '180+': 1.0,
};

const TRANSITION_MATRIX: Record<string, Record<string, number>> = {
  'Current': { 'Current': 0.92, '1-30': 0.08 },
  '1-30':    { 'Current': 0.40, '1-30': 0.30, '31-60': 0.30 },
  '31-60':   { '1-30': 0.15, '31-60': 0.35, '61-90': 0.50 },
  '61-90':   { '31-60': 0.05, '61-90': 0.25, '91-180': 0.70 },
  '91-180':  { '91-180': 0.20, '180+': 0.80 },
  '180+':    { '180+': 1.0 },
};

const COLORS = ['#003366', '#0066cc', '#0099ff', '#e67300', '#cc3333', '#990000'];
const TICKET_SIZES = ['<50K', '50-100K', '100-200K', '200K+'] as const;

function ticketBucket(amount: number): string {
  if (amount < 50000) return '<50K';
  if (amount < 100000) return '50-100K';
  if (amount < 200000) return '100-200K';
  return '200K+';
}

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

function MultiSelect({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === 0 || selected.length === options.length;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 min-w-[140px]">
        <span className="text-gray-500 text-xs">{label}:</span>
        <span className="font-medium text-gray-800 truncate">{allSelected ? 'All' : `${selected.length} selected`}</span>
        <ChevronDown className="w-3 h-3 text-gray-400 ml-auto" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-56 max-h-60 overflow-y-auto">
          <button onClick={() => { onChange([]); }} className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50">
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selected.length === 0 || selected.includes(opt)}
                onChange={() => {
                  if (selected.length === 0) onChange(options.filter(o => o !== opt));
                  else if (selected.includes(opt)) {
                    const next = selected.filter(s => s !== opt);
                    onChange(next.length === 0 ? [] : next);
                  } else {
                    const next = [...selected, opt];
                    onChange(next.length === options.length ? [] : next);
                  }
                }}
                className="rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
              />
              {opt}
            </label>
          ))}
          <button onClick={() => setOpen(false)} className="w-full text-center text-xs text-gray-500 py-1 border-t mt-1">Close</button>
        </div>
      )}
    </div>
  );
}

export default function EDAPage() {
  const { user, getNBFI, loanBookData } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const allRows = useLoanData(id, loanBookData);

  const [geoFilter, setGeoFilter] = useState<string[]>([]);
  const [prodFilter, setProdFilter] = useState<string[]>([]);
  const [segFilter, setSegFilter] = useState<string[]>([]);
  const [dpdFilter, setDpdFilter] = useState<string[]>([]);
  const [ticketFilter, setTicketFilter] = useState<string[]>([]);
  const [dimTab, setDimTab] = useState<'geography' | 'product' | 'segment' | 'loanSize'>('geography');

  useEffect(() => { if (!user) router.push('/'); }, [user, router]);
  const nbfi = getNBFI(id);
  useEffect(() => { if (user && id && !nbfi) router.replace('/dashboard'); }, [user, id, nbfi, router]);

  const geoOptions = useMemo(() => [...new Set(allRows.map(r => r.geography || 'Unknown'))].sort(), [allRows]);
  const prodOptions = useMemo(() => [...new Set(allRows.map(r => r.product || 'Unknown'))].sort(), [allRows]);
  const segOptions = useMemo(() => [...new Set(allRows.map(r => r.segment || 'Unknown'))].sort(), [allRows]);

  const rows = useMemo(() => {
    return allRows.filter(r => {
      if (geoFilter.length && !geoFilter.includes(r.geography || 'Unknown')) return false;
      if (prodFilter.length && !prodFilter.includes(r.product || 'Unknown')) return false;
      if (segFilter.length && !segFilter.includes(r.segment || 'Unknown')) return false;
      if (dpdFilter.length && !dpdFilter.includes(getDpdBucket(r.dpdAsOfReportingDate))) return false;
      if (ticketFilter.length && !ticketFilter.includes(ticketBucket(r.loanDisbursedAmount))) return false;
      return true;
    });
  }, [allRows, geoFilter, prodFilter, segFilter, dpdFilter, ticketFilter]);

  const quality = useMemo(() => {
    const totalBal = rows.reduce((s, r) => s + r.currentBalance, 0);
    const par30 = rows.filter(r => r.dpdAsOfReportingDate > 30).length;
    const par90 = rows.filter(r => r.dpdAsOfReportingDate > 90).length;
    const writeOff = rows.filter(r => r.loanWrittenOff).length;
    const avgRate = rows.length > 0 ? rows.reduce((s, r) => s + r.interestRate, 0) / rows.length : 0;
    const geos = new Set(rows.map(r => r.geography));
    const prods = new Set(rows.map(r => r.product));
    return {
      totalLoans: rows.length, totalBal, avgBal: rows.length > 0 ? totalBal / rows.length : 0,
      avgRate, par30Pct: rows.length > 0 ? par30 / rows.length * 100 : 0,
      par90Pct: rows.length > 0 ? par90 / rows.length * 100 : 0,
      writeOffRate: rows.length > 0 ? writeOff / rows.length * 100 : 0,
      geoCount: geos.size, prodCount: prods.size,
    };
  }, [rows]);

  const loss = useMemo(() => estimateLoss(rows), [rows]);

  const bucketDistribution = useMemo(() => {
    const map: Record<string, { count: number; balance: number }> = {};
    DPD_BUCKETS.forEach(b => (map[b] = { count: 0, balance: 0 }));
    rows.forEach(r => {
      const b = getDpdBucket(r.dpdAsOfReportingDate);
      if (map[b]) { map[b].count++; map[b].balance += r.currentBalance; }
    });
    return DPD_BUCKETS.map(b => ({ bucket: b, ...map[b] }));
  }, [rows]);

  const rollRateProjection = useMemo(() => {
    const current: Record<string, number> = {};
    DPD_BUCKETS.forEach(b => (current[b] = 0));
    rows.forEach(r => { current[getDpdBucket(r.dpdAsOfReportingDate)] += r.currentBalance; });

    const periods = [{ ...current }];
    for (let p = 0; p < 2; p++) {
      const next: Record<string, number> = {};
      DPD_BUCKETS.forEach(b => (next[b] = 0));
      for (const from of DPD_BUCKETS) {
        const trans = TRANSITION_MATRIX[from] || {};
        for (const [to, pct] of Object.entries(trans)) {
          next[to] = (next[to] || 0) + (periods[periods.length - 1][from] || 0) * pct;
        }
      }
      periods.push(next);
    }

    return periods.map((p, i) => ({
      period: i === 0 ? 'Current' : `Period ${i}`,
      ...Object.fromEntries(DPD_BUCKETS.map(b => [b, Math.round(p[b] || 0)])),
    }));
  }, [rows]);

  const vintageData = useMemo(() => {
    const map: Record<string, { count: number; disbursed: number; balance: number; dpd30: number; dpd90: number }> = {};
    rows.forEach(r => {
      const q = r.loanDisbursedDate.slice(0, 4) + '-Q' + (Math.ceil((parseInt(r.loanDisbursedDate.slice(5, 7)) || 1) / 3));
      if (!map[q]) map[q] = { count: 0, disbursed: 0, balance: 0, dpd30: 0, dpd90: 0 };
      map[q].count++;
      map[q].disbursed += r.loanDisbursedAmount;
      map[q].balance += r.currentBalance;
      if (r.dpdAsOfReportingDate > 30) map[q].dpd30++;
      if (r.dpdAsOfReportingDate > 90) map[q].dpd90++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([vintage, d]) => ({
      vintage, ...d,
      dpd30Pct: d.count > 0 ? d.dpd30 / d.count * 100 : 0,
      dpd90Pct: d.count > 0 ? d.dpd90 / d.count * 100 : 0,
      estLossRate: d.balance > 0 ? estimateLoss(rows.filter(r =>
        (r.loanDisbursedDate.slice(0, 4) + '-Q' + Math.ceil((parseInt(r.loanDisbursedDate.slice(5, 7)) || 1) / 3)) === vintage
      )).rate * 100 : 0,
    }));
  }, [rows]);

  const vintageCurveData = useMemo(() => {
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
        const simRate = total > 0 ? (defaulted / total * 100) * Math.min(mob / 12, 1.0) : 0;
        mobPoints[`${mob}`][v] = Math.round(simRate * 100) / 100;
      }
    }
    return { vintages, data: Object.entries(mobPoints).map(([mob, vals]) => ({ mob: parseInt(mob), ...vals })) };
  }, [rows]);

  const dimData = useMemo(() => {
    const compute = (keyFn: (r: LoanLevelRow) => string) => {
      const map: Record<string, { count: number; balance: number; dpd30: number; dpd90: number }> = {};
      rows.forEach(r => {
        const k = keyFn(r);
        if (!map[k]) map[k] = { count: 0, balance: 0, dpd30: 0, dpd90: 0 };
        map[k].count++;
        map[k].balance += r.currentBalance;
        if (r.dpdAsOfReportingDate > 30) map[k].dpd30++;
        if (r.dpdAsOfReportingDate > 90) map[k].dpd90++;
      });
      return Object.entries(map).map(([name, d]) => ({
        name, ...d,
        par30: d.count > 0 ? d.dpd30 / d.count * 100 : 0,
        par90: d.count > 0 ? d.dpd90 / d.count * 100 : 0,
        estLoss: estimateLoss(rows.filter(r => keyFn(r) === name)).rate * 100,
      })).sort((a, b) => b.estLoss - a.estLoss);
    };
    return {
      geography: compute(r => r.geography || 'Unknown'),
      product: compute(r => r.product || 'Unknown'),
      segment: compute(r => r.segment || 'Unknown'),
      loanSize: compute(r => ticketBucket(r.loanDisbursedAmount)),
    };
  }, [rows]);

  if (!user || !nbfi) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-gray-50">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Portfolio EDA &amp; Quality Assessment</h1>
            <p className="text-sm text-gray-500 mt-1">{nbfi.name} — {rows.length} loans (filtered from {allRows.length})</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/nbfi/${id}/loan-book`} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100">&larr; Upload</Link>
            <Link href={`/nbfi/${id}/selection`} className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99]">Asset Selection &rarr;</Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-[#003366]" />
            <span className="text-sm font-bold text-[#003366]">Filters</span>
            {(geoFilter.length > 0 || prodFilter.length > 0 || segFilter.length > 0 || dpdFilter.length > 0 || ticketFilter.length > 0) && (
              <button onClick={() => { setGeoFilter([]); setProdFilter([]); setSegFilter([]); setDpdFilter([]); setTicketFilter([]); }}
                className="text-xs text-red-500 hover:text-red-700 ml-2">Clear all</button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <MultiSelect label="Geography" options={geoOptions} selected={geoFilter} onChange={setGeoFilter} />
            <MultiSelect label="Product" options={prodOptions} selected={prodFilter} onChange={setProdFilter} />
            <MultiSelect label="Segment" options={segOptions} selected={segFilter} onChange={setSegFilter} />
            <MultiSelect label="DPD Bucket" options={[...DPD_BUCKETS]} selected={dpdFilter} onChange={setDpdFilter} />
            <MultiSelect label="Ticket Size" options={[...TICKET_SIZES]} selected={ticketFilter} onChange={setTicketFilter} />
          </div>
        </div>

        {/* Quality Summary + Estimated Loss */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] flex items-center gap-2 mb-4"><Shield className="w-4 h-4" /> Portfolio Quality Summary</h2>
            <div className="grid grid-cols-4 gap-3">
              <Metric label="Total Loans" value={quality.totalLoans.toLocaleString()} />
              <Metric label="Total Balance" value={`KES ${(quality.totalBal / 1e6).toFixed(1)}M`} />
              <Metric label="Avg Loan Size" value={`KES ${Math.round(quality.avgBal).toLocaleString()}`} />
              <Metric label="Avg Interest Rate" value={`${quality.avgRate.toFixed(1)}%`} />
              <Metric label="PAR 30+" value={`${quality.par30Pct.toFixed(1)}%`} warn={quality.par30Pct > 10} />
              <Metric label="PAR 90+" value={`${quality.par90Pct.toFixed(1)}%`} warn={quality.par90Pct > 5} />
              <Metric label="Write-off Rate" value={`${quality.writeOffRate.toFixed(1)}%`} warn={quality.writeOffRate > 2} />
              <Metric label="Diversification" value={`${quality.geoCount} regions, ${quality.prodCount} products`} />
            </div>
          </div>
          <div className={`rounded-xl border p-6 ${loss.rate > 0.05 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <h2 className="text-sm font-bold text-[#003366] flex items-center gap-2 mb-4">
              {loss.rate > 0.05 ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
              Estimated Loss Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Expected Loss Amount</p>
                <p className="text-2xl font-bold text-gray-900">KES {(loss.amount / 1e6).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expected Loss Rate</p>
                <p className={`text-2xl font-bold ${loss.rate > 0.05 ? 'text-red-700' : 'text-green-700'}`}>{(loss.rate * 100).toFixed(2)}%</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-gray-400">Methodology: DPD-bucket-based loss rates (Current 0%, 1-30 1%, 31-60 10%, 61-90 25%, 91-180 50%, 180+ 100%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Roll-Rate Analysis */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-[#003366] flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4" /> Roll-Rate Analysis</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Transition Matrix (% migrating per period)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-medium text-gray-600">From \ To</th>
                      {DPD_BUCKETS.map(b => <th key={b} className="text-right py-2 px-2 font-medium text-gray-600">{b}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {DPD_BUCKETS.map(from => (
                      <tr key={from} className="border-b border-gray-50">
                        <td className="py-1.5 px-2 font-medium text-gray-700">{from}</td>
                        {DPD_BUCKETS.map(to => {
                          const val = TRANSITION_MATRIX[from]?.[to];
                          return (
                            <td key={to} className={`text-right py-1.5 px-2 font-mono ${val && val > 0.5 ? 'font-bold text-red-600' : val ? 'text-gray-700' : 'text-gray-300'}`}>
                              {val ? `${(val * 100).toFixed(0)}%` : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Projected Bucket Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rollRateProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(val: unknown) => [`KES ${(Number(val) / 1e6).toFixed(1)}M`]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {DPD_BUCKETS.map((b, i) => (
                    <Bar key={b} dataKey={b} stackId="a" fill={COLORS[i]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Projection table */}
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Roll-Rate Loss Projection</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-600">Bucket</th>
                  {rollRateProjection.map(p => <th key={p.period} className="text-right py-2 font-medium text-gray-600">{p.period}</th>)}
                  <th className="text-right py-2 font-medium text-gray-600">Loss Rate</th>
                </tr>
              </thead>
              <tbody>
                {DPD_BUCKETS.map(b => (
                  <tr key={b} className="border-b border-gray-50">
                    <td className="py-1.5 font-medium">{b}</td>
                    {rollRateProjection.map(p => (
                      <td key={p.period} className="text-right py-1.5 font-mono">{((Number(p[b as keyof typeof p]) || 0) / 1e6).toFixed(1)}M</td>
                    ))}
                    <td className="text-right py-1.5 font-mono font-bold">{(LOSS_RATES[b] * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vintage Analysis */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-[#003366] flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4" /> Vintage Analysis</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Cohort Default Curve (DPD &gt; 90)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={vintageCurveData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mob" tick={{ fontSize: 10 }} label={{ value: 'Months on Book', position: 'bottom', fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(val: unknown) => [`${Number(val).toFixed(2)}%`]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {vintageCurveData.vintages.map((v, i) => (
                    <Line key={v} type="monotone" dataKey={v} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Vintage Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-600">Vintage</th>
                      <th className="text-right py-2 font-medium text-gray-600"># Loans</th>
                      <th className="text-right py-2 font-medium text-gray-600">Disbursed</th>
                      <th className="text-right py-2 font-medium text-gray-600">Balance</th>
                      <th className="text-right py-2 font-medium text-gray-600">DPD 30+</th>
                      <th className="text-right py-2 font-medium text-gray-600">DPD 90+</th>
                      <th className="text-right py-2 font-medium text-gray-600">Est. Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vintageData.map(v => (
                      <tr key={v.vintage} className="border-b border-gray-50">
                        <td className="py-1.5 font-mono">{v.vintage}</td>
                        <td className="text-right py-1.5">{v.count}</td>
                        <td className="text-right py-1.5 font-mono">{(v.disbursed / 1e6).toFixed(1)}M</td>
                        <td className="text-right py-1.5 font-mono">{(v.balance / 1e6).toFixed(1)}M</td>
                        <td className={`text-right py-1.5 ${v.dpd30Pct > 10 ? 'text-red-600 font-semibold' : ''}`}>{v.dpd30Pct.toFixed(1)}%</td>
                        <td className={`text-right py-1.5 ${v.dpd90Pct > 5 ? 'text-red-600 font-semibold' : ''}`}>{v.dpd90Pct.toFixed(1)}%</td>
                        <td className={`text-right py-1.5 font-semibold ${v.estLossRate > 5 ? 'text-red-600' : ''}`}>{v.estLossRate.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Performance by Dimension */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-[#003366] mb-4">Performance by Dimension</h2>
          <div className="flex gap-1 mb-4">
            {(['geography', 'product', 'segment', 'loanSize'] as const).map(tab => (
              <button key={tab} onClick={() => setDimTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dimTab === tab ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {tab === 'loanSize' ? 'Loan Size' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">{dimTab === 'loanSize' ? 'Size Range' : dimTab.charAt(0).toUpperCase() + dimTab.slice(1)}</th>
                    <th className="text-right py-2 font-medium text-gray-600">Loans</th>
                    <th className="text-right py-2 font-medium text-gray-600">Balance</th>
                    <th className="text-right py-2 font-medium text-gray-600">PAR 30+</th>
                    <th className="text-right py-2 font-medium text-gray-600">PAR 90+</th>
                    <th className="text-right py-2 font-medium text-gray-600">Est. Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {dimData[dimTab].map(d => (
                    <tr key={d.name} className="border-b border-gray-50">
                      <td className="py-1.5 font-medium">{d.name}</td>
                      <td className="text-right py-1.5">{d.count}</td>
                      <td className="text-right py-1.5 font-mono">{(d.balance / 1e6).toFixed(1)}M</td>
                      <td className={`text-right py-1.5 ${d.par30 > 10 ? 'text-red-600 font-semibold' : ''}`}>{d.par30.toFixed(1)}%</td>
                      <td className={`text-right py-1.5 ${d.par90 > 5 ? 'text-red-600 font-semibold' : ''}`}>{d.par90.toFixed(1)}%</td>
                      <td className={`text-right py-1.5 font-semibold ${d.estLoss > 5 ? 'text-red-600' : ''}`}>{d.estLoss.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={Math.max(200, dimData[dimTab].length * 35)}>
                <BarChart data={dimData[dimTab]} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={75} />
                  <Tooltip formatter={(val: unknown) => [`${Number(val).toFixed(2)}%`, 'Est. Loss Rate']} />
                  <Bar dataKey="estLoss" radius={[0, 4, 4, 0]}>
                    {dimData[dimTab].map((d, i) => (
                      <Cell key={d.name} fill={d.estLoss > 5 ? '#cc3333' : d.estLoss > 2 ? '#e67300' : '#003366'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${warn ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${warn ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
