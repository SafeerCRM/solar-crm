import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getOverview(query, user);
  }

  @Get('telecalling')
  getTelecalling(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getTelecalling(query, user);
  }

  @Get('projects')
  getProjects(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getProjects(query, user);
  }

  @Get('payments')
  getPayments(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getPayments(query, user);
  }

    @Get('leads')
  getLeads(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getLeads(query, user);
  }

  @Get('meetings')
  getMeetings(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getMeetings(query, user);
  }

  @Get('telecalling-assistant')
  getTelecallingAssistant(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getTelecallingAssistant(query, user);
  }

  @Get('conversions')
  getConversions(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getConversions(query, user);
  }

  @Get('activity-stream')
  getActivityStream(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getActivityStream(query, user);
  }

    @Get('users')
  getUsers(@Query() query: any, @CurrentUser() user: any) {
    return this.analyticsService.getUsers(query, user);
  }

    @Get('filter-options')
  getFilterOptions(@CurrentUser() user: any) {
    return this.analyticsService.getFilterOptions(user);
  }
}