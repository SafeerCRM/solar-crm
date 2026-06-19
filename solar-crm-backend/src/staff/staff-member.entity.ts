import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum StaffEmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

@Entity()
export class StaffMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  linkedUserId: number;

  @Column({ nullable: true })
  employeeCode: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  mobile: string;

  @Column({ nullable: true })
  alternateMobile: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  designation: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  reportingManagerId: number;

  @Column({ nullable: true })
  reportingManagerName: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({ type: 'date', nullable: true })
  joiningDate: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string;

  @Column({ default: true })
  birthdayReminderEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  birthdayRemarks: string;

  @Column({
    type: 'enum',
    enum: StaffEmploymentType,
    default: StaffEmploymentType.FULL_TIME,
  })
  employmentType: StaffEmploymentType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  visibleToCustomer: boolean;

  @Column({ default: false })
  visibleToDealer: boolean;

  @Column({ nullable: true })
  publicDisplayName: string;

  @Column({ nullable: true })
  publicPhone: string;

  @Column({ nullable: true })
  publicEmail: string;

  @Column({ type: 'text', nullable: true })
photoUrl: string;

  @Column({ nullable: true })
  publicDesignation: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

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
}