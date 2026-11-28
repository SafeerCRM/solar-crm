'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type NetworkPayout = {
  id: number;
  projectId: number;
  referralId: number;
  sourceSolarMitraId: number;
  sourceSolarMitraName: string;
  customerName?: string | null;
  networkLevel: number;
  payoutAmount: string | number;
  status: string;
  poolAmount: string | number;
  totalUplineCount: number;
  eligibleAt: string;
  approvedAt?: string | null;
  paidAt?: string | null;
  paymentMode?: string | null;
  paymentReference?: string | null;
  settlementType?: string | null;
  payrollId?: number | null;
  payrollReservedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  recoveryAmount?: string | number;
  recoveredAmount?: string | number;
  recoveryDeductedAmount?: string | number;
  netPaidAmount?: string | number | null;
  recoveredAt?: string | null;
  outstandingRecovery?: string | number;
};

type PayoutResponse = {
  data: NetworkPayout[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  {
    value: 'PENDING_APPROVAL',
    label: 'Pending Approval',
  },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PAID', label: 'Paid' },
  { value: 'CANCELLED', label: 'Cancelled' },
  {
    value: 'RECOVERY_PENDING',
    label: 'Recovery Pending',
  },
  { value: 'RECOVERED', label: 'Recovered' },
];

function money(value?: string | number | null) {
  return Number(value || 0).toLocaleString(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

function cleanLabel(value?: string | null) {
  return value
    ? value.replace(/_/g, ' ')
    : '—';
}

function PayoutStatus({
  status,
}: {
  status: string;
}) {
  const colors: Record<string, string> = {
    PENDING_APPROVAL:
      'border-amber-200 bg-amber-50 text-amber-700',

    APPROVED:
      'border-blue-200 bg-blue-50 text-blue-700',

    PAID:
      'border-green-200 bg-green-50 text-green-700',

    CANCELLED:
      'border-gray-300 bg-gray-100 text-gray-600',

    RECOVERY_PENDING:
      'border-red-200 bg-red-50 text-red-700',

    RECOVERED:
      'border-purple-200 bg-purple-50 text-purple-700',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
        colors[status] ||
        'border-gray-200 bg-gray-50 text-gray-600'
      }`}
    >
      {cleanLabel(status)}
    </span>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0">
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
}: {
  payout: NetworkPayout;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasRecovery =
    Number(payout.recoveryAmount || 0) > 0 ||
    Number(payout.recoveryDeductedAmount || 0) > 0;

  const isPayrollReserved =
    Boolean(payout.payrollId) &&
    !payout.paidAt &&
    payout.status === 'APPROVED';

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-orange-600">
              PROJECT #{payout.projectId}
              {' · '}
              PAYOUT #{payout.id}
            </p>

            <h3 className="mt-1 break-words text-lg font-black text-gray-900">
              {payout.customerName ||
                `Project #${payout.projectId}`}
            </h3>

            <p className="mt-1 break-words text-sm text-gray-500">
              Source: {payout.sourceSolarMitraName}
              {' · '}
              Mitra #{payout.sourceSolarMitraId}
            </p>
          </div>

          <PayoutStatus status={payout.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
            <p className="text-xs font-semibold text-orange-700">
              Your Incentive
            </p>

            <p className="mt-1 break-words text-xl font-black text-orange-800">
              {money(payout.payoutAmount)}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <Detail
              label="Project Pool"
              value={money(payout.poolAmount)}
            />
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <Detail
              label="Network Level"
              value={`Level ${payout.networkLevel}`}
            />
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <Detail
              label="Qualified On"
              value={formatDate(payout.eligibleAt)}
            />
          </div>
        </div>

        {isPayrollReserved && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-bold text-blue-800">
              Reserved for Monthly Payroll
            </p>

            <p className="mt-1 text-xs text-blue-700">
              Payroll #{payout.payrollId}
              {' · '}
              Reserved on{' '}
              {formatDate(payout.payrollReservedAt)}
            </p>
          </div>
        )}

        {payout.paidAt && (
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
            <Detail
              label="Net Payment"
              value={
                payout.netPaidAmount != null
                  ? money(payout.netPaidAmount)
                  : 'Not available'
              }
            />

            <Detail
              label="Paid On"
              value={formatDate(payout.paidAt)}
            />
          </div>
        )}

        {Number(payout.outstandingRecovery || 0) > 0 && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-bold text-red-700">
              Outstanding Recovery
            </p>

            <p className="mt-1 text-lg font-black text-red-800">
              {money(payout.outstandingRecovery)}
            </p>
          </div>
        )}

        <button
          type="button"
          aria-expanded={expanded}
          onClick={() =>
            setExpanded((previous) => !previous)
          }
          className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          {expanded
            ? 'Hide Incentive Details'
            : 'View Incentive Details'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-gray-200 bg-gray-50 p-4 md:p-5">
          <div>
            <h4 className="text-sm font-black text-gray-900">
              Incentive Calculation
            </h4>

            <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Detail
                label="Total Project Pool"
                value={money(payout.poolAmount)}
              />

              <Detail
                label="Total Uplines"
                value={payout.totalUplineCount}
              />

              <Detail
                label="Your Position"
                value={`Level ${payout.networkLevel}`}
              />

              <Detail
                label="Your Allocated Share"
                value={money(payout.payoutAmount)}
              />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              The Project incentive pool is divided
              across the qualifying hierarchy positions.
              Inactive or blocked positions retain
              their allocation in the calculation,
              but their shares are retained by the
              company. Minor rounding adjustments
              may apply.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-black text-gray-900">
              Approval & Payment
            </h4>

            <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Detail
                label="Approved On"
                value={formatDate(payout.approvedAt)}
              />

              <Detail
                label="Paid On"
                value={formatDate(payout.paidAt)}
              />

              <Detail
                label="Settlement Type"
                value={cleanLabel(payout.settlementType)}
              />

              <Detail
                label="Payment Mode"
                value={cleanLabel(payout.paymentMode)}
              />

              <Detail
                label="Payment Reference"
                value={payout.paymentReference || '—'}
              />

              <Detail
                label="Payroll ID"
                value={
                  payout.payrollId
                    ? `#${payout.payrollId}`
                    : '—'
                }
              />
            </div>
          </div>

          {hasRecovery && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-black text-gray-900">
                Recovery Details
              </h4>

              <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Detail
                  label="Recovery Liability"
                  value={money(payout.recoveryAmount)}
                />

                <Detail
                  label="Liability Recovered"
                  value={money(payout.recoveredAmount)}
                />

                <Detail
                  label="Outstanding Recovery"
                  value={money(payout.outstandingRecovery)}
                />

                <Detail
                  label="Deducted From This Payment"
                  value={money(payout.recoveryDeductedAmount)}
                />

                <Detail
                  label="Recovery Completed On"
                  value={formatDate(payout.recoveredAt)}
                />
              </div>
            </div>
          )}

          {payout.cancelledAt && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-bold text-red-700">
                Cancellation Details
              </p>

              <p className="mt-2 text-sm text-red-800">
                {payout.cancellationReason ||
                  'Reason not available'}
              </p>

              <p className="mt-1 text-xs text-red-600">
                {formatDate(payout.cancelledAt)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyNetworkPayouts() {
  const [data, setData] =
    useState<PayoutResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPayouts = async () => {
      setLoading(true);
      setError('');

      try {
        const response =
          await axios.get<PayoutResponse>(
            `${API_BASE_URL}/solar-mitra/me/network-payouts`,
            {
              headers: getAuthHeaders(),

              params: {
                page,
                limit,
                ...(status ? { status } : {}),
              },

              signal: controller.signal,
            },
          );

        if (!controller.signal.aborted) {
          setData(response.data);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setError(
            typeof err?.response?.data?.message === 'string'
              ? err.response.data.message
              : 'Unable to load Network payouts.',
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
  }, [page, limit, status, refreshKey]);

  const totalPages = Math.max(
    1,
    Number(data?.totalPages || 0),
  );

  return (
    <section className="min-w-0 space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              My Network Payouts
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Project-wise incentive history,
              calculations and settlement details.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setRefreshKey((previous) => previous + 1)
            }
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold"
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

          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        {!loading && !error && data && (
          <p className="mt-3 text-xs font-semibold text-gray-500">
            {data.total.toLocaleString('en-IN')}
            {' '}matching Network payouts
          </p>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <p className="font-semibold text-gray-500">
            Loading Network payouts...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setRefreshKey((previous) => previous + 1)
            }
            className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white"
          >
            Try Again
          </button>
        </div>
      ) : !data?.data?.length ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <h3 className="font-black text-gray-900">
            No Network Payouts Found
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {status
              ? 'No payouts match the selected status.'
              : 'Your qualifying Network incentives will appear here.'}
          </p>

          {page > 1 && (
            <button
              type="button"
              onClick={() => setPage(1)}
              className="mt-3 rounded-xl border px-4 py-2 text-sm font-bold"
            >
              Return to First Page
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map((payout) => (
            <PayoutCard
              key={payout.id}
              payout={payout}
            />
          ))}
        </div>
      )}

      {!loading && !error && data && data.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setPage((previous) =>
                Math.max(1, previous - 1),
              )
            }
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 disabled:opacity-40"
          >
            Previous
          </button>

          <p className="text-sm font-bold text-gray-600">
            Page {page} of {totalPages}
          </p>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((previous) =>
                Math.min(totalPages, previous + 1),
              )
            }
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}