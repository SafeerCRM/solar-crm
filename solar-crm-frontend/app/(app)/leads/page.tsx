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
  zone?: string;
  status?: string;
  assignedTo?: number | null;
  createdBy?: number;
  createdByName?: string;
};

type StaffUser = {
  id: number;
  name: string;
  email?: string;
  roles?: string[];
};

type CurrentUser = {
  id: number;
  name: string;
  email?: string;
  roles?: string[];
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignableStaff, setAssignableStaff] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const userRoles = currentUser?.roles || [];

  const isOwner = userRoles.includes('OWNER');
  const isLeadManager = userRoles.includes('LEAD_MANAGER');
  const isTelecaller = userRoles.includes('TELECALLER');
  const isProjectManager = userRoles.includes('PROJECT_MANAGER');

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
      if (phone) params.phone = phone;
      if (city) params.city = city;
      if (zone) params.zone = zone;

      if ((isOwner || isLeadManager) && assignedTo) {
        params.assignedTo = assignedTo;
      }

      const res = await axios.get(`${backendUrl}/leads`, {
        params,
        headers: getAuthHeaders(),
      });

      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
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

      const telecallers = allUsers.filter((u: any) =>
        u.roles?.includes('TELECALLER')
      );

      setAssignableStaff(telecallers);
    } catch (error) {
      console.error(error);
      setAssignableStaff([]);
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

      setMessage('Lead assigned successfully');
      await fetchLeads();
    } catch (error) {
      console.error(error);
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
      a.click();
    } catch (error) {
      console.error(error);
      setMessage('Export failed');
    }
  };

  const handleImportCsv = async (e: any) => {
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

      setMessage('Import successful');
      fetchLeads();
    } catch (error) {
      console.error(error);
      setMessage('Import failed');
    }
  };

  const getAssignedLabel = (id?: number | null) => {
    if (!id) return 'Available';
    const user = assignableStaff.find((u) => u.id === id);
    return user ? `${user.name}` : `User ID: ${id}`;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Leads</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {canCreateLead && (
          <Link href="/leads/create" className="bg-green-600 text-white px-4 py-2 rounded">
            Add Lead
          </Link>
        )}

        {canImportExport && (
          <button onClick={handleExportCsv} className="bg-gray-800 text-white px-4 py-2 rounded">
            Export CSV
          </button>
        )}

        {canImport && (
          <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
            Import CSV
            <input type="file" onChange={handleImportCsv} className="hidden" />
          </label>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="border p-2 rounded" />
        <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="border p-2 rounded" />
        <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="border p-2 rounded" />
        <input placeholder="Zone" value={zone} onChange={(e) => setZone(e.target.value)} className="border p-2 rounded" />

        <button onClick={fetchLeads} className="bg-blue-600 text-white px-4 py-2 rounded">
          Apply
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>City</th>
              <th>Zone</th>
              <th>Created By</th>
              <th>Assigned</th>
              {canAssign && <th>Assign</th>}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.id}</td>
                <td>{lead.name}</td>
                <td>{lead.phone}</td>
                <td>{lead.city}</td>
                <td>{lead.zone}</td>
                <td>{lead.createdByName}</td>
                <td>{getAssignedLabel(lead.assignedTo)}</td>

                {canAssign && (
                  <td>
                    <select
                      onChange={(e) => assignLead(lead.id, Number(e.target.value))}
                    >
                      <option value="">Assign</option>
                      {assignableStaff.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}