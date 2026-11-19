import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('project_contractor_sla_penalty_adjustment')
@Index(['penaltyId', 'createdAt'])
export class ProjectContractorSlaPenaltyAdjustment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  penaltyId: number;

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
  originalAmount: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  previousEffectiveAmount: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  newEffectiveAmount: string;

  @Column({ type: 'integer' })
  adjustedBy: number;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}