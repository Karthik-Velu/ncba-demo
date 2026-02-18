'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Download, MessageSquare, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { RevenueChart, MarginsChart, RatiosChart, AssetComposition, InsightFlags } from '@/components/FinancialCharts';

type OutputRow = {
  label: string;
  values: (number | string | null)[];
  pctChanges?: (number | string | null)[];
  isHeader?: boolean;
  isTotal?: boolean;
  indent?: number;
  key: string;
  format?: string;
};

type OutputSection = {
  title: string;
  rows: OutputRow[];
};

function formatVal(val: number | string | null, fmt?: string): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') return val;
  if (fmt === 'percent') return `${val.toFixed(2)}%`;
  if (fmt === 'ratio') return `${val.toFixed(2)}x`;
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function OutputTable({ section, periods, showPctChange = true }: { section: OutputSection; periods: string[]; showPctChange?: boolean }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-[#003366] mb-3">{section.title}</h3>
      <table className="w-full fin-table border border-gray-200 rounded-lg overflow-hidden">
        <thead>
          <tr>
            <th className="w-[35%]">Particulars</th>
            {periods.map((p, i) => (
              <th key={`v-${i}`} className="text-right">{p}</th>
            ))}
            {showPctChange && periods.length > 1 && <th className="text-right">% Ann. Chg</th>}
          </tr>
        </thead>
        <tbody>
          {section.rows.map(row => (
            <tr
              key={row.key}
              className={`${row.isHeader ? 'row-header' : ''} ${row.isTotal ? 'row-total' : ''}`}
            >
              <td style={{ paddingLeft: `${16 + (row.indent || 0) * 20}px` }}>{row.label}</td>
              {row.values.map((val, i) => (
                <td key={i} className={`text-right font-mono text-sm ${
                  typeof val === 'number' && val < 0 ? 'text-red-600' : ''
                }`}>
                  {formatVal(val, row.format)}
                </td>
              ))}
              {showPctChange && periods.length > 1 && (
                <td className={`text-right font-mono text-xs ${
                  row.pctChanges?.[0] !== null && row.pctChanges?.[0] !== undefined && typeof row.pctChanges[0] === 'number' && row.pctChanges[0] < 0
                    ? 'text-red-600' : 'text-green-700'
                }`}>
                  {row.pctChanges?.[0] !== null && row.pctChanges?.[0] !== undefined
                    ? `${typeof row.pctChanges[0] === 'number' ? (row.pctChanges[0] > 0 ? '+' : '') + row.pctChanges[0].toFixed(1) + '%' : row.pctChanges[0]}`
                    : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BCCSummaryTable({ rows, periods }: { rows: OutputRow[]; periods: string[] }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-[#003366] mb-3">BCC Summary</h3>
      <table className="w-full fin-table border border-gray-200 rounded-lg overflow-hidden">
        <thead>
          <tr>
            <th className="w-[40%]">Indicator (KES &apos;000)</th>
            {periods.map((p, i) => (
              <th key={i} className="text-right">{p}</th>
            ))}
            {periods.length > 1 && <th className="text-right">% Ann. Chg</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key}>
              <td className="font-medium">{row.label}</td>
              {row.values.map((val, i) => (
                <td key={i} className="text-right font-mono text-sm">
                  {formatVal(val, row.format)}
                </td>
              ))}
              {periods.length > 1 && (
                <td className={`text-right font-mono text-xs ${
                  row.pctChanges?.[0] !== null && typeof row.pctChanges?.[0] === 'number' && row.pctChanges[0] < 0 ? 'text-red-600' : 'text-green-700'
                }`}>
                  {row.pctChanges?.[0] !== null && row.pctChanges?.[0] !== undefined
                    ? `${typeof row.pctChanges[0] === 'number' ? (row.pctChanges[0] > 0 ? '+' : '') + row.pctChanges[0].toFixed(1) + '%' : '—'}`
                    : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OutputPage() {
  const { user, getNBFI } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'tables' | 'charts'>('tables');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);
  if (!user || !nbfi?.financialData) return null;

  const output = nbfi.financialData.nbfiOutput as {
    periods: { date: string }[];
    balanceSheet: OutputSection;
    incomeStatement: OutputSection;
    cashflowSummary: OutputSection;
    dscr: { title: string; cashflowFromOps: { rows: OutputRow[] }; loanRepayments: { rows: OutputRow[] }; dscrResult: (string | number | null)[] };
    bccSummary: OutputRow[];
  };

  const periodLabels = output.periods.map(p => {
    const d = new Date(p.date);
    return `FY ${d.getFullYear()}`;
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nbfi.financialData),
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nbfi.name.replace(/\s+/g, '_')}_Financial_Spreads.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
    setDownloading(false);
  };

  const chartData = {
    bccSummary: output.bccSummary,
    balanceSheet: output.balanceSheet.rows,
    periods: periodLabels,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">NBFI Output — {nbfi.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Financial analysis and key ratios</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004d99] text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Generating...' : 'Download Excel'}
            </button>
            <Link
              href={`/nbfi/${id}/review`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4" /> Commentary & Approval
            </Link>
            <Link
              href={`/nbfi/${id}/loan-book`}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#003366] text-[#003366] rounded-lg hover:bg-[#003366]/5 text-sm font-medium"
            >
              Next: Upload loan book & run EDA
            </Link>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tables' ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500'
            }`}
          >
            Financial Tables
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'charts' ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500'
            }`}
          >
            <BarChart3 className="w-3 h-3" /> Charts & Insights
          </button>
        </div>

        {activeTab === 'tables' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
            <OutputTable section={output.balanceSheet} periods={periodLabels} />
            <OutputTable section={output.incomeStatement} periods={periodLabels} />
            <OutputTable section={output.cashflowSummary} periods={periodLabels} showPctChange={false} />

            {/* DSCR */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-[#003366] mb-3">{output.dscr.title}</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Cashflow from Operations</p>
                  <table className="w-full fin-table border border-gray-200 rounded-lg overflow-hidden text-sm">
                    <tbody>
                      {output.dscr.cashflowFromOps.rows.map(row => (
                        <tr key={row.key} className={row.isTotal ? 'row-total' : ''}>
                          <td style={{ paddingLeft: `${12 + (row.indent || 0) * 16}px` }} className="text-xs">{row.label}</td>
                          <td className="text-right font-mono text-xs">{formatVal(row.values[0])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Loan Repayments</p>
                  <table className="w-full fin-table border border-gray-200 rounded-lg overflow-hidden text-sm">
                    <tbody>
                      {output.dscr.loanRepayments.rows.map(row => (
                        <tr key={row.key} className={`${row.isHeader ? 'row-header' : ''} ${row.isTotal ? 'row-total' : ''}`}>
                          <td style={{ paddingLeft: `${12 + (row.indent || 0) * 16}px` }} className="text-xs">{row.label}</td>
                          <td className="text-right font-mono text-xs">{row.isHeader ? '' : formatVal(row.values[0])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-bold text-[#003366]">DSCR: {output.dscr.dscrResult[0]}</p>
                  </div>
                </div>
              </div>
            </div>

            <BCCSummaryTable rows={output.bccSummary} periods={periodLabels} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <RevenueChart data={chartData} />
            <MarginsChart data={chartData} />
            <RatiosChart data={chartData} />
            <AssetComposition data={chartData} />
            <div className="col-span-2">
              <InsightFlags data={chartData} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
