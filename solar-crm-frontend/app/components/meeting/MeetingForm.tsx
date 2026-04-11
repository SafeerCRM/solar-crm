'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

type User = {
  id: number;
  name: string;
  email?: string;
  roles?: string[];
};

export default function MeetingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);

  const [form, setForm] = useState({
    leadId: '',
    followupId: '',
    customerName: '',
    mobile: '',
    address: '',
    scheduledAt: '',
    assignedTo: '',
    meetingType: 'SITE_VISIT',
    meetingCategory: 'COMPANY_MEETING',
    status: 'SCHEDULED',
    notes: '',
    gpsLatitude: '',
    gpsLongitude: '',
    gpsAddress: '',
    createdBy: '',
    updatedBy: '',

    panelGivenToCustomerKw: '',
    inverterCapacityKw: '',
    structureKw: '',
    proposedSystemKw: '',
    meetingCount: '',
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [leadOwnerName, setLeadOwnerName] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/assignable-staff`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('User fetch failed', err);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('user');

    if (user) {
      const parsed = JSON.parse(user);

      const assignedToFromQuery = searchParams.get('assignedTo') || '';
      const leadOwnerFromQuery = searchParams.get('leadOwnerName') || '';

      setLeadOwnerName(leadOwnerFromQuery);

      setForm((prev) => ({
        ...prev,
        leadId: searchParams.get('leadId') || '',
        followupId: searchParams.get('followupId') || '',
        customerName: searchParams.get('name') || '',
        mobile: searchParams.get('phone') || '',
        address: searchParams.get('city') || '',
        assignedTo: assignedToFromQuery,
        createdBy: String(parsed.id),
        updatedBy: String(parsed.id),
      }));
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setPhoto(selected);

    if (selected) {
      setPhotoPreview(URL.createObjectURL(selected));
    } else {
      setPhotoPreview('');
    }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported on this device/browser');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        let address = '';

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          address = data.display_name || '';
        } catch (err) {
          console.error('Reverse geocoding failed', err);
        }

        setForm((prev) => ({
          ...prev,
          gpsLatitude: String(lat),
          gpsLongitude: String(lng),
          gpsAddress: address,
          address: address || prev.address,
        }));

        setLocationLoading(false);
      },
      (err) => {
        console.error(err);
        alert('Unable to capture location');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const selectedAssignedUser = users.find(
        (u) => String(u.id) === String(form.assignedTo)
      );

      const payload = {
        leadId: form.leadId ? Number(form.leadId) : undefined,
        followupId: form.followupId ? Number(form.followupId) : undefined,
        customerName: form.customerName,
        mobile: form.mobile,
        address: form.address || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
        assignedToName: selectedAssignedUser
          ? `${selectedAssignedUser.name} (${selectedAssignedUser.id})`
          : undefined,
        meetingType: form.meetingType,
        meetingCategory: form.meetingCategory,
        status: form.status,
        notes: form.notes || undefined,
        gpsLatitude: form.gpsLatitude ? Number(form.gpsLatitude) : undefined,
        gpsLongitude: form.gpsLongitude ? Number(form.gpsLongitude) : undefined,
        gpsAddress: form.gpsAddress || undefined,
        createdBy: Number(form.createdBy),
        updatedBy: Number(form.updatedBy),
        createdByName: leadOwnerName || undefined,

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

        siteObservation: photo ? `Photo selected: ${photo.name}` : undefined,
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
      <h2 className="mb-4 text-xl font-semibold">Create Meeting</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="leadId" value={form.leadId} />
        <input type="hidden" name="followupId" value={form.followupId} />

        {leadOwnerName ? (
          <div className="md:col-span-2 rounded bg-gray-50 p-3 text-sm text-gray-700">
            <div>
              <span className="font-medium">Lead Owner:</span> {leadOwnerName}
            </div>
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium">Customer Name</label>
          <input
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Mobile</label>
          <input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="w-full rounded border p-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Meeting Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full rounded border p-2"
            placeholder="Address will auto-fill from GPS, or you can type manually"
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
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Assign To</label>
          <select
            name="assignedTo"
            value={form.assignedTo}
            onChange={handleChange}
            className="w-full rounded border p-2"
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.id}){u.email ? ` - ${u.email}` : ''}
              </option>
            ))}
          </select>
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
            placeholder="e.g. 5"
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
            placeholder="e.g. 5"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Structure (kW)</label>
          <input
            name="structureKw"
            value={form.structureKw}
            onChange={handleChange}
            className="w-full rounded border p-2"
            placeholder="e.g. 5"
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
            placeholder="e.g. 5"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Meeting Count</label>
          <input
            name="meetingCount"
            value={form.meetingCount}
            onChange={handleChange}
            className="w-full rounded border p-2"
            placeholder="e.g. 1"
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGetLocation}
            className="rounded bg-green-600 px-4 py-2 text-white"
            disabled={locationLoading}
          >
            {locationLoading ? 'Capturing...' : '📍 Capture Current Location'}
          </button>
        </div>

        {(form.gpsAddress || form.gpsLatitude || form.gpsLongitude) && (
          <div className="md:col-span-2 rounded bg-gray-50 p-3 text-sm text-gray-700">
            <div className="mb-1 font-medium">Captured Location</div>
            {form.gpsAddress && <div>Address: {form.gpsAddress}</div>}
            {form.gpsLatitude && form.gpsLongitude && (
              <div>
                Coordinates: {form.gpsLatitude}, {form.gpsLongitude}
              </div>
            )}
          </div>
        )}

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">
            GPS / Site Photo
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="w-full rounded border p-2"
          />
          <p className="mt-1 text-xs text-gray-500">
            On mobile, this can open the camera directly.
          </p>
        </div>

        {photoPreview && (
          <div className="md:col-span-2">
            <img
              src={photoPreview}
              alt="Site preview"
              className="max-h-64 rounded border"
            />
          </div>
        )}

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

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-6 py-2 text-white"
          >
            {loading ? 'Saving...' : 'Create Meeting'}
          </button>
        </div>

        {error && <p className="md:col-span-2 text-red-600">{error}</p>}
        {success && <p className="md:col-span-2 text-green-600">{success}</p>}
      </div>
    </form>
  );
}