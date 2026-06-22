import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('project_payment_receipts')
export class ProjectPaymentReceipt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  projectId: number;

  @Column({ type: 'int' })
  installmentId: number;

  @Column({ type: 'numeric', default: 0 })
  receivedAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  paymentDate: Date;

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