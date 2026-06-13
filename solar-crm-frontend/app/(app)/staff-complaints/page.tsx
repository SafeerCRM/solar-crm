'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type StaffComplaint = {
  id: number;
  title?: string;
  description?: string;
  department?: string;
  audioUrl?: string;
  ownerAudioUrl?: string;
  followUpDate?: string;
  followUpTime?: string;
  nextAction?: string;
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
  followUpRequired?: number;
  waitingForStaff?: number;
  resolved: number;
  rejected: number;
};

type FollowUpSummary = {
  todayFollowUps: number;
  upcomingFollowUps: number;
  overdueFollowUps: number;
};

const emptySummary: Summary = {
  total: 0,
  open: 0,
  inReview: 0,
  followUpRequired: 0,
  waitingForStaff: 0,
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

function formatDateOnly(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN');
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

const uploadComplaintAudio = async (file: File) => {
  const token = localStorage.getItem('token');

  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post(
    `${API_BASE_URL}/staff-complaints/audio/upload`,
    formData,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return res.data?.audioUrl || '';
};

export default function StaffComplaintsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [items, setItems] = useState<StaffComplaint[]>([]);
  const [hiddenItems, setHiddenItems] = useState<StaffComplaint[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [followUpSummary, setFollowUpSummary] =
  useState<FollowUpSummary>({
    todayFollowUps: 0,
    upcomingFollowUps: 0,
    overdueFollowUps: 0,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
const [staffNameFilter, setStaffNameFilter] = useState('');
const [followUpDateFilter, setFollowUpDateFilter] = useState('');
const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
const [calendarMonth, setCalendarMonth] = useState(
  new Date().toISOString().slice(0, 7),
);

  const [showHidden, setShowHidden] = useState(false);
  const [complaintAudioFile, setComplaintAudioFile] =
  useState<File | null>(null);

const [ownerAudioFiles, setOwnerAudioFiles] =
  useState<Record<number, File | null>>({});

  const [form, setForm] = useState({
  title: '',
  description: '',
  department: '',
  priority: 'MEDIUM',
  audioUrl: '',
});

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
  title: '',
  description: '',
  department: '',
  priority: 'MEDIUM',
  audioUrl: '',
});

  const [statusEdit, setStatusEdit] =
  useState<
    Record<
      number,
      {
        status: string;
        ownerRemarks: string;
        ownerAudioUrl: string;
        followUpDate: string;
        followUpTime: string;
        nextAction: string;
      }
    >
  >({});

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
  department: departmentFilter,
  staffName: staffNameFilter,
  followUpDate:
    selectedCalendarDate || followUpDateFilter,
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

  const fetchFollowUpSummary = async () => {
  if (!isOwner) return;

  try {
    const res = await axios.get(
      `${API_BASE_URL}/staff-complaints/follow-up-summary`,
      {
        headers: getHeaders(),
      },
    );

    setFollowUpSummary({
      todayFollowUps: Number(res.data?.todayFollowUps || 0),
      upcomingFollowUps: Number(res.data?.upcomingFollowUps || 0),
      overdueFollowUps: Number(res.data?.overdueFollowUps || 0),
    });
  } catch (error) {
    console.error('Failed to load follow-up summary', error);
  }
};

  const createComplaint = async () => {
    if (!form.title.trim()) {
      alert('Please enter complaint title');
      return;
    }

    if (
  !form.description.trim() &&
  !complaintAudioFile
) {
  alert(
    'Please enter description or upload audio',
  );
  return;
}

    try {
      setSaving(true);

      let audioUrl = '';

if (complaintAudioFile) {
  audioUrl =
    await uploadComplaintAudio(
      complaintAudioFile,
    );
}

      await axios.post(
  `${API_BASE_URL}/staff-complaints`,
  {
    ...form,
    audioUrl,
  }, {
        headers: getHeaders(),
      });

      alert('Complaint submitted successfully');

      setForm({
  title: '',
  description: '',
  department: '',
  priority: 'MEDIUM',
  audioUrl: '',
});

setComplaintAudioFile(null);

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
  department: item.department || '',
  priority: item.priority || 'MEDIUM',
  audioUrl: item.audioUrl || '',
});
  };

  const updateComplaint = async (id: number) => {
    if (!editForm.title.trim()) {
      alert('Please enter complaint title');
      return;
    }

    if (
  !editForm.description.trim() &&
  !editForm.audioUrl
) {
  alert('Please enter description or keep/upload audio');
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

      let ownerAudioUrl =
  update.ownerAudioUrl || '';

if (ownerAudioFiles[item.id]) {
  ownerAudioUrl =
    await uploadComplaintAudio(
      ownerAudioFiles[item.id]!,
    );
}

await axios.patch(
  `${API_BASE_URL}/staff-complaints/${item.id}/status`,
  {
    status: update.status,
    ownerRemarks:
      update.ownerRemarks || '',
    ownerAudioUrl,
    followUpDate:
      update.followUpDate || '',
    followUpTime:
      update.followUpTime || '',
    nextAction:
      update.nextAction || '',
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
    ownerAudioUrl: '',
    followUpDate: '',
    followUpTime: '',
    nextAction: '',
  },
}));

      fetchComplaints();
fetchFollowUpSummary();

setOwnerAudioFiles((prev) => ({
  ...prev,
  [item.id]: null,
}));
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
    setDepartmentFilter('');
setStaffNameFilter('');
setFollowUpDateFilter('');
setSelectedCalendarDate('');
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
  if (isOwner) {
    fetchFollowUpSummary();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isOwner]);

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
        <SummaryCard
  title="Follow Up"
  value={
    Number(
      summary.followUpRequired || 0,
    )
  }
/>

<SummaryCard
  title="Waiting Staff"
  value={
    Number(
      summary.waitingForStaff || 0,
    )
  }
/>
        <SummaryCard title="Resolved" value={summary.resolved} />
        <SummaryCard title="Rejected" value={summary.rejected} />
      </div>

      {isOwner && (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
    <SummaryCard
      title="Today's Follow-ups"
      value={followUpSummary.todayFollowUps}
    />

    <SummaryCard
      title="Upcoming Follow-ups"
      value={followUpSummary.upcomingFollowUps}
    />

    <SummaryCard
      title="Overdue Follow-ups"
      value={followUpSummary.overdueFollowUps}
    />
  </div>
)}

{isOwner && (
  <div className="rounded-2xl bg-white p-5 shadow">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-bold text-gray-800">
          Complaint Follow-up Calendar
        </h2>

        <p className="text-sm text-gray-500">
          Select a date to filter complaints by follow-up date.
        </p>
      </div>

      <input
        type="month"
        value={calendarMonth}
        onChange={(e) => {
          setCalendarMonth(e.target.value);
          setSelectedCalendarDate('');
        }}
        className="rounded-xl border p-3"
      />
    </div>

    <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-500">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day}>{day}</div>
      ))}
    </div>

    <CalendarGrid
      calendarMonth={calendarMonth}
      selectedCalendarDate={selectedCalendarDate}
      complaints={items}
      onSelectDate={(date) => {
        setSelectedCalendarDate(date);
        setFollowUpDateFilter(date);
        setPage(1);
        setTimeout(fetchComplaints, 0);
      }}
    />

    {selectedCalendarDate && (
      <button
        type="button"
        onClick={() => {
          setSelectedCalendarDate('');
          setFollowUpDateFilter('');
          setPage(1);
          setTimeout(fetchComplaints, 0);
        }}
        className="mt-4 rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800"
      >
        Clear Calendar Date Filter
      </button>
    )}
  </div>
)}

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

          <input
  placeholder="Department"
  value={form.department}
  onChange={(e) =>
    setForm({
      ...form,
      department: e.target.value,
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

        <div className="md:col-span-2">
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Complaint Audio (Optional)
  </label>

  <input
    type="file"
    accept="audio/*"
    onChange={(e) =>
      setComplaintAudioFile(
        e.target.files?.[0] || null,
      )
    }
    className="w-full rounded-xl border p-3"
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

          <input
  placeholder="Department"
  value={departmentFilter}
  onChange={(e) =>
    setDepartmentFilter(e.target.value)
  }
  className="rounded-xl border p-3"
/>

<input
  placeholder="Staff Name"
  value={staffNameFilter}
  onChange={(e) =>
    setStaffNameFilter(e.target.value)
  }
  className="rounded-xl border p-3"
/>

<input
  type="date"
  value={followUpDateFilter}
  onChange={(e) =>
    setFollowUpDateFilter(
      e.target.value,
    )
  }
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
<option value="FOLLOW_UP_REQUIRED">Follow Up Required</option>
<option value="WAITING_FOR_STAFF">Waiting For Staff</option>
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

                    {item.audioUrl && (
  <div className="mt-3">
    <audio
      controls
      className="w-full"
      src={item.audioUrl}
    />
  </div>
)}

                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
  <Info label="Raised By" value={item.createdByName || '-'} />
  <Info label="Role" value={item.createdByRole || '-'} />
  <Info label="Department" value={item.department || '-'} />
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

                    {item.ownerAudioUrl && (
  <div className="mt-3 rounded-xl bg-white p-3">
    <p className="text-xs text-gray-500">
      Owner Audio Response
    </p>

    <audio
      controls
      className="mt-2 w-full"
      src={item.ownerAudioUrl}
    />
  </div>
)}

                    {item.followUpDate && (
  <div className="mt-3 rounded-xl bg-blue-50 p-3">
    <p className="text-xs text-gray-500">
      Follow Up
    </p>

    <p className="mt-1 text-sm font-semibold text-gray-800">
      {formatDateOnly(item.followUpDate)}
      {item.followUpTime
        ? ` • ${item.followUpTime}`
        : ''}
    </p>

    {item.nextAction && (
      <p className="mt-1 text-sm text-gray-700">
        {item.nextAction}
      </p>
    )}
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

                          <input
  placeholder="Department"
  value={editForm.department}
  onChange={(e) =>
    setEditForm({
      ...editForm,
      department: e.target.value,
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

                          {editForm.audioUrl && (
  <div className="md:col-span-2">
    <p className="mb-1 text-xs text-gray-500">
      Existing Complaint Audio
    </p>

    <audio
      controls
      className="w-full"
      src={editForm.audioUrl}
    />
  </div>
)}
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
    ownerAudioUrl:
      prev[item.id]?.ownerAudioUrl ||
      item.ownerAudioUrl ||
      '',
    followUpDate:
      prev[item.id]?.followUpDate ||
      item.followUpDate ||
      '',
    followUpTime:
      prev[item.id]?.followUpTime ||
      item.followUpTime ||
      '',
    nextAction:
      prev[item.id]?.nextAction ||
      item.nextAction ||
      '',
  },
}))
                            }
                            className="rounded-xl border p-3"
                          >
                            <option value="OPEN">Open</option>
<option value="IN_REVIEW">In Review</option>
<option value="FOLLOW_UP_REQUIRED">
  Follow Up Required
</option>
<option value="WAITING_FOR_STAFF">
  Waiting For Staff
</option>
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
    ownerAudioUrl:
      prev[item.id]?.ownerAudioUrl ||
      item.ownerAudioUrl ||
      '',
    followUpDate:
      prev[item.id]?.followUpDate ||
      item.followUpDate ||
      '',
    followUpTime:
      prev[item.id]?.followUpTime ||
      item.followUpTime ||
      '',
    nextAction:
      prev[item.id]?.nextAction ||
      item.nextAction ||
      '',
  },
}))
                            }
                            className="rounded-xl border p-3"
                          />

                          <input
  type="date"
  value={
    statusEdit[item.id]?.followUpDate ||
    item.followUpDate ||
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
        ownerRemarks:
          prev[item.id]?.ownerRemarks ||
          item.ownerRemarks ||
          '',
        ownerAudioUrl:
          prev[item.id]?.ownerAudioUrl ||
          item.ownerAudioUrl ||
          '',
        followUpDate: e.target.value,
        followUpTime:
          prev[item.id]?.followUpTime ||
          item.followUpTime ||
          '',
        nextAction:
          prev[item.id]?.nextAction ||
          item.nextAction ||
          '',
      },
    }))
  }
  className="rounded-xl border p-3"
/>

<input
  type="time"
  value={
    statusEdit[item.id]?.followUpTime ||
    item.followUpTime ||
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
        ownerRemarks:
          prev[item.id]?.ownerRemarks ||
          item.ownerRemarks ||
          '',
        ownerAudioUrl:
          prev[item.id]?.ownerAudioUrl ||
          item.ownerAudioUrl ||
          '',
        followUpDate:
          prev[item.id]?.followUpDate ||
          item.followUpDate ||
          '',
        followUpTime: e.target.value,
        nextAction:
          prev[item.id]?.nextAction ||
          item.nextAction ||
          '',
      },
    }))
  }
  className="rounded-xl border p-3"
/>

<input
  placeholder="Next Action"
  value={
    statusEdit[item.id]?.nextAction ||
    item.nextAction ||
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
        ownerRemarks:
          prev[item.id]?.ownerRemarks ||
          item.ownerRemarks ||
          '',
        ownerAudioUrl:
          prev[item.id]?.ownerAudioUrl ||
          item.ownerAudioUrl ||
          '',
        followUpDate:
          prev[item.id]?.followUpDate ||
          item.followUpDate ||
          '',
        followUpTime:
          prev[item.id]?.followUpTime ||
          item.followUpTime ||
          '',
        nextAction: e.target.value,
      },
    }))
  }
  className="rounded-xl border p-3"
/>

<div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Owner Audio Response
  </label>

  <input
    type="file"
    accept="audio/*"
    onChange={(e) =>
      setOwnerAudioFiles((prev) => ({
        ...prev,
        [item.id]:
          e.target.files?.[0] || null,
      }))
    }
    className="w-full rounded-xl border p-3"
  />
</div>
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

function CalendarGrid({
  calendarMonth,
  selectedCalendarDate,
  complaints,
  onSelectDate,
}: {
  calendarMonth: string;
  selectedCalendarDate: string;
  complaints: StaffComplaint[];
  onSelectDate: (date: string) => void;
}) {
  const [year, month] = calendarMonth.split('-').map(Number);

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const today = getTodayDateString();

  const followUpDateSet = new Set(
    complaints
      .map((item) => item.followUpDate)
      .filter(Boolean) as string[],
  );

  const cells = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push(date);
  }

  return (
    <div className="mt-2 grid grid-cols-7 gap-2">
      {cells.map((date, index) => {
        if (!date) {
          return <div key={`empty-${index}`} />;
        }

        const day = Number(date.split('-')[2]);
        const hasFollowUp = followUpDateSet.has(date);
        const isSelected = selectedCalendarDate === date;
        const isToday = today === date;

        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelectDate(date)}
            className={`min-h-[48px] rounded-xl border p-2 text-sm font-semibold ${
              isSelected
                ? 'bg-blue-600 text-white'
                : hasFollowUp
                  ? 'bg-yellow-100 text-yellow-800'
                  : isToday
                    ? 'bg-green-100 text-green-800'
                    : 'bg-white text-gray-700'
            }`}
          >
            {day}

            {hasFollowUp && (
              <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-current" />
            )}
          </button>
        );
      })}
    </div>
  );
}