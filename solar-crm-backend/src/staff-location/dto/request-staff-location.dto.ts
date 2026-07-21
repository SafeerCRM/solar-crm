import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RequestStaffLocationDto {
  @IsInt()
  @Min(1)
  staffUserId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  requestRemark?: string;
}