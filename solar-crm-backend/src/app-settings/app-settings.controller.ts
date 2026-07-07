import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { AppSettingsService } from './app-settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('app-settings')
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Get('maintenance-mode')
  async getMaintenanceMode() {
    return this.appSettingsService.getMaintenanceMode();
  }

  @Patch('maintenance-mode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  async updateMaintenanceMode(
    @Body()
    body: {
      enabled: boolean;
      message?: string;
      estimatedCompletion?: string;
    },
  ) {
    return this.appSettingsService.updateMaintenanceMode(body);
  }
}