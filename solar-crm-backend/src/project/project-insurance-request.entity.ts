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

@Entity()
@Index(['projectId'])
@Index(['customerId'])
@Index(['status'])
export class ProjectInsuranceRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  projectId: number;

  @Column({ type: 'int' })
  customerId: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerCode?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  customerName?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  customerPhone?: string;

  @Column({ type: 'int', nullable: true })
  insurancePlanId?: number;

  @Column({ type: 'int', nullable: true })
  existingInsuranceId?: number;

  @Column({
    type: 'enum',
    enum: ProjectInsuranceRequestType,
    default: ProjectInsuranceRequestType.NEW,
  })
  requestType: ProjectInsuranceRequestType;

  @Column({
    type: 'enum',
    enum: ProjectInsuranceRequestStatus,
    default: ProjectInsuranceRequestStatus.PENDING,
  })
  status: ProjectInsuranceRequestStatus;

  @Column({ type: 'text', nullable: true })
  customerRemarks?: string;

  @Column({ type: 'text', nullable: true })
  adminRemarks?: string;

  @Column({ type: 'int', nullable: true })
  processedBy?: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  processedByName?: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ default: false })
  isHidden: boolean;

  @CreateDateColumn()
  requestedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}