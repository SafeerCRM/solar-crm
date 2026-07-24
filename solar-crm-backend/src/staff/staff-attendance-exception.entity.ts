import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StaffAttendanceExceptionPunchType {
  PUNCH_IN = 'PUNCH_IN',
  PUNCH_OUT = 'PUNCH_OUT',
}

export enum StaffAttendanceExceptionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity()
@Index(['staffId', 'attendanceDate', 'punchType'])
export class StaffAttendanceException {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  staffId: number;

  @Column({ nullable: true })
  staffName: string;

  @Column({ nullable: true })
  employeeCode: string;

  @Column({ type: 'date' })
  attendanceDate: string;

  @Column({
    type: 'enum',
    enum: StaffAttendanceExceptionPunchType,
  })
  punchType: StaffAttendanceExceptionPunchType;

  @Column()
  attemptedAt: Date;

  @Column({ nullable: true })
  latitude: string;

  @Column({ nullable: true })
  longitude: string;

  @Column({ type: 'text', nullable: true })
  gpsAddress: string;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  attendanceLocationId: number;

  @Column({ nullable: true })
  attendanceLocationName: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  distanceMeters: number;

  @Column({
    type: 'int',
    default: 0,
  })
  allowedRadiusMeters: number;

  @Column({ type: 'text' })
  employeeReason: string;

  @Column({
    type: 'enum',
    enum: StaffAttendanceExceptionStatus,
    default: StaffAttendanceExceptionStatus.PENDING,
  })
  status: StaffAttendanceExceptionStatus;

  @Column({ type: 'text', nullable: true })
  approvalRemarks: string;

  @Column({ nullable: true })
  reviewedBy: number;

  @Column({ nullable: true })
  reviewedByName: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  createdAttendanceId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}