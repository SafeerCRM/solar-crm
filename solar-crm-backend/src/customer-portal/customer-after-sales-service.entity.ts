import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customer_after_sales_service')
export class CustomerAfterSalesService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  serviceName: string;

  @Column({ type: 'text', nullable: true })
  category: string;

  @Column({ type: 'numeric', default: 0 })
  price: number;

  @Column({ type: 'boolean', default: true })
  isPaidService: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  estimatedVisitTime: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ type: 'text', nullable: true })
  hiddenByName: string;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}