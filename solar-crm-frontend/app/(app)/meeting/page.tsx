'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { CallControl } from '@/lib/callControl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { getAuthHeaders } from '@/lib/authHeaders';

type Meeting = {
  id: number;
  meetingGroupId?: number | null;
  leadId: number;
  followupId?: number | null;
  customerName: string;
  mobile: string;
  address?: string | null;
  scheduledAt: string;
  assignedTo?: number | null;
  assignedToName?: string | null;
  meetingType: string;
  meetingCategory?: string | null;
  status: string;
  notes?: string | null;
  reason?: string | null;
  outcome?: string | null;
  nextAction?: string | null;
  managerRemarks?: string | null;
  siteObservation?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  gpsAddress?: string | null;
  panelGivenToCustomerKw?: number | null;
  inverterCapacityKw?: number | null;
  structureKw?: number | null;
  proposedSystemKw?: number | null;
  meetingCount?: number | null;
  convertToProject?: boolean | null;
  createdBy?: number | null;
  createdByName?: string | null;
  updatedBy?: number | null;
  updatedByName?: string | null;
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: number;
  name: string;
  email?: string;
  roles?: string[];
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const MEETING_FILTER_STORAGE_KEY = 'meetingPageFilters';

export default function MeetingPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingPage, setMeetingPage] = useState(1);
const [meetingTotal, setMeetingTotal] = useState(0);
const meetingLimit = 50;
  const [message, setMessage] = useState('');
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null);
const [editingCustomerName, setEditingCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

 const [meetingManagerName, setMeetingManagerName] = useState('');
const [meetingManagerId, setMeetingManagerId] = useState('');
const [meetingManagers, setMeetingManagers] = useState<User[]>([]);
const [bulkAssignMeetingManagerId, setBulkAssignMeetingManagerId] = useState('');
const [bulkAssigning, setBulkAssigning] = useState(false);
const [meetingCategory, setMeetingCategory] = useState('');
const [meetingStatus, setMeetingStatus] = useState('');
const [month, setMonth] = useState('');
const [isAutoCalling, setIsAutoCalling] = useState(false);
const [isAutoCallPaused, setIsAutoCallPaused] = useState(false);
const [autoCallIndex, setAutoCallIndex] = useState(0);
const [calledMeetingIds, setCalledMeetingIds] = useState<number[]>([]);

  useEffect(() => {
  setMounted(true);

  const storedUser = localStorage.getItem('user');

  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      setCurrentUserRoles(
        Array.isArray(parsed?.roles) ? parsed.roles : [],
      );
    } catch (err) {
      console.error(err);
    }
  }

  const savedFilters = sessionStorage.getItem(
    MEETING_FILTER_STORAGE_KEY,
  );

  if (savedFilters) {
    try {
      const parsed = JSON.parse(savedFilters);

      setSearchName(parsed.searchName || '');
      setSearchPhone(parsed.searchPhone || '');
      setSearchLocation(parsed.searchLocation || '');
      setMeetingManagerName(parsed.meetingManagerName || '');
      setMeetingManagerId(parsed.meetingManagerId || '');
      setMeetingCategory(parsed.meetingCategory || '');
      setMeetingStatus(parsed.meetingStatus || '');
      setMonth(parsed.month || '');

      const savedPage = Number(parsed.meetingPage || 1);

      setMeetingPage(savedPage > 0 ? savedPage : 1);
    } catch (err) {
      console.error(err);
      fetchMeetings(1);
    }
  } else {
    fetchMeetings(1);
  }

  fetchMeetingManagers();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const saveMeetingFilters = (pageNumber = meetingPage) => {
  sessionStorage.setItem(
    MEETING_FILTER_STORAGE_KEY,
    JSON.stringify({
      searchName,
      searchPhone,
      searchLocation,
      meetingManagerName,
      meetingManagerId,
      meetingCategory,
      meetingStatus,
      month,
      meetingPage: pageNumber,
    }),
  );
};

  const fetchMeetings = async (pageNumber = meetingPage) => {
  try {
    setLoading(true);
    setMessage('');

    const params: Record<string, string | number> = {
      page: pageNumber,
      limit: meetingLimit,
    };

    if (meetingManagerName.trim()) {
      params.assignedToName = meetingManagerName.trim();
    }

    if (meetingManagerId.trim()) {
      params.assignedTo = meetingManagerId.trim();
    }

    if (meetingCategory.trim()) {
      params.meetingCategory = meetingCategory.trim();
    }

    if (meetingStatus.trim()) {
  params.status = meetingStatus.trim();
}

    if (month.trim()) {
      params.month = month.trim();
    }

    const res = await axios.get(`${backendUrl}/meetings`, {
      headers: getAuthHeaders(),
      params,
    });

    setMeetings(Array.isArray(res.data?.data) ? res.data.data : []);
    setMeetingTotal(Number(res.data?.total || 0));
  } catch (err) {
    console.error(err);
    setMessage('Failed to fetch meetings');
    setMeetings([]);
    setMeetingTotal(0);
  } finally {
    setLoading(false);
  }
};

const fetchMeetingManagers = async () => {
  try {
    const res = await axios.get(`${backendUrl}/users/meeting-managers`, {
      headers: getAuthHeaders(),
    });

    setMeetingManagers(Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to fetch meeting managers:', err);
    setMeetingManagers([]);
  }
};

  const filteredMeetings = useMemo(() => {
    let data = meetings;

    if (searchName.trim()) {
      data = data.filter((m) =>
        (m.customerName || '').toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchPhone.trim()) {
      data = data.filter((m) => (m.mobile || '').includes(searchPhone));
    }

    if (searchLocation.trim()) {
      data = data.filter((m) => {
        const address = (m.address || '').toLowerCase();
        const gps = (m.gpsAddress || '').toLowerCase();
        const query = searchLocation.toLowerCase();

        return address.includes(query) || gps.includes(query);
      });
    }

    return data;
  }, [meetings, searchName, searchPhone, searchLocation]);

  const meetingsBySelectedDate = useMemo(() => {
  if (!selectedDate) return [];

  return filteredMeetings.filter((m) => {
    return dayjs(m.scheduledAt).isSame(selectedDate, 'day');
  });
}, [filteredMeetings, selectedDate]);

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-600';
      case 'CANCELLED':
        return 'bg-red-600';
      case 'RESCHEDULED':
        return 'bg-yellow-500';
      case 'CONVERTED_TO_PROJECT':
        return 'bg-purple-600';
      case 'ON_HOLD':
        return 'bg-orange-600';
      case 'NO_SHOW':
        return 'bg-gray-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getMapsUrl = (meeting: Meeting) => {
    if (meeting.gpsLatitude && meeting.gpsLongitude) {
      return `https://www.google.com/maps/search/?api=1&query=${meeting.gpsLatitude},${meeting.gpsLongitude}`;
    }

    const fallbackAddress = meeting.gpsAddress || meeting.address || '';
    if (!fallbackAddress.trim()) return '';

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      fallbackAddress
    )}`;
  };

  const handleCall = async (phone?: string | null) => {
  const number = String(phone || '').trim();

  if (!number) {
    alert('No mobile number available');
    return;
  }

  try {
    if (Capacitor.isNativePlatform()) {
      const plugin = (window as any).Capacitor?.Plugins?.CallControl || CallControl;
      await plugin.placeCall({ number });
    } else {
      window.location.href = `tel:${number}`;
    }
  } catch (err) {
    console.error(err);
    alert('Failed to start call');
  }
};

const updateMeetingName = async (meetingId: number) => {
  try {
    await axios.patch(
      `${backendUrl}/meetings/${meetingId}`,
      { customerName: editingCustomerName },
      { headers: getAuthHeaders() }
    );

    setMessage('Meeting name updated');
    setEditingMeetingId(null);
    setEditingCustomerName('');
    await fetchMeetings();
  } catch (err) {
    console.error(err);
    setMessage('Failed to update meeting name');
  }
};

const isMeetingAssistant =
  currentUserRoles.includes('MEETING_ASSISTANT');

  const startMeetingAutoCall = async () => {
  if (filteredMeetings.length === 0) {
    alert('No meetings available for autocall');
    return;
  }

  setIsAutoCalling(true);
  setIsAutoCallPaused(false);

  for (let i = autoCallIndex; i < filteredMeetings.length; i++) {
    if (isAutoCallPaused) {
      break;
    }

    const meeting = filteredMeetings[i];

    if (calledMeetingIds.includes(meeting.id)) {
      continue;
    }

    setAutoCallIndex(i);
    setCalledMeetingIds((prev) =>
      prev.includes(meeting.id) ? prev : [...prev, meeting.id],
    );

    try {
      await handleCall(meeting.mobile);
    } catch (err) {
      console.error(err);
    }

    await new Promise((resolve) => setTimeout(resolve, 6000));
  }

  setIsAutoCalling(false);
};

const pauseMeetingAutoCall = () => {
  setIsAutoCallPaused(true);
  setIsAutoCalling(false);
};

const stopMeetingAutoCall = () => {
  setIsAutoCalling(false);
  setIsAutoCallPaused(false);
  setAutoCallIndex(0);
  setCalledMeetingIds([]);
};

const bulkAssignFilteredMeetings = async () => {
  if (!bulkAssignMeetingManagerId) {
    setMessage('Please select meeting manager for bulk assignment.');
    return;
  }

  const selectedManager = meetingManagers.find(
    (manager) => String(manager.id) === String(bulkAssignMeetingManagerId),
  );

  if (!selectedManager) {
    setMessage('Selected meeting manager not found.');
    return;
  }

  const hasAnyFilter =
    !!meetingManagerId ||
    !!meetingStatus ||
    !!meetingCategory ||
    !!month ||
    !!searchName.trim() ||
    !!searchPhone.trim() ||
    !!searchLocation.trim();

  if (!hasAnyFilter) {
    setMessage('Please apply at least one filter before bulk assigning meetings.');
    return;
  }

  const confirmed = window.confirm(
    `This will assign all meetings matching current filters to ${selectedManager.name}. Continue?`,
  );

  if (!confirmed) return;

  try {
    setBulkAssigning(true);
    setMessage('');

    const res = await axios.patch(
      `${backendUrl}/meetings/bulk/reassign`,
      {
        assignedTo: selectedManager.id,
        assignedToName: selectedManager.name,
        filters: {
          assignedTo: meetingManagerId || undefined,
          status: meetingStatus || undefined,
          meetingCategory: meetingCategory || undefined,
          month: month || undefined,
          customerName: searchName.trim() || undefined,
          mobile: searchPhone.trim() || undefined,
          location: searchLocation.trim() || undefined,
        },
      },
      { headers: getAuthHeaders() },
    );

    setMessage(
      res.data?.message
        ? `${res.data.message}. Updated: ${res.data.affected || 0}`
        : 'Filtered meetings reassigned successfully.',
    );

    setMeetingPage(1);
    await fetchMeetings(1);
  } catch (err: any) {
    console.error(err);
    setMessage(
      err?.response?.data?.message ||
        'Failed to bulk assign filtered meetings.',
    );
  } finally {
    setBulkAssigning(false);
  }
};

  const clearFilters = () => {
  sessionStorage.removeItem(MEETING_FILTER_STORAGE_KEY);

  setSearchName('');
  setSearchPhone('');
  setSearchLocation('');
  setMeetingManagerName('');
  setMeetingManagerId('');
  setMeetingCategory('');
  setMeetingStatus('');
  setMonth('');
  setMeetingPage(1);

  fetchMeetings(1);
};

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Meeting Dashboard</h1>

        <div className="flex gap-2">
          <button
            onClick={() => fetchMeetings(meetingPage)}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Refresh
          </button>

          {isMeetingAssistant && (
  <>
    {!isAutoCalling ? (
      <button
        onClick={startMeetingAutoCall}
        className="rounded bg-green-700 px-4 py-2 text-white"
      >
        ▶ Start Autocall
      </button>
    ) : (
      <button
        onClick={pauseMeetingAutoCall}
        className="rounded bg-yellow-600 px-4 py-2 text-white"
      >
        ⏸ Pause
      </button>
    )}

    <button
      onClick={stopMeetingAutoCall}
      className="rounded bg-red-600 px-4 py-2 text-white"
    >
      ⏹ Stop
    </button>
  </>
)}

          <Link
            href="/meeting/create"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            + Create Meeting
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <input
          type="text"
          placeholder="Search Customer Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="rounded border p-2"
        />

        <input
          type="text"
          placeholder="Search Mobile"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="rounded border p-2"
        />

        <input
          type="text"
          placeholder="Search Address / Location"
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
          className="rounded border p-2"
        />
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
  <select
    value={meetingManagerId}
    onChange={(e) => {
      setMeetingManagerId(e.target.value);
      const selected = meetingManagers.find(
        (manager) => String(manager.id) === e.target.value,
      );
      setMeetingManagerName(selected?.name || '');
    }}
    className="rounded border p-2"
  >
    <option value="">All Meeting Managers</option>
    {meetingManagers.map((manager) => (
      <option key={manager.id} value={manager.id}>
        {manager.name} ({manager.id})
      </option>
    ))}
  </select>

  <select
    value={meetingStatus}
    onChange={(e) => setMeetingStatus(e.target.value)}
    className="rounded border p-2"
  >
    <option value="">All Status</option>
    <option value="SCHEDULED">Scheduled</option>
    <option value="COMPLETED">Completed</option>
    <option value="RESCHEDULED">Rescheduled</option>
    <option value="CANCELLED">Cancelled</option>
    <option value="ON_HOLD">On Hold</option>
    <option value="NO_SHOW">No Show</option>
    <option value="CONVERTED_TO_PROJECT">Converted To Project</option>
  </select>

        <select
          value={meetingCategory}
          onChange={(e) => setMeetingCategory(e.target.value)}
          className="rounded border p-2"
        >
          <option value="">Meeting Category</option>
          <option value="COMPANY_MEETING">Company Meeting</option>
          <option value="SELF_MEETING">Self Meeting</option>
          <option value="SOLARMITER">SOLARMITER</option>
        </select>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded border p-2"
        />
      </div>

      <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
  <div className="mb-2">
    <p className="text-sm font-semibold text-orange-800">
      Bulk Assign Filtered Meetings
    </p>
    <p className="text-xs text-orange-700">
      Apply at least one filter first, then assign all matching meetings to a meeting manager.
    </p>
  </div>

  <div className="flex flex-col gap-2 md:flex-row md:items-center">
    <select
      value={bulkAssignMeetingManagerId}
      onChange={(e) => setBulkAssignMeetingManagerId(e.target.value)}
      className="rounded border p-2 text-sm"
    >
      <option value="">Select Meeting Manager</option>
      {meetingManagers.map((manager) => (
        <option key={`bulk-${manager.id}`} value={manager.id}>
          {manager.name} ({manager.id})
        </option>
      ))}
    </select>

    <button
      type="button"
      onClick={bulkAssignFilteredMeetings}
      disabled={bulkAssigning}
      className="rounded bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
    >
      {bulkAssigning ? 'Assigning...' : 'Assign All Filtered Meetings'}
    </button>
  </div>
</div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <div>
          Total: {meetingTotal} | This Page: {meetings.length} | Filtered: {filteredMeetings.length}
        </div>

        <div className="flex gap-2">
          <button
  onClick={() => {
  saveMeetingFilters(1);
  setMeetingPage(1);
  fetchMeetings(1);
}}
  disabled={loading}
  className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
>
  {loading ? 'Applying...' : 'Apply Filters'}
</button>

          <button
            onClick={clearFilters}
            className="text-blue-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {message && <p className="mb-4 text-sm text-blue-600">{message}</p>}

      <div className="mb-6 rounded-2xl bg-white p-4 shadow md:p-6">
  <h2 className="mb-4 text-lg font-semibold">Meeting Calendar</h2>

  <div className="grid grid-cols-1 gap-6 md:grid-cols-[350px_1fr]">
    
    {/* LEFT: Calendar */}
    <div className="rounded-xl bg-gray-50 p-3">
      {mounted && (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DateCalendar
      value={selectedDate}
      onChange={(newValue) => setSelectedDate(newValue)}
    />
  </LocalizationProvider>
)}
    </div>

    {/* RIGHT: Meetings of selected date */}
    <div>
      <h3 className="mb-3 text-sm font-medium text-gray-600">
        Meetings on selected date: {meetingsBySelectedDate.length}
      </h3>

      {meetingsBySelectedDate.length === 0 ? (
        <p className="text-sm text-gray-500">No meetings</p>
      ) : (
        <div className="grid gap-3">
          {meetingsBySelectedDate.map((m) => (
            <div
              key={`calendar-${m.id}`}
              className="rounded-xl border p-3"
            >
              <div className="font-medium">{m.customerName}</div>
              <div className="text-sm text-gray-600">{m.mobile}</div>
              <div className="text-xs text-gray-500">
                {new Date(m.scheduledAt).toLocaleString()}
              </div>

              <Link
                href={`/meeting/${m.id}`}
                className="mt-2 inline-block rounded bg-blue-600 px-3 py-1 text-white text-sm"
              >
                Open
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</div>

            {loading ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow">
          Loading meetings...
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow">
          No meetings found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMeetings.map((m) => {
            const mapsUrl = getMapsUrl(m);

            return (
              <div
                key={m.id}
                className="rounded-2xl bg-white p-5 shadow transition hover:shadow-md"
              >
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    {editingMeetingId === m.id ? (
                      <div className="flex gap-2">
                        <input
                          value={editingCustomerName}
                          onChange={(e) => setEditingCustomerName(e.target.value)}
                          className="rounded border px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => updateMeetingName(m.id)}
                          className="rounded bg-green-600 px-2 text-sm text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMeetingId(null)}
                          className="rounded bg-gray-400 px-2 text-sm text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="break-words text-lg font-semibold text-gray-800">
                          {m.customerName || 'No Name'}
                        </h2>
                        <button
                          onClick={() => {
                            setEditingMeetingId(m.id);
                            setEditingCustomerName(m.customerName);
                          }}
                          className="text-sm text-blue-600"
                        >
                          ✏️
                        </button>
                      </div>
                    )}

                    <p className="text-sm text-gray-500">Lead ID: {m.leadId}</p>
                    <p className="text-sm text-gray-500">Meeting ID: {m.id}</p>
                  </div>

                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium text-white ${statusBadgeClass(
                      m.status
                    )}`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Mobile:</span> {m.mobile || '-'}
                  </p>

                  <p>
                    <span className="font-medium">Scheduled:</span>{' '}
                    {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : '-'}
                  </p>

                  <p>
                    <span className="font-medium">Type:</span> {m.meetingType || '-'}
                  </p>

                  <p>
  <span className="font-medium">Category:</span>{' '}
  {m.meetingCategory === 'SOLARMITER' ? (
    <span className="rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-white">
      SOLARMITER
    </span>
  ) : (
    m.meetingCategory || '-'
  )}
</p>

                  <p>
                    <span className="font-medium">Assigned To:</span>{' '}
                    {m.assignedToName || m.assignedTo || 'Unassigned'}
                  </p>

                  <p>
                    <span className="font-medium">Created By:</span>{' '}
                    {m.createdByName || m.createdBy || '-'}
                  </p>

                  <p className="break-words">
                    <span className="font-medium">Location:</span>{' '}
                    {m.gpsAddress || m.address || 'No address'}
                  </p>

                  <p>
                    <span className="font-medium">Meeting Count:</span>{' '}
                    {m.meetingCount || '-'}
                  </p>

                  <p className="break-words">
                    <span className="font-medium">Next Action:</span>{' '}
                    {m.nextAction || '-'}
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link
                    href={`/meeting/${m.id}`}
                    className="w-full rounded bg-purple-600 px-3 py-2 text-center text-sm text-white sm:w-auto"
                  >
                    Open
                  </Link>

                  <button
  type="button"
  onClick={() => handleCall(m.mobile)}
  className="w-full rounded bg-green-700 px-3 py-2 text-center text-sm text-white sm:w-auto"
>
  📞 Call
</button>

                  <Link
                    href={`/calculator?meetingId=${m.id}&leadId=${m.leadId}&name=${encodeURIComponent(
                      m.customerName || ''
                    )}&phone=${encodeURIComponent(m.mobile || '')}&city=${encodeURIComponent(
                      m.gpsAddress || m.address || ''
                    )}&electricityBill=${m.panelGivenToCustomerKw || 0}`}
                    className="w-full rounded bg-orange-600 px-3 py-2 text-center text-sm text-white sm:w-auto"
                  >
                    Calculator
                  </Link>

                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full rounded bg-green-600 px-3 py-2 text-center text-sm text-white sm:w-auto"
                    >
                      Navigate
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
                </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4 shadow">
        <button
          type="button"
          onClick={() => {
  setMeetingPage((p) => {
    const nextPage = Math.max(1, p - 1);
    saveMeetingFilters(nextPage);
    fetchMeetings(nextPage);
    return nextPage;
  });
}}
          disabled={meetingPage <= 1}
          className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm font-medium text-gray-700">
          Page {meetingPage} of {Math.ceil(meetingTotal / meetingLimit) || 1}
        </span>

        <button
          type="button"
          onClick={() => {
  setMeetingPage((p) => {
    const totalPages = Math.ceil(meetingTotal / meetingLimit);
    const nextPage = p >= totalPages ? p : p + 1;
    saveMeetingFilters(nextPage);
    fetchMeetings(nextPage);
    return nextPage;
  });
}}
          disabled={meetingPage >= Math.ceil(meetingTotal / meetingLimit)}
          className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}