import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { StaffAttendanceLocationRule } from './staff-attendance-policy.entity';

@Entity()
@Index(['staffId', 'attendanceDate'], {
  unique: true,
})
export class StaffAttendanceOverride {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  staffId: number;

  @Column({ nullable: true })
  staffName: string;

  @Column({ type: 'date' })
  attendanceDate: string;

  @Column({
    type: 'enum',
    enum: StaffAttendanceLocationRule,
    nullable: true,
  })
  punchInRule: StaffAttendanceLocationRule | null;

  @Column({ nullable: true })
punchInLocationId: number | null;

  @Column({
    type: 'enum',
    enum: StaffAttendanceLocationRule,
    nullable: true,
  })
  punchOutRule: StaffAttendanceLocationRule | null;

  @Column({ nullable: true })
punchOutLocationId: number | null;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  updatedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}