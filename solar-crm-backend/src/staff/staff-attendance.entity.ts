import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum StaffAttendanceStatus {
  PRESENT = 'PRESENT',
  HALF_DAY = 'HALF_DAY',
  ABSENT = 'ABSENT',
  LEAVE = 'LEAVE',
  WEEKLY_OFF = 'WEEKLY_OFF',
  HOLIDAY = 'HOLIDAY',
}

@Entity()
export class StaffAttendance {
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

  @Column({ nullable: true })
  punchInTime: Date;

  @Column({ nullable: true })
  punchOutTime: Date;

  @Column({ nullable: true })
  punchInLatitude: string;

  @Column({ nullable: true })
  punchInLongitude: string;

  @Column({ type: 'text', nullable: true })
  punchInGpsAddress: string;

  @Column({ type: 'text', nullable: true })
  punchInPhotoUrl: string;

  @Column({ nullable: true })
  punchOutLatitude: string;

  @Column({ nullable: true })
  punchOutLongitude: string;

  @Column({ type: 'text', nullable: true })
  punchOutGpsAddress: string;

  @Column({ type: 'text', nullable: true })
  punchOutPhotoUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  workingHours: number;

  @Column({
    type: 'enum',
    enum: StaffAttendanceStatus,
    default: StaffAttendanceStatus.PRESENT,
  })
  status: StaffAttendanceStatus;

  @Column({ default: false })
  isLate: boolean;

  @Column({ default: false })
  isEarlyCheckout: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @CreateDateColumn()
  createdAt: Date;
}