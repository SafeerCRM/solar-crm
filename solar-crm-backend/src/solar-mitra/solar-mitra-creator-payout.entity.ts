import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SolarMitraCreatorPayoutStatus {
  ELIGIBLE = 'ELIGIBLE',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('solar_mitra_creator_payout')
export class SolarMitraCreatorPayout {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'integer' })
  solarMitraId: number;

  @Column({ type: 'text' })
  solarMitraName: string;

  @Index()
  @Column({ type: 'integer' })
  creatorId: number;

  @Column({ type: 'text', nullable: true })
  creatorName: string | null;

  @Column({ type: 'text', nullable: true })
  creatorRole: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  payoutAmount: number;

  @Column({
    type: 'enum',
    enum: SolarMitraCreatorPayoutStatus,
    default: SolarMitraCreatorPayoutStatus.ELIGIBLE,
  })
  status: SolarMitraCreatorPayoutStatus;

  @Column({ type: 'timestamp' })
  eligibleAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  paidBy: number | null;

  @Column({ type: 'text', nullable: true })
  paidByName: string | null;

  @Column({ type: 'text', nullable: true })
  paymentMode: string | null;

  @Column({ type: 'text', nullable: true })
  paymentReference: string | null;

  @Column({ type: 'text', nullable: true })
  paymentRemarks: string | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  cancelledBy: number | null;

  @Column({ type: 'text', nullable: true })
  cancelledByName: string | null;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string | null;

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