'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../../lib/authHeaders';

export default function MeetingForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    leadId: '',
    followupId: '',
    customerName: '',
    mobile: '',
    address: '',
    scheduledAt: '',
    assignedTo: '',
    meetingType: 'SITE_VISIT',
    status: 'SCHEDULED',
    notes: '',
    outcome: '',
    nextAction: '',
    managerRemarks: '',
    siteObservation: '',
    gpsLatitude: '',
    gpsLongitude: '',
    gpsAddress: '',
    createdBy: '',
    updatedBy: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          gpsLatitude: String(position.coords.latitude),
          gpsLongitude: String(position.coords.longitude),
        }));
      },
      () => {
        alert('Unable to capture GPS location');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        leadId: Number(form.leadId),
        followupId: form.followupId ? Number(form.followupId) : undefined,
        customerName: form.customerName,
        mobile: form.mobile,
        address: form.address || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
        meetingType: form.meetingType,
        status: form.status,
        notes: form.notes || undefined,
        outcome: form.outcome || undefined,
        nextAction: form.nextAction || undefined,
        managerRemarks: form.managerRemarks || undefined,
        siteObservation: form.siteObservation || undefined,
        gpsLatitude: form.gpsLatitude ? Number(form.gpsLatitude) : undefined,
        gpsLongitude: form.gpsLongitude ? Number(form.gpsLongitude) : undefined,
        gpsAddress: form.gpsAddress || undefined,
        createdBy: form.createdBy ? Number(form.createdBy) : undefined,
        updatedBy: form.updatedBy ? Number(form.updatedBy) : undefined,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/meetings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          Array.isArray(errData?.message)
            ? errData.message.join(', ')
            : errData?.message || 'Failed to create meeting'
        );
      }

      setSuccess('Meeting created successfully');

      setTimeout(() => {
        router.push('/meeting');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded border bg-white p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Lead ID *</label>
          <input
            type="number"
            name="leadId"
            value={form.leadId}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Followup ID</label>
          <input
            type="number"
            name="followupId"
            value={form.followupId}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Customer Name *</label>
          <input
            type="text"
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Mobile *</label>
          <input
            type="text"
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Scheduled At *</label>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Assigned To</label>
          <input
            type="number"
            name="assignedTo"
            value={form.assignedTo}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Meeting Type</label>
          <select
            name="meetingType"
            value={form.meetingType}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          >
            <option value="SITE_VISIT">SITE_VISIT</option>
            <option value="OFFICE_MEETING">OFFICE_MEETING</option>
            <option value="PHONE_DISCUSSION">PHONE_DISCUSSION</option>
            <option value="VIDEO_MEETING">VIDEO_MEETING</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          >
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="RESCHEDULED">RESCHEDULED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="NO_SHOW">NO_SHOW</option>
            <option value="CONVERTED_TO_PROJECT">CONVERTED_TO_PROJECT</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Manager Remarks</label>
          <textarea
            name="managerRemarks"
            value={form.managerRemarks}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Site Observation</label>
          <textarea
            name="siteObservation"
            value={form.siteObservation}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
            rows={3}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">GPS Latitude</label>
          <input
            type="number"
            step="any"
            name="gpsLatitude"
            value={form.gpsLatitude}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">GPS Longitude</label>
          <input
            type="number"
            step="any"
            name="gpsLongitude"
            value={form.gpsLongitude}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="button"
            onClick={handleGetLocation}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Capture Current GPS
          </button>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">GPS Address</label>
          <input
            type="text"
            name="gpsAddress"
            value={form.gpsAddress}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
            placeholder="Optional address / landmark"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Outcome</label>
          <input
            type="text"
            name="outcome"
            value={form.outcome}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Next Action</label>
          <input
            type="text"
            name="nextAction"
            value={form.nextAction}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Created By</label>
          <input
            type="number"
            name="createdBy"
            value={form.createdBy}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Updated By</label>
          <input
            type="number"
            name="updatedBy"
            value={form.updatedBy}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-4 text-sm text-green-600">{success}</p>}

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Create Meeting'}
        </button>
      </div>
    </form>
  );
}