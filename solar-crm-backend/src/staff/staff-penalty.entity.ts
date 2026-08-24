import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StaffPenaltyStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  APPLIED_TO_PAYROLL = 'APPLIED_TO_PAYROLL',
}

@Entity()
@Index(['staffId', 'payrollMonth'])
@Index(['status', 'payrollMonth'])
export class StaffPenalty {
  @PrimaryGeneratedColumn()
  id: number;

  /*
   * Employee against whom this penalty
   * has been raised.
   */
  @Column()
  staffId: number;

  @Column({ default: '' })
  staffName: string;

  @Column({ default: '' })
  employeeCode: string;

  @Column({ default: '' })
  staffRole: string;

  @Column({ default: '' })
  department: string;

  @Column({ default: '' })
  branchName: string;

  /*
   * Penalty Rule used when creating
   * this case.
   *
   * We also snapshot important rule
   * details below so old penalty cases
   * remain explainable even if the rule
   * is edited later.
   */
  @Column()
  penaltyRuleId: number;

  @Column({ default: '' })
  penaltyRuleName: string;

  @Column({ default: 'CUSTOM' })
  penaltyType: string;

  @Column({ default: 'MANUAL' })
  calculationType: string;

  /*
   * Snapshot of rule calculation values.
   */
  @Column('decimal', {
    precision: 14,
    scale: 2,
    default: 0,
  })
  ruleAmount: number;

  @Column('decimal', {
    precision: 10,
    scale: 4,
    default: 0,
  })
  percentageRate: number;

  /*
   * Used when the rule is percentage based.
   *
   * Example:
   * 2% penalty on ₹30,000 basic salary.
   */
  @Column('decimal', {
    precision: 14,
    scale: 2,
    default: 0,
  })
  calculationBaseAmount: number;

  /*
   * Amount initially calculated/proposed
   * by the system or HR.
   */
  @Column('decimal', {
    precision: 14,
    scale: 2,
    default: 0,
  })
  proposedAmount: number;

  /*
   * Final amount approved for deduction.
   *
   * This is the amount payroll will use.
   */
  @Column('decimal', {
    precision: 14,
    scale: 2,
    default: 0,
  })
  approvedAmount: number;

  /*
   * Date on which the actual incident
   * happened.
   */
  @Column({ type: 'date' })
  incidentDate: string;

  /*
   * Payroll month to which the deduction
   * belongs.
   *
   * Format: YYYY-MM
   */
  @Column({ length: 7 })
  payrollMonth: string;

  @Column({ type: 'text', default: '' })
  reason: string;

  /*
   * Optional supporting evidence.
   *
   * We can later attach attendance evidence,
   * screenshots, documents, etc.
   */
  @Column({ default: '' })
  evidenceUrl: string;

  @Column({ type: 'text', default: '' })
  evidenceRemarks: string;

  /*
   * Keep these flags copied from the rule
   * at the time the penalty is created.
   */
  @Column({ default: true })
  requiresApproval: boolean;

  @Column({ default: true })
  includeInPayroll: boolean;

  @Column({
    type: 'enum',
    enum: StaffPenaltyStatus,
    default: StaffPenaltyStatus.PENDING,
  })
  status: StaffPenaltyStatus;

  /*
   * Approval / rejection audit.
   */
  @Column({
  type: 'int',
  nullable: true,
})
reviewedBy: number | null;

  @Column({ default: '' })
  reviewedByName: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  reviewedAt: Date | null;

  @Column({ type: 'text', default: '' })
  reviewRemarks: string;

  /*
   * Payroll linkage.
   *
   * Once payroll consumes this penalty,
   * its payroll ID is stored here.
   */
  @Column({
  type: 'int',
  nullable: true,
})
payrollId: number | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  appliedToPayrollAt: Date | null;

  /*
   * Creation audit.
   */
  @Column({
  type: 'int',
  nullable: true,
})
createdBy: number | null;

  @Column({ default: '' })
  createdByName: string;

  /*
   * Soft hide / restore audit.
   */
  @Column({ default: false })
  isHidden: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  hiddenAt: Date | null;

  @Column({
  type: 'int',
  nullable: true,
})
hiddenBy: number | null;

  @Column({ default: '' })
  hiddenByName: string;

  @Column({ type: 'text', default: '' })
  hiddenReason: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  restoredAt: Date | null;

  @Column({
  type: 'int',
  nullable: true,
})
restoredBy: number | null;

  @Column({ default: '' })
  restoredByName: string;

  @Column({ type: 'text', default: '' })
  restoreReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}