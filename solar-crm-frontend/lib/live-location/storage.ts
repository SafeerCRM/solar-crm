import type { StaffLocationPointPayload } from './types';

import { LIVE_LOCATION_STORAGE_KEYS } from './constants';

function canUseStorage(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  );
}

function generateDeviceId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `staff-${crypto.randomUUID()}`;
  }

  return `staff-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

export function getOrCreateDeviceId(): string {
  if (!canUseStorage()) {
    return 'staff-web-session';
  }

  const existing = localStorage.getItem(
    LIVE_LOCATION_STORAGE_KEYS.deviceId,
  );

  if (existing) {
    return existing;
  }

  const generated = generateDeviceId();

  localStorage.setItem(
    LIVE_LOCATION_STORAGE_KEYS.deviceId,
    generated,
  );

  return generated;
}

export function saveActiveLocationSessionId(
  sessionId: number,
): void {
  if (!canUseStorage()) return;

  localStorage.setItem(
    LIVE_LOCATION_STORAGE_KEYS.activeSessionId,
    String(sessionId),
  );
}

export function getSavedActiveLocationSessionId():
  | number
  | null {
  if (!canUseStorage()) return null;

  const value = localStorage.getItem(
    LIVE_LOCATION_STORAGE_KEYS.activeSessionId,
  );

  if (!value) return null;

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

export function clearSavedActiveLocationSession(): void {
  if (!canUseStorage()) return;

  localStorage.removeItem(
    LIVE_LOCATION_STORAGE_KEYS.activeSessionId,
  );

  localStorage.removeItem(
    LIVE_LOCATION_STORAGE_KEYS.sequenceNumber,
  );

  localStorage.removeItem(
    LIVE_LOCATION_STORAGE_KEYS.queuedPoints,
  );
}

export function getNextLocationSequenceNumber(): number {
  if (!canUseStorage()) {
    return 1;
  }

  const currentValue = Number(
    localStorage.getItem(
      LIVE_LOCATION_STORAGE_KEYS.sequenceNumber,
    ) || 0,
  );

  const nextValue =
    Number.isInteger(currentValue) && currentValue >= 0
      ? currentValue + 1
      : 1;

  localStorage.setItem(
    LIVE_LOCATION_STORAGE_KEYS.sequenceNumber,
    String(nextValue),
  );

  return nextValue;
}

export function resetLocationSequenceNumber(): void {
  if (!canUseStorage()) return;

  localStorage.setItem(
    LIVE_LOCATION_STORAGE_KEYS.sequenceNumber,
    '0',
  );
}

export function getQueuedLocationPoints():
  StaffLocationPointPayload[] {
  if (!canUseStorage()) return [];

  const raw = localStorage.getItem(
    LIVE_LOCATION_STORAGE_KEYS.queuedPoints,
  );

  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is StaffLocationPointPayload =>
        typeof item === 'object' &&
        item !== null &&
        Number.isInteger(
          (item as StaffLocationPointPayload)
            .sequenceNumber,
        ) &&
        typeof (item as StaffLocationPointPayload)
          .latitude === 'number' &&
        typeof (item as StaffLocationPointPayload)
          .longitude === 'number' &&
        typeof (item as StaffLocationPointPayload)
          .recordedAt === 'string',
    );
  } catch {
    return [];
  }
}

export function saveQueuedLocationPoints(
  points: StaffLocationPointPayload[],
): void {
  if (!canUseStorage()) return;

  localStorage.setItem(
    LIVE_LOCATION_STORAGE_KEYS.queuedPoints,
    JSON.stringify(points),
  );
}

export function appendQueuedLocationPoint(
  point: StaffLocationPointPayload,
): StaffLocationPointPayload[] {
  const existing = getQueuedLocationPoints();

  const alreadyExists = existing.some(
    (item) =>
      item.sequenceNumber === point.sequenceNumber,
  );

  const updated = alreadyExists
    ? existing
    : [...existing, point];

  saveQueuedLocationPoints(updated);

  return updated;
}