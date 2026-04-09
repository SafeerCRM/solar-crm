'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

type Contact = {
  id: number;
  name: string;
  phone: string;
  city?: string;
  address?: string;
  location?: string;
  kNo?: string;
  assignedTo?: number;
  assignedToName?: string;
  importedByName?: string;
  convertedToLead?: boolean;
  remarks?: string;
};

type WorkHistoryItem = {
  type: 'CONTACT_CREATED' | 'CONTACT_NOTE' | 'CONTACT_CALL';
  timestamp: string;
  title: string;
  description: string;
  noteId?: number;
  callHistoryId?: number;
  meta?: Record<string, any>;
};

type WorkHistoryResponse = {
  contact: Contact;
  timeline: WorkHistoryItem[];
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TelecallingContactDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [data, setData] = useState<WorkHistoryResponse | null>(null);
  const [message, setMessage] = useState('');

  const [noteText, setNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const [callStatus, setCallStatus] = useState('CONNECTED');
  const [callNotes, setCallNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const [editingCallId, setEditingCallId] = useState<number | null>(null);
  const [editingCallStatus, setEditingCallStatus] = useState('CONNECTED');
  const [editingCallNotes, setEditingCallNotes] = useState('');
  const [editingNextFollowUpDate, setEditingNextFollowUpDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertSliderValue, setConvertSliderValue] = useState(0);

  useEffect(() => {
    if (id) {
      fetchHistory();
    }
  }, [id]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${backendUrl}/telecalling/contacts/${id}/work-history`, {
        headers: getAuthHeaders(),
      });

      setData(res.data);
      setConvertSliderValue(0);
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to load contact details');
      setData(null);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) {
      setMessage('Please enter a note');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await axios.post(
        `${backendUrl}/telecalling/contacts/${id}/notes`,
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
      setLoading(false);
    }
  };

  const updateNote = async () => {
    if (!editingNoteId || !editingNoteText.trim()) {
      setMessage('Please enter a note');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await axios.patch(
        `${backendUrl}/telecalling/contacts/${id}/notes/${editingNoteId}`,
        { note: editingNoteText },
        { headers: getAuthHeaders() }
      );

      setEditingNoteId(null);
      setEditingNoteText('');
      setMessage('Note updated successfully');
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  const addCallHistory = async () => {
    try {
      setLoading(true);
      setMessage('');

      await axios.post(
        `${backendUrl}/telecalling/contacts/${id}/call-history`,
        {
          callStatus,
          notes: callNotes,
          nextFollowUpDate: nextFollowUpDate
            ? new Date(nextFollowUpDate).toISOString()
            : undefined,
        },
        { headers: getAuthHeaders() }
      );

      setCallStatus('CONNECTED');
      setCallNotes('');
      setNextFollowUpDate('');
      setMessage('Call history added successfully');
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to add call history');
    } finally {
      setLoading(false);
    }
  };

  const updateCallHistory = async () => {
    if (!editingCallId) {
      setMessage('No call history selected');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await axios.patch(
        `${backendUrl}/telecalling/contacts/${id}/call-history/${editingCallId}`,
        {
          callStatus: editingCallStatus,
          notes: editingCallNotes,
          nextFollowUpDate: editingNextFollowUpDate
            ? new Date(editingNextFollowUpDate).toISOString()
            : undefined,
        },
        { headers: getAuthHeaders() }
      );

      setEditingCallId(null);
      setEditingCallStatus('CONNECTED');
      setEditingCallNotes('');
      setEditingNextFollowUpDate('');
      setMessage('Call history updated successfully');
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to update call history');
    } finally {
      setLoading(false);
    }
  };

  const convertToLead = async () => {
    try {
      setConverting(true);
      setMessage('');

      await axios.post(
        `${backendUrl}/telecalling/contacts/${id}/convert`,
        {},
        { headers: getAuthHeaders() }
      );

      setMessage('Contact converted to lead successfully');
      setConvertSliderValue(0);
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to convert contact');
      setConvertSliderValue(0);
    } finally {
      setConverting(false);
    }
  };

  const handleConvertSliderChange = async (value: number) => {
    setConvertSliderValue(value);

    if (value >= 100 && !converting && !data?.contact?.convertedToLead) {
      await convertToLead();
    }
  };

  const resetConvertSlider = () => {
    if (converting || data?.contact?.convertedToLead) return;
    setConvertSliderValue(0);
  };

  const getTypeBadge = (type: string) => {
    if (type === 'CONTACT_CALL') return 'bg-blue-100 text-blue-700';
    if (type === 'CONTACT_NOTE') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (!data) {
    return (
      <div className="p-6">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">Contact Detail</h1>
          <Link
            href="/telecalling/contacts"
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

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between">
        <h1 className="text-2xl font-semibold">Contact Detail</h1>

        <Link
          href="/telecalling/contacts"
          className="rounded bg-gray-500 px-4 py-2 text-white"
        >
          Back
        </Link>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-6 shadow">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{data.contact.name}</h2>
            <p className="text-sm text-gray-500">Contact ID: {data.contact.id}</p>
          </div>

          <a
            href={`tel:${data.contact.phone}`}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white"
          >
            📞 Call
          </a>
        </div>

        <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
          <p>
            <span className="font-medium">Phone:</span> {data.contact.phone}
          </p>
          <p>
            <span className="font-medium">City:</span> {data.contact.city || '-'}
          </p>
          <p>
            <span className="font-medium">Address:</span> {data.contact.address || '-'}
          </p>
          <p>
            <span className="font-medium">Location:</span> {data.contact.location || '-'}
          </p>
          <p>
            <span className="font-medium">Assigned To:</span> {data.contact.assignedToName || '-'}
          </p>
          <p>
            <span className="font-medium">Imported By:</span> {data.contact.importedByName || '-'}
          </p>
        </div>

        <div className="mt-5 rounded border bg-gray-50 p-4">
          {data.contact.convertedToLead ? (
            <div className="font-medium text-green-700">
              This contact has already been converted to lead.
            </div>
          ) : (
            <div className="max-w-md">
              <p className="mb-2 text-sm font-medium text-gray-700">
                Drag to convert to lead
              </p>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={convertSliderValue}
                onChange={(e) => handleConvertSliderChange(Number(e.target.value))}
                onMouseUp={resetConvertSlider}
                onTouchEnd={resetConvertSlider}
                disabled={converting}
                className="w-full"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>Drag</span>
                <span>{converting ? 'Converting...' : `${convertSliderValue}%`}</span>
                <span>Convert</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Add Note</h2>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="mb-3 w-full rounded border p-3"
          rows={4}
          placeholder="Enter working note for this contact"
        />

        <button
          onClick={addNote}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          {loading ? 'Saving...' : 'Add Note'}
        </button>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Add Call History</h2>

        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={callStatus}
            onChange={(e) => setCallStatus(e.target.value)}
            className="rounded border p-2"
          >
            <option value="CONNECTED">CONNECTED</option>
            <option value="CALLBACK">CALLBACK</option>
            <option value="NOT_INTERESTED">NOT_INTERESTED</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="NO_RESPONSE">NO_RESPONSE</option>
          </select>

          <input
            type="datetime-local"
            value={nextFollowUpDate}
            onChange={(e) => setNextFollowUpDate(e.target.value)}
            className="rounded border p-2"
          />

          <button
            onClick={addCallHistory}
            disabled={loading}
            className="rounded bg-black px-4 py-2 text-white"
          >
            {loading ? 'Saving...' : 'Add Call Entry'}
          </button>
        </div>

        <textarea
          value={callNotes}
          onChange={(e) => setCallNotes(e.target.value)}
          className="mt-3 w-full rounded border p-3"
          rows={4}
          placeholder="Enter call notes"
        />
      </div>

      {message && <p className="mb-4 text-blue-600">{message}</p>}

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Work History</h2>

        {data.timeline.length === 0 ? (
          <p className="text-gray-600">No work history available</p>
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

                {item.type === 'CONTACT_NOTE' && item.noteId === editingNoteId ? (
                  <div className="mt-3">
                    <textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      className="mb-2 w-full rounded border p-3"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={updateNote}
                        disabled={loading}
                        className="rounded bg-black px-4 py-2 text-white"
                      >
                        {loading ? 'Saving...' : 'Update Note'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingNoteText('');
                        }}
                        className="rounded bg-gray-400 px-4 py-2 text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : item.type === 'CONTACT_CALL' && item.callHistoryId === editingCallId ? (
                  <div className="mt-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <select
                        value={editingCallStatus}
                        onChange={(e) => setEditingCallStatus(e.target.value)}
                        className="rounded border p-2"
                      >
                        <option value="CONNECTED">CONNECTED</option>
                        <option value="CALLBACK">CALLBACK</option>
                        <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                        <option value="INTERESTED">INTERESTED</option>
                        <option value="NO_RESPONSE">NO_RESPONSE</option>
                      </select>

                      <input
                        type="datetime-local"
                        value={editingNextFollowUpDate}
                        onChange={(e) => setEditingNextFollowUpDate(e.target.value)}
                        className="rounded border p-2"
                      />

                      <button
                        onClick={updateCallHistory}
                        disabled={loading}
                        className="rounded bg-black px-4 py-2 text-white"
                      >
                        {loading ? 'Saving...' : 'Update Call Entry'}
                      </button>
                    </div>

                    <textarea
                      value={editingCallNotes}
                      onChange={(e) => setEditingCallNotes(e.target.value)}
                      className="mt-3 w-full rounded border p-3"
                      rows={4}
                    />

                    <button
                      onClick={() => {
                        setEditingCallId(null);
                        setEditingCallStatus('CONNECTED');
                        setEditingCallNotes('');
                        setEditingNextFollowUpDate('');
                      }}
                      className="mt-2 rounded bg-gray-400 px-4 py-2 text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-gray-700">{item.description}</p>

                    {item.type === 'CONTACT_NOTE' && item.noteId ? (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            setEditingNoteId(item.noteId || null);
                            setEditingNoteText(item.description || '');
                          }}
                          className="rounded bg-orange-500 px-3 py-2 text-sm text-white"
                        >
                          Edit Note
                        </button>
                      </div>
                    ) : null}

                    {item.type === 'CONTACT_CALL' && item.callHistoryId ? (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            setEditingCallId(item.callHistoryId || null);
                            setEditingCallStatus(
                              String(item.meta?.callStatus || 'CONNECTED')
                            );
                            setEditingCallNotes(item.description || '');
                            setEditingNextFollowUpDate(
                              item.meta?.nextFollowUpDate
                                ? new Date(item.meta.nextFollowUpDate)
                                    .toISOString()
                                    .slice(0, 16)
                                : ''
                            );
                          }}
                          className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
                        >
                          Edit Call Entry
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