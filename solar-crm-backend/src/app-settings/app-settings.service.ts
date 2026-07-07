import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppSetting } from './app-setting.entity';
import * as crypto from 'crypto';

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

private verifyPasswordHash(password: string, storedHash: string) {
  const parts = String(storedHash || '').split('$');

  if (parts.length !== 4) return false;

  const [algorithm, iterationsRaw, salt, hash] = parts;

  if (algorithm !== 'pbkdf2_sha512') return false;

  const iterations = Number(iterationsRaw);

  if (!iterations || !salt || !hash) return false;

  const computedHash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, 'sha512')
    .toString('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(computedHash, 'hex'),
  );
}

private createPasswordHash(password: string) {
  const algorithm = 'pbkdf2_sha512';
  const iterations = 120000;
  const salt = crypto.randomBytes(16).toString('hex');

  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, 'sha512')
    .toString('hex');

  return `${algorithm}$${iterations}$${salt}$${hash}`;
}

async verifyDeveloperPassword(password: string) {
  const setting = await this.appSettingRepository.findOne({
    where: { key: 'developer_access' },
  });

  if (!setting) {
    throw new NotFoundException('Developer access setting not found');
  }

  const savedPasswordHash = setting.value?.passwordHash || '';
  const legacyPassword = setting.value?.password || '';

  const allowed = savedPasswordHash
    ? this.verifyPasswordHash(password, savedPasswordHash)
    : Boolean(password && legacyPassword && password === legacyPassword);

  return { allowed };
}

async migrateDeveloperPasswordToHash(password: string) {
  const setting = await this.appSettingRepository.findOne({
    where: { key: 'developer_access' },
  });

  if (!setting) {
    throw new NotFoundException('Developer access setting not found');
  }

  const verification = await this.verifyDeveloperPassword(password);

  if (!verification.allowed) {
    return { migrated: false, message: 'Invalid developer password' };
  }

  setting.value = {
    passwordHash: this.createPasswordHash(password),
  };

  setting.updatedAt = new Date();

  await this.appSettingRepository.save(setting);

  return { migrated: true };
}
}