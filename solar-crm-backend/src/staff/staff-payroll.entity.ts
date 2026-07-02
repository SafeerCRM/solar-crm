import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StaffPayrollStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class StaffPayroll {
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
  payrollMonth: string; // YYYY-MM

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  basicSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  presentDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  halfDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  absentDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  leaveDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  workingHours: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  attendanceDeduction: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  leaveDeduction: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  penaltyAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  incentiveAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherAllowance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherDeduction: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  grossSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  netSalary: number;

  @Column({ default: false })
  ownerOverrideApplied: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  ownerOverrideNetSalary: number;

  @Column({ type: 'text', nullable: true })
  ownerOverrideReason: string;

  @Column({
    type: 'enum',
    enum: StaffPayrollStatus,
    default: StaffPayrollStatus.DRAFT,
  })
  status: StaffPayrollStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  generatedBy: number;

  @Column({ nullable: true })
  generatedByName: string;

  @Column({ nullable: true })
  approvedBy: number;

  @Column({ nullable: true })
  approvedByName: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  paidBy: number;

  @Column({ nullable: true })
  paidByName: string;

  @Column({ type: 'text', nullable: true })
  paymentRemarks: string;

  @Column({ default: false })
  isHidden: boolean;

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