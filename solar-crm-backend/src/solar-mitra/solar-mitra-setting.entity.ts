import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SolarMitraPayoutQualificationType {
  PROJECT_PAYMENT_PERCENTAGE = 'PROJECT_PAYMENT_PERCENTAGE',
}

@Entity('solar_mitra_setting')
export class SolarMitraSetting {
  @PrimaryGeneratedColumn()
  id: number;

  /*
   * Default reward for a successful Solar Mitra referral.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 5000,
  })
  defaultPayoutAmount: number;

  /*
   * Kept as an enum so additional qualification methods
   * can be introduced later without redesigning this table.
   */
  @Column({
    type: 'enum',
    enum: SolarMitraPayoutQualificationType,
    default:
      SolarMitraPayoutQualificationType.PROJECT_PAYMENT_PERCENTAGE,
  })
  payoutQualificationType: SolarMitraPayoutQualificationType;

  /*
   * Example:
   * 20 = referral becomes payout-eligible when the linked
   * project reaches 20% qualifying payment.
   */
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 20,
  })
  requiredProjectPaymentPercentage: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
updatedBy: number | null;

@Column({ type: 'text', nullable: true })
updatedByName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}