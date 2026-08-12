import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['announcementId', 'customerId'], {
  unique: true,
})
@Index(['customerId'])
export class CustomerAnnouncementDelivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  announcementId: number;

  @Column({ type: 'int' })
  customerId: number;

  @Column({ type: 'int', nullable: true })
  projectId?: number;

  @Column({ default: false })
  pushSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  pushSentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  dismissedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}