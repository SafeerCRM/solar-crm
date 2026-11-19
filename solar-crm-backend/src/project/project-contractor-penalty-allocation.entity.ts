import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('project_contractor_penalty_allocation')
@Unique(['settlementId', 'penaltyId'])
@Index(['penaltyId'])
export class ProjectContractorPenaltyAllocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  settlementId: number;

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
  allocatedAmount: string;

  @CreateDateColumn()
  createdAt: Date;
}