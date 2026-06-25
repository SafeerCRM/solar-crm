import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum CustomerPaymentReceiptActivityType {
  RECEIPT_UPLOADED = 'RECEIPT_UPLOADED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  INSTALLMENT_LINKED = 'INSTALLMENT_LINKED',
  PAYMENT_UPDATED = 'PAYMENT_UPDATED',
  PAYMENT_APPROVED = 'PAYMENT_APPROVED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
}

@Entity()
export class CustomerPaymentReceiptActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  receiptId: number;

  @Column({ nullable: true })
  customerId: number;

  @Column({ nullable: true })
  projectId: number;

  @Column({
    type: 'enum',
    enum: CustomerPaymentReceiptActivityType,
  })
  activityType: CustomerPaymentReceiptActivityType;

  @Column()
  activityTitle: string;

  @Column({ type: 'text', nullable: true })
  activityDescription: string;

  @Column({ nullable: true })
  performedBy: number;

  @Column({ nullable: true })
  performedByName: string;

  @Column({ nullable: true })
  performedByRole: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string;

  @Column({ type: 'text', nullable: true })
  newValue: string;

  @CreateDateColumn()
  createdAt: Date;
}