'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const categories = [
  'FRANCHISE_GENERAL',
  'FRANCHISE_PAYOUT_RULE',
  'FRANCHISE_MEETING_POLICY',
  'FRANCHISE_PROJECT_POLICY',
  'FRANCHISE_CONTRACTOR_POLICY',
  'FRANCHISE_DOCUMENT_POLICY',
  'FRANCHISE_CUSTOMER_HANDLING',
];

export default function FranchisePoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPolicies = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/staff/solar-franchise-policies`,
        {
          params: {
            page,
            limit: 20,
            category,
            search,
          },
          headers: headers(),
        },
      );

      setPolicies(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to load franchise policies',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Franchise Policies
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Company policies, payout rules and project working guidelines for Solar Franchise users.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            placeholder="Search policy"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value="">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setPage(1);
              fetchPolicies();
            }}
            className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
          >
            Apply / Refresh
          </button>

          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
            Loaded: <b>{policies.length}</b>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Policy Register
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">
            Loading policies...
          </p>
        ) : policies.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No franchise policies available.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="rounded-xl border bg-white p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {policy.title}
                    </p>

                    <p className="text-sm text-gray-500">
                      {String(policy.category || 'GENERAL').replaceAll(
                        '_',
                        ' ',
                      )}
                    </p>

                    {policy.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {policy.description}
                      </p>
                    )}

                    {policy.fileName && (
                      <p className="mt-2 text-xs text-gray-400">
                        File: {policy.fileName}
                      </p>
                    )}
                  </div>

                  {policy.fileUrl && (
                    <a
                      href={policy.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white"
                    >
                      View / Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Previous
          </button>

          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}