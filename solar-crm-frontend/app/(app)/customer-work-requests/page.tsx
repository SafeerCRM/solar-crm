'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type WorkRequest = {
  id: number;
  customerId?: number;
  customerCode?: string;
  customerName?: string;
  projectId?: number;
  projectStatus?: string;
  projectName?: string;
  projectAddress?: string;
projectGpsAddress?: string;
projectGpsLatitude?: number;
projectGpsLongitude?: number;
  branchName?: string;
  currentWorkDate?: string;
  requestedWorkDate?: string;
  reason?: string;
  status?: string;
  approvalRemarks?: string;
  approvedByName?: string;
  approvedAt?: string;
  projectManagerName?: string;
  createdAt?: string;
};

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED', 'RESCHEDULED'];

export default function CustomerWorkRequestsPage() {
  const [items, setItems] = useState<WorkRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [filters, setFilters] = useState({
  customerSearch: '',
  branchName: '',
  status: '',
  projectId: '',
  projectStage: '',
});

  const [editMap, setEditMap] = useState<Record<number, any>>({});

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRequests = async (targetPage = page) => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/customer-portal/work-date-requests`,
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
      data.forEach((item: WorkRequest) => {
        nextEditMap[item.id] = {
          status: item.status || 'PENDING',
          approvalRemarks: item.approvalRemarks || '',
        };
      });
      setEditMap(nextEditMap);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to load work requests');
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = async (item: WorkRequest) => {
    const update = editMap[item.id];

    if (!update?.status) {
      alert('Please select status');
      return;
    }

    if (
      ['REJECTED', 'RESCHEDULED'].includes(update.status) &&
      !String(update.approvalRemarks || '').trim()
    ) {
      alert('Remarks are required for rejected or rescheduled request');
      return;
    }

    try {
      setSavingId(item.id);

      await axios.patch(
        `${API_BASE_URL}/customer-portal/work-date-requests/${item.id}`,
        {
          status: update.status,
          approvalRemarks: update.approvalRemarks || '',
        },
        { headers: getHeaders() },
      );

      alert('Work date request updated successfully');
      await fetchRequests(page);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update request');
    } finally {
      setSavingId(null);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchRequests(1);
  };

  const resetFilters = () => {
    setFilters({
  customerSearch: '',
  branchName: '',
  status: '',
  projectId: '',
  projectStage: '',
});

    setTimeout(() => fetchRequests(1), 0);
  };

  useEffect(() => {
    fetchRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = {
    total: items.length,
    pending: items.filter((x) => x.status === 'PENDING').length,
    approved: items.filter((x) => x.status === 'APPROVED').length,
    rejected: items.filter((x) => x.status === 'REJECTED').length,
    rescheduled: items.filter((x) => x.status === 'RESCHEDULED').length,
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
              Customer Work Calendar Control
            </p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              Work Date Requests
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-white/90">
              Approve, reject or reschedule customer work date change requests.
            </p>
          </div>

          <button
            onClick={() => fetchRequests(page)}
            className="rounded-2xl bg-white/20 px-5 py-3 text-sm font-black backdrop-blur hover:bg-white/30"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <HeroCard title="Total" value={summary.total} />
          <HeroCard title="Pending" value={summary.pending} />
          <HeroCard title="Approved" value={summary.approved} />
          <HeroCard title="Rejected" value={summary.rejected} />
          <HeroCard title="Rescheduled" value={summary.rescheduled} />
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
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
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
  value={filters.projectStage}
  onChange={(e) =>
    setFilters({
      ...filters,
      projectStage: e.target.value,
    })
  }
  className="rounded-2xl border p-3"
>
  <option value="">All Project Stages</option>
  <option value="IN_PROGRESS">
    In Progress Projects
  </option>
  <option value="COMPLETED">
    Completed Projects
  </option>
</select>
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
            Loading work date requests...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-semibold text-gray-500 shadow-xl">
            No work date requests found.
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
                        Request #{item.id}
                      </h3>
                      <StatusBadge status={item.status} />
                      <ProjectStatusBadge
  status={item.projectStatus}
/>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {item.customerName || '-'} · {item.customerCode || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Project #{item.projectId || '-'} · Branch:{' '}
                      {item.branchName || '-'}
                    </p>

                    {(item.projectAddress ||
  item.projectGpsAddress ||
  item.projectGpsLatitude) && (
  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
      📍 Project Site Location
    </p>

    <div className="mt-3 space-y-2 text-sm">
      <div>
        <span className="font-bold text-gray-700">
          Address:
        </span>{' '}
        {item.projectAddress || '-'}
      </div>

      <div>
        <span className="font-bold text-gray-700">
          GPS Address:
        </span>{' '}
        {item.projectGpsAddress || '-'}
      </div>

      {item.projectGpsLatitude &&
        item.projectGpsLongitude && (
          <a
            href={`https://www.google.com/maps?q=${item.projectGpsLatitude},${item.projectGpsLongitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
          >
            Open in Google Maps
          </a>
        )}
    </div>
  </div>
)}
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
                  <div className="grid gap-3 md:grid-cols-3">
                    <InfoCard
                      label="Current Work Date"
                      value={formatDate(item.currentWorkDate)}
                    />
                    <InfoCard
                      label="Requested Date"
                      value={formatDate(item.requestedWorkDate)}
                    />
                    <InfoCard
                      label="Created"
                      value={formatDate(item.createdAt)}
                    />
                  </div>

                  <div className="mt-4 rounded-3xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-500">
                      Customer Reason
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {item.reason || '-'}
                    </p>
                  </div>

                  {item.approvalRemarks && (
                    <div className="mt-4 rounded-3xl bg-blue-50 p-5">
                      <p className="text-xs font-bold text-blue-700">
                        Approval Remarks
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-900">
                        {item.approvalRemarks}
                      </p>
                      {item.approvedByName && (
                        <p className="mt-2 text-xs font-semibold text-blue-700">
                          By: {item.approvedByName}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] bg-gray-50 p-4">
                  <h4 className="font-black text-gray-900">Action</h4>

                  <div className="mt-3 space-y-3">
                    <select
                      value={editMap[item.id]?.status || 'PENDING'}
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
                      placeholder="Approval / rejection / reschedule remarks"
                      value={editMap[item.id]?.approvalRemarks || ''}
                      onChange={(e) =>
                        setEditMap((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            approvalRemarks: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border p-3"
                      rows={4}
                    />

                    <button
                      disabled={savingId === item.id}
                      onClick={() => updateRequest(item)}
                      className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingId === item.id ? 'Saving...' : 'Save Decision'}
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
            onClick={() => fetchRequests(page - 1)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Previous
          </button>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => fetchRequests(page + 1)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white/20 p-4 backdrop-blur">
      <p className="text-xs font-bold opacity-90">{title}</p>
      <p className="mt-2 text-2xl font-black">{Number(value || 0)}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const value = status || 'PENDING';

  const color =
    value === 'APPROVED'
      ? 'bg-green-100 text-green-700'
      : value === 'REJECTED'
        ? 'bg-red-100 text-red-700'
        : value === 'RESCHEDULED'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-amber-100 text-amber-700';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${color}`}>
      {formatLabel(value)}
    </span>
  );
}

function ProjectStatusBadge({
  status,
}: {
  status?: string;
}) {
  const isCompleted = status === 'COMPLETED';

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        isCompleted
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      {isCompleted
        ? 'COMPLETED PROJECT'
        : 'IN PROGRESS PROJECT'}
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

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN');
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}