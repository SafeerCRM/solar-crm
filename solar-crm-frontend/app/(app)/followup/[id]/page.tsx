'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';

import dayjs, { Dayjs } from 'dayjs';

type FollowUp = {
  id: number;
  leadId?: number | null;
  meetingId?: number | null;
  contactId?: number | null;
  tradingMeetingId?: number | null;

  customerName?: string | null;
  customerPhone?: string | null;

  sourceModule?: string;
  sourceStage?: string;

  assignedTo?: number;
  followUpDate: string;
  status: 'PENDING' | 'COMPLETED' | 'MISSED';
  note?: string;
  remarks?: string;

  lead?: {
    id: number;
    name: string;
    phone: string;
    city?: string;
  } | null;
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function FollowupDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [followup, setFollowup] = useState<FollowUp | null>(null);
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'COMPLETED' | 'MISSED'>(
    'PENDING'
  );
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) fetchFollowup();
  }, [id]);

  const fetchFollowup = async () => {
    try {
      const res = await axios.get(`${backendUrl}/followup/${id}`, {
        headers: getAuthHeaders(),
      });

      const data = res.data;

      setFollowup(data);
      setNote(data.note || '');
      setStatus(data.status || 'PENDING');

      setFollowUpDate(
        data.followUpDate
          ? dayjs(data.followUpDate).format('YYYY-MM-DDTHH:mm')
          : ''
      );
    } catch (error: any) {
      setMessage('Failed to load followup');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setMessage('');

      await axios.patch(
        `${backendUrl}/followup/${id}`,
        {
          note,
          status,
          followUpDate: followUpDate
            ? new Date(followUpDate).toISOString()
            : undefined,
        },
        { headers: getAuthHeaders() }
      );

      setMessage('Followup updated successfully');
      fetchFollowup();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      await axios.patch(
        `${backendUrl}/followup/${id}/complete`,
        {},
        { headers: getAuthHeaders() }
      );

      setMessage('Marked completed');
      fetchFollowup();
    } catch (error: any) {
      setMessage('Complete failed');
    }
  };

  const getCustomerName = () => {
  return (
    String(followup?.lead?.name || '').trim() ||
    String(followup?.customerName || '').trim() ||
    (followup?.meetingId
      ? `Meeting ID: ${followup.meetingId}`
      : '') ||
    (followup?.contactId
      ? `Contact ID: ${followup.contactId}`
      : '') ||
    `Followup ${followup?.id || ''}`
  );
};

const getCustomerPhone = () => {
  return (
    String(followup?.lead?.phone || '').trim() ||
    String(followup?.customerPhone || '').trim()
  );
};

const getSourcePath = () => {
  const source = String(
    followup?.sourceModule || '',
  ).toUpperCase();

  if (
    source === 'MEETING' &&
    followup?.meetingId
  ) {
    return `/meeting/${followup.meetingId}`;
  }

  if (
    source === 'TELECALLING' &&
    followup?.contactId
  ) {
    return `/telecalling/contacts/${followup.contactId}`;
  }

  if (
    source === 'TRADING' &&
    followup?.tradingMeetingId
  ) {
    return `/trading-meeting/${followup.tradingMeetingId}`;
  }

  if (followup?.leadId) {
    return `/leads/${followup.leadId}`;
  }

  return '';
};

const getSourceLabel = () => {
  const source = String(
    followup?.sourceModule || '',
  ).toUpperCase();

  if (source === 'MEETING') {
    return 'Open Meeting';
  }

  if (source === 'TELECALLING') {
    return 'Open Contact';
  }

  if (source === 'TRADING') {
    return 'Open Trading Meeting';
  }

  if (followup?.leadId) {
    return 'Open Lead';
  }

  return 'Open Source';
};

const customerName = getCustomerName();
const customerPhone = getCustomerPhone();
const sourcePath = getSourcePath();

  const followUpDateValue = followUpDate ? dayjs(followUpDate) : null;
  const followUpTimeValue = followUpDate ? dayjs(followUpDate) : null;

  const updateFollowUpDatePart = (newDate: Dayjs | null) => {
    if (!newDate) {
      setFollowUpDate('');
      return;
    }

    const base = followUpDate ? dayjs(followUpDate) : dayjs();

    const merged = newDate
      .hour(base.hour())
      .minute(base.minute())
      .second(0)
      .millisecond(0);

    setFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
  };

  const updateFollowUpTimePart = (newTime: Dayjs | null) => {
    if (!newTime) return;

    const base = followUpDate ? dayjs(followUpDate) : dayjs();

    const merged = base
      .hour(newTime.hour())
      .minute(newTime.minute())
      .second(0)
      .millisecond(0);

    setFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
  };

  if (!followup) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between">
        <h1 className="text-2xl font-semibold">Followup Detail</h1>

        <Link
          href="/followup"
          className="rounded bg-gray-500 px-4 py-2 text-white"
        >
          Back
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">
  {customerName}
</h2>

{customerPhone && (
  <p className="text-gray-600">
    {customerPhone}
  </p>
)}

        <div className="mt-4 flex flex-wrap gap-2">
  {customerPhone && (
    <a
      href={`tel:${customerPhone}`}
      className="rounded bg-green-600 px-4 py-2 text-white"
    >
      📞 Call
    </a>
  )}

  {sourcePath && (
    <Link
      href={sourcePath}
      className="rounded bg-gray-700 px-4 py-2 text-white"
    >
      {getSourceLabel()}
    </Link>
  )}

  {String(followup.status).toUpperCase() !==
    'COMPLETED' && (
    <button
      type="button"
      onClick={handleComplete}
      className="rounded bg-blue-600 px-4 py-2 text-white"
    >
      Complete
    </button>
  )}
</div>

        <div className="mt-4 space-y-4">
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as 'PENDING' | 'COMPLETED' | 'MISSED')
            }
            className="w-full rounded border p-2"
          >
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="MISSED">MISSED</option>
          </select>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DatePicker
                label="Follow-up Date"
                value={followUpDateValue}
                onChange={updateFollowUpDatePart}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <MobileTimePicker
                label="Follow-up Time"
                value={followUpTimeValue}
                onChange={updateFollowUpTimePart}
                ampm
                ampmInClock
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </div>
          </LocalizationProvider>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded border p-2"
            rows={4}
            placeholder="Enter note..."
          />

          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded bg-black px-4 py-2 text-white"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>

        {message && <p className="mt-3 text-blue-600">{message}</p>}
      </div>
    </div>
  );
}