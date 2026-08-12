'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type InsuranceDashboard = {
  total: number;
  active: number;
  expired: number;
  expiringWithin7Days: number;
  expiringToday: number;
  renewalRequested: number;
  pendingRequests: number;
};

type InsuranceRecord = {
  id: number;

  projectId: number;
  customerId: number;

  customerCode?: string;
  customerName?: string;
  customerPhone?: string;

  city?: string;
  branchName?: string;

  insurancePlanId?: number;
  previousInsuranceId?: number;

  companyName: string;
  policyName: string;
  policyNumber?: string;

  policyCost: number;
  coverageAmount?: number;

  startDate: string;
  expiryDate: string;

  status: string;

  remarks?: string;

  daysToExpiry?: number;

  computedExpiryState?: string;

  createdAt?: string;
  updatedAt?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const emptyDashboard: InsuranceDashboard = {
  total: 0,
  active: 0,
  expired: 0,
  expiringWithin7Days: 0,
  expiringToday: 0,
  renewalRequested: 0,
  pendingRequests: 0,
};

const emptyPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

const emptyFilters = {
  search: '',
  status: '',
  expiryFilter: '',
  companyName: '',
  city: '',
  branchName: '',
  projectId: '',
  fromDate: '',
  toDate: '',
};

function formatMoney(value: any) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    },
  )}`;
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(date);
}

function formatLabel(value?: string) {
  return String(value || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function DashboardCard({
  title,
  value,
  subtitle,
  onClick,
  active = false,
}: {
  title: string;
  value: number;
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-3xl border p-5 text-left shadow-sm transition',
        onClick
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
          : '',
        active
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-200 bg-white text-gray-900',
      ].join(' ')}
    >
      <p
        className={[
          'text-sm font-bold',
          active
            ? 'text-white/80'
            : 'text-gray-500',
        ].join(' ')}
      >
        {title}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>

      {subtitle && (
        <p
          className={[
            'mt-1 text-xs',
            active
              ? 'text-white/70'
              : 'text-gray-400',
          ].join(' ')}
        >
          {subtitle}
        </p>
      )}
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status?: string;
}) {
  const normalized =
    String(status || '')
      .trim()
      .toUpperCase();

  let className =
    'bg-gray-100 text-gray-700';

  if (
    normalized === 'ACTIVE'
  ) {
    className =
      'bg-emerald-100 text-emerald-800';
  }

  if (
    normalized === 'EXPIRED'
  ) {
    className =
      'bg-red-100 text-red-800';
  }

  if (
    normalized ===
    'RENEWAL_REQUESTED'
  ) {
    className =
      'bg-amber-100 text-amber-800';
  }

  if (
    normalized === 'RENEWED'
  ) {
    className =
      'bg-blue-100 text-blue-800';
  }

  if (
    normalized === 'CANCELLED'
  ) {
    className =
      'bg-gray-200 text-gray-700';
  }

  if (
    normalized === 'REQUESTED'
  ) {
    className =
      'bg-purple-100 text-purple-800';
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${className}`}
    >
      {formatLabel(
        normalized || 'UNKNOWN',
      )}
    </span>
  );
}

function ExpiryBadge({
  item,
}: {
  item: InsuranceRecord;
}) {
  const state =
    String(
      item.computedExpiryState ||
        '',
    ).toUpperCase();

  if (
    state === 'EXPIRED'
  ) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">
        Expired
      </span>
    );
  }

  if (
    state ===
    'EXPIRING_TODAY'
  ) {
    return (
      <span className="inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
        Expires Today
      </span>
    );
  }

  if (
    state ===
    'EXPIRING_WITHIN_7_DAYS'
  ) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
        {Number(
          item.daysToExpiry ||
            0,
        )}{' '}
        Day
        {Number(
          item.daysToExpiry ||
            0,
        ) === 1
          ? ''
          : 's'}{' '}
        Left
      </span>
    );
  }

  if (
    Number.isFinite(
      Number(
        item.daysToExpiry,
      ),
    )
  ) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        {Number(
          item.daysToExpiry,
        )}{' '}
        days left
      </span>
    );
  }

  return null;
}

export default function InsuranceManagementPage() {
  const [
    dashboard,
    setDashboard,
  ] =
    useState<InsuranceDashboard>(
      emptyDashboard,
    );

  const [
    items,
    setItems,
  ] =
    useState<
      InsuranceRecord[]
    >([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>(
      emptyPagination,
    );

  const [
    filters,
    setFilters,
  ] =
    useState(
      emptyFilters,
    );

  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState(
      emptyFilters,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    dashboardLoading,
    setDashboardLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

    const [
  reminders,
  setReminders,
] =
  useState<any[]>([]);

const [
  unreadReminderCount,
  setUnreadReminderCount,
] =
  useState(0);

  const headers = () => {
    const token =
      localStorage.getItem(
        'token',
      );

    return {
      Authorization:
        `Bearer ${token}`,
    };
  };

  const loadDashboard =
    useCallback(
      async () => {
        try {
          setDashboardLoading(
            true,
          );

          const res =
            await axios.get(
              `${API_BASE_URL}/project/insurance/dashboard`,
              {
                headers:
                  headers(),
              },
            );

          setDashboard({
            ...emptyDashboard,
            ...(res.data ||
              {}),
          });
        } catch (
          error: any
        ) {
          console.error(
            error,
          );
        } finally {
          setDashboardLoading(
            false,
          );
        }
      },
      [],
    );

    const loadInsuranceReminders =
  async () => {
    try {
      const [
        remindersRes,
        countRes,
      ] =
        await Promise.all([
          axios.get(
            `${API_BASE_URL}/project/insurance/reminders`,
            {
              headers:
                headers(),
            },
          ),

          axios.get(
            `${API_BASE_URL}/project/insurance/reminders/unread-count`,
            {
              headers:
                headers(),
            },
          ),
        ]);

      setReminders(
        Array.isArray(
          remindersRes.data,
        )
          ? remindersRes.data
          : [],
      );

      setUnreadReminderCount(
        Number(
          countRes.data
            ?.count ||
            0,
        ),
      );
    } catch (
      error
    ) {
      console.error(
        'Insurance reminders error:',
        error,
      );
    }
  };

  const markInsuranceReminderRead =
  async (
    reminder: any,
  ) => {
    await axios.post(
      `${API_BASE_URL}/project/reminders/mark-read`,
      {
        reminderSource:
          'INSURANCE',

        reminderType:
          reminder.reminderType,

        referenceId:
          reminder.insuranceId,

        projectId:
          reminder.projectId,
      },
      {
        headers:
          headers(),
      },
    );

    await loadInsuranceReminders();
  };

  const dismissInsuranceReminder =
  async (
    reminder: any,
  ) => {
    await axios.post(
      `${API_BASE_URL}/project/reminders/dismiss`,
      {
        reminderSource:
          'INSURANCE',

        reminderType:
          reminder.reminderType,

        referenceId:
          reminder.insuranceId,

        projectId:
          reminder.projectId,
      },
      {
        headers:
          headers(),
      },
    );

    await loadInsuranceReminders();
  };

  const loadInsurance =
    useCallback(
      async (
        page = 1,
        currentFilters =
          appliedFilters,
      ) => {
        try {
          setLoading(true);
          setError('');

          const res =
            await axios.get(
              `${API_BASE_URL}/project/insurance/register`,
              {
                headers:
                  headers(),

                params: {
                  page,

                  limit:
                    20,

                  search:
                    currentFilters.search ||
                    undefined,

                  status:
                    currentFilters.status ||
                    undefined,

                  expiryFilter:
                    currentFilters.expiryFilter ||
                    undefined,

                  companyName:
                    currentFilters.companyName ||
                    undefined,

                  city:
                    currentFilters.city ||
                    undefined,

                  branchName:
                    currentFilters.branchName ||
                    undefined,

                  projectId:
                    currentFilters.projectId ||
                    undefined,

                  fromDate:
                    currentFilters.fromDate ||
                    undefined,

                  toDate:
                    currentFilters.toDate ||
                    undefined,
                },
              },
            );

          setItems(
            Array.isArray(
              res.data?.data,
            )
              ? res.data.data
              : [],
          );

          setPagination({
            ...emptyPagination,
            ...(res.data
              ?.pagination ||
              {}),
          });
        } catch (
          error: any
        ) {
          console.error(
            error,
          );

          setItems([]);

          setError(
            error?.response
              ?.data
              ?.message ||
              'Failed to load insurance records',
          );
        } finally {
          setLoading(false);
        }
      },
      [appliedFilters],
    );

  useEffect(() => {
  loadDashboard();

  loadInsurance(
    1,
    appliedFilters,
  );

  loadInsuranceReminders();
}, []);

  const applyFilters =
    async () => {
      const next = {
        ...filters,
      };

      setAppliedFilters(
        next,
      );

      await loadInsurance(
        1,
        next,
      );
    };

  const clearFilters =
    async () => {
      const next = {
        ...emptyFilters,
      };

      setFilters(next);

      setAppliedFilters(
        next,
      );

      await loadInsurance(
        1,
        next,
      );
    };

  const applyQuickExpiryFilter =
    async (
      expiryFilter:
        | ''
        | 'WITHIN_7_DAYS'
        | 'EXPIRING_TODAY'
        | 'EXPIRED',
    ) => {
      const next = {
        ...filters,

        status: '',

        expiryFilter,
      };

      setFilters(next);

      setAppliedFilters(
        next,
      );

      await loadInsurance(
        1,
        next,
      );
    };

  const applyStatusFilter =
    async (
      status: string,
    ) => {
      const next = {
        ...filters,

        expiryFilter:
          '',

        status,
      };

      setFilters(next);

      setAppliedFilters(
        next,
      );

      await loadInsurance(
        1,
        next,
      );
    };

  const refreshEverything =
    async () => {
      await Promise.all([
  loadDashboard(),

  loadInsurance(
    pagination.page,
    appliedFilters,
  ),

  loadInsuranceReminders(),
]);
    };

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/customer-portal-management"
          className="inline-flex rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white hover:bg-black"
        >
          ← Customer Portal Dashboard
        </Link>

        <button
          type="button"
          onClick={
            refreshEverything
          }
          className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-800 shadow-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <section className="rounded-[2rem] bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 p-6 text-white shadow-2xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-white/75">
              Customer Portal Management
            </p>

            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              Insurance Management
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold text-white/85">
              Manage insurance
              plans, completed
              project policies,
              renewals, documents
              and expiry
              reminders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/customer-portal-management/insurance/plans"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-indigo-700 shadow"
            >
              Insurance Plans
            </Link>

            <Link
              href="/customer-portal-management/insurance/requests"
              className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-black text-white ring-1 ring-white/30"
            >
              Requests & Renewals
            </Link>

            <Link
              href="/customer-portal-management/insurance/add"
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow"
            >
              + Add Existing Policy
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Policies"
          value={
            dashboardLoading
              ? 0
              : dashboard.total
          }
          subtitle="All insurance records"
          active={
            !appliedFilters.status &&
            !appliedFilters.expiryFilter
          }
          onClick={() =>
            clearFilters()
          }
        />

        <DashboardCard
          title="Active"
          value={
            dashboardLoading
              ? 0
              : dashboard.active
          }
          subtitle="Currently valid"
          active={
            appliedFilters.status ===
            'ACTIVE'
          }
          onClick={() =>
            applyStatusFilter(
              'ACTIVE',
            )
          }
        />

        <DashboardCard
          title="Expiring in 7 Days"
          value={
            dashboardLoading
              ? 0
              : dashboard.expiringWithin7Days
          }
          subtitle="Renewal attention required"
          active={
            appliedFilters.expiryFilter ===
            'WITHIN_7_DAYS'
          }
          onClick={() =>
            applyQuickExpiryFilter(
              'WITHIN_7_DAYS',
            )
          }
        />

        <DashboardCard
          title="Expiring Today"
          value={
            dashboardLoading
              ? 0
              : dashboard.expiringToday
          }
          subtitle="Immediate attention"
          active={
            appliedFilters.expiryFilter ===
            'EXPIRING_TODAY'
          }
          onClick={() =>
            applyQuickExpiryFilter(
              'EXPIRING_TODAY',
            )
          }
        />

        <DashboardCard
          title="Expired"
          value={
            dashboardLoading
              ? 0
              : dashboard.expired
          }
          subtitle="Past expiry date"
          active={
            appliedFilters.expiryFilter ===
            'EXPIRED'
          }
          onClick={() =>
            applyQuickExpiryFilter(
              'EXPIRED',
            )
          }
        />

        <DashboardCard
          title="Renewal Requested"
          value={
            dashboardLoading
              ? 0
              : dashboard.renewalRequested
          }
          subtitle="Customer renewal interest"
          active={
            appliedFilters.status ===
            'RENEWAL_REQUESTED'
          }
          onClick={() =>
            applyStatusFilter(
              'RENEWAL_REQUESTED',
            )
          }
        />

        <DashboardCard
          title="Pending Requests"
          value={
            dashboardLoading
              ? 0
              : dashboard.pendingRequests
          }
          subtitle="Awaiting staff action"
        />
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-xl font-black text-gray-900">
        Insurance Expiry Reminders
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Policies requiring renewal attention.
      </p>
    </div>

    <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-black text-red-700">
      {unreadReminderCount} Unread
    </span>
  </div>

  {reminders.length === 0 ? (
    <div className="mt-5 rounded-2xl bg-gray-50 p-6 text-center text-sm font-bold text-gray-500">
      No insurance expiry reminders today.
    </div>
  ) : (
    <div className="mt-5 space-y-3">
      {reminders.map(
        (
          reminder,
        ) => (
          <div
            key={`${reminder.reminderType}-${reminder.insuranceId}`}
            className={[
              'rounded-2xl border p-4',
              reminder.reminderType ===
              'INSURANCE_EXPIRY_TODAY'
                ? 'border-red-200 bg-red-50'
                : 'border-amber-200 bg-amber-50',
            ].join(' ')}
          >
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="font-black text-gray-900">
                  {reminder.title}
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-700">
                  {reminder.message}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  {reminder.customerName || 'Customer'}
                  {' · '}
                  Project #{reminder.projectId}
                  {' · '}
                  {reminder.companyName}
                  {' · '}
                  Expiry {formatDate(reminder.expiryDate)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/customer-portal-management/insurance/${reminder.insuranceId}`}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-black text-white"
                >
                  View Policy
                </Link>

                {reminder.userReminderStatus ===
                  'UNREAD' && (
                  <button
                    type="button"
                    onClick={() =>
                      markInsuranceReminderRead(
                        reminder,
                      )
                    }
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white"
                  >
                    Mark Read
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    dismissInsuranceReminder(
                      reminder,
                    )
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  )}
</section>

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              Insurance Register
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Search and filter
              insured customers and
              expiry dates.
            </p>
          </div>

          <div className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-700">
            {
              pagination.total
            }{' '}
            record
            {pagination.total ===
            1
              ? ''
              : 's'}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            value={
              filters.search
            }
            onChange={(
              event,
            ) =>
              setFilters({
                ...filters,

                search:
                  event.target
                    .value,
              })
            }
            placeholder="Customer / phone / K number / policy"
            className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-800"
          />

          <input
            value={
              filters.projectId
            }
            onChange={(
              event,
            ) =>
              setFilters({
                ...filters,

                projectId:
                  event.target
                    .value,
              })
            }
            placeholder="Project ID"
            inputMode="numeric"
            className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-800"
          />

          <select
            value={
              filters.status
            }
            onChange={(
              event,
            ) =>
              setFilters({
                ...filters,

                status:
                  event.target
                    .value,
              })
            }
            className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-800"
          >
            <option value="">
              All Status
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="REQUESTED">
              Requested
            </option>

            <option value="RENEWAL_REQUESTED">
              Renewal Requested
            </option>

            <option value="RENEWED">
              Renewed
            </option>

            <option value="EXPIRED">
              Expired
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>

          <select
            value={
              filters.expiryFilter
            }
            onChange={(
              event,
            ) =>
              setFilters({
                ...filters,

                expiryFilter:
                  event.target
                    .value,
              })
            }
            className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-800"
          >
            <option value="">
              All Expiry Dates
            </option>

            <option value="WITHIN_7_DAYS">
              Expiring Within 7 Days
            </option>

            <option value="EXPIRING_TODAY">
              Expiring Today
            </option>

            <option value="EXPIRED">
              Already Expired
            </option>
          </select>

          <input
            value={
              filters.companyName
            }
            onChange={(
              event,
            ) =>
              setFilters({
                ...filters,

                companyName:
                  event.target
                    .value,
              })
            }
            placeholder="Insurance company"
            className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-800"
          />

          <input
            value={
              filters.city
            }
            onChange={(
              event,
            ) =>
              setFilters({
                ...filters,

                city:
                  event.target
                    .value,
              })
            }
            placeholder="City"
            className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-800"
          />

          <input
            value={
              filters.branchName
            }
            onChange={(
              event,
            ) =>
              setFilters({
                ...filters,

                branchName:
                  event.target
                    .value,
              })
            }
            placeholder="Branch"
            className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-800"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={
                filters.fromDate
              }
              onChange={(
                event,
              ) =>
                setFilters({
                  ...filters,

                  fromDate:
                    event.target
                      .value,
                })
              }
              className="min-w-0 rounded-2xl border border-gray-300 px-3 py-3 text-sm"
            />

            <input
              type="date"
              value={
                filters.toDate
              }
              onChange={(
                event,
              ) =>
                setFilters({
                  ...filters,

                  toDate:
                    event.target
                      .value,
                })
              }
              className="min-w-0 rounded-2xl border border-gray-300 px-3 py-3 text-sm"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={
              applyFilters
            }
            className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-black text-white hover:bg-black"
          >
            Apply Filters
          </button>

          <button
            type="button"
            onClick={
              clearFilters
            }
            className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-black text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
        {loading ? (
          <div className="p-10 text-center text-sm font-bold text-gray-500">
            Loading insurance
            records...
          </div>
        ) : items.length ===
          0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-black text-gray-800">
              No insurance
              records found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Try changing the
              filters or add an
              existing customer
              insurance policy.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Customer',
                      'Project',
                      'Insurance',
                      'Policy',
                      'Cost',
                      'Start',
                      'Expiry',
                      'Status',
                      'Action',
                    ].map(
                      (
                        heading,
                      ) => (
                        <th
                          key={
                            heading
                          }
                          className="whitespace-nowrap px-4 py-4 text-left text-xs font-black uppercase tracking-wide text-gray-500"
                        >
                          {
                            heading
                          }
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {items.map(
                    (
                      item,
                    ) => (
                      <tr
                        key={
                          item.id
                        }
                        className="align-top hover:bg-gray-50"
                      >
                        <td className="px-4 py-4">
                          <p className="font-black text-gray-900">
                            {item.customerName ||
                              '-'}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-gray-500">
                            {item.customerPhone ||
                              '-'}
                          </p>

                          {item.customerCode && (
                            <p className="mt-1 text-xs text-gray-400">
                              {
                                item.customerCode
                              }
                            </p>
                          )}

                          <p className="mt-1 text-xs text-gray-400">
                            {item.city ||
                              '-'}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <Link
                            href={`/project/${item.projectId}`}
                            className="font-black text-blue-700 hover:underline"
                          >
                            #
                            {
                              item.projectId
                            }
                          </Link>

                          <p className="mt-1 text-xs text-gray-500">
                            {item.branchName ||
                              '-'}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-black text-gray-900">
                            {
                              item.companyName
                            }
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {
                              item.policyName
                            }
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-bold text-gray-800">
                            {item.policyNumber ||
                              'Not entered'}
                          </p>

                          {item.coverageAmount !==
                            undefined &&
                            item.coverageAmount !==
                              null && (
                              <p className="mt-1 text-xs text-gray-500">
                                Cover:{' '}
                                {formatMoney(
                                  item.coverageAmount,
                                )}
                              </p>
                            )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-black text-gray-900">
                          {formatMoney(
                            item.policyCost,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700">
                          {formatDate(
                            item.startDate,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <p className="text-sm font-black text-gray-900">
                            {formatDate(
                              item.expiryDate,
                            )}
                          </p>

                          <div className="mt-2">
                            <ExpiryBadge
                              item={
                                item
                              }
                            />
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <StatusBadge
                            status={
                              item.status
                            }
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <Link
                            href={`/customer-portal-management/insurance/${item.id}`}
                            className="inline-flex rounded-xl bg-gray-900 px-3 py-2 text-xs font-black text-white hover:bg-black"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-4 lg:hidden">
              {items.map(
                (
                  item,
                ) => (
                  <div
                    key={
                      item.id
                    }
                    className="rounded-3xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-gray-900">
                          {item.customerName ||
                            '-'}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.customerPhone ||
                            '-'}
                        </p>
                      </div>

                      <StatusBadge
                        status={
                          item.status
                        }
                      />
                    </div>

                    <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                      <p className="font-black text-gray-900">
                        {
                          item.companyName
                        }
                      </p>

                      <p className="text-sm text-gray-600">
                        {
                          item.policyName
                        }
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        Policy:{' '}
                        {item.policyNumber ||
                          'Not entered'}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-bold text-gray-400">
                          Project
                        </p>

                        <p className="font-black text-gray-800">
                          #
                          {
                            item.projectId
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-400">
                          Cost
                        </p>

                        <p className="font-black text-gray-800">
                          {formatMoney(
                            item.policyCost,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-400">
                          Start
                        </p>

                        <p className="font-bold text-gray-700">
                          {formatDate(
                            item.startDate,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-400">
                          Expiry
                        </p>

                        <p className="font-bold text-gray-700">
                          {formatDate(
                            item.expiryDate,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <ExpiryBadge
                        item={
                          item
                        }
                      />
                    </div>

                    <Link
                      href={`/customer-portal-management/insurance/${item.id}`}
                      className="mt-4 flex w-full justify-center rounded-2xl bg-gray-900 px-4 py-3 text-sm font-black text-white"
                    >
                      View Insurance
                    </Link>
                  </div>
                ),
              )}
            </div>
          </>
        )}

        {!loading &&
          pagination.totalPages >
            1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-4">
              <p className="text-sm font-bold text-gray-500">
                Page{' '}
                {
                  pagination.page
                }{' '}
                of{' '}
                {
                  pagination.totalPages
                }
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    pagination.page <=
                    1
                  }
                  onClick={() =>
                    loadInsurance(
                      pagination.page -
                        1,
                      appliedFilters,
                    )
                  }
                  className="rounded-xl border px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    loadInsurance(
                      pagination.page +
                        1,
                      appliedFilters,
                    )
                  }
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </section>
    </main>
  );
}