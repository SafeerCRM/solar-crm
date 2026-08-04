import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectVendorPaymentMode {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  UPI = 'UPI',
  CHEQUE = 'CHEQUE',
  NEFT = 'NEFT',
  RTGS = 'RTGS',
  IMPS = 'IMPS',
  OTHER = 'OTHER',
}

@Entity()
export class ProjectVendorPayment {
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
  vendorBillId: number;

  @Column({ nullable: true })
  billNumber: string;

  @Column({ nullable: true })
  purchaseOrderId: number;

  @Column({ nullable: true })
  purchaseOrderNumber: string;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ProjectVendorPaymentMode,
    default: ProjectVendorPaymentMode.BANK_TRANSFER,
  })
  paymentMode: ProjectVendorPaymentMode;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  bankName: string;

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