'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/authHeaders';

const API = process.env.NEXT_PUBLIC_API_BASE_URL;
const STATUS = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;
type Status = (typeof STATUS)[number];
type Store = {
  id: number; name: string; ownerName: string | null; primaryPhone: string;
  secondaryPhone: string | null; email: string | null; address: string | null;
  tehsil: string | null; district: string | null; state: string | null;
  shopPhotoUrl: string | null; linkedUserId: number | null; status: Status;
  onboardingAmount: number; marginPercentage: number;
  requiredPaymentPercentageOverride: number | null; createdAt: string;
};
type Payment = { id: number; amount: number; paymentDate: string; paymentMode: string | null; paymentReference: string | null; proofUrl: string | null; remarks: string | null };
type Summary = { onboardingAmount: number; receivedAmount: number; balanceAmount: number; status: string; payments: Payment[] };
type Audit = { id: number; action: string; fieldName: string; oldValue: string | null; newValue: string | null; changedByName: string | null; createdAt: string };
type FormData = {
  name: string; ownerName: string; primaryPhone: string; secondaryPhone: string;
  email: string; password: string; address: string; tehsil: string; district: string;
  state: string; shopPhotoUrl: string; onboardingAmount: string;
  marginPercentage: string; requiredPaymentPercentageOverride: string; status: Status;
};
const blank: FormData = {
  name: '', ownerName: '', primaryPhone: '', secondaryPhone: '', email: '', password: '',
  address: '', tehsil: '', district: '', state: 'Rajasthan', shopPhotoUrl: '',
  onboardingAmount: '150000', marginPercentage: '30', requiredPaymentPercentageOverride: '', status: 'ACTIVE',
};
const rupees = (n: number | string | null | undefined) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n || 0));
const dateText = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-IN') : '—';
const errText = (e: unknown) => axios.isAxiosError(e) ? String(e.response?.data?.message || e.message) : 'Something went wrong';
const inputStyle = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500';
const btn = 'rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-orange-700';
const lightBtn = 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50';

export default function SolarStorePage() {
  const [mode, setMode] = useState<'loading' | 'management' | 'store' | 'denied'>('loading');
  const [stores, setStores] = useState<Store[]>([]);
  const [mine, setMine] = useState<Store | null>(null);
  const [selected, setSelected] = useState<Store | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [form, setForm] = useState<FormData>(blank);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [payment, setPayment] = useState({ amount: '', paymentDate: new Date().toLocaleDateString('en-CA'), paymentMode: '', paymentReference: '', proofUrl: '', remarks: '' });

  const request = useCallback(async <T,>(method: 'get' | 'post' | 'patch', path: string, data?: unknown): Promise<T> => {
    if (!API) throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured');
    const response = await axios({ method, url: `${API.replace(/\/$/, '')}/solar-store${path}`, data, headers: getAuthHeaders() });
    return response.data as T;
  }, []);

  const loadList = useCallback(async (q = '', status = '') => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('search', q.trim());
    if (status) params.set('status', status);
    setStores(await request<Store[]>('get', `?${params.toString()}`));
  }, [request]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await request<Store[]>('get', '');
        if (active) { setStores(list); setMode('management'); }
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 403) {
          try {
            const profile = await request<Store>('get', '/me');
            if (active) { setMine(profile); setMode('store'); }
          } catch (inner) { if (active) { setError(errText(inner)); setMode('denied'); } }
        } else if (active) { setError(errText(e)); setMode('denied'); }
      }
    })();
    return () => { active = false; };
  }, [request]);

  const openStore = async (id: number) => {
    setBusy(true); setError(''); setNotice(''); setCreating(false); setEditing(false);
    try {
      const [profile, onboarding, history] = await Promise.all([
        request<Store>('get', `/${id}`), request<Summary>('get', `/${id}/onboarding`),
        request<Audit[]>('get', `/${id}/audit-history`),
      ]);
      setSelected(profile); setSummary(onboarding); setAudit(history);
    } catch (e) { setError(errText(e)); }
    finally { setBusy(false); }
  };

  const startEdit = () => {
    if (!selected) return;
    setForm({
      name: selected.name, ownerName: selected.ownerName || '', primaryPhone: selected.primaryPhone,
      secondaryPhone: selected.secondaryPhone || '', email: selected.email || '', password: '',
      address: selected.address || '', tehsil: selected.tehsil || '', district: selected.district || '',
      state: selected.state || '', shopPhotoUrl: selected.shopPhotoUrl || '',
      onboardingAmount: String(selected.onboardingAmount), marginPercentage: String(selected.marginPercentage),
      requiredPaymentPercentageOverride: selected.requiredPaymentPercentageOverride == null ? '' : String(selected.requiredPaymentPercentageOverride),
      status: selected.status,
    });
    setEditing(true); setCreating(false);
  };

  const submitStore = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const { password, status, ...rest } = form;
      const payload = {
        ...rest,
        onboardingAmount: Number(form.onboardingAmount), marginPercentage: Number(form.marginPercentage),
        requiredPaymentPercentageOverride: form.requiredPaymentPercentageOverride === '' ? null : Number(form.requiredPaymentPercentageOverride),
        ...(creating ? { password } : { status, ...(password ? { password } : {}) }),
      };
      if (creating) {
        const created = await request<Store>('post', '', payload);
        setCreating(false); await loadList(search, statusFilter); await openStore(created.id);
        setNotice('Solar Store and linked CRM login created.');
      } else if (selected) {
        await request<Store>('patch', `/${selected.id}`, payload);
        setEditing(false); await loadList(search, statusFilter); await openStore(selected.id);
        setNotice('Solar Store updated.');
      }
    } catch (e) { setError(errText(e)); }
    finally { setBusy(false); }
  };

  const submitPayment = async (e: FormEvent) => {
    e.preventDefault(); if (!selected) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await request('post', `/${selected.id}/onboarding/payments`, { ...payment, amount: Number(payment.amount) });
      setPayment({ amount: '', paymentDate: new Date().toLocaleDateString('en-CA'), paymentMode: '', paymentReference: '', proofUrl: '', remarks: '' });
      await openStore(selected.id); setNotice('Onboarding payment recorded.');
    } catch (e) { setError(errText(e)); }
    finally { setBusy(false); }
  };

  const field = (key: keyof FormData, label: string, type = 'text', required = false) => (
    <label className="block text-sm font-medium text-slate-700" key={key}>
      <span className="mb-1 block">{label}</span>
      <input className={inputStyle} type={type} required={required} value={form[key]}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} />
    </label>
  );

  if (mode === 'loading') return <div className="p-6">Loading Solar Store…</div>;
  if (mode === 'denied') return <div className="p-6"><h1 className="text-xl font-bold">Solar Store</h1><p className="mt-3 text-red-600">{error || 'Access unavailable'}</p></div>;

  return <main className="mx-auto max-w-7xl space-y-5 p-4 pb-16 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-slate-900">Solar Store</h1><p className="text-sm text-slate-500">{mode === 'management' ? 'Store registration, profiles and onboarding' : 'Your registered store profile and CRM workspace'}</p></div>
      {mode === 'management' && <button className={btn} onClick={() => { setCreating(true); setEditing(false); setSelected(null); setForm(blank); setError(''); setNotice(''); }}>+ Register Solar Store</button>}
    </div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

    {mode === 'store' && mine && <>
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{mine.name}</h2><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">{mine.status}</span></div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <p><b>Store owner:</b> {mine.ownerName || '—'}</p><p><b>Phone:</b> {mine.primaryPhone}</p><p><b>Email:</b> {mine.email || '—'}</p>
          <p><b>Tehsil:</b> {mine.tehsil || '—'}</p><p><b>District:</b> {mine.district || '—'}</p><p><b>State:</b> {mine.state || '—'}</p>
          <p className="sm:col-span-2"><b>Address:</b> {mine.address || '—'}</p>
        </div>
        {mine.shopPhotoUrl && <a href={mine.shopPhotoUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-orange-700 underline">View store photo</a>}
      </section>
      <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-3 text-lg font-semibold">CRM workspace</h2>
        <p className="mb-4 text-sm text-slate-600">Use your existing CRM pages for leads, follow-ups, meetings and projects. Project operations remain in the standard Project Detail workflow.</p>
        <div className="flex flex-wrap gap-2">
          <Link className={lightBtn} href="/leads">Leads</Link><Link className={lightBtn} href="/meetings">Meetings</Link><Link className={lightBtn} href="/projects">Projects</Link>
        </div>
      </section>
    </>}

    {mode === 'management' && <>
      <form className="flex flex-wrap gap-2 rounded-xl border bg-white p-4" onSubmit={async e => { e.preventDefault(); setError(''); try { await loadList(search, statusFilter); } catch (err) { setError(errText(err)); } }}>
        <input className={`${inputStyle} min-w-48 flex-1`} placeholder="Search store, owner, phone, tehsil, district" value={search} onChange={e => setSearch(e.target.value)} />
        <select className={`${inputStyle} sm:w-44`} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All statuses</option>{STATUS.map(s => <option key={s}>{s}</option>)}</select>
        <button className={btn} type="submit">Search</button><button className={lightBtn} type="button" onClick={async () => { setSearch(''); setStatusFilter(''); try { await loadList(); } catch (err) { setError(errText(err)); } }}>Reset</button>
      </form>
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,360px)_1fr]">
        <section className="space-y-2"><h2 className="text-base font-semibold">Registered stores ({stores.length})</h2>
          {stores.length === 0 && <p className="rounded-xl border bg-white p-4 text-sm text-slate-500">No stores found.</p>}
          {stores.map(s => <button key={s.id} onClick={() => openStore(s.id)} className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm hover:border-orange-400 ${selected?.id === s.id ? 'border-orange-500' : ''}`}>
            <div className="flex justify-between gap-2"><b className="text-slate-900">{s.name}</b><span className="text-xs text-slate-500">{s.status}</span></div>
            <p className="mt-1 text-sm text-slate-600">{s.ownerName || 'Owner not specified'} · {s.primaryPhone}</p><p className="mt-1 text-xs text-slate-500">{[s.tehsil, s.district].filter(Boolean).join(', ') || 'Location not specified'}</p>
          </button>)}
        </section>
        <section className="min-w-0 space-y-4">
          {(creating || editing) && <form onSubmit={submitStore} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex justify-between gap-2"><h2 className="text-lg font-semibold">{creating ? 'Register Solar Store' : `Edit ${selected?.name}`}</h2><button className={lightBtn} type="button" onClick={() => { setCreating(false); setEditing(false); }}>Cancel</button></div>
            <div className="grid gap-4 sm:grid-cols-2">{field('name', 'Store name', 'text', true)}{field('ownerName', 'Owner name')}{field('primaryPhone', 'Primary phone', 'tel', true)}{field('secondaryPhone', 'Secondary phone', 'tel')}{field('email', 'CRM login email', 'email', true)}{field('password', creating ? 'CRM password (minimum 8 characters)' : 'New password (leave blank to keep existing)', 'password', creating)}{field('tehsil', 'Tehsil')}{field('district', 'District')}{field('state', 'State')}{field('address', 'Address')}{field('shopPhotoUrl', 'Shop photo URL', 'url')}{field('onboardingAmount', 'Onboarding amount (₹)', 'number', true)}{field('marginPercentage', 'Net profit share (%)', 'number', true)}{field('requiredPaymentPercentageOverride', 'Payment threshold override (%) — optional', 'number')}
              {editing && <label className="block text-sm font-medium text-slate-700"><span className="mb-1 block">Status</span><select className={inputStyle} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Status }))}>{STATUS.map(s => <option key={s}>{s}</option>)}</select></label>}
            </div>
            <p className="text-xs text-slate-500">The backend creates the linked SOLAR_STORE CRM user automatically. Payment override blank uses the backend default.</p>
            <button disabled={busy} className={btn} type="submit">{busy ? 'Saving…' : creating ? 'Create store and login' : 'Save changes'}</button>
          </form>}
          {!creating && selected && <>
            <section className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap justify-between gap-2"><div><h2 className="text-xl font-semibold">{selected.name}</h2><p className="text-sm text-slate-500">Store #{selected.id} · CRM User #{selected.linkedUserId || '—'}</p></div><button className={lightBtn} onClick={startEdit}>Edit store</button></div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><p><b>Owner:</b> {selected.ownerName || '—'}</p><p><b>Status:</b> {selected.status}</p><p><b>Primary phone:</b> {selected.primaryPhone}</p><p><b>Secondary phone:</b> {selected.secondaryPhone || '—'}</p><p><b>Email:</b> {selected.email || '—'}</p><p><b>Tehsil:</b> {selected.tehsil || '—'}</p><p><b>District:</b> {selected.district || '—'}</p><p><b>State:</b> {selected.state || '—'}</p><p><b>Address:</b> {selected.address || '—'}</p><p><b>Net profit share:</b> {selected.marginPercentage}%</p><p><b>Payment threshold override:</b> {selected.requiredPaymentPercentageOverride == null ? 'Default' : `${selected.requiredPaymentPercentageOverride}%`}</p></div>
              {selected.shopPhotoUrl && <a className="mt-3 inline-block text-sm text-orange-700 underline" href={selected.shopPhotoUrl} target="_blank" rel="noopener noreferrer">View store photo</a>}
            </section>
            {summary && <section className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Onboarding payments</h2>
              <div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Agreed amount</p><b>{rupees(summary.onboardingAmount)}</b></div><div><p className="text-xs text-slate-500">Received</p><b>{rupees(summary.receivedAmount)}</b></div><div><p className="text-xs text-slate-500">Balance · {summary.status}</p><b>{rupees(summary.balanceAmount)}</b></div></div>
              <form className="space-y-3 border-t pt-4" onSubmit={submitPayment}><h3 className="font-semibold">Record payment</h3><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Amount (₹)<input className={inputStyle} type="number" min="0.01" step="0.01" required value={payment.amount} onChange={e => setPayment(p => ({ ...p, amount: e.target.value }))} /></label><label className="text-sm">Payment date<input className={inputStyle} type="date" required value={payment.paymentDate} onChange={e => setPayment(p => ({ ...p, paymentDate: e.target.value }))} /></label><label className="text-sm">Mode<input className={inputStyle} value={payment.paymentMode} onChange={e => setPayment(p => ({ ...p, paymentMode: e.target.value }))} /></label><label className="text-sm">Reference<input className={inputStyle} value={payment.paymentReference} onChange={e => setPayment(p => ({ ...p, paymentReference: e.target.value }))} /></label><label className="text-sm">Proof URL<input className={inputStyle} type="url" value={payment.proofUrl} onChange={e => setPayment(p => ({ ...p, proofUrl: e.target.value }))} /></label><label className="text-sm">Remarks<input className={inputStyle} value={payment.remarks} onChange={e => setPayment(p => ({ ...p, remarks: e.target.value }))} /></label></div><button className={btn} disabled={busy || summary.balanceAmount <= 0}>Record payment</button></form>
              <div className="overflow-x-auto"><table className="w-full min-w-[550px] text-left text-sm"><thead><tr className="border-b"><th className="p-2">Date</th><th className="p-2">Amount</th><th className="p-2">Mode</th><th className="p-2">Reference</th><th className="p-2">Proof</th></tr></thead><tbody>{summary.payments.map(p => <tr key={p.id} className="border-b"><td className="p-2">{p.paymentDate}</td><td className="p-2">{rupees(p.amount)}</td><td className="p-2">{p.paymentMode || '—'}</td><td className="p-2">{p.paymentReference || '—'}</td><td className="p-2">{p.proofUrl ? <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="text-orange-700 underline">View</a> : '—'}</td></tr>)}</tbody></table>{summary.payments.length === 0 && <p className="py-3 text-sm text-slate-500">No payments recorded.</p>}</div>
            </section>}
            <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-3 text-lg font-semibold">Financial and status change history</h2>{audit.length === 0 ? <p className="text-sm text-slate-500">No changes recorded.</p> : <div className="space-y-3">{audit.map(a => <div key={a.id} className="border-b pb-3 text-sm"><p className="font-medium">{a.fieldName}: {a.oldValue ?? '—'} → {a.newValue ?? '—'}</p><p className="text-xs text-slate-500">{a.action} · {a.changedByName || 'System'} · {dateText(a.createdAt)}</p></div>)}</div>}</section>
          </>}
          {!creating && !selected && <div className="rounded-xl border bg-white p-6 text-sm text-slate-500">Select a store to view its details, or register a new store.</div>}
          {busy && <p className="text-sm text-slate-500">Working…</p>}
        </section>
      </div>
    </>}
  </main>;
}
