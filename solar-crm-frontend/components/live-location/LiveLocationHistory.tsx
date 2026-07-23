'use client';

import {
  LiveLocationSession,
  LiveLocationUser,
} from './LiveLocationSessionCard';

type LiveLocationHistoryProps = {
  sessions: LiveLocationSession[];
  usersById: Map<number, LiveLocationUser>;

  loading: boolean;
  error: string | null;

  page: number;
  total: number;
  totalPages: number;

  staffUserId: string;
  status: string;
  fromDate: string;
  toDate: string;

  onStaffUserIdChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;

  onApplyFilters: () => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;

  onViewDetails: (
    session: LiveLocationSession,
  ) => void;

  onViewRoute: (
    session: LiveLocationSession,
  ) => void;
};

function formatDateTime(
  value?: string | null,
): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatStatus(
  value?: string | null,
): string {
  if (!value) {
    return '-';
  }

  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDistance(
  value?: number | string | null,
): string {
  const metres = Number(value);

  if (!Number.isFinite(metres)) {
    return '-';
  }

  if (metres >= 1000) {
    return `${(metres / 1000).toFixed(2)} km`;
  }

  return `${Math.round(metres)} m`;
}

function statusClassName(
  session: LiveLocationSession,
): string {
  if (session.isActive) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (
    session.status === 'STOPPED_BY_OWNER' ||
    session.status === 'STOPPED_BY_STAFF'
  ) {
    return 'border-gray-200 bg-gray-100 text-gray-700';
  }

  if (
    session.status === 'SESSION_EXPIRED' ||
    session.status === 'APP_STOPPED'
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-blue-200 bg-blue-50 text-blue-700';
}

export default function LiveLocationHistory({
  sessions,
  usersById,
  loading,
  error,
  page,
  total,
  totalPages,
  staffUserId,
  status,
  fromDate,
  toDate,
  onStaffUserIdChange,
  onStatusChange,
  onFromDateChange,
  onToDateChange,
  onApplyFilters,
  onClearFilters,
  onRefresh,
  onPageChange,
  onViewDetails,
  onViewRoute,
}: LiveLocationHistoryProps) {
  const users = Array.from(
    usersById.values(),
  ).sort((first, second) =>
    String(first.name || '').localeCompare(
      String(second.name || ''),
    ),
  );

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
            Previous Tracking Records
          </p>

          <h2 className="mt-1 text-xl font-black text-gray-900">
            Live Location History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {total} tracking session
            {total === 1 ? '' : 's'} found
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="text-xs font-bold text-gray-600">
            Staff member
          </span>

          <select
            value={staffUserId}
            onChange={(event) =>
              onStaffUserIdChange(
                event.target.value,
              )
            }
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">
              All staff members
            </option>

            {users.map((user) => (
              <option
                key={user.id}
                value={String(user.id)}
              >
                {user.name ||
                  `Staff User #${user.id}`}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold text-gray-600">
            Final status
          </span>

          <select
            value={status}
            onChange={(event) =>
              onStatusChange(
                event.target.value,
              )
            }
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">
              All statuses
            </option>

            <option value="STOPPED_BY_OWNER">
              Stopped By Owner
            </option>

            <option value="STOPPED_BY_STAFF">
              Stopped By Staff
            </option>

            <option value="SESSION_EXPIRED">
              Session Expired
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="APP_STOPPED">
              App Stopped
            </option>

            <option value="LIVE">
              Live
            </option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold text-gray-600">
            From date
          </span>

          <input
            type="date"
            value={fromDate}
            onChange={(event) =>
              onFromDateChange(
                event.target.value,
              )
            }
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-gray-600">
            To date
          </span>

          <input
            type="date"
            value={toDate}
            onChange={(event) =>
              onToDateChange(
                event.target.value,
              )
            }
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onApplyFilters}
          disabled={loading}
          className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={onClearFilters}
          disabled={loading}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-black text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear Filters
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading && sessions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          Loading tracking history...
        </div>
      ) : sessions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="font-black text-gray-700">
            No tracking history found
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Completed or stopped sessions will
            appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {sessions.map((session) => {
            const staff =
              usersById.get(
                session.staffUserId,
              );

            const hasRoute =
              session.lastLatitude !== null &&
              session.lastLatitude !== undefined &&
              session.lastLongitude !== null &&
              session.lastLongitude !== undefined;

            return (
              <article
                key={session.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-black text-gray-900">
                        {staff?.name ||
                          `Staff User #${session.staffUserId}`}
                      </h3>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusClassName(
                          session,
                        )}`}
                      >
                        {formatStatus(
                          session.status,
                        )}
                      </span>
                    </div>

                    {staff?.email && (
                      <p className="mt-1 truncate text-sm text-gray-500">
                        {staff.email}
                      </p>
                    )}

                    <p className="mt-2 text-xs font-semibold text-gray-400">
                      Session #{session.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onViewDetails(session)
                      }
                      className="rounded-xl border border-blue-300 bg-white px-3 py-2 text-sm font-black text-blue-700 hover:bg-blue-50"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onViewRoute(session)
                      }
                      disabled={!hasRoute}
                      className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                    >
                      View Route
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      Requested
                    </p>

                    <p className="mt-1 text-sm font-black text-gray-800">
                      {formatDateTime(
                        session.requestedAt,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      Started
                    </p>

                    <p className="mt-1 text-sm font-black text-gray-800">
                      {formatDateTime(
                        session.startedAt,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      Stopped
                    </p>

                    <p className="mt-1 text-sm font-black text-gray-800">
                      {formatDateTime(
                        session.stoppedAt,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      Distance
                    </p>

                    <p className="mt-1 text-sm font-black text-gray-800">
                      {formatDistance(
                        session.totalDistanceMetres,
                      )}
                    </p>
                  </div>
                </div>

                {session.stopReason && (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    <span className="font-black">
                      Stop reason:
                    </span>{' '}
                    {formatStatus(
                      session.stopReason,
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-gray-500">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                onPageChange(page - 1)
              }
              disabled={
                loading || page <= 1
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                onPageChange(page + 1)
              }
              disabled={
                loading ||
                page >= totalPages
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}