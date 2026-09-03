import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ProjectInsuranceStatus {
  REQUESTED = 'REQUESTED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  RENEWAL_REQUESTED = 'RENEWAL_REQUESTED',
  RENEWED = 'RENEWED',
  CANCELLED = 'CANCELLED',
}

export enum ProjectInsuranceSource {
  CUSTOMER = 'CUSTOMER',
  DEALER = 'DEALER',
  STAFF = 'STAFF',
}

@Entity()
@Index(['projectId'])
@Index(['customerId'])
@Index(['expiryDate'])
@Index(['status'])

@Index(['source'])
@Index(['dealerId'])
@Index(['insuranceRequestId'])
export class ProjectInsurance {
  @PrimaryGeneratedColumn()
  id: number;

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
  enum: ProjectInsuranceSource,
  default:
    ProjectInsuranceSource.CUSTOMER,
})
source: ProjectInsuranceSource;

@Column({
  type: 'int',
  nullable: true,
})
insuranceRequestId?: number;

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

@Column({
  type: 'varchar',
  length: 200,
  nullable: true,
})
customerEmail?: string;

@Column({
  type: 'varchar',
  length: 30,
  nullable: true,
})
aadhaarLinkedMobile?: string;

@Column({
  type: 'text',
  nullable: true,
})
installationAddress?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerCode?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  customerName?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  customerPhone?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  branchName?: string;

  @Column({ type: 'int', nullable: true })
  insurancePlanId?: number;

  @Column({ type: 'int', nullable: true })
  previousInsuranceId?: number;

  @Column({ type: 'varchar', length: 200 })
  companyName: string;

  @Column({ type: 'varchar', length: 200 })
  policyName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  policyNumber?: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  policyCost: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  coverageAmount?: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  expiryDate: Date;

  @Column({
    type: 'enum',
    enum: ProjectInsuranceStatus,
    default: ProjectInsuranceStatus.ACTIVE,
  })
  status: ProjectInsuranceStatus;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'int', nullable: true })
  createdBy?: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  createdByName?: string;

  @Column({ type: 'int', nullable: true })
  updatedBy?: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  updatedByName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}