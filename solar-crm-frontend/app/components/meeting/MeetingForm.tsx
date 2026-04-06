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

  const [photo, setPhoto] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ FETCH USERS FOR DROPDOWN
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
      setUsers(data || []);
    } catch (err) {
      console.error('User fetch failed', err);
    }
  };

  // ✅ PREFILL FROM LEADS
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
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ✅ GPS + ADDRESS
  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      let address = '';

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await res.json();
        address = data.display_name || '';
      } catch {
        address = 'Unable to fetch address';
      }

      setForm((prev) => ({
        ...prev,
        gpsLatitude: String(lat),
        gpsLongitude: String(lng),
        gpsAddress: address,
        address: address || prev.address,
      }));
    });
  };

  // ✅ SUBMIT
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const payload = {
        leadId: Number(form.leadId),
        customerName: form.customerName,
        mobile: form.mobile,
        address: form.address,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        assignedTo: form.assignedTo
          ? Number(form.assignedTo)
          : undefined,
        meetingType: form.meetingType,
        status: form.status,
        notes: form.notes || undefined,
        gpsLatitude: form.gpsLatitude
          ? Number(form.gpsLatitude)
          : undefined,
        gpsLongitude: form.gpsLongitude
          ? Number(form.gpsLongitude)
          : undefined,
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

      if (!res.ok) throw new Error('Failed to create meeting');

      setSuccess('Meeting created');

      setTimeout(() => {
        router.push('/meeting');
      }, 800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded border">
      <h2 className="mb-4 text-xl font-semibold">Create Meeting</h2>

      <div className="grid gap-4 md:grid-cols-2">

        <div>
          <label>Customer Name</label>
          <input
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label>Mobile</label>
          <input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        <div className="md:col-span-2">
          <label>Meeting Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label>Scheduled At</label>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </div>

        {/* ✅ DROPDOWN */}
        <div>
          <label>Assign To</label>
          <select
            name="assignedTo"
            value={form.assignedTo}
            onChange={handleChange}
            className="w-full border p-2"
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <button
            type="button"
            onClick={handleGetLocation}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            📍 Capture Current Location
          </button>
        </div>

        {form.gpsAddress && (
          <div className="md:col-span-2 text-sm text-gray-600">
            📍 {form.gpsAddress}
          </div>
        )}

        <div className="md:col-span-2">
          <label>Site Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setPhoto(e.target.files?.[0] || null)
            }
            className="w-full border p-2"
          />
        </div>

        <button className="bg-blue-600 text-white py-2 rounded">
          {loading ? 'Saving...' : 'Create Meeting'}
        </button>

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}
      </div>
    </form>
  );
}