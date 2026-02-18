'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { LoanLevelRow } from '@/lib/types';
import {
  Activity, Users, Banknote, TrendingDown,
  Target, Layers, Building2, Download, X, AlertTriangle, Shield, Gauge, ArrowDownRight, FileCheck,
} from 'lucide-react';
import { getDpdBucket, DPD_BUCKETS } from '@/lib/types';
import Link from 'next/link';
import { TransactionAlertTimeline } from '@/components/NotificationBell';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell,
} from 'recharts';
import {
  TRANSITION_MATRIX, TICKET_SIZES, ticketBucket,
  computeFinancialSummary, computeECL, rollRateProjection,
  computeVintageData, computeVintageCurves, computeStressIndicators,
  generateTrendData, estimateLoss, computeCureRate, computeCNL, computeCDR,
  computeHHI, hhiLabel, computeRepaymentVelocity, vpInterpretation,
  computeBorrowingBase, computeEligibilityWaterfall, computeShadowReconciliation,
  type ScenarioKey, type EligibilityStep,
} from '@/lib/rollRate';
import { TRANSACTION_MAP, TRANSACTION_NAMES, getNbfiIdForTransaction } from '@/lib/seedTransactions';

const COLORS = ['#003366', '#0066cc', '#0099ff', '#00ccff', '#66e0ff', '#339966', '#cc6633'];
type MonScope = 'transaction' | 'nbfi' | 'portfolio';
type LoanWithNbfi = LoanLevelRow & { _nbfiId?: string; _txId?: string };
type TrendPeriod = '3M' | '6M' | '12M';

function applyFilters<T extends LoanLevelRow>(
  rows: T[],
  filters: { product: string[]; geography: string[]; segment: string[]; dpdBuckets: string[]; ticketSize: string[] },
): T[] {
  return rows.filter(r => {
    const bucket = getDpdBucket(r.dpdAsOfReportingDate);
    const ticket = ticketBucket(r.loanDisbursedAmount ?? r.currentBalance);
    if (filters.product.length && !filters.product.includes(r.product ?? 'Unknown')) return false;
    if (filters.geography.length && !filters.geography.includes(r.geography ?? 'Unknown')) return false;
    if (filters.segment.length && !filters.segment.includes(r.segment ?? 'Unknown')) return false;
    if (filters.dpdBuckets.length && !filters.dpdBuckets.includes(bucket)) return false;
    if (filters.ticketSize.length && !filters.ticketSize.includes(ticket)) return false;
    return true;
  });
}

function FilterPill({ label, selected, options, onChange }: { label: string; selected: string[]; options: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const active = selected.length > 0 && selected.length < options.length;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          active ? 'bg-[#003366] text-white border-[#003366]' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
        }`}>
        {label}{active ? `: ${selected.length}` : ''}
        {active && <button type="button" onClick={e => { e.stopPropagation(); onChange([]); }} className="ml-1 hover:text-gray-200"><X className="w-3 h-3" /></button>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48 max-h-52 overflow-y-auto">
            <button type="button" onClick={() => { onChange([]); }} className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50">All</button>
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={selected.length === 0 || selected.includes(opt)} onChange={() => {
                  if (selected.length === 0) onChange(options.filter(o => o !== opt));
                  else if (selected.includes(opt)) { const n = selected.filter(s => s !== opt); onChange(n.length === 0 ? [] : n); }
                  else { const n = [...selected, opt]; onChange(n.length === options.length ? [] : n); }
                }} className="rounded border-gray-300 text-[#003366] w-3.5 h-3.5" />
                {opt}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1e9) return `KES ${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `KES ${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `KES ${(n / 1e3).toFixed(0)}K`;
  return `KES ${n.toFixed(0)}`;
}
function pct(n: number): string { return `${n.toFixed(1)}%`; }

export default function MonitoringPage() {
  const { user, getNBFI, loanBookData, nbfis } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [scope, setScope] = useState<MonScope>('transaction');
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('12M');
  const [filterProduct, setFilterProduct] = useState<string[]>([]);
  const [filterGeography, setFilterGeography] = useState<string[]>([]);
  const [filterSegment, setFilterSegment] = useState<string[]>([]);
  const [filterDpdBuckets, setFilterDpdBuckets] = useState<string[]>([]);
  const [filterTicketSize, setFilterTicketSize] = useState<string[]>([]);

  useEffect(() => { if (!user) router.push('/'); }, [user, router]);
  const nbfi = getNBFI(id);
  if (!user || !nbfi) return null;

  const txLoans: LoanLevelRow[] = loanBookData[id] || [];
  const nbfiTxIds = TRANSACTION_MAP[id] || [id];

  const nbfiLoans = useMemo((): LoanLevelRow[] => {
    const out: LoanLevelRow[] = [];
    for (const txId of nbfiTxIds) { if (loanBookData[txId]) out.push(...loanBookData[txId]); }
    return out.length > 0 ? out : txLoans;
  }, [loanBookData, nbfiTxIds, txLoans]);

  const allLoansTagged = useMemo((): LoanWithNbfi[] => {
    const out: LoanWithNbfi[] = [];
    for (const [txId, rows] of Object.entries(loanBookData)) {
      const nbfiId = getNbfiIdForTransaction(txId);
      for (const r of rows) out.push({ ...r, _nbfiId: nbfiId, _txId: txId });
    }
    return out;
  }, [loanBookData]);

  const filterObj = useMemo(() => ({ product: filterProduct, geography: filterGeography, segment: filterSegment, dpdBuckets: filterDpdBuckets, ticketSize: filterTicketSize }), [filterProduct, filterGeography, filterSegment, filterDpdBuckets, filterTicketSize]);
  const sourceLoans = useMemo((): LoanLevelRow[] => scope === 'portfolio' ? allLoansTagged : scope === 'nbfi' ? nbfiLoans : txLoans, [scope, allLoansTagged, nbfiLoans, txLoans]);
  const filtered = useMemo(() => applyFilters(sourceLoans, filterObj), [sourceLoans, filterObj]);
  const filteredTagged = useMemo(() => applyFilters(allLoansTagged, filterObj), [allLoansTagged, filterObj]);
  const activeFilterCount = [filterProduct, filterGeography, filterSegment, filterDpdBuckets, filterTicketSize].filter(a => a.length > 0).length;
  const allUnfiltered = scope === 'portfolio' ? allLoansTagged : scope === 'nbfi' ? nbfiLoans : txLoans;
  const geoOptions = useMemo(() => [...new Set(allUnfiltered.map(r => r.geography || 'Unknown'))].sort(), [allUnfiltered]);
  const prodOptions = useMemo(() => [...new Set(allUnfiltered.map(r => r.product || 'Unknown'))].sort(), [allUnfiltered]);
  const segOptions = useMemo(() => [...new Set(allUnfiltered.map(r => r.segment || 'Unknown'))].sort(), [allUnfiltered]);
  const clearFilters = () => { setFilterProduct([]); setFilterGeography([]); setFilterSegment([]); setFilterDpdBuckets([]); setFilterTicketSize([]); };

  const kpi = useMemo(() => {
    if (filtered.length === 0) return null;
    const totalBal = filtered.reduce((s, r) => s + r.currentBalance, 0);
    const p30 = filtered.filter(r => r.dpdAsOfReportingDate > 30).length;
    const p90 = filtered.filter(r => r.dpdAsOfReportingDate > 90).length;
    const nplBal = filtered.filter(r => r.dpdAsOfReportingDate > 90).reduce((s, r) => s + r.currentBalance, 0);
    const nbfiCount = scope === 'portfolio' ? new Set((filtered as LoanWithNbfi[]).map(r => r._nbfiId)).size : 1;
    return { totalLoans: filtered.length, totalBal, nbfiCount, par30: (p30 / filtered.length) * 100, par90: (p90 / filtered.length) * 100, nplRatio: totalBal > 0 ? (nplBal / totalBal) * 100 : 0 };
  }, [filtered, scope]);

  const financials = useMemo(() => computeFinancialSummary(filtered), [filtered]);
  const ecl = useMemo(() => computeECL(filtered), [filtered]);
  const dpdDist = useMemo(() => {
    const map: Record<string, number> = {};
    DPD_BUCKETS.forEach(b => (map[b] = 0));
    filtered.forEach(r => { map[getDpdBucket(r.dpdAsOfReportingDate)] += r.currentBalance; });
    return DPD_BUCKETS.map(b => ({ bucket: b, balance: map[b] }));
  }, [filtered]);
  const rollRate = useMemo(() => rollRateProjection(filtered), [filtered]);
  const vintageDataArr = useMemo(() => computeVintageData(filtered), [filtered]);
  const vintageCurves = useMemo(() => computeVintageCurves(filtered), [filtered]);
  const stressData = useMemo(() => computeStressIndicators(filtered), [filtered]);
  const trendMonths = trendPeriod === '3M' ? 3 : trendPeriod === '6M' ? 6 : 12;
  const trendData = useMemo(() => generateTrendData(filtered, trendMonths), [filtered, trendMonths]);

  const rollScenario = useState<ScenarioKey>('base');
  const [scenario, setScenario] = rollScenario;
  const rollRateScenario = useMemo(() => rollRateProjection(filtered, 3, scenario), [filtered, scenario]);
  const cureRate = useMemo(() => computeCureRate(filtered), [filtered]);
  const cnl = useMemo(() => computeCNL(filtered), [filtered]);
  const cdr = useMemo(() => computeCDR(filtered), [filtered]);
  const geoHHI = useMemo(() => computeHHI(filtered, r => r.geography || 'Unknown'), [filtered]);
  const prodHHI = useMemo(() => computeHHI(filtered, r => r.product || 'Unknown'), [filtered]);
  const repayVelocity = useMemo(() => computeRepaymentVelocity(filtered), [filtered]);
  const vpInfo = useMemo(() => vpInterpretation(repayVelocity.vp), [repayVelocity.vp]);
  const facilityAmt = scope === 'transaction' ? (nbfi?.fundingAmount ?? 0) : scope === 'nbfi' ? (nbfi?.fundingAmount ?? 0) : nbfis.reduce((s, n) => s + n.fundingAmount, 0);
  const borrowingBase = useMemo(() => computeBorrowingBase(filtered, facilityAmt), [filtered, facilityAmt]);
  const eligibility = useMemo(() => computeEligibilityWaterfall(filtered), [filtered]);
  const shadow = useMemo(() => computeShadowReconciliation(filtered), [filtered]);

  const nbfiGroups = useMemo(() => {
    const m: Record<string, LoanWithNbfi[]> = {};
    filteredTagged.forEach(r => { const nid = (r as LoanWithNbfi)._nbfiId ?? ''; if (!m[nid]) m[nid] = []; m[nid].push(r as LoanWithNbfi); });
    return m;
  }, [filteredTagged]);

  const txBreakdown = useMemo(() => {
    if (scope !== 'nbfi') return [];
    return nbfiTxIds.map(txId => {
      const rows = applyFilters(loanBookData[txId] || [], filterObj);
      const bal = rows.reduce((s, r) => s + r.currentBalance, 0);
      const p30 = rows.length > 0 ? (rows.filter(r => r.dpdAsOfReportingDate > 30).length / rows.length) * 100 : 0;
      const loss = estimateLoss(rows);
      return { txId, name: TRANSACTION_NAMES[txId] || txId, count: rows.length, bal, par30: p30, lossRate: loss.rate * 100 };
    });
  }, [scope, nbfiTxIds, loanBookData, filterObj]);

  const riskRanking = useMemo(() => {
    if (scope !== 'portfolio') return [];
    return Object.entries(nbfiGroups).map(([nid, rows]) => {
      const n = nbfis.find(x => x.id === nid);
      if (!n || rows.length === 0) return null;
      const bal = rows.reduce((s, r) => s + r.currentBalance, 0);
      const p90 = (rows.filter(r => r.dpdAsOfReportingDate > 90).length / rows.length) * 100;
      const npl = bal > 0 ? (rows.filter(r => r.dpdAsOfReportingDate > 90).reduce((s, r) => s + r.currentBalance, 0) / bal) * 100 : 0;
      const loss = estimateLoss(rows);
      const fin = computeFinancialSummary(rows);
      const score = (npl * 0.4) + (p90 * 0.3) + (loss.rate * 100 * 0.3);
      return { id: nid, name: n.name, status: n.status, loans: rows.length, bal, par90: p90, nplRatio: npl, lossRate: loss.rate * 100, grossLoss: fin.grossLoss, provisions: fin.provisions, score };
    }).filter(Boolean).sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0)) as { id: string; name: string; status: string; loans: number; bal: number; par90: number; nplRatio: number; lossRate: number; grossLoss: number; provisions: number; score: number }[];
  }, [scope, nbfiGroups, nbfis]);

  const handleExport = () => {
    const headers = ['loanId', 'product', 'geography', 'segment', 'currentBalance', 'dpdAsOfReportingDate', 'totalOverdueAmount', 'interestRate', 'loanWrittenOff', 'recoveryAfterWriteoff'];
    const csv = [headers.join(','), ...filtered.map(r => headers.map(h => { const v = (r as unknown as Record<string, unknown>)[h]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v ?? ''); }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `risk-${scope}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">&larr; Dashboard</Link>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Risk Monitoring Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">{scope === 'transaction' ? `Transaction: ${nbfi.name}` : scope === 'nbfi' ? `NBFI: ${nbfi.name} (${nbfiTxIds.length} transaction${nbfiTxIds.length > 1 ? 's' : ''})` : 'Full Portfolio'}</p>
          </div>
          <button type="button" onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"><Download className="w-4 h-4" /> Export CSV</button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {([{ key: 'transaction' as const, label: 'Transaction', icon: Target }, { key: 'nbfi' as const, label: 'NBFI', icon: Building2 }, { key: 'portfolio' as const, label: 'Portfolio', icon: Layers }]).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setScope(key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${scope === key ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Icon className="w-3.5 h-3.5" /> {label}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs text-gray-500 font-medium mr-1">Filters:</span>
          <FilterPill label="Product" options={prodOptions} selected={filterProduct} onChange={setFilterProduct} />
          <FilterPill label="Geography" options={geoOptions} selected={filterGeography} onChange={setFilterGeography} />
          <FilterPill label="Segment" options={segOptions} selected={filterSegment} onChange={setFilterSegment} />
          <FilterPill label="DPD Bucket" options={[...DPD_BUCKETS]} selected={filterDpdBuckets} onChange={setFilterDpdBuckets} />
          <FilterPill label="Ticket Size" options={[...TICKET_SIZES]} selected={filterTicketSize} onChange={setFilterTicketSize} />
          {activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-full"><X className="w-3 h-3" /> Clear all</button>}
          <span className="ml-auto text-xs text-gray-400">{filtered.length.toLocaleString()} loans</span>
        </div>
        {scope !== 'portfolio' && <div className="mb-5"><TransactionAlertTimeline nbfiId={id} /></div>}
        {scope === 'nbfi' && txBreakdown.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-bold text-[#003366] mb-3">Transaction Breakdown</h2>
            <table className="w-full text-xs"><thead><tr className="bg-gray-50 border-b text-gray-500 uppercase"><th className="text-left px-3 py-2">Transaction</th><th className="text-right px-3 py-2">Loans</th><th className="text-right px-3 py-2">Balance</th><th className="text-right px-3 py-2">PAR 30+</th><th className="text-right px-3 py-2">Est. Loss</th></tr></thead>
            <tbody>{txBreakdown.map(tx => (<tr key={tx.txId} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-3 py-2 font-medium text-[#003366]">{tx.name}</td><td className="px-3 py-2 text-right">{tx.count.toLocaleString()}</td><td className="px-3 py-2 text-right font-mono">{fmt(tx.bal)}</td><td className={`px-3 py-2 text-right ${tx.par30 > 10 ? 'text-red-600 font-semibold' : ''}`}>{pct(tx.par30)}</td><td className={`px-3 py-2 text-right ${tx.lossRate > 10 ? 'text-red-600 font-semibold' : ''}`}>{pct(tx.lossRate)}</td></tr>))}</tbody></table>
          </div>
        )}
        {kpi ? (<>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
            {scope === 'portfolio' && <KpiCard label="Active NBFIs" value={kpi.nbfiCount.toString()} icon={<Layers className="w-4 h-4 text-[#003366]" />} />}
            <KpiCard label="Total Loans" value={kpi.totalLoans.toLocaleString()} icon={<Users className="w-4 h-4 text-green-600" />} />
            <KpiCard label="Total Balance" value={fmt(kpi.totalBal)} icon={<Banknote className="w-4 h-4 text-blue-600" />} />
            <KpiCard label="PAR 30+" value={pct(kpi.par30)} icon={<TrendingDown className="w-4 h-4 text-amber-500" />} alert={kpi.par30 > 10} />
            <KpiCard label="PAR 90+" value={pct(kpi.par90)} icon={<Activity className="w-4 h-4 text-red-500" />} alert={kpi.par90 > 5} />
            <KpiCard label="NPL Ratio" value={pct(kpi.nplRatio)} icon={<Activity className="w-4 h-4 text-orange-500" />} alert={kpi.nplRatio > 5} />
          </div>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <MetricCard label="Gross Loss" value={fmt(financials.grossLoss)} sub={`${financials.writeOffCount} write-offs`} color="red" />
            <MetricCard label="Net Loss" value={fmt(financials.netLoss)} sub={`Recovery: ${pct(financials.recoveryRate)}`} color="red" />
            <MetricCard label="Provisions (Lender)" value={fmt(financials.provisions)} sub={`of ${fmt(financials.totalBal)} balance`} color="amber" />
            <MetricCard label="Avg Interest Rate" value={pct(financials.avgInterest)} sub="Weighted by balance" color="blue" />
          </div>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <MetricCard label="Total Overdue" value={fmt(financials.totalOverdue)} sub={`${pct(financials.overdueRatio)} of balance`} color="amber" />
            <MetricCard label="Write-off Rate" value={pct(financials.writeOffRate)} sub={`${financials.writeOffCount} of ${filtered.length}`} color="red" />
            <MetricCard label="Recovery Rate" value={pct(financials.recoveryRate)} sub={fmt(financials.recovery)} color="green" />
            <MetricCard label="ECL (12-month)" value={fmt(ecl.ecl12m)} sub={`Lifetime: ${fmt(ecl.eclLifetime)}`} color="blue" />
          </div>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-[#003366] mb-3">DPD Distribution (Balance)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dpdDist}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="bucket" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} /><Tooltip formatter={(val: unknown) => [fmt(Number(val))]} /><Bar dataKey="balance" radius={[4, 4, 0, 0]}>{dpdDist.map((d, i) => <Cell key={d.bucket} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#003366]">Performance Trend</h2>
                <div className="flex bg-gray-100 p-0.5 rounded-md">{(['3M', '6M', '12M'] as TrendPeriod[]).map(p => (<button key={p} onClick={() => setTrendPeriod(p)} className={`px-2.5 py-1 rounded text-xs font-medium ${trendPeriod === p ? 'bg-white shadow-sm text-[#003366]' : 'text-gray-500'}`}>{p}</button>))}</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="month" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} /><Tooltip formatter={(val: unknown) => [`${Number(val).toFixed(1)}%`]} /><Legend wrapperStyle={{ fontSize: 10 }} /><Line type="monotone" dataKey="par30" name="PAR 30+" stroke="#e67300" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="par90" name="PAR 90+" stroke="#cc3333" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="npl" name="NPL %" stroke="#9333ea" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="collection" name="Collection %" stroke="#003366" strokeWidth={2} dot={false} /></LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-[#003366]">Roll-Rate Projection</h2>
              <div className="flex gap-1">{(['base', 'stress', 'severe'] as ScenarioKey[]).map(s => (
                <button key={s} onClick={() => setScenario(s)} className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${scenario === s ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}</div>
            </div>
            <p className="text-[10px] text-gray-500 mb-3">Markov chain forward projection &mdash; {scenario} scenario over 3 months | Cure Rate: {cureRate.rate.toFixed(1)}%</p>
            <div className="grid grid-cols-2 gap-5">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]"><thead><tr className="bg-gray-50 border-b text-gray-500 uppercase"><th className="text-left px-2 py-1.5">From \ To</th>{DPD_BUCKETS.map(b => <th key={b} className="text-right px-2 py-1.5">{b}</th>)}</tr></thead>
                <tbody>{DPD_BUCKETS.map(from => (<tr key={from} className="border-b border-gray-100"><td className="px-2 py-1.5 font-semibold">{from}</td>{DPD_BUCKETS.map(to => { const v = TRANSITION_MATRIX[from]?.[to]; return <td key={to} className={`px-2 py-1.5 text-right font-mono ${v && v > 0.3 ? 'text-red-600 font-semibold' : v ? 'text-gray-700' : 'text-gray-300'}`}>{v ? `${(v * 100).toFixed(0)}%` : '-'}</td>; })}</tr>))}</tbody></table>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rollRateScenario}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="period" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} /><Tooltip formatter={(val: unknown) => [fmt(Number(val))]} /><Legend wrapperStyle={{ fontSize: 10 }} />{DPD_BUCKETS.map((b, i) => <Bar key={b} dataKey={b} stackId="a" fill={COLORS[i % COLORS.length]} />)}</BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-bold text-[#003366] mb-1">Vintage Analysis &amp; CNL Curves</h2>
            <p className="text-[10px] text-gray-500 mb-3">Cohort-based loss analysis with Cumulative Net Loss curves by months-on-book</p>
            <div className="grid grid-cols-2 gap-5">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]"><thead><tr className="bg-gray-50 border-b text-gray-500 uppercase"><th className="text-left px-2 py-1.5">Vintage</th><th className="text-right px-2 py-1.5">Loans</th><th className="text-right px-2 py-1.5">Disbursed</th><th className="text-right px-2 py-1.5">Balance</th><th className="text-right px-2 py-1.5">DPD 30+</th><th className="text-right px-2 py-1.5">DPD 90+</th><th className="text-right px-2 py-1.5">CNL</th><th className="text-right px-2 py-1.5">Est Loss</th></tr></thead>
                <tbody>{vintageDataArr.map(v => (<tr key={v.vintage} className="border-b border-gray-100"><td className="px-2 py-1.5 font-mono font-semibold">{v.vintage}</td><td className="px-2 py-1.5 text-right">{v.count}</td><td className="px-2 py-1.5 text-right font-mono">{fmt(v.disbursed)}</td><td className="px-2 py-1.5 text-right font-mono">{fmt(v.balance)}</td><td className={`px-2 py-1.5 text-right ${v.dpd30Pct > 15 ? 'text-red-600 font-semibold' : ''}`}>{pct(v.dpd30Pct)}</td><td className={`px-2 py-1.5 text-right ${v.dpd90Pct > 5 ? 'text-red-600 font-semibold' : ''}`}>{pct(v.dpd90Pct)}</td><td className="px-2 py-1.5 text-right font-mono">{pct(v.cnl)}</td><td className={`px-2 py-1.5 text-right ${v.estLossRate > 10 ? 'text-red-600 font-semibold' : ''}`}>{pct(v.estLossRate)}</td></tr>))}</tbody></table>
              </div>
              {vintageCurves.vintages.length > 0 && <ResponsiveContainer width="100%" height={220}>
                <LineChart data={vintageCurves.data}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="mob" tick={{ fontSize: 10 }} label={{ value: 'MOB', position: 'bottom', fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} /><Tooltip formatter={(val: unknown) => [`${Number(val).toFixed(2)}%`]} /><Legend wrapperStyle={{ fontSize: 9 }} />{vintageCurves.vintages.map((v, i) => <Line key={v} type="monotone" dataKey={v} stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} dot={false} />)}</LineChart>
              </ResponsiveContainer>}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-bold text-[#003366] mb-1">Portfolio Stress Indicators</h2>
            <p className="text-[10px] text-gray-500 mb-3">Segments showing high stress or deterioration</p>
            <div className="grid grid-cols-2 gap-5">
              {(['geography', 'product', 'segment', 'ticketSize'] as const).map(dim => (
                <div key={dim}>
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">{dim === 'ticketSize' ? 'Ticket Size' : dim}</h3>
                  <table className="w-full text-[11px]"><thead><tr className="bg-gray-50 border-b text-gray-500 uppercase"><th className="text-left px-2 py-1">{dim}</th><th className="text-right px-2 py-1">PAR 30+</th><th className="text-right px-2 py-1">PAR 90+</th><th className="text-right px-2 py-1">Loss Rate</th><th className="text-center px-2 py-1">Flag</th></tr></thead>
                  <tbody>{stressData[dim].slice(0, 8).map(d => { const isAlert = d.par90 > 5 || d.estLoss > 10; return (<tr key={d.name} className={`border-b border-gray-100 ${isAlert ? 'bg-red-50/50' : ''}`}><td className="px-2 py-1 font-medium truncate max-w-[120px]">{d.name}</td><td className={`px-2 py-1 text-right ${d.par30 > 15 ? 'text-red-600 font-semibold' : d.par30 > 10 ? 'text-amber-600' : ''}`}>{pct(d.par30)}</td><td className={`px-2 py-1 text-right ${d.par90 > 5 ? 'text-red-600 font-semibold' : d.par90 > 3 ? 'text-amber-600' : ''}`}>{pct(d.par90)}</td><td className={`px-2 py-1 text-right ${d.estLoss > 10 ? 'text-red-600 font-semibold' : d.estLoss > 5 ? 'text-amber-600' : ''}`}>{pct(d.estLoss)}</td><td className="px-2 py-1 text-center">{isAlert ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 mx-auto" /> : <span className="inline-block w-2 h-2 rounded-full bg-green-400" />}</td></tr>); })}</tbody></table>
                </div>
              ))}
            </div>
          </div>
          {/* Wholesale Best Practices Sections */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-xs font-bold text-[#003366] mb-2 flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5" /> Repayment Velocity</h3>
              <p className={`text-2xl font-bold ${vpInfo.color}`}>{repayVelocity.vp.toFixed(3)}</p>
              <p className={`text-xs font-medium ${vpInfo.color} mt-1`}>{vpInfo.label}</p>
              <p className="text-[10px] text-gray-400 mt-1">{vpInfo.detail}</p>
              <p className="text-[10px] text-gray-400 mt-2">Scheduled: {fmt(repayVelocity.scheduledTotal)}/mo | Actual: {fmt(repayVelocity.actualTotal)}/mo</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-xs font-bold text-[#003366] mb-2 flex items-center gap-1.5"><ArrowDownRight className="w-3.5 h-3.5" /> Cure Rate</h3>
              <p className="text-2xl font-bold text-gray-900">{cureRate.rate.toFixed(1)}%</p>
              <p className="text-[10px] text-gray-400 mt-1">of delinquent balance returning to 1-30 DPD</p>
              <p className="text-[10px] text-gray-400 mt-1">Cured: {fmt(cureRate.curedBalance)} / {fmt(cureRate.delinquentBalance)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-xs font-bold text-[#003366] mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Loss Metrics</h3>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div><p className="text-[10px] text-gray-500">CNL</p><p className={`text-sm font-bold ${cnl.cnl > 3 ? 'text-red-600' : 'text-gray-900'}`}>{cnl.cnl.toFixed(2)}%</p></div>
                <div><p className="text-[10px] text-gray-500">CDR (ann.)</p><p className={`text-sm font-bold ${cdr.cdr > 10 ? 'text-red-600' : 'text-gray-900'}`}>{cdr.cdr.toFixed(2)}%</p></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-bold text-[#003366] mb-1 flex items-center gap-2"><Shield className="w-4 h-4" /> Borrowing Base & Eligibility</h2>
            <p className="text-[10px] text-gray-500 mb-3">Eligible collateral vs facility amount with advance rates by risk bucket</p>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3"><p className="text-[10px] text-blue-500">Borrowing Base</p><p className="text-lg font-bold text-blue-700">{fmt(borrowingBase.borrowingBase)}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-500">Facility Amount</p><p className="text-lg font-bold text-gray-700">{fmt(borrowingBase.facilityAmount)}</p></div>
                  <div className={`rounded-lg p-3 ${borrowingBase.headroom >= 0 ? 'bg-green-50' : 'bg-red-50'}`}><p className="text-[10px] text-gray-500">Headroom</p><p className={`text-lg font-bold ${borrowingBase.headroom >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(borrowingBase.headroom)}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-500">Utilization</p><p className="text-lg font-bold text-gray-700">{borrowingBase.utilizationPct}%</p></div>
                </div>
                <p className="text-[10px] text-gray-400">Eligible loans: {borrowingBase.eligibleCount.toLocaleString()} | Ineligible: {borrowingBase.ineligibleCount.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-600 mb-2">Eligibility Waterfall</h3>
                <table className="w-full text-[11px]"><thead><tr className="bg-gray-50 border-b text-gray-500 uppercase"><th className="text-left px-2 py-1.5">Criteria</th><th className="text-right px-2 py-1.5">Pass</th><th className="text-right px-2 py-1.5">Fail</th><th className="text-right px-2 py-1.5">Eligible Bal</th></tr></thead>
                <tbody>{eligibility.map((s: EligibilityStep, i: number) => (<tr key={i} className="border-b border-gray-100"><td className="px-2 py-1.5">{s.criteria}</td><td className="px-2 py-1.5 text-right text-green-600">{s.passCount}</td><td className="px-2 py-1.5 text-right text-red-500">{s.failCount}</td><td className="px-2 py-1.5 text-right font-mono">{fmt(s.cumEligibleBalance)}</td></tr>))}</tbody></table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-[#003366] mb-3">Concentration Risk (HHI)</h2>
              {[{ label: 'Geography', data: geoHHI }, { label: 'Product', data: prodHHI }].map(({ label, data }) => {
                const info = hhiLabel(data.hhi);
                return (
                  <div key={label} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">{label}</span>
                      <span className={`text-xs font-bold ${info.color}`}>{data.hhi.toFixed(4)} &mdash; {info.label}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${data.hhi < 0.1 ? 'bg-green-400' : data.hhi < 0.18 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${Math.min(data.hhi * 400, 100)}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">{data.segments.slice(0, 5).map(s => (<span key={s.name} className="text-[10px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5">{s.name}: {(s.share * 100).toFixed(1)}%</span>))}</div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-[#003366] mb-1 flex items-center gap-2"><FileCheck className="w-4 h-4" /> Shadow Accounting Reconciliation</h2>
              <p className="text-[10px] text-gray-500 mb-3">Three-way reconciliation: Loan Tape vs Shadow Ledger vs Bank Statement</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-blue-50 rounded-lg p-2.5"><p className="text-[10px] text-blue-500 mb-0.5">Loan Tape</p><p className="text-xs font-bold">Δ Principal: {fmt(shadow.loanTape.principalReduction)}</p><p className="text-[10px] text-gray-400">{shadow.loanTape.loanCount.toLocaleString()} loans</p></div>
                <div className="bg-purple-50 rounded-lg p-2.5"><p className="text-[10px] text-purple-500 mb-0.5">Shadow Ledger</p><p className="text-xs font-bold">Expected: {fmt(shadow.shadowLedger.expectedPrincipal)}</p><p className="text-[10px] text-gray-400">Interest: {fmt(shadow.shadowLedger.interestCalc)}</p></div>
                <div className="bg-green-50 rounded-lg p-2.5"><p className="text-[10px] text-green-600 mb-0.5">Bank Statement</p><p className="text-xs font-bold">Collections: {fmt(shadow.bankStatement.cashCollections)}</p><p className="text-[10px] text-gray-400">Deposits: {fmt(shadow.bankStatement.deposits)}</p></div>
              </div>
              <div className={`rounded-lg p-3 border ${shadow.reconciliation.status === 'reconciled' ? 'bg-green-50 border-green-200' : shadow.reconciliation.status === 'minor_variance' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">{shadow.reconciliation.status === 'reconciled' ? 'Reconciled' : shadow.reconciliation.status === 'minor_variance' ? 'Minor Variance' : 'Material Variance'}</p>
                    <p className="text-[10px] text-gray-500">Cash Drag: {fmt(shadow.reconciliation.cashDrag)} ({shadow.reconciliation.cashDragPct}%)</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${shadow.reconciliation.status === 'reconciled' ? 'bg-green-100 text-green-700' : shadow.reconciliation.status === 'minor_variance' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{shadow.reconciliation.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {scope === 'portfolio' && riskRanking.length > 0 && (<>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
              <h2 className="text-sm font-bold text-[#003366] mb-3">NBFI Performance Breakdown</h2>
              <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-gray-50 border-b text-gray-500 uppercase"><th className="text-left px-3 py-2">NBFI</th><th className="text-right px-3 py-2">Loans</th><th className="text-right px-3 py-2">Balance</th><th className="text-right px-3 py-2">PAR 90+</th><th className="text-right px-3 py-2">NPL</th><th className="text-right px-3 py-2">Gross Loss</th><th className="text-right px-3 py-2">Provisions</th><th className="text-right px-3 py-2">Est Loss</th><th className="text-left px-3 py-2">Status</th></tr></thead>
              <tbody>{riskRanking.map(r => (<tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-3 py-2 font-medium"><Link href={`/nbfi/${r.id}/monitoring`} className="text-[#003366] hover:underline">{r.name}</Link></td><td className="px-3 py-2 text-right">{r.loans.toLocaleString()}</td><td className="px-3 py-2 text-right font-mono">{fmt(r.bal)}</td><td className={`px-3 py-2 text-right ${r.par90 > 5 ? 'text-red-600 font-semibold' : ''}`}>{pct(r.par90)}</td><td className={`px-3 py-2 text-right ${r.nplRatio > 5 ? 'text-red-600 font-semibold' : ''}`}>{pct(r.nplRatio)}</td><td className="px-3 py-2 text-right font-mono">{fmt(r.grossLoss)}</td><td className="px-3 py-2 text-right font-mono">{fmt(r.provisions)}</td><td className={`px-3 py-2 text-right ${r.lossRate > 10 ? 'text-red-600 font-semibold' : ''}`}>{pct(r.lossRate)}</td><td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.status === 'monitoring' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.status.replace(/_/g, ' ')}</span></td></tr>))}</tbody></table></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
              <h2 className="text-sm font-bold text-[#003366] mb-3">Risk Heatmap (Composite Score)</h2>
              <p className="text-[10px] text-gray-500 mb-3">Weighted: NPL 40% + PAR 90+ 30% + Loss Rate 30%</p>
              <div className="space-y-1.5">{riskRanking.slice(0, 10).map(r => (<div key={r.id} className="flex items-center gap-3"><span className="text-xs w-40 truncate font-medium text-gray-700">{r.name}</span><div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden"><div className={`h-full rounded-full flex items-center justify-end pr-2 transition-all ${r.score > 15 ? 'bg-red-400' : r.score > 8 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.min(r.score * 3, 100)}%` }}><span className="text-[10px] text-white font-bold">{r.score.toFixed(1)}</span></div></div>{r.score > 15 && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}</div>))}</div>
            </div>
          </>)}
        </>) : <div className="text-center py-20 text-gray-400">No loan data available for this view. Upload a loan book to see analytics.</div>}
      </main>
    </div>
  );
}

function KpiCard({ label, value, icon, alert }: { label: string; value: string; icon: React.ReactNode; alert?: boolean }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-4 ${alert ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-1.5">{icon}{alert && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}</div>
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-base font-bold text-gray-900">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: 'red' | 'amber' | 'blue' | 'green' }) {
  const stripe = { red: 'border-l-red-400', amber: 'border-l-amber-400', blue: 'border-l-blue-400', green: 'border-l-green-400' }[color];
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${stripe} p-3`}>
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
