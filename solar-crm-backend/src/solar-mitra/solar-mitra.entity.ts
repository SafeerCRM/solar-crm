import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SolarMitraStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

@Entity('solar_mitra')
export class SolarMitra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  businessName: string;

  @Column({ type: 'text' })
  primaryPhone: string;

  @Column({ type: 'text', nullable: true })
  secondaryPhone: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  area: string;

  @Column({ type: 'text', nullable: true })
  city: string;

  @Column({ type: 'text', nullable: true })
  state: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  gpsLatitude: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  gpsLongitude: number;

  @Column({ type: 'text', nullable: true })
  gpsAddress: string;

  @Column({ type: 'text', nullable: true })
shopPhotoUrl: string;

/*
 * CRM User account linked to this Solar Mitra profile.
 *
 * Authentication is handled through the normal CRM User system.
 * The linked user must have the SOLAR_MITRA role.
 */
@Index({ unique: true })
@Column({ nullable: true })
linkedUserId: number;

/*
 * Legacy field from the initially planned separate Solar Mitra portal.
 *
 * Kept temporarily for database compatibility.
 * New Solar Mitra authentication must not use this field.
 */
@Column({ type: 'text', nullable: true })
portalPassword: string;

  /*
   * Stable random token used in the Solar Mitra's public
   * referral QR/link.
   *
   * Never expose the database ID as the public referral identity.
   */
  @Index({ unique: true })
  @Column({ type: 'text', nullable: true })
  publicReferralToken: string;

  @Column({
    type: 'enum',
    enum: SolarMitraStatus,
    default: SolarMitraStatus.ACTIVE,
  })
  status: SolarMitraStatus;

  /*
   * Optional special payout agreement.
   *
   * When null, the current global Solar Mitra setting applies.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  payoutAmountOverride: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  requiredPaymentPercentageOverride: number;

  /*
   * Internal CRM manager responsible for this Solar Mitra.
   * This is an employee attribution only.
   */
  @Column({ nullable: true })
  franchiseManagerId: number;

  @Column({ type: 'text', nullable: true })
  franchiseManagerName: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ type: 'text', nullable: true })
  hiddenByName: string;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ type: 'timestamp', nullable: true })
  restoredAt: Date;

  @Column({ nullable: true })
  restoredBy: number;

  @Column({ type: 'text', nullable: true })
  restoredByName: string;

  @Column({ type: 'text', nullable: true })
  restoreReason: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ type: 'text', nullable: true })
  createdByName: string;

  @Column({ type: 'text', nullable: true })
createdByRole: string;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ type: 'text', nullable: true })
  updatedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}