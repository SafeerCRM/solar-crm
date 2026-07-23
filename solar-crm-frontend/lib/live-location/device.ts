import { Capacitor } from '@capacitor/core';

import type {
  StaffLocationNetworkStatus,
  StaffLocationPlatform,
} from './types';

import { getOrCreateDeviceId } from './storage';

export type StaffLocationDeviceInfo = {
  platform: StaffLocationPlatform;
  deviceId: string;
  appVersion?: string;
  operatingSystemVersion?: string;
  networkStatus: StaffLocationNetworkStatus;
};

export function getLocationPlatform():
  StaffLocationPlatform {
  const platform = Capacitor.getPlatform();

  if (platform === 'android') return 'ANDROID';
  if (platform === 'ios') return 'IOS';
  if (platform === 'web') return 'WEB';

  return 'UNKNOWN';
}

export function getNetworkStatus():
  StaffLocationNetworkStatus {
  if (typeof navigator === 'undefined') {
    return 'UNKNOWN';
  }

  if (typeof navigator.onLine !== 'boolean') {
    return 'UNKNOWN';
  }

  return navigator.onLine ? 'ONLINE' : 'OFFLINE';
}

function getOperatingSystemDescription():
  | string
  | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }

  const description =
    navigator.userAgent || navigator.platform;

  if (!description) {
    return undefined;
  }

  return description.slice(0, 100);
}

export function getStaffLocationDeviceInfo():
  StaffLocationDeviceInfo {
  return {
    platform: getLocationPlatform(),
    deviceId: getOrCreateDeviceId(),
    operatingSystemVersion:
      getOperatingSystemDescription(),
    networkStatus: getNetworkStatus(),
  };
}