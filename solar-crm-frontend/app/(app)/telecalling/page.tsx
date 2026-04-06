'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/authHeaders';

type Lead = {
  id: number;
  name: string;
  phone: string;
};

type CallLog = {
  id: number;
  leadId: number;
  callStatus: string;
  callNotes?: string;
  nextFollowUpDate?: string;
  recordingUrl?: string;
  reviewStatus?: 'PENDING' | 'POTENTIAL' | 'CONVERTED' | 'REJECTED';
  reviewNotes?: string;
  createdAt: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  roles: string[];
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TelecallingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [leadId, setLeadId] = useState('');
  const [callStatus, setCallStatus] = useState('CONNECTED');
  const [callNotes, setCallNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [reviewStatusMap, setReviewStatusMap] = useState<Record<number, string>>({});
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<number, string>>({});

  const userRoles = user?.roles || [];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      window.location.href = '/';
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch {
      localStorage.clear();
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchLeads();
      fetchCalls();
    }
  }, [user]);

  const fetchLeads = async () => {
    try {
      const params: any = {};

      if (userRoles.includes('TELECALLER')) {
        params.assignedTo = user?.id;
      }

      const res = await axios.get(`${backendUrl}/leads`, {
        params,
        headers: getAuthHeaders(),
      });

      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLeads([]);
    }
  };

  const fetchCalls = async () => {
    try {
      const shouldUseReviewQueue =
        userRoles.includes('TELECALLING_MANAGER') ||
        userRoles.includes('PROJECT_MANAGER');

      const endpoint = shouldUseReviewQueue
        ? `${backendUrl}/telecalling/review-queue`
        : `${backendUrl}/telecalling`;

      const res = await axios.get(endpoint, {
        headers: getAuthHeaders(),
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setCalls(data);

      const initialStatusMap: Record<number, string> = {};
      const initialNotesMap: Record<number, string> = {};

      data.forEach((call: CallLog) => {
        initialStatusMap[call.id] = call.reviewStatus || 'PENDING';
        initialNotesMap[call.id] = call.reviewNotes || '';
      });

      setReviewStatusMap(initialStatusMap);
      setReviewNotesMap(initialNotesMap);
    } catch (error) {
      console.error('Failed to fetch calls:', error);
      setCalls([]);
    }
  };

  const goToNextLead = () => {
    if (!leadId || leads.length === 0) return;

    const currentIndex = leads.findIndex((l) => l.id === Number(leadId));
    const nextLead = leads[currentIndex + 1];

    if (nextLead) {
      setLeadId(String(nextLead.id));
    } else {
      setLeadId('');
      setMessage('Call logged successfully. No more leads in queue.');
    }
  };

  const selectedLead = leads.find((l) => l.id === Number(leadId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!user) {
      setMessage('Unable to identify logged-in user');
      return;
    }

    if (!leadId) {
      setMessage('Please select a lead');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        leadId: Number(leadId),
        callStatus,
        callNotes,
        recordingUrl,
      };

      if (nextFollowUpDate) {
        payload.nextFollowUpDate = new Date(nextFollowUpDate).toISOString();
      }

      await axios.post(`${backendUrl}/telecalling`, payload, {
        headers: getAuthHeaders(),
      });

      setMessage('Call logged successfully');
      setCallStatus('CONNECTED');
      setCallNotes('');
      setNextFollowUpDate('');
      setRecordingUrl('');
      await fetchCalls();
      goToNextLead();
    } catch (error: any) {
      console.error('Failed to log call:', error);
      setMessage(error?.response?.data?.message || 'Failed to log call');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSave = async (callId: number) => {
    try {
      await axios.patch(
        `${backendUrl}/telecalling/${callId}/review`,
        {
          reviewStatus: reviewStatusMap[callId],
          reviewNotes: reviewNotesMap[callId],
        },
        {
          headers: getAuthHeaders(),
        }
      );

      setMessage('Review updated successfully');
      await fetchCalls();
    } catch (error: any) {
      console.error('Failed to update review:', error);
      setMessage(error?.response?.data?.message || 'Failed to update review');
    }
  };

  const canReview =
    userRoles.includes('TELECALLING_MANAGER') ||
    userRoles.includes('PROJECT_MANAGER');

  const canLogCalls =
    userRoles.includes('TELECALLER') ||
    userRoles.includes('OWNER') ||
    userRoles.includes('LEAD_MANAGER') ||
    userRoles.includes('TELECALLING_MANAGER');

  return (
    <div className="p-6">
      {canLogCalls && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Telecalling</h1>

            <Link
              href="/telecalling/contacts"
              className="rounded-xl bg-purple-600 px-4 py-2 font-medium text-white"
            >
              Go to Contacts
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full rounded-xl border border-gray-400 px-4 py-3"
              >
                <option value="">Select lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.phone})
                  </option>
                ))}
              </select>

              {selectedLead?.phone && (
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="rounded-xl bg-green-600 px-4 py-3 font-semibold text-white"
                >
                  📞 Call
                </a>
              )}
            </div>

            <select
              value={callStatus}
              onChange={(e) => setCallStatus(e.target.value)}
              className="w-full rounded-xl border border-gray-400 px-4 py-3"
            >
              <option value="CONNECTED">CONNECTED</option>
              <option value="CALLBACK">CALLBACK</option>
              <option value="INTERESTED">INTERESTED</option>
              <option value="NOT_INTERESTED">NOT_INTERESTED</option>
              <option value="CNR">CNR</option>
            </select>

            <input
              type="text"
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Call notes"
              className="w-full rounded-xl border border-gray-400 px-4 py-3"
            />

            <input
              type="text"
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              placeholder="Recording URL"
              className="w-full rounded-xl border border-gray-400 px-4 py-3"
            />

            <input
              type="datetime-local"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full rounded-xl border border-gray-400 px-4 py-3"
            />

            {message && (
              <p
                className={`text-sm ${
                  message.toLowerCase().includes('success')
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {message}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
              >
                {loading ? 'Saving...' : 'Log Call'}
              </button>

              <button
                type="button"
                onClick={goToNextLead}
                className="rounded-xl bg-gray-700 px-6 py-3 font-semibold text-white"
              >
                Next Lead
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-2xl font-bold">
          {canReview ? 'Call Review Queue' : 'Call History'}
        </h2>

        {calls.length === 0 ? (
          <p>No calls found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Lead ID</th>
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">Notes</th>
                  <th className="border p-2 text-left">Recording</th>
                  <th className="border p-2 text-left">Review Status</th>
                  <th className="border p-2 text-left">Review Notes</th>
                  {canReview && <th className="border p-2 text-left">Action</th>}
                  <th className="border p-2 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id}>
                    <td className="border p-2">{call.leadId}</td>
                    <td className="border p-2">{call.callStatus}</td>
                    <td className="border p-2">{call.callNotes || '-'}</td>
                    <td className="border p-2">
                      {call.recordingUrl ? (
                        <a href={call.recordingUrl} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        'No Recording'
                      )}
                    </td>

                    <td className="border p-2">
                      {canReview ? (
                        <select
                          value={reviewStatusMap[call.id] || 'PENDING'}
                          onChange={(e) =>
                            setReviewStatusMap((prev) => ({
                              ...prev,
                              [call.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="POTENTIAL">POTENTIAL</option>
                          <option value="CONVERTED">CONVERTED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      ) : (
                        call.reviewStatus || '-'
                      )}
                    </td>

                    <td className="border p-2">
                      {canReview ? (
                        <input
                          value={reviewNotesMap[call.id] || ''}
                          onChange={(e) =>
                            setReviewNotesMap((prev) => ({
                              ...prev,
                              [call.id]: e.target.value,
                            }))
                          }
                          className="w-full rounded border px-2 py-1"
                        />
                      ) : (
                        call.reviewNotes || '-'
                      )}
                    </td>

                    {canReview && (
                      <td className="border p-2">
                        <button
                          onClick={() => handleReviewSave(call.id)}
                          className="rounded bg-blue-600 px-3 py-1 text-white"
                        >
                          Save
                        </button>
                      </td>
                    )}

                    <td className="border p-2">
                      {new Date(call.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}