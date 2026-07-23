import {
  App,
  type AppState,
} from '@capacitor/app';

import type {
  PluginListenerHandle,
} from '@capacitor/core';

import {
  sendMyLocationHeartbeat,
} from './api';

import {
  LIVE_LOCATION_CONFIG,
} from './constants';

import {
  getNetworkStatus,
  getStaffLocationDeviceInfo,
} from './device';

import {
  checkLocationPermission,
} from './permissions';

import {
  flushLocationPointQueue,
  getPendingLocationPointCount,
} from './queue';

import type {
  LiveLocationTrackerState,
} from './tracker';

import type {
  StaffLocationGpsStatus,
  StaffLocationHeartbeatPayload,
  StaffLocationPermissionStatus,
  StaffLocationSession,
} from './types';

export type LiveLocationHeartbeatState = {
  running: boolean;
  appInBackground: boolean;
  lastHeartbeatAt?: string;
  lastHeartbeatResponse?: StaffLocationSession;
  failureCode?: string;
  failureMessage?: string;
};

export type StartLiveLocationHeartbeatOptions = {
  sessionId: number;

  /**
   * Returns the most recent GPS tracker state.
   *
   * This keeps heartbeat.ts independent from React and prevents duplicate
   * location watches.
   */
  getTrackerState: () =>
    | LiveLocationTrackerState
    | null;

  onStateChange?: (
    state: LiveLocationHeartbeatState,
  ) => void;

  onSessionUpdate?: (
    session: StaffLocationSession,
  ) => void;

  onError?: (
    error: unknown,
    state: LiveLocationHeartbeatState,
  ) => void;
};

type ActiveHeartbeatRuntime = {
  sessionId: number;
  intervalId: number | null;
  appStateListener: PluginListenerHandle | null;
  onlineListener: (() => void) | null;
  offlineListener: (() => void) | null;
  appInBackground: boolean;
  heartbeatRunning: boolean;
  stopped: boolean;
};

let activeRuntime: ActiveHeartbeatRuntime | null = null;

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

  return 'Location heartbeat failed';
}

function resolvePermissionStatus(
  trackerState: LiveLocationTrackerState | null,
  checkedPermission:
    | StaffLocationPermissionStatus
    | undefined,
): StaffLocationPermissionStatus {
  return (
    trackerState?.permissionStatus ||
    checkedPermission ||
    'UNKNOWN'
  );
}

function resolveGpsStatus(
  trackerState: LiveLocationTrackerState | null,
  checkedPermission:
    | StaffLocationPermissionStatus
    | undefined,
): StaffLocationGpsStatus {
  if (trackerState?.gpsStatus) {
    return trackerState.gpsStatus;
  }

  if (
    checkedPermission === 'GRANTED' ||
    checkedPermission === 'LIMITED'
  ) {
    /*
     * Permission alone does not prove that Android location services are
     * currently enabled, so UNKNOWN is safer until the tracker receives a
     * position or a native GPS error.
     */
    return 'UNKNOWN';
  }

  return 'UNKNOWN';
}

async function sendHeartbeat(
  runtime: ActiveHeartbeatRuntime,
  options: StartLiveLocationHeartbeatOptions,
): Promise<StaffLocationSession | null> {
  if (
    runtime.stopped ||
    runtime.heartbeatRunning
  ) {
    return null;
  }

  runtime.heartbeatRunning = true;

  try {
    const trackerState = options.getTrackerState();

    const permissionResult =
      await checkLocationPermission();

    const deviceInfo =
      getStaffLocationDeviceInfo();

    const pendingOfflinePoints =
      getPendingLocationPointCount();

    const payload: StaffLocationHeartbeatPayload = {
      platform: deviceInfo.platform,

      permissionStatus:
        resolvePermissionStatus(
          trackerState,
          permissionResult.permissionStatus,
        ),

      gpsStatus:
        resolveGpsStatus(
          trackerState,
          permissionResult.permissionStatus,
        ),

      networkStatus: getNetworkStatus(),

      deviceId: deviceInfo.deviceId,

      appVersion: deviceInfo.appVersion,

      operatingSystemVersion:
        deviceInfo.operatingSystemVersion,

      appInBackground:
        runtime.appInBackground,

      /*
       * We do not claim Android background restriction status without a
       * native API that can determine it reliably.
       */
      backgroundRestricted: false,

      pendingOfflinePoints,

      isMockLocationDetected: false,

      failureCode:
        trackerState?.failureCode,

      failureMessage:
        trackerState?.failureMessage,
    };

    const session =
      await sendMyLocationHeartbeat(
        runtime.sessionId,
        payload,
      );

    const state: LiveLocationHeartbeatState = {
      running: true,
      appInBackground:
        runtime.appInBackground,
      lastHeartbeatAt:
        new Date().toISOString(),
      lastHeartbeatResponse: session,
    };

    options.onStateChange?.(state);
    options.onSessionUpdate?.(session);

    /*
     * A successful heartbeat proves the API is reachable. Retry any points
     * that were retained because of an earlier network or server failure.
     */
    if (
      pendingOfflinePoints > 0 &&
      getNetworkStatus() === 'ONLINE'
    ) {
      await flushLocationPointQueue(
        runtime.sessionId,
        deviceInfo.platform,
        deviceInfo.deviceId,
      ).catch(() => {
        // Points remain stored for the next retry.
      });
    }

    return session;
  } catch (error) {
    const state: LiveLocationHeartbeatState = {
      running: true,
      appInBackground:
        runtime.appInBackground,
      failureCode:
        'HEARTBEAT_FAILED',
      failureMessage:
        readErrorMessage(error),
    };

    options.onStateChange?.(state);
    options.onError?.(error, state);

    return null;
  } finally {
    runtime.heartbeatRunning = false;
  }
}

async function removeRuntimeListeners(
  runtime: ActiveHeartbeatRuntime,
): Promise<void> {
  if (runtime.intervalId !== null) {
    window.clearInterval(runtime.intervalId);
    runtime.intervalId = null;
  }

  if (runtime.appStateListener) {
    await runtime.appStateListener
      .remove()
      .catch(() => undefined);

    runtime.appStateListener = null;
  }

  if (
    typeof window !== 'undefined' &&
    runtime.onlineListener
  ) {
    window.removeEventListener(
      'online',
      runtime.onlineListener,
    );

    runtime.onlineListener = null;
  }

  if (
    typeof window !== 'undefined' &&
    runtime.offlineListener
  ) {
    window.removeEventListener(
      'offline',
      runtime.offlineListener,
    );

    runtime.offlineListener = null;
  }
}

/**
 * Starts one heartbeat runtime for one tracking session.
 *
 * Calling this repeatedly for the same session is safe.
 */
export async function startLiveLocationHeartbeat(
  options: StartLiveLocationHeartbeatOptions,
): Promise<void> {
  if (
    activeRuntime &&
    activeRuntime.sessionId === options.sessionId &&
    !activeRuntime.stopped
  ) {
    return;
  }

  await stopLiveLocationHeartbeat();

  if (typeof window === 'undefined') {
    return;
  }

  const runtime: ActiveHeartbeatRuntime = {
    sessionId: options.sessionId,
    intervalId: null,
    appStateListener: null,
    onlineListener: null,
    offlineListener: null,
    appInBackground: false,
    heartbeatRunning: false,
    stopped: false,
  };

  activeRuntime = runtime;

  const runHeartbeat = () => {
    if (
      runtime.stopped ||
      activeRuntime !== runtime
    ) {
      return;
    }

    void sendHeartbeat(runtime, options);
  };

  try {
    runtime.appStateListener =
      await App.addListener(
        'appStateChange',
        (state: AppState) => {
          runtime.appInBackground =
            !state.isActive;

          /*
           * Send an immediate update whenever the app moves between
           * foreground and background.
           */
          runHeartbeat();
        },
      );
  } catch (error) {
    console.error(
      'Unable to register app-state listener:',
      error,
    );
  }

  runtime.onlineListener = () => {
    runHeartbeat();
  };

  runtime.offlineListener = () => {
    runHeartbeat();
  };

  window.addEventListener(
    'online',
    runtime.onlineListener,
  );

  window.addEventListener(
    'offline',
    runtime.offlineListener,
  );

  runtime.intervalId = window.setInterval(
    runHeartbeat,
    LIVE_LOCATION_CONFIG.heartbeatIntervalMs,
  );

  options.onStateChange?.({
    running: true,
    appInBackground: false,
  });

  /*
   * Do not wait one full heartbeat interval after tracking starts.
   */
  runHeartbeat();
}

/**
 * Stops the heartbeat timer and removes all listeners.
 *
 * Calling this repeatedly is safe.
 */
export async function stopLiveLocationHeartbeat():
  Promise<void> {
  const runtime = activeRuntime;

  activeRuntime = null;

  if (!runtime) {
    return;
  }

  runtime.stopped = true;

  await removeRuntimeListeners(runtime);
}

export function isLiveLocationHeartbeatRunning():
  boolean {
  return Boolean(
    activeRuntime &&
      !activeRuntime.stopped,
  );
}

export function getHeartbeatSessionId():
  | number
  | null {
  if (
    !activeRuntime ||
    activeRuntime.stopped
  ) {
    return null;
  }

  return activeRuntime.sessionId;
}