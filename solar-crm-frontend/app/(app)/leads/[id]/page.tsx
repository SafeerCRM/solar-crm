'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

type LeadSummary = {
  id: number;
  name: string;
  phone: string;
  city?: string;
  zone?: string;
  status?: string;
  potentialPercentage?: number;
  leadOwnerName?: string;
  assignedTo?: number | null;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
};

type TimelineItem = {
  type: 'LEAD_CREATED' | 'CALL_LOG' | 'FOLLOWUP' | 'NOTE';
  timestamp: string;
  title: string;
  description: string;
  meta?: Record<string, any>;
  noteId?: number;
};

type LeadHistoryResponse = {
  lead: LeadSummary;
  timeline: TimelineItem[];
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LeadHistoryPage() {
  const params = useParams();
  const id = params?.id;

  const [data, setData] = useState<LeadHistoryResponse | null>(null);
  const [message, setMessage] = useState('');
  const [noteText, setNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingPotential, setUpdatingPotential] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);

  useEffect(() => {
    if (id) {
      fetchHistory();
    }
  }, [id]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${backendUrl}/leads/${id}/history`, {
        headers: getAuthHeaders(),
      });

      setData(res.data);
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to load lead history');
      setData(null);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) {
      setMessage('Please enter a note');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      await axios.post(
        `${backendUrl}/leads/${id}/notes`,
        { note: noteText },
        { headers: getAuthHeaders() }
      );

      setNoteText('');
      setMessage('Note added successfully');
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const updateNote = async () => {
    if (!editingNoteId || !editingText.trim()) {
      setMessage('Please enter a note');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      await axios.patch(
        `${backendUrl}/leads/${id}/notes/${editingNoteId}`,
        { note: editingText },
        { headers: getAuthHeaders() }
      );

      setEditingNoteId(null);
      setEditingText('');
      setMessage('Note updated successfully');
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to update note');
    } finally {
      setSaving(false);
    }
  };

  const updatePotential = async (potentialPercentage: number) => {
    if (!data?.lead?.id) return;

    try {
      setUpdatingPotential(true);
      setMessage('');

      await axios.patch(
        `${backendUrl}/leads/${data.lead.id}`,
        { potentialPercentage },
        { headers: getAuthHeaders() }
      );

      setMessage('Lead potential updated successfully');
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(
        error?.response?.data?.message || 'Failed to update lead potential'
      );
    } finally {
      setUpdatingPotential(false);
    }
  };

    const createFollowUp = async () => {
    if (!data?.lead?.id || !followUpDate) {
      setMessage('Please choose follow-up date');
      return;
    }

    try {
      setCreatingFollowUp(true);
      setMessage('');

      await axios.post(
        `${backendUrl}/followup/create`,
        {
          leadId: data.lead.id,
          assignedTo: data.lead.assignedTo,
          note: followUpNote,
          followUpDate: new Date(followUpDate).toISOString(),
          status: 'PENDING',
          sourceModule: 'LEAD',
          sourceStage: 'LEAD_PAGE',
        },
        { headers: getAuthHeaders() }
      );

      setFollowUpNote('');
      setFollowUpDate('');
      setMessage('Followup created successfully');
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to create followup');
    } finally {
      setCreatingFollowUp(false);
    }
  };

  const getPotentialMeta = (value?: number | null) => {
    const potential = Number(value || 15);

    if (potential === 75) {
      return {
        label: 'High Potential (75%)',
        className: 'bg-green-100 text-green-700',
      };
    }

    if (potential === 50) {
      return {
        label: 'Likely (50%)',
        className: 'bg-yellow-100 text-yellow-700',
      };
    }

    return {
      label: 'Not Likely (15%)',
      className: 'bg-red-100 text-red-700',
    };
  };

  const getTypeBadge = (type: string) => {
    if (type === 'CALL_LOG') {
      return 'bg-blue-100 text-blue-700';
    }

    if (type === 'FOLLOWUP') {
      return 'bg-purple-100 text-purple-700';
    }

    if (type === 'NOTE') {
      return 'bg-orange-100 text-orange-700';
    }

    return 'bg-gray-100 text-gray-700';
  };

  if (!data) {
    return (
      <div className="p-6">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">Lead History</h1>
          <Link
            href="/leads"
            className="rounded bg-gray-500 px-4 py-2 text-white"
          >
            Back
          </Link>
        </div>

        {message ? (
          <div className="rounded bg-red-50 p-4 text-red-700">{message}</div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    );
  }

  const potentialMeta = getPotentialMeta(data.lead.potentialPercentage);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between">
        <h1 className="text-2xl font-semibold">Lead History</h1>

        <Link
          href="/leads"
          className="rounded bg-gray-500 px-4 py-2 text-white"
        >
          Back
        </Link>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-6 shadow">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{data.lead.name}</h2>
            <p className="text-sm text-gray-500">Lead ID: {data.lead.id}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${data.lead.phone}`}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white"
            >
              📞 Call
            </a>

            <Link
              href={`/meeting/create?leadId=${data.lead.id}&name=${encodeURIComponent(
                data.lead.name || ''
              )}&phone=${encodeURIComponent(
                data.lead.phone || ''
              )}&city=${encodeURIComponent(data.lead.city || '')}`}
              className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white"
            >
              Schedule Meeting
            </Link>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={Number(data.lead.potentialPercentage || 15)}
            onChange={(e) => updatePotential(Number(e.target.value))}
            disabled={updatingPotential}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value={15}>Not Likely (15%)</option>
            <option value={50}>Likely (50%)</option>
            <option value={75}>High Potential (75%)</option>
          </select>

          <span
            className={`inline-block rounded-full px-3 py-2 text-xs font-medium ${potentialMeta.className}`}
          >
            {updatingPotential ? 'Updating...' : potentialMeta.label}
          </span>
        </div>

        <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
          <p>
            <span className="font-medium">Phone:</span> {data.lead.phone}
          </p>
          <p>
            <span className="font-medium">City:</span> {data.lead.city || '-'}
          </p>
          <p>
            <span className="font-medium">Zone:</span> {data.lead.zone || '-'}
          </p>
          <p>
            <span className="font-medium">Status:</span> {data.lead.status || '-'}
          </p>
          <p>
            <span className="font-medium">Lead Owner:</span>{' '}
            {data.lead.leadOwnerName || '-'}
          </p>
          <p>
            <span className="font-medium">Current Remarks:</span>{' '}
            {data.lead.remarks || '-'}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Create Followup</h2>

        <div className="space-y-3">
          <textarea
            value={followUpNote}
            onChange={(e) => setFollowUpNote(e.target.value)}
            className="w-full rounded border p-3"
            rows={3}
            placeholder="Enter follow-up note"
          />

          <input
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full rounded border p-3"
          />

          <button
            onClick={createFollowUp}
            disabled={creatingFollowUp}
            className="rounded bg-purple-600 px-4 py-2 text-white"
          >
            {creatingFollowUp ? 'Creating...' : 'Create Followup'}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Notes</h2>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="mb-3 w-full rounded border p-3"
          rows={4}
          placeholder="Enter working note for this lead"
        />

        <button
          onClick={addNote}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          {saving ? 'Saving...' : 'Add Note'}
        </button>

        {message && <p className="mt-3 text-blue-600">{message}</p>}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Timeline</h2>

        {data.timeline.length === 0 ? (
          <p className="text-gray-600">No history available</p>
        ) : (
          <div className="space-y-4">
            {data.timeline.map((item, index) => (
              <div
                key={`${item.type}-${item.timestamp}-${index}`}
                className="rounded-xl border p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getTypeBadge(
                      item.type
                    )}`}
                  >
                    {item.type.replace('_', ' ')}
                  </span>

                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-800">{item.title}</h3>

                {item.type === 'NOTE' && item.noteId === editingNoteId ? (
                  <div className="mt-3">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="mb-2 w-full rounded border p-3"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={updateNote}
                        disabled={saving}
                        className="rounded bg-black px-4 py-2 text-white"
                      >
                        {saving ? 'Saving...' : 'Update Note'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingText('');
                        }}
                        className="rounded bg-gray-400 px-4 py-2 text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-gray-700">{item.description}</p>

                    {item.type === 'NOTE' && item.noteId ? (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            setEditingNoteId(item.noteId || null);
                            setEditingText(item.description || '');
                          }}
                          className="rounded bg-orange-500 px-3 py-2 text-sm text-white"
                        >
                          Edit Note
                        </button>
                      </div>
                    ) : null}
                  </>
                )}

                {item.meta && (
                  <div className="mt-3 rounded bg-gray-50 p-3 text-xs text-gray-600">
                    {Object.entries(item.meta).map(([key, value]) => (
                      <p key={key}>
                        <span className="font-medium">{key}:</span>{' '}
                        {value === null || value === undefined || value === ''
                          ? '-'
                          : String(value)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}