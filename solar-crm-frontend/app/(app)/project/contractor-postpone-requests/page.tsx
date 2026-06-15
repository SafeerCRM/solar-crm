'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type RequestItem = {
  id: number;
  projectId: number;
  assignmentType?: string;
  contractorName?: string;
  oldDate?: string;
  oldTime?: string;
  requestedDate?: string;
  requestedTime?: string;
  reason?: string;
  status?: string;
  approvalNote?: string;
  createdAt?: string;
  project?: {
    customerName?: string;
    customerPhone?: string;
    city?: string;
    zone?: string;
    branchName?: string;
    projectOwnerName?: string;
    gpsAddress?: string;
    gpsLatitude?: string;
    gpsLongitude?: string;
  };
};

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}

export default function ContractorPostponeRequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [status, setStatus] = useState('');
  const [assignmentType, setAssignmentType] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [date, setDate] = useState<Dayjs | null>(null);
  const [calendarDate, setCalendarDate] = useState<Dayjs | null>(dayjs());

  const fetchRequests = async (targetPage = page) => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const res = await axios.get(
        `${API_BASE_URL}/project/contractor-reschedule`,
        {
          params: {
            page: targetPage,
            limit: 20,
            status,
            assignmentType,
            contractorName,
            projectSearch,
            city,
            zone,
            date: date ? date.format('YYYY-MM-DD') : '',
          },
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        },
      );

      setItems(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total || 0));
      setPage(Number(res.data?.page || targetPage));
      setTotalPages(Number(res.data?.totalPages || 1));
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to load postpone requests',
      );
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (id: number) => {
    try {
      const token = localStorage.getItem('token');

      await axios.patch(
        `${API_BASE_URL}/project/contractor-reschedule/${id}/approve`,
        {},
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        },
      );

      alert('Request approved');
      fetchRequests(page);
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          'Failed to approve request',
      );
    }
  };

  const rejectRequest = async (id: number) => {
    const approvalNote = window.prompt('Reason for rejection?', '');

    if (approvalNote === null) return;

    try {
      const token = localStorage.getItem('token');

      await axios.patch(
        `${API_BASE_URL}/project/contractor-reschedule/${id}/reject`,
        { approvalNote },
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        },
      );

      alert('Request rejected');
      fetchRequests(page);
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          'Failed to reject request',
      );
    }
  };

  const resetFilters = () => {
    setStatus('');
    setAssignmentType('');
    setContractorName('');
    setProjectSearch('');
    setCity('');
    setZone('');
    setDate(null);
    setPage(1);

    setTimeout(() => fetchRequests(1), 0);
  };

  useEffect(() => {
    fetchRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.status === 'PENDING').length,
      approved: items.filter((item) => item.status === 'APPROVED').length,
      rejected: items.filter((item) => item.status === 'REJECTED').length,
      today: items.filter(
        (item) => item.requestedDate === dayjs().format('YYYY-MM-DD'),
      ).length,
    };
  }, [items]);

  const calendarItems = items.filter(
    (item) =>
      calendarDate &&
      item.requestedDate === calendarDate.format('YYYY-MM-DD'),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-6">
      <div className="rounded-2xl bg-white p-5 shadow">
        <Link href="/project/contractor-assignments" className="text-sm font-semibold text-blue-600">
          ← Back to Contractor Assignment Register
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-800">
          Contractor Postpone Requests
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Review contractor work postponement requests calendar-wise, with filters and approvals.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Summary title="Loaded Requests" value={summary.total} />
        <Summary title="Pending" value={summary.pending} />
        <Summary title="Approved" value={summary.approved} />
        <Summary title="Rejected" value={summary.rejected} />
        <Summary title="Today's Requested" value={summary.today} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            Calendar
          </h2>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={calendarDate}
              onChange={(value) => setCalendarDate(value)}
            />
          </LocalizationProvider>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            Requests on{' '}
            {calendarDate ? calendarDate.format('DD MMM YYYY') : '-'}
          </h2>

          {calendarItems.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No requests found for this date.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {calendarItems.map((item) => (
                <MiniRequestCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Filters
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            placeholder="Search contractor"
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Project ID / Customer Name / Phone"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Zone"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={assignmentType}
            onChange={(e) => setAssignmentType(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Work Types</option>
            <option value="SITE_WORK">Site Work</option>
            <option value="CLEANING">Cleaning</option>
          </select>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Requested Date"
              value={date}
              onChange={(value) => setDate(value)}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </LocalizationProvider>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setPage(1);
              fetchRequests(1);
            }}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>

          <button
            onClick={resetFilters}
            className="rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-800"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            Request List
          </h2>

          <p className="text-sm text-gray-500">
            Total {total} · Page {page} of {totalPages}
          </p>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">
            Loading requests...
          </p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No requests found.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border bg-gray-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      Project #{item.projectId} · {item.project?.customerName || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Contractor: {item.contractorName || '-'}
                    </p>

                    <p className="text-sm text-gray-600">
                      City/Zone: {item.project?.city || '-'} / {item.project?.zone || '-'}
                    </p>

                    <p className="text-sm text-gray-600">
                      Type: {formatLabel(item.assignmentType)}
                    </p>

                    <p className="text-sm text-gray-600">
                      Old: {item.oldDate || '-'} {item.oldTime || ''}
                    </p>

                    <p className="text-sm text-gray-600">
                      Requested: {item.requestedDate || '-'} {item.requestedTime || ''}
                    </p>

                    <p className="mt-2 rounded-xl bg-white p-3 text-sm text-gray-700">
                      Reason: {item.reason || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 md:w-[180px]">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-center text-xs font-semibold text-blue-700">
                      {formatLabel(item.status)}
                    </span>

                    <Link
                      href={`/project/${item.projectId}`}
                      className="rounded-xl bg-gray-800 px-4 py-2 text-center text-sm font-semibold text-white"
                    >
                      Open Project
                    </Link>

                    {item.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => approveRequest(item.id)}
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => rejectRequest(item.id)}
                          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow">
        <button
          onClick={() => {
            const next = Math.max(page - 1, 1);
            setPage(next);
            fetchRequests(next);
          }}
          disabled={page <= 1 || loading}
          className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Previous
        </button>

        <p className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </p>

        <button
          onClick={() => {
            const next = Math.min(page + 1, totalPages);
            setPage(next);
            fetchRequests(next);
          }}
          disabled={page >= totalPages || loading}
          className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Summary({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-800">
        {value || 0}
      </p>
    </div>
  );
}

function MiniRequestCard({ item }: { item: RequestItem }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-3">
      <p className="font-bold text-gray-800">
        Project #{item.projectId}
      </p>

      <p className="text-sm text-gray-600">
        {item.project?.customerName || '-'}
      </p>

      <p className="text-sm text-gray-600">
        Contractor: {item.contractorName || '-'}
      </p>

      <p className="text-sm text-gray-600">
        Requested: {item.requestedDate || '-'}
      </p>

      <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        {formatLabel(item.status)}
      </span>
    </div>
  );
}