'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const STATUS_OPTIONS = ['PENDING', 'COMPLETED', 'POSTPONED', 'CANCELLED'];

export default function CustomerCleaningRemindersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    customerSearch: '',
    projectId: '',
    status: '',
    fromDate: '',
    toDate: '',
    showHidden: 'false',
  });

  const [editMap, setEditMap] = useState<Record<number, any>>({});

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchReminders = async (targetPage = page) => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/customer-portal/cleaning-reminders`,
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
      data.forEach((item: any) => {
        nextEditMap[item.id] = {
          status: item.status || 'PENDING',
          cleaningDate: item.cleaningDate
            ? String(item.cleaningDate).slice(0, 10)
            : '',
          nextCleaningDate: item.nextCleaningDate
            ? String(item.nextCleaningDate).slice(0, 10)
            : '',
          remarks: item.remarks || '',
        };
      });

      setEditMap(nextEditMap);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to load cleaning reminders');
    } finally {
      setLoading(false);
    }
  };

  const updateReminder = async (item: any) => {
    const update = editMap[item.id];

    if (!update?.status) {
      alert('Please select status');
      return;
    }

    if (!update?.cleaningDate) {
      alert('Cleaning date is required');
      return;
    }

    try {
      setSavingId(item.id);

      await axios.patch(
        `${API_BASE_URL}/customer-portal/cleaning-reminders/${item.id}`,
        {
          status: update.status,
          cleaningDate: update.cleaningDate,
          nextCleaningDate: update.nextCleaningDate || '',
          remarks: update.remarks || '',
        },
        { headers: getHeaders() },
      );

      alert('Cleaning reminder updated successfully');
      await fetchReminders(page);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update cleaning reminder');
    } finally {
      setSavingId(null);
    }
  };

  const hideReminder = async (item: any) => {
    const reason = window.prompt('Reason for hiding this cleaning reminder?');

    if (!reason) return;

    try {
      setSavingId(item.id);

      await axios.patch(
        `${API_BASE_URL}/customer-portal/cleaning-reminders/${item.id}/hide`,
        { hiddenReason: reason },
        { headers: getHeaders() },
      );

      alert('Cleaning reminder hidden');
      await fetchReminders(page);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to hide cleaning reminder');
    } finally {
      setSavingId(null);
    }
  };

  const restoreReminder = async (item: any) => {
    try {
      setSavingId(item.id);

      await axios.patch(
        `${API_BASE_URL}/customer-portal/cleaning-reminders/${item.id}/restore`,
        {},
        { headers: getHeaders() },
      );

      alert('Cleaning reminder restored');
      await fetchReminders(page);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to restore cleaning reminder');
    } finally {
      setSavingId(null);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchReminders(1);
  };

  const resetFilters = () => {
    setFilters({
      customerSearch: '',
      projectId: '',
      status: '',
      fromDate: '',
      toDate: '',
      showHidden: 'false',
    });

    setTimeout(() => fetchReminders(1), 0);
  };

  useEffect(() => {
    fetchReminders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = {
    total: items.length,
    pending: items.filter((x) => x.status === 'PENDING').length,
    completed: items.filter((x) => x.status === 'COMPLETED').length,
    postponed: items.filter((x) => x.status === 'POSTPONED').length,
    cancelled: items.filter((x) => x.status === 'CANCELLED').length,
    hidden: items.filter((x) => x.isHidden).length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold opacity-90">
              Customer Cleaning Control
            </p>

            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              Cleaning Reminders
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-white/90">
              Manage customer cleaning requests, cleaning calendar, next cleaning
              dates, completion status and hidden records.
            </p>
          </div>

          <button
            onClick={() => fetchReminders(page)}
            className="rounded-2xl bg-white/20 px-5 py-3 text-sm font-black backdrop-blur hover:bg-white/30"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-6">
          <HeroCard title="Total" value={String(summary.total)} />
          <HeroCard title="Pending" value={String(summary.pending)} />
          <HeroCard title="Completed" value={String(summary.completed)} />
          <HeroCard title="Postponed" value={String(summary.postponed)} />
          <HeroCard title="Cancelled" value={String(summary.cancelled)} />
          <HeroCard title="Hidden" value={String(summary.hidden)} />
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-xl">
        <h2 className="text-xl font-black text-gray-900">Filters</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <input
            placeholder="Customer code / project name"
            value={filters.customerSearch}
            onChange={(e) =>
              setFilters({ ...filters, customerSearch: e.target.value })
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
            value={filters.showHidden}
            onChange={(e) =>
              setFilters({ ...filters, showHidden: e.target.value })
            }
            className="rounded-2xl border p-3"
          >
            <option value="false">Active Only</option>
            <option value="true">View Hidden</option>
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
            Loading cleaning reminders...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-semibold text-gray-500 shadow-xl">
            No cleaning reminders found.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`overflow-hidden rounded-[2rem] bg-white shadow-xl ${
                item.isHidden ? 'opacity-70' : ''
              }`}
            >
              <div className="border-b bg-gradient-to-r from-gray-50 to-orange-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-gray-900">
                        Cleaning #{item.id}
                      </h3>

                      <StatusBadge status={item.status} />

                      {item.isHidden && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                          Hidden
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      Customer Code: {item.customerCode || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Project #{item.projectId || '-'} · {item.projectName || '-'}
                    </p>

                    {item.hiddenReason && (
                      <p className="mt-2 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                        Hidden Reason: {item.hiddenReason}
                      </p>
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
                      label="Cleaning Date"
                      value={formatDate(item.cleaningDate)}
                    />
                    <InfoCard
                      label="Next Cleaning"
                      value={formatDate(item.nextCleaningDate)}
                    />
                    <InfoCard
                      label="Completed By"
                      value={item.completedByName || '-'}
                    />
                  </div>

                  <div className="mt-4 rounded-3xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-500">Remarks</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {item.remarks || '-'}
                    </p>
                  </div>
                </div>

                <div className="rounded-[2rem] bg-gray-50 p-4">
                  <h4 className="font-black text-gray-900">Edit Cleaning</h4>

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

                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-500">
                        Cleaning Date
                      </label>
                      <input
                        type="date"
                        value={editMap[item.id]?.cleaningDate || ''}
                        onChange={(e) =>
                          setEditMap((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              cleaningDate: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-2xl border p-3"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-500">
                        Next Cleaning Date
                      </label>
                      <input
                        type="date"
                        value={editMap[item.id]?.nextCleaningDate || ''}
                        onChange={(e) =>
                          setEditMap((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              nextCleaningDate: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-2xl border p-3"
                      />
                    </div>

                    <textarea
                      placeholder="Remarks"
                      value={editMap[item.id]?.remarks || ''}
                      onChange={(e) =>
                        setEditMap((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            remarks: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border p-3"
                      rows={4}
                    />

                    <button
                      disabled={savingId === item.id || item.isHidden}
                      onClick={() => updateReminder(item)}
                      className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingId === item.id ? 'Saving...' : 'Save Update'}
                    </button>

                    {item.isHidden ? (
                      <button
                        disabled={savingId === item.id}
                        onClick={() => restoreReminder(item)}
                        className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        disabled={savingId === item.id}
                        onClick={() => hideReminder(item)}
                        className="w-full rounded-2xl bg-red-600 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Hide
                      </button>
                    )}
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
            onClick={() => fetchReminders(page - 1)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Previous
          </button>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => fetchReminders(page + 1)}
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
  const value = status || 'PENDING';

  const color =
    value === 'COMPLETED'
      ? 'bg-green-100 text-green-700'
      : value === 'CANCELLED'
        ? 'bg-red-100 text-red-700'
        : value === 'POSTPONED'
          ? 'bg-blue-100 text-blue-700'
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

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN');
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}