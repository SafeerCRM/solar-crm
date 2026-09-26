import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CustomerAfterSalesCheckoutStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('customer_after_sales_checkout')
@Index(
  'IDX_after_sales_checkout_customer',
  ['customerId'],
)
@Index(
  'IDX_after_sales_checkout_status',
  ['status'],
)
@Index(
  'IDX_after_sales_checkout_request',
  ['createdRequestId'],
)
export class CustomerAfterSalesCheckout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({ type: 'text', nullable: true })
  customerName: string;

  @Column({ type: 'text', nullable: true })
  customerPhone: string;

  @Column({ type: 'text', nullable: true })
  customerCode: string;

  @Column({ nullable: true })
  projectId: number;

  @Column({ type: 'text', nullable: true })
  projectName: string;

  @Column({ type: 'text', nullable: true })
  projectAddress: string;

  @Column({ type: 'text', nullable: true })
  branchName: string;

  @Column({
  type: 'integer',
  nullable: true,
})
projectOwnerId: number | null;

@Column({ type: 'text', nullable: true })
projectOwnerName: string | null;

  @Column()
  serviceId: number;

  @Column({ type: 'text' })
  serviceName: string;

  @Column({ type: 'text', nullable: true })
  serviceCategory: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  servicePrice: number;

  @Column({ type: 'timestamp', nullable: true })
preferredDate: Date | null;

  @Column({ type: 'text', nullable: true })
  customerRemarks: string;

  /*
   * Preserve the already-uploaded customer attachments while the
   * payment is in progress. The real After-Sales request is created
   * only after verified ICICI settlement.
   */
  @Column({ type: 'jsonb', nullable: true })
  customerAttachments: any[];

  @Column({
    type: 'enum',
    enum: CustomerAfterSalesCheckoutStatus,
    default: CustomerAfterSalesCheckoutStatus.PENDING,
  })
  status: CustomerAfterSalesCheckoutStatus;

  /*
   * Populated only after successful payment settlement creates
   * the actual CustomerAfterSalesRequest.
   */
  @Column({
  type: 'integer',
  nullable: true,
})
createdRequestId: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
gatewayOrderId: string | null;

  @Column({ type: 'timestamp', nullable: true })
paidAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}