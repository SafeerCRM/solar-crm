import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectContractorWorkScope {
  FULL_PROJECT = 'FULL_PROJECT',
  STRUCTURE_TEAM = 'STRUCTURE_TEAM',
  ELECTRICAL_TEAM = 'ELECTRICAL_TEAM',
  INSTALLATION_TEAM = 'INSTALLATION_TEAM',
  OTHER = 'OTHER',
}

export enum ProjectContractorWorkStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  PENDING_FINAL_PROOFS = 'PENDING_FINAL_PROOFS',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class ProjectContractorAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  contractorId: number;

  @Column({ type: 'text' })
  contractorName: string;

  @Column({ type: 'text', nullable: true })
  contractorPhone: string;

  @Column({
  type: 'enum',
  enum: ProjectContractorWorkScope,
  default: ProjectContractorWorkScope.FULL_PROJECT,
})
workScope: ProjectContractorWorkScope;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'timestamp', nullable: true })
startedAt: Date;

@Column({ type: 'timestamp', nullable: true })
completedAt: Date;

  @Column({ nullable: true, default: 0 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ProjectContractorWorkStatus,
    default: ProjectContractorWorkStatus.ASSIGNED,
  })
  status: ProjectContractorWorkStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  assignedBy: number;

  @Column({ type: 'text', nullable: true })
  assignedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}