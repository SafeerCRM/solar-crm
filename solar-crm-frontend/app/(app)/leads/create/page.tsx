'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function CreateLeadPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [status, setStatus] = useState('');
  const [electricityBill, setElectricityBill] = useState('');
  const [potential, setPotential] = useState('MEDIUM');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateLead = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
  name,
  phone,
  email,
  city,
  zone,
  status: status || 'NEW',
  electricityBill: electricityBill ? Number(electricityBill) : undefined,
  potential,
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
          
          {/* NAME */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Lead Name
            </label>
            <input
              type="text"
              placeholder="Enter lead name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
              required
            />
          </div>

          {/* PHONE */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="text"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
              required
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* CITY → MANUAL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              placeholder="Enter city manually"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* ZONE → MANUAL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Zone
            </label>
            <input
              type="text"
              placeholder="Enter zone manually"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {/* STATUS */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
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

                    {/* ELECTRICITY BILL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Electricity Bill (INR)
            </label>
            <input
              type="number"
              placeholder="Enter electricity bill amount"
              value={electricityBill}
              onChange={(e) => setElectricityBill(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

                    {/* POTENTIAL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Lead Potential
            </label>

            <div className="flex gap-2">
              {['LOW', 'MEDIUM', 'HIGH'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPotential(value)}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium ${
                    potential === value
                      ? value === 'HIGH'
                        ? 'bg-green-600 text-white'
                        : value === 'MEDIUM'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <p className="text-sm text-center text-red-600">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-6 py-3 text-white"
          >
            {loading ? 'Creating...' : 'Create Lead'}
          </button>
        </form>
      </div>
    </div>
  );
}