import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CustomerComplaintSubject {
  GENERATION_ISSUE = 'GENERATION_ISSUE',
  PANEL_ISSUE = 'PANEL_ISSUE',
  INVERTER_ISSUE = 'INVERTER_ISSUE',
  STRUCTURE_ISSUE = 'STRUCTURE_ISSUE',
  ELECTRICITY_ISSUE = 'ELECTRICITY_ISSUE',
  SUBSIDY_ISSUE = 'SUBSIDY_ISSUE',
  LOAN_ISSUE = 'LOAN_ISSUE',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  CLEANING_REQUEST = 'CLEANING_REQUEST',
  SERVICE_REQUEST = 'SERVICE_REQUEST',
  DOCUMENT_REQUEST = 'DOCUMENT_REQUEST',
  OTHER = 'OTHER',
}

export enum CustomerComplaintStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  SERVICE_SCHEDULED = 'SERVICE_SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

@Entity()
export class CustomerComplaint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({ nullable: true })
  customerCode: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  projectName: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({ nullable: true })
  projectOwnerId: number;

  @Column({ nullable: true })
  projectOwnerName: string;

  @Column({
    type: 'enum',
    enum: CustomerComplaintSubject,
    default: CustomerComplaintSubject.OTHER,
  })
  subject: CustomerComplaintSubject;

  @Column({ type: 'text' })
  complaintText: string;

  @Column({
    type: 'enum',
    enum: CustomerComplaintStatus,
    default: CustomerComplaintStatus.OPEN,
  })
  status: CustomerComplaintStatus;

  @Column({ nullable: true })
  assignedTo: number;

  @Column({ nullable: true })
  assignedToName: string;

  @Column({ type: 'timestamp', nullable: true })
  serviceDate: Date;

  @Column({ type: 'text', nullable: true })
  staffRemarks: string;

  @Column({ type: 'text', nullable: true })
  resolutionNote: string;

  @Column({ nullable: true })
  attachmentUrl: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true })
  createdByRole: string;

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

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ nullable: true })
  closedBy: number;

  @Column({ nullable: true })
  closedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}