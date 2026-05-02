'use client';

import { useState, useMemo, type ReactNode } from 'react';
import type { LoanLevelRow } from '@/lib/types';
import {
  computeClimateMetrics,
  computeClimateEWI,
  computeSocioeconomicMetrics,
  CLIMATE_RISK_ZONES,
  CO2E_FACTORS,
  CLIMATE_BASELINE_TRAJECTORY,
  KES_TO_USD,
  type ClimateEWI,
} from '@/lib/climateImpact';
import {
  Leaf, Zap, Shield, Users, MapPin, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, Info, Heart, Briefcase, TreePine, Globe,
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

// ---- sub-components ----

function ImpactKpiCard({
  label, value, sub, icon, accent,
}: {
  label: string; value: string; sub?: string;
  icon: ReactNode; accent: string;
}) {
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
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] text-blue-600 hover:text-blue-800 font-medium"
      >
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

function EwiCard({ ewi }: { ewi: ClimateEWI }) {
  const [expanded, setExpanded] = useState(false);
  const theme = {
    ok: {
      bg: 'bg-green-50', border: 'border-green-200',
      badge: 'bg-green-100 text-green-700',
      icon: <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
      label: 'On Track',
    },
    watch: {
      bg: 'bg-amber-50', border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
      label: 'Watch',
    },
    alert: {
      bg: 'bg-red-50', border: 'border-red-200',
      badge: 'bg-red-100 text-red-700',
      icon: <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />,
      label: 'Alert',
    },
  }[ewi.status];

  return (
    <div className={`rounded-lg border p-3 ${theme.bg} ${theme.border}`}>
      <div className="flex items-start gap-2">
        {theme.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-semibold text-gray-800">{ewi.label}</p>
                {ewi.isSimulated && (
                  <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium tracking-wide">
                    SIMULATED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">{ewi.description}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${theme.badge}`}>{ewi.value}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${theme.badge}`}>
                {theme.label}
              </span>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-gray-400 hover:text-gray-600 ml-1"
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {expanded && (
            <p className="text-[10px] text-gray-600 mt-2 pt-2 border-t border-gray-200 leading-relaxed">
              {ewi.detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    positive: 'bg-green-100 text-green-700',
    resilient: 'bg-blue-100 text-blue-700',
    vulnerable: 'bg-amber-100 text-amber-700',
  };
  const labels: Record<string, string> = {
    positive: 'Climate Positive',
    resilient: 'Climate Resilient',
    vulnerable: 'Climate Vulnerable',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[category] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[category] ?? category}
    </span>
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

  const climate = useMemo(() => computeClimateMetrics(loans), [loans]);
  const ewi = useMemo(() => computeClimateEWI(loans), [loans]);
  const socio = useMemo(() => computeSocioeconomicMetrics(loans), [loans]);

  const activeAlerts = ewi.filter(e => e.status !== 'ok').length;

  // Donut chart data
  const climatePieData = [
    { name: 'Climate Positive', value: climate.positiveCount, color: CLIMATE_COLORS.positive },
    { name: 'Climate Resilient', value: climate.resilientCount, color: CLIMATE_COLORS.resilient },
    { name: 'Climate Vulnerable', value: climate.vulnerableCount, color: CLIMATE_COLORS.vulnerable },
    { name: 'Unclassified', value: climate.unclassifiedCount, color: CLIMATE_COLORS.unclassified },
  ].filter(d => d.value > 0);

  const climateBalanceData = [
    { name: 'Climate +ve', value: climate.positiveBalance, color: CLIMATE_COLORS.positive },
    { name: 'Climate Resilient', value: climate.resilientBalance, color: CLIMATE_COLORS.resilient },
    { name: 'Climate Vulnerable', value: climate.vulnerableBalance, color: CLIMATE_COLORS.vulnerable },
  ].filter(d => d.value > 0);

  // Urban/rural distribution for chart
  const geoDistData = [
    { name: 'Urban', value: socio.urbanBorrowers },
    { name: 'Peri-Urban', value: socio.periUrbanBorrowers },
    { name: 'Rural', value: socio.ruralBorrowers },
  ];

  if (loans.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        No loan data available. Upload a loan book to see impact analytics.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-800">Impact Dashboard</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {scope === 'portfolio' ? 'Full Portfolio' : nbfiName} — Climate & Socioeconomic Monitoring
          </p>
        </div>
        {/* Currency toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['KES', 'USD'] as const).map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                currency === c ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================
          SECTION 1 — CLIMATE IMPACT
          ================================================================ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-bold text-gray-800">Climate Impact</h3>
          <span className="text-[10px] text-gray-400 font-medium ml-1">
            Kaleidofin Africa Climate Taxonomy · MDB/IDFC Common Principles basis
          </span>
        </div>

        {/* Climate KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          <ImpactKpiCard
            label="Climate Finance Share"
            value={pct(climate.climatePositiveSharePct)}
            sub="Climate Positive (Common Principles)"
            icon={<Zap className="w-4 h-4 text-green-600" />}
            accent="border-l-green-400"
          />
          <ImpactKpiCard
            label="Total Climate Lending"
            value={fmtNum(climate.totalClimateBalance, currency)}
            sub={`${pct(climate.totalClimateSharePct)} of portfolio`}
            icon={<Leaf className="w-4 h-4 text-emerald-600" />}
            accent="border-l-emerald-400"
          />
          <ImpactKpiCard
            label="Agri-Households Reached"
            value={climate.agriHouseholdCount.toLocaleString()}
            sub="Climate Resilient credit"
            icon={<TreePine className="w-4 h-4 text-teal-600" />}
            accent="border-l-teal-400"
          />
          <ImpactKpiCard
            label="Climate-Vulnerable Borrowers"
            value={climate.climateVulnerableCount.toLocaleString()}
            sub={`${pct((climate.climateVulnerableCount / climate.total) * 100)} of portfolio`}
            icon={<Shield className="w-4 h-4 text-amber-600" />}
            accent="border-l-amber-400"
          />
          <ImpactKpiCard
            label="CO₂e Avoided (est.)"
            value={`${climate.co2eAvoidedTonnes.toFixed(0)} tCO₂e`}
            sub="per year, proxy-based"
            icon={<Globe className="w-4 h-4 text-blue-600" />}
            accent="border-l-blue-400"
          />
        </div>

        {/* Taxonomy legend + category breakdown charts */}
        <div className="grid grid-cols-2 gap-5 mb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-3">Portfolio by Climate Category (Loans)</h4>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie
                    data={climatePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {climatePieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
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
                    <span className="text-[10px] font-semibold text-gray-800">
                      {d.value.toLocaleString()} ({pct((d.value / climate.total) * 100)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-3">
              Climate Lending by Category ({currency})
            </h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={climateBalanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis
                  tick={{ fontSize: 9 }}
                  tickFormatter={v =>
                    currency === 'USD'
                      ? `$${(v / KES_TO_USD / 1e6).toFixed(1)}M`
                      : `${(v / 1e6).toFixed(0)}M`
                  }
                />
                <Tooltip formatter={(val: unknown) => [fmtNum(Number(val), currency)]} />
                <Bar dataKey="value" name="Balance" radius={[4, 4, 0, 0]}>
                  {climateBalanceData.map(d => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Female borrowers in climate segments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-pink-500" />
            <h4 className="text-xs font-bold text-[#003366]">Female Borrowers in Climate-Impacted Segments</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-600">
                {climate.femaleBorrowersInClimate.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Estimated women borrowers</p>
              <p className="text-[10px] text-gray-400">in climate-classified loans</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {pct(climate.total > 0 ? (climate.femaleBorrowersInClimate / (climate.positiveCount + climate.resilientCount + climate.vulnerableCount)) * 100 : 0)}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Share of climate-classified loans</p>
              <p className="text-[10px] text-gray-400">held by women (proxy)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {pct(climate.total > 0 ? (climate.femaleBorrowersInClimate / climate.total) * 100 : 0)}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Women in total portfolio</p>
              <p className="text-[10px] text-gray-400">who are climate-segment borrowers</p>
            </div>
          </div>
          <InfoBar>
            Women borrower share is estimated using segment-level proxy rates consistent with East African MFI
            research: Group lending 85% women (IFC Women in MSME Finance, 2019), Individual lending 50%,
            Enterprise lending 40%. Actual gender data should be collected at originator level for precise reporting.
          </InfoBar>
        </div>

        {/* CO2e detail card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-[#003366]">CO₂e Avoided — Detail & Methodology</h4>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-green-600 mb-1">Boda-Boda (e-boda) loans</p>
              <p className="text-xl font-bold text-green-700">{climate.positiveCount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">Climate Positive loans</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-blue-600 mb-1">Estimated CO₂e avoided</p>
              <p className="text-xl font-bold text-blue-700">{climate.co2eAvoidedTonnes.toFixed(0)} t</p>
              <p className="text-[10px] text-gray-400">per year (proxy)</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-500 mb-1">Emission factor</p>
              <p className="text-xl font-bold text-gray-700">0.58 t</p>
              <p className="text-[10px] text-gray-400">CO₂e per loan per year</p>
            </div>
          </div>
          <InfoBar>
            <strong>Scope:</strong> Climate Positive loans only (Boda-Boda / e-boda, MDB Common Principles activity 8.6).<br />
            <strong>Emission factor basis:</strong> Petrol boda-boda — 15,000 km/yr at 30 km/L → 500 L × 2.31 kgCO₂/L = 1,155 kgCO₂e/yr.
            E-boda — 0.08 kWh/km × 15,000 km = 1,200 kWh × 0.48 kgCO₂/kWh (Kenya grid, IRENA 2022) = 576 kgCO₂e/yr.
            Net saving: ≈ 579 kgCO₂e ≈ 0.58 tCO₂e per active loan per year.<br />
            <strong>Sources:</strong> IPCC AR6 (2022); IRENA Kenya grid emission factor (2022); MDB/IDFC Common Principles for Climate Mitigation Finance Tracking (Dec 2023).<br />
            <strong>Limitations:</strong> Proxy-based; actual savings depend on vehicle utilisation, charging infrastructure, and grid decarbonisation trajectory. Not yet independently verified.
          </InfoBar>
        </div>

        {/* Portfolio scope: climate baseline trajectory */}
        {scope === 'portfolio' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
            <h4 className="text-xs font-bold text-[#003366] mb-1">
              Climate Impact Lending — Baseline Trajectory (Network)
            </h4>
            <p className="text-[10px] text-gray-500 mb-3">
              Tracked climate lending across the originator network FY23–FY26 est. (USD millions)
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={CLIMATE_BASELINE_TRAJECTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fy" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}M`} />
                <Tooltip formatter={(v: unknown) => [`$${Number(v).toFixed(2)}M`]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="resilient" name="Climate Resilient" stackId="a" fill={CLIMATE_COLORS.resilient} />
                <Bar dataKey="vulnerable" name="Climate Vulnerable" stackId="a" fill={CLIMATE_COLORS.vulnerable} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-gray-400 mt-2">
              Source: Kaleidofin Africa internal climate impact data. FY26 figure is estimated.
              Climate Positive category not separately tracked in FY23–FY25 baseline.
            </p>
          </div>
        )}
      </div>

      {/* ================================================================
          SECTION 2 — CLIMATE EARLY WARNING INDICATORS
          ================================================================ */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-800">Climate Early Warning Indicators</h3>
          {activeAlerts > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
              {activeAlerts} active signal{activeAlerts > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-500 mb-3">
          Monitoring geographic, seasonal, and structural climate risk signals.
          Indicators marked <span className="bg-gray-200 text-gray-500 px-1 rounded text-[9px] font-medium">SIMULATED</span> use
          deterministic proxies pending live seasonal baseline data.
        </p>

        {/* Climate risk zone legend */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
          <p className="text-[10px] font-semibold text-gray-600 mb-2">Climate Risk Zone Classification</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CLIMATE_RISK_ZONES).map(([geo, level]) => (
              <span
                key={geo}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  level === 'high' ? 'bg-red-100 text-red-700' :
                  level === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}
              >
                {geo} ({level})
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {ewi.map(indicator => (
            <EwiCard key={indicator.id} ewi={indicator} />
          ))}
        </div>
      </div>

      {/* ================================================================
          SECTION 3 — SOCIOECONOMIC IMPACT
          ================================================================ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-gray-800">Socioeconomic Impact</h3>
          <span className="text-[10px] text-gray-400 font-medium ml-1">
            Borrower profile · income segments · employment
          </span>
        </div>

        {/* Socioeconomic KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          <ImpactKpiCard
            label="Women Borrowers (est.)"
            value={pct(socio.womenPct)}
            sub={`${socio.womenBorrowers.toLocaleString()} of ${socio.totalBorrowers.toLocaleString()}`}
            icon={<Heart className="w-4 h-4 text-pink-500" />}
            accent="border-l-pink-400"
          />
          <ImpactKpiCard
            label="Rural Borrowers"
            value={pct(socio.ruralPct)}
            sub={`${socio.ruralBorrowers.toLocaleString()} borrowers`}
            icon={<MapPin className="w-4 h-4 text-teal-600" />}
            accent="border-l-teal-400"
          />
          <ImpactKpiCard
            label="Low-Income Segment"
            value={pct(socio.lowIncomePct)}
            sub={`Loan < ${currency === 'USD' ? `$${(50000 / KES_TO_USD).toFixed(0)}` : 'KES 50K'}`}
            icon={<Shield className="w-4 h-4 text-indigo-500" />}
            accent="border-l-indigo-400"
          />
          <ImpactKpiCard
            label="Avg Loan Size"
            value={fmtNum(socio.avgLoanSizeKES, currency)}
            sub="disbursed amount"
            icon={<Briefcase className="w-4 h-4 text-blue-500" />}
            accent="border-l-blue-400"
          />
          <ImpactKpiCard
            label="Jobs Supported (est.)"
            value={socio.jobsSupported.toLocaleString()}
            sub="direct + indirect proxy"
            icon={<Users className="w-4 h-4 text-violet-500" />}
            accent="border-l-violet-400"
          />
        </div>

        {/* Borrower distribution charts */}
        <div className="grid grid-cols-2 gap-5 mb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-3">Urban / Peri-Urban / Rural Distribution</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={geoDistData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="Borrowers" radius={[4, 4, 0, 0]}>
                  <Cell fill="#6366f1" />
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#a78bfa" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-xs font-bold text-[#003366] mb-3">Community Finance Reach</h4>
            <div className="space-y-3 mt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-600">Group Lending (collective credit)</span>
                  <span className="text-[10px] font-semibold">{socio.groupLendingCount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-purple-400"
                    style={{ width: `${Math.min((socio.groupLendingCount / socio.totalBorrowers) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  {pct((socio.groupLendingCount / socio.totalBorrowers) * 100)} of portfolio
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-600">Cooperative / SACCO borrowers</span>
                  <span className="text-[10px] font-semibold">{socio.cooperativeBorrowers.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-indigo-400"
                    style={{ width: `${Math.min((socio.cooperativeBorrowers / socio.totalBorrowers) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  {pct((socio.cooperativeBorrowers / socio.totalBorrowers) * 100)} of portfolio (Group + SACCO)
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-600">Low-income borrowers</span>
                  <span className="text-[10px] font-semibold">{socio.lowIncomeBorrowers.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-teal-400"
                    style={{ width: `${Math.min(socio.lowIncomePct, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  {pct(socio.lowIncomePct)} of portfolio (loan &lt; {currency === 'USD' ? `$${(50000 / KES_TO_USD).toFixed(0)}` : 'KES 50K'})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs & methodology notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-blue-500" />
            <h4 className="text-xs font-bold text-[#003366]">Employment Impact — Proxy Estimate</h4>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="bg-violet-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-violet-700">{socio.jobsSupported.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Estimated jobs supported</p>
              <p className="text-[10px] text-gray-400">direct + indirect</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{fmtNum(socio.avgLoanSizeKES, currency)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Average loan size</p>
              <p className="text-[10px] text-gray-400">disbursed amount</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-teal-700">
                {socio.totalBorrowers > 0 ? (socio.jobsSupported / socio.totalBorrowers).toFixed(1) : '0'}x
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Jobs per borrower</p>
              <p className="text-[10px] text-gray-400">portfolio average</p>
            </div>
          </div>
          <InfoBar>
            <strong>Employment proxy methodology:</strong> MSME / Enterprise loans → 1.8 jobs per loan (IFC MSME Finance Gap, 2017);
            Boda-Boda → 1.0 job (self-employment); Agri-Finance → 1.2 jobs (seasonal farm labour including household workers);
            all other → 0.5 jobs. Estimates cover direct employment and first-tier indirect employment only.
            Does not capture supply-chain or induced effects. Actual impact assessments require borrower-level survey data.<br />
            <strong>Women borrower methodology:</strong> Group lending segment proxy 85% women; Individual 50%; Enterprise 40%
            (IFC Women in MSME Finance 2019, East Africa context).<br />
            <strong>Low-income threshold:</strong> Loan disbursed amount &lt; KES 50,000 (~$385 USD), consistent with
            financial inclusion definitions for low-income credit access in Kenya (CBK, 2023).
          </InfoBar>
        </div>
      </div>
    </div>
  );
}
