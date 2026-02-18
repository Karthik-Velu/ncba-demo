'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { CovenantDef, CovenantReading, ProvisioningRule, LoanLevelRow } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Eye, FileBarChart } from 'lucide-react';
import Link from 'next/link';

const BUCKET_LABELS: Record<string, string> = {
  normal: 'Normal', watch: 'Watch', substandard: 'Substandard', doubtful: 'Doubtful', loss: 'Loss',
};

function classifyLoan(loan: LoanLevelRow, rules: ProvisioningRule[]): ProvisioningRule | undefined {
  const dpd = loan.dpdAsOfReportingDate;
  return rules.find(r => dpd >= r.dpdMin && dpd <= r.dpdMax);
}

function StatusBadge({ status }: { status: CovenantReading['status'] }) {
  const cfg = {
    compliant: { bg: 'bg-green-100 text-green-700 border-green-200', label: 'Compliant' },
    breached: { bg: 'bg-red-100 text-red-700 border-red-200', label: 'Breached' },
    watch: { bg: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Watch' },
  };
  const { bg, label } = cfg[status];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${bg}`}>{label}</span>;
}

export default function CovenantsPage() {
  const { user, getNBFI, loanBookData } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);
  if (!user || !nbfi) return null;

  const covenants: CovenantDef[] = nbfi.covenants || [];
  const readings: CovenantReading[] = nbfi.covenantReadings || [];
  const provRules = nbfi.provisioningRules;
  const loans: LoanLevelRow[] = loanBookData[id] || [];

  const latestReadings = useMemo(() => {
    const map = new Map<string, CovenantReading>();
    for (const r of readings) {
      const existing = map.get(r.covenantId);
      if (!existing || r.date > existing.date) map.set(r.covenantId, r);
    }
    return map;
  }, [readings]);

  const prevReadings = useMemo(() => {
    const sorted = [...readings].sort((a, b) => b.date.localeCompare(a.date));
    const map = new Map<string, CovenantReading>();
    const seen = new Set<string>();
    for (const r of sorted) {
      if (!seen.has(r.covenantId)) {
        seen.add(r.covenantId);
      } else if (!map.has(r.covenantId)) {
        map.set(r.covenantId, r);
      }
    }
    return map;
  }, [readings]);

  const breachedCovenants = useMemo(() => {
    return covenants.filter(c => latestReadings.get(c.id)?.status === 'breached');
  }, [covenants, latestReadings]);

  const computeBuckets = (rules: ProvisioningRule[]) => {
    const buckets = rules.map(r => ({
      ...r,
      loanCount: 0,
      totalBalance: 0,
    }));
    for (const loan of loans) {
      const rule = classifyLoan(loan, rules);
      if (rule) {
        const b = buckets.find(x => x.bucket === rule.bucket);
        if (b) { b.loanCount++; b.totalBalance += loan.currentBalance; }
      }
    }
    return buckets;
  };

  const reviewBuckets = useMemo(() => {
    if (!provRules?.nbfi) return [];
    return computeBuckets(provRules.nbfi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provRules, loans]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-gray-50">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          &larr; Dashboard
        </Link>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Covenant Monitoring — {nbfi.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time covenant compliance and provisioning analysis (read-only)</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/nbfi/${id}/setup`}
              className="flex items-center gap-2 px-4 py-2 border border-[#003366] text-[#003366] rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
              <Eye className="w-4 h-4" /> Edit Covenants (Step 3)
            </Link>
            <button
              onClick={() => setShowReview(!showReview)}
              className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99] transition-colors"
            >
              <FileBarChart className="w-4 h-4" />
              {showReview ? 'Hide' : 'Generate'} Quarterly Review
            </button>
          </div>
        </div>
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-500" />
          <p className="text-xs text-blue-700">
            This is a <strong>monitoring view</strong>. To edit covenant definitions, provisioning rules, or security settings, go to{' '}
            <Link href={`/nbfi/${id}/setup`} className="underline font-medium">Step 3: Covenant &amp; Doc Setup</Link>.
          </p>
        </div>

        {/* Covenant Status Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {covenants.map(cov => {
            const latest = latestReadings.get(cov.id);
            const prev = prevReadings.get(cov.id);
            const trending = latest && prev
              ? latest.value > prev.value ? 'up' : latest.value < prev.value ? 'down' : 'stable'
              : 'stable';
            const isGoodTrend = cov.operator === '>=' || cov.operator === '>'
              ? trending === 'up'
              : trending === 'down';

            return (
              <div
                key={cov.id}
                className={`bg-white rounded-xl border p-5 ${
                  latest?.status === 'breached' ? 'border-red-200' :
                  latest?.status === 'watch' ? 'border-amber-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">{cov.metric}</h3>
                  {latest && <StatusBadge status={latest.status} />}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Required: {cov.operator} {cov.format === 'percent' ? `${cov.threshold}%` : cov.format === 'ratio' ? `${cov.threshold}x` : cov.threshold}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      Actual: {latest ? (cov.format === 'percent' ? `${latest.value}%` : cov.format === 'ratio' ? `${latest.value}x` : latest.value) : '—'}
                    </p>
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${
                    isGoodTrend ? 'text-green-600' : trending === 'stable' ? 'text-gray-400' : 'text-red-500'
                  }`}>
                    {trending === 'up' && <TrendingUp className="w-4 h-4" />}
                    {trending === 'down' && <TrendingDown className="w-4 h-4" />}
                    {trending === 'stable' && <Minus className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dual NPL View */}
        <h2 className="text-sm font-bold text-[#003366] mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4" /> Dual Provisioning Policy Comparison
        </h2>
        <div className="grid grid-cols-2 gap-6 mb-8">
          {[
            { title: 'NBFI Provisioning Policy', rules: provRules?.nbfi },
            { title: 'NCBA Provisioning Policy', rules: provRules?.ncba },
          ].map(({ title, rules }) => (
            <div key={title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
              {rules && loans.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Bucket</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">DPD Range</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500"># Loans</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">Balance (KES)</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">Prov. %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computeBuckets(rules).map(b => (
                      <tr key={b.bucket} className="border-b border-gray-50">
                        <td className="px-3 py-2 font-medium">{BUCKET_LABELS[b.bucket]}</td>
                        <td className="px-3 py-2 font-mono">{b.dpdMin}–{b.dpdMax === 9999 ? '∞' : b.dpdMax}</td>
                        <td className="px-3 py-2 text-right font-mono">{b.loanCount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono">{b.totalBalance.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono">{b.provisionPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-gray-400 text-xs">
                  {!rules ? 'Provisioning rules not configured' : 'No loan data available'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* One-Click Quarterly Review */}
        {showReview && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] mb-4 flex items-center gap-2">
              <FileBarChart className="w-4 h-4" /> Quarterly Loan Book Review
            </h2>
            {loans.length > 0 && reviewBuckets.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#003366] text-white">
                    <th className="text-left px-4 py-2.5 font-medium">Classification</th>
                    <th className="text-left px-4 py-2.5 font-medium">DPD Range</th>
                    <th className="text-right px-4 py-2.5 font-medium"># Loans</th>
                    <th className="text-right px-4 py-2.5 font-medium">Total Balance (KES)</th>
                    <th className="text-right px-4 py-2.5 font-medium">% of Portfolio</th>
                    <th className="text-right px-4 py-2.5 font-medium">Provision Amount (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewBuckets.map(b => {
                    const totalPortfolio = reviewBuckets.reduce((s, x) => s + x.totalBalance, 0);
                    const pctOfPort = totalPortfolio > 0 ? (b.totalBalance / totalPortfolio * 100).toFixed(1) : '0.0';
                    const provAmount = Math.round(b.totalBalance * b.provisionPercent / 100);
                    return (
                      <tr key={b.bucket} className="border-b border-gray-100">
                        <td className="px-4 py-2.5 font-medium">{BUCKET_LABELS[b.bucket]}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{b.dpdMin}–{b.dpdMax === 9999 ? '∞' : b.dpdMax} days</td>
                        <td className="px-4 py-2.5 text-right font-mono">{b.loanCount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{b.totalBalance.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{pctOfPort}%</td>
                        <td className="px-4 py-2.5 text-right font-mono">{provAmount.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-4 py-2.5">Total</td>
                    <td className="px-4 py-2.5"></td>
                    <td className="px-4 py-2.5 text-right font-mono">{reviewBuckets.reduce((s, b) => s + b.loanCount, 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{reviewBuckets.reduce((s, b) => s + b.totalBalance, 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono">100.0%</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {reviewBuckets.reduce((s, b) => s + Math.round(b.totalBalance * b.provisionPercent / 100), 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No loan book data available for review.</p>
            )}
          </div>
        )}

        {/* Breach Alerts */}
        {breachedCovenants.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <h2 className="text-sm font-bold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Covenant Breaches ({breachedCovenants.length})
            </h2>
            <div className="space-y-3">
              {breachedCovenants.map(cov => {
                const latest = latestReadings.get(cov.id);
                return (
                  <div key={cov.id} className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-800">{cov.metric}</span>
                        <span className="px-1.5 py-0.5 bg-red-200 text-red-800 text-[10px] rounded font-bold uppercase">Critical</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Actual: {latest?.value}{cov.format === 'percent' ? '%' : cov.format === 'ratio' ? 'x' : ''} — Threshold: {cov.operator} {cov.threshold}{cov.format === 'percent' ? '%' : cov.format === 'ratio' ? 'x' : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Recommended:</span> Escalate to credit committee, request remediation plan from NBFI within 14 days.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-400">Breached since</p>
                      <p className="text-xs font-mono text-red-600">{latest?.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {breachedCovenants.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">All covenants are compliant</p>
          </div>
        )}
      </main>
    </div>
  );
}
