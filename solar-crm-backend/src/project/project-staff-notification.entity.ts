import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('project_staff_notification')
@Index(['recipientUserId', 'isRead', 'createdAt'])
@Index(['projectId', 'createdAt'])
export class ProjectStaffNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  recipientUserId: number;

  @Column({ type: 'int' })
  projectId: number;

  @Column({
    type: 'varchar',
    length: 80,
  })
  module: string;

  @Column({
    type: 'varchar',
    length: 80,
    default: 'REMARK_ADDED',
  })
  eventType: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  title: string;

  @Column({
    type: 'text',
  })
  message: string;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  targetTab: string | null;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  targetSection: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  relatedEntityType: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  relatedEntityId: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  createdBy: number | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  createdByName: string | null;

  @Column({
    type: 'boolean',
    default: false,
  })
  isRead: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}