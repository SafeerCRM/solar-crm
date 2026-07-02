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

  MARKET_PURCHASE = 'MARKET_PURCHASE',
  SITE_PURCHASE = 'SITE_PURCHASE',
  OFFICE_EXPENSE = 'OFFICE_EXPENSE',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  EQUIPMENT_PURCHASE = 'EQUIPMENT_PURCHASE',

  TRAVEL = 'TRAVEL',
  HOTEL = 'HOTEL',
  FOOD = 'FOOD',
  FUEL = 'FUEL',
  VEHICLE_EXPENSE = 'VEHICLE_EXPENSE',

  RENT = 'RENT',
  ELECTRICITY_BILL = 'ELECTRICITY_BILL',
  INTERNET_BILL = 'INTERNET_BILL',
  MOBILE_RECHARGE = 'MOBILE_RECHARGE',

  SALARY = 'SALARY',
  INCENTIVE = 'INCENTIVE',
  ADVANCE_SALARY = 'ADVANCE_SALARY',

  MARKETING = 'MARKETING',
  PRINTING = 'PRINTING',
  COURIER = 'COURIER',
  STATIONERY = 'STATIONERY',
  REPAIR_MAINTENANCE = 'REPAIR_MAINTENANCE',
  CUSTOMER_VISIT = 'CUSTOMER_VISIT',

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
  expenseNumber: string;

  @Column({ type: 'date', nullable: true })
  expenseDate: string;

  @Column({ type: 'text', nullable: true })
  expenseHead: string;

  @Column({ type: 'text', nullable: true })
expenseSubType: string;

  @Column({ type: 'float', default: 0 })
  taxableAmount: number;

  @Column({ type: 'float', default: 0 })
  gstAmount: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  vendorName: string;

  @Column({ type: 'text', nullable: true })
  vendorGstNumber: string;

  @Column({ type: 'text', nullable: true })
  billNumber: string;

  @Column({ type: 'date', nullable: true })
  billDate: string;

  @Column({ type: 'text', nullable: true })
  paymentMode: string;

  @Column({ type: 'text', nullable: true })
  paymentReference: string;

  @Column({ type: 'text', nullable: true })
  paidFrom: string;

  @Column({ type: 'text', nullable: true })
  paidTo: string;

  @Column({ nullable: true })
  dealerId: number;

  @Column({ type: 'text', nullable: true })
  dealerName: string;

  @Column({ nullable: true })
  staffId: number;

  @Column({ type: 'text', nullable: true })
  staffName: string;

  @Column({ type: 'text', nullable: true })
  expenseStatus: string;

  @Column({ default: false })
  recurringExpense: boolean;

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