'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ContractorAssignment = {
  id: number;
  projectId: number;
  contractorId?: number;
  contractorName?: string;
  contractorPhone?: string;
  workScope?: string;
  status?: string;
  amount?: number;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  assignedByName?: string;
  createdAt?: string;
  proofProgress?: {
    uploadedRequiredCount: number;
    totalRequired: number;
    percentage: number;
  };
};

type Summary = {
  totalAssignments: number;
  totalProjects: number;
  totalContractors: number;
  assigned: number;
  inProgress: number;
  onHold: number;
  pendingFinalProofs: number;
  completed: number;
};

const emptySummary: Summary = {
  totalAssignments: 0,
  totalProjects: 0,
  totalContractors: 0,
  assigned: 0,
  inProgress: 0,
  onHold: 0,
  pendingFinalProofs: 0,
  completed: 0,
};

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN');
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-800">
        {value || 0}
      </p>
    </div>
  );
}

export default function ContractorAssignmentRegisterPage() {
  const [items, setItems] = useState<ContractorAssignment[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [projectIdFilter, setProjectIdFilter] = useState('');
  const [pendingRescheduleRequests, setPendingRescheduleRequests] =
  useState<any[]>([]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const res = await axios.get(
        `${API_BASE_URL}/project/contractor-assignments/register`,
        {
          params: {
            page,
            limit: 20,
            search,
            status: statusFilter,
            workScope: scopeFilter,
            projectId: projectIdFilter,
          },
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      setItems(Array.isArray(res.data?.data) ? res.data.data : []);
      setSummary(res.data?.summary || emptySummary);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to load contractor assignment register',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRescheduleRequests = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/contractor-reschedule/pending`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    setPendingRescheduleRequests(
      Array.isArray(res.data) ? res.data : [],
    );
  } catch (error) {
    console.error(error);
  }
};

const approveRescheduleRequest = async (id: number) => {
  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/contractor-reschedule/${id}/approve`,
      {},
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );

    alert('Postpone request approved');
    fetchPendingRescheduleRequests();
    fetchAssignments();
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Failed to approve request');
  }
};

const rejectRescheduleRequest = async (id: number) => {
  const approvalNote = window.prompt('Reason for rejection?', '');

  if (approvalNote === null) return;

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/contractor-reschedule/${id}/reject`,
      { approvalNote },
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );

    alert('Postpone request rejected');
    fetchPendingRescheduleRequests();
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Failed to reject request');
  }
};

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setScopeFilter('');
    setProjectIdFilter('');
    setPage(1);

    setTimeout(fetchAssignments, 0);
  };

  useEffect(() => {
    fetchAssignments();
    fetchPendingRescheduleRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-4 overflow-x-hidden px-2 pb-4 md:px-0">
      <div className="rounded-2xl bg-white p-5 shadow">
        <Link href="/project" className="text-sm font-semibold text-blue-600">
          ← Back to Projects
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-800">
          Contractor Assignment Register
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Monitor all project contractor/team assignments, proof progress, and work status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Assignments" value={summary.totalAssignments} />
        <SummaryCard title="Total Projects" value={summary.totalProjects} />
        <SummaryCard title="Total Contractors" value={summary.totalContractors} />
        <SummaryCard title="Assigned" value={summary.assigned} />
        <SummaryCard title="In Progress" value={summary.inProgress} />
        <SummaryCard title="Pending Final Proofs" value={summary.pendingFinalProofs} />
        <SummaryCard title="On Hold" value={summary.onHold} />
        <SummaryCard title="Completed" value={summary.completed} />

        <Link
  href="/project/contractor-postpone-requests"
  className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow transition hover:-translate-y-1 hover:shadow-lg"
>
  <p className="text-sm font-semibold text-amber-700">
    Pending Postpone Requests
  </p>

  <p className="mt-2 text-3xl font-bold text-gray-900">
    {pendingRescheduleRequests.length}
  </p>

  <p className="mt-1 text-xs text-gray-500">
    Click to review and approve requests
  </p>
</Link>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">Filters</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            placeholder="Search contractor / phone / project ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Status</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="PENDING_FINAL_PROOFS">Pending Final Proofs</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Scopes</option>
            <option value="FULL_PROJECT">Full Project</option>
            <option value="STRUCTURE_TEAM">Structure Team</option>
            <option value="ELECTRICAL_TEAM">Electrical Team</option>
            <option value="INSTALLATION_TEAM">Installation Team</option>
            <option value="OTHER">Other</option>
          </select>

          <input
            placeholder="Project ID"
            value={projectIdFilter}
            onChange={(e) => setProjectIdFilter(e.target.value)}
            className="rounded-xl border p-3"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setPage(1);
              fetchAssignments();
            }}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>

          <button
            onClick={resetFilters}
            className="rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            Assignment List
          </h2>

          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading contractor assignments...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">No contractor assignments found.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const progress = item.proofProgress || {
                uploadedRequiredCount: 0,
                totalRequired: 0,
                percentage: 0,
              };

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-gray-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          Project #{item.projectId}
                        </h3>

                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                          {formatLabel(item.workScope)}
                        </span>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {formatLabel(item.status)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-gray-700">
                        {item.contractorName || `Contractor #${item.contractorId || '-'}`}
                      </p>

                      <p className="text-sm text-gray-500">
                        Phone: {item.contractorPhone || '-'}
                      </p>

                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                        <Info label="Amount" value={money(item.amount)} />
                        <Info label="Scheduled" value={formatDate(item.scheduledDate)} />
                        <Info label="Started" value={formatDate(item.startedAt)} />
                        <Info label="Completed" value={formatDate(item.completedAt)} />
                        <Info label="Assigned By" value={item.assignedByName || '-'} />
                        <Info label="Created" value={formatDate(item.createdAt)} />
                      </div>

                      <div className="mt-4 rounded-xl border bg-white p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <p className="text-sm font-bold text-gray-800">
                            Proof Progress
                          </p>

                          <p className="text-sm font-bold text-blue-700">
                            {progress.uploadedRequiredCount} / {progress.totalRequired}{' '}
                            uploaded ({progress.percentage}%)
                          </p>
                        </div>

                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{
                              width: `${progress.percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:w-[160px]">
                      <Link
                        href={`/project/${item.projectId}`}
                        className="rounded-xl bg-gray-800 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-black"
                      >
                        Open Project
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-gray-800">
        {value || '-'}
      </p>
    </div>
  );
}