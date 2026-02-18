'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard, UserPlus, LogOut, FileSpreadsheet, Shield,
  Upload, BarChart3, Filter, Settings, FileText, AlertTriangle,
  Activity, TrendingUp, CheckCircle2, Lock, CircleDot, ChevronDown,
  Building2, Home,
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout, getNBFI } = useApp();
  const pathname = usePathname();
  const params = useParams();
  const nbfiId = params?.id as string | undefined;

  if (!user) return null;

  if (user.role === 'nbfi_user') return <NBFIPortalSidebar user={user} pathname={pathname} logout={logout} />;

  const isNBFIDetail = pathname.startsWith('/nbfi/') && nbfiId;

  if (isNBFIDetail) {
    const nbfi = getNBFI(nbfiId);
    return <NBFIDetailSidebar nbfi={nbfi} nbfiId={nbfiId} pathname={pathname} user={user} logout={logout} />;
  }

  return <GlobalSidebar pathname={pathname} user={user} logout={logout} />;
}

function GlobalSidebar({ pathname, user, logout }: { pathname: string; user: { name: string; role: string }; logout: () => void }) {
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/onboard', label: 'Onboard NBFI', icon: UserPlus },
  ];

  return (
    <SidebarShell user={user} logout={logout} title="NCBA" subtitle="Risk Infrastructure Platform">
      <nav className="flex-1 py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={navItemClass(active)}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </SidebarShell>
  );
}

function NBFIDetailSidebar({ nbfi, nbfiId, pathname, user, logout }: {
  nbfi: { name: string; status: string; setupCompleted?: boolean } | undefined;
  nbfiId: string;
  pathname: string;
  user: { name: string; role: string };
  logout: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const status = nbfi?.status || 'draft';

  const stepDone = (step: number): boolean => {
    const order: Record<string, number> = {
      draft: 0, uploading: 0, spreading: 1, pending_review: 1, approved: 1, rejected: 1,
      pool_selected: 2, setup_complete: 3, monitoring: 8,
    };
    return (order[status] ?? 0) >= step;
  };

  const stepIcon = (step: number) => {
    if (stepDone(step)) return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    const currentStep = {
      draft: 0, uploading: 0, spreading: 1, pending_review: 1, approved: 1, pool_selected: 2,
      setup_complete: 3, monitoring: 8,
    }[status] ?? 0;
    if (currentStep === step) return <CircleDot className="w-3.5 h-3.5 text-blue-400" />;
    return <Lock className="w-3.5 h-3.5 text-gray-500" />;
  };

  type StepItem = {
    step: number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    subs?: { href: string; label: string }[];
    href?: string;
  };

  const steps: StepItem[] = [
    { step: 1, label: 'Financial Assessment', icon: FileSpreadsheet, subs: [
      { href: `/nbfi/${nbfiId}/upload`, label: 'Upload' },
      { href: `/nbfi/${nbfiId}/input`, label: 'Spreading' },
      { href: `/nbfi/${nbfiId}/output`, label: 'Output & Ratios' },
      { href: `/nbfi/${nbfiId}/review`, label: 'Review' },
    ]},
    { step: 2, label: 'Loan Book Assessment', icon: BarChart3, subs: [
      { href: `/nbfi/${nbfiId}/loan-book`, label: 'Upload Loan Book' },
      { href: `/nbfi/${nbfiId}/eda`, label: 'Portfolio EDA' },
      { href: `/nbfi/${nbfiId}/selection`, label: 'Asset Selection' },
    ]},
    { step: 3, label: 'Setup & Configuration', icon: Settings, href: `/nbfi/${nbfiId}/setup` },
    { step: 5, label: 'Document Management', icon: FileText, href: `/nbfi/${nbfiId}/documents` },
    { step: 6, label: 'Covenant Monitoring', icon: AlertTriangle, href: `/nbfi/${nbfiId}/covenants` },
    { step: 7, label: 'Early Warnings', icon: TrendingUp, href: `/nbfi/${nbfiId}/early-warnings` },
    { step: 8, label: 'Risk Dashboard', icon: Activity, href: `/nbfi/${nbfiId}/monitoring` },
  ];

  return (
    <SidebarShell user={user} logout={logout} title="NCBA" subtitle="Risk Infrastructure Platform">
      <div className="px-4 py-3 border-b border-[#003366]">
        <Link href="/dashboard" className="text-xs text-blue-300 hover:text-white">&larr; All NBFIs</Link>
        <p className="text-sm font-medium text-white mt-1 truncate">{nbfi?.name || 'NBFI'}</p>
        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
          status === 'monitoring' ? 'bg-green-500/20 text-green-300' :
          status === 'approved' ? 'bg-green-500/20 text-green-300' :
          'bg-blue-500/20 text-blue-300'
        }`}>{status.replace(/_/g, ' ')}</span>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {steps.map(({ step, label, icon: Icon, subs, href }) => {
          const isExpanded = expanded === `step-${step}`;
          const hasSubActive = subs?.some(s => pathname === s.href);
          const isActive = href ? pathname === href : hasSubActive;

          if (subs) {
            return (
              <div key={step}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : `step-${step}`)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${
                    isActive || isExpanded ? 'bg-[#003366] text-white' : 'text-blue-200 hover:bg-[#003366]/50 hover:text-white'
                  }`}
                >
                  {stepIcon(step)}
                  <Icon className="w-3.5 h-3.5" />
                  <span className="flex-1 text-left">Step {step}: {label}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded || hasSubActive ? 'rotate-180' : ''}`} />
                </button>
                {(isExpanded || hasSubActive) && (
                  <div className="bg-[#001a33]">
                    {subs.map(s => (
                      <Link key={s.href} href={s.href} className={`block pl-14 pr-4 py-2 text-xs ${
                        pathname === s.href ? 'text-white bg-[#003366]' : 'text-blue-300 hover:text-white hover:bg-[#003366]/30'
                      }`}>{s.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link key={step} href={href!} className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${
              isActive ? 'bg-[#003366] text-white border-r-2 border-blue-400' : 'text-blue-200 hover:bg-[#003366]/50 hover:text-white'
            }`}>
              {stepIcon(step)}
              <Icon className="w-3.5 h-3.5" />
              <span>Step {step}: {label}</span>
            </Link>
          );
        })}
      </nav>
    </SidebarShell>
  );
}

function NBFIPortalSidebar({ user, pathname, logout }: { user: { name: string; role: string; nbfiId?: string }; pathname: string; logout: () => void }) {
  const links = [
    { href: '/nbfi-portal', label: 'Portal Home', icon: Home },
    { href: '/nbfi-portal/upload-loan-book', label: 'Upload Loan Book', icon: Upload },
    { href: '/nbfi-portal/documents', label: 'Upload Documents', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-emerald-900 min-h-screen flex flex-col text-white">
      <div className="p-6 border-b border-emerald-800">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-6 h-6 text-emerald-300" />
          <span className="text-lg font-bold tracking-wide">Premier Credit</span>
        </div>
        <p className="text-xs text-emerald-200 mt-1">NBFI Partner Portal</p>
        <p className="text-[10px] text-emerald-300/60 mt-0.5">Powered by Kaleidofin</p>
      </div>
      <nav className="flex-1 py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
              active ? 'bg-emerald-800 text-white border-r-2 border-emerald-400' : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-emerald-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-emerald-300 capitalize">NBFI Partner</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-xs text-emerald-300 hover:text-white transition-colors">
          <LogOut className="w-3 h-3" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

function SidebarShell({ children, user, logout, title, subtitle }: {
  children: React.ReactNode;
  user: { name: string; role: string };
  logout: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <aside className="w-64 bg-[#00264d] min-h-screen flex flex-col text-white">
      <div className="p-6 border-b border-[#003366]">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-6 h-6 text-blue-300" />
          <span className="text-lg font-bold tracking-wide">{title}</span>
        </div>
        <p className="text-xs text-blue-200 mt-1">{subtitle}</p>
        <p className="text-[10px] text-blue-300/60 mt-0.5">Powered by Kaleidofin</p>
      </div>
      {children}
      <div className="p-4 border-t border-[#003366]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-blue-300 capitalize flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3" />
              {user.role.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-xs text-blue-300 hover:text-white transition-colors">
          <LogOut className="w-3 h-3" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

function navItemClass(active: boolean) {
  return `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
    active ? 'bg-[#003366] text-white border-r-2 border-blue-400' : 'text-blue-200 hover:bg-[#003366]/50 hover:text-white'
  }`;
}
