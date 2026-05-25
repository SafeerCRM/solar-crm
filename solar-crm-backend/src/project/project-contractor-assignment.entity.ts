import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectContractorWorkStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
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

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate: Date;

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