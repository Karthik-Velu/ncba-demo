'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { MOCK_LOAN_BOOK } from '@/lib/mockLoanBook';
import {
  ArrowLeft, Upload, Server, Building2, Globe,
  ChevronDown, ChevronRight, CheckCircle2, Loader2,
  FileSpreadsheet, Database, Clock, User, Mail, Send,
} from 'lucide-react';
import Link from 'next/link';

const SFTP_STAGES = [
  'Connecting to sftp.premiercredit.co.ke:22...',
  'Authenticating...',
  'Scanning /exports/loanbook/...',
  'Found loanbook_2025Q4.csv (4,520 rows)...',
  'Downloading...',
  'Validating schema...',
  'Complete!',
];

const UPLOAD_STAGES = [
  'Reading file...',
  'Detecting columns...',
  'Awaiting mapping confirmation...',
];

const PROCESS_STAGES = [
  'Validating mapped columns...',
  'Parsing rows...',
  'Computing DPD buckets...',
  'Running format tests...',
  'Complete!',
];

const REQUIRED_FIELDS = [
  'loanId', 'applicationId', 'dpdAsOfReportingDate', 'currentBalance',
  'loanDisbursedAmount', 'totalOverdueAmount', 'loanDisbursedDate',
  'interestRate', 'loanWrittenOff', 'repossession', 'recoveryAfterWriteoff',
];

const DETECTED_COLUMNS = [
  'loan_id', 'application_id', 'dpd_as_of_reporting_date', 'current_balance',
  'loan_disbursed_amount', 'total_overdue_amount', 'loan_disbursed_date',
  'interest_rate', 'loan_written_off', 'repossession', 'recovery_after_writeoff',
  'geography', 'product', 'segment', 'borrower_name', 'residual_tenure_months',
];

const AUTO_MAPPING: Record<string, string> = {
  'loan_id': 'loanId',
  'application_id': 'applicationId',
  'dpd_as_of_reporting_date': 'dpdAsOfReportingDate',
  'current_balance': 'currentBalance',
  'loan_disbursed_amount': 'loanDisbursedAmount',
  'total_overdue_amount': 'totalOverdueAmount',
  'loan_disbursed_date': 'loanDisbursedDate',
  'interest_rate': 'interestRate',
  'loan_written_off': 'loanWrittenOff',
  'repossession': 'repossession',
  'recovery_after_writeoff': 'recoveryAfterWriteoff',
  'geography': 'geography',
  'product': 'product',
  'segment': 'segment',
  'borrower_name': 'borrowerName',
  'residual_tenure_months': 'residualTenureMonths',
};

const FORMAT_TESTS = [
  { name: 'All required columns present', pass: true },
  { name: 'Loan ID is unique', pass: true },
  { name: 'DPD is numeric (≥ 0)', pass: true },
  { name: 'Balance fields are numeric', pass: true },
  { name: 'Date format is valid (DD/MM/YYYY or ISO)', pass: true },
  { name: 'Interest Rate within range (0-100%)', pass: true },
  { name: 'Boolean fields (Written Off, Repossession) valid', pass: true },
  { name: 'No null values in required fields', pass: false, detail: '2 rows with null Current Balance — auto-filled with 0' },
];

type Channel = 'sftp' | 'lender' | 'nbfi' | null;

export default function LoanBookPage() {
  const { user, getNBFI, setLoanBookData, setLoanBookMeta, loanBookData } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [expanded, setExpanded] = useState<Channel>(null);

  // SFTP state
  const [sftpStage, setSftpStage] = useState(-1);
  const [sftpRunning, setSftpRunning] = useState(false);
  const [sftpDone, setSftpDone] = useState(false);

  // Upload state
  const [uploadStage, setUploadStage] = useState(-1);
  const [uploadRunning, setUploadRunning] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [mappingConfirmed, setMappingConfirmed] = useState(false);
  const [processStage, setProcessStage] = useState(-1);
  const [processRunning, setProcessRunning] = useState(false);
  const [showFormatTests, setShowFormatTests] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({ ...AUTO_MAPPING });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NBFI invite state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState<{ name: string; email: string; date: string } | null>(null);

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);
  useEffect(() => {
    if (user && id && !nbfi) router.replace('/dashboard');
  }, [user, id, nbfi, router]);

  const existingRows = loanBookData[id] ?? [];
  const hasData = existingRows.length > 0;

  const totalBalance = existingRows.reduce((sum, r) => sum + (r.currentBalance ?? 0), 0);

  const loadData = useCallback(
    (source: 'sftp' | 'lender_upload' | 'nbfi_portal') => {
      setLoanBookData(id, MOCK_LOAN_BOOK);
      setLoanBookMeta(id, {
        source,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.name ?? 'System',
        rowCount: MOCK_LOAN_BOOK.length,
        totalBalance: MOCK_LOAN_BOOK.reduce((s, r) => s + (r.currentBalance ?? 0), 0),
        filename: source === 'sftp' ? 'loanbook_2025Q4.csv' : undefined,
      });
    },
    [id, setLoanBookData, setLoanBookMeta, user],
  );

  const runSftpSimulation = useCallback(() => {
    setSftpRunning(true);
    setSftpStage(0);
    setSftpDone(false);
    let i = 0;
    const tick = () => {
      i++;
      if (i < SFTP_STAGES.length) {
        setSftpStage(i);
        setTimeout(tick, 600);
      } else {
        setSftpRunning(false);
        setSftpDone(true);
        loadData('sftp');
      }
    };
    setTimeout(tick, 600);
  }, [loadData]);

  const runUploadSimulation = useCallback(() => {
    setUploadRunning(true);
    setUploadStage(0);
    setUploadDone(false);
    setShowMapping(false);
    setMappingConfirmed(false);
    setProcessStage(-1);
    setShowFormatTests(false);
    let i = 0;
    const tick = () => {
      i++;
      if (i < UPLOAD_STAGES.length) {
        setUploadStage(i);
        if (i === UPLOAD_STAGES.length - 1) {
          setUploadRunning(false);
          setShowMapping(true);
        } else {
          setTimeout(tick, 600);
        }
      }
    };
    setTimeout(tick, 600);
  }, []);

  const confirmMapping = useCallback(() => {
    setMappingConfirmed(true);
    setProcessRunning(true);
    setProcessStage(0);
    let i = 0;
    const tick = () => {
      i++;
      if (i < PROCESS_STAGES.length) {
        setProcessStage(i);
        if (i === PROCESS_STAGES.length - 2) {
          setShowFormatTests(true);
        }
        if (i === PROCESS_STAGES.length - 1) {
          setProcessRunning(false);
          setUploadDone(true);
          loadData('lender_upload');
        } else {
          setTimeout(tick, 600);
        }
      }
    };
    setTimeout(tick, 600);
  }, [loadData]);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) runUploadSimulation();
    },
    [runUploadSimulation],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) runUploadSimulation();
      e.target.value = '';
    },
    [runUploadSimulation],
  );

  const toggle = (ch: Channel) => setExpanded(prev => (prev === ch ? null : ch));

  if (!user || !nbfi) return null;

  const loanBookMeta = nbfi.loanBookMeta;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">
            Step 2 — Loan Book Upload
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload individual loan-level data for{' '}
            <span className="font-medium text-gray-700">{nbfi.name}</span> to
            assess portfolio quality and select the security package.
          </p>
        </div>

        {/* ── Summary banner when data is loaded ── */}
        {hasData && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">
                <strong>{existingRows.length}</strong> loans loaded
                (KES&nbsp;{(totalBalance / 1e6).toFixed(1)}M total balance).
                Proceed to analysis.
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/nbfi/${id}/eda`}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99] transition-colors"
              >
                View EDA
              </Link>
              <Link
                href={`/nbfi/${id}/selection`}
                className="px-4 py-2 border border-[#003366] text-[#003366] rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Asset Selection
              </Link>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Choose how to load the loan book:
        </p>

        <div className="max-w-3xl space-y-4">
          {/* ─────────────────── 1. SFTP Simulation ─────────────────── */}
          <ExpandableCard
            expanded={expanded === 'sftp'}
            onToggle={() => toggle('sftp')}
            icon={<Server className="w-5 h-5 text-[#003366]" />}
            title="SFTP Simulation"
            subtitle="Automated batch pull from NBFI SFTP server."
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Hostname" value="sftp.premiercredit.co.ke" />
                <Field label="Port" value="22" />
                <Field label="Path" value="/exports/loanbook/" />
                <Field label="Username" value="lender_sync" />
              </div>

              <button
                onClick={runSftpSimulation}
                disabled={sftpRunning}
                className="px-5 py-2.5 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99] disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {sftpRunning && <Loader2 className="w-4 h-4 animate-spin" />}
                {sftpRunning ? 'Fetching…' : 'Test Connection & Fetch'}
              </button>

              {sftpStage >= 0 && (
                <ProgressStages stages={SFTP_STAGES} current={sftpStage} />
              )}

              {sftpDone && (
                <p className="text-sm text-green-700 font-medium mt-1">
                  ✓ Loan book loaded via SFTP ({MOCK_LOAN_BOOK.length} rows)
                </p>
              )}
            </div>
          </ExpandableCard>

          {/* ─────────────────── 2. Lender Upload ─────────────────── */}
          <ExpandableCard
            expanded={expanded === 'lender'}
            onToggle={() => toggle('lender')}
            icon={<Building2 className="w-5 h-5 text-[#003366]" />}
            title="Lender Upload"
            subtitle="Relationship team uploads the loan-level file received from NBFI."
          >
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#003366]/50 hover:bg-blue-50/30 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Drag &amp; drop a CSV / XLSX file here, or{' '}
                  <span className="text-[#003366] font-medium underline">
                    browse
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports .csv, .xlsx, .json
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.xlsx"
                className="hidden"
                onChange={handleFileSelect}
              />

              {uploadStage >= 0 && !showMapping && (
                <ProgressStages stages={UPLOAD_STAGES} current={uploadStage} />
              )}

              {/* Column Mapping Step */}
              {showMapping && !mappingConfirmed && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700 font-medium">File parsed — {DETECTED_COLUMNS.length} columns detected</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Column Mapping</p>
                  <p className="text-xs text-gray-500">Review and adjust how source columns map to platform fields. Auto-mapping has been applied.</p>
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 text-xs">
                        <th className="text-left px-3 py-2">Source Column</th>
                        <th className="text-left px-3 py-2">Maps To</th>
                        <th className="text-left px-3 py-2 w-16">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DETECTED_COLUMNS.map(col => (
                        <tr key={col} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-mono text-xs text-gray-700">{col}</td>
                          <td className="px-3 py-2">
                            <select value={columnMapping[col] || ''} onChange={e => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))}
                              className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white">
                              <option value="">— unmapped —</option>
                              {REQUIRED_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            {columnMapping[col] ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="text-xs text-amber-500 font-medium">!</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center gap-3">
                    <button onClick={confirmMapping}
                      className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99] transition-colors">
                      Confirm Mapping &amp; Process
                    </button>
                    <span className="text-xs text-gray-400">{Object.values(columnMapping).filter(Boolean).length}/{REQUIRED_FIELDS.length} fields mapped</span>
                  </div>
                </div>
              )}

              {/* Processing after mapping */}
              {mappingConfirmed && processStage >= 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700 font-medium">Mapping confirmed</span>
                  </div>
                  <ProgressStages stages={PROCESS_STAGES} current={processStage} />
                </div>
              )}

              {/* Format Test Results */}
              {showFormatTests && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Format Validation Tests</p>
                  {FORMAT_TESTS.map((t, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2 rounded text-xs ${t.pass ? 'bg-green-50' : 'bg-amber-50'}`}>
                      {t.pass ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> : <span className="text-amber-500 font-bold mt-0.5 shrink-0">⚠</span>}
                      <div>
                        <span className={t.pass ? 'text-green-700' : 'text-amber-700'}>{t.name}</span>
                        {t.detail && <p className="text-amber-600 text-[10px] mt-0.5">{t.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {uploadDone && (
                <p className="text-sm text-green-700 font-medium mt-2">
                  ✓ Loan book loaded ({MOCK_LOAN_BOOK.length} rows) — all format tests passed
                </p>
              )}
            </div>
          </ExpandableCard>

          {/* ─────────────────── 3. NBFI Portal Upload ─────────────────── */}
          <ExpandableCard
            expanded={expanded === 'nbfi'}
            onToggle={() => toggle('nbfi')}
            icon={<Globe className="w-5 h-5 text-[#003366]" />}
            title="NBFI Portal Upload"
            subtitle="NBFI uploads their loan book directly via their partner portal."
          >
            {loanBookMeta?.source === 'nbfi_portal' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">
                    Received via NBFI Portal
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      Uploaded:{' '}
                      {new Date(loanBookMeta.uploadedAt).toLocaleDateString(
                        'en-GB',
                        { day: 'numeric', month: 'short', year: 'numeric' },
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>By: {loanBookMeta.uploadedBy}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-gray-400" />
                    <span>{loanBookMeta.rowCount.toLocaleString()} rows</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      KES{' '}
                      {(loanBookMeta.totalBalance / 1e6).toFixed(1)}M
                      balance
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {inviteSent ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">Invite sent successfully</p>
                        <p className="text-xs text-green-700 mt-1">
                          A secure upload link was sent to <span className="font-medium">{inviteSent.name}</span> ({inviteSent.email}) on {inviteSent.date}.
                          They can upload the loan book from their portal login.
                        </p>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-800">
                        Awaiting upload from <span className="font-medium">{inviteSent.name}</span> via portal.
                        Data will appear here automatically once submitted.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Invite an NBFI user to upload their loan book directly through the partner portal.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Contact Name</label>
                        <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
                          placeholder="e.g. Alice Wanjiku"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                        <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                          placeholder="e.g. alice@premiercredit.co.ke"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]" />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!inviteName.trim() || !inviteEmail.trim()) return;
                        setInviteSending(true);
                        setTimeout(() => {
                          setInviteSending(false);
                          setInviteSent({ name: inviteName.trim(), email: inviteEmail.trim(), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
                        }, 1500);
                      }}
                      disabled={inviteSending || !inviteName.trim() || !inviteEmail.trim()}
                      className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99] disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {inviteSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {inviteSending ? 'Sending invite...' : 'Send Portal Invite'}
                    </button>
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <Mail className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-700">
                        The NBFI user will receive a secure link to access the partner portal where they can upload
                        the loan book file, configure SFTP, and manage required documents.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ExpandableCard>

          {/* ─────────────────── 4. Demo dataset ─────────────────── */}
          <div className="pt-2">
            <button
              onClick={() => loadData('lender_upload')}
              className="text-sm text-[#003366] font-medium hover:underline flex items-center gap-1.5"
            >
              <Database className="w-4 h-4" />
              Load demo dataset ({MOCK_LOAN_BOOK.length} Kenyan MFI loans)
            </button>
          </div>
        </div>

        {/* Hint when nothing is loaded yet */}
        {!hasData && (
          <div className="mt-6 max-w-3xl p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Once uploaded, you can run{' '}
              <strong>Exploratory Data Analysis</strong> (roll rate, vintage,
              segment cuts) and then <strong>Asset Selection</strong> with
              filters and exclusions to identify the best security package.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Expandable Card ─── */
function ExpandableCard({
  expanded,
  onToggle,
  icon,
  title,
  subtitle,
  children,
}: {
  expanded: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden transition-shadow hover:shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-5 text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Progress Stages ─── */
function ProgressStages({
  stages,
  current,
}: {
  stages: string[];
  current: number;
}) {
  return (
    <div className="space-y-1.5">
      {stages.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const pending = i > current;
        return (
          <div
            key={i}
            className={`flex items-center gap-2 text-sm ${
              done
                ? 'text-green-600'
                : active
                  ? 'text-[#003366] font-medium'
                  : 'text-gray-400'
            }`}
          >
            {done && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            {active && <Loader2 className="w-4 h-4 animate-spin text-[#003366]" />}
            {pending && (
              <span className="w-4 h-4 rounded-full border border-gray-300 inline-block" />
            )}
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Read-only form field ─── */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-800 font-mono">
        {value}
      </div>
    </div>
  );
}
