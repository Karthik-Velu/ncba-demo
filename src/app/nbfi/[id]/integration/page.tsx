'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
  DOC_TYPE_SCHEMAS, getSchema, getValidationTests,
  generateFeedHistory, generateErrors, getErrorTypeLabel,
  type DocTypeSchema, type ValidationTest,
} from '@/lib/integrationSchemas';
import {
  ArrowLeft, Server, CheckCircle2, AlertTriangle, XCircle, Loader2,
  RefreshCw, ChevronDown, ChevronRight, Database, FileSpreadsheet,
  Clock, BarChart3, Eye, Shield, Wifi, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

type DocTypeId = 'loan_book' | 'financial_statements' | 'monthly_mis';

export default function IntegrationPage() {
  const { user, getNBFI, loanBookData } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<DocTypeId>('loan_book');

  useEffect(() => { if (!user) router.push('/'); }, [user, router]);
  const nbfi = getNBFI(id);
  useEffect(() => { if (user && id && !nbfi) router.replace('/dashboard'); }, [user, id, nbfi, router]);

  const loans = loanBookData[id] ?? [];

  if (!user || !nbfi) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Step 4 \u2014 Data Integration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure and monitor data feeds for <span className="font-medium text-gray-700">{nbfi.name}</span>
          </p>
        </div>

        <HealthOverview activeLoans={loans.length} />
        <DocTypeTabs active={activeTab} onChange={setActiveTab} />
        <DocTypeContent docTypeId={activeTab} />
      </main>
    </div>
  );
}

/* Health Overview Cards */

function HealthOverview({ activeLoans }: { activeLoans: number }) {
  const cards = DOC_TYPE_SCHEMAS.map(s => {
    const hist = generateFeedHistory(s.id, 30);
    const successRate = hist.length > 0 ? Math.round(hist.filter(h => h.status === 'success').length / hist.length * 100) : 0;
    const lastOk = hist.find(h => h.status === 'success');
    const errorsLast7 = generateErrors(s.id).filter(e => {
      const d = new Date(e.date);
      const cutoff = new Date('2025-02-11');
      return d >= cutoff;
    }).length;
    return { schema: s, successRate, lastOk, errorsLast7 };
  });

  const totalErrors = cards.reduce((s, c) => s + c.errorsLast7, 0);
  const avgSuccess = Math.round(cards.reduce((s, c) => s + c.successRate, 0) / cards.length);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map(c => (
        <div key={c.schema.id} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            {c.schema.id === 'loan_book' ? <Database className="w-4 h-4 text-[#003366]" /> :
             c.schema.id === 'financial_statements' ? <FileSpreadsheet className="w-4 h-4 text-[#003366]" /> :
             <BarChart3 className="w-4 h-4 text-[#003366]" />}
            <span className="text-xs font-semibold text-gray-700">{c.schema.shortName}</span>
            <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              c.successRate >= 80 ? 'bg-green-100 text-green-700' : c.successRate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
            }`}>{c.successRate >= 80 ? 'Active' : 'Degraded'}</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Success rate</span><span className="font-semibold">{c.successRate}%</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Last upload</span><span className="font-semibold">{c.lastOk?.date ?? '\u2014'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Errors (7d)</span><span className={`font-semibold ${c.errorsLast7 > 0 ? 'text-red-600' : 'text-green-600'}`}>{c.errorsLast7}</span></div>
          </div>
        </div>
      ))}

      <div className="bg-[#003366] rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-blue-300" />
          <span className="text-xs font-semibold">Overall Health</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-blue-200">Avg success</span><span className="font-semibold">{avgSuccess}%</span></div>
          <div className="flex justify-between"><span className="text-blue-200">Active feeds</span><span className="font-semibold">3</span></div>
          <div className="flex justify-between"><span className="text-blue-200">Errors (7d)</span><span className={`font-semibold ${totalErrors > 0 ? 'text-red-300' : 'text-green-300'}`}>{totalErrors}</span></div>
        </div>
      </div>
    </div>
  );
}

/* Document Type Tabs */

function DocTypeTabs({ active, onChange }: { active: DocTypeId; onChange: (id: DocTypeId) => void }) {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      {DOC_TYPE_SCHEMAS.map(s => {
        const isActive = active === s.id;
        return (
          <button key={s.id} onClick={() => onChange(s.id as DocTypeId)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              isActive ? 'border-[#003366] text-[#003366]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            {s.shortName}
            <span className="ml-2 text-[10px] font-normal text-gray-400">{s.fields.length} fields</span>
          </button>
        );
      })}
    </div>
  );
}

/* Per-Doc-Type Content */

function DocTypeContent({ docTypeId }: { docTypeId: DocTypeId }) {
  const schema = getSchema(docTypeId);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ config: true, mapping: false, testing: false, audit: false, errors: false });
  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <p className="text-sm text-gray-600">{schema.description}</p>
      </div>
      <CollapsibleSection title="Upload Configuration" icon={<Wifi className="w-4 h-4" />} open={openSections.config} onToggle={() => toggle('config')}>
        <UploadConfigSection schema={schema} />
      </CollapsibleSection>
      <CollapsibleSection title={`Column / Field Mapping (${schema.fields.length} fields)`} icon={<Database className="w-4 h-4" />} open={openSections.mapping} onToggle={() => toggle('mapping')}>
        <ColumnMappingSection schema={schema} />
      </CollapsibleSection>
      <CollapsibleSection title="Sample File Testing" icon={<Shield className="w-4 h-4" />} open={openSections.testing} onToggle={() => toggle('testing')}>
        <SampleTestingSection docTypeId={docTypeId} schema={schema} />
      </CollapsibleSection>
      <CollapsibleSection title="Upload Audit Trail" icon={<Clock className="w-4 h-4" />} open={openSections.audit} onToggle={() => toggle('audit')}>
        <AuditTrailSection docTypeId={docTypeId} />
      </CollapsibleSection>
      <CollapsibleSection title="Error Reports" icon={<AlertTriangle className="w-4 h-4" />} open={openSections.errors} onToggle={() => toggle('errors')}>
        <ErrorReportsSection docTypeId={docTypeId} />
      </CollapsibleSection>
    </div>
  );
}

function CollapsibleSection({ title, icon, open, onToggle, children }: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors">
        <span className="text-[#003366]">{icon}</span>
        <span className="text-sm font-semibold text-gray-800 flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}

/* (i) Upload Configuration */

function UploadConfigSection({ schema }: { schema: DocTypeSchema }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const cfg = schema.sftpConfig;

  const runTest = useCallback(() => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => { setTesting(false); setTestResult('success'); }, 2500);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 mb-4">
        {['SFTP', 'Manual Upload', 'API'].map((src, i) => (
          <span key={src} className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            i === 0 ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-500'
          }`}>{src}</span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <CfgField label="Host" value={cfg.host} />
        <CfgField label="Port" value={cfg.port} />
        <CfgField label="Path" value={cfg.path} />
        <CfgField label="Schedule" value={cfg.schedule} />
        <CfgField label="Format" value={cfg.format} />
        <CfgField label="Last Successful" value="2025-02-18" />
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button onClick={runTest} disabled={testing}
          className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99] disabled:opacity-50 flex items-center gap-2">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        {testResult === 'success' && <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle2 className="w-4 h-4" /> Connection successful</span>}
      </div>
    </div>
  );
}

function CfgField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">{label}</p>
      <p className="px-3 py-2 bg-gray-50 rounded-lg text-sm font-mono text-gray-800">{value}</p>
    </div>
  );
}

/* (ii) Column / Field Mapping */

function ColumnMappingSection({ schema }: { schema: DocTypeSchema }) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => ({ ...schema.autoMapping }));
  const [saved, setSaved] = useState(false);

  const sourceColumns = Object.keys(schema.autoMapping);
  const platformFields = schema.fields.map(f => f.key);
  const mappedCount = Object.values(mapping).filter(v => v && platformFields.includes(v)).length;
  const totalFields = schema.fields.length;

  const updateMapping = (src: string, target: string) => { setMapping(prev => ({ ...prev, [src]: target })); setSaved(false); };
  const resetMapping = () => { setMapping({ ...schema.autoMapping }); setSaved(false); };
  const saveMapping = () => setSaved(true);

  const hasSections = schema.sections && schema.sections.length > 0;

  if (hasSections) {
    return <SectionedMapping schema={schema} mapping={mapping} onUpdate={updateMapping} onReset={resetMapping} onSave={saveMapping} saved={saved} mappedCount={mappedCount} totalFields={totalFields} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{mappedCount}/{totalFields} fields mapped</p>
        <div className="flex gap-2">
          <button onClick={resetMapping} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">Reset to Auto</button>
          <button onClick={saveMapping} className={`px-3 py-1.5 text-xs rounded-lg font-medium ${saved ? 'bg-green-100 text-green-700' : 'bg-[#003366] text-white hover:bg-[#004d99]'}`}>
            {saved ? 'Saved' : 'Save Mapping'}
          </button>
        </div>
      </div>
      <MappingTable sourceColumns={sourceColumns} platformFields={platformFields} mapping={mapping} onUpdate={updateMapping} schema={schema} />
    </div>
  );
}

function SectionedMapping({ schema, mapping, onUpdate, onReset, onSave, saved, mappedCount, totalFields }: {
  schema: DocTypeSchema; mapping: Record<string, string>; onUpdate: (s: string, t: string) => void; onReset: () => void; onSave: () => void; saved: boolean; mappedCount: number; totalFields: number;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Metadata: true });
  const toggleSec = (name: string) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  const platformFields = schema.fields.map(f => f.key);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{mappedCount}/{totalFields} fields mapped</p>
        <div className="flex gap-2">
          <button onClick={onReset} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">Reset to Auto</button>
          <button onClick={onSave} className={`px-3 py-1.5 text-xs rounded-lg font-medium ${saved ? 'bg-green-100 text-green-700' : 'bg-[#003366] text-white hover:bg-[#004d99]'}`}>
            {saved ? 'Saved' : 'Save Mapping'}
          </button>
        </div>
      </div>
      {schema.sections!.map(sec => {
        const secFields = schema.fields.filter(f => sec.fieldKeys.includes(f.key));
        const secSources = Object.keys(schema.autoMapping).filter(k => sec.fieldKeys.includes(schema.autoMapping[k]));
        const secMapped = secSources.filter(k => mapping[k] && platformFields.includes(mapping[k])).length;
        const isOpen = expanded[sec.name] ?? false;
        return (
          <div key={sec.name} className="border border-gray-200 rounded-lg overflow-hidden">
            <button type="button" onClick={() => toggleSec(sec.name)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              <span className="text-sm font-semibold text-gray-700">{sec.name}</span>
              <span className="ml-auto text-xs text-gray-500">{secMapped}/{secFields.length} mapped</span>
              {secMapped === secFields.length && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </button>
            {isOpen && (
              <div className="p-4">
                <MappingTable sourceColumns={secSources} platformFields={platformFields} mapping={mapping} onUpdate={onUpdate} schema={schema} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MappingTable({ sourceColumns, platformFields, mapping, onUpdate, schema }: {
  sourceColumns: string[]; platformFields: string[]; mapping: Record<string, string>; onUpdate: (s: string, t: string) => void; schema: DocTypeSchema;
}) {
  const fieldMap = useMemo(() => {
    const m: Record<string, (typeof schema.fields)[0]> = {};
    schema.fields.forEach(f => { m[f.key] = f; });
    return m;
  }, [schema.fields]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs text-gray-500">
            <th className="text-left py-2 px-2">Source Column</th>
            <th className="text-left py-2 px-2">Platform Field</th>
            <th className="text-left py-2 px-2">Type</th>
            <th className="text-left py-2 px-2">Sample</th>
            <th className="text-left py-2 px-2 w-16">Status</th>
          </tr>
        </thead>
        <tbody>
          {sourceColumns.map(src => {
            const target = mapping[src] || '';
            const field = target ? fieldMap[target] : undefined;
            return (
              <tr key={src} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-2 px-2 font-mono text-xs text-gray-700 max-w-[200px] truncate">{src}</td>
                <td className="py-2 px-2">
                  <select value={target} onChange={e => onUpdate(src, e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-white max-w-[220px]">
                    <option value="">\u2014 unmapped \u2014</option>
                    {platformFields.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2 text-xs text-gray-500">{field?.type ?? '\u2014'}</td>
                <td className="py-2 px-2 font-mono text-[11px] text-gray-400">{field?.sampleValue ?? '\u2014'}</td>
                <td className="py-2 px-2">
                  {target ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* (iii) Sample File Testing */

function SampleTestingSection({ docTypeId, schema }: { docTypeId: DocTypeId; schema: DocTypeSchema }) {
  const [running, setRunning] = useState(false);
  const [stageIdx, setStageIdx] = useState(-1);
  const [done, setDone] = useState(false);
  const [expandedTest, setExpandedTest] = useState<number | null>(null);

  const stages = ['Reading file...', 'Validating schema...', 'Type checks...', 'Range checks...', 'Null checks...', 'Duplicate checks...', 'Complete!'];
  const tests = useMemo(() => getValidationTests(docTypeId), [docTypeId]);
  const passed = tests.filter(t => t.pass).length;
  const warnings = tests.filter(t => !t.pass && t.severity === 'warning').length;
  const failures = tests.filter(t => !t.pass && t.severity === 'error').length;

  const runTests = useCallback(() => {
    setRunning(true); setStageIdx(0); setDone(false);
    let i = 0;
    const tick = () => {
      i++;
      if (i < stages.length) {
        setStageIdx(i);
        if (i === stages.length - 1) { setRunning(false); setDone(true); }
        else setTimeout(tick, 500);
      }
    };
    setTimeout(tick, 500);
  }, [stages.length]);

  const previewRows = useMemo(() => {
    return schema.fields.slice(0, 10).map((f, i) => ({
      row: i + 1, field: f.label, value: f.sampleValue, type: f.type, status: i !== 7 ? 'ok' as const : 'warning' as const,
    }));
  }, [schema.fields]);

  return (
    <div className="space-y-4">
      {!done && (
        <button onClick={runTests} disabled={running}
          className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99] disabled:opacity-50 flex items-center gap-2">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {running ? 'Testing...' : 'Test Sample File'}
        </button>
      )}

      {stageIdx >= 0 && !done && (
        <div className="space-y-1.5">
          {stages.map((label, i) => (
            <div key={i} className={`flex items-center gap-2 text-sm ${i < stageIdx ? 'text-green-600' : i === stageIdx ? 'text-[#003366] font-medium' : 'text-gray-400'}`}>
              {i < stageIdx && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {i === stageIdx && <Loader2 className="w-4 h-4 animate-spin text-[#003366]" />}
              {i > stageIdx && <span className="w-4 h-4 rounded-full border border-gray-300 inline-block" />}
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {done && (
        <>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700">{passed} passed</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">{warnings} warnings</span>
            </div>
            {failures > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-semibold text-red-700">{failures} failures</span>
              </div>
            )}
            <button onClick={() => { setDone(false); setStageIdx(-1); }} className="ml-auto text-xs text-[#003366] hover:underline">Re-run tests</button>
          </div>

          <div className="space-y-2">
            {tests.map((t, i) => (
              <div key={i}>
                <button type="button" onClick={() => setExpandedTest(expandedTest === i ? null : i)}
                  className={`w-full flex items-start gap-2 p-3 rounded-lg text-xs text-left ${t.pass ? 'bg-green-50' : t.severity === 'warning' ? 'bg-amber-50' : 'bg-red-50'}`}>
                  {t.pass ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> :
                   t.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> :
                   <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                  <span className={`flex-1 ${t.pass ? 'text-green-700' : t.severity === 'warning' ? 'text-amber-700' : 'text-red-700'}`}>{t.name}</span>
                  {t.detail && (expandedTest === i ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />)}
                </button>
                {expandedTest === i && t.detail && (
                  <div className="ml-6 mt-1 p-2 bg-white border border-gray-200 rounded text-[11px] text-gray-600">{t.detail}</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Data Preview (first 10 fields)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="text-left py-2 px-2">#</th>
                    <th className="text-left py-2 px-2">Field</th>
                    <th className="text-left py-2 px-2">Value</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map(r => (
                    <tr key={r.row} className="border-b border-gray-50">
                      <td className="py-1.5 px-2 text-gray-400">{r.row}</td>
                      <td className="py-1.5 px-2 text-gray-700">{r.field}</td>
                      <td className="py-1.5 px-2 font-mono text-gray-600">{r.value}</td>
                      <td className="py-1.5 px-2 text-gray-500">{r.type}</td>
                      <td className="py-1.5 px-2">{r.status === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* (iv) Upload Audit Trail */

function AuditTrailSection({ docTypeId }: { docTypeId: DocTypeId }) {
  const allRecords = useMemo(() => generateFeedHistory(docTypeId, 60), [docTypeId]);
  const [page, setPage] = useState(0);
  const [sortAsc, setSortAsc] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewingErrors, setViewingErrors] = useState<string | null>(null);
  const perPage = 10;

  const filtered = useMemo(() => {
    let recs = [...allRecords];
    if (statusFilter !== 'all') recs = recs.filter(r => r.status === statusFilter);
    recs.sort((a, b) => sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return recs;
  }, [allRecords, statusFilter, sortAsc]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageRecords = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Status:</span>
          {['all', 'success', 'partial', 'failed'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium capitalize ${
                statusFilter === s ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{s}</button>
          ))}
        </div>
        <button onClick={() => setSortAsc(!sortAsc)} className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          <Calendar className="w-3.5 h-3.5" /> {sortAsc ? 'Oldest first' : 'Newest first'}
        </button>
        <span className="text-xs text-gray-400">{filtered.length} records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs text-gray-500">
              <th className="text-left py-2 px-2">Date/Time</th>
              <th className="text-left py-2 px-2">Source</th>
              <th className="text-left py-2 px-2">Uploaded By</th>
              <th className="text-left py-2 px-2">File Name</th>
              <th className="text-right py-2 px-2">Rows</th>
              <th className="text-left py-2 px-2">Status</th>
              <th className="text-right py-2 px-2">Errors</th>
              <th className="text-left py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRecords.map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-2 px-2 text-xs text-gray-700">{r.date} {r.time}</td>
                <td className="py-2 px-2"><span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  r.source === 'sftp' ? 'bg-blue-50 text-blue-700' : r.source === 'manual' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                }`}>{r.source.toUpperCase()}</span></td>
                <td className="py-2 px-2 text-xs text-gray-600">{r.uploadedBy}</td>
                <td className="py-2 px-2 text-xs font-mono text-gray-600 max-w-[180px] truncate">{r.fileName}</td>
                <td className="py-2 px-2 text-xs text-right text-gray-700">{r.rows > 0 ? r.rows.toLocaleString() : '\u2014'}</td>
                <td className="py-2 px-2"><StatusBadge status={r.status} /></td>
                <td className="py-2 px-2 text-xs text-right">{r.errorCount > 0 ? <span className="text-red-600 font-medium">{r.errorCount}</span> : <span className="text-gray-400">0</span>}</td>
                <td className="py-2 px-2">
                  {r.errorCount > 0 && (
                    <button onClick={() => setViewingErrors(viewingErrors === r.id ? null : r.id)} className="text-xs text-[#003366] hover:underline flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Errors
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingErrors && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-700 mb-2">Errors for upload {viewingErrors}</p>
          <p className="text-xs text-red-600">Connection timeout / schema validation failed. Retried at next scheduled interval.</p>
          <button onClick={() => setViewingErrors(null)} className="mt-2 text-xs text-red-700 hover:underline">Close</button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">Previous</button>
          <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: 'success' | 'partial' | 'failed' }) {
  const cfg = {
    success: 'bg-green-100 text-green-700',
    partial: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
  }[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${cfg}`}>{status}</span>;
}

/* (v) Error Reports */

function ErrorReportsSection({ docTypeId }: { docTypeId: DocTypeId }) {
  const errors = useMemo(() => generateErrors(docTypeId), [docTypeId]);
  const [expandedErr, setExpandedErr] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const byType: Record<string, number> = {};
    errors.forEach(e => { byType[e.errorType] = (byType[e.errorType] || 0) + 1; });
    return Object.entries(byType).map(([type, count]) => ({ type: getErrorTypeLabel(type), count }));
  }, [errors]);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#6b7280'];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Errors by Type (last 30 days)</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 20, top: 5, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Errors</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500">
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Error Type</th>
                <th className="text-left py-2 px-2">Field</th>
                <th className="text-right py-2 px-2">Rows</th>
                <th className="text-left py-2 px-2">Message</th>
                <th className="text-left py-2 px-2">Severity</th>
              </tr>
            </thead>
            <tbody>
              {errors.slice(0, 12).map(e => (
                <React.Fragment key={e.id}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => setExpandedErr(expandedErr === e.id ? null : e.id)}>
                    <td className="py-2 px-2 text-xs text-gray-700">{e.date}</td>
                    <td className="py-2 px-2 text-xs text-gray-700">{getErrorTypeLabel(e.errorType)}</td>
                    <td className="py-2 px-2 text-xs font-mono text-gray-600">{e.field}</td>
                    <td className="py-2 px-2 text-xs text-right text-gray-700">{e.rowCount}</td>
                    <td className="py-2 px-2 text-xs text-gray-600 max-w-[240px] truncate">{e.message}</td>
                    <td className="py-2 px-2"><span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      e.severity === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>{e.severity}</span></td>
                  </tr>
                  {expandedErr === e.id && (
                    <tr><td colSpan={6} className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs text-gray-600"><strong>Affected rows:</strong> {e.sampleRows.join(', ')}{e.rowCount > 5 ? ` (+${e.rowCount - 5} more)` : ''}</p>
                      <p className="text-xs text-gray-500 mt-1"><strong>Upload:</strong> {e.uploadId}</p>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
