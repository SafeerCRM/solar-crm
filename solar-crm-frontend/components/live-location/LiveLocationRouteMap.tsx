'use client';

import {
  useEffect,
  useMemo,
} from 'react';

import type {
  LatLngBoundsExpression,
  LatLngExpression,
} from 'leaflet';

import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';

export type LiveLocationRoutePoint = {
  id: string;
  sessionId: number;
  staffUserId: number;
  sequenceNumber: string;

  latitude: number;
  longitude: number;

  accuracyMetres: number | null;
  altitudeMetres: number | null;
  altitudeAccuracyMetres: number | null;

  speedMetresPerSecond: number | null;
  headingDegrees: number | null;

  batteryPercentage: number | null;
  isCharging: boolean;

  isMockLocation: boolean;
  wasRecordedOffline: boolean;

  platform: string;
  deviceId: string | null;

  recordedAt: string;
  receivedAt: string;
  createdAt: string;
};

type LiveLocationRouteMapProps = {
  points: LiveLocationRoutePoint[];
  selectedPointId?: string | null;

  onPointSelect?: (
    point: LiveLocationRoutePoint,
  ) => void;
};

export const RELIABLE_GPS_ACCURACY_METRES = 50;

export function isReliableRoutePoint(
  point: LiveLocationRoutePoint,
): boolean {
  const accuracy = Number(
    point.accuracyMetres,
  );

  return (
    point.isMockLocation !== true &&
    Number.isFinite(accuracy) &&
    accuracy >= 0 &&
    accuracy <=
      RELIABLE_GPS_ACCURACY_METRES
  );
}

function createReliableRouteSegments(
  points: LiveLocationRoutePoint[],
): LatLngExpression[][] {
  const segments: LatLngExpression[][] =
    [];

  let currentSegment:
    | LatLngExpression[]
    | null = null;

  points.forEach((point) => {
    if (!isReliableRoutePoint(point)) {
      currentSegment = null;
      return;
    }

    const position: LatLngExpression = [
      Number(point.latitude),
      Number(point.longitude),
    ];

    if (!currentSegment) {
      currentSegment = [position];
      segments.push(currentSegment);
      return;
    }

    currentSegment.push(position);
  });

  return segments.filter(
    (segment) => segment.length > 1,
  );
}

type FitRouteBoundsProps = {
  positions: LatLngExpression[];
};

function FitRouteBounds({
  positions,
}: FitRouteBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) {
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], 17);
      return;
    }

    map.fitBounds(
      positions as LatLngBoundsExpression,
      {
        padding: [35, 35],
        maxZoom: 18,
      },
    );
  }, [map, positions]);

  return null;
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
    timeStyle: 'medium',
  });
}

function formatCoordinate(
  value: number,
): string {
  return Number(value).toFixed(6);
}

function formatAccuracy(
  value?: number | null,
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return '-';
  }

  return `${Number(value).toFixed(1)} m`;
}

function formatSpeed(
  value?: number | null,
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return '-';
  }

  return `${(
    Number(value) * 3.6
  ).toFixed(1)} km/h`;
}

function formatBattery(
  point: LiveLocationRoutePoint,
): string {
  if (
    point.batteryPercentage === null ||
    point.batteryPercentage === undefined
  ) {
    return '-';
  }

  return `${Math.round(
    Number(point.batteryPercentage),
  )}%${
    point.isCharging
      ? ' · Charging'
      : ''
  }`;
}

export default function LiveLocationRouteMap({
  points,
  selectedPointId,
  onPointSelect,
}: LiveLocationRouteMapProps) {
  const validPoints = useMemo(
    () =>
      points.filter((point) => {
        const latitude =
          Number(point.latitude);

        const longitude =
          Number(point.longitude);

        return (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        );
      }),
    [points],
  );

  const positions =
    useMemo<LatLngExpression[]>(
      () =>
        validPoints.map((point) => [
          Number(point.latitude),
          Number(point.longitude),
        ]),
      [validPoints],
    );

      const reliableRouteSegments =
    useMemo(
      () =>
        createReliableRouteSegments(
          validPoints,
        ),
      [validPoints],
    );

  if (validPoints.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <div>
          <p className="font-black text-gray-700">
            No route coordinates available
          </p>

          <p className="mt-1 text-sm text-gray-500">
            The route will appear after the staff
            device sends valid GPS points.
          </p>
        </div>
      </div>
    );
  }

  const firstPoint = validPoints[0];

  const lastPoint =
    validPoints[
      validPoints.length - 1
    ];

  const initialCentre: LatLngExpression = [
    Number(lastPoint.latitude),
    Number(lastPoint.longitude),
  ];

  return (
    <div className="h-[55vh] min-h-[420px] w-full overflow-hidden rounded-3xl border border-gray-200 bg-gray-100">
      <MapContainer
        center={initialCentre}
        zoom={16}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitRouteBounds
          positions={positions}
        />

                {reliableRouteSegments.map(
          (segment, segmentIndex) => (
            <Polyline
              key={`reliable-route-${segmentIndex}`}
              positions={segment}
              pathOptions={{
                color: '#2563eb',
                weight: 5,
                opacity: 0.85,
              }}
            />
          ),
        )}

        {validPoints.map(
          (point, index) => {
            const isFirst =
              index === 0;

            const isLast =
              index ===
              validPoints.length - 1;

                        const isSelected =
              selectedPointId ===
              point.id;

            const isReliable =
              isReliableRoutePoint(
                point,
              );

            let markerColour =
              isReliable
                ? '#2563eb'
                : '#f59e0b';

            if (point.isMockLocation) {
              markerColour =
                '#111827';
            }

            if (isFirst) {
              markerColour =
                '#16a34a';
            }

            if (isLast) {
              markerColour =
                '#dc2626';
            }

            if (isSelected) {
              markerColour =
                '#7c3aed';
            }

            return (
              <CircleMarker
                key={point.id}
                center={[
                  Number(
                    point.latitude,
                  ),
                  Number(
                    point.longitude,
                  ),
                ]}
                radius={
                  isSelected
                    ? 9
                    : isFirst ||
                        isLast
                      ? 8
                      : isReliable
                        ? 4
                        : 6
                }
                                pathOptions={{
                  color: isReliable
                    ? '#ffffff'
                    : '#92400e',
                  fillColor:
                    markerColour,
                  fillOpacity:
                    isReliable
                      ? 1
                      : 0.8,
                  weight:
                    isReliable
                      ? 2
                      : 3,
                  dashArray:
                    isReliable
                      ? undefined
                      : '4 3',
                }}
                eventHandlers={{
                  click: () => {
                    onPointSelect?.(
                      point,
                    );
                  },
                }}
              >
                <Popup>
                  <div className="min-w-[210px]">
                    <p className="font-bold">
                      {isFirst
                        ? 'Route Start'
                        : isLast
                          ? 'Latest Position'
                          : `Route Point #${
                              index + 1
                            }`}
                    </p>

                    <p className="mt-1 text-xs">
                      {formatDateTime(
                        point.recordedAt,
                      )}
                    </p>

                    <div className="mt-2 space-y-1 text-xs">
                      <p>
                        Coordinates:{' '}
                        {formatCoordinate(
                          Number(
                            point.latitude,
                          ),
                        )}
                        ,{' '}
                        {formatCoordinate(
                          Number(
                            point.longitude,
                          ),
                        )}
                      </p>

                      <p>
                        Accuracy:{' '}
                        {formatAccuracy(
                          point.accuracyMetres,
                        )}
                      </p>

                                            <p
                        className={
                          isReliable
                            ? 'font-bold text-green-700'
                            : 'font-bold text-amber-700'
                        }
                      >
                        GPS Quality:{' '}
                        {point.isMockLocation
                          ? 'Mock Location'
                          : isReliable
                            ? 'Reliable'
                            : 'Low Accuracy'}
                      </p>

                      <p>
                        Speed:{' '}
                        {formatSpeed(
                          point.speedMetresPerSecond,
                        )}
                      </p>

                      <p>
                        Battery:{' '}
                        {formatBattery(
                          point,
                        )}
                      </p>

                      {point.wasRecordedOffline && (
                        <p>
                          Uploaded from offline
                          queue
                        </p>
                      )}

                      {point.isMockLocation && (
                        <p className="font-bold text-red-600">
                          Mock location detected
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          },
        )}
      </MapContainer>
    </div>
  );
}