'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

type Lead = {
  id: number;
  name: string;
  phone: string;
};

type FollowUp = {
  id: number;
  leadId: number;
  assignedTo?: number;
  followUpType?: string;
  note?: string;
  remarks?: string;
  followUpDate: string;
  status: string;
  createdAt: string;
  lead?: {
    id: number;
    name: string;
    phone: string;
  };
};

type User = {
  id: number;
  name: string;
  email: string;
  role: 'OWNER' | 'LEAD_MANAGER' | 'TELECALLER' | 'PROJECT_MANAGER';
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function FollowupPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allFollowups, setAllFollowups] = useState<FollowUp[]>([]);
  const [todayFollowups, setTodayFollowups] = useState<FollowUp[]>([]);
  const [overdueFollowups, setOverdueFollowups] = useState<FollowUp[]>([]);

  const [leadId, setLeadId] = useState('');
  const [followUpType, setFollowUpType] = useState('CALL');
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState('PENDING');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const canCreateFollowup =
    user?.role === 'OWNER' ||
    user?.role === 'LEAD_MANAGER' ||
    user?.role === 'TELECALLER';

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
      fetchFollowups();
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users`, {
        headers: getAuthHeaders(),
      });

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    }
  };

  const fetchLeads = async () => {
    try {
      const params: any = {};

      if (user?.role === 'TELECALLER') {
        params.assignedTo = user.id;
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

  const fetchFollowups = async () => {
    try {
      const [allRes, todayRes, overdueRes] = await Promise.all([
        axios.get(`${backendUrl}/followup`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${backendUrl}/followup/today`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${backendUrl}/followup/overdue`, {
          headers: getAuthHeaders(),
        }),
      ]);

      setAllFollowups(Array.isArray(allRes.data) ? allRes.data : []);
      setTodayFollowups(Array.isArray(todayRes.data) ? todayRes.data : []);
      setOverdueFollowups(Array.isArray(overdueRes.data) ? overdueRes.data : []);
    } catch (error) {
      console.error('Failed to fetch followups:', error);
      setAllFollowups([]);
      setTodayFollowups([]);
      setOverdueFollowups([]);
    }
  };

  const handleCreateFollowup = async (e: React.FormEvent) => {
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

    if (!followUpDate) {
      setMessage('Please select follow-up date');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        leadId: Number(leadId),
        assignedTo: user.id,
        followUpType,
        note,
        followUpDate: new Date(followUpDate).toISOString(),
        status,
      };

      await axios.post(`${backendUrl}/followup/create`, payload, {
        headers: getAuthHeaders(),
      });

      setMessage('Followup created successfully');
      setLeadId('');
      setFollowUpType('CALL');
      setNote('');
      setFollowUpDate('');
      setStatus('PENDING');

      await fetchFollowups();
    } catch (error: any) {
      console.error('Failed to create followup:', error);
      setMessage(
        error?.response?.data?.message || 'Failed to create followup'
      );
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (id?: number) => {
    if (!id) return 'Available';

    const found = users.find((u) => u.id === id);

    return found
      ? `${found.name}${found.role ? ` (${found.role})` : ''}`
      : `User ID: ${id}`;
  };

  const getLeadLabel = (item: FollowUp) => {
    if (item.lead?.name) {
      return `${item.lead.name}${item.lead.phone ? ` (${item.lead.phone})` : ''}`;
    }

    return `Lead ID: ${item.leadId}`;
  };

  return (
    <div className="p-6 space-y-6">
      {canCreateFollowup && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Followup</h1>

          <form onSubmit={handleCreateFollowup} className="space-y-4">
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

            <select
              value={followUpType}
              onChange={(e) => setFollowUpType(e.target.value)}
              className="w-full rounded-xl border border-gray-400 px-4 py-3"
            >
              <option value="CALL">CALL</option>
              <option value="CALLBACK">CALLBACK</option>
              <option value="GENERAL">GENERAL</option>
            </select>

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Followup note"
              className="w-full rounded-xl border border-gray-400 px-4 py-3"
            />

            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full rounded-xl border border-gray-400 px-4 py-3"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-gray-400 px-4 py-3"
            >
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="MISSED">MISSED</option>
            </select>

            {message && <p className="text-sm">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold"
            >
              {loading ? 'Creating...' : 'Create Followup'}
            </button>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Today Followups</h2>

          {todayFollowups.length === 0 ? (
            <p>No followups for today</p>
          ) : (
            <div className="space-y-3">
              {todayFollowups.map((item) => (
                <div key={item.id} className="border rounded-xl p-3">
                  <p className="font-semibold">Lead: {getLeadLabel(item)}</p>
                  <p>Status: {item.status}</p>
                  <p>Type: {item.followUpType || '-'}</p>
                  <p>Note: {item.note || item.remarks || '-'}</p>
                  <p>Assigned To: {getUserName(item.assignedTo)}</p>
                  <p>
                    Date: {new Date(item.followUpDate).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Overdue Followups</h2>

          {overdueFollowups.length === 0 ? (
            <p>No overdue followups</p>
          ) : (
            <div className="space-y-3">
              {overdueFollowups.map((item) => (
                <div key={item.id} className="border rounded-xl p-3">
                  <p className="font-semibold">Lead: {getLeadLabel(item)}</p>
                  <p>Status: {item.status}</p>
                  <p>Type: {item.followUpType || '-'}</p>
                  <p>Note: {item.note || item.remarks || '-'}</p>
                  <p>Assigned To: {getUserName(item.assignedTo)}</p>
                  <p>
                    Date: {new Date(item.followUpDate).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">All Followups</h2>

        {allFollowups.length === 0 ? (
          <p>No followups found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Lead</th>
                  <th className="border p-2 text-left">Type</th>
                  <th className="border p-2 text-left">Note</th>
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">Assigned To</th>
                  <th className="border p-2 text-left">Followup Date</th>
                </tr>
              </thead>
              <tbody>
                {allFollowups.map((item) => (
                  <tr key={item.id}>
                    <td className="border p-2">{getLeadLabel(item)}</td>
                    <td className="border p-2">{item.followUpType || '-'}</td>
                    <td className="border p-2">
                      {item.note || item.remarks || '-'}
                    </td>
                    <td className="border p-2">{item.status}</td>
                    <td className="border p-2">
                      {getUserName(item.assignedTo)}
                    </td>
                    <td className="border p-2">
                      {new Date(item.followUpDate).toLocaleString()}
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