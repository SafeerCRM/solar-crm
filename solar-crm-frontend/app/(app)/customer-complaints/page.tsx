'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs from 'dayjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type CustomerComplaint = {
  id: number;
  customerId?: number;
  customerCode?: string;
  customerName?: string;
  customerPhone?: string;
  projectId?: number;
  projectName?: string;
  branchName?: string;
  projectOwnerId?: number;
  projectOwnerName?: string;
  subject?: string;
  complaintText?: string;
  status?: string;
  priority?: string;
  assignedTo?: number;
  assignedToName?: string;
  serviceDate?: string;
  staffRemarks?: string;
  resolutionNote?: string;
  attachments?: any[];
  createdAt?: string;
};

const STATUS_OPTIONS = [
  'OPEN',
  'ASSIGNED',
  'SERVICE_SCHEDULED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
];

const SUBJECT_OPTIONS = [
  'GENERATION_ISSUE',
  'PANEL_ISSUE',
  'INVERTER_ISSUE',
  'STRUCTURE_ISSUE',
  'ELECTRICITY_ISSUE',
  'SUBSIDY_ISSUE',
  'LOAN_ISSUE',
  'PAYMENT_ISSUE',
  'CLEANING_REQUEST',
  'SERVICE_REQUEST',
  'DOCUMENT_REQUEST',
  'OTHER',
];

export default function CustomerComplaintsAdminPage() {
  const [items, setItems] = useState<CustomerComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    assigned: 0,
    serviceScheduled: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  const [filters, setFilters] = useState({
    customerSearch: '',
    branchName: '',
    projectOwnerName: '',
    subject: '',
    status: '',
    fromDate: '',
    toDate: '',
    serviceFromDate: '',
    serviceToDate: '',
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [selectedComplaint, setSelectedComplaint] =
    useState<CustomerComplaint | null>(null);

  const [editMap, setEditMap] = useState<Record<number, any>>({});

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchComplaints = async (targetPage = page) => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/customer-portal/complaints`, {
        params: {
          page: targetPage,
          limit,
          ...filters,
        },
        headers: getHeaders(),
      });

      const data = res.data?.data || [];
      setItems(data);
      setPage(res.data?.page || targetPage);
      setTotalPages(res.data?.totalPages || 1);

      setSummary({
        total: res.data?.total || data.length,
        open: data.filter((x: any) => x.status === 'OPEN').length,
        assigned: data.filter((x: any) => x.status === 'ASSIGNED').length,
        serviceScheduled: data.filter((x: any) => x.status === 'SERVICE_SCHEDULED').length,
        inProgress: data.filter((x: any) => x.status === 'IN_PROGRESS').length,
        resolved: data.filter((x: any) => x.status === 'RESOLVED').length,
        closed: data.filter((x: any) => x.status === 'CLOSED').length,
      });

      const nextEditMap: Record<number, any> = {};
      data.forEach((item: CustomerComplaint) => {
        nextEditMap[item.id] = {
          status: item.status || 'OPEN',
          assignedToName: item.assignedToName || '',
          serviceDate: item.serviceDate
  ? new Date(item.serviceDate).toISOString().slice(0, 10)
  : '',
serviceTime: item.serviceDate
  ? new Date(item.serviceDate).toTimeString().slice(0, 5)
  : '',
          staffRemarks: item.staffRemarks || '',
          resolutionNote: item.resolutionNote || '',
        };
      });

      setEditMap(nextEditMap);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to load customer complaints');
    } finally {
      setLoading(false);
    }
  };

  const updateComplaint = async (item: CustomerComplaint) => {
    const update = editMap[item.id];

    if (!update?.status) {
      alert('Please select status');
      return;
    }

    try {
      setSavingId(item.id);

      await axios.patch(
        `${API_BASE_URL}/customer-portal/complaints/${item.id}`,
        {
          status: update.status,
          assignedToName: update.assignedToName,
          serviceDate:
  update.serviceDate && update.serviceTime
    ? `${update.serviceDate}T${update.serviceTime}:00`
    : update.serviceDate
      ? `${update.serviceDate}T09:00:00`
      : '',
          staffRemarks: update.staffRemarks,
          resolutionNote: update.resolutionNote,
        },
        {
          headers: getHeaders(),
        },
      );

      alert('Complaint updated successfully');
      await fetchComplaints(page);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update complaint');
    } finally {
      setSavingId(null);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchComplaints(1);
  };

  const clearFilters = () => {
    setFilters({
      customerSearch: '',
      branchName: '',
      projectOwnerName: '',
      subject: '',
      status: '',
      fromDate: '',
      toDate: '',
      serviceFromDate: '',
      serviceToDate: '',
    });

    setTimeout(() => fetchComplaints(1), 0);
  };

  useEffect(() => {
    fetchComplaints(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold opacity-90">
              Customer Support Command Center
            </p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              Customer Complaints
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-white/90">
              Manage customer complaints, view uploaded photos, assign service,
              schedule visits, update remarks and close issues.
            </p>
          </div>

          <button
            onClick={() => fetchComplaints(page)}
            className="rounded-2xl bg-white/20 px-5 py-3 text-sm font-black backdrop-blur hover:bg-white/30"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4 xl:grid-cols-7">
          <HeroCard title="Total" value={summary.total} />
          <HeroCard title="Open" value={summary.open} />
          <HeroCard title="Assigned" value={summary.assigned} />
          <HeroCard title="Service" value={summary.serviceScheduled} />
          <HeroCard title="Progress" value={summary.inProgress} />
          <HeroCard title="Resolved" value={summary.resolved} />
          <HeroCard title="Closed" value={summary.closed} />
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-xl">
        <h2 className="text-xl font-black text-gray-900">Smart Filters</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <input
            placeholder="Search customer / mobile / code"
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
            placeholder="Project Owner"
            value={filters.projectOwnerName}
            onChange={(e) =>
              setFilters({ ...filters, projectOwnerName: e.target.value })
            }
            className="rounded-2xl border p-3"
          />

          <select
            value={filters.subject}
            onChange={(e) =>
              setFilters({ ...filters, subject: e.target.value })
            }
            className="rounded-2xl border p-3"
          >
            <option value="">All Subjects</option>
            {SUBJECT_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
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
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}
          </select>


<div>
  <label className="mb-1 block text-xs font-bold text-gray-500">
    Complaint From Date
  </label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters({ ...filters, fromDate: e.target.value })
            }
            className="rounded-2xl border p-3"
          />
          </div>


<div>
  <label className="mb-1 block text-xs font-bold text-gray-500">
    Complaint To Date
  </label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) =>
              setFilters({ ...filters, toDate: e.target.value })
            }
            className="rounded-2xl border p-3"
          />
          </div>

<div>
  <label className="mb-1 block text-xs font-bold text-gray-500">
    Service From Date
  </label>
          <input
            type="date"
            title="Service from date"
            value={filters.serviceFromDate}
            onChange={(e) =>
              setFilters({ ...filters, serviceFromDate: e.target.value })
            }
            className="rounded-2xl border p-3"
          />
          </div>

<div>
  <label className="mb-1 block text-xs font-bold text-gray-500">
    Service To Date
  </label>
          <input
            type="date"
            title="Service to date"
            value={filters.serviceToDate}
            onChange={(e) =>
              setFilters({ ...filters, serviceToDate: e.target.value })
            }
            className="rounded-2xl border p-3"
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
            onClick={clearFilters}
            className="rounded-2xl bg-gray-200 px-5 py-3 text-sm font-black text-gray-800 hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {loading ? (
          <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-semibold text-gray-500 shadow-xl">
            Loading customer complaints...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-semibold text-gray-500 shadow-xl">
            No customer complaints found.
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
                        #{item.id} {formatLabel(item.subject)}
                      </h3>

                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {item.customerName || '-'} · {item.customerPhone || '-'} ·{' '}
                      {item.customerCode || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Project #{item.projectId || '-'} · Branch:{' '}
                      {item.branchName || '-'} · Owner:{' '}
                      {item.projectOwnerName || '-'}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedComplaint(item)}
                    className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white hover:bg-black"
                  >
                    View Detail
                  </button>
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
  <div className="grid gap-3 md:grid-cols-3">
    <InfoCard
      label="Customer"
      value={item.customerName || '-'}
    />

    <InfoCard
      label="Phone"
      value={item.customerPhone || '-'}
    />

    <InfoCard
      label="Customer Code"
      value={item.customerCode || '-'}
    />

    <InfoCard
      label="Project"
      value={`#${item.projectId || '-'}`}
    />

    <InfoCard
      label="Branch"
      value={item.branchName || '-'}
    />

    <InfoCard
      label="Owner"
      value={item.projectOwnerName || '-'}
    />
  </div>

  <div className="mt-4 rounded-3xl bg-gray-50 p-5">
    <p className="text-xs font-bold text-gray-500">
      Complaint Details
    </p>

    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
      {item.complaintText || '-'}
    </p>
  </div>

                  {Array.isArray(item.attachments) && item.attachments.length > 0 && (
  <div className="mt-4 space-y-4">
    {item.attachments.some((attachment: any) =>
  isImageAttachment(attachment),
) && (
      <div>
        <p className="mb-2 text-sm font-black text-gray-800">
          Customer Photos
        </p>

        <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
          {item.attachments
            .filter((attachment: any) =>
  isImageAttachment(attachment),
)
            .map((attachment: any) => (
              <a
                key={attachment.id || attachment.fileUrl}
                href={attachment.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-2xl border bg-gray-50 shadow"
              >
                <img
                  src={attachment.fileUrl}
                  alt={attachment.fileName || 'Complaint photo'}
                  className="h-24 w-full object-cover"
                />
              </a>
            ))}
        </div>
      </div>
    )}

    {item.attachments.some((attachment: any) =>
  isAudioAttachment(attachment),
) && (
      <div>
        <p className="mb-2 text-sm font-black text-gray-800">
          Customer Voice Notes
        </p>

        <div className="space-y-3">
          {item.attachments
            .filter((attachment: any) =>
  isAudioAttachment(attachment),
)
            .map((attachment: any) => (
              <div
                key={attachment.id || attachment.fileUrl}
                className="rounded-2xl bg-blue-50 p-3"
              >
                <p className="mb-2 text-xs font-black text-blue-700">
                  {attachment.fileName || 'Voice Note'}
                </p>

                <audio
                  controls
                  src={attachment.fileUrl}
                  className="w-full"
                />
              </div>
            ))}
        </div>
      </div>
    )}
  </div>
)}
                </div>

                <div className="rounded-[2rem] bg-gray-50 p-4">
                  <h4 className="font-black text-gray-900">Update Complaint</h4>

                  <div className="mt-3 space-y-3">
                    <select
                      value={editMap[item.id]?.status || 'OPEN'}
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
                      placeholder="Assigned staff name"
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

                    <input
  type="date"
  value={editMap[item.id]?.serviceDate || ''}
  onChange={(e) =>
    setEditMap((prev) => ({
      ...prev,
      [item.id]: {
        ...prev[item.id],
        serviceDate: e.target.value,
      },
    }))
  }
  className="w-full rounded-2xl border p-3"
/>

<LocalizationProvider dateAdapter={AdapterDayjs}>
  <MobileTimePicker
    label="Service Time"
    ampm
    ampmInClock
    value={
      editMap[item.id]?.serviceTime
        ? dayjs(`2026-01-01T${editMap[item.id].serviceTime}`)
        : null
    }
    onChange={(newTime) =>
      setEditMap((prev) => ({
        ...prev,
        [item.id]: {
          ...prev[item.id],
          serviceTime: newTime ? newTime.format('HH:mm') : '',
        },
      }))
    }
    slotProps={{
      textField: {
        fullWidth: true,
      },
    }}
  />
</LocalizationProvider>

                    <textarea
                      placeholder="Staff remarks"
                      value={editMap[item.id]?.staffRemarks || ''}
                      onChange={(e) =>
                        setEditMap((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            staffRemarks: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border p-3"
                      rows={3}
                    />

                    <textarea
                      placeholder="Resolution note"
                      value={editMap[item.id]?.resolutionNote || ''}
                      onChange={(e) =>
                        setEditMap((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            resolutionNote: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border p-3"
                      rows={3}
                    />

                    <button
                      disabled={savingId === item.id}
                      onClick={() => updateComplaint(item)}
                      className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingId === item.id ? 'Saving...' : 'Save Update'}
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
            onClick={() => fetchComplaints(page - 1)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Previous
          </button>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => fetchComplaints(page + 1)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {selectedComplaint && (
        <ComplaintDetailModal
          item={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
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
  const value = status || 'OPEN';

  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
      {formatLabel(value)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  const value = priority || 'MEDIUM';

  return (
    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
      {formatLabel(value)}
    </span>
  );
}

function ComplaintDetailModal({
  item,
  onClose,
}: {
  item: CustomerComplaint;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              Complaint #{item.id}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {item.customerName || '-'} · {item.customerPhone || '-'} ·{' '}
              {item.customerCode || '-'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <InfoCard label="Subject" value={formatLabel(item.subject)} />
          <InfoCard label="Status" value={formatLabel(item.status)} />
          <InfoCard label="Priority" value={formatLabel(item.priority)} />
          <InfoCard label="Branch" value={item.branchName || '-'} />
          <InfoCard label="Project Owner" value={item.projectOwnerName || '-'} />
          <InfoCard
            label="Created"
            value={
              item.createdAt
                ? new Date(item.createdAt).toLocaleString('en-IN')
                : '-'
            }
          />
        </div>

        <div className="mt-5 rounded-3xl bg-gray-50 p-5">
          <p className="text-sm font-black text-gray-800">Complaint Details</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {item.complaintText || '-'}
          </p>
        </div>

        {Array.isArray(item.attachments) && item.attachments.length > 0 && (
  <div className="mt-5 space-y-5">
    {item.attachments.some((attachment: any) =>
  isImageAttachment(attachment),
) && (
      <div>
        <p className="mb-3 text-lg font-black text-gray-900">
          Uploaded Photos
        </p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {item.attachments
            .filter((attachment: any) =>
  isImageAttachment(attachment),
)
            .map((attachment: any) => (
              <a
                key={attachment.id || attachment.fileUrl}
                href={attachment.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-3xl border bg-gray-50 shadow"
              >
                <img
                  src={attachment.fileUrl}
                  alt={attachment.fileName || 'Complaint photo'}
                  className="h-40 w-full object-cover"
                />
              </a>
            ))}
        </div>
      </div>
    )}

    {item.attachments.some((attachment: any) =>
  isAudioAttachment(attachment),
) && (
      <div>
        <p className="mb-3 text-lg font-black text-gray-900">
          Uploaded Voice Notes
        </p>

        <div className="space-y-3">
          {item.attachments
            .filter((attachment: any) =>
  isAudioAttachment(attachment),
)
            .map((attachment: any) => (
              <div
                key={attachment.id || attachment.fileUrl}
                className="rounded-3xl bg-blue-50 p-4"
              >
                <p className="mb-2 text-xs font-black text-blue-700">
                  {attachment.fileName || 'Voice Note'}
                </p>

                <audio
                  controls
                  src={attachment.fileUrl}
                  className="w-full"
                />
              </div>
            ))}
        </div>
      </div>
    )}
  </div>
)}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoCard label="Assigned To" value={item.assignedToName || '-'} />
          <InfoCard
            label="Service Date"
            value={
              item.serviceDate
                ? new Date(item.serviceDate).toLocaleString('en-IN')
                : '-'
            }
          />
          <InfoCard label="Staff Remarks" value={item.staffRemarks || '-'} />
          <InfoCard label="Resolution" value={item.resolutionNote || '-'} />
        </div>
      </div>
    </div>
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

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}

function isAudioAttachment(attachment: any) {
  const mimeType = String(attachment?.mimeType || '').toLowerCase();
  const type = String(attachment?.attachmentType || '').toUpperCase();
  const fileName = String(attachment?.fileName || '').toLowerCase();
  const fileUrl = String(attachment?.fileUrl || '').toLowerCase();

  return (
    mimeType.startsWith('audio/') ||
    mimeType === 'video/webm' ||
    type === 'AUDIO' ||
    fileName.endsWith('.webm') ||
    fileName.endsWith('.mp3') ||
    fileName.endsWith('.wav') ||
    fileName.endsWith('.ogg') ||
    fileUrl.includes('customer-complaint-audio') ||
    fileUrl.endsWith('.webm') ||
    fileUrl.endsWith('.mp3') ||
    fileUrl.endsWith('.wav') ||
    fileUrl.endsWith('.ogg')
  );
}

function isImageAttachment(attachment: any) {
  const mimeType = String(attachment?.mimeType || '').toLowerCase();
  const type = String(attachment?.attachmentType || '').toUpperCase();
  const fileName = String(attachment?.fileName || '').toLowerCase();
  const fileUrl = String(attachment?.fileUrl || '').toLowerCase();

  return (
    mimeType.startsWith('image/') ||
    type === 'IMAGE' ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png') ||
    fileName.endsWith('.webp') ||
    fileUrl.endsWith('.jpg') ||
    fileUrl.endsWith('.jpeg') ||
    fileUrl.endsWith('.png') ||
    fileUrl.endsWith('.webp')
  );
}