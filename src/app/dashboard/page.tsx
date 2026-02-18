'use client';

import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
  Plus, ChevronRight, Building2, TrendingUp, Trash2,
  AlertTriangle, CheckCircle2, Shield, Banknote, Users,
  FileText, Activity,
} from 'lucide-react';
import type { NBFIRecord } from '@/lib/types';

function formatKES(amount: number) {
  if (amount >= 1e9) return `KES ${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `KES ${(amount / 1e6).toFixed(0)}M`;
  return `KES ${(amount / 1000).toFixed(0)}K`;
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    draft: 'Draft',
    uploading: 'Uploading',
    spreading: 'In Review',
    pending_review: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    pool_selected: 'Pool Selected',
    setup_complete: 'Setup Complete',
    monitoring: 'Monitoring',
  };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

export default function DashboardPage() {
  const { user, nbfis, deleteNBFI, loanBookData } = useApp();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<NBFIRecord | null>(null);

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteNBFI(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (!user) return null;

  const stats = {
    total: nbfis.length,
    monitoring: nbfis.filter(n => ['approved', 'pool_selected', 'setup_complete', 'monitoring'].includes(n.status)).length,
    pending: nbfis.filter(n => n.status === 'pending_review').length,
    draft: nbfis.filter(n => ['draft', 'uploading', 'spreading'].includes(n.status)).length,
  };

  const portfolioSummary = useMemo(() => {
    let totalExposure = 0;
    let totalLoanBookBalance = 0;
    let overdueDocCount = 0;
    let breachedCovenantCount = 0;
    let compliantCovenantCount = 0;
    let activeNbfis = 0;

    nbfis.forEach(n => {
      totalExposure += n.fundingAmount;

      const loans = loanBookData[n.id];
      if (loans?.length) {
        totalLoanBookBalance += loans.reduce((s, r) => s + r.balance, 0);
      }

      if (n.documents) {
        overdueDocCount += n.documents.filter(d => d.status === 'overdue').length;
      }

      if (n.covenants && n.covenantReadings) {
        const latestMap = new Map<string, { status: string }>();
        for (const r of n.covenantReadings) {
          const ex = latestMap.get(r.covenantId);
          if (!ex || r.date > (ex as { date?: string }).date!) latestMap.set(r.covenantId, r);
        }
        latestMap.forEach(r => {
          if (r.status === 'breached') breachedCovenantCount++;
          else if (r.status === 'compliant') compliantCovenantCount++;
        });
      }

      if (['monitoring', 'setup_complete', 'approved', 'pool_selected'].includes(n.status)) {
        activeNbfis++;
      }
    });

    return { totalExposure, totalLoanBookBalance, overdueDocCount, breachedCovenantCount, compliantCovenantCount, activeNbfis };
  }, [nbfis, loanBookData]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">NBFI Risk Infrastructure</h1>
            <p className="text-sm text-gray-500 mt-1">Portfolio-level overview and originator management</p>
          </div>
          <Link
            href="/onboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#004d99] transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Onboard New NBFI
          </Link>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-6 gap-3 mb-6">
          <SummaryCard icon={<Building2 className="w-4 h-4 text-blue-500" />} label="Total NBFIs" value={String(stats.total)} />
          <SummaryCard icon={<Activity className="w-4 h-4 text-green-500" />} label="Active" value={String(portfolioSummary.activeNbfis)} />
          <SummaryCard icon={<Banknote className="w-4 h-4 text-indigo-500" />} label="Total Exposure" value={formatKES(portfolioSummary.totalExposure)} />
          <SummaryCard icon={<Shield className="w-4 h-4 text-emerald-500" />} label="Covenants OK" value={String(portfolioSummary.compliantCovenantCount)} accent="green" />
          <SummaryCard icon={<AlertTriangle className="w-4 h-4 text-red-500" />} label="Covenants Breached" value={String(portfolioSummary.breachedCovenantCount)} accent={portfolioSummary.breachedCovenantCount > 0 ? 'red' : undefined} />
          <SummaryCard icon={<FileText className="w-4 h-4 text-amber-500" />} label="Overdue Docs" value={String(portfolioSummary.overdueDocCount)} accent={portfolioSummary.overdueDocCount > 0 ? 'amber' : undefined} />
        </div>

        {/* Quick Status Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total NBFIs', value: stats.total, color: 'bg-blue-50 text-blue-700' },
            { label: 'Active / Monitoring', value: stats.monitoring, color: 'bg-green-50 text-green-700' },
            { label: 'Pending Review', value: stats.pending, color: 'bg-amber-50 text-amber-700' },
            { label: 'In Progress', value: stats.draft, color: 'bg-gray-100 text-gray-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 ${color}`}>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs mt-0.5 opacity-80">{label}</p>
            </div>
          ))}
        </div>

        {/* NBFI Comparison Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">NBFI</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Exposure</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loan Book</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Covenants</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Docs</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {nbfis.map(nbfi => {
                const loans = loanBookData[nbfi.id];
                const loanCount = loans?.length || 0;
                const loanBalance = loans?.reduce((s, r) => s + r.balance, 0) || 0;

                let covenantLabel = '—';
                let covenantColor = 'text-gray-400';
                if (nbfi.covenantReadings?.length) {
                  const latestMap = new Map<string, string>();
                  for (const r of nbfi.covenantReadings) {
                    const ex = latestMap.get(r.covenantId);
                    if (!ex || r.date > ex) latestMap.set(r.covenantId, r.status);
                  }
                  const statuses = Array.from(latestMap.values());
                  const breached = statuses.filter(s => s === 'breached').length;
                  const watch = statuses.filter(s => s === 'watch').length;
                  if (breached > 0) { covenantLabel = `${breached} breached`; covenantColor = 'text-red-600'; }
                  else if (watch > 0) { covenantLabel = `${watch} watch`; covenantColor = 'text-amber-600'; }
                  else { covenantLabel = 'All OK'; covenantColor = 'text-green-600'; }
                }

                const overdueCount = nbfi.documents?.filter(d => d.status === 'overdue').length || 0;
                const pendingCount = nbfi.documents?.filter(d => d.status === 'pending').length || 0;
                let docLabel = '—';
                let docColor = 'text-gray-400';
                if (nbfi.documents?.length) {
                  if (overdueCount > 0) { docLabel = `${overdueCount} overdue`; docColor = 'text-red-600'; }
                  else if (pendingCount > 0) { docLabel = `${pendingCount} pending`; docColor = 'text-amber-600'; }
                  else { docLabel = 'All submitted'; docColor = 'text-green-600'; }
                }

                return (
                  <tr
                    key={nbfi.id}
                    className="border-b border-gray-100 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => {
                      if (nbfi.status === 'monitoring' || nbfi.status === 'setup_complete') router.push(`/nbfi/${nbfi.id}/monitoring`);
                      else if (nbfi.status === 'pool_selected') router.push(`/nbfi/${nbfi.id}/setup`);
                      else if (nbfi.status === 'draft') router.push(`/nbfi/${nbfi.id}/upload`);
                      else if (nbfi.status === 'spreading') router.push(`/nbfi/${nbfi.id}/input`);
                      else if (nbfi.status === 'pending_review' || nbfi.status === 'approved') router.push(`/nbfi/${nbfi.id}/output`);
                      else router.push(`/nbfi/${nbfi.id}/upload`);
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#003366] flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{nbfi.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{nbfi.keyContacts}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-gray-700">{formatKES(nbfi.fundingAmount)}</span>
                    </td>
                    <td className="px-5 py-4">
                      {loanCount > 0 ? (
                        <div>
                          <span className="text-sm font-medium text-gray-700">{loanCount.toLocaleString()} loans</span>
                          <p className="text-[10px] text-gray-400">{formatKES(loanBalance)}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium ${covenantColor}`}>{covenantLabel}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium ${docColor}`}>{docLabel}</span>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={nbfi.status} /></td>
                    <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(nbfi)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {nbfis.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No NBFIs onboarded yet. Click &ldquo;Onboard New NBFI&rdquo; to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteTarget(null)}>
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900">Delete organisation?</h3>
              <p className="mt-2 text-sm text-gray-600">
                &ldquo;{deleteTarget.name}&rdquo; will be removed. This cannot be undone.
              </p>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string; accent?: 'red' | 'green' | 'amber';
}) {
  const border = accent === 'red' ? 'border-red-200' : accent === 'green' ? 'border-green-200' : accent === 'amber' ? 'border-amber-200' : 'border-gray-200';
  return (
    <div className={`bg-white rounded-xl border p-4 ${border}`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}
