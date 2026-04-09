import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CallLog } from '../telecalling/call-log.entity';
import { FollowUp } from '../followup/follow-up.entity';

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  INTERESTED = 'INTERESTED',
  SITE_VISIT = 'SITE_VISIT',
  QUOTATION = 'QUOTATION',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
}

@Entity()
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  alternatePhone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  source: string;

  @Column({
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  status: LeadStatus;

  @Column({ nullable: true })
  assignedTo: number;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @Column({ type: 'timestamp', nullable: true })
  nextFollowUpDate: Date;

  @Column({ type: 'int', nullable: true, default: 15 })
  potentialPercentage: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CallLog, (callLog) => callLog.lead)
  callLogs: CallLog[];

  @OneToMany(() => FollowUp, (followUp) => followUp.lead)
  followUps: FollowUp[];
}