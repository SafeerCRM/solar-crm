'use client';

import dynamic from 'next/dynamic';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';

import { getAuthHeaders } from '@/lib/authHeaders';

import type {
  LiveLocationSession,
  LiveLocationUser,
} from './LiveLocationSessionCard';

import {
  isReliableRoutePoint,
  RELIABLE_GPS_ACCURACY_METRES,
} from './LiveLocationRouteMap';

import type {
  LiveLocationRoutePoint,
} from './LiveLocationRouteMap';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';

import dayjs, { Dayjs } from 'dayjs';

const LiveLocationRouteMap = dynamic(
  () => import('./LiveLocationRouteMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-gray-200 bg-gray-50 p-6">
        <p className="text-sm font-semibold text-gray-500">
          Loading route map...
        </p>
      </div>
    ),
  },
);

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL;

  type RouteFilterMode =
  | 'FULL_ROUTE'
  | 'DATE_TIME_RANGE'
  | 'SPECIFIC_TIME';

type LiveLocationRouteResponse = {
  sessionId: number;
  staffUserId: number;
  status: string;

  totalDistanceMetres:
    | number
    | string
    | null;

  lastLocationAt: string | null;

    returnedPoints: number;
  maximumPoints: number;

  filterMode?:
    | RouteFilterMode
    | null;

  requestedFrom?: string | null;
  requestedTo?: string | null;

  requestedSpecificTime?:
    | string
    | null;

  closestPointDifferenceSeconds?:
    | number
    | null;

  points: LiveLocationRoutePoint[];
};

type LiveLocationRouteModalProps = {
  session: LiveLocationSession | null;
  staff?: LiveLocationUser;

  onClose: () => void;
};

function getAxiosErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      error.response?.data?.message;

    if (Array.isArray(responseMessage)) {
      return responseMessage.join(', ');
    }

    if (
      typeof responseMessage === 'string' &&
      responseMessage.trim()
    ) {
      return responseMessage;
    }

    if (
      typeof error.message === 'string' &&
      error.message.trim()
    ) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load the tracking route.';
}

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
    timeStyle: 'medium',
  });
}

function formatStatus(
  value?: string | null,
): string {
  if (!value) {
    return '-';
  }

  return String(value)
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
    return `${(metres / 1000).toFixed(
      2,
    )} km`;
  }

  return `${Math.round(metres)} m`;
}

function formatCoordinate(
  value?: number | null,
): string {
  const coordinate = Number(value);

  if (!Number.isFinite(coordinate)) {
    return '-';
  }

  return coordinate.toFixed(6);
}

function formatAccuracy(
  value?: number | null,
): string {
  const accuracy = Number(value);

  if (!Number.isFinite(accuracy)) {
    return '-';
  }

  return `${accuracy.toFixed(1)} m`;
}

function formatSpeed(
  value?: number | null,
): string {
  const speedMetresPerSecond =
    Number(value);

  if (
    !Number.isFinite(
      speedMetresPerSecond,
    )
  ) {
    return '-';
  }

  return `${(
    speedMetresPerSecond * 3.6
  ).toFixed(1)} km/h`;
}

function formatHeading(
  value?: number | null,
): string {
  const heading = Number(value);

  if (!Number.isFinite(heading)) {
    return '-';
  }

  return `${heading.toFixed(0)}°`;
}

function formatAltitude(
  value?: number | null,
): string {
  const altitude = Number(value);

  if (!Number.isFinite(altitude)) {
    return '-';
  }

  return `${altitude.toFixed(1)} m`;
}

function formatTimeDifference(
  value?: number | null,
): string {
  const totalSeconds = Number(value);

  if (
    !Number.isFinite(totalSeconds) ||
    totalSeconds < 0
  ) {
    return '-';
  }

  if (totalSeconds < 60) {
    return `${Math.round(
      totalSeconds,
    )} second(s)`;
  }

  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds = Math.round(
    totalSeconds % 60,
  );

  return `${minutes} minute(s) ${seconds} second(s)`;
}

function formatBattery(
  point: LiveLocationRoutePoint,
): string {
  if (
    point.batteryPercentage === null ||
    point.batteryPercentage === undefined
  ) {
    return '-';
  }

  const percentage = Number(
    point.batteryPercentage,
  );

  if (!Number.isFinite(percentage)) {
    return '-';
  }

  return `${Math.round(percentage)}%${
    point.isCharging
      ? ' · Charging'
      : ''
  }`;
}

function openPointInGoogleMaps(
  point: LiveLocationRoutePoint,
  navigation = false,
) {
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    window.alert(
      'Valid GPS coordinates are not available for this point.',
    );

    return;
  }

  const coordinate = `${latitude},${longitude}`;

  const url = navigation
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        coordinate,
      )}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        coordinate,
      )}`;

  window.open(
    url,
    '_blank',
    'noopener,noreferrer',
  );
}

export default function LiveLocationRouteModal({
  session,
  staff,
  onClose,
}: LiveLocationRouteModalProps) {
  const [route, setRoute] =
    useState<LiveLocationRouteResponse | null>(
      null,
    );

  const [selectedPoint, setSelectedPoint] =
    useState<LiveLocationRoutePoint | null>(
      null,
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

      const [filterMode, setFilterMode] =
    useState<RouteFilterMode>(
      'FULL_ROUTE',
    );

  const [rangeFrom, setRangeFrom] =
    useState('');

  const [rangeTo, setRangeTo] =
    useState('');

  const [
    specificTime,
    setSpecificTime,
  ] = useState('');

  const rangeFromValue = rangeFrom
  ? dayjs(rangeFrom)
  : null;

const rangeToValue = rangeTo
  ? dayjs(rangeTo)
  : null;

const specificTimeValue = specificTime
  ? dayjs(specificTime)
  : null;

const updateDatePart = (
  currentValue: string,
  newDate: Dayjs | null,
  setter: (value: string) => void,
) => {
  if (!newDate) {
    setter('');
    setError(null);
    return;
  }

  const base = currentValue
    ? dayjs(currentValue)
    : dayjs();

  const merged = newDate
    .hour(base.hour())
    .minute(base.minute())
    .second(0)
    .millisecond(0);

  setter(
    merged.format(
      'YYYY-MM-DDTHH:mm',
    ),
  );

  setError(null);
};

const updateTimePart = (
  currentValue: string,
  newTime: Dayjs | null,
  setter: (value: string) => void,
) => {
  if (!newTime) {
    return;
  }

  const base = currentValue
    ? dayjs(currentValue)
    : dayjs();

  const merged = base
    .hour(newTime.hour())
    .minute(newTime.minute())
    .second(0)
    .millisecond(0);

  setter(
    merged.format(
      'YYYY-MM-DDTHH:mm',
    ),
  );

  setError(null);
};

    const fetchRoute = useCallback(
    async (
      requestedMode:
        RouteFilterMode =
        filterMode,
    ) => {
      if (!session) {
        return;
      }

      if (
        requestedMode ===
          'DATE_TIME_RANGE' &&
        (!rangeFrom || !rangeTo)
      ) {
        setError(
          'Select both the route start date/time and end date/time.',
        );

        return;
      }

      if (
        requestedMode ===
          'DATE_TIME_RANGE' &&
        new Date(rangeFrom).getTime() >
          new Date(rangeTo).getTime()
      ) {
        setError(
          'Route start date/time cannot be after the end date/time.',
        );

        return;
      }

      if (
        requestedMode ===
          'SPECIFIC_TIME' &&
        !specificTime
      ) {
        setError(
          'Select the specific date and time to locate.',
        );

        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params: {
          limit: number;
          from?: string;
          to?: string;
          specificTime?: string;
        } = {
          limit: 5000,
        };

        if (
          requestedMode ===
          'DATE_TIME_RANGE'
        ) {
          params.from =
            new Date(
              rangeFrom,
            ).toISOString();

          params.to =
            new Date(
              rangeTo,
            ).toISOString();
        }

        if (
          requestedMode ===
          'SPECIFIC_TIME'
        ) {
          params.specificTime =
            new Date(
              specificTime,
            ).toISOString();
        }

        const response =
          await axios.get<LiveLocationRouteResponse>(
            `${apiBaseUrl}/staff-location/owner/session/${session.id}/route`,
            {
              headers:
                getAuthHeaders(),
              params,
            },
          );

        const responseRoute =
          response.data;

        const points =
          Array.isArray(
            responseRoute?.points,
          )
            ? responseRoute.points
            : [];

        const normalizedRoute: LiveLocationRouteResponse =
          {
            ...responseRoute,

            sessionId:
              Number(
                responseRoute?.sessionId,
              ) || session.id,

            staffUserId:
              Number(
                responseRoute?.staffUserId,
              ) ||
              session.staffUserId,

            returnedPoints:
              Number(
                responseRoute?.returnedPoints,
              ) || points.length,

            maximumPoints:
              Number(
                responseRoute?.maximumPoints,
              ) ||
              (requestedMode ===
              'SPECIFIC_TIME'
                ? 1
                : 5000),

            points,
          };

        setRoute(
          normalizedRoute,
        );

        setSelectedPoint(
          points.length > 0
            ? points[
                points.length - 1
              ]
            : null,
        );
      } catch (requestError) {
        setRoute(null);
        setSelectedPoint(null);

        setError(
          getAxiosErrorMessage(
            requestError,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [
      filterMode,
      rangeFrom,
      rangeTo,
      session,
      specificTime,
    ],
  );

  useEffect(() => {
        if (!session) {
      setRoute(null);
      setSelectedPoint(null);
      setError(null);
      setLoading(false);

      setFilterMode(
        'FULL_ROUTE',
      );

      setRangeFrom('');
      setRangeTo('');
      setSpecificTime('');

      return;
    }

        void fetchRoute(
      'FULL_ROUTE',
    );
  }, [fetchRoute, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

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

  const routePoints = useMemo(
    () =>
      Array.isArray(route?.points)
        ? route.points
        : [],
    [route?.points],
  );

  const latestPoint =
  routePoints.length > 0
    ? routePoints[routePoints.length - 1]
    : null;

    const reliablePointCount =
    useMemo(
      () =>
        routePoints.filter(
          isReliableRoutePoint,
        ).length,
      [routePoints],
    );

  const lowAccuracyPointCount =
    useMemo(
      () =>
        routePoints.filter(
          (point) =>
            !isReliableRoutePoint(
              point,
            ),
        ).length,
      [routePoints],
    );

  if (!session) {
    return null;
  }

  const staffName =
    staff?.name ||
    `Staff User #${session.staffUserId}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Tracking route for ${staffName}`}
    >
      <button
        type="button"
        aria-label="Close route viewer"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <section className="relative z-10 flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
              Live Location Route
            </p>

            <h2 className="mt-1 truncate text-xl font-black text-gray-900 sm:text-2xl">
              {staffName}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Session #{session.id}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">

            {latestPoint && (
  <>
    <button
      type="button"
      onClick={() =>
        openPointInGoogleMaps(
          latestPoint,
          false,
        )
      }
      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100"
    >
      Open Latest GPS
    </button>

    <button
      type="button"
      onClick={() =>
        openPointInGoogleMaps(
          latestPoint,
          true,
        )
      }
      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
    >
      Navigate to Staff
    </button>
  </>
)}
            <button
              type="button"
              onClick={() => {
  void fetchRoute(
    filterMode,
  );
}}
              disabled={loading}
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Refreshing...'
                : 'Refresh Route'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl font-bold text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">

            <LocalizationProvider
  dateAdapter={AdapterDayjs}
>

            <div className="mb-4 rounded-3xl border border-gray-200 bg-gray-50 p-4">
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => {
        setFilterMode(
          'FULL_ROUTE',
        );

        void fetchRoute(
          'FULL_ROUTE',
        );
      }}
      disabled={loading}
      className={`rounded-xl px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${
        filterMode ===
        'FULL_ROUTE'
          ? 'bg-blue-600 text-white'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      Full Route
    </button>

    <button
      type="button"
      onClick={() => {
        setFilterMode(
          'DATE_TIME_RANGE',
        );

        setError(null);
      }}
      disabled={loading}
      className={`rounded-xl px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${
        filterMode ===
        'DATE_TIME_RANGE'
          ? 'bg-blue-600 text-white'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      Date & Time Range
    </button>

    <button
      type="button"
      onClick={() => {
        setFilterMode(
          'SPECIFIC_TIME',
        );

        setError(null);
      }}
      disabled={loading}
      className={`rounded-xl px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${
        filterMode ===
        'SPECIFIC_TIME'
          ? 'bg-blue-600 text-white'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      Specific Time
    </button>
  </div>

  {filterMode ===
    'DATE_TIME_RANGE' && (
    <div className="mt-4 space-y-4">
  <div>
    <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-600">
      From Date & Time
    </p>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <DatePicker
        label="From Date"
        value={rangeFromValue}
        onChange={(newDate) => {
          updateDatePart(
            rangeFrom,
            newDate,
            setRangeFrom,
          );
        }}
        disabled={loading}
        slotProps={{
          textField: {
            fullWidth: true,
          },
        }}
      />

      <MobileTimePicker
        label="From Time"
        value={rangeFromValue}
        onChange={(newTime) => {
          updateTimePart(
            rangeFrom,
            newTime,
            setRangeFrom,
          );
        }}
        disabled={loading}
        ampm
        ampmInClock
        slotProps={{
          textField: {
            fullWidth: true,
          },
        }}
      />
    </div>
  </div>

  <div>
    <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-600">
      To Date & Time
    </p>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <DatePicker
        label="To Date"
        value={rangeToValue}
        onChange={(newDate) => {
          updateDatePart(
            rangeTo,
            newDate,
            setRangeTo,
          );
        }}
        disabled={loading}
        slotProps={{
          textField: {
            fullWidth: true,
          },
        }}
      />

      <MobileTimePicker
        label="To Time"
        value={rangeToValue}
        onChange={(newTime) => {
          updateTimePart(
            rangeTo,
            newTime,
            setRangeTo,
          );
        }}
        disabled={loading}
        ampm
        ampmInClock
        slotProps={{
          textField: {
            fullWidth: true,
          },
        }}
      />
    </div>
  </div>

  <div className="flex justify-end">
    <button
      type="button"
      onClick={() => {
        void fetchRoute(
          'DATE_TIME_RANGE',
        );
      }}
      disabled={
        loading ||
        !rangeFrom ||
        !rangeTo
      }
      className="w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {loading
        ? 'Loading...'
        : 'Show Route'}
    </button>
  </div>
</div>
  )}

  {filterMode ===
    'SPECIFIC_TIME' && (
    <div className="mt-4 space-y-4">
  <div>
    <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-600">
      Location Date & Time
    </p>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <DatePicker
        label="Date"
        value={specificTimeValue}
        onChange={(newDate) => {
          updateDatePart(
            specificTime,
            newDate,
            setSpecificTime,
          );
        }}
        disabled={loading}
        slotProps={{
          textField: {
            fullWidth: true,
          },
        }}
      />

      <MobileTimePicker
        label="Time"
        value={specificTimeValue}
        onChange={(newTime) => {
          updateTimePart(
            specificTime,
            newTime,
            setSpecificTime,
          );
        }}
        disabled={loading}
        ampm
        ampmInClock
        slotProps={{
          textField: {
            fullWidth: true,
          },
        }}
      />
    </div>
  </div>

  <div className="flex justify-end">
    <button
      type="button"
      onClick={() => {
        void fetchRoute(
          'SPECIFIC_TIME',
        );
      }}
      disabled={
        loading ||
        !specificTime
      }
      className="w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {loading
        ? 'Locating...'
        : 'Find Location'}
    </button>
  </div>
</div>
  )}

  {route?.filterMode ===
    'DATE_TIME_RANGE' && (
    <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
      <p className="font-black">
        Showing selected route range
      </p>

      <p className="mt-1">
        {formatDateTime(
          route.requestedFrom,
        )}{' '}
        to{' '}
        {formatDateTime(
          route.requestedTo,
        )}
      </p>

      <p className="mt-1 font-semibold">
        {route.returnedPoints}{' '}
        GPS point(s) found.
      </p>
    </div>
  )}

  {route?.filterMode ===
    'SPECIFIC_TIME' && (
    <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
      <p className="font-black">
        Closest recorded location
      </p>

      <p className="mt-1">
        Requested:{' '}
        {formatDateTime(
          route.requestedSpecificTime,
        )}
      </p>

      {routePoints.length > 0 ? (
        <>
          <p className="mt-1">
            Recorded:{' '}
            {formatDateTime(
              routePoints[0]
                .recordedAt,
            )}
          </p>

          <p className="mt-1 font-semibold">
            Time difference:{' '}
            {formatTimeDifference(
              route.closestPointDifferenceSeconds,
            )}
          </p>
        </>
      ) : (
        <p className="mt-1 font-semibold">
          No recorded GPS point was
          available for this session.
        </p>
      )}
    </div>
  )}
</div>
</LocalizationProvider>

                    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500">
                Status
              </p>

              <p className="mt-1 font-black text-gray-900">
                {formatStatus(
                  route?.status ||
                    session.status,
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500">
  {route?.filterMode ===
  'FULL_ROUTE'
    ? 'Session Distance'
    : 'Full Session Distance'}
</p>

              <p className="mt-1 font-black text-gray-900">
                {formatDistance(
                  route?.totalDistanceMetres ??
                    session.totalDistanceMetres,
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500">
                Route Points
              </p>

              <p className="mt-1 font-black text-gray-900">
                {routePoints.length}
              </p>
            </div>

                        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-bold text-green-700">
                Reliable Points
              </p>

              <p className="mt-1 font-black text-green-900">
                {reliablePointCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-700">
                Low-Accuracy Points
              </p>

              <p className="mt-1 font-black text-amber-900">
                {lowAccuracyPointCount}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500">
                Last Location
              </p>

              <p className="mt-1 text-sm font-black text-gray-900">
                {formatDateTime(
                  route?.lastLocationAt ??
                    session.lastLocationAt,
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500">
                Point Limit
              </p>

              <p className="mt-1 font-black text-gray-900">
  {route?.maximumPoints ??
    5000}
</p>
            </div>
          </div>

                    {routePoints.length > 0 && (
            <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-black">
                Route reliability
              </p>

              <p className="mt-1 leading-6">
                All raw GPS points remain visible
                for audit. The blue travelled line
                connects only non-mock points with
                accuracy of{' '}
                {RELIABLE_GPS_ACCURACY_METRES} m
                or better. Low-accuracy points do
                not increase the trusted route
                line.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {loading && !route ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-500">
                Loading tracking route...
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0">
                <LiveLocationRouteMap
                  points={routePoints}
                  selectedPointId={
                    selectedPoint?.id || null
                  }
                  onPointSelect={
                    setSelectedPoint
                  }
                />

                                <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-gray-600">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                    Blue line: reliable route
                  </span>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                    Green: route start
                  </span>

                  <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
                    Red: latest position
                  </span>

                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                    Amber: low accuracy
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-800">
                    Black: mock location
                  </span>

                  <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">
                    Purple: selected point
                  </span>
                </div>
              </div>

              <aside className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="font-black text-gray-900">
                  Selected GPS Point
                </h3>

                {!selectedPoint ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500">
                    Select a point on the map to
                    inspect its tracking details.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
  <button
    type="button"
    onClick={() =>
      openPointInGoogleMaps(
        selectedPoint,
        false,
      )
    }
    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"
  >
    Open GPS
  </button>

  <button
    type="button"
    onClick={() =>
      openPointInGoogleMaps(
        selectedPoint,
        true,
      )
    }
    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-black text-white hover:bg-blue-700"
  >
    Navigate Here
  </button>
</div>
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-bold text-gray-500">
                        Recorded At
                      </p>

                      <p className="mt-1 text-sm font-black text-gray-900">
                        {formatDateTime(
                          selectedPoint.recordedAt,
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-bold text-gray-500">
                        Received By Server
                      </p>

                      <p className="mt-1 text-sm font-black text-gray-900">
                        {formatDateTime(
                          selectedPoint.receivedAt,
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-bold text-gray-500">
                        Coordinates
                      </p>

                      <p className="mt-1 break-all font-mono text-xs font-bold text-gray-800">
                        {formatCoordinate(
                          selectedPoint.latitude,
                        )}
                        ,{' '}
                        {formatCoordinate(
                          selectedPoint.longitude,
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                                            <div
                        className={`rounded-2xl border p-3 ${
                          isReliableRoutePoint(
                            selectedPoint,
                          )
                            ? 'border-green-200 bg-green-50'
                            : 'border-amber-200 bg-amber-50'
                        }`}
                      >
                        <p
                          className={`text-xs font-bold ${
                            isReliableRoutePoint(
                              selectedPoint,
                            )
                              ? 'text-green-700'
                              : 'text-amber-700'
                          }`}
                        >
                          Accuracy
                        </p>

                        <p
                          className={`mt-1 text-sm font-black ${
                            isReliableRoutePoint(
                              selectedPoint,
                            )
                              ? 'text-green-900'
                              : 'text-amber-900'
                          }`}
                        >
                          {formatAccuracy(
                            selectedPoint.accuracyMetres,
                          )}
                        </p>

                        <p
                          className={`mt-1 text-xs font-bold ${
                            isReliableRoutePoint(
                              selectedPoint,
                            )
                              ? 'text-green-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {selectedPoint.isMockLocation
                            ? 'Mock location'
                            : isReliableRoutePoint(
                                  selectedPoint,
                                )
                              ? 'Reliable GPS point'
                              : 'Low-accuracy GPS point'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold text-gray-500">
                          Speed
                        </p>

                        <p className="mt-1 text-sm font-black text-gray-900">
                          {formatSpeed(
                            selectedPoint.speedMetresPerSecond,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold text-gray-500">
                          Heading
                        </p>

                        <p className="mt-1 text-sm font-black text-gray-900">
                          {formatHeading(
                            selectedPoint.headingDegrees,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold text-gray-500">
                          Altitude
                        </p>

                        <p className="mt-1 text-sm font-black text-gray-900">
                          {formatAltitude(
                            selectedPoint.altitudeMetres,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold text-gray-500">
                          Battery
                        </p>

                        <p className="mt-1 text-sm font-black text-gray-900">
                          {formatBattery(
                            selectedPoint,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold text-gray-500">
                          Platform
                        </p>

                        <p className="mt-1 text-sm font-black text-gray-900">
                          {formatStatus(
                            selectedPoint.platform,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-bold text-gray-500">
                        Device Sequence
                      </p>

                      <p className="mt-1 break-all font-mono text-xs font-bold text-gray-800">
                        {selectedPoint.sequenceNumber}
                      </p>
                    </div>

                    {selectedPoint.deviceId && (
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold text-gray-500">
                          Device ID
                        </p>

                        <p className="mt-1 break-all font-mono text-xs font-bold text-gray-800">
                          {selectedPoint.deviceId}
                        </p>
                      </div>
                    )}

                    {selectedPoint.wasRecordedOffline && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                        This coordinate was saved
                        offline and uploaded later.
                      </div>
                    )}

                    {selectedPoint.isMockLocation && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-black text-red-700">
                        Mock location detected for
                        this coordinate.
                      </div>
                    )}
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}