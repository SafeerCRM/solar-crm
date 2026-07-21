import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  StaffLocationGpsStatus,
  StaffLocationNetworkStatus,
  StaffLocationPermissionStatus,
  StaffLocationPlatform,
} from '../staff-location.enums';

export class StaffLocationHeartbeatDto {
  @IsEnum(StaffLocationPlatform)
  platform: StaffLocationPlatform;

  @IsEnum(StaffLocationPermissionStatus)
  permissionStatus: StaffLocationPermissionStatus;

  @IsEnum(StaffLocationGpsStatus)
  gpsStatus: StaffLocationGpsStatus;

  @IsEnum(StaffLocationNetworkStatus)
  networkStatus: StaffLocationNetworkStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  operatingSystemVersion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryPercentage?: number;

  @IsOptional()
  @IsBoolean()
  isCharging?: boolean;

  @IsOptional()
  @IsBoolean()
  appInBackground?: boolean;

  @IsOptional()
  @IsBoolean()
  backgroundRestricted?: boolean;

  @IsOptional()
  @IsBoolean()
  isMockLocationDetected?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  failureCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureMessage?: string;

  @IsOptional()
  @IsNumber()
  pendingOfflinePoints?: number;
}