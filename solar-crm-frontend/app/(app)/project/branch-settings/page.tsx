'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Branch = {
  id: number;
  name: string;
  code?: string;
  city?: string;
  address?: string;
};

export default function BranchSettingsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    city: '',
    address: '',
  });

  const fetchBranches = async () => {
    const token = localStorage.getItem('token');

    const res = await axios.get(`${API_BASE_URL}/project/branch`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    setBranches(res.data || []);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const createBranch = async () => {
    if (!form.name.trim()) {
      alert('Branch name required');
      return;
    }

    const token = localStorage.getItem('token');

    await axios.post(`${API_BASE_URL}/project/branch`, form, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    alert('Branch added');

    setForm({
      name: '',
      code: '',
      city: '',
      address: '',
    });

    fetchBranches();
  };

  const deleteBranch = async (id: number) => {
    if (!window.confirm('Delete this branch?')) return;

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/branch/${id}/delete`,
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    alert('Branch deleted');
    fetchBranches();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Branch Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Owner-controlled project branches.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Add Branch
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="Branch Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Branch Code"
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="City"
            value={form.city}
            onChange={(e) =>
              setForm({ ...form, city: e.target.value })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
            className="rounded-xl border p-3"
          />
        </div>

        <button
          onClick={createBranch}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Add Branch
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Branch List
        </h2>

        <div className="space-y-3">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-bold text-gray-800">{branch.name}</p>
                <p className="text-sm text-gray-500">
                  {branch.code || '-'} | {branch.city || '-'}
                </p>
                {branch.address && (
                  <p className="mt-1 text-sm text-gray-600">
                    {branch.address}
                  </p>
                )}
              </div>

              <button
                onClick={() => deleteBranch(branch.id)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          ))}

          {branches.length === 0 && (
            <p className="text-sm text-gray-500">No branches added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}