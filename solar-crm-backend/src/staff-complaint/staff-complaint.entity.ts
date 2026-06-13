import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StaffComplaintStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  FOLLOW_UP_REQUIRED = 'FOLLOW_UP_REQUIRED',
  WAITING_FOR_STAFF = 'WAITING_FOR_STAFF',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export enum StaffComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity()
export class StaffComplaint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: StaffComplaintPriority,
    default: StaffComplaintPriority.MEDIUM,
  })
  priority: StaffComplaintPriority;

  @Column({
    type: 'enum',
    enum: StaffComplaintStatus,
    default: StaffComplaintStatus.OPEN,
  })
  status: StaffComplaintStatus;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ type: 'text', nullable: true })
  createdByName: string;

  @Column({ type: 'text', nullable: true })
  createdByRole: string;

  @Column({ type: 'text', nullable: true })
  ownerRemarks: string;

  @Column({ nullable: true })
  resolvedBy: number;

  @Column({ type: 'text', nullable: true })
  resolvedByName: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
department: string;

@Column({ type: 'text', nullable: true })
audioUrl: string;

@Column({ type: 'text', nullable: true })
ownerAudioUrl: string;

@Column({ type: 'date', nullable: true })
followUpDate: string;

@Column({ type: 'text', nullable: true })
followUpTime: string;

@Column({ type: 'text', nullable: true })
nextAction: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({
  type: 'int',
  nullable: true,
})
hiddenBy: number | null;

@Column({
  type: 'text',
  nullable: true,
})
hiddenByName: string | null;

@Column({
  type: 'timestamp',
  nullable: true,
})
hiddenAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}