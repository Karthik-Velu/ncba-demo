'use client';

import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { Server, CheckCircle2, Loader2, AlertTriangle, Shield, Wifi, FolderOpen, Key, Clock } from 'lucide-react';

const TEST_STAGES = [
  'Resolving hostname...',
  'Connecting to port 22...',
  'Authenticating with SSH key...',
  'Listing remote directory...',
  'Found 3 files in /exports/loanbook/',
  'Verifying file format (CSV, 11 columns)...',
  'Connection test complete!',
];

export default function SFTPConfigPage() {
  const { user } = useApp();
  const router = useRouter();

  const [host, setHost] = useState('sftp.premiercredit.co.ke');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('lender_sync');
  const [remotePath, setRemotePath] = useState('/exports/loanbook/');
  const [authMethod, setAuthMethod] = useState<'key' | 'password'>('key');
  const [schedule, setSchedule] = useState('daily_06');

  const [testing, setTesting] = useState(false);
  const [testStage, setTestStage] = useState(-1);
  const [testDone, setTestDone] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'nbfi_user') router.push('/');
  }, [user, router]);

  const runTest = useCallback(() => {
    setTesting(true);
    setTestStage(0);
    setTestDone(false);
    let i = 0;
    const tick = () => {
      i++;
      if (i < TEST_STAGES.length) {
        setTestStage(i);
        setTimeout(tick, 500);
      } else {
        setTesting(false);
        setTestDone(true);
      }
    };
    setTimeout(tick, 500);
  }, []);

  const handleSave = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, []);

  if (!user || user.role !== 'nbfi_user') return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Wifi className="w-6 h-6 text-emerald-600" />
              SFTP Configuration
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Set up your SFTP connection so the lender can automatically pull your daily loan book data.
            </p>
          </div>

          {/* Connection Settings */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-emerald-600" /> Connection Settings
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">SFTP Hostname</label>
                <input type="text" value={host} onChange={e => setHost(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Port</label>
                <input type="text" value={port} onChange={e => setPort(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Authentication</label>
                <select value={authMethod} onChange={e => setAuthMethod(e.target.value as 'key' | 'password')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none bg-white">
                  <option value="key">SSH Key</option>
                  <option value="password">Password</option>
                </select>
              </div>
            </div>
            {authMethod === 'key' && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">SSH Public Key</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Add this public key to your SFTP server&apos;s authorized_keys file:
                    </p>
                    <code className="block mt-2 p-3 bg-white rounded text-xs font-mono text-gray-700 break-all border border-emerald-100">
                      ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7...platform@kaleidofin.com
                    </code>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Remote Path & Schedule */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
              <FolderOpen className="w-4 h-4 text-emerald-600" /> File Path & Schedule
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Remote Directory Path</label>
                <input type="text" value={remotePath} onChange={e => setRemotePath(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pull Schedule</label>
                <select value={schedule} onChange={e => setSchedule(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none bg-white">
                  <option value="daily_06">Daily at 06:00 EAT</option>
                  <option value="daily_12">Daily at 12:00 EAT</option>
                  <option value="daily_18">Daily at 18:00 EAT</option>
                  <option value="hourly">Every hour</option>
                </select>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                The platform will look for files matching <code className="bg-white px-1 py-0.5 rounded text-emerald-700">loanbook_*.csv</code> in the specified directory.
                Files should contain 11 columns: Loan ID, Application ID, DPD, Balance, Disbursed Amount, Overdue, Date, Rate, Written Off, Repossession, Recovery.
              </p>
            </div>
          </section>

          {/* Test Connection */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-600" /> Test Connection
            </h2>
            <button onClick={runTest} disabled={testing}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            {testStage >= 0 && (
              <div className="mt-4 space-y-2">
                {TEST_STAGES.map((label, i) => {
                  const done = i < testStage || (i === TEST_STAGES.length - 1 && testDone);
                  const active = i === testStage && !testDone;
                  const pending = i > testStage;
                  return (
                    <div key={i} className={`flex items-center gap-2 text-sm ${
                      done ? 'text-green-600' : active ? 'text-emerald-700 font-medium' : 'text-gray-400'
                    }`}>
                      {done && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {active && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
                      {pending && <span className="w-4 h-4 rounded-full border border-gray-300 inline-block" />}
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {testDone && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Connection Successful</p>
                  <p className="text-xs text-green-600">SFTP server is reachable and files are accessible at {remotePath}</p>
                </div>
              </div>
            )}
          </section>

          {/* Save */}
          <div className="flex items-center gap-4">
            <button onClick={handleSave}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors">
              Save Configuration
            </button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" /> Configuration saved
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
