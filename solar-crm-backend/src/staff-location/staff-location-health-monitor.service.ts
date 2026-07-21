import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

import { StaffLocationEvent } from './staff-location-event.entity';
import { StaffLocationTrackingSession } from './staff-location-tracking-session.entity';

import {
  StaffLocationEventType,
  StaffLocationTrackingStatus,
} from './staff-location.enums';

@Injectable()
export class StaffLocationHealthMonitorService {
  private readonly logger = new Logger(
    StaffLocationHealthMonitorService.name,
  );

  /**
   * Prevents the same application process from starting another monitoring
   * cycle before the previous cycle has finished.
   */
  private isRunning = false;

  /**
   * PostgreSQL advisory-lock key dedicated to this monitor.
   *
   * It prevents duplicate monitor work when more than one backend instance is
   * running.
   */
  private readonly advisoryLockKey = 9172601;

  private readonly delayedAfterMilliseconds =
    2 * 60 * 1000;

  private readonly offlineAfterMilliseconds =
    5 * 60 * 1000;

  private readonly appStoppedAfterMilliseconds =
    10 * 60 * 1000;

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Runs once every minute.
   *
   * The scheduler only changes a session when its calculated health status is
   * different from its current status. This prevents duplicate event logs.
   */
  @Interval(60 * 1000)
  async evaluateActiveTrackingSessions(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    let advisoryLockAcquired = false;

    try {
      advisoryLockAcquired =
        await this.tryAcquireAdvisoryLock();

      if (!advisoryLockAcquired) {
        return;
      }

      const now = new Date();

      const delayedCutoff = new Date(
        now.getTime() -
          this.delayedAfterMilliseconds,
      );

      const sessionRepository =
        this.dataSource.getRepository(
          StaffLocationTrackingSession,
        );

      /**
       * Only retrieve sessions that can possibly be stale.
       *
       * A maximum of 500 sessions is handled per cycle so a large installation
       * cannot create an unbounded minute-long job.
       */
      const staleCandidates =
        await sessionRepository
          .createQueryBuilder('session')
          .where('session.isActive = :isActive', {
            isActive: true,
          })
          .andWhere('session.isHidden = :isHidden', {
            isHidden: false,
          })
          .andWhere('session.startedAt IS NOT NULL')
          .andWhere(
            'session.lastHeartbeatAt IS NOT NULL',
          )
          .andWhere(
            'session.lastHeartbeatAt <= :delayedCutoff',
            {
              delayedCutoff,
            },
          )
          .orderBy(
            'session.lastHeartbeatAt',
            'ASC',
          )
          .limit(500)
          .getMany();

      for (const candidate of staleCandidates) {
        try {
          await this.evaluateSingleSession(
            candidate.id,
            now,
          );
        } catch (error) {
          this.logger.error(
            `Failed to evaluate staff location session ${candidate.id}`,
            error instanceof Error
              ? error.stack
              : String(error),
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Staff location health-monitor cycle failed',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    } finally {
      if (advisoryLockAcquired) {
        await this.releaseAdvisoryLock();
      }

      this.isRunning = false;
    }
  }

  /**
   * Re-reads and locks one session inside a transaction.
   *
   * This prevents the monitor from overwriting a heartbeat or location update
   * that arrives at the same moment.
   */
  private async evaluateSingleSession(
    sessionId: number,
    now: Date,
  ): Promise<void> {
    await this.dataSource.transaction(
      async (manager) => {
        const sessionRepository =
          manager.getRepository(
            StaffLocationTrackingSession,
          );

        const eventRepository =
          manager.getRepository(
            StaffLocationEvent,
          );

        const session =
          await sessionRepository.findOne({
            where: {
              id: sessionId,
              isActive: true,
              isHidden: false,
            },
            lock: {
              mode: 'pessimistic_write',
            },
          });

        if (
          !session ||
          !session.startedAt ||
          !session.lastHeartbeatAt
        ) {
          return;
        }

        const millisecondsWithoutHeartbeat =
          now.getTime() -
          session.lastHeartbeatAt.getTime();

        const target =
          this.resolveHealthStatus(
            millisecondsWithoutHeartbeat,
          );

        /**
         * The heartbeat may have recovered after the initial candidate query
         * but before this row was locked.
         */
        if (!target) {
          return;
        }

        if (session.status === target.status) {
          return;
        }

        const previousStatus = session.status;

        session.status = target.status;
        session.lastStatusChangeAt = now;

        session.currentFailureCode =
          target.failureCode;

        session.currentFailureMessage =
          target.failureMessage;

        const savedSession =
          await sessionRepository.save(session);

        const secondsWithoutHeartbeat =
          Math.floor(
            millisecondsWithoutHeartbeat / 1000,
          );

        await eventRepository.save(
          eventRepository.create({
            sessionId: savedSession.id,
            staffUserId: savedSession.staffUserId,

            /**
             * This was an automatic system action rather than an action by a
             * logged-in user.
             */
            actorUserId: null,

            eventType: target.eventType,

            previousStatus,
            newStatus: target.status,

            message: target.eventMessage,

            metadata: {
              inferredByHeartbeatTimeout: true,

              lastHeartbeatAt:
                session.lastHeartbeatAt.toISOString(),

              evaluatedAt: now.toISOString(),

              secondsWithoutHeartbeat,

              delayedThresholdSeconds:
                this.delayedAfterMilliseconds /
                1000,

              offlineThresholdSeconds:
                this.offlineAfterMilliseconds /
                1000,

              appStoppedThresholdSeconds:
                this.appStoppedAfterMilliseconds /
                1000,
            },

            occurredAt: now,
          }),
        );
      },
    );
  }

  private resolveHealthStatus(
    millisecondsWithoutHeartbeat: number,
  ): {
    status: StaffLocationTrackingStatus;
    eventType: StaffLocationEventType;
    failureCode: string;
    failureMessage: string;
    eventMessage: string;
  } | null {
    if (
      millisecondsWithoutHeartbeat >=
      this.appStoppedAfterMilliseconds
    ) {
      return {
        status:
          StaffLocationTrackingStatus.APP_STOPPED,

        eventType:
          StaffLocationEventType.APP_STOPPED,

        failureCode:
          'APP_HEARTBEAT_STOPPED',

        failureMessage:
          'No device heartbeat has been received for at least 10 minutes',

        eventMessage:
          'Tracking application appears to have stopped communicating',
      };
    }

    if (
      millisecondsWithoutHeartbeat >=
      this.offlineAfterMilliseconds
    ) {
      return {
        status:
          StaffLocationTrackingStatus.DEVICE_OFFLINE,

        eventType:
          StaffLocationEventType.DEVICE_OFFLINE,

        failureCode:
          'DEVICE_HEARTBEAT_TIMEOUT',

        failureMessage:
          'No device heartbeat has been received for at least 5 minutes',

        eventMessage:
          'Tracking device appears to be offline',
      };
    }

    if (
      millisecondsWithoutHeartbeat >=
      this.delayedAfterMilliseconds
    ) {
      return {
        status:
          StaffLocationTrackingStatus.DELAYED,

        eventType:
          StaffLocationEventType.LOCATION_DELAYED,

        failureCode:
          'HEARTBEAT_DELAYED',

        failureMessage:
          'No device heartbeat has been received for at least 2 minutes',

        eventMessage:
          'Live location communication is delayed',
      };
    }

    return null;
  }

  /**
   * Uses a PostgreSQL advisory lock so only one backend instance performs the
   * health-monitor work.
   */
  private async tryAcquireAdvisoryLock(): Promise<boolean> {
    const result: Array<{
      locked: boolean | string;
    }> = await this.dataSource.query(
      `
        SELECT pg_try_advisory_lock($1) AS "locked"
      `,
      [this.advisoryLockKey],
    );

    const value = result?.[0]?.locked;

    return value === true || value === 't';
  }

  private async releaseAdvisoryLock(): Promise<void> {
    try {
      await this.dataSource.query(
        `
          SELECT pg_advisory_unlock($1)
        `,
        [this.advisoryLockKey],
      );
    } catch (error) {
      this.logger.error(
        'Failed to release staff-location advisory lock',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }
}