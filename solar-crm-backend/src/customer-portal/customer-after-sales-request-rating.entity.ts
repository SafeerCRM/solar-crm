import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('customer_after_sales_request_rating')
export class CustomerAfterSalesRequestRating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requestId: number;

  @Column()
  customerId: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'boolean', default: true })
  wouldRecommend: boolean;

  @CreateDateColumn()
  createdAt: Date;
}