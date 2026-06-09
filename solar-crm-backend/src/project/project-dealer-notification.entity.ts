import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProjectDealerNotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

@Entity()
export class ProjectDealerNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dealerId: number;

  @Column({ nullable: true })
  dealerName: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  notificationType: string;

  @Column({
    type: 'enum',
    enum: ProjectDealerNotificationStatus,
    default: ProjectDealerNotificationStatus.UNREAD,
  })
  status: ProjectDealerNotificationStatus;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @CreateDateColumn()
  createdAt: Date;
}