import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLACKLISTED = 'BLACKLISTED',
}

export enum CustomerSource {
  LEAD = 'LEAD',
  MEETING = 'MEETING',
  PROJECT = 'PROJECT',
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
  REFERRAL = 'REFERRAL',
}

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  customerCode: string;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  mobile: string;

  @Column({ nullable: true })
  alternateMobile: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  aadhaarNumber: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ nullable: true })
  electricityKNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ nullable: true })
branchId?: number;

  @Column({ nullable: true })
  branchName: string;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE,
  })
  customerStatus: CustomerStatus;

  @Column({
  type: 'enum',
  enum: CustomerSource,
  default: CustomerSource.MANUAL,
})
customerSource: CustomerSource;

  @Column({ type: 'boolean', default: false })
  isPortalEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ nullable: true })
  hiddenByName: string;

  @Column({ type: 'text', nullable: true })
  restoreReason: string;

  @Column({ type: 'timestamp', nullable: true })
  restoredAt: Date;

  @Column({ nullable: true })
  restoredBy: number;

  @Column({ nullable: true })
  restoredByName: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}