import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum IciciPaymentLaunchPurpose {
  DEALER_ORDER =
    'DEALER_ORDER',

  DEALER_INSURANCE =
    'DEALER_INSURANCE',

  CUSTOMER_PAYMENT =
    'CUSTOMER_PAYMENT',
}

export enum IciciPaymentLaunchStatus {
  ISSUED =
    'ISSUED',

  CONSUMED =
    'CONSUMED',
}

@Entity(
  'icici_payment_launch',
)
@Index(
  'IDX_icici_payment_launch_nonce',
  ['nonce'],
  {
    unique: true,
  },
)
@Index(
  'IDX_icici_payment_launch_reference',
  [
    'purpose',
    'referenceId',
    'dealerId',
  ],
)
@Index(
  'IDX_icici_payment_launch_customer_reference',
  [
    'purpose',
    'referenceId',
    'customerId',
  ],
)
@Index(
  'IDX_icici_payment_launch_status_expiry',
  [
    'status',
    'expiresAt',
  ],
)
export class IciciPaymentLaunch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 32,
  })
  purpose:
    IciciPaymentLaunchPurpose;

  @Column({
    type: 'int',
  })
  referenceId: number;

  /*
 * Dealer Portal Dealer.id.
 *
 * This is authentication identity,
 * not ProjectVendor.id.
 *
 * Null for Customer Portal launches.
 */
@Column({
  type: 'int',
  nullable: true,
})
dealerId: number | null;

/*
 * Customer Portal Customer.id.
 *
 * Null for Dealer Portal launches.
 */
@Column({
  type: 'int',
  nullable: true,
})
customerId: number | null;

@Column({
  type: 'varchar',
  length: 32,
})
nonce: string;

  @Column({
    type: 'varchar',
    length: 16,
    default:
      IciciPaymentLaunchStatus.ISSUED,
  })
  status:
    IciciPaymentLaunchStatus;

  @Column({
    type: 'timestamptz',
  })
  expiresAt: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  consumedAt:
    Date | null;

  @CreateDateColumn()
  createdAt: Date;
}