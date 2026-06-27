import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EmployeePolicyCategory {
  HR = 'HR',
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  SALARY = 'SALARY',
  INCENTIVE = 'INCENTIVE',
  PENALTY = 'PENALTY',
  HOLIDAY = 'HOLIDAY',
  GENERAL = 'GENERAL',
}

@Entity()
export class EmployeePolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: EmployeePolicyCategory,
    default: EmployeePolicyCategory.GENERAL,
  })
  category: EmployeePolicyCategory;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({ default: true })
  visibleToEmployee: boolean;

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