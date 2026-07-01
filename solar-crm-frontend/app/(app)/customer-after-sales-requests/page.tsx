'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const STATUS_OPTIONS = [
  'NEW',
  'APPROVED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
];

export default function CustomerAfterSalesRequestsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    customerSearch: '',
    serviceId: '',
    status: '',
    projectId: '',
  });

  const [editMap, setEditMap] = useState<Record<number, any>>({});

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const loadServices = async () => {
    const res = await axios.get(`${API_BASE_URL}/customer-portal/after-sales-services`, {
      params: { customerVisible: 'true' },
      headers: headers(),
    });

    setServices(Array.isArray(res.data) ? res.data : []);
  };

  const loadRequests = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/customer-portal/after-sales-requests`, {
        params: {
          page: 1,
          limit: 100,
          ...filters,
        },
        headers: headers(),
      });

      const data = res.data?.data || [];
      setItems(data);

      const next: Record<number, any> = {};
      data.forEach((item: any) => {
        next[item.id] = {
          status: item.status || 'NEW',
          assignedToName: item.assignedToName || '',
          adminRemarks: item.adminRemarks || '',
          completionRemarks: item.completionRemarks || '',
        };
      });

      setEditMap(next);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to load service requests');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async (request: any) => {
    try {
      setSelectedRequest(request);
      setTimelineLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/customer-portal/after-sales-requests/${request.id}/activities`,
        { headers: headers() },
      );

      setActivities(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setActivities([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const updateRequest = async (item: any) => {
    const update = editMap[item.id];

    if (!update?.status) {
      alert('Please select status');
      return;
    }

    if (
      update.status === 'COMPLETED' &&
      !String(update.completionRemarks || '').trim()
    ) {
      alert('Completion remarks are required');
      return;
    }

    try {
      setSavingId(item.id);

      await axios.patch(
        `${API_BASE_URL}/customer-portal/after-sales-requests/${item.id}`,
        update,
        { headers: headers() },
      );

      alert('Service request updated');
      await loadRequests();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update service request');
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    loadServices();
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = {
    total: items.length,
    new: items.filter((x) => x.status === 'NEW').length,
    assigned: items.filter((x) => x.status === 'ASSIGNED').length,
    progress: items.filter((x) => x.status === 'IN_PROGRESS').length,
    completed: items.filter((x) => x.status === 'COMPLETED').length,
  };

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 pb-10">
      <Link
        href="/customer-portal-management"
        className="inline-flex rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
      >
        ← Customer Portal Dashboard
      </Link>

      <section className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
        <h1 className="text-4xl font-black">
          After-Sales Service Requests
        </h1>
        <p className="mt-2 text-sm font-semibold text-white/90">
          Manage customer after-sales service requests, assign staff, update status and track timeline.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <HeroCard title="Total" value={summary.total} />
          <HeroCard title="New" value={summary.new} />
          <HeroCard title="Assigned" value={summary.assigned} />
          <HeroCard title="Progress" value={summary.progress} />
          <HeroCard title="Completed" value={summary.completed} />
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <h2 className="text-xl font-black text-gray-900">Filters</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            placeholder="Search customer / phone / code"
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
            value={filters.serviceId}
            onChange={(e) =>
              setFilters({ ...filters, serviceId: e.target.value })
            }
            className="rounded-2xl border p-3"
          >
            <option value="">All Services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.serviceName}
              </option>
            ))}
          </select>

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
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={loadRequests}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
          >
            Apply Filters
          </button>

          <button
            onClick={() => {
              setFilters({
                customerSearch: '',
                serviceId: '',
                status: '',
                projectId: '',
              });
              setTimeout(loadRequests, 0);
            }}
            className="rounded-2xl bg-gray-200 px-5 py-3 text-sm font-black text-gray-700"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="space-y-5">
        {loading ? (
          <div className="rounded-[2rem] bg-white p-8 text-center font-bold text-gray-500 shadow-xl">
            Loading service requests...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-8 text-center font-bold text-gray-500 shadow-xl">
            No service requests found.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
              <div className="border-b bg-gradient-to-r from-gray-50 to-orange-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-gray-900">
                        #{item.id} {item.serviceName}
                      </h3>
                      <StatusBadge status={item.status} />
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {item.customerName || '-'} · {item.customerPhone || '-'} · {item.customerCode || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Project #{item.projectId || '-'} · Branch: {item.branchName || '-'}
                    </p>
                  </div>

                  <button
                    onClick={() => loadActivities(item)}
                    className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
                  >
                    Timeline
                  </button>
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="grid gap-3 md:grid-cols-4">
                    <InfoCard
                      label="Service Price"
                      value={
                        item.isPaidService
                          ? `₹${Number(item.servicePrice || 0).toLocaleString('en-IN')}`
                          : 'Free'
                      }
                    />
                    <InfoCard
                      label="Preferred Date"
                      value={
                        item.preferredDate
                          ? new Date(item.preferredDate).toLocaleDateString('en-IN')
                          : '-'
                      }
                    />
                    <InfoCard label="Category" value={item.serviceCategory || '-'} />
                    <InfoCard label="Assigned To" value={item.assignedToName || '-'} />
                  </div>

                  <div className="mt-4 rounded-3xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-500">Customer Remarks</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {item.customerRemarks || '-'}
                    </p>
                  </div>

                  {item.adminRemarks && (
                    <div className="mt-4 rounded-3xl bg-blue-50 p-5 text-sm font-semibold text-blue-800">
                      Admin Remarks: {item.adminRemarks}
                    </div>
                  )}

                  {item.completionRemarks && (
                    <div className="mt-4 rounded-3xl bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
                      Completion: {item.completionRemarks}
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] bg-gray-50 p-4">
                  <h4 className="font-black text-gray-900">Update Request</h4>

                  <div className="mt-3 space-y-3">
                    <select
                      value={editMap[item.id]?.status || 'NEW'}
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

                    <input
                      placeholder="Assigned staff / technician name"
                      value={editMap[item.id]?.assignedToName || ''}
                      onChange={(e) =>
                        setEditMap((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            assignedToName: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border p-3"
                    />

                    <textarea
                      placeholder="Admin remarks"
                      value={editMap[item.id]?.adminRemarks || ''}
                      onChange={(e) =>
                        setEditMap((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            adminRemarks: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border p-3"
                      rows={3}
                    />

                    <textarea
                      placeholder="Completion remarks"
                      value={editMap[item.id]?.completionRemarks || ''}
                      onChange={(e) =>
                        setEditMap((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            completionRemarks: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border p-3"
                      rows={3}
                    />

                    <button
                      onClick={() => updateRequest(item)}
                      disabled={savingId === item.id}
                      className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                      {savingId === item.id ? 'Saving...' : 'Save Update'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {selectedRequest && (
        <TimelineModal
          request={selectedRequest}
          activities={activities}
          loading={timelineLoading}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </main>
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
  const value = status || 'NEW';

  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
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

function TimelineModal({
  request,
  activities,
  loading,
  onClose,
}: {
  request: any;
  activities: any[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Service Request #{request.id}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {request.serviceName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm font-bold text-gray-500">
              Loading timeline...
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm font-bold text-gray-500">
              No timeline yet.
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="rounded-3xl bg-gray-50 p-4">
                <p className="font-black text-gray-900">
                  {activity.activityTitle}
                </p>
                {activity.activityDescription && (
                  <p className="mt-1 text-sm text-gray-600">
                    {activity.activityDescription}
                  </p>
                )}
                <p className="mt-2 text-xs font-semibold text-gray-500">
                  {activity.performedByName || 'System'} ·{' '}
                  {activity.createdAt
                    ? new Date(activity.createdAt).toLocaleString('en-IN')
                    : '-'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}