import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppSetting } from './app-setting.entity';

@Injectable()
export class AppSettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly appSettingRepository: Repository<AppSetting>,
  ) {}

  async getMaintenanceMode() {
    const setting = await this.appSettingRepository.findOne({
      where: { key: 'maintenance_mode' },
    });

    if (!setting) {
      throw new NotFoundException('Maintenance mode setting not found');
    }

    return setting.value;
  }

  async updateMaintenanceMode(data: {
    enabled: boolean;
    message?: string;
    estimatedCompletion?: string;
  }) {
    const setting = await this.appSettingRepository.findOne({
      where: { key: 'maintenance_mode' },
    });

    if (!setting) {
      throw new NotFoundException('Maintenance mode setting not found');
    }

    setting.value = {
      enabled: Boolean(data.enabled),
      message:
        data.message ||
        'CRM is under maintenance. Please try again later.',
      estimatedCompletion: data.estimatedCompletion || '',
    };

    setting.updatedAt = new Date();

    return this.appSettingRepository.save(setting);
  }

  async getScreenshotPolicy() {
  const setting = await this.appSettingRepository.findOne({
    where: { key: 'apk_screenshot_policy' },
  });

  if (!setting) {
    throw new NotFoundException('Screenshot policy setting not found');
  }

  return setting.value;
}

async updateScreenshotPolicy(data: {
  blockByDefault: boolean;
  allowedRoles?: string[];
  allowedUserIds?: number[];
}) {
  const setting = await this.appSettingRepository.findOne({
    where: { key: 'apk_screenshot_policy' },
  });

  if (!setting) {
    throw new NotFoundException('Screenshot policy setting not found');
  }

  setting.value = {
    blockByDefault: Boolean(data.blockByDefault),
    allowedRoles: Array.isArray(data.allowedRoles) ? data.allowedRoles : [],
    allowedUserIds: Array.isArray(data.allowedUserIds)
      ? data.allowedUserIds.map((id) => Number(id)).filter(Boolean)
      : [],
  };

  setting.updatedAt = new Date();

  return this.appSettingRepository.save(setting);
}

async verifyDeveloperPassword(password: string) {
  const setting = await this.appSettingRepository.findOne({
    where: { key: 'developer_access' },
  });

  if (!setting) {
    throw new NotFoundException('Developer access setting not found');
  }

  const savedPassword = setting.value?.password || '';

  return {
    allowed: Boolean(password && savedPassword && password === savedPassword),
  };
}
}