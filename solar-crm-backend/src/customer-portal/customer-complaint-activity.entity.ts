import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum CustomerComplaintActivityType {
  COMPLAINT_CREATED = 'COMPLAINT_CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ASSIGNED = 'ASSIGNED',
  SERVICE_SCHEDULED = 'SERVICE_SCHEDULED',
  STAFF_REMARK_ADDED = 'STAFF_REMARK_ADDED',
  RESOLUTION_ADDED = 'RESOLUTION_ADDED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
  ATTACHMENT_UPLOADED = 'ATTACHMENT_UPLOADED',
}

@Entity()
export class CustomerComplaintActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  complaintId: number;

  @Column({ nullable: true })
  customerId: number;

  @Column({ nullable: true })
  customerCode: string;

  @Column({ nullable: true })
  projectId: number;

  @Column({
    type: 'enum',
    enum: CustomerComplaintActivityType,
  })
  activityType: CustomerComplaintActivityType;

  @Column()
  activityTitle: string;

  @Column({ type: 'text', nullable: true })
  activityDescription: string;

  @Column({ nullable: true })
  performedBy: number;

  @Column({ nullable: true })
  performedByName: string;

  @Column({ nullable: true })
  performedByRole: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string;

  @Column({ type: 'text', nullable: true })
  newValue: string;

  @CreateDateColumn()
  createdAt: Date;
}