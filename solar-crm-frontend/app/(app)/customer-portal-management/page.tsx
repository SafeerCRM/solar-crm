'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const cards = [
  {
    title: 'Customer Complaints',
    description: 'View, assign, update and close customer complaints.',
    href: '/customer-complaints',
    icon: '🛠',
    key: 'openComplaints',
    label: 'Open',
  },
  {
    title: 'Payment Receipts',
    description: 'Verify uploaded receipts, approve or reject with remarks.',
    href: '/customer-payment-receipts',
    icon: '💳',
    key: 'pendingReceipts',
    label: 'Pending',
  },
  {
    title: 'Work Date Requests',
    description: 'Approve, reject or reschedule customer requested work dates.',
    href: '/customer-work-requests',
    icon: '📅',
    key: 'pendingWorkRequests',
    label: 'Pending',
  },
  {
    title: 'Cleaning Reminders',
    description: 'Track cleaning requests, reminders and maintenance updates.',
    href: '/customer-cleaning-reminders',
    icon: '🧽',
    key: 'pendingCleaning',
    label: 'Pending',
  },
];

export default function CustomerPortalManagementPage() {
  const [stats, setStats] = useState<any>({
    openComplaints: 0,
    pendingReceipts: 0,
    pendingWorkRequests: 0,
    pendingCleaning: 0,
    pendingReferrals: 0,
    portal: 'Live',
  });
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);

      const [
  complaintsRes,
  receiptsRes,
  workRequestsRes,
  cleaningRes,
] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/customer-portal/complaints`, {
          params: { page: 1, limit: 1, status: 'OPEN' },
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/customer-portal/payment-receipts`, {
          params: { page: 1, limit: 1, status: 'SUBMITTED' },
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/customer-portal/work-date-requests`, {
          params: { page: 1, limit: 1, status: 'PENDING' },
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/customer-portal/cleaning-reminders`, {
          params: { page: 1, limit: 1, status: 'PENDING' },
          headers: getAuthHeaders(),
        }),
      ]);

      setStats({
        openComplaints:
          complaintsRes.status === 'fulfilled'
            ? Number(complaintsRes.value.data?.total || 0)
            : 0,
        pendingReceipts:
          receiptsRes.status === 'fulfilled'
            ? Number(receiptsRes.value.data?.total || 0)
            : 0,
        pendingWorkRequests:
          workRequestsRes.status === 'fulfilled'
            ? Number(workRequestsRes.value.data?.total || 0)
            : 0,
        pendingCleaning:
          cleaningRes.status === 'fulfilled'
            ? Number(cleaningRes.value.data?.total || 0)
            : 0,
      });
    } catch (error) {
      console.error('Customer portal stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>

            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              Customer Portal Management
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-medium text-white/90">
              Manage customer complaints, payment receipts, work date requests,
              cleaning reminders, referrals and customer-facing portal testing from
              one place.
            </p>
          </div>

          <button
            onClick={loadStats}
            className="rounded-2xl bg-white/20 px-5 py-3 text-sm font-black backdrop-blur hover:bg-white/30"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Open Complaints" value={stats.openComplaints} />
        <SummaryCard title="Pending Receipts" value={stats.pendingReceipts} />
        <SummaryCard title="Work Requests" value={stats.pendingWorkRequests} />
        <SummaryCard title="Cleaning Pending" value={stats.pendingCleaning} />
      </section>

      <section className="rounded-3xl bg-white p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Customer Work Center
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Live workload summary with quick access to each customer section.
            </p>
          </div>

          <Link
            href="/settings/portal"
            className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white hover:bg-black"
          >
            Portal Settings
          </Link>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl border bg-gray-50 p-5 transition hover:-translate-y-1 hover:border-orange-300 hover:bg-orange-50 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow">
                  {item.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black text-gray-900">
                      {item.title}
                    </h3>

                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                      {item.label}: {stats[item.key]}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-2xl font-black text-gray-900">
          Handover Checklist
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ChecklistItem text="Customer login and dashboard opens correctly" />
          <ChecklistItem text="Customer complaints with photo/audio timeline tested" />
          <ChecklistItem text="Payment receipt upload and verification flow tested" />
          <ChecklistItem text="Work date request approval/rejection visible to customer" />
          <ChecklistItem text="Cleaning reminder request and status update tested" />
          <ChecklistItem text="Notifications read/unread counts tested" />
          <ChecklistItem text="Documents open/download on web and APK" />
          <ChecklistItem text="Customer APK created and tested separately" />
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <p className="text-sm font-bold text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-gray-900">
        {String(value ?? 0)}
      </p>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 text-sm font-bold text-gray-700">
      ✅ {text}
    </div>
  );
}