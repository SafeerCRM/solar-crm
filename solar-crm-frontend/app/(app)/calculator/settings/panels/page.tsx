'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

export default function PanelSettingsPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [panelOptions, setPanelOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('capacity-asc');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    panelCategory: 'DCR',
    panelType: 'P Type',
    brandName: '',
    capacityWatt: '',
    rate: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>({});

  const fetchOptions = async () => {
  try {
    setLoading(true);

    const combinations = [
      { category: 'DCR', type: 'P Type' },
      { category: 'DCR', type: 'N Type' },
      { category: 'NONDCR', type: 'P Type' },
      { category: 'NONDCR', type: 'N Type' },
    ];

    const responses = await Promise.all(
      combinations.map((combo) =>
        axios.get(`${backendUrl}/calculator/panel-options`, {
          params: combo,
          headers: getAuthHeaders(),
        })
      )
    );

    const mergedOptions = responses.flatMap((res) => res.data || []);

    const uniqueOptions = Array.from(
      new Map(mergedOptions.map((item) => [item.id, item])).values()
    );

    setPanelOptions(uniqueOptions);
  } catch (err) {
    console.error(err);
    alert('Failed to load panel options');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchOptions();
  }, []);

  const filteredOptions = useMemo(() => {
    let list = [...panelOptions];

    if (categoryFilter !== 'ALL') {
      list = list.filter((item) => item.panelCategory === categoryFilter);
    }

    if (typeFilter !== 'ALL') {
      list = list.filter((item) => item.panelType === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      list = list.filter((item) =>
        `${item.panelCategory} ${item.panelType} ${item.brandName} ${item.capacityWatt} ${item.rate}`
          .toLowerCase()
          .includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'capacity-asc') {
        return Number(a.capacityWatt) - Number(b.capacityWatt);
      }

      if (sortBy === 'capacity-desc') {
        return Number(b.capacityWatt) - Number(a.capacityWatt);
      }

      if (sortBy === 'rate-asc') {
        return Number(a.rate) - Number(b.rate);
      }

      if (sortBy === 'rate-desc') {
        return Number(b.rate) - Number(a.rate);
      }

      return 0;
    });

    return list;
  }, [panelOptions, search, categoryFilter, typeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredOptions.length / rowsPerPage));

  const paginatedOptions = filteredOptions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, typeFilter, sortBy, rowsPerPage]);

  const createOption = async () => {
    if (!form.brandName || !form.capacityWatt || !form.rate) {
      alert('Please fill brand, watt and rate');
      return;
    }

    try {
      await axios.post(
        `${backendUrl}/calculator/panel-options`,
        {
          panelCategory: form.panelCategory,
          panelType: form.panelType,
          brandName: form.brandName,
          capacityWatt: Number(form.capacityWatt),
          rate: Number(form.rate),
        },
        { headers: getAuthHeaders() }
      );

      setForm({
        panelCategory: 'DCR',
        panelType: 'P Type',
        brandName: '',
        capacityWatt: '',
        rate: '',
      });

      fetchOptions();
    } catch (err) {
      console.error(err);
      alert('Create failed');
    }
  };

  const deleteOption = async (id: number) => {
    if (!confirm('Delete this panel option?')) return;

    try {
      await axios.delete(`${backendUrl}/calculator/panel-options/${id}`, {
        headers: getAuthHeaders(),
      });

      fetchOptions();
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const updateOption = async () => {
    if (!editingId) return;

    if (!editingData.brandName || !editingData.capacityWatt || !editingData.rate) {
      alert('Please fill brand, watt and rate');
      return;
    }

    try {
      await axios.patch(
        `${backendUrl}/calculator/panel-options/${editingId}`,
        {
          panelCategory: editingData.panelCategory,
          panelType: editingData.panelType,
          brandName: editingData.brandName,
          capacityWatt: Number(editingData.capacityWatt),
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Panel Options</h1>
          <p className="text-sm text-gray-500">
            Manage DCR / NON-DCR, P Type / N Type, brand, watt and rate.
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
        <h2 className="font-semibold">Add New Panel Option</h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={form.panelCategory}
            onChange={(e) =>
              setForm({ ...form, panelCategory: e.target.value })
            }
            className="border p-2 rounded"
          >
            <option value="DCR">DCR</option>
            <option value="NONDCR">NONDCR</option>
          </select>

          <select
            value={form.panelType}
            onChange={(e) =>
              setForm({ ...form, panelType: e.target.value })
            }
            className="border p-2 rounded"
          >
            <option value="P Type">P Type</option>
            <option value="N Type">N Type</option>
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
            placeholder="Watt"
            value={form.capacityWatt}
            onChange={(e) =>
              setForm({ ...form, capacityWatt: e.target.value })
            }
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="Rate per Watt"
            value={form.rate}
            onChange={(e) =>
              setForm({ ...form, rate: e.target.value })
            }
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={createOption}
          className="bg-green-600 text-white rounded px-4 py-2 w-full md:w-auto"
        >
          Add Panel Option
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow space-y-4">
        <div>
          <h2 className="font-semibold">Saved Panel Options</h2>
          <p className="text-sm text-gray-500">
            Showing {paginatedOptions.length} of {filteredOptions.length} filtered options.
            Total saved: {panelOptions.length}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            placeholder="Search brand, watt or rate"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="ALL">All Categories</option>
            <option value="DCR">DCR</option>
            <option value="NONDCR">NONDCR</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="ALL">All Types</option>
            <option value="P Type">P Type</option>
            <option value="N Type">N Type</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="capacity-asc">Watt: Low to High</option>
            <option value="capacity-desc">Watt: High to Low</option>
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
        ) : paginatedOptions.length === 0 ? (
          <div className="border rounded p-4 text-gray-500">
            No panel options found.
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedOptions.map((opt) => (
              <div
                key={opt.id}
                className="border p-3 rounded flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                {editingId === opt.id ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1">
                      <select
                        value={editingData.panelCategory}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            panelCategory: e.target.value,
                          })
                        }
                        className="border p-2 rounded"
                      >
                        <option value="DCR">DCR</option>
                        <option value="NONDCR">NONDCR</option>
                      </select>

                      <select
                        value={editingData.panelType}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            panelType: e.target.value,
                          })
                        }
                        className="border p-2 rounded"
                      >
                        <option value="P Type">P Type</option>
                        <option value="N Type">N Type</option>
                      </select>

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
                        value={editingData.capacityWatt}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            capacityWatt: e.target.value,
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
                      <div className="font-medium">
                        {opt.brandName || 'No Brand'}
                      </div>

                      <div className="text-gray-600">
                        {opt.panelCategory} | {opt.panelType} | {opt.capacityWatt}W | ₹{opt.rate} per watt
                      </div>
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