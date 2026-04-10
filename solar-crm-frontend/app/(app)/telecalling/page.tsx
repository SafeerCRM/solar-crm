'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

type Lead = {
  id: number;
  name: string;
  phone: string;
  city?: string;
};

type ContactSummary = {
  id: number;
  name: string;
  phone: string;
  city?: string;
  address?: string;
  location?: string;
  convertedToLead?: boolean;
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

type ContactWorkHistoryResponse = {
  contact: ContactSummary;
  timeline: WorkHistoryItem[];
};

type LatestContactCallInfo = {
  callStatus?: string;
  notes?: string;
  nextFollowUpDate?: string;
  updatedAt?: string;
};

type CallLog = {
  id: number;
  leadId?: number | null;
  contactId?: number | null;
  callStatus: string;
  callNotes?: string;
  nextFollowUpDate?: string;
  recordingUrl?: string;
  providerName?: string;
  disposition?: string;
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

type EnrichedCallRow = CallLog & {
  displayName: string;
  displayPhone: string;
  displayCity: string;
  rowType: 'LEAD' | 'CONTACT' | 'UNKNOWN';
  personKey: string;
  effectiveStatus: string;
  effectiveNotes: string;
  effectiveNextFollowUpDate?: string;
  effectiveTimestamp: string;
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TelecallingPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [contactMap, setContactMap] = useState<Record<number, ContactSummary>>({});
  const [contactLatestCallMap, setContactLatestCallMap] = useState<
    Record<number, LatestContactCallInfo>
  >({});

  const [leadId, setLeadId] = useState('');
  const [callStatus, setCallStatus] = useState('CONNECTED');
  const [callNotes, setCallNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [reviewStatusMap, setReviewStatusMap] = useState<Record<number, string>>({});
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<number, string>>({});

  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

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

  useEffect(() => {
    if (calls.length > 0) {
      fetchContactDataAndLatestHistory();
    } else {
      setContactMap({});
      setContactLatestCallMap({});
    }
  }, [calls]);

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

  const fetchContactDataAndLatestHistory = async () => {
    try {
      const uniqueContactIds = Array.from(
        new Set(
          calls
            .map((call) => call.contactId)
            .filter((id): id is number => typeof id === 'number' && id > 0)
        )
      );

      if (uniqueContactIds.length === 0) {
        setContactMap({});
        setContactLatestCallMap({});
        return;
      }

      const results = await Promise.all(
        uniqueContactIds.map(async (id) => {
          try {
            const res = await axios.get<ContactWorkHistoryResponse>(
              `${backendUrl}/telecalling/contacts/${id}/work-history`,
              {
                headers: getAuthHeaders(),
              }
            );

            return res.data;
          } catch (error) {
            console.error(`Failed to fetch contact work history for ${id}:`, error);
            return null;
          }
        })
      );

      const nextContactMap: Record<number, ContactSummary> = {};
      const nextLatestMap: Record<number, LatestContactCallInfo> = {};

      results.forEach((item) => {
        if (!item?.contact?.id) return;

        nextContactMap[item.contact.id] = item.contact;

        const latestContactCall = (item.timeline || [])
          .filter((entry) => entry.type === 'CONTACT_CALL')
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];

        if (latestContactCall) {
          nextLatestMap[item.contact.id] = {
            callStatus: String(
              latestContactCall.meta?.callStatus || latestContactCall.title || ''
            )
              .replace(/^Call\s+/i, '')
              .trim(),
            notes: latestContactCall.description || '',
            nextFollowUpDate: latestContactCall.meta?.nextFollowUpDate
              ? String(latestContactCall.meta.nextFollowUpDate)
              : undefined,
            updatedAt: latestContactCall.timestamp,
          };
        }
      });

      setContactMap(nextContactMap);
      setContactLatestCallMap(nextLatestMap);
    } catch (error) {
      console.error('Failed to fetch contact summaries/latest history:', error);
      setContactMap({});
      setContactLatestCallMap({});
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

  const handleCallback = (row: EnrichedCallRow) => {
    if (!row.displayPhone || row.displayPhone === '-') {
      setMessage('Phone not available for callback');
      return;
    }

    if (row.leadId) {
      setLeadId(String(row.leadId));
      setCallStatus('CALLBACK');
      setCallNotes(row.effectiveNotes || '');
    }

    if (typeof window !== 'undefined') {
      window.open(`tel:${row.displayPhone}`, '_self');
    }
  };

  const clearFilters = () => {
    setNameFilter('');
    setPhoneFilter('');
    setCityFilter('');
  };

  const canReview =
    userRoles.includes('TELECALLING_MANAGER') ||
    userRoles.includes('PROJECT_MANAGER');

  const canLogCalls =
    userRoles.includes('TELECALLER') ||
    userRoles.includes('OWNER') ||
    userRoles.includes('LEAD_MANAGER') ||
    userRoles.includes('TELECALLING_MANAGER');

  const enrichedCalls = useMemo<EnrichedCallRow[]>(() => {
    return calls.map((call) => {
      if (call.leadId) {
        const lead = leads.find((item) => item.id === call.leadId);

        return {
          ...call,
          displayName: lead?.name || `Lead #${call.leadId}`,
          displayPhone: lead?.phone || '-',
          displayCity: lead?.city || '-',
          rowType: 'LEAD',
          personKey: `lead-${call.leadId}`,
          effectiveStatus: call.disposition || call.callStatus,
          effectiveNotes: call.callNotes || '',
          effectiveNextFollowUpDate: call.nextFollowUpDate,
          effectiveTimestamp: call.createdAt,
        };
      }

      if (call.contactId) {
        const contact = contactMap[call.contactId];
        const latestContactCall = contactLatestCallMap[call.contactId];

        return {
          ...call,
          displayName: contact?.name || `Contact #${call.contactId}`,
          displayPhone: contact?.phone || '-',
          displayCity: contact?.city || contact?.address || contact?.location || '-',
          rowType: 'CONTACT',
          personKey: `contact-${call.contactId}`,
          effectiveStatus:
            latestContactCall?.callStatus || call.disposition || call.callStatus,
          effectiveNotes: latestContactCall?.notes || call.callNotes || '',
          effectiveNextFollowUpDate:
            latestContactCall?.nextFollowUpDate || call.nextFollowUpDate,
          effectiveTimestamp: latestContactCall?.updatedAt || call.createdAt,
        };
      }

      return {
        ...call,
        displayName: '-',
        displayPhone: '-',
        displayCity: '-',
        rowType: 'UNKNOWN',
        personKey: `unknown-${call.id}`,
        effectiveStatus: call.disposition || call.callStatus,
        effectiveNotes: call.callNotes || '',
        effectiveNextFollowUpDate: call.nextFollowUpDate,
        effectiveTimestamp: call.createdAt,
      };
    });
  }, [calls, leads, contactMap, contactLatestCallMap]);

  const latestOnlyCalls = useMemo(() => {
    const sorted = [...enrichedCalls].sort(
      (a, b) =>
        new Date(b.effectiveTimestamp).getTime() -
        new Date(a.effectiveTimestamp).getTime()
    );

    const latestMap = new Map<string, EnrichedCallRow>();

    for (const row of sorted) {
      if (!latestMap.has(row.personKey)) {
        latestMap.set(row.personKey, row);
      }
    }

    return Array.from(latestMap.values());
  }, [enrichedCalls]);

  const filteredCalls = useMemo(() => {
    return latestOnlyCalls.filter((call) => {
      const matchesName =
        !nameFilter.trim() ||
        call.displayName.toLowerCase().includes(nameFilter.trim().toLowerCase());

      const matchesPhone =
        !phoneFilter.trim() ||
        call.displayPhone.toLowerCase().includes(phoneFilter.trim().toLowerCase());

      const matchesCity =
        !cityFilter.trim() ||
        call.displayCity.toLowerCase().includes(cityFilter.trim().toLowerCase());

      return matchesName && matchesPhone && matchesCity;
    });
  }, [latestOnlyCalls, nameFilter, phoneFilter, cityFilter]);

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
                  message.toLowerCase().includes('success') ||
                  message.toLowerCase().includes('successfully')
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
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold">
            {canReview ? 'Call Review Queue' : 'Call History'}
          </h2>

          <div className="grid w-full gap-2 md:max-w-4xl md:grid-cols-4">
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Search by name"
              className="rounded-xl border border-gray-300 px-3 py-2"
            />

            <input
              type="text"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="Search by phone"
              className="rounded-xl border border-gray-300 px-3 py-2"
            />

            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Search by city"
              className="rounded-xl border border-gray-300 px-3 py-2"
            />

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl bg-gray-200 px-4 py-2 font-medium text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {filteredCalls.length === 0 ? (
          <p>No calls found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Lead / Contact</th>
                  <th className="border p-2 text-left">Phone</th>
                  <th className="border p-2 text-left">City</th>
                  <th className="border p-2 text-left">Latest Status</th>
                  <th className="border p-2 text-left">Latest Notes</th>
                  <th className="border p-2 text-left">Recording</th>
                  <th className="border p-2 text-left">Next Follow-up</th>
                  <th className="border p-2 text-left">Actions</th>
                  <th className="border p-2 text-left">Review Status</th>
                  <th className="border p-2 text-left">Review Notes</th>
                  {canReview && <th className="border p-2 text-left">Save</th>}
                  <th className="border p-2 text-left">Updated At</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map((call) => (
                  <tr key={call.personKey}>
                    <td className="border p-2">{call.displayName}</td>
                    <td className="border p-2">{call.displayPhone}</td>
                    <td className="border p-2">{call.displayCity}</td>
                    <td className="border p-2">{call.effectiveStatus}</td>
                    <td className="border p-2">{call.effectiveNotes || '-'}</td>

                    <td className="border p-2">
                      {call.recordingUrl ? (
                        <a
                          href={call.recordingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          Open
                        </a>
                      ) : (
                        'No Recording'
                      )}
                    </td>

                    <td className="border p-2">
                      {call.effectiveNextFollowUpDate
                        ? new Date(call.effectiveNextFollowUpDate).toLocaleString()
                        : '-'}
                    </td>

                    <td className="border p-2">
                      <div className="flex flex-wrap gap-2">
                        {call.displayPhone !== '-' && (
                          <button
                            type="button"
                            onClick={() => handleCallback(call)}
                            className="rounded bg-green-600 px-3 py-1 text-white"
                          >
                            Callback
                          </button>
                        )}

                        {call.rowType === 'CONTACT' && call.contactId && (
                          <button
                            type="button"
                            onClick={() => router.push(`/telecalling/contacts/${call.contactId}`)}
                            className="rounded bg-purple-600 px-3 py-1 text-white"
                          >
                            Open Contact
                          </button>
                        )}

                        {call.rowType === 'LEAD' && call.leadId && (
                          <Link
                            href={`/leads/${call.leadId}`}
                            className="rounded bg-blue-600 px-3 py-1 text-white"
                          >
                            Open Lead
                          </Link>
                        )}
                      </div>
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
                          className="rounded border px-2 py-1"
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
                      {new Date(call.effectiveTimestamp).toLocaleString()}
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