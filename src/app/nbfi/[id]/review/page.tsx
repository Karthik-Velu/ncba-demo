'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Send, CheckCircle2, XCircle, MessageSquare, Clock, User } from 'lucide-react';
import Link from 'next/link';

export default function ReviewPage() {
  const { user, getNBFI, addCommentary, setRecommendation, setApproverComments, updateNBFIStatus } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [commentText, setCommentText] = useState('');
  const [recText, setRecText] = useState('');
  const [approverText, setApproverText] = useState('');

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);
  if (!user || !nbfi) return null;

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentary(id, commentText);
    setCommentText('');
  };

  const handleRecommend = () => {
    if (!recText.trim()) return;
    setRecommendation(id, recText);
    setRecText('');
  };

  const handleApprove = () => {
    setApproverComments(id, approverText);
    updateNBFIStatus(id, 'approved');
  };

  const handleReject = () => {
    setApproverComments(id, approverText);
    updateNBFIStatus(id, 'rejected');
  };

  const isAnalyst = user.role === 'analyst';
  const isApprover = user.role === 'approver';
  const canApprove = isApprover && nbfi.status === 'pending_review';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Link href={`/nbfi/${id}/output`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Output
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Commentary & Approval</h1>
          <p className="text-sm text-gray-500 mt-1">{nbfi.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Commentary Thread */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Commentary
              </h2>

              {/* Thread */}
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                {(!nbfi.commentary || nbfi.commentary.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-8">No commentary yet. Add your analysis below.</p>
                )}
                {nbfi.commentary?.map(c => (
                  <div key={c.id} className={`p-4 rounded-lg ${c.role === 'analyst' ? 'bg-blue-50 border border-blue-100' : 'bg-green-50 border border-green-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${c.role === 'analyst' ? 'bg-blue-500' : 'bg-green-500'}`}>
                        {c.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{c.author}</span>
                      <span className="text-[10px] text-gray-400 capitalize px-2 py-0.5 bg-white rounded">{c.role}</span>
                      <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(c.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="border-t border-gray-100 pt-4">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add commentary on the financial statement..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3 h-3" /> Add Comment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Status</h3>
              <div className={`badge badge-${nbfi.status} text-sm`}>
                {nbfi.status === 'pending_review' ? 'Pending Review' : nbfi.status === 'approved' ? 'Approved' : nbfi.status === 'rejected' ? 'Rejected' : nbfi.status}
              </div>

              {nbfi.recommendation && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Analyst Recommendation</p>
                  <p className="text-sm text-amber-800">{nbfi.recommendation}</p>
                </div>
              )}

              {nbfi.approverComments && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <p className="text-xs font-semibold text-green-700 mb-1">Approver Comments</p>
                  <p className="text-sm text-green-800">{nbfi.approverComments}</p>
                </div>
              )}
            </div>

            {/* Analyst: Recommend */}
            {isAnalyst && nbfi.status !== 'approved' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Submit Recommendation
                </h3>
                <textarea
                  value={recText}
                  onChange={e => setRecText(e.target.value)}
                  placeholder="Add recommendation note..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleRecommend}
                  disabled={!recText.trim()}
                  className="mt-2 w-full px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                >
                  Submit for Approval
                </button>
              </div>
            )}

            {/* Approver: Approve/Reject */}
            {canApprove && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Approval Decision</h3>
                <textarea
                  value={approverText}
                  onChange={e => setApproverText(e.target.value)}
                  placeholder="Final comments..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleApprove}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            )}

            {/* Approved Success */}
            {nbfi.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-green-700 text-sm">Assessment Approved</p>
                <p className="text-xs text-green-600 mt-1">Originator onboarding may proceed to next steps.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
