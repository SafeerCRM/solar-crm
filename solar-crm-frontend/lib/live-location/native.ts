import {
  Capacitor,
  registerPlugin,
} from '@capacitor/core';

import type {
  StaffLocationPlatform,
} from './types';

type NativePermissionStatus =
  | 'GRANTED'
  | 'DENIED'
  | 'UNKNOWN';

type NativeTrackingStartOptions = {
  sessionId: number;
  deviceId?: string;
  platform?: StaffLocationPlatform;
};

type NativeTrackingStatus = {
  running: boolean;
  sessionId?: number;
  locationPermission?: NativePermissionStatus;
  notificationPermission?: NativePermissionStatus;
};

type NativePermissionResponse = {
  locationPermission: NativePermissionStatus;
  notificationPermission: NativePermissionStatus;
};

interface LiveLocationNativePlugin {
  startTracking(
    options: {
      sessionId: number;
      authToken: string;
      apiBaseUrl: string;
      deviceId?: string;
      platform: StaffLocationPlatform;
    },
  ): Promise<NativeTrackingStatus>;

  stopTracking(): Promise<{
    running: boolean;
  }>;

  getStatus(): Promise<NativeTrackingStatus>;

  requestNativePermissions():
    Promise<NativePermissionResponse>;
}

const LiveLocationNative =
  registerPlugin<LiveLocationNativePlugin>(
    'LiveLocationNative',
  );

function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    window.localStorage.getItem('token') ||
    window.localStorage.getItem(
      'access_token',
    ) ||
    window.sessionStorage.getItem(
      'token',
    ) ||
    window.sessionStorage.getItem(
      'access_token',
    )
  );
}

function getApiBaseUrl(): string {
  const value =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!value) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is not configured',
    );
  }

  return value.replace(/\/+$/, '');
}

/**
 * The native foreground service is used only by the Android APK.
 * Web and any future iOS build continue using their platform runtime.
 */
export function isNativeAndroidLocationAvailable():
  boolean {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === 'android'
  );
}

export async function requestNativeLocationPermissions():
  Promise<NativePermissionResponse> {
  if (!isNativeAndroidLocationAvailable()) {
    return {
      locationPermission: 'UNKNOWN',
      notificationPermission: 'UNKNOWN',
    };
  }

  return LiveLocationNative.requestNativePermissions();
}

export async function startNativeLocationTracking(
  options: NativeTrackingStartOptions,
): Promise<NativeTrackingStatus> {
  if (!isNativeAndroidLocationAvailable()) {
    throw new Error(
      'Native Android location tracking is unavailable',
    );
  }

  const sessionId = Number(options.sessionId);

  if (
    !Number.isInteger(sessionId) ||
    sessionId < 1
  ) {
    throw new Error(
      'A valid live-location session ID is required',
    );
  }

  const authToken = getStoredAuthToken();

  if (!authToken) {
    throw new Error(
      'Authentication token is unavailable',
    );
  }

  return LiveLocationNative.startTracking({
    sessionId,
    authToken,
    apiBaseUrl: getApiBaseUrl(),
    deviceId: options.deviceId || '',
    platform: options.platform || 'ANDROID',
  });
}

export async function stopNativeLocationTracking():
  Promise<void> {
  if (!isNativeAndroidLocationAvailable()) {
    return;
  }

  try {
    await LiveLocationNative.stopTracking();
  } catch (error) {
    /*
     * Stop operations are intentionally safe to repeat. A missing or
     * already-stopped Android service should not break logout or cleanup.
     */
    console.warn(
      'Unable to stop native location service:',
      error,
    );
  }
}

export async function getNativeLocationStatus():
  Promise<NativeTrackingStatus | null> {
  if (!isNativeAndroidLocationAvailable()) {
    return null;
  }

  return LiveLocationNative.getStatus();
}