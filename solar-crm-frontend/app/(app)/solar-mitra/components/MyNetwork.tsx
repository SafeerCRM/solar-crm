'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type NetworkSummary = {
  actualTeam: number;
  activeActualTeam: number;
  inactiveActualTeam: number;
  virtualTeam: number;
  activeVirtualTeam: number;
  inactiveVirtualTeam: number;
  totalNetwork: number;
  activeNetwork: number;
  inactiveNetwork: number;
  networkDepth: number;
};

type NetworkPerformance = {
  approvedMitras: number;
  posterVerifiedMitras: number;
  totalReferrals: number;
  leadsCreated: number;
  meetingsCreated: number;
  projectsCreated: number;
  qualifiedProjects: number;
};

type NetworkMember = NetworkPerformance & {
  solarMitraId: number;
  name: string;
  businessName?: string | null;
  city?: string | null;
  area?: string | null;
  primaryPhone?: string | null;
  status: string;
  isHidden: boolean;
  isActiveMember: boolean;
  approvalStatus: string;
  posterVerificationStatus: string;
  createdAt: string;
  directMembers: number;
  indirectMembers: number;
  totalDownline: number;
  activeDownline: number;
  networkDepth: number;
};

type NetworkResponse = {
  summary: NetworkSummary;
  performance: NetworkPerformance;
  actualTeam: NetworkMember[];
};

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('en-IN');
}

function NetworkCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">
        {title}
      </p>

      <p className={`mt-2 text-3xl font-black ${color}`}>
        {formatNumber(value)}
      </p>

      <p className="mt-2 text-xs text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

function PerformanceMetrics({
  performance,
  compact = false,
}: {
  performance: NetworkPerformance;
  compact?: boolean;
}) {
  const metrics = [
    {
      label: 'Approved Mitras',
      value: performance.approvedMitras,
      color: 'text-blue-700',
    },
    {
      label: 'Poster Verified',
      value: performance.posterVerifiedMitras,
      color: 'text-purple-700',
    },
    {
      label: 'Customer Referrals',
      value: performance.totalReferrals,
      color: 'text-orange-700',
    },
    {
      label: 'Leads Created',
      value: performance.leadsCreated,
      color: 'text-indigo-700',
    },
    {
      label: 'Meetings Created',
      value: performance.meetingsCreated,
      color: 'text-cyan-700',
    },
    {
      label: 'Projects Created',
      value: performance.projectsCreated,
      color: 'text-green-700',
    },
    {
      label: 'Qualified Projects',
      value: performance.qualifiedProjects,
      color: 'text-emerald-700',
    },
  ];

  return (
    <div
      className={
        compact
          ? 'grid grid-cols-2 gap-2'
          : 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4'
      }
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`min-w-0 rounded-xl border border-gray-200 bg-gray-50 ${
            compact ? 'p-3' : 'p-4'
          }`}
        >
          <p className="text-xs font-semibold text-gray-500">
            {metric.label}
          </p>

          <p
            className={`mt-2 font-black ${metric.color} ${
              compact ? 'text-xl' : 'text-3xl'
            }`}
          >
            {formatNumber(metric.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function MemberStatus({
  member,
}: {
  member: NetworkMember;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
        member.isActiveMember
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {member.isActiveMember
        ? 'Active'
        : member.isHidden
          ? 'Hidden'
          : member.status === 'BLOCKED'
            ? 'Blocked'
            : 'Inactive'}
    </span>
  );
}

function MemberCard({
  member,
}: {
  member: NetworkMember;
}) {
  const [showPerformance, setShowPerformance] =
    useState(false);

  return (
    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-orange-600">
            MITRA #{member.solarMitraId}
          </p>

          <h3 className="mt-1 break-words text-base font-black text-gray-900">
            {member.name}
          </h3>

          {member.businessName && (
            <p className="mt-1 break-words text-sm text-gray-500">
              {member.businessName}
            </p>
          )}
        </div>

        <MemberStatus member={member} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <p>
          {[member.area, member.city]
            .filter(Boolean)
            .join(', ') || 'Location not available'}
        </p>

        {member.primaryPhone && (
          <a
            href={`tel:${member.primaryPhone}`}
            className="font-semibold text-blue-700"
          >
            {member.primaryPhone}
          </a>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-orange-50 p-3">
          <p className="text-xs font-semibold text-orange-700">
            Virtual Team
          </p>

          <p className="mt-1 text-xl font-black text-orange-800">
            {formatNumber(member.totalDownline)}
          </p>
        </div>

        <div className="rounded-xl bg-green-50 p-3">
          <p className="text-xs font-semibold text-green-700">
            Active Downline
          </p>

          <p className="mt-1 text-xl font-black text-green-800">
            {formatNumber(member.activeDownline)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-lg bg-gray-100 px-2 py-1 font-semibold text-gray-600">
          Approval: {member.approvalStatus}
        </span>

                <span className="rounded-lg bg-gray-100 px-2 py-1 font-semibold text-gray-600">
          Poster: {
            member.posterVerificationStatus
              .replace(/_/g, ' ')
          }
        </span>
      </div>

      <button
        type="button"
        aria-expanded={showPerformance}
        onClick={() =>
          setShowPerformance((previous) => !previous)
        }
        className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
      >
        {showPerformance
          ? 'Hide Branch Performance'
          : 'View Branch Performance'}
      </button>

      {showPerformance && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-black text-gray-900">
            Branch Performance
          </h4>

          <p className="mb-3 mt-1 text-xs text-gray-500">
            Combined lifetime performance of this
            Solar Mitra and their entire downline.
          </p>

          <PerformanceMetrics
            performance={member}
            compact
          />
        </div>
      )}
    </div>
  );
}

export default function MyNetwork() {
  const [data, setData] =
    useState<NetworkResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [view, setView] =
    useState<'TREE' | 'LIST'>('TREE');

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] =
    useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  useEffect(() => {
    const controller = new AbortController();

    const fetchNetwork = async () => {
      setLoading(true);
      setError('');

      try {
        const response =
          await axios.get<NetworkResponse>(
            `${API_BASE_URL}/solar-mitra/me/network`,
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
              : 'Unable to load your network.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchNetwork();

    return () => controller.abort();
  }, [refreshKey]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (data?.actualTeam || []).filter(
      (member) => {
        if (
          statusFilter === 'ACTIVE' &&
          !member.isActiveMember
        ) {
          return false;
        }

        if (
          statusFilter === 'INACTIVE' &&
          member.isActiveMember
        ) {
          return false;
        }

        if (!query) return true;

        return [
          member.solarMitraId,
          member.name,
          member.businessName,
          member.city,
          member.area,
          member.primaryPhone,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(query),
        );
      },
    );
  }, [data, search, statusFilter]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <p className="font-semibold text-gray-500">
          Loading your network...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">
          {error || 'Network data unavailable.'}
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

  const { summary, performance } = data;

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            My Network
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Track your directly created Solar Mitras
            and the growth of your extended network.
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
        <NetworkCard
          title="Actual Team"
          value={summary.actualTeam}
          subtitle={`${summary.activeActualTeam} active · ${summary.inactiveActualTeam} inactive`}
          color="text-blue-700"
        />

        <NetworkCard
          title="Virtual Team"
          value={summary.virtualTeam}
          subtitle={`${summary.activeVirtualTeam} active · ${summary.inactiveVirtualTeam} inactive`}
          color="text-orange-600"
        />

        <NetworkCard
          title="Total Network"
          value={summary.totalNetwork}
          subtitle={`${summary.activeNetwork} active · ${summary.inactiveNetwork} inactive`}
          color="text-green-700"
        />

        <NetworkCard
          title="Network Depth"
          value={summary.networkDepth}
          subtitle="Maximum network levels"
          color="text-purple-700"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
  <h3 className="text-lg font-black text-gray-900">
    Team Performance
  </h3>

  <p className="mb-4 mt-1 text-sm text-gray-500">
    Lifetime combined performance of your Actual
    and Virtual Team.
  </p>

  {performance ? (
    <PerformanceMetrics
      performance={performance}
    />
  ) : (
    <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
      Team performance data is currently unavailable.
    </p>
  )}

  <p className="mt-4 text-xs leading-relaxed text-gray-500">
    These figures represent your network's activity,
    excluding your own customer referrals. Qualified
    Projects exclude cancelled and recovery-status
    incentives.
  </p>
</div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p>
          <strong>Actual Team:</strong> Solar Mitras
          created directly by you.
        </p>

        <p className="mt-2">
          <strong>Virtual Team:</strong> Solar Mitras
          created by members of your network at
          subsequent levels.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search ID, name, phone or city..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | 'ALL'
                  | 'ACTIVE'
                  | 'INACTIVE',
              )
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm"
          >
            <option value="ALL">All Members</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            {(['TREE', 'LIST'] as const).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setView(item)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold ${
                    view === item
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600'
                  }`}
                >
                  {item === 'TREE'
                    ? 'Tree View'
                    : 'List View'}
                </button>
              ),
            )}
          </div>
        </div>

        <p className="mt-3 text-xs font-semibold text-gray-500">
          Showing {filteredMembers.length} of{' '}
          {summary.actualTeam} direct team members
        </p>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <h3 className="font-bold text-gray-900">
            {summary.actualTeam === 0
              ? 'Your network is yet to grow'
              : 'No matching members'}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {summary.actualTeam === 0
              ? 'Create Solar Mitras to start building your Actual Team.'
              : 'Try changing your search or filters.'}
          </p>
        </div>
      ) : view === 'TREE' ? (
        <div className="rounded-2xl border bg-white p-4 md:p-6">
          <div className="mx-auto max-w-xs rounded-2xl bg-gray-900 p-5 text-center text-white">
            <p className="text-xs font-semibold text-gray-300">
              NETWORK ROOT
            </p>

            <h3 className="mt-1 text-xl font-black">
              You
            </h3>

            <p className="mt-2 text-sm text-gray-300">
              {summary.actualTeam} Actual ·{' '}
              {summary.virtualTeam} Virtual
            </p>
          </div>

          <div className="mx-auto h-8 w-px bg-gray-300" />

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-center">
            <p className="text-sm font-black text-orange-800">
              Level 1 — Actual Team
            </p>
          </div>

          <div className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => (
              <div
                key={member.solarMitraId}
                className="min-w-0"
              >
                <MemberCard member={member} />

                <div className="mx-auto h-5 w-px bg-gray-300" />

                <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50 p-3 text-center">
                  <p className="text-xs font-bold text-orange-700">
                    Virtual Team
                  </p>

                  <p className="mt-1 text-2xl font-black text-orange-800">
                    {formatNumber(member.totalDownline)}
                  </p>

                  <p className="mt-1 text-xs text-orange-700">
                    {member.activeDownline} active ·{' '}
                    {member.networkDepth} further levels
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.solarMitraId}
              member={member}
            />
          ))}
        </div>
      )}
    </div>
  );
}