import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IciciMerchantAccount {
  SOLARS = 'SOLARS',
  TRADING = 'TRADING',
}

export enum IciciPaymentPurpose {
  DEALER_INSURANCE = 'DEALER_INSURANCE',
  DEALER_ORDER = 'DEALER_ORDER',
  CUSTOMER_PAYMENT = 'CUSTOMER_PAYMENT',
}

export enum IciciPaymentTransactionStatus {
  CREATED = 'CREATED',
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

@Entity()
@Index(['merchantTxnNo'], {
  unique: true,
})
@Index(['purpose', 'referenceId'])
@Index(['dealerId'])
@Index(['status'])
@Index(['merchantAccount'])
export class IciciPaymentTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  /*
   * Which ICICI merchant account handled
   * this transaction.
   *
   * SOLARS and TRADING have separate
   * MIDs / Aggregator IDs / Live Keys.
   */
  @Column({
    type: 'enum',
    enum: IciciMerchantAccount,
  })
  merchantAccount: IciciMerchantAccount;

  /*
   * Business purpose of the payment.
   *
   * referenceId points to the corresponding
   * business record:
   *
   * DEALER_INSURANCE -> ProjectInsuranceRequest.id
   * DEALER_ORDER     -> ProjectDealerOrder.id
   */
  @Column({
    type: 'enum',
    enum: IciciPaymentPurpose,
  })
  purpose: IciciPaymentPurpose;

  @Column({
    type: 'int',
  })
  referenceId: number;

  /*
   * Dealer Portal owner of this payment.
   *
   * Nullable because the same gateway layer
   * can later support customer payments.
   */
  @Column({
    type: 'int',
    nullable: true,
  })
  dealerId?: number;

  /*
   * ICICI merchantTxnNo.
   *
   * Must be unique and <= 20 alphanumeric
   * characters for Orange PG.
   */
  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
  })
  merchantTxnNo: string;

  /*
   * Snapshot the exact amount sent to ICICI.
   * Never derive the paid amount later from
   * a mutable business record.
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount: number;

  @Column({
    type: 'varchar',
    length: 3,
    default: '356',
  })
  currencyCode: string;

  @Column({
    type: 'enum',
    enum: IciciPaymentTransactionStatus,
    default:
      IciciPaymentTransactionStatus.CREATED,
  })
  status: IciciPaymentTransactionStatus;

  /*
   * Snapshot the merchant identifiers used
   * for this attempt.
   *
   * These are identifiers, not secret keys.
   */
  @Column({
    type: 'varchar',
    length: 100,
  })
  merchantId: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  aggregatorId?: string;

  /*
   * Values returned by ICICI.
   */
  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  bankTxnId?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  paymentId?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  paymentMode?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  responseCode?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  responseDescription?: string;

  /*
   * ICICI Standard Mode initiation response.
   *
   * redirectURI + tranCtx are required to
   * send the browser/app into hosted payment.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  redirectUri?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  transactionContext?: string;

  /*
   * Useful timestamps for audit/reconciliation.
   */
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  initiatedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  paidAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  failedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  lastStatusCheckedAt?: Date;

  /*
   * Keep only non-sensitive gateway metadata.
   *
   * Never store Live Key, secureHash,
   * card data, CVV, OTP, etc. here.
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  gatewayMetadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}