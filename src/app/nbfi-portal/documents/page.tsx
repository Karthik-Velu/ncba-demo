'use client';

import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
  ArrowLeft, FileText, CheckCircle2, Clock, AlertCircle,
  Upload, ChevronDown, ChevronRight, Loader2, Inbox,
} from 'lucide-react';

export default function DocumentsPage() {
  const { user, getNBFI, updateDocumentStatus } = useApp();
  const router = useRouter();

  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'nbfi_user') router.push('/');
  }, [user, router]);

  if (!user || user.role !== 'nbfi_user') return null;

  const nbfiId = user.nbfiId!;
  const nbfi = getNBFI(nbfiId);
  const docs = nbfi?.documents || [];

  const handleUpload = useCallback((docId: string) => {
    setUploadingDoc(docId);
    setTimeout(() => {
      updateDocumentStatus(
        nbfiId,
        docId,
        'submitted',
        new Date().toISOString(),
        user.name + ' (NBFI Portal)',
      );
      setUploadingDoc(null);
    }, 800);
  }, [nbfiId, updateDocumentStatus, user.name]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" /> Submitted
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" /> Overdue
          </span>
        );
      default:
        return null;
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
              <p className="text-sm text-gray-500">{nbfi?.name || 'NBFI Partner'}</p>
            </div>
          </div>

          {docs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-1">No document requirements configured yet.</p>
              <p className="text-sm text-gray-400">
                Your NCBA relationship manager will set these up.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-gray-900 text-sm">
                  Required Documents ({docs.length})
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 w-8"></th>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Frequency</th>
                    <th className="px-4 py-3">Next Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {docs.map((doc) => {
                    const isExpanded = expandedDoc === doc.id;
                    const isUploading = uploadingDoc === doc.id;
                    const canUpload = doc.status === 'pending' || doc.status === 'overdue';

                    return (
                      <TableRowGroup key={doc.id}>
                        <tr className="hover:bg-gray-50/50">
                          <td className="px-5 py-3">
                            {doc.submissions && doc.submissions.length > 0 ? (
                              <button
                                onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {isExpanded
                                  ? <ChevronDown className="w-4 h-4" />
                                  : <ChevronRight className="w-4 h-4" />
                                }
                              </button>
                            ) : (
                              <span className="w-4 h-4 block" />
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{doc.name}</td>
                          <td className="px-4 py-3 text-gray-500 capitalize">{doc.frequency}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {new Date(doc.nextDueDate).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3">{statusBadge(doc.status)}</td>
                          <td className="px-4 py-3 text-right">
                            {canUpload && (
                              <button
                                onClick={() => handleUpload(doc.id)}
                                disabled={isUploading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                              >
                                {isUploading ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-3 h-3" />
                                    Upload
                                  </>
                                )}
                              </button>
                            )}
                            {doc.status === 'submitted' && (
                              <span className="text-xs text-green-600 font-medium">
                                Up to date
                              </span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && doc.submissions && doc.submissions.length > 0 && (
                          <tr>
                            <td colSpan={6} className="bg-gray-50/50 px-5 py-0">
                              <div className="py-3 pl-8">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Submission History
                                </p>
                                <div className="space-y-2">
                                  {doc.submissions.map((sub, i) => (
                                    <div key={i} className="flex items-center gap-4 text-xs text-gray-600">
                                      <span className="font-mono text-gray-400 w-32">
                                        {new Date(sub.date).toLocaleDateString('en-GB', {
                                          day: 'numeric', month: 'short', year: 'numeric',
                                        })}
                                      </span>
                                      <span className="text-gray-700 font-medium">{sub.filename}</span>
                                      <span className="text-gray-400">by {sub.uploadedBy}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </TableRowGroup>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TableRowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
