import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('solar_mitra_network_recovery')
@Index(
  [
    'recoveryCategory',
    'recoveryPayoutId',
    'settlementCategory',
    'settlementPayoutId',
  ],
  { unique: true },
)
export class SolarMitraNetworkRecovery {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  beneficiaryUserId: number;

  @Column({
  type: 'text',
  default: 'NETWORK',
})
recoveryCategory: string;

  @Index()
  @Column({ type: 'int' })
  recoveryPayoutId: number;

  @Column({
  type: 'text',
  default: 'NETWORK',
})
settlementCategory: string;

  @Index()
  @Column({ type: 'int' })
  settlementPayoutId: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  recoveredAmount: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  outstandingBefore: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  outstandingAfter: string;

  @Column({
    type: 'text',
  })
  settlementType: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  payrollId: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  processedBy: number | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  processedByName: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  remarks: string | null;

  @CreateDateColumn()
  createdAt: Date;
}