'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ReworkJob = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  agreedAmount: number | string;
  agreedDate?: string | null;
  completedDate?: string | null;
  remarks?: string | null;
  createdAt?: string;
  materials?: unknown[];
  expenses?: unknown[];
  payments?: unknown[];
  summary?: Record<string, unknown>;
};

type Props = {
  projectId: number | string;
};

const money = (value: unknown) =>
  `₹${Number(value ?? 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const statuses = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

export default function ProjectReworkTab({
  projectId,
}: Props) {
  const [jobs, setJobs] = useState<ReworkJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    agreedAmount: '',
    agreedDate: '',
    remarks: '',
  });

  const headers = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token || ''}`,
    };
  };

  const loadJobs = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError('');

      const response = await axios.get(
        `${API_BASE_URL}/project/${projectId}/reworks`,
        { headers: headers() },
      );

      const data = response.data;

      setJobs(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.reworks)
            ? data.reworks
            : Array.isArray(data?.data)
              ? data.data
              : [],
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Unable to load Re-work jobs.',
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const createJob = async () => {
    if (!form.title.trim()) {
      alert('Enter a Re-work title.');
      return;
    }

    const amount = Number(form.agreedAmount);

    if (
      form.agreedAmount.trim() === '' ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      alert('Enter a valid agreed amount.');
      return;
    }

    try {
      setSaving(true);

      await axios.post(
        `${API_BASE_URL}/project/${projectId}/reworks`,
        {
          title: form.title.trim(),
          description: form.description.trim(),
          agreedAmount: amount,
          agreedDate: form.agreedDate || null,
          remarks: form.remarks.trim(),
        },
        { headers: headers() },
      );

      setForm({
        title: '',
        description: '',
        agreedAmount: '',
        agreedDate: '',
        remarks: '',
      });

      setShowCreate(false);
      await loadJobs();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          'Unable to create Re-work.',
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (
    job: ReworkJob,
    status: string,
  ) => {
    if (status === job.status) return;

    if (
      !window.confirm(
        `Change Re-work #${job.id} to ${status.replaceAll('_', ' ')}?`,
      )
    ) {
      return;
    }

    try {
      setBusyId(job.id);

      await axios.patch(
        `${API_BASE_URL}/project/${projectId}/reworks/${job.id}/status`,
        { status },
        { headers: headers() },
      );

      await loadJobs();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          'Unable to update Re-work status.',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Project Re-work
          </h2>
          <p className="text-sm text-gray-500">
            Additional work, materials and finances tracked
            separately from the original project.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((value) => !value)}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
        >
          {showCreate ? 'Close' : '+ New Re-work'}
        </button>
      </div>

      {showCreate && (
        <div className="space-y-4 rounded-xl border bg-white p-4">
          <h3 className="font-semibold">Create Re-work</h3>

          <input
            className="w-full rounded-lg border p-3"
            placeholder="Re-work title"
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
          />

          <textarea
            className="w-full rounded-lg border p-3"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Agreed Amount (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-lg border p-3"
                value={form.agreedAmount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    agreedAmount: e.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-1 text-sm">
              <span>Agreed Date</span>
              <input
                type="date"
                className="w-full rounded-lg border p-3"
                value={form.agreedDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    agreedDate: e.target.value,
                  }))
                }
              />
            </label>
          </div>

          <textarea
            className="w-full rounded-lg border p-3"
            placeholder="Remarks (optional)"
            value={form.remarks}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                remarks: e.target.value,
              }))
            }
          />

          <button
            type="button"
            disabled={saving}
            onClick={createJob}
            className="rounded-lg bg-green-700 px-5 py-2 text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Create Re-work'}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-gray-500">
          Loading Re-work jobs...
        </p>
      )}

      {!loading && !error && jobs.length === 0 && (
        <p className="rounded-xl border bg-gray-50 p-5 text-sm text-gray-600">
          No Re-work jobs recorded for this project.
        </p>
      )}

      {jobs.map((job) => {
        const isFinal =
          job.status === 'COMPLETED' ||
          job.status === 'CANCELLED';

        return (
          <div
            key={job.id}
            className="space-y-4 rounded-xl border bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">
                  Re-work #{job.id}
                </p>
                <h3 className="text-lg font-bold">
                  {job.title}
                </h3>
                {job.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {job.description}
                  </p>
                )}
              </div>

              <select
                value={job.status}
                disabled={isFinal || busyId === job.id}
                onChange={(e) =>
                  void updateStatus(job, e.target.value)
                }
                className="rounded-lg border px-3 py-2 text-sm"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Agreed Amount
                </p>
                <p className="font-bold">
                  {money(job.agreedAmount)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Agreed Date
                </p>
                <p className="font-semibold">
                  {job.agreedDate || '-'}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Completion Date
                </p>
                <p className="font-semibold">
                  {job.completedDate || '-'}
                </p>
              </div>
            </div>

            {job.remarks && (
              <p className="text-sm text-gray-600">
                <strong>Remarks:</strong> {job.remarks}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}