import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectCustomerUpdateType {
  GENERAL = 'GENERAL',
  DOCUMENT = 'DOCUMENT',
  LOAN = 'LOAN',
  SUBSIDY = 'SUBSIDY',
  ELECTRICITY = 'ELECTRICITY',
  INSTALLATION = 'INSTALLATION',
  PAYMENT = 'PAYMENT',
  COMPLETION = 'COMPLETION',
  OTHER = 'OTHER',
}

@Entity()
export class ProjectCustomerUpdate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectCustomerUpdateType,
    default: ProjectCustomerUpdateType.GENERAL,
  })
  updateType: ProjectCustomerUpdateType;

  @Column({ nullable: true })
  attachmentUrl: string;

  @Column({ nullable: true })
  attachmentName: string;

  @Column({ type: 'boolean', default: true })
  visibleToCustomer: boolean;

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

  @Column({ type: 'text', nullable: true })
  restoreReason: string;

  @Column({ type: 'timestamp', nullable: true })
  restoredAt: Date;

  @Column({ nullable: true })
  restoredBy: number;

  @Column({ nullable: true })
  restoredByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}