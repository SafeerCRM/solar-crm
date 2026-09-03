import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectInsuranceRequestType {
  NEW = 'NEW',
  RENEWAL = 'RENEWAL',
}

export enum ProjectInsuranceRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ProjectInsuranceRequestSource {
  CUSTOMER = 'CUSTOMER',
  DEALER = 'DEALER',
  STAFF = 'STAFF',
}

export enum ProjectInsurancePaymentStatus {
  PENDING = 'PENDING',
  INITIATED = 'INITIATED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity()
@Index(['projectId'])
@Index(['customerId'])
@Index(['dealerId'])
@Index(['source'])
@Index(['status'])
@Index(['paymentStatus'])
export class ProjectInsuranceRequest {
  @PrimaryGeneratedColumn()
  id: number;

  /*
   * Existing CRM-customer insurance requests
   * continue to use projectId/customerId.
   *
   * Dealer-customer insurance requests do not
   * necessarily belong to an Aditya Solars project,
   * therefore these columns are now nullable.
   */
  @Column({
    type: 'int',
    nullable: true,
  })
  projectId?: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  customerId?: number;

  @Column({
    type: 'enum',
    enum: ProjectInsuranceRequestSource,
    default:
      ProjectInsuranceRequestSource.CUSTOMER,
  })
  source: ProjectInsuranceRequestSource;

  /*
   * Present when the request came from
   * the Dealer Portal.
   */
  @Column({
    type: 'int',
    nullable: true,
  })
  dealerId?: number;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  dealerName?: string;

  /*
   * Customer/application snapshot.
   *
   * Existing Customer Portal requests already
   * use these fields. Dealer requests also use
   * them for the dealer's end customer.
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  customerCode?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  customerName?: string;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  customerPhone?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  customerEmail?: string;

  /*
   * Client specifically requires the
   * Aadhaar-linked mobile number.
   *
   * It may be same as customerPhone,
   * but is intentionally stored separately.
   */
  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  aadhaarLinkedMobile?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  installationAddress?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  city?: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  insurancePlanId?: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  existingInsuranceId?: number;

  @Column({
    type: 'enum',
    enum: ProjectInsuranceRequestType,
    default:
      ProjectInsuranceRequestType.NEW,
  })
  requestType:
    ProjectInsuranceRequestType;

  @Column({
    type: 'enum',
    enum: ProjectInsuranceRequestStatus,
    default:
      ProjectInsuranceRequestStatus.PENDING,
  })
  status:
    ProjectInsuranceRequestStatus;

  /*
   * Snapshot of the price at the moment
   * the insurance application is created.
   *
   * Never recalculate this later using
   * the current plan price.
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  payableAmount: number;

  /*
   * Payment gateway preparation.
   *
   * These fields exist now so the dealer/customer
   * bank gateways can be integrated later without
   * another redesign.
   */
  @Column({
    type: 'enum',
    enum: ProjectInsurancePaymentStatus,
    default:
      ProjectInsurancePaymentStatus.PENDING,
  })
  paymentStatus:
    ProjectInsurancePaymentStatus;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  gatewayOrderId?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  gatewayPaymentId?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  gatewayTransactionId?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  paidAt?: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  customerRemarks?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  adminRemarks?: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  processedBy?: number;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  processedByName?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  processedAt?: Date;

  @Column({
    default: false,
  })
  isHidden: boolean;

  @CreateDateColumn()
  requestedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}