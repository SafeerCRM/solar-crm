'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import { useRouter } from 'next/navigation';

type Lead = {
  id: number;
  name: string;
  phone: string;
};

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
    assignedTo?: number;
    createdByName?: string;
  };
};

type User = {
  id: number;
  name: string;
  email: string;
  roles: string[];
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function FollowupPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allFollowups, setAllFollowups] = useState<FollowUp[]>([]);

  const [leadId, setLeadId] = useState('');
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);

  const userRoles = user?.roles || [];

  const canCreateFollowup =
    userRoles.includes('OWNER') ||
    userRoles.includes('LEAD_MANAGER') ||
    userRoles.includes('TELECALLER') ||
    userRoles.includes('LEAD_EXECUTIVE') ||
    userRoles.includes('MEETING_MANAGER');

  const canFetchAssignableUsers =
    userRoles.includes('OWNER') ||
    userRoles.includes('LEAD_MANAGER') ||
    userRoles.includes('TELECALLING_MANAGER');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      window.location.href = '/';
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      localStorage.clear();
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchLeads();
      fetchFollowups();

      if (canFetchAssignableUsers) {
        fetchAssignableUsers();
      } else {
        setUsers([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAssignableUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users/assignable-staff`, {
        headers: getAuthHeaders(),
      });

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setUsers([]);
    }
  };

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
      console.error(error);
      setLeads([]);
    }
  };

  const fetchFollowups = async () => {
    try {
      const res = await axios.get(`${backendUrl}/followup`, {
        headers: getAuthHeaders(),
      });

      setAllFollowups(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setAllFollowups([]);
    }
  };

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!user) return;

    if (!leadId || !followUpDate) {
      setMessage('Please fill required fields');
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${backendUrl}/followup/create`,
        {
          leadId: Number(leadId),
          assignedTo: user.id,
          note,
          followUpDate: new Date(followUpDate).toISOString(),
          status: 'PENDING',
        },
        { headers: getAuthHeaders() }
      );

      setMessage('Followup created successfully');
      setLeadId('');
      setNote('');
      setFollowUpDate('');
      fetchFollowups();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToMeeting = async (followupId: number) => {
    try {
      setConvertingId(followupId);
      setMessage('');

      const res = await axios.get(
        `${backendUrl}/followup/${followupId}/convert-to-meeting`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = res.data || {};
      const lead = data.lead || {};

      const params = new URLSearchParams();

      if (data.leadId) params.set('leadId', String(data.leadId));
      if (data.followupId) params.set('followupId', String(data.followupId));
      if (lead.name) params.set('name', String(lead.name));
      if (lead.phone) params.set('phone', String(lead.phone));
      if (lead.city) params.set('city', String(lead.city));
      if (lead.assignedTo) params.set('assignedTo', String(lead.assignedTo));
      if (lead.createdByName) {
        params.set('leadOwnerName', String(lead.createdByName));
      }

      router.push(`/meeting/create?${params.toString()}`);
    } catch (error: any) {
      console.error(error);
      setMessage(
        error?.response?.data?.message || 'Failed to open convert to meeting'
      );
    } finally {
      setConvertingId(null);
    }
  };

  const getUserName = (id?: number) => {
    const found = users.find((u) => u.id === id);
    return found ? `${found.name} (${found.id})` : 'Unassigned';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700';
    if (status === 'COMPLETED') return 'bg-green-100 text-green-700';
    if (status === 'CANCELLED') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6 p-6">
      {canCreateFollowup && (
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Create Followup</h2>

          <form onSubmit={handleCreateFollowup} className="space-y-3">
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">Select Lead</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.phone})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded border p-2"
            />

            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full rounded border p-2"
            />

            <button className="rounded bg-blue-600 px-4 py-2 text-white">
              {loading ? 'Creating...' : 'Create Followup'}
            </button>
          </form>

          {message && <p className="mt-2 text-blue-600">{message}</p>}
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xl font-semibold">All Followups</h2>

        {allFollowups.length === 0 ? (
          <div className="rounded bg-white p-6 shadow">No followups found</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {allFollowups.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl bg-white p-5 shadow transition hover:shadow-lg"
              >
                <div
                  onClick={() => router.push(`/followup/${f.id}`)}
                  className="cursor-pointer"
                >
                  <h3 className="mb-2 text-lg font-semibold">
                    {f.lead?.name || `Lead ID: ${f.leadId}`}
                  </h3>

                  <p className="mb-2 text-sm text-gray-600">
                    {f.lead?.phone || ''}
                  </p>

                  <p className="mb-2 text-sm">
                    <span className="font-medium">Date:</span>{' '}
                    {formatDate(f.followUpDate)}
                  </p>

                  <p className="mb-2 text-sm">
                    <span className="font-medium">Assigned:</span>{' '}
                    {getUserName(f.assignedTo)}
                  </p>

                  {f.note && (
                    <p className="mb-2 text-sm text-gray-700">
                      {f.note}
                    </p>
                  )}

                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs ${getStatusColor(
                      f.status
                    )}`}
                  >
                    {f.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push(`/followup/${f.id}`)}
                    className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
                  >
                    Open
                  </button>

                  <button
                    onClick={() => handleConvertToMeeting(f.id)}
                    disabled={convertingId === f.id}
                    className="rounded bg-purple-600 px-3 py-2 text-sm text-white"
                  >
                    {convertingId === f.id
                      ? 'Opening...'
                      : 'Convert to Meeting'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}