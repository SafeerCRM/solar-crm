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
    @CurrentUser() user?: any,
  ) {
    const userRoles = this.getUserRoles(user);

    const ownOnlyRoles = [
      UserRole.TELECALLER,
      UserRole.LEAD_EXECUTIVE,
      UserRole.MEETING_MANAGER,
      UserRole.PROJECT_EXECUTIVE,
    ];

    if (this.hasAnyRole(userRoles, ownOnlyRoles)) {
      return this.dashboardService.getSummary(user.id, userRoles);
    }

    if (userRoles.includes(UserRole.PROJECT_MANAGER)) {
      return this.dashboardService.getSummary(undefined, userRoles);
    }

    return this.dashboardService.getSummary(
      assignedTo ? Number(assignedTo) : undefined,
      userRoles,
    );
  }

  @Get('contacts-summary')
  getContactsSummary(
    @Query('city') city?: string,
    @CurrentUser() user?: any,
  ) {
    const userRoles = this.getUserRoles(user);

    const ownOnlyRoles = [
      UserRole.TELECALLER,
      UserRole.LEAD_EXECUTIVE,
      UserRole.MEETING_MANAGER,
      UserRole.PROJECT_EXECUTIVE,
    ];

    if (this.hasAnyRole(userRoles, ownOnlyRoles)) {
      return this.dashboardService.getContactsSummary(city, user.id, userRoles);
    }

    return this.dashboardService.getContactsSummary(city, undefined, userRoles);
  }
}