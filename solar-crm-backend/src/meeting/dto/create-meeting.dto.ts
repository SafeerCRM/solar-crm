import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { MeetingStatus, MeetingType } from '../meeting.entity';

export class CreateMeetingDto {
  @IsNumber()
  leadId: number;

  @IsOptional()
  @IsNumber()
  followupId?: number;

  @IsString()
  customerName: string;

  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsNumber()
  assignedTo?: number;

  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  nextAction?: string;

  @IsOptional()
  @IsString()
  managerRemarks?: string;

  @IsOptional()
  @IsString()
  siteObservation?: string;

  @IsOptional()
  @IsNumber()
  gpsLatitude?: number;

  @IsOptional()
  @IsNumber()
  gpsLongitude?: number;

  @IsOptional()
  @IsString()
  gpsAddress?: string;

  @IsOptional()
  @IsNumber()
  createdBy?: number;

  @IsOptional()
  @IsNumber()
  updatedBy?: number;
}