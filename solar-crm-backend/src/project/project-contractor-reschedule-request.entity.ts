import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ContractorRescheduleAssignmentType {
  SITE_WORK = 'SITE_WORK',
  CLEANING = 'CLEANING',
}

export enum ContractorRescheduleStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity()
export class ProjectContractorRescheduleRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({
    type: 'enum',
    enum: ContractorRescheduleAssignmentType,
  })
  assignmentType: ContractorRescheduleAssignmentType;

  @Column()
  assignmentId: number;

  @Column()
  contractorId: number;

  @Column({ type: 'text', nullable: true })
  contractorName: string;

  @Column({ type: 'date', nullable: true })
  oldDate: string;

  @Column({ type: 'text', nullable: true })
  oldTime: string;

  @Column({ type: 'date' })
  requestedDate: string;

  @Column({ type: 'text', nullable: true })
  requestedTime: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: ContractorRescheduleStatus,
    default: ContractorRescheduleStatus.PENDING,
  })
  status: ContractorRescheduleStatus;

  @Column({ nullable: true })
  approvedBy: number;

  @Column({ type: 'text', nullable: true })
  approvedByName: string;

  @Column({ type: 'text', nullable: true })
  approvalNote: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}