'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

type FollowUp = {
  id: number;
  leadId: number;
  assignedTo?: number;
  followUpDate: string;
  status: string;
  note?: string;
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
  const router = useRouter();
  const id = params?.id;

  const [followup, setFollowup] = useState<FollowUp | null>(null);
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFollowup();
    }
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
    } catch (error) {
      console.error(error);
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
      console.error(error);
      setMessage(error?.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setMessage('');

      await axios.patch(
        `${backendUrl}/followup/${id}/complete`,
        {},
        { headers: getAuthHeaders() }
      );

      setMessage('Followup marked as completed');
      fetchFollowup();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Complete failed');
    } finally {
      setLoading(false);
    }
  };

  if (!followup) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading followup...</p>
        {message && <p className="mt-2 text-red-600">{message}</p>}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Followup Detail</h1>

        <Link
          href="/followup"
          className="rounded bg-gray-500 px-4 py-2 text-white"
        >
          Back
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            {followup.lead?.name || `Lead ID: ${followup.leadId}`}
          </h2>
          <p className="text-sm text-gray-600">{followup.lead?.phone || ''}</p>
          {followup.lead?.city && (
            <p className="text-sm text-gray-600">{followup.lead.city}</p>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {followup.lead?.phone && (
            <a
              href={`tel:${followup.lead.phone}`}
              className="rounded bg-green-600 px-4 py-2 text-white"
            >
              📞 Call Lead
            </a>
          )}

          <button
            onClick={handleComplete}
            disabled={loading || followup.status === 'COMPLETED'}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Mark Completed
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Next Follow-up Date
            </label>
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full rounded border p-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded border p-2"
              rows={5}
              placeholder="Add your followup notes here..."
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded bg-purple-600 px-4 py-2 text-white"
          >
            {loading ? 'Saving...' : 'Save Followup'}
          </button>
        </div>

        {message && <p className="mt-4 text-blue-600">{message}</p>}
      </div>
    </div>
  );
}