import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export enum CallStatus {
  ANSWERED = 'answered',
  NOT_ANSWERED = 'not_answered',
  BUSY = 'busy',
  SWITCHED_OFF = 'switched_off',
  INTERESTED = 'interested',
  NOT_INTERESTED = 'not_interested',
  CALLBACK = 'callback',
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  INTERESTED = 'interested',
  QUALIFIED = 'qualified',
  NOT_INTERESTED = 'not_interested',
  CLOSED = 'closed',
}

export class CreateCallLogDto {
  @IsInt()
  leadId: number;

  @IsEnum(CallStatus)
  callStatus: CallStatus;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  nextLeadStatus?: LeadStatus;
}