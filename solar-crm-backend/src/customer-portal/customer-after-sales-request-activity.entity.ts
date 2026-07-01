import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('customer_after_sales_request_activity')
export class CustomerAfterSalesRequestActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requestId: number;

  @Column({ type: 'text' })
  activityType: string;

  @Column({ type: 'text' })
  activityTitle: string;

  @Column({ type: 'text', nullable: true })
  activityDescription: string;

  @Column({ nullable: true })
  performedBy: number;

  @Column({ type: 'text', nullable: true })
  performedByName: string;

  @CreateDateColumn()
  createdAt: Date;
}