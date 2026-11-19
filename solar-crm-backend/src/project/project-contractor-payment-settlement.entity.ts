import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ContractorPaymentSettlementStatus {
  CONFIRMED = 'CONFIRMED',
  REVERSED = 'REVERSED',
}

@Entity('project_contractor_payment_settlement')
@Index(['contractorId', 'confirmedAt'])
export class ProjectContractorPaymentSettlement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', unique: true })
  expenseId: number;

  @Column({ type: 'integer' })
  assignmentId: number;

  @Column({ type: 'integer' })
  contractorId: number;

  @Column({ type: 'integer' })
  projectId: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  grossAmount: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  penaltyDeduction: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  netPaidAmount: string;

  @Column({
    type: 'text',
    default: ContractorPaymentSettlementStatus.CONFIRMED,
  })
  status: ContractorPaymentSettlementStatus;

  @Column({ type: 'text', nullable: true })
  paymentMode: string | null;

  @Column({ type: 'text', nullable: true })
  paymentReference: string | null;

  @Column({ type: 'text', nullable: true })
  proofUrl: string | null;

  @Column({ type: 'integer' })
  confirmedBy: number;

  @Column({ type: 'timestamp' })
  confirmedAt: Date;

  @Column({ type: 'integer', nullable: true })
  reversedBy: number | null;

  @Column({ type: 'timestamp', nullable: true })
  reversedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  reversalReason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}