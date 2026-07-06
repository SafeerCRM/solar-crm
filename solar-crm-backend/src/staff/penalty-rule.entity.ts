import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PenaltyCalculationType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
  WARNING_ONLY = 'WARNING_ONLY',
  MANUAL = 'MANUAL',
}

@Entity()
export class PenaltyRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ruleName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  applicableRoles: string[];

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({ default: 'CUSTOM' })
  penaltyType: string;

  @Column({
    type: 'enum',
    enum: PenaltyCalculationType,
    default: PenaltyCalculationType.MANUAL,
  })
  calculationType: PenaltyCalculationType;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  percentageRate: number;

  @Column({ default: true })
  requiresApproval: boolean;

  @Column({ default: true })
  includeInPayroll: boolean;

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