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

type CurrentUser = {
  id: number;
  name: string;
  email?: string;
  roles?: string[];
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LeadsPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchCity, setSearchCity] = useState('');

  const currentRoles = currentUser?.roles || [];
  const canAssignLeads =
    currentRoles.includes('OWNER') ||
    currentRoles.includes('LEAD_MANAGER') ||
    currentRoles.includes('TELECALLING_MANAGER');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (currentUser && canAssignLeads) {
      fetchUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    let filtered = leads;

    if (searchName.trim()) {
      filtered = filtered.filter((lead) =>
        (lead.name || '').toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchPhone.trim()) {
      filtered = filtered.filter((lead) =>
        (lead.phone || '').includes(searchPhone)
      );
    }

    if (searchCity.trim()) {
      filtered = filtered.filter((lead) => {
        const city = (lead.city || '').toLowerCase();
        const zone = (lead.zone || '').toLowerCase();
        const query = searchCity.toLowerCase();

        return city.includes(query) || zone.includes(query);
      });
    }

    setFilteredLeads(filtered);
  }, [searchName, searchPhone, searchCity, leads]);

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${backendUrl}/leads`, {
        headers: getAuthHeaders(),
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setLeads(data);
      setFilteredLeads(data);
    } catch (err) {
      console.error(err);
      setLeads([]);
      setFilteredLeads([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users/assignable-staff`, {
        headers: getAuthHeaders(),
      });

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  const assignLead = async (leadId: number, userId: number) => {
    if (!userId) return;

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

  const getAssignedName = (assignedTo?: number | null) => {
    if (!assignedTo) return 'Unassigned';
    const user = users.find((u) => u.id === assignedTo);
    return user ? user.name : `User ID: ${assignedTo}`;
  };

  const clearFilters = () => {
    setSearchName('');
    setSearchPhone('');
    setSearchCity('');
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Leads</h1>

        <Link
          href="/leads/create"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          + Add Lead
        </Link>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <input
          type="text"
          placeholder="Search by name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="rounded border p-2"
        />

        <input
          type="text"
          placeholder="Search by phone"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="rounded border p-2"
        />

        <input
          type="text"
          placeholder="Search by city / zone"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          className="rounded border p-2"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded bg-gray-100 p-3 text-sm text-gray-700">
        <div>
          <strong>Total Leads:</strong> {leads.length} |{' '}
          <strong>Filtered:</strong> {filteredLeads.length}
        </div>

        <button
          onClick={clearFilters}
          className="rounded bg-gray-500 px-3 py-1 text-white"
        >
          Clear Filters
        </button>
      </div>

      {message && <p className="mb-4 text-blue-600">{message}</p>}

      {filteredLeads.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-600">No leads found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-2xl bg-white p-5 shadow transition hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {lead.name}
                  </h2>
                  <p className="text-sm text-gray-500">Lead ID: {lead.id}</p>
                </div>

                <a
                  href={`tel:${lead.phone}`}
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white"
                >
                  📞 Call
                </a>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Phone:</span> {lead.phone}
                </p>
                <p>
                  <span className="font-medium">City:</span> {lead.city || '-'}
                </p>
                <p>
                  <span className="font-medium">Zone:</span> {lead.zone || '-'}
                </p>
                <p>
                  <span className="font-medium">Created By:</span>{' '}
                  {lead.createdByName || '-'}
                </p>
                <p>
                  <span className="font-medium">Assigned:</span>{' '}
                  {getAssignedName(lead.assignedTo)}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/meeting/create?leadId=${lead.id}&name=${lead.name}&phone=${lead.phone}&city=${lead.city || ''}`}
                  className="rounded bg-purple-600 px-3 py-2 text-sm text-white"
                >
                  Schedule Meeting
                </Link>
              </div>

              {canAssignLeads && (
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Assign Lead
                  </label>
                  <select
                    onChange={(e) => assignLead(lead.id, Number(e.target.value))}
                    className="w-full rounded border p-2 text-sm"
                    defaultValue=""
                  >
                    <option value="">Select user</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}