'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Upload, FileText, CheckCircle2, Loader2, Brain } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
  const { user, getNBFI, loadFinancialData, updateNBFIStatus } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [fsFiles, setFsFiles] = useState<File[]>([]);
  const [misFiles, setMisFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);
  useEffect(() => {
    if (user && id && !nbfi) router.replace('/dashboard');
  }, [user, id, nbfi, router]);

  const handleDrop = useCallback((e: React.DragEvent, type: 'fs' | 'mis') => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (type === 'fs') setFsFiles(prev => [...prev, ...files]);
    else setMisFiles(prev => [...prev, ...files]);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'fs' | 'mis') => {
    const files = Array.from(e.target.files || []);
    if (type === 'fs') setFsFiles(prev => [...prev, ...files]);
    else setMisFiles(prev => [...prev, ...files]);
  }, []);

  const handleProcess = async () => {
    if (fsFiles.length === 0) return;
    setProcessing(true);
    updateNBFIStatus(id, 'uploading');

    const stages = [
      { text: 'Uploading documents...', pct: 15 },
      { text: 'Extracting text from financial statements...', pct: 30 },
      { text: 'Identifying Balance Sheet items...', pct: 45 },
      { text: 'Parsing Income Statement...', pct: 55 },
      { text: 'Analyzing Cash Flow Statement...', pct: 70 },
      { text: 'Computing financial ratios...', pct: 85 },
      { text: 'Generating financial spread...', pct: 95 },
      { text: 'Complete!', pct: 100 },
    ];

    for (const s of stages) {
      setStage(s.text);
      setProgress(s.pct);
      await new Promise(r => setTimeout(r, 700 + Math.random() * 400));
    }

    loadFinancialData(id);
    await new Promise(r => setTimeout(r, 500));
    router.push(`/nbfi/${id}/input`);
  };

  if (!user || !nbfi) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Upload Financial Statements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload audited financial statements for <span className="font-medium text-gray-700">{nbfi.name}</span>
          </p>
        </div>

        {!processing ? (
          <div className="max-w-3xl space-y-6">
            {/* Financial Statements Upload */}
            <div
              className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-400 transition-colors"
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, 'fs')}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="font-medium text-gray-700 mb-1">Upload Audited Financial Statements</p>
              <p className="text-xs text-gray-400 mb-4">Drag & drop PDF files here, or click to browse</p>
              <input
                type="file"
                accept=".pdf,.xlsx,.xls"
                multiple
                onChange={e => handleFileInput(e, 'fs')}
                className="hidden"
                id="fs-input"
              />
              <label htmlFor="fs-input" className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm cursor-pointer hover:bg-[#004d99]">
                Browse Files
              </label>
              {fsFiles.length > 0 && (
                <div className="mt-4 space-y-1">
                  {fsFiles.map((f, i) => (
                    <div key={i} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs mr-2">
                      <FileText className="w-3 h-3" /> {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MIS Upload */}
            <div
              className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 p-6 text-center hover:border-gray-400 transition-colors"
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, 'mis')}
            >
              <p className="font-medium text-gray-600 text-sm mb-1">Upload MIS (Optional)</p>
              <p className="text-xs text-gray-400 mb-3">Management Information System data, if available</p>
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                multiple
                onChange={e => handleFileInput(e, 'mis')}
                className="hidden"
                id="mis-input"
              />
              <label htmlFor="mis-input" className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs cursor-pointer hover:bg-gray-50">
                Browse Files
              </label>
              {misFiles.length > 0 && (
                <div className="mt-3 space-y-1">
                  {misFiles.map((f, i) => (
                    <div key={i} className="inline-flex items-center gap-2 bg-gray-50 text-gray-600 px-3 py-1 rounded text-xs mr-2">
                      <FileText className="w-3 h-3" /> {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleProcess}
              disabled={fsFiles.length === 0}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                fsFiles.length > 0
                  ? 'bg-[#003366] text-white hover:bg-[#004d99] shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Analyze Financial Statements &rarr;
            </button>
          </div>
        ) : (
          /* Processing Animation */
          <div className="max-w-lg mx-auto mt-20">
            <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                {progress < 100 ? (
                  <>
                    <Brain className="w-10 h-10 text-[#003366] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    <Loader2 className="w-20 h-20 text-blue-200 animate-spin absolute top-0 left-0" />
                  </>
                ) : (
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                {progress < 100 ? 'Analyzing Financial Statements with AI' : 'Analysis Complete'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">{stage}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-[#003366] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{progress}%</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
