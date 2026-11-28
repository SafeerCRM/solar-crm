import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SolarMitraNetworkPayoutStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  RETAINED = 'RETAINED',
  CANCELLED = 'CANCELLED',
  RECOVERY_PENDING = 'RECOVERY_PENDING',
  RECOVERED = 'RECOVERED',
}

@Entity('solar_mitra_network_payout')
@Index(['poolId', 'beneficiaryUserId'], {
  unique: true,
})
export class SolarMitraNetworkPayout {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  poolId: number;

  @Index()
  @Column({ type: 'int' })
  projectId: number;

  @Column({ type: 'int' })
  referralId: number;

  @Index()
  @Column({ type: 'int' })
  sourceSolarMitraId: number;

  @Column({ type: 'text' })
  sourceSolarMitraName: string;

  @Index()
  @Column({ type: 'int' })
  beneficiaryUserId: number;

  @Column({ type: 'text' })
  beneficiaryName: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  beneficiaryRole: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  beneficiarySolarMitraId: number | null;

  @Column({ type: 'int' })
  networkLevel: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  payoutAmount: string;

  @Index()
  @Column({
    type: 'enum',
    enum: SolarMitraNetworkPayoutStatus,
    default:
      SolarMitraNetworkPayoutStatus.PENDING_APPROVAL,
  })
  status: SolarMitraNetworkPayoutStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  retentionReason: string | null;

  @Index()
  @Column({ type: 'timestamp' })
  eligibleAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  approvedAt: Date | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  approvedBy: number | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  approvedByName: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  paidAt: Date | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  paidBy: number | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  paidByName: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  paymentMode: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  paymentReference: string | null;

  @Column({
  type: 'numeric',
  precision: 12,
  scale: 2,
  default: 0,
})
recoveryDeductedAmount: string;

@Column({
  type: 'numeric',
  precision: 12,
  scale: 2,
  nullable: true,
})
netPaidAmount: string | null;

@Column({
  type: 'text',
  nullable: true,
})
settlementType: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  payrollId: number | null;

  @Column({ type: 'timestamp', nullable: true })
payrollReservedAt: Date | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  remarks: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  cancelledAt: Date | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  cancelledBy: number | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  cancellationReason: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  recoveryAmount: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  recoveredAmount: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  recoveredAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}