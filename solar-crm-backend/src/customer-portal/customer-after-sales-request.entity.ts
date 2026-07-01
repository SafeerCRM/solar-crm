import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CustomerAfterSalesRequestStatus {
  NEW = 'NEW',
  APPROVED = 'APPROVED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('customer_after_sales_request')
export class CustomerAfterSalesRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({ type: 'text', nullable: true })
  customerCode: string;

  @Column({ type: 'text', nullable: true })
  customerName: string;

  @Column({ type: 'text', nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  projectId: number;

  @Column({ type: 'text', nullable: true })
  projectName: string;

  @Column({ type: 'text', nullable: true })
  branchName: string;

  @Column({ nullable: true })
  projectOwnerId: number;

  @Column({ type: 'text', nullable: true })
  projectOwnerName: string;

  @Column()
  serviceId: number;

  @Column({ type: 'text' })
  serviceName: string;

  @Column({ type: 'text', nullable: true })
  serviceCategory: string;

  @Column({ type: 'numeric', default: 0 })
  servicePrice: number;

  @Column({ type: 'boolean', default: true })
  isPaidService: boolean;

  @Column({ type: 'timestamp', nullable: true })
  preferredDate: Date;

  @Column({ type: 'timestamp', nullable: true })
scheduledVisitAt: Date;

@Column({ type: 'text', nullable: true })
scheduledVisitTime: string;

  @Column({ type: 'text', nullable: true })
  customerRemarks: string;

  @Column({
    type: 'enum',
    enum: CustomerAfterSalesRequestStatus,
    default: CustomerAfterSalesRequestStatus.NEW,
  })
  status: CustomerAfterSalesRequestStatus;

  @Column({ nullable: true })
  assignedTo: number;

  @Column({ type: 'text', nullable: true })
  assignedToName: string;

  @Column({ type: 'text', nullable: true })
  adminRemarks: string;

  @Column({ type: 'text', nullable: true })
  completionRemarks: string;

  @Column({ nullable: true })
  completedBy: number;

  @Column({ type: 'text', nullable: true })
  completedByName: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ type: 'text', nullable: true })
  hiddenByName: string;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}