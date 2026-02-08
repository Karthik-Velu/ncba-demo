'use client';

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#003366', '#0066cc', '#3399ff', '#66b2ff', '#99ccff', '#cce5ff'];
const WARN_COLORS = ['#dc2626', '#ea580c', '#d97706', '#16a34a', '#0284c7'];

interface ChartData {
  bccSummary: { label: string; values: (number | string | null)[]; key: string; format?: string }[];
  balanceSheet: { label: string; values: (number | string | null)[]; isTotal?: boolean; isHeader?: boolean; key: string }[];
  periods: string[];
}

function getVal(v: number | string | null): number {
  if (typeof v === 'number') return v;
  return 0;
}

export function RevenueChart({ data }: { data: ChartData }) {
  const revenue = data.bccSummary.find(r => r.key === 'bcc_revenue');
  const grossProfit = data.bccSummary.find(r => r.key === 'bcc_gross_profit');
  const npbt = data.bccSummary.find(r => r.key === 'bcc_npbt');

  const chartData = data.periods.map((p, i) => ({
    period: p,
    Revenue: getVal(revenue?.values[i] ?? 0),
    'Gross Profit': getVal(grossProfit?.values[i] ?? 0),
    NPBT: getVal(npbt?.values[i] ?? 0),
  })).reverse();

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <h3 className="text-sm font-bold text-gray-700 mb-4">Revenue & Profitability (KES &apos;000)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Revenue" fill="#003366" radius={[4,4,0,0]} />
          <Bar dataKey="Gross Profit" fill="#0066cc" radius={[4,4,0,0]} />
          <Bar dataKey="NPBT" fill="#66b2ff" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MarginsChart({ data }: { data: ChartData }) {
  const gpm = data.bccSummary.find(r => r.key === 'bcc_gpm');
  const npbtM = data.bccSummary.find(r => r.key === 'bcc_npbt_margin');

  const chartData = data.periods.map((p, i) => ({
    period: p,
    'Gross Margin %': getVal(gpm?.values[i] ?? 0),
    'NPBT Margin %': getVal(npbtM?.values[i] ?? 0),
  })).reverse();

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <h3 className="text-sm font-bold text-gray-700 mb-4">Profitability Margins (%)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="Gross Margin %" stroke="#003366" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="NPBT Margin %" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RatiosChart({ data }: { data: ChartData }) {
  const gearing = data.bccSummary.find(r => r.key === 'bcc_gearing');
  const leverage = data.bccSummary.find(r => r.key === 'bcc_leverage');
  const currentRatio = data.bccSummary.find(r => r.key === 'bcc_current_ratio');
  const interestCover = data.bccSummary.find(r => r.key === 'bcc_interest_cover');

  const chartData = [
    { name: 'Gearing (x)', value: getVal(gearing?.values[0] ?? 0), threshold: 3.0 },
    { name: 'Leverage (x)', value: getVal(leverage?.values[0] ?? 0), threshold: 4.0 },
    { name: 'Current Ratio', value: getVal(currentRatio?.values[0] ?? 0), threshold: 1.5 },
    { name: 'Interest Cover (x)', value: getVal(interestCover?.values[0] ?? 0), threshold: 1.5 },
  ];

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <h3 className="text-sm font-bold text-gray-700 mb-4">Key Financial Ratios</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} />
          <Tooltip />
          <Bar dataKey="value" radius={[0,4,4,0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={
                entry.name === 'Current Ratio' || entry.name === 'Interest Cover (x)'
                  ? entry.value < entry.threshold ? '#dc2626' : '#16a34a'
                  : entry.value > entry.threshold ? '#dc2626' : '#16a34a'
              } />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AssetComposition({ data }: { data: ChartData }) {
  const assetRows = data.balanceSheet.filter(r =>
    !r.isHeader && !r.isTotal && r.values[0] !== null && typeof r.values[0] === 'number' && r.values[0] > 0 &&
    ['cash_bal', 'investments', 'loans_advances', 'related_co', 'other_recv', 'ppe', 'dta'].includes(r.key)
  );

  const chartData = assetRows.map(r => ({
    name: r.label,
    value: Math.abs(getVal(r.values[0])),
  }));

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <h3 className="text-sm font-bold text-gray-700 mb-4">Asset Composition</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={(props: any) => `${(props.name || '').split(' ')[0]} ${((props.percent || 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InsightFlags({ data }: { data: ChartData }) {
  const insights: { text: string; severity: 'red' | 'amber' | 'green' }[] = [];

  const getLatestVal = (key: string) => {
    const row = data.bccSummary.find(r => r.key === key);
    return row ? getVal(row.values[0] ?? 0) : 0;
  };

  const gearing = getLatestVal('bcc_gearing');
  const interestCover = getLatestVal('bcc_interest_cover');
  const currentRatio = getLatestVal('bcc_current_ratio');
  const leverage = getLatestVal('bcc_leverage');
  const gpm = getLatestVal('bcc_gpm');
  const revGrowth = getLatestVal('bcc_rev_growth');

  if (gearing > 4) insights.push({ text: `Gearing at ${gearing.toFixed(1)}x — critically elevated`, severity: 'red' });
  else if (gearing > 3) insights.push({ text: `Gearing at ${gearing.toFixed(1)}x — elevated, monitor closely`, severity: 'amber' });
  else insights.push({ text: `Gearing at ${gearing.toFixed(1)}x — within acceptable range`, severity: 'green' });

  if (interestCover < 1) insights.push({ text: `Interest Cover at ${interestCover.toFixed(2)}x — below 1x, warning`, severity: 'red' });
  else if (interestCover < 1.5) insights.push({ text: `Interest Cover at ${interestCover.toFixed(2)}x — adequate but tight`, severity: 'amber' });
  else insights.push({ text: `Interest Cover at ${interestCover.toFixed(2)}x — comfortable`, severity: 'green' });

  if (currentRatio < 1) insights.push({ text: `Current Ratio at ${currentRatio.toFixed(2)}x — liquidity risk`, severity: 'red' });
  else if (currentRatio < 1.3) insights.push({ text: `Current Ratio at ${currentRatio.toFixed(2)}x — adequate but tight`, severity: 'amber' });
  else insights.push({ text: `Current Ratio at ${currentRatio.toFixed(2)}x — healthy`, severity: 'green' });

  if (leverage > 4) insights.push({ text: `Leverage at ${leverage.toFixed(1)}x — high`, severity: 'red' });
  else insights.push({ text: `Leverage at ${leverage.toFixed(1)}x — acceptable`, severity: 'green' });

  if (revGrowth > 15) insights.push({ text: `Revenue growth at ${revGrowth.toFixed(1)}% — strong momentum`, severity: 'green' });
  else if (revGrowth > 0) insights.push({ text: `Revenue growth at ${revGrowth.toFixed(1)}% — moderate`, severity: 'amber' });

  const colors = { red: 'bg-red-50 border-red-200 text-red-700', amber: 'bg-amber-50 border-amber-200 text-amber-700', green: 'bg-green-50 border-green-200 text-green-700' };
  const dots = { red: 'bg-red-500', amber: 'bg-amber-500', green: 'bg-green-500' };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <h3 className="text-sm font-bold text-gray-700 mb-4">Automated Insights & Flags</h3>
      <div className="space-y-2">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs ${colors[ins.severity]}`}>
            <div className={`w-2 h-2 rounded-full ${dots[ins.severity]}`} />
            {ins.text}
          </div>
        ))}
      </div>
    </div>
  );
}
