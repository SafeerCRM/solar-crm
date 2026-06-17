'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type PayoutRequest = {
  id: number;
  projectId: number;
  franchiseUserId: number;
  franchiseName?: string;
  franchisePhone?: string;
  requestedAmount?: number;
  requestNote?: string;
  status?: string;
  accountManagerNote?: string;
  paymentReference?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  paidByName?: string;
  paidAt?: string;
  createdAt?: string;
};

export default function FranchisePayoutsPage() {
  const [rows, setRows] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState('');
  const [projectId, setProjectId] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusForms, setStatusForms] = useState<
    Record<number, {
      status: string;
      accountManagerNote: string;
      paymentReference: string;
    }>
  >({});

  const fetchPayouts = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/project/franchise-payout-request`,
        {
          params: {
            page,
            limit: 20,
            status,
            projectId,
          },
          headers: getAuthHeaders(),
        },
      );

      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotalPages(res.data?.totalPages || 1);
      setTotalRecords(res.data?.total || 0);
    } catch (error) {
      console.error('Failed to load franchise payouts:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const clearFilters = () => {
    setStatus('');
    setProjectId('');
    setPage(1);
    setTimeout(fetchPayouts, 0);
  };

  const updateStatusForm = (
    id: number,
    field: 'status' | 'accountManagerNote' | 'paymentReference',
    value: string,
  ) => {
    setStatusForms((prev) => ({
      ...prev,
      [id]: {
        status: prev[id]?.status || '',
        accountManagerNote: prev[id]?.accountManagerNote || '',
        paymentReference: prev[id]?.paymentReference || '',
        [field]: value,
      },
    }));
  };

  const updatePayoutStatus = async (item: PayoutRequest) => {
    const form = statusForms[item.id];

    if (!form?.status) {
      alert('Please select status');
      return;
    }

    if (form.status === 'PAID' && !form.paymentReference.trim()) {
      alert('Payment reference is required when marking as paid');
      return;
    }

    try {
      setUpdatingId(item.id);

      await axios.patch(
        `${API_BASE_URL}/project/franchise-payout-request/${item.id}/status`,
        {
          status: form.status,
          accountManagerNote: form.accountManagerNote,
          paymentReference: form.paymentReference,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      alert('Payout request updated successfully');

      setStatusForms((prev) => ({
        ...prev,
        [item.id]: {
          status: '',
          accountManagerNote: '',
          paymentReference: '',
        },
      }));

      fetchPayouts();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to update payout request',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const totalRequested = rows.reduce(
    (sum, item) => sum + Number(item.requestedAmount || 0),
    0,
  );

  const totalPaid = rows
    .filter((item) => item.status === 'PAID')
    .reduce((sum, item) => sum + Number(item.requestedAmount || 0), 0);

  const totalPending = rows
    .filter((item) =>
      ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'ON_HOLD'].includes(
        String(item.status || ''),
      ),
    )
    .reduce((sum, item) => sum + Number(item.requestedAmount || 0), 0);

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden bg-gray-50 p-3 md:p-6">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-900">
          Franchise Payouts
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and update Solar Franchise payout requests.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Requested" value={totalRequested} tone="blue" />
        <SummaryCard title="Paid" value={totalPaid} tone="green" />
        <SummaryCard title="Pending" value={totalPending} tone="red" />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">Filters</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Project ID"
            className="rounded-xl border p-3"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Status</option>
            <option value="REQUESTED">Requested</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
            <option value="ON_HOLD">On Hold</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setPage(1);
                fetchPayouts();
              }}
              className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              {loading ? 'Loading...' : 'Apply'}
            </button>

            <button
              onClick={clearFilters}
              className="flex-1 rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-800"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-gray-800">
            Payout Request List
          </h2>

          <p className="text-sm text-gray-500">
            {rows.length} record(s)
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading payout requests...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No payout requests found.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((item) => {
              const form = statusForms[item.id] || {
                status: '',
                accountManagerNote: '',
                paymentReference: '',
              };

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                          {item.status || 'REQUESTED'}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          Project #{item.projectId}
                        </span>
                      </div>

                      <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                        <Info label="Franchise" value={item.franchiseName || '-'} />
                        <Info label="Phone" value={item.franchisePhone || '-'} />
                        <Info label="Requested Date" value={formatDate(item.createdAt)} />
                        <Info label="Reviewed By" value={item.reviewedByName || '-'} />
                        <Info label="Paid By" value={item.paidByName || '-'} />
                        <Info label="Paid Date" value={formatDate(item.paidAt)} />
                        <Info label="Payment Reference" value={item.paymentReference || '-'} />
                      </div>

                      {item.requestNote && (
                        <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                          Request Note: {item.requestNote}
                        </p>
                      )}

                      {item.accountManagerNote && (
                        <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
                          Account Note: {item.accountManagerNote}
                        </p>
                      )}
                    </div>

                    <div className="w-full rounded-xl bg-gray-50 p-4 md:w-[280px]">
                      <p className="text-sm text-gray-500">Requested Amount</p>
                      <p className="text-xl font-bold text-gray-900">
                        {money(item.requestedAmount)}
                      </p>

                      <Link
                        href={`/project/${item.projectId}`}
                        className="mt-3 block rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white"
                      >
                        Open Project
                      </Link>

                      <div className="mt-4 space-y-2">
                        <select
                          value={form.status}
                          onChange={(e) =>
                            updateStatusForm(item.id, 'status', e.target.value)
                          }
                          className="w-full rounded-xl border p-2 text-sm"
                        >
                          <option value="">Update Status</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="APPROVED">Approved</option>
                          <option value="PAID">Paid</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="ON_HOLD">On Hold</option>
                        </select>

                        <input
                          value={form.accountManagerNote}
                          onChange={(e) =>
                            updateStatusForm(
                              item.id,
                              'accountManagerNote',
                              e.target.value,
                            )
                          }
                          placeholder="Account note"
                          className="w-full rounded-xl border p-2 text-sm"
                        />

                        <input
                          value={form.paymentReference}
                          onChange={(e) =>
                            updateStatusForm(
                              item.id,
                              'paymentReference',
                              e.target.value,
                            )
                          }
                          placeholder="Payment reference"
                          className="w-full rounded-xl border p-2 text-sm"
                        />

                        <button
                          onClick={() => updatePayoutStatus(item)}
                          disabled={updatingId === item.id}
                          className="w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {updatingId === item.id
                            ? 'Updating...'
                            : 'Update'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages} · {totalRecords} record(s)
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
              className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Previous
            </button>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: 'blue' | 'green' | 'red';
}) {
  const classes = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className={`rounded-2xl p-5 shadow ${classes[tone]}`}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold">{money(value)}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="truncate font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN');
}

function statusClass(status?: string) {
  if (status === 'PAID') return 'bg-green-100 text-green-700';
  if (status === 'APPROVED') return 'bg-blue-100 text-blue-700';
  if (status === 'REJECTED') return 'bg-red-100 text-red-700';
  if (status === 'ON_HOLD') return 'bg-yellow-100 text-yellow-700';
  if (status === 'UNDER_REVIEW') return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-700';
}