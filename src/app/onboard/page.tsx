'use client';

import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function OnboardPage() {
  const { user, addNBFI } = useApp();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    keyContacts: '',
    fundingAmount: '',
    description: '',
  });

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const id = addNBFI({
      name: form.name,
      keyContacts: form.keyContacts,
      fundingAmount: Number(form.fundingAmount) || 0,
      description: form.description,
    });
    router.push(`/nbfi/${id}/upload`);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#003366] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Onboard New NBFI</h1>
              <p className="text-sm text-gray-500">Provide basic information about the originator</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NBFI Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 4G Capital Kenya"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Key Contacts</label>
              <input
                type="text"
                value={form.keyContacts}
                onChange={e => setForm(f => ({ ...f, keyContacts: e.target.value }))}
                placeholder="e.g. John Doe (CEO), Jane Smith (CFO)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Required Funding Amount (KES &apos;000)</label>
              <input
                type="number"
                value={form.fundingAmount}
                onChange={e => setForm(f => ({ ...f, fundingAmount: e.target.value }))}
                placeholder="e.g. 100000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Add any additional details about the originator..."
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#004d99] transition-colors text-sm font-medium"
              >
                Continue to Upload &rarr;
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
