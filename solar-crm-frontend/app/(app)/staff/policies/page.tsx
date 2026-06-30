'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { uploadPreparedFile } from '@/app/utils/fileUpload';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const emptyForm = {
  category: 'GENERAL',
  title: '',
  description: '',
  fileUrl: '',
  fileName: '',
  visibleToEmployee: true,
  visibleToSolarFranchise: false,
  isActive: true,
};

export default function EmployeePoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [policyFile, setPolicyFile] = useState<File | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showHidden, setShowHidden] = useState(false);
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

      const res = await axios.get(`${API_BASE_URL}/staff/employee-policies`, {
        params: {
          page,
          limit: 20,
          search,
          category: categoryFilter,
          showHidden,
        },
        headers: headers(),
      });

      setPolicies(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, showHidden, categoryFilter]);

  const resetForm = () => {
    setEditingId(null);
    setPolicyFile(null);
    setForm(emptyForm);
  };

  const uploadPolicyFile = async () => {
    if (!policyFile) return { fileUrl: form.fileUrl || '', fileName: form.fileName || '' };

    const token = localStorage.getItem('token');

    const fileUrl = await uploadPreparedFile({
      file: policyFile,
      endpoint: `${API_BASE_URL}/staff/employee-policy/file-upload`,
      token,
      fieldName: 'files',
    });

    return {
      fileUrl,
      fileName: policyFile.name,
    };
  };

  const savePolicy = async () => {
    if (!form.title.trim()) {
      alert('Policy title is required');
      return;
    }

    try {
      const uploaded = await uploadPolicyFile();

      const payload = {
        ...form,
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
      };

      if (editingId) {
        await axios.patch(
          `${API_BASE_URL}/staff/employee-policy/${editingId}`,
          payload,
          { headers: headers() },
        );
        alert('Policy updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/staff/employee-policy`, payload, {
          headers: headers(),
        });
        alert('Policy created successfully');
      }

      resetForm();
      fetchPolicies();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || error?.message || 'Failed to save policy');
    }
  };

  const startEdit = (policy: any) => {
    setEditingId(policy.id);
    setForm({
      category: policy.category || 'GENERAL',
      title: policy.title || '',
      description: policy.description || '',
      fileUrl: policy.fileUrl || '',
      fileName: policy.fileName || '',
      visibleToEmployee: policy.visibleToEmployee !== false,
visibleToSolarFranchise:
  policy.visibleToSolarFranchise === true,
isActive: policy.isActive !== false,
    });
    setPolicyFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hideRestore = async (policy: any, restore = false) => {
    const reason = window.prompt(
      restore ? 'Reason for restoring policy?' : 'Reason for hiding policy?',
      restore ? 'Valid policy' : 'Old / wrong / inactive policy',
    );

    if (reason === null) return;

    await axios.patch(
      `${API_BASE_URL}/staff/employee-policy/${policy.id}/${restore ? 'restore' : 'hide'}`,
      { reason },
      { headers: headers() },
    );

    fetchPolicies();
  };

  const categories = [
  'HR',
  'ATTENDANCE',
  'LEAVE',
  'SALARY',
  'INCENTIVE',
  'PENALTY',
  'HOLIDAY',
  'GENERAL',

  'FRANCHISE_GENERAL',
  'FRANCHISE_PAYOUT_RULE',
  'FRANCHISE_MEETING_POLICY',
  'FRANCHISE_PROJECT_POLICY',
  'FRANCHISE_CONTRACTOR_POLICY',
  'FRANCHISE_DOCUMENT_POLICY',
  'FRANCHISE_CUSTOMER_HANDLING',
];

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Employee Policies
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload and manage employee-visible HR policies, notices and documents.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Loaded Policies</p>
          <p className="mt-2 text-2xl font-bold">{policies.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Visible</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {policies.filter((p) => p.visibleToEmployee).length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {policies.filter((p) => p.isActive).length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Hidden View</p>
          <p className="mt-2 text-2xl font-bold text-orange-700">
            {showHidden ? 'On' : 'Off'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          {editingId ? 'Edit Policy' : 'Create Policy'}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-xl border p-3"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <input
            placeholder="Policy Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-xl border p-3 md:col-span-2"
          />

          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setPolicyFile(e.target.files?.[0] || null)}
            className="rounded-xl border p-3 md:col-span-3"
          />
        </div>

        {form.fileUrl && (
          <p className="mt-2 text-xs text-green-700">
            Existing file: {form.fileName || form.fileUrl}
          </p>
        )}

        <textarea
          placeholder="Policy description / notes"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mt-3 w-full rounded-xl border p-3"
          rows={4}
        />

        <div className="mt-3 flex flex-wrap gap-3">
          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.visibleToEmployee}
              onChange={(e) =>
                setForm({ ...form, visibleToEmployee: e.target.checked })
              }
            />{' '}
            Visible to Employee Portal
          </label>

          <label className="rounded-xl border p-3 text-sm">
  <input
    type="checkbox"
    checked={form.visibleToSolarFranchise}
    onChange={(e) =>
      setForm({
        ...form,
        visibleToSolarFranchise: e.target.checked,
      })
    }
  />{' '}
  Visible to Solar Franchise
</label>

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />{' '}
            Active
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={savePolicy}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            {editingId ? 'Update Policy' : 'Create Policy'}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            placeholder="Search title / description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
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

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => {
                setShowHidden(e.target.checked);
                setPage(1);
              }}
            />{' '}
            View Hidden
          </label>

          <button
            onClick={() => {
              setPage(1);
              fetchPolicies();
            }}
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply / Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">Policy Register</h2>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {policies.length === 0 ? (
              <p className="text-sm text-gray-500">No policies found.</p>
            ) : (
              policies.map((policy) => (
                <div
                  key={policy.id}
                  className={`rounded-xl border p-4 ${
                    policy.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-bold text-gray-900">
                        {policy.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {policy.category || 'GENERAL'} |{' '}
                        Employee: {policy.visibleToEmployee ? 'Visible' : 'Hidden'} |{' '}
Franchise: {policy.visibleToSolarFranchise ? 'Visible' : 'Hidden'} |{' '}
{policy.isActive ? 'Active' : 'Inactive'}
                      </p>

                      {policy.description && (
                        <p className="mt-2 text-sm text-gray-700">
                          {policy.description}
                        </p>
                      )}

                      {policy.fileName && (
                        <p className="mt-2 text-xs text-gray-400">
                          File: {policy.fileName}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!policy.isHidden && (
                        <button
                          onClick={() => startEdit(policy)}
                          className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Edit
                        </button>
                      )}

                      {policy.fileUrl && (
                        <a
                          href={policy.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
                        >
                          View / Download
                        </a>
                      )}

                      <button
                        onClick={() => hideRestore(policy, !!policy.isHidden)}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${
                          policy.isHidden ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      >
                        {policy.isHidden ? 'Restore' : 'Hide'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
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