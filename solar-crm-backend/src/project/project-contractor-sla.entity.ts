
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum ContractorSlaWorkStatus {
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  STOPPED = 'STOPPED',
  REASSIGNED = 'REASSIGNED',
}

export enum ContractorSlaDelayStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('project_contractor_sla_batch')
@Index(['assignmentId'])
@Index(['projectId', 'contractorId'])
export class ProjectContractorSlaBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  assignmentId: number;

  @Column({ type: 'integer' })
  projectId: number;

  @Column({ type: 'integer' })
  contractorId: number;

  @Column({ type: 'timestamp' })
  assignedAt: Date;

  @Column({ type: 'integer', default: 24 })
  slaHours: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  penaltyPerDay: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  closeReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('project_contractor_sla_work')
@Unique(['batchId', 'workItem'])
@Index(['assignmentId', 'workItem'])
export class ProjectContractorSlaWork {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  batchId: number;

  @Column({ type: 'integer' })
  assignmentId: number;

  @Column({ type: 'integer' })
  projectId: number;

  @Column({ type: 'integer' })
  contractorId: number;

  @Column({ type: 'text' })
  workItem: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  requiredProofTypes: string[];

  @Column({ type: 'timestamp' })
  assignedAt: Date;

  @Column({ type: 'timestamp' })
  deadlineAt: Date;

  @Column({
    type: 'enum',
    enum: ContractorSlaWorkStatus,
    default: ContractorSlaWorkStatus.RUNNING,
  })
  status: ContractorSlaWorkStatus;

  @Column({ type: 'timestamp', nullable: true })
  pausedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  stoppedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  stopReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('project_contractor_sla_delay')
@Index(['workId', 'status'])
export class ProjectContractorSlaDelay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  workId: number;

  @Column({ type: 'integer' })
  batchId: number;

  @Column({ type: 'integer' })
  contractorId: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: ContractorSlaDelayStatus,
    default: ContractorSlaDelayStatus.PENDING,
  })
  status: ContractorSlaDelayStatus;

  @Column({ type: 'timestamp', nullable: true })
  requestedPauseFrom: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedPauseFrom: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  resumedAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  reviewedBy: number | null;

  @Column({ type: 'text', nullable: true })
  reviewedByName: string | null;

  @Column({ type: 'text', nullable: true })
  reviewNote: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  resumedBy: number | null;

  @Column({ type: 'text', nullable: true })
  resumeReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('project_contractor_sla_penalty')
@Unique(['batchId', 'penaltyDay'])
export class ProjectContractorSlaPenalty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  batchId: number;

  @Column({ type: 'integer' })
  assignmentId: number;

  @Column({ type: 'integer' })
  contractorId: number;

  @Column({ type: 'integer' })
  projectId: number;

  @Column({ type: 'integer' })
  penaltyDay: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'timestamp' })
  chargeableAt: Date;

  @Column({ type: 'boolean', default: false })
  isWaived: boolean;

  @Column({ type: 'integer', nullable: true })
  waivedBy: number | null;

  @Column({ type: 'text', nullable: true })
  waiverReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  waivedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('project_contractor_sla_setting')
export class ProjectContractorSlaSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', default: 24 })
  slaHours: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 500,
  })
  penaltyPerDay: string;

  @Column({ type: 'integer', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
