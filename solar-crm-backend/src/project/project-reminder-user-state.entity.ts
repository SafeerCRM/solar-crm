import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ProjectReminderUserStateStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  DISMISSED = 'DISMISSED',
}

@Entity('project_reminder_user_states')
@Index(['userId', 'reminderSource', 'referenceId'], {
  unique: true,
})
export class ProjectReminderUserState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  userName: string;

  @Column()
  reminderSource: string;

  @Column()
  reminderType: string;

  @Column()
  referenceId: number;

  @Column({ nullable: true })
  projectId: number;

  @Column({
    type: 'enum',
    enum: ProjectReminderUserStateStatus,
    default: ProjectReminderUserStateStatus.UNREAD,
  })
  status: ProjectReminderUserStateStatus;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ nullable: true })
  dismissedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}