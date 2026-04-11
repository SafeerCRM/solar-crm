import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
  NO_SHOW = 'NO_SHOW',
  CONVERTED_TO_PROJECT = 'CONVERTED_TO_PROJECT',
}

export enum MeetingType {
  SITE_VISIT = 'SITE_VISIT',
  OFFICE_MEETING = 'OFFICE_MEETING',
  PHONE_DISCUSSION = 'PHONE_DISCUSSION',
  VIDEO_MEETING = 'VIDEO_MEETING',
}

export enum MeetingCategory {
  COMPANY_MEETING = 'COMPANY_MEETING',
  SELF_MEETING = 'SELF_MEETING',
}

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  meetingGroupId?: number;

  @Column()
  leadId: number;

  @Column({ nullable: true })
  followupId?: number;

  @Column()
  customerName: string;

  @Column()
  mobile: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({ nullable: true })
  assignedTo?: number;

  @Column({ type: 'text', nullable: true })
  assignedToName?: string;

  @Column({
    type: 'enum',
    enum: MeetingType,
    default: MeetingType.SITE_VISIT,
  })
  meetingType: MeetingType;

  @Column({
    type: 'enum',
    enum: MeetingCategory,
    default: MeetingCategory.COMPANY_MEETING,
  })
  meetingCategory: MeetingCategory;

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    default: MeetingStatus.SCHEDULED,
  })
  status: MeetingStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  outcome?: string;

  @Column({ type: 'text', nullable: true })
  nextAction?: string;

  @Column({ type: 'text', nullable: true })
  managerRemarks?: string;

  @Column({ type: 'text', nullable: true })
  siteObservation?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsLatitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsLongitude?: number;

  @Column({ type: 'text', nullable: true })
  gpsAddress?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  panelGivenToCustomerKw?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  inverterCapacityKw?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  structureKw?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  proposedSystemKw?: number;

  @Column({ nullable: true })
  meetingCount?: number;

  @Column({ default: false })
  convertToProject?: boolean;

  @Column({ nullable: true })
  createdBy?: number;

  @Column({ type: 'text', nullable: true })
  createdByName?: string;

  @Column({ nullable: true })
  updatedBy?: number;

  @Column({ type: 'text', nullable: true })
  updatedByName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}