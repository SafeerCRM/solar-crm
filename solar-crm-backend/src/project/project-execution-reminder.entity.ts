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
  reminderDate: string | null;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  dismissedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ nullable: true })
  createdBy: number | null;

  @Column({ nullable: true })
  createdByName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}