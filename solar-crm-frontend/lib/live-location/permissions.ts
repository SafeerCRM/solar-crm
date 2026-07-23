import {
  Geolocation,
  type PermissionStatus,
} from '@capacitor/geolocation';

import type {
  StaffLocationGpsStatus,
  StaffLocationPermissionStatus,
} from './types';

export type StaffLocationPermissionResult = {
  permissionStatus: StaffLocationPermissionStatus;
  gpsStatus: StaffLocationGpsStatus;
  rawPermissionStatus?: PermissionStatus;
};

function mapCapacitorPermission(
  value?: string,
): StaffLocationPermissionStatus {
  if (value === 'granted') {
    return 'GRANTED';
  }

  if (value === 'denied') {
    return 'DENIED';
  }

  if (
    value === 'prompt' ||
    value === 'prompt-with-rationale'
  ) {
    return 'PROMPT';
  }

  return 'UNKNOWN';
}

function getBestPermissionState(
  status: PermissionStatus,
): StaffLocationPermissionStatus {
  const fineLocation = mapCapacitorPermission(
    status.location,
  );

  if (fineLocation === 'GRANTED') {
    return 'GRANTED';
  }

  const coarseLocation = mapCapacitorPermission(
    status.coarseLocation,
  );

  if (coarseLocation === 'GRANTED') {
    return 'LIMITED';
  }

  if (
    fineLocation === 'DENIED' ||
    coarseLocation === 'DENIED'
  ) {
    return 'DENIED';
  }

  if (
    fineLocation === 'PROMPT' ||
    coarseLocation === 'PROMPT'
  ) {
    return 'PROMPT';
  }

  return 'UNKNOWN';
}

export async function checkLocationPermission():
  Promise<StaffLocationPermissionResult> {
  try {
    const rawPermissionStatus =
      await Geolocation.checkPermissions();

    const permissionStatus =
      getBestPermissionState(rawPermissionStatus);

    return {
      permissionStatus,
      gpsStatus:
        permissionStatus === 'GRANTED' ||
        permissionStatus === 'LIMITED'
          ? 'ENABLED'
          : 'UNKNOWN',
      rawPermissionStatus,
    };
  } catch {
    return {
      permissionStatus: 'UNKNOWN',
      gpsStatus: 'UNKNOWN',
    };
  }
}

export async function requestLocationPermission():
  Promise<StaffLocationPermissionResult> {
  try {
    const rawPermissionStatus =
      await Geolocation.requestPermissions({
        permissions: ['location', 'coarseLocation'],
      });

    const permissionStatus =
      getBestPermissionState(rawPermissionStatus);

    return {
      permissionStatus,
      gpsStatus:
        permissionStatus === 'GRANTED' ||
        permissionStatus === 'LIMITED'
          ? 'ENABLED'
          : 'UNKNOWN',
      rawPermissionStatus,
    };
  } catch {
    return {
      permissionStatus: 'DENIED',
      gpsStatus: 'UNKNOWN',
    };
  }
}

export function canStartLocationTracking(
  permissionStatus: StaffLocationPermissionStatus,
): boolean {
  return (
    permissionStatus === 'GRANTED' ||
    permissionStatus === 'LIMITED'
  );
}