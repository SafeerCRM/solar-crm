import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectAccountExpenseType {
  PROJECT_FUND = 'PROJECT_FUND',
  CONTRACTOR_PAYMENT = 'CONTRACTOR_PAYMENT',
  LABOUR_PAYMENT = 'LABOUR_PAYMENT',
  TRANSPORTATION = 'TRANSPORTATION',

  TRAVEL = 'TRAVEL',
  FOOD = 'FOOD',
  FUEL = 'FUEL',
  MOBILE_RECHARGE = 'MOBILE_RECHARGE',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  SITE_PURCHASE = 'SITE_PURCHASE',
  REPAIR_MAINTENANCE = 'REPAIR_MAINTENANCE',
  CUSTOMER_VISIT = 'CUSTOMER_VISIT',

  SALARY = 'SALARY',
  INCENTIVE = 'INCENTIVE',
  ADVANCE_SALARY = 'ADVANCE_SALARY',
  OTHER = 'OTHER',
}

export enum ProjectAccountExpenseApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity()
export class ProjectAccountExpense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ProjectAccountExpenseType,
  })
  expenseType: ProjectAccountExpenseType;

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ type: 'text', nullable: true })
purpose: string;

@Column({ type: 'text', nullable: true })
proofUrl: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  projectId: number;

  @Column({ nullable: true })
  branchName: string;

  @Column({ nullable: true })
  projectOwnerId: number;

  @Column({ nullable: true })
  projectOwnerName: string;

  @Column({
    type: 'enum',
    enum: ProjectAccountExpenseApprovalStatus,
    default: ProjectAccountExpenseApprovalStatus.PENDING,
  })
  approvalStatus: ProjectAccountExpenseApprovalStatus;

  @Column({ nullable: true })
  approvedBy: number;

  @Column({ nullable: true })
  approvedByName: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalNote: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ nullable: true })
  hiddenByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}