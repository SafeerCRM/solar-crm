import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum CustomerNotificationType {
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  WORK_REMINDER = 'WORK_REMINDER',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  COMPLAINT_UPDATE = 'COMPLAINT_UPDATE',
  SERVICE_UPDATE = 'SERVICE_UPDATE',
  CLEANING_REMINDER = 'CLEANING_REMINDER',
  DOCUMENT_UPDATE = 'DOCUMENT_UPDATE',
  GENERAL = 'GENERAL',
}

@Entity()
export class CustomerNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({ nullable: true })
  customerCode: string;

  @Column({ nullable: true })
  projectId: number;

  @Column({
    type: 'enum',
    enum: CustomerNotificationType,
    default: CustomerNotificationType.GENERAL,
  })
  notificationType: CustomerNotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ nullable: true })
  relatedEntityType: string;

  @Column({ nullable: true })
  relatedEntityId: number;

  @CreateDateColumn()
  createdAt: Date;
}