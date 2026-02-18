'use client';

import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { MOCK_LOAN_BOOK } from '@/lib/mockLoanBook';
import {
  Upload, FileSpreadsheet, CheckCircle2, Loader2, ArrowLeft,
  CloudUpload, Table2,
} from 'lucide-react';

const STAGES = [
  'Reading file...',
  'Validating 12 required columns...',
  'Parsing 4,520 rows...',
  'Running KI Score model on each loan...',
  'Flagging DPD anomalies...',
  'Complete!',
];

export default function UploadLoanBookPage() {
  const { user, getNBFI, setLoanBookData, setLoanBookMeta, loanBookData } = useApp();
  const router = useRouter();

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || user.role !== 'nbfi_user') router.push('/');
  }, [user, router]);

  if (!user || user.role !== 'nbfi_user') return null;

  const nbfiId = user.nbfiId!;
  const nbfi = getNBFI(nbfiId);
  const loans = loanBookData[nbfiId];

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setProcessing(true);
    setStageIndex(0);

    let idx = 0;
    const advance = () => {
      idx++;
      if (idx < STAGES.length) {
        setStageIndex(idx);
        if (idx === STAGES.length - 1) {
          setLoanBookData(nbfiId, MOCK_LOAN_BOOK);
          setLoanBookMeta(nbfiId, {
            source: 'nbfi_portal',
            uploadedAt: new Date().toISOString(),
            uploadedBy: user.name,
            rowCount: MOCK_LOAN_BOOK.length,
            totalBalance: MOCK_LOAN_BOOK.reduce((s, r) => s + r.balance, 0),
            filename: f.name,
          });
          setTimeout(() => {
            setProcessing(false);
            setDone(true);
          }, 600);
        } else {
          setTimeout(advance, 800);
        }
      }
    };
    setTimeout(advance, 800);
  }, [nbfiId, setLoanBookData, setLoanBookMeta, user.name]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const progressPercent = stageIndex < 0 ? 0 : Math.round(((stageIndex + 1) / STAGES.length) * 100);

  const previewRows = (done && loans) ? loans.slice(0, 15) : [];
  const totalBalance = loans ? loans.reduce((s, r) => s + r.balance, 0) : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/nbfi-portal" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Upload Loan Book</h1>
              <p className="text-sm text-gray-500">{nbfi?.name || 'NBFI Partner'}</p>
            </div>
          </div>

          {/* Upload Zone */}
          {!processing && !done && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={onFileChange}
              />
              <CloudUpload className={`w-16 h-16 mx-auto mb-4 ${
                dragOver ? 'text-emerald-500' : 'text-gray-300'
              }`} />
              <p className="text-lg font-semibold text-gray-700 mb-1">
                Drag &amp; drop your loan book file here
              </p>
              <p className="text-sm text-gray-400 mb-4">
                or click to browse &mdash; CSV, XLSX supported
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                <Upload className="w-4 h-4" />
                Select File
              </div>
            </div>
          )}

          {/* Processing */}
          {processing && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-gray-900">{file?.name}</p>
                  <p className="text-xs text-gray-400">Processing loan book data...</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Stages */}
              <div className="space-y-3">
                {STAGES.map((label, i) => {
                  const isDone = i < stageIndex || (i === STAGES.length - 1 && i === stageIndex);
                  const isCurrent = i === stageIndex && i !== STAGES.length - 1;
                  const isPending = i > stageIndex;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                      {isCurrent && <Loader2 className="w-5 h-5 text-emerald-500 animate-spin flex-shrink-0" />}
                      {isPending && <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />}
                      <span className={`text-sm ${isDone ? 'text-emerald-700 font-medium' : isCurrent ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Done: Preview */}
          {done && loans && (
            <>
              {/* Summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6 flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-900">Upload Complete</p>
                  <p className="text-sm text-emerald-700">
                    {loans.length.toLocaleString()} loans loaded, KES {totalBalance.toLocaleString()} total balance
                  </p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Table2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-gray-900 text-sm">
                    Preview &mdash; first {previewRows.length} of {loans.length.toLocaleString()} rows
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Loan ID</th>
                        <th className="px-4 py-3">Borrower</th>
                        <th className="px-4 py-3">Geography</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">DPD</th>
                        <th className="px-4 py-3 text-right">KI Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewRows.map((row) => (
                        <tr key={row.loanId} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{row.loanId}</td>
                          <td className="px-4 py-2.5 text-gray-800">{row.borrowerName || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-600">{row.geography}</td>
                          <td className="px-4 py-2.5 text-gray-600">{row.product}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                            {row.balance.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              row.dpdBucket === '0' || row.dpdBucket === 'Current'
                                ? 'bg-green-100 text-green-700'
                                : row.dpdBucket === '1-30'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}>
                              {row.dpdBucket}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                            {row.kiScore ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
