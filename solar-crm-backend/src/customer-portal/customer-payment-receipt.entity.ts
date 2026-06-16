import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CustomerPaymentReceiptStatus {
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

@Entity()
export class CustomerPaymentReceipt {
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

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ nullable: true })
  receiptFileName: string;

  @Column({ nullable: true, default: 0 })
  amount: number;

  @Column({ nullable: true })
  paymentMode: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'timestamp', nullable: true })
  paymentDate: Date;

  @Column({ type: 'text', nullable: true })
  customerRemarks: string;

  @Column({
    type: 'enum',
    enum: CustomerPaymentReceiptStatus,
    default: CustomerPaymentReceiptStatus.SUBMITTED,
  })
  status: CustomerPaymentReceiptStatus;

  @Column({ nullable: true })
  verifiedBy: number;

  @Column({ nullable: true })
  verifiedByName: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'text', nullable: true })
  verificationRemarks: string;

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