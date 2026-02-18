'use client';

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, AlertTriangle, CheckCircle2, FileText, X } from 'lucide-react';
import Link from 'next/link';

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface AppAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  nbfiId?: string;
  nbfiName?: string;
  category: 'covenant' | 'data_feed' | 'portfolio' | 'document' | 'system';
  read: boolean;
  link?: string;
}

const MOCK_ALERTS: AppAlert[] = [
  {
    id: 'a1', severity: 'critical', title: 'Covenant Breach — Apex Finance',
    message: 'PAR 30+ ratio exceeded threshold (12.3% vs 10% limit). Immediate review required.',
    timestamp: '2025-02-18T08:30:00Z', nbfiId: 'seed-1', nbfiName: 'Apex Finance',
    category: 'covenant', read: false, link: '/nbfi/seed-1/covenants',
  },
  {
    id: 'a2', severity: 'warning', title: 'Data Feed Delayed — Horizon MFI',
    message: 'Daily loan book upload not received. Last successful feed: 2025-02-16.',
    timestamp: '2025-02-18T07:00:00Z', nbfiId: 'seed-2', nbfiName: 'Horizon MFI',
    category: 'data_feed', read: false, link: '/nbfi/seed-2/integration',
  },
  {
    id: 'a3', severity: 'warning', title: 'Portfolio Deterioration — Apex Finance',
    message: 'DPD 90+ balance increased 15% week-over-week. Vintage 2024-Q3 showing elevated losses.',
    timestamp: '2025-02-17T16:00:00Z', nbfiId: 'seed-1', nbfiName: 'Apex Finance',
    category: 'portfolio', read: false, link: '/nbfi/seed-1/eda',
  },
  {
    id: 'a4', severity: 'info', title: 'Document Expiring — Apex Finance',
    message: 'Board resolution document expires in 14 days. Request renewal from NBFI.',
    timestamp: '2025-02-17T10:00:00Z', nbfiId: 'seed-1', nbfiName: 'Apex Finance',
    category: 'document', read: true, link: '/nbfi/seed-1/documents',
  },
  {
    id: 'a5', severity: 'success', title: 'Data Feed Received — Apex Finance',
    message: '520 rows loaded successfully via SFTP. All format validations passed.',
    timestamp: '2025-02-18T06:05:00Z', nbfiId: 'seed-1', nbfiName: 'Apex Finance',
    category: 'data_feed', read: true, link: '/nbfi/seed-1/integration',
  },
  {
    id: 'a6', severity: 'warning', title: 'Concentration Risk — Nairobi Region',
    message: '45% of portfolio balance concentrated in Nairobi. Consider diversification review.',
    timestamp: '2025-02-16T14:00:00Z', category: 'portfolio', read: true,
  },
  {
    id: 'a7', severity: 'info', title: 'Monthly Report Due',
    message: 'Portfolio monitoring report for January 2025 is due in 3 days.',
    timestamp: '2025-02-15T09:00:00Z', category: 'system', read: true,
  },
];

const SEVERITY_CONFIG = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-500', dot: 'bg-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500', dot: 'bg-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: FileText, iconColor: 'text-blue-500', dot: 'bg-blue-500' },
  success: { bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2, iconColor: 'text-green-500', dot: 'bg-green-500' },
};

export function useAlerts() {
  const [alerts] = useState<AppAlert[]>(MOCK_ALERTS);
  const unreadCount = useMemo(() => alerts.filter(a => !a.read).length, [alerts]);
  return { alerts, unreadCount };
}

const PANEL_WIDTH = 384;
const PANEL_MAX_HEIGHT = 384;

export default function NotificationBell() {
  const { alerts, unreadCount } = useAlerts();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom : 400;
    const openUp = spaceBelow < PANEL_MAX_HEIGHT + 16;
    setPosition({
      top: openUp ? rect.top - PANEL_MAX_HEIGHT - 8 : rect.bottom + 8,
      left: Math.min(rect.left, Math.max(0, (typeof window !== 'undefined' ? window.innerWidth : 1024) - PANEL_WIDTH)),
    });
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!open) return;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const displayed = filter === 'unread' ? alerts.filter(a => !a.read) : alerts;

  const panelContent = open && (
    <div
      ref={panelRef}
      className="fixed w-96 bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden z-[9999]"
      style={{
        top: position.top,
        left: position.left,
        maxHeight: PANEL_MAX_HEIGHT,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setFilter('all')}
            className={`text-xs px-2 py-1 rounded ${filter === 'all' ? 'bg-[#003366] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>All</button>
          <button onClick={() => setFilter('unread')}
            className={`text-xs px-2 py-1 rounded ${filter === 'unread' ? 'bg-[#003366] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            Unread ({unreadCount})
          </button>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 bg-white">
        {displayed.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">No notifications</p>
        ) : (
          displayed.map(alert => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            const Icon = cfg.icon;
            return (
              <div key={alert.id} className={`p-3 hover:bg-gray-50 ${!alert.read ? 'bg-blue-50/30' : ''}`}>
                {alert.link ? (
                  <Link href={alert.link} onClick={() => setOpen(false)} className="block">
                    <AlertRow alert={alert} Icon={Icon} cfg={cfg} />
                  </Link>
                ) : (
                  <AlertRow alert={alert} Icon={Icon} cfg={cfg} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-[#003366]/30 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {typeof document !== 'undefined' && createPortal(panelContent, document.body)}
    </div>
  );
}

function AlertRow({ alert, Icon, cfg }: {
  alert: AppAlert;
  Icon: React.ComponentType<{ className?: string }>;
  cfg: { iconColor: string; dot: string };
}) {
  const timeAgo = getTimeAgo(alert.timestamp);
  return (
    <div className="flex gap-3">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-xs font-semibold text-gray-800 ${!alert.read ? 'font-bold' : ''}`}>{alert.title}</p>
          {!alert.read && <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />}
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{alert.message}</p>
        <p className="text-[10px] text-gray-400 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

function getTimeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DashboardAlertStrip() {
  const { alerts } = useAlerts();
  const critical = alerts.filter(a => !a.read && (a.severity === 'critical' || a.severity === 'warning'));
  if (critical.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {critical.slice(0, 3).map(alert => {
        const cfg = SEVERITY_CONFIG[alert.severity];
        const Icon = cfg.icon;
        return (
          <div key={alert.id} className={`${cfg.bg} ${cfg.border} border rounded-lg p-3 flex items-start gap-3`}>
            <Icon className={`w-5 h-5 ${cfg.iconColor} mt-0.5 shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{alert.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
            </div>
            {alert.link && (
              <Link href={alert.link} className="text-xs text-[#003366] font-medium hover:underline shrink-0">
                Review →
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TransactionAlertTimeline({ nbfiId }: { nbfiId: string }) {
  const { alerts } = useAlerts();
  const nbfiAlerts = alerts.filter(a => a.nbfiId === nbfiId);
  if (nbfiAlerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {nbfiAlerts.map(alert => {
        const cfg = SEVERITY_CONFIG[alert.severity];
        const Icon = cfg.icon;
        return (
          <div key={alert.id} className={`${cfg.bg} ${cfg.border} border rounded-lg p-3 flex items-start gap-3`}>
            <Icon className={`w-4 h-4 ${cfg.iconColor} mt-0.5 shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">{alert.title}</p>
              <p className="text-[11px] text-gray-600 mt-0.5">{alert.message}</p>
              <p className="text-[10px] text-gray-400 mt-1">{new Date(alert.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {alert.link && (
              <Link href={alert.link} className="text-[10px] text-[#003366] font-medium hover:underline shrink-0">View</Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
