
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('project_rework_payment')
@Index(['reworkId'])
@Index(['projectId'])
export class ProjectReworkPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  reworkId: number;

  @Column({ type: 'integer' })
  projectId: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
  })
  amount: number;

  @Column({ type: 'date' })
  paymentDate: string;

  @Column({ type: 'text', nullable: true })
  paymentMode: string | null;

  @Column({ type: 'text', nullable: true })
  transactionId: string | null;

  @Column({ type: 'text', nullable: true })
  proofUrl: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'integer', nullable: true })
  collectedBy: number | null;

  @Column({ type: 'text', nullable: true })
  collectedByName: string | null;

  @Column({ type: 'integer', nullable: true })
  createdBy: number | null;

  @Column({ type: 'text', nullable: true })
  createdByName: string | null;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
