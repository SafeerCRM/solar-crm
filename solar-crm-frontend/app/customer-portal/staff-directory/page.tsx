'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  const getToken = () => {
    const token = localStorage.getItem('customer_token');

    if (!token) {
      window.location.href = '/customer-login';
      return '';
    }

    return token;
  };

  const loadStaff = async () => {
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE_URL}/customer-auth/staff-directory`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Unable to load staff contacts.');
        return;
      }

      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage('Unable to load staff contacts.');
    }
  };

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase();

    return staff.filter((item) => {
      const name = item.publicDisplayName || item.fullName || '';
      const phone = item.publicPhone || item.mobile || '';
      const email = item.publicEmail || item.email || '';
      const designation = item.publicDesignation || item.designation || '';
      const department = item.department || '';

      return (
        !q ||
        String(name).toLowerCase().includes(q) ||
        String(phone).toLowerCase().includes(q) ||
        String(email).toLowerCase().includes(q) ||
        String(designation).toLowerCase().includes(q) ||
        String(department).toLowerCase().includes(q)
      );
    });
  }, [staff, search]);

  const grouped = useMemo(() => {
    const result: Record<string, any[]> = {};

    filteredStaff.forEach((item) => {
      const department = item.department || 'Support Team';
      if (!result[department]) result[department] = [];
      result[department].push(item);
    });

    return result;
  }, [filteredStaff]);

  return (
    <main className="min-h-screen w-screen max-w-full overflow-x-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/25 blur-3xl" />
<div className="pointer-events-none fixed right-[-120px] top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-full overflow-x-hidden px-4 py-6 lg:max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a href="/customer-portal" className="text-sm font-black text-orange-300">
            ← Back to Dashboard
          </a>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">
                Staff Directory
              </h1>

              <p className="mt-1 text-sm text-white/60">
                Contact your project team, subsidy department, electricity department, payment department and customer support.
              </p>
            </div>

            <input
              type="text"
              placeholder="Search staff, phone, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none"
            />
          </div>
        </header>

        {message && (
          <p className="mt-5 rounded-2xl bg-red-100 p-3 text-center text-sm font-bold text-red-700">
            {message}
          </p>
        )}

        <section className="mt-6 space-y-8">
          {!filteredStaff.length && (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-white/70">
              No customer-visible staff contacts found.
            </div>
          )}

          {Object.entries(grouped).map(([groupName, users]) => (
            <StaffGroup key={groupName} title={groupName} users={users} />
          ))}
        </section>
      </div>
    </main>
  );
}

function StaffGroup({ title, users }: { title: string; users: any[] }) {
  if (!users.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-black">{title}</h2>
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white/70">
          {users.length} contacts
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <StaffCard key={`${title}-${user.id}`} user={user} />
        ))}
      </div>
    </section>
  );
}

function StaffCard({ user }: { user: any }) {
  const name = user.publicDisplayName || user.fullName || 'Staff Member';
  const phone = user.publicPhone || user.mobile || '';
  const email = user.publicEmail || user.email || '';
  const designation = user.publicDesignation || user.designation || '';
  const photoUrl = user.photoUrl || '';
  const remarks = user.remarks || '';

  const initials = String(name)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const copyContact = async () => {
    const text = [name, phone, email].filter(Boolean).join(' | ');
    if (!text) return;

    await navigator.clipboard.writeText(text);
    alert('Contact copied');
  };

  const whatsappText = encodeURIComponent(
    `Hello ${name}, I am an Aditya Solars customer and need assistance regarding my solar project.`,
  );

  return (
    <div className="overflow-hidden rounded-[2rem] bg-white text-slate-900 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="h-2 bg-gradient-to-r from-blue-700 via-sky-500 to-orange-400" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="h-16 w-16 shrink-0 rounded-3xl object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-700 to-orange-400 text-xl font-black text-white shadow-lg">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-lg font-black">{name}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-500">
              {designation || 'Company Staff'}
            </p>
            <p className="mt-1 truncate text-xs font-bold text-slate-400">
              {user.department || '-'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 text-sm">
          <Info label="Phone" value={phone || '-'} />
          <Info label="Email" value={email || '-'} />
        </div>

        {remarks && (
          <div className="mt-4 rounded-2xl bg-blue-50 p-3">
            <p className="text-xs font-black text-blue-500">Remarks</p>
            <p className="mt-1 text-sm font-semibold text-blue-900">
              {remarks}
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <a
            href={phone ? `tel:${phone}` : '#'}
            className={`rounded-2xl px-4 py-3 text-center text-sm font-black text-white ${
              phone ? 'bg-green-600' : 'pointer-events-none bg-slate-300'
            }`}
          >
            Call
          </a>

          <a
            href={phone ? `https://wa.me/91${phone}?text=${whatsappText}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-2xl px-4 py-3 text-center text-sm font-black text-white ${
              phone ? 'bg-emerald-600' : 'pointer-events-none bg-slate-300'
            }`}
          >
            WhatsApp
          </a>

          <a
            href={email ? `mailto:${email}` : '#'}
            className={`rounded-2xl px-4 py-3 text-center text-sm font-black text-white ${
              email ? 'bg-slate-950' : 'pointer-events-none bg-slate-300'
            }`}
          >
            Email
          </a>

          <button
            onClick={copyContact}
            className="rounded-2xl bg-orange-100 px-4 py-3 text-sm font-black text-orange-700"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words font-black">{value}</p>
    </div>
  );
}