import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectPaymentReminderUserStateStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  DISMISSED = 'DISMISSED',
}

@Entity('project_payment_reminder_user_states')
export class ProjectPaymentReminderUserState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  installmentId: number;

  @Column({ type: 'int' })
  projectId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'text', nullable: true })
  userName: string;

  @Column({
    type: 'enum',
    enum: ProjectPaymentReminderUserStateStatus,
    default: ProjectPaymentReminderUserStateStatus.UNREAD,
  })
  status: ProjectPaymentReminderUserStateStatus;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  dismissedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}