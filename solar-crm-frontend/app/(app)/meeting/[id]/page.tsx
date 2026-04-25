'use client';

import Link from 'next/link';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  gpsPhotoUrl?: string | null;
audioUrl?: string | null;
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

type DetailResponse = {
  latestMeeting: Meeting;
  history: Meeting[];
};

type CalculatorResult = {
  id: number;
  meetingId?: number | null;
  leadId?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerCity?: string | null;
  panelCost?: number | string;
  ongridCost?: number | string;
  structureCost?: number | string;
  electricalCost?: number | string;
  transportationCost?: number | string;
  marginAmount?: number | string;
  batteryCost?: number | string;
  totalProjectCost?: number | string;
  createdAt: string;
};

type ActionOption = '' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD' | 'RESCHEDULED';

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [latestMeeting, setLatestMeeting] = useState<Meeting | null>(null);
  const [history, setHistory] = useState<Meeting[]>([]);
  const [calculators, setCalculators] = useState<CalculatorResult[]>([]);

  const [selectedAction, setSelectedAction] = useState<ActionOption>('');
  const [reschedulePhotoFile, setReschedulePhotoFile] = useState<File | null>(null);
const [rescheduleAudioFile, setRescheduleAudioFile] = useState<File | null>(null);
  const [convertSliderValue, setConvertSliderValue] = useState(0);
  const [convertingProject, setConvertingProject] = useState(false);

  const [form, setForm] = useState({
    scheduledAt: '',
    assignedToName: '',
    meetingType: 'SITE_VISIT',
    meetingCategory: 'COMPANY_MEETING',
    status: 'SCHEDULED',
    notes: '',
    reason: '',
    outcome: '',
    nextAction: '',
    managerRemarks: '',
    siteObservation: '',
    panelGivenToCustomerKw: '',
    inverterCapacityKw: '',
    structureKw: '',
    proposedSystemKw: '',
    meetingCount: '',
  });

  const fetchDetail = async () => {
    if (!meetingId) return;

    try {
      setLoading(true);
      setError('');
      const res = await axios.get<DetailResponse>(
        `${backendUrl}/meetings/${meetingId}/detail`,
        {
          headers: getAuthHeaders(),
        }
      );

      const latest = res.data?.latestMeeting || null;
      const timeline = Array.isArray(res.data?.history) ? res.data.history : [];

      setLatestMeeting(latest);
      setHistory(timeline);

      if (latest) {
        setForm({
          scheduledAt: latest.scheduledAt
            ? new Date(latest.scheduledAt).toISOString().slice(0, 16)
            : '',
          assignedToName: latest.assignedToName || '',
          meetingType: latest.meetingType || 'SITE_VISIT',
          meetingCategory: latest.meetingCategory || 'COMPANY_MEETING',
          status: latest.status || 'SCHEDULED',
          notes: latest.notes || '',
          reason: latest.reason || '',
          outcome: latest.outcome || '',
          nextAction: latest.nextAction || '',
          managerRemarks: latest.managerRemarks || '',
          siteObservation: latest.siteObservation || '',
          panelGivenToCustomerKw:
            latest.panelGivenToCustomerKw !== null &&
            latest.panelGivenToCustomerKw !== undefined
              ? String(latest.panelGivenToCustomerKw)
              : '',
          inverterCapacityKw:
            latest.inverterCapacityKw !== null &&
            latest.inverterCapacityKw !== undefined
              ? String(latest.inverterCapacityKw)
              : '',
          structureKw:
            latest.structureKw !== null && latest.structureKw !== undefined
              ? String(latest.structureKw)
              : '',
          proposedSystemKw:
            latest.proposedSystemKw !== null &&
            latest.proposedSystemKw !== undefined
              ? String(latest.proposedSystemKw)
              : '',
          meetingCount:
            latest.meetingCount !== null && latest.meetingCount !== undefined
              ? String(latest.meetingCount)
              : '',
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || err?.message || 'Failed to load meeting detail'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCalculators = async () => {
  if (!meetingId) return;

  try {
    const res = await axios.get<CalculatorResult[]>(
      `${backendUrl}/calculator/meeting/${meetingId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    setCalculators(Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    console.error(err);
    setCalculators([]);
  }
};

  useEffect(() => {
  fetchDetail();
  fetchCalculators();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [meetingId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatCurrency = (value: number | string | undefined | null) => {
  const num = Number(value || 0);

  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
};

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

  const mapsUrl = useMemo(() => {
    if (!latestMeeting) return '';

    if (latestMeeting.gpsLatitude && latestMeeting.gpsLongitude) {
      return `https://www.google.com/maps/search/?api=1&query=${latestMeeting.gpsLatitude},${latestMeeting.gpsLongitude}`;
    }

    const fallbackAddress = latestMeeting.gpsAddress || latestMeeting.address || '';
    if (!fallbackAddress.trim()) return '';

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      fallbackAddress
    )}`;
  }, [latestMeeting]);

  const saveDetails = async () => {
    if (!latestMeeting) return;

    try {
      setSavingDetails(true);
      setError('');
      setMessage('');

      await axios.patch(
        `${backendUrl}/meetings/${latestMeeting.id}`,
        {
          scheduledAt: form.scheduledAt
            ? new Date(form.scheduledAt).toISOString()
            : undefined,
          meetingType: form.meetingType,
          meetingCategory: form.meetingCategory,
          notes: form.notes || undefined,
          reason: form.reason || undefined,
          outcome: form.outcome || undefined,
          nextAction: form.nextAction || undefined,
          managerRemarks: form.managerRemarks || undefined,
          siteObservation: form.siteObservation || undefined,
          panelGivenToCustomerKw: form.panelGivenToCustomerKw
            ? Number(form.panelGivenToCustomerKw)
            : undefined,
          inverterCapacityKw: form.inverterCapacityKw
            ? Number(form.inverterCapacityKw)
            : undefined,
          structureKw: form.structureKw ? Number(form.structureKw) : undefined,
          proposedSystemKw: form.proposedSystemKw
            ? Number(form.proposedSystemKw)
            : undefined,
          meetingCount: form.meetingCount ? Number(form.meetingCount) : undefined,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      setMessage('Meeting details updated successfully');
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || err?.message || 'Failed to update details'
      );
    } finally {
      setSavingDetails(false);
    }
  };

  const uploadMeetingProof = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${backendUrl}/meetings/proof/upload`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeaders().Authorization,
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || 'Proof upload failed');
  }

  return data.fileUrl || '';
};

  const applyAction = async () => {
  if (!latestMeeting || !selectedAction) return;

  if (selectedAction === 'CANCELLED' && !form.reason.trim()) {
    setError('Please enter reason for cancelled action');
    return;
  }

  if (selectedAction === 'RESCHEDULED' && !form.scheduledAt) {
    setError('Please select new scheduled time for rescheduled action');
    return;
  }

  if (
    selectedAction === 'RESCHEDULED' &&
    !reschedulePhotoFile &&
    !rescheduleAudioFile
  ) {
    setError('Please attach GPS photo or audio recording before rescheduling');
    return;
  }

  try {
    setSavingAction(true);
    setError('');
    setMessage('');

    let gpsPhotoUrl = '';
    let audioUrl = '';

    if (selectedAction === 'RESCHEDULED') {
      if (reschedulePhotoFile) {
        gpsPhotoUrl = await uploadMeetingProof(reschedulePhotoFile);
      }

      if (rescheduleAudioFile) {
        audioUrl = await uploadMeetingProof(rescheduleAudioFile);
      }
    }

    await axios.patch(
      `${backendUrl}/meetings/${latestMeeting.id}/action`,
      {
        status: selectedAction,
        newScheduledAt:
          selectedAction === 'RESCHEDULED'
            ? new Date(form.scheduledAt).toISOString()
            : undefined,
        gpsPhotoUrl: gpsPhotoUrl || undefined,
        audioUrl: audioUrl || undefined,
        reason: form.reason || undefined,
        outcome: form.outcome || undefined,
        nextAction: form.nextAction || undefined,
        managerRemarks: form.managerRemarks || undefined,
        notes: form.notes || undefined,
      },
      {
        headers: getAuthHeaders(),
      }
    );

    setMessage(`Meeting action ${selectedAction} saved successfully`);
    setSelectedAction('');
    setReschedulePhotoFile(null);
    setRescheduleAudioFile(null);
    await fetchDetail();
  } catch (err: any) {
    console.error(err);
    setError(
      err?.response?.data?.message || err?.message || 'Failed to save action'
    );
  } finally {
    setSavingAction(false);
  }
};

  const convertToProject = async () => {
    if (!latestMeeting) return;

    try {
      setConvertingProject(true);
      setError('');
      setMessage('');

      await axios.patch(
        `${backendUrl}/meetings/${latestMeeting.id}/action`,
        {
          status: 'CONVERTED_TO_PROJECT',
          reason: form.reason || undefined,
          outcome: form.outcome || undefined,
          nextAction: form.nextAction || 'Converted to project',
          managerRemarks: form.managerRemarks || undefined,
          notes: form.notes || undefined,
          convertToProject: true,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      setConvertSliderValue(0);
      setMessage('Meeting converted to project status successfully');
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || err?.message || 'Failed to convert to project'
      );
      setConvertSliderValue(0);
    } finally {
      setConvertingProject(false);
    }
  };

  const handleConvertSliderChange = async (value: number) => {
    setConvertSliderValue(value);

    if (value >= 100 && !convertingProject) {
      await convertToProject();
    }
  };

  const resetConvertSlider = () => {
    if (convertingProject) return;
    setConvertSliderValue(0);
  };

  if (loading) {
    return <div className="p-6">Loading meeting detail...</div>;
  }

  if (!latestMeeting) {
    return (
      <div className="p-6">
        <p className="text-red-600">Meeting not found</p>
        <Link href="/meeting" className="mt-4 inline-block text-blue-600">
          Back to Meeting
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Meeting Detail</h1>
          <p className="text-sm text-gray-600">
            Latest editable meeting record with full history inside
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
  <Link
    href="/meeting"
    className="rounded bg-gray-600 px-4 py-2 text-white"
  >
    Back
  </Link>

  <Link
    href={`/calculator?meetingId=${latestMeeting.id}&leadId=${latestMeeting.leadId}&name=${encodeURIComponent(
      latestMeeting.customerName || ''
    )}&phone=${encodeURIComponent(latestMeeting.mobile || '')}&city=${encodeURIComponent(
      latestMeeting.gpsAddress || latestMeeting.address || ''
    )}&electricityBill=${latestMeeting.panelGivenToCustomerKw || 0}`}
    className="rounded bg-orange-600 px-4 py-2 text-white"
  >
    Open New Calculator
  </Link>

  <button
    onClick={() => {
      router.refresh();
      fetchDetail();
      fetchCalculators();
    }}
    className="rounded bg-blue-600 px-4 py-2 text-white"
  >
    Refresh
  </button>
</div>
      </div>

      {(message || error) && (
        <div className="mb-4">
          {message ? <p className="text-green-600">{message}</p> : null}
          {error ? <p className="text-red-600">{error}</p> : null}
        </div>
      )}

      <div className="mb-6 rounded border bg-white p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{latestMeeting.customerName}</h2>
            <p className="text-sm text-gray-600">Lead ID: {latestMeeting.leadId}</p>
            <p className="text-sm text-gray-600">Mobile: {latestMeeting.mobile}</p>
          </div>

          <div className="text-right">
            <span
              className={`inline-block rounded px-3 py-1 text-sm text-white ${statusBadgeClass(
                latestMeeting.status
              )}`}
            >
              {latestMeeting.status}
            </span>
            <p className="mt-2 text-sm text-gray-600">
              Assigned To: {latestMeeting.assignedToName || latestMeeting.assignedTo || 'Unassigned'}
            </p>
            <p className="text-sm text-gray-600">
              Created By: {latestMeeting.createdByName || latestMeeting.createdBy || '-'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Meeting Address</label>
            <input
              value={latestMeeting.address || ''}
              readOnly
              className="w-full rounded border bg-gray-50 p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Scheduled At</label>
            <input
              type="datetime-local"
              name="scheduledAt"
              value={form.scheduledAt}
              onChange={handleChange}
              className="w-full rounded border p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Meeting Type</label>
            <select
              name="meetingType"
              value={form.meetingType}
              onChange={handleChange}
              className="w-full rounded border p-2"
            >
              <option value="SITE_VISIT">Site Visit</option>
              <option value="OFFICE_MEETING">Office Meeting</option>
              <option value="PHONE_DISCUSSION">Phone Discussion</option>
              <option value="VIDEO_MEETING">Video Meeting</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Meeting Category</label>
            <select
              name="meetingCategory"
              value={form.meetingCategory}
              onChange={handleChange}
              className="w-full rounded border p-2"
            >
              <option value="COMPANY_MEETING">Company Meeting</option>
              <option value="SELF_MEETING">Self Meeting</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Panel Given To Customer (kW)
            </label>
            <input
              name="panelGivenToCustomerKw"
              value={form.panelGivenToCustomerKw}
              onChange={handleChange}
              className="w-full rounded border p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Inverter Capacity (kW)
            </label>
            <input
              name="inverterCapacityKw"
              value={form.inverterCapacityKw}
              onChange={handleChange}
              className="w-full rounded border p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Structure (kW)</label>
            <input
              name="structureKw"
              value={form.structureKw}
              onChange={handleChange}
              className="w-full rounded border p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Proposed System / Rate (kW)
            </label>
            <input
              name="proposedSystemKw"
              value={form.proposedSystemKw}
              onChange={handleChange}
              className="w-full rounded border p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Meeting Count</label>
            <input
              name="meetingCount"
              value={form.meetingCount}
              onChange={handleChange}
              className="w-full rounded border p-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Reason</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              className="w-full rounded border p-2"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Outcome</label>
            <input
              name="outcome"
              value={form.outcome}
              onChange={handleChange}
              className="w-full rounded border p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Next Action</label>
            <input
              name="nextAction"
              value={form.nextAction}
              onChange={handleChange}
              className="w-full rounded border p-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Manager Remarks</label>
            <textarea
              name="managerRemarks"
              value={form.managerRemarks}
              onChange={handleChange}
              className="w-full rounded border p-2"
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Site Observation</label>
            <textarea
              name="siteObservation"
              value={form.siteObservation}
              onChange={handleChange}
              className="w-full rounded border p-2"
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full rounded border p-2"
              rows={4}
            />
          </div>

          {latestMeeting.audioUrl && (
  <div className="md:col-span-2 rounded-xl border bg-gray-50 p-4">
    <p className="mb-2 text-sm font-semibold text-gray-800">
      Meeting Audio Recording
    </p>

    <audio controls className="w-full">
      <source src={latestMeeting.audioUrl} />
      Your browser does not support audio playback.
    </audio>
  </div>
)}

{latestMeeting.gpsPhotoUrl && (
  <div className="md:col-span-2 rounded-xl border bg-gray-50 p-4">
    <p className="mb-2 text-sm font-semibold text-gray-800">
      GPS / Site Photo
    </p>

    <img
      src={latestMeeting.gpsPhotoUrl}
      alt="Meeting proof"
      className="max-h-80 w-full rounded-lg border object-contain"
    />
  </div>
)}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              onClick={saveDetails}
              type="button"
              disabled={savingDetails}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              {savingDetails ? 'Saving...' : 'Save Details'}
            </button>

            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-green-600 px-4 py-2 text-white"
              >
                Navigate
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded border bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Meeting Action</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Action Dropdown</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as ActionOption)}
              className="w-full rounded border p-2"
            >
              <option value="">Select Action</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="RESCHEDULED">Rescheduled</option>
            </select>
          </div>

          {selectedAction === 'RESCHEDULED' && (
  <div className="md:col-span-2 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
    <h3 className="mb-3 font-semibold text-yellow-900">
      Reschedule Proof Required
    </h3>

    <p className="mb-3 text-sm text-yellow-800">
      Attach GPS/site photo or audio recording before saving reschedule.
    </p>

    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium">
          GPS / Site Photo
        </label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) =>
            setReschedulePhotoFile(e.target.files?.[0] || null)
          }
          className="w-full rounded border bg-white p-2"
        />
        {reschedulePhotoFile && (
          <p className="mt-1 text-xs text-green-700">
            Selected: {reschedulePhotoFile.name}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Audio Recording
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) =>
            setRescheduleAudioFile(e.target.files?.[0] || null)
          }
          className="w-full rounded border bg-white p-2"
        />
        {rescheduleAudioFile && (
          <p className="mt-1 text-xs text-green-700">
            Selected: {rescheduleAudioFile.name}
          </p>
        )}
      </div>
    </div>
  </div>
)}

          <div className="flex items-end">
            <button
              onClick={applyAction}
              type="button"
              disabled={!selectedAction || savingAction}
              className="rounded bg-purple-600 px-4 py-2 text-white"
            >
              {savingAction ? 'Saving Action...' : 'Save Action'}
            </button>
          </div>

          <div className="md:col-span-2 max-w-md">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Drag to convert to project
            </p>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={convertSliderValue}
              onChange={(e) => handleConvertSliderChange(Number(e.target.value))}
              onMouseUp={resetConvertSlider}
              onTouchEnd={resetConvertSlider}
              disabled={convertingProject}
              className="w-full"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>Drag</span>
              <span>
                {convertingProject ? 'Converting...' : `${convertSliderValue}%`}
              </span>
              <span>Project</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded border bg-white p-6">
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-xl font-semibold">Saved Calculators</h2>
      <p className="text-sm text-gray-600">
        Previous calculator results linked with this meeting
      </p>
    </div>

    <Link
      href={`/calculator?meetingId=${latestMeeting.id}&leadId=${latestMeeting.leadId}&name=${encodeURIComponent(
        latestMeeting.customerName || ''
      )}&phone=${encodeURIComponent(latestMeeting.mobile || '')}&city=${encodeURIComponent(
        latestMeeting.gpsAddress || latestMeeting.address || ''
      )}&electricityBill=${latestMeeting.panelGivenToCustomerKw || 0}`}
      className="rounded bg-orange-600 px-4 py-2 text-white"
    >
      + New Calculator
    </Link>
  </div>

  {calculators.length === 0 ? (
    <p className="text-sm text-gray-500">No saved calculators found</p>
  ) : (
    <div className="grid gap-4 md:grid-cols-2">
      {calculators.map((calculator) => (
        <div key={calculator.id} className="rounded-2xl border bg-gray-50 p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                Calculator #{calculator.id}
              </h3>
              <p className="text-sm text-gray-600">
                {new Date(calculator.createdAt).toLocaleString()}
              </p>
            </div>

            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              ₹ {formatCurrency(calculator.totalProjectCost)}
            </span>
          </div>

          <div className="grid gap-2 text-sm text-gray-700">
            <div className="flex justify-between gap-3">
              <span>Panel Cost</span>
              <strong>₹ {formatCurrency(calculator.panelCost)}</strong>
            </div>

            <div className="flex justify-between gap-3">
              <span>Ongrid Cost</span>
              <strong>₹ {formatCurrency(calculator.ongridCost)}</strong>
            </div>

            <div className="flex justify-between gap-3">
              <span>Structure Cost</span>
              <strong>₹ {formatCurrency(calculator.structureCost)}</strong>
            </div>

            <div className="flex justify-between gap-3">
              <span>Electrical Cost</span>
              <strong>₹ {formatCurrency(calculator.electricalCost)}</strong>
            </div>

            <div className="flex justify-between gap-3">
              <span>Transportation</span>
              <strong>₹ {formatCurrency(calculator.transportationCost)}</strong>
            </div>

            <div className="mt-3 border-t pt-3">
              <div className="flex justify-between gap-3 text-base">
                <span className="font-semibold">Total Project Cost</span>
                <strong className="text-green-700">
                  ₹ {formatCurrency(calculator.totalProjectCost)}
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-purple-600 px-3 py-2 text-sm text-white"
              disabled
            >
              Generate Proposal Soon
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      <div className="rounded border bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Meeting History</h2>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No history found</p>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="rounded border p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {item.customerName} - {item.meetingType}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(item.updatedAt).toLocaleString()}
                    </div>
                  </div>

                  <span
                    className={`rounded px-3 py-1 text-xs text-white ${statusBadgeClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                  <div><strong>Reason:</strong> {item.reason || '-'}</div>
                  <div><strong>Outcome:</strong> {item.outcome || '-'}</div>
                  <div><strong>Next Action:</strong> {item.nextAction || '-'}</div>
                  <div><strong>Meeting Count:</strong> {item.meetingCount || '-'}</div>
                  <div><strong>Assigned To:</strong> {item.assignedToName || item.assignedTo || '-'}</div>
                  <div><strong>Updated By:</strong> {item.updatedByName || item.updatedBy || '-'}</div>
                </div>

                {item.managerRemarks ? (
                  <div className="mt-2 text-sm">
                    <strong>Manager Remarks:</strong> {item.managerRemarks}
                  </div>
                ) : null}

                {item.notes ? (
                  <div className="mt-2 text-sm">
                    <strong>Notes:</strong> {item.notes}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}