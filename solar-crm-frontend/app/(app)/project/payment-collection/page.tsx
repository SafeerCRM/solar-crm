'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import { Capacitor } from '@capacitor/core';
import {
  Directory,
  Encoding,
  Filesystem,
} from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type PaymentRow = {
  id: number;
  projectId: number;
  label: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate?: string;
  paidDate?: string;
  status: string;
  paymentMode?: string;
  approvalStatus?: string;
  transactionId?: string;
  remarks?: string;
  collectedByName?: string;
  customerName?: string;
  customerPhone?: string;
  branchName?: string;
  projectOwnerName?: string;
  projectSerial?: string;
  finalCost?: number;
projectReceivedAmount?: number;
paymentReceivedPercentage?: number;
projectStatus?: string;
};

type BranchOption = {
  id?: number;
  name?: string;
  branchName?: string;
};

type ProjectOwnerOption = {
  projectOwnerId: number;
  projectOwnerName: string;
  projectOwnerRole?: string;
};

export default function PaymentCollectionPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
const [projectOwners, setProjectOwners] = useState<ProjectOwnerOption[]>([]);
  const [loading, setLoading] = useState(false);
const [exportLoading, setExportLoading] = useState(false);
  const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalRecords, setTotalRecords] = useState(0);
const [summary, setSummary] = useState({
  projectTotalAmount: 0,
  projectCollectedAmount: 0,
  projectPendingAmount: 0,
});

  const [approvalStatus, setApprovalStatus] = useState('');

  const [branch, setBranch] = useState('');
  const [search, setSearch] = useState('');
  const [projectOwnerId, setProjectOwnerId] = useState('');
  const [month, setMonth] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);

  const fetchFilterOptions = async () => {
  try {
    const [branchRes, ownerRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/project/branch`, {
        headers: getAuthHeaders(),
      }),
      axios.get(`${API_BASE_URL}/project/owners/list`, {
        headers: getAuthHeaders(),
      }),
    ]);

    setBranches(
      Array.isArray(branchRes.data)
        ? branchRes.data
        : [],
    );

    setProjectOwners(
      Array.isArray(ownerRes.data)
        ? ownerRes.data
        : [],
    );
  } catch (error) {
    console.error('Failed to load filter options:', error);
  }
};

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/project/payment-collection`, {
        params: {
          branch,
          customerName: search,
          projectOwnerId,
          month,
          fromDate,
          toDate,
          status,
          approvalStatus,
          pendingOnly: pendingOnly ? 'true' : '',
          page,
limit: 20,
        },
        headers: getAuthHeaders(),
      });

      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
setTotalRecords(res.data?.pagination?.total || 0);
setSummary({
  projectTotalAmount:
    Number(res.data?.summary?.projectTotalAmount || 0),
  projectCollectedAmount:
    Number(res.data?.summary?.projectCollectedAmount || 0),
  projectPendingAmount:
    Number(res.data?.summary?.projectPendingAmount || 0),
});
    } catch (error) {
      console.error('Failed to load payment collection:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchFilterOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  fetchPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [page]);



  const clearFilters = () => {
    setBranch('');
    setSearch('');
    setProjectOwnerId('');
    setMonth('');
    setFromDate('');
    setToDate('');
    setStatus('');
    setApprovalStatus('');
    setPendingOnly(false);
    setPage(1);
    setTimeout(fetchPayments, 0);
  };

  const downloadPaymentCollectionCsv =
  async () => {
    try {
      setExportLoading(true);

      const token =
        localStorage.getItem('token');

      const res = await axios.get(
        `${API_BASE_URL}/project/payment-collection/export-csv`,
        {
          params: {
            branch,

            customerName:
              search,

            projectOwnerId,

            month,

            fromDate,

            toDate,

            status,

            approvalStatus,

            pendingOnly:
              pendingOnly
                ? 'true'
                : '',
          },

          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {},

          responseType: 'text',
        },
      );

      const csvContent =
        typeof res.data === 'string'
          ? res.data
          : String(res.data || '');

      if (!csvContent.trim()) {
        alert(
          'No payment collection records found for the applied filters',
        );

        return;
      }

      /*
       * The backend response already contains
       * the UTF-8 BOM and completed CSV content.
       */
      const today =
        new Date()
          .toISOString()
          .slice(0, 10);

      const fileName =
        `payment-collection-report-${today}.csv`;

      /*
       * APK:
       * Save the CSV in the app cache and open
       * the native Android share/save sheet.
       *
       * This is the same working pattern used
       * by the Project List download.
       */
      if (
        Capacitor.isNativePlatform()
      ) {
        const writeResult =
          await Filesystem.writeFile({
            path: fileName,

            data: csvContent,

            directory:
              Directory.Cache,

            encoding:
              Encoding.UTF8,

            recursive: true,
          });

        await Share.share({
          title:
            'Payment Collection Report',

          text:
            'Filtered payment collection report',

          files: [
            writeResult.uri,
          ],

          dialogTitle:
            'Save or share collection report',
        });

        return;
      }

      /*
       * Web:
       * Download through the browser.
       */
      const blob = new Blob(
        [csvContent],
        {
          type:
            'text/csv;charset=utf-8;',
        },
      );

      const downloadUrl =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement('a');

      anchor.href =
        downloadUrl;

      anchor.download =
        fileName;

      document.body.appendChild(
        anchor,
      );

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(
        downloadUrl,
      );
    } catch (error: any) {
      console.error(
        'Payment collection export failed:',
        error,
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to download payment collection report',
      );
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden bg-gray-50 p-3 md:p-6">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-900">
          💰 Payment Collection
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Branch-wise, owner-wise, customer-wise and date-wise payment collection report.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
  title="Total Project Amount"
  value={summary.projectTotalAmount}
  tone="blue"
/>

<SummaryCard
  title="Total Collected"
  value={summary.projectCollectedAmount}
  tone="green"
/>

<SummaryCard
  title="Total Pending"
  value={summary.projectPendingAmount}
  tone="red"
/>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">Filters</h2>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
  value={branch}
  onChange={(e) => setBranch(e.target.value)}
  className="rounded-xl border p-3"
>
  <option value="">All Branches</option>

  {branches.map((item, index) => (
    <option
      key={index}
      value={item.branchName || item.name || ''}
    >
      {item.branchName || item.name}
    </option>
  ))}
</select>

          <input
  placeholder="Search customer / phone / project serial"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="rounded-xl border p-3"
/>

          <select
  value={projectOwnerId}
  onChange={(e) => setProjectOwnerId(e.target.value)}
  className="rounded-xl border p-3"
>
  <option value="">All Project Owners</option>

  {projectOwners.map((owner) => (
  <option
    key={owner.projectOwnerId}
    value={owner.projectOwnerId}
  >
    {owner.projectOwnerName}
    {owner.projectOwnerRole ? ` (${owner.projectOwnerRole})` : ''}
  </option>
))}
</select>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border p-3"
          />

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

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
  value={approvalStatus}
  onChange={(e) => setApprovalStatus(e.target.value)}
  className="rounded-xl border p-3"
>
  <option value="">All Approval Status</option>
  <option value="PENDING">Pending Approval</option>
  <option value="APPROVED">Approved</option>
  <option value="REJECTED">Rejected</option>
</select>

          <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
            />
            Pending only
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
  <button
    onClick={() => {
      setPage(1);
      fetchPayments();
    }}
    disabled={loading}
    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
  >
    {loading
      ? 'Loading...'
      : 'Apply Filters'}
  </button>

  <button
    onClick={clearFilters}
    disabled={
      loading ||
      exportLoading
    }
    className="rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
  >
    Clear
  </button>

  <button
    type="button"
    onClick={
      downloadPaymentCollectionCsv
    }
    disabled={
      loading ||
      exportLoading
    }
    className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
  >
    {exportLoading
      ? 'Preparing Report...'
      : 'Download Collection CSV'}
  </button>
</div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            Collection List
          </h2>

          <p className="text-sm text-gray-500">
            {rows.length} record(s)
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading payment records...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No payment records found.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((item) => (
              <div key={item.id} className="min-w-0 rounded-2xl border p-3 md:p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {formatLabel(item.label)}
                      </span>

                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                        {item.status}
                      </span>

                      {item.projectStatus && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          Project: {item.projectStatus}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <Info label="Customer" value={item.customerName || '-'} />
                      <Info label="Phone" value={item.customerPhone || '-'} />
                      <Info label="Branch" value={item.branchName || '-'} />
                      <Info label="Project Owner" value={item.projectOwnerName || '-'} />
                      <Info label="Project Serial" value={item.projectSerial || `#${item.projectId}`} />
                      <Info label="Due Date" value={formatDate(item.dueDate)} />
                      <Info label="Payment Mode" value={item.paymentMode || '-'} />
                      <Info label="Transaction ID" value={item.transactionId || '-'} />
                    </div>

                    {item.remarks && (
                      <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                        {item.remarks}
                      </p>
                    )}
                  </div>

                  <div className="w-full rounded-xl bg-gray-50 p-4 text-left md:w-[180px] md:text-right">
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="text-lg font-bold text-gray-900">{money(item.amount)}</p>

                    <p className="mt-2 text-sm text-green-700">
                      Paid: <b>{money(item.paidAmount)}</b>
                    </p>

                    <p className="mt-1 text-sm text-red-700">
                      Pending: <b>{money(item.pendingAmount)}</b>
                    </p>

                      <div className="mt-4 rounded-xl bg-white p-3 text-left">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold text-gray-600">
        Payment Received
      </p>

      <p className="text-xs font-bold text-green-700">
        {item.paymentReceivedPercentage || 0}%
      </p>
    </div>

    <div className="mt-2 h-2 overflow-hidden rounded-full bg-green-100">
      <div
        className="h-full rounded-full bg-green-600"
        style={{
          width: `${item.paymentReceivedPercentage || 0}%`,
        }}
      />
    </div>

    <p className="mt-2 text-xs text-gray-600">
      {money(item.projectReceivedAmount)} / {money(item.finalCost)}
    </p>
  </div>

                    <Link
                      href={`/project/${item.projectId}`}
                      className="mt-3 block rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white"
                    >
                      Open Project
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <p className="text-sm text-gray-600">
      Page {page} of {totalPages} · {totalRecords} record(s)
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
        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
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

function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: 'blue' | 'green' | 'red';
}) {
  const classes = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className={`rounded-2xl p-5 shadow ${classes[tone]}`}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold">{money(value)}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="truncate font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN');
}

function formatLabel(value?: string) {
  return String(value || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusClass(status?: string) {
  if (status === 'PAID') return 'bg-green-100 text-green-700';
  if (status === 'PARTIAL') return 'bg-yellow-100 text-yellow-700';
  if (status === 'OVERDUE') return 'bg-red-100 text-red-700';
  if (status === 'CANCELLED') return 'bg-gray-200 text-gray-700';
  return 'bg-blue-100 text-blue-700';
}