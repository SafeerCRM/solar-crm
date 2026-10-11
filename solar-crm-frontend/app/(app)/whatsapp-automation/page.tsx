'use client';

import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const ROOT = '/webhooks/whatsapp/automation-management';

type Automation = {
  id: number;
  automationKey: string;
  name: string;
  description: string | null;
  triggerType: string;
  recipientType: string;
  isEnabled: boolean;
  effectiveEnabled: boolean;
  templateName: string | null;
  templateLanguage: string;
  triggerOffsetMinutes: number | null;
  repeatAfterMinutes: number | null;
  maxRepeatCount: number | null;
  updatedAt: string;
};

type Overview = {
  configuration: {
    globalAutomationsEnabled: boolean;
    sendMode: string;
    productionCredentialsConfigured: boolean;
    testCredentialsConfigured: boolean;
  };
  summary: Record<string, number>;
  automations: Automation[];
};

type Message = {
  id: number;
  direction: string;
  recipientType: string | null;
  recipientPhone: string;
  recipientName: string | null;
  messageType: string;
  templateName: string | null;
  messageBody: string | null;
  status: string;
  automationKey: string | null;
  referenceType: string | null;
  referenceId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
};

type MessageResponse = {
  data: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const statusOptions = ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RECEIVED', 'SKIPPED'];

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusClass(status: string) {
  if (['READ', 'DELIVERED', 'RECEIVED'].includes(status)) return 'bg-emerald-50 text-emerald-700';
  if (status === 'FAILED') return 'bg-red-50 text-red-700';
  if (status === 'SENT') return 'bg-blue-50 text-blue-700';
  return 'bg-amber-50 text-amber-700';
}

export default function WhatsappAutomationPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState('');
  const [status, setStatus] = useState('');
  const [automationKey, setAutomationKey] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setAuthorized(Array.isArray(user.roles) && user.roles.includes('OWNER'));
    } catch {
      setAuthorized(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    setError('');
    try {
      if (!API_BASE_URL) throw new Error('Backend API URL is not configured.');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please log in again.');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (direction) params.set('direction', direction);
      if (status) params.set('status', status);
      if (automationKey) params.set('automationKey', automationKey);
      if (search) params.set('search', search);
      const headers = { Authorization: `Bearer ${token}` };
      const [overviewResponse, messagesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}${ROOT}/overview`, { headers, cache: 'no-store' }),
        fetch(`${API_BASE_URL}${ROOT}/messages?${params}`, { headers, cache: 'no-store' }),
      ]);
      if (!overviewResponse.ok || !messagesResponse.ok) {
        const code = !overviewResponse.ok ? overviewResponse.status : messagesResponse.status;
        throw new Error(code === 403 ? 'OWNER permission is required.' : `Unable to load WhatsApp data (${code}).`);
      }
      const nextOverview: Overview = await overviewResponse.json();
      const nextMessages: MessageResponse = await messagesResponse.json();
      setOverview(nextOverview);
      setMessages(Array.isArray(nextMessages.data) ? nextMessages.data : []);
      setTotal(Number(nextMessages.total) || 0);
      setTotalPages(Number(nextMessages.totalPages) || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load WhatsApp data.');
    } finally {
      setLoading(false);
    }
  }, [authorized, page, direction, status, automationKey, search]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (authorized === null) return <div className="p-6 text-gray-600">Checking access...</div>;
  if (!authorized) return <div className="rounded-xl border bg-white p-6 text-red-700">Only the OWNER can access WhatsApp Automation Management.</div>;

  const summary = overview?.summary;
  const stats = [
    ['Outbound', summary?.outbound], ['Inbound', summary?.inbound],
    ['Pending', summary?.pending], ['Sent', summary?.sent],
    ['Delivered', summary?.delivered], ['Read', summary?.read],
    ['Failed', summary?.failed], ['Received', summary?.received],
  ] as const;
  const selectClass = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-2 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Automation Management</h1>
          <p className="mt-1 text-sm text-gray-500">OWNER dashboard · Live records · Read-only monitoring</p>
        </div>
        <button type="button" onClick={() => void loadData()} disabled={loading}
          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">System configuration</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Global automations', overview ? (overview.configuration.globalAutomationsEnabled ? 'Enabled' : 'Disabled') : '—'],
            ['Sending mode', overview?.configuration.sendMode || '—'],
            ['Production credentials', overview ? (overview.configuration.productionCredentialsConfigured ? 'Configured' : 'Missing') : '—'],
            ['Test credentials', overview ? (overview.configuration.testCredentialsConfigured ? 'Configured' : 'Missing') : '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">Configuration is informational. No controls on this page send messages or change automation settings.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value ?? '—'}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">Message counts reflect each record's latest status, not the number of historical delivery events.</p>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="font-semibold text-gray-900">Configured automations</h2>
          <p className="mt-1 text-xs text-gray-500">Individual configuration and effective global sending status</p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {(overview?.automations || []).map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="mt-1 break-all text-xs text-gray-500">{item.automationKey}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.effectiveEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {item.effectiveEnabled ? 'Effective ON' : 'Effective OFF'}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{item.description || 'No description'}</p>
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                <p>Individual switch: <strong>{item.isEnabled ? 'ON' : 'OFF'}</strong></p>
                <p>Trigger: {item.triggerType} · Recipient: {item.recipientType}</p>
                <p>Template: <span className="break-all">{item.templateName || 'Not configured'}</span> ({item.templateLanguage})</p>
                <p>Updated: {formatDate(item.updatedAt)}</p>
              </div>
            </div>
          ))}
          {overview && overview.automations.length === 0 && <p className="text-sm text-gray-500">No automation definitions found.</p>}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="font-semibold text-gray-900">Message history</h2>
          <p className="mt-1 text-xs text-gray-500">{total} matching records</p>
        </div>
        <form className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(event) => {
          event.preventDefault(); setPage(1); setSearch(searchInput.trim());
        }}>
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Phone, name, reference or message ID" className={`${selectClass} lg:col-span-2`} />
          <select value={direction} onChange={(e) => { setDirection(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">All directions</option><option value="OUTBOUND">Outbound</option><option value="INBOUND">Inbound</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">All statuses</option>
            {statusOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={automationKey} onChange={(e) => { setAutomationKey(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">All automations</option>
            {(overview?.automations || []).map((item) => <option key={item.automationKey} value={item.automationKey}>{item.name}</option>)}
            <option value="CUSTOMER_EXECUTION_RATING">Customer Execution Rating</option>
          </select>
          <div className="flex flex-wrap gap-2 lg:col-span-5">
            <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Search</button>
            <button type="button" className="rounded-xl border px-5 py-2.5 text-sm font-semibold" onClick={() => {
              setSearchInput(''); setSearch(''); setDirection(''); setStatus(''); setAutomationKey(''); setPage(1);
            }}>Clear filters</button>
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr><th className="px-4 py-3">Date (IST)</th><th className="px-4 py-3">Recipient / Sender</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Automation / Reference</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {messages.map((item) => (
                <tr key={item.id} className="align-top hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-4 text-gray-600">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-4"><div className="font-semibold text-gray-900">{item.recipientName || item.recipientPhone}</div><div className="text-xs text-gray-500">{item.recipientPhone} · {item.direction}</div></td>
                  <td className="max-w-xs px-4 py-4"><div className="break-words text-gray-800">{item.messageBody || item.templateName || '—'}</div><div className="mt-1 text-xs text-gray-500">{item.messageType}</div>{item.errorMessage && <div className="mt-2 break-words text-xs text-red-600">{item.errorCode ? `${item.errorCode}: ` : ''}{item.errorMessage}</div>}</td>
                  <td className="px-4 py-4 text-xs text-gray-600"><div className="break-all">{item.automationKey || 'Manual / unclassified'}</div><div className="mt-1">{item.referenceType || '—'} {item.referenceId || ''}</div></td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>{item.status}</span></td>
                </tr>
              ))}
              {!loading && messages.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-500">No messages found.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
          <p className="text-sm text-gray-500">Page {page} of {Math.max(1, totalPages)}</p>
          <div className="flex gap-2">
            <button type="button" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Previous</button>
            <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
