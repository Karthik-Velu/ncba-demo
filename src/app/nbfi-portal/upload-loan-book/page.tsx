'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Upload, CheckCircle, AlertCircle, ChevronDown, ChevronRight,
  Download, History, FlaskConical, Map, ArrowLeft, Info,
  FileText, AlertTriangle, Clock,
} from 'lucide-react';
import {
  DOC_TYPE_SCHEMAS,
  getValidationTests,
  generateFeedHistory,
  generateErrors,
  getErrorTypeLabel,
} from '@/lib/integrationSchemas';
import type { ValidationTest } from '@/lib/integrationSchemas';
import { MOCK_LOAN_BOOK } from '@/lib/mockLoanBook';

type TabId = 'upload' | 'mapping' | 'testing' | 'history';
type UploadType = 'initial_history' | 'daily_tape';
type HistoryFormat = 'long' | 'wide' | 'auto';

const TABS: { id: TabId; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'mapping', label: 'Column Mapping' },
  { id: 'testing', label: 'Test My File' },
  { id: 'history', label: 'Upload History' },
];

const HISTORY_STAGES = [
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

const TAPE_STAGES = [
  'Reading file...',
  'Validating 11 required columns...',
  'Parsing rows...',
  'Computing DPD buckets...',
  'Flagging anomalies...',
  'Complete!',
];

const loanTapeSchema = DOC_TYPE_SCHEMAS.find(s => s.id === 'loan_book')!;
const historySchema = DOC_TYPE_SCHEMAS.find(s => s.id === 'loan_performance_history')!;

const TAPE_DETECTED_COLS = [
  'loan_id', 'application_id', 'dpd_as_of_reporting_date', 'current_balance',
  'loan_disbursed_amount', 'total_overdue_amount', 'loan_disbursed_date',
  'interest_rate', 'loan_written_off', 'repossession', 'recovery_after_writeoff',
  'geography', 'product', 'segment',
];

const HISTORY_DETECTED_LONG = [
  'loan_id', 'reporting_date', 'dpd', 'current_balance', 'overdue_amount',
  'written_off', 'repossession', 'recovery_amount', 'disbursed_amount',
  'disbursed_date', 'interest_rate', 'geography', 'product', 'segment',
];

const HISTORY_DETECTED_WIDE = [
  'loan_id', 'disbursed_date', 'disbursed_amount', 'interest_rate',
  'geography', 'product', 'segment',
  'dpd_2022_01', 'bal_2022_01', 'dpd_2022_02', 'bal_2022_02',
  'dpd_2022_03', 'bal_2022_03', 'dpd_2022_04', 'bal_2022_04',
];

function buildMap(cols: string[], autoMap: Record<string, string>): Record<string, string> {
  const m: Record<string, string> = {};
  cols.forEach(c => { m[c] = autoMap[c] ?? ''; });
  return m;
}

function StageList({ stages, current }: { stages: string[]; current: number }) {
  return (
    <ul className="space-y-1 mb-4">
      {stages.map((s, i) => (
        <li key={i} className={`flex items-center gap-2 text-xs ${i < current ? 'text-green-600' : i === current ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
          {i < current
            ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            : i === current
            ? <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" />}
          {s}
        </li>
      ))}
    </ul>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
      <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${((value + 1) / max) * 100}%` }} />
    </div>
  );
}

function FormatGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50">
      <button className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700" onClick={() => setOpen(o => !o)}>
        <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Format Guide &amp; Template Download</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Daily Loan Tape</p>
            <p className="text-xs text-gray-500 mb-2">One row per active loan as of today. File name: <code className="bg-white border rounded px-1">loanbook_YYYYMMDD.csv</code></p>
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="text-xs w-full">
                <thead className="bg-gray-100"><tr>{['Loan ID','App ID','DPD','Balance','Disbursed','Overdue','Date','Rate','Written Off','Repo','Recovery'].map(h => <th key={h} className="px-2 py-1 text-left font-medium text-gray-600">{h}</th>)}</tr></thead>
                <tbody>
                  <tr className="border-t">{['LN1001','APP2001','0','83413.02','110555.29','0','2025-01-15','16.49','FALSE','FALSE','0'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                  <tr className="border-t bg-gray-50">{['LN1002','APP2002','31','112000','120000','3500','2025-01-10','11.0','FALSE','FALSE','0'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Loan Performance History — Long Format <span className="text-blue-500 font-normal">(Recommended)</span></p>
            <p className="text-xs text-gray-500 mb-2">One row per loan per reporting period. Minimum 12 monthly periods.</p>
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="text-xs w-full">
                <thead className="bg-blue-50"><tr>{['Loan ID','Reporting Date','DPD','Balance','Overdue','Written Off','Recovery','Disbursed Amt','Disbursed Date','Rate'].map(h => <th key={h} className="px-2 py-1 text-left font-medium text-blue-700">{h}</th>)}</tr></thead>
                <tbody>
                  <tr className="border-t">{['LN1001','2022-01-31','0','105000','0','FALSE','0','110555','2021-06-15','16.49'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                  <tr className="border-t bg-gray-50">{['LN1001','2022-02-28','0','103000','0','FALSE','0','110555','2021-06-15','16.49'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                  <tr className="border-t">{['LN1001','2022-03-31','15','101200','1500','FALSE','0','110555','2021-06-15','16.49'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Loan Performance History — Wide Format</p>
            <p className="text-xs text-gray-500 mb-2">One row per loan with columns <code className="bg-white border rounded px-1">dpd_YYYY_MM</code> and <code className="bg-white border rounded px-1">bal_YYYY_MM</code> for each period.</p>
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="text-xs w-full">
                <thead className="bg-purple-50"><tr>{['Loan ID','Disbursed Date','Disbursed Amt','Rate','dpd_2022_01','bal_2022_01','dpd_2022_02','bal_2022_02'].map(h => <th key={h} className="px-2 py-1 text-left font-medium text-purple-700">{h}</th>)}</tr></thead>
                <tbody>
                  <tr className="border-t">{['LN1001','2021-06-15','110555','16.49','0','105000','0','103000'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                  <tr className="border-t bg-gray-50">{['LN1002','2021-08-10','75000','14.0','0','72000','0','70500'].map((v,i) => <td key={i} className="px-2 py-1 text-gray-700">{v}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex gap-2 pt-1 flex-wrap">
            <button className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 rounded px-3 py-1.5 hover:bg-blue-50"><Download className="w-3.5 h-3.5" /> Daily Tape Template</button>
            <button className="flex items-center gap-1 text-xs text-purple-600 border border-purple-200 rounded px-3 py-1.5 hover:bg-purple-50"><Download className="w-3.5 h-3.5" /> History Template (Long)</button>
            <button className="flex items-center gap-1 text-xs text-purple-600 border border-purple-200 rounded px-3 py-1.5 hover:bg-purple-50"><Download className="w-3.5 h-3.5" /> History Template (Wide)</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NBFIUploadLoanBookPage() {
  const router = useRouter();
  const { user, getNBFI, setLoanBookData, setLoanBookMeta } = useApp();
  const nbfi = user?.nbfiId ? getNBFI(user.nbfiId) : null;

  const [activeTab, setActiveTab] = useState<TabId>('upload');

  // Upload tab
  const [uploadType, setUploadType] = useState<UploadType>('initial_history');
  const [historyFormat, setHistoryFormat] = useState<HistoryFormat>('auto');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [done, setDone] = useState(false);
  const [coverageSummary, setCoverageSummary] = useState<{
    periods: number; start: string; end: string; rows: number; format: string;
  } | null>(null);

  // Mapping tab
  const [mappingUploadType, setMappingUploadType] = useState<UploadType>('initial_history');
  const [mappingFormat, setMappingFormat] = useState<'long' | 'wide'>('long');
  const [tapeMapping, setTapeMapping] = useState<Record<string, string>>(() => buildMap(TAPE_DETECTED_COLS, loanTapeSchema.autoMapping));
  const [histMappingLong, setHistMappingLong] = useState<Record<string, string>>(() => buildMap(HISTORY_DETECTED_LONG, historySchema.autoMapping));
  const [histMappingWide, setHistMappingWide] = useState<Record<string, string>>(() => buildMap(HISTORY_DETECTED_WIDE, historySchema.autoMapping));
  const [mappingSaved, setMappingSaved] = useState(false);

  // Testing tab
  const [testUploadType, setTestUploadType] = useState<UploadType>('initial_history');
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testRunning, setTestRunning] = useState(false);
  const [testStage, setTestStage] = useState(-1);
  const [testDone, setTestDone] = useState(false);
  const [testResults, setTestResults] = useState<ValidationTest[]>([]);
  const [expandedTest, setExpandedTest] = useState<number | null>(null);

  // History tab
  const [histFilter, setHistFilter] = useState<'all' | 'success' | 'partial' | 'failed'>('all');
  const [histPage, setHistPage] = useState(0);
  const [expandedErr, setExpandedErr] = useState<string | null>(null);

  const handleFile = useCallback(async (f: File) => {
    if (!nbfi) return;
    setFile(f); setProcessing(true); setDone(false); setStageIndex(0);
    const stages = uploadType === 'initial_history' ? HISTORY_STAGES : TAPE_STAGES;
    for (let i = 0; i < stages.length; i++) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      setStageIndex(i);
    }
    const rows = MOCK_LOAN_BOOK.slice(0, 520);
    const totalBal = rows.reduce((s, r) => s + r.currentBalance, 0);
    if (uploadType === 'initial_history') {
      setCoverageSummary({ periods: 24, start: 'Jan 2022', end: 'Dec 2023', rows: rows.length * 24, format: historyFormat === 'auto' ? 'Long (auto-detected)' : historyFormat === 'wide' ? 'Wide' : 'Long' });
      setLoanBookData(nbfi.id, rows);
      setLoanBookMeta(nbfi.id, {
        source: 'initial_history', uploadedAt: new Date().toISOString(), uploadedBy: user?.name ?? 'NBFI User',
        rowCount: rows.length * 24, totalBalance: totalBal, filename: f.name,
        historyMonths: 24, periodCount: 24, dateRangeStart: '2022-01', dateRangeEnd: '2023-12',
        inputFormat: historyFormat === 'auto' ? 'long' : historyFormat,
      });
    } else {
      setLoanBookData(nbfi.id, rows);
      setLoanBookMeta(nbfi.id, { source: 'nbfi_portal', uploadedAt: new Date().toISOString(), uploadedBy: user?.name ?? 'NBFI User', rowCount: rows.length, totalBalance: totalBal, filename: f.name, inputFormat: 'snapshot' });
    }
    setProcessing(false); setDone(true);
  }, [nbfi, uploadType, historyFormat, user, setLoanBookData, setLoanBookMeta]);

  const handleTestRun = async () => {
    if (!testFile) return;
    setTestRunning(true); setTestDone(false); setTestStage(0);
    const stages = testUploadType === 'initial_history' ? HISTORY_STAGES : TAPE_STAGES;
    for (let i = 0; i < stages.length; i++) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      setTestStage(i);
    }
    setTestResults(getValidationTests(testUploadType === 'initial_history' ? 'loan_performance_history' : 'loan_book'));
    setTestRunning(false); setTestDone(true);
  };

  const currentMapping = mappingUploadType === 'daily_tape' ? tapeMapping : mappingFormat === 'wide' ? histMappingWide : histMappingLong;
  const currentCols = mappingUploadType === 'daily_tape' ? TAPE_DETECTED_COLS : mappingFormat === 'wide' ? HISTORY_DETECTED_WIDE : HISTORY_DETECTED_LONG;
  const currentSchema = mappingUploadType === 'daily_tape' ? loanTapeSchema : historySchema;
  const setCurrentMapping = (col: string, val: string) => {
    if (mappingUploadType === 'daily_tape') setTapeMapping(m => ({ ...m, [col]: val }));
    else if (mappingFormat === 'wide') setHistMappingWide(m => ({ ...m, [col]: val }));
    else setHistMappingLong(m => ({ ...m, [col]: val }));
  };

  const allHistory = [
    ...generateFeedHistory('loan_book', 45),
    ...generateFeedHistory('loan_performance_history', 10),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = allHistory.filter(r => histFilter === 'all' || r.status === histFilter);
  const PAGE = 10;
  const paged = filtered.slice(histPage * PAGE, (histPage + 1) * PAGE);
  const errors = generateErrors('loan_book');

  if (!user || user.role !== 'nbfi_user') return <div className="p-8 text-gray-500">Access restricted.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Portal
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Loan Data Upload</h1>
          <p className="text-sm text-gray-500 mt-1">{nbfi?.name ?? 'NBFI Portal'} — Upload loan performance history or daily loan tape</p>
        </div>

        {/* Two-flow banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-2">Two separate data submissions are required</p>
              <div className="grid grid-cols-2 gap-3 text-xs text-blue-700">
                <div className="bg-white rounded p-2.5 border border-blue-100">
                  <p className="font-semibold mb-0.5">1. Loan Performance History <span className="font-normal text-blue-400">(Initial · One-time)</span></p>
                  <p>12–36 months of monthly loan snapshots. Powers vintage analysis, roll-rate matrices, and ECL calibration. Required before the first EDA run.</p>
                </div>
                <div className="bg-white rounded p-2.5 border border-blue-100">
                  <p className="font-semibold mb-0.5">2. Daily Loan Tape <span className="font-normal text-blue-400">(Ongoing · Daily via SFTP)</span></p>
                  <p>Full dump of all active loans as of today (DPD, balance, overdue). Powers live monitoring dashboards and covenant tracking.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── UPLOAD TAB ── */}
        {activeTab === 'upload' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'initial_history' as UploadType, label: 'Loan Performance History', sub: '12–36 months · Initial upload · Long or Wide format', accent: 'blue' },
                { id: 'daily_tape' as UploadType, label: 'Daily Loan Tape', sub: 'Current snapshot · Ongoing · One row per loan', accent: 'green' },
              ]).map(opt => (
                <button key={opt.id} onClick={() => { setUploadType(opt.id); setFile(null); setDone(false); setCoverageSummary(null); }}
                  className={`text-left p-4 rounded-lg border-2 transition-colors ${uploadType === opt.id ? `border-${opt.accent}-500 bg-${opt.accent}-50` : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <p className={`text-sm font-semibold ${uploadType === opt.id ? `text-${opt.accent}-700` : 'text-gray-700'}`}>{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>

            {uploadType === 'initial_history' && !done && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">File format</p>
                <div className="flex gap-3">
                  {([
                    { id: 'auto' as HistoryFormat, label: 'Auto-detect', sub: 'Platform detects from headers' },
                    { id: 'long' as HistoryFormat, label: 'Long format', sub: 'One row per loan per period' },
                    { id: 'wide' as HistoryFormat, label: 'Wide format', sub: 'dpd_YYYY_MM / bal_YYYY_MM columns' },
                  ]).map(f => (
                    <label key={f.id} className={`flex-1 flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${historyFormat === f.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="hf" value={f.id} checked={historyFormat === f.id} onChange={() => setHistoryFormat(f.id)} className="mt-0.5" />
                      <div><p className="text-xs font-semibold text-gray-700">{f.label}</p><p className="text-xs text-gray-500">{f.sub}</p></div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {!file && !processing && !done && (
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {uploadType === 'initial_history' ? 'Drop your loan history file here' : 'Drop your daily loan tape here'}
                </p>
                <p className="text-xs text-gray-400 mb-4">CSV, XLSX or XLS · Max 100 MB</p>
                <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
                  <Upload className="w-4 h-4" /> Browse file
                  <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                </label>
              </div>
            )}

            {processing && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm font-semibold text-gray-700 mb-1">Processing: <span className="text-gray-500 font-normal">{file?.name}</span></p>
                <ProgressBar value={stageIndex} max={(uploadType === 'initial_history' ? HISTORY_STAGES : TAPE_STAGES).length} />
                <StageList stages={uploadType === 'initial_history' ? HISTORY_STAGES : TAPE_STAGES} current={stageIndex} />
              </div>
            )}

            {done && uploadType === 'initial_history' && coverageSummary && (
              <div className="bg-white border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4"><CheckCircle className="w-5 h-5 text-green-500" /><p className="font-semibold text-green-700">Loan Performance History uploaded successfully</p></div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Reporting Periods', value: `${coverageSummary.periods} months` },
                    { label: 'Date Range', value: `${coverageSummary.start} – ${coverageSummary.end}` },
                    { label: 'Total Rows', value: coverageSummary.rows.toLocaleString() },
                    { label: 'Format', value: coverageSummary.format },
                  ].map(m => (
                    <div key={m.label} className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-green-700">{m.value}</p>
                      <p className="text-xs text-green-600">{m.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mb-3">EDA, vintage analysis, and roll-rate matrices are now powered by this historical data.</p>
                <div className="flex gap-2">
                  <button onClick={() => { setFile(null); setDone(false); setCoverageSummary(null); }} className="text-xs text-gray-600 border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50">Upload another file</button>
                  <button onClick={() => setActiveTab('history')} className="text-xs text-blue-600 border border-blue-200 rounded px-3 py-1.5 hover:bg-blue-50">View upload history</button>
                </div>
              </div>
            )}

            {done && uploadType === 'daily_tape' && (
              <div className="bg-white border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3"><CheckCircle className="w-5 h-5 text-green-500" /><p className="font-semibold text-green-700">Daily Loan Tape uploaded — {MOCK_LOAN_BOOK.length.toLocaleString()} rows loaded</p></div>
                <div className="overflow-x-auto rounded border border-gray-100 mb-3">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b"><tr>{['Loan ID','App ID','DPD','Balance','Disbursed','Overdue','Rate','Geography','Product'].map(h => <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>)}</tr></thead>
                    <tbody>
                      {MOCK_LOAN_BOOK.slice(0, 5).map((row, i) => (
                        <tr key={i} className={`border-t ${i % 2 ? 'bg-gray-50' : ''}`}>
                          <td className="px-3 py-1.5 font-mono">{row.loanId}</td>
                          <td className="px-3 py-1.5 font-mono">{row.applicationId}</td>
                          <td className="px-3 py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${row.dpdAsOfReportingDate === 0 ? 'bg-green-100 text-green-700' : row.dpdAsOfReportingDate <= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{row.dpdAsOfReportingDate}</span>
                          </td>
                          <td className="px-3 py-1.5">{row.currentBalance.toLocaleString()}</td>
                          <td className="px-3 py-1.5">{row.loanDisbursedAmount.toLocaleString()}</td>
                          <td className="px-3 py-1.5">{row.totalOverdueAmount.toLocaleString()}</td>
                          <td className="px-3 py-1.5">{row.interestRate}%</td>
                          <td className="px-3 py-1.5">{row.geography ?? '—'}</td>
                          <td className="px-3 py-1.5">{row.product ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={() => { setFile(null); setDone(false); }} className="text-xs text-gray-600 border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50">Upload another file</button>
              </div>
            )}
            <FormatGuide />
          </div>
        )}

        {/* ── MAPPING TAB ── */}
        {activeTab === 'mapping' && (
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-1">Column Mapping Configuration</h2>
              <p className="text-xs text-gray-500 mb-4">Configure how your source file columns map to platform fields. This mapping is saved and applied automatically to future uploads.</p>
              <div className="flex gap-3 mb-4 flex-wrap items-end">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Upload Type</label>
                  <select className="text-sm border border-gray-200 rounded px-2 py-1.5" value={mappingUploadType} onChange={e => setMappingUploadType(e.target.value as UploadType)}>
                    <option value="initial_history">Loan Performance History</option>
                    <option value="daily_tape">Daily Loan Tape</option>
                  </select>
                </div>
                {mappingUploadType === 'initial_history' && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">History Format</label>
                    <select className="text-sm border border-gray-200 rounded px-2 py-1.5" value={mappingFormat} onChange={e => setMappingFormat(e.target.value as 'long' | 'wide')}>
                      <option value="long">Long format</option>
                      <option value="wide">Wide format</option>
                    </select>
                  </div>
                )}
                <div className="ml-auto flex gap-2">
                  <button onClick={() => {
                    if (mappingUploadType === 'daily_tape') setTapeMapping(buildMap(TAPE_DETECTED_COLS, loanTapeSchema.autoMapping));
                    else if (mappingFormat === 'wide') setHistMappingWide(buildMap(HISTORY_DETECTED_WIDE, historySchema.autoMapping));
                    else setHistMappingLong(buildMap(HISTORY_DETECTED_LONG, historySchema.autoMapping));
                  }} className="text-xs text-gray-600 border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50">Reset to Auto-Map</button>
                  <button onClick={() => { setMappingSaved(true); setTimeout(() => setMappingSaved(false), 2500); }}
                    className={`text-xs rounded px-3 py-1.5 transition-colors ${mappingSaved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {mappingSaved ? '✓ Saved' : 'Save Mapping'}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium">Source Column</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium">Maps To (Platform Field)</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium">Type</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCols.map((col, i) => {
                      const mapped = currentMapping[col] ?? '';
                      const field = currentSchema.fields.find(f => f.key === mapped);
                      return (
                        <tr key={col} className={`border-t ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-3 py-2 font-mono text-gray-700">{col}</td>
                          <td className="px-3 py-2">
                            <select value={mapped} onChange={e => setCurrentMapping(col, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 w-full max-w-xs">
                              <option value="">— not mapped —</option>
                              {currentSchema.fields.map(f => <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-gray-500">{field?.type ?? '—'}</td>
                          <td className="px-3 py-2">
                            {mapped
                              ? <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${field?.required ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{field?.required ? '✓ Required' : '✓ Optional'}</span>
                              : <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">Not mapped</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {(() => {
                const req = currentSchema.fields.filter(f => f.required);
                const mapped = req.filter(f => Object.values(currentMapping).includes(f.key));
                const pct = Math.round((mapped.length / req.length) * 100);
                return (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{mapped.length}/{req.length} required fields mapped</span>
                  </div>
                );
              })()}
            </div>
            <FormatGuide />
          </div>
        )}

        {/* ── TESTING TAB ── */}
        {activeTab === 'testing' && (
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-1">Test My File</h2>
              <p className="text-xs text-gray-500 mb-4">Validate your file before submitting. No data is saved — this only runs quality checks.</p>
              <div className="flex gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">File type to test</label>
                  <select className="text-sm border border-gray-200 rounded px-2 py-1.5" value={testUploadType} onChange={e => { setTestUploadType(e.target.value as UploadType); setTestDone(false); setTestFile(null); setTestResults([]); }}>
                    <option value="initial_history">Loan Performance History</option>
                    <option value="daily_tape">Daily Loan Tape</option>
                  </select>
                </div>
              </div>
              {!testDone && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                  <FlaskConical className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">Select a test file</p>
                  <label className="cursor-pointer inline-flex items-center gap-2 border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">
                    <Upload className="w-4 h-4" /> {testFile ? testFile.name : 'Browse file'}
                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { if (e.target.files?.[0]) setTestFile(e.target.files[0]); }} />
                  </label>
                </div>
              )}
              {testFile && !testDone && !testRunning && (
                <button onClick={handleTestRun} className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 mb-4">
                  Run {testUploadType === 'initial_history' ? '14' : '12'} Validation Tests
                </button>
              )}
              {testRunning && (
                <div className="mb-4">
                  <ProgressBar value={testStage} max={(testUploadType === 'initial_history' ? HISTORY_STAGES : TAPE_STAGES).length} />
                  <StageList stages={testUploadType === 'initial_history' ? HISTORY_STAGES : TAPE_STAGES} current={testStage} />
                </div>
              )}
              {testDone && testResults.length > 0 && (
                <div>
                  <div className="flex gap-3 mb-3">
                    {[
                      { label: 'Passed', count: testResults.filter(t => t.pass).length, color: 'green' },
                      { label: 'Warnings', count: testResults.filter(t => !t.pass && t.severity === 'warning').length, color: 'amber' },
                      { label: 'Errors', count: testResults.filter(t => !t.pass && t.severity === 'error').length, color: 'red' },
                    ].map(s => (
                      <div key={s.label} className={`flex-1 text-center bg-${s.color}-50 border border-${s.color}-100 rounded-lg p-2`}>
                        <p className={`text-xl font-bold text-${s.color}-600`}>{s.count}</p>
                        <p className={`text-xs text-${s.color}-500`}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <ul className="space-y-1">
                    {testResults.map((t, i) => (
                      <li key={i} className="border border-gray-100 rounded-lg overflow-hidden">
                        <button className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-gray-50" onClick={() => setExpandedTest(expandedTest === i ? null : i)}>
                          {t.pass ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> : t.severity === 'error' ? <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />}
                          <span className={`text-xs flex-1 ${t.pass ? 'text-gray-700' : t.severity === 'error' ? 'text-red-700 font-medium' : 'text-amber-700'}`}>{t.name}</span>
                          {t.detail && <ChevronDown className={`w-3.5 h-3.5 text-gray-400 mt-0.5 transition-transform ${expandedTest === i ? 'rotate-180' : ''}`} />}
                        </button>
                        {expandedTest === i && t.detail && <div className="px-9 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">{t.detail}</div>}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => { setTestDone(false); setTestFile(null); setTestResults([]); }} className="text-xs text-gray-600 border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50">Test another file</button>
                    {testResults.every(t => t.pass || t.severity === 'warning') && (
                      <button onClick={() => setActiveTab('upload')} className="text-xs text-green-600 border border-green-200 rounded px-3 py-1.5 hover:bg-green-50">Looks good — proceed to upload</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-800">Upload History</h2>
                <div className="flex gap-1">
                  {(['all', 'success', 'partial', 'failed'] as const).map(f => (
                    <button key={f} onClick={() => { setHistFilter(f); setHistPage(0); }}
                      className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${histFilter === f ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto rounded border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>{['Date/Time','Upload Type','Source','Filename','Rows','Periods','Status','Errors'].map(h => <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {paged.map((rec, i) => (
                      <tr key={rec.id} className={`border-t ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1 text-gray-400" />{rec.date} {rec.time}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${rec.fileName.startsWith('loan_history') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {rec.fileName.startsWith('loan_history') ? 'Loan History' : 'Daily Tape'}
                          </span>
                        </td>
                        <td className="px-3 py-2 capitalize text-gray-600">{rec.source}</td>
                        <td className="px-3 py-2 font-mono text-gray-700 max-w-[140px] truncate" title={rec.fileName}>{rec.fileName}</td>
                        <td className="px-3 py-2 text-right">{rec.rows > 0 ? rec.rows.toLocaleString() : '—'}</td>
                        <td className="px-3 py-2 text-center">{rec.periods ?? '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${rec.status === 'success' ? 'bg-green-100 text-green-700' : rec.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{rec.status}</span>
                        </td>
                        <td className="px-3 py-2">
                          {rec.errorCount > 0
                            ? <button onClick={() => setExpandedErr(expandedErr === rec.id ? null : rec.id)} className="text-red-600 hover:underline">{rec.errorCount} error{rec.errorCount > 1 ? 's' : ''}</button>
                            : <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))}
                    {paged.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No uploads found.</td></tr>}
                  </tbody>
                </table>
              </div>
              {expandedErr && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 mb-2">Error details</p>
                  <ul className="space-y-1">
                    {errors.filter(e => e.uploadId === expandedErr).slice(0, 3).map(e => (
                      <li key={e.id} className="text-xs text-red-700"><span className="font-medium">{getErrorTypeLabel(e.errorType)}</span> — {e.message} ({e.rowCount} rows affected)</li>
                    ))}
                    {errors.filter(e => e.uploadId === expandedErr).length === 0 && (
                      <li className="text-xs text-red-600">Schema mismatch — expected 16 columns, received 14 (missing: interest_rate, geography)</li>
                    )}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">{filtered.length} records</p>
                <div className="flex gap-1">
                  <button onClick={() => setHistPage(p => Math.max(0, p - 1))} disabled={histPage === 0} className="text-xs px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">Prev</button>
                  <span className="text-xs px-2 py-1 text-gray-600">{histPage + 1}/{Math.max(1, Math.ceil(filtered.length / PAGE))}</span>
                  <button onClick={() => setHistPage(p => Math.min(Math.ceil(filtered.length / PAGE) - 1, p + 1))} disabled={(histPage + 1) * PAGE >= filtered.length} className="text-xs px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
