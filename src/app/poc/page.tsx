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
            <a href="#vision" className="hover:text-teal-600 transition-colors">What&apos;s Next</a>
          </div>
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
            a concise, expert-reviewed credit note, not a stack of spreadsheets.
          </p>
          <div className="flex flex-wrap gap-3 mb-12 fade-up delay-3">
            {[
              { icon: Clock, label: 'T+4 Days TAT' },
              { icon: Database, label: '3 Data Sources Triangulated' },
              { icon: Award, label: '1 ki score per Application' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm font-medium">
                <Icon className="w-4 h-4 text-teal-400" />
                {label}
              </div>
            ))}
          </div>

          {/* ── Pilot steps inline in hero ── */}
          <div className="fade-up delay-4 border-t border-white/10 pt-8">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-4">Starting the pilot is straightforward</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { step: '01', title: 'Nominate a pilot originator', desc: 'NCBA selects one originator from its existing wholesale lending portfolio.' },
                { step: '02', title: 'Originator shares data via SFTP', desc: 'Loan tape (12+ months), audited financials, and monthly MIS — no new systems required on NCBA\'s side.' },
                { step: '03', title: 'Receive the first ki score within T+4', desc: 'A complete, expert-reviewed credit note with ki score and deal structuring recommendations.' },
              ].map(({ step, title, desc }, i) => (
                <React.Fragment key={step}>
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-teal-400 text-xs font-bold tracking-widest mb-2">STEP {step}</div>
                    <h4 className="font-semibold text-white text-sm mb-1">{title}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                  </div>
                  {i < 2 && <div className="hidden sm:flex items-center flex-shrink-0"><ArrowRight className="w-4 h-4 text-slate-600" /></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. VALUE PROPOSITION ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">What Kaleidofin Delivers</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">From raw loan tape to a decision-ready credit note — automated, validated, and expert-reviewed.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: Database,
              color: 'bg-blue-50 border-blue-100',
              iconColor: 'text-blue-600 bg-blue-100',
              title: 'Loan Tape Analytics',
              body: 'DPD buckets, vintage curves, roll rates, and ECL estimated automatically — overnight — from 12+ months of loan-level data.',
            },
            {
              icon: FileSpreadsheet,
              color: 'bg-violet-50 border-violet-100',
              iconColor: 'text-violet-600 bg-violet-100',
              title: 'Automated Financial Spreading',
              body: 'Balance sheet, P&L, and cash flow spread from audited financials with CAMEL-framework analysis — no manual re-keying.',
            },
            {
              icon: RefreshCw,
              color: 'bg-amber-50 border-amber-100',
              iconColor: 'text-amber-600 bg-amber-100',
              title: 'Cross-Source Validation',
              body: 'Loan tape, financials, and MIS are triangulated automatically — discrepancies flagged before any credit decision is made.',
            },
            {
              icon: Users,
              color: 'bg-teal-50 border-teal-100',
              iconColor: 'text-teal-600 bg-teal-100',
              title: 'Expert-Reviewed Credit Note',
              body: 'Every output is reviewed by a Kaleidofin credit analyst before delivery to NCBA — structured for immediate decision.',
            },
          ].map(({ icon: Icon, color, iconColor, title, body }) => (
            <div key={title} className={`rounded-xl border p-5 ${color}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm mb-2">{title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. HOW THE POC WORKS ────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">How the POC Works</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              For the POC, Kaleidofin will onboard <strong>one originator</strong> and build a custom data mapping
              layer for that originator&apos;s exact formats — ensuring the pipeline matches real-world data from day one.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-0">
            {[
              {
                step: '01', icon: Database, title: 'SFTP Data Drop',
                desc: 'Originator shares Loan Tape (12+ months), Financial Statements, and Monthly MIS via secure SFTP.',
                bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconColor: 'text-blue-500',
              },
              {
                step: '02', icon: GitBranch, title: 'Custom Format Mapping',
                desc: 'Kaleidofin builds a bespoke mapping layer for the originator\'s exact column names, date formats, and field conventions.',
                bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', iconColor: 'text-violet-500',
              },
              {
                step: '03', icon: Zap, title: 'Automated Analysis',
                desc: 'The engine runs overnight — generating DPD analysis, vintage curves, ECL estimates, CAMEL-based financial ratios, and cross-source validation.',
                bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconColor: 'text-amber-500',
              },
              {
                step: '04', icon: Users, title: 'Expert Review',
                desc: 'A Kaleidofin analyst reviews all outputs, adds qualitative context, and prepares the final credit note.',
                bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', iconColor: 'text-teal-500',
              },
              {
                step: '05', icon: CheckCircle2, title: 'Final Note to NCBA',
                desc: 'NCBA receives a structured credit note with ki score, estimated loss, and deal structuring recommendations.',
                bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', iconColor: 'text-green-500',
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
            <strong>Committed TAT:</strong> T+4 business days from complete data submission to final credit note delivered to NCBA.
          </div>
        </div>
      </section>

      {/* ── 5. THREE DATA SOURCES ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Three Data Sources. One Unified Picture.</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Kaleidofin ingests three complementary data streams and triangulates them automatically —
            surfacing any discrepancies before a decision is made.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Loan Tape</h3>
            <p className="text-xs text-teal-600 font-medium mb-3">12+ months performance data — required</p>
            <p className="text-sm text-slate-600 mb-4">
              Full loan-level snapshot powering all quantitative credit analysis.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              {['DPD bucket distribution & PAR trends', 'Vintage analysis & cohort performance', 'Roll-rate (migration) matrix', 'ECL & estimated loss modelling', 'Write-off, recovery & repossession rates', 'Geography, product & segment breakdown'].map(i => (
                <li key={i} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-teal-500" />{i}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Financial Statements</h3>
            <p className="text-xs text-violet-600 font-medium mb-3">Audited annual accounts — 2–3 years</p>
            <p className="text-sm text-slate-600 mb-4">
              Balance sheet, P&L, and cash flow spread automatically using a
              <strong className="text-slate-700"> CAMEL framework</strong> — assessing Capital adequacy, Asset quality, Management efficiency, Earnings quality, and Liquidity position.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              {['Capital adequacy & leverage ratios', 'Asset quality & impairment trends', 'Management efficiency (cost-to-income)', 'Earnings quality & profitability trajectory', 'Liquidity & debt service capacity (DSCR)'].map(i => (
                <li key={i} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-violet-500" />{i}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Monthly MIS</h3>
            <p className="text-xs text-amber-600 font-medium mb-3">Management accounts — latest 6–12 months</p>
            <p className="text-sm text-slate-600 mb-4">
              Inter-period visibility between annual filings — capturing recent trajectory not visible in audited statements.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              {['Revenue & PBT trends (month-on-month)', 'Cost-to-income ratio', 'Gross loan book growth', 'Impairment charge trajectory', 'Cash & liquidity position'].map(i => (
                <li key={i} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-amber-500" />{i}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-semibold text-teal-800 mb-2">Automatic Cross-Source Validation</h4>
              <p className="text-sm text-teal-700 mb-3">
                The Kaleidofin engine triangulates all three data sources and flags discrepancies before analysis proceeds.
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

      {/* ── 6. KI SCORE ─────────────────────────────────────────────── */}
      <section id="ki-score" className="bg-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">The Output: ki score of Kaleidofin</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Every application culminates in one concise, expert-reviewed credit note. Decision makers
              receive structured analysis — not raw data — ready for credit committee.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: What's in the credit note */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-white text-base mb-5">What the Credit Note Covers</h3>
              <div className="space-y-4">
                {[
                  {
                    color: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
                    label: 'Loan Tape Analytics',
                    items: ['DPD bucket analysis across all vintages', 'Roll-rate matrix & PAR trend vs. sector benchmark', 'ECL estimation & waterfall loss model', 'Data quality report — flags and exclusions documented'],
                  },
                  {
                    color: 'bg-violet-500/20 border-violet-500/30 text-violet-300',
                    label: 'CAMEL Financial Assessment',
                    items: ['Capital adequacy & leverage position', 'Asset quality vs. impairment trajectory', 'Earnings quality & profitability (2–3 year trend)', 'Liquidity — DSCR & cash coverage ratios'],
                  },
                  {
                    color: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
                    label: 'Triangulated Consistency Check',
                    items: ['Loan tape vs. MIS vs. financials — reconciled', 'Discrepancies flagged with severity rating', 'Originator data quality score'],
                  },
                  {
                    color: 'bg-teal-500/20 border-teal-500/30 text-teal-300',
                    label: 'Deal Structuring Recommendations',
                    items: ['ki score (0–100) with rationale', 'Recommended advance rate', 'Covenant triggers & reporting cadence'],
                  },
                ].map(({ color, label, items }) => (
                  <div key={label} className={`rounded-xl border p-4 ${color.split(' ').slice(0, 2).join(' ')}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${color.split(' ')[2]}`}>{label}</p>
                    <ul className="space-y-1">
                      {items.map(item => (
                        <li key={item} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-500" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Value propositions */}
            <div className="space-y-5">
              <div className="bg-slate-800 rounded-xl p-5">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-400" />
                  Concise, Not Overwhelming
                </h4>
                <p className="text-slate-400 text-sm">
                  The most important findings are surfaced front and centre. NCBA receives a single-page
                  credit note with clear positives, risks, and a recommendation. Full analytical detail
                  is available in the annexure for those who need it.
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-400" />
                  Expert-Reviewed, Every Time
                </h4>
                <p className="text-slate-400 text-sm">
                  The ki score is not a raw model output — it is validated by a Kaleidofin credit expert
                  before being shared with NCBA. Human judgement overlays quantitative analysis so the
                  final note reflects both rigour and qualitative context.
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  Structured for Decision Making
                </h4>
                <p className="text-slate-400 text-sm">
                  Each output includes deal structuring recommendations — advance rate, covenant triggers,
                  reporting requirements — so NCBA&apos;s credit committee can act immediately rather than
                  cycling back for clarification.
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-teal-400" />
                  Data Quality Transparency
                </h4>
                <p className="text-slate-400 text-sm">
                  Every credit note is accompanied by a data quality report — documenting any flags,
                  exclusions, or discrepancies identified in the originator&apos;s data, with a clear
                  record of what was corrected and why.
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
            The fastest way to validate quality of analysis and improvement in TAT — before committing to a full platform rollout.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            {
              icon: Layers,
              title: 'The Intelligence is the Hard Part',
              body: 'The Kaleidofin engine — loan tape analytics, CAMEL-based financial spreading, data triangulation, and the structured credit note framework — is the core IP. A workflow UI can be layered on top at any time. The POC proves the intelligence works first.',
              accent: 'border-t-4 border-t-teal-500',
            },
            {
              icon: CheckCircle2,
              title: 'Validate What Actually Matters',
              body: 'The two core promises are: (1) better quality of analysis than today\'s manual process, and (2) a materially faster TAT. The POC tests exactly these — with real originator data — before any further investment is required.',
              accent: 'border-t-4 border-t-blue-500',
            },
            {
              icon: Zap,
              title: 'Zero Disruption to Existing Processes',
              body: 'The POC uses existing SFTP infrastructure — no new systems, no integration work, no procurement process on NCBA\'s side. Kaleidofin handles the full setup for the pilot originator.',
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
          <strong>Key insight:</strong> The analytical engine — data models, validation rules, and credit note framework — is the complex part to build.
          The UI that manages workflow can be added at any stage. Starting with a POC lets NCBA validate the critical substance before investing in the surface.
        </div>
      </section>

      {/* ── 8. WHAT'S NEXT — THE FULL PLATFORM ─────────────────────── */}
      <section id="vision" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-xs px-3 py-1.5 rounded-full mb-4 font-medium">
            <ArrowRight className="w-3.5 h-3.5" />
            After a successful POC
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">What&apos;s Next — The Full Platform</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Every format mapping, validation rule, and analytical model built during the pilot feeds directly
            into the full platform. The step from POC to full deployment is a natural extension, not a separate project.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start mb-8">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-800 text-white px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Full Platform</span>
              </div>
              <h3 className="font-bold text-base">Complete Wholesale Lending Intelligence</h3>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Credit Decisioning</p>
                <ul className="space-y-2">
                  {[
                    'Multi-originator pipeline management — full workflow UI for NCBA team',
                    'NBFI onboarding portal and document collection',
                    'Loan tape analytics at scale — consistent analysis across all originators',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Post-Disbursement Monitoring</p>
                <ul className="space-y-2">
                  {[
                    'Covenant benchmarking and automated breach alerts',
                    'Early warning system — deteriorating metrics flagged before breach',
                    'Two-tier risk dashboard — NCBA wholesale view and underlying loan book view',
                    'Quarterly performance classification — Normal / Watch / Substandard / Loss',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Integration & Reporting</p>
                <ul className="space-y-2">
                  {[
                    'Native Perfios integration — financial spreading unified into one credit note',
                    'SFTP and API ingestion for ongoing loan tape submissions',
                    'Audit trail and compliance logging across all originators',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-slate-900 text-white rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base">The Expert Model Stays — Always</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-5">
                Whether for the POC or the full platform, Kaleidofin&apos;s model is a
                <strong className="text-white"> credit intelligence partnership</strong> — not a black-box tool.
                Every analysis is reviewed by a Kaleidofin credit expert before it reaches NCBA.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Zap, label: 'Automated analysis runs first', sub: 'Engine processes loan tape, financials, and MIS overnight' },
                  { icon: Users, label: 'Kaleidofin expert reviews all outputs', sub: 'Analyst validates, adds qualitative context, and signs off' },
                  { icon: CheckCircle2, label: 'Final credit note delivered to NCBA', sub: 'Structured, quality-assured, and ready for credit committee' },
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

            <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-teal-800 text-sm mb-1">Loan Tape Analytics — at Every Stage</h4>
                  <p className="text-teal-700 text-sm leading-relaxed">
                    Loan tape analysis powers both the initial credit decision and continuous post-disbursement monitoring.
                    The same engine that analyses the loan tape for the credit note runs monthly — giving NCBA an
                    up-to-date, analyst-reviewed view of every originator&apos;s portfolio at all times.
                  </p>
                </div>
              </div>
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
