import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectVendorBillStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class ProjectVendorBill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @Column()
  companyName: string;

  @Column()
  vendorId: number;

  @Column()
  vendorName: string;

  @Column({ nullable: true })
  purchaseOrderId: number;

  @Column({ nullable: true })
  purchaseOrderNumber: string;

  @Column({ nullable: true })
  projectId: number;

  @Column({ nullable: true })
  branchName: string;

  @Column()
  billNumber: string;

  @Column({ type: 'date' })
  billDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'float', default: 0 })
  taxableAmount: number;

  @Column({ type: 'float', default: 0 })
  gstAmount: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ type: 'float', default: 0 })
  paidAmount: number;

  @Column({ type: 'float', default: 0 })
  pendingAmount: number;

  @Column({
    type: 'enum',
    enum: ProjectVendorBillStatus,
    default: ProjectVendorBillStatus.UNPAID,
  })
  status: ProjectVendorBillStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ nullable: true })
  hiddenByName: string;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ type: 'timestamp', nullable: true })
  restoredAt: Date;

  @Column({ nullable: true })
  restoredBy: number;

  @Column({ nullable: true })
  restoredByName: string;

  @Column({ type: 'text', nullable: true })
  restoreReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}