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

  const downloadArchivedCsv = async () => {
  try {
    setMessage('');

    const res = await axios.get<Lead[]>(
      `${backendUrl}/leads/archived`,
      {
        headers: getAuthHeaders(),
      },
    );

    const archivedLeads = Array.isArray(res.data)
      ? res.data
      : [];

    if (archivedLeads.length === 0) {
      setMessage('No archived leads available to export');
      return;
    }

    const headers = [
      'Lead ID',
      'Name',
      'Phone Number',
      'City',
      'Status',
    ];

    const escapeCsv = (value: unknown) => {
      const text = String(value ?? '');

      // Prevent spreadsheet formula execution.
      const safeText = /^[\s]*[=+\-@]/.test(text)
        ? `'${text}`
        : text;

      return `"${safeText.replace(/"/g, '""')}"`;
    };

    const rows = archivedLeads.map((lead) =>
      [
        lead.id,
        lead.name,
        lead.phone,
        lead.city || '',
        lead.status || '',
      ]
        .map(escapeCsv)
        .join(','),
    );

    const csv = `\uFEFF${[
      headers.join(','),
      ...rows,
    ].join('\r\n')}`;

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `archived-leads-${
      new Date().toISOString().slice(0, 10)
    }.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    setMessage(
      `${archivedLeads.length} archived leads exported successfully`,
    );
  } catch (err) {
    console.error(err);
    setMessage('Failed to download archived leads CSV');
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
  <h1 className="text-xl font-semibold">
    Archived Leads
  </h1>

  <button
    type="button"
    onClick={downloadArchivedCsv}
    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Download CSV
  </button>
</div>

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