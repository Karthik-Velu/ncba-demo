'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Wifi, CheckCircle2, Clock, AlertTriangle, Database, RefreshCw, Server, Loader2 } from 'lucide-react';
import Link from 'next/link';

const FEED_TIMELINE = [
  { date: '2025-02-18', time: '06:00', rows: 520, status: 'success' as const, source: 'sftp' },
  { date: '2025-02-17', time: '06:00', rows: 518, status: 'success' as const, source: 'sftp' },
  { date: '2025-02-16', time: '06:00', rows: 515, status: 'success' as const, source: 'sftp' },
  { date: '2025-02-15', time: '06:00', rows: 0, status: 'failed' as const, source: 'sftp' },
  { date: '2025-02-14', time: '06:00', rows: 512, status: 'success' as const, source: 'sftp' },
  { date: '2025-02-13', time: '14:30', rows: 510, status: 'success' as const, source: 'manual' },
  { date: '2025-02-12', time: '06:00', rows: 508, status: 'success' as const, source: 'sftp' },
];

export default function IntegrationPage() {
  const { user, getNBFI, loanBookData } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);

  useEffect(() => { if (!user) router.push('/'); }, [user, router]);
  const nbfi = getNBFI(id);
  useEffect(() => { if (user && id && !nbfi) router.replace('/dashboard'); }, [user, id, nbfi, router]);

  const loans = loanBookData[id] ?? [];
  const hasData = loans.length > 0;

  const runTest = useCallback(() => {
    setTestRunning(true);
    setTestResult(null);
    setTimeout(() => {
      setTestRunning(false);
      setTestResult('success');
    }, 2500);
  }, []);

  if (!user || !nbfi) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Step 4 — Data Integration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure and monitor daily data feeds for <span className="font-medium text-gray-700">{nbfi.name}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* SFTP Config Status */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] flex items-center gap-2 mb-4">
                <Server className="w-4 h-4" /> SFTP Connection
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <ConfigField label="Host" value="sftp.premiercredit.co.ke" />
                <ConfigField label="Port" value="22" />
                <ConfigField label="Path" value="/exports/loanbook/" />
                <ConfigField label="Schedule" value="Daily at 06:00 EAT" />
                <ConfigField label="Format" value="CSV (11 columns)" />
                <ConfigField label="Last Successful" value="2025-02-18 06:00" />
              </div>
              <div className="flex gap-3">
                <button onClick={runTest} disabled={testRunning}
                  className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99] disabled:opacity-50 flex items-center gap-2">
                  {testRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {testRunning ? 'Testing...' : 'Test Connection'}
                </button>
                {testResult === 'success' && (
                  <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle2 className="w-4 h-4" /> Connection successful</span>
                )}
              </div>
            </section>

            {/* Column Mapping */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] flex items-center gap-2 mb-4">
                <Database className="w-4 h-4" /> Column Mapping
              </h2>
              <p className="text-xs text-gray-500 mb-3">Mapping between NBFI source columns and platform schema</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500">
                    <th className="text-left py-2">Source Column</th>
                    <th className="text-left py-2">Platform Field</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Loan ID', 'loanId', true],
                    ['Application ID', 'applicationId', true],
                    ['DPD as of Reporting Date', 'dpdAsOfReportingDate', true],
                    ['Current Balance', 'currentBalance', true],
                    ['Loan Disbursed Amount', 'loanDisbursedAmount', true],
                    ['Total Overdue Amount', 'totalOverdueAmount', true],
                    ['Loan Disbursed Date', 'loanDisbursedDate', true],
                    ['Interest Rate', 'interestRate', true],
                    ['Loan Written Off', 'loanWrittenOff', true],
                    ['Repossession', 'repossession', true],
                    ['Recovery after Writeoff', 'recoveryAfterWriteoff', true],
                  ].map(([src, target, mapped]) => (
                    <tr key={src as string} className="border-b border-gray-50">
                      <td className="py-2 font-mono text-xs text-gray-700">{src as string}</td>
                      <td className="py-2 font-mono text-xs text-[#003366]">{target as string}</td>
                      <td className="py-2">
                        {mapped ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" /> Mapped</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="w-3 h-3" /> Unmapped</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Feed Timeline */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-[#003366] flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" /> Feed Timeline
              </h2>
              <div className="space-y-3">
                {FEED_TIMELINE.map((feed, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-lg ${
                    feed.status === 'failed' ? 'bg-red-50 border border-red-100' : 'bg-gray-50'
                  }`}>
                    <div className="flex-shrink-0">
                      {feed.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{feed.date} at {feed.time}</p>
                      <p className="text-xs text-gray-500">
                        {feed.status === 'success'
                          ? `${feed.rows} rows loaded via ${feed.source === 'sftp' ? 'SFTP' : 'manual upload'}`
                          : 'Connection timeout — retried at 06:30, failed again'}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      feed.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{feed.status}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-[#003366] mb-4">Integration Status</h3>
              <div className="space-y-3">
                <StatusRow label="SFTP Connection" status="active" />
                <StatusRow label="Column Mapping" status="complete" />
                <StatusRow label="Format Validation" status="complete" />
                <StatusRow label="Daily Schedule" status="active" />
                <StatusRow label="Data Quality Checks" status="active" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-[#003366] mb-4">Data Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Current rows</span>
                  <span className="font-semibold">{hasData ? loans.length : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last update</span>
                  <span className="font-semibold">2025-02-18</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Feed success rate</span>
                  <span className="font-semibold text-green-600">85.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg daily rows</span>
                  <span className="font-semibold">514</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ConfigField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="px-3 py-2 bg-gray-50 rounded-lg text-sm font-mono text-gray-800">{value}</p>
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: 'active' | 'complete' | 'pending' | 'error' }) {
  const cfg = {
    active: { icon: <RefreshCw className="w-3.5 h-3.5 text-blue-500" />, text: 'text-blue-600', bg: 'bg-blue-50', lbl: 'Active' },
    complete: { icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />, text: 'text-green-600', bg: 'bg-green-50', lbl: 'Complete' },
    pending: { icon: <Clock className="w-3.5 h-3.5 text-gray-400" />, text: 'text-gray-500', bg: 'bg-gray-50', lbl: 'Pending' },
    error: { icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />, text: 'text-red-600', bg: 'bg-red-50', lbl: 'Error' },
  }[status];
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600">{label}</span>
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
        {cfg.icon} {cfg.lbl}
      </span>
    </div>
  );
}
