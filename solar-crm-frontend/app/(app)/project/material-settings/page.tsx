'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type MaterialItem = {
  id: number;
  name: string;
  category?: string;
  unit?: string;
  brand?: string;
  rate?: number;
  gstPercent?: number;
  expectedMargin?: number;
  remarks?: string;
  isActive?: boolean;
};

export default function MaterialSettingsPage() {
  const [items, setItems] = useState<
    MaterialItem[]
  >([]);

  const [loading, setLoading] =
    useState(false);

    const [editingId, setEditingId] =
  useState<number | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '',
    brand: '',
    rate: '',
    gstPercent: '',
    expectedMargin: '',
    remarks: '',
  });

  const fetchItems = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem('token');

      const res = await axios.get(
        `${API_BASE_URL}/project/material-master`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      setItems(res.data || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const saveItem = async () => {
  if (!form.name.trim()) {
    alert('Material name required');
    return;
  }

  try {
    const token = localStorage.getItem('token');

    const payload = {
      ...form,
      rate: Number(form.rate || 0),
      gstPercent: Number(form.gstPercent || 0),
      expectedMargin: Number(form.expectedMargin || 0),
    };

    if (editingId) {
      await axios.patch(
        `${API_BASE_URL}/project/material-master/${editingId}`,
        payload,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      alert('Material updated');
    } else {
      await axios.post(
        `${API_BASE_URL}/project/material-master`,
        payload,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      alert('Material added');
    }

    setForm({
      name: '',
      category: '',
      unit: '',
      brand: '',
      rate: '',
      gstPercent: '',
      expectedMargin: '',
      remarks: '',
    });

    setEditingId(null);

    fetchItems();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to save material',
    );
  }
};

const startEdit = (item: MaterialItem) => {
  setEditingId(item.id);

  setForm({
    name: item.name || '',
    category: item.category || '',
    unit: item.unit || '',
    brand: item.brand || '',
    rate: String(item.rate || ''),
    gstPercent: String(item.gstPercent || ''),
    expectedMargin: String(item.expectedMargin || ''),
    remarks: item.remarks || '',
  });

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

const cancelEdit = () => {
  setEditingId(null);

  setForm({
    name: '',
    category: '',
    unit: '',
    brand: '',
    rate: '',
    gstPercent: '',
    expectedMargin: '',
    remarks: '',
  });
};

  const toggleMaterialStatus = async (
    item: MaterialItem,
  ) => {
    const confirmed =
      window.confirm(
        item.isActive
  ? 'Disable this material?'
  : 'Enable this material?',
      );

    if (!confirmed) {
      return;
    }

    try {
      const token =
        localStorage.getItem('token');

      await axios.patch(
        `${API_BASE_URL}/project/material-master/${item.id}/${
  item.isActive ? 'delete' : 'enable'
}`,
        {},
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      alert(
  item.isActive
    ? 'Material disabled'
    : 'Material enabled',
);

      fetchItems();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          'Failed to delete material',
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Project Material Settings
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage project material master list
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">
          Add Material
        </h2>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            placeholder="Material Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Unit"
            value={form.unit}
            onChange={(e) =>
              setForm({
                ...form,
                unit: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Brand"
            value={form.brand}
            onChange={(e) =>
              setForm({
                ...form,
                brand: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Rate"
            value={form.rate}
            onChange={(e) =>
              setForm({
                ...form,
                rate: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="GST %"
            value={form.gstPercent}
            onChange={(e) =>
              setForm({
                ...form,
                gstPercent: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
  type="number"
  placeholder="Expected Margin"
  value={form.expectedMargin}
  onChange={(e) =>
    setForm({
      ...form,
      expectedMargin: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>
        </div>

        <textarea
          placeholder="Remarks"
          value={form.remarks}
          onChange={(e) =>
            setForm({
              ...form,
              remarks: e.target.value,
            })
          }
          className="mt-3 w-full rounded-xl border p-3"
        />

        <button
          onClick={saveItem}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {editingId ? 'Update Material' : 'Add Material'}
        </button>

        {editingId && (
  <button
    onClick={cancelEdit}
    className="ml-3 mt-4 rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white hover:bg-gray-700"
  >
    Cancel Edit
  </button>
)}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">
          Material List
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">
            No materials added yet
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${
  item.isActive
    ? 'bg-white'
    : 'bg-gray-100 opacity-70'
}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-gray-800">
  {item.name}

  <span
    className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold ${
      item.isActive
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700'
    }`}
  >
    {item.isActive ? 'ACTIVE' : 'DISABLED'}
  </span>
</p>

                    <p className="text-sm text-gray-500">
                      {item.category || '-'} |{' '}
                      {item.brand || '-'} |{' '}
                      {item.unit || '-'}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-green-700">
                      ₹
                      {Number(
                        item.rate || 0,
                      ).toLocaleString(
                        'en-IN',
                      )}
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
  GST: {Number(item.gstPercent || 0)}%
</p>

<p className="mt-1 text-sm text-blue-700">
  Cost with GST: ₹
  {(
    Number(item.rate || 0) +
    (Number(item.rate || 0) *
      Number(item.gstPercent || 0)) /
      100
  ).toLocaleString('en-IN')}
</p>

<p className="mt-1 text-sm text-purple-700">
  Expected Margin: ₹
  {Number(item.expectedMargin || 0).toLocaleString(
    'en-IN',
  )}
</p>

<p className="mt-1 text-sm font-bold text-green-700">
  Recommended Selling Price: ₹
  {(
    Number(item.rate || 0) +
    (Number(item.rate || 0) *
      Number(item.gstPercent || 0)) /
      100 +
    Number(item.expectedMargin || 0)
  ).toLocaleString('en-IN')}
</p>

                    {item.remarks && (
                      <p className="mt-1 text-sm text-gray-600">
                        {item.remarks}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
  <button
    onClick={() => startEdit(item)}
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Edit
  </button>

  <button
  onClick={() => toggleMaterialStatus(item)}
  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
    item.isActive
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-green-600 hover:bg-green-700'
  }`}
>
  {item.isActive ? 'Disable' : 'Enable'}
</button>
</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}