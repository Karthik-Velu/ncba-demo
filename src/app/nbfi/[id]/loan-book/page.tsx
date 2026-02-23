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
  Info, AlertTriangle, BookOpen,
} from 'lucide-react';
import { DOC_TYPE_SCHEMAS, getValidationTests } from '@/lib/integrationSchemas';
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

const OPTIONAL_FIELDS = [
  'geography', 'product', 'segment', 'borrowerName', 'residualTenureMonths',
];

const ALL_PLATFORM_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

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

const HISTORY_UPLOAD_STAGES = [
  'Reading file...',
  'Detecting format (long / wide)...',
  'Validating required columns...',
  'Parsing reporting periods...',
  'Checking period contiguity (no gaps)...',
  'Validating monotonicity of write-off flags...',
  'Computing DPD bucket distributions per period...',
  'Flagging data quality issues...',
  'Complete!',
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

  // Phase 1: Initial Historical Upload state
  const [histPhaseOpen, setHistPhaseOpen] = useState(true);
  const [histFormat, setHistFormat] = useState<'auto' | 'long' | 'wide'>('auto');
  const [histUploading, setHistUploading] = useState(false);
  const [histStage, setHistStage] = useState(-1);
  const [histDone, setHistDone] = useState(false);

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

  const runHistoryUpload = useCallback(async () => {
    setHistUploading(true);
    setHistStage(0);
    setHistDone(false);
    for (let i = 0; i < HISTORY_UPLOAD_STAGES.length; i++) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      setHistStage(i);
    }
    // Load data and tag as initial_history
    setLoanBookData(id, MOCK_LOAN_BOOK);
    setLoanBookMeta(id, {
      source: 'initial_history',
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name ?? 'System',
      rowCount: MOCK_LOAN_BOOK.length * 24,
      totalBalance: MOCK_LOAN_BOOK.reduce((s, r) => s + (r.currentBalance ?? 0), 0),
      filename: 'loan_history_2022_2023.csv',
      historyMonths: 24,
      periodCount: 24,
      dateRangeStart: '2022-01',
      dateRangeEnd: '2023-12',
      inputFormat: histFormat === 'auto' ? 'long' : histFormat,
    });
    setHistUploading(false);
    setHistDone(true);
    setHistPhaseOpen(false);
  }, [id, histFormat, setLoanBookData, setLoanBookMeta, user]);

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

        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-800">Step 2 — Loan Book Upload</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload loan data for <span className="font-medium text-gray-700">{nbfi.name}</span>.
            Complete both phases before running EDA and asset selection.
          </p>
        </div>

        {/* Phase stepper */}
        <div className="mb-6 flex items-stretch">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-l-lg bg-[#003366] text-white text-sm font-medium">
            <span className="w-5 h-5 rounded-full bg-white text-[#003366] flex items-center justify-center text-xs font-bold shrink-0">1</span>
            Loan Performance History
            <span className="text-blue-300 font-normal text-xs ml-1">(initial · one-time)</span>
            {histDone && <span className="ml-2 text-xs bg-green-400/20 text-green-200 px-1.5 rounded">✓ Done</span>}
          </div>
          <div className="w-0 h-0 self-center border-t-[20px] border-b-[20px] border-l-[12px] border-transparent border-l-[#003366]" />
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-r-lg bg-gray-100 text-gray-600 text-sm font-medium">
            <span className="w-5 h-5 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
            Ongoing Daily Loan Tape
            <span className="text-gray-400 font-normal text-xs ml-1">(daily via SFTP / manual)</span>
          </div>
        </div>

        {/* Phase 1: Initial Historical Upload */}
        <div className="max-w-3xl mb-6">
          <div className="border-2 border-blue-200 rounded-xl bg-white overflow-hidden">
            <button type="button" onClick={() => setHistPhaseOpen(o => !o)} className="w-full flex items-center gap-3 p-5 text-left">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-800">Phase 1 — Loan Performance History</h3>
                  {histDone
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Uploaded — 24 months</span>
                    : <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Required for EDA</span>}
                </div>
                <p className="text-sm text-gray-500">12–36 months of monthly snapshots. Powers vintage, roll-rate, and ECL calibration.</p>
              </div>
              {histPhaseOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
            </button>

            {histPhaseOpen && (
              <div className="px-5 pb-5 border-t border-blue-100 pt-4 space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">Why is this needed? </span>
                    The daily loan tape captures a single snapshot (DPD as of today). Vintage analysis, roll-rate matrices, and IFRS 9 ECL calculations require month-by-month DPD progression across 12–36 reporting periods to build accurate loss curves and migration probabilities.
                  </p>
                </div>

                {!histDone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">File format</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'auto' as const, label: 'Auto-detect', sub: 'Detected from column headers' },
                        { id: 'long' as const, label: 'Long format', sub: 'One row per loan per period' },
                        { id: 'wide' as const, label: 'Wide format', sub: 'dpd_YYYY_MM / bal_YYYY_MM columns' },
                      ]).map(f => (
                        <label key={f.id} className={"flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors " + (histFormat === f.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300')}>
                          <input type="radio" name="histFormat" value={f.id} checked={histFormat === f.id} onChange={() => setHistFormat(f.id)} className="mt-0.5" />
                          <div><p className="text-xs font-semibold text-gray-700">{f.label}</p><p className="text-xs text-gray-500">{f.sub}</p></div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {!histDone && histFormat !== 'wide' && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Long format sample — required columns highlighted</p>
                    <div className="overflow-x-auto rounded border border-gray-200">
                      <table className="text-xs w-full">
                        <thead className="bg-blue-50">
                          <tr>{['Loan ID','Reporting Date','DPD','Balance','Overdue','Written Off','Recovery','Disbursed','Disb. Date','Rate'].map(h => <th key={h} className="px-2 py-1 text-left font-medium text-blue-700">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">{['LN1001','2022-01-31','0','105000','0','FALSE','0','110555','2021-06-15','16.49'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                          <tr className="border-t bg-gray-50">{['LN1001','2022-02-28','0','103000','0','FALSE','0','110555','2021-06-15','16.49'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                          <tr className="border-t">{['LN1001','2022-03-31','15','101200','1500','FALSE','0','110555','2021-06-15','16.49'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                          <tr className="border-t text-gray-400"><td className="px-2 py-1" colSpan={10}>... (one row per loan per month, 12–36 periods) ...</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!histDone && histFormat === 'wide' && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Wide format sample — columns dpd_YYYY_MM and bal_YYYY_MM per period</p>
                    <div className="overflow-x-auto rounded border border-gray-200">
                      <table className="text-xs w-full">
                        <thead className="bg-purple-50">
                          <tr>{['Loan ID','Disbursed Date','Disbursed Amt','Rate','dpd_2022_01','bal_2022_01','dpd_2022_02','bal_2022_02','...'].map(h => <th key={h} className="px-2 py-1 text-left font-medium text-purple-700">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">{['LN1001','2021-06-15','110555','16.49','0','105000','0','103000','...'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                          <tr className="border-t bg-gray-50">{['LN1002','2021-08-10','75000','14.0','0','72000','0','70500','...'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!histDone && !histUploading && (
                  <div
                    className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center bg-blue-50/30 hover:bg-blue-50 transition-colors"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); runHistoryUpload(); }}
                  >
                    <Upload className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-700 mb-1">Drop your loan history file here</p>
                    <p className="text-xs text-gray-400 mb-3">CSV or XLSX · Long or Wide format · Max 200 MB</p>
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-[#003366] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#004d99]">
                      <Upload className="w-4 h-4" /> Browse file
                      <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={() => runHistoryUpload()} />
                    </label>
                  </div>
                )}

                {histUploading && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: ((histStage + 1) / HISTORY_UPLOAD_STAGES.length * 100) + '%' }} />
                    </div>
                    <ul className="space-y-1">
                      {HISTORY_UPLOAD_STAGES.map((s, i) => (
                        <li key={i} className={"flex items-center gap-2 text-xs " + (i < histStage ? 'text-green-600' : i === histStage ? 'text-blue-600 font-medium' : 'text-gray-400')}>
                          {i < histStage ? <CheckCircle2 className="w-3.5 h-3.5" /> : i === histStage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />}
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {histDone && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-semibold text-green-700">Loan Performance History uploaded successfully</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { label: 'Reporting Periods', value: '24 months' },
                        { label: 'Date Range', value: 'Jan 2022 – Dec 2023' },
                        { label: 'Loan-Months', value: (MOCK_LOAN_BOOK.length * 24).toLocaleString() },
                        { label: 'Format', value: histFormat === 'auto' ? 'Long (auto-detected)' : histFormat === 'wide' ? 'Wide' : 'Long' },
                      ].map(m => (
                        <div key={m.label} className="bg-white rounded p-2 text-center border border-green-100">
                          <p className="text-sm font-bold text-green-700">{m.value}</p>
                          <p className="text-xs text-green-600">{m.label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Vintage curves, roll-rate matrices, and ECL calculations now use actual historical data. Proceed to EDA to view analysis.</p>
                  </div>
                )}
              </div>
            )}
          </div>
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

        <div className="mb-3">
          <h2 className="text-base font-semibold text-gray-700">Phase 2 — Ongoing Daily Loan Tape</h2>
          <p className="text-sm text-gray-500">Configure how the daily full-dump loan tape is delivered. These uploads power real-time monitoring and covenant tracking. File naming: <code className="text-xs bg-gray-100 px-1 rounded">loanbook_YYYYMMDD.csv</code></p>
        </div>

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
                              {ALL_PLATFORM_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
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
