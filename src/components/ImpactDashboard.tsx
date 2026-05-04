'use client';

import { useState, useMemo, type ReactNode } from 'react';
import type { LoanLevelRow } from '@/lib/types';
import {
  computeClimateMetrics,
  computeClimatePositiveBreakdown,
  computeClimateResilientBreakdown,
  computeClimateVulnerableBreakdown,
  computeClimateGeoProbabilities,
  computeSocioeconomicMetrics,
  computeTierOneEWI,
  computeTierTwoEWI,
  CLIMATE_RISK_ZONES,
  CO2E_FACTORS,
  CLIMATE_PRODUCT_LABELS,
  CLIMATE_BASELINE_TRAJECTORY,
  KES_TO_USD,
  type ClimateGeoProbability,
  ACTIVE_SIGNAL_GEOS,
  type TierOneEWI,
  type TierTwoEWI,
} from '@/lib/climateImpact';
import {
  Leaf, Zap, Shield, Users, MapPin, AlertTriangle,
  ChevronDown, ChevronUp, Info, Heart, Briefcase, Globe,
  Sun, Truck, Droplets, TrendingDown, TrendingUp, Sprout, Building2,
  Signal, Satellite, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

// ---- helpers ----
function fmtNum(n: number, currency: 'KES' | 'USD'): string {
  const v = currency === 'USD' ? n / KES_TO_USD : n;
  const prefix = currency === 'USD' ? '$' : 'KES ';
  if (Math.abs(v) >= 1e9) return `${prefix}${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${prefix}${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `${prefix}${(v / 1e3).toFixed(0)}K`;
  return `${prefix}${v.toFixed(0)}`;
}
function pct(n: number): string { return `${n.toFixed(1)}%`; }

const CLIMATE_COLORS = {
  positive: '#16a34a',
  resilient: '#2563eb',
  vulnerable: '#d97706',
  unclassified: '#d1d5db',
};

const PRODUCT_ICONS: Record<string, ReactNode> = {
  'Boda-Boda':  <Zap className="w-3.5 h-3.5 text-green-600" />,
  'EV':         <Truck className="w-3.5 h-3.5 text-emerald-600" />,
  'Solar-Home': <Sun className="w-3.5 h-3.5 text-yellow-600" />,
  'Solar-Pump': <Droplets className="w-3.5 h-3.5 text-blue-600" />,
};

// ---- sub-components ----
function ImpactKpiCard({
  label, value, sub, icon, accent,
}: { label: string; value: string; sub?: string; icon: ReactNode; accent: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${accent} p-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-base font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function InfoBar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] text-blue-600 hover:text-blue-800 font-medium">
        <Info className="w-3 h-3" />
        Methodology & assumptions
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-[10px] text-blue-800 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}


function ProbBar({ value, thresholds }: { value: number; thresholds: [number, number] }) {
  const color = value >= thresholds[1] ? 'bg-red-500' : value >= thresholds[0] ? 'bg-amber-400' : 'bg-green-400';
  const textColor = value >= thresholds[1] ? 'text-red-700 font-semibold' : value >= thresholds[0] ? 'text-amber-700' : 'text-green-700';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[40px]">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-[10px] font-mono w-7 text-right ${textColor}`}>{value}%</span>
    </div>
  );
}

function ActionBadge({ actionType }: { actionType: ClimateGeoProbability['actionType'] }) {
  const styles = {
    restructure: 'bg-orange-100 text-orange-700',
    moratorium:  'bg-red-100 text-red-700',
    watchlist:   'bg-amber-100 text-amber-700',
    monitor:     'bg-blue-100 text-blue-700',
  }[actionType];
  const labels = { restructure: 'Restructure', moratorium: 'Moratorium', watchlist: 'Watchlist', monitor: 'Monitor' };
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${styles}`}>{labels[actionType]}</span>;
}

// ---- EWI status helpers ----
const EWI_STATUS_STYLES = {
  ok:    { border: 'border-l-green-400', badge: 'bg-green-100 text-green-700', value: 'text-green-700' },
  watch: { border: 'border-l-amber-400', badge: 'bg-amber-100 text-amber-700', value: 'text-amber-700' },
  alert: { border: 'border-l-red-500',   badge: 'bg-red-100 text-red-700',     value: 'text-red-700' },
} as const;

const EWI_STATUS_LABEL: Record<TierOneEWI['status'], string> = { ok: 'OK', watch: 'Watch', alert: 'Alert' };

function Tier1Card({ ewi }: { ewi: TierOneEWI }) {
  const [open, setOpen] = useState(false);
  const s = EWI_STATUS_STYLES[ewi.status];
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${s.border} p-4 flex flex-col`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-mono">{ewi.code}</span>
          <p className="text-xs font-semibold text-gray-800 leading-snug">{ewi.label}</p>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${s.badge}`}>
          {EWI_STATUS_LABEL[ewi.status]}
        </span>
      </div>
      <div className="flex gap-1.5 mb-2.5">
        <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ewi.source}</span>
        <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ewi.leadTime} lead</span>
      </div>
      <p className="text-[10px] text-gray-700 leading-relaxed flex-1">{ewi.headline}</p>
      {ewi.flaggedGeos.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {ewi.flaggedGeos.map(f => (
            <span key={f.geo} className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
              {f.geo} · {f.signal}
            </span>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[9px] text-blue-600 hover:text-blue-800 mt-2.5 font-medium">
        <Info className="w-2.5 h-2.5" />
        {open ? 'Hide detail' : 'View detail'}
        {open ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
      </button>
      {open && (
        <p className="text-[9px] text-gray-600 mt-1.5 leading-relaxed bg-gray-50 rounded p-2 border border-gray-100">
          {ewi.detail}
        </p>
      )}
    </div>
  );
}

function Tier2Card({ ewi }: { ewi: TierTwoEWI }) {
  const [open, setOpen] = useState(false);
  const s = EWI_STATUS_STYLES[ewi.status];
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${s.border} p-4 flex flex-col`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono shrink-0">{ewi.code}</span>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${s.badge}`}>
          {EWI_STATUS_LABEL[ewi.status]}
        </span>
      </div>
      <p className="text-xs font-semibold text-gray-800 leading-snug mb-3">{ewi.label}</p>
      <p className={`text-lg font-bold ${s.value}`}>{ewi.value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5 flex-1">{ewi.benchmark}</p>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[9px] text-blue-600 hover:text-blue-800 mt-2.5 font-medium">
        <Info className="w-2.5 h-2.5" />
        {open ? 'Hide detail' : 'View detail'}
        {open ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
      </button>
      {open && (
        <p className="text-[9px] text-gray-600 mt-1.5 leading-relaxed bg-gray-50 rounded p-2 border border-gray-100">
          {ewi.detail}
        </p>
      )}
    </div>
  );
}

// ---- main component ----
interface ImpactDashboardProps {
  loans: LoanLevelRow[];
  scope: 'transaction' | 'nbfi' | 'portfolio';
  nbfiName?: string;
}

export default function ImpactDashboard({ loans, scope, nbfiName }: ImpactDashboardProps) {
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES');

  const climate       = useMemo(() => computeClimateMetrics(loans), [loans]);
  const posBreakdown  = useMemo(() => computeClimatePositiveBreakdown(loans), [loans]);
  const resBreakdown  = useMemo(() => computeClimateResilientBreakdown(loans), [loans]);
  const vulBreakdown  = useMemo(() => computeClimateVulnerableBreakdown(loans), [loans]);
  const geoProbs      = useMemo(() => computeClimateGeoProbabilities(loans), [loans]);
  const socio         = useMemo(() => computeSocioeconomicMetrics(loans), [loans]);
  const tierOneEWI    = useMemo(() => computeTierOneEWI(loans), [loans]);
  const tierTwoEWI    = useMemo(() => computeTierTwoEWI(loans), [loans]);

  const highRiskRecs = geoProbs.filter(r => r.riskLevel === 'high').length;

  const climatePieData = [
    { name: 'Climate Positive', value: climate.positiveCount,    color: CLIMATE_COLORS.positive },
    { name: 'Climate Resilient', value: climate.resilientCount,  color: CLIMATE_COLORS.resilient },
    { name: 'Climate Vulnerable', value: climate.vulnerableCount, color: CLIMATE_COLORS.vulnerable },
    { name: 'Unclassified', value: climate.unclassifiedCount,    color: CLIMATE_COLORS.unclassified },
  ].filter(d => d.value > 0);

  const climateBalanceData = [
    { name: 'Climate +ve', value: climate.positiveBalance,   color: CLIMATE_COLORS.positive },
    { name: 'Resilient',   value: climate.resilientBalance,  color: CLIMATE_COLORS.resilient },
    { name: 'Vulnerable',  value: climate.vulnerableBalance, color: CLIMATE_COLORS.vulnerable },
  ].filter(d => d.value > 0);

  if (loans.length === 0) {
    return <div className="text-center py-20 text-gray-400">No loan data available. Upload a loan book to see impact analytics.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-800">Impact Dashboard</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {scope === 'portfolio' ? 'Full Portfolio' : nbfiName} — Climate & Socioeconomic Monitoring
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['KES', 'USD'] as const).map(c => (
            <button key={c} onClick={() => setCurrency(c)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                currency === c ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>{c}</button>
          ))}
        </div>
      </div>

      {/* ================================================================
          OVERVIEW — Portfolio Climate Snapshot
          ================================================================ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-bold text-gray-800">Climate Impact Overview</h3>
          <span className="text-[10px] text-gray-400 font-medium ml-1">Kaleidofin Africa Climate Taxonomy · MDB/IDFC Common Principles</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <ImpactKpiCard label="Climate Finance Share" value={pct(climate.climatePositiveSharePct)} sub="Climate Positive (Common Principles)" icon={<Zap className="w-4 h-4 text-green-600" />} accent="border-l-green-400" />
          <ImpactKpiCard label="Total Climate Lending" value={fmtNum(climate.totalClimateBalance, currency)} sub={`${pct(climate.totalClimateSharePct)} of portfolio`} icon={<Leaf className="w-4 h-4 text-emerald-600" />} accent="border-l-emerald-400" />
          <ImpactKpiCard label="Climate Positive Loans" value={climate.positiveCount.toLocaleString()} sub={`CO₂e: ${climate.co2eAvoidedTonnes.toFixed(0)} t/yr`} icon={<Zap className="w-4 h-4 text-green-600" />} accent="border-l-green-400" />
          <ImpactKpiCard label="Climate Resilient Loans" value={climate.resilientCount.toLocaleString()} sub={fmtNum(climate.resilientBalance, currency)} icon={<Shield className="w-4 h-4 text-blue-600" />} accent="border-l-blue-400" />
          <ImpactKpiCard label="Climate Vulnerable Loans" value={climate.vulnerableCount.toLocaleString()} sub={`${pct((climate.vulnerableCount / climate.total) * 100)} of portfolio`} icon={<AlertTriangle className="w-4 h-4 text-amber-600" />} accent="border-l-amber-400" />
        </div>
        <div className="grid grid-cols-2 gap-5 mb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-3">Portfolio by Climate Category (Loans)</h4>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={160}>
                <PieChart>
                  <Pie data={climatePieData} cx="50%" cy="50%" innerRadius={44} outerRadius={68} dataKey="value" paddingAngle={2}>
                    {climatePieData.map(e => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => [`${Number(v).toLocaleString()} loans`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {climatePieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] text-gray-600">{d.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-800">{d.value.toLocaleString()} ({pct((d.value / climate.total) * 100)})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-3">Climate Lending by Category ({currency})</h4>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={climateBalanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => currency === 'USD' ? `$${(v / KES_TO_USD / 1e6).toFixed(1)}M` : `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip formatter={(val: unknown) => [fmtNum(Number(val), currency)]} />
                <Bar dataKey="value" name="Balance" radius={[4, 4, 0, 0]}>
                  {climateBalanceData.map(d => <Cell key={d.name} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {scope === 'portfolio' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-1">Climate Lending Trajectory (Network, USD millions)</h4>
            <p className="text-[10px] text-gray-500 mb-3">FY23–FY26 est. — tracked climate lending across originator network</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={CLIMATE_BASELINE_TRAJECTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fy" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}M`} />
                <Tooltip formatter={(v: unknown) => [`$${Number(v).toFixed(2)}M`]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="positive"   name="Climate Positive"   stackId="a" fill={CLIMATE_COLORS.positive} />
                <Bar dataKey="resilient"  name="Climate Resilient"  stackId="a" fill={CLIMATE_COLORS.resilient} />
                <Bar dataKey="vulnerable" name="Climate Vulnerable" stackId="a" fill={CLIMATE_COLORS.vulnerable} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ================================================================
          SECTION 1 — CLIMATE POSITIVE
          ================================================================ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-bold text-gray-800">Climate Positive Lending</h3>
          <span className="text-[10px] text-gray-400 font-medium ml-1">Zero / near-zero emission finance · CO₂e avoided</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <ImpactKpiCard label="Climate Positive Loans" value={climate.positiveCount.toLocaleString()} sub={fmtNum(climate.positiveBalance, currency)} icon={<Zap className="w-4 h-4 text-green-600" />} accent="border-l-green-400" />
          <ImpactKpiCard label="CO₂e Avoided (est.)" value={`${climate.co2eAvoidedTonnes.toFixed(0)} tCO₂e`} sub="per year across all types" icon={<Globe className="w-4 h-4 text-blue-600" />} accent="border-l-blue-400" />
          <ImpactKpiCard label="Avg CO₂e Per Loan" value={climate.positiveCount > 0 ? `${(climate.co2eAvoidedTonnes / climate.positiveCount).toFixed(2)} t` : '—'} sub="weighted average by product mix" icon={<Leaf className="w-4 h-4 text-emerald-600" />} accent="border-l-emerald-400" />
          <ImpactKpiCard label="Climate Finance Share" value={pct(climate.climatePositiveSharePct)} sub="of total portfolio balance" icon={<TrendingUp className="w-4 h-4 text-green-600" />} accent="border-l-green-400" />
        </div>

        {/* Product sub-type breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
          <h4 className="text-xs font-bold text-[#003366] mb-3">Climate Positive — Breakdown by Product Type</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 uppercase text-[10px]">
                  <th className="text-left px-3 py-2">Product</th>
                  <th className="text-right px-3 py-2">Loans</th>
                  <th className="text-right px-3 py-2">Balance</th>
                  <th className="text-right px-3 py-2">tCO₂e / loan / yr</th>
                  <th className="text-right px-3 py-2">Total CO₂e Avoided (t/yr)</th>
                  <th className="text-right px-3 py-2">% of Climate +ve</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(CO2E_FACTORS).map(product => {
                  const sub = posBreakdown.find(s => s.product === product);
                  const count = sub?.count ?? 0;
                  const bal = sub?.balance ?? 0;
                  const co2e = sub?.co2eAvoided ?? 0;
                  const tPerLoan = CO2E_FACTORS[product].tCO2ePerLoanPerYear;
                  return (
                    <tr key={product} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {PRODUCT_ICONS[product]}
                          <span className="font-medium">{CLIMATE_PRODUCT_LABELS[product] ?? product}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{count.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-mono">{count > 0 ? fmtNum(bal, currency) : '—'}</td>
                      <td className="px-3 py-2 text-right font-mono text-green-700">{tPerLoan.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono text-green-700">{count > 0 ? co2e.toFixed(0) : '—'}</td>
                      <td className="px-3 py-2 text-right">{climate.positiveCount > 0 && count > 0 ? pct((count / climate.positiveCount) * 100) : '—'}</td>
                    </tr>
                  );
                })}
                <tr className="bg-green-50 font-semibold">
                  <td className="px-3 py-2 text-green-800">Total Climate Positive</td>
                  <td className="px-3 py-2 text-right font-mono">{climate.positiveCount.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtNum(climate.positiveBalance, currency)}</td>
                  <td className="px-3 py-2 text-right font-mono text-green-700">—</td>
                  <td className="px-3 py-2 text-right font-mono text-green-700">{climate.co2eAvoidedTonnes.toFixed(0)}</td>
                  <td className="px-3 py-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <InfoBar>
            <strong>E-Boda:</strong> Electric motorcycle vs petrol boda-boda. Net: ~0.58 tCO₂e/loan/yr. IPCC AR6 + IRENA Kenya grid (2022).<br />
            <strong>EV:</strong> Electric 4WD vs petrol equivalent. Net: ~2.02 tCO₂e/loan/yr. MDB Common Principles activity 8.6.<br />
            <strong>Solar Home:</strong> Displaces kerosene and charcoal. Net: ~0.47 tCO₂e/loan/yr. GOGLA Sector Impact (2023).<br />
            <strong>Solar Pump:</strong> Displaces diesel irrigation pump. Net: ~1.61 tCO₂e/loan/yr. IFC Lighting Africa (2022).<br />
            All figures are proxy-based estimates. Actual savings depend on utilisation, grid factor trajectory, and local baselines.
          </InfoBar>
        </div>
      </div>

      {/* ================================================================
          SECTION 2 — CLIMATE RESILIENT
          ================================================================ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-800">Climate Resilient Lending</h3>
          <span className="text-[10px] text-gray-400 font-medium ml-1">Agri · MSME · SACCO · crop-cycle aligned · risk-based pricing</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <ImpactKpiCard label="Resilient Loans" value={climate.resilientCount.toLocaleString()} sub={fmtNum(climate.resilientBalance, currency)} icon={<Shield className="w-4 h-4 text-blue-600" />} accent="border-l-blue-400" />
          <ImpactKpiCard label="Women Secondary Income" value={resBreakdown.womenAgriCount.toLocaleString()} sub="Group Agri borrowers (proxy)" icon={<Heart className="w-4 h-4 text-pink-500" />} accent="border-l-pink-400" />
          <ImpactKpiCard label="Crop Cycle Aligned" value={pct(resBreakdown.cropCycleAlignedPct)} sub="Agri loans disbursed at planting" icon={<Sprout className="w-4 h-4 text-teal-600" />} accent="border-l-teal-400" />
          <ImpactKpiCard
            label="Risk-Based Pricing Benefit"
            value={resBreakdown.pricingBenefitPct > 0 ? `${resBreakdown.pricingBenefitPct.toFixed(1)}% lower rate` : 'No premium'}
            sub={`Resilient avg: ${resBreakdown.avgRateResilient.toFixed(1)}% vs overall: ${resBreakdown.avgRateOverall.toFixed(1)}%`}
            icon={<TrendingDown className="w-4 h-4 text-indigo-600" />}
            accent="border-l-indigo-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-5 mb-4">
          {/* Sub-category breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-3">Resilient Sub-Categories</h4>
            <div className="space-y-2.5">
              {[
                { label: 'Women Secondary Income (Group Agri)', count: resBreakdown.womenAgriCount,   balance: resBreakdown.womenAgriBalance,   color: 'bg-pink-400',  desc: 'Group Agri (women proxy)' },
                { label: 'Irrigation Loans (≥ KES 150K Agri)',  count: resBreakdown.irrigationCount,  balance: resBreakdown.irrigationBalance,  color: 'bg-blue-400',  desc: 'Larger Agri-Finance — irrigation infrastructure' },
                { label: 'Farm Input Loans (< KES 80K Agri)',   count: resBreakdown.farmInputCount,   balance: resBreakdown.farmInputBalance,   color: 'bg-teal-400',  desc: 'Small agri-input finance: seeds, fertilizer' },
                { label: 'General Agri (KES 80K–150K)',         count: resBreakdown.generalAgriCount, balance: resBreakdown.generalAgriBalance, color: 'bg-green-400', desc: 'Mid-range agri credit' },
                { label: 'MSME (Climate Resilient Geos)',        count: resBreakdown.msmeCount,        balance: resBreakdown.msmeBalance,        color: 'bg-indigo-400', desc: 'MSME loans in low/medium risk geographies' },
                { label: 'SACCO / Cooperative',                  count: resBreakdown.saccoCount,       balance: resBreakdown.saccoBalance,       color: 'bg-violet-400', desc: 'Community savings and cooperative lending' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div>
                      <span className="text-[10px] font-medium text-gray-700">{row.label}</span>
                      <span className="text-[9px] text-gray-400 ml-2">{row.desc}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-800 shrink-0 ml-2">
                      {row.count.toLocaleString()} — {fmtNum(row.balance, currency)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${row.color}`}
                      style={{ width: `${climate.resilientCount > 0 ? Math.min((row.count / climate.resilientCount) * 100, 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crop cycle + pricing */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h4 className="text-xs font-bold text-[#003366] mb-3 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-teal-600" /> Crop Cycle Aligned Repayment
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-teal-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-teal-700">{resBreakdown.cropCycleAlignedCount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Crop-cycle aligned Agri loans</p>
                  <p className="text-[10px] text-gray-400">Disbursed in Oct–Dec or Mar–Apr</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">{pct(resBreakdown.cropCycleAlignedPct)}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Of all Agri-Finance loans</p>
                  <p className="text-[10px] text-gray-400">aligned to planting seasons</p>
                </div>
              </div>
              <p className="text-[9px] text-gray-400 mt-2">Kenya long-rains prep: Oct–Dec. Short-rains prep: Mar–Apr. Aligned disbursements improve repayment performance.</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h4 className="text-xs font-bold text-[#003366] mb-3 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-indigo-600" /> Risk-Based Pricing Signal
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-indigo-700">{resBreakdown.avgRateResilient.toFixed(1)}%</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Avg rate — Resilient loans</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-700">{resBreakdown.avgRateOverall.toFixed(1)}%</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Avg rate — Overall portfolio</p>
                </div>
              </div>
              {resBreakdown.pricingBenefitPct > 0 && (
                <p className="text-[10px] text-green-700 font-semibold mt-2 bg-green-50 rounded px-2 py-1">
                  ✓ Resilient borrowers benefit from {resBreakdown.pricingBenefitPct.toFixed(1)}% lower average rates vs portfolio — consistent with risk-based pricing framework.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 3 — CLIMATE VULNERABLE
          ================================================================ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-800">Climate Vulnerable Borrowers</h3>
          <span className="text-[10px] text-gray-400 font-medium ml-1">High climate-risk geographies · small-holder farmers</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <ImpactKpiCard label="Vulnerable Loans" value={climate.vulnerableCount.toLocaleString()} sub={fmtNum(climate.vulnerableBalance, currency)} icon={<AlertTriangle className="w-4 h-4 text-amber-600" />} accent="border-l-amber-400" />
          <ImpactKpiCard label="Small-Holder Farmers" value={vulBreakdown.smallHolderCount.toLocaleString()} sub="Agri loan ≤ KES 40K (high risk)" icon={<Sprout className="w-4 h-4 text-orange-500" />} accent="border-l-orange-400" />
          <ImpactKpiCard
            label="Vulnerable PAR 30+"
            value={pct(vulBreakdown.par30Vulnerable)}
            sub={`vs overall: ${pct(vulBreakdown.par30Overall)}`}
            icon={<TrendingDown className="w-4 h-4 text-red-500" />}
            accent={vulBreakdown.par30Vulnerable > vulBreakdown.par30Overall * 1.2 ? 'border-l-red-400' : 'border-l-amber-400'}
          />
          <ImpactKpiCard label="Small-Holder PAR 30+" value={pct(vulBreakdown.smallHolderPar30)} sub="Most at-risk sub-segment" icon={<Shield className="w-4 h-4 text-red-500" />} accent="border-l-red-400" />
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Geography breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-3">Vulnerable Exposure by Geography</h4>
            {vulBreakdown.byGeo.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-500 uppercase text-[10px]">
                    <th className="text-left px-2 py-1.5">Geography</th>
                    <th className="text-left px-2 py-1.5">Risk</th>
                    <th className="text-right px-2 py-1.5">Loans</th>
                    <th className="text-right px-2 py-1.5">Balance</th>
                    <th className="text-right px-2 py-1.5">PAR 30+</th>
                  </tr>
                </thead>
                <tbody>
                  {vulBreakdown.byGeo.map(g => (
                    <tr key={g.geo} className="border-b border-gray-100">
                      <td className="px-2 py-1.5 font-medium">{g.geo}</td>
                      <td className="px-2 py-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${g.riskLevel === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{g.riskLevel}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right">{g.count.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmtNum(g.balance, currency)}</td>
                      <td className={`px-2 py-1.5 text-right ${g.par30 > 15 ? 'text-red-600 font-semibold' : g.par30 > 10 ? 'text-amber-600' : ''}`}>{pct(g.par30)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[10px] text-gray-400 italic">No climate-vulnerable loans in high-risk geographies for current scope.</p>
            )}
          </div>

          {/* Small-holder detail */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-3">Small-Holder Farmers (Most Vulnerable)</h4>
            <div className="space-y-3">
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-[10px] text-orange-600 mb-1 font-semibold">Definition: Agri-Finance loan ≤ KES 40,000 in high-risk geography</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="text-center">
                    <p className="text-xl font-bold text-orange-700">{vulBreakdown.smallHolderCount.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">Small-holder borrowers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-orange-700">{fmtNum(vulBreakdown.smallHolderBalance, currency)}</p>
                    <p className="text-[10px] text-gray-500">Outstanding balance</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-red-700">{pct(vulBreakdown.smallHolderPar30)}</p>
                  <p className="text-[10px] text-gray-500">PAR 30+ (small-holders)</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-700">{pct(vulBreakdown.par30Overall)}</p>
                  <p className="text-[10px] text-gray-500">PAR 30+ (portfolio avg)</p>
                </div>
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed">
                Small-holder farmers in drought-prone regions (Kisumu, Machakos, Eldoret) face amplified default risk during climate events. Proactive engagement and crop-loss insurance can significantly reduce delinquency.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 4 — SOCIO-ECONOMIC IMPACT
          ================================================================ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-gray-800">Socio-economic Impact</h3>
          <span className="text-[10px] text-gray-400 font-medium ml-1">Borrower profile · financial inclusion · income uplift</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <ImpactKpiCard label="Women Borrowers (est.)" value={pct(socio.womenPct)} sub={`${socio.womenBorrowers.toLocaleString()} of ${socio.totalBorrowers.toLocaleString()}`} icon={<Heart className="w-4 h-4 text-pink-500" />} accent="border-l-pink-400" />
          <ImpactKpiCard label="Low Income Group" value={pct(socio.lowIncomePct)} sub={`Loan < ${currency === 'USD' ? `$${(50000 / KES_TO_USD).toFixed(0)}` : 'KES 50K'}`} icon={<Shield className="w-4 h-4 text-indigo-500" />} accent="border-l-indigo-400" />
          <ImpactKpiCard label="New to Credit (NTC)" value={pct(socio.ntcPct)} sub={`${socio.ntcBorrowers.toLocaleString()} first-time micro borrowers`} icon={<Building2 className="w-4 h-4 text-violet-500" />} accent="border-l-violet-400" />
          <ImpactKpiCard label="Micro-Entrepreneurs" value={pct(socio.microEntrepreneursPct)} sub={`${socio.microEntrepreneurs.toLocaleString()} MSME borrowers`} icon={<Briefcase className="w-4 h-4 text-blue-500" />} accent="border-l-blue-400" />
          <ImpactKpiCard label="Rural Borrowers" value={pct(socio.ruralPct)} sub={`${socio.ruralBorrowers.toLocaleString()} borrowers`} icon={<MapPin className="w-4 h-4 text-teal-600" />} accent="border-l-teal-400" />
        </div>

        <div className="grid grid-cols-2 gap-5 mb-4">
          {/* Community finance reach */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-3">Financial Inclusion Reach</h4>
            <div className="space-y-3">
              {[
                { label: 'Women borrowers (proxy)',     count: socio.womenBorrowers,     pct: socio.womenPct,             color: 'bg-pink-400' },
                { label: 'Low-income borrowers',        count: socio.lowIncomeBorrowers, pct: socio.lowIncomePct,         color: 'bg-indigo-400' },
                { label: 'New to Credit (NTC)',          count: socio.ntcBorrowers,       pct: socio.ntcPct,               color: 'bg-violet-400' },
                { label: 'Micro-entrepreneurs',          count: socio.microEntrepreneurs, pct: socio.microEntrepreneursPct,color: 'bg-blue-400' },
                { label: 'Rural borrowers',              count: socio.ruralBorrowers,     pct: socio.ruralPct,             color: 'bg-teal-400' },
                { label: 'Group / cooperative lending',  count: socio.cooperativeBorrowers, pct: socio.totalBorrowers > 0 ? (socio.cooperativeBorrowers / socio.totalBorrowers) * 100 : 0, color: 'bg-purple-400' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-gray-600">{row.label}</span>
                    <span className="text-[10px] font-semibold text-gray-800">{row.count.toLocaleString()} ({pct(row.pct)})</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Income impact */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" /> Estimated Annual Income Impact
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-700">{fmtNum(socio.estimatedAnnualIncomeImpactKES, currency)}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Estimated annual income uplift</p>
                <p className="text-[10px] text-gray-400">across all borrowers</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-700">
                  {socio.totalBorrowers > 0 ? fmtNum(socio.estimatedAnnualIncomeImpactKES / socio.totalBorrowers, currency) : '—'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Per borrower per year</p>
                <p className="text-[10px] text-gray-400">estimated income uplift</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-violet-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-violet-700">{socio.jobsSupported.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Jobs supported (est.)</p>
                <p className="text-[10px] text-gray-400">direct + indirect</p>
              </div>
              <div className="bg-teal-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-teal-700">{fmtNum(socio.avgLoanSizeKES, currency)}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Average loan size</p>
                <p className="text-[10px] text-gray-400">disbursed amount</p>
              </div>
            </div>
            <InfoBar>
              <strong>Income multipliers (additional annual income per KES deployed, conservative CGAP/IFC proxies):</strong><br />
              Boda-Boda 1.2× · EV 1.0× · MSME 0.8× · SME Trade 0.6× · Solar-Pump 0.6× · Agri-Finance 0.4× · SACCO 0.3× · Solar-Home 0.15× · Check-off 0.15×<br />
              <strong>NTC proxy:</strong> Individual or Group segment with loan &lt; KES 15,000 — first-time micro-credit access.<br />
              <strong>Micro-entrepreneur proxy:</strong> MSME product or Enterprise segment with loan &lt; KES 200,000.<br />
              <strong>Jobs proxy:</strong> MSME/Enterprise 1.8 jobs/loan; Boda-Boda/EV 1.0; Agri-Finance 1.2; Solar-Pump 1.3; others 0.5.<br />
              All estimates are proxy-based. Actual impact requires borrower-level survey data.
            </InfoBar>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 5 — CLIMATE GEOGRAPHY RISK MATRIX
          ================================================================ */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-800">Climate Geography Risk Matrix</h3>
          {highRiskRecs > 0 && (
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold ml-1">
              {highRiskRecs} high-risk geo{highRiskRecs > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {/* 3-stat portfolio summary */}
        {(() => {
          const highRiskLoans = loans.filter(l => ['Kisumu','Eldoret','Machakos'].includes(l.geography ?? ''));
          const agriLoans = loans.filter(l => l.product === 'Agri-Finance');
          const agriPar30 = agriLoans.length > 0 ? (agriLoans.filter(l => l.dpdAsOfReportingDate > 30).length / agriLoans.length) * 100 : 0;
          const overallPar30 = loans.length > 0 ? (loans.filter(l => l.dpdAsOfReportingDate > 30).length / loans.length) * 100 : 0;
          const writeOffRate = loans.length > 0 ? (loans.filter(l => l.loanWrittenOff).length / loans.length) * 100 : 0;
          return (
            <p className="text-[10px] text-gray-500 mb-4">
              <span className="font-semibold text-gray-700">{((highRiskLoans.length / loans.length) * 100).toFixed(1)}%</span> of portfolio in high climate-risk geographies (Kisumu, Eldoret, Machakos)
              {' · '}
              <span className={`font-semibold ${agriPar30 > overallPar30 * 1.2 ? 'text-amber-600' : 'text-gray-700'}`}>Agri PAR 30+: {agriPar30.toFixed(1)}%</span> vs portfolio {overallPar30.toFixed(1)}%
              {' · '}
              <span className="font-semibold text-gray-700">Write-off rate: {writeOffRate.toFixed(1)}%</span>
            </p>
          );
        })()}
        {/* Geography-specific climate probability matrix */}
        {geoProbs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-gray-600" />
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                Geography Risk Probability Matrix
              </p>
            </div>
            <p className="text-[10px] text-gray-500 mb-3">
              12-month rolling probability scores derived from historical climate variables (IGAD, CHIRPS, ESA CCI, IRI seasonal forecasts).
              Composite score drives the recommended portfolio action. Scores are adjusted upward when agri PAR exceeds portfolio baseline.
            </p>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-500 uppercase text-[9px]">
                    <th className="text-left px-3 py-2">Geography</th>
                    <th className="text-right px-3 py-2">Loans</th>
                    <th className="text-right px-3 py-2">Exposure</th>
                    <th className="text-right px-3 py-2">PAR 30+</th>
                    <th className="px-3 py-2">Drought</th>
                    <th className="px-3 py-2">Flood</th>
                    <th className="px-3 py-2">Crop Failure</th>
                    <th className="text-center px-3 py-2">Composite</th>
                    <th className="text-center px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {geoProbs.map(g => (
                    <tr key={g.geo} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-800">{g.geo}</span>
                          <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full uppercase ${
                            g.riskLevel === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}>{g.riskLevel}</span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5 max-w-[140px] truncate" title={g.keyVariables.join(' · ')}>
                          {g.keyVariables[0]}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">{g.affectedLoans.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{fmtNum(g.exposureBalance, currency)}</td>
                      <td className={`px-3 py-2 text-right ${g.par30 > 15 ? 'text-red-600 font-semibold' : g.par30 > 10 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {pct(g.par30)}
                      </td>
                      <td className="px-3 py-2 w-28"><ProbBar value={g.droughtProbability} thresholds={[25, 40]} /></td>
                      <td className="px-3 py-2 w-28"><ProbBar value={g.floodProbability} thresholds={[25, 40]} /></td>
                      <td className="px-3 py-2 w-28"><ProbBar value={g.cropFailureProbability} thresholds={[25, 40]} /></td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-sm font-bold ${
                          g.compositeScore >= 45 ? 'text-red-600' : g.compositeScore >= 35 ? 'text-orange-600' :
                          g.compositeScore >= 25 ? 'text-amber-600' : 'text-green-600'
                        }`}>{g.compositeScore}</span>
                        {g.stressAdjustment > 0 && (
                          <p className="text-[8px] text-gray-400">+{g.stressAdjustment}% stress adj.</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center"><ActionBadge actionType={g.actionType} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                <p className="text-[9px] text-gray-400">
                  Composite score = 0.35 × max(drought, flood) + 0.40 × crop failure + 0.25 × max(all three).
                  Thresholds: ≥45 restructure · ≥35 moratorium · ≥25 watchlist · &lt;25 monitor.
                  Sources: IGAD Climate Prediction & Applications Centre, CHIRPS v2.0, ESA CCI Soil Moisture, IRI Seasonal Forecasts.
                </p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Only geographies present in the current portfolio scope are shown. Switch to Portfolio scope for full network coverage.
            </p>
          </div>
        )}
        {geoProbs.length === 0 && (
          <p className="text-[10px] text-gray-400 italic">No high or medium risk geographies detected in the current loan scope.</p>
        )}
      </div>

      {/* ================================================================
          SECTION 6 — CLIMATE EARLY WARNING SYSTEM (Two-Tier)
          ================================================================ */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Signal className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-bold text-gray-800">Climate Early Warning System</h3>
        </div>
        <p className="text-[10px] text-gray-500 mb-5">
          Two-tier EWI framework — <span className="font-semibold text-violet-700">Tier 1</span> uses external climate science data to predict stress 2–6 months ahead of the portfolio;{' '}
          <span className="font-semibold text-indigo-700">Tier 2</span> confirms the impact in live loan performance data.
        </p>

        {/* Tier 1 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Satellite className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">Tier 1 — Climate Lead Indicators</span>
            <span className="text-[10px] text-gray-400 ml-1">Predictive · External climate data · IRI / CHIRPS / NOAA CPC</span>
          </div>
          {tierOneEWI.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {tierOneEWI.map(ewi => <Tier1Card key={ewi.code} ewi={ewi} />)}
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 italic">No loan data available for EWI computation.</p>
          )}
        </div>

        {/* Tier 2 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Tier 2 — Portfolio Response Indicators</span>
            <span className="text-[10px] text-gray-400 ml-1">Confirmatory · Live portfolio data</span>
          </div>
          {tierTwoEWI.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {tierTwoEWI.map(ewi => <Tier2Card key={ewi.code} ewi={ewi} />)}
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 italic">No loan data available for EWI computation.</p>
          )}
          <p className="text-[9px] text-gray-400 mt-3">
            P1 on-time rate = loans with DPD = 0 as a collection efficiency proxy. P2 active signal zones: {[...ACTIVE_SIGNAL_GEOS].join(', ')} (L1 ≥35% or L2 ≤−0.03).
            P3 target trajectory: ≥60% climate-classified loan share aligned to fund Paris commitment.
          </p>
        </div>
      </div>
    </div>
  );
}
