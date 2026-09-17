import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { MeetingStatus, MeetingType } from '../meeting.entity';

export class UpdateMeetingDto {
  @IsOptional()
  @IsNumber()
  leadId?: number;

  @IsOptional()
  @IsNumber()
  followupId?: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

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
panelGivenToCustomerKw?: number;

@IsOptional()
@IsString()
panelOffered?: string;

@IsOptional()
@IsNumber()
inverterCapacityKw?: number;

@IsOptional()
@IsString()
inverterOffered?: string;

@IsOptional()
@IsNumber()
structureKw?: number;

@IsOptional()
@IsString()
structureOffered?: string;

@IsOptional()
@IsNumber()
proposedSystemKw?: number;

  @IsOptional()
  @IsNumber()
  createdBy?: number;

  @IsOptional()
  @IsNumber()
  updatedBy?: number;
}