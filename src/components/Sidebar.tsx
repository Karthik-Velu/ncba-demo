'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { LayoutDashboard, UserPlus, LogOut, FileSpreadsheet, Shield } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useApp();
  const pathname = usePathname();

  if (!user) return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/onboard', label: 'Onboard NBFI', icon: UserPlus },
  ];

  return (
    <aside className="w-64 bg-[#00264d] min-h-screen flex flex-col text-white">
      <div className="p-6 border-b border-[#003366]">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-6 h-6 text-blue-300" />
          <span className="text-lg font-bold tracking-wide">NCBA</span>
        </div>
        <p className="text-xs text-blue-200 mt-1">Risk Infrastructure Platform</p>
        <p className="text-[10px] text-blue-300/60 mt-0.5">Powered by Kaleidofin</p>
      </div>

      <nav className="flex-1 py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                active
                  ? 'bg-[#003366] text-white border-r-2 border-blue-400'
                  : 'text-blue-200 hover:bg-[#003366]/50 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#003366]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-blue-300 capitalize flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3" />
              {user.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-blue-300 hover:text-white transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
