import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOwnerOverview(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getOwnerOverview(query, user);
  }

  @Get('department-report')
  getDepartmentReport(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getDepartmentReport(query, user);
  }

  @Get('users/search')
  searchUsers(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.searchUsers(query, user);
  }
}