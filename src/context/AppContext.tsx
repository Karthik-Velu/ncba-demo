'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  NBFIRecord, User, NBFIStatus, CommentaryEntry, FinancialData,
  LoanLevelRow, PoolSelectionState, CovenantDef, CovenantReading,
  DocumentRequirement, ProvisioningRule, EarlyWarningAlert,
  MonitoringData, LoanBookUploadMeta, TransactionType, SecuritisationStructure,
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

import inputTemplateData from '../../data/input-template.json';
import nbfiOutputData from '../../data/nbfi-output.json';
import cashflowData from '../../data/cashflow.json';
import mockCovenantsData from '../../data/mock-covenants.json';
import mockDocumentsData from '../../data/mock-documents.json';
import mockMonitoringData from '../../data/mock-monitoring.json';
import mockEarlyWarningsData from '../../data/mock-early-warnings.json';
import { NBFI_SEEDS, TRANSACTION_MAP, TRANSACTION_NAMES, getAllSeedLoanBooks } from '@/lib/seedTransactions';

interface AppState {
  user: User | null;
  nbfis: NBFIRecord[];
  login: (role: 'analyst' | 'approver' | 'nbfi_user') => void;
  logout: () => void;
  addNBFI: (data: Omit<NBFIRecord, 'id' | 'status' | 'dateOnboarded' | 'financialData' | 'commentary'>) => string;
  deleteNBFI: (id: string) => void;
  updateNBFIStatus: (id: string, status: NBFIStatus) => void;
  loadFinancialData: (id: string) => void;
  updateFinancialValues: (id: string, section: string, key: string, periodIndex: number, value: number) => void;
  addCommentary: (id: string, text: string) => void;
  setRecommendation: (id: string, text: string) => void;
  setApproverComments: (id: string, text: string) => void;
  getNBFI: (id: string) => NBFIRecord | undefined;
  loanBookData: Record<string, LoanLevelRow[]>;
  setLoanBookData: (nbfiId: string, rows: LoanLevelRow[]) => void;
  selectedPoolByNbfi: Record<string, PoolSelectionState>;
  setPoolSelection: (nbfiId: string, state: PoolSelectionState) => void;
  saveCovenantSetup: (id: string, covenants: CovenantDef[], documents: DocumentRequirement[], provisioningRules: { nbfi: ProvisioningRule[]; lender: ProvisioningRule[] }) => void;
  updateDocumentStatus: (id: string, docId: string, status: 'submitted' | 'pending' | 'overdue', date?: string, uploadedBy?: string) => void;
  setLoanBookMeta: (id: string, meta: LoanBookUploadMeta) => void;
  setTransactionType: (id: string, type: TransactionType) => void;
  setSecuritisationStructure: (id: string, structure: SecuritisationStructure) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const USERS: Record<string, User> = {
  analyst: { id: '1', name: 'Sarah Kimani', role: 'analyst', email: 'sarah.kimani@lender.co.ke' },
  approver: { id: '2', name: 'James Ochieng', role: 'approver', email: 'james.ochieng@lender.co.ke' },
  nbfi_user: { id: '3', name: 'Alice Wanjiku', role: 'nbfi_user', email: 'alice.wanjiku@apexfinance.co.ke', nbfiId: 'seed-1' },
};

const NBFI_PROVISIONING: ProvisioningRule[] = [
  { bucket: 'normal', dpdMin: 0, dpdMax: 30, provisionPercent: 1 },
  { bucket: 'watch', dpdMin: 31, dpdMax: 60, provisionPercent: 5 },
  { bucket: 'substandard', dpdMin: 61, dpdMax: 90, provisionPercent: 25 },
  { bucket: 'doubtful', dpdMin: 91, dpdMax: 180, provisionPercent: 50 },
  { bucket: 'loss', dpdMin: 181, dpdMax: 9999, provisionPercent: 100 },
];

const LENDER_PROVISIONING: ProvisioningRule[] = [
  { bucket: 'normal', dpdMin: 0, dpdMax: 30, provisionPercent: 1 },
  { bucket: 'watch', dpdMin: 31, dpdMax: 60, provisionPercent: 10 },
  { bucket: 'substandard', dpdMin: 61, dpdMax: 90, provisionPercent: 50 },
  { bucket: 'doubtful', dpdMin: 91, dpdMax: 120, provisionPercent: 75 },
  { bucket: 'loss', dpdMin: 121, dpdMax: 9999, provisionPercent: 100 },
];

const SEED_NBFIS: NBFIRecord[] = NBFI_SEEDS.map((s, idx) => {
  const base: NBFIRecord = {
    id: s.id,
    name: s.name,
    keyContacts: s.keyContacts,
    fundingAmount: s.fundingAmount,
    description: s.description,
    status: s.status as NBFIStatus,
    dateOnboarded: s.dateOnboarded,
    commentary: idx === 0 ? [{ id: 'c1', author: 'Sarah Kimani', role: 'analyst', text: 'Strong financials with consistent growth. Recommend for approval.', timestamp: '2024-08-20T10:00:00Z' }] : [],
    recommendation: idx === 0 ? 'Approved for KES 150M facility based on strong financial performance.' : undefined,
    approverComments: idx === 0 ? 'Approved. Solid track record and adequate capital ratios.' : undefined,
    provisioningRules: { nbfi: NBFI_PROVISIONING, lender: LENDER_PROVISIONING },
  };
  if (idx === 0) {
    base.covenants = mockCovenantsData.definitions as CovenantDef[];
    base.covenantReadings = mockCovenantsData.readings as CovenantReading[];
    base.documents = mockDocumentsData as DocumentRequirement[];
    base.earlyWarnings = mockEarlyWarningsData.alerts as EarlyWarningAlert[];
    base.monitoringData = mockMonitoringData as unknown as MonitoringData;
    base.setupCompleted = true;
    base.loanBookMeta = { source: 'nbfi_portal', uploadedAt: '2025-11-15T09:30:00Z', uploadedBy: 'Alice Wanjiku', rowCount: 520, totalBalance: 892000000, filename: 'apex_finance_loanbook_Q4_2025.csv' };
  }
  if (s.status === 'monitoring' || s.status === 'setup_complete') {
    base.setupCompleted = true;
  }
  return base;
});

const SEED_LOAN_BOOK: Record<string, LoanLevelRow[]> = getAllSeedLoanBooks();

const SEED_POOL_SELECTION: Record<string, PoolSelectionState> = {
  'seed-1': {
    excludedSegments: ['MSME'],
    filterSnapshot: {
      loanAmountMin: 20000,
      loanAmountMax: 500000,
      geographies: ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu'],
      products: ['Boda-Boda', 'Agri-Finance', 'Check-off', 'SACCO'],
    },
    confirmedAt: '2024-09-10T14:00:00Z',
  },
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [nbfis, setNbfis] = useState<NBFIRecord[]>(SEED_NBFIS);
  const [loanBookData, setLoanBookDataState] = useState<Record<string, LoanLevelRow[]>>(SEED_LOAN_BOOK);
  const [selectedPoolByNbfi, setSelectedPoolByNbfiState] = useState<Record<string, PoolSelectionState>>(SEED_POOL_SELECTION);

  useEffect(() => {
    const saved = localStorage.getItem('wl-demo-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.user) setUser(parsed.user);
        if (parsed.nbfis?.length) setNbfis(parsed.nbfis);
        if (parsed.loanBookData && typeof parsed.loanBookData === 'object') setLoanBookDataState(parsed.loanBookData);
        if (parsed.selectedPoolByNbfi && typeof parsed.selectedPoolByNbfi === 'object') setSelectedPoolByNbfiState(parsed.selectedPoolByNbfi);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wl-demo-state', JSON.stringify({ user, nbfis, loanBookData, selectedPoolByNbfi }));
  }, [user, nbfis, loanBookData, selectedPoolByNbfi]);

  const login = useCallback((role: 'analyst' | 'approver' | 'nbfi_user') => {
    setUser(USERS[role]);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('wl-demo-state');
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

  const deleteNBFI = useCallback((id: string) => {
    setNbfis(prev => prev.filter(n => n.id !== id));
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

  const updateFinancialValues = useCallback((id: string, _section: string, key: string, periodIndex: number, value: number) => {
    setNbfis(prev => prev.map(n => {
      if (n.id !== id || !n.financialData) return n;
      const fd = JSON.parse(JSON.stringify(n.financialData));
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
      role: user.role as 'analyst' | 'approver',
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

  const setLoanBookData = useCallback((nbfiId: string, rows: LoanLevelRow[]) => {
    setLoanBookDataState(prev => ({ ...prev, [nbfiId]: rows }));
  }, []);

  const setPoolSelection = useCallback((nbfiId: string, state: PoolSelectionState) => {
    setSelectedPoolByNbfiState(prev => ({ ...prev, [nbfiId]: state }));
  }, []);

  const saveCovenantSetup = useCallback((id: string, covenants: CovenantDef[], documents: DocumentRequirement[], provisioningRules: { nbfi: ProvisioningRule[]; lender: ProvisioningRule[] }) => {
    setNbfis(prev => prev.map(n =>
      n.id === id ? { ...n, covenants, documents, provisioningRules, setupCompleted: true, status: 'setup_complete' } : n
    ));
  }, []);

  const updateDocumentStatus = useCallback((id: string, docId: string, status: 'submitted' | 'pending' | 'overdue', date?: string, uploadedBy?: string) => {
    setNbfis(prev => prev.map(n => {
      if (n.id !== id || !n.documents) return n;
      const docs = n.documents.map(d => {
        if (d.id !== docId) return d;
        const updated = { ...d, status };
        if (status === 'submitted' && date) {
          updated.submittedDate = date;
          updated.submittedBy = uploadedBy || 'Unknown';
          updated.submissions = [
            { date, filename: `${d.name.replace(/\s+/g, '_')}_${date}.pdf`, uploadedBy: uploadedBy || 'Unknown' },
            ...(d.submissions || []),
          ];
        }
        return updated;
      });
      return { ...n, documents: docs };
    }));
  }, []);

  const setLoanBookMeta = useCallback((id: string, meta: LoanBookUploadMeta) => {
    setNbfis(prev => prev.map(n =>
      n.id === id ? { ...n, loanBookMeta: meta } : n
    ));
  }, []);

  const setTransactionType = useCallback((id: string, type: TransactionType) => {
    setNbfis(prev => prev.map(n => n.id === id ? { ...n, transactionType: type } : n));
  }, []);

  const setSecuritisationStructure = useCallback((id: string, structure: SecuritisationStructure) => {
    setNbfis(prev => prev.map(n => n.id === id ? { ...n, securitisationStructure: structure, transactionType: 'securitisation' } : n));
  }, []);

  return (
    <AppContext.Provider value={{
      user, nbfis, login, logout, addNBFI, deleteNBFI, updateNBFIStatus,
      loadFinancialData, updateFinancialValues,
      addCommentary, setRecommendation, setApproverComments, getNBFI,
      loanBookData, setLoanBookData, selectedPoolByNbfi, setPoolSelection, setTransactionType, setSecuritisationStructure,
      saveCovenantSetup, updateDocumentStatus, setLoanBookMeta,
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
