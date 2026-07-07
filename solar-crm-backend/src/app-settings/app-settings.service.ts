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
}