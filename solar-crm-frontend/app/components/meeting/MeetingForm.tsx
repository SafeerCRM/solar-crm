'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

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
     electricityBill: '',
    meetingCount: '',
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [solarMiterAadharFront, setSolarMiterAadharFront] = useState<File | null>(null);
const [solarMiterAadharBack, setSolarMiterAadharBack] = useState<File | null>(null);
const [solarMiterBankProof, setSolarMiterBankProof] = useState<File | null>(null);

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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/meeting-managers`,
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

  const uploadMeetingProof = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/meetings/proof/upload`,
    {
      method: 'POST',
      headers: {
        Authorization: getAuthHeaders().Authorization,
      },
      body: formData,
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || 'Failed to upload proof');
  }

  return data.fileUrl as string;
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
  setLocationLoading(true);

  try {
    let lat = 0;
    let lng = 0;

    if (Capacitor.isNativePlatform()) {
      await Geolocation.requestPermissions();

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });

      lat = position.coords.latitude;
      lng = position.coords.longitude;
    } else {
      if (!navigator.geolocation) {
        alert('Geolocation not supported on this device/browser');
        setLocationLoading(false);
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      lat = position.coords.latitude;
      lng = position.coords.longitude;
    }

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
  } catch (err: any) {
    console.error('Location capture failed:', err);
    alert(err?.message || 'Unable to capture location');
  } finally {
    setLocationLoading(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

            const tokenCheck =
        localStorage.getItem('token') ||
        localStorage.getItem('access_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('access_token');

      console.log('Token before meeting submit:', tokenCheck);

      let solarMiterAadharFrontUrl: string | undefined;
let solarMiterAadharBackUrl: string | undefined;
let solarMiterBankProofUrl: string | undefined;

if (form.meetingCategory === 'SOLARMITER') {
  if (!solarMiterAadharFront || !solarMiterAadharBack || !solarMiterBankProof) {
    throw new Error('Aadhar front, Aadhar back, and bank proof are required for SOLARMITER');
  }

  solarMiterAadharFrontUrl = await uploadMeetingProof(solarMiterAadharFront);
  solarMiterAadharBackUrl = await uploadMeetingProof(solarMiterAadharBack);
  solarMiterBankProofUrl = await uploadMeetingProof(solarMiterBankProof);
}

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
                  electricityBill: form.electricityBill
          ? Number(form.electricityBill)
          : undefined,
        meetingCount: form.meetingCount ? Number(form.meetingCount) : undefined,

        siteObservation: photo ? `Photo selected: ${photo.name}` : undefined,

solarMiterName: (form as any).solarMiterName || undefined,
solarMiterPhone: (form as any).solarMiterPhone || undefined,
solarMiterPayout: (form as any).solarMiterPayout
  ? Number((form as any).solarMiterPayout)
  : undefined,
solarMiterAadharFrontUrl,
solarMiterAadharBackUrl,
solarMiterBankProofUrl,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/meetings`,
        {
          method: 'POST',
          headers: {
  ...getAuthHeaders(),
  'Content-Type': 'application/json',
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

  {(localStorage.getItem('user') &&
    JSON.parse(localStorage.getItem('user') || '{}')?.roles?.some((r: string) =>
      ['OWNER', 'MARKETING_HEAD', 'MEETING_MANAGER'].includes(r)
    )) && (
    <option value="SOLARMITER">SOLARMITER</option>
  )}
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
          <label className="mb-1 block text-sm font-medium">
            Electricity Bill (INR)
          </label>
          <input
            name="electricityBill"
            value={form.electricityBill}
            onChange={handleChange}
            className="w-full rounded border p-2"
            placeholder="e.g. 2500"
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

        {form.meetingCategory === 'SOLARMITER' && (
  <div className="md:col-span-2 rounded border bg-yellow-50 p-4">
    <h3 className="mb-3 font-semibold">SOLARMITER Details</h3>

    <input
      name="solarMiterName"
      placeholder="SOLARMITER Name"
      onChange={handleChange}
      className="mb-2 w-full rounded border p-2"
    />

    <input
      name="solarMiterPhone"
      placeholder="SOLARMITER Phone"
      onChange={handleChange}
      className="mb-2 w-full rounded border p-2"
    />

    <input
      name="solarMiterPayout"
      placeholder="Payout"
      onChange={handleChange}
      className="mb-2 w-full rounded border p-2"
    />

    <label className="mb-1 block text-sm font-medium">Aadhar Front</label>
<input
  type="file"
  accept="image/*"
  onChange={(e) => setSolarMiterAadharFront(e.target.files?.[0] || null)}
  className="mb-2 w-full rounded border p-2"
/>

<label className="mb-1 block text-sm font-medium">Aadhar Back</label>
<input
  type="file"
  accept="image/*"
  onChange={(e) => setSolarMiterAadharBack(e.target.files?.[0] || null)}
  className="mb-2 w-full rounded border p-2"
/>

<label className="mb-1 block text-sm font-medium">
  Bank Proof / Cheque / Passbook
</label>
<input
  type="file"
  accept="image/*"
  onChange={(e) => setSolarMiterBankProof(e.target.files?.[0] || null)}
  className="w-full rounded border p-2"
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