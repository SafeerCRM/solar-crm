import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  StaffLocationStopReason,
} from '../staff-location.enums';

export class StopStaffLocationDto {
  /**
   * Optional because OWNER and staff controller endpoints enforce their own
   * trusted stop reason. It remains available for future internal/system use.
   */
  @IsOptional()
  @IsEnum(StaffLocationStopReason)
  reason?: StaffLocationStopReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}