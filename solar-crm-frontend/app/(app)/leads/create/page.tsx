'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function CreateLeadPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateLead = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');

      const res = await fetch('${process.env.NEXT_PUBLIC_API_BASE_URL}/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          status: status || 'NEW',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Failed to create lead');
        setLoading(false);
        return;
      }

      setMessage('Lead created successfully');

      setTimeout(() => {
        window.location.href = '/leads';
      }, 1000);
    } catch (error) {
      setMessage('Something went wrong while creating lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-6 shadow">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create Lead</h1>
          <p className="mt-1 text-gray-500">Add a new lead to the system</p>
        </div>

        <Link
          href="/leads"
          className="rounded-xl bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
        >
          Back to Leads
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <form className="space-y-5" onSubmit={handleCreateLead}>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Lead Name
            </label>
            <input
              type="text"
              placeholder="Enter lead name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="text"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-blue-500"
            >
              <option value="">Select status</option>
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

          {message && (
            <p
              className={`text-sm text-center ${
                message.toLowerCase().includes('success')
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? 'Creating...' : 'Create Lead'}
          </button>
        </form>
      </div>
    </div>
  );
}