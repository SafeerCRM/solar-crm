import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SolarMitraPayoutStatus {
  WAITING = 'WAITING',
  ELIGIBLE = 'ELIGIBLE',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('solar_mitra_payout')
export class SolarMitraPayout {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  solarMitraId: number;

  @Column({ type: 'text' })
  solarMitraName: string;

  @Column({ type: 'text', nullable: true })
  solarMitraBusinessName: string;

  /*
   * One payout belongs to one referral.
   *
   * unique prevents accidentally creating two payout records
   * for the same Solar Mitra referral.
   */
  @Index({ unique: true })
  @Column()
  referralId: number;

  @Index()
  @Column({ nullable: true })
  projectId: number;

  @Column({ type: 'text', nullable: true })
  customerName: string;

  @Column({ type: 'text', nullable: true })
  customerPhone: string;

  /*
   * Financial terms copied from the applicable referral terms.
   * Once created, future global setting changes must not alter
   * these historical payout terms.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  payoutAmount: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
  })
  requiredProjectPaymentPercentage: number;

  /*
   * Percentage observed when the payout became eligible.
   * This is historical evidence, not a live calculation field.
   */
  @Column({
    type: 'numeric',
    precision: 7,
    scale: 2,
    nullable: true,
  })
  qualifyingPaymentPercentage: number;

  @Column({
    type: 'enum',
    enum: SolarMitraPayoutStatus,
    default: SolarMitraPayoutStatus.WAITING,
  })
  status: SolarMitraPayoutStatus;

  @Column({ type: 'timestamp', nullable: true })
  eligibleAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  paidBy: number;

  @Column({ type: 'text', nullable: true })
  paidByName: string;

  /*
   * Client can enter transaction/reference details when
   * recording the payout.
   */
  @Column({ type: 'text', nullable: true })
  paymentMode: string;

  @Column({ type: 'text', nullable: true })
  paymentReference: string;

  @Column({ type: 'text', nullable: true })
  paymentRemarks: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelledBy: number;

  @Column({ type: 'text', nullable: true })
  cancelledByName: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}