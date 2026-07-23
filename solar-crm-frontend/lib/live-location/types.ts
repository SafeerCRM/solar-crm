export type StaffLocationPlatform =
  | 'ANDROID'
  | 'IOS'
  | 'WEB'
  | 'UNKNOWN';

export type StaffLocationPermissionStatus =
  | 'PROMPT'
  | 'GRANTED'
  | 'LIMITED'
  | 'DENIED'
  | 'RESTRICTED'
  | 'UNKNOWN';

export type StaffLocationGpsStatus =
  | 'ENABLED'
  | 'DISABLED'
  | 'UNKNOWN';

export type StaffLocationNetworkStatus =
  | 'ONLINE'
  | 'OFFLINE'
  | 'UNKNOWN';

export type StaffLocationTrackingStatus =
  | 'REQUEST_PENDING'
  | 'STARTING'
  | 'LIVE'
  | 'DELAYED'
  | 'GPS_DISABLED'
  | 'PERMISSION_DENIED'
  | 'PERMISSION_RESTRICTED'
  | 'DEVICE_OFFLINE'
  | 'APP_BACKGROUND_RESTRICTED'
  | 'APP_STOPPED'
  | 'STOPPED_BY_OWNER'
  | 'STOPPED_BY_STAFF'
  | 'SESSION_EXPIRED'
  | 'COMPLETED';

export type StaffLocationStopReason =
  | 'OWNER_STOPPED'
  | 'STAFF_STOPPED'
  | 'SESSION_EXPIRED'
  | 'APP_STOPPED'
  | 'GPS_DISABLED'
  | 'PERMISSION_REMOVED'
  | 'DEVICE_OFFLINE'
  | 'COMPLETED'
  | 'SYSTEM_STOPPED';

export type StaffLocationSession = {
  id: number;

  staffUserId: number;
  requestedByUserId: number;
  stoppedByUserId?: number | null;

  status: StaffLocationTrackingStatus;

  isActive: boolean;
  requestOpened: boolean;
  requestAccepted: boolean;

  requestedAt: string;
  requestOpenedAt?: string | null;
  acceptedAt?: string | null;
  startedAt?: string | null;
  stoppedAt?: string | null;

  lastLocationAt?: string | null;
  lastHeartbeatAt?: string | null;
  lastStatusChangeAt?: string | null;

  lastLatitude?: number | null;
  lastLongitude?: number | null;
  lastAccuracyMetres?: number | null;
  lastSpeedMetresPerSecond?: number | null;
  lastHeadingDegrees?: number | null;

  platform?: StaffLocationPlatform | null;
  permissionStatus?: StaffLocationPermissionStatus | null;
  gpsStatus?: StaffLocationGpsStatus | null;
  networkStatus?: StaffLocationNetworkStatus | null;

  deviceId?: string | null;
  appVersion?: string | null;
  operatingSystemVersion?: string | null;

  batteryPercentage?: number | null;
  isCharging?: boolean;
  isMockLocationDetected?: boolean;

  totalDistanceMetres?: number;

  stopReason?: StaffLocationStopReason | null;

  requestRemark?: string | null;

  currentFailureCode?: string | null;
  currentFailureMessage?: string | null;

  isHidden?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type StaffLocationStartPayload = {
  requestAccepted: boolean;

  platform: StaffLocationPlatform;

  permissionStatus: StaffLocationPermissionStatus;
  gpsStatus: StaffLocationGpsStatus;
  networkStatus: StaffLocationNetworkStatus;

  deviceId?: string;
  appVersion?: string;
  operatingSystemVersion?: string;
};

export type StaffLocationHeartbeatPayload = {
  platform: StaffLocationPlatform;

  permissionStatus: StaffLocationPermissionStatus;
  gpsStatus: StaffLocationGpsStatus;
  networkStatus: StaffLocationNetworkStatus;

  backgroundRestricted: boolean;
  appInBackground?: boolean;

  deviceId?: string;
  appVersion?: string;
  operatingSystemVersion?: string;

  batteryPercentage?: number;
  isCharging?: boolean;

    isMockLocationDetected?: boolean;

  /**
   * Number of GPS points waiting locally for upload.
   */
  pendingOfflinePoints?: number;

  failureCode?: string;
  failureMessage?: string;
};

export type StaffLocationPointPayload = {
  sequenceNumber: number;

  latitude: number;
  longitude: number;

  accuracyMetres?: number;
  altitudeMetres?: number;
  altitudeAccuracyMetres?: number;

  speedMetresPerSecond?: number;
  headingDegrees?: number;

  batteryPercentage?: number;
  isCharging?: boolean;

  isMockLocation?: boolean;
  wasRecordedOffline?: boolean;

  recordedAt: string;
};

export type StaffLocationPointBatchPayload = {
  platform: StaffLocationPlatform;
  deviceId?: string;
  points: StaffLocationPointPayload[];
};

export type StaffLocationPointBatchResponse = {
  sessionId: number;

  received: number;
  inserted: number;
  duplicatesIgnored: number;

  addedDistanceMetres?: number;
  totalDistanceMetres?: number;

  lastLocationAt?: string | null;
  status: StaffLocationTrackingStatus;
};

export type StaffLocationStopPayload = {
  reason?: StaffLocationStopReason;
  remark?: string;
};

export type StaffLocationApiError = {
  message: string;
  statusCode?: number;
  error?: string;
};