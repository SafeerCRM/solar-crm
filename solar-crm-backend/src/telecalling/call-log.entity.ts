import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lead } from '../leads/lead.entity';

export enum CallReviewStatus {
  PENDING = 'PENDING',
  POTENTIAL = 'POTENTIAL',
  CONVERTED = 'CONVERTED',
  REJECTED = 'REJECTED',
}

@Entity()
export class CallLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  leadId: number;

  @ManyToOne(() => Lead, (lead) => lead.callLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column({ nullable: true })
  telecallerId: number;

  @Column({ default: 'CONNECTED' })
  callStatus: string;

  @Column({ type: 'text', nullable: true })
  callNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  nextFollowUpDate: Date;

  @Column({ nullable: true })
  recordingUrl: string;

  @Column({
    type: 'enum',
    enum: CallReviewStatus,
    default: CallReviewStatus.PENDING,
  })
  reviewStatus: CallReviewStatus;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @CreateDateColumn()
  createdAt: Date;
}