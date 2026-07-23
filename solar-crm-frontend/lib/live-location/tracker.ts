import {
  Geolocation,
  type CallbackID,
  type Position,
} from '@capacitor/geolocation';

import { LIVE_LOCATION_CONFIG } from './constants';
import { getStaffLocationDeviceInfo } from './device';
import {
  flushLocationPointQueue,
  queueAndMaybeUploadLocationPoint,
} from './queue';
import { getNextLocationSequenceNumber } from './storage';

import type {
  StaffLocationGpsStatus,
  StaffLocationPermissionStatus,
  StaffLocationPointPayload,
} from './types';

export type LiveLocationTrackerState = {
  running: boolean;

  gpsStatus: StaffLocationGpsStatus;
  permissionStatus?: StaffLocationPermissionStatus;

  lastPoint?: StaffLocationPointPayload;
  lastPointAt?: string;

  pendingOfflinePoints?: number;

  failureCode?: string;
  failureMessage?: string;
};

export type StartLiveLocationTrackerOptions = {
  sessionId: number;

  onStateChange?: (
    state: LiveLocationTrackerState,
  ) => void;

  onPointCollected?: (
    point: StaffLocationPointPayload,
  ) => void;

  onError?: (
    state: LiveLocationTrackerState,
  ) => void;
};

let activeWatchId: CallbackID | null = null;
let activeSessionId: number | null = null;
let stoppingPromise: Promise<void> | null = null;

function cleanOptionalNumber(
  value: number | null | undefined,
): number | undefined {
  return typeof value === 'number' &&
    Number.isFinite(value)
    ? value
    : undefined;
}

function createPointFromPosition(
  position: Position,
): StaffLocationPointPayload {
  const timestamp =
    typeof position.timestamp === 'number' &&
    Number.isFinite(position.timestamp)
      ? position.timestamp
      : Date.now();

  return {
    sequenceNumber:
      getNextLocationSequenceNumber(),

    latitude: position.coords.latitude,
    longitude: position.coords.longitude,

    accuracyMetres: cleanOptionalNumber(
      position.coords.accuracy,
    ),

    altitudeMetres: cleanOptionalNumber(
      position.coords.altitude,
    ),

    altitudeAccuracyMetres: cleanOptionalNumber(
      position.coords.altitudeAccuracy,
    ),

    speedMetresPerSecond: cleanOptionalNumber(
      position.coords.speed,
    ),

    headingDegrees: cleanOptionalNumber(
      position.coords.heading,
    ),

    wasRecordedOffline:
      typeof navigator !== 'undefined'
        ? navigator.onLine === false
        : false,

    recordedAt: new Date(timestamp).toISOString(),
  };
}

function readErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  ) {
    const value = (error as { code?: unknown }).code;

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value);
    }
  }

  return undefined;
}

function readErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message ===
      'string'
  ) {
    return String(
      (error as { message: string }).message,
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to obtain device location';
}

function mapGpsFailure(
  error: unknown,
): {
  gpsStatus: StaffLocationGpsStatus;
  permissionStatus?: StaffLocationPermissionStatus;
  failureCode?: string;
  failureMessage: string;
} {
  const failureCode = readErrorCode(error);
  const failureMessage = readErrorMessage(error);

  /*
   * Official Capacitor native error meanings:
   *
   * OS-PLUG-GLOC-0003:
   * Location permission was denied.
   *
   * OS-PLUG-GLOC-0007:
   * Location services are disabled.
   *
   * OS-PLUG-GLOC-0008:
   * Location services are restricted.
   *
   * OS-PLUG-GLOC-0009:
   * Request to enable location was denied.
   *
   * OS-PLUG-GLOC-0017:
   * Both network and device location are off.
   */
  if (failureCode === 'OS-PLUG-GLOC-0003') {
    return {
      gpsStatus: 'UNKNOWN',
      permissionStatus: 'DENIED',
      failureCode,
      failureMessage,
    };
  }

  if (failureCode === 'OS-PLUG-GLOC-0008') {
    return {
      gpsStatus: 'UNKNOWN',
      permissionStatus: 'RESTRICTED',
      failureCode,
      failureMessage,
    };
  }

  if (
    failureCode === 'OS-PLUG-GLOC-0007' ||
    failureCode === 'OS-PLUG-GLOC-0009' ||
    failureCode === 'OS-PLUG-GLOC-0017'
  ) {
    return {
      gpsStatus: 'DISABLED',
      failureCode,
      failureMessage,
    };
  }

  return {
    gpsStatus: 'UNKNOWN',
    failureCode,
    failureMessage,
  };
}

export function isLiveLocationTrackerRunning(): boolean {
  return activeWatchId !== null;
}

export function getTrackedLocationSessionId():
  | number
  | null {
  return activeSessionId;
}

/**
 * Starts a single active Capacitor location watch.
 *
 * Safety rules:
 * - only one watch may exist at a time;
 * - a repeated call for the same session is ignored;
 * - a watch belonging to another session is cleared first;
 * - every point is persisted before upload;
 * - upload failure does not discard the point.
 */
export async function startLiveLocationTracker(
  options: StartLiveLocationTrackerOptions,
): Promise<void> {
  const { sessionId } = options;

  if (
    activeWatchId !== null &&
    activeSessionId === sessionId
  ) {
    return;
  }

  if (activeWatchId !== null) {
    await stopLiveLocationTracker();
  }

  const deviceInfo = getStaffLocationDeviceInfo();

  activeSessionId = sessionId;

  options.onStateChange?.({
    running: true,
    gpsStatus: 'UNKNOWN',
  });

  try {
    /*
     * Attempt to synchronize any points retained from a temporary network
     * failure before beginning the new watch callback flow.
     */
    await flushLocationPointQueue(
      sessionId,
      deviceInfo.platform,
      deviceInfo.deviceId,
    ).catch(() => {
      // Existing queued points remain stored for the next attempt.
    });

    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,

        timeout:
          LIVE_LOCATION_CONFIG.locationTimeoutMs,

        maximumAge:
          LIVE_LOCATION_CONFIG.maximumLocationAgeMs,

        interval:
          LIVE_LOCATION_CONFIG.locationUpdateIntervalMs,

        minimumUpdateInterval:
          LIVE_LOCATION_CONFIG.locationUpdateIntervalMs,

        /*
         * Capacitor 8 can fall back to Android LocationManager when Google
         * Play Services location checks fail or are unavailable.
         */
        enableLocationFallback: true,
      },
      (position, error) => {
        if (error) {
          const mappedFailure = mapGpsFailure(error);

          const state: LiveLocationTrackerState = {
            running: true,
            gpsStatus: mappedFailure.gpsStatus,
            permissionStatus:
              mappedFailure.permissionStatus,
            failureCode: mappedFailure.failureCode,
            failureMessage:
              mappedFailure.failureMessage,
          };

          options.onStateChange?.(state);
          options.onError?.(state);
          return;
        }

        if (!position) {
          return;
        }

        const point = createPointFromPosition(position);

        options.onPointCollected?.(point);

        /*
         * The queue stores the point first. forceUpload sends live points
         * immediately when online while preserving them locally if the
         * network or API is unavailable.
         */
        void queueAndMaybeUploadLocationPoint(
          sessionId,
          deviceInfo.platform,
          point,
          {
            deviceId: deviceInfo.deviceId,
            forceUpload: true,
          },
        )
          .then((result) => {
            options.onStateChange?.({
              running: true,
              gpsStatus: 'ENABLED',
              permissionStatus: 'GRANTED',
              lastPoint: point,
              lastPointAt: point.recordedAt,
              pendingOfflinePoints: result.remaining,
            });
          })
          .catch((uploadError: unknown) => {
            /*
             * The point remains in local storage. This is an upload problem,
             * not necessarily a GPS problem.
             */
            options.onStateChange?.({
              running: true,
              gpsStatus: 'ENABLED',
              permissionStatus: 'GRANTED',
              lastPoint: point,
              lastPointAt: point.recordedAt,
              failureCode: 'POINT_UPLOAD_FAILED',
              failureMessage:
                readErrorMessage(uploadError),
            });
          });
      },
    );

    /*
     * The watch may have been stopped while watchPosition was awaiting its
     * native result.
     */
    if (activeSessionId !== sessionId) {
      await Geolocation.clearWatch({
        id: watchId,
      }).catch(() => undefined);

      return;
    }

    activeWatchId = watchId;

    options.onStateChange?.({
      running: true,
      gpsStatus: 'ENABLED',
      permissionStatus: 'GRANTED',
    });
  } catch (error) {
    activeSessionId = null;
    activeWatchId = null;

    const mappedFailure = mapGpsFailure(error);

    const state: LiveLocationTrackerState = {
      running: false,
      gpsStatus: mappedFailure.gpsStatus,
      permissionStatus:
        mappedFailure.permissionStatus,
      failureCode: mappedFailure.failureCode,
      failureMessage:
        mappedFailure.failureMessage,
    };

    options.onStateChange?.(state);
    options.onError?.(state);

    throw error;
  }
}

/**
 * Clears the current native location watch.
 *
 * Calling this repeatedly is safe.
 */
export async function stopLiveLocationTracker():
  Promise<void> {
  if (stoppingPromise) {
    return stoppingPromise;
  }

  const watchId = activeWatchId;

  activeWatchId = null;
  activeSessionId = null;

  if (!watchId) {
    return;
  }

  stoppingPromise = Geolocation.clearWatch({
    id: watchId,
  })
    .catch((error: unknown) => {
      console.error(
        'Failed to clear live location watch:',
        error,
      );
    })
    .finally(() => {
      stoppingPromise = null;
    });

  return stoppingPromise;
}