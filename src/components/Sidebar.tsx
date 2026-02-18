'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard, UserPlus, LogOut, FileSpreadsheet,
  Upload, BarChart3, Settings, FileText, AlertTriangle,
  Activity, CheckCircle2, Lock, CircleDot, ChevronDown,
  ChevronUp, Building2, Home, Wifi, Users,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import NotificationBell from './NotificationBell';
import KaleidofinLogo from './KaleidofinLogo';

const DEMO_USERS = [
  { role: 'analyst' as const, name: 'Sarah Kimani', label: 'Credit Analyst' },
  { role: 'approver' as const, name: 'James Ochieng', label: 'Senior Approver' },
  { role: 'nbfi_user' as const, name: 'Alice Wanjiku', label: 'NBFI Partner' },
];

export default function Sidebar() {
  const { user, logout, getNBFI } = useApp();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const nbfiId = params?.id as string | undefined;

  const handleLogout = useCallback(() => {
    logout();
    router.push('/');
  }, [logout, router]);

  if (!user) return null;

  if (user.role === 'nbfi_user') return <NBFIPortalSidebar user={user} pathname={pathname} logout={handleLogout} />;

  const isNBFIDetail = pathname.startsWith('/nbfi/') && nbfiId;

  if (isNBFIDetail) {
    const nbfi = getNBFI(nbfiId);
    return <NBFIDetailSidebar nbfi={nbfi} nbfiId={nbfiId} pathname={pathname} user={user} logout={handleLogout} />;
  }

  return <GlobalSidebar pathname={pathname} user={user} logout={handleLogout} />;
}

function GlobalSidebar({ pathname, user, logout }: { pathname: string; user: { name: string; role: string }; logout: () => void }) {
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/onboard', label: 'Onboard NBFI', icon: UserPlus },
  ];

  return (
    <SidebarShell user={user} logout={logout}>
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
      pool_selected: 2, setup_complete: 4, monitoring: 8,
    };
    return (order[status] ?? 0) >= step;
  };

  const stepIcon = (step: number) => {
    if (stepDone(step)) return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    const currentStep = {
      draft: 0, uploading: 0, spreading: 1, pending_review: 1, approved: 1, pool_selected: 2,
      setup_complete: 4, monitoring: 8,
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

  type Section = { title: string; steps: StepItem[] };

  const sections: Section[] = [
    {
      title: 'Pre-Onboarding',
      steps: [
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
      ],
    },
    {
      title: 'Transaction Setup',
      steps: [
        { step: 3, label: 'Covenant & Doc Setup', icon: Settings, href: `/nbfi/${nbfiId}/setup` },
        { step: 4, label: 'Data Integration', icon: Wifi, href: `/nbfi/${nbfiId}/integration` },
      ],
    },
    {
      title: 'Monitoring',
      steps: [
        { step: 5, label: 'Document Management', icon: FileText, href: `/nbfi/${nbfiId}/documents` },
        { step: 6, label: 'Covenant & Early Warnings', icon: AlertTriangle, href: `/nbfi/${nbfiId}/covenants` },
        { step: 8, label: 'Risk Dashboard', icon: Activity, href: `/nbfi/${nbfiId}/monitoring` },
      ],
    },
  ];

  return (
    <SidebarShell user={user} logout={logout}>
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
        {sections.map(({ title, steps }) => (
          <div key={title}>
            <p className="px-4 pt-4 pb-1 text-[9px] font-bold uppercase tracking-widest text-blue-400/60">{title}</p>
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
                      <span className="flex-1 text-left">{label}</span>
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
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </SidebarShell>
  );
}

function NBFIPortalSidebar({ user, pathname, logout }: { user: { name: string; role: string; nbfiId?: string }; pathname: string; logout: () => void }) {
  const links = [
    { href: '/nbfi-portal', label: 'Portal Home', icon: Home },
    { href: '/nbfi-portal/upload-loan-book', label: 'Upload Loan Book', icon: Upload },
    { href: '/nbfi-portal/documents', label: 'Upload Documents', icon: FileText },
    { href: '/nbfi-portal/sftp-config', label: 'SFTP Configuration', icon: Wifi },
  ];

  return (
    <aside className="w-64 bg-emerald-900 min-h-screen flex flex-col text-white">
      <div className="p-4 border-b border-emerald-800">
        <KaleidofinLogo width={110} className="brightness-0 invert opacity-80 mb-2" />
        <p className="text-xs text-emerald-200">NBFI Partner Portal</p>
      </div>
      <div className="px-4 py-3 border-b border-emerald-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold shrink-0">
          {user.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-[10px] text-emerald-300">NBFI Partner</p>
        </div>
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
        <button onClick={logout} className="flex items-center gap-2 text-xs text-emerald-300 hover:text-white transition-colors">
          <LogOut className="w-3 h-3" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

function UserSwitcher({ user, logout }: { user: { name: string; role: string }; logout: () => void }) {
  const [open, setOpen] = useState(false);
  const { login } = useApp();
  const router = useRouter();

  const handleSwitch = (role: 'analyst' | 'approver' | 'nbfi_user') => {
    setOpen(false);
    login(role);
    if (role === 'nbfi_user') router.push('/nbfi-portal');
    else router.push('/dashboard');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#003366] hover:bg-[#003366]/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
          {user.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-[10px] text-blue-300 capitalize">{user.role.replace(/_/g, ' ')}</p>
        </div>
        <ChevronUp className={`w-3.5 h-3.5 text-blue-300 transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 bottom-full bg-[#001a33] border border-[#003366] rounded-t-lg shadow-lg z-50 overflow-hidden">
          <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-blue-400/60 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Switch User
          </p>
          {DEMO_USERS.map(u => {
            const active = user.role === u.role;
            return (
              <button
                key={u.role}
                onClick={() => handleSwitch(u.role)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  active ? 'bg-[#003366] text-white' : 'text-blue-200 hover:bg-[#003366]/50 hover:text-white'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  u.role === 'nbfi_user' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}>
                  {u.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{u.name}</p>
                  <p className="text-[10px] text-blue-300/70">{u.label}</p>
                </div>
                {active && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 ml-auto shrink-0" />}
              </button>
            );
          })}
          <div className="border-t border-[#003366]">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
            >
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarShell({ children, user, logout }: {
  children: React.ReactNode;
  user: { name: string; role: string };
  logout: () => void;
}) {
  return (
    <aside className="w-64 bg-[#00264d] min-h-screen flex flex-col text-white">
      <div className="p-4 border-b border-[#003366]">
        <div className="flex items-center justify-between gap-2">
          <KaleidofinLogo width={110} className="brightness-0 invert opacity-90" />
          <div className="shrink-0 [&_button]:text-blue-300 [&_button:hover]:text-white [&_svg]:text-blue-300">
            <NotificationBell />
          </div>
        </div>
        <p className="text-[10px] text-blue-300/60 mt-1.5">Risk Infrastructure Platform</p>
      </div>
      {children}
      <UserSwitcher user={user} logout={logout} />
    </aside>
  );
}

function navItemClass(active: boolean) {
  return `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
    active ? 'bg-[#003366] text-white border-r-2 border-blue-400' : 'text-blue-200 hover:bg-[#003366]/50 hover:text-white'
  }`;
}
