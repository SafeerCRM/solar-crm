import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CustomerCleaningCheckoutStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('customer_cleaning_checkout')
@Index(
  'IDX_cleaning_checkout_customer',
  ['customerId'],
)
@Index(
  'IDX_cleaning_checkout_status',
  ['status'],
)
@Index(
  'IDX_cleaning_checkout_reminder',
  ['createdReminderId'],
)
export class CustomerCleaningCheckout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({ type: 'text', nullable: true })
  customerCode: string;

  @Column({ type: 'text', nullable: true })
  customerName: string;

  @Column()
  projectId: number;

  @Column({ type: 'text', nullable: true })
  projectName: string;

  @Column({ type: 'date' })
  cleaningDate: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  serviceCharge: number;

  @Column({
    type: 'enum',
    enum: CustomerCleaningCheckoutStatus,
    default: CustomerCleaningCheckoutStatus.PENDING,
  })
  status: CustomerCleaningCheckoutStatus;

  @Column({
    type: 'integer',
    nullable: true,
  })
  createdReminderId: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  gatewayOrderId: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  paidAt: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}