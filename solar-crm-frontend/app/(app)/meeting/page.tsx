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

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function MeetingPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [message, setMessage] = useState('');
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null);
const [editingCustomerName, setEditingCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const [meetingManagerName, setMeetingManagerName] = useState('');
  const [meetingManagerId, setMeetingManagerId] = useState('');
  const [meetingCategory, setMeetingCategory] = useState('');
  const [month, setMonth] = useState('');

  useEffect(() => {
  setMounted(true);
  fetchMeetings();
}, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setMessage('');

      const params: Record<string, string> = {};

      if (meetingManagerName.trim()) {
        params.assignedToName = meetingManagerName.trim();
      }

      if (meetingManagerId.trim()) {
        params.assignedTo = meetingManagerId.trim();
      }

      if (meetingCategory.trim()) {
        params.meetingCategory = meetingCategory.trim();
      }

      if (month.trim()) {
        params.month = month.trim();
      }

      const res = await axios.get(`${backendUrl}/meetings`, {
        headers: getAuthHeaders(),
        params,
      });

      setMeetings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to fetch meetings');
    } finally {
      setLoading(false);
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

  const clearFilters = () => {
    setSearchName('');
    setSearchPhone('');
    setSearchLocation('');
    setMeetingManagerName('');
    setMeetingManagerId('');
    setMeetingCategory('');
    setMonth('');
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Meeting Dashboard</h1>

        <div className="flex gap-2">
          <button
            onClick={fetchMeetings}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Refresh
          </button>

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
        <input
          type="text"
          placeholder="Meeting Manager Name"
          value={meetingManagerName}
          onChange={(e) => setMeetingManagerName(e.target.value)}
          className="rounded border p-2"
        />

        <input
          type="text"
          placeholder="Meeting Manager ID"
          value={meetingManagerId}
          onChange={(e) => setMeetingManagerId(e.target.value)}
          className="rounded border p-2"
        />

        <select
          value={meetingCategory}
          onChange={(e) => setMeetingCategory(e.target.value)}
          className="rounded border p-2"
        >
          <option value="">Meeting Category</option>
          <option value="COMPANY_MEETING">Company Meeting</option>
          <option value="SELF_MEETING">Self Meeting</option>
        </select>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded border p-2"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <div>
          Total: {meetings.length} | Filtered: {filteredMeetings.length}
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchMeetings}
            className="rounded bg-gray-200 px-3 py-2 text-sm"
          >
            Apply Filters
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
                    {m.meetingCategory || '-'}
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
    </div>
  );
}