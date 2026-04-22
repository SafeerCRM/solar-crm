'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

type Lead = {
  id: number;
  name: string;
  phone: string;
  city?: string;
  status?: string;
};

export default function ArchivedLeadsPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [message, setMessage] = useState('');

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${backendUrl}/leads/archived`, {
        headers: getAuthHeaders(),
      });
      setLeads(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to fetch archived leads');
    }
  };

  const restoreLead = async (id: number) => {
    try {
      await axios.patch(
        `${backendUrl}/leads/${id}/restore`,
        {},
        { headers: getAuthHeaders() }
      );
      setMessage('Lead restored');
      fetchLeads();
    } catch (err) {
      console.error(err);
      setMessage('Failed to restore lead');
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Archived Leads</h1>

      {message && <p className="mb-4 text-blue-600">{message}</p>}

      {leads.length === 0 ? (
        <p>No archived leads</p>
      ) : (
        <div className="grid gap-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border bg-white p-4 shadow"
            >
              <p className="font-semibold">{lead.name}</p>
              <p className="text-sm text-gray-600">{lead.phone}</p>
              <p className="text-sm text-gray-500">{lead.city}</p>

              <button
                onClick={() => restoreLead(lead.id)}
                className="mt-3 rounded bg-green-600 px-3 py-2 text-sm text-white"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}