'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  const getToken = () => {
    const token = localStorage.getItem('dealer_token');

    if (!token) {
      window.location.href = '/dealer-login';
      return '';
    }

    return token;
  };

  const loadStaff = async () => {
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/staff-contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage('Unable to load staff contacts.');
    }
  };

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase();

    return staff.filter((item) => {
      const roleText = Array.isArray(item.roles) ? item.roles.join(' ') : '';

      return (
        !q ||
        String(item.name || '').toLowerCase().includes(q) ||
        String(item.email || '').toLowerCase().includes(q) ||
        roleText.toLowerCase().includes(q)
      );
    });
  }, [staff, search]);

  const grouped = useMemo(() => {
    return {
      Owner: filteredStaff.filter((item) => item.roles?.includes('OWNER')),
      'Trading Team': filteredStaff.filter((item) =>
        item.roles?.includes('TRADING_MANAGER'),
      ),
      'Stock Team': filteredStaff.filter((item) =>
        item.roles?.includes('STOCK_MANAGER'),
      ),
      'Accounts Team': filteredStaff.filter((item) =>
        item.roles?.includes('ACCOUNT_MANAGER'),
      ),
      'Customer Support': filteredStaff.filter((item) =>
        item.roles?.includes('CUSTOMER_MANAGER'),
      ),
    };
  }, [filteredStaff]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a href="/dealer-portal" className="text-sm font-black text-orange-300">
            ← Back to Dashboard
          </a>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">
                Aditya Solars Staff Directory
              </h1>

              <p className="mt-1 text-sm text-white/60">
                Contact trading, stock, accounts and support team for dealer communication.
              </p>
            </div>

            <input
              type="text"
              placeholder="Search staff or role..."
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
  const email = String(user.email || '');
  const initials = String(user.name || 'AS')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const copyEmail = async () => {
    if (!email) return;
    await navigator.clipboard.writeText(email);
    alert('Email copied');
  };

  return (
    <div className="overflow-hidden rounded-[2rem] bg-white text-slate-900 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="h-2 bg-gradient-to-r from-blue-700 via-sky-500 to-orange-400" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-700 to-orange-400 text-xl font-black text-white shadow-lg">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-black">{user.name || 'Staff Member'}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-500">
              {email || 'No email'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(Array.isArray(user.roles) ? user.roles : []).map((role: string) => (
            <span
              key={role}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"
            >
              {role.replaceAll('_', ' ')}
            </span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <a
            href={`mailto:${email}`}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white"
          >
            Email
          </a>

          <button
            onClick={copyEmail}
            className="rounded-2xl bg-orange-100 px-4 py-3 text-sm font-black text-orange-700"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}