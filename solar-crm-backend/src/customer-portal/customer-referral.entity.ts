import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CustomerReferralStatus {
  REFERRED = 'REFERRED',
  CONTACTED = 'CONTACTED',
  INTERESTED = 'INTERESTED',
  NOT_INTERESTED = 'NOT_INTERESTED',

  LEAD_CREATED = 'LEAD_CREATED',
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',
  MEETING_DONE = 'MEETING_DONE',

  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_COMPLETED = 'PROJECT_COMPLETED',

  REWARD_PAYABLE = 'REWARD_PAYABLE',
  REWARD_PAID = 'REWARD_PAID',

  REJECTED = 'REJECTED',
}

@Entity()
export class CustomerReferral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({ nullable: true })
  customerCode: string;

  @Column({ nullable: true })
  referrerName: string;

  @Column({ nullable: true })
  referrerPhone: string;

  @Column()
  referredName: string;

  @Column()
  referredPhone: string;

  @Column({ nullable: true })
  referredCity: string;

  @Column({ type: 'text', nullable: true })
  referredAddress: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
assignedTo: number;

@Column({ nullable: true })
assignedToName: string;

@Column({ nullable: true })
assignedToRole: string;

@Column({ type: 'timestamp', nullable: true })
assignedAt: Date;

  @Column({
    type: 'enum',
    enum: CustomerReferralStatus,
    default: CustomerReferralStatus.REFERRED,
  })
  status: CustomerReferralStatus;

  @Column({ nullable: true })
  linkedLeadId: number;

  @Column({ nullable: true })
  linkedMeetingId: number;

  @Column({ nullable: true })
  linkedProjectId: number;

  @Column({ nullable: true, default: 5000 })
  rewardAmount: number;

  @Column({ type: 'boolean', default: false })
  rewardPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  rewardPaidAt: Date;

  @Column({ nullable: true })
  rewardPaidBy: number;

  @Column({ nullable: true })
  rewardPaidByName: string;

  @Column({ type: 'boolean', default: false })
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