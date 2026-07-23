import { uploadMyLocationPoints } from './api';
import { LIVE_LOCATION_CONFIG } from './constants';
import {
  appendQueuedLocationPoint,
  getQueuedLocationPoints,
  saveQueuedLocationPoints,
} from './storage';
import type {
  StaffLocationPlatform,
  StaffLocationPointBatchResponse,
  StaffLocationPointPayload,
} from './types';

export type LocationQueueUploadResult = {
  attempted: boolean;
  uploaded: number;
  duplicatesIgnored: number;
  remaining: number;
  responses: StaffLocationPointBatchResponse[];
};

let uploadInProgress = false;

/**
 * Returns the current number of GPS points waiting locally.
 */
export function getPendingLocationPointCount(): number {
  return getQueuedLocationPoints().length;
}

/**
 * Stores a GPS point locally before any upload is attempted.
 *
 * Saving first protects the route when:
 * - internet is unavailable;
 * - the API request fails;
 * - the app temporarily loses connectivity;
 * - the server is briefly unavailable.
 */
export function enqueueLocationPoint(
  point: StaffLocationPointPayload,
): StaffLocationPointPayload[] {
  return appendQueuedLocationPoint(point);
}

/**
 * Removes only the points confirmed as processed by the backend.
 *
 * Sequence numbers are unique within a tracking session, so they are used
 * instead of array positions. This also protects points that may have been
 * added while an upload was running.
 */
function removeProcessedPoints(
  processedPoints: StaffLocationPointPayload[],
): StaffLocationPointPayload[] {
  const processedSequenceNumbers = new Set(
    processedPoints.map((point) => point.sequenceNumber),
  );

  const latestQueue = getQueuedLocationPoints();

  const remaining = latestQueue.filter(
    (point) =>
      !processedSequenceNumbers.has(point.sequenceNumber),
  );

  saveQueuedLocationPoints(remaining);

  return remaining;
}

/**
 * Returns a deterministic queue ordered by session sequence number.
 */
function getOrderedQueuedPoints(): StaffLocationPointPayload[] {
  return [...getQueuedLocationPoints()].sort(
    (first, second) =>
      first.sequenceNumber - second.sequenceNumber,
  );
}

/**
 * Uploads locally queued GPS points in bounded batches.
 *
 * Backend limit:
 * - minimum 1 point;
 * - maximum 100 points per request.
 *
 * Important safety:
 * - only one upload can run at a time;
 * - points remain stored when an upload fails;
 * - confirmed duplicate points are also removed because the backend has
 *   already received them previously;
 * - newly collected points are not accidentally removed.
 */
export async function flushLocationPointQueue(
  sessionId: number,
  platform: StaffLocationPlatform,
  deviceId?: string,
): Promise<LocationQueueUploadResult> {
  if (uploadInProgress) {
    return {
      attempted: false,
      uploaded: 0,
      duplicatesIgnored: 0,
      remaining: getPendingLocationPointCount(),
      responses: [],
    };
  }

  const initialQueue = getOrderedQueuedPoints();

  if (initialQueue.length === 0) {
    return {
      attempted: false,
      uploaded: 0,
      duplicatesIgnored: 0,
      remaining: 0,
      responses: [],
    };
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator.onLine === false
  ) {
    return {
      attempted: false,
      uploaded: 0,
      duplicatesIgnored: 0,
      remaining: initialQueue.length,
      responses: [],
    };
  }

  uploadInProgress = true;

  let uploaded = 0;
  let duplicatesIgnored = 0;

  const responses: StaffLocationPointBatchResponse[] = [];

  try {
    while (true) {
      const queuedPoints = getOrderedQueuedPoints();

      if (queuedPoints.length === 0) {
        break;
      }

      const batch = queuedPoints.slice(
        0,
        LIVE_LOCATION_CONFIG.maximumUploadBatchSize,
      );

      const response = await uploadMyLocationPoints(
        sessionId,
        {
          platform,
          deviceId,
          points: batch,
        },
      );

      responses.push(response);

      uploaded += Number(response.inserted || 0);
      duplicatesIgnored += Number(
        response.duplicatesIgnored || 0,
      );

      /*
       * A successful HTTP response means the backend inspected the entire
       * submitted batch. It either inserted a point or recognized it as an
       * existing duplicate, so the submitted points are safe to remove.
       */
      removeProcessedPoints(batch);
    }

    return {
      attempted: true,
      uploaded,
      duplicatesIgnored,
      remaining: getPendingLocationPointCount(),
      responses,
    };
  } finally {
    uploadInProgress = false;
  }
}

/**
 * Saves a point and uploads when either:
 * - the requested batch threshold is reached; or
 * - forceUpload is true.
 *
 * The point remains queued when the API is unavailable.
 */
export async function queueAndMaybeUploadLocationPoint(
  sessionId: number,
  platform: StaffLocationPlatform,
  point: StaffLocationPointPayload,
  options?: {
    deviceId?: string;
    forceUpload?: boolean;
  },
): Promise<LocationQueueUploadResult> {
  const queuedPoints = enqueueLocationPoint(point);

  const shouldUpload =
    options?.forceUpload === true ||
    queuedPoints.length >=
      LIVE_LOCATION_CONFIG.pointBatchSize;

  if (!shouldUpload) {
    return {
      attempted: false,
      uploaded: 0,
      duplicatesIgnored: 0,
      remaining: queuedPoints.length,
      responses: [],
    };
  }

  return flushLocationPointQueue(
    sessionId,
    platform,
    options?.deviceId,
  );
}

/**
 * Clears points belonging to an old or completed tracking session.
 *
 * This should be called only after the backend confirms that the session
 * has stopped, or before initializing a genuinely new session.
 */
export function clearLocationPointQueue(): void {
  saveQueuedLocationPoints([]);
}