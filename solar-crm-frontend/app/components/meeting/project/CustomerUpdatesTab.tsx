'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type CustomerUpdate = {
  id: number;
  projectId: number;
  title?: string;
  description?: string;
  updateType?: string;
  visibleToCustomer?: boolean;
  createdByName?: string;
  createdByRole?: string;
  createdAt?: string;
  isHidden?: boolean;
  hiddenReason?: string;
};

type Props = {
  projectId: string;
};

export default function CustomerUpdatesTab({ projectId }: Props) {
  const [updates, setUpdates] = useState<CustomerUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showHidden, setShowHidden] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [form, setForm] = useState({
    title: '',
    description: '',
    updateType: 'GENERAL',
    visibleToCustomer: true,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  const fetchUpdates = async (targetPage = page) => {
    if (!projectId) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/project/${projectId}/customer-updates`,
        {
          params: {
            page: targetPage,
            limit,
            showHidden: showHidden ? 'true' : 'false',
          },
          headers: getAuthHeaders(),
        },
      );

      setUpdates(res.data?.data || []);
      setPage(res.data?.page || targetPage);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to load customer updates',
      );
    } finally {
      setLoading(false);
    }
  };

  const createUpdate = async () => {
    if (!form.title.trim() && !form.description.trim()) {
      alert('Please enter update title or description');
      return;
    }

    try {
      setSaving(true);

      await axios.post(
        `${API_BASE_URL}/project/${projectId}/customer-updates`,
        form,
        {
          headers: getAuthHeaders(),
        },
      );

      alert('Customer update added successfully');

      setForm({
        title: '',
        description: '',
        updateType: 'GENERAL',
        visibleToCustomer: true,
      });

      setShowHidden(false);
      fetchUpdates(1);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to add customer update',
      );
    } finally {
      setSaving(false);
    }
  };

  const hideUpdate = async (id: number) => {
    const reason = window.prompt(
      'Why do you want to hide this customer update?',
      'Test / duplicate entry',
    );

    if (reason === null) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/project/customer-updates/${id}/hide`,
        {
          reason,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      alert('Customer update hidden successfully');
      fetchUpdates(page);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to hide customer update',
      );
    }
  };

  const restoreUpdate = async (id: number) => {
    const reason = window.prompt(
      'Why do you want to restore this customer update?',
      'Restored after review',
    );

    if (reason === null) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/project/customer-updates/${id}/restore`,
        {
          reason,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      alert('Customer update restored successfully');
      fetchUpdates(page);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to restore customer update',
      );
    }
  };

  useEffect(() => {
    fetchUpdates(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, showHidden]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Customer Updates
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add project progress updates visible to the customer portal later.
            </p>
          </div>

          <button
            onClick={() => {
              setShowHidden(!showHidden);
              setPage(1);
            }}
            className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {showHidden ? 'View Active' : 'View Hidden'}
          </button>
        </div>

        {!showHidden && (
          <div className="mt-5 grid gap-3">
            <input
              type="text"
              placeholder="Update title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              className="rounded-xl border p-3"
            />

            <select
              value={form.updateType}
              onChange={(e) =>
                setForm({
                  ...form,
                  updateType: e.target.value,
                })
              }
              className="rounded-xl border p-3"
            >
              <option value="GENERAL">General</option>
              <option value="DOCUMENT">Document</option>
              <option value="LOAN">Loan</option>
              <option value="SUBSIDY">Subsidy</option>
              <option value="ELECTRICITY">Electricity</option>
              <option value="INSTALLATION">Installation</option>
              <option value="PAYMENT">Payment</option>
              <option value="COMPLETION">Completion</option>
              <option value="OTHER">Other</option>
            </select>

            <textarea
              placeholder="Update description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              className="min-h-[100px] rounded-xl border p-3"
            />

            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={form.visibleToCustomer}
                onChange={(e) =>
                  setForm({
                    ...form,
                    visibleToCustomer: e.target.checked,
                  })
                }
              />
              Visible to Customer
            </label>

            <button
              onClick={createUpdate}
              disabled={saving}
              className="w-fit rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Customer Update'}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h3 className="text-lg font-bold text-gray-800">
          {showHidden ? 'Hidden Updates' : 'Active Updates'}
        </h3>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading updates...</p>
        ) : updates.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No customer updates found.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {updates.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {item.title || '-'}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Type: {item.updateType || 'GENERAL'} | Customer Visible:{' '}
                      {item.visibleToCustomer ? 'Yes' : 'No'}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      By: {item.createdByName || '-'}{' '}
                      {item.createdByRole ? `(${item.createdByRole})` : ''}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Date:{' '}
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString('en-IN')
                        : '-'}
                    </p>
                  </div>

                  {showHidden ? (
                    <button
                      onClick={() => restoreUpdate(item.id)}
                      className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => hideUpdate(item.id)}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Hide
                    </button>
                  )}
                </div>

                {item.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                    {item.description}
                  </p>
                )}

                {showHidden && item.hiddenReason && (
                  <p className="mt-2 text-xs text-red-600">
                    Hidden Reason: {item.hiddenReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => fetchUpdates(page - 1)}
              className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Previous
            </button>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => fetchUpdates(page + 1)}
              className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}