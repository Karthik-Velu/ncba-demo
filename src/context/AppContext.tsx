'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NBFIRecord, User, NBFIStatus, CommentaryEntry, FinancialData } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Import JSON data
import inputTemplateData from '../../data/input-template.json';
import nbfiOutputData from '../../data/nbfi-output.json';
import cashflowData from '../../data/cashflow.json';

interface AppState {
  user: User | null;
  nbfis: NBFIRecord[];
  login: (role: 'analyst' | 'approver') => void;
  logout: () => void;
  addNBFI: (data: Omit<NBFIRecord, 'id' | 'status' | 'dateOnboarded' | 'financialData' | 'commentary'>) => string;
  updateNBFIStatus: (id: string, status: NBFIStatus) => void;
  loadFinancialData: (id: string) => void;
  updateFinancialValues: (id: string, section: string, key: string, periodIndex: number, value: number) => void;
  addCommentary: (id: string, text: string) => void;
  setRecommendation: (id: string, text: string) => void;
  setApproverComments: (id: string, text: string) => void;
  getNBFI: (id: string) => NBFIRecord | undefined;
}

const AppContext = createContext<AppState | undefined>(undefined);

const USERS: Record<string, User> = {
  analyst: { id: '1', name: 'Sarah Kimani', role: 'analyst', email: 'sarah.kimani@ncba.co.ke' },
  approver: { id: '2', name: 'James Ochieng', role: 'approver', email: 'james.ochieng@ncba.co.ke' },
};

const SEED_NBFIS: NBFIRecord[] = [
  {
    id: 'seed-1',
    name: 'Premier Credit Limited',
    keyContacts: 'John Mwangi (CEO), Alice Wanjiku (CFO)',
    fundingAmount: 150000,
    description: 'Established MFI operating in Central Kenya with focus on agricultural lending.',
    status: 'approved',
    dateOnboarded: '2024-08-15',
    commentary: [
      { id: 'c1', author: 'Sarah Kimani', role: 'analyst', text: 'Strong financials with consistent growth. Recommend for approval.', timestamp: '2024-08-20T10:00:00Z' },
    ],
    recommendation: 'Approved for KES 150M facility based on strong financial performance.',
    approverComments: 'Approved. Solid track record and adequate capital ratios.',
  },
  {
    id: 'seed-2',
    name: 'Faulu Microfinance',
    keyContacts: 'Peter Njoroge (MD)',
    fundingAmount: 200000,
    description: 'Leading MFI in East Africa with nationwide branch network.',
    status: 'pending_review',
    dateOnboarded: '2024-11-01',
    commentary: [
      { id: 'c2', author: 'Sarah Kimani', role: 'analyst', text: 'Financials reviewed. Some concerns on gearing ratio but overall acceptable.', timestamp: '2024-11-05T14:00:00Z' },
    ],
    recommendation: 'Recommend with conditions - require quarterly monitoring of gearing.',
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [nbfis, setNbfis] = useState<NBFIRecord[]>(SEED_NBFIS);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ncba-demo-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.user) setUser(parsed.user);
        if (parsed.nbfis?.length) setNbfis(parsed.nbfis);
      } catch { /* ignore */ }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('ncba-demo-state', JSON.stringify({ user, nbfis }));
  }, [user, nbfis]);

  const login = useCallback((role: 'analyst' | 'approver') => {
    setUser(USERS[role]);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const addNBFI = useCallback((data: Omit<NBFIRecord, 'id' | 'status' | 'dateOnboarded' | 'financialData' | 'commentary'>) => {
    const id = uuidv4();
    const record: NBFIRecord = {
      ...data,
      id,
      status: 'draft',
      dateOnboarded: new Date().toISOString().split('T')[0],
      commentary: [],
    };
    setNbfis(prev => [...prev, record]);
    return id;
  }, []);

  const updateNBFIStatus = useCallback((id: string, status: NBFIStatus) => {
    setNbfis(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  }, []);

  const loadFinancialData = useCallback((id: string) => {
    const financialData: FinancialData = {
      inputTemplate: inputTemplateData as never,
      nbfiOutput: nbfiOutputData as never,
      cashFlow: cashflowData as never,
    };
    setNbfis(prev => prev.map(n => n.id === id ? { ...n, financialData, status: 'spreading' } : n));
  }, []);

  const updateFinancialValues = useCallback((id: string, section: string, key: string, periodIndex: number, value: number) => {
    setNbfis(prev => prev.map(n => {
      if (n.id !== id || !n.financialData) return n;
      const fd = JSON.parse(JSON.stringify(n.financialData));
      // Find and update the row in input template
      const searchSections = [
        fd.inputTemplate?.partA?.balanceSheet?.rows,
        fd.inputTemplate?.partA?.profitAndLoss?.rows,
        ...(fd.cashFlow?.sections?.map((s: { rows: unknown[] }) => s.rows) || []),
      ].filter(Boolean);

      for (const rows of searchSections) {
        const row = (rows as { key: string; values: (number | null)[] }[]).find((r) => r.key === key);
        if (row) {
          row.values[periodIndex] = value;
          break;
        }
      }
      return { ...n, financialData: fd };
    }));
  }, []);

  const addCommentary = useCallback((id: string, text: string) => {
    if (!user) return;
    const entry: CommentaryEntry = {
      id: uuidv4(),
      author: user.name,
      role: user.role,
      text,
      timestamp: new Date().toISOString(),
    };
    setNbfis(prev => prev.map(n =>
      n.id === id ? { ...n, commentary: [...(n.commentary || []), entry] } : n
    ));
  }, [user]);

  const setRecommendation = useCallback((id: string, text: string) => {
    setNbfis(prev => prev.map(n =>
      n.id === id ? { ...n, recommendation: text, status: 'pending_review' } : n
    ));
  }, []);

  const setApproverComments = useCallback((id: string, text: string) => {
    setNbfis(prev => prev.map(n =>
      n.id === id ? { ...n, approverComments: text } : n
    ));
  }, []);

  const getNBFI = useCallback((id: string) => {
    return nbfis.find(n => n.id === id);
  }, [nbfis]);

  return (
    <AppContext.Provider value={{
      user, nbfis, login, logout, addNBFI, updateNBFIStatus,
      loadFinancialData, updateFinancialValues,
      addCommentary, setRecommendation, setApproverComments, getNBFI,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
