import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectProformaInvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class ProjectProformaInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({
    type: 'enum',
    enum: ProjectProformaInvoiceStatus,
    default: ProjectProformaInvoiceStatus.DRAFT,
  })
  status: ProjectProformaInvoiceStatus;

  @Column({ type: 'float', default: 0 })
  subtotalAmount: number;

  @Column({ type: 'float', default: 0 })
  discountAmount: number;

  @Column({ type: 'float', default: 0 })
  gstAmount: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ type: 'date', nullable: true })
  invoiceDate: Date;

  @Column({ type: 'date', nullable: true })
  validUntil: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true })
  createdByRole: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}