'use client';

import { useApp } from '@/context/AppContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { CovenantDef, DocumentRequirement, ProvisioningRule } from '@/lib/types';
import { Plus, Trash2, CheckCircle2, Settings, FileText, Shield } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_COVENANTS: CovenantDef[] = [
  { id: 'cov-1', metric: 'CRAR (Capital to Risk-weighted Assets)', operator: '>=', threshold: 15, frequency: 'quarterly', format: 'percent' },
  { id: 'cov-2', metric: 'Net NPA Ratio', operator: '<=', threshold: 3, frequency: 'quarterly', format: 'percent' },
  { id: 'cov-3', metric: 'Collection Efficiency', operator: '>=', threshold: 98, frequency: 'monthly', format: 'percent' },
  { id: 'cov-4', metric: 'PAR 30', operator: '<=', threshold: 5, frequency: 'monthly', format: 'percent' },
  { id: 'cov-5', metric: 'Debt-to-Equity Ratio', operator: '<=', threshold: 4.0, frequency: 'quarterly', format: 'ratio' },
];

const DEFAULT_DOCUMENTS: DocumentRequirement[] = [
  { id: 'doc-1', name: 'MIS Portfolio Report', frequency: 'monthly', nextDueDate: '', status: 'pending' },
  { id: 'doc-2', name: 'Compliance Certificate', frequency: 'quarterly', nextDueDate: '', status: 'pending' },
  { id: 'doc-3', name: 'Unaudited Quarterly Financials', frequency: 'quarterly', nextDueDate: '', status: 'pending' },
  { id: 'doc-4', name: 'Audited Annual Financials', frequency: 'annually', nextDueDate: '', status: 'pending' },
  { id: 'doc-5', name: 'Tax Compliance Certificate', frequency: 'annually', nextDueDate: '', status: 'pending' },
  { id: 'doc-6', name: 'Management Accounts', frequency: 'quarterly', nextDueDate: '', status: 'pending' },
];

const DEFAULT_NBFI_PROVISIONING: ProvisioningRule[] = [
  { bucket: 'normal', dpdMin: 0, dpdMax: 30, provisionPercent: 1 },
  { bucket: 'watch', dpdMin: 31, dpdMax: 60, provisionPercent: 5 },
  { bucket: 'substandard', dpdMin: 61, dpdMax: 90, provisionPercent: 25 },
  { bucket: 'doubtful', dpdMin: 91, dpdMax: 180, provisionPercent: 50 },
  { bucket: 'loss', dpdMin: 181, dpdMax: 9999, provisionPercent: 100 },
];

const DEFAULT_LENDER_PROVISIONING: ProvisioningRule[] = [
  { bucket: 'normal', dpdMin: 0, dpdMax: 30, provisionPercent: 1 },
  { bucket: 'watch', dpdMin: 31, dpdMax: 60, provisionPercent: 10 },
  { bucket: 'substandard', dpdMin: 61, dpdMax: 90, provisionPercent: 50 },
  { bucket: 'doubtful', dpdMin: 91, dpdMax: 120, provisionPercent: 75 },
  { bucket: 'loss', dpdMin: 121, dpdMax: 9999, provisionPercent: 100 },
];

const BUCKET_LABELS: Record<string, string> = {
  normal: 'Normal', watch: 'Watch', substandard: 'Substandard', doubtful: 'Doubtful', loss: 'Loss',
};

export default function SetupPage() {
  const { user, getNBFI, saveCovenantSetup } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<'covenants' | 'documents' | 'provisioning'>('covenants');
  const [covenants, setCovenants] = useState<CovenantDef[]>([]);
  const [documents, setDocuments] = useState<DocumentRequirement[]>([]);
  const [nbfiRules, setNbfiRules] = useState<ProvisioningRule[]>([]);
  const [lenderRules, setLenderRules] = useState<ProvisioningRule[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const nbfi = getNBFI(id);

  useEffect(() => {
    if (!nbfi) return;
    setCovenants(nbfi.covenants?.length ? nbfi.covenants : DEFAULT_COVENANTS);
    setDocuments(nbfi.documents?.length ? nbfi.documents : DEFAULT_DOCUMENTS);
    setNbfiRules(nbfi.provisioningRules?.nbfi?.length ? nbfi.provisioningRules.nbfi : DEFAULT_NBFI_PROVISIONING);
    setLenderRules(nbfi.provisioningRules?.lender?.length ? nbfi.provisioningRules.lender : DEFAULT_LENDER_PROVISIONING);
  }, [nbfi]);

  if (!user || !nbfi) return null;

  const updateCovenant = (idx: number, field: keyof CovenantDef, value: string | number) => {
    setCovenants(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const addCovenant = () => {
    setCovenants(prev => [...prev, {
      id: uuidv4(), metric: '', operator: '>=', threshold: 0, frequency: 'quarterly', format: 'percent',
    }]);
  };

  const removeCovenant = (idx: number) => {
    setCovenants(prev => prev.filter((_, i) => i !== idx));
  };

  const updateDocument = (idx: number, field: keyof DocumentRequirement, value: string) => {
    setDocuments(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const updateProvisionRule = (
    setter: React.Dispatch<React.SetStateAction<ProvisioningRule[]>>,
    idx: number,
    field: keyof ProvisioningRule,
    value: number,
  ) => {
    setter(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleSave = () => {
    saveCovenantSetup(id, covenants, documents, { nbfi: nbfiRules, lender: lenderRules });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { key: 'covenants' as const, label: 'Covenant Configuration', icon: Shield },
    { key: 'documents' as const, label: 'Document Requirements', icon: FileText },
    { key: 'provisioning' as const, label: 'Provisioning Rules', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-gray-50">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          &larr; Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Covenant & Document Setup — {nbfi.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Configure covenants, document requirements, and provisioning policies</p>
          </div>
          <button
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-[#003366] text-white hover:bg-[#004d99]'
            }`}
          >
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved Successfully</> : 'Save & Activate'}
          </button>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === key ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'covenants' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#003366]">Financial Covenants</h2>
              <button onClick={addCovenant} className="flex items-center gap-1.5 text-xs font-medium text-[#003366] hover:text-[#004d99]">
                <Plus className="w-3.5 h-3.5" /> Add Covenant
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600">Metric</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-24">Operator</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-28">Threshold</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-32">Frequency</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-28">Format</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {covenants.map((cov, idx) => (
                    <tr key={cov.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <input
                          value={cov.metric}
                          onChange={e => updateCovenant(idx, 'metric', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/20 outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={cov.operator}
                          onChange={e => updateCovenant(idx, 'operator', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:border-[#003366] outline-none"
                        >
                          <option value=">=">&ge;</option>
                          <option value="<=">&le;</option>
                          <option value=">">&gt;</option>
                          <option value="<">&lt;</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.1"
                          value={cov.threshold}
                          onChange={e => updateCovenant(idx, 'threshold', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm text-right font-mono focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/20 outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={cov.frequency}
                          onChange={e => updateCovenant(idx, 'frequency', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:border-[#003366] outline-none"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annually">Annually</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={cov.format}
                          onChange={e => updateCovenant(idx, 'format', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:border-[#003366] outline-none"
                        >
                          <option value="percent">Percent</option>
                          <option value="ratio">Ratio</option>
                          <option value="number">Number</option>
                        </select>
                      </td>
                      <td className="px-1 py-2">
                        <button onClick={() => removeCovenant(idx)} className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#003366] mb-4">Required Documents</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600">Document Name</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-36">Frequency</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-40">Next Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, idx) => (
                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <input
                          value={doc.name}
                          onChange={e => updateDocument(idx, 'name', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/20 outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={doc.frequency}
                          onChange={e => updateDocument(idx, 'frequency', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:border-[#003366] outline-none"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annually">Annually</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={doc.nextDueDate}
                          onChange={e => updateDocument(idx, 'nextDueDate', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/20 outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'provisioning' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Provision matrix by DPD band; aligns with Stage 2/3 lifetime ECL for defaulted/watch buckets. Normal = Stage 1 (12m); Watch, Substandard, Doubtful, Loss = Stage 2/3 (lifetime).
            </p>
            <div className="grid grid-cols-2 gap-6">
              {[
                { title: 'NBFI Policy', rules: nbfiRules, setter: setNbfiRules },
                { title: 'Lender Policy (with Security Consideration)', rules: lenderRules, setter: setLenderRules },
              ].map(({ title, rules, setter }) => (
                <div key={title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-sm font-bold text-[#003366] mb-4">{title}</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600">Bucket</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600">DPD Min</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600">DPD Max</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600">Provision %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule, idx) => (
                        <tr key={rule.bucket} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="px-3 py-2 font-medium text-gray-700">{BUCKET_LABELS[rule.bucket]}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={rule.dpdMin}
                              onChange={e => updateProvisionRule(setter, idx, 'dpdMin', parseInt(e.target.value) || 0)}
                              className="w-20 border border-gray-200 rounded px-2 py-1.5 text-sm text-right font-mono focus:border-[#003366] outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={rule.dpdMax === 9999 ? '' : rule.dpdMax}
                              placeholder="∞"
                              onChange={e => updateProvisionRule(setter, idx, 'dpdMax', parseInt(e.target.value) || 9999)}
                              className="w-20 border border-gray-200 rounded px-2 py-1.5 text-sm text-right font-mono focus:border-[#003366] outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                value={rule.provisionPercent}
                                onChange={e => updateProvisionRule(setter, idx, 'provisionPercent', parseFloat(e.target.value) || 0)}
                                className="w-20 border border-gray-200 rounded px-2 py-1.5 text-sm text-right font-mono focus:border-[#003366] outline-none"
                              />
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Lender provisioning rates account for the security package (loan book assignment, guarantees, DSRA).
                With adequate collateral coverage, provisioning rates may be adjusted downward.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
