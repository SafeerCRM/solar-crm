'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import { uploadPreparedFile } from '@/app/utils/fileUpload';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs, { Dayjs } from 'dayjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Dealer = {
  id: number;
  vendorName?: string;
  phone?: string;
  gstNumber?: string;
  city?: string;
};

type CatalogItem = {
  id: number;
  name?: string;
  sellingRateWithGst?: number;
  availableQuantity?: number;
};

export default function CreateTradingMeetingPage() {
  const router = useRouter();

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [gpsPhotoFile, setGpsPhotoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    dealerId: '',
    dealerMode: 'EXISTING',
manualDealerName: '',
manualDealerPhone: '',
manualDealerCity: '',
    scheduledAt: '',
    meetingNotes: '',
    gpsLatitude: '',
    gpsLongitude: '',
    gpsAddress: '',
    expectedMaterialName: '',
    expectedQuantity: '',
    expectedOrderValue: '',
    nextFollowUpDate: '',
    nextAction: '',
  });

  const fetchBaseData = async () => {
    const [dealerRes, catalogRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/project/dealer/list`, {
        params: { page: 1, limit: 200, showHidden: false },
        headers: getAuthHeaders(),
      }),
      axios.get(`${API_BASE_URL}/project/dealer/catalog`, {
        params: { page: 1, limit: 200 },
        headers: getAuthHeaders(),
      }),
    ]);

    setDealers(dealerRes.data?.data || []);
    setCatalog(catalogRes.data?.data || []);
  };

  useEffect(() => {
    fetchBaseData().catch((error) => {
      console.error(error);
      alert('Failed to load dealer/catalog data');
    });
  }, []);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Location not supported on this device/browser');
      return;
    }

    try {
      setLocationLoading(true);

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0,
          });
        },
      );

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      let address = '';

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        );
        const data = await res.json();
        address = data.display_name || '';
      } catch (error) {
        console.error('Reverse geocoding failed', error);
      }

      setForm((prev) => ({
        ...prev,
        gpsLatitude: String(lat),
        gpsLongitude: String(lng),
        gpsAddress: address || prev.gpsAddress,
      }));
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Failed to capture location');
    } finally {
      setLocationLoading(false);
    }
  };

  const uploadTradingProof = async (file: File) => {
    const token = localStorage.getItem('token');

    return uploadPreparedFile({
      file,
      endpoint: `${API_BASE_URL}/project/dealer-payment-receipt/upload`,
      token,
      fieldName: 'files',
    });
  };

  const selectedMaterial = catalog.find(
    (item) => item.name === form.expectedMaterialName,
  );

  const onMaterialChange = (materialName: string) => {
    const material = catalog.find((item) => item.name === materialName);

    setForm((prev) => ({
      ...prev,
      expectedMaterialName: materialName,
      expectedOrderValue:
        material && prev.expectedQuantity
          ? String(
              Number(prev.expectedQuantity || 0) *
                Number(material.sellingRateWithGst || 0),
            )
          : prev.expectedOrderValue,
    }));
  };

  const onQuantityChange = (quantity: string) => {
    const expectedOrderValue = selectedMaterial
      ? Number(quantity || 0) *
        Number(selectedMaterial.sellingRateWithGst || 0)
      : Number(form.expectedOrderValue || 0);

    setForm((prev) => ({
      ...prev,
      expectedQuantity: quantity,
      expectedOrderValue: selectedMaterial
        ? String(expectedOrderValue)
        : prev.expectedOrderValue,
    }));
  };

  const createMeeting = async () => {
    if (
  form.dealerMode === 'EXISTING' &&
  !form.dealerId
) {
  alert('Dealer is required');
  return;
}

if (
  form.dealerMode === 'MANUAL' &&
  !form.manualDealerName.trim()
) {
  alert('Dealer name is required');
  return;
}

    if (!form.scheduledAt) {
      alert('Meeting date/time is required');
      return;
    }

    if (!form.meetingNotes.trim()) {
      alert('Meeting notes are required');
      return;
    }

    if (!form.gpsAddress.trim()) {
      alert('GPS address or meeting address is required');
      return;
    }

    try {
      setLoading(true);

      let gpsPhotoUrl = '';
      let audioUrl = '';

      if (gpsPhotoFile) {
        gpsPhotoUrl = await uploadTradingProof(gpsPhotoFile);
      }

      if (audioFile) {
        audioUrl = await uploadTradingProof(audioFile);
      }

      await axios.post(
        `${API_BASE_URL}/project/trading-meeting`,
        {
          ...form,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          nextFollowUpDate: form.nextFollowUpDate
            ? new Date(form.nextFollowUpDate).toISOString()
            : undefined,
          gpsLatitude: form.gpsLatitude
            ? Number(form.gpsLatitude)
            : undefined,
          gpsLongitude: form.gpsLongitude
            ? Number(form.gpsLongitude)
            : undefined,
          expectedQuantity: Number(form.expectedQuantity || 0),
          expectedOrderValue: Number(form.expectedOrderValue || 0),
          gpsPhotoUrl,
          audioUrl,
        },
        { headers: getAuthHeaders() },
      );

      alert('Trading meeting created successfully');
      router.push('/trading-meeting');
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to create trading meeting',
      );
    } finally {
      setLoading(false);
    }
  };

  const meetingDateValue = form.scheduledAt ? dayjs(form.scheduledAt) : null;
const meetingTimeValue = form.scheduledAt ? dayjs(form.scheduledAt) : null;

const followupDateValue = form.nextFollowUpDate
  ? dayjs(form.nextFollowUpDate)
  : null;
const followupTimeValue = form.nextFollowUpDate
  ? dayjs(form.nextFollowUpDate)
  : null;

const updateDateTimePart = (
  field: 'scheduledAt' | 'nextFollowUpDate',
  newDate: Dayjs | null,
) => {
  if (!newDate) {
    setForm((prev) => ({
      ...prev,
      [field]: '',
    }));
    return;
  }

  const base = form[field] ? dayjs(form[field]) : dayjs();

  const merged = newDate
    .hour(base.hour())
    .minute(base.minute())
    .second(0)
    .millisecond(0);

  setForm((prev) => ({
    ...prev,
    [field]: merged.format('YYYY-MM-DDTHH:mm'),
  }));
};

const updateTimePart = (
  field: 'scheduledAt' | 'nextFollowUpDate',
  newTime: Dayjs | null,
) => {
  if (!newTime) return;

  const base = form[field] ? dayjs(form[field]) : dayjs();

  const merged = base
    .hour(newTime.hour())
    .minute(newTime.minute())
    .second(0)
    .millisecond(0);

  setForm((prev) => ({
    ...prev,
    [field]: merged.format('YYYY-MM-DDTHH:mm'),
  }));
};

  return (
    <div className="mx-auto max-w-5xl space-y-5 overflow-x-hidden">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Create Trading Meeting
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Capture dealer meeting details, GPS proof, expected order value and follow-up.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-3 md:grid-cols-2">
  <select
    value={form.dealerMode}
    onChange={(e) =>
      setForm({
        ...form,
        dealerMode: e.target.value,
        dealerId: '',
        manualDealerName: '',
        manualDealerPhone: '',
        manualDealerCity: '',
      })
    }
    className="rounded-xl border p-3"
  >
    <option value="EXISTING">Existing Dealer</option>
    <option value="MANUAL">New / Manual Dealer</option>
  </select>

  {form.dealerMode === 'EXISTING' ? (
    <select
      value={form.dealerId}
      onChange={(e) =>
        setForm({
          ...form,
          dealerId: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    >
      <option value="">Select Dealer</option>
      {dealers.map((dealer) => (
        <option key={dealer.id} value={dealer.id}>
          {dealer.vendorName} - {dealer.city || ''}
        </option>
      ))}
    </select>
  ) : (
    <input
      type="text"
      placeholder="Dealer Name *"
      value={form.manualDealerName}
      onChange={(e) =>
        setForm({
          ...form,
          manualDealerName: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />
  )}

  {form.dealerMode === 'MANUAL' && (
    <>
      <input
        type="text"
        placeholder="Dealer Phone"
        value={form.manualDealerPhone}
        onChange={(e) =>
          setForm({
            ...form,
            manualDealerPhone: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="text"
        placeholder="Dealer City / Branch"
        value={form.manualDealerCity}
        onChange={(e) =>
          setForm({
            ...form,
            manualDealerCity: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />
    </>
  )}
</div>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
  <div className="grid gap-3 md:grid-cols-2">
    <DatePicker
      label="Meeting Date"
      value={meetingDateValue}
      onChange={(value) =>
        updateDateTimePart('scheduledAt', value)
      }
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
    />

    <MobileTimePicker
      label="Meeting Time"
      value={meetingTimeValue}
      onChange={(value) =>
        updateTimePart('scheduledAt', value)
      }
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

          <select
            value={form.expectedMaterialName}
            onChange={(e) => onMaterialChange(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">Expected Material</option>
            {catalog.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name} | Stock {item.availableQuantity || 0}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Expected Quantity"
            value={form.expectedQuantity}
            onChange={(e) => onQuantityChange(e.target.value)}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Expected Order Value"
            value={form.expectedOrderValue}
            onChange={(e) =>
              setForm({
                ...form,
                expectedOrderValue: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
  <div className="grid gap-3 md:grid-cols-2">
    <DatePicker
      label="Next Follow-up Date"
      value={followupDateValue}
      onChange={(value) =>
        updateDateTimePart('nextFollowUpDate', value)
      }
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
    />

    <MobileTimePicker
      label="Next Follow-up Time"
      value={followupTimeValue}
      onChange={(value) =>
        updateTimePart('nextFollowUpDate', value)
      }
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
          placeholder="Meeting Notes *"
          value={form.meetingNotes}
          onChange={(e) =>
            setForm({ ...form, meetingNotes: e.target.value })
          }
          className="mt-3 w-full rounded-xl border p-3"
        />

        <textarea
          placeholder="Next Action"
          value={form.nextAction}
          onChange={(e) =>
            setForm({ ...form, nextAction: e.target.value })
          }
          className="mt-3 w-full rounded-xl border p-3"
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          GPS / Proof
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            placeholder="GPS Latitude"
            value={form.gpsLatitude}
            onChange={(e) =>
              setForm({ ...form, gpsLatitude: e.target.value })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="GPS Longitude"
            value={form.gpsLongitude}
            onChange={(e) =>
              setForm({ ...form, gpsLongitude: e.target.value })
            }
            className="rounded-xl border p-3"
          />

          <textarea
            placeholder="GPS Address / Meeting Address *"
            value={form.gpsAddress}
            onChange={(e) =>
              setForm({ ...form, gpsAddress: e.target.value })
            }
            className="rounded-xl border p-3 md:col-span-2"
          />

          <label className="rounded-xl border p-3 text-sm">
            GPS Photo
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
            Audio Note
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

        <button
          onClick={getCurrentLocation}
          disabled={locationLoading}
          className="mt-4 rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {locationLoading ? 'Capturing Location...' : 'Capture GPS Location'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={createMeeting}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Trading Meeting'}
        </button>

        <button
          onClick={() => router.push('/trading-meeting')}
          className="rounded-xl bg-gray-200 px-6 py-3 font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}