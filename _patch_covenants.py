import os

content = '''"use client";

import { useApp } from "@/context/AppContext";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { CovenantDef, CovenantReading, ProvisioningRule, LoanLevelRow, EarlyWarningAlert } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, Info, CheckCircle2, Eye, FileBarChart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from "recharts";
import mockEarlyWarnings from "../../../../../data/mock-early-warnings.json";

type TrendPoint = { date: string; value: number };
type TrendData = { actuals: TrendPoint[]; projections: TrendPoint[]; threshold: number };
const ewData = mockEarlyWarnings as {
  crarTrend: TrendData;
  collectionEfficiencyTrend: TrendData;
  par30Trend: TrendData;
  alerts: EarlyWarningAlert[];
};

function formatChartData(trend: TrendData) {
  const lastActual = trend.actuals[trend.actuals.length - 1];
  const merged: { date: string; actual: number | null; projected: number | null }[] = trend.actuals.map(d => ({
    date: d.date.slice(0, 7), actual: d.value, projected: null,
  }));
  merged[merged.length - 1].projected = lastActual.value;
  trend.projections.forEach(d => { merged.push({ date: d.date.slice(0, 7), actual: null, projected: d.value }); });
  return merged;
}

function EWSeverityIcon({ severity }: { severity: EarlyWarningAlert["severity"] }) {
  if (severity === "critical") return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (severity === "warning") return <AlertCircle className="w-4 h-4 text-amber-500" />;
  return <Info className="w-4 h-4 text-blue-500" />;
}

function EWTrendIcon({ trend }: { trend: EarlyWarningAlert["trend"] }) {
  if (trend === "deteriorating") return <TrendingDown className="w-4 h-4 text-red-500" />;
  if (trend === "improving") return <TrendingUp className="w-4 h-4 text-green-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

const BUCKET_LABELS: Record<string, string> = { normal: "Normal", watch: "Watch", substandard: "Substandard", doubtful: "Doubtful", loss: "Loss" };

function classifyLoan(loan: LoanLevelRow, rules: ProvisioningRule[]): ProvisioningRule | undefined {
  return rules.find(r => loan.dpdAsOfReportingDate >= r.dpdMin && loan.dpdAsOfReportingDate <= r.dpdMax);
}

function StatusBadge({ status }: { status: CovenantReading["status"] }) {
  const cfg = {
    compliant: { bg: "bg-green-100 text-green-700 border-green-200", label: "Compliant" },
    breached: { bg: "bg-red-100 text-red-700 border-red-200", label: "Breached" },
    watch: { bg: "bg-amber-100 text-amber-700 border-amber-200", label: "Watch" },
  };
  const { bg, label } = cfg[status];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${bg}`}>{label}</span>;
}

function fmtCov(value: number | undefined, format: string): string {
  if (value === undefined || value === null) return "\\u2014";
  if (format === "percent") return `${value}%`;
  if (format === "ratio") return `${value}x`;
  return String(value);
}

function computeHeadroom(cov: CovenantDef, actual: number | undefined): { value: number; label: string } | null {
  if (actual === undefined) return null;
  const diff = (cov.operator === ">=" || cov.operator === ">") ? actual - cov.threshold : cov.threshold - actual;
  return { value: diff, label: diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1) };
}

type TabId = "covenants" | "early-warnings";
type EWMetricKey = "crar" | "collectionEfficiency" | "par30";

export default function CovenantsPage() {
  const { user, getNBFI, loanBookData } = useApp();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [showReview, setShowReview] = useState(false);
  const tabFromUrl = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl === "early-warnings" ? "early-warnings" : "covenants");
  const [collectionSlider, setCollectionSlider] = useState(98.2);
  const [ewMetric, setEwMetric] = useState<EWMetricKey>("crar");

  const ewCharts: Record<EWMetricKey, { label: string; data: ReturnType<typeof formatChartData>; threshold: number; domain: [number, number] }> = useMemo(() => ({
    crar: { label: "CRAR Movement & Projection", data: formatChartData(ewData.crarTrend), threshold: ewData.crarTrend.threshold, domain: [12, 18] },
    collectionEfficiency: { label: "Collection Efficiency Trend", data: formatChartData(ewData.collectionEfficiencyTrend), threshold: ewData.collectionEfficiencyTrend.threshold, domain: [96, 100] },
    par30: { label: "PAR 30 Trend", data: formatChartData(ewData.par30Trend), threshold: ewData.par30Trend.threshold, domain: [0, 8] },
  }), []);

  const scenarioImpact = useMemo(() => {
    const delta = collectionSlider - 98.2;
    const projectedPar = Math.max(0, 5.2 - delta * 2).toFixed(1);
    const crarImpact = (14.7 + delta * 0.5).toFixed(1);
    return { projectedPar, crarImpact, parStatus: parseFloat(projectedPar) <= 5 ? "Compliant" : "Breached", crarStatus: parseFloat(crarImpact) >= 15 ? "Compliant" : "Breached" };
  }, [collectionSlider]);

  useEffect(() => { if (!user) router.push("/"); }, [user, router]);
  useEffect(() => { if (tabFromUrl === "early-warnings") setActiveTab("early-warnings"); }, [tabFromUrl]);

  const nbfi = getNBFI(id);
  if (!user || !nbfi) return null;

  const ewAlerts: EarlyWarningAlert[] = nbfi.earlyWarnings || ewData.alerts;
  const trendCards = [
    { metric: "CRAR", current: 14.7, unit: "%", trend: "deteriorating" as const, breachDate: "2025-06-30" },
    { metric: "Net NPA Ratio", current: 3.8, unit: "%", trend: "deteriorating" as const, breachDate: "2024-12-31" },
    { metric: "Collection Efficiency", current: 98.2, unit: "%", trend: "deteriorating" as const, breachDate: "2025-12-31" },
    { metric: "PAR 30", current: 5.2, unit: "%", trend: "deteriorating" as const, breachDate: "2025-06-30" },
    { metric: "Debt-to-Equity", current: 3.7, unit: "x", trend: "stable" as const },
  ];

  const covenants: CovenantDef[] = nbfi.covenants || [];
  const readings: CovenantReading[] = nbfi.covenantReadings || [];
  const provRules = nbfi.provisioningRules;
  const loans: LoanLevelRow[] = loanBookData[id] || [];

  const latestReadings = useMemo(() => {
    const map = new Map<string, CovenantReading>();
    for (const r of readings) { const ex = map.get(r.covenantId); if (!ex || r.date > ex.date) map.set(r.covenantId, r); }
    return map;
  }, [readings]);

  const prevReadings = useMemo(() => {
    const sorted = [...readings].sort((a, b) => b.date.localeCompare(a.date));
    const map = new Map<string, CovenantReading>();
    const seen = new Set<string>();
    for (const r of sorted) { if (!seen.has(r.covenantId)) seen.add(r.covenantId); else if (!map.has(r.covenantId)) map.set(r.covenantId, r); }
    return map;
  }, [readings]);

  const breachedCovenants = useMemo(() => covenants.filter(c => latestReadings.get(c.id)?.status === "breached"), [covenants, latestReadings]);

  const covenantHistoryData = useMemo(() => {
    const dateSet = new Set<string>();
    readings.forEach(r => dateSet.add(r.date));
    const dates = Array.from(dateSet).sort();
    return dates.map(date => {
      const row: Record<string, string | number | null> = { date: date.slice(0, 7) };
      covenants.forEach(cov => {
        const reading = readings.filter(r => r.covenantId === cov.id && r.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
        row[cov.metric] = reading ? reading.value : null;
      });
      return row;
    });
  }, [readings, covenants]);

  const computeBuckets = (rules: ProvisioningRule[]) => {
    const buckets = rules.map(r => ({ ...r, loanCount: 0, totalBalance: 0 }));
    for (const loan of loans) { const rule = classifyLoan(loan, rules); if (rule) { const b = buckets.find(x => x.bucket === rule.bucket); if (b) { b.loanCount++; b.totalBalance += loan.currentBalance; } } }
    return buckets;
  };

  const reviewBuckets = useMemo(() => { if (!provRules?.nbfi) return []; return computeBuckets(provRules.nbfi); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [provRules, loans]);
  const activeChart = ewCharts[ewMetric];
  const HISTORY_COLORS = ["#003366", "#0066cc", "#e67300", "#339966", "#cc3333", "#9933cc"];

  const getTrend = (cov: CovenantDef) => {
    const latest = latestReadings.get(cov.id);
    const prev = prevReadings.get(cov.id);
    const trending = latest && prev ? (latest.value > prev.value ? "up" : latest.value < prev.value ? "down" : "stable") : "stable";
    const isGoodTrend = (cov.operator === ">=" || cov.operator === ">") ? trending === "up" : trending === "down";
    return { trending, isGoodTrend };
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-gray-50">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Dashboard</Link>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Covenant & Early Warnings &mdash; {nbfi.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{activeTab === "covenants" ? "Real-time covenant compliance and provisioning" : "Predictive monitoring and trend analysis"}</p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setActiveTab("covenants")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "covenants" ? "bg-white text-[#003366] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Covenant Compliance</button>
              <button onClick={() => setActiveTab("early-warnings")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "early-warnings" ? "bg-white text-[#003366] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Early Warnings</button>
            </div>
            {activeTab === "covenants" && (<>
              <Link href={`/nbfi/${id}/setup`} className="flex items-center gap-2 px-4 py-2 border border-[#003366] text-[#003366] rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"><Eye className="w-4 h-4" /> Edit Covenants (Step 3)</Link>
              <button onClick={() => setShowReview(!showReview)} className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99] transition-colors"><FileBarChart className="w-4 h-4" /> {showReview ? "Hide" : "Generate"} Quarterly Review</button>
            </>)}
          </div>
        </div>

        {/* ====================== EARLY WARNINGS TAB ====================== */}
        {activeTab === "early-warnings" && (<>
          <div className="flex gap-2 mb-4">
            {([{ key: "crar" as EWMetricKey, label: "CRAR" }, { key: "collectionEfficiency" as EWMetricKey, label: "Collection Efficiency" }, { key: "par30" as EWMetricKey, label: "PAR 30" }]).map(m => (
              <button key={m.key} onClick={() => setEwMetric(m.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${ewMetric === m.key ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-gray-600 border-gray-200 hover:border-[#003366] hover:text-[#003366]"}`}>{m.label}</button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-bold text-[#003366] mb-4">{activeChart.label}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activeChart.data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={activeChart.domain} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip formatter={(val: unknown) => [`${val}%`, ""]} labelFormatter={(label: unknown) => `Period: ${label}`} />
                <Legend />
                <ReferenceLine y={activeChart.threshold} stroke="#ef4444" strokeDasharray="8 4" label={{ value: `Threshold: ${activeChart.threshold}%`, position: "right", fill: "#ef4444", fontSize: 11 }} />
                <Line type="monotone" dataKey="actual" stroke="#003366" strokeWidth={2.5} dot={{ r: 4, fill: "#003366" }} name="Actual" connectNulls={false} />
                <Line type="monotone" dataKey="projected" stroke="#003366" strokeWidth={2} strokeDasharray="8 4" dot={{ r: 3, fill: "#003366" }} name="Projected" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            {trendCards.map(card => (
              <div key={card.metric} className={`bg-white rounded-xl border p-4 ${card.trend === "deteriorating" ? "border-red-100" : card.trend === "improving" ? "border-green-100" : "border-gray-200"}`}>
                <p className="text-xs text-gray-500 mb-1 truncate">{card.metric}</p>
                <p className="text-lg font-bold text-gray-900">{card.current}{card.unit}</p>
                <div className="flex items-center gap-1 mt-2">
                  <EWTrendIcon trend={card.trend} />
                  <span className={`text-xs font-medium capitalize ${card.trend === "deteriorating" ? "text-red-500" : card.trend === "improving" ? "text-green-500" : "text-gray-400"}`}>{card.trend}</span>
                </div>
                {card.breachDate && <p className="text-[10px] text-red-400 mt-1">Breach: {card.breachDate}</p>}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-bold text-[#003366] mb-4">Active Alerts</h2>
            <div className="space-y-3">
              {ewAlerts.map(alert => {
                const borderColor = alert.severity === "critical" ? "border-l-red-500" : alert.severity === "warning" ? "border-l-amber-500" : "border-l-blue-500";
                return (
                  <div key={alert.id} className={`p-4 rounded-lg border border-gray-100 border-l-4 ${borderColor} bg-gray-50/50`}>
                    <div className="flex items-start gap-3">
                      <EWSeverityIcon severity={alert.severity} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-800">{alert.metric}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${alert.severity === "critical" ? "bg-red-100 text-red-700" : alert.severity === "warning" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{alert.severity}</span>
                        </div>
                        <p className="text-xs text-gray-600">{alert.message}</p>
                      </div>
                      <EWTrendIcon trend={alert.trend} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] mb-4">What-If Scenario Analysis</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-3">Collection Efficiency: <span className="font-bold text-[#003366]">{collectionSlider.toFixed(1)}%</span></label>
                <input type="range" min="95" max="100" step="0.1" value={collectionSlider} onChange={e => setCollectionSlider(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#003366]" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>95%</span><span>100%</span></div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-3">Projected Impact</p>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-200"><th className="text-left py-2 font-medium text-gray-500">Metric</th><th className="text-right py-2 font-medium text-gray-500">Projected</th><th className="text-right py-2 font-medium text-gray-500">Status</th></tr></thead>
                  <tbody>
                    <tr className="border-b border-gray-50"><td className="py-2 font-medium">PAR 30</td><td className="py-2 text-right font-mono">{scenarioImpact.projectedPar}%</td><td className="py-2 text-right"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${scenarioImpact.parStatus === "Compliant" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{scenarioImpact.parStatus}</span></td></tr>
                    <tr><td className="py-2 font-medium">CRAR</td><td className="py-2 text-right font-mono">{scenarioImpact.crarImpact}%</td><td className="py-2 text-right"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${scenarioImpact.crarStatus === "Compliant" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{scenarioImpact.crarStatus}</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>)}

        {/* ====================== COVENANTS TAB ====================== */}
        {activeTab === "covenants" && (<>
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-blue-700">This is a <strong>monitoring view</strong>. To edit covenant definitions go to <Link href={`/nbfi/${id}/setup`} className="underline font-medium">Step 3: Covenant &amp; Doc Setup</Link>.</p>
          </div>

          {/* Covenant Status Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {covenants.map(cov => {
              const latest = latestReadings.get(cov.id);
              const { trending, isGoodTrend } = getTrend(cov);
              return (
                <div key={cov.id} className={`bg-white rounded-xl border p-5 ${latest?.status === "breached" ? "border-red-200" : latest?.status === "watch" ? "border-amber-200" : "border-gray-200"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">{cov.metric}</h3>
                    {latest && <StatusBadge status={latest.status} />}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Required: {cov.operator} {fmtCov(cov.threshold, cov.format)}</p>
                      <p className="text-lg font-bold text-gray-900">Actual: {fmtCov(latest?.value, cov.format)}</p>
                    </div>
                    <div className={`flex items-center gap-0.5 text-xs font-medium ${isGoodTrend ? "text-green-600" : trending === "stable" ? "text-gray-400" : "text-red-500"}`}>
                      {trending === "up" && <TrendingUp className="w-4 h-4" />}
                      {trending === "down" && <TrendingDown className="w-4 h-4" />}
                      {trending === "stable" && <Minus className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Covenant Summary Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-bold text-[#003366] mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Full Covenant Summary</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Metric</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Frequency</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Threshold</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Actual</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Headroom</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-500">Trend</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {covenants.map(cov => {
                  const latest = latestReadings.get(cov.id);
                  const headroom = computeHeadroom(cov, latest?.value);
                  const { trending, isGoodTrend } = getTrend(cov);
                  return (
                    <tr key={cov.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{cov.metric}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{cov.frequency}</td>
                      <td className="px-4 py-3 text-right font-mono">{cov.operator} {fmtCov(cov.threshold, cov.format)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{fmtCov(latest?.value, cov.format)}</td>
                      <td className="px-4 py-3 text-right">{headroom && <span className={`font-mono font-medium ${headroom.value >= 0 ? "text-green-600" : "text-red-600"}`}>{headroom.label}{cov.format === "percent" ? " pp" : cov.format === "ratio" ? "x" : ""}</span>}</td>
                      <td className="px-4 py-3 text-center"><span className={`inline-flex items-center gap-0.5 ${isGoodTrend ? "text-green-600" : trending === "stable" ? "text-gray-400" : "text-red-500"}`}>{trending === "up" && <TrendingUp className="w-3.5 h-3.5" />}{trending === "down" && <TrendingDown className="w-3.5 h-3.5" />}{trending === "stable" && <Minus className="w-3.5 h-3.5" />}</span></td>
                      <td className="px-4 py-3 text-center">{latest && <StatusBadge status={latest.status} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Historical Covenant Readings Chart */}
          {covenantHistoryData.length > 0 && covenants.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-sm font-bold text-[#003366] mb-4">Covenant Value History</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={covenantHistoryData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {covenants.map((cov, i) => (
                    <Line key={cov.id} type="monotone" dataKey={cov.metric} stroke={HISTORY_COLORS[i % HISTORY_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Dual Provisioning */}
          <h2 className="text-sm font-bold text-[#003366] mb-3 flex items-center gap-2"><Eye className="w-4 h-4" /> Dual Provisioning Policy Comparison</h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            {[{ title: "NBFI Provisioning Policy", rules: provRules?.nbfi }, { title: "NCBA Provisioning Policy", rules: provRules?.ncba }].map(({ title, rules }) => (
              <div key={title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
                {rules && loans.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 font-medium text-gray-500">Bucket</th><th className="text-left px-3 py-2 font-medium text-gray-500">DPD Range</th><th className="text-right px-3 py-2 font-medium text-gray-500"># Loans</th><th className="text-right px-3 py-2 font-medium text-gray-500">Balance (KES)</th><th className="text-right px-3 py-2 font-medium text-gray-500">Prov. %</th></tr></thead>
                    <tbody>
                      {computeBuckets(rules).map(b => (
                        <tr key={b.bucket} className="border-b border-gray-50">
                          <td className="px-3 py-2 font-medium">{BUCKET_LABELS[b.bucket]}</td>
                          <td className="px-3 py-2 font-mono">{b.dpdMin}&ndash;{b.dpdMax === 9999 ? "\\u221e" : b.dpdMax}</td>
                          <td className="px-3 py-2 text-right font-mono">{b.loanCount.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-mono">{b.totalBalance.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-mono">{b.provisionPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (<div className="py-8 text-center text-gray-400 text-xs">{!rules ? "Provisioning rules not configured" : "No loan data available"}</div>)}
              </div>
            ))}
          </div>

          {/* Quarterly Review */}
          {showReview && (
            <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] mb-4 flex items-center gap-2"><FileBarChart className="w-4 h-4" /> Quarterly Loan Book Review</h2>
              {loans.length > 0 && reviewBuckets.length > 0 ? (
                <table className="w-full text-sm">
                  <thead><tr className="bg-[#003366] text-white"><th className="text-left px-4 py-2.5 font-medium">Classification</th><th className="text-left px-4 py-2.5 font-medium">DPD Range</th><th className="text-right px-4 py-2.5 font-medium"># Loans</th><th className="text-right px-4 py-2.5 font-medium">Total Balance (KES)</th><th className="text-right px-4 py-2.5 font-medium">% of Portfolio</th><th className="text-right px-4 py-2.5 font-medium">Provision (KES)</th></tr></thead>
                  <tbody>
                    {reviewBuckets.map(b => { const tot = reviewBuckets.reduce((s, x) => s + x.totalBalance, 0); return (
                      <tr key={b.bucket} className="border-b border-gray-100">
                        <td className="px-4 py-2.5 font-medium">{BUCKET_LABELS[b.bucket]}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{b.dpdMin}&ndash;{b.dpdMax === 9999 ? "\\u221e" : b.dpdMax} days</td>
                        <td className="px-4 py-2.5 text-right font-mono">{b.loanCount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{b.totalBalance.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{tot > 0 ? ((b.totalBalance / tot) * 100).toFixed(1) : "0.0"}%</td>
                        <td className="px-4 py-2.5 text-right font-mono">{Math.round(b.totalBalance * b.provisionPercent / 100).toLocaleString()}</td>
                      </tr>
                    ); })}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-4 py-2.5">Total</td><td></td>
                      <td className="px-4 py-2.5 text-right font-mono">{reviewBuckets.reduce((s, b) => s + b.loanCount, 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{reviewBuckets.reduce((s, b) => s + b.totalBalance, 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono">100.0%</td>
                      <td className="px-4 py-2.5 text-right font-mono">{reviewBuckets.reduce((s, b) => s + Math.round(b.totalBalance * b.provisionPercent / 100), 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (<p className="text-sm text-gray-400 text-center py-8">No loan book data available for review.</p>)}
            </div>
          )}

          {/* Breach Alerts */}
          {breachedCovenants.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
              <h2 className="text-sm font-bold text-red-600 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Covenant Breaches ({breachedCovenants.length})</h2>
              <div className="space-y-3">
                {breachedCovenants.map(cov => { const latest = latestReadings.get(cov.id); return (
                  <div key={cov.id} className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-800">{cov.metric}</span>
                        <span className="px-1.5 py-0.5 bg-red-200 text-red-800 text-[10px] rounded font-bold uppercase">Critical</span>
                      </div>
                      <p className="text-xs text-gray-600">Actual: {fmtCov(latest?.value, cov.format)} &mdash; Threshold: {cov.operator} {fmtCov(cov.threshold, cov.format)}</p>
                      <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Recommended:</span> Escalate to credit committee, request remediation plan within 14 days.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-400">Breached since</p>
                      <p className="text-xs font-mono text-red-600">{latest?.date}</p>
                    </div>
                  </div>
                ); })}
              </div>
            </div>
          )}
        </>)}
      </main>
    </div>
  );
}
'''

with open('src/app/nbfi/[id]/covenants/page.tsx', 'w') as f:
    f.write(content)
print('DONE')
