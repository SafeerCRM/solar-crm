import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('customer_referral_activity')
export class CustomerReferralActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  referralId: number;

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