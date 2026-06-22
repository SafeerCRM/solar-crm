'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Project = {
  id: number;
  customerName?: string;
  customerPhone?: string;
  city?: string;
  zone?: string;
  branchName?: string;
  projectOwnerName?: string;
projectOwnerRole?: string;
  projectType?: string;
  projectCost?: number;
  netAmount?: number;
  status?: string;
  marketingHeadApprovalStatus?: string;
  ownerApprovalStatus?: string;
    executionSummary?: {
    totalActivities?: number;
    completedActivities?: number;
    pendingActivities?: number;
    runningActivities?: number;
    percentage?: number;
    runningActivity?: string;
    latestCompletedActivity?: string;
    nextPendingActivity?: string;
  };

  paymentSummary?: {
    totalAmount?: number;
    receivedAmount?: number;
    percentage?: number;
  };
  createdAt?: string;
};

type ProjectOwner = {
  projectOwnerId: number;
  projectOwnerName?: string;
  projectOwnerRole?: string;
};

function formatLabel(value?: string) {
  return String(value || '-')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const [search, setSearch] = useState('');
const [statusFilter, setStatusFilter] = useState('');
const [branchFilter, setBranchFilter] = useState('');
const [ownerFilter, setOwnerFilter] = useState('');
const [fromDate, setFromDate] = useState('');
const [toDate, setToDate] = useState('');
const [filtersLoaded, setFiltersLoaded] = useState(false);
const [projectOwners, setProjectOwners] = useState<ProjectOwner[]>([]);

useEffect(() => {
  const saved = localStorage.getItem('projectListFilters');

  if (!saved) {
    setFiltersLoaded(true);
    return;
  }

  try {
    const parsed = JSON.parse(saved);

    setSearch(parsed.search || '');
    setStatusFilter(parsed.statusFilter || '');
    setBranchFilter(parsed.branchFilter || '');
    setOwnerFilter(parsed.ownerFilter || '');
    setFromDate(parsed.fromDate || '');
    setToDate(parsed.toDate || '');
    setPage(Number(parsed.page || 1));
  } catch {
    localStorage.removeItem('projectListFilters');
  } finally {
    setFiltersLoaded(true);
  }
}, []);

useEffect(() => {
  localStorage.setItem(
    'projectListFilters',
    JSON.stringify({
      search,
      statusFilter,
      branchFilter,
      ownerFilter,
      fromDate,
      toDate,
      page,
    }),
  );
}, [
  search,
  statusFilter,
  branchFilter,
  ownerFilter,
  fromDate,
  toDate,
  page,
]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const res = await axios.get(`${API_BASE_URL}/project`, {
  params: {
    page,
    limit: 20,
    search,
    status: statusFilter,
    branch: branchFilter,
    owner: ownerFilter,
    fromDate,
toDate,
  },
  headers: token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {},
});

setProjects(res.data?.data || []);
setTotalPages(res.data?.totalPages || 1);
    } catch (error) {
      console.error('Failed to load projects:', error);
      alert('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectOwners = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/owners/list`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setProjectOwners(res.data || []);
  } catch (error) {
    console.error('Failed to load project owners:', error);
  }
};

const hideProject = async (projectId: number) => {
  const reason = window.prompt(
    'Why do you want to hide this project?',
    'Test / duplicate project',
  );

  if (reason === null) return;

  const confirmed = window.confirm(
    'This project will be hidden from project list, reports, payment collection, reminders and purchase orders. Continue?',
  );

  if (!confirmed) return;

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/${projectId}/hide`,
      { reason },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Project hidden successfully');
    fetchProjects();
  } catch (error: any) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
        'Failed to hide project',
    );
  }
};

  useEffect(() => {
  if (!filtersLoaded) return;
  fetchProjects();
}, [
  filtersLoaded,
  page,
  search,
  statusFilter,
  branchFilter,
  ownerFilter,
  fromDate,
  toDate,
]);

useEffect(() => {
  fetchProjectOwners();
}, []);

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-4 overflow-x-hidden px-2 pb-4 md:px-0">
      <div className="rounded-2xl bg-white p-4 shadow">
  <h1 className="text-2xl font-bold text-gray-800">
    Project Department
  </h1>

  <p className="mt-1 text-sm text-gray-500">
    Project orders, approvals, documents, and department workflow will be managed here.
  </p>

  <div className="mt-4 flex flex-wrap gap-3">
    <Link
      href="/project/create"
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      + Create Project
    </Link>
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
    <input
      placeholder="Search by name, phone, K No, or Project ID"
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(1);
      }}
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Filter by Branch"
      value={branchFilter}
      onChange={(e) => {
        setBranchFilter(e.target.value);
        setPage(1);
      }}
      className="rounded-xl border p-3"
    />

    <input
  type="date"
  value={fromDate}
  onChange={(e) => {
    setFromDate(e.target.value);
    setPage(1);
  }}
  className="rounded-xl border p-3"
/>

<input
  type="date"
  value={toDate}
  onChange={(e) => {
    setToDate(e.target.value);
    setPage(1);
  }}
  className="rounded-xl border p-3"
/>

    <select
  value={ownerFilter}
  onChange={(e) => {
    setOwnerFilter(e.target.value);
    setPage(1);
  }}
  className="rounded-xl border p-3"
>
  <option value="">All Project Owners</option>

  {projectOwners.map((owner) => (
    <option
      key={owner.projectOwnerId}
      value={owner.projectOwnerId}
    >
      {owner.projectOwnerName || 'Unnamed Owner'}
      {owner.projectOwnerRole
        ? ` (${owner.projectOwnerRole})`
        : ''}
    </option>
  ))}
</select>

    <select
      value={statusFilter}
      onChange={(e) => {
        setStatusFilter(e.target.value);
        setPage(1);
      }}
      className="rounded-xl border p-3"
    >
      <option value="">All Status</option>
      <option value="PENDING_APPROVAL">Pending Approval</option>
      <option value="APPROVED">Approved</option>
      <option value="REJECTED">Rejected</option>
      <option value="CANCELLED">Cancelled</option>
      <option value="LOAN_PROCESS">Loan Process</option>
      <option value="PROJECT_MANAGEMENT">Project Management</option>
      <option value="SUBSIDY_PROCESS">Subsidy Process</option>
      <option value="ELECTRICITY_PROCESS">Electricity Process</option>
      <option value="COMPLETED">Completed</option>
    </select>
  </div>

  <div className="mt-3 flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const formatDate = (date: Date) =>
        date.toISOString().slice(0, 10);

      setFromDate(formatDate(firstDay));
      setToDate(formatDate(lastDay));
      setPage(1);
    }}
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
  >
    This Month
  </button>

  <button
    type="button"
    onClick={() => {
      setSearch('');
      setStatusFilter('');
      setBranchFilter('');
      setOwnerFilter('');
      setFromDate('');
      setToDate('');
      setPage(1);
      localStorage.removeItem('projectListFilters');
    }}
    className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
  >
    Clear Filters
  </button>
</div>
</div>

      {loading ? (
        <div className="rounded-2xl bg-white p-4 shadow">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow">
          No projects found yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div
  key={project.id}
  className="min-w-0 overflow-hidden rounded-2xl bg-white p-3 shadow md:p-4"
>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="break-words text-lg font-bold text-gray-800">
                    #{project.id} - {project.customerName || 'Unnamed Customer'}
                  </h2>
                  <p className="break-words text-sm text-gray-500">
  {project.customerPhone || 'No phone'} |{' '}
  {project.branchName || 'No branch'} |{' '}
  {project.city || 'No city'} |{' '}
  {project.zone || 'No zone'}
</p>

<p className="mt-1 text-sm text-blue-700">
  Project Owner:{' '}
  <span className="font-semibold">
    {project.projectOwnerName || 'Not Assigned'}
  </span>
</p>
                </div>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {project.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Project Type</p>
                  <p className="font-semibold text-gray-800">{project.projectType || '-'}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Project Cost</p>
                  <p className="font-semibold text-gray-800">
                    ₹{Number(project.projectCost || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Net Amount</p>
                  <p className="font-semibold text-gray-800">
                    ₹{Number(project.netAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Created</p>
                  <p className="font-semibold text-gray-800">
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString('en-IN')
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
  <div className="rounded-xl bg-yellow-50 p-3">
    <p className="text-gray-500">Marketing Head Approval</p>
    <p className="font-semibold text-yellow-700">
      {project.marketingHeadApprovalStatus || 'PENDING'}
    </p>
  </div>

  <div className="rounded-xl bg-purple-50 p-3">
    <p className="text-gray-500">Owner Approval</p>
    <p className="font-semibold text-purple-700">
      {project.ownerApprovalStatus || 'PENDING'}
    </p>
  </div>
</div>

<div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
  <div className="rounded-xl bg-blue-50 p-3">
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-semibold text-gray-800">
        Execution Work
      </p>

      <p className="text-xs font-bold text-blue-700">
        {project.executionSummary?.completedActivities || 0}/
        {project.executionSummary?.totalActivities || 0} done ·{' '}
        {project.executionSummary?.percentage || 0}%
      </p>
    </div>

    <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
      <div
        className="h-full rounded-full bg-blue-600"
        style={{
          width: `${project.executionSummary?.percentage || 0}%`,
        }}
      />
    </div>

    <div className="mt-3 grid gap-2 text-xs text-gray-700 md:grid-cols-3">
      <div className="rounded-lg bg-white p-2">
        <p className="text-gray-500">Running</p>
        <p className="mt-1 font-semibold">
          {project.executionSummary?.runningActivity
            ? formatLabel(project.executionSummary.runningActivity)
            : '-'}
        </p>
      </div>

      <div className="rounded-lg bg-white p-2">
        <p className="text-gray-500">Done</p>
        <p className="mt-1 font-semibold">
          {project.executionSummary?.latestCompletedActivity
            ? formatLabel(project.executionSummary.latestCompletedActivity)
            : '-'}
        </p>
      </div>

      <div className="rounded-lg bg-white p-2">
        <p className="text-gray-500">Next</p>
        <p className="mt-1 font-semibold">
          {project.executionSummary?.nextPendingActivity
            ? formatLabel(project.executionSummary.nextPendingActivity)
            : '-'}
        </p>
      </div>
    </div>
  </div>

  <div className="rounded-xl bg-green-50 p-3">
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-semibold text-gray-800">
        Payment Received
      </p>

      <p className="text-xs font-bold text-green-700">
        {project.paymentSummary?.percentage || 0}%
      </p>
    </div>

    <div className="mt-2 h-2 overflow-hidden rounded-full bg-green-100">
      <div
        className="h-full rounded-full bg-green-600"
        style={{
          width: `${project.paymentSummary?.percentage || 0}%`,
        }}
      />
    </div>

    <div className="mt-3 grid gap-2 text-xs text-gray-700 md:grid-cols-2">
      <div className="rounded-lg bg-white p-2">
        <p className="text-gray-500">Received</p>
        <p className="mt-1 font-semibold text-green-700">
          {money(project.paymentSummary?.receivedAmount)}
        </p>
      </div>

      <div className="rounded-lg bg-white p-2">
        <p className="text-gray-500">Total</p>
        <p className="mt-1 font-semibold">
          {money(project.paymentSummary?.totalAmount)}
        </p>
      </div>
    </div>
  </div>
</div>

<div className="mt-4 flex flex-col gap-2 sm:flex-row">
  <Link
    href={`/project/${project.id}`}
    className="inline-block rounded-xl bg-gray-800 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-black"
  >
    View Details
  </Link>

  <button
    type="button"
    onClick={() => hideProject(project.id)}
    className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
  >
    Hide Project
  </button>
</div>
            </div>
          ))}
        </div>
      )}

    <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow md:flex-row md:items-center md:justify-between">
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
      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
      disabled={page >= totalPages}
      className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>

    </div>
  );
}