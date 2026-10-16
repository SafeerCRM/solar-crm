
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ProjectReworkStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('project_rework')
@Index(['projectId'])
export class ProjectRework {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  projectId: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ProjectReworkStatus,
    default: ProjectReworkStatus.PENDING,
  })
  status: ProjectReworkStatus;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  agreedAmount: number;

  @Column({ type: 'date', nullable: true })
  agreedDate: string | null;

  @Column({ type: 'date', nullable: true })
  completedDate: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'integer', nullable: true })
  createdBy: number | null;

  @Column({ type: 'text', nullable: true })
  createdByName: string | null;

  @Column({ type: 'integer', nullable: true })
  updatedBy: number | null;

  @Column({ type: 'text', nullable: true })
  updatedByName: string | null;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
