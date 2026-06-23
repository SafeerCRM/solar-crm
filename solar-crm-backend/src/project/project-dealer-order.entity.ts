import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectDealerOrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  PARTIALLY_ACCEPTED = 'PARTIALLY_ACCEPTED',
  POSTPONED = 'POSTPONED',
  STOCK_OUT = 'STOCK_OUT',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum ProjectDealerPaymentType {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
  ONLINE = 'ONLINE',
  CHEQUE = 'CHEQUE',
}

export enum ProjectDealerDeliveryMode {
  SELF_COLLECTION = 'SELF_COLLECTION',
  DELIVERY = 'DELIVERY',
}

@Entity()
export class ProjectDealerOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  orderNumber: string;

  @Column()
  dealerId: number;

  @Column({ nullable: true })
  dealerName: string;

  @Column({ nullable: true })
  dealerPhone: string;

  @Column({ nullable: true })
  dealerGstNumber: string;

  @Column({ type: 'text', nullable: true })
  dealerAddress: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({
    type: 'enum',
    enum: ProjectDealerOrderStatus,
    default: ProjectDealerOrderStatus.SUBMITTED,
  })
  status: ProjectDealerOrderStatus;

  @Column({
    type: 'enum',
    enum: ProjectDealerPaymentType,
    default: ProjectDealerPaymentType.CASH,
  })
  paymentType: ProjectDealerPaymentType;

    @Column({
    type: 'enum',
    enum: ProjectDealerDeliveryMode,
    default: ProjectDealerDeliveryMode.SELF_COLLECTION,
  })
  deliveryMode: ProjectDealerDeliveryMode;

  @Column({ type: 'text', nullable: true })
  deliveryAddress: string;

  @Column({ type: 'float', default: 0 })
  deliveryDistanceKm: number;

  @Column({ type: 'float', default: 0 })
  deliveryCharge: number;

  @Column({ type: 'float', default: 0 })
  subtotalAmount: number;

  @Column({ type: 'float', default: 0 })
  discountAmount: number;

  @Column({ type: 'float', default: 0 })
  gstAmount: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ type: 'float', default: 0 })
  paidAmount: number;

  @Column({ type: 'float', default: 0 })
  pendingAmount: number;

  @Column({ type: 'date', nullable: true })
  creditDueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expectedDeliveryAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  assignedStaffName: string;

  @Column({ nullable: true })
  assignedStaffPhone: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'text', nullable: true })
  adminRemarks: string;

  @Column({ default: false })
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

  @Column({ type: 'float', default: 0 })
deliveryLatitude: number;

@Column({ type: 'float', default: 0 })
deliveryLongitude: number;

@Column({ type: 'text', nullable: true })
deliveryGpsUrl: string;

@Column({ nullable: true })
deliveryLocationSource: string;

@Column({ type: 'float', default: 0 })
autoDeliveryDistanceKm: number;

@Column({ type: 'float', default: 0 })
autoDeliveryCharge: number;
}