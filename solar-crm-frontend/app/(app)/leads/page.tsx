'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/authHeaders';

type Lead = {
  id: number;
  name: string;
  phone: string;
  city?: string;
  zone?: string;
  createdByName?: string;
  assignedTo?: number | null;
};

type User = {
  id: number;
  name: string;
  roles: string[];
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${backendUrl}/leads`, {
        headers: getAuthHeaders(),
      });
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users/assignable-staff`, {
        headers: getAuthHeaders(),
      });

      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const assignLead = async (leadId: number, userId: number) => {
    try {
      await axios.patch(
        `${backendUrl}/leads/${leadId}/assign`,
        { assignedTo: userId },
        { headers: getAuthHeaders() }
      );

      setMessage('Assigned successfully');
      fetchLeads();
    } catch (err) {
      console.error(err);
      setMessage('Assignment failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Leads</h1>

      {message && <p className="mb-3 text-blue-600">{message}</p>}

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">City</th>
            <th className="border p-2">Created By</th>
            <th className="border p-2">Assigned</th>
            <th className="border p-2">Call</th>
            <th className="border p-2">Meeting</th>
            <th className="border p-2">Assign</th>
          </tr>
        </thead>

        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td className="border p-2">{lead.name}</td>
              <td className="border p-2">{lead.phone}</td>
              <td className="border p-2">{lead.city || ''}</td>
              <td className="border p-2">{lead.createdByName || ''}</td>
              <td className="border p-2">
                {lead.assignedTo || 'Unassigned'}
              </td>

              {/* CALL BUTTON */}
              <td className="border p-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="rounded bg-green-600 px-3 py-1 text-white"
                >
                  📞 Call
                </a>
              </td>

              {/* 🔥 NEW: SCHEDULE MEETING */}
              <td className="border p-2">
                <Link
                  href={`/meeting/create?leadId=${lead.id}&name=${lead.name}&phone=${lead.phone}&city=${lead.city || ''}`}
                  className="rounded bg-purple-600 px-3 py-1 text-white"
                >
                  Schedule
                </Link>
              </td>

              {/* ASSIGN */}
              <td className="border p-2">
                <select
                  onChange={(e) =>
                    assignLead(lead.id, Number(e.target.value))
                  }
                  className="border p-1"
                  defaultValue=""
                >
                  <option value="">Assign</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}