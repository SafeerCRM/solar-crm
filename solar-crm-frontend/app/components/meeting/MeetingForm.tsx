'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthHeaders } from '../../../lib/authHeaders';

export default function MeetingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // ✅ AUTO-FILL FROM LEAD
  useEffect(() => {
    const leadId = searchParams.get('leadId');
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const city = searchParams.get('city');

    const user = localStorage.getItem('user');

    if (user) {
      const parsed = JSON.parse(user);

      setForm((prev) => ({
        ...prev,
        leadId: leadId || '',
        customerName: name || '',
        mobile: phone || '',
        address: city || '',
        createdBy: String(parsed.id),
        updatedBy: String(parsed.id),
      }));
    }
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
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
        alert('Unable to capture GPS');
      }
    );
  };

  const handleSubmit = async (e: any) => {
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
        createdBy: Number(form.createdBy),
        updatedBy: Number(form.updatedBy),
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

        {/* AUTO FILLED */}
        <input type="hidden" name="leadId" value={form.leadId} />

        <div>
          <label>Customer Name *</label>
          <input
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label>Mobile *</label>
          <input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        <div className="md:col-span-2">
          <label>Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label>Scheduled At *</label>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleChange}
            className="w-full border p-2"
            required
          />
        </div>

        <div>
          <label>Assigned To (User ID)</label>
          <input
            name="assignedTo"
            value={form.assignedTo}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        {/* GPS */}
        <div>
          <label>GPS Latitude</label>
          <input
            name="gpsLatitude"
            value={form.gpsLatitude}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label>GPS Longitude</label>
          <input
            name="gpsLongitude"
            value={form.gpsLongitude}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="button"
            onClick={handleGetLocation}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Capture GPS
          </button>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            {loading ? 'Saving...' : 'Create Meeting'}
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}
      </div>
    </form>
  );
}