'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type PaymentReceipt = {
  id: number;
  customerId?: number;
  customerCode?: string;
  customerName?: string;
  projectId?: number;
  projectName?: string;
  branchName?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  amount?: number;
  paymentMode?: string;
  transactionId?: string;
  paymentDate?: string;
  customerRemarks?: string;
  status?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  verificationRemarks?: string;
  createdAt?: string;
};

const STATUS_OPTIONS = ['SUBMITTED', 'VERIFIED', 'REJECTED'];
const PAYMENT_MODES = ['UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'OTHER'];

export default function CustomerPaymentReceiptsPage() {
  const [items, setItems] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    customerSearch: '',
    branchName: '',
    projectId: '',
    status: '',
    paymentMode: '',
    fromDate: '',
    toDate: '',
  });

  const [editMap, setEditMap] = useState<Record<number, any>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchReceipts = async (targetPage = page) => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/customer-portal/payment-receipts`,
        {
          params: {
            page: targetPage,
            limit,
            ...filters,
          },
          headers: getHeaders(),
        },
      );

      const data = res.data?.data || [];

      setItems(data);
      setPage(res.data?.page || targetPage);
      setTotalPages(res.data?.totalPages || 1);

      const nextEditMap: Record<number, any> = {};
      data.forEach((item: PaymentReceipt) => {
        nextEditMap[item.id] = {
          status: item.status || 'SUBMITTED',
          verificationRemarks: item.verificationRemarks || '',
        };
      });

      setEditMap(nextEditMap);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to load payment receipts');
    } finally {
      setLoading(false);
    }
  };

  const updateReceipt = async (item: PaymentReceipt) => {
    const update = editMap[item.id];

    if (!update?.status) {
      alert('Please select status');
      return;
    }

    if (
      ['VERIFIED', 'REJECTED'].includes(update.status) &&
      !String(update.verificationRemarks || '').trim()
    ) {
      alert('Verification remarks are required');
      return;
    }

    try {
      setSavingId(item.id);

      await axios.patch(
        `${API_BASE_URL}/customer-portal/payment-receipts/${item.id}`,
        {
          status: update.status,
          verificationRemarks: update.verificationRemarks || '',
        },
        { headers: getHeaders() },
      );

      alert('Receipt updated successfully');
      await fetchReceipts(page);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update receipt');
    } finally {
      setSavingId(null);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchReceipts(1);
  };

  const resetFilters = () => {
    setFilters({
      customerSearch: '',
      branchName: '',
      projectId: '',
      status: '',
      paymentMode: '',
      fromDate: '',
      toDate: '',
    });

    setTimeout(() => fetchReceipts(1), 0);
  };

  useEffect(() => {
    fetchReceipts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = {
    total: items.length,
    submitted: items.filter((x) => x.status === 'SUBMITTED').length,
    verified: items.filter((x) => x.status === 'VERIFIED').length,
    rejected: items.filter((x) => x.status === 'REJECTED').length,
    amount: items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
        <Link
  href="/customer-portal-management"
  className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white hover:bg-black"
>
  ← Customer Portal Dashboard
</Link>
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold opacity-90">
              Customer Payment Control
            </p>

            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              Payment Receipt Verification
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-white/90">
              Review uploaded customer payment receipts, verify or reject them,
              and keep customers updated from the portal.
            </p>
          </div>

          <button
            onClick={() => fetchReceipts(page)}
            className="rounded-2xl bg-white/20 px-5 py-3 text-sm font-black backdrop-blur hover:bg-white/30"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <HeroCard title="Total" value={String(summary.total)} />
          <HeroCard title="Submitted" value={String(summary.submitted)} />
          <HeroCard title="Verified" value={String(summary.verified)} />
          <HeroCard title="Rejected" value={String(summary.rejected)} />
          <HeroCard title="Amount" value={formatCurrency(summary.amount)} />
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-xl">
        <h2 className="text-xl font-black text-gray-900">Filters</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            placeholder="Customer name / code"
            value={filters.customerSearch}
            onChange={(e) =>
              setFilters({ ...filters, customerSearch: e.target.value })
            }
            className="rounded-2xl border p-3"
          />

          <input
            placeholder="Branch"
            value={filters.branchName}
            onChange={(e) =>
              setFilters({ ...filters, branchName: e.target.value })
            }
            className="rounded-2xl border p-3"
          />

          <input
            placeholder="Project ID"
            value={filters.projectId}
            onChange={(e) =>
              setFilters({ ...filters, projectId: e.target.value })
            }
            className="rounded-2xl border p-3"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-2xl border p-3"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={filters.paymentMode}
            onChange={(e) =>
              setFilters({ ...filters, paymentMode: e.target.value })
            }
            className="rounded-2xl border p-3"
          >
            <option value="">All Payment Modes</option>
            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {formatLabel(mode)}
              </option>
            ))}
          </select>

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-500">
              From Date
            </label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) =>
                setFilters({ ...filters, fromDate: e.target.value })
              }
              className="w-full rounded-2xl border p-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-500">
              To Date
            </label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) =>
                setFilters({ ...filters, toDate: e.target.value })
              }
              className="w-full rounded-2xl border p-3"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={applyFilters}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
          >
            Apply Filters
          </button>

          <button
            onClick={resetFilters}
            className="rounded-2xl bg-gray-200 px-5 py-3 text-sm font-black text-gray-800 hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {loading ? (
          <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-semibold text-gray-500 shadow-xl">
            Loading payment receipts...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-semibold text-gray-500 shadow-xl">
            No payment receipts found.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-[2rem] bg-white shadow-xl"
            >
              <div className="border-b bg-gradient-to-r from-gray-50 to-orange-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-gray-900">
                        Receipt #{item.id}
                      </h3>

                      <StatusBadge status={item.status} />
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {item.customerName || '-'} · {item.customerCode || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Project #{item.projectId || '-'} · Branch:{' '}
                      {item.branchName || '-'}
                    </p>
                  </div>

                  <a
                    href={item.projectId ? `/project/${item.projectId}` : '#'}
                    className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white hover:bg-black"
                  >
                    Open Project
                  </a>
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="grid gap-3 md:grid-cols-4">
                    <InfoCard label="Amount" value={formatCurrency(item.amount)} />
                    <InfoCard label="Mode" value={formatLabel(item.paymentMode)} />
                    <InfoCard label="Transaction" value={item.transactionId || '-'} />
                    <InfoCard label="Payment Date" value={formatDate(item.paymentDate)} />
                  </div>

                  <div className="mt-4 rounded-3xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-500">
                      Customer Remarks
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {item.customerRemarks || '-'}
                    </p>
                  </div>

                  {item.receiptUrl && (
                    <div className="mt-4 rounded-3xl bg-white p-4 shadow-inner">
                      <p className="mb-3 text-sm font-black text-gray-900">
                        Uploaded Receipt
                      </p>

                      {isImageUrl(item.receiptUrl) ? (
                        <a
                          href={item.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={item.receiptUrl}
                            alt={item.receiptFileName || 'Payment receipt'}
                            className="max-h-80 rounded-3xl border object-contain"
                          />
                        </a>
                      ) : (
                        <a
                          href={item.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block rounded-2xl bg-red-100 px-4 py-3 text-sm font-black text-red-700"
                        >
                          Open PDF Receipt
                        </a>
                      )}
                    </div>
                  )}

                  {item.verificationRemarks && (
                    <div className="mt-4 rounded-3xl bg-blue-50 p-5">
                      <p className="text-xs font-bold text-blue-700">
                        Verification Remarks
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-900">
                        {item.verificationRemarks}
                      </p>
                      {item.verifiedByName && (
                        <p className="mt-2 text-xs font-semibold text-blue-700">
                          By: {item.verifiedByName}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] bg-gray-50 p-4">
                  <h4 className="font-black text-gray-900">Verification</h4>

                  <div className="mt-3 space-y-3">
                    <select
                      value={editMap[item.id]?.status || 'SUBMITTED'}
                      onChange={(e) =>
                        setEditMap((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            status: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border p-3"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {formatLabel(status)}
                        </option>
                      ))}
                    </select>

                    <textarea
                      placeholder="Verification remarks"
                      value={editMap[item.id]?.verificationRemarks || ''}
                      onChange={(e) =>
                        setEditMap((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            verificationRemarks: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border p-3"
                      rows={4}
                    />

                    <button
                      disabled={savingId === item.id}
                      onClick={() => updateReceipt(item)}
                      className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingId === item.id ? 'Saving...' : 'Save Verification'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between rounded-[2rem] bg-white p-4 shadow-xl">
        <p className="text-sm font-semibold text-gray-600">
          Page {page} of {totalPages}
        </p>

        <div className="flex gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => fetchReceipts(page - 1)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Previous
          </button>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => fetchReceipts(page + 1)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/20 p-4 backdrop-blur">
      <p className="text-xs font-bold opacity-90">{title}</p>
      <p className="mt-2 break-words text-2xl font-black">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const value = status || 'SUBMITTED';

  const color =
    value === 'VERIFIED'
      ? 'bg-green-100 text-green-700'
      : value === 'REJECTED'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${color}`}>
      {formatLabel(value)}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-3xl bg-gray-50 p-4">
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-gray-900">
        {value || '-'}
      </p>
    </div>
  );
}

function isImageUrl(url?: string) {
  const value = String(url || '').toLowerCase();
  return (
    value.includes('.jpg') ||
    value.includes('.jpeg') ||
    value.includes('.png') ||
    value.includes('.webp')
  );
}

function formatCurrency(value?: number | string) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN');
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}