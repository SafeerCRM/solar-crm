import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectExecutionReminderType {
  TODAY_WORK = 'TODAY_WORK',
  UPCOMING_DEADLINE = 'UPCOMING_DEADLINE',
  OVERDUE_INSPECTION = 'OVERDUE_INSPECTION',
}

export enum ProjectExecutionReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DISMISSED = 'DISMISSED',
}

@Entity('project_execution_reminders')
export class ProjectExecutionReminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  activityId: number;

  @Column({
    type: 'enum',
    enum: ProjectExecutionReminderType,
  })
  type: ProjectExecutionReminderType;

  @Column({
    type: 'enum',
    enum: ProjectExecutionReminderStatus,
    default: ProjectExecutionReminderStatus.PENDING,
  })
  status: ProjectExecutionReminderStatus;

  @Column({ type: 'date', nullable: true })
reminderDate: string;

  @Column({ type: 'timestamp', nullable: true })
sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
dismissedAt: Date;

  @Column({ type: 'text', nullable: true })
message: string;

  @Column({ type: 'int', nullable: true })
createdBy: number;

  @Column({ type: 'text', nullable: true })
createdByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}