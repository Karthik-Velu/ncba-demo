'use client';

import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
  Upload, FileText, ShieldCheck, BookOpen, CalendarClock, CheckCircle2,
  Clock, AlertCircle,
} from 'lucide-react';

export default function NBFIPortalPage() {
  const { user, getNBFI, loanBookData } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'nbfi_user') router.push('/');
  }, [user, router]);

  if (!user || user.role !== 'nbfi_user') return null;

  const nbfi = getNBFI(user.nbfiId!);
  const docs = nbfi?.documents || [];
  const submitted = docs.filter(d => d.status === 'submitted').length;
  const pending = docs.filter(d => d.status === 'pending').length;
  const overdue = docs.filter(d => d.status === 'overdue').length;

  const loans = user.nbfiId ? loanBookData[user.nbfiId] : null;
  const meta = nbfi?.loanBookMeta;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name}
            </h1>
            <p className="text-gray-500 mt-1">
              {nbfi?.name || 'NBFI Partner'} &mdash; Partner Portal
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Upload Loan Book */}
            <Link href="/nbfi-portal/upload-loan-book" className="group">
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-400 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <Upload className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Upload Loan Book</h3>
                <p className="text-sm text-gray-500">
                  Upload your latest loan-level data for portfolio analysis
                </p>
              </div>
            </Link>

            {/* Upload Documents */}
            <Link href="/nbfi-portal/documents" className="group">
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-400 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Upload Documents</h3>
                <p className="text-sm text-gray-500">
                  Submit required compliance and reporting documents
                </p>
              </div>
            </Link>

            {/* Compliance Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Compliance Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Submitted
                  </span>
                  <span className="font-semibold text-green-700">{submitted}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <Clock className="w-3.5 h-3.5" />
                    Pending
                  </span>
                  <span className="font-semibold text-amber-700">{pending}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Overdue
                  </span>
                  <span className="font-semibold text-red-700">{overdue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Book Summary */}
          {loans && meta && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Loan Book Summary</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium text-gray-700">{meta.rowCount.toLocaleString()}</span> loans uploaded
                    {meta.uploadedAt && (
                      <>
                        {' '}on{' '}
                        <span className="font-medium text-gray-700">
                          {new Date(meta.uploadedAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </>
                    )}
                  </p>
                  {meta.filename && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" />
                      {meta.filename}
                    </p>
                  )}
                  {meta.totalBalance > 0 && (
                    <p className="text-sm text-emerald-700 font-medium mt-2">
                      KES {meta.totalBalance.toLocaleString()} total balance
                    </p>
                  )}
                </div>
                <Link
                  href="/nbfi-portal/upload-loan-book"
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  View &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
