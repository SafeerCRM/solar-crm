'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/authHeaders';

type Lead = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  status?: string;
  assignedTo?: number | null;
};

type StaffUser = {
  id: number;
  name: string;
  email?: string;
  role?: 'OWNER' | 'LEAD_MANAGER' | 'TELECALLER' | 'PROJECT_MANAGER';
};

type CurrentUser = {
  id: number;
  name: string;
  email?: string;
  role?: 'OWNER' | 'LEAD_MANAGER' | 'TELECALLER' | 'PROJECT_MANAGER';
};

const backendUrl = 'https://solar-crm-backend-38n0.onrender.com';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignableStaff, setAssignableStaff] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isOwner = currentUser?.role === 'OWNER';
  const isLeadManager = currentUser?.role === 'LEAD_MANAGER';
  const isTelecaller = currentUser?.role === 'TELECALLER';
  const isProjectManager = currentUser?.role === 'PROJECT_MANAGER';

  const canAssign = isOwner || isLeadManager;
  const canImportExport =
    isOwner || isLeadManager || isProjectManager || isTelecaller;
  const canImport = isOwner || isLeadManager;
  const canCreateLead = !isProjectManager;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      window.location.href = '/';
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
    } catch {
      localStorage.clear();
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchLeads();

      if (canAssign) {
        fetchAssignableStaff();
      }
    }
  }, [currentUser]);

  const fetchLeads = async () => {
    setLoading(true);
    setMessage('');

    try {
      const params: any = {};

      if (search) params.search = search;

      if ((isOwner || isLeadManager) && assignedTo) {
        params.assignedTo = assignedTo;
      }

      const res = await axios.get(`${backendUrl}/leads`, {
        params,
        headers: getAuthHeaders(),
      });

      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLeads([]);
      setMessage('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignableStaff = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users`, {
        headers: getAuthHeaders(),
      });

      const allUsers = Array.isArray(res.data) ? res.data : [];

      const telecallers = allUsers.filter(
        (u: any) => u.role === 'TELECALLER'
      );

      setAssignableStaff(telecallers);
    } catch (error) {
      console.error('Failed to fetch assignable staff:', error);
      setAssignableStaff([]);
    }
  };

  const assignLead = async (leadId: number, userId: number) => {
    if (!userId) return;

    try {
      await axios.patch(
        `${backendUrl}/leads/${leadId}/assign`,
        { assignedTo: userId },
        { headers: getAuthHeaders() },
      );

      setMessage('Lead assigned successfully');
      await fetchLeads();
      await fetchAssignableStaff();
    } catch (error) {
      console.error('Failed to assign lead:', error);
      setMessage('Failed to assign lead');
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await axios.get(`${backendUrl}/leads/export`, {
        headers: getAuthHeaders(),
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      setMessage('Export CSV failed');
    }
  };

  const handleImportCsv = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${backendUrl}/leads/import`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('CSV imported successfully');
      fetchLeads();
    } catch (error) {
      console.error('Import failed:', error);
      setMessage('Import CSV failed');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getAssignedLabel = (assignedToValue?: number | null) => {
    if (!assignedToValue) return 'Available';

    const staff = assignableStaff.find((u) => u.id === assignedToValue);
    return staff
      ? `${staff.name}${staff.role ? ` (${staff.role})` : ''}`
      : `User ID: ${assignedToValue}`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isOwner && 'Global control over all leads and assignments'}
            {isLeadManager && 'Manage lead pool and assign staff'}
            {isTelecaller && 'Visible: available leads + your assigned leads'}
            {isProjectManager && 'Visible: qualified and project-stage pipeline'}
          </p>
        </div>

        <div className="flex gap-2">
          {canCreateLead && (
            <Link
              href="/leads/create"
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Add Lead
            </Link>
          )}

          {canImportExport && (
            <button
              onClick={handleExportCsv}
              className="bg-gray-800 text-white px-4 py-2 rounded"
            >
              Export CSV
            </button>
          )}

          {canImport && (
            <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
              Import CSV
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCsv}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {message && (
        <p className="mb-4 text-sm text-blue-700">{message}</p>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, phone, email, city"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full md:w-1/3"
        />

        {canAssign && (
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">All Assigned Users</option>
            {assignableStaff.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.role ? `(${u.role})` : ''}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={fetchLeads}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Apply Filters
        </button>
      </div>

      {loading ? (
        <p>Loading leads...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">City</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Assigned To</th>
              {canAssign && <th className="border p-2">Assign</th>}
            </tr>
          </thead>

          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={canAssign ? 8 : 7}
                  className="text-center p-4"
                >
                  No leads found
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="border p-2">{lead.id}</td>
                  <td className="border p-2">{lead.name}</td>
                  <td className="border p-2">{lead.phone}</td>
                  <td className="border p-2">{lead.email || ''}</td>
                  <td className="border p-2">{lead.city || ''}</td>
                  <td className="border p-2">{lead.status || ''}</td>
                  <td className="border p-2">
                    {getAssignedLabel(lead.assignedTo)}
                  </td>

                  {canAssign && (
                    <td className="border p-2">
                      <select
                        value={lead.assignedTo ?? ''}
                        onChange={(e) =>
                          assignLead(lead.id, Number(e.target.value))
                        }
                        className="border p-1"
                      >
                        <option value="">Assign</option>
                        {assignableStaff.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} {u.role ? `(${u.role})` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}