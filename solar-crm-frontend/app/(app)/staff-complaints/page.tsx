'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type StaffComplaint = {
  id: number;
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  createdBy?: number;
  createdByName?: string;
  createdByRole?: string;
  ownerRemarks?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  isHidden?: boolean;
  hiddenByName?: string;
  hiddenAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Summary = {
  total: number;
  open: number;
  inReview: number;
  resolved: number;
  rejected: number;
};

const emptySummary: Summary = {
  total: 0,
  open: 0,
  inReview: 0,
  resolved: 0,
  rejected: 0,
};

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN');
}

export default function StaffComplaintsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [items, setItems] = useState<StaffComplaint[]>([]);
  const [hiddenItems, setHiddenItems] = useState<StaffComplaint[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [showHidden, setShowHidden] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
  });

  const [statusEdit, setStatusEdit] =
    useState<Record<number, { status: string; ownerRemarks: string }>>({});

  const isOwner =
    Array.isArray(currentUser?.roles) &&
    currentUser.roles.includes('OWNER');

  const getHeaders = () => {
    const token = localStorage.getItem('token');

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/staff-complaints`, {
        params: {
          page,
          limit: 20,
          search,
          status: statusFilter,
          priority: priorityFilter,
        },
        headers: getHeaders(),
      });

      setItems(Array.isArray(res.data?.data) ? res.data.data : []);
      setSummary(res.data?.summary || emptySummary);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to load staff complaints',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchHiddenComplaints = async () => {
    if (!isOwner) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/staff-complaints/hidden`,
        {
          headers: getHeaders(),
        },
      );

      setHiddenItems(Array.isArray(res.data) ? res.data : []);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to load hidden complaints',
      );
    } finally {
      setLoading(false);
    }
  };

  const createComplaint = async () => {
    if (!form.title.trim()) {
      alert('Please enter complaint title');
      return;
    }

    if (!form.description.trim()) {
      alert('Please enter complaint description');
      return;
    }

    try {
      setSaving(true);

      await axios.post(`${API_BASE_URL}/staff-complaints`, form, {
        headers: getHeaders(),
      });

      alert('Complaint submitted successfully');

      setForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
      });

      fetchComplaints();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to submit complaint',
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: StaffComplaint) => {
    setEditingId(item.id);

    setEditForm({
      title: item.title || '',
      description: item.description || '',
      priority: item.priority || 'MEDIUM',
    });
  };

  const updateComplaint = async (id: number) => {
    if (!editForm.title.trim()) {
      alert('Please enter complaint title');
      return;
    }

    if (!editForm.description.trim()) {
      alert('Please enter complaint description');
      return;
    }

    try {
      setSaving(true);

      await axios.patch(
        `${API_BASE_URL}/staff-complaints/${id}`,
        editForm,
        {
          headers: getHeaders(),
        },
      );

      alert('Complaint updated successfully');

      setEditingId(null);
      fetchComplaints();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to update complaint',
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (item: StaffComplaint) => {
    const update = statusEdit[item.id];

    if (!update?.status) {
      alert('Please select status');
      return;
    }

    try {
      setSaving(true);

      await axios.patch(
        `${API_BASE_URL}/staff-complaints/${item.id}/status`,
        {
          status: update.status,
          ownerRemarks: update.ownerRemarks || '',
        },
        {
          headers: getHeaders(),
        },
      );

      alert('Complaint status updated');

      setStatusEdit((prev) => ({
        ...prev,
        [item.id]: {
          status: '',
          ownerRemarks: '',
        },
      }));

      fetchComplaints();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to update status',
      );
    } finally {
      setSaving(false);
    }
  };

  const hideComplaint = async (id: number) => {
    const confirmed = window.confirm(
      'Hide this complaint from normal list?',
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      await axios.patch(
        `${API_BASE_URL}/staff-complaints/${id}/hide`,
        {},
        {
          headers: getHeaders(),
        },
      );

      alert('Complaint hidden');

      fetchComplaints();
      fetchHiddenComplaints();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to hide complaint',
      );
    } finally {
      setSaving(false);
    }
  };

  const restoreComplaint = async (id: number) => {
    const confirmed = window.confirm('Restore this complaint?');

    if (!confirmed) return;

    try {
      setSaving(true);

      await axios.patch(
        `${API_BASE_URL}/staff-complaints/${id}/restore`,
        {},
        {
          headers: getHeaders(),
        },
      );

      alert('Complaint restored');

      fetchHiddenComplaints();
      fetchComplaints();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to restore complaint',
      );
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setPage(1);

    setTimeout(fetchComplaints, 0);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (showHidden && isOwner) {
      fetchHiddenComplaints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHidden, isOwner]);

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-2 pb-4 md:px-0">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Staff Complaints
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Staff can submit complaints. Owner can review, update status,
          hide and restore complaints.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Total" value={summary.total} />
        <SummaryCard title="Open" value={summary.open} />
        <SummaryCard title="In Review" value={summary.inReview} />
        <SummaryCard title="Resolved" value={summary.resolved} />
        <SummaryCard title="Rejected" value={summary.rejected} />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Submit Complaint
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            placeholder="Complaint Title"
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
            value={form.priority}
            onChange={(e) =>
              setForm({
                ...form,
                priority: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <textarea
            placeholder="Complaint Description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            className="rounded-xl border p-3 md:col-span-2"
            rows={4}
          />
        </div>

        <button
          type="button"
          onClick={createComplaint}
          disabled={saving}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            Complaint List
          </h2>

          {isOwner && (
            <button
              type="button"
              onClick={() => setShowHidden((prev) => !prev)}
              className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              {showHidden ? 'Hide Hidden List' : 'View Hidden'}
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            placeholder="Search title / description / staff"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setPage(1);
                fetchComplaints();
              }}
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Apply
            </button>

            <button
              onClick={clearFilters}
              className="flex-1 rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">
              Loading complaints...
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">
              No complaints found.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border bg-gray-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-800">
                        #{item.id} - {item.title}
                      </h3>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                        {formatLabel(item.status)}
                      </span>

                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                        {formatLabel(item.priority)}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                      {item.description}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                      <Info label="Raised By" value={item.createdByName || '-'} />
                      <Info label="Role" value={item.createdByRole || '-'} />
                      <Info label="Created" value={formatDate(item.createdAt)} />
                    </div>

                    {item.ownerRemarks && (
                      <div className="mt-3 rounded-xl bg-white p-3">
                        <p className="text-xs text-gray-500">
                          Owner Remarks
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {item.ownerRemarks}
                        </p>
                      </div>
                    )}

                    {editingId === item.id && (
                      <div className="mt-4 rounded-xl border bg-white p-4">
                        <h4 className="font-bold text-gray-800">
                          Edit Complaint
                        </h4>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <input
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                title: e.target.value,
                              })
                            }
                            className="rounded-xl border p-3"
                          />

                          <select
                            value={editForm.priority}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                priority: e.target.value,
                              })
                            }
                            className="rounded-xl border p-3"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                          </select>

                          <textarea
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                            className="rounded-xl border p-3 md:col-span-2"
                            rows={3}
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => updateComplaint(item.id)}
                            disabled={saving}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            Save
                          </button>

                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {isOwner && (
                      <div className="mt-4 rounded-xl border bg-white p-4">
                        <h4 className="font-bold text-gray-800">
                          Owner Action
                        </h4>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <select
                            value={
                              statusEdit[item.id]?.status ||
                              item.status ||
                              'OPEN'
                            }
                            onChange={(e) =>
                              setStatusEdit((prev) => ({
                                ...prev,
                                [item.id]: {
                                  status: e.target.value,
                                  ownerRemarks:
                                    prev[item.id]?.ownerRemarks ||
                                    item.ownerRemarks ||
                                    '',
                                },
                              }))
                            }
                            className="rounded-xl border p-3"
                          >
                            <option value="OPEN">Open</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="REJECTED">Rejected</option>
                          </select>

                          <input
                            placeholder="Owner Remarks"
                            value={
                              statusEdit[item.id]?.ownerRemarks ||
                              item.ownerRemarks ||
                              ''
                            }
                            onChange={(e) =>
                              setStatusEdit((prev) => ({
                                ...prev,
                                [item.id]: {
                                  status:
                                    prev[item.id]?.status ||
                                    item.status ||
                                    'OPEN',
                                  ownerRemarks: e.target.value,
                                },
                              }))
                            }
                            className="rounded-xl border p-3"
                          />
                        </div>

                        <button
                          onClick={() => updateStatus(item)}
                          disabled={saving}
                          className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Update Status
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:w-[160px]">
                    {(isOwner || item.status === 'OPEN') && (
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                      >
                        Edit
                      </button>
                    )}

                    <button
                      onClick={() => hideComplaint(item.id)}
                      disabled={saving}
                      className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
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

      {isOwner && showHidden && (
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            Hidden Complaints
          </h2>

          <div className="mt-4 space-y-3">
            {hiddenItems.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hidden complaints.
              </p>
            ) : (
              hiddenItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border bg-gray-50 p-4"
                >
                  <p className="font-bold text-gray-800">
                    #{item.id} - {item.title}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Hidden By: {item.hiddenByName || '-'} ·{' '}
                    {formatDate(item.hiddenAt)}
                  </p>

                  <button
                    onClick={() => restoreComplaint(item.id)}
                    disabled={saving}
                    className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
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

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-gray-800">
        {value || '-'}
      </p>
    </div>
  );
}