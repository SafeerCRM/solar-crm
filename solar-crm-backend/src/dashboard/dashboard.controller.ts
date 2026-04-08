import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @Query('assignedTo') assignedTo?: string,
    @CurrentUser() user?: any,
  ) {
    if (user?.role === 'TELECALLER') {
      return this.dashboardService.getSummary(user.id, user.role);
    }

    if (user?.role === 'PROJECT_MANAGER') {
      return this.dashboardService.getSummary(undefined, user.role);
    }

    return this.dashboardService.getSummary(
      assignedTo ? Number(assignedTo) : undefined,
      user?.role,
    );
  }

  @Get('contacts-summary')
  getContactsSummary(
    @Query('city') city?: string,
    @CurrentUser() user?: any,
  ) {
    if (user?.role === 'TELECALLER') {
      return this.dashboardService.getContactsSummary(city, user.id, user.role);
    }

    return this.dashboardService.getContactsSummary(city, undefined, user?.role);
  }
}