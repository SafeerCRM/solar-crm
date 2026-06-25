'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerCleaningCalendarPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [form, setForm] = useState({
    projectId: '',
    cleaningDate: '',
    remarks: '',
  });

  const projects = dashboard?.projects || [];
  const reminders = dashboard?.cleaningReminders || [];
  const upcomingReminders = reminders
  .filter((item: any) => item.status === 'PENDING')
  .sort(
    (a: any, b: any) =>
      new Date(a.cleaningDate || '').getTime() -
      new Date(b.cleaningDate || '').getTime(),
  );

const nextCleaning = upcomingReminders[0];

const filteredReminders = reminders.filter((item: any) => {
  if (statusFilter === 'ALL') return true;
  return item.status === statusFilter;
});

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('customer_token');

      if (!token) {
        window.location.href = '/customer-login';
        return;
      }

      const res = await fetch(`${API_BASE_URL}/customer-auth/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        window.location.href = '/customer-login';
        return;
      }

      setDashboard(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const submitCleaningRequest = async () => {
    if (!form.projectId) {
      alert('Please select project');
      return;
    }

    if (!form.cleaningDate) {
      alert('Please select cleaning date');
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem('customer_token');
      const selectedProject = projects.find(
        (project: any) => String(project.id) === String(form.projectId),
      );

      const res = await fetch(`${API_BASE_URL}/customer-auth/cleaning-reminders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          projectName: selectedProject?.customerName || '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || 'Failed to submit cleaning request');
        return;
      }

      alert('Cleaning request submitted');

      setForm({
        projectId: '',
        cleaningDate: '',
        remarks: '',
      });

      loadDashboard();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50">
        <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-3xl">
            🧽
          </div>
          <p className="text-sm font-semibold text-gray-600">
            Loading cleaning calendar...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <a href="/customer-portal" className="text-sm font-black text-white/90">
            ← Back to Dashboard
          </a>

          <h1 className="mt-3 text-4xl font-black">🧽 Cleaning Calendar</h1>

          <p className="mt-2 max-w-3xl text-sm text-white/90">
            Request panel cleaning, view upcoming cleaning dates and track service status.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <HeroCard title="Total Requests" value={String(reminders.length)} />
            <HeroCard
              title="Pending"
              value={String(reminders.filter((x: any) => x.status === 'PENDING').length)}
            />
            <HeroCard
              title="Completed"
              value={String(reminders.filter((x: any) => x.status === 'COMPLETED').length)}
            />
            <HeroCard
              title="Postponed"
              value={String(reminders.filter((x: any) => x.status === 'POSTPONED').length)}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl">

            <div className="rounded-[2rem] bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-xl lg:col-span-3">
  <h2 className="text-2xl font-black">
    Next Cleaning
  </h2>

  {nextCleaning ? (
    <div className="mt-4 grid gap-4 md:grid-cols-4">
      <InfoBox label="Project" value={`#${nextCleaning.projectId || '-'}`} light />
      <InfoBox
        label="Date"
        value={
          nextCleaning.cleaningDate
            ? new Date(nextCleaning.cleaningDate).toLocaleDateString('en-IN')
            : '-'
        }
        light
      />
      <InfoBox label="Status" value={formatLabel(nextCleaning.status)} light />
      <InfoBox label="Remarks" value={nextCleaning.remarks || '-'} light />
    </div>
  ) : (
    <p className="mt-3 text-sm font-semibold">
      No upcoming cleaning scheduled.
    </p>
  )}
</div>
            <h2 className="text-2xl font-black text-gray-900">
              Request Cleaning
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Select your project and preferred cleaning date.
            </p>

            <div className="mt-5 space-y-3">
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full rounded-2xl border p-3"
              >
                <option value="">Select Project</option>
                {projects.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    Project #{project.id} - {project.customerName}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={form.cleaningDate}
                onChange={(e) => setForm({ ...form, cleaningDate: e.target.value })}
                className="w-full rounded-2xl border p-3"
              />

              <textarea
                rows={4}
                placeholder="Remarks / preferred time / issue"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="w-full rounded-2xl border p-3"
              />

              <button
                onClick={submitCleaningRequest}
                disabled={saving}
                className="w-full rounded-2xl bg-orange-500 py-3 font-black text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? 'Submitting...' : 'Submit Cleaning Request'}
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl lg:col-span-2">
            <h2 className="text-2xl font-black text-gray-900">
              Cleaning History
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
  {['ALL', 'PENDING', 'COMPLETED', 'POSTPONED', 'CANCELLED'].map((item) => (
    <button
      key={item}
      onClick={() => setStatusFilter(item)}
      className={`rounded-2xl px-4 py-2 text-xs font-black ${
        statusFilter === item
          ? 'bg-gray-900 text-white'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      {formatLabel(item)}
    </button>
  ))}
</div>

            <div className="mt-5 space-y-4">
              {filteredReminders.length === 0 ? (
                <EmptyCard text="No cleaning requests or reminders yet." />
              ) : (
                filteredReminders.map((item: any) => (
                  <div key={item.id} className="rounded-3xl border bg-gray-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-gray-900">
                          Cleaning #{item.id}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Project #{item.projectId} · Date:{' '}
                          {item.cleaningDate
                            ? new Date(item.cleaningDate).toLocaleDateString('en-IN')
                            : '-'}
                        </p>
                      </div>

                      <StatusBadge status={item.status} />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
  <InfoBox label="Project" value={`#${item.projectId || '-'}`} />
  <InfoBox
    label="Cleaning Date"
    value={
      item.cleaningDate
        ? new Date(item.cleaningDate).toLocaleDateString('en-IN')
        : '-'
    }
  />
  <InfoBox
    label="Next Cleaning"
    value={
      item.nextCleaningDate
        ? new Date(item.nextCleaningDate).toLocaleDateString('en-IN')
        : '-'
    }
  />
</div>

                    {item.nextCleaningDate && (
                      <p className="mt-3 text-sm font-semibold text-emerald-700">
                        Next Cleaning:{' '}
                        {new Date(item.nextCleaningDate).toLocaleDateString('en-IN')}
                      </p>
                    )}

                    {item.remarks && (
                      <div className="mt-3 rounded-2xl bg-white p-4">
                        <p className="text-xs font-bold text-gray-500">Remarks</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {item.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoBox({
  label,
  value,
  light,
}: {
  label: string;
  value?: string;
  light?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3 ${
        light ? 'bg-white/20' : 'bg-white'
      }`}
    >
      <p
        className={`text-xs font-bold ${
          light ? 'text-white/80' : 'text-gray-500'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm font-black ${
          light ? 'text-white' : 'text-gray-900'
        }`}
      >
        {value || '-'}
      </p>
    </div>
  );
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}

function HeroCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/20 p-4 backdrop-blur">
      <p className="text-xs font-bold opacity-90">{title}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const value = status || 'PENDING';

  const color =
    value === 'COMPLETED'
      ? 'bg-emerald-100 text-emerald-700'
      : value === 'CANCELLED'
        ? 'bg-red-100 text-red-700'
        : value === 'POSTPONED'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-amber-100 text-amber-700';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${color}`}>
      {String(value).replaceAll('_', ' ')}
    </span>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed p-6 text-center text-sm font-semibold text-gray-500">
      {text}
    </div>
  );
}