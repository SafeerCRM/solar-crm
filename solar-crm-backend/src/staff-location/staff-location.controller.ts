import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

import { StaffLocationService } from './staff-location.service';

import { RequestStaffLocationDto } from './dto/request-staff-location.dto';
import { StartStaffLocationDto } from './dto/start-staff-location.dto';
import { StaffLocationHeartbeatDto } from './dto/staff-location-heartbeat.dto';
import { StaffLocationPointBatchDto } from './dto/staff-location-point.dto';
import { StopStaffLocationDto } from './dto/stop-staff-location.dto';

import {
  StaffLocationStopReason,
} from './staff-location.enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff-location')
export class StaffLocationController {
  constructor(
    private readonly staffLocationService: StaffLocationService,
  ) {}

  // ============================================================
  // OWNER ENDPOINTS
  // ============================================================

  /**
   * OWNER creates a live-location request for a staff member.
   */
  @Roles('OWNER')
  @Post('owner/request')
  requestTracking(
    @Body() dto: RequestStaffLocationDto,
    @CurrentUser() user: any,
  ) {
    return this.staffLocationService.requestTracking(
      dto,
      Number(user.id),
    );
  }

  /**
   * OWNER dashboard: all active tracking sessions.
   */
  @Roles('OWNER')
  @Get('owner/active')
  getOwnerActiveSessions(
    @Query() query: any,
  ) {
    return this.staffLocationService.getOwnerActiveSessions(
      query,
    );
  }

  /**
   * OWNER dashboard: complete details for one session.
   */
  @Roles('OWNER')
  @Get('owner/session/:sessionId')
  getTrackingSessionDetails(
    @Param('sessionId', ParseIntPipe)
    sessionId: number,
  ) {
    return this.staffLocationService.getTrackingSessionDetails(
      sessionId,
    );
  }

  /**
   * OWNER dashboard: paginated session event timeline.
   */
  @Roles('OWNER')
  @Get('owner/session/:sessionId/events')
  getTrackingEvents(
    @Param('sessionId', ParseIntPipe)
    sessionId: number,

    @Query() query: any,
  ) {
    return this.staffLocationService.getTrackingEvents(
      sessionId,
      query,
    );
  }

  /**
   * OWNER dashboard: GPS route points for map rendering.
   */
  @Roles('OWNER')
  @Get('owner/session/:sessionId/route')
  getTrackingRoute(
    @Param('sessionId', ParseIntPipe)
    sessionId: number,

    @Query() query: any,
  ) {
    return this.staffLocationService.getTrackingRoute(
      sessionId,
      query,
    );
  }

  /**
   * OWNER dashboard: historical and active sessions.
   */
  @Roles('OWNER')
  @Get('owner/history')
  getTrackingHistory(
    @Query() query: any,
  ) {
    return this.staffLocationService.getTrackingHistory(
      query,
    );
  }

  /**
   * OWNER stops any active tracking session.
   *
   * The stop reason is enforced by the backend instead of trusting the
   * request body.
   */
  @Roles('OWNER')
  @Post('owner/session/:sessionId/stop')
  stopTrackingByOwner(
    @Param('sessionId', ParseIntPipe)
    sessionId: number,

    @Body() dto: StopStaffLocationDto,

    @CurrentUser() user: any,
  ) {
    return this.staffLocationService.stopTracking(
      sessionId,
      Number(user.id),
      {
        ...dto,
        reason:
          StaffLocationStopReason.OWNER_STOPPED,
      },
    );
  }

  // ============================================================
  // AUTHENTICATED STAFF ENDPOINTS
  // ============================================================

  /**
   * Returns only the logged-in staff member's active request/session.
   *
   * No staff user ID is accepted from the request.
   */
  @Get('me/active')
  getMyActiveSession(
    @CurrentUser() user: any,
  ) {
    return this.staffLocationService.getActiveSessionForStaff(
      Number(user.id),
    );
  }

  /**
   * Marks that the logged-in staff member opened their tracking request.
   */
  @Post('me/session/:sessionId/open')
  markMyRequestOpened(
    @Param('sessionId', ParseIntPipe)
    sessionId: number,

    @CurrentUser() user: any,
  ) {
    return this.staffLocationService.markRequestOpened(
      sessionId,
      Number(user.id),
    );
  }

  /**
   * Accepts and starts tracking for the logged-in staff member.
   */
  @Post('me/session/:sessionId/start')
  startMyTracking(
    @Param('sessionId', ParseIntPipe)
    sessionId: number,

    @Body() dto: StartStaffLocationDto,

    @CurrentUser() user: any,
  ) {
    return this.staffLocationService.startTracking(
      sessionId,
      Number(user.id),
      dto,
    );
  }

  /**
   * Receives an APK/device heartbeat for the logged-in staff member.
   */
  @Post('me/session/:sessionId/heartbeat')
  processMyHeartbeat(
    @Param('sessionId', ParseIntPipe)
    sessionId: number,

    @Body() dto: StaffLocationHeartbeatDto,

    @CurrentUser() user: any,
  ) {
    return this.staffLocationService.processHeartbeat(
      sessionId,
      Number(user.id),
      dto,
    );
  }

  /**
   * Receives one live or offline-queued batch of GPS points.
   */
  @Post('me/session/:sessionId/points')
  saveMyLocationPoints(
    @Param('sessionId', ParseIntPipe)
    sessionId: number,

    @Body() dto: StaffLocationPointBatchDto,

    @CurrentUser() user: any,
  ) {
    return this.staffLocationService.saveLocationPointBatch(
      sessionId,
      Number(user.id),
      dto,
    );
  }

  /**
   * Allows staff to stop only their own active tracking session.
   */
  @Post('me/session/:sessionId/stop')
  async stopMyTracking(
    @Param('sessionId', ParseIntPipe)
    sessionId: number,

    @Body() dto: StopStaffLocationDto,

    @CurrentUser() user: any,
  ) {
    const staffUserId = Number(user.id);

    const ownActiveSession =
      await this.staffLocationService.getActiveSessionForStaff(
        staffUserId,
      );

    if (
      !ownActiveSession ||
      ownActiveSession.id !== sessionId
    ) {
      throw new NotFoundException(
        'Active location tracking session not found for this staff user',
      );
    }

    return this.staffLocationService.stopTracking(
      sessionId,
      staffUserId,
      {
        ...dto,
        reason:
          StaffLocationStopReason.STAFF_STOPPED,
      },
    );
  }
}