import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  private getUserRoles(user?: any): string[] {
    if (!user) return [];

    if (Array.isArray(user.roles)) {
      return user.roles;
    }

    if (user.role) {
      return [user.role];
    }

    return [];
  }

  private hasAnyRole(userRoles: string[], rolesToCheck: string[]): boolean {
    return rolesToCheck.some((role) => userRoles.includes(role));
  }

  @Get('summary')
  getSummary(
    @Query('assignedTo') assignedTo?: string,
    @Query('zone') zone?: string,
    @Query('city') city?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('month') month?: string,
    @CurrentUser() user?: any,
  ) {
    const userRoles = this.getUserRoles(user);

    const ownOnlyRoles = [
      UserRole.TELECALLER,
      UserRole.LEAD_EXECUTIVE,
      UserRole.MEETING_MANAGER,
      UserRole.PROJECT_EXECUTIVE,
    ];

    const effectiveAssignedTo = this.hasAnyRole(userRoles, ownOnlyRoles)
      ? user?.id
      : assignedTo
      ? Number(assignedTo)
      : undefined;

    return this.dashboardService.getSummary(
      {
        assignedTo: effectiveAssignedTo,
        zone,
        city,
        fromDate,
        toDate,
        month,
      },
      userRoles,
      user?.id,
    );
  }

    @Get('contacts-summary')
  getContactsSummary(
    @Query('city') city?: string,
    @Query('zone') zone?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('month') month?: string,
    @CurrentUser() user?: any,
  ) {
    const userRoles = this.getUserRoles(user);

    const ownOnlyRoles = [
      UserRole.TELECALLER,
      UserRole.LEAD_EXECUTIVE,
      UserRole.MEETING_MANAGER,
      UserRole.PROJECT_EXECUTIVE,
    ];

    const effectiveAssignedTo = this.hasAnyRole(userRoles, ownOnlyRoles)
      ? user?.id
      : assignedTo
      ? Number(assignedTo)
      : undefined;

    return this.dashboardService.getContactsSummary(
      {
        city,
        zone,
        assignedTo: effectiveAssignedTo,
        fromDate,
        toDate,
        month,
      },
      userRoles,
      user?.id,
    );
  }

    @Get('performance')
  getPerformance(
    @Query('assignedTo') assignedTo?: string,
    @Query('zone') zone?: string,
    @Query('city') city?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('month') month?: string,
    @CurrentUser() user?: any,
  ) {
    const userRoles = this.getUserRoles(user);

    const ownOnlyRoles = [
      UserRole.TELECALLER,
      UserRole.LEAD_EXECUTIVE,
      UserRole.MEETING_MANAGER,
      UserRole.PROJECT_EXECUTIVE,
    ];

    const effectiveAssignedTo = this.hasAnyRole(userRoles, ownOnlyRoles)
      ? user?.id
      : assignedTo
      ? Number(assignedTo)
      : undefined;

    return this.dashboardService.getPerformance(
      {
        assignedTo: effectiveAssignedTo,
        zone,
        city,
        fromDate,
        toDate,
        month,
      },
      userRoles,
      user?.id,
    );
  }

  @Get('owner-summary')
getOwnerSummary(@CurrentUser() user?: any) {
  const userRoles = this.getUserRoles(user);

  if (!userRoles.includes(UserRole.OWNER)) {
    return [];
  }

  return this.dashboardService.getOwnerSummary();
}

  @Get('meeting-manager-analytics')
getMeetingManagerAnalytics(@CurrentUser() user?: any) {
  const userRoles = this.getUserRoles(user);

  if (
    !userRoles.includes(UserRole.OWNER) &&
    !userRoles.includes(UserRole.MARKETING_HEAD) &&
    !userRoles.includes(UserRole.MEETING_MANAGER)
  ) {
    return [];
  }

  return this.dashboardService.getMeetingManagerAnalytics(
    userRoles,
    user?.id,
  );
}

@Get('lead-manager-analytics')
getLeadManagerAnalytics(@CurrentUser() user?: any) {
  const userRoles = this.getUserRoles(user);

  if (
  !userRoles.includes(UserRole.OWNER) &&
  !userRoles.includes(UserRole.MARKETING_HEAD)
) {
  return [];
}

  return this.dashboardService.getLeadManagerAnalytics();
}

@Get('telecalling-assistant-analytics')
getTelecallingAssistantAnalytics(@CurrentUser() user?: any) {
  const userRoles = this.getUserRoles(user);

  if (
    !userRoles.includes(UserRole.OWNER) &&
    !userRoles.includes(UserRole.TELECALLING_MANAGER)
  ) {
    return [];
  }

  return this.dashboardService.getTelecallingAssistantAnalytics();
}

  @Get('charts')
  getCharts(
    @Query('assignedTo') assignedTo?: string,
    @Query('zone') zone?: string,
    @Query('city') city?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('month') month?: string,
    @CurrentUser() user?: any,
  ) {
    const userRoles = this.getUserRoles(user);

    const ownOnlyRoles = [
      UserRole.TELECALLER,
      UserRole.LEAD_EXECUTIVE,
      UserRole.MEETING_MANAGER,
      UserRole.PROJECT_EXECUTIVE,
    ];

    const effectiveAssignedTo = this.hasAnyRole(userRoles, ownOnlyRoles)
      ? user?.id
      : assignedTo
      ? Number(assignedTo)
      : undefined;

    return this.dashboardService.getCharts(
      {
        assignedTo: effectiveAssignedTo,
        zone,
        city,
        fromDate,
        toDate,
        month,
      },
      userRoles,
      user?.id,
    );
  }
}