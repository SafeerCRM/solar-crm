import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IncentiveMetricType {
  ORDERS = 'ORDERS',
  LEADS = 'LEADS',
  QUALIFIED_LEADS = 'QUALIFIED_LEADS',
  MEETINGS = 'MEETINGS',
  PROJECTS = 'PROJECTS',
  INSTALLATIONS = 'INSTALLATIONS',
  PAYMENTS_COLLECTED = 'PAYMENTS_COLLECTED',
  COLLECTION_AMOUNT = 'COLLECTION_AMOUNT',
  FOLLOWUPS = 'FOLLOWUPS',
  CALLS = 'CALLS',
  WORKING_DAYS = 'WORKING_DAYS',
  ATTENDANCE_PERCENT = 'ATTENDANCE_PERCENT',
  CUSTOM = 'CUSTOM',
}

export enum IncentiveCalculationType {
  FLAT = 'FLAT',
  PER_UNIT = 'PER_UNIT',
  PERCENTAGE = 'PERCENTAGE',
  SLAB = 'SLAB',
  MANUAL = 'MANUAL',
}

@Entity()
export class IncentiveRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ruleName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  applicableRoles: string[];

  @Column({ type: 'simple-array', nullable: true })
  applicableStaffIds: string[];

  @Column({
    type: 'enum',
    enum: IncentiveMetricType,
    default: IncentiveMetricType.CUSTOM,
  })
  metricType: IncentiveMetricType;

  @Column({ nullable: true })
  customMetricName: string;

  @Column({
    type: 'enum',
    enum: IncentiveCalculationType,
    default: IncentiveCalculationType.MANUAL,
  })
  calculationType: IncentiveCalculationType;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  eligibilityTarget: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  rateAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  percentageRate: number;

  @Column({ type: 'jsonb', nullable: true })
  slabRules: any;

  @Column({ nullable: true })
  periodType: string; // MONTHLY, WEEKLY, DAILY, CUSTOM

  @Column({ default: true })
  requiresApproval: boolean;

  @Column({ default: true })
  includeInPayroll: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  updatedByName: string;

  @Column({ nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ type: 'text', nullable: true })
  hiddenByName: string;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ nullable: true })
  restoredAt: Date;

  @Column({ nullable: true })
  restoredBy: number;

  @Column({ type: 'text', nullable: true })
  restoredByName: string;

  @Column({ type: 'text', nullable: true })
  restoreReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}