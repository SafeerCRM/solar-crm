
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('solar_store_onboarding_payment')
export class SolarStoreOnboardingPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'integer' })
  solarStoreId: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
  })
  amount: number;

  @Column({ type: 'date' })
  paymentDate: string;

  @Column({ type: 'text', nullable: true })
  paymentMode: string | null;

  @Column({ type: 'text', nullable: true })
  paymentReference: string | null;

  @Column({ type: 'text', nullable: true })
  proofUrl: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'integer', nullable: true })
  receivedBy: number | null;

  @Column({ type: 'text', nullable: true })
  receivedByName: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
