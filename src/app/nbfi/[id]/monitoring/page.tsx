'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { MonitoringData, LoanLevelRow } from '@/lib/types';
import {
  Activity, Users, Banknote, TrendingUp, TrendingDown,
  Globe, Target, Calendar, CheckCircle2, Clock, Layers, Building2,
  Filter,
} from 'lucide-react';
import { getDpdBucket, DPD_BUCKETS } from '@/lib/types';
import { LineChart, Line } from 'recharts';
import Link from 'next/link';
import { TransactionAlertTimeline } from '@/components/NotificationBell';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import mockMonitoring from '../../../../../data/mock-monitoring.json';

const COLORS = ['#003366', '#0066cc', '#0099ff', '#00ccff', '#66e0ff', '#339966', '#cc6633'];

type MonLevel = 'level1' | 'level2';
type MonScope = 'transaction' | 'nbfi' | 'portfolio';

export default function MonitoringPage() {
  const { user, getNBFI, loanBookData, nbfis } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [level, setLevel] = useState<MonLevel>('level1');
  const [scope, setScope] = useState<MonScope>('transaction');

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

  const allLoans = useMemo(() => {
    const all: LoanLevelRow[] = [];
    for (const nId of Object.keys(loanBookData)) {
      all.push(...loanBookData[nId]);
    }
    return all;
  }, [loanBookData]);

  const portfolioWideStats = useMemo(() => {
    if (allLoans.length === 0) return null;
    const totalBal = allLoans.reduce((s, r) => s + r.currentBalance, 0);
    const par30 = allLoans.filter(r => r.dpdAsOfReportingDate > 30).length;
    const par90 = allLoans.filter(r => r.dpdAsOfReportingDate > 90).length;
    const nbfiCount = new Set(Object.keys(loanBookData).filter(k => loanBookData[k].length > 0)).size;
    return {
      totalLoans: allLoans.length, totalBal, nbfiCount,
      par30Pct: (par30 / allLoans.length * 100).toFixed(1),
      par90Pct: (par90 / allLoans.length * 100).toFixed(1),
      avgBal: Math.round(totalBal / allLoans.length),
    };
  }, [allLoans, loanBookData]);

  const portfolioDpdDist = useMemo(() => {
    const map: Record<string, number> = {};
    DPD_BUCKETS.forEach(b => (map[b] = 0));
    allLoans.forEach(r => { map[getDpdBucket(r.dpdAsOfReportingDate)] += r.currentBalance; });
    return DPD_BUCKETS.map(b => ({ bucket: b, balance: map[b] }));
  }, [allLoans]);

  const trendData = useMemo(() => {
    return [
      { month: 'Sep', par30: 8.2, par90: 3.1, collection: 97.5 },
      { month: 'Oct', par30: 7.8, par90: 3.0, collection: 97.8 },
      { month: 'Nov', par30: 8.5, par90: 3.4, collection: 97.2 },
      { month: 'Dec', par30: 9.1, par90: 3.8, collection: 96.9 },
      { month: 'Jan', par30: 8.7, par90: 3.5, collection: 97.4 },
      { month: 'Feb', par30: parseFloat(portfolioWideStats?.par30Pct || '8.5'), par90: parseFloat(portfolioWideStats?.par90Pct || '3.3'), collection: 97.6 },
    ];
  }, [portfolioWideStats]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-gray-50">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          &larr; Dashboard
        </Link>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Risk Monitoring Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {scope === 'transaction' ? `Transaction: ${nbfi.name}` : scope === 'nbfi' ? `NBFI: ${nbfi.name} (all transactions)` : 'NCBA Full Portfolio'}
            </p>
          </div>
        </div>

        {/* Scope Selector */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {([
              { key: 'transaction' as const, label: 'Transaction', icon: Target },
              { key: 'nbfi' as const, label: 'NBFI', icon: Building2 },
              { key: 'portfolio' as const, label: 'Portfolio', icon: Layers },
            ]).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setScope(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  scope === key ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
          {scope === 'transaction' && (
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['level1', 'level2'] as const).map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    level === l ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {l === 'level1' ? 'Level 1' : 'Level 2'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alerts for this transaction */}
        {scope !== 'portfolio' && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Recent Alerts</h3>
            <TransactionAlertTimeline nbfiId={id} />
          </div>
        )}

        {/* Portfolio-level view */}
        {scope === 'portfolio' && portfolioWideStats && (
          <>
            <div className="grid grid-cols-5 gap-4 mb-6">
              <StatCard icon={<Layers className="w-5 h-5 text-[#003366]" />} label="Active NBFIs" value={portfolioWideStats.nbfiCount.toString()} />
              <StatCard icon={<Users className="w-5 h-5 text-green-500" />} label="Total Loans" value={portfolioWideStats.totalLoans.toLocaleString()} />
              <StatCard icon={<Banknote className="w-5 h-5 text-blue-500" />} label="Total Balance" value={`KES ${(portfolioWideStats.totalBal / 1e6).toFixed(0)}M`} />
              <StatCard icon={<TrendingDown className="w-5 h-5 text-amber-500" />} label="PAR 30+" value={`${portfolioWideStats.par30Pct}%`} trend={parseFloat(portfolioWideStats.par30Pct) > 10 ? 'down' : 'up'} />
              <StatCard icon={<Activity className="w-5 h-5 text-red-500" />} label="PAR 90+" value={`${portfolioWideStats.par90Pct}%`} trend={parseFloat(portfolioWideStats.par90Pct) > 5 ? 'down' : 'up'} />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-[#003366] mb-4">Portfolio DPD Distribution (Balance)</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={portfolioDpdDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                    <Tooltip formatter={(val: unknown) => [`KES ${(Number(val) / 1e6).toFixed(1)}M`]} />
                    <Bar dataKey="balance" fill="#003366" radius={[4, 4, 0, 0]}>
                      {portfolioDpdDist.map((d, i) => (
                        <Cell key={d.bucket} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-[#003366] mb-4">PAR Trend (6 months)</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(val: unknown) => [`${Number(val).toFixed(1)}%`]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="par30" name="PAR 30+" stroke="#e67300" strokeWidth={2} />
                    <Line type="monotone" dataKey="par90" name="PAR 90+" stroke="#cc3333" strokeWidth={2} />
                    <Line type="monotone" dataKey="collection" name="Collection %" stroke="#003366" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* NBFI Breakdown Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] mb-4">NBFI Performance Breakdown</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="text-left px-4 py-2.5">NBFI</th>
                    <th className="text-right px-4 py-2.5">Loans</th>
                    <th className="text-right px-4 py-2.5">Balance</th>
                    <th className="text-right px-4 py-2.5">PAR 30+</th>
                    <th className="text-right px-4 py-2.5">PAR 90+</th>
                    <th className="text-right px-4 py-2.5">Avg Rate</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nbfis.filter(n => loanBookData[n.id]?.length > 0).map(n => {
                    const nLoans = loanBookData[n.id];
                    const bal = nLoans.reduce((s, r) => s + r.currentBalance, 0);
                    const p30 = nLoans.filter(r => r.dpdAsOfReportingDate > 30).length;
                    const p90 = nLoans.filter(r => r.dpdAsOfReportingDate > 90).length;
                    const avgR = nLoans.reduce((s, r) => s + r.interestRate, 0) / nLoans.length;
                    return (
                      <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium">
                          <Link href={`/nbfi/${n.id}/monitoring`} className="text-[#003366] hover:underline">{n.name}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-right">{nLoans.length}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{(bal / 1e6).toFixed(1)}M</td>
                        <td className={`px-4 py-2.5 text-right ${(p30 / nLoans.length * 100) > 10 ? 'text-red-600 font-semibold' : ''}`}>
                          {(p30 / nLoans.length * 100).toFixed(1)}%
                        </td>
                        <td className={`px-4 py-2.5 text-right ${(p90 / nLoans.length * 100) > 5 ? 'text-red-600 font-semibold' : ''}`}>
                          {(p90 / nLoans.length * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-2.5 text-right">{avgR.toFixed(1)}%</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            n.status === 'monitoring' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>{n.status.replace(/_/g, ' ')}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* NBFI-level view (same as transaction for now but with context) */}
        {scope === 'nbfi' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>NBFI View:</strong> Showing aggregated data across all transactions with <strong>{nbfi.name}</strong>.
              Currently 1 active transaction. Switch to Transaction view for detailed analysis.
            </p>
          </div>
        )}

        {(scope === 'transaction' || scope === 'nbfi') && level === 'level1' && (
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

        {(scope === 'transaction' || scope === 'nbfi') && level === 'level2' && (
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
