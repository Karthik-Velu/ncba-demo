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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AppState {
  user: User | null;
  nbfis: NBFIRecord[];
  loading: boolean;
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

// ---------------------------------------------------------------------------
// Users (auth remains simple role selection — no passwords in this demo)
// ---------------------------------------------------------------------------
const USERS: Record<string, User> = {
  analyst:   { id: '1', name: 'Sarah Kimani',  role: 'analyst',   email: 'sarah.kimani@lender.co.ke' },
  approver:  { id: '2', name: 'James Ochieng', role: 'approver',  email: 'james.ochieng@lender.co.ke' },
  nbfi_user: { id: '3', name: 'Alice Wanjiku', role: 'nbfi_user', email: 'alice.wanjiku@apexfinance.co.ke', nbfiId: 'seed-1' },
};

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------
const LS_NBFIS     = 'wl-nbfis';
const LS_LOAN_BOOK = 'wl-loan-book';
const LS_POOL_SEL  = 'wl-pool-selections';
const LS_ROLE      = 'wl-user-role';

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Helper: fire-and-forget API call (best-effort; never blocks the UI)
// ---------------------------------------------------------------------------
function apiCall(url: string, method: string, body?: unknown): void {
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).catch(() => { /* API unavailable in serverless env — localStorage is authoritative */ });
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [nbfis, setNbfisState] = useState<NBFIRecord[]>([]);
  const [loanBookData, setLoanBookDataState] = useState<Record<string, LoanLevelRow[]>>({});
  const [selectedPoolByNbfi, setSelectedPoolByNbfiState] = useState<Record<string, PoolSelectionState>>({});
  const [loading, setLoading] = useState(true);

  // Wrapped setters that also sync localStorage
  const setNbfis = useCallback((updater: NBFIRecord[] | ((prev: NBFIRecord[]) => NBFIRecord[])) => {
    setNbfisState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      lsSet(LS_NBFIS, next);
      return next;
    });
  }, []);

  const setLoanBookData = useCallback((nbfiId: string, rows: LoanLevelRow[]) => {
    setLoanBookDataState((prev) => {
      const next = { ...prev, [nbfiId]: rows };
      lsSet(LS_LOAN_BOOK, next);
      return next;
    });
    apiCall(`/api/nbfis/${nbfiId}/loan-book`, 'POST', { rows });
  }, []);

  const setPoolSelectionState = useCallback((nbfiId: string, state: PoolSelectionState) => {
    setSelectedPoolByNbfiState((prev) => {
      const next = { ...prev, [nbfiId]: state };
      lsSet(LS_POOL_SEL, next);
      return next;
    });
  }, []);

  // -------------------------------------------------------------------------
  // Hydrate from localStorage on mount (works everywhere — Vercel, local)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const savedRole = localStorage.getItem(LS_ROLE) as 'analyst' | 'approver' | 'nbfi_user' | null;
    if (savedRole && USERS[savedRole]) setUser(USERS[savedRole]);

    const savedNbfis     = lsGet<NBFIRecord[]>(LS_NBFIS, []);
    const savedLoanBooks = lsGet<Record<string, LoanLevelRow[]>>(LS_LOAN_BOOK, {});
    const savedPools     = lsGet<Record<string, PoolSelectionState>>(LS_POOL_SEL, {});

    setNbfisState(savedNbfis);
    setLoanBookDataState(savedLoanBooks);
    setSelectedPoolByNbfiState(savedPools);
    setLoading(false);
  }, []);

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------
  const login = useCallback((role: 'analyst' | 'approver' | 'nbfi_user') => {
    const u = USERS[role];
    setUser(u);
    localStorage.setItem(LS_ROLE, role);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(LS_ROLE);
  }, []);

  // -------------------------------------------------------------------------
  // NBFI CRUD
  // -------------------------------------------------------------------------
  const addNBFI = useCallback((data: Omit<NBFIRecord, 'id' | 'status' | 'dateOnboarded' | 'financialData' | 'commentary'>) => {
    const id = uuidv4();
    const dateOnboarded = new Date().toISOString().split('T')[0];
    const record: NBFIRecord = { ...data, id, status: 'draft', dateOnboarded, commentary: [] };

    setNbfis((prev) => [...prev, record]);
    apiCall('/api/nbfis', 'POST', { ...data, userId: user?.id, userName: user?.name });

    return id;
  }, [user, setNbfis]);

  const deleteNBFI = useCallback((id: string) => {
    setNbfis((prev) => prev.filter((n) => n.id !== id));
    apiCall(`/api/nbfis/${id}`, 'DELETE');
  }, [setNbfis]);

  const updateNBFIStatus = useCallback((id: string, status: NBFIStatus) => {
    setNbfis((prev) => prev.map((n) => n.id === id ? { ...n, status } : n));
    apiCall(`/api/nbfis/${id}/status`, 'PATCH', {
      status, userId: user?.id || 'system', userName: user?.name || 'System',
    });
  }, [user, setNbfis]);

  // -------------------------------------------------------------------------
  // Financial data
  // -------------------------------------------------------------------------
  const loadFinancialData = useCallback((id: string) => {
    const financialData: FinancialData = {
      inputTemplate: inputTemplateData as never,
      nbfiOutput: nbfiOutputData as never,
      cashFlow: cashflowData as never,
    };
    setNbfis((prev) => prev.map((n) => n.id === id ? { ...n, financialData, status: 'spreading' } : n));
    apiCall(`/api/nbfis/${id}/financial-data`, 'POST', { financialData, userId: user?.id, userName: user?.name });
  }, [user, setNbfis]);

  const updateFinancialValues = useCallback((id: string, _section: string, key: string, periodIndex: number, value: number) => {
    setNbfis((prev) => prev.map((n) => {
      if (n.id !== id || !n.financialData) return n;
      const fd = JSON.parse(JSON.stringify(n.financialData));
      const searchSections = [
        fd.inputTemplate?.partA?.balanceSheet?.rows,
        fd.inputTemplate?.partA?.profitAndLoss?.rows,
        ...(fd.cashFlow?.sections?.map((s: { rows: unknown[] }) => s.rows) || []),
      ].filter(Boolean);

      for (const rows of searchSections) {
        const row = (rows as { key: string; values: (number | null)[] }[]).find((r) => r.key === key);
        if (row) { row.values[periodIndex] = value; break; }
      }
      return { ...n, financialData: fd };
    }));
  }, [setNbfis]);

  // -------------------------------------------------------------------------
  // Commentary
  // -------------------------------------------------------------------------
  const addCommentary = useCallback((id: string, text: string) => {
    if (!user) return;
    const entry: CommentaryEntry = {
      id: uuidv4(),
      author: user.name,
      role: user.role as 'analyst' | 'approver',
      text,
      timestamp: new Date().toISOString(),
    };
    setNbfis((prev) => prev.map((n) =>
      n.id === id ? { ...n, commentary: [...(n.commentary || []), entry] } : n
    ));
    apiCall(`/api/nbfis/${id}/commentary`, 'POST', { ...entry, userId: user.id });
  }, [user, setNbfis]);

  const setRecommendation = useCallback((id: string, text: string) => {
    setNbfis((prev) => prev.map((n) =>
      n.id === id ? { ...n, recommendation: text, status: 'pending_review' } : n
    ));
    apiCall(`/api/nbfis/${id}/status`, 'PATCH', {
      status: 'pending_review', recommendation: text,
      userId: user?.id, userName: user?.name, notes: 'Analyst submitted recommendation',
    });
  }, [user, setNbfis]);

  const setApproverComments = useCallback((id: string, text: string) => {
    setNbfis((prev) => prev.map((n) =>
      n.id === id ? { ...n, approverComments: text } : n
    ));
    apiCall(`/api/nbfis/${id}/status`, 'PATCH', {
      status: 'approved', approverComments: text,
      userId: user?.id, userName: user?.name, notes: 'Approver decision recorded',
    });
  }, [user, setNbfis]);

  const getNBFI = useCallback((id: string) => {
    return nbfis.find((n) => n.id === id);
  }, [nbfis]);

  // -------------------------------------------------------------------------
  // Loan book meta
  // -------------------------------------------------------------------------
  const setLoanBookMeta = useCallback((id: string, meta: LoanBookUploadMeta) => {
    setNbfis((prev) => prev.map((n) => n.id === id ? { ...n, loanBookMeta: meta } : n));
    apiCall(`/api/nbfis/${id}`, 'PATCH', { loanBookMeta: meta });
  }, [setNbfis]);

  // -------------------------------------------------------------------------
  // Pool selection
  // -------------------------------------------------------------------------
  const setPoolSelection = useCallback((nbfiId: string, state: PoolSelectionState) => {
    setPoolSelectionState(nbfiId, state);
    apiCall(`/api/nbfis/${nbfiId}/pool-selection`, 'PUT', { ...state, userId: user?.id, userName: user?.name });
  }, [user, setPoolSelectionState]);

  // -------------------------------------------------------------------------
  // Covenant setup
  // -------------------------------------------------------------------------
  const saveCovenantSetup = useCallback((
    id: string,
    covenants: CovenantDef[],
    documents: DocumentRequirement[],
    provisioningRules: { nbfi: ProvisioningRule[]; lender: ProvisioningRule[] }
  ) => {
    setNbfis((prev) => prev.map((n) =>
      n.id === id ? { ...n, covenants, documents, provisioningRules, setupCompleted: true, status: 'setup_complete' } : n
    ));
    apiCall(`/api/nbfis/${id}/covenant-setup`, 'PUT', {
      covenants, documents, provisioningRules, userId: user?.id, userName: user?.name,
    });
  }, [user, setNbfis]);

  // -------------------------------------------------------------------------
  // Document management
  // -------------------------------------------------------------------------
  const updateDocumentStatus = useCallback((
    id: string,
    docId: string,
    status: 'submitted' | 'pending' | 'overdue',
    date?: string,
    uploadedBy?: string
  ) => {
    setNbfis((prev) => prev.map((n) => {
      if (n.id !== id || !n.documents) return n;
      const docs = n.documents.map((d) => {
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
    apiCall(`/api/nbfis/${id}/documents/${docId}`, 'PATCH', {
      status, date, uploadedBy, userId: user?.id, userName: user?.name,
    });
  }, [user, setNbfis]);

  // -------------------------------------------------------------------------
  // Transaction type & securitisation
  // -------------------------------------------------------------------------
  const setTransactionType = useCallback((id: string, type: TransactionType) => {
    setNbfis((prev) => prev.map((n) => n.id === id ? { ...n, transactionType: type } : n));
    apiCall(`/api/nbfis/${id}`, 'PATCH', { transactionType: type });
  }, [setNbfis]);

  const setSecuritisationStructure = useCallback((id: string, structure: SecuritisationStructure) => {
    setNbfis((prev) => prev.map((n) =>
      n.id === id ? { ...n, securitisationStructure: structure, transactionType: 'securitisation' } : n
    ));
    apiCall(`/api/nbfis/${id}`, 'PATCH', { securitisationStructure: structure, transactionType: 'securitisation' });
  }, [setNbfis]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <AppContext.Provider value={{
      user, nbfis, loading, login, logout,
      addNBFI, deleteNBFI, updateNBFIStatus,
      loadFinancialData, updateFinancialValues,
      addCommentary, setRecommendation, setApproverComments, getNBFI,
      loanBookData, setLoanBookData,
      selectedPoolByNbfi, setPoolSelection,
      saveCovenantSetup, updateDocumentStatus, setLoanBookMeta,
      setTransactionType, setSecuritisationStructure,
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
