import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';

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

  @Get('screenshot-policy')
async getScreenshotPolicy() {
  return this.appSettingsService.getScreenshotPolicy();
}

@Patch('screenshot-policy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
async updateScreenshotPolicy(
  @Body()
  body: {
    blockByDefault: boolean;
    allowedRoles?: string[];
    allowedUserIds?: number[];
  },
) {
  return this.appSettingsService.updateScreenshotPolicy(body);
}

@Post('developer-login')
async developerLogin(
  @Body()
  body: {
    password: string;
  },
) {
  return this.appSettingsService.verifyDeveloperPassword(body.password);
}
}