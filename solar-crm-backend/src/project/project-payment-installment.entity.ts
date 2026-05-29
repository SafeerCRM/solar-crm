import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectPaymentInstallmentLabel {
  FIRST_PAYMENT = 'FIRST_PAYMENT',
  SECOND_PAYMENT = 'SECOND_PAYMENT',
  THIRD_PAYMENT = 'THIRD_PAYMENT',
  FOURTH_PAYMENT = 'FOURTH_PAYMENT',
  EXTRA_PAYMENT = 'EXTRA_PAYMENT',
}

export enum ProjectPaymentInstallmentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

@Entity('project_payment_installments')
export class ProjectPaymentInstallment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  projectId: number;

  @Column({
    type: 'enum',
    enum: ProjectPaymentInstallmentLabel,
  })
  label: ProjectPaymentInstallmentLabel;

  @Column({ type: 'numeric', default: 0 })
  amount: number;

  @Column({ type: 'numeric', default: 0 })
  paidAmount: number;

  @Column({ type: 'numeric', default: 0 })
  pendingAmount: number;

  @Column({ type: 'date', nullable: true })
  dueDate: string;

  @Column({ type: 'timestamp', nullable: true })
  paidDate: Date;

  @Column({
    type: 'enum',
    enum: ProjectPaymentInstallmentStatus,
    default: ProjectPaymentInstallmentStatus.PENDING,
  })
  status: ProjectPaymentInstallmentStatus;

  @Column({ type: 'text', nullable: true })
  paymentMode: string;

  @Column({ type: 'text', nullable: true })
  transactionId: string;

  @Column({ type: 'text', nullable: true })
  proofUrl: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'int', nullable: true })
  collectedBy: number;

  @Column({ type: 'text', nullable: true })
  collectedByName: string;

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @Column({ type: 'text', nullable: true })
  createdByName: string;

  @Column({ type: 'text', default: 'APPROVED' })
approvalStatus: string;

@Column({ type: 'int', nullable: true })
approvedBy: number;

@Column({ type: 'text', nullable: true })
approvedByName: string;

@Column({ type: 'timestamp', nullable: true })
approvedAt: Date;

@Column({ type: 'text', nullable: true })
approvalNote: string;

 @Column({ type: 'boolean', default: false })
isHidden: boolean;

@Column({ type: 'timestamp', nullable: true })
hiddenAt: Date;

@Column({ type: 'int', nullable: true })
hiddenBy: number;

@Column({ type: 'text', nullable: true })
hiddenByName: string;

@Column({ type: 'text', nullable: true })
hiddenReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}