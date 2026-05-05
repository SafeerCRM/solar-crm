'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

export default function ExpectedProfitPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('capacity-asc');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    capacityKw: '',
    profitAmount: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>({});

  const fetchOptions = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${backendUrl}/calculator/expected-profit-options`,
        { headers: getAuthHeaders() }
      );

      setOptions(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load expected profit options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const filtered = useMemo(() => {
    let list = [...options];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        `${i.capacityKw} ${i.profitAmount}`.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'capacity-asc') return Number(a.capacityKw) - Number(b.capacityKw);
      if (sortBy === 'capacity-desc') return Number(b.capacityKw) - Number(a.capacityKw);
      if (sortBy === 'profit-asc') return Number(a.profitAmount) - Number(b.profitAmount);
      if (sortBy === 'profit-desc') return Number(b.profitAmount) - Number(a.profitAmount);
      return 0;
    });

    return list;
  }, [options, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, rowsPerPage]);

  const createOption = async () => {
    if (!form.capacityKw || !form.profitAmount) {
      alert('Please enter capacity and profit amount');
      return;
    }

    try {
      await axios.post(
        `${backendUrl}/calculator/expected-profit-options`,
        {
          capacityKw: Number(form.capacityKw),
          profitAmount: Number(form.profitAmount),
        },
        { headers: getAuthHeaders() }
      );

      setForm({
        capacityKw: '',
        profitAmount: '',
      });

      fetchOptions();
    } catch (err) {
      console.error(err);
      alert('Create failed');
    }
  };

  const deleteOption = async (id: number) => {
    if (!confirm('Delete this expected profit slab?')) return;

    try {
      await axios.delete(
        `${backendUrl}/calculator/expected-profit-options/${id}`,
        { headers: getAuthHeaders() }
      );

      fetchOptions();
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const updateOption = async () => {
    if (!editingId) return;

    if (!editingData.capacityKw || !editingData.profitAmount) {
      alert('Please enter capacity and profit amount');
      return;
    }

    try {
      await axios.patch(
        `${backendUrl}/calculator/expected-profit-options/${editingId}`,
        {
          capacityKw: Number(editingData.capacityKw),
          profitAmount: Number(editingData.profitAmount),
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Expected Profit</h1>
          <p className="text-sm text-gray-500">
            Manage expected profit slabs based on project capacity.
          </p>
        </div>

        <Link
          href="/calculator/settings"
          className="text-sm bg-gray-100 px-4 py-2 rounded-lg"
        >
          Back to Settings
        </Link>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow space-y-4">
        <h2 className="font-semibold">Add Expected Profit Slab</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="number"
            placeholder="Capacity kW"
            value={form.capacityKw}
            onChange={(e) => setForm({ ...form, capacityKw: e.target.value })}
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="Profit Amount"
            value={form.profitAmount}
            onChange={(e) =>
              setForm({ ...form, profitAmount: e.target.value })
            }
            className="border p-2 rounded"
          />

          <button
            onClick={createOption}
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
          >
            Add Expected Profit
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow space-y-4">
        <div>
          <h2 className="font-semibold">Saved Expected Profit Slabs</h2>
          <p className="text-sm text-gray-500">
            Showing {paginated.length} of {filtered.length} filtered slabs.
            Total saved: {options.length}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            placeholder="Search capacity or profit"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="capacity-asc">Capacity: Low to High</option>
            <option value="capacity-desc">Capacity: High to Low</option>
            <option value="profit-asc">Profit: Low to High</option>
            <option value="profit-desc">Profit: High to Low</option>
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
            No expected profit slabs found.
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                      <input
                        type="number"
                        value={editingData.capacityKw}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            capacityKw: e.target.value,
                          })
                        }
                        className="border p-2 rounded"
                      />

                      <input
                        type="number"
                        value={editingData.profitAmount}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            profitAmount: e.target.value,
                          })
                        }
                        className="border p-2 rounded"
                      />
                    </div>

                    <div className="space-x-3 shrink-0">
                      <button onClick={updateOption} className="text-green-600">
                        Save
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingData({});
                        }}
                        className="text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm">
                      <div className="font-medium">{opt.capacityKw} kW</div>
                      <div className="text-gray-600">₹{opt.profitAmount}</div>
                    </div>

                    <div className="space-x-3 shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(opt.id);
                          setEditingData({ ...opt });
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

        <div className="flex items-center justify-between pt-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="px-4 py-2 rounded bg-gray-100 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="px-4 py-2 rounded bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}