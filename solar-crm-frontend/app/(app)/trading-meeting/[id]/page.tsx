'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import { uploadPreparedFile } from '@/app/utils/fileUpload';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs, { Dayjs } from 'dayjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type TradingMeeting = {
  id: number;
  dealerId?: number;
  dealerName?: string;
  dealerPhone?: string;
  dealerGstNumber?: string;
  branchName?: string;
  scheduledAt?: string;
  status?: string;
  meetingNotes?: string;
  outcome?: string;
  nextAction?: string;
  nextFollowUpDate?: string;
  expectedMaterialName?: string;
  expectedQuantity?: number;
  expectedOrderValue?: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAddress?: string;
  gpsPhotoUrl?: string;
  audioUrl?: string;
  assignedToName?: string;
  createdByName?: string;
  updatedByName?: string;
};

type TradingFollowup = {
  id: number;
  followUpDate?: string;
  status?: string;
  note?: string;
  followUpType?: string;
  createdByName?: string;
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

export default function TradingMeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id || 0);

  const [meeting, setMeeting] = useState<TradingMeeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [gpsPhotoFile, setGpsPhotoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [followups, setFollowups] = useState<TradingFollowup[]>([]);
const [followupSaving, setFollowupSaving] = useState(false);

const [followupForm, setFollowupForm] = useState({
  note: '',
  followUpDate: '',
  followUpType: 'GENERAL',
});

  const [actionForm, setActionForm] = useState({
    status: '',
    meetingNotes: '',
    outcome: '',
    nextAction: '',
    nextFollowUpDate: '',
  });

  const fetchMeeting = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/project/trading-meeting/${id}`,
        {
          headers: getAuthHeaders(),
        },
      );

      const data = res.data || null;
      setMeeting(data);

      setActionForm({
        status: data?.status || '',
        meetingNotes: '',
        outcome: data?.outcome || '',
        nextAction: data?.nextAction || '',
        nextFollowUpDate: data?.nextFollowUpDate
          ? String(data.nextFollowUpDate).slice(0, 16)
          : '',
      });
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to load trading meeting',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowups = async () => {
  if (!id) return;

  try {
    const res = await axios.get(
      `${API_BASE_URL}/project/trading-meeting/${id}/followups`,
      {
        headers: getAuthHeaders(),
      },
    );

    setFollowups(Array.isArray(res.data) ? res.data : []);
  } catch (error: any) {
    console.error(error);
    setFollowups([]);
  }
};

  useEffect(() => {
  fetchMeeting();
  fetchFollowups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id]);

  const uploadTradingProof = async (file: File) => {
    const token = localStorage.getItem('token');

    return uploadPreparedFile({
      file,
      endpoint: `${API_BASE_URL}/project/dealer-payment-receipt/upload`,
      token,
      fieldName: 'files',
    });
  };

  const actionFollowupDateValue = actionForm.nextFollowUpDate
  ? dayjs(actionForm.nextFollowUpDate)
  : null;

const actionFollowupTimeValue = actionForm.nextFollowUpDate
  ? dayjs(actionForm.nextFollowUpDate)
  : null;

const updateActionFollowupDatePart = (newDate: Dayjs | null) => {
  if (!newDate) {
    setActionForm((prev) => ({
      ...prev,
      nextFollowUpDate: '',
    }));
    return;
  }

  const base = actionForm.nextFollowUpDate
    ? dayjs(actionForm.nextFollowUpDate)
    : dayjs();

  const merged = newDate
    .hour(base.hour())
    .minute(base.minute())
    .second(0)
    .millisecond(0);

  setActionForm((prev) => ({
    ...prev,
    nextFollowUpDate: merged.format('YYYY-MM-DDTHH:mm'),
  }));
};

const updateActionFollowupTimePart = (newTime: Dayjs | null) => {
  if (!newTime) return;

  const base = actionForm.nextFollowUpDate
    ? dayjs(actionForm.nextFollowUpDate)
    : dayjs();

  const merged = base
    .hour(newTime.hour())
    .minute(newTime.minute())
    .second(0)
    .millisecond(0);

  setActionForm((prev) => ({
    ...prev,
    nextFollowUpDate: merged.format('YYYY-MM-DDTHH:mm'),
  }));
};

const followupDateValue = followupForm.followUpDate
  ? dayjs(followupForm.followUpDate)
  : null;

const followupTimeValue = followupForm.followUpDate
  ? dayjs(followupForm.followUpDate)
  : null;

const updateFollowupDatePart = (newDate: Dayjs | null) => {
  if (!newDate) {
    setFollowupForm((prev) => ({
      ...prev,
      followUpDate: '',
    }));
    return;
  }

  const base = followupForm.followUpDate
    ? dayjs(followupForm.followUpDate)
    : dayjs();

  const merged = newDate
    .hour(base.hour())
    .minute(base.minute())
    .second(0)
    .millisecond(0);

  setFollowupForm((prev) => ({
    ...prev,
    followUpDate: merged.format('YYYY-MM-DDTHH:mm'),
  }));
};

const updateFollowupTimePart = (newTime: Dayjs | null) => {
  if (!newTime) return;

  const base = followupForm.followUpDate
    ? dayjs(followupForm.followUpDate)
    : dayjs();

  const merged = base
    .hour(newTime.hour())
    .minute(newTime.minute())
    .second(0)
    .millisecond(0);

  setFollowupForm((prev) => ({
    ...prev,
    followUpDate: merged.format('YYYY-MM-DDTHH:mm'),
  }));
};

  const saveAction = async () => {
    if (!meeting?.id) return;

    if (!actionForm.status) {
      alert('Status is required');
      return;
    }

    const hasNotes =
      actionForm.meetingNotes.trim() ||
      actionForm.outcome.trim() ||
      actionForm.nextAction.trim();

    if (!hasNotes) {
      alert('Please add meeting notes, outcome, or next action before saving');
      return;
    }

    try {
      setSaving(true);

      let gpsPhotoUrl = meeting.gpsPhotoUrl || '';
      let audioUrl = meeting.audioUrl || '';

      if (gpsPhotoFile) {
        gpsPhotoUrl = await uploadTradingProof(gpsPhotoFile);
      }

      if (audioFile) {
        audioUrl = await uploadTradingProof(audioFile);
      }

      await axios.patch(
        `${API_BASE_URL}/project/trading-meeting/${meeting.id}/status`,
        {
          status: actionForm.status,
          meetingNotes: actionForm.meetingNotes || meeting.meetingNotes,
          outcome: actionForm.outcome,
          nextAction: actionForm.nextAction,
          nextFollowUpDate: actionForm.nextFollowUpDate
            ? new Date(actionForm.nextFollowUpDate).toISOString()
            : undefined,
          gpsPhotoUrl,
          audioUrl,
        },
        { headers: getAuthHeaders() },
      );

      alert('Trading meeting updated successfully');
      setGpsPhotoFile(null);
      setAudioFile(null);
      await fetchMeeting();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to update trading meeting',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading && !meeting) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        Loading trading meeting...
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        Trading meeting not found.
      </div>
    );
  }

  const createFollowup = async () => {
  if (!meeting?.id) return;

  if (!followupForm.note.trim()) {
    alert('Followup note is required');
    return;
  }

  if (!followupForm.followUpDate) {
    alert('Followup date/time is required');
    return;
  }

  try {
    setFollowupSaving(true);

    await axios.post(
      `${API_BASE_URL}/project/trading-meeting/${meeting.id}/followup`,
      {
        note: followupForm.note,
        followUpDate: new Date(followupForm.followUpDate).toISOString(),
        followUpType: followupForm.followUpType,
      },
      { headers: getAuthHeaders() },
    );

    alert('Followup created successfully');

    setFollowupForm({
      note: '',
      followUpDate: '',
      followUpType: 'GENERAL',
    });

    await fetchFollowups();
  } catch (error: any) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
        'Failed to create followup',
    );
  } finally {
    setFollowupSaving(false);
  }
};

const convertToDealerOrder = async () => {
  if (!meeting?.id) return;

  try {
    const res = await axios.get(
      `${API_BASE_URL}/project/trading-meeting/${meeting.id}/convert-data`,
      {
        headers: getAuthHeaders(),
      },
    );

    localStorage.setItem(
      'tradingMeetingConversionData',
      JSON.stringify(res.data),
    );

    router.push('/project/accounts/trading');
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to load conversion data',
    );
  }
};

  return (
    <div className="mx-auto max-w-6xl space-y-5 overflow-x-hidden">
      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {meeting.dealerName || `Trading Meeting #${meeting.id}`}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {meeting.dealerPhone || '-'} | GST:{' '}
              {meeting.dealerGstNumber || '-'} | Branch:{' '}
              {meeting.branchName || '-'}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Scheduled:{' '}
              {meeting.scheduledAt
                ? new Date(meeting.scheduledAt).toLocaleString('en-IN')
                : '-'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
  <button
    onClick={convertToDealerOrder}
    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
  >
    Convert To Dealer Order
  </button>

  <Link
    href="/trading-meeting"
    className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
  >
    Back
  </Link>
</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            Meeting Details
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <InfoRow label="Status" value={formatLabel(meeting.status)} />
            <InfoRow
              label="Expected Material"
              value={meeting.expectedMaterialName || '-'}
            />
            <InfoRow
              label="Expected Quantity"
              value={String(meeting.expectedQuantity || 0)}
            />
            <InfoRow
              label="Expected Order Value"
              value={money(meeting.expectedOrderValue)}
            />
            <InfoRow
              label="Assigned To"
              value={meeting.assignedToName || '-'}
            />
            <InfoRow
              label="Created By"
              value={meeting.createdByName || '-'}
            />
            <InfoRow
              label="Updated By"
              value={meeting.updatedByName || '-'}
            />
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-700">Meeting Notes</p>
            <p className="mt-1 break-words text-sm text-gray-600">
              {meeting.meetingNotes || '-'}
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-700">Outcome</p>
            <p className="mt-1 break-words text-sm text-gray-600">
              {meeting.outcome || '-'}
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-700">Next Action</p>
            <p className="mt-1 break-words text-sm text-gray-600">
              {meeting.nextAction || '-'}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Next Follow-up:{' '}
              {meeting.nextFollowUpDate
                ? new Date(meeting.nextFollowUpDate).toLocaleString('en-IN')
                : '-'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            GPS / Proof
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <InfoRow
              label="Latitude"
              value={String(meeting.gpsLatitude || '-')}
            />
            <InfoRow
              label="Longitude"
              value={String(meeting.gpsLongitude || '-')}
            />
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-700">GPS Address</p>
            <p className="mt-1 break-words text-sm text-gray-600">
              {meeting.gpsAddress || '-'}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {meeting.gpsPhotoUrl && (
              <a
                href={meeting.gpsPhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                View GPS Photo
              </a>
            )}

            {meeting.audioUrl && (
              <a
                href={meeting.audioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Listen Audio
              </a>
            )}

            {meeting.gpsLatitude && meeting.gpsLongitude && (
              <a
                href={`https://www.google.com/maps?q=${meeting.gpsLatitude},${meeting.gpsLongitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Open Map
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Update Trading Meeting Action
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            value={actionForm.status}
            onChange={(e) =>
              setActionForm({ ...actionForm, status: e.target.value })
            }
            className="rounded-xl border p-3"
          >
            <option value="">Select Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="POSTPONED">Postponed</option>
            <option value="NO_RESPONSE">No Response</option>
            <option value="ORDER_EXPECTED">Order Expected</option>
            <option value="ORDER_RECEIVED">Order Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
  <div className="grid gap-3 md:grid-cols-2">
    <DatePicker
      label="Next Follow-up Date"
      value={actionFollowupDateValue}
      onChange={updateActionFollowupDatePart}
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
    />

    <MobileTimePicker
      label="Next Follow-up Time"
      value={actionFollowupTimeValue}
      onChange={updateActionFollowupTimePart}
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

          <label className="rounded-xl border p-3 text-sm">
            Upload New GPS Photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setGpsPhotoFile(e.target.files?.[0] || null)
              }
              className="mt-2 block w-full"
            />
          </label>

          <label className="rounded-xl border p-3 text-sm">
            Upload New Audio
            <input
              type="file"
              accept="audio/*"
              onChange={(e) =>
                setAudioFile(e.target.files?.[0] || null)
              }
              className="mt-2 block w-full"
            />
          </label>
        </div>

        <textarea
          placeholder="Meeting Notes / Action Notes *"
          value={actionForm.meetingNotes}
          onChange={(e) =>
            setActionForm({
              ...actionForm,
              meetingNotes: e.target.value,
            })
          }
          className="mt-3 w-full rounded-xl border p-3"
        />

        <textarea
          placeholder="Outcome"
          value={actionForm.outcome}
          onChange={(e) =>
            setActionForm({ ...actionForm, outcome: e.target.value })
          }
          className="mt-3 w-full rounded-xl border p-3"
        />

        <textarea
          placeholder="Next Action"
          value={actionForm.nextAction}
          onChange={(e) =>
            setActionForm({
              ...actionForm,
              nextAction: e.target.value,
            })
          }
          className="mt-3 w-full rounded-xl border p-3"
        />

        <button
          onClick={saveAction}
          disabled={saving}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Action'}
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    Trading Followups
  </h2>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <select
      value={followupForm.followUpType}
      onChange={(e) =>
        setFollowupForm({
          ...followupForm,
          followUpType: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    >
      <option value="GENERAL">General</option>
      <option value="CALL">Call</option>
      <option value="CALLBACK">Callback</option>
      <option value="PAYMENT">Payment</option>
    </select>

    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="grid gap-3 md:grid-cols-2">
        <DatePicker
          label="Follow-up Date"
          value={followupDateValue}
          onChange={updateFollowupDatePart}
          slotProps={{
            textField: {
              fullWidth: true,
            },
          }}
        />

        <MobileTimePicker
          label="Follow-up Time"
          value={followupTimeValue}
          onChange={updateFollowupTimePart}
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
  </div>

  <textarea
    placeholder="Followup Note *"
    value={followupForm.note}
    onChange={(e) =>
      setFollowupForm({
        ...followupForm,
        note: e.target.value,
      })
    }
    className="mt-3 w-full rounded-xl border p-3"
  />

  <button
    onClick={createFollowup}
    disabled={followupSaving}
    className="mt-4 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
  >
    {followupSaving ? 'Creating...' : 'Create Followup'}
  </button>

  <div className="mt-5 space-y-3">
    <h3 className="font-bold text-gray-800">
      Followup History
    </h3>

    {followups.length === 0 ? (
      <p className="text-sm text-gray-500">
        No followups created yet.
      </p>
    ) : (
      followups.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border bg-gray-50 p-4 text-sm"
        >
          <p className="font-semibold">
            {item.followUpType || 'GENERAL'} | {item.status || '-'}
          </p>

          <p className="text-gray-500">
            Date:{' '}
            {item.followUpDate
              ? new Date(item.followUpDate).toLocaleString('en-IN')
              : '-'}
          </p>

          <p className="mt-1 break-words text-gray-700">
            {item.note || '-'}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Created By: {item.createdByName || '-'}
          </p>

          <Link
            href={`/followup/${item.id}`}
            className="mt-3 inline-block rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
          >
            Open Followup
          </Link>
        </div>
      ))
    )}
  </div>
</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-2 rounded-xl border p-3">
      <span className="font-semibold text-gray-700">{label}</span>
      <span className="break-words text-gray-600">{value}</span>
    </div>
  );
}