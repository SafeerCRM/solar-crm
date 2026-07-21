import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  QueryFailedError,
  Repository,
} from 'typeorm';

import { StaffLocationEvent } from './staff-location-event.entity';
import { StaffLocationPoint } from './staff-location-point.entity';
import { StaffLocationTrackingSession } from './staff-location-tracking-session.entity';

import {
  StaffLocationEventType,
  StaffLocationGpsStatus,
  StaffLocationNetworkStatus,
  StaffLocationPermissionStatus,
  StaffLocationStopReason,
  StaffLocationTrackingStatus,
} from './staff-location.enums';

import { RequestStaffLocationDto } from './dto/request-staff-location.dto';
import { StartStaffLocationDto } from './dto/start-staff-location.dto';
import { StaffLocationHeartbeatDto } from './dto/staff-location-heartbeat.dto';
import { StopStaffLocationDto } from './dto/stop-staff-location.dto';
import { StaffLocationPointBatchDto } from './dto/staff-location-point.dto';

@Injectable()
export class StaffLocationService {
  constructor(
    @InjectRepository(StaffLocationTrackingSession)
    private readonly trackingSessionRepository: Repository<StaffLocationTrackingSession>,

    @InjectRepository(StaffLocationPoint)
    private readonly locationPointRepository: Repository<StaffLocationPoint>,

    @InjectRepository(StaffLocationEvent)
    private readonly locationEventRepository: Repository<StaffLocationEvent>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a new OWNER-initiated tracking request.
   *
   * The database also enforces one active visible session per staff member,
   * so simultaneous OWNER requests cannot create duplicate active sessions.
   */
  async requestTracking(
    dto: RequestStaffLocationDto,
    requestedByUserId: number,
  ) {
    if (!requestedByUserId || requestedByUserId < 1) {
      throw new BadRequestException('Invalid requesting user');
    }

    if (dto.staffUserId === requestedByUserId) {
      throw new BadRequestException(
        'You cannot request live tracking for your own account',
      );
    }

    const existingActive =
      await this.trackingSessionRepository.findOne({
        where: {
          staffUserId: dto.staffUserId,
          isActive: true,
          isHidden: false,
        },
        order: {
          createdAt: 'DESC',
        },
      });

    if (existingActive) {
      throw new ConflictException({
        message:
          'An active location tracking session already exists for this staff member',
        sessionId: existingActive.id,
        status: existingActive.status,
      });
    }

    const now = new Date();

    try {
      return await this.dataSource.transaction(async (manager) => {
        const sessionRepository = manager.getRepository(
          StaffLocationTrackingSession,
        );

        const eventRepository = manager.getRepository(StaffLocationEvent);

        const session = sessionRepository.create({
          staffUserId: dto.staffUserId,
          requestedByUserId,
          stoppedByUserId: null,

          status: StaffLocationTrackingStatus.REQUEST_PENDING,

          isActive: true,
          requestOpened: false,
          requestAccepted: false,

          requestedAt: now,
          requestOpenedAt: null,
          acceptedAt: null,
          startedAt: null,
          stoppedAt: null,

          lastLocationAt: null,
          lastHeartbeatAt: null,
          lastStatusChangeAt: now,

          lastLatitude: null,
          lastLongitude: null,
          lastAccuracyMetres: null,
          lastSpeedMetresPerSecond: null,
          lastHeadingDegrees: null,

          batteryPercentage: null,
          isCharging: false,
          isMockLocationDetected: false,

          totalDistanceMetres: 0,

          stopReason: null,
          currentFailureMessage: null,
          currentFailureCode: null,

          requestRemark: dto.requestRemark?.trim() || null,

          isHidden: false,
          hiddenByUserId: null,
          hiddenAt: null,
        });

        const savedSession = await sessionRepository.save(session);

        const event = eventRepository.create({
          sessionId: savedSession.id,
          staffUserId: savedSession.staffUserId,
          actorUserId: requestedByUserId,

          eventType: StaffLocationEventType.TRACKING_REQUESTED,

          previousStatus: null,
          newStatus: StaffLocationTrackingStatus.REQUEST_PENDING,

          message: 'Live location tracking requested by OWNER',

          metadata: dto.requestRemark
            ? {
                requestRemark: dto.requestRemark.trim(),
              }
            : null,

          occurredAt: now,
        });

        await eventRepository.save(event);

        return savedSession;
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'An active location tracking session already exists for this staff member',
        );
      }

      throw error;
    }
  }

  /**
   * Marks that the staff device opened the pending tracking request.
   *
   * The authenticated staff user ID must be supplied by the controller later.
   */
  async markRequestOpened(sessionId: number, staffUserId: number) {
    const session = await this.getOwnedActiveSession(
      sessionId,
      staffUserId,
    );

    if (session.requestOpened) {
      return session;
    }

    const now = new Date();

    return this.dataSource.transaction(async (manager) => {
      const sessionRepository = manager.getRepository(
        StaffLocationTrackingSession,
      );

      const eventRepository = manager.getRepository(StaffLocationEvent);

      session.requestOpened = true;
      session.requestOpenedAt = now;

      const savedSession = await sessionRepository.save(session);

      await eventRepository.save(
        eventRepository.create({
          sessionId: savedSession.id,
          staffUserId: savedSession.staffUserId,
          actorUserId: staffUserId,

          eventType: StaffLocationEventType.REQUEST_OPENED,

          previousStatus: savedSession.status,
          newStatus: savedSession.status,

          message: 'Staff opened the live location tracking request',
          metadata: null,

          occurredAt: now,
        }),
      );

      return savedSession;
    });
  }

  /**
   * Accepts and starts a tracking session.
   *
   * If GPS or permissions are unavailable, the session remains active but its
   * status clearly tells the OWNER why location cannot be received.
   */
  async startTracking(
    sessionId: number,
    staffUserId: number,
    dto: StartStaffLocationDto,
  ) {
    const session = await this.getOwnedActiveSession(
      sessionId,
      staffUserId,
    );

    if (
      session.status === StaffLocationTrackingStatus.STOPPED_BY_OWNER ||
      session.status === StaffLocationTrackingStatus.STOPPED_BY_STAFF ||
      session.status === StaffLocationTrackingStatus.SESSION_EXPIRED ||
      session.status === StaffLocationTrackingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'This tracking session has already ended',
      );
    }

    const now = new Date();

    const nextStatus = this.resolveTrackingStatus({
      permissionStatus: dto.permissionStatus,
      gpsStatus: dto.gpsStatus,
      networkStatus: dto.networkStatus,
      backgroundRestricted: false,
    });

    const failure = this.resolveFailureDetails({
      permissionStatus: dto.permissionStatus,
      gpsStatus: dto.gpsStatus,
      networkStatus: dto.networkStatus,
      backgroundRestricted: false,
      suppliedFailureCode: undefined,
      suppliedFailureMessage: undefined,
    });

    return this.dataSource.transaction(async (manager) => {
      const sessionRepository = manager.getRepository(
        StaffLocationTrackingSession,
      );

      const eventRepository = manager.getRepository(StaffLocationEvent);

      const previousStatus = session.status;

      session.requestOpened = true;
      session.requestOpenedAt = session.requestOpenedAt || now;

      session.requestAccepted = dto.requestAccepted !== false;
      session.acceptedAt = session.acceptedAt || now;
      session.startedAt = session.startedAt || now;

      session.platform = dto.platform;
      session.permissionStatus = dto.permissionStatus;
      session.gpsStatus = dto.gpsStatus;
      session.networkStatus = dto.networkStatus;

      session.deviceId = dto.deviceId?.trim() || null;
      session.appVersion = dto.appVersion?.trim() || null;
      session.operatingSystemVersion =
        dto.operatingSystemVersion?.trim() || null;

      session.status = nextStatus;
      session.lastHeartbeatAt = now;
      session.lastStatusChangeAt = now;

      session.currentFailureCode = failure.code;
      session.currentFailureMessage = failure.message;

      const savedSession = await sessionRepository.save(session);

      await eventRepository.save(
        eventRepository.create({
          sessionId: savedSession.id,
          staffUserId: savedSession.staffUserId,
          actorUserId: staffUserId,

          eventType: StaffLocationEventType.REQUEST_ACCEPTED,

          previousStatus,
          newStatus: savedSession.status,

          message: 'Staff accepted the live location tracking request',

          metadata: {
            platform: dto.platform,
            permissionStatus: dto.permissionStatus,
            gpsStatus: dto.gpsStatus,
            networkStatus: dto.networkStatus,
            deviceId: dto.deviceId || null,
            appVersion: dto.appVersion || null,
            operatingSystemVersion:
              dto.operatingSystemVersion || null,
          },

          occurredAt: now,
        }),
      );

      await eventRepository.save(
        eventRepository.create({
          sessionId: savedSession.id,
          staffUserId: savedSession.staffUserId,
          actorUserId: staffUserId,

          eventType: this.resolveStartEventType(savedSession.status),

          previousStatus,
          newStatus: savedSession.status,

          message: this.resolveStatusMessage(savedSession.status),

          metadata: failure.message
            ? {
                failureCode: failure.code,
                failureMessage: failure.message,
              }
            : null,

          occurredAt: now,
        }),
      );

      return savedSession;
    });
  }

  /**
   * Receives a lightweight device heartbeat.
   *
   * A heartbeat does not insert a location point. It updates device health and
   * allows the OWNER dashboard to distinguish GPS-off, permission-denied,
   * network issues, and background restrictions.
   */
  async processHeartbeat(
    sessionId: number,
    staffUserId: number,
    dto: StaffLocationHeartbeatDto,
  ) {
    const session = await this.getOwnedActiveSession(
      sessionId,
      staffUserId,
    );

    const now = new Date();

    const nextStatus = this.resolveTrackingStatus({
      permissionStatus: dto.permissionStatus,
      gpsStatus: dto.gpsStatus,
      networkStatus: dto.networkStatus,
      backgroundRestricted: dto.backgroundRestricted === true,
    });

    const failure = this.resolveFailureDetails({
      permissionStatus: dto.permissionStatus,
      gpsStatus: dto.gpsStatus,
      networkStatus: dto.networkStatus,
      backgroundRestricted: dto.backgroundRestricted === true,
      suppliedFailureCode: dto.failureCode,
      suppliedFailureMessage: dto.failureMessage,
    });

    return this.dataSource.transaction(async (manager) => {
      const sessionRepository = manager.getRepository(
        StaffLocationTrackingSession,
      );

      const eventRepository = manager.getRepository(StaffLocationEvent);

      const previousStatus = session.status;
      const previousGpsStatus = session.gpsStatus;
      const previousPermissionStatus = session.permissionStatus;
      const previousNetworkStatus = session.networkStatus;
      const previousBatteryPercentage =
  session.batteryPercentage;

      session.platform = dto.platform;
      session.permissionStatus = dto.permissionStatus;
      session.gpsStatus = dto.gpsStatus;
      session.networkStatus = dto.networkStatus;

      session.deviceId =
        dto.deviceId?.trim() || session.deviceId || null;

      session.appVersion =
        dto.appVersion?.trim() || session.appVersion || null;

      session.operatingSystemVersion =
        dto.operatingSystemVersion?.trim() ||
        session.operatingSystemVersion ||
        null;

      session.batteryPercentage =
        dto.batteryPercentage ?? session.batteryPercentage;

      session.isCharging = dto.isCharging ?? session.isCharging;

      const mockLocationWasAlreadyDetected =
  session.isMockLocationDetected;

      session.isMockLocationDetected =
        dto.isMockLocationDetected ??
        session.isMockLocationDetected;

      session.lastHeartbeatAt = now;

      session.currentFailureCode = failure.code;
      session.currentFailureMessage = failure.message;

      if (nextStatus !== previousStatus) {
        session.status = nextStatus;
        session.lastStatusChangeAt = now;
      }

      const savedSession = await sessionRepository.save(session);

      const events: StaffLocationEvent[] = [];


      if (previousGpsStatus !== dto.gpsStatus) {
        events.push(
          eventRepository.create({
            sessionId: savedSession.id,
            staffUserId: savedSession.staffUserId,
            actorUserId: staffUserId,

            eventType:
              dto.gpsStatus === StaffLocationGpsStatus.ENABLED
                ? StaffLocationEventType.GPS_ENABLED
                : StaffLocationEventType.GPS_DISABLED,

            previousStatus,
            newStatus: savedSession.status,

            message:
              dto.gpsStatus === StaffLocationGpsStatus.ENABLED
                ? 'Device GPS was enabled'
                : 'Device GPS was disabled',

            metadata: {
              previousGpsStatus,
              newGpsStatus: dto.gpsStatus,
            },

            occurredAt: now,
          }),
        );
      }

      if (previousPermissionStatus !== dto.permissionStatus) {
        events.push(
          eventRepository.create({
            sessionId: savedSession.id,
            staffUserId: savedSession.staffUserId,
            actorUserId: staffUserId,

            eventType: this.resolvePermissionEventType(
              dto.permissionStatus,
            ),

            previousStatus,
            newStatus: savedSession.status,

            message: this.resolvePermissionMessage(
              dto.permissionStatus,
            ),

            metadata: {
              previousPermissionStatus,
              newPermissionStatus: dto.permissionStatus,
            },

            occurredAt: now,
          }),
        );
      }

      if (previousNetworkStatus !== dto.networkStatus) {
        events.push(
          eventRepository.create({
            sessionId: savedSession.id,
            staffUserId: savedSession.staffUserId,
            actorUserId: staffUserId,

            eventType:
              dto.networkStatus === StaffLocationNetworkStatus.ONLINE
                ? StaffLocationEventType.DEVICE_ONLINE
                : StaffLocationEventType.DEVICE_OFFLINE,

            previousStatus,
            newStatus: savedSession.status,

            message:
              dto.networkStatus === StaffLocationNetworkStatus.ONLINE
                ? 'Device network connection restored'
                : 'Device reported that it is offline',

            metadata: {
              previousNetworkStatus,
              newNetworkStatus: dto.networkStatus,
            },

            occurredAt: now,
          }),
        );
      }

      if (dto.backgroundRestricted === true) {
        events.push(
          eventRepository.create({
            sessionId: savedSession.id,
            staffUserId: savedSession.staffUserId,
            actorUserId: staffUserId,

            eventType:
              StaffLocationEventType.BACKGROUND_RESTRICTED,

            previousStatus,
            newStatus: savedSession.status,

            message:
              'Device background location operation is restricted',

            metadata: {
              appInBackground: dto.appInBackground ?? null,
            },

            occurredAt: now,
          }),
        );
      }

      if (
  dto.isMockLocationDetected === true &&
  mockLocationWasAlreadyDetected !== true
) {
        events.push(
          eventRepository.create({
            sessionId: savedSession.id,
            staffUserId: savedSession.staffUserId,
            actorUserId: staffUserId,

            eventType:
              StaffLocationEventType.MOCK_LOCATION_DETECTED,

            previousStatus,
            newStatus: savedSession.status,

            message: 'Mock location was detected on the device',

            metadata: null,

            occurredAt: now,
          }),
        );
      }

      if (
  dto.batteryPercentage !== undefined &&
  dto.batteryPercentage <= 15 &&
  (
    previousBatteryPercentage === null ||
    previousBatteryPercentage > 15
  )
) {
        events.push(
          eventRepository.create({
            sessionId: savedSession.id,
            staffUserId: savedSession.staffUserId,
            actorUserId: staffUserId,

            eventType: StaffLocationEventType.BATTERY_LOW,

            previousStatus,
            newStatus: savedSession.status,

            message: `Device battery is low at ${dto.batteryPercentage}%`,

            metadata: {
              batteryPercentage: dto.batteryPercentage,
              isCharging: dto.isCharging ?? null,
            },

            occurredAt: now,
          }),
        );
      }

      if (nextStatus !== previousStatus) {
        events.push(
          eventRepository.create({
            sessionId: savedSession.id,
            staffUserId: savedSession.staffUserId,
            actorUserId: staffUserId,

            eventType: this.resolveStatusEventType(nextStatus),

            previousStatus,
            newStatus: nextStatus,

            message: this.resolveStatusMessage(nextStatus),

            metadata: failure.message
              ? {
                  failureCode: failure.code,
                  failureMessage: failure.message,
                }
              : null,

            occurredAt: now,
          }),
        );
      }

      await eventRepository.save(events);

      return savedSession;
    });
  }

    /**
   * Saves a validated batch of location points for the authenticated staff
   * member.
   *
   * Important safeguards:
   * - the session must belong to the authenticated staff user;
   * - the session must still be active;
   * - duplicate device sequence numbers are ignored;
   * - the session row is locked so simultaneous batches cannot corrupt
   *   distance or latest-location calculations;
   * - only one event is created for the complete batch.
   */
  async saveLocationPointBatch(
    sessionId: number,
    staffUserId: number,
    dto: StaffLocationPointBatchDto,
  ) {
    if (!sessionId || sessionId < 1) {
      throw new BadRequestException('Invalid tracking session');
    }

    if (!staffUserId || staffUserId < 1) {
      throw new BadRequestException('Invalid staff user');
    }

    return this.dataSource.transaction(async (manager) => {
      const sessionRepository = manager.getRepository(
        StaffLocationTrackingSession,
      );

      const pointRepository = manager.getRepository(
        StaffLocationPoint,
      );

      const eventRepository = manager.getRepository(
        StaffLocationEvent,
      );

      /**
       * The pessimistic write lock serializes location batches for this
       * individual tracking session.
       *
       * It does not lock other staff sessions.
       */
      const session = await sessionRepository.findOne({
        where: {
          id: sessionId,
          staffUserId,
          isActive: true,
          isHidden: false,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!session) {
        throw new NotFoundException(
          'Active location tracking session not found for this staff user',
        );
      }

      if (
        session.status ===
          StaffLocationTrackingStatus.STOPPED_BY_OWNER ||
        session.status ===
          StaffLocationTrackingStatus.STOPPED_BY_STAFF ||
        session.status ===
          StaffLocationTrackingStatus.SESSION_EXPIRED ||
        session.status === StaffLocationTrackingStatus.COMPLETED
      ) {
        throw new BadRequestException(
          'This tracking session has already ended',
        );
      }

      const now = new Date();

      /**
       * Sort by device sequence so offline batches remain deterministic even
       * when the request body arrives in a different order.
       */
      const sortedPoints = [...dto.points].sort(
        (a, b) => a.sequenceNumber - b.sequenceNumber,
      );

      /**
       * Reject duplicate sequence values inside the same request body.
       */
      const requestSequenceNumbers = sortedPoints.map(
        (point) => point.sequenceNumber,
      );

      const uniqueRequestSequences = new Set(
        requestSequenceNumbers,
      );

      if (
        uniqueRequestSequences.size !==
        requestSequenceNumbers.length
      ) {
        throw new BadRequestException(
          'Duplicate sequence numbers found in location batch',
        );
      }

      const sequenceStrings = requestSequenceNumbers.map((value) =>
        String(value),
      );

      /**
       * Some points may already exist because an offline queue can retry a
       * previously successful request. Those points are safely ignored.
       */
      const existingPoints =
        sequenceStrings.length > 0
          ? await pointRepository.find({
              where: {
                sessionId,
                sequenceNumber: In(sequenceStrings),
              },
              select: {
                sequenceNumber: true,
              },
            })
          : [];

      const existingSequenceSet = new Set(
        existingPoints.map((point) => point.sequenceNumber),
      );

      const newPointDtos = sortedPoints.filter(
        (point) =>
          !existingSequenceSet.has(
            String(point.sequenceNumber),
          ),
      );

      if (newPointDtos.length === 0) {
        return {
          sessionId: session.id,
          received: dto.points.length,
          inserted: 0,
          duplicatesIgnored: dto.points.length,
          lastLocationAt: session.lastLocationAt,
          status: session.status,
        };
      }

      /**
       * Prevent obviously invalid future timestamps from appearing as a
       * "live" location.
       *
       * A five-minute allowance handles minor phone-clock differences.
       */
      const maximumAllowedRecordedTime =
        now.getTime() + 5 * 60 * 1000;

      for (const point of newPointDtos) {
        const recordedTime = new Date(point.recordedAt);

        if (
          Number.isNaN(recordedTime.getTime()) ||
          recordedTime.getTime() > maximumAllowedRecordedTime
        ) {
          throw new BadRequestException(
            'A location point contains an invalid future recorded time',
          );
        }
      }

      const pointEntities = newPointDtos.map((point) =>
        pointRepository.create({
          sessionId: session.id,
          staffUserId,

          sequenceNumber: String(point.sequenceNumber),

          latitude: point.latitude,
          longitude: point.longitude,

          accuracyMetres: point.accuracyMetres ?? null,
          altitudeMetres: point.altitudeMetres ?? null,
          altitudeAccuracyMetres:
            point.altitudeAccuracyMetres ?? null,

          speedMetresPerSecond:
            point.speedMetresPerSecond ?? null,

          headingDegrees: point.headingDegrees ?? null,

          batteryPercentage:
            point.batteryPercentage ?? null,

          isCharging: point.isCharging ?? false,
          isMockLocation: point.isMockLocation ?? false,
          wasRecordedOffline:
            point.wasRecordedOffline ?? false,

          platform: dto.platform,
          deviceId: dto.deviceId?.trim() || null,

          recordedAt: new Date(point.recordedAt),
          receivedAt: now,
        }),
      );

      await pointRepository.save(pointEntities, {
        chunk: 100,
      });

      /**
       * Calculate only the distance created by this new batch.
       *
       * We begin from the previous session coordinate, then walk through the
       * newly inserted points. The complete historical route is never loaded.
       */
      let previousLatitude = session.lastLatitude;
      let previousLongitude = session.lastLongitude;

      let addedDistanceMetres = 0;

      for (const point of pointEntities) {
        if (
          previousLatitude !== null &&
          previousLongitude !== null
        ) {
          const segmentDistance =
            this.calculateDistanceMetres(
              previousLatitude,
              previousLongitude,
              point.latitude,
              point.longitude,
            );

          /**
           * Ignore unrealistic jumps above 100 km within one segment.
           *
           * They are retained as raw points for audit, but they do not inflate
           * the staff travel-distance summary.
           */
          if (
            Number.isFinite(segmentDistance) &&
            segmentDistance >= 0 &&
            segmentDistance <= 100000
          ) {
            addedDistanceMetres += segmentDistance;
          }
        }

        previousLatitude = point.latitude;
        previousLongitude = point.longitude;
      }

      /**
       * Use recordedAt rather than request-array order to identify the latest
       * actual device location.
       */
      const latestPoint = [...pointEntities].sort(
        (a, b) =>
          b.recordedAt.getTime() -
          a.recordedAt.getTime(),
      )[0];

      const previousStatus = session.status;

      session.platform = dto.platform;
      session.deviceId =
        dto.deviceId?.trim() ||
        session.deviceId ||
        null;

      session.lastLatitude = latestPoint.latitude;
      session.lastLongitude = latestPoint.longitude;

      session.lastAccuracyMetres =
        latestPoint.accuracyMetres;

      session.lastSpeedMetresPerSecond =
        latestPoint.speedMetresPerSecond;

      session.lastHeadingDegrees =
        latestPoint.headingDegrees;

      session.batteryPercentage =
        latestPoint.batteryPercentage ??
        session.batteryPercentage;

      session.isCharging = latestPoint.isCharging;

      session.isMockLocationDetected =
        session.isMockLocationDetected ||
        latestPoint.isMockLocation;

      session.lastLocationAt = latestPoint.recordedAt;
      session.lastHeartbeatAt = now;

      session.totalDistanceMetres =
        Number(session.totalDistanceMetres || 0) +
        addedDistanceMetres;

      /**
       * A successfully received coordinate proves that location collection is
       * currently working.
       */
      session.status = StaffLocationTrackingStatus.LIVE;
      session.lastStatusChangeAt =
        previousStatus === StaffLocationTrackingStatus.LIVE
          ? session.lastStatusChangeAt
          : now;

      session.currentFailureCode = null;
      session.currentFailureMessage = null;

      const savedSession =
        await sessionRepository.save(session);

      const batchContainsOfflinePoints =
        pointEntities.some(
          (point) => point.wasRecordedOffline,
        );

      await eventRepository.save(
        eventRepository.create({
          sessionId: savedSession.id,
          staffUserId: savedSession.staffUserId,
          actorUserId: staffUserId,

          eventType: batchContainsOfflinePoints
            ? StaffLocationEventType.OFFLINE_POINTS_SYNCED
            : previousStatus ===
                StaffLocationTrackingStatus.LIVE
              ? StaffLocationEventType.LOCATION_RECEIVED
              : StaffLocationEventType.LOCATION_RESTORED,

          previousStatus,
          newStatus: StaffLocationTrackingStatus.LIVE,

          message: batchContainsOfflinePoints
            ? `${pointEntities.length} queued location point(s) synchronized`
            : `${pointEntities.length} live location point(s) received`,

          metadata: {
            receivedPoints: dto.points.length,
            insertedPoints: pointEntities.length,
            duplicatePointsIgnored:
              dto.points.length - pointEntities.length,

            addedDistanceMetres:
              Math.round(addedDistanceMetres),

            lastLatitude: latestPoint.latitude,
            lastLongitude: latestPoint.longitude,

            lastAccuracyMetres:
              latestPoint.accuracyMetres,

            latestRecordedAt:
              latestPoint.recordedAt.toISOString(),

            platform: dto.platform,
            deviceId: dto.deviceId || null,

            containsOfflinePoints:
              batchContainsOfflinePoints,

            mockLocationDetected:
              pointEntities.some(
                (point) => point.isMockLocation,
              ),
          },

          occurredAt: now,
        }),
      );

      return {
        sessionId: savedSession.id,

        received: dto.points.length,
        inserted: pointEntities.length,

        duplicatesIgnored:
          dto.points.length - pointEntities.length,

        addedDistanceMetres:
          Math.round(addedDistanceMetres),

        totalDistanceMetres:
          Math.round(
            Number(
              savedSession.totalDistanceMetres || 0,
            ),
          ),

        lastLocationAt:
          savedSession.lastLocationAt,

        status: savedSession.status,
      };
    });
  }

  /**
   * Stops an active tracking session.
   *
   * The caller role will later determine which stop reasons are permitted.
   */
  async stopTracking(
    sessionId: number,
    actorUserId: number,
    dto: StopStaffLocationDto,
  ) {
    const session = await this.trackingSessionRepository.findOne({
      where: {
        id: sessionId,
        isActive: true,
        isHidden: false,
      },
    });

    if (!session) {
      throw new NotFoundException(
        'Active staff location tracking session not found',
      );
    }

    const now = new Date();

    const stopReason = dto.reason;

if (!stopReason) {
  throw new BadRequestException(
    'Tracking stop reason is required',
  );
}

const finalStatus =
  this.resolveStoppedStatus(stopReason);

    return this.dataSource.transaction(async (manager) => {
      const sessionRepository = manager.getRepository(
        StaffLocationTrackingSession,
      );

      const eventRepository = manager.getRepository(StaffLocationEvent);

      const previousStatus = session.status;

      session.status = finalStatus;
      session.isActive = false;

      session.stoppedByUserId = actorUserId;
      session.stoppedAt = now;
      session.stopReason = stopReason;

      session.lastStatusChangeAt = now;

      session.currentFailureCode = null;
      session.currentFailureMessage = null;

      const savedSession = await sessionRepository.save(session);

      await eventRepository.save(
        eventRepository.create({
          sessionId: savedSession.id,
          staffUserId: savedSession.staffUserId,
          actorUserId,

          eventType: StaffLocationEventType.TRACKING_STOPPED,

          previousStatus,
          newStatus: finalStatus,

          message:
            dto.remark?.trim() ||
            this.resolveStopMessage(stopReason),

          metadata: {
            reason: stopReason,
            remark: dto.remark?.trim() || null,
          },

          occurredAt: now,
        }),
      );

      return savedSession;
    });
  }

  /**
 * Returns active tracking sessions for the OWNER monitoring screen.
 *
 * Supported query values:
 * - page
 * - limit
 * - staffUserId
 * - status
 *
 * This method only reads the new staff-location tables.
 */
async getOwnerActiveSessions(query: any = {}) {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 50, 1),
    100,
  );

  const skip = (page - 1) * limit;

  const qb =
    this.trackingSessionRepository
      .createQueryBuilder('session')
      .where('session.isActive = :isActive', {
        isActive: true,
      })
      .andWhere('session.isHidden = :isHidden', {
        isHidden: false,
      });

  if (query.staffUserId) {
    const staffUserId = Number(query.staffUserId);

    if (!Number.isInteger(staffUserId) || staffUserId < 1) {
      throw new BadRequestException(
        'Invalid staff user ID',
      );
    }

    qb.andWhere(
      'session.staffUserId = :staffUserId',
      {
        staffUserId,
      },
    );
  }

  if (query.status) {
    const status = String(query.status).trim();

    if (
      !Object.values(
        StaffLocationTrackingStatus,
      ).includes(
        status as StaffLocationTrackingStatus,
      )
    ) {
      throw new BadRequestException(
        'Invalid tracking status',
      );
    }

    qb.andWhere('session.status = :status', {
      status,
    });
  }

  qb.orderBy(
    'session.lastLocationAt',
    'DESC',
    'NULLS LAST',
  )
    .addOrderBy(
      'session.lastHeartbeatAt',
      'DESC',
      'NULLS LAST',
    )
    .addOrderBy('session.createdAt', 'DESC')
    .skip(skip)
    .take(limit);

  const [data, total] =
    await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages:
      total === 0
        ? 0
        : Math.ceil(total / limit),
  };
}

/**
 * Returns one tracking session with its latest events and route points.
 *
 * This is intended for the OWNER live-tracking detail screen.
 */
async getTrackingSessionDetails(
  sessionId: number,
) {
  if (!sessionId || sessionId < 1) {
    throw new BadRequestException(
      'Invalid tracking session',
    );
  }

  const session =
    await this.trackingSessionRepository.findOne({
      where: {
        id: sessionId,
        isHidden: false,
      },
    });

  if (!session) {
    throw new NotFoundException(
      'Staff location tracking session not found',
    );
  }

  const [latestEvents, latestPoints] =
    await Promise.all([
      this.locationEventRepository.find({
        where: {
          sessionId,
        },
        order: {
          occurredAt: 'DESC',
        },
        take: 25,
      }),

      this.locationPointRepository.find({
        where: {
          sessionId,
        },
        order: {
          recordedAt: 'DESC',
        },
        take: 100,
      }),
    ]);

  return {
    session,

    latestEvents,

    /**
     * Return route points oldest-to-newest so the frontend can draw the line
     * in the correct direction.
     */
    latestPoints: latestPoints.reverse(),
  };
}

/**
 * Returns paginated events for one tracking session.
 */
async getTrackingEvents(
  sessionId: number,
  query: any = {},
) {
  if (!sessionId || sessionId < 1) {
    throw new BadRequestException(
      'Invalid tracking session',
    );
  }

  const sessionExists =
    await this.trackingSessionRepository.exist({
      where: {
        id: sessionId,
        isHidden: false,
      },
    });

  if (!sessionExists) {
    throw new NotFoundException(
      'Staff location tracking session not found',
    );
  }

  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 50, 1),
    200,
  );

  const skip = (page - 1) * limit;

  const qb =
    this.locationEventRepository
      .createQueryBuilder('event')
      .where('event.sessionId = :sessionId', {
        sessionId,
      });

  if (query.eventType) {
    const eventType = String(
      query.eventType,
    ).trim();

    if (
      !Object.values(
        StaffLocationEventType,
      ).includes(
        eventType as StaffLocationEventType,
      )
    ) {
      throw new BadRequestException(
        'Invalid location event type',
      );
    }

    qb.andWhere(
      'event.eventType = :eventType',
      {
        eventType,
      },
    );
  }

  qb.orderBy('event.occurredAt', 'DESC')
    .skip(skip)
    .take(limit);

  const [data, total] =
    await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages:
      total === 0
        ? 0
        : Math.ceil(total / limit),
  };
}

/**
 * Returns route points for one session.
 *
 * Supported query values:
 * - from: ISO date
 * - to: ISO date
 * - limit: maximum points returned
 *
 * The hard maximum prevents an accidental unlimited route query.
 */
async getTrackingRoute(
  sessionId: number,
  query: any = {},
) {
  if (!sessionId || sessionId < 1) {
    throw new BadRequestException(
      'Invalid tracking session',
    );
  }

  const session =
    await this.trackingSessionRepository.findOne({
      where: {
        id: sessionId,
        isHidden: false,
      },
    });

  if (!session) {
    throw new NotFoundException(
      'Staff location tracking session not found',
    );
  }

  const limit = Math.min(
    Math.max(Number(query.limit) || 2000, 1),
    5000,
  );

  const qb =
    this.locationPointRepository
      .createQueryBuilder('point')
      .where('point.sessionId = :sessionId', {
        sessionId,
      });

  if (query.from) {
    const from = new Date(query.from);

    if (Number.isNaN(from.getTime())) {
      throw new BadRequestException(
        'Invalid route start date',
      );
    }

    qb.andWhere(
      'point.recordedAt >= :from',
      {
        from,
      },
    );
  }

  if (query.to) {
    const to = new Date(query.to);

    if (Number.isNaN(to.getTime())) {
      throw new BadRequestException(
        'Invalid route end date',
      );
    }

    qb.andWhere(
      'point.recordedAt <= :to',
      {
        to,
      },
    );
  }

  const points = await qb
    .orderBy('point.recordedAt', 'ASC')
    .addOrderBy('point.sequenceNumber', 'ASC')
    .take(limit)
    .getMany();

  return {
    sessionId: session.id,
    staffUserId: session.staffUserId,

    status: session.status,

    totalDistanceMetres: Math.round(
      Number(session.totalDistanceMetres || 0),
    ),

    lastLocationAt: session.lastLocationAt,

    returnedPoints: points.length,
    maximumPoints: limit,

    points,
  };
}

/**
 * Returns paginated tracking-session history for OWNER.
 *
 * Supported query values:
 * - page
 * - limit
 * - staffUserId
 * - status
 * - isActive
 * - from
 * - to
 */
async getTrackingHistory(query: any = {}) {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 50, 1),
    100,
  );

  const skip = (page - 1) * limit;

  const qb =
    this.trackingSessionRepository
      .createQueryBuilder('session')
      .where('session.isHidden = :isHidden', {
        isHidden: false,
      });

  if (
    query.isActive !== undefined &&
    query.isActive !== null &&
    query.isActive !== ''
  ) {
    let isActive: boolean;

    if (
      query.isActive === true ||
      query.isActive === 'true'
    ) {
      isActive = true;
    } else if (
      query.isActive === false ||
      query.isActive === 'false'
    ) {
      isActive = false;
    } else {
      throw new BadRequestException(
        'isActive must be true or false',
      );
    }

    qb.andWhere(
      'session.isActive = :isActive',
      {
        isActive,
      },
    );
  }

  if (query.staffUserId) {
    const staffUserId = Number(query.staffUserId);

    if (!Number.isInteger(staffUserId) || staffUserId < 1) {
      throw new BadRequestException(
        'Invalid staff user ID',
      );
    }

    qb.andWhere(
      'session.staffUserId = :staffUserId',
      {
        staffUserId,
      },
    );
  }

  if (query.status) {
    const status = String(query.status).trim();

    if (
      !Object.values(
        StaffLocationTrackingStatus,
      ).includes(
        status as StaffLocationTrackingStatus,
      )
    ) {
      throw new BadRequestException(
        'Invalid tracking status',
      );
    }

    qb.andWhere('session.status = :status', {
      status,
    });
  }

  if (query.from) {
    const from = new Date(query.from);

    if (Number.isNaN(from.getTime())) {
      throw new BadRequestException(
        'Invalid history start date',
      );
    }

    qb.andWhere(
      'session.requestedAt >= :from',
      {
        from,
      },
    );
  }

  if (query.to) {
    const to = new Date(query.to);

    if (Number.isNaN(to.getTime())) {
      throw new BadRequestException(
        'Invalid history end date',
      );
    }

    qb.andWhere(
      'session.requestedAt <= :to',
      {
        to,
      },
    );
  }

  qb.orderBy('session.requestedAt', 'DESC')
    .skip(skip)
    .take(limit);

  const [data, total] =
    await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages:
      total === 0
        ? 0
        : Math.ceil(total / limit),
  };
}

  /**
   * Returns a staff member's current active session.
   */
  async getActiveSessionForStaff(staffUserId: number) {
    return this.trackingSessionRepository.findOne({
      where: {
        staffUserId,
        isActive: true,
        isHidden: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Returns one active session or throws.
   */
  private async getOwnedActiveSession(
    sessionId: number,
    staffUserId: number,
  ) {
    const session = await this.trackingSessionRepository.findOne({
      where: {
        id: sessionId,
        staffUserId,
        isActive: true,
        isHidden: false,
      },
    });

    if (!session) {
      throw new NotFoundException(
        'Active location tracking session not found for this staff user',
      );
    }

    return session;
  }

  private resolveTrackingStatus(input: {
    permissionStatus: StaffLocationPermissionStatus;
    gpsStatus: StaffLocationGpsStatus;
    networkStatus: StaffLocationNetworkStatus;
    backgroundRestricted: boolean;
  }): StaffLocationTrackingStatus {
    if (
      input.permissionStatus ===
      StaffLocationPermissionStatus.DENIED
    ) {
      return StaffLocationTrackingStatus.PERMISSION_DENIED;
    }

    if (
      input.permissionStatus ===
      StaffLocationPermissionStatus.RESTRICTED
    ) {
      return StaffLocationTrackingStatus.PERMISSION_RESTRICTED;
    }

    if (
      input.gpsStatus === StaffLocationGpsStatus.DISABLED
    ) {
      return StaffLocationTrackingStatus.GPS_DISABLED;
    }

    if (
      input.networkStatus === StaffLocationNetworkStatus.OFFLINE
    ) {
      return StaffLocationTrackingStatus.DEVICE_OFFLINE;
    }

    if (input.backgroundRestricted) {
      return StaffLocationTrackingStatus.APP_BACKGROUND_RESTRICTED;
    }

    return StaffLocationTrackingStatus.LIVE;
  }

  private resolveFailureDetails(input: {
    permissionStatus: StaffLocationPermissionStatus;
    gpsStatus: StaffLocationGpsStatus;
    networkStatus: StaffLocationNetworkStatus;
    backgroundRestricted: boolean;
    suppliedFailureCode?: string;
    suppliedFailureMessage?: string;
  }): {
    code: string | null;
    message: string | null;
  } {
    if (
      input.permissionStatus ===
      StaffLocationPermissionStatus.DENIED
    ) {
      return {
        code: input.suppliedFailureCode || 'LOCATION_PERMISSION_DENIED',
        message:
          input.suppliedFailureMessage ||
          'Location permission has been denied',
      };
    }

    if (
      input.permissionStatus ===
      StaffLocationPermissionStatus.RESTRICTED
    ) {
      return {
        code:
          input.suppliedFailureCode ||
          'LOCATION_PERMISSION_RESTRICTED',
        message:
          input.suppliedFailureMessage ||
          'Location permission is restricted on the device',
      };
    }

    if (
      input.gpsStatus === StaffLocationGpsStatus.DISABLED
    ) {
      return {
        code: input.suppliedFailureCode || 'GPS_DISABLED',
        message:
          input.suppliedFailureMessage ||
          'Device GPS/location service is switched off',
      };
    }

    if (
      input.networkStatus === StaffLocationNetworkStatus.OFFLINE
    ) {
      return {
        code: input.suppliedFailureCode || 'DEVICE_OFFLINE',
        message:
          input.suppliedFailureMessage ||
          'Device has no active internet connection',
      };
    }

    if (input.backgroundRestricted) {
      return {
        code:
          input.suppliedFailureCode ||
          'BACKGROUND_LOCATION_RESTRICTED',
        message:
          input.suppliedFailureMessage ||
          'Background location operation is restricted',
      };
    }

    if (
      input.suppliedFailureCode ||
      input.suppliedFailureMessage
    ) {
      return {
        code: input.suppliedFailureCode?.trim() || null,
        message: input.suppliedFailureMessage?.trim() || null,
      };
    }

    return {
      code: null,
      message: null,
    };
  }

  private resolvePermissionEventType(
    permissionStatus: StaffLocationPermissionStatus,
  ): StaffLocationEventType {
    if (
      permissionStatus ===
      StaffLocationPermissionStatus.GRANTED
    ) {
      return StaffLocationEventType.PERMISSION_GRANTED;
    }

    if (
      permissionStatus ===
      StaffLocationPermissionStatus.RESTRICTED
    ) {
      return StaffLocationEventType.PERMISSION_RESTRICTED;
    }

    return StaffLocationEventType.PERMISSION_DENIED;
  }

  private resolvePermissionMessage(
    permissionStatus: StaffLocationPermissionStatus,
  ): string {
    switch (permissionStatus) {
      case StaffLocationPermissionStatus.GRANTED:
        return 'Location permission was granted';

      case StaffLocationPermissionStatus.LIMITED:
        return 'Only limited location permission is available';

      case StaffLocationPermissionStatus.RESTRICTED:
        return 'Location permission is restricted';

      case StaffLocationPermissionStatus.DENIED:
        return 'Location permission was denied';

      case StaffLocationPermissionStatus.PROMPT:
        return 'Location permission is waiting for staff response';

      default:
        return 'Location permission status is unknown';
    }
  }

  private resolveStartEventType(
    status: StaffLocationTrackingStatus,
  ): StaffLocationEventType {
    if (status === StaffLocationTrackingStatus.LIVE) {
      return StaffLocationEventType.TRACKING_STARTED;
    }

    return this.resolveStatusEventType(status);
  }

  private resolveStatusEventType(
    status: StaffLocationTrackingStatus,
  ): StaffLocationEventType {
    switch (status) {
      case StaffLocationTrackingStatus.GPS_DISABLED:
        return StaffLocationEventType.GPS_DISABLED;

      case StaffLocationTrackingStatus.PERMISSION_DENIED:
        return StaffLocationEventType.PERMISSION_DENIED;

      case StaffLocationTrackingStatus.PERMISSION_RESTRICTED:
        return StaffLocationEventType.PERMISSION_RESTRICTED;

      case StaffLocationTrackingStatus.DEVICE_OFFLINE:
        return StaffLocationEventType.DEVICE_OFFLINE;

      case StaffLocationTrackingStatus.APP_BACKGROUND_RESTRICTED:
        return StaffLocationEventType.BACKGROUND_RESTRICTED;

      case StaffLocationTrackingStatus.DELAYED:
        return StaffLocationEventType.LOCATION_DELAYED;

      case StaffLocationTrackingStatus.LIVE:
        return StaffLocationEventType.LOCATION_RESTORED;

      case StaffLocationTrackingStatus.APP_STOPPED:
        return StaffLocationEventType.APP_STOPPED;

      case StaffLocationTrackingStatus.SESSION_EXPIRED:
        return StaffLocationEventType.TRACKING_EXPIRED;

      default:
        return StaffLocationEventType.SYSTEM_ACTION;
    }
  }

  private resolveStatusMessage(
    status: StaffLocationTrackingStatus,
  ): string {
    switch (status) {
      case StaffLocationTrackingStatus.REQUEST_PENDING:
        return 'Waiting for staff to open the tracking request';

      case StaffLocationTrackingStatus.STARTING:
        return 'Location tracking is starting';

      case StaffLocationTrackingStatus.LIVE:
        return 'Live location tracking is active';

      case StaffLocationTrackingStatus.DELAYED:
        return 'Location updates are delayed';

      case StaffLocationTrackingStatus.GPS_DISABLED:
        return 'Device GPS/location service is switched off';

      case StaffLocationTrackingStatus.PERMISSION_DENIED:
        return 'Location permission has been denied';

      case StaffLocationTrackingStatus.PERMISSION_RESTRICTED:
        return 'Location permission is restricted';

      case StaffLocationTrackingStatus.DEVICE_OFFLINE:
        return 'Device is offline';

      case StaffLocationTrackingStatus.APP_BACKGROUND_RESTRICTED:
        return 'Background location operation is restricted';

      case StaffLocationTrackingStatus.APP_STOPPED:
        return 'The tracking application has stopped';

      case StaffLocationTrackingStatus.STOPPED_BY_OWNER:
        return 'Tracking was stopped by OWNER';

      case StaffLocationTrackingStatus.STOPPED_BY_STAFF:
        return 'Tracking was stopped by staff';

      case StaffLocationTrackingStatus.SESSION_EXPIRED:
        return 'Tracking session expired';

      case StaffLocationTrackingStatus.COMPLETED:
        return 'Tracking session completed';

      default:
        return 'Location tracking status changed';
    }
  }

  private resolveStoppedStatus(
    reason: StaffLocationStopReason,
  ): StaffLocationTrackingStatus {
    switch (reason) {
      case StaffLocationStopReason.OWNER_STOPPED:
        return StaffLocationTrackingStatus.STOPPED_BY_OWNER;

      case StaffLocationStopReason.STAFF_STOPPED:
        return StaffLocationTrackingStatus.STOPPED_BY_STAFF;

      case StaffLocationStopReason.SESSION_EXPIRED:
        return StaffLocationTrackingStatus.SESSION_EXPIRED;

      case StaffLocationStopReason.APP_STOPPED:
        return StaffLocationTrackingStatus.APP_STOPPED;

      case StaffLocationStopReason.GPS_DISABLED:
        return StaffLocationTrackingStatus.GPS_DISABLED;

      case StaffLocationStopReason.PERMISSION_REMOVED:
        return StaffLocationTrackingStatus.PERMISSION_DENIED;

      case StaffLocationStopReason.DEVICE_OFFLINE:
        return StaffLocationTrackingStatus.DEVICE_OFFLINE;

      case StaffLocationStopReason.COMPLETED:
      case StaffLocationStopReason.SYSTEM_STOPPED:
      default:
        return StaffLocationTrackingStatus.COMPLETED;
    }
  }

  private resolveStopMessage(
    reason: StaffLocationStopReason,
  ): string {
    switch (reason) {
      case StaffLocationStopReason.OWNER_STOPPED:
        return 'Live location tracking stopped by OWNER';

      case StaffLocationStopReason.STAFF_STOPPED:
        return 'Live location tracking stopped by staff';

      case StaffLocationStopReason.PERMISSION_REMOVED:
        return 'Tracking stopped because location permission was removed';

      case StaffLocationStopReason.GPS_DISABLED:
        return 'Tracking stopped because GPS was disabled';

      case StaffLocationStopReason.DEVICE_OFFLINE:
        return 'Tracking stopped because the device became unavailable';

      case StaffLocationStopReason.APP_STOPPED:
        return 'Tracking stopped because the application stopped';

      case StaffLocationStopReason.SESSION_EXPIRED:
        return 'Tracking session expired';

      case StaffLocationStopReason.SYSTEM_STOPPED:
        return 'Tracking session stopped automatically by the system';

      case StaffLocationStopReason.COMPLETED:
      default:
        return 'Tracking session completed';
    }
  }

    /**
   * Calculates straight-line distance between two GPS coordinates.
   *
   * Uses the Haversine formula and returns metres.
   */
  private calculateDistanceMetres(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number,
  ): number {
    const earthRadiusMetres = 6371000;

    const toRadians = (degrees: number) =>
      (degrees * Math.PI) / 180;

    const latitudeDifference = toRadians(
      latitude2 - latitude1,
    );

    const longitudeDifference = toRadians(
      longitude2 - longitude1,
    );

    const firstLatitudeRadians =
      toRadians(latitude1);

    const secondLatitudeRadians =
      toRadians(latitude2);

    const haversineValue =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(firstLatitudeRadians) *
        Math.cos(secondLatitudeRadians) *
        Math.sin(longitudeDifference / 2) ** 2;

    const angularDistance =
      2 *
      Math.atan2(
        Math.sqrt(haversineValue),
        Math.sqrt(1 - haversineValue),
      );

    return earthRadiusMetres * angularDistance;
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = (
      error as QueryFailedError & {
        driverError?: {
          code?: string;
        };
      }
    ).driverError;

    return driverError?.code === '23505';
  }
}