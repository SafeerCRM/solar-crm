import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectFinalInvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  finalInvoiceId: number;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  materialId: number;

  @Column()
  itemName: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
hsnCode: string;

  @Column({ type: 'float', default: 0 })
  finalRate: number;

  @Column({ type: 'float', default: 0 })
  gstPercent: number;

  @Column({ type: 'float', default: 0 })
  quantity: number;

  @Column({ type: 'float', default: 0 })
  discountAmount: number;

  @Column({ type: 'float', default: 0 })
  subtotalAmount: number;

  @Column({ type: 'float', default: 0 })
  gstAmount: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}