'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerMonthlyRequirementsPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [materialId, setMaterialId] = useState('');
  const [expectedQuantity, setExpectedQuantity] = useState('');
  const [requirementMonth, setRequirementMonth] = useState('');
  const [remarks, setRemarks] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const now = new Date();
    setRequirementMonth(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    );

    loadStock();
    loadRequirements();
  }, []);

  useEffect(() => {
    loadRequirements();
  }, [filterMonth]);

  const getToken = () => {
    const token = localStorage.getItem('dealer_token');

    if (!token) {
      window.location.href = '/dealer-login';
      return '';
    }

    return token;
  };

  const loadStock = async () => {
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/stock`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setStock(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadRequirements = async () => {
    const token = getToken();

    try {
      const params = new URLSearchParams();
      if (filterMonth) params.set('requirementMonth', filterMonth);

      const res = await fetch(
        `${API_BASE_URL}/dealer-auth/monthly-requirements?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      setRequirements(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const uniqueMaterials = useMemo(() => {
    const map = new Map();

    stock.forEach((item) => {
      if (!map.has(item.materialId)) {
        map.set(item.materialId, item);
      }
    });

    return Array.from(map.values());
  }, [stock]);

  const selectedMaterial = uniqueMaterials.find(
    (item) => String(item.materialId) === materialId,
  );

  const submitRequirement = async (e: FormEvent) => {
    e.preventDefault();

    const token = getToken();

    if (!materialId) {
      setMessage('Please select material.');
      return;
    }

    if (Number(expectedQuantity || 0) <= 0) {
      setMessage('Please enter expected quantity.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/monthly-requirements`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId: Number(materialId),
          expectedQuantity: Number(expectedQuantity || 0),
          requirementMonth,
          remarks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Requirement submit failed');
        return;
      }

      setMessage('Monthly requirement submitted successfully.');
      setMaterialId('');
      setExpectedQuantity('');
      setRemarks('');
      loadRequirements();
    } catch (error) {
      console.error(error);
      setMessage('Requirement submit error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a href="/dealer-portal" className="text-sm font-black text-orange-300">
            ← Back to Dashboard
          </a>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">
                Monthly Material Requirement
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Share expected monthly quantity so Aditya Solars can plan stock.
              </p>
            </div>

            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900"
            />
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={submitRequirement}
            className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl"
          >
            <h2 className="text-xl font-black">Add Requirement</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Requirement Month
                </label>

                <input
                  type="month"
                  value={requirementMonth}
                  onChange={(e) => setRequirementMonth(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Material
                </label>

                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none focus:border-blue-500"
                >
                  <option value="">Select material</option>
                  {uniqueMaterials.map((item) => (
                    <option key={item.materialId} value={item.materialId}>
                      {item.materialName} {item.brand ? `- ${item.brand}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMaterial && (
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-bold text-blue-500">Selected Material</p>
                  <p className="mt-1 font-black text-blue-900">
                    {selectedMaterial.materialName}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-blue-700">
                    Available: {selectedMaterial.availableQuantity} {selectedMaterial.unit || ''}
                  </p>
                </div>
              )}

              <Input
                label="Expected Quantity"
                type="number"
                value={expectedQuantity}
                onChange={setExpectedQuantity}
                placeholder="Enter quantity"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Remarks
                </label>

                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  placeholder="Any planning note"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {message && (
              <p className="mt-5 rounded-2xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-700 to-sky-500 py-4 font-black text-white shadow-xl transition hover:scale-[1.01] disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Requirement'}
            </button>
          </form>

          <section className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl lg:col-span-2">
            <h2 className="text-xl font-black">Requirement History</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {!requirements.length && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500 md:col-span-2">
                  No monthly requirement found.
                </div>
              )}

              {requirements.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
                >
                  <p className="text-lg font-black">{item.materialName}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.category || '-'} · {item.brand || '-'}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Info label="Month" value={item.requirementMonth || '-'} />
                    <Info
                      label="Expected Qty"
                      value={`${item.expectedQuantity || 0} ${item.unit || ''}`}
                    />
                  </div>

                  {item.remarks && (
                    <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-semibold text-slate-600">
                      {item.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}