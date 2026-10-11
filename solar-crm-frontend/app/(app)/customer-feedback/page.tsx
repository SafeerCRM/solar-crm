
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Feedback = {
  id: number;
  activityId: number;
  activityType: string | null;
  projectId: number | null;
  customerName: string;
  customerPhone: string;
  kNumber: string;
  projectOwnerName: string;
  projectOwnerRole: string;
  rating: number;
  submittedAt: string;
};

type FeedbackResponse = {
  data: Feedback[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const activityLabels: Record<string, string> = {
  STRUCTURE_WORK: 'Structure Work',
  PANEL_INSTALLED: 'Panel Installation',
  INVERTER_INSTALLED: 'Inverter Installation',
};

export default function CustomerFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [rating, setRating] = useState('');
  const [activityType, setActivityType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const limit = 20;

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (!API_BASE_URL) {
        throw new Error('API URL is not configured.');
      }

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Please log in to view customer feedback.');
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (rating) params.set('rating', rating);
      if (activityType) params.set('activityType', activityType);

      const response = await fetch(
        `${API_BASE_URL}/webhooks/whatsapp/customer-feedback?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? 'You do not have permission to view customer feedback.'
            : `Unable to load customer feedback (${response.status}).`,
        );
      }

      const result: FeedbackResponse = await response.json();

      setFeedback(Array.isArray(result.data) ? result.data : []);
      setTotal(Number(result.total) || 0);
      setTotalPages(Number(result.totalPages) || 0);
    } catch (err) {
      setFeedback([]);
      setTotal(0);
      setTotalPages(0);
      setError(
        err instanceof Error ? err.message : 'Unable to load feedback.',
      );
    } finally {
      setLoading(false);
    }
  }, [page, rating, activityType]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const averageRating = feedback.length
    ? feedback.reduce((sum, item) => sum + item.rating, 0) /
      feedback.length
    : 0;

  const positiveRatings = feedback.filter(
    (item) => item.rating >= 4,
  ).length;

  const formatDate = (value: string) => {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (value: number) => (
    <span
      className="whitespace-nowrap text-lg tracking-wide text-amber-500"
      aria-label={`${value} out of 5 stars`}
    >
      {'★'.repeat(Math.max(0, Math.min(5, value)))}
      <span className="text-gray-200">
        {'★'.repeat(Math.max(0, 5 - value))}
      </span>
    </span>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Customer Feedback
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          WhatsApp ratings received after solar installation activities.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Feedback</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {total}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Average Rating (Current Page)
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {averageRating.toFixed(1)}
            <span className="ml-1 text-base text-gray-400">/ 5</span>
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Positive Ratings (Current Page)
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {positiveRatings}
            <span className="ml-1 text-base font-normal text-gray-400">
              / {feedback.length}
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Installation Activity
            </label>
            <select
              value={activityType}
              onChange={(e) => {
                setActivityType(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800"
            >
              <option value="">All Activities</option>
              <option value="STRUCTURE_WORK">Structure Work</option>
              <option value="PANEL_INSTALLED">Panel Installation</option>
              <option value="INVERTER_INSTALLED">Inverter Installation</option>
            </select>
          </div>

          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Customer Rating
            </label>
            <select
              value={rating}
              onChange={(e) => {
                setRating(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800"
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} Star{value !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadFeedback()}
            disabled={loading}
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Customer Ratings
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {total} matching feedback entries
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Loading customer feedback...
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No customer feedback found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Project</th>
                  <th className="px-5 py-4">Activity</th>
                  <th className="px-5 py-4">Rating</th>
                  <th className="px-5 py-4">Project Owner</th>
                  <th className="px-5 py-4">Submitted</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {feedback.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">
                        {item.customerName || '—'}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {item.customerPhone || '—'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {item.projectId ? (
                        <Link
                          href={`/project/${item.projectId}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          #{item.projectId}
                        </Link>
                      ) : (
                        '—'
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        K-No: {item.kNumber || '—'}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {activityLabels[item.activityType || ''] ||
                        item.activityType ||
                        '—'}
                    </td>

                    <td className="px-5 py-4">
                      {renderStars(item.rating)}
                      <div className="mt-1 text-xs font-medium text-gray-500">
                        {item.rating}/5
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">
                        {item.projectOwnerName || '—'}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {item.projectOwnerRole || ''}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {formatDate(item.submittedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
          <p className="text-sm text-gray-500">
            Page {page} of {Math.max(1, totalPages)}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
