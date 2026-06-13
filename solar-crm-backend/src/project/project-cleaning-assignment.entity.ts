import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectCleaningStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

@Entity()
export class ProjectCleaningAssignment {
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

  @Column({ type: 'date', nullable: true })
  cleaningDate: string;

  @Column({ type: 'text', nullable: true })
  cleaningTime: string;

  @Column({
    type: 'enum',
    enum: ProjectCleaningStatus,
    default: ProjectCleaningStatus.ASSIGNED,
  })
  status: ProjectCleaningStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'text', nullable: true })
  completionRemarks: string;

  @Column({ type: 'text', nullable: true })
  proofUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  proofLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  proofLongitude: number;

  @Column({ type: 'text', nullable: true })
  proofGpsAddress: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  assignedBy: number;

  @Column({ type: 'text', nullable: true })
  assignedByName: string;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ type: 'text', nullable: true })
  hiddenByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}