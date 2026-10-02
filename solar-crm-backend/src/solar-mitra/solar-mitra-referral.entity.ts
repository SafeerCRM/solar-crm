import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SolarMitraReferralStatus {
  SUBMITTED = 'SUBMITTED',
  LEAD_CREATED = 'LEAD_CREATED',
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',
  MEETING_COMPLETED = 'MEETING_COMPLETED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  UNSUCCESSFUL = 'UNSUCCESSFUL',
  PAYOUT_ELIGIBLE = 'PAYOUT_ELIGIBLE',
  PAYOUT_PAID = 'PAYOUT_PAID',
  REJECTED = 'REJECTED',
}

export enum SolarMitraReferralSourceType {
  MITRA_PORTAL = 'MITRA_PORTAL',
  PUBLIC_QR = 'PUBLIC_QR',
  STAFF = 'STAFF',
}

@Entity('solar_mitra_referral')
export class SolarMitraReferral {
  @PrimaryGeneratedColumn()
  id: number;

  /*
   * Permanent referral attribution.
   *
   * This must never be replaced by CRM assignment information.
   */
  @Index()
  @Column()
  solarMitraId: number;

  /*
   * Snapshot of the Mitra at the time of referral.
   *
   * Even if the Mitra later changes their name/business/contact,
   * the historical referral still shows who originally submitted it.
   */
  @Column({ type: 'text' })
  solarMitraName: string;

  @Column({ type: 'text', nullable: true })
  solarMitraBusinessName: string;

  @Column({ type: 'text', nullable: true })
  solarMitraPhone: string;

  @Column({ type: 'text', nullable: true })
  solarMitraAddress: string;

  @Column({ type: 'text', nullable: true })
  solarMitraArea: string;

  @Column({ type: 'text', nullable: true })
  solarMitraCity: string;

  /*
   * Referred prospective customer.
   */
  @Column({ type: 'text' })
  customerName: string;

  @Index()
  @Column({ type: 'text' })
  customerPhone: string;

  @Column({ type: 'text', nullable: true })
  alternatePhone: string;

  @Column({ type: 'text', nullable: true })
  customerAddress: string;

  @Column({ type: 'text', nullable: true })
  customerArea: string;

  @Column({ type: 'text', nullable: true })
  customerCity: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  customerGpsLatitude: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  customerGpsLongitude: number;

  @Column({ type: 'text', nullable: true })
  customerGpsAddress: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({
    type: 'enum',
    enum: SolarMitraReferralSourceType,
    default: SolarMitraReferralSourceType.MITRA_PORTAL,
  })
  sourceType: SolarMitraReferralSourceType;

  @Column({
    type: 'enum',
    enum: SolarMitraReferralStatus,
    default: SolarMitraReferralStatus.SUBMITTED,
  })
  status: SolarMitraReferralStatus;

  /*
   * Existing CRM records created from this referral.
   *
   * These are links only. Existing Lead / Meeting / Project ownership
   * and employee attribution remain completely independent.
   */
  @Index()
  @Column({ nullable: true })
  linkedLeadId: number;

  @Index()
  @Column({ nullable: true })
  linkedMeetingId: number;

  @Index()
  @Column({ nullable: true })
  linkedProjectId: number;

  /*
   * CRM assignment for handling the referral before/when
   * it becomes a Lead.
   *
   * This is NOT Solar Mitra attribution.
   */
  @Column({ nullable: true })
  assignedTo: number;

  @Column({ type: 'text', nullable: true })
  assignedToName: string;

  @Column({ type: 'text', nullable: true })
  assignedToRole: string;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  /*
   * Snapshot the payout agreement that applies to this referral.
   *
   * These values will eventually be populated when the referral
   * enters the applicable payout lifecycle. They prevent future
   * configuration changes from rewriting historical terms.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  payoutAmountSnapshot: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  requiredPaymentPercentageSnapshot: number;

  @Column({ type: 'timestamp', nullable: true })
  payoutTermsSnapshottedAt: Date;

  /*
   * Audit information.
   */
  @Column({ nullable: true })
  submittedBy: number;

  @Column({ type: 'text', nullable: true })
  submittedByName: string;

  @Column({ type: 'text', nullable: true })
  submittedByType: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}