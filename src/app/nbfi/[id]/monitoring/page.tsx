'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { MonitoringData, LoanLevelRow } from '@/lib/types';
import {
  Activity, Users, Banknote, TrendingUp, TrendingDown,
  Globe, Target, Calendar, CheckCircle2, Clock,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import mockMonitoring from '../../../../../data/mock-monitoring.json';

const COLORS = ['#003366', '#0066cc', '#0099ff', '#00ccff', '#66e0ff', '#339966', '#cc6633'];

type MonLevel = 'level1' | 'level2';

export default function MonitoringPage() {
  const { user, getNBFI, loanBookData } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [level, setLevel] = useState<MonLevel>('level1');

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);
  if (!user || !nbfi) return null;

  const mon: MonitoringData = (nbfi.monitoringData as MonitoringData) || (mockMonitoring as unknown as MonitoringData);
  const loans: LoanLevelRow[] = loanBookData[id] || [];

  const vintageData = mon.delinquencyByVintage || [];
  const geoData = mon.delinquencyByGeo || [];
  const purposeData = mon.compositionByPurpose || [];
  const countyData = mon.compositionByCounty || [];
  const wholesale = mon.wholesaleLoan;
  const impact = mon.impactMetrics;

  const portfolioStats = useMemo(() => {
    if (loans.length === 0) {
      return {
        totalLoans: mon.liveLoans || 0,
        totalBalance: mon.principalOutstanding || 0,
        avgBalance: mon.principalOutstanding && mon.liveLoans ? Math.round(mon.principalOutstanding / mon.liveLoans) : 0,
        collectionEff: mon.collectionEfficiency || 0,
      };
    }
    const totalBalance = loans.reduce((s, r) => s + r.currentBalance, 0);
    return {
      totalLoans: loans.length,
      totalBalance,
      avgBalance: Math.round(totalBalance / loans.length),
      collectionEff: mon.collectionEfficiency || 98.2,
    };
  }, [loans, mon]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-gray-50">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          &larr; Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Risk Monitoring Dashboard — {nbfi.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Two-tier monitoring: Level 1 (portfolio health) and Level 2 (deep-dive analytics)</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['level1', 'level2'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  level === l ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {l === 'level1' ? 'Level 1 — Portfolio' : 'Level 2 — Deep Dive'}
              </button>
            ))}
          </div>
        </div>

        {level === 'level1' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<Banknote className="w-5 h-5 text-blue-500" />}
                label="Principal Outstanding"
                value={`KES ${(portfolioStats.totalBalance / 1e6).toFixed(0)}M`}
              />
              <StatCard
                icon={<Users className="w-5 h-5 text-green-500" />}
                label="Live Loans"
                value={portfolioStats.totalLoans.toLocaleString()}
              />
              <StatCard
                icon={<Target className="w-5 h-5 text-indigo-500" />}
                label="Collection Efficiency"
                value={`${portfolioStats.collectionEff}%`}
                trend={portfolioStats.collectionEff >= 98 ? 'up' : 'down'}
              />
              <StatCard
                icon={<Activity className="w-5 h-5 text-amber-500" />}
                label="Avg Loan Size"
                value={`KES ${portfolioStats.avgBalance.toLocaleString()}`}
              />
            </div>

            {/* Delinquency by Vintage */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-[#003366] mb-4">Delinquency Rate by Vintage</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={vintageData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="vintage" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(val: unknown) => [`${val}%`, 'Delinquency Rate']} />
                    <Bar dataKey="rate" fill="#003366" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-[#003366] mb-4">Delinquency Rate by Geography</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={geoData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="geo" tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val: unknown) => [`${val}%`, 'Delinquency Rate']} />
                    <Bar dataKey="rate" fill="#0066cc" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Composition Charts */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-[#003366] mb-4">Portfolio by Purpose</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={purposeData} dataKey="pct" nameKey="purpose" cx="50%" cy="50%" outerRadius={90} label>
                      {purposeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val: unknown) => [`${val}%`, 'Share']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-[#003366] mb-4">Portfolio by County</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={countyData} dataKey="pct" nameKey="county" cx="50%" cy="50%" outerRadius={90} label>
                      {countyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val: unknown) => [`${val}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Impact Metrics */}
            {impact && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-[#003366] mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Impact Metrics
                </h2>
                <div className="grid grid-cols-5 gap-4">
                  <ImpactCard label="Total Borrowers" value={impact.totalBorrowers.toLocaleString()} />
                  <ImpactCard label="Female Borrowers" value={impact.femaleBorrowers.toLocaleString()} sub={`${((impact.femaleBorrowers / impact.totalBorrowers) * 100).toFixed(0)}% of portfolio`} />
                  <ImpactCard label="Rural Borrowers" value={impact.ruralBorrowers.toLocaleString()} sub={`${((impact.ruralBorrowers / impact.totalBorrowers) * 100).toFixed(0)}% of portfolio`} />
                  <ImpactCard label="Avg Loan Size" value={`KES ${impact.avgLoanSize.toLocaleString()}`} />
                  <ImpactCard label="Jobs Supported" value={impact.jobsSupported.toLocaleString()} />
                </div>
              </div>
            )}
          </>
        )}

        {level === 'level2' && (
          <>
            {/* Wholesale Loan Details */}
            {wholesale && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-sm font-bold text-[#003366] mb-4 flex items-center gap-2">
                  <Banknote className="w-4 h-4" /> NCBA Wholesale Loan Details
                </h2>
                <div className="grid grid-cols-4 gap-6 mb-6">
                  <div>
                    <p className="text-xs text-gray-500">Facility Amount</p>
                    <p className="text-lg font-bold text-gray-900">KES {(wholesale.facilityAmount / 1e6).toFixed(0)}M</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Outstanding</p>
                    <p className="text-lg font-bold text-gray-900">KES {(wholesale.principalOutstanding / 1e6).toFixed(1)}M</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interest Rate</p>
                    <p className="text-lg font-bold text-gray-900">{wholesale.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Maturity</p>
                    <p className="text-lg font-bold text-gray-900">{wholesale.maturityDate}</p>
                  </div>
                </div>

                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Repayment Schedule</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Date</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600">Amount (KES)</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wholesale.repaymentSchedule.map((r, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="px-4 py-2.5 font-mono text-xs">{r.date}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{r.amount.toLocaleString()}</td>
                          <td className="px-4 py-2.5">
                            <RepaymentBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Vintage Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-sm font-bold text-[#003366] mb-4">Vintage Delinquency Trend (Level 2)</h2>
              <p className="text-xs text-gray-500 mb-4">
                Older vintages show higher seasoned delinquency as expected. Recent vintages (2024-Q3+) show improved origination quality.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#003366] text-white">
                      <th className="text-left px-4 py-2.5 font-medium">Vintage</th>
                      <th className="text-right px-4 py-2.5 font-medium">Delinquency %</th>
                      <th className="text-left px-4 py-2.5 font-medium">Risk Level</th>
                      <th className="text-left px-4 py-2.5 font-medium w-80">Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vintageData.map(v => {
                      const risk = v.rate > 8 ? 'high' : v.rate > 4 ? 'medium' : 'low';
                      return (
                        <tr key={v.vintage} className="border-b border-gray-100">
                          <td className="px-4 py-2.5 font-mono text-xs">{v.vintage}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{v.rate}%</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              risk === 'high' ? 'bg-red-100 text-red-700' :
                              risk === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>{risk}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  risk === 'high' ? 'bg-red-400' : risk === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                                }`}
                                style={{ width: `${Math.min(v.rate * 5, 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Geographic Risk Heatmap */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] mb-4">Geographic Concentration & Risk</h2>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By County (Concentration)</h3>
                  {countyData.map(c => (
                    <div key={c.county} className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-gray-600 w-20">{c.county}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div className="h-full bg-[#003366] rounded-full flex items-center justify-end pr-2" style={{ width: `${c.pct}%` }}>
                          <span className="text-[10px] text-white font-semibold">{c.pct}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Geography (Delinquency)</h3>
                  {geoData.map(g => {
                    const risk = g.rate > 5 ? 'high' : g.rate > 3.5 ? 'medium' : 'low';
                    return (
                      <div key={g.geo} className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-gray-600 w-20">{g.geo}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                          <div
                            className={`h-full rounded-full flex items-center justify-end pr-2 ${
                              risk === 'high' ? 'bg-red-400' : risk === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                            }`}
                            style={{ width: `${Math.min(g.rate * 10, 100)}%` }}
                          >
                            <span className="text-[10px] text-white font-semibold">{g.rate}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, trend }: {
  icon: React.ReactNode; label: string; value: string; trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        {icon}
        {trend && (
          trend === 'up'
            ? <TrendingUp className="w-4 h-4 text-green-500" />
            : <TrendingDown className="w-4 h-4 text-red-500" />
        )}
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function ImpactCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="text-center p-4 bg-blue-50/50 rounded-lg">
      <p className="text-lg font-bold text-[#003366]">{value}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function RepaymentBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
    paid: { bg: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Paid' },
    upcoming: { bg: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" />, label: 'Upcoming' },
    future: { bg: 'bg-gray-100 text-gray-500', icon: <Calendar className="w-3 h-3" />, label: 'Future' },
  };
  const c = cfg[status] || cfg.future;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.bg}`}>
      {c.icon} {c.label}
    </span>
  );
}
