import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectExecutionActivityType {
  STRUCTURE_WORK = 'STRUCTURE_WORK',
  STRUCTURE_INSPECTION = 'STRUCTURE_INSPECTION',

  PILLAR_WORK = 'PILLAR_WORK',
  PILLAR_INSPECTION = 'PILLAR_INSPECTION',

  PANEL_INSTALLED = 'PANEL_INSTALLED',

  INVERTER_INSTALLED = 'INVERTER_INSTALLED',

  EARTHING_PACKING = 'EARTHING_PACKING',

  GENERATION_STARTED = 'GENERATION_STARTED',

  GENERATION_INSPECTION = 'GENERATION_INSPECTION',

  INVOICE_FILE_GIVEN = 'INVOICE_FILE_GIVEN',

  NON_DCR_PENDING = 'NON_DCR_PENDING',
}

export enum ProjectExecutionActivityStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class ProjectExecutionActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({
    type: 'enum',
    enum: ProjectExecutionActivityType,
  })
  activityType: ProjectExecutionActivityType;

  @Column({
    type: 'enum',
    enum: ProjectExecutionActivityStatus,
    default: ProjectExecutionActivityStatus.PENDING,
  })
  status: ProjectExecutionActivityStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  inspectionDeadline: Date;

  @Column({ default: false })
  proofRequired: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  assignedTo: number;

  @Column({ nullable: true })
  assignedToName: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  updatedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}