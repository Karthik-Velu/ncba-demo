import type { LoanLevelRow } from './types';

// Deterministic seeded RNG (mulberry32)
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Geographies and their relative portfolio share (totals to 1.0)
const GEO_WEIGHTS: Array<[string, number]> = [
  ['Marathwada',          0.13],
  ['Bundelkhand',         0.09],
  ['Vidarbha',            0.11],
  ['North Bihar',         0.10],
  ['Sundarbans',          0.05],
  ['Coastal Odisha',      0.07],
  ['Coastal Andhra',      0.08],
  ['Rayalaseema',         0.06],
  ['Assam',               0.06],
  ['Punjab',              0.07],
  ['Western Maharashtra', 0.10],
  ['Karnataka Plateau',   0.08],
];

// Product mix with geographic affinity (some products skew rural, some urban)
const PRODUCT_WEIGHTS: Array<{ product: string; weight: number; ruralBias: number }> = [
  { product: 'E-2W',         weight: 0.16, ruralBias: 0.3 },  // urban-skewed
  { product: 'E-3W',         weight: 0.10, ruralBias: 0.2 },  // urban-skewed
  { product: 'EV',           weight: 0.04, ruralBias: 0.1 },  // very urban
  { product: 'Solar-Home',   weight: 0.09, ruralBias: 0.9 },  // rural-skewed
  { product: 'Solar-Pump',   weight: 0.07, ruralBias: 1.0 },  // fully rural
  { product: 'Agri-Finance', weight: 0.22, ruralBias: 1.0 },  // fully rural
  { product: 'MSME',         weight: 0.13, ruralBias: 0.4 },
  { product: 'SHG',          weight: 0.10, ruralBias: 0.8 },
  { product: 'Dairy',        weight: 0.06, ruralBias: 0.9 },
  { product: 'JLG',          weight: 0.03, ruralBias: 0.8 },
];

const URBAN_GEOS = new Set(['Western Maharashtra', 'Karnataka Plateau', 'Punjab', 'Coastal Andhra']);

// INR ticket size ranges per product (disbursed amount)
const TICKET_RANGES: Record<string, [number, number]> = {
  'E-2W':         [70_000,   140_000],
  'E-3W':         [150_000,  320_000],
  'EV':           [800_000, 1_400_000],
  'Solar-Home':   [15_000,    45_000],
  'Solar-Pump':   [120_000,  300_000],
  'Agri-Finance': [20_000,   120_000],
  'MSME':         [200_000, 1_500_000],
  'SHG':          [8_000,     45_000],
  'Dairy':        [50_000,   200_000],
  'JLG':          [12_000,    60_000],
};

const SEGMENTS_BY_PRODUCT: Record<string, string[]> = {
  'E-2W':         ['Individual', 'Enterprise'],
  'E-3W':         ['Individual', 'Enterprise'],
  'EV':           ['Enterprise'],
  'Solar-Home':   ['Individual', 'SHG'],
  'Solar-Pump':   ['Individual', 'JLG'],
  'Agri-Finance': ['Individual', 'JLG', 'SHG'],
  'MSME':         ['Enterprise', 'Individual'],
  'SHG':          ['SHG'],
  'Dairy':        ['Individual', 'SHG'],
  'JLG':          ['JLG'],
};

const FIRST_NAMES = [
  'Ramesh','Sita','Kavita','Mohan','Sunita','Anjali','Raj','Priya','Suresh','Lakshmi',
  'Vijay','Geeta','Arun','Meena','Deepak','Pooja','Rakesh','Anita','Ajay','Rekha',
];

function weightedPick<T>(items: Array<[T, number]>, rng: () => number): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [item, w] of items) { r -= w; if (r <= 0) return item; }
  return items[items.length - 1][0];
}

function pickProduct(geo: string, rng: () => number): string {
  const isUrban = URBAN_GEOS.has(geo);
  const weights: Array<[string, number]> = PRODUCT_WEIGHTS.map(p => {
    const adj = isUrban ? (1 - p.ruralBias) + 0.1 : p.ruralBias + 0.05;
    return [p.product, p.weight * (0.3 + adj)];
  });
  return weightedPick(weights, rng);
}

function pickDpd(geo: string, product: string, rng: () => number): number {
  // Higher DPD prevalence in high climate-risk geos and vulnerable products
  const highRisk = new Set(['Marathwada', 'Bundelkhand', 'Vidarbha', 'North Bihar', 'Sundarbans']);
  const baseStress = highRisk.has(geo) ? 0.22 : 0.10;
  const productMultiplier = product === 'Agri-Finance' ? 1.4 : product === 'MSME' ? 1.1 : 0.85;
  const stress = baseStress * productMultiplier;

  const r = rng();
  if (r < 1 - stress) return 0;
  if (r < 1 - stress * 0.4) return Math.floor(rng() * 30) + 1;
  if (r < 1 - stress * 0.15) return Math.floor(rng() * 30) + 31;
  if (r < 1 - stress * 0.05) return Math.floor(rng() * 30) + 61;
  return Math.floor(rng() * 90) + 91;
}

function randomMonthString(rng: () => number, daysAgoMax = 720): string {
  const now = new Date('2026-05-04');
  const daysAgo = Math.floor(rng() * daysAgoMax);
  const d = new Date(now.getTime() - daysAgo * 86400_000);
  return d.toISOString().slice(0, 10);
}

export function generateIndiaLoanBook(count = 4000, seed = 20260504): LoanLevelRow[] {
  const rng = makeRng(seed);
  const loans: LoanLevelRow[] = [];

  for (let i = 0; i < count; i++) {
    const geo = weightedPick(GEO_WEIGHTS, rng);
    const product = pickProduct(geo, rng);
    const segments = SEGMENTS_BY_PRODUCT[product] ?? ['Individual'];
    const segment = segments[Math.floor(rng() * segments.length)];
    const [tMin, tMax] = TICKET_RANGES[product] ?? [20_000, 80_000];
    const disbursed = Math.round(tMin + rng() * (tMax - tMin));
    const tenure = product === 'EV' || product === 'MSME'
      ? 36 + Math.floor(rng() * 24)
      : product === 'Agri-Finance' || product === 'SHG' || product === 'JLG'
      ? 6 + Math.floor(rng() * 12)
      : 18 + Math.floor(rng() * 18);
    const residual = Math.max(0, tenure - Math.floor(rng() * tenure));
    const currentBalance = Math.round(disbursed * (residual / tenure) * (0.85 + rng() * 0.15));
    const dpd = pickDpd(geo, product, rng);
    const overdue = dpd > 0 ? Math.round(currentBalance * (0.02 + rng() * 0.08)) : 0;
    const rate = product === 'EV' || product === 'MSME'
      ? 14 + rng() * 4
      : product === 'SHG' || product === 'JLG'
      ? 22 + rng() * 4
      : 18 + rng() * 4;
    const writtenOff = dpd > 180 && rng() < 0.3;

    loans.push({
      loanId: `IN-${(i + 1).toString().padStart(6, '0')}`,
      applicationId: `APP-${(i + 1).toString().padStart(6, '0')}`,
      dpdAsOfReportingDate: dpd,
      currentBalance: writtenOff ? 0 : currentBalance,
      loanDisbursedAmount: disbursed,
      totalOverdueAmount: overdue,
      loanDisbursedDate: randomMonthString(rng),
      interestRate: Math.round(rate * 10) / 10,
      loanWrittenOff: writtenOff,
      repossession: false,
      recoveryAfterWriteoff: 0,
      geography: geo,
      product,
      segment,
      borrowerName: FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)],
      residualTenureMonths: residual,
    });
  }

  return loans;
}
