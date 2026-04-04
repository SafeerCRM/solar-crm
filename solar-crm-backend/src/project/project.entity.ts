import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProjectStatus {
  NEW = 'NEW',
  SURVEY = 'SURVEY',
  QUOTATION = 'QUOTATION',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  INSTALLATION = 'INSTALLATION',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  leadId: number;

  @Column({ nullable: true })
  projectSize: string;

  @Column({ nullable: true })
  projectCost: number;

  @Column({ nullable: true })
  subsidy: number;

  @Column({ nullable: true })
  netAmount: number;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.NEW,
  })
  status: ProjectStatus;

  @Column({ nullable: true })
  vendorId: number;

  @Column({ nullable: true })
  paymentStatus: string;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expectedCompletionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualCompletionDate: Date;

  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}