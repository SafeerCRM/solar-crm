import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectExecutionReminderUserStateStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  DISMISSED = 'DISMISSED',
}

@Entity('project_execution_reminder_user_states')
export class ProjectExecutionReminderUserState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  activityId: number;

  @Column({ type: 'int' })
  projectId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'text', nullable: true })
  userName: string;

  @Column({
    type: 'enum',
    enum: ProjectExecutionReminderUserStateStatus,
    default: ProjectExecutionReminderUserStateStatus.UNREAD,
  })
  status: ProjectExecutionReminderUserStateStatus;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  dismissedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}