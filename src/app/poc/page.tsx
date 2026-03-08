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

      {/* ── NAVIGATION ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="30" viewBox="0 0 51 71" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 24.9032L50.8025 0V19.9225L0 44.8257V24.9032Z" fill="#0F547E"/>
              <path d="M0 45.3238L50.8025 70.2269V50.3044L0 25.4012V45.3238Z" fill="#28B2B6"/>
            </svg>
            <div>
              <span className="font-bold text-slate-800 text-sm">Kaleidofin</span>
              <span className="text-slate-400 text-xs ml-2 hidden sm:inline">Credit Intelligence Platform</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-500">
            <a href="#how-it-works" className="hover:text-teal-700 transition-colors">How It Works</a>
            <a href="#ki-score" className="hover:text-teal-700 transition-colors">ki score</a>
            <a href="#rationale" className="hover:text-teal-700 transition-colors">Why POC</a>
            <a href="#vision" className="hover:text-teal-700 transition-colors">What&apos;s Next</a>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs px-3 py-1.5 rounded font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Confidential — For NCBA
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 15% 60%, #0d9488 0%, transparent 55%), radial-gradient(circle at 85% 20%, #0f766e 0%, transparent 50%)' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-14 md:py-16">
          <div className="grid lg:grid-cols-[1fr_340px] gap-10 items-center">

            {/* Left: headline + description + metrics */}
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-600/20 border border-teal-500/30 text-teal-300 text-xs px-3 py-1.5 rounded mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                Proof of Concept Proposal · NCBA Wholesale Lending
              </div>
              <h1 className="text-2xl md:text-[2.1rem] font-bold leading-tight mb-4">
                Credit Intelligence for NBFI Wholesale Lending —{' '}
                <span className="text-teal-400">From Raw Data to Decision in T+4 Business Days</span>
              </h1>
              <p className="text-slate-300 text-sm max-w-xl mb-6 leading-relaxed">
                Kaleidofin automates the most time-consuming parts of NBFI credit assessment — loan tape analysis,
                financial spreading, MIS review, and cross-source validation — so your decision makers receive
                a concise, expert-reviewed credit note, not a stack of spreadsheets.
              </p>
              <div className="flex items-center gap-2">
                {[
                  { icon: Clock, label: 'T+4 Days TAT' },
                  { icon: Database, label: '3 Data Sources Triangulated' },
                  { icon: Award, label: '1 ki score per Originator' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 bg-white/10 border border-white/15 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap">
                    <Icon className="w-3.5 h-3.5 text-teal-400" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: pilot steps */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-4">Getting started</p>
              <div className="space-y-3">
                {[
                  {
                    step: '01',
                    title: 'Nominate a pilot originator',
                    desc: 'NCBA selects one originator from its existing wholesale lending portfolio.',
                  },
                  {
                    step: '02',
                    title: 'Share required files over SFTP',
                    desc: 'Loan tape (12+ months), audited financials, and monthly MIS — no new systems required.',
                  },
                  {
                    step: '03',
                    title: 'Receive the first ki score within T+4',
                    desc: 'Expert-reviewed credit note with ki score and deal structuring recommendations.',
                  },
                ].map(({ step, title, desc }, i) => (
                  <div key={step} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-teal-600/30 border border-teal-500/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-teal-300 text-[10px] font-bold">{step}</span>
                      </div>
                      {i < 2 && <div className="w-px flex-1 bg-white/10 my-0.5" />}
                    </div>
                    <div className={i < 2 ? 'pb-2' : ''}>
                      <h4 className="font-semibold text-white text-xs mb-0.5">{title}</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── WHAT KALEIDOFIN DELIVERS ─────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">What Kaleidofin Delivers</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">From raw loan tape to a decision-ready credit note — automated, validated, and expert-reviewed.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Database,
                accent: 'border-t-2 border-t-blue-500',
                iconBg: 'bg-blue-50 text-blue-700',
                title: 'Loan Tape Analytics',
                body: 'DPD buckets, vintage curves, roll rates, and ECL estimated automatically — overnight — from 12+ months of loan-level data.',
              },
              {
                icon: FileSpreadsheet,
                accent: 'border-t-2 border-t-violet-500',
                iconBg: 'bg-violet-50 text-violet-700',
                title: 'Automated Financial Spreading',
                body: 'Balance sheet, P&L, and cash flow spread from audited financials using a CAMEL framework — no manual re-keying.',
              },
              {
                icon: RefreshCw,
                accent: 'border-t-2 border-t-amber-500',
                iconBg: 'bg-amber-50 text-amber-700',
                title: 'Cross-Source Validation',
                body: 'Loan tape, financials, and MIS are triangulated automatically — discrepancies flagged before any credit decision is made.',
              },
              {
                icon: Users,
                accent: 'border-t-2 border-t-teal-500',
                iconBg: 'bg-teal-50 text-teal-700',
                title: 'Expert-Reviewed Credit Note',
                body: 'Every output is reviewed by a Kaleidofin credit analyst before delivery to NCBA — structured for immediate decision.',
              },
            ].map(({ icon: Icon, accent, iconBg, title, body }) => (
              <div key={title} className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm ${accent}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm mb-2">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW THE POC WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">How the POC Works</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Kaleidofin onboards <strong>one originator</strong> and builds a custom data mapping layer for that
              originator&apos;s exact formats — ensuring the pipeline matches real-world data from day one.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-stretch gap-0">
            {[
              {
                step: '01', icon: Database, title: 'SFTP Data Drop',
                desc: 'Originator shares Loan Tape (12+ months), Financial Statements, and Monthly MIS via secure SFTP.',
                top: 'border-t-2 border-t-blue-500', bg: 'bg-white',
              },
              {
                step: '02', icon: GitBranch, title: 'Custom Format Mapping',
                desc: 'Kaleidofin builds a bespoke mapping layer for the originator\'s exact column names, date formats, and field conventions.',
                top: 'border-t-2 border-t-violet-500', bg: 'bg-white',
              },
              {
                step: '03', icon: Zap, title: 'Automated Analysis',
                desc: 'The engine runs overnight — generating DPD analysis, vintage curves, ECL estimates, CAMEL-based financial ratios, and cross-source validation.',
                top: 'border-t-2 border-t-amber-500', bg: 'bg-white',
              },
              {
                step: '04', icon: Users, title: 'Expert Review',
                desc: 'A Kaleidofin analyst reviews all outputs, adds qualitative context, and prepares the final credit note.',
                top: 'border-t-2 border-t-teal-500', bg: 'bg-white',
              },
              {
                step: '05', icon: CheckCircle2, title: 'Credit Note to NCBA',
                desc: 'NCBA receives a structured credit note with ki score, estimated loss, and deal structuring recommendations.',
                top: 'border-t-2 border-t-green-500', bg: 'bg-white',
              },
            ].map(({ step, icon: Icon, title, desc, top, bg }, i) => (
              <React.Fragment key={step}>
                <div className={`flex-1 border border-slate-200 rounded-xl p-5 shadow-sm ${bg} ${top}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 tracking-wider">STEP {step}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm mb-2">{title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:flex items-center justify-center px-1 flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-600 text-center shadow-sm">
            <Clock className="w-4 h-4 inline-block mr-2 text-teal-600" />
            <strong>Committed TAT:</strong> T+4 business days from complete data submission to final credit note delivered to NCBA.
          </div>
        </div>
      </section>

      {/* ── THREE DATA SOURCES ───────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Three Data Sources. One Unified Picture.</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Kaleidofin ingests three complementary data streams and triangulates them automatically —
              surfacing any discrepancies before a decision is made.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {[
              {
                icon: Database,
                iconBg: 'bg-blue-50 text-blue-700',
                accent: 'border-t-2 border-t-blue-500',
                title: 'Loan Tape',
                tag: '12+ months performance data — required',
                tagColor: 'text-blue-600',
                desc: 'Full loan-level snapshot powering all quantitative credit analysis.',
                chevron: 'text-blue-400',
                items: ['DPD bucket distribution & PAR trends', 'Vintage analysis & cohort performance', 'Roll-rate (migration) matrix', 'ECL & estimated loss modelling', 'Write-off, recovery & repossession rates', 'Geography, product & segment breakdown'],
              },
              {
                icon: FileSpreadsheet,
                iconBg: 'bg-violet-50 text-violet-700',
                accent: 'border-t-2 border-t-violet-500',
                title: 'Financial Statements',
                tag: 'Audited annual accounts — 2–3 years',
                tagColor: 'text-violet-600',
                desc: 'Balance sheet, P&L, and cash flow spread automatically using a CAMEL framework — assessing Capital adequacy, Asset quality, Management efficiency, Earnings, and Liquidity.',
                chevron: 'text-violet-400',
                items: ['Capital adequacy & leverage ratios', 'Asset quality & impairment trends', 'Management efficiency (cost-to-income)', 'Earnings quality & profitability trend', 'Liquidity & debt service capacity (DSCR)'],
              },
              {
                icon: BarChart3,
                iconBg: 'bg-amber-50 text-amber-700',
                accent: 'border-t-2 border-t-amber-500',
                title: 'Monthly MIS',
                tag: 'Management accounts — latest 6–12 months',
                tagColor: 'text-amber-600',
                desc: 'Inter-period visibility between annual filings — capturing recent trajectory not visible in audited statements.',
                chevron: 'text-amber-400',
                items: ['Revenue & PBT trends (month-on-month)', 'Cost-to-income ratio', 'Gross loan book growth', 'Impairment charge trajectory', 'Cash & liquidity position'],
              },
            ].map(({ icon: Icon, iconBg, accent, title, tag, tagColor, desc, chevron, items }) => (
              <div key={title} className={`bg-white border border-slate-200 rounded-xl p-6 shadow-sm ${accent} flex flex-col`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                <p className={`text-xs font-medium mb-3 ${tagColor}`}>{tag}</p>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{desc}</p>
                <ul className="space-y-1.5 text-xs text-slate-500 mt-auto">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-1.5">
                      <ChevronRight className={`w-3 h-3 flex-shrink-0 mt-0.5 ${chevron}`} />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 mb-2">Automatic Cross-Source Validation</h4>
                <p className="text-sm text-slate-600 mb-4">
                  The Kaleidofin engine triangulates all three data sources and flags discrepancies before analysis proceeds — ensuring the credit note is built on consistent, reconciled data.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    'MIS gross loan book vs. loan tape total balance (tolerance: ±2%)',
                    'Audited financials P&L vs. cumulative MIS figures',
                    'Write-off rates in loan tape vs. impairment charge in financials',
                  ].map(c => (
                    <div key={c} className="bg-white rounded-lg p-3 text-xs text-slate-600 border border-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 inline mr-1.5" />{c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KI SCORE ─────────────────────────────────────────────────── */}
      <section id="ki-score" className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">The Output: ki score of Kaleidofin</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Every application culminates in one concise, expert-reviewed credit note — structured for
              credit committee, not for further processing.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            {/* Left: What's in the credit note */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-800 text-white px-5 py-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Credit Note Contents</p>
                <h3 className="font-bold text-base">What the Analysis Covers</h3>
              </div>
              <div className="p-5 space-y-4 flex-1">
                {[
                  {
                    color: 'border-l-2 border-l-blue-400 bg-blue-50',
                    label: 'Loan Tape Analytics',
                    items: ['DPD bucket analysis across all vintages', 'Roll-rate matrix & PAR trend vs. sector benchmark', 'ECL estimation & waterfall loss model', 'Data quality report — flags and exclusions documented'],
                  },
                  {
                    color: 'border-l-2 border-l-violet-400 bg-violet-50',
                    label: 'CAMEL Financial Assessment',
                    items: ['Capital adequacy & leverage position', 'Asset quality vs. impairment trajectory', 'Earnings quality & profitability (2–3 year trend)', 'Liquidity — DSCR & cash coverage ratios'],
                  },
                  {
                    color: 'border-l-2 border-l-amber-400 bg-amber-50',
                    label: 'Cross-Source Consistency Check',
                    items: ['Loan tape vs. MIS vs. financials — reconciled', 'Discrepancies flagged with severity rating', 'Originator data quality score'],
                  },
                  {
                    color: 'border-l-2 border-l-teal-500 bg-teal-50',
                    label: 'Deal Structuring Recommendations',
                    items: ['ki score (0–100) with rationale', 'Recommended advance rate', 'Covenant triggers & reporting cadence'],
                  },
                ].map(({ color, label, items }) => (
                  <div key={label} className={`rounded-lg p-4 ${color}`}>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">{label}</p>
                    <ul className="space-y-1">
                      {items.map(item => (
                        <li key={item} className="flex items-start gap-1.5 text-xs text-slate-600">
                          <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-400" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Value propositions */}
            <div className="flex flex-col gap-4">
              {[
                {
                  icon: Target,
                  title: 'Concise, Not Overwhelming',
                  body: 'The most important findings are surfaced front and centre. NCBA receives a single-page credit note with clear positives, risks, and a recommendation. Full analytical detail is available in the annexure for those who need it.',
                },
                {
                  icon: Shield,
                  title: 'Expert-Reviewed, Every Time',
                  body: 'The ki score is not a raw model output — it is validated by a Kaleidofin credit expert before being shared with NCBA. Human judgement overlays quantitative analysis so the final note reflects both rigour and qualitative context.',
                },
                {
                  icon: TrendingUp,
                  title: 'Structured for Decision Making',
                  body: 'Each output includes deal structuring recommendations — advance rate, covenant triggers, reporting requirements — so NCBA\'s credit committee can act immediately rather than cycling back for clarification.',
                },
                {
                  icon: AlertTriangle,
                  title: 'Data Quality Transparency',
                  body: 'Every credit note is accompanied by a data quality report — documenting any flags, exclusions, or discrepancies identified in the originator\'s data, with a clear record of what was corrected and why.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1 flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm mb-1.5">{title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY POC FIRST ────────────────────────────────────────────── */}
      <section id="rationale" className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Why Start with a POC?</h2>
            <p className="text-slate-500 text-sm max-w-2xl mx-auto">
              The Kaleidofin engine — loan tape analytics, CAMEL-based financial spreading, and the structured
              credit note framework — is the analytically complex part to build. Proving it works with real originator
              data is the right first step. A workflow UI can be layered on top once NCBA has confidence in the
              quality of analysis and the improvement in TAT.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: CheckCircle2,
                accent: 'border-t-2 border-t-teal-500',
                title: 'Validate What Actually Matters',
                body: 'The two core promises are better quality of analysis than today\'s manual process and a materially faster TAT. The POC tests exactly these — with real originator data — before any further investment is required.',
              },
              {
                icon: Zap,
                accent: 'border-t-2 border-t-blue-500',
                title: 'Zero Disruption to Existing Processes',
                body: 'The POC uses existing SFTP infrastructure — no new systems, no integration work, no procurement process on NCBA\'s side. Simply share the required files and Kaleidofin handles the rest.',
              },
              {
                icon: Layers,
                accent: 'border-t-2 border-t-violet-500',
                title: 'A Foundation, Not a Throwaway',
                body: 'Every format mapping, validation rule, and model built during the POC feeds directly into the full platform. The step from pilot to full deployment is a natural extension, not a separate project.',
              },
            ].map(({ icon: Icon, accent, title, body }) => (
              <div key={title} className={`bg-white border border-slate-200 rounded-xl p-6 shadow-sm ${accent}`}>
                <Icon className="w-5 h-5 text-slate-400 mb-4" />
                <h4 className="font-semibold text-slate-800 mb-2">{title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S NEXT — THE FULL PLATFORM ──────────────────────────── */}
      <section id="vision" className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-xs px-3 py-1.5 rounded mb-4 font-medium">
              <ArrowRight className="w-3.5 h-3.5" />
              After a successful POC
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">What&apos;s Next — The Full Platform</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Every format mapping, validation rule, and analytical model built during the pilot feeds directly
              into the full platform. The step from POC to full deployment is a natural extension, not a separate project.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* Left: Full platform capabilities */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="bg-slate-800 text-white px-5 py-4 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Full Platform</span>
                </div>
                <h3 className="font-bold text-base">Complete Wholesale Lending Intelligence</h3>
              </div>
              <div className="p-5 space-y-5 flex-1">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Credit Decisioning</p>
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
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Post-Disbursement Monitoring</p>
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
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Integration & Reporting</p>
                  <ul className="space-y-2">
                    {[
                      "NCBA's financial spreading tools integrated into the overall workflow in a seamless manner",
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

            {/* Right: Expert model + Loan tape — equal height via flex */}
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-teal-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">The Expert Model Stays — Always</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">
                  Whether for the POC or the full platform, Kaleidofin&apos;s model is a
                  <strong className="text-slate-700"> credit intelligence partnership</strong> — not a black-box tool.
                  Every analysis is reviewed by a Kaleidofin credit expert before it reaches NCBA.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Zap, label: 'Automated analysis runs first', sub: 'Engine processes loan tape, financials, and MIS overnight' },
                    { icon: Users, label: 'Kaleidofin expert reviews all outputs', sub: 'Analyst validates, adds qualitative context, and signs off' },
                    { icon: CheckCircle2, label: 'Final credit note delivered to NCBA', sub: 'Structured, quality-assured, and ready for credit committee' },
                  ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <Icon className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{label}</p>
                        <p className="text-xs text-slate-400">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-teal-500">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm mb-1.5">Loan Tape Analytics — at Every Stage</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Loan tape analysis powers both the initial credit decision and continuous post-disbursement monitoring.
                      The same engine that analyses the loan tape for the credit note runs monthly — giving NCBA an
                      up-to-date, analyst-reviewed view of every originator&apos;s portfolio at all times.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="bg-slate-800 text-slate-400 py-8 text-center text-xs">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg width="16" height="22" viewBox="0 0 51 71" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 24.9032L50.8025 0V19.9225L0 44.8257V24.9032Z" fill="#0F547E"/>
            <path d="M0 45.3238L50.8025 70.2269V50.3044L0 25.4012V45.3238Z" fill="#28B2B6"/>
          </svg>
          <span className="text-slate-300 font-medium">Kaleidofin Credit Intelligence Platform</span>
        </div>
        <p className="text-slate-500">This document is prepared by Kaleidofin exclusively for NCBA and is strictly confidential. Not for distribution.</p>
      </footer>
    </div>
  );
}
