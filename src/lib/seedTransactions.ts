import type { LoanLevelRow } from './types';
import baseLoanBook from '../../data/mock-loan-book.json';

const GEOGRAPHIES = ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu', 'Eldoret', 'Nyeri', 'Thika', 'Machakos', 'Malindi', 'Kitale'];
const PRODUCTS = ['Boda-Boda', 'Agri-Finance', 'Check-off', 'SACCO', 'MSME', 'Personal', 'SME Trade'];
const SEGMENTS = ['Individual', 'Retail', 'MSME', 'Corporate'];
const FIRST_NAMES = ['John', 'Mary', 'Peter', 'Jane', 'James', 'Grace', 'David', 'Esther', 'Samuel', 'Wanjiku', 'Mwangi', 'Akinyi', 'Otieno', 'Nyambura', 'Kimani', 'Chebet', 'Kipchoge', 'Njeri', 'Oduor', 'Wambui'];
const LAST_NAMES = ['Mwangi', 'Ochieng', 'Kimani', 'Njoroge', 'Wanjiku', 'Otieno', 'Akinyi', 'Chebet', 'Mutai', 'Korir', 'Ngethe', 'Wahome', 'Karanja', 'Githinji', 'Kamau'];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface NBFISeed {
  id: string;
  name: string;
  keyContacts: string;
  fundingAmount: number;
  description: string;
  status: string;
  dateOnboarded: string;
  loanCount: number;
}

export const NBFI_SEEDS: NBFISeed[] = [
  { id: 'seed-1', name: 'Premier Credit Limited', keyContacts: 'John Mwangi (CEO), Alice Wanjiku (CFO)', fundingAmount: 150000000, description: 'Established MFI operating in Central Kenya with focus on agricultural lending.', status: 'monitoring', dateOnboarded: '2024-08-15', loanCount: 520 },
  { id: 'seed-2', name: 'Faulu Microfinance', keyContacts: 'Peter Njoroge (MD)', fundingAmount: 200000000, description: 'Leading MFI in East Africa with nationwide branch network.', status: 'monitoring', dateOnboarded: '2024-11-01', loanCount: 410 },
  { id: 'seed-3', name: 'Kenya Women Finance Trust', keyContacts: 'Grace Muthoni (CEO), Jane Akinyi (CFO)', fundingAmount: 120000000, description: 'Focused on women-led enterprises across Kenya.', status: 'monitoring', dateOnboarded: '2024-09-20', loanCount: 380 },
  { id: 'seed-4', name: 'Platinum Credit', keyContacts: 'Samuel Karanja (CEO)', fundingAmount: 180000000, description: 'Consumer lending institution with payroll and check-off products.', status: 'monitoring', dateOnboarded: '2024-07-10', loanCount: 620 },
  { id: 'seed-5', name: 'Rafiki Microfinance', keyContacts: 'David Mutai (MD), Esther Korir (CFO)', fundingAmount: 90000000, description: 'Community-focused microfinance serving rural Kenya.', status: 'monitoring', dateOnboarded: '2025-01-15', loanCount: 280 },
  { id: 'seed-6', name: 'Uwezo Microfinance', keyContacts: 'James Wahome (CEO)', fundingAmount: 75000000, description: 'Small-ticket lender targeting bodaboda and agri-finance segments.', status: 'monitoring', dateOnboarded: '2025-02-01', loanCount: 340 },
  { id: 'seed-7', name: 'Century Microfinance', keyContacts: 'Patrick Ngethe (MD)', fundingAmount: 130000000, description: 'Urban-focused MFI with SME trade and personal loan products.', status: 'setup_complete', dateOnboarded: '2025-03-10', loanCount: 450 },
  { id: 'seed-8', name: 'SMEP Microfinance', keyContacts: 'Mary Njeri (CEO), Michael Githinji (CFO)', fundingAmount: 110000000, description: 'Faith-based MFI serving SMEs and entrepreneurs in Western Kenya.', status: 'monitoring', dateOnboarded: '2024-10-05', loanCount: 310 },
  { id: 'seed-9', name: 'Musoni Kenya', keyContacts: 'Tom Oduor (CEO)', fundingAmount: 160000000, description: 'Digital-first microfinance with mobile money disbursement.', status: 'monitoring', dateOnboarded: '2024-12-01', loanCount: 480 },
  { id: 'seed-10', name: 'Letshego Kenya', keyContacts: 'Diana Kamau (MD)', fundingAmount: 250000000, description: 'Pan-African lending group with government and private sector check-off.', status: 'monitoring', dateOnboarded: '2024-06-20', loanCount: 550 },
];

export const TRANSACTION_MAP: Record<string, string[]> = {
  'seed-1': ['seed-1'],
  'seed-2': ['seed-2', 'seed-2-t2'],
  'seed-3': ['seed-3'],
  'seed-4': ['seed-4', 'seed-4-t2', 'seed-4-t3'],
  'seed-5': ['seed-5'],
  'seed-6': ['seed-6'],
  'seed-7': ['seed-7'],
  'seed-8': ['seed-8'],
  'seed-9': ['seed-9', 'seed-9-t2'],
  'seed-10': ['seed-10', 'seed-10-t2', 'seed-10-t3'],
};

export const TRANSACTION_NAMES: Record<string, string> = {
  'seed-1': 'PCL Agri Tranche I',
  'seed-2': 'Faulu Facility A',
  'seed-2-t2': 'Faulu SACCO Line',
  'seed-3': 'KWFT Women Enterprise',
  'seed-4': 'Platinum Check-off A',
  'seed-4-t2': 'Platinum Consumer B',
  'seed-4-t3': 'Platinum SME Tranche',
  'seed-5': 'Rafiki Rural Lending',
  'seed-6': 'Uwezo Boda Fund',
  'seed-7': 'Century Urban SME',
  'seed-8': 'SMEP Enterprise Fund',
  'seed-9': 'Musoni Digital Facility',
  'seed-9-t2': 'Musoni Agri Mobile',
  'seed-10': 'Letshego Gov Check-off',
  'seed-10-t2': 'Letshego Private Sector',
  'seed-10-t3': 'Letshego Nano Loans',
};

const base = baseLoanBook as LoanLevelRow[];

function generateLoanBook(txId: string, nbfiSeed: NBFISeed, trancheIdx: number): LoanLevelRow[] {
  const numericSeed = txId.split('').reduce((s, c) => s + c.charCodeAt(0), 0) + trancheIdx * 1000;
  const rng = seededRandom(numericSeed);
  const count = trancheIdx === 0 ? Math.min(nbfiSeed.loanCount, base.length) : Math.floor(nbfiSeed.loanCount * 0.4);
  const startIdx = Math.floor(rng() * (base.length - 20));
  const rows: LoanLevelRow[] = [];

  for (let i = 0; i < count; i++) {
    const src = base[(startIdx + i) % base.length];
    const dpdShift = Math.floor(rng() * 30) - 10;
    const balMul = 0.7 + rng() * 0.8;
    const geoIdx = Math.floor(rng() * GEOGRAPHIES.length);
    const prodIdx = Math.floor(rng() * PRODUCTS.length);
    const segIdx = Math.floor(rng() * SEGMENTS.length);
    const dpd = Math.max(0, src.dpdAsOfReportingDate + dpdShift);
    const bal = Math.round(src.currentBalance * balMul * 100) / 100;
    const disbursed = Math.round(src.loanDisbursedAmount * balMul * 100) / 100;
    const overdue = dpd > 0 ? Math.round(bal * (dpd / 360) * 100) / 100 : 0;
    const rate = Math.round((12 + rng() * 12) * 100) / 100;
    const y = 2024 + Math.floor(rng() * 2);
    const m = 1 + Math.floor(rng() * 12);
    const d = 1 + Math.floor(rng() * 28);
    const written = rng() < (dpd > 180 ? 0.4 : dpd > 90 ? 0.08 : 0.01);
    const recov = written ? Math.round(bal * rng() * 0.3 * 100) / 100 : 0;
    rows.push({
      loanId: `${txId.toUpperCase().replace(/-/g, '')}-L${(i + 1).toString().padStart(4, '0')}`,
      applicationId: `APP-${txId.toUpperCase().replace(/-/g, '')}-${(i + 1).toString().padStart(4, '0')}`,
      dpdAsOfReportingDate: dpd,
      currentBalance: bal,
      loanDisbursedAmount: disbursed,
      totalOverdueAmount: overdue,
      loanDisbursedDate: `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`,
      interestRate: rate,
      loanWrittenOff: written,
      repossession: written && rng() < 0.3,
      recoveryAfterWriteoff: recov,
      geography: rng() < 0.6 ? (src.geography || GEOGRAPHIES[geoIdx]) : GEOGRAPHIES[geoIdx],
      product: rng() < 0.5 ? (src.product || PRODUCTS[prodIdx]) : PRODUCTS[prodIdx],
      segment: rng() < 0.5 ? (src.segment || SEGMENTS[segIdx]) : SEGMENTS[segIdx],
      borrowerName: `${FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]}`,
      residualTenureMonths: Math.floor(rng() * 36) + 3,
    });
  }
  return rows;
}

let _cache: Record<string, LoanLevelRow[]> | null = null;

export function getAllSeedLoanBooks(): Record<string, LoanLevelRow[]> {
  if (_cache) return _cache;
  const result: Record<string, LoanLevelRow[]> = {};
  result['seed-1'] = base;
  for (const nbfi of NBFI_SEEDS) {
    const txs = TRANSACTION_MAP[nbfi.id] || [nbfi.id];
    txs.forEach((txId, idx) => {
      if (txId === 'seed-1') return;
      result[txId] = generateLoanBook(txId, nbfi, idx);
    });
  }
  _cache = result;
  return result;
}

export function getNbfiIdForTransaction(txId: string): string {
  for (const [nbfiId, txs] of Object.entries(TRANSACTION_MAP)) {
    if (txs.includes(txId)) return nbfiId;
  }
  return txId;
}

export function getTotalTransactionCount(): number {
  return Object.values(TRANSACTION_MAP).reduce((s, txs) => s + txs.length, 0);
}
