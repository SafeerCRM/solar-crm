import axios, { AxiosError } from 'axios';

import { getAuthHeaders } from '@/lib/authHeaders';

import type {
  StaffLocationApiError,
  StaffLocationHeartbeatPayload,
  StaffLocationPointBatchPayload,
  StaffLocationPointBatchResponse,
  StaffLocationSession,
  StaffLocationStartPayload,
  StaffLocationStopPayload,
} from './types';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

function getApiUrl(path: string): string {
  if (!apiBaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is not configured',
    );
  }

  return `${apiBaseUrl}${path}`;
}

function extractApiError(error: unknown): StaffLocationApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string | string[];
      statusCode?: number;
      error?: string;
    }>;

    const responseMessage = axiosError.response?.data?.message;

    const message = Array.isArray(responseMessage)
      ? responseMessage.join(', ')
      : responseMessage ||
        axiosError.message ||
        'Location tracking request failed';

    return {
      message,
      statusCode:
        axiosError.response?.status ||
        axiosError.response?.data?.statusCode,
      error: axiosError.response?.data?.error,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'Unknown location tracking error',
  };
}

async function runRequest<T>(
  request: () => Promise<{ data: T }>,
): Promise<T> {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

/**
 * Returns the logged-in staff member's current active request/session.
 *
 * The backend may return null when there is no active session.
 */
export function getMyActiveLocationSession(): Promise<
  StaffLocationSession | null
> {
  return runRequest(() =>
    axios.get<StaffLocationSession | null>(
      getApiUrl('/staff-location/me/active'),
      {
        headers: getAuthHeaders(),
      },
    ),
  );
}

/**
 * Records that the staff member has opened the request.
 */
export function openMyLocationRequest(
  sessionId: number,
): Promise<StaffLocationSession> {
  return runRequest(() =>
    axios.post<StaffLocationSession>(
      getApiUrl(
        `/staff-location/me/session/${sessionId}/open`,
      ),
      {},
      {
        headers: getAuthHeaders(),
      },
    ),
  );
}

/**
 * Accepts the request and starts the backend tracking session.
 */
export function startMyLocationTracking(
  sessionId: number,
  payload: StaffLocationStartPayload,
): Promise<StaffLocationSession> {
  return runRequest(() =>
    axios.post<StaffLocationSession>(
      getApiUrl(
        `/staff-location/me/session/${sessionId}/start`,
      ),
      payload,
      {
        headers: getAuthHeaders(),
      },
    ),
  );
}

/**
 * Sends current device and tracking health to the backend.
 *
 * A heartbeat does not create a GPS route point.
 */
export function sendMyLocationHeartbeat(
  sessionId: number,
  payload: StaffLocationHeartbeatPayload,
): Promise<StaffLocationSession> {
  return runRequest(() =>
    axios.post<StaffLocationSession>(
      getApiUrl(
        `/staff-location/me/session/${sessionId}/heartbeat`,
      ),
      payload,
      {
        headers: getAuthHeaders(),
      },
    ),
  );
}

/**
 * Uploads one or more live or offline-queued location points.
 */
export function uploadMyLocationPoints(
  sessionId: number,
  payload: StaffLocationPointBatchPayload,
): Promise<StaffLocationPointBatchResponse> {
  return runRequest(() =>
    axios.post<StaffLocationPointBatchResponse>(
      getApiUrl(
        `/staff-location/me/session/${sessionId}/points`,
      ),
      payload,
      {
        headers: getAuthHeaders(),
      },
    ),
  );
}

/**
 * Stops only the logged-in staff member's own tracking session.
 *
 * The backend overwrites the reason with STAFF_STOPPED, so the frontend
 * does not control authorization or the final stop status.
 */
export function stopMyLocationTracking(
  sessionId: number,
  payload: StaffLocationStopPayload = {},
): Promise<StaffLocationSession> {
  return runRequest(() =>
    axios.post<StaffLocationSession>(
      getApiUrl(
        `/staff-location/me/session/${sessionId}/stop`,
      ),
      payload,
      {
        headers: getAuthHeaders(),
      },
    ),
  );
}