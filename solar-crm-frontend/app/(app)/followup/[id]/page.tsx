'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

type FollowUp = {
  id: number;
  leadId: number;
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
  };
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
  const [converted, setConverted] = useState(false);

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
          ? new Date(data.followUpDate).toISOString().slice(0, 16)
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

  // 🔥 NEW: Convert to Lead
  const handleConvertToLead = async () => {
    if (!followup?.lead) return;

    try {
      setLoading(true);
      setMessage('');

      await axios.post(
        `${backendUrl}/leads`,
        {
          name: followup.lead.name,
          phone: followup.lead.phone,
          city: followup.lead.city,
        },
        { headers: getAuthHeaders() }
      );

      setConverted(true);
      setMessage('Converted to Lead successfully');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Conversion failed');
    } finally {
      setLoading(false);
    }
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
          {followup.lead?.name || 'Lead'}
        </h2>

        <p className="text-gray-600">{followup.lead?.phone}</p>

        <div className="mt-4 flex gap-2">
          <a
            href={`tel:${followup.lead?.phone}`}
            className="rounded bg-green-600 px-4 py-2 text-white"
          >
            📞 Call
          </a>

          <button
            onClick={handleComplete}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Complete
          </button>

          {/* 🔥 Convert Button */}
          {!converted && (
            <button
              onClick={handleConvertToLead}
              className="rounded bg-purple-600 px-4 py-2 text-white"
            >
              Convert to Lead
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as 'PENDING' | 'COMPLETED' | 'MISSED')
            }
            className="w-full border p-2"
          >
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="MISSED">MISSED</option>
          </select>

          <input
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full border p-2"
          />

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border p-2"
            rows={4}
          />

          <button
            onClick={handleSave}
            className="rounded bg-black px-4 py-2 text-white"
          >
            Save
          </button>
        </div>

        {message && <p className="mt-3 text-blue-600">{message}</p>}
      </div>
    </div>
  );
}