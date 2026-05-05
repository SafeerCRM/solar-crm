'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

export default function BatterySettingsPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('capacity-asc');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    type: '',
    brandName: '',
    capacity: '',
    rate: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>({});

  const types = ['Lead Acid', 'Lithium-ion'];

  const fetchOptions = async () => {
  try {
    setLoading(true);

    const res = await axios.get(`${backendUrl}/calculator/battery-options`, {
      headers: getAuthHeaders(),
    });

    setOptions(res.data || []);
  } catch (err) {
    console.error(err);
    alert('Failed to load battery options');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchOptions();
  }, []);

  const filtered = useMemo(() => {
    let list = [...options];

    if (typeFilter !== 'ALL') {
      list = list.filter((i) => i.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        `${i.type} ${i.brandName} ${i.capacity} ${i.rate}`
          .toLowerCase()
          .includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'capacity-asc') return Number(a.capacity) - Number(b.capacity);
      if (sortBy === 'capacity-desc') return Number(b.capacity) - Number(a.capacity);
      if (sortBy === 'rate-asc') return Number(a.rate) - Number(b.rate);
      if (sortBy === 'rate-desc') return Number(b.rate) - Number(a.rate);
      return 0;
    });

    return list;
  }, [options, search, typeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, sortBy, rowsPerPage]);

  const createOption = async () => {
    if (!form.brandName || !form.capacity || !form.rate) {
      alert('Fill all fields');
      return;
    }

    try {
      await axios.post(
        `${backendUrl}/calculator/battery-options`,
        {
          type: form.type,
          brandName: form.brandName,
          capacity: Number(form.capacity),
          rate: Number(form.rate),
        },
        { headers: getAuthHeaders() }
      );

      setForm({
        type: '',
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
    if (!confirm('Delete this battery option?')) return;

    try {
      await axios.delete(`${backendUrl}/calculator/battery-options/${id}`, {
        headers: getAuthHeaders(),
      });

      fetchOptions();
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const updateOption = async () => {
    try {
      await axios.patch(
        `${backendUrl}/calculator/battery-options/${editingId}`,
        {
          type: editingData.type,
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
          <h1 className="text-xl font-semibold">Battery Options</h1>
          <p className="text-sm text-gray-500">
            Manage battery type, brand, capacity and rate.
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
        <h2 className="font-semibold">Add New Battery Option</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
  placeholder="Battery Type (e.g. Lithium-ion)"
  value={form.type}
  onChange={(e) => setForm({ ...form, type: e.target.value })}
  className="border p-2 rounded"
/>

          <input
            placeholder="Brand"
            value={form.brandName}
            onChange={(e) => setForm({ ...form, brandName: e.target.value })}
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="Capacity"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="Rate"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={createOption}
          className="bg-green-600 text-white px-4 py-2 rounded w-full md:w-auto"
        >
          Add Battery Option
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white p-5 rounded-2xl shadow space-y-4">

        <div>
          <h2 className="font-semibold">Saved Battery Options</h2>
          <p className="text-sm text-gray-500">
            Showing {paginated.length} of {filtered.length} filtered options.
            Total saved: {options.length}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            placeholder="Search type, brand, capacity or rate"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="ALL">All Types</option>
            {Array.from(new Set(options.map(o => o.type))).map((type) => (
  <option key={type} value={type}>{type}</option>
))}
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
            No battery options found.
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
                    <select
                      value={editingData.type}
                      onChange={(e) =>
                        setEditingData({ ...editingData, type: e.target.value })
                      }
                      className="border p-2 rounded"
                    >
                      <option value="Lead Acid">Lead Acid</option>
                      <option value="Lithium-ion">Lithium-ion</option>
                    </select>

                    <input
                      value={editingData.brandName}
                      onChange={(e) =>
                        setEditingData({ ...editingData, brandName: e.target.value })
                      }
                      className="border p-2 rounded"
                    />

                    <input
                      type="number"
                      value={editingData.capacity}
                      onChange={(e) =>
                        setEditingData({ ...editingData, capacity: e.target.value })
                      }
                      className="border p-2 rounded"
                    />

                    <input
                      type="number"
                      value={editingData.rate}
                      onChange={(e) =>
                        setEditingData({ ...editingData, rate: e.target.value })
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
                      {opt.type} | {opt.brandName} | {opt.capacity} | ₹{opt.rate}
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