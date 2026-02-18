'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { EarlyWarningAlert } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import mockEarlyWarnings from '../../../../../data/mock-early-warnings.json';

type TrendPoint = { date: string; value: number };
type TrendData = { actuals: TrendPoint[]; projections: TrendPoint[]; threshold: number };

const ewData = mockEarlyWarnings as {
  crarTrend: TrendData;
  collectionEfficiencyTrend: TrendData;
  par30Trend: TrendData;
  alerts: EarlyWarningAlert[];
};

function formatChartData(trend: TrendData) {
  const actuals = trend.actuals.map(d => ({
    date: d.date.slice(0, 7),
    actual: d.value,
    projected: null as number | null,
  }));
  const lastActual = trend.actuals[trend.actuals.length - 1];
  const projections = [
    { date: lastActual.date.slice(0, 7), actual: null as number | null, projected: lastActual.value },
    ...trend.projections.map(d => ({
      date: d.date.slice(0, 7),
      actual: null as number | null,
      projected: d.value,
    })),
  ];
  return [...actuals, ...projections.slice(1)];
}

function SeverityIcon({ severity }: { severity: EarlyWarningAlert['severity'] }) {
  if (severity === 'critical') return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (severity === 'warning') return <AlertCircle className="w-4 h-4 text-amber-500" />;
  return <Info className="w-4 h-4 text-blue-500" />;
}

function TrendIcon({ trend }: { trend: EarlyWarningAlert['trend'] }) {
  if (trend === 'deteriorating') return <TrendingDown className="w-4 h-4 text-red-500" />;
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

export default function EarlyWarningsPage() {
  const { user, getNBFI } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [collectionSlider, setCollectionSlider] = useState(98.2);

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);
  if (!user || !nbfi) return null;

  const alerts: EarlyWarningAlert[] = nbfi.earlyWarnings || ewData.alerts;
  const crarChartData = useMemo(() => formatChartData(ewData.crarTrend), []);

  const trendCards = [
    { metric: 'CRAR', current: 14.7, unit: '%', trend: 'deteriorating' as const, breachDate: '2025-06-30' },
    { metric: 'Net NPA Ratio', current: 3.8, unit: '%', trend: 'deteriorating' as const, breachDate: '2024-12-31' },
    { metric: 'Collection Efficiency', current: 98.2, unit: '%', trend: 'deteriorating' as const, breachDate: '2025-12-31' },
    { metric: 'PAR 30', current: 5.2, unit: '%', trend: 'deteriorating' as const, breachDate: '2025-06-30' },
    { metric: 'Debt-to-Equity', current: 3.7, unit: 'x', trend: 'stable' as const, breachDate: undefined },
  ];

  const scenarioImpact = useMemo(() => {
    const baseEfficiency = 98.2;
    const delta = collectionSlider - baseEfficiency;
    const basePar = 5.2;
    const projectedPar = Math.max(0, basePar - delta * 2).toFixed(1);
    const crarImpact = (14.7 + delta * 0.5).toFixed(1);
    const parStatus = parseFloat(projectedPar) <= 5 ? 'Compliant' : 'Breached';
    const crarStatus = parseFloat(crarImpact) >= 15 ? 'Compliant' : 'Breached';
    return { projectedPar, crarImpact, parStatus, crarStatus };
  }, [collectionSlider]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-gray-50">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          &larr; Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Early Warnings — {nbfi.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Predictive monitoring and trend analysis</p>
        </div>

        {/* CRAR Movement Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-[#003366] mb-4">CRAR Movement & Projection</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={crarChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[12, 18]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip
                formatter={(val: unknown) => [`${val}%`, '']}
                labelFormatter={(label: string) => `Period: ${label}`}
              />
              <ReferenceLine
                y={ewData.crarTrend.threshold}
                stroke="#ef4444"
                strokeDasharray="8 4"
                label={{ value: `Threshold: ${ewData.crarTrend.threshold}%`, position: 'right', fill: '#ef4444', fontSize: 11 }}
              />
              <Line type="monotone" dataKey="actual" stroke="#003366" strokeWidth={2.5} dot={{ r: 4, fill: '#003366' }} name="Actual" connectNulls={false} />
              <Line type="monotone" dataKey="projected" stroke="#003366" strokeWidth={2} strokeDasharray="8 4" dot={{ r: 3, fill: '#003366', strokeDasharray: '' }} name="Projected" connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Analysis Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {trendCards.map(card => (
            <div
              key={card.metric}
              className={`bg-white rounded-xl border p-4 ${
                card.trend === 'deteriorating' ? 'border-red-100' : card.trend === 'improving' ? 'border-green-100' : 'border-gray-200'
              }`}
            >
              <p className="text-xs text-gray-500 mb-1 truncate">{card.metric}</p>
              <p className="text-lg font-bold text-gray-900">{card.current}{card.unit}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendIcon trend={card.trend} />
                <span className={`text-xs font-medium capitalize ${
                  card.trend === 'deteriorating' ? 'text-red-500' : card.trend === 'improving' ? 'text-green-500' : 'text-gray-400'
                }`}>{card.trend}</span>
              </div>
              {card.breachDate && (
                <p className="text-[10px] text-red-400 mt-1">Breach: {card.breachDate}</p>
              )}
            </div>
          ))}
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-[#003366] mb-4">Active Alerts</h2>
          <div className="space-y-3">
            {alerts.map(alert => {
              const borderColor = alert.severity === 'critical' ? 'border-l-red-500' :
                alert.severity === 'warning' ? 'border-l-amber-500' : 'border-l-blue-500';
              return (
                <div key={alert.id} className={`p-4 rounded-lg border border-gray-100 border-l-4 ${borderColor} bg-gray-50/50`}>
                  <div className="flex items-start gap-3">
                    <SeverityIcon severity={alert.severity} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-800">{alert.metric}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>{alert.severity}</span>
                      </div>
                      <p className="text-xs text-gray-600">{alert.message}</p>
                    </div>
                    <TrendIcon trend={alert.trend} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scenario Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-[#003366] mb-4">What-If Scenario Analysis</h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-3">
                Collection Efficiency: <span className="font-bold text-[#003366]">{collectionSlider.toFixed(1)}%</span>
              </label>
              <input
                type="range"
                min="95"
                max="100"
                step="0.1"
                value={collectionSlider}
                onChange={e => setCollectionSlider(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#003366]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>95%</span>
                <span>100%</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-3">Projected Impact</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-500">Metric</th>
                    <th className="text-right py-2 font-medium text-gray-500">Projected Value</th>
                    <th className="text-right py-2 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 font-medium">PAR 30</td>
                    <td className="py-2 text-right font-mono">{scenarioImpact.projectedPar}%</td>
                    <td className="py-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        scenarioImpact.parStatus === 'Compliant' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{scenarioImpact.parStatus}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">CRAR</td>
                    <td className="py-2 text-right font-mono">{scenarioImpact.crarImpact}%</td>
                    <td className="py-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        scenarioImpact.crarStatus === 'Compliant' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{scenarioImpact.crarStatus}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
