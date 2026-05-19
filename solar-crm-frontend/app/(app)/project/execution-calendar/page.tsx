'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type ExecutionActivity = {
  id: number;
  projectId: number;
  activityType?: string;
  status?: string;
  scheduledDate?: string;
  completedDate?: string;
  inspectionDeadline?: string;
  remarks?: string;

  project?: {
    customerName?: string;
    branchName?: string;
    projectOwnerName?: string;
  };
};

export default function ExecutionCalendarPage() {
  const [activities, setActivities] =
    useState<ExecutionActivity[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [dateFilter, setDateFilter] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

    const [branchFilter, setBranchFilter] =
  useState('');

const [customerFilter, setCustomerFilter] =
  useState('');

const [ownerFilter, setOwnerFilter] =
  useState('');

const [overdueOnly, setOverdueOnly] =
  useState(false);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem('token');

      const res = await axios.get(
        `${API_BASE_URL}/project/execution-calendar`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      setActivities(
        Array.isArray(res.data)
          ? res.data
          : [],
      );
    } catch (error) {
      console.error(error);
      alert(
        'Failed to load execution calendar',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const branchOptions = Array.from(
  new Set(
    activities
      .map((activity) =>
        activity.project?.branchName || '',
      )
      .filter(Boolean),
  ),
);

const ownerOptions = Array.from(
  new Set(
    activities
      .map((activity) =>
        activity.project?.projectOwnerName || '',
      )
      .filter(Boolean),
  ),
);

  const filteredActivities =
    activities.filter((activity) => {
      const matchesDate = dateFilter
        ? activity.scheduledDate?.startsWith(
            dateFilter,
          )
        : true;

      const matchesStatus = statusFilter
        ? activity.status === statusFilter
        : true;

        const matchesBranch = branchFilter
  ? activity.project?.branchName === branchFilter
  : true;

const matchesCustomer = customerFilter
  ? String(activity.project?.customerName || '')
      .toLowerCase()
      .includes(customerFilter.toLowerCase())
  : true;

const matchesOwner = ownerFilter
  ? activity.project?.projectOwnerName === ownerFilter
  : true;

const matchesOverdue = overdueOnly
  ? activity.status === 'OVERDUE'
  : true;

      return (
  matchesDate &&
  matchesStatus &&
  matchesBranch &&
  matchesCustomer &&
  matchesOwner &&
  matchesOverdue
);
    });

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Execution Calendar
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Track execution activities, inspections,
          deadlines and overdue work calendar-wise.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1 text-sm font-semibold text-gray-700">
              Scheduled Date
            </p>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value)
              }
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-gray-700">
              Status
            </p>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="w-full rounded-xl border p-3"
            >
              <option value="">
                All Status
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="OVERDUE">
                Overdue
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </div>

          <div>
  <p className="mb-1 text-sm font-semibold text-gray-700">
    Branch
  </p>

  <select
    value={branchFilter}
    onChange={(e) =>
      setBranchFilter(e.target.value)
    }
    className="w-full rounded-xl border p-3"
  >
    <option value="">All Branches</option>

    {branchOptions.map((branch) => (
      <option key={branch} value={branch}>
        {branch}
      </option>
    ))}
  </select>
</div>

<div>
  <p className="mb-1 text-sm font-semibold text-gray-700">
    Customer Name
  </p>

  <input
    placeholder="Search customer"
    value={customerFilter}
    onChange={(e) =>
      setCustomerFilter(e.target.value)
    }
    className="w-full rounded-xl border p-3"
  />
</div>

<div>
  <p className="mb-1 text-sm font-semibold text-gray-700">
    Project Owner
  </p>

  <select
    value={ownerFilter}
    onChange={(e) =>
      setOwnerFilter(e.target.value)
    }
    className="w-full rounded-xl border p-3"
  >
    <option value="">All Owners</option>

    {ownerOptions.map((owner) => (
      <option key={owner} value={owner}>
        {owner}
      </option>
    ))}
  </select>
</div>

<label className="flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold text-gray-700">
  <input
    type="checkbox"
    checked={overdueOnly}
    onChange={(e) =>
      setOverdueOnly(e.target.checked)
    }
  />

  Show overdue only
</label>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl bg-white p-5 shadow">
            Loading...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 shadow text-sm text-gray-500">
            No execution activities found.
          </div>
        ) : (
          filteredActivities.map(
            (activity) => (
              <div
                key={activity.id}
                className={`rounded-2xl border p-5 shadow ${
                  activity.status ===
                  'OVERDUE'
                    ? 'border-red-300 bg-red-50'
                    : activity.status ===
                        'COMPLETED'
                      ? 'border-green-300 bg-green-50'
                      : activity.status ===
                          'IN_PROGRESS'
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'bg-white'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      {activity.activityType}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Customer:{' '}
                      {activity.project
                        ?.customerName || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Branch:{' '}
                      {activity.project
                        ?.branchName || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Project Owner:{' '}
                      {activity.project
                        ?.projectOwnerName ||
                        '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Scheduled:{' '}
                      {activity.scheduledDate
                        ? new Date(
                            activity.scheduledDate,
                          ).toLocaleDateString(
                            'en-IN',
                          )
                        : '-'}
                    </p>

                    {activity.inspectionDeadline && (
                      <p className="mt-1 text-sm font-semibold text-red-700">
                        Deadline:{' '}
                        {new Date(
                          activity.inspectionDeadline,
                        ).toLocaleDateString(
                          'en-IN',
                        )}
                      </p>
                    )}

                    {activity.remarks && (
                      <p className="mt-2 text-sm text-gray-700">
                        {activity.remarks}
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      activity.status ===
                      'OVERDUE'
                        ? 'bg-red-100 text-red-700'
                        : activity.status ===
                            'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : activity.status ===
                              'IN_PROGRESS'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}