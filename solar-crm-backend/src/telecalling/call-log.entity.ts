import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lead } from '../leads/lead.entity';
import { TelecallingContact } from './telecalling-contact.entity';

export enum CallReviewStatus {
  PENDING = 'PENDING',
  POTENTIAL = 'POTENTIAL',
  CONVERTED = 'CONVERTED',
  REJECTED = 'REJECTED',
}

export enum CallDirection {
  OUTBOUND = 'OUTBOUND',
  INBOUND = 'INBOUND',
}

export enum CallProvider {
  MANUAL = 'MANUAL',
  TEL_LINK = 'TEL_LINK',
  EXOTEL = 'EXOTEL',
  TWILIO = 'TWILIO',
  KNOWLARITY = 'KNOWLARITY',
  OTHER = 'OTHER',
}

@Entity()
export class CallLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  leadId?: number | null;

  @ManyToOne(() => Lead, (lead) => lead.callLogs, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'leadId' })
  lead?: Lead | null;

  @Column({ type: 'int', nullable: true })
  contactId?: number | null;

  @ManyToOne(() => TelecallingContact, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'contactId' })
  contact?: TelecallingContact | null;

  @Column({ type: 'int', nullable: true })
  telecallerId?: number | null;

  @Column({ type: 'varchar', default: 'CONNECTED' })
  callStatus: string;

  @Column({ type: 'text', nullable: true })
  callNotes?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  nextFollowUpDate?: Date | null;

  @Column({ type: 'text', nullable: true })
  recordingUrl?: string | null;

  @Column({
    type: 'enum',
    enum: CallReviewStatus,
    default: CallReviewStatus.PENDING,
  })
  reviewStatus: CallReviewStatus;

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string | null;

  @Column({ type: 'int', nullable: true })
  reviewAssignedTo?: number | null;

  @Column({ type: 'varchar', nullable: true })
  reviewAssignedToName?: string | null;

  @Column({ type: 'varchar', nullable: true })
  leadPotential?: string | null;

  @Column({
    type: 'enum',
    enum: CallDirection,
    default: CallDirection.OUTBOUND,
  })
  callDirection: CallDirection;

  @Column({
    type: 'enum',
    enum: CallProvider,
    default: CallProvider.MANUAL,
  })
  providerName: CallProvider;

  @Column({ type: 'varchar', nullable: true })
  providerCallId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  callerNumber?: string | null;

  @Column({ type: 'varchar', nullable: true })
  receiverNumber?: string | null;

  @Column({ type: 'int', nullable: true })
  durationInSeconds?: number | null;

  @Column({ type: 'varchar', nullable: true })
  disposition?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  providerUpdatedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}