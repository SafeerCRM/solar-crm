import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum HrPolicyType {
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  SALARY = 'SALARY',
  INCENTIVE = 'INCENTIVE',
  PENALTY = 'PENALTY',
  HOLIDAY = 'HOLIDAY',
  GENERAL = 'GENERAL',
}

@Entity()
export class HrPolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: HrPolicyType,
    default: HrPolicyType.GENERAL,
  })
  policyType: HrPolicyType;

  @Column({ default: 'DEFAULT' })
policyKey: string;

@Column({
  type: 'jsonb',
  default: {},
})
policyData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 1 })
version: number;

@Column({ type: 'text', nullable: true })
changeRemarks: string;

  @Column({ default: true })
  isActive: boolean;

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

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}