'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import IncentiveSettlementModal from './IncentiveSettlementModal';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

const BASE_URL =
  `${API_BASE_URL}/solar-mitra/network`;

type Money = number | string;

type PayoutStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'RETAINED'
  | 'CANCELLED'
  | 'RECOVERY_PENDING'
  | 'RECOVERED';

type NetworkPayout = {
  id: number;
  poolId: number;
  projectId: number;
  referralId: number;

  sourceSolarMitraId: number;
  sourceSolarMitraName: string;

  beneficiaryUserId: number;
  beneficiaryName: string;
  beneficiaryRole: string;
  beneficiarySolarMitraId?: number | null;

  customerName?: string | null;

  networkLevel: number;
  payoutAmount: Money;
  status: PayoutStatus;

  poolAmount: Money;
  totalUplineCount: number;
  eligibleUplineCount: number;
  inactiveUplineCount: number;
  distributableAmount: Money;
  retainedAmount: Money;
  poolStatus: string;

  eligibleAt: string;

  approvedAt?: string | null;
  approvedByName?: string | null;

  paidAt?: string | null;
  paidByName?: string | null;

  paymentMode?: string | null;
  paymentReference?: string | null;
  settlementType?: string | null;

  payrollId?: number | null;
  payrollReservedAt?: string | null;

  recoveryAmount: Money;
  recoveredAmount: Money;
  outstandingRecovery: Money;
  recoveryDeductedAmount: Money;
  netPaidAmount?: Money | null;
  recoveredAt?: string | null;

  cancelledAt?: string | null;
  cancellationReason?: string | null;
  remarks?: string | null;
};

type PayoutResponse = {
  data: NetworkPayout[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  summary: {
    totalAmount: Money;
    outstandingRecovery: Money;
  };
};

type Filters = {
  search: string;
  status: string;
  month: string;
  projectId: string;
  beneficiaryUserId: string;
  sourceSolarMitraId: string;
  poolId: string;
  beneficiaryRole: string;
};

const EMPTY_FILTERS: Filters = {
  search: '',
  status: 'ALL',
  month: '',
  projectId: '',
  beneficiaryUserId: '',
  sourceSolarMitraId: '',
  poolId: '',
  beneficiaryRole: '',
};

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  {
    value: 'PENDING_APPROVAL',
    label: 'Pending Approval',
  },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PAID', label: 'Paid' },
  { value: 'RETAINED', label: 'Company Retained' },
  { value: 'CANCELLED', label: 'Cancelled' },
  {
    value: 'RECOVERY_PENDING',
    label: 'Recovery Pending',
  },
  { value: 'RECOVERED', label: 'Recovered' },
];

const STATUS_COLORS: Record<PayoutStatus, string> = {
  PENDING_APPROVAL:
    'border-orange-200 bg-orange-50 text-orange-700',

  APPROVED:
    'border-blue-200 bg-blue-50 text-blue-700',

  PAID:
    'border-green-200 bg-green-50 text-green-700',

  RETAINED:
    'border-gray-300 bg-gray-100 text-gray-700',

  CANCELLED:
    'border-red-200 bg-red-50 text-red-700',

  RECOVERY_PENDING:
    'border-red-200 bg-red-50 text-red-700',

  RECOVERED:
    'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function formatMoney(value?: Money | null) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('en-IN');
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRole(value?: string | null) {
  if (!value) return '—';

  if (value === 'FRANCHISE_HEAD') {
    return 'Solar Mitra Head';
  }

  if (value === 'FRANCHISE_MANAGER') {
    return 'Solar Mitra Manager';
  }

  return value
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(' ');
}

function getErrorMessage(
  error: any,
  fallback: string,
) {
  const message = error?.response?.data?.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return fallback;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function PayoutCard({
  payout,
  selected,
  canApprove,
  canPay,
  busy,
  onSelect,
  onApprove,
  onSettle,
}: {
  payout: NetworkPayout;
  selected: boolean;
  canApprove: boolean;
  canPay: boolean;
  busy: boolean;
  onSelect: (checked: boolean) => void;
  onApprove: () => void;
  onSettle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const isPending =
    payout.status === 'PENDING_APPROVAL';

    const canSettle =
  canPay &&
  payout.status === 'APPROVED' &&
  payout.poolStatus === 'GENERATED' &&
  !payout.payrollId &&
  !payout.paidAt &&
  !payout.settlementType;

  return (
    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

      <div className="flex flex-wrap items-start justify-between gap-3">

        <div className="flex min-w-0 items-start gap-3">

          {canApprove && isPending && (
            <input
              type="checkbox"
              aria-label={`Select payout ${payout.id}`}
              checked={selected}
              disabled={busy}
              onChange={(event) =>
                onSelect(event.target.checked)
              }
              className="mt-1 h-5 w-5 shrink-0 accent-orange-600"
            />
          )}

          <div className="min-w-0">

            <p className="text-xs font-bold text-orange-600">
              PAYOUT #{payout.id}
              {' · '}
              POOL #{payout.poolId}
            </p>

            <h3 className="mt-1 break-words text-lg font-black text-gray-900">
              {payout.beneficiaryName}
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              User #{payout.beneficiaryUserId}
              {' · '}
              {formatRole(payout.beneficiaryRole)}
            </p>

          </div>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${
            STATUS_COLORS[payout.status] ||
            'border-gray-200 bg-gray-100 text-gray-700'
          }`}
        >
          {payout.status.replace(/_/g, ' ')}
        </span>

      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">

        <DetailItem
          label="Project ID"
          value={`#${payout.projectId}`}
        />

        <DetailItem
          label="Customer"
          value={payout.customerName || '—'}
        />

        <DetailItem
          label="Source Solar Mitra"
          value={`${payout.sourceSolarMitraName} (#${payout.sourceSolarMitraId})`}
        />

        <DetailItem
          label="Network Level"
          value={payout.networkLevel}
        />

      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">

        <div className="rounded-xl border border-green-100 bg-green-50 p-3">

          <p className="text-xs font-semibold text-green-700">
            Gross Incentive
          </p>

          <p className="mt-1 text-xl font-black text-green-800">
            {formatMoney(payout.payoutAmount)}
          </p>

        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">

          <p className="text-xs font-semibold text-blue-700">
            Qualified On
          </p>

          <p className="mt-1 text-sm font-bold text-blue-900">
            {formatDate(payout.eligibleAt)}
          </p>

        </div>

      </div>

      {payout.payrollId && (
        <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs font-semibold text-purple-800">
          {payout.paidAt
            ? 'Settled through payroll'
            : 'Reserved for payroll'}
          {' · '}
          Payroll #{payout.payrollId}
        </div>
      )}

      {payout.paidAt && (
        <div className="mt-3 grid grid-cols-2 gap-2">

          <DetailItem
            label="Net Paid"
            value={formatMoney(
              payout.netPaidAmount ??
              payout.payoutAmount,
            )}
          />

          <DetailItem
            label="Recovery Deducted"
            value={formatMoney(
              payout.recoveryDeductedAmount,
            )}
          />

        </div>
      )}

      {Number(payout.outstandingRecovery || 0) > 0 && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">

          <p className="text-xs font-semibold text-red-700">
            Outstanding Recovery
          </p>

          <p className="mt-1 text-lg font-black text-red-800">
            {formatMoney(payout.outstandingRecovery)}
          </p>

        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">

        <button
          type="button"
          aria-expanded={expanded}
          onClick={() =>
            setExpanded((previous) => !previous)
          }
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          {expanded ? 'Hide Details' : 'View Details'}
        </button>

        {canApprove && isPending && (
          <button
            type="button"
            disabled={busy}
            onClick={onApprove}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            Approve Incentive
          </button>
        )}

        {canSettle && (
  <button
    type="button"
    disabled={busy}
    onClick={onSettle}
    className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50"
  >
    Settlement Preview
  </button>
)}

      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">

          <div>

            <h4 className="mb-2 text-sm font-black text-gray-900">
              Pool Calculation
            </h4>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">

              <DetailItem
                label="Total Pool"
                value={formatMoney(payout.poolAmount)}
              />

              <DetailItem
                label="Total Upline Positions"
                value={payout.totalUplineCount}
              />

              <DetailItem
                label="Eligible Positions"
                value={payout.eligibleUplineCount}
              />

              <DetailItem
                label="Ineligible Positions"
                value={payout.inactiveUplineCount}
              />

              <DetailItem
                label="Pool Distributable"
                value={formatMoney(
                  payout.distributableAmount,
                )}
              />

              <DetailItem
                label="Pool Retained"
                value={formatMoney(
                  payout.retainedAmount,
                )}
              />

              <DetailItem
                label="Pool Status"
                value={payout.poolStatus}
              />

              <DetailItem
                label="Referral ID"
                value={`#${payout.referralId}`}
              />

              <DetailItem
                label="Allocated Share"
                value={formatMoney(
                  payout.payoutAmount,
                )}
              />

            </div>

            <p className="mt-2 text-xs text-gray-500">
              Pool allocation is based on the saved
              qualification-time rate and hierarchy,
              including any rounding adjustment.
            </p>

          </div>

          <div>

            <h4 className="mb-2 text-sm font-black text-gray-900">
              Approval & Settlement
            </h4>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">

              <DetailItem
                label="Approved By"
                value={payout.approvedByName || '—'}
              />

              <DetailItem
                label="Approved On"
                value={formatDate(payout.approvedAt)}
              />

              <DetailItem
                label="Paid By"
                value={payout.paidByName || '—'}
              />

              <DetailItem
                label="Paid On"
                value={formatDate(payout.paidAt)}
              />

              <DetailItem
                label="Payment Mode"
                value={payout.paymentMode || '—'}
              />

              <DetailItem
                label="Payment Reference"
                value={payout.paymentReference || '—'}
              />

              <DetailItem
                label="Settlement Type"
                value={payout.settlementType || '—'}
              />

              <DetailItem
                label="Payroll ID"
                value={payout.payrollId || '—'}
              />

              <DetailItem
                label="Payroll Reserved On"
                value={formatDate(
                  payout.payrollReservedAt,
                )}
              />

            </div>

          </div>

          <div>

            <h4 className="mb-2 text-sm font-black text-gray-900">
              Cancellation & Recovery
            </h4>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">

              <DetailItem
                label="Recovery Liability"
                value={formatMoney(
                  payout.recoveryAmount,
                )}
              />

              <DetailItem
                label="Recovered Amount"
                value={formatMoney(
                  payout.recoveredAmount,
                )}
              />

              <DetailItem
                label="Outstanding Recovery"
                value={formatMoney(
                  payout.outstandingRecovery,
                )}
              />

              <DetailItem
                label="Recovered On"
                value={formatDate(payout.recoveredAt)}
              />

              <DetailItem
                label="Cancelled On"
                value={formatDate(payout.cancelledAt)}
              />

              <DetailItem
                label="Cancellation Reason"
                value={payout.cancellationReason || '—'}
              />

            </div>

          </div>

          {payout.remarks && (
            <DetailItem
              label="Remarks"
              value={payout.remarks}
            />
          )}

        </div>
      )}

    </div>
  );
}

export default function NetworkManagementPayouts({
  roles,
  onChanged,
  refreshKey = 0,
}: {
  roles: string[];
  onChanged?: () => void;
  refreshKey?: number;
}) {
  const canApprove = roles.some(
    (role) =>
      [
        'OWNER',
        'MARKETING_HEAD',
        'ACCOUNT_MANAGER',
      ].includes(role),
  );

  const canPay = roles.some(
  (role) =>
    [
      'OWNER',
      'ACCOUNT_MANAGER',
    ].includes(role),
);

const [settlementPayout, setSettlementPayout] =
  useState<NetworkPayout | null>(null);

  const [filters, setFilters] =
    useState<Filters>({ ...EMPTY_FILTERS });

  const [appliedFilters, setAppliedFilters] =
    useState<Filters>({ ...EMPTY_FILTERS });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [data, setData] =
    useState<PayoutResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [actionError, setActionError] =
    useState('');

  const [success, setSuccess] = useState('');

  const [busy, setBusy] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  const [selectedIds, setSelectedIds] =
    useState<number[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPayouts = async () => {
      setLoading(true);
      setError('');
      setSelectedIds([]);

      try {
        const params = {
          ...appliedFilters,
          page,
          limit,
        };

        const response =
          await axios.get<PayoutResponse>(
            `${BASE_URL}/management/payouts`,
            {
              params,
              headers: getAuthHeaders(),
              signal: controller.signal,
            },
          );

        if (!controller.signal.aborted) {
          const lastPage = Math.max(
            response.data.totalPages,
            1,
          );

          if (page > lastPage) {
            setPage(lastPage);
            return;
          }

          setData(response.data);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setError(
            getErrorMessage(
              err,
              'Unable to load Network payout records.',
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchPayouts();

    return () => controller.abort();
  }, [
    appliedFilters,
    page,
    limit,
    reloadKey,
    refreshKey,
  ]);

  const updateFilter = (
    key: keyof Filters,
    value: string,
  ) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    setPage(1);
    setSelectedIds([]);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    setPage(1);
    setSelectedIds([]);
    setFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
  };

  const pendingIds = (data?.data || [])
    .filter(
      (payout) =>
        payout.status === 'PENDING_APPROVAL',
    )
    .map((payout) => payout.id);

  const allPendingSelected =
    pendingIds.length > 0 &&
    pendingIds.every((id) =>
      selectedIds.includes(id),
    );

  const toggleSelection = (
    id: number,
    checked: boolean,
  ) => {
    setSelectedIds((previous) =>
      checked
        ? Array.from(new Set([...previous, id]))
        : previous.filter((item) => item !== id),
    );
  };

  const approvePayouts = async (
    payoutIds: number[],
  ) => {
    if (
      !canApprove ||
      busy ||
      loading ||
      payoutIds.length === 0
    ) {
      return;
    }

    const confirmed = window.confirm(
      payoutIds.length === 1
        ? 'Approve this Network incentive?'
        : `Approve ${payoutIds.length} selected Network incentives?`,
    );

    if (!confirmed) return;

    setBusy(true);
    setActionError('');
    setSuccess('');

    try {
      if (payoutIds.length === 1) {
        await axios.patch(
          `${BASE_URL}/payouts/${payoutIds[0]}/approve`,
          {},
          {
            headers: getAuthHeaders(),
          },
        );
      } else {
        await axios.patch(
          `${BASE_URL}/payouts/bulk-approve`,
          {
            payoutIds,
          },
          {
            headers: getAuthHeaders(),
          },
        );
      }

      setSuccess(
        `${payoutIds.length} Network incentive(s) approved successfully.`,
      );

      setSelectedIds([]);

      setReloadKey((previous) => previous + 1);

      onChanged?.();

    } catch (err: any) {
      setActionError(
        getErrorMessage(
          err,
          'Unable to approve Network incentives.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'min-w-0 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500';

  return (
    <section className="min-w-0 space-y-4">

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>

          <h3 className="text-lg font-black text-gray-900">
            Network Payout Records
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Project-wise and beneficiary-wise
            incentive records.
          </p>

        </div>

        <button
          type="button"
          disabled={busy || loading}
          onClick={() =>
            setReloadKey((previous) => previous + 1)
          }
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 disabled:opacity-50"
        >
          Refresh Records
        </button>

      </div>

      {/* Filters */}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
        className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4"
      >

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

          <label className="space-y-1">

            <span className="text-xs font-bold text-gray-600">
              Search
            </span>

            <input
              type="search"
              maxLength={200}
              value={filters.search}
              onChange={(event) =>
                updateFilter(
                  'search',
                  event.target.value,
                )
              }
              placeholder="Name, customer or ID..."
              className={inputClass}
            />

          </label>

          <label className="space-y-1">

            <span className="text-xs font-bold text-gray-600">
              Status
            </span>

            <select
              value={filters.status}
              onChange={(event) =>
                updateFilter(
                  'status',
                  event.target.value,
                )
              }
              className={inputClass}
            >
              {STATUS_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

          </label>

          <label className="space-y-1">

            <span className="text-xs font-bold text-gray-600">
              Qualification Month
            </span>

            <input
              type="month"
              value={filters.month}
              onChange={(event) =>
                updateFilter(
                  'month',
                  event.target.value,
                )
              }
              className={inputClass}
            />

          </label>

          <label className="space-y-1">

            <span className="text-xs font-bold text-gray-600">
              Beneficiary Role
            </span>

            <input
              type="text"
              value={filters.beneficiaryRole}
              onChange={(event) =>
                updateFilter(
                  'beneficiaryRole',
                  event.target.value.toUpperCase(),
                )
              }
              placeholder="e.g. PROJECT_MANAGER"
              className={inputClass}
            />

          </label>

          {(
            [
              ['projectId', 'Project ID'],
              ['beneficiaryUserId', 'Beneficiary User ID'],
              ['sourceSolarMitraId', 'Source Mitra ID'],
              ['poolId', 'Pool ID'],
            ] as const
          ).map(([key, label]) => (

            <label
              key={key}
              className="space-y-1"
            >

              <span className="text-xs font-bold text-gray-600">
                {label}
              </span>

              <input
                type="number"
                min={1}
                max={2147483647}
                step={1}
                value={filters[key]}
                onChange={(event) =>
                  updateFilter(
                    key,
                    event.target.value,
                  )
                }
                placeholder={label}
                className={inputClass}
              />

            </label>

          ))}

        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="submit"
            disabled={busy || loading}
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Apply Filters
          </button>

          <button
            type="button"
            disabled={busy || loading}
            onClick={clearFilters}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700 disabled:opacity-50"
          >
            Clear Filters
          </button>

        </div>

      </form>

      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800"
        >
          {success}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800"
        >
          {actionError}
        </div>
      )}

      {loading ? (

        <div className="rounded-2xl border bg-white p-10 text-center text-sm font-semibold text-gray-500">
          Loading Network payout records...
        </div>

      ) : error || !data ? (

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

          <p className="text-sm font-semibold text-red-700">
            {error || 'Payout records unavailable.'}
          </p>

          <button
            type="button"
            onClick={() =>
              setReloadKey((previous) => previous + 1)
            }
            className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white"
          >
            Try Again
          </button>

        </div>

      ) : (

        <>

          {/* Filtered totals */}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">

            <DetailItem
              label="Matching Records"
              value={formatNumber(data.total)}
            />

            <DetailItem
              label="Filtered Gross Amount"
              value={formatMoney(
                data.summary.totalAmount,
              )}
            />

            <DetailItem
              label="Filtered Outstanding Recovery"
              value={formatMoney(
                data.summary.outstandingRecovery,
              )}
            />

          </div>

          <p className="text-xs text-gray-500">
            Filtered gross amount includes all
            matching statuses, including retained,
            cancelled and recovered records.
            It is not the payable balance.
          </p>

          {/* Bulk approval */}

          {canApprove && pendingIds.length > 0 && (

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">

              <label className="flex items-center gap-2 text-sm font-semibold text-blue-900">

                <input
                  type="checkbox"
                  checked={allPendingSelected}
                  disabled={busy}
                  onChange={(event) =>
                    setSelectedIds(
                      event.target.checked
                        ? pendingIds
                        : [],
                    )
                  }
                  className="h-5 w-5 accent-blue-700"
                />

                Select pending records on this page

              </label>

              <button
                type="button"
                disabled={
                  busy ||
                  selectedIds.length === 0
                }
                onClick={() =>
                  approvePayouts(selectedIds)
                }
                className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy
                  ? 'Processing...'
                  : `Approve Selected (${selectedIds.length})`}
              </button>

            </div>

          )}

          {/* Records */}

          {data.data.length === 0 ? (

            <div className="rounded-2xl border bg-white p-10 text-center">

              <h4 className="font-black text-gray-900">
                No Network payout records found
              </h4>

              <p className="mt-2 text-sm text-gray-500">
                Try changing the applied filters.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {data.data.map((payout) => (

                <PayoutCard
                  key={payout.id}
                  payout={payout}
                  selected={selectedIds.includes(
                    payout.id,
                  )}
                  canApprove={canApprove}
canPay={canPay}
busy={busy || !!settlementPayout}
onSettle={() =>
  setSettlementPayout(payout)
}
                  onSelect={(checked) =>
                    toggleSelection(
                      payout.id,
                      checked,
                    )
                  }
                  onApprove={() =>
                    approvePayouts([payout.id])
                  }
                />

              ))}

            </div>

          )}

          {/* Pagination */}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">

            <div className="flex items-center gap-2">

              <span className="text-sm font-semibold text-gray-600">
                Records per page
              </span>

              <select
                value={limit}
                disabled={busy}
                onChange={(event) => {
                  setPage(1);
                  setLimit(Number(event.target.value));
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

            </div>

            <p className="text-sm font-semibold text-gray-600">
              Page {data.page} of{' '}
              {Math.max(data.totalPages, 1)}
            </p>

            <div className="flex gap-2">

              <button
                type="button"
                disabled={busy || page <= 1}
                onClick={() =>
                  setPage((previous) => previous - 1)
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  busy ||
                  page >= data.totalPages
                }
                onClick={() =>
                  setPage((previous) => previous + 1)
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold disabled:opacity-40"
              >
                Next
              </button>

            </div>

          </div>

        </>

      )}

      {canPay && settlementPayout && (
  <IncentiveSettlementModal
    category="NETWORK"
    payoutId={settlementPayout.id}
    beneficiaryName={
      settlementPayout.beneficiaryName
    }
    onClose={() =>
      setSettlementPayout(null)
    }
    onSettled={() => {
      setSettlementPayout(null);

      setActionError('');

      setSuccess(
        'Network incentive settled successfully.',
      );

      setSelectedIds([]);

      setReloadKey(
        (previous) => previous + 1,
      );

      onChanged?.();
    }}
  />
)}

    </section>
  );
}