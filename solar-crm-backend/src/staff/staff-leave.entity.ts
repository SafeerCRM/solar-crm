import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum StaffLeaveType {
  CASUAL = 'CASUAL',
  SICK = 'SICK',
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  EMERGENCY = 'EMERGENCY',
  COMP_OFF = 'COMP_OFF',
  OTHER = 'OTHER',
}

export enum StaffLeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class StaffLeave {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  staffId: number;

  @Column({ nullable: true })
  staffName: string;

  @Column({ nullable: true })
  employeeCode: string;

  @Column({
    type: 'enum',
    enum: StaffLeaveType,
    default: StaffLeaveType.CASUAL,
  })
  leaveType: StaffLeaveType;

  @Column({ type: 'date' })
  fromDate: string;

  @Column({ type: 'date' })
  toDate: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  totalDays: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  proofUrl: string;

  @Column({
    type: 'enum',
    enum: StaffLeaveStatus,
    default: StaffLeaveStatus.PENDING,
  })
  status: StaffLeaveStatus;

  @Column({ nullable: true })
  requestedBy: number;

  @Column({ nullable: true })
  requestedByName: string;

  @Column({ nullable: true })
  approvedBy: number;

  @Column({ nullable: true })
  approvedByName: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalRemarks: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @CreateDateColumn()
  createdAt: Date;
}