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
  RECOVERY_PENDING = 'RECOVERY_PENDING',
  RECOVERED = 'RECOVERED',
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
 * One referral can generate payouts for
 * multiple legitimate customer Projects.
 */
@Index()
@Column()
referralId: number;

/*
 * Each Project can have only one
 * Solar Mitra payout.
 */
@Index({ unique: true })
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

  @Column({ type: 'integer', nullable: true })
cancelledBy: number | null;

  @Column({ type: 'text', nullable: true })
  cancelledByName: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Index()
@Column({ type: 'int', nullable: true })
payrollId: number | null;

@Column({ type: 'timestamp', nullable: true })
payrollReservedAt: Date | null;

@Column({
  type: 'numeric',
  precision: 12,
  scale: 2,
  default: 0,
})
recoveryAmount: number;

@Column({
  type: 'numeric',
  precision: 12,
  scale: 2,
  default: 0,
})
recoveredAmount: number;

@Column({
  type: 'timestamp',
  nullable: true,
})
recoveredAt: Date | null;

@Column({
  type: 'numeric',
  precision: 12,
  scale: 2,
  default: 0,
})
recoveryDeductedAmount: number;

@Column({
  type: 'numeric',
  precision: 12,
  scale: 2,
  nullable: true,
})
netPaidAmount: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}