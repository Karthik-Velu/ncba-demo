'use client';

import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { Plus, ChevronRight, Building2, TrendingUp } from 'lucide-react';

function formatKES(amount: number) {
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
  };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

export default function DashboardPage() {
  const { user, nbfis } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  if (!user) return null;

  const stats = {
    total: nbfis.length,
    approved: nbfis.filter(n => n.status === 'approved').length,
    pending: nbfis.filter(n => n.status === 'pending_review').length,
    draft: nbfis.filter(n => ['draft', 'uploading', 'spreading'].includes(n.status)).length,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">NBFI Portfolio</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and assess originator financial statements</p>
          </div>
          <Link
            href="/onboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#004d99] transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Onboard New NBFI
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total NBFIs', value: stats.total, color: 'bg-blue-50 text-blue-700' },
            { label: 'Approved', value: stats.approved, color: 'bg-green-50 text-green-700' },
            { label: 'Pending Review', value: stats.pending, color: 'bg-amber-50 text-amber-700' },
            { label: 'In Progress', value: stats.draft, color: 'bg-gray-50 text-gray-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-5 ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs mt-1 opacity-80">{label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">NBFI Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Key Contacts</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Funding Required</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Onboarded</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {nbfis.map(nbfi => (
                <tr
                  key={nbfi.id}
                  className="border-b border-gray-100 hover:bg-blue-50/30 cursor-pointer transition-colors"
                  onClick={() => {
                    if (nbfi.status === 'draft') router.push(`/nbfi/${nbfi.id}/upload`);
                    else if (nbfi.status === 'spreading') router.push(`/nbfi/${nbfi.id}/input`);
                    else if (nbfi.status === 'pending_review' || nbfi.status === 'approved') router.push(`/nbfi/${nbfi.id}/output`);
                    else router.push(`/nbfi/${nbfi.id}/upload`);
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#003366] flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{nbfi.name}</p>
                        <p className="text-xs text-gray-400 max-w-[200px] truncate">{nbfi.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{nbfi.keyContacts}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-gray-400" />
                      {formatKES(nbfi.fundingAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{nbfi.dateOnboarded}</td>
                  <td className="px-6 py-4"><StatusBadge status={nbfi.status} /></td>
                  <td className="px-6 py-4"><ChevronRight className="w-4 h-4 text-gray-300" /></td>
                </tr>
              ))}
              {nbfis.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No NBFIs onboarded yet. Click &ldquo;Onboard New NBFI&rdquo; to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
