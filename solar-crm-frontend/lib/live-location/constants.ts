export const LIVE_LOCATION_STORAGE_KEYS = {
  deviceId: 'staff_live_location_device_id',
  activeSessionId: 'staff_live_location_active_session_id',
  sequenceNumber: 'staff_live_location_sequence_number',
  queuedPoints: 'staff_live_location_queued_points',
} as const;

export const LIVE_LOCATION_CONFIG = {
  /**
   * Poll the backend for a new Owner request while no request is active.
   */
  activeRequestPollIntervalMs: 30_000,

  /**
   * Send device health while tracking is active.
   */
  heartbeatIntervalMs: 60_000,

  /**
   * Desired GPS update interval.
   *
   * Android may deliver points earlier or later depending on device state.
   */
  locationUpdateIntervalMs: 10_000,

  /**
   * Ignore very old cached GPS positions.
   */
  maximumLocationAgeMs: 15_000,

  /**
   * Time allowed for obtaining a location.
   */
  locationTimeoutMs: 30_000,

  /**
   * Upload accumulated points after reaching this size.
   */
  pointBatchSize: 10,

  /**
   * Backend accepts a maximum of 100 points per request.
   */
  maximumUploadBatchSize: 100,
} as const;