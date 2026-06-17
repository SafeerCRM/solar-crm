import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FranchisePayoutRequestStatus {
  REQUESTED = 'REQUESTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
  ON_HOLD = 'ON_HOLD',
}

@Entity()
export class ProjectFranchisePayoutRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  franchiseUserId: number;

  @Column({ nullable: true })
  franchiseName: string;

  @Column({ nullable: true })
  franchisePhone: string;

  @Column({ nullable: true, default: 0 })
  requestedAmount: number;

  @Column({ type: 'text', nullable: true })
  requestNote: string;

  @Column({
    type: 'enum',
    enum: FranchisePayoutRequestStatus,
    default: FranchisePayoutRequestStatus.REQUESTED,
  })
  status: FranchisePayoutRequestStatus;

  @Column({ type: 'text', nullable: true })
  accountManagerNote: string;

  @Column({ nullable: true })
  reviewedBy: number;

  @Column({ nullable: true })
  reviewedByName: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  paidBy: number;

  @Column({ nullable: true })
  paidByName: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'text', nullable: true })
  paymentReference: string;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ nullable: true })
  hiddenByName: string;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}