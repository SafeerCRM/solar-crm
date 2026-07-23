'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Geolocation } from '@capacitor/geolocation';

import {
  getMyActiveLocationSession,
  openMyLocationRequest,
  startMyLocationTracking,
  stopMyLocationTracking,
} from '@/lib/live-location/api';

import {
  getNetworkStatus,
  getStaffLocationDeviceInfo,
} from '@/lib/live-location/device';

import {
  startLiveLocationHeartbeat,
  stopLiveLocationHeartbeat,
} from '@/lib/live-location/heartbeat';

import {
  isNativeAndroidLocationAvailable,
  requestNativeLocationPermissions,
  startNativeLocationTracking,
  stopNativeLocationTracking,
} from '@/lib/live-location/native';

import {
  clearSavedActiveLocationSession,
  getSavedActiveLocationSessionId,
  saveActiveLocationSessionId,
} from '@/lib/live-location/storage';

import {
  startLiveLocationTracker,
  stopLiveLocationTracker,
  type LiveLocationTrackerState,
} from '@/lib/live-location/tracker';

import type {
  StaffLocationGpsStatus,
  StaffLocationPermissionStatus,
  StaffLocationSession,
} from '@/lib/live-location/types';

const ACTIVE_SESSION_POLL_INTERVAL_MS = 15_000;

type StoredUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  roles?: string[];
};

type ManagerAction =
  | 'NONE'
  | 'OPENING'
  | 'ACCEPTING'
  | 'REJECTING'
  | 'RECOVERING'
  | 'STOPPING';

type PermissionResult = {
  permissionStatus: StaffLocationPermissionStatus;
  allowed: boolean;
};

function readStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawUser = window.localStorage.getItem('user');

    if (!rawUser) {
      return null;
    }

    const parsed = JSON.parse(rawUser);

    if (
      typeof parsed !== 'object' ||
      parsed === null
    ) {
      return null;
    }

    return parsed as StoredUser;
  } catch {
    return null;
  }
}

function getUserRoles(
  user: StoredUser | null,
): string[] {
  if (!user) {
    return [];
  }

  const multipleRoles = Array.isArray(user.roles)
    ? user.roles
    : [];

  const singleRole =
    typeof user.role === 'string'
      ? [user.role]
      : [];

  return Array.from(
    new Set(
      [...multipleRoles, ...singleRole]
        .map((role) =>
          String(role || '').trim().toUpperCase(),
        )
        .filter(Boolean),
    ),
  );
}

function shouldRunForUser(
  user: StoredUser | null,
): boolean {
  const roles = getUserRoles(user);

  if (!user?.id || roles.length === 0) {
    return false;
  }

  /*
   * OWNER controls tracking through the owner interface and should not
   * receive a staff tracking request popup on an OWNER-only account.
   *
   * A multi-role account that also contains a staff role remains eligible.
   */
  return !(
    roles.length === 1 &&
    roles.includes('OWNER')
  );
}

function readErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    const value = (
      error as {
        message?: unknown;
      }
    ).message;

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'string') {
      return value;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Live location operation failed';
}

function mapPermissionValue(
  value: string | undefined,
): StaffLocationPermissionStatus {
  switch (String(value || '').toLowerCase()) {
    case 'granted':
      return 'GRANTED';

    case 'denied':
      return 'DENIED';

    case 'restricted':
      return 'RESTRICTED';

    case 'limited':
      return 'LIMITED';

    case 'prompt':
    case 'prompt-with-rationale':
      return 'PROMPT';

    default:
      return 'UNKNOWN';
  }
}

function choosePermissionStatus(
  locationValue: string | undefined,
  coarseLocationValue: string | undefined,
): StaffLocationPermissionStatus {
  const locationStatus =
    mapPermissionValue(locationValue);

  const coarseStatus =
    mapPermissionValue(coarseLocationValue);

  if (locationStatus === 'GRANTED') {
    return 'GRANTED';
  }

  if (
    coarseStatus === 'GRANTED' ||
    locationStatus === 'LIMITED'
  ) {
    return 'LIMITED';
  }

  if (
    locationStatus === 'RESTRICTED' ||
    coarseStatus === 'RESTRICTED'
  ) {
    return 'RESTRICTED';
  }

  if (
    locationStatus === 'DENIED' &&
    coarseStatus === 'DENIED'
  ) {
    return 'DENIED';
  }

  if (
    locationStatus === 'PROMPT' ||
    coarseStatus === 'PROMPT'
  ) {
    return 'PROMPT';
  }

  if (
    locationStatus === 'DENIED' ||
    coarseStatus === 'DENIED'
  ) {
    return 'DENIED';
  }

  return 'UNKNOWN';
}

async function checkPermission(): Promise<PermissionResult> {
  try {
    const result =
      await Geolocation.checkPermissions();

    const permissionStatus =
      choosePermissionStatus(
        result.location,
        result.coarseLocation,
      );

    return {
      permissionStatus,
      allowed:
        permissionStatus === 'GRANTED' ||
        permissionStatus === 'LIMITED',
    };
  } catch {
    return {
      permissionStatus: 'UNKNOWN',
      allowed: false,
    };
  }
}

async function requestPermission(): Promise<PermissionResult> {
  try {
    const result =
      await Geolocation.requestPermissions({
        permissions: [
          'location',
          'coarseLocation',
        ],
      });

    const permissionStatus =
      choosePermissionStatus(
        result.location,
        result.coarseLocation,
      );

    return {
      permissionStatus,
      allowed:
        permissionStatus === 'GRANTED' ||
        permissionStatus === 'LIMITED',
    };
  } catch (error) {
    const message =
      readErrorMessage(error).toLowerCase();

    if (
      message.includes('denied') ||
      message.includes('permission')
    ) {
      return {
        permissionStatus: 'DENIED',
        allowed: false,
      };
    }

    return {
      permissionStatus: 'UNKNOWN',
      allowed: false,
    };
  }
}

function isPendingRequest(
  session: StaffLocationSession | null,
): boolean {
  return Boolean(
    session?.isActive &&
      session.status === 'REQUEST_PENDING' &&
      session.requestAccepted !== true,
  );
}

function shouldRecoverTracking(
  session: StaffLocationSession | null,
): boolean {
  if (!session?.isActive) {
    return false;
  }

  if (session.status === 'REQUEST_PENDING') {
    return false;
  }

  return session.requestAccepted === true;
}

function getStatusText(
  session: StaffLocationSession | null,
  trackerState: LiveLocationTrackerState | null,
): string {
  if (trackerState?.failureMessage) {
    return trackerState.failureMessage;
  }

  switch (session?.status) {
    case 'STARTING':
      return 'Live location tracking is starting.';

    case 'LIVE':
      return 'Your live location is being shared.';

    case 'DELAYED':
      return 'Location updates are delayed. The app will retry automatically.';

    case 'GPS_DISABLED':
      return 'Device location service is switched off.';

    case 'PERMISSION_DENIED':
      return 'Location permission has been denied.';

    case 'PERMISSION_RESTRICTED':
      return 'Location permission is restricted on this device.';

    case 'DEVICE_OFFLINE':
      return 'Device is offline. Location points will remain queued locally.';

    case 'APP_BACKGROUND_RESTRICTED':
      return 'Android is restricting background location updates.';

    default:
      return 'Live location tracking is active.';
  }
}

function formatRequestedTime(
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

export default function LiveLocationManager() {
  const [currentUser, setCurrentUser] =
    useState<StoredUser | null>(null);

  const [activeSession, setActiveSession] =
    useState<StaffLocationSession | null>(null);

  const [trackerState, setTrackerState] =
    useState<LiveLocationTrackerState | null>(
      null,
    );

  const [action, setAction] =
    useState<ManagerAction>('NONE');

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [showTrackingCard, setShowTrackingCard] =
    useState(true);

  const mountedRef = useRef(false);
  const pollRunningRef = useRef(false);
  const actionRef = useRef<ManagerAction>('NONE');

  const runtimeSessionIdRef =
    useRef<number | null>(null);

  const trackerStateRef =
    useRef<LiveLocationTrackerState | null>(null);

  const activeSessionRef =
    useRef<StaffLocationSession | null>(null);

  const currentUserRoles = useMemo(
    () => getUserRoles(currentUser),
    [currentUser],
  );

  const enabledForCurrentUser =
    shouldRunForUser(currentUser);

  const setManagerAction = useCallback(
    (nextAction: ManagerAction) => {
      actionRef.current = nextAction;
      setAction(nextAction);
    },
    [],
  );

  const applyTrackerState = useCallback(
    (state: LiveLocationTrackerState) => {
      trackerStateRef.current = state;

      if (mountedRef.current) {
        setTrackerState(state);
      }
    },
    [],
  );

  const clearLocalRuntime = useCallback(
    async (
      options?: {
        clearStoredData?: boolean;
      },
    ) => {
      runtimeSessionIdRef.current = null;
      trackerStateRef.current = null;

      await Promise.allSettled([
  stopLiveLocationHeartbeat(),
  stopLiveLocationTracker(),
  stopNativeLocationTracking(),
]);

      if (options?.clearStoredData !== false) {
        clearSavedActiveLocationSession();
      }

      if (mountedRef.current) {
        setTrackerState(null);
      }
    },
    [],
  );

  const startRuntime = useCallback(
  async (
    session: StaffLocationSession,
  ) => {
    const sessionId = Number(session.id);

    if (
      !Number.isInteger(sessionId) ||
      sessionId < 1
    ) {
      throw new Error(
        'Invalid live location session ID',
      );
    }

    if (
      runtimeSessionIdRef.current ===
      sessionId
    ) {
      return;
    }

    if (
      runtimeSessionIdRef.current !== null &&
      runtimeSessionIdRef.current !==
        sessionId
    ) {
      await clearLocalRuntime({
        clearStoredData: true,
      });
    }

    runtimeSessionIdRef.current = sessionId;
    saveActiveLocationSessionId(sessionId);

    try {
      const deviceInfo =
        getStaffLocationDeviceInfo();

      if (
        isNativeAndroidLocationAvailable()
      ) {
        /*
         * Android uses only the native foreground service.
         *
         * Do not start the WebView GPS watcher or JavaScript heartbeat here,
         * otherwise Android would upload duplicate points and heartbeats.
         */
        await Promise.allSettled([
          stopLiveLocationTracker(),
          stopLiveLocationHeartbeat(),
        ]);

        await startNativeLocationTracking({
          sessionId,
          deviceId: deviceInfo.deviceId,
          platform: 'ANDROID',
        });

        applyTrackerState({
  running: true,
  gpsStatus: 'ENABLED',
  permissionStatus: 'GRANTED',
  pendingOfflinePoints: 0,
  lastPointAt:
    session.lastLocationAt || undefined,
});
      } else {
        /*
         * Browser/non-Android runtime keeps the existing Capacitor/WebView
         * tracker and JavaScript heartbeat.
         */
        await startLiveLocationTracker({
          sessionId,

          onStateChange: applyTrackerState,

          onError: (state) => {
            applyTrackerState(state);

            if (mountedRef.current) {
              setErrorMessage(
                state.failureMessage ||
                  'Location tracking encountered an error',
              );
            }
          },
        });

        await startLiveLocationHeartbeat({
          sessionId,

          getTrackerState: () =>
            trackerStateRef.current,

          onSessionUpdate: (
            updatedSession,
          ) => {
            activeSessionRef.current =
              updatedSession;

            if (mountedRef.current) {
              setActiveSession(
                updatedSession,
              );
            }

            if (
              updatedSession.isActive === false
            ) {
              void clearLocalRuntime({
                clearStoredData: true,
              });
            }
          },

          onError: (
            _error,
            heartbeatState,
          ) => {
            if (
              mountedRef.current &&
              heartbeatState.failureMessage
            ) {
              setErrorMessage(
                heartbeatState.failureMessage,
              );
            }
          },
        });
      }

      if (mountedRef.current) {
        setErrorMessage(null);
        setShowTrackingCard(true);
      }
    } catch (error) {
      await clearLocalRuntime({
        /*
         * Preserve the saved session ID. Recovery can retry after staff
         * restores permission, GPS, internet or Android restrictions.
         */
        clearStoredData: false,
      });

      throw error;
    }
  },
  [
    applyTrackerState,
    clearLocalRuntime,
  ],
);

  const openPendingRequest = useCallback(
    async (
      session: StaffLocationSession,
    ): Promise<StaffLocationSession> => {
      if (
        session.requestOpened === true ||
        actionRef.current === 'OPENING'
      ) {
        return session;
      }

      setManagerAction('OPENING');

      try {
        const opened =
          await openMyLocationRequest(
            Number(session.id),
          );

        activeSessionRef.current = opened;

        if (mountedRef.current) {
          setActiveSession(opened);
        }

        return opened;
      } catch (error) {
        if (mountedRef.current) {
          setErrorMessage(
            readErrorMessage(error),
          );
        }

        return session;
      } finally {
        setManagerAction('NONE');
      }
    },
    [setManagerAction],
  );

  const applyServerSession = useCallback(
    async (
      session: StaffLocationSession | null,
    ) => {
      if (!mountedRef.current) {
        return;
      }

      if (!session || session.isActive === false) {
        activeSessionRef.current = null;
        setActiveSession(null);

        if (
          runtimeSessionIdRef.current !== null ||
          getSavedActiveLocationSessionId() !==
            null
        ) {
          await clearLocalRuntime({
            clearStoredData: true,
          });
        }

        return;
      }

      let resolvedSession = session;

      if (isPendingRequest(resolvedSession)) {
        resolvedSession =
          await openPendingRequest(
            resolvedSession,
          );
      }

      activeSessionRef.current =
        resolvedSession;

      setActiveSession(resolvedSession);

      if (
        shouldRecoverTracking(resolvedSession) &&
        runtimeSessionIdRef.current !==
          resolvedSession.id &&
        actionRef.current === 'NONE'
      ) {
        setManagerAction('RECOVERING');

        try {
          const permission =
            await checkPermission();

          if (!permission.allowed) {
            setErrorMessage(
              permission.permissionStatus ===
                'DENIED'
                ? 'Location permission is denied. Tap Enable Location to restore tracking.'
                : 'Location permission is required to restore live tracking.',
            );

            saveActiveLocationSessionId(
              resolvedSession.id,
            );

            return;
          }

          await startRuntime(resolvedSession);
        } catch (error) {
          setErrorMessage(
            readErrorMessage(error),
          );
        } finally {
          setManagerAction('NONE');
        }
      }
    },
    [
      clearLocalRuntime,
      openPendingRequest,
      setManagerAction,
      startRuntime,
    ],
  );

  const fetchActiveSession =
    useCallback(async () => {
      if (
        !enabledForCurrentUser ||
        pollRunningRef.current ||
        actionRef.current === 'ACCEPTING' ||
        actionRef.current === 'REJECTING' ||
        actionRef.current === 'STOPPING'
      ) {
        return;
      }

      pollRunningRef.current = true;

      try {
        const session =
          await getMyActiveLocationSession();

        if (!mountedRef.current) {
          return;
        }

        await applyServerSession(session);
      } catch (error) {
        if (mountedRef.current) {
          setErrorMessage(
            readErrorMessage(error),
          );
        }
      } finally {
        pollRunningRef.current = false;
      }
    }, [
      applyServerSession,
      enabledForCurrentUser,
    ]);

  const acceptRequest = useCallback(
    async () => {
      const session = activeSessionRef.current;

      if (
        !session ||
        !isPendingRequest(session) ||
        actionRef.current !== 'NONE'
      ) {
        return;
      }

      setManagerAction('ACCEPTING');
      setErrorMessage(null);

      try {
        /*
         * The native permission dialog appears only after the staff member
         * explicitly presses Accept.
         */
        const permission =
  await requestPermission();

/*
 * Android 13+ controls whether the foreground-service notification is
 * visible in the notification drawer. Location permission remains the
 * required permission for starting the location service.
 */
if (
  permission.allowed &&
  isNativeAndroidLocationAvailable()
) {
  try {
    await requestNativeLocationPermissions();
  } catch (nativePermissionError) {
    console.warn(
      'Native permission request failed:',
      nativePermissionError,
    );
  }
}

const deviceInfo =
  getStaffLocationDeviceInfo();

        const gpsStatus: StaffLocationGpsStatus =
          permission.allowed
            ? 'ENABLED'
            : 'UNKNOWN';

        const startedSession =
          await startMyLocationTracking(
            session.id,
            {
              requestAccepted: true,

              platform:
                deviceInfo.platform,

              permissionStatus:
                permission.permissionStatus,

              gpsStatus,

              networkStatus:
                getNetworkStatus(),

              deviceId:
                deviceInfo.deviceId,

              appVersion:
                deviceInfo.appVersion,

              operatingSystemVersion:
                deviceInfo.operatingSystemVersion,
            },
          );

        activeSessionRef.current =
          startedSession;

        setActiveSession(startedSession);
        saveActiveLocationSessionId(
          startedSession.id,
        );

        if (!permission.allowed) {
          setErrorMessage(
            permission.permissionStatus ===
              'DENIED'
              ? 'The request was accepted, but location permission is denied. Enable permission to begin sharing.'
              : 'The request was accepted, but location permission is not available.',
          );

          return;
        }

        await startRuntime(startedSession);
      } catch (error) {
        setErrorMessage(
          readErrorMessage(error),
        );
      } finally {
        setManagerAction('NONE');
      }
    },
    [
      setManagerAction,
      startRuntime,
    ],
  );

  const rejectRequest = useCallback(
    async () => {
      const session = activeSessionRef.current;

      if (
        !session ||
        !isPendingRequest(session) ||
        actionRef.current !== 'NONE'
      ) {
        return;
      }

      setManagerAction('REJECTING');
      setErrorMessage(null);

      try {
        /*
         * Rejecting must not trigger the Android permission dialog.
         */
        const permission =
          await checkPermission();

        const deviceInfo =
          getStaffLocationDeviceInfo();

        await startMyLocationTracking(
          session.id,
          {
            requestAccepted: false,

            platform:
              deviceInfo.platform,

            permissionStatus:
              permission.permissionStatus,

            gpsStatus: 'UNKNOWN',

            networkStatus:
              getNetworkStatus(),

            deviceId:
              deviceInfo.deviceId,

            appVersion:
              deviceInfo.appVersion,

            operatingSystemVersion:
              deviceInfo.operatingSystemVersion,
          },
        );

        await clearLocalRuntime({
          clearStoredData: true,
        });

        activeSessionRef.current = null;

        if (mountedRef.current) {
          setActiveSession(null);
          setErrorMessage(null);
        }
      } catch (error) {
        setErrorMessage(
          readErrorMessage(error),
        );
      } finally {
        setManagerAction('NONE');
      }
    },
    [
      clearLocalRuntime,
      setManagerAction,
    ],
  );

  const retryPermissionAndTracking =
    useCallback(async () => {
      const session =
        activeSessionRef.current;

      if (
        !session?.isActive ||
        session.requestAccepted !== true ||
        actionRef.current !== 'NONE'
      ) {
        return;
      }

      setManagerAction('RECOVERING');
      setErrorMessage(null);

      try {
        const permission =
          await requestPermission();

        if (!permission.allowed) {
  throw new Error(
    permission.permissionStatus ===
      'DENIED'
      ? 'Location permission remains denied. Enable it from Android App Settings.'
      : 'Location permission is still unavailable.',
  );
}

if (
  isNativeAndroidLocationAvailable()
) {
  try {
    await requestNativeLocationPermissions();
  } catch (nativePermissionError) {
    console.warn(
      'Native permission request failed:',
      nativePermissionError,
    );
  }
}

await startRuntime(session);
      } catch (error) {
        setErrorMessage(
          readErrorMessage(error),
        );
      } finally {
        setManagerAction('NONE');
      }
    }, [
      setManagerAction,
      startRuntime,
    ]);

  const stopOwnTracking = useCallback(
    async () => {
      const session =
        activeSessionRef.current;

      if (
        !session?.isActive ||
        actionRef.current !== 'NONE'
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          'Stop sharing your live location?',
        );

      if (!confirmed) {
        return;
      }

      setManagerAction('STOPPING');
      setErrorMessage(null);

      try {
        /*
         * Flush/stop local runtime first. Queued points remain stored until
         * the backend confirms that the session has stopped.
         */
        await Promise.allSettled([
  stopLiveLocationHeartbeat(),
  stopLiveLocationTracker(),
  stopNativeLocationTracking(),
]);

        const stopped =
          await stopMyLocationTracking(
            session.id,
            {
              reason: 'STAFF_STOPPED',
              remark:
                'Live location sharing stopped by staff',
            },
          );

        activeSessionRef.current = stopped;
        runtimeSessionIdRef.current = null;

        clearSavedActiveLocationSession();

        if (mountedRef.current) {
          setActiveSession(null);
          setTrackerState(null);
          setShowTrackingCard(false);
        }
      } catch (error) {
        /*
         * Restore the runtime when the backend stop call fails, because the
         * backend session may still be active.
         */
        try {
          await startRuntime(session);
        } catch {
          // The next poll/retry button can recover it.
        }

        setErrorMessage(
          readErrorMessage(error),
        );
      } finally {
        setManagerAction('NONE');
      }
    },
    [
      setManagerAction,
      startRuntime,
    ]);

  useEffect(() => {
    mountedRef.current = true;

    const user = readStoredUser();

    setCurrentUser(user);

    return () => {
      mountedRef.current = false;
      pollRunningRef.current = false;

      /*
       * Remove native listeners when the authenticated layout genuinely
       * unmounts. The backend session remains active and will recover after
       * the next authenticated mount.
       */
      void Promise.allSettled([
        stopLiveLocationHeartbeat(),
        stopLiveLocationTracker(),
      ]);
    };
  }, []);

  useEffect(() => {
    if (!enabledForCurrentUser) {
      return;
    }

    void fetchActiveSession();

    const intervalId = window.setInterval(
      () => {
        void fetchActiveSession();
      },
      ACTIVE_SESSION_POLL_INTERVAL_MS,
    );

    const handleForceCleanup = () => {
      void clearLocalRuntime({
        clearStoredData: true,
      });
    };

    window.addEventListener(
      'solar-crm:logout',
      handleForceCleanup,
    );

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener(
        'solar-crm:logout',
        handleForceCleanup,
      );
    };
  }, [
    clearLocalRuntime,
    enabledForCurrentUser,
    fetchActiveSession,
  ]);

  if (
    !enabledForCurrentUser ||
    !currentUser
  ) {
    return null;
  }

  const pendingRequest =
    isPendingRequest(activeSession);

  const acceptedActiveSession =
    Boolean(
      activeSession?.isActive &&
        activeSession.requestAccepted === true,
    );

  const busy = action !== 'NONE';

  return (
    <>
      {pendingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                Live Location Request
              </p>

              <h2 className="mt-2 text-xl font-black">
                Location sharing requested
              </h2>

              <p className="mt-2 text-sm text-blue-100">
                The company OWNER has requested your
                live location for official work
                tracking.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  Requested at
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {formatRequestedTime(
                    activeSession?.requestedAt,
                  )}
                </p>

                {activeSession?.requestRemark && (
                  <>
                    <p className="mt-4 text-sm font-semibold text-gray-900">
                      Remark
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                      {
                        activeSession.requestRemark
                      }
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Location permission will be requested
                only after you press Accept. No GPS
                tracking starts when you reject.
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void rejectRequest();
                  }}
                  className="rounded-2xl border border-gray-300 bg-white px-4 py-3 font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {action === 'REJECTING'
                    ? 'Rejecting...'
                    : 'Reject'}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void acceptRequest();
                  }}
                  className="rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {action === 'ACCEPTING'
                    ? 'Starting...'
                    : 'Accept & Start'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {acceptedActiveSession &&
        !pendingRequest &&
        showTrackingCard && (
          <div className="fixed bottom-4 right-4 z-[90] w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-emerald-200 bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                    trackerState?.running
                      ? 'animate-pulse bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />

                <div className="min-w-0">
                  <p className="font-black text-gray-900">
                    Live Location
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {getStatusText(
                      activeSession,
                      trackerState,
                    )}
                  </p>

                  {trackerState?.lastPointAt && (
                    <p className="mt-2 text-xs text-gray-500">
                      Last GPS point:{' '}
                      {formatRequestedTime(
                        trackerState.lastPointAt,
                      )}
                    </p>
                  )}

                  {typeof trackerState?.pendingOfflinePoints ===
                    'number' &&
                    trackerState.pendingOfflinePoints >
                      0 && (
                      <p className="mt-1 text-xs font-semibold text-amber-700">
                        {
                          trackerState.pendingOfflinePoints
                        }{' '}
                        point(s) waiting to sync
                      </p>
                    )}
                </div>
              </div>

              <button
                type="button"
                aria-label="Minimize location status"
                onClick={() =>
                  setShowTrackingCard(false)
                }
                className="rounded-full px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {!trackerState?.running && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void retryPermissionAndTracking();
                  }}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {action === 'RECOVERING'
                    ? 'Restoring...'
                    : 'Enable Location'}
                </button>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void stopOwnTracking();
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {action === 'STOPPING'
                  ? 'Stopping...'
                  : 'Stop Sharing'}
              </button>
            </div>
          </div>
        )}

      {acceptedActiveSession &&
        !pendingRequest &&
        !showTrackingCard && (
          <button
            type="button"
            onClick={() =>
              setShowTrackingCard(true)
            }
            className="fixed bottom-4 right-4 z-[90] flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xl hover:bg-emerald-700"
          >
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
            Location Live
          </button>
        )}

      {!activeSession &&
        errorMessage &&
        action === 'NONE' && (
          <div className="fixed bottom-4 right-4 z-[90] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-red-200 bg-white p-4 shadow-xl">
            <p className="text-sm font-semibold text-red-700">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                void fetchActiveSession();
              }}
              className="mt-3 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white"
            >
              Retry
            </button>
          </div>
        )}
    </>
  );
}