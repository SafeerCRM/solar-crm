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

  @Column()
  policyKey: string;

  @Column({ type: 'text' })
  policyValue: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}