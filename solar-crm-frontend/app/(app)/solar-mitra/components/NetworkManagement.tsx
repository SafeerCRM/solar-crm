'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import NetworkManagementPayouts from './NetworkManagementPayouts';
import HistoricalCreatorAssignment from './HistoricalCreatorAssignment';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type PayoutStatusSummary = {
  count: number;
  amount: number;
};

type ManagementSummary = {
  hierarchy: {
    totalSolarMitras: number;
    activeSolarMitras: number;
    inactiveSolarMitras: number;
    assignedCreators: number;
    missingCreators: number;
    createdBySolarMitras: number;
  };

  pools: {
    totalPools: number;
    activePools: number;
    cancelledPools: number;
    totalPoolAmount: number;
    distributableAmount: number;
    retainedAmount: number;
  };

  payouts: {
    pendingApproval: PayoutStatusSummary;
    approved: PayoutStatusSummary;
    paid: PayoutStatusSummary;
    retained: PayoutStatusSummary;
    cancelled: PayoutStatusSummary;
    recoveryPending: PayoutStatusSummary;
    recovered: PayoutStatusSummary;
    grossSettledAmount: number;
    netPaidAmount: number;
    recoveryDeductedAmount: number;
    recoveredAmount: number;
    outstandingRecovery: number;
  };
};

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('en-IN');
}

function formatMoney(value: number | string) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function SummaryCard({
  title,
  value,
  subtitle,
  color = 'text-gray-900',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 md:text-sm">
        {title}
      </p>

      <p className={`mt-2 break-words text-xl font-black md:text-2xl ${color}`}>
        {value}
      </p>

      {subtitle && (
        <p className="mt-2 text-xs text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function NetworkManagement({
  roles,
}: {
  roles: string[];
}) {
  const [summary, setSummary] =
    useState<ManagementSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSummary = async () => {
      
      setError('');

      try {
        const response =
          await axios.get<ManagementSummary>(
            `${API_BASE_URL}/solar-mitra/network/management/summary`,
            {
              headers: getAuthHeaders(),
              signal: controller.signal,
            },
          );

        if (!controller.signal.aborted) {
          setSummary(response.data);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setError(
            typeof err?.response?.data?.message === 'string'
              ? err.response.data.message
              : 'Unable to load network management summary.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchSummary();

    return () => controller.abort();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <p className="font-semibold text-gray-500">
          Loading network management dashboard...
        </p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">
          {error || 'Management data unavailable.'}
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

  const { hierarchy, pools, payouts } = summary;

  return (
    <div className="min-w-0 space-y-5">

      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Network Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Monitor network growth, incentive pools,
            approvals, settlements and recoveries.
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

      {/* Network Overview */}

      <section className="space-y-3">
        <h3 className="text-lg font-black text-gray-900">
          Network Overview
        </h3>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          <SummaryCard
            title="Total Solar Mitras"
            value={formatNumber(hierarchy.totalSolarMitras)}
            color="text-blue-700"
          />

          <SummaryCard
            title="Active Solar Mitras"
            value={formatNumber(hierarchy.activeSolarMitras)}
            color="text-green-700"
          />

          <SummaryCard
            title="Inactive Solar Mitras"
            value={formatNumber(hierarchy.inactiveSolarMitras)}
            color="text-red-700"
          />

          <SummaryCard
            title="Assigned Creators"
            value={formatNumber(hierarchy.assignedCreators)}
            color="text-indigo-700"
          />

          <SummaryCard
            title="Missing Creators"
            value={formatNumber(hierarchy.missingCreators)}
            color="text-orange-700"
          />

          <SummaryCard
            title="Created by Solar Mitras"
            value={formatNumber(hierarchy.createdBySolarMitras)}
            color="text-purple-700"
            subtitle="Mitras created by existing network members"
          />
        </div>
      </section>

      {roles.includes('OWNER') && (
  <HistoricalCreatorAssignment
    refreshKey={refreshKey}
    onChanged={() =>
      setRefreshKey(
        (previous) => previous + 1,
      )
    }
  />
)}

      {/* Pool Overview */}

      <section className="space-y-3">
        <h3 className="text-lg font-black text-gray-900">
          Network Incentive Pools
        </h3>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          <SummaryCard
            title="Total Pools"
            value={formatNumber(pools.totalPools)}
            subtitle={`${pools.activePools} active · ${pools.cancelledPools} cancelled`}
            color="text-blue-700"
          />

          <SummaryCard
            title="Active Pools"
            value={formatNumber(pools.activePools)}
            color="text-green-700"
          />

          <SummaryCard
            title="Cancelled Pools"
            value={formatNumber(pools.cancelledPools)}
            color="text-red-700"
          />

          <SummaryCard
            title="Total Pool Amount"
            value={formatMoney(pools.totalPoolAmount)}
            subtitle="Non-cancelled incentive pools"
            color="text-indigo-700"
          />

          <SummaryCard
            title="Distributable Amount"
            value={formatMoney(pools.distributableAmount)}
            subtitle="Allocated to eligible uplines"
            color="text-green-700"
          />

          <SummaryCard
            title="Company Retained"
            value={formatMoney(pools.retainedAmount)}
            subtitle="Shares retained from ineligible positions"
            color="text-orange-700"
          />
        </div>
      </section>

      {/* Approval and Payout Overview */}

      <section className="space-y-3">
        <h3 className="text-lg font-black text-gray-900">
          Approval & Payout Status
        </h3>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryCard
            title="Pending Approval"
            value={formatMoney(payouts.pendingApproval.amount)}
            subtitle={`${payouts.pendingApproval.count} incentives`}
            color="text-orange-700"
          />

          <SummaryCard
            title="Approved & Unpaid"
            value={formatMoney(payouts.approved.amount)}
            subtitle={`${payouts.approved.count} incentives`}
            color="text-blue-700"
          />

          <SummaryCard
            title="Paid Status"
            value={formatMoney(payouts.paid.amount)}
            subtitle={`${payouts.paid.count} incentives · Gross value`}
            color="text-green-700"
          />

          <SummaryCard
            title="Cancelled Incentives"
            value={formatMoney(payouts.cancelled.amount)}
            subtitle={`${payouts.cancelled.count} incentives`}
            color="text-red-700"
          />
        </div>
      </section>

      {/* Settlement and Recovery Overview */}

      <section className="space-y-3">
        <h3 className="text-lg font-black text-gray-900">
          Settlements & Recoveries
        </h3>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          <SummaryCard
            title="Gross Settled Amount"
            value={formatMoney(payouts.grossSettledAmount)}
            subtitle="All previously settled Network incentives"
            color="text-indigo-700"
          />

          <SummaryCard
            title="Net Paid Amount"
            value={formatMoney(payouts.netPaidAmount)}
            subtitle="Payments after recovery deductions"
            color="text-green-700"
          />

          <SummaryCard
            title="Recovery Deducted"
            value={formatMoney(payouts.recoveryDeductedAmount)}
            subtitle="Deductions from Network incentive settlements"
            color="text-orange-700"
          />

          <SummaryCard
            title="Outstanding Recovery"
            value={formatMoney(payouts.outstandingRecovery)}
            subtitle={`${payouts.recoveryPending.count} recovery cases`}
            color="text-red-700"
          />

          <SummaryCard
            title="Recovered Amount"
            value={formatMoney(payouts.recoveredAmount)}
            subtitle="Network liabilities recovered across incentive categories"
            color="text-green-700"
          />

          <SummaryCard
            title="Fully Recovered Cases"
            value={formatNumber(payouts.recovered.count)}
            subtitle="Completed recovery cases"
            color="text-emerald-700"
          />
        </div>
      </section>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
        <strong>Financial Note:</strong> These financial
        figures relate to Network incentives only.
        Creator incentives and Direct Project incentives
        are maintained separately. Active staff incentives
        are settled through payroll.
      </div>

      <div className="border-t border-gray-200 pt-5">
  <NetworkManagementPayouts
    roles={roles}
    onChanged={() =>
      setRefreshKey(
        (previous) => previous + 1,
      )
    }
  />
</div>

    </div>
  );
}