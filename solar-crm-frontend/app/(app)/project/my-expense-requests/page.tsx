'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const EXPENSE_TYPES = [
  'PROJECT_FUND',
  'CONTRACTOR_PAYMENT',
  'LABOUR_PAYMENT',
  'TRANSPORTATION',
  'TRAVEL',
  'FOOD',
  'FUEL',
  'MOBILE_RECHARGE',
  'OFFICE_SUPPLIES',
  'SITE_PURCHASE',
  'REPAIR_MAINTENANCE',
  'CUSTOMER_VISIT',
  'SALARY',
  'INCENTIVE',
  'ADVANCE_SALARY',
  'OTHER',
];

function label(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function money(value: any) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function MyExpenseRequestsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [expenseType, setExpenseType] = useState('TRAVEL');
  const [otherExpenseName, setOtherExpenseName] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [purpose, setPurpose] = useState('');
const [proofFile, setProofFile] = useState<File | null>(null);
const [uploadingProof, setUploadingProof] = useState(false);

  const [status, setStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('myExpenseRequestFilters');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStatus(parsed.status || '');
        setFilterType(parsed.filterType || '');
        setFromDate(parsed.fromDate || '');
        setToDate(parsed.toDate || '');
        setPage(Number(parsed.page || 1));
      } catch {
        localStorage.removeItem('myExpenseRequestFilters');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'myExpenseRequestFilters',
      JSON.stringify({
        status,
        filterType,
        fromDate,
        toDate,
        page,
      }),
    );
  }, [status, filterType, fromDate, toDate, page]);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/project/account-expenses/my`,
        {
          params: {
            page,
            limit: 20,
            status,
            expenseType: filterType,
            fromDate,
            toDate,
          },
          headers: getAuthHeaders(),
        },
      );

      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotalRecords(res.data?.pagination?.total || 0);
    } catch (error) {
      console.error(error);
      alert('Failed to load expense requests');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const createRequest = async () => {
    if (!amount || Number(amount) <= 0) {
      alert('Please enter valid amount');
      return;
    }

    if (!purpose.trim()) {
  alert('Please enter request purpose');
  return;
}

    if (expenseType === 'OTHER' && !otherExpenseName.trim()) {
      alert('Please enter other expense name');
      return;
    }

    let finalRemarks = remarks;

    if (expenseType === 'OTHER') {
      finalRemarks = `Other Expense: ${otherExpenseName.trim()}${
        remarks ? ` | ${remarks}` : ''
      }`;
    }

    try {
      setSaving(true);

      let proofUrl = '';

if (proofFile) {
  setUploadingProof(true);

  const formData = new FormData();
  formData.append('files', proofFile);

  const uploadRes = await axios.post(
    `${API_BASE_URL}/project/account-expenses/proof/upload`,
    formData,
    {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  proofUrl = uploadRes.data?.fileUrl || '';
}

      await axios.post(
        `${API_BASE_URL}/project/account-expenses/request`,
        {
          expenseType,
          amount: Number(amount),
          remarks: finalRemarks,
          purpose: purpose.trim(),
          proofUrl,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      alert('Expense request submitted');

      setExpenseType('TRAVEL');
      setOtherExpenseName('');
      setAmount('');
      setRemarks('');
      setPurpose('');
     setProofFile(null);
      setPage(1);

      fetchRequests();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to submit expense request',
      );
    } finally {
      setSaving(false);
      setUploadingProof(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    setTimeout(fetchRequests, 0);
  };

  const clearFilters = () => {
    setStatus('');
    setFilterType('');
    setFromDate('');
    setToDate('');
    setPage(1);
    localStorage.removeItem('myExpenseRequestFilters');
    setTimeout(fetchRequests, 0);
  };

  return (
    <div className="min-w-0 space-y-5 bg-gray-50 p-3 md:p-6">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-900">
          My Expense Requests
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Submit reimbursement, fund, travel, food, fuel and site expense
          requests. Approval will be handled by Accounts / Payment team.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Create Expense Request
            </h2>
            <p className="text-sm text-gray-500">
              This request will be saved as Pending Approval.
            </p>
          </div>

          <button
            type="button"
            onClick={createRequest}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving || uploadingProof
  ? 'Saving...'
  : 'Submit Request'}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value)}
            className="rounded-xl border p-3"
          >
            {EXPENSE_TYPES.map((type) => (
              <option key={type} value={type}>
                {label(type)}
              </option>
            ))}
          </select>

          {expenseType === 'OTHER' && (
            <input
              placeholder="Other expense name"
              value={otherExpenseName}
              onChange={(e) => setOtherExpenseName(e.target.value)}
              className="rounded-xl border p-3"
            />
          )}

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-xl border p-3"
          />

          <input
  placeholder="Purpose *"
  value={purpose}
  onChange={(e) => setPurpose(e.target.value)}
  className="rounded-xl border p-3"
/>

<input
  type="file"
  accept="image/*,application/pdf"
  onChange={(e) =>
    setProofFile(e.target.files?.[0] || null)
  }
  className="rounded-xl border p-3"
/>

          <input
            placeholder="Remarks / purpose"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="rounded-xl border p-3"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">Filters</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Expense Types</option>
            {EXPENSE_TYPES.map((type) => (
              <option key={type} value={type}>
                {label(type)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-xl border p-3"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-xl border p-3"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={applyFilters}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>

          <button
            onClick={clearFilters}
            className="rounded-xl bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-800"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            My Request History
          </h2>

          <p className="text-sm text-gray-500">
            {totalRecords} record(s)
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500">
              No expense requests found.
            </p>
          ) : (
            rows.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border bg-gray-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-gray-800">
                      {label(item.expenseType || 'OTHER')}
                    </p>

                    {item.purpose && (
  <p className="mt-1 text-sm font-semibold text-gray-700">
    Purpose: {item.purpose}
  </p>
)}

{item.proofUrl && (
  <a
    href={item.proofUrl}
    target="_blank"
    rel="noreferrer"
    className="mt-2 inline-block text-sm font-semibold text-blue-700 underline"
  >
    View Proof / Bill
  </a>
)}

                    <p className="mt-1 text-sm text-gray-600">
                      {item.remarks || '-'}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      Submitted:{' '}
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString('en-IN')
                        : '-'}
                    </p>

                    {item.approvalNote && (
                      <p className="mt-2 text-xs text-gray-600">
                        Approval Note: {item.approvalNote}
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {money(item.amount)}
                    </p>

                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        item.approvalStatus === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : item.approvalStatus === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {item.approvalStatus || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
              className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Previous
            </button>

            <button
              onClick={() =>
                setPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={page >= totalPages}
              className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}