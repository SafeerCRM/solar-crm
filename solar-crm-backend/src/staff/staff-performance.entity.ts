import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StaffPerformanceStatus {
  DRAFT = 'DRAFT',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity()
export class StaffPerformance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  staffId: number;

  @Column({ nullable: true })
  staffName: string;

  @Column({ nullable: true })
  employeeCode: string;

  @Column({ nullable: true })
  staffRole: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  branchName: string;

  @Column()
  performanceMonth: string; // YYYY-MM

  /*
 * Performance template used for
 * this evaluation.
 */
@Column({
  type: 'int',
  nullable: true,
})
templateId: number | null;

@Column({
  default: '',
})
templateName: string;

/*
 * Evaluation period.
 *
 * For the first version this will
 * normally represent the complete
 * performanceMonth.
 */
@Column({
  type: 'date',
  nullable: true,
})
periodStart: string | null;

@Column({
  type: 'date',
  nullable: true,
})
periodEnd: string | null;

/*
 * Final weighted performance score.
 *
 * Normally represented on a 0-100
 * scale.
 */
@Column({
  type: 'decimal',
  precision: 7,
  scale: 2,
  default: 0,
})
overallScore: number;

@Column({
  default: true,
})
mandatoryMetricsMet: boolean;

/*
 * Human-friendly evaluation result.
 *
 * Example:
 * EXCELLENT
 * GOOD
 * NEEDS_IMPROVEMENT
 *
 * We keep this as varchar so the
 * company can evolve rating bands
 * later without enum migrations.
 */
@Column({
  default: '',
})
performanceBand: string;

/*
 * Snapshot of the template used
 * when the evaluation was generated.
 *
 * Future template edits must not
 * change old evaluations.
 */
@Column({
  type: 'jsonb',
  nullable: true,
})
templateSnapshot: Record<
  string,
  any
> | null;

  @Column({ nullable: true })
  targetType: string; // CALLS, LEADS, ORDERS, PROJECTS, COLLECTION, CUSTOM

  @Column({ nullable: true })
  customTargetName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  targetValue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  achievedValue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  achievementPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  reviewRemarks: string;

  @Column({ type: 'text', nullable: true })
  managerRemarks: string;

  @Column({
  type: 'text',
  default: '',
})
employeeRemarks: string;

  @Column({ default: false })
  incentiveEligible: boolean;

  @Column({ default: false })
  salaryEligible: boolean;

  @Column({
    type: 'enum',
    enum: StaffPerformanceStatus,
    default: StaffPerformanceStatus.DRAFT,
  })
  status: StaffPerformanceStatus;

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
  approvedBy: number;

  @Column({ nullable: true })
  approvedByName: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({
  type: 'int',
  nullable: true,
})
reviewedBy: number | null;

@Column({
  default: '',
})
reviewedByName: string;

@Column({
  type: 'timestamp',
  nullable: true,
})
reviewedAt: Date | null;

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