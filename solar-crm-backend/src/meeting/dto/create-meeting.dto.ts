import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { MeetingCategory, MeetingStatus, MeetingType } from '../meeting.entity';

export class CreateMeetingDto {
  @IsOptional()
  @IsNumber()
  leadId?: number;

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
  @IsString()
  assignedToName?: string;

  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;

  @IsOptional()
  @IsEnum(MeetingCategory)
  meetingCategory?: MeetingCategory;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  reason?: string;

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
  @IsNumber()
  inverterCapacityKw?: number;

  @IsOptional()
  @IsNumber()
  structureKw?: number;

  @IsOptional()
  @IsNumber()
  proposedSystemKw?: number;

  @IsOptional()
  @IsNumber()
  meetingCount?: number;

  @IsOptional()
  createdBy?: number;

  @IsOptional()
  updatedBy?: number;

  @IsOptional()
@IsString()
solarMiterName?: string;

@IsOptional()
@IsString()
solarMiterPhone?: string;

@IsOptional()
@IsNumber()
solarMiterPayout?: number;

@IsOptional()
@IsString()
solarMiterAadharFrontUrl?: string;

@IsOptional()
@IsString()
solarMiterAadharBackUrl?: string;

@IsOptional()
@IsString()
solarMiterBankProofUrl?: string;
}