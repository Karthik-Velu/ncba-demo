'use client';

import { useMemo, useState } from 'react';
import { generateIndiaLoanBook } from '@/lib/mockIndiaLoanBook';
import ImpactDashboardIndia from '@/components/ImpactDashboardIndia';
import { Leaf, RefreshCw } from 'lucide-react';

export default function IndiaImpactPage() {
  const [seed, setSeed] = useState(20260504);
  const loans = useMemo(() => generateIndiaLoanBook(4000, seed), [seed]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Climate Impact Dashboard — India</h1>
              <p className="text-[11px] text-gray-500">Standalone preview · Paris-aligned · MDB/IDFC Common Principles</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400">Portfolio: {loans.length.toLocaleString()} loans</span>
            <button
              type="button"
              onClick={() => setSeed(s => s + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
              title="Regenerate with a new seed"
            >
              <RefreshCw className="w-3 h-3" /> Resample
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs text-gray-700 leading-relaxed">
            <strong className="text-emerald-700">India-localised view</strong> · Portfolio classified against MDB/IDFC Common Principles
            climate taxonomy. Early Warning System combines IMD Long Range Forecast, NRSC Bhuvan NDVI, NOAA CPC ENSO/IOD signals
            with live loan-level performance data. Climate-positive products include E-2W, E-3W (e-rickshaw), Solar Home Systems,
            and PM-KUSUM solar irrigation pumps. High climate-risk geographies cover Marathwada, Bundelkhand, Vidarbha (drought),
            North Bihar and Sundarbans (flood / cyclone).
          </p>
        </div>

        <ImpactDashboardIndia loans={loans} scope="portfolio" nbfiName="India Climate Portfolio" />

        <footer className="mt-12 pt-6 border-t border-gray-200 text-[10px] text-gray-400">
          <p>
            All figures are illustrative platform outputs. CO₂e factors per MDB Common Principles, IPCC AR6, CEA India Grid Factor (2023),
            MNRE PM-KUSUM evaluation. Climate forecast signals: IMD LRF, NRSC, NOAA CPC. Demographic proxies: 2X Women&apos;s Initiative,
            CGAP / IFC AIMM frameworks.
          </p>
        </footer>
      </main>
    </div>
  );
}
