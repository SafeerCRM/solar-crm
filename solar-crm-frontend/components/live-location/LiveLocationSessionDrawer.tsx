'use client';

import {
  useEffect,
} from 'react';

import {
  LiveLocationSession,
  LiveLocationUser,
} from './LiveLocationSessionCard';
import LiveLocationEventTimeline from './LiveLocationEventTimeline';

type LiveLocationSessionDrawerProps = {
  session: LiveLocationSession | null;
  staff?: LiveLocationUser;
  onClose: () => void;
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

function formatBoolean(
  value?: boolean | null,
): string {
  if (value === true) {
    return 'Yes';
  }

  if (value === false) {
    return 'No';
  }

  return '-';
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

function formatNumber(
  value?: number | string | null,
  suffix = '',
): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '-';
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '-';
  }

  return `${numericValue}${suffix}`;
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

function formatSpeed(
  value?: number | string | null,
): string {
  const metresPerSecond = Number(value);

  if (!Number.isFinite(metresPerSecond)) {
    return '-';
  }

  const kilometresPerHour =
    metresPerSecond * 3.6;

  return `${kilometresPerHour.toFixed(1)} km/h`;
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({
  label,
  value,
}: DetailRowProps) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-gray-800">
        {value}
      </p>
    </div>
  );
}

export default function LiveLocationSessionDrawer({
  session,
  staff,
  onClose,
}: LiveLocationSessionDrawerProps) {
  useEffect(() => {
    if (!session) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [onClose, session]);

  if (!session) {
    return null;
  }

  const hasCoordinates =
    session.lastLatitude !== null &&
    session.lastLatitude !== undefined &&
    session.lastLongitude !== null &&
    session.lastLongitude !== undefined;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close session details"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="live-location-session-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 md:p-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Live Location Session
            </p>

            <h2
              id="live-location-session-title"
              className="mt-1 truncate text-xl font-black text-gray-900"
            >
              {staff?.name ||
                `Staff User #${session.staffUserId}`}
            </h2>

            {staff?.email && (
              <p className="mt-1 truncate text-sm text-gray-500">
                {staff.email}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-black text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6">
          <section>
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">
              Session Status
            </h3>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <DetailRow
                label="Session ID"
                value={`#${session.id}`}
              />

              <DetailRow
                label="Status"
                value={formatStatus(
                  session.status,
                )}
              />

              <DetailRow
                label="Active"
                value={formatBoolean(
                  session.isActive,
                )}
              />

              <DetailRow
                label="Request opened"
                value={formatBoolean(
                  session.requestOpened,
                )}
              />

              <DetailRow
                label="Request accepted"
                value={formatBoolean(
                  session.requestAccepted,
                )}
              />

              <DetailRow
                label="Staff user ID"
                value={`#${session.staffUserId}`}
              />
            </div>
          </section>

          {session.requestRemark && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <h3 className="text-xs font-black uppercase tracking-wide text-blue-700">
                Request Remark
              </h3>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {session.requestRemark}
              </p>
            </section>
          )}

          <section>
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">
              Timeline
            </h3>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow
                label="Requested"
                value={formatDateTime(
                  session.requestedAt,
                )}
              />

              <DetailRow
                label="Request opened"
                value={formatDateTime(
                  session.requestOpenedAt,
                )}
              />

              <DetailRow
                label="Accepted"
                value={formatDateTime(
                  session.acceptedAt,
                )}
              />

              <DetailRow
                label="Tracking started"
                value={formatDateTime(
                  session.startedAt,
                )}
              />

              <DetailRow
                label="Last location"
                value={formatDateTime(
                  session.lastLocationAt,
                )}
              />

              <DetailRow
                label="Last heartbeat"
                value={formatDateTime(
                  session.lastHeartbeatAt,
                )}
              />

              <DetailRow
                label="Last status change"
                value={formatDateTime(
                  session.lastStatusChangeAt,
                )}
              />

              <DetailRow
                label="Stopped"
                value={formatDateTime(
                  session.stoppedAt,
                )}
              />
            </div>
          </section>

          <LiveLocationEventTimeline
  sessionId={session.id}
/>

          <section>
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">
              Device and Tracking
            </h3>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow
                label="Permission"
                value={formatStatus(
                  session.permissionStatus,
                )}
              />

              <DetailRow
                label="GPS"
                value={formatStatus(
                  session.gpsStatus,
                )}
              />

              <DetailRow
                label="Network"
                value={formatStatus(
                  session.networkStatus,
                )}
              />

              <DetailRow
                label="Battery"
                value={
                  session.batteryPercentage ===
                    null ||
                  session.batteryPercentage ===
                    undefined
                    ? '-'
                    : `${formatNumber(
                        session.batteryPercentage,
                        '%',
                      )}${
                        session.isCharging
                          ? ' · Charging'
                          : ''
                      }`
                }
              />

              <DetailRow
                label="Accuracy"
                value={formatNumber(
                  session.lastAccuracyMetres,
                  ' m',
                )}
              />

              <DetailRow
                label="Speed"
                value={formatSpeed(
                  session.lastSpeedMetresPerSecond,
                )}
              />

              <DetailRow
                label="Distance"
                value={formatDistance(
                  session.totalDistanceMetres,
                )}
              />

              <DetailRow
                label="Charging"
                value={formatBoolean(
                  session.isCharging,
                )}
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">
              Latest Location
            </h3>

            {hasCoordinates ? (
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="font-mono text-sm font-bold text-gray-800">
                  {formatCoordinate(
                    session.lastLatitude,
                  )}
                  ,{' '}
                  {formatCoordinate(
                    session.lastLongitude,
                  )}
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                No location coordinates have been
                received yet.
              </div>
            )}
          </section>

          {(session.currentFailureCode ||
            session.currentFailureMessage) && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <h3 className="text-xs font-black uppercase tracking-wide text-red-700">
                Current Tracking Warning
              </h3>

              {session.currentFailureCode && (
                <p className="mt-2 text-sm font-bold text-red-800">
                  {formatStatus(
                    session.currentFailureCode,
                  )}
                </p>
              )}

              {session.currentFailureMessage && (
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-red-700">
                  {
                    session.currentFailureMessage
                  }
                </p>
              )}
            </section>
          )}

          {(session.stopReason ||
            session.stoppedAt) && (
            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-700">
                Stop Details
              </h3>

              <p className="mt-2 text-sm text-gray-700">
                <span className="font-bold">
                  Reason:
                </span>{' '}
                {formatStatus(
                  session.stopReason,
                )}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                <span className="font-bold">
                  Stopped at:
                </span>{' '}
                {formatDateTime(
                  session.stoppedAt,
                )}
              </p>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}