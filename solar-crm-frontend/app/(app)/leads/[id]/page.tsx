'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchLead = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch('${process.env.NEXT_PUBLIC_API_BASE_URL}/leads', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      const foundLead = data.find((item: any) => String(item.id) === String(id));
      setLead(foundLead);
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, []);

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leads/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          status: lead.status,
        }),
      });

      if (!res.ok) {
        setMessage('Update failed');
        return;
      }

      setMessage('Updated successfully');
    } catch (error) {
      setMessage('Error updating lead');
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!lead) {
    return <p>Lead not found</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-6 shadow">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lead Details</h1>
          <p className="mt-1 text-gray-500">View and update lead information</p>
        </div>

        <button
          onClick={() => router.push('/leads')}
          className="rounded-xl bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
        >
          Back
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            value={lead.name || ''}
            onChange={(e) => setLead({ ...lead, name: e.target.value })}
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            value={lead.phone || ''}
            onChange={(e) => setLead({ ...lead, phone: e.target.value })}
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={lead.status || 'NEW'}
            onChange={(e) => setLead({ ...lead, status: e.target.value })}
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          >
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="SITE_VISIT">SITE_VISIT</option>
            <option value="QUOTATION">QUOTATION</option>
            <option value="NEGOTIATION">NEGOTIATION</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>
          </select>
        </div>

        {message && <p className="text-green-600">{message}</p>}

        <button
          onClick={handleUpdate}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Update Lead
        </button>
      </div>
    </div>
  );
}