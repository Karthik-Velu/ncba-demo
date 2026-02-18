'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { DocumentRequirement } from '@/lib/types';
import { AlertTriangle, ChevronDown, ChevronRight, Upload, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

function StatusBadge({ status }: { status: DocumentRequirement['status'] }) {
  const config = {
    submitted: { bg: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Submitted' },
    pending: { bg: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
    overdue: { bg: 'bg-red-100 text-red-700', icon: XCircle, label: 'Overdue' },
  };
  const { bg, icon: Icon, label } = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function DocumentsPage() {
  const { user, getNBFI, updateDocumentStatus } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);
  if (!user || !nbfi) return null;

  const documents: DocumentRequirement[] = nbfi.documents || [];
  const overdueCount = documents.filter(d => d.status === 'overdue').length;

  const handleUploadOnBehalf = (docId: string) => {
    setUploadingDoc(docId);
    setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      updateDocumentStatus(id, docId, 'submitted', today, user.name);
      setUploadingDoc(null);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-gray-50">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          &larr; Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Document Management — {nbfi.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage required document submissions</p>
        </div>

        {overdueCount > 0 && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-sm font-medium text-red-700">
              {overdueCount} document{overdueCount > 1 ? 's' : ''} overdue — immediate action required
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-8"></th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Document</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">Frequency</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">Next Due</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">Last Submitted</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">Submitted By</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => {
                const isExpanded = expandedRow === doc.id;
                return (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedRow(isExpanded ? null : doc.id)}
                    onUpload={() => handleUploadOnBehalf(doc.id)}
                    isUploading={uploadingDoc === doc.id}
                  />
                );
              })}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No documents configured. Set up documents in the Setup page.
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

function DocumentRow({ doc, isExpanded, onToggle, onUpload, isUploading }: {
  doc: DocumentRequirement;
  isExpanded: boolean;
  onToggle: () => void;
  onUpload: () => void;
  isUploading: boolean;
}) {
  const hasHistory = doc.submissions && doc.submissions.length > 0;

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50/50">
        <td className="pl-3 py-3">
          {hasHistory && (
            <button onClick={onToggle} className="p-0.5 text-gray-400 hover:text-gray-600">
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </td>
        <td className="px-4 py-3 font-medium text-gray-800">{doc.name}</td>
        <td className="px-4 py-3 text-gray-600 capitalize">{doc.frequency}</td>
        <td className="px-4 py-3 font-mono text-xs text-gray-600">{doc.nextDueDate || '—'}</td>
        <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
        <td className="px-4 py-3 font-mono text-xs text-gray-600">{doc.submittedDate || '—'}</td>
        <td className="px-4 py-3 text-xs text-gray-600">{doc.submittedBy || '—'}</td>
        <td className="px-4 py-3">
          {(doc.status === 'pending' || doc.status === 'overdue') && (
            <button
              onClick={onUpload}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003366] text-white rounded-md text-xs font-medium hover:bg-[#004d99] disabled:opacity-50 transition-colors"
            >
              <Upload className="w-3 h-3" />
              {isUploading ? 'Uploading...' : 'Upload on Behalf'}
            </button>
          )}
        </td>
      </tr>
      {isExpanded && hasHistory && (
        <tr>
          <td colSpan={8} className="bg-blue-50/50 px-8 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Submission History</p>
            <div className="space-y-1.5">
              {doc.submissions!.map((sub, i) => (
                <div key={i} className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="font-mono text-gray-500 w-24">{sub.date}</span>
                  <span className="text-[#003366] font-medium">{sub.filename}</span>
                  <span className="text-gray-400">by {sub.uploadedBy}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
