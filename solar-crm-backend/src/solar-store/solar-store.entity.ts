
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SolarStoreStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

@Entity('solar_store')
export class SolarStore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  ownerName: string | null;

  @Column({ type: 'text' })
  primaryPhone: string;

  @Column({ type: 'text', nullable: true })
  secondaryPhone: string | null;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  tehsil: string | null;

  @Column({ type: 'text', nullable: true })
  district: string | null;

  @Column({ type: 'text', nullable: true })
  state: string | null;

  @Column({ type: 'text', nullable: true })
  shopPhotoUrl: string | null;

  @Index({ unique: true })
  @Column({ type: 'integer', nullable: true })
  linkedUserId: number | null;

  @Column({
    type: 'enum',
    enum: SolarStoreStatus,
    default: SolarStoreStatus.ACTIVE,
  })
  status: SolarStoreStatus;

  // Initial franchise onboarding fee payable
  // by the store to Aditya Solars.
  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 150000,
  })
  onboardingAmount: number;

  // Percentage of the agreed project margin
  // payable to this Solar Store.
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 30,
  })
  marginPercentage: number;

  // Overrides the default 20% customer
  // project payment eligibility threshold.
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  requiredPaymentPercentageOverride: number | null;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'integer', nullable: true })
  createdBy: number | null;

  @Column({ type: 'text', nullable: true })
  createdByName: string | null;

  @Column({ type: 'integer', nullable: true })
  updatedBy: number | null;

  @Column({ type: 'text', nullable: true })
  updatedByName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
