'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

export default function OngridSettingsPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('capacity-asc');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    phaseType: '1 Phase',
    brandName: '',
    capacity: '',
    rate: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>({});

  // ✅ fetch both phases
  const fetchOptions = async () => {
    try {
      setLoading(true);

      const phases = ['1 Phase', '3 Phase'];

      const responses = await Promise.all(
        phases.map((phase) =>
          axios.get(`${backendUrl}/calculator/ongrid-options`, {
            params: { phase },
            headers: getAuthHeaders(),
          })
        )
      );

      const merged = responses.flatMap((res) => res.data || []);

      const unique = Array.from(
        new Map(merged.map((item) => [item.id, item])).values()
      );

      setOptions(unique);
    } catch (err) {
      console.error(err);
      alert('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const filtered = useMemo(() => {
    let list = [...options];

    if (phaseFilter !== 'ALL') {
      list = list.filter((i) => i.phaseType === phaseFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        `${i.brandName} ${i.capacity} ${i.rate} ${i.phaseType}`
          .toLowerCase()
          .includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'capacity-asc') return a.capacity - b.capacity;
      if (sortBy === 'capacity-desc') return b.capacity - a.capacity;
      if (sortBy === 'rate-asc') return a.rate - b.rate;
      if (sortBy === 'rate-desc') return b.rate - a.rate;
      return 0;
    });

    return list;
  }, [options, search, phaseFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [search, phaseFilter, sortBy, rowsPerPage]);

  const createOption = async () => {
    if (!form.brandName || !form.capacity || !form.rate) {
      alert('Fill all fields');
      return;
    }

    try {
      await axios.post(
        `${backendUrl}/calculator/ongrid-options`,
        {
          phaseType: form.phaseType,
          brandName: form.brandName,
          capacity: Number(form.capacity),
          rate: Number(form.rate),
        },
        { headers: getAuthHeaders() }
      );

      setForm({
        phaseType: '1 Phase',
        brandName: '',
        capacity: '',
        rate: '',
      });

      fetchOptions();
    } catch (err) {
      console.error(err);
      alert('Create failed');
    }
  };

  const deleteOption = async (id: number) => {
    if (!confirm('Delete?')) return;

    try {
      await axios.delete(
        `${backendUrl}/calculator/ongrid-options/${id}`,
        { headers: getAuthHeaders() }
      );

      fetchOptions();
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const updateOption = async () => {
    try {
      await axios.patch(
        `${backendUrl}/calculator/ongrid-options/${editingId}`,
        {
          phaseType: editingData.phaseType,
          brandName: editingData.brandName,
          capacity: Number(editingData.capacity),
          rate: Number(editingData.rate),
        },
        { headers: getAuthHeaders() }
      );

      setEditingId(null);
      setEditingData({});
      fetchOptions();
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Ongrid Options</h1>
          <p className="text-sm text-gray-500">
            Manage phase, inverter brand, capacity and rate.
          </p>
        </div>

        <Link
          href="/calculator/settings"
          className="text-sm bg-gray-100 px-4 py-2 rounded-lg"
        >
          Back to Settings
        </Link>
      </div>

      {/* ADD */}
      <div className="bg-white p-5 rounded-2xl shadow space-y-4">
        <h2 className="font-semibold">Add New Ongrid Option</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={form.phaseType}
            onChange={(e) =>
              setForm({ ...form, phaseType: e.target.value })
            }
            className="border p-2 rounded"
          >
            <option value="1 Phase">1 Phase</option>
            <option value="3 Phase">3 Phase</option>
          </select>

          <input
            placeholder="Brand"
            value={form.brandName}
            onChange={(e) =>
              setForm({ ...form, brandName: e.target.value })
            }
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="Capacity kW"
            value={form.capacity}
            onChange={(e) =>
              setForm({ ...form, capacity: e.target.value })
            }
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="Rate"
            value={form.rate}
            onChange={(e) =>
              setForm({ ...form, rate: e.target.value })
            }
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={createOption}
          className="bg-green-600 text-white px-4 py-2 rounded w-full md:w-auto"
        >
          Add Ongrid Option
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white p-5 rounded-2xl shadow space-y-4">

        <div>
          <h2 className="font-semibold">Saved Ongrid Options</h2>
          <p className="text-sm text-gray-500">
            Showing {paginated.length} of {filtered.length} filtered options.
            Total saved: {options.length}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            placeholder="Search brand, capacity or rate"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="ALL">All Phases</option>
            <option value="1 Phase">1 Phase</option>
            <option value="3 Phase">3 Phase</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="capacity-asc">Capacity: Low to High</option>
            <option value="capacity-desc">Capacity: High to Low</option>
            <option value="rate-asc">Rate: Low to High</option>
            <option value="rate-desc">Rate: High to Low</option>
          </select>

          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="border p-2 rounded"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : paginated.length === 0 ? (
          <div className="border rounded p-4 text-gray-500">
            No ongrid options found.
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map((opt) => (
              <div
                key={opt.id}
                className="border p-3 rounded flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                {editingId === opt.id ? (
                  <>
                    <input
                      value={editingData.brandName}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          brandName: e.target.value,
                        })
                      }
                      className="border p-2 rounded"
                    />

                    <input
                      type="number"
                      value={editingData.capacity}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          capacity: e.target.value,
                        })
                      }
                      className="border p-2 rounded"
                    />

                    <input
                      type="number"
                      value={editingData.rate}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          rate: e.target.value,
                        })
                      }
                      className="border p-2 rounded"
                    />

                    <div className="space-x-2">
                      <button onClick={updateOption} className="text-green-600">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      {opt.phaseType} | {opt.brandName} | {opt.capacity} kW | ₹{opt.rate}
                    </div>

                    <div className="space-x-3">
                      <button
                        onClick={() => {
                          setEditingId(opt.id);
                          setEditingData(opt);
                        }}
                        className="text-blue-600"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteOption(opt.id)}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            Prev
          </button>

          <span>{page} / {totalPages}</span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            Next
          </button>
        </div>

      </div>

    </div>
  );
}