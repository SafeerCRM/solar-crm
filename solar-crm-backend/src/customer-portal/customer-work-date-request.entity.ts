import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WorkDateRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RESCHEDULED = 'RESCHEDULED',
}

@Entity()
export class CustomerWorkDateRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({ nullable: true })
  customerCode: string;

  @Column({ nullable: true })
  customerName: string;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  projectName: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({ type: 'timestamp', nullable: true })
  currentWorkDate: Date;

  @Column({ type: 'timestamp' })
  requestedWorkDate: Date;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: WorkDateRequestStatus,
    default: WorkDateRequestStatus.PENDING,
  })
  status: WorkDateRequestStatus;

  @Column({ nullable: true })
  approvedBy: number;

  @Column({ nullable: true })
  approvedByName: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalRemarks: string;

  @Column({ nullable: true })
  projectManagerId: number;

  @Column({ nullable: true })
  projectManagerName: string;

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