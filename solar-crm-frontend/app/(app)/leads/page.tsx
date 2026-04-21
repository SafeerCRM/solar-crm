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
  potentialPercentage?: number | null;
  status?: string;
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
    const [pendingLeadEdits, setPendingLeadEdits] = useState<
    Record<number, { potentialPercentage: number; status: string }>
  >({});
  const [savingLeadId, setSavingLeadId] = useState<number | null>(null);

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [potentialFilter, setPotentialFilter] = useState('');

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

    if (potentialFilter) {
      filtered = filtered.filter(
        (lead) => Number(lead.potentialPercentage || 15) === Number(potentialFilter)
      );
    }

    setFilteredLeads(filtered);
  }, [searchName, searchPhone, searchCity, potentialFilter, leads]);

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

  const updatePotential = async (leadId: number, potentialPercentage: number) => {
    try {
      await axios.patch(
        `${backendUrl}/leads/${leadId}`,
        { potentialPercentage },
        { headers: getAuthHeaders() }
      );

      setMessage('Lead potential updated successfully');
      fetchLeads();
    } catch (err) {
      console.error(err);
      setMessage('Potential update failed');
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
    setPotentialFilter('');
  };

    const LEAD_STAGES = [
    'NEW',
    'CONTACTED',
    'INTERESTED',
    'SITE_VISIT',
    'QUOTATION',
    'NEGOTIATION',
    'WON',
    'LOST',
  ];

  const getLeadStatusLabel = (value?: number | null) => {
    const potential = Number(value || 15);

    if (potential === 75) return 'HIGH';
    if (potential === 50) return 'MEDIUM';
    return 'LOW';
  };

  const setPendingPotential = (lead: Lead, potentialPercentage: number) => {
    setPendingLeadEdits((prev) => ({
      ...prev,
      [lead.id]: {
        potentialPercentage,
        status: prev[lead.id]?.status || lead.status || 'NEW',
      },
    }));
  };

  const setPendingStage = (lead: Lead, status: string) => {
    setPendingLeadEdits((prev) => ({
      ...prev,
      [lead.id]: {
        potentialPercentage:
          prev[lead.id]?.potentialPercentage ??
          Number(lead.potentialPercentage || 15),
        status,
      },
    }));
  };

  const saveLeadChanges = async (lead: Lead) => {
    const pending = pendingLeadEdits[lead.id];
    if (!pending) return;

    try {
      setSavingLeadId(lead.id);

      await axios.patch(
        `${backendUrl}/leads/${lead.id}`,
        {
          potentialPercentage: pending.potentialPercentage,
          status: pending.status,
        },
        { headers: getAuthHeaders() }
      );

      setMessage('Lead updated successfully');
      setPendingLeadEdits((prev) => {
        const next = { ...prev };
        delete next[lead.id];
        return next;
      });

      await fetchLeads();
    } catch (err) {
      console.error(err);
      setMessage('Lead update failed');
    } finally {
      setSavingLeadId(null);
    }
  };

  const cancelLeadChanges = (leadId: number) => {
    setPendingLeadEdits((prev) => {
      const next = { ...prev };
      delete next[leadId];
      return next;
    });
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

      <div className="mb-4 grid gap-3 md:grid-cols-4">
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

        <select
          value={potentialFilter}
          onChange={(e) => setPotentialFilter(e.target.value)}
          className="rounded border p-2"
        >
          <option value="">Filter by potential</option>
          <option value="15">Not Likely (15%)</option>
          <option value="50">Likely (50%)</option>
          <option value="75">High Potential (75%)</option>
        </select>
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
          {filteredLeads.map((lead) => {
            const potentialMeta = getPotentialMeta(lead.potentialPercentage);

            return (
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

                <div className="mb-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${potentialMeta.className}`}
                  >
                    {potentialMeta.label}
                  </span>
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
                    <span className="font-medium">Lead Owner:</span>{' '}
                    {lead.createdByName || '-'}
                  </p>
                  <p>
                    <span className="font-medium">Assigned:</span>{' '}
                    {getAssignedName(lead.assignedTo)}
                  </p>
                                    <p>
                    <span className="font-medium">Current Stage:</span>{' '}
                    {(pendingLeadEdits[lead.id]?.status || lead.status || 'NEW').replace('_', ' ')}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/meeting/create?leadId=${lead.id}&name=${lead.name}&phone=${lead.phone}&city=${lead.city || ''}`}
                    className="rounded bg-purple-600 px-3 py-2 text-sm text-white"
                  >
                    Schedule Meeting
                  </Link>

                  <Link
                    href={`/leads/${lead.id}`}
                    className="rounded bg-gray-700 px-3 py-2 text-sm text-white"
                  >
                    View History
                  </Link>
                </div>

                                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Lead Status
                    </label>

                    <div className="flex gap-2">
                      {[15, 50, 75].map((value) => {
                        const pending = pendingLeadEdits[lead.id];
                        const currentValue =
                          pending?.potentialPercentage ??
                          Number(lead.potentialPercentage || 15);

                        const isActive = currentValue === value;

                        const label =
                          value === 75
                            ? 'HIGH'
                            : value === 50
                            ? 'MEDIUM'
                            : 'LOW';

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setPendingPotential(lead, value)}
                            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                              isActive
                                ? value === 75
                                  ? 'bg-green-600 text-white'
                                  : value === 50
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Lead Stage
                    </label>

                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {LEAD_STAGES.map((stage) => {
                        const pending = pendingLeadEdits[lead.id];
                        const currentStage = pending?.status || lead.status || 'NEW';
                        const isActive = currentStage === stage;

                        return (
                          <button
                            key={stage}
                            type="button"
                            onClick={() => setPendingStage(lead, stage)}
                            className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {stage.replace('_', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {pendingLeadEdits[lead.id] && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <p className="mb-2 text-sm font-medium text-blue-800">
                        Pending changes ready to save
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => saveLeadChanges(lead)}
                          disabled={savingLeadId === lead.id}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                        >
                          {savingLeadId === lead.id ? 'Saving...' : 'Save Changes'}
                        </button>

                        <button
                          type="button"
                          onClick={() => cancelLeadChanges(lead.id)}
                          disabled={savingLeadId === lead.id}
                          className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}