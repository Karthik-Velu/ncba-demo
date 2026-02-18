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
  { id: 'seed-1', name: 'Apex Finance Limited', keyContacts: 'John Mwangi (CEO), Alice Wanjiku (CFO)', fundingAmount: 150000000, description: 'Established MFI operating in Central Kenya with focus on agricultural lending.', status: 'monitoring', dateOnboarded: '2024-08-15', loanCount: 520 },
  { id: 'seed-2', name: 'Horizon Microfinance', keyContacts: 'Peter Njoroge (MD)', fundingAmount: 200000000, description: 'Leading MFI in East Africa with nationwide branch network.', status: 'monitoring', dateOnboarded: '2024-11-01', loanCount: 410 },
  { id: 'seed-3', name: 'Savanna Womens Trust', keyContacts: 'Grace Muthoni (CEO), Jane Akinyi (CFO)', fundingAmount: 120000000, description: 'Focused on women-led enterprises across Kenya.', status: 'monitoring', dateOnboarded: '2024-09-20', loanCount: 380 },
  { id: 'seed-4', name: 'Crestline Credit', keyContacts: 'Samuel Karanja (CEO)', fundingAmount: 180000000, description: 'Consumer lending institution with payroll and check-off products.', status: 'monitoring', dateOnboarded: '2024-07-10', loanCount: 620 },
  { id: 'seed-5', name: 'Bridgepoint Microfinance', keyContacts: 'David Mutai (MD), Esther Korir (CFO)', fundingAmount: 90000000, description: 'Community-focused microfinance serving rural Kenya.', status: 'monitoring', dateOnboarded: '2025-01-15', loanCount: 280 },
  { id: 'seed-6', name: 'Uplift Microfinance', keyContacts: 'James Wahome (CEO)', fundingAmount: 75000000, description: 'Small-ticket lender targeting bodaboda and agri-finance segments.', status: 'monitoring', dateOnboarded: '2025-02-01', loanCount: 340 },
  { id: 'seed-7', name: 'Metro Microfinance', keyContacts: 'Patrick Ngethe (MD)', fundingAmount: 130000000, description: 'Urban-focused MFI with SME trade and personal loan products.', status: 'setup_complete', dateOnboarded: '2025-03-10', loanCount: 450 },
  { id: 'seed-8', name: 'Greenfield Microfinance', keyContacts: 'Mary Njeri (CEO), Michael Githinji (CFO)', fundingAmount: 110000000, description: 'Faith-based MFI serving SMEs and entrepreneurs in Western Kenya.', status: 'monitoring', dateOnboarded: '2024-10-05', loanCount: 310 },
  { id: 'seed-9', name: 'NovaPay Kenya', keyContacts: 'Tom Oduor (CEO)', fundingAmount: 160000000, description: 'Digital-first microfinance with mobile money disbursement.', status: 'monitoring', dateOnboarded: '2024-12-01', loanCount: 480 },
  { id: 'seed-10', name: 'PanAfrica Lending Group', keyContacts: 'Diana Kamau (MD)', fundingAmount: 250000000, description: 'Pan-African lending group with government and private sector check-off.', status: 'monitoring', dateOnboarded: '2024-06-20', loanCount: 550 },
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
  'seed-1': 'Apex Agri Tranche I',
  'seed-2': 'Horizon Facility A',
  'seed-2-t2': 'Horizon SACCO Line',
  'seed-3': 'SWT Women Enterprise',
  'seed-4': 'Crestline Check-off A',
  'seed-4-t2': 'Crestline Consumer B',
  'seed-4-t3': 'Crestline SME Tranche',
  'seed-5': 'Bridgepoint Rural Lending',
  'seed-6': 'Uplift Boda Fund',
  'seed-7': 'Metro Urban SME',
  'seed-8': 'Greenfield Enterprise Fund',
  'seed-9': 'NovaPay Digital Facility',
  'seed-9-t2': 'NovaPay Agri Mobile',
  'seed-10': 'PanAfrica Gov Check-off',
  'seed-10-t2': 'PanAfrica Private Sector',
  'seed-10-t3': 'PanAfrica Nano Loans',
};

const base = baseLoanBook as LoanLevelRow[];

type HealthProfile = { current: number; d1_30: number; d31_60: number; d61_90: number; d91_180: number; d180p: number };

const NBFI_HEALTH: Record<string, HealthProfile> = {
  'seed-1': { current: 0.71, d1_30: 0.13, d31_60: 0.07, d61_90: 0.04, d91_180: 0.03, d180p: 0.02 },
  'seed-2': { current: 0.74, d1_30: 0.12, d31_60: 0.06, d61_90: 0.03, d91_180: 0.03, d180p: 0.02 },
  'seed-3': { current: 0.78, d1_30: 0.10, d31_60: 0.05, d61_90: 0.03, d91_180: 0.02, d180p: 0.02 },
  'seed-4': { current: 0.68, d1_30: 0.14, d31_60: 0.08, d61_90: 0.04, d91_180: 0.03, d180p: 0.03 },
  'seed-5': { current: 0.76, d1_30: 0.11, d31_60: 0.06, d61_90: 0.03, d91_180: 0.02, d180p: 0.02 },
  'seed-6': { current: 0.65, d1_30: 0.15, d31_60: 0.08, d61_90: 0.05, d91_180: 0.04, d180p: 0.03 },
  'seed-7': { current: 0.73, d1_30: 0.12, d31_60: 0.06, d61_90: 0.04, d91_180: 0.03, d180p: 0.02 },
  'seed-8': { current: 0.77, d1_30: 0.10, d31_60: 0.05, d61_90: 0.03, d91_180: 0.03, d180p: 0.02 },
  'seed-9': { current: 0.72, d1_30: 0.13, d31_60: 0.06, d61_90: 0.04, d91_180: 0.03, d180p: 0.02 },
  'seed-10': { current: 0.70, d1_30: 0.13, d31_60: 0.07, d61_90: 0.04, d91_180: 0.03, d180p: 0.03 },
};

function assignDpd(rng: () => number, profile: HealthProfile): number {
  const r = rng();
  const { current, d1_30, d31_60, d61_90, d91_180 } = profile;
  if (r < current) return 0;
  if (r < current + d1_30) return 1 + Math.floor(rng() * 30);
  if (r < current + d1_30 + d31_60) return 31 + Math.floor(rng() * 30);
  if (r < current + d1_30 + d31_60 + d61_90) return 61 + Math.floor(rng() * 30);
  if (r < current + d1_30 + d31_60 + d61_90 + d91_180) return 91 + Math.floor(rng() * 90);
  return 181 + Math.floor(rng() * 180);
}

function generateLoanBook(txId: string, nbfiSeed: NBFISeed, trancheIdx: number): LoanLevelRow[] {
  const numericSeed = txId.split('').reduce((s, c) => s + c.charCodeAt(0), 0) + trancheIdx * 1000;
  const rng = seededRandom(numericSeed);
  const count = trancheIdx === 0 ? Math.min(nbfiSeed.loanCount, base.length) : Math.floor(nbfiSeed.loanCount * 0.4);
  const startIdx = Math.floor(rng() * (base.length - 20));
  const profile = NBFI_HEALTH[nbfiSeed.id] || NBFI_HEALTH['seed-1'];
  const rows: LoanLevelRow[] = [];

  for (let i = 0; i < count; i++) {
    const src = base[(startIdx + i) % base.length];
    const balMul = 0.7 + rng() * 0.8;
    const geoIdx = Math.floor(rng() * GEOGRAPHIES.length);
    const prodIdx = Math.floor(rng() * PRODUCTS.length);
    const segIdx = Math.floor(rng() * SEGMENTS.length);
    const dpd = assignDpd(rng, profile);
    const bal = Math.round(src.currentBalance * balMul * 100) / 100;
    const disbursed = Math.round(src.loanDisbursedAmount * balMul * 100) / 100;
    const overdue = dpd > 0 ? Math.round(bal * (dpd / 360) * 100) / 100 : 0;
    const rate = Math.round((12 + rng() * 12) * 100) / 100;
    const y = 2024 + Math.floor(rng() * 2);
    const m = 1 + Math.floor(rng() * 12);
    const d = 1 + Math.floor(rng() * 28);
    const written = rng() < (dpd > 180 ? 0.35 : dpd > 90 ? 0.06 : 0);
    const recov = written ? Math.round(bal * rng() * 0.25 * 100) / 100 : 0;
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
