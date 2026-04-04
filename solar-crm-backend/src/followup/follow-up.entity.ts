import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lead } from '../leads/lead.entity';

export enum FollowUpStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
}

export enum FollowUpType {
  GENERAL = 'GENERAL',
  CALL = 'CALL',
  CALLBACK = 'CALLBACK',
  PAYMENT = 'PAYMENT',
}

@Entity()
export class FollowUp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  leadId: number;

  @ManyToOne(() => Lead, (lead) => lead.followUps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column({ nullable: true })
  assignedTo: number;

  @Column({
    type: 'enum',
    enum: FollowUpType,
    default: FollowUpType.GENERAL,
  })
  followUpType: FollowUpType;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'timestamp' })
  followUpDate: Date;

  @Column({
    type: 'enum',
    enum: FollowUpStatus,
    default: FollowUpStatus.PENDING,
  })
  status: FollowUpStatus;

  @CreateDateColumn()
  createdAt: Date;
}