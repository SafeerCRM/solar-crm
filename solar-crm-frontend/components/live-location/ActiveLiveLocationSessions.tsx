'use client';

import LiveLocationSessionCard, {
  LiveLocationSession,
  LiveLocationUser,
} from './LiveLocationSessionCard';

type ActiveLiveLocationSessionsProps = {
  sessions: LiveLocationSession[];
  usersById: Map<number, LiveLocationUser>;

  loading: boolean;
  error: string | null;

  stoppingSessionId: number | null;

  onRefresh: () => void | Promise<void>;

    onView: (
    session: LiveLocationSession,
  ) => void;

  onViewRoute: (
    session: LiveLocationSession,
  ) => void;

  onStop: (
    session: LiveLocationSession,
  ) => void | Promise<void>;
};

export default function ActiveLiveLocationSessions({
  sessions,
  usersById,
  loading,
  error,
  stoppingSessionId,
    onRefresh,
  onView,
  onViewRoute,
  onStop,
}: ActiveLiveLocationSessionsProps) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Active Tracking Sessions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Pending requests and currently running
            location sessions appear here.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void onRefresh();
          }}
          disabled={loading}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading && sessions.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          Loading active tracking sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="font-bold text-gray-700">
            No active tracking sessions
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Send a request using the form above.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sessions.map((session) => (
            <LiveLocationSessionCard
              key={session.id}
              session={session}
              staff={usersById.get(
                session.staffUserId,
              )}
              stopping={
                stoppingSessionId === session.id
              }
              stopDisabled={
                stoppingSessionId !== null
              }
              onView={onView}
              onViewRoute={onViewRoute}
              onStop={onStop}
            />
          ))}
        </div>
      )}
    </section>
  );
}