'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import MyNetworkPayouts from './MyNetworkPayouts';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type EarningsCategory = {
  eligibleAmount?: number;
  eligibleCount?: number;
  waitingAmount?: number;
  waitingCount?: number;
  pendingApprovalAmount?: number;
  pendingApprovalCount?: number;
  approvedAmount?: number;
  approvedCount?: number;
  paidAmount: number;
  paidCount: number;
  netPaidAmount: number;
  recoveryDeductedAmount: number;
  cancelledAmount: number;
  outstandingRecovery?: number;
};

type EarningsResponse = {
  outstandingRecovery: number;
  creation: EarningsCategory;
  directProject: EarningsCategory;
  network: EarningsCategory;
};

function money(value?: number | string | null) {
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

function SummaryCard({
  title,
  amount,
  subtitle,
  color,
}: {
  title: string;
  amount: number;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
      <p className="text-sm font-semibold text-gray-500">
        {title}
      </p>

      <p className={`mt-2 break-words text-xl font-black md:text-2xl ${color}`}>
        {money(amount)}
      </p>

      <p className="mt-2 text-xs text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

function AmountRow({
  label,
  amount,
  count,
  color = 'text-gray-900',
}: {
  label: string;
  amount?: number;
  count?: number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-600">
          {label}
        </p>

        {count !== undefined && (
          <p className="mt-1 text-xs text-gray-400">
            {count} incentives
          </p>
        )}
      </div>

      <p className={`text-right text-sm font-black ${color}`}>
        {money(amount)}
      </p>
    </div>
  );
}

function CategoryCard({
  title,
  description,
  category,
  type,
  theme,
}: {
  title: string;
  description: string;
  category: EarningsCategory;
  type: 'CREATION' | 'DIRECT_PROJECT' | 'NETWORK';
  theme: string;
}) {
  const qualifiedAmount =
    type === 'NETWORK'
      ? Number(category.approvedAmount || 0)
      : Number(category.eligibleAmount || 0);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className={`border-b p-5 ${theme}`}>
        <h3 className="text-lg font-black">
          {title}
        </h3>

        <p className="mt-2 text-xs opacity-80">
          {description}
        </p>

        <p className="mt-5 text-xs font-semibold">
          Qualified & Unpaid
        </p>

        <p className="mt-1 break-words text-3xl font-black">
          {money(qualifiedAmount)}
        </p>
      </div>

      <div className="p-4">
        {type === 'DIRECT_PROJECT' && (
          <AmountRow
            label="Awaiting Qualification"
            amount={category.waitingAmount}
            count={category.waitingCount}
            color="text-amber-700"
          />
        )}

        {type === 'NETWORK' && (
          <AmountRow
            label="Pending Approval"
            amount={category.pendingApprovalAmount}
            count={category.pendingApprovalCount}
            color="text-amber-700"
          />
        )}

        <AmountRow
          label={
            type === 'NETWORK'
              ? 'Approved & Unpaid'
              : 'Eligible & Unpaid'
          }
          amount={qualifiedAmount}
          count={
            type === 'NETWORK'
              ? category.approvedCount
              : category.eligibleCount
          }
          color="text-blue-700"
        />

        <AmountRow
          label="Total Net Payments"
          amount={category.netPaidAmount}
          color="text-green-700"
        />

        <AmountRow
          label="Recovery Already Deducted"
          amount={category.recoveryDeductedAmount}
          color="text-orange-700"
        />

        {type !== 'CREATION' && (
          <AmountRow
            label="Outstanding Recovery"
            amount={category.outstandingRecovery}
            color="text-red-700"
          />
        )}

        <AmountRow
          label="Cancelled Incentives"
          amount={category.cancelledAmount}
          color="text-gray-500"
        />
      </div>
    </div>
  );
}

export default function MyEarnings() {
  const [data, setData] =
    useState<EarningsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchEarnings = async () => {
      setLoading(true);
      setError('');

      try {
        const response =
          await axios.get<EarningsResponse>(
            `${API_BASE_URL}/solar-mitra/me/earnings`,
            {
              headers: getAuthHeaders(),
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
              : 'Unable to load your earnings.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchEarnings();

    return () => controller.abort();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <p className="font-semibold text-gray-500">
          Loading your earnings...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">
          {error || 'Earnings data unavailable.'}
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
    );
  }

  const totalQualified =
    Number(data.creation.eligibleAmount || 0) +
    Number(data.directProject.eligibleAmount || 0) +
    Number(data.network.approvedAmount || 0);

  const totalPending =
    Number(data.directProject.waitingAmount || 0) +
    Number(data.network.pendingApprovalAmount || 0);

  const totalNetPaid =
    Number(data.creation.netPaidAmount || 0) +
    Number(data.directProject.netPaidAmount || 0) +
    Number(data.network.netPaidAmount || 0);

  const totalRecoveryDeducted =
    Number(data.creation.recoveryDeductedAmount || 0) +
    Number(data.directProject.recoveryDeductedAmount || 0) +
    Number(data.network.recoveryDeductedAmount || 0);

  const outstandingRecovery =
    Number(data.outstandingRecovery || 0);

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            My Earnings
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Track your personal Solar Mitra incentives,
            payments and recovery adjustments.
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          title="Qualified & Unpaid"
          amount={totalQualified}
          subtitle="Before recovery deductions"
          color="text-blue-700"
        />

        <SummaryCard
          title="Pending Incentives"
          amount={totalPending}
          subtitle="Awaiting qualification or approval"
          color="text-amber-700"
        />

        <SummaryCard
          title="Total Net Payments"
          amount={totalNetPaid}
          subtitle="Cumulative actual incentive payments"
          color="text-green-700"
        />

        <SummaryCard
          title="Outstanding Recovery"
          amount={outstandingRecovery}
          subtitle="To be adjusted against future incentives"
          color="text-red-700"
        />
      </div>

      {outstandingRecovery > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-black text-amber-900">
            Recovery Adjustment
          </h3>

          <p className="mt-2 text-sm text-amber-800">
            Your outstanding recovery of{' '}
            <strong>{money(outstandingRecovery)}</strong>
            {' '}will be adjusted against eligible future
            Solar Mitra incentives.
          </p>

          <p className="mt-2 text-xs text-amber-700">
            Recovery is not deducted from ordinary
            staff salary.
          </p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <CategoryCard
          title="Creator Incentives"
          description="Incentives earned from qualifying Solar Mitras created by you."
          category={data.creation}
          type="CREATION"
          theme="border-blue-200 bg-blue-50 text-blue-900"
        />

        <CategoryCard
          title="Direct Project Incentives"
          description="Incentives earned from your own qualifying customer referrals."
          category={data.directProject}
          type="DIRECT_PROJECT"
          theme="border-green-200 bg-green-50 text-green-900"
        />

        <CategoryCard
          title="Network Incentives"
          description="Your share of qualifying Project incentive pools within your network."
          category={data.network}
          type="NETWORK"
          theme="border-orange-200 bg-orange-50 text-orange-900"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="font-black text-gray-900">
          Payment Summary
        </h3>

        <div className="mt-3">
          <AmountRow
            label="Total Net Payments"
            amount={totalNetPaid}
            color="text-green-700"
          />

          <AmountRow
            label="Total Recovery Already Deducted"
            amount={totalRecoveryDeducted}
            color="text-orange-700"
          />

          <AmountRow
            label="Remaining Outstanding Recovery"
            amount={outstandingRecovery}
            color="text-red-700"
          />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          Qualified amounts are gross incentive balances
          before recovery adjustments. Actual settlement
          amounts are calculated at payment or payroll
          processing. Active staff incentives are settled
          through monthly payroll.
        </p>
      </div>

      <MyNetworkPayouts />
    </div>
  );
}