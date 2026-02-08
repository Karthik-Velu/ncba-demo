'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Check, Table2 } from 'lucide-react';
import Link from 'next/link';

type FinRow = {
  label: string;
  indent: number;
  isHeader: boolean;
  isTotal: boolean;
  isEditable: boolean;
  values: (number | null)[];
  key: string;
};

type FinSection = {
  title: string;
  rows: FinRow[];
};

function formatNum(val: number | null): string {
  if (val === null || val === undefined) return '';
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FinancialTable({
  section,
  periods,
  onEdit,
}: {
  section: { title: string; rows: FinRow[] };
  periods: string[];
  onEdit: (key: string, periodIdx: number, value: number) => void;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-[#003366] mb-3 flex items-center gap-2">
        <Table2 className="w-4 h-4" /> {section.title}
      </h3>
      <table className="w-full fin-table border border-gray-200 rounded-lg overflow-hidden">
        <thead>
          <tr>
            <th className="w-[45%]">Particulars</th>
            {periods.map(p => (
              <th key={p} className="text-right w-[22%]">{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows.map(row => (
            <tr
              key={row.key}
              className={`${row.isHeader ? 'row-header' : ''} ${row.isTotal ? 'row-total' : ''}`}
            >
              <td style={{ paddingLeft: `${16 + row.indent * 20}px` }}>
                {row.label}
              </td>
              {row.values.map((val, pIdx) => (
                <td key={pIdx} className="text-right">
                  {row.isEditable && val !== null ? (
                    <input
                      type="number"
                      className="editable-cell"
                      defaultValue={val ?? ''}
                      onBlur={e => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) onEdit(row.key, pIdx, v);
                      }}
                    />
                  ) : (
                    <span className={`font-mono text-sm ${row.isTotal ? 'font-bold' : ''} ${
                      val !== null && val < 0 ? 'text-red-600' : ''
                    }`}>
                      {formatNum(val)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InputPage() {
  const { user, getNBFI, updateFinancialValues, updateNBFIStatus } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'bs' | 'pl' | 'cf'>('bs');

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);
  if (!user || !nbfi?.financialData) return null;

  const fd = nbfi.financialData;
  const inputTemplate = fd.inputTemplate as {
    periods: { date: string }[];
    partA: { balanceSheet: FinSection; profitAndLoss: FinSection };
  };
  const cashFlow = fd.cashFlow as { periods: { date: string }[]; sections: FinSection[] };

  const periodLabels = inputTemplate.periods.map(p => {
    const d = new Date(p.date);
    return `FY ${d.getFullYear()}`;
  });

  const handleEdit = (key: string, periodIdx: number, value: number) => {
    updateFinancialValues(id, activeTab, key, periodIdx, value);
  };

  const handleConfirm = () => {
    updateNBFIStatus(id, 'pending_review');
    router.push(`/nbfi/${id}/output`);
  };

  const tabs = [
    { key: 'bs', label: 'Balance Sheet' },
    { key: 'pl', label: 'Profit & Loss' },
    { key: 'cf', label: 'Cash Flow' },
  ] as const;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Financial Spreading</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and edit auto-extracted data for <span className="font-medium text-gray-700">{nbfi.name}</span>
            </p>
          </div>
          <button
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Check className="w-4 h-4" /> Confirm Input
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'bg-white text-[#003366] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
          {activeTab === 'bs' && (
            <FinancialTable
              section={inputTemplate.partA.balanceSheet}
              periods={periodLabels}
              onEdit={handleEdit}
            />
          )}
          {activeTab === 'pl' && (
            <FinancialTable
              section={inputTemplate.partA.profitAndLoss}
              periods={periodLabels}
              onEdit={handleEdit}
            />
          )}
          {activeTab === 'cf' && (
            <>
              {cashFlow.sections.map((section, i) => (
                <FinancialTable
                  key={i}
                  section={section}
                  periods={periodLabels}
                  onEdit={handleEdit}
                />
              ))}
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Check className="w-4 h-4" /> Confirm Input & Generate Output
          </button>
        </div>
      </main>
    </div>
  );
}
