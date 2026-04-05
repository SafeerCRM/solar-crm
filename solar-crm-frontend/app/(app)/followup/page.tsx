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
  roles: string[];
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

  const userRoles = user?.roles || [];

  const canCreateFollowup =
    userRoles.includes('OWNER') ||
    userRoles.includes('LEAD_MANAGER') ||
    userRoles.includes('TELECALLER');

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
      console.error(error);
      setAllFollowups([]);
      setTodayFollowups([]);
      setOverdueFollowups([]);
    }
  };

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!user) {
      setMessage('User not found');
      return;
    }

    if (!leadId || !followUpDate) {
      setMessage('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${backendUrl}/followup/create`,
        {
          leadId: Number(leadId),
          assignedTo: user.id,
          followUpType,
          note,
          followUpDate: new Date(followUpDate).toISOString(),
          status,
        },
        { headers: getAuthHeaders() }
      );

      setMessage('Followup created');
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

  const getUserName = (id?: number) => {
    const found = users.find((u) => u.id === id);
    return found ? `${found.name} (${(found.roles || []).join(', ')})` : 'N/A';
  };

  const getLeadLabel = (item: FollowUp) => {
    return item.lead?.name
      ? `${item.lead.name} (${item.lead.phone})`
      : `Lead ID: ${item.leadId}`;
  };

  return (
    <div className="p-6 space-y-6">
      {canCreateFollowup && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl mb-4">Create Followup</h2>

          <form onSubmit={handleCreateFollowup} className="space-y-3">
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="border p-2 w-full"
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
              className="border p-2 w-full"
            />

            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="border p-2 w-full"
            />

            <button className="bg-blue-600 text-white px-4 py-2">
              Create
            </button>
          </form>
        </div>
      )}

      <div>
        <h2 className="text-xl mb-2">All Followups</h2>
        {allFollowups.map((f) => (
          <div key={f.id} className="border p-3 mb-2">
            <p>{getLeadLabel(f)}</p>
            <p>{f.status}</p>
            <p>{getUserName(f.assignedTo)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}