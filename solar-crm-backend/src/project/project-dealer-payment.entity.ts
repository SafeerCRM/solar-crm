import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProjectDealerPaymentStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity()
export class ProjectDealerPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dealerOrderId: number;

  @Column()
  dealerId: number;

  @Column({ nullable: true })
  dealerName: string;

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ nullable: true })
  paymentMode: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'text', nullable: true })
  receiptUrl: string;

  @Column({
    type: 'enum',
    enum: ProjectDealerPaymentStatus,
    default: ProjectDealerPaymentStatus.SUBMITTED,
  })
  status: ProjectDealerPaymentStatus;

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

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}