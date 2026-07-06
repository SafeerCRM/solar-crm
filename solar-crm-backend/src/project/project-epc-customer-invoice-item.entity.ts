import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ProjectEpcCustomerInvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  invoiceId: number;

  @Column()
  projectId: number;

  @Column({ type: 'int', default: 1 })
  serialNumber: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  hsnSac: string;

  @Column({ type: 'float', default: 0 })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  unit: string;

  @Column({ type: 'float', default: 0 })
  rate: number;

  @Column({ type: 'float', default: 0 })
  taxableAmount: number;

  @Column({ type: 'float', default: 0 })
  gstPercent: number;

  @Column({ type: 'float', default: 0 })
  cgstPercent: number;

  @Column({ type: 'float', default: 0 })
  cgstAmount: number;

  @Column({ type: 'float', default: 0 })
  sgstPercent: number;

  @Column({ type: 'float', default: 0 })
  sgstAmount: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @CreateDateColumn()
  createdAt: Date;
}