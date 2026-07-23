'use client';

export type LiveLocationUser = {
  id: number;
  name: string;
  email?: string;
  role?: string;
  roles?: string[] | null;
  isHidden?: boolean;
};

export type LiveLocationSession = {
  id: number;
  staffUserId: number;
  requestedByUserId?: number | null;
  stoppedByUserId?: number | null;

  status: string;
  isActive: boolean;

  requestOpened?: boolean;
  requestAccepted?: boolean;

  requestedAt?: string | null;
  requestOpenedAt?: string | null;
  acceptedAt?: string | null;
  startedAt?: string | null;
  stoppedAt?: string | null;

  lastLocationAt?: string | null;
  lastHeartbeatAt?: string | null;
  lastStatusChangeAt?: string | null;

  lastLatitude?: number | string | null;
  lastLongitude?: number | string | null;
  lastAccuracyMetres?: number | string | null;
  lastSpeedMetresPerSecond?: number | string | null;

  batteryPercentage?: number | string | null;
  isCharging?: boolean;

  totalDistanceMetres?: number | string | null;

  permissionStatus?: string | null;
  gpsStatus?: string | null;
  networkStatus?: string | null;

  currentFailureCode?: string | null;
  currentFailureMessage?: string | null;

  requestRemark?: string | null;
  stopReason?: string | null;
};

type LiveLocationSessionCardProps = {
  session: LiveLocationSession;
  staff?: LiveLocationUser;
  stopping: boolean;
  stopDisabled: boolean;

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

  if (
    !Number.isFinite(metres) ||
    metres <= 0
  ) {
    return '0 m';
  }

  if (metres >= 1000) {
    return `${(metres / 1000).toFixed(2)} km`;
  }

  return `${Math.round(metres)} m`;
}

function formatCoordinate(
  value?: number | string | null,
): string {
  const coordinate = Number(value);

  if (!Number.isFinite(coordinate)) {
    return '-';
  }

  return coordinate.toFixed(6);
}

function formatBattery(
  batteryPercentage?: number | string | null,
  isCharging?: boolean,
): string {
  if (
    batteryPercentage === null ||
    batteryPercentage === undefined
  ) {
    return '-';
  }

  const percentage =
    Number(batteryPercentage);

  if (!Number.isFinite(percentage)) {
    return '-';
  }

  return `${Math.round(percentage)}%${
    isCharging ? ' · Charging' : ''
  }`;
}

function getStatusClasses(
  status?: string,
): string {
  switch (status) {
    case 'LIVE':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';

    case 'REQUEST_PENDING':
      return 'border-amber-200 bg-amber-50 text-amber-700';

    case 'STARTING':
      return 'border-blue-200 bg-blue-50 text-blue-700';

    case 'DELAYED':
    case 'DEVICE_OFFLINE':
    case 'GPS_DISABLED':
      return 'border-orange-200 bg-orange-50 text-orange-700';

    case 'PERMISSION_DENIED':
    case 'PERMISSION_RESTRICTED':
    case 'APP_BACKGROUND_RESTRICTED':
      return 'border-red-200 bg-red-50 text-red-700';

    default:
      return 'border-gray-200 bg-gray-50 text-gray-700';
  }
}

export default function LiveLocationSessionCard({
  session,
  staff,
  stopping,
    stopDisabled,
  onView,
  onViewRoute,
  onStop,
}: LiveLocationSessionCardProps) {
  const hasCoordinates =
    session.lastLatitude !== null &&
    session.lastLatitude !== undefined &&
    session.lastLongitude !== null &&
    session.lastLongitude !== undefined;

  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-gray-900">
            {staff?.name ||
              `Staff User #${session.staffUserId}`}
          </p>

          {staff?.email && (
            <p className="mt-1 truncate text-sm text-gray-500">
              {staff.email}
            </p>
          )}
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
            session.status,
          )}`}
        >
          {formatStatus(session.status)}
        </span>
      </div>

      {session.requestRemark && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
            Request remark
          </p>

          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
            {session.requestRemark}
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500">
            Requested
          </p>

          <p className="mt-1 font-bold text-gray-800">
            {formatDateTime(
              session.requestedAt,
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500">
            Accepted
          </p>

          <p className="mt-1 font-bold text-gray-800">
            {session.requestAccepted
              ? formatDateTime(
                  session.acceptedAt,
                )
              : 'Waiting'}
          </p>
        </div>

        <div className="rounded-2xl bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500">
            Last location
          </p>

          <p className="mt-1 font-bold text-gray-800">
            {formatDateTime(
              session.lastLocationAt,
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500">
            Last heartbeat
          </p>

          <p className="mt-1 font-bold text-gray-800">
            {formatDateTime(
              session.lastHeartbeatAt,
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500">
            Distance
          </p>

          <p className="mt-1 font-bold text-gray-800">
            {formatDistance(
              session.totalDistanceMetres,
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500">
            Battery
          </p>

          <p className="mt-1 font-bold text-gray-800">
            {formatBattery(
              session.batteryPercentage,
              session.isCharging,
            )}
          </p>
        </div>
      </div>

      {hasCoordinates && (
        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Latest coordinates
          </p>

          <p className="mt-1 font-mono text-xs text-gray-700">
            {formatCoordinate(
              session.lastLatitude,
            )}
            ,{' '}
            {formatCoordinate(
              session.lastLongitude,
            )}
          </p>
        </div>
      )}

      {session.currentFailureMessage && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-bold">
            Tracking warning
          </p>

          <p className="mt-1">
            {session.currentFailureMessage}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <p className="text-xs text-gray-400">
    Session #{session.id}
  </p>

    <div className="flex flex-col gap-2 sm:flex-row">
    <button
      type="button"
      onClick={() => {
        onView(session);
      }}
      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"
    >
      View Details
    </button>

    <button
      type="button"
      onClick={() => {
        onViewRoute(session);
      }}
      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100"
    >
      View Route
    </button>

    <button
      type="button"
      onClick={() => {
        void onStop(session);
      }}
      disabled={stopDisabled}
      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {stopping
        ? 'Stopping...'
        : 'Stop Tracking'}
    </button>
  </div>
</div>
    </article>
  );
}