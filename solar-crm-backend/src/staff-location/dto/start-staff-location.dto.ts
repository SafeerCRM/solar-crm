import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  StaffLocationGpsStatus,
  StaffLocationNetworkStatus,
  StaffLocationPermissionStatus,
  StaffLocationPlatform,
} from '../staff-location.enums';

export class StartStaffLocationDto {
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
  @IsBoolean()
  requestAccepted?: boolean;
}