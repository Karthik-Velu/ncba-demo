'use client';

import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, UserCheck, ClipboardCheck, Building2 } from 'lucide-react';

export default function LoginPage() {
  const { user, login } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'nbfi_user') router.push('/nbfi-portal');
      else router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = (role: 'analyst' | 'approver' | 'nbfi_user') => {
    login(role);
    if (role === 'nbfi_user') router.push('/nbfi-portal');
    else router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00264d] via-[#003366] to-[#004d99] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#003366] rounded-xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#003366]">NCBA Risk Platform</h1>
          <p className="text-sm text-gray-500 mt-1">NBFI Risk Infrastructure & Monitoring</p>
          <p className="text-[10px] text-gray-400 mt-1">Powered by Kaleidofin</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-500 text-center mb-2 uppercase tracking-wider font-medium">NCBA Team</p>

          <button
            onClick={() => handleLogin('analyst')}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#003366] hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-[#003366] transition-colors">
              <UserCheck className="w-6 h-6 text-[#003366] group-hover:text-white transition-colors" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">Sarah Kimani</p>
              <p className="text-xs text-gray-500">Credit Analyst</p>
            </div>
          </button>

          <button
            onClick={() => handleLogin('approver')}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#003366] hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-[#003366] transition-colors">
              <ClipboardCheck className="w-6 h-6 text-green-700 group-hover:text-white transition-colors" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">James Ochieng</p>
              <p className="text-xs text-gray-500">Senior Approver</p>
            </div>
          </button>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <p className="text-xs text-gray-500 text-center mb-2 uppercase tracking-wider font-medium">NBFI Partner</p>
          </div>

          <button
            onClick={() => handleLogin('nbfi_user')}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
              <Building2 className="w-6 h-6 text-emerald-700 group-hover:text-white transition-colors" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">Alice Wanjiku</p>
              <p className="text-xs text-gray-500">Premier Credit Limited — CFO</p>
            </div>
          </button>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-8">Demo Environment &middot; No authentication required</p>
      </div>
    </div>
  );
}
