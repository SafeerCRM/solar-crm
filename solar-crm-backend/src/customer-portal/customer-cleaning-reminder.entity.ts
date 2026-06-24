import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CleaningReminderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  POSTPONED = 'POSTPONED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class CustomerCleaningReminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({ nullable: true })
  customerCode: string;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  projectName: string;

  @Column({ type: 'date' })
  cleaningDate: Date;

  @Column({ type: 'date', nullable: true })
  nextCleaningDate: Date;

  @Column({
    type: 'enum',
    enum: CleaningReminderStatus,
    default: CleaningReminderStatus.PENDING,
  })
  status: CleaningReminderStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  completedBy: number;

  @Column({ nullable: true })
  completedByName: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
isHidden: boolean;

@Column({ type: 'text', nullable: true })
hiddenReason: string;

@Column({ type: 'timestamp', nullable: true })
hiddenAt: Date;

@Column({ nullable: true })
hiddenBy: number;

@Column({ nullable: true })
hiddenByName: string;
}