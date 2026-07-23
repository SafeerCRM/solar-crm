'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

import { getAuthHeaders } from '@/lib/authHeaders';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL;

export type LiveLocationEvent = {
  id: string;
  sessionId: number;
  staffUserId: number;
  actorUserId: number | null;

  eventType: string;

  previousStatus: string | null;
  newStatus: string | null;

  message: string;

  metadata: Record<string, unknown> | null;

  occurredAt: string;
  createdAt: string;
};

type EventsResponse = {
  data: LiveLocationEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type LiveLocationEventTimelineProps = {
  sessionId: number;
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

  return 'Unable to load tracking events';
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
    timeStyle: 'short',
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

function formatMetadataKey(
  value: string,
): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatMetadataValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getEventClasses(
  eventType: string,
): string {
  const normalized =
    String(eventType || '').toUpperCase();

  if (
    normalized.includes('FAILED') ||
    normalized.includes('ERROR') ||
    normalized.includes('DENIED') ||
    normalized.includes('DISABLED') ||
    normalized.includes('OFFLINE')
  ) {
    return 'border-red-200 bg-red-50';
  }

  if (
    normalized.includes('STOPPED') ||
    normalized.includes('REJECTED') ||
    normalized.includes('EXPIRED')
  ) {
    return 'border-orange-200 bg-orange-50';
  }

  if (
    normalized.includes('STARTED') ||
    normalized.includes('ACCEPTED') ||
    normalized.includes('LOCATION') ||
    normalized.includes('POINT')
  ) {
    return 'border-emerald-200 bg-emerald-50';
  }

  if (
    normalized.includes('REQUEST') ||
    normalized.includes('OPENED')
  ) {
    return 'border-blue-200 bg-blue-50';
  }

  return 'border-gray-200 bg-gray-50';
}

function getEventDotClasses(
  eventType: string,
): string {
  const normalized =
    String(eventType || '').toUpperCase();

  if (
    normalized.includes('FAILED') ||
    normalized.includes('ERROR') ||
    normalized.includes('DENIED') ||
    normalized.includes('DISABLED') ||
    normalized.includes('OFFLINE')
  ) {
    return 'bg-red-500';
  }

  if (
    normalized.includes('STOPPED') ||
    normalized.includes('REJECTED') ||
    normalized.includes('EXPIRED')
  ) {
    return 'bg-orange-500';
  }

  if (
    normalized.includes('STARTED') ||
    normalized.includes('ACCEPTED') ||
    normalized.includes('LOCATION') ||
    normalized.includes('POINT')
  ) {
    return 'bg-emerald-500';
  }

  if (
    normalized.includes('REQUEST') ||
    normalized.includes('OPENED')
  ) {
    return 'bg-blue-500';
  }

  return 'bg-gray-500';
}

export default function LiveLocationEventTimeline({
  sessionId,
}: LiveLocationEventTimelineProps) {
  const [events, setEvents] =
    useState<LiveLocationEvent[]>([]);

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [loadingOlder, setLoadingOlder] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const fetchEvents = useCallback(
    async (
      requestedPage: number,
      append: boolean,
    ) => {
      if (!sessionId || sessionId < 1) {
        return;
      }

      if (append) {
        setLoadingOlder(true);
      } else {
        setLoading(true);
      }

      try {
        const response =
          await axios.get<EventsResponse>(
            `${apiBaseUrl}/staff-location/owner/session/${sessionId}/events`,
            {
              params: {
                page: requestedPage,
                limit: 25,
              },
              headers: getAuthHeaders(),
            },
          );

        const responseData = response.data;

        const responseEvents =
          Array.isArray(responseData?.data)
            ? responseData.data
            : [];

        if (append) {
          setEvents((current) => {
            const existingIds =
              new Set(
                current.map(
                  (event) => event.id,
                ),
              );

            const additionalEvents =
              responseEvents.filter(
                (event) =>
                  !existingIds.has(event.id),
              );

            return [
              ...current,
              ...additionalEvents,
            ];
          });
        } else {
          setEvents(responseEvents);
        }

        setPage(
          Number(responseData?.page) || 1,
        );

        setTotal(
          Number(responseData?.total) || 0,
        );

        setTotalPages(
          Number(responseData?.totalPages) ||
            0,
        );

        setError(null);
      } catch (requestError) {
        setError(
          getAxiosErrorMessage(
            requestError,
          ),
        );
      } finally {
        if (append) {
          setLoadingOlder(false);
        } else {
          setLoading(false);
        }
      }
    },
    [sessionId],
  );

  useEffect(() => {
    setEvents([]);
    setPage(1);
    setTotal(0);
    setTotalPages(0);
    setError(null);

    void fetchEvents(1, false);
  }, [fetchEvents, sessionId]);

  const canLoadOlder =
    page < totalPages;

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">
            Event Timeline
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            {total > 0
              ? `${total} tracking event${
                  total === 1 ? '' : 's'
                } recorded`
              : 'Tracking activity recorded by the server and staff device.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void fetchEvents(1, false);
          }}
          disabled={
            loading || loadingOlder
          }
          className="shrink-0 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? 'Refreshing...'
            : 'Refresh Timeline'}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading && events.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-500">
          Loading tracking events...
        </div>
      ) : events.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
          <p className="font-bold text-gray-700">
            No tracking events found
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Events will appear when the request is
            opened, accepted, started, updated, or
            stopped.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {events.map((event) => {
            const metadataEntries =
              event.metadata
                ? Object.entries(
                    event.metadata,
                  )
                : [];

            return (
              <article
                key={event.id}
                className={`relative rounded-2xl border p-4 pl-6 ${getEventClasses(
                  event.eventType,
                )}`}
              >
                <span
                  className={`absolute left-3 top-5 h-2.5 w-2.5 rounded-full ${getEventDotClasses(
                    event.eventType,
                  )}`}
                />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900">
                      {formatStatus(
                        event.eventType,
                      )}
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {event.message ||
                        'No event message recorded.'}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs font-semibold text-gray-500">
                    {formatDateTime(
                      event.occurredAt,
                    )}
                  </p>
                </div>

                {(event.previousStatus ||
                  event.newStatus) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {event.previousStatus && (
                      <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 font-bold text-gray-600">
                        {formatStatus(
                          event.previousStatus,
                        )}
                      </span>
                    )}

                    {event.previousStatus &&
                      event.newStatus && (
                        <span className="font-black text-gray-400">
                          →
                        </span>
                      )}

                    {event.newStatus && (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-bold text-blue-700">
                        {formatStatus(
                          event.newStatus,
                        )}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>
                    Event #{event.id}
                  </span>

                  <span>
                    {event.actorUserId
                      ? `Caused by user #${event.actorUserId}`
                      : 'System/device event'}
                  </span>
                </div>

                {metadataEntries.length > 0 && (
                  <details className="mt-3 rounded-xl border border-white/80 bg-white/70 p-3">
                    <summary className="cursor-pointer text-xs font-black text-gray-700">
                      Technical details
                    </summary>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {metadataEntries.map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="rounded-xl bg-white p-2.5"
                          >
                            <p className="text-[11px] font-semibold text-gray-500">
                              {formatMetadataKey(
                                key,
                              )}
                            </p>

                            <p className="mt-1 break-all text-xs font-bold text-gray-800">
                              {formatMetadataValue(
                                value,
                              )}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      )}

      {canLoadOlder && (
        <button
          type="button"
          onClick={() => {
            void fetchEvents(
              page + 1,
              true,
            );
          }}
          disabled={
            loading || loadingOlder
          }
          className="mt-4 w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingOlder
            ? 'Loading Older Events...'
            : 'Load Older Events'}
        </button>
      )}
    </section>
  );
}