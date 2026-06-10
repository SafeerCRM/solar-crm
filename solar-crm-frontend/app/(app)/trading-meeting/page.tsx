'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type TradingMeeting = {
  id: number;
  dealerId?: number;
  dealerName?: string;
  dealerPhone?: string;
  branchName?: string;
  scheduledAt?: string;
  status?: string;
  meetingNotes?: string;
  expectedMaterialName?: string;
  expectedQuantity?: number;
  expectedOrderValue?: number;
  assignedToName?: string;
  isHidden?: boolean;
};

type Analytics = {
  totalMeetings?: number;
  todaysMeetings?: number;
  completedMeetings?: number;
  pendingMeetings?: number;
  orderExpected?: number;
  orderReceived?: number;
  expectedOrderValue?: number;
};

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatLabel(value?: string) {
  return String(value || '-')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function TradingMeetingPage() {
  const [meetings, setMeetings] = useState<TradingMeeting[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({});
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMeetings = async () => {
    const res = await axios.get(`${API_BASE_URL}/project/trading-meetings`, {
      params: {
        search,
        status,
        showHidden,
        page,
        limit: 20,
      },
      headers: getAuthHeaders(),
    });

    setMeetings(res.data?.data || []);
    setTotalPages(res.data?.totalPages || 1);
  };

  const fetchAnalytics = async () => {
    const res = await axios.get(
      `${API_BASE_URL}/project/trading-meeting-analytics`,
      {
        headers: getAuthHeaders(),
      },
    );

    setAnalytics(res.data || {});
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchMeetings(), fetchAnalytics()]);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to load trading meetings',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, showHidden]);

  const applyFilters = () => {
    setPage(1);
    setTimeout(refreshAll, 50);
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setShowHidden(false);
    setPage(1);
    setTimeout(refreshAll, 50);
  };

  const hideOrRestoreMeeting = async (
    meeting: TradingMeeting,
    restore = false,
  ) => {
    const reason = window.prompt(
      restore
        ? 'Reason for restoring this trading meeting?'
        : 'Reason for hiding this trading meeting?',
      restore ? 'Valid meeting' : 'Test / wrong entry',
    );

    if (reason === null) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/project/trading-meeting/${meeting.id}/${
          restore ? 'restore' : 'hide'
        }`,
        { reason },
        { headers: getAuthHeaders() },
      );

      await refreshAll();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to update trading meeting',
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Trading Meetings
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              B2B dealer meetings, GPS proof, expected material demand and order conversion tracking.
            </p>
          </div>

          <Link
            href="/trading-meeting/create"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            + Create Trading Meeting
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <AnalyticsCard
          title="Total"
          value={analytics.totalMeetings || 0}
        />
        <AnalyticsCard
          title="Today"
          value={analytics.todaysMeetings || 0}
        />
        <AnalyticsCard
          title="Completed"
          value={analytics.completedMeetings || 0}
        />
        <AnalyticsCard
          title="Pending"
          value={analytics.pendingMeetings || 0}
        />
        <AnalyticsCard
          title="Order Expected"
          value={analytics.orderExpected || 0}
        />
        <AnalyticsCard
          title="Expected Value"
          value={money(analytics.expectedOrderValue)}
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            placeholder="Search dealer / phone / branch / notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="POSTPONED">Postponed</option>
            <option value="NO_RESPONSE">No Response</option>
            <option value="ORDER_EXPECTED">Order Expected</option>
            <option value="ORDER_RECEIVED">Order Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <label className="flex items-center gap-2 rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
            />
            View Hidden
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={applyFilters}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply Filters
          </button>

          <button
            onClick={resetFilters}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold"
          >
            Reset
          </button>

          <button
            onClick={refreshAll}
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl bg-white p-4 shadow">
          Loading trading meetings...
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Meeting List
        </h2>

        <div className="mt-4 space-y-3">
          {meetings.length === 0 ? (
            <p className="text-sm text-gray-500">
              No trading meetings found.
            </p>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className={`rounded-xl border p-4 ${
                  meeting.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-bold text-gray-800">
                      {meeting.dealerName || `Meeting #${meeting.id}`}
                    </p>

                    <p className="text-sm text-gray-500">
                      {meeting.dealerPhone || '-'} |{' '}
                      {meeting.branchName || '-'}
                    </p>

                    <p className="text-sm text-gray-500">
                      Date:{' '}
                      {meeting.scheduledAt
                        ? new Date(meeting.scheduledAt).toLocaleString(
                            'en-IN',
                          )
                        : '-'}
                    </p>

                    <p className="mt-1 text-sm">
                      Status:{' '}
                      <span className="font-semibold">
                        {formatLabel(meeting.status)}
                      </span>
                    </p>

                    <p className="mt-1 break-words text-sm text-gray-500">
                      Notes: {meeting.meetingNotes || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Expected: {meeting.expectedMaterialName || '-'} | Qty:{' '}
                      {meeting.expectedQuantity || 0} | Value:{' '}
                      {money(meeting.expectedOrderValue)}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Assigned: {meeting.assignedToName || '-'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/trading-meeting/${meeting.id}`}
                      className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Open
                    </Link>

                    <button
                      onClick={() =>
                        hideOrRestoreMeeting(
                          meeting,
                          !!meeting.isHidden,
                        )
                      }
                      className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${
                        meeting.isHidden
                          ? 'bg-green-600'
                          : 'bg-red-600'
                      }`}
                    >
                      {meeting.isHidden ? 'Restore' : 'Hide'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          setPage={setPage}
        />
      </div>
    </div>
  );
}

function AnalyticsCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-gray-800">
        {value}
      </p>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: (value: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
      <p className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setPage(Math.max(page - 1, 1))}
          disabled={page <= 1}
          className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Previous
        </button>

        <button
          onClick={() => setPage(Math.min(page + 1, totalPages))}
          disabled={page >= totalPages}
          className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}