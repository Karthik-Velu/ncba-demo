'use client';

import React from 'react';
import {
  CheckCircle2, AlertTriangle, ArrowRight, Database, FileSpreadsheet,
  BarChart3, Shield, Users, Zap, Clock, TrendingUp, RefreshCw,
  ChevronRight, Target, Layers, GitBranch, Award,
} from 'lucide-react';

export default function POCPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.55s ease forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
      `}</style>

      {/* ── 1. NAVIGATION ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">Kaleidofin</span>
              <span className="text-slate-400 text-xs ml-2 hidden sm:inline">Credit Intelligence Platform</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-500">
            <a href="#how-it-works" className="hover:text-teal-600 transition-colors">How It Works</a>
            <a href="#ki-score" className="hover:text-teal-600 transition-colors">ki score</a>
            <a href="#rationale" className="hover:text-teal-600 transition-colors">Why POC</a>
            <a href="#vision" className="hover:text-teal-600 transition-colors">Long-Term Vision</a>
          </div>
          {/* Confidential badge instead of CTA */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs px-3 py-1.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Confidential — For NCBA
          </div>
        </div>
      </nav>

      {/* ── 2. HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #0d9488 0%, transparent 60%), radial-gradient(circle at 80% 20%, #0ea5e9 0%, transparent 50%)' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="flex flex-wrap items-center gap-2 mb-6 fade-up">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Proof of Concept Proposal
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-slate-300 text-xs px-3 py-1.5 rounded-full">
              Prepared exclusively for NCBA Wholesale Lending
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-3xl mb-6 fade-up delay-1">
            Credit Intelligence for NBFI Wholesale Lending —<br />
            <span className="text-teal-400">From Raw Data to Decision in T+4 Business Days</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-10 fade-up delay-2">
            Kaleidofin automates the most time-consuming parts of NBFI credit assessment — loan tape analysis,
            financial spreading, MIS review, and cross-source validation — so your decision makers receive
            a concise, expert-reviewed note, not a stack of spreadsheets.
          </p>
          <div className="flex flex-wrap gap-3 fade-up delay-3">
            {[
              { icon: Clock, label: 'T+4 Days TAT' },
              { icon: Database, label: '3 Data Sources Triangulated' },
              { icon: Award, label: '1 ki score of Kaleidofin per Application' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm font-medium">
                <Icon className="w-4 h-4 text-teal-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. THE PROBLEM ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">The Problem Today</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">NBFI credit assessment is manual, slow, and inconsistent — creating risk for NCBA and delay for borrowers.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Today */}
          <div className="bg-white border border-red-100 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xs font-bold">✕</span>
              </div>
              <h3 className="font-semibold text-slate-700">Today — Manual Process</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              {[
                'Loan tape downloaded and analysed manually in Excel — weeks of analyst time',
                'Financial statements re-keyed from PDFs with no automated reconciliation',
                'MIS data reviewed in isolation — no cross-check against loan tape or financials',
                'Data quality issues (negative balances, sequence gaps) often missed',
                'Final credit note written from scratch each time — no structured framework',
                'TAT of 3–6 weeks or more from full data submission to decision',
              ].map(t => (
                <li key={t} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          {/* With Kaleidofin */}
          <div className="bg-white border border-teal-100 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-700">With Kaleidofin — Automated Intelligence</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              {[
                'Loan tape ingested via SFTP and analysed overnight — DPD buckets, vintage curves, roll rates, ECL',
                'Financial statements (audited or Perfios output) parsed and spread automatically',
                'MIS figures cross-validated against loan tape and financials — discrepancies flagged instantly',
                'Data quality checks run on every upload — 30+ validation rules across all data sources',
                'Expert-reviewed credit note in a consistent structured format — every time',
                'T+4 business days from full data submission to final decision note',
              ].map(t => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 4. HOW THE POC WORKS ────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">How the POC Works</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              For the POC, Kaleidofin will onboard <strong>one originator</strong>. A custom data mapping layer
              will be built specifically for the format(s) provided by that originator — ensuring the pipeline
              matches real-world data from day one.
            </p>
          </div>

          {/* Flow steps — flex row with arrows */}
          <div className="flex flex-col md:flex-row items-stretch gap-0">
            {[
              {
                step: '01',
                icon: Database,
                title: 'SFTP Data Drop',
                desc: 'Originator shares Loan Tape (12+ months), Financial Statements, and Monthly MIS via secure SFTP.',
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-700',
                iconColor: 'text-blue-500',
              },
              {
                step: '02',
                icon: GitBranch,
                title: 'Custom Format Mapping',
                desc: 'Kaleidofin builds a bespoke mapping layer for the originator\'s exact column names, date formats, and field conventions.',
                bg: 'bg-violet-50',
                border: 'border-violet-200',
                text: 'text-violet-700',
                iconColor: 'text-violet-500',
              },
              {
                step: '03',
                icon: Zap,
                title: 'Automated Analysis',
                desc: 'The Kaleidofin engine runs overnight — generating DPD analysis, vintage curves, ECL estimates, financial ratios, and cross-source validation.',
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                text: 'text-amber-700',
                iconColor: 'text-amber-500',
              },
              {
                step: '04',
                icon: Users,
                title: 'Expert Review',
                desc: 'A Kaleidofin analyst reviews all system-generated outputs, adds qualitative context, and prepares the final credit note.',
                bg: 'bg-teal-50',
                border: 'border-teal-200',
                text: 'text-teal-700',
                iconColor: 'text-teal-500',
              },
              {
                step: '05',
                icon: CheckCircle2,
                title: 'Final Note to NCBA',
                desc: 'NCBA decision makers receive a structured credit note with ki score, estimated loss, and deal structuring recommendations.',
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-700',
                iconColor: 'text-green-500',
              },
            ].map(({ step, icon: Icon, title, desc, bg, border, text, iconColor }, i) => (
              <React.Fragment key={step}>
                <div className={`flex-1 border rounded-xl p-5 ${bg} ${border} ${text}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                    <span className="text-xs font-bold opacity-50 tracking-wider">STEP {step}</span>
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{title}</h4>
                  <p className="text-xs opacity-75 leading-relaxed">{desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:flex items-center justify-center px-1 flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 text-center">
            <Clock className="w-4 h-4 inline-block mr-2 text-teal-600" />
            <strong>Committed TAT:</strong> T+4 business days from the date of complete data submission by the originator to final credit note delivered to NCBA.
          </div>
        </div>
      </section>

      {/* ── 5. THREE DATA SOURCES + TRIANGULATION ───────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Three Data Sources. One Unified Picture.</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Kaleidofin ingests and analyses three complementary data streams — and automatically triangulates
            them to surface any discrepancies before a decision is made.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Loan Tape */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Loan Tape</h3>
            <p className="text-xs text-teal-600 font-medium mb-3">12+ months performance data — required</p>
            <p className="text-sm text-slate-600 mb-4">
              Full loan-level snapshot covering at least 12 months of performance history.
              The single most important input — powers all quantitative credit analysis.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              {['DPD bucket distribution & PAR trends', 'Vintage analysis & cohort performance', 'Roll-rate (migration) matrix', 'ECL & estimated loss modelling', 'Write-off, recovery & repossession rates', 'Geography, product & segment breakdown'].map(i => (
                <li key={i} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-teal-500" />{i}</li>
              ))}
            </ul>
          </div>

          {/* Financial Statements */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Financial Statements</h3>
            <p className="text-xs text-violet-600 font-medium mb-3">Audited annual accounts — 2–3 years</p>
            <p className="text-sm text-slate-600 mb-4">
              Balance sheet, P&L, and cash flow statements spread automatically.
              No manual re-keying. Accepts audited accounts directly or via Perfios output.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              {['Leverage & capital adequacy ratios', 'Profitability & margin trends', 'Liquidity & coverage ratios', 'Balance sheet growth trajectory', 'Debt service capacity (DSCR)', 'Audit opinion & quality flags'].map(i => (
                <li key={i} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-violet-500" />{i}</li>
              ))}
            </ul>
          </div>

          {/* Monthly MIS */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Monthly MIS</h3>
            <p className="text-xs text-amber-600 font-medium mb-3">Management accounts — latest 6–12 months</p>
            <p className="text-sm text-slate-600 mb-4">
              Unaudited management accounts providing inter-period visibility between
              annual filings. Captures recent trajectory not visible in audited statements.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              {['Revenue & PBT trends (month-on-month)', 'Cost-to-income ratio', 'Gross loan book growth', 'Impairment charge trajectory', 'Cash & liquidity position', 'Headcount & branch footprint'].map(i => (
                <li key={i} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-amber-500" />{i}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Triangulation callout */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-semibold text-teal-800 mb-2">Automatic Cross-Source Validation</h4>
              <p className="text-sm text-teal-700 mb-3">
                The Kaleidofin engine triangulates all three data sources and automatically flags any discrepancies
                before analysis proceeds — ensuring the credit note is built on consistent, reconciled data.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  'MIS gross loan book vs. loan tape total balance (tolerance: ±2%)',
                  'Audited financials P&L vs. cumulative MIS figures',
                  'Write-off rates in loan tape vs. impairment charge in financials',
                ].map(c => (
                  <div key={c} className="bg-white rounded-lg p-3 text-xs text-teal-800 border border-teal-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 inline mr-1.5" />{c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. KI SCORE OF KALEIDOFIN ───────────────────────────────── */}
      <section id="ki-score" className="bg-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">The Output: ki score of Kaleidofin</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Every application culminates in one concise, expert-reviewed output. Decision makers at NCBA
              are not drowned in raw data — they receive a structured note that surfaces only what matters most.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Mock scorecard */}
            <div className="bg-white text-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Originator Assessment</p>
                  <h3 className="font-bold text-slate-800 text-lg">Premier Credit Kenya Ltd</h3>
                  <p className="text-xs text-slate-400">Assessment Date: March 2025 · Prepared by Kaleidofin</p>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  Conditional Approve
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                {/* Score gauge */}
                <div className="col-span-1 flex flex-col items-center">
                  <svg viewBox="0 0 90 90" className="w-20 h-20">
                    <circle cx="45" cy="45" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="45" cy="45" r="40"
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="251"
                      strokeDashoffset="68"
                      transform="rotate(-90 45 45)"
                    />
                    <text x="45" y="48" textAnchor="middle" style={{ fontSize: '14px', fontWeight: 700, fill: '#0f172a' }}>72</text>
                    <text x="45" y="60" textAnchor="middle" style={{ fontSize: '7px', fill: '#94a3b8' }}>/100</text>
                  </svg>
                  <p className="text-xs text-slate-500 mt-1 text-center font-medium">ki score of Kaleidofin</p>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Estimated Loss</p>
                    <p className="font-bold text-red-600 text-sm">KES 4.2M</p>
                    <p className="text-xs text-slate-400">3.8% of pool</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Pool Size</p>
                    <p className="font-bold text-slate-700 text-sm">KES 110M</p>
                    <p className="text-xs text-slate-400">520 loans</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">PAR 30</p>
                    <p className="font-bold text-slate-700 text-sm">6.2%</p>
                    <p className="text-xs text-slate-400">vs 8.4% sector</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Advance Rate</p>
                    <p className="font-bold text-teal-600 text-sm">72%</p>
                    <p className="text-xs text-slate-400">recommended</p>
                  </div>
                </div>
              </div>

              {/* Positives & Risks */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Key Positives</p>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {[
                      'PAR 30 below sector benchmark across all vintages',
                      '3 consecutive years of profitable operations',
                      'Write-off rate declining — 2.1% in latest period',
                    ].map(t => (
                      <li key={t} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Key Risks</p>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {[
                      'High leverage — debt/equity ratio 3.8x, above comfort threshold',
                      'Negative balance flag in 3 loans in latest tape — requires originator correction',
                    ].map(t => (
                      <li key={t} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Deal structuring */}
              <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 mb-3">
                <p className="text-xs font-semibold text-teal-700 mb-2">Deal Structuring Suggestions</p>
                <ul className="space-y-1 text-xs text-teal-700">
                  {[
                    'Advance rate: 72% (pool eligible after exclusions)',
                    'Covenant trigger: PAR 30 > 10% → cash diversion',
                    'Reporting frequency: monthly loan tape + quarterly financials',
                    'Recommend personal guarantee given leverage position',
                  ].map(t => (
                    <li key={t} className="flex items-start gap-1.5">
                      <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5" />{t}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-slate-400 italic text-center">
                Full analysis pack (EDA, vintage curves, waterfall model, data quality report) attached as annexure
              </p>
            </div>

            {/* What this means */}
            <div className="space-y-5">
              <div className="bg-slate-800 rounded-xl p-5">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-400" />
                  Concise, Not Overwhelming
                </h4>
                <p className="text-slate-400 text-sm">
                  The most important aspects of the analysis are surfaced front and centre.
                  NCBA decision makers receive a single-page credit note — not a 60-slide deck —
                  with key positives, key risks, and a clear recommendation. The full analytical
                  detail is available in the annexure for those who need it.
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-400" />
                  Expert-Reviewed, Every Time
                </h4>
                <p className="text-slate-400 text-sm">
                  The ki score of Kaleidofin is not a raw model output — it is reviewed and validated
                  by a Kaleidofin credit expert before being shared with NCBA. Human judgement overlays
                  system-generated analysis so the final note reflects both quantitative rigour and
                  qualitative context.
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  Structured for Decision Making
                </h4>
                <p className="text-slate-400 text-sm">
                  Each output includes a deal structuring recommendation — advance rate, covenant
                  triggers, reporting requirements — so NCBA's credit committee can act immediately
                  rather than cycling back for clarification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. WHY POC FIRST ────────────────────────────────────────── */}
      <section id="rationale" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Why Start with a POC?</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            A POC is the fastest and most cost-effective way to validate the two things that matter most —
            the quality of analysis and the improvement in TAT — before committing to a full platform rollout.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            {
              icon: Layers,
              title: 'The Intelligence is the Hard Part',
              body: 'The Kaleidofin engine — loan tape analytics, model calibration, data triangulation, and the structured credit note framework — is the core IP. A workflow UI can be built on top of this at any time. The POC focuses on proving the intelligence works first. Once NCBA has confidence in the quality of analysis, the UI layer is straightforward to add.',
              accent: 'border-t-4 border-t-teal-500',
            },
            {
              icon: CheckCircle2,
              title: 'Validate What Actually Matters',
              body: 'The two core promises of this partnership are: (1) better quality of analysis than today\'s manual process, and (2) a materially faster TAT. The POC tests exactly these two things — with real originator data — so NCBA can assess the proposition on its merits before any UI investment is required.',
              accent: 'border-t-4 border-t-blue-500',
            },
            {
              icon: Zap,
              title: 'Zero Disruption to Existing Processes',
              body: 'The POC uses existing SFTP infrastructure — no new systems required on NCBA\'s side. There is no integration work, no procurement process, and no internal change management. Kaleidofin handles the end-to-end setup for the pilot originator. NCBA simply receives the output.',
              accent: 'border-t-4 border-t-violet-500',
            },
          ].map(({ icon: Icon, title, body, accent }) => (
            <div key={title} className={`bg-white border border-slate-200 rounded-xl p-6 shadow-sm ${accent}`}>
              <Icon className="w-6 h-6 text-slate-400 mb-3" />
              <h4 className="font-semibold text-slate-800 mb-2">{title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
          <p>
            <strong>Key insight:</strong> The underlying intelligence — the Kaleidofin engine, data models, and analytical framework —
            is the complex and time-consuming part to build. The UI that manages workflow can be layered on top at any stage,
            since the hard work is already done. Starting with a POC lets NCBA validate the critical substance before investing in the surface.
          </p>
        </div>
      </section>

      {/* ── 8. PERFIOS INTEGRATION ──────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs px-3 py-1.5 rounded-full mb-4 font-medium">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Perfios Integration
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Works With Your Existing Perfios Workflow</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                NCBA already uses Perfios for financial statement spreading. Rather than creating two parallel
                analysis streams that produce separate outputs, Kaleidofin can build integration so that
                Perfios financial analysis and the Kaleidofin loan tape + MIS analysis feed into
                <strong> one combined, unified assessment</strong> — driving a single final decision.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                The result: a complete picture of the originator — balance sheet strength from Perfios,
                loan portfolio quality from Kaleidofin — triangulated and presented as one credit note.
                No duplicate workflows. No conflicting outputs.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">Combined Analysis Flow</h4>
              <div className="space-y-3">
                {[
                  { label: 'Perfios Financial Spreading', sub: 'Balance sheet, P&L, ratios — via existing NCBA workflow', color: 'bg-violet-100 text-violet-700' },
                  { label: '+  Kaleidofin Loan Tape Analysis', sub: '12+ months performance data — PAR, vintages, ECL', color: 'bg-blue-100 text-blue-700' },
                  { label: '+  MIS Cross-Validation', sub: 'Monthly management accounts reconciled across all sources', color: 'bg-amber-100 text-amber-700' },
                ].map(({ label, sub, color }) => (
                  <div key={label} className={`rounded-lg px-4 py-3 text-xs font-medium ${color}`}>
                    {label}
                    <div className="font-normal opacity-70 mt-0.5">{sub}</div>
                  </div>
                ))}
                <div className="flex items-center justify-center py-2">
                  <ArrowRight className="w-4 h-4 text-slate-300 rotate-90" />
                </div>
                <div className="bg-teal-600 text-white rounded-lg px-4 py-3 text-xs font-semibold text-center">
                  Single Unified Credit Note + ki score of Kaleidofin
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. LONG-TERM VISION ─────────────────────────────────────── */}
      <section id="vision" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Long-Term Vision — The Full Platform</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            The POC is not a throwaway exercise. Every format mapping, validation rule, and analytical
            output built during the pilot feeds directly into the full platform when NCBA is ready to scale.
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-slate-200 mx-16" />

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                phase: 'Now',
                label: 'POC',
                icon: Zap,
                color: 'bg-teal-600 text-white',
                borderColor: 'border-teal-200',
                items: [
                  'One pilot originator',
                  'SFTP data ingestion',
                  'Custom format mapping',
                  'Automated analysis overnight',
                  'Expert-reviewed credit note',
                  'T+4 business days TAT',
                ],
              },
              {
                phase: 'Phase 2',
                label: 'Workflow Platform',
                icon: Layers,
                color: 'bg-blue-600 text-white',
                borderColor: 'border-blue-200',
                items: [
                  'Full workflow UI for NCBA team',
                  'NBFI onboarding & document portal',
                  'Covenant monitoring dashboard',
                  'Pipeline management across originators',
                  'Automated early warning system',
                  'Audit trail & compliance logging',
                ],
              },
              {
                phase: 'Phase 3',
                label: 'Full Ecosystem',
                icon: TrendingUp,
                color: 'bg-violet-600 text-white',
                borderColor: 'border-violet-200',
                items: [
                  'NBFI self-service portal',
                  'Live securitisation structuring tools',
                  'Regulatory reporting automation',
                  'Multi-lender benchmarking',
                  'Investor reporting & disclosure portal',
                  'API integration with core banking',
                ],
              },
            ].map(({ phase, label, icon: Icon, color, borderColor, items }) => (
              <div key={phase} className={`bg-white border ${borderColor} rounded-xl overflow-hidden shadow-sm`}>
                <div className={`${color} px-5 py-4`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium opacity-80">{phase}</span>
                  </div>
                  <h3 className="font-bold text-base">{label}</h3>
                </div>
                <ul className="p-5 space-y-2">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Ongoing expert assistance */}
        <div className="mt-8 bg-slate-900 text-white rounded-2xl p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-lg">Ongoing Expert Assistance — Always</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                In the long term, Kaleidofin's model is not a black-box automation tool — it is a
                <strong className="text-white"> credit intelligence partnership</strong>. Every piece of
                system-generated analysis is reviewed by Kaleidofin credit experts before it is shared
                with NCBA decision makers.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                As the platform scales to more originators and more complex structures, Kaleidofin
                provides ongoing analytical expertise — ensuring quality remains consistent and
                NCBA always has a knowledgeable counterpart to engage with on any case.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { icon: Zap, label: 'Automated analysis runs first', sub: 'Kaleidofin engine processes all data sources' },
                { icon: Users, label: 'Expert review and quality check', sub: 'Kaleidofin credit analysts validate every output' },
                { icon: CheckCircle2, label: 'Approved note shared with NCBA', sub: 'Decision makers receive a quality-assured output' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                  <Icon className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. PROPOSED NEXT STEPS ─────────────────────────────────── */}
      <section id="next-steps" className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">Proposed Pilot Structure</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
              The POC requires minimal setup from NCBA. Kaleidofin handles the full ingestion and
              analysis pipeline for the pilot originator — NCBA nominates the originator and receives the output.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              {
                step: '01',
                title: 'Nominate a Pilot Originator',
                desc: 'NCBA selects one originator from the existing wholesale lending portfolio to participate in the pilot.',
              },
              {
                step: '02',
                title: 'Originator Shares Data via SFTP',
                desc: 'The originator provides loan tape (12+ months), audited financials, and monthly MIS via secure SFTP.',
              },
              {
                step: '03',
                title: 'Receive First ki score within T+4',
                desc: 'Kaleidofin delivers a complete, expert-reviewed credit note with ki score and deal structuring recommendations.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="text-teal-400 text-xs font-bold tracking-widest mb-3">STEP {step}</div>
                <h4 className="font-semibold text-white text-sm mb-2">{title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* What NCBA gets */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">What NCBA Can Expect from the POC</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: Clock, text: 'First credit note delivered within T+4 business days of complete data submission' },
                { icon: CheckCircle2, text: 'Structured ki score output with positives, risks, and deal structuring recommendations' },
                { icon: Shield, text: 'Every output reviewed by a Kaleidofin credit expert before delivery to NCBA' },
                { icon: Database, text: 'Full data quality report alongside the credit note — including any flags or discrepancies identified' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                  <Icon className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-500 py-8 text-center text-xs border-t border-slate-800">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">K</span>
          </div>
          <span className="text-slate-400 font-medium">Kaleidofin Credit Intelligence Platform</span>
        </div>
        <p className="text-slate-600">This document is prepared by Kaleidofin exclusively for NCBA and is strictly confidential. Not for distribution.</p>
      </footer>
    </div>
  );
}
