import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectTradingMeetingStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  RESCHEDULED = 'RESCHEDULED',
  POSTPONED = 'POSTPONED',
  NO_RESPONSE = 'NO_RESPONSE',
  ORDER_EXPECTED = 'ORDER_EXPECTED',
  ORDER_RECEIVED = 'ORDER_RECEIVED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class ProjectTradingMeeting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  dealerId: number;

  @Column({ nullable: true })
  dealerName: string;

  @Column({ nullable: true })
  dealerPhone: string;

  @Column({ nullable: true })
  dealerGstNumber: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({
    type: 'enum',
    enum: ProjectTradingMeetingStatus,
    default: ProjectTradingMeetingStatus.SCHEDULED,
  })
  status: ProjectTradingMeetingStatus;

  @Column({ type: 'text', nullable: true })
  meetingNotes: string;

  @Column({ type: 'text', nullable: true })
  outcome: string;

  @Column({ type: 'text', nullable: true })
  nextAction: string;

  @Column({ type: 'timestamp', nullable: true })
  nextFollowUpDate: Date;

  @Column({ nullable: true })
  expectedMaterialName: string;

  @Column({ type: 'float', default: 0 })
  expectedQuantity: number;

  @Column({ type: 'float', default: 0 })
  expectedOrderValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsLongitude: number;

  @Column({ type: 'text', nullable: true })
  gpsAddress: string;

  @Column({ type: 'text', nullable: true })
  gpsPhotoUrl: string;

  @Column({ type: 'text', nullable: true })
  audioUrl: string;

  @Column({ nullable: true })
  assignedTo: number;

  @Column({ nullable: true })
  assignedToName: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  updatedByName: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ nullable: true })
  hiddenByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}