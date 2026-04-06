'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

type User = {
  id: number;
  name: string;
  email?: string;
};

export default function MeetingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [showMap, setShowMap] = useState(false);

  const [form, setForm] = useState({
    leadId: '',
    customerName: '',
    mobile: '',
    address: '',
    scheduledAt: '',
    assignedTo: '',
    meetingType: 'SITE_VISIT',
    status: 'SCHEDULED',
    notes: '',
    gpsLatitude: '',
    gpsLongitude: '',
    gpsAddress: '',
    createdBy: '',
    updatedBy: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // USERS
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/assignable-staff`,
      { headers: getAuthHeaders() }
    );
    const data = await res.json();
    setUsers(data || []);
  };

  // PREFILL
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);

      setForm((prev) => ({
        ...prev,
        leadId: searchParams.get('leadId') || '',
        customerName: searchParams.get('name') || '',
        mobile: searchParams.get('phone') || '',
        address: searchParams.get('city') || '',
        createdBy: String(parsed.id),
        updatedBy: String(parsed.id),
      }));
    }
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // GPS BUTTON
  const handleGetLocation = async () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        gpsLatitude: String(lat),
        gpsLongitude: String(lng),
        gpsAddress: data.display_name,
        address: data.display_name,
      }));
    });
  };

  // MAP PICKER INPUT
  const handleManualCoordinates = async () => {
    const input = prompt('Enter Latitude,Longitude');

    if (!input) return;

    const [lat, lng] = input.split(',');

    if (!lat || !lng) {
      alert('Invalid format. Use: lat,lng');
      return;
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();

    setForm((prev) => ({
      ...prev,
      gpsLatitude: lat.trim(),
      gpsLongitude: lng.trim(),
      gpsAddress: data.display_name,
      address: data.display_name,
    }));
  };

  // SUBMIT
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    setLoading(true);

    const payload = {
      ...form,
      leadId: Number(form.leadId),
      assignedTo: form.assignedTo
        ? Number(form.assignedTo)
        : undefined,
      gpsLatitude: form.gpsLatitude
        ? Number(form.gpsLatitude)
        : undefined,
      gpsLongitude: form.gpsLongitude
        ? Number(form.gpsLongitude)
        : undefined,
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
      setError('Failed');
      setLoading(false);
      return;
    }

    setSuccess('Meeting Created');

    setTimeout(() => router.push('/meeting'), 800);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded border">
      <h2 className="mb-4 text-xl font-semibold">Create Meeting</h2>

      <div className="grid gap-4 md:grid-cols-2">

        <input
          name="customerName"
          value={form.customerName}
          onChange={handleChange}
          placeholder="Customer Name"
          className="border p-2"
        />

        <input
          name="mobile"
          value={form.mobile}
          onChange={handleChange}
          placeholder="Mobile"
          className="border p-2"
        />

        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Meeting Address"
          className="border p-2 md:col-span-2"
        />

        <input
          type="datetime-local"
          name="scheduledAt"
          value={form.scheduledAt}
          onChange={handleChange}
          className="border p-2"
        />

        <select
          name="assignedTo"
          value={form.assignedTo}
          onChange={handleChange}
          className="border p-2"
        >
          <option value="">Assign User</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        {/* GPS */}
        <button
          type="button"
          onClick={handleGetLocation}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          📍 Capture Current Location
        </button>

        {/* MAP PICKER */}
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          🗺️ Open Map Picker
        </button>

        {showMap && (
          <div className="md:col-span-2">
            <iframe
              src="https://maps.google.com/maps?q=India&z=5&output=embed"
              className="w-full h-64 border"
            />
            <button
              type="button"
              onClick={handleManualCoordinates}
              className="mt-2 bg-purple-600 text-white px-4 py-2 rounded"
            >
              Enter Coordinates
            </button>
          </div>
        )}

        {form.gpsAddress && (
          <div className="md:col-span-2 text-sm text-gray-600">
            📍 {form.gpsAddress}
          </div>
        )}

        <button className="bg-blue-600 text-white py-2 rounded">
          {loading ? 'Saving...' : 'Create Meeting'}
        </button>

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}
      </div>
    </form>
  );
}