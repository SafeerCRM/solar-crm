'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
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
  const [loading, setLoading] = useState(false);

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const [meetingManagerName, setMeetingManagerName] = useState('');
  const [meetingManagerId, setMeetingManagerId] = useState('');
  const [meetingCategory, setMeetingCategory] = useState('');
  const [month, setMonth] = useState('');

  useEffect(() => {
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

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Customer</th>
              <th className="border p-2">Mobile</th>
              <th className="border p-2">Scheduled</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Assigned To</th>
              <th className="border p-2">Created By</th>
              <th className="border p-2">Location</th>
              <th className="border p-2">Progress</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="p-4 text-center">
                  Loading meetings...
                </td>
              </tr>
            ) : filteredMeetings.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-4 text-center">
                  No meetings found
                </td>
              </tr>
            ) : (
              filteredMeetings.map((m) => {
                const mapsUrl = getMapsUrl(m);

                return (
                  <tr key={m.id}>
                    <td className="border p-2">
                      <div className="font-medium">{m.customerName}</div>
                      <div className="text-xs text-gray-500">Lead ID: {m.leadId}</div>
                    </td>

                    <td className="border p-2">{m.mobile}</td>

                    <td className="border p-2">
                      {new Date(m.scheduledAt).toLocaleString()}
                    </td>

                    <td className="border p-2">{m.meetingType}</td>

                    <td className="border p-2">
                      {m.meetingCategory || '-'}
                    </td>

                    <td className="border p-2">
                      <span
                        className={`rounded px-2 py-1 text-xs text-white ${statusBadgeClass(
                          m.status
                        )}`}
                      >
                        {m.status}
                      </span>
                    </td>

                    <td className="border p-2">
                      {m.assignedToName || m.assignedTo || 'Unassigned'}
                    </td>

                    <td className="border p-2">
                      {m.createdByName || m.createdBy || '-'}
                    </td>

                    <td className="border p-2">
                      <div className="mb-2 text-xs text-gray-700">
                        {m.gpsAddress || m.address || 'No address'}
                      </div>

                      {mapsUrl ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block rounded bg-green-600 px-3 py-1 text-white"
                        >
                          Navigate
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">No location</span>
                      )}
                    </td>

                    <td className="border p-2">
                      <div className="text-xs text-gray-700">
                        <div>
                          <strong>Meeting Count:</strong> {m.meetingCount || '-'}
                        </div>
                        <div>
                          <strong>Next Action:</strong> {m.nextAction || '-'}
                        </div>
                      </div>
                    </td>

                    <td className="border p-2">
                      <Link
                        href={`/meeting/${m.id}`}
                        className="rounded bg-purple-600 px-3 py-2 text-white"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}