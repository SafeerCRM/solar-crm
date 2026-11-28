import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SolarMitraNetworkPoolStatus {
  GENERATED = 'GENERATED',
  CANCELLED = 'CANCELLED',
}

@Entity('solar_mitra_network_pool')
export class SolarMitraNetworkPool {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'int' })
  projectId: number;

  @Column({ type: 'int' })
  referralId: number;

  @Column({ type: 'int' })
  directPayoutId: number;

  @Index()
  @Column({ type: 'int' })
  sourceSolarMitraId: number;

  @Column({ type: 'text' })
  sourceSolarMitraName: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  poolAmount: string;

  @Column({ type: 'int' })
  totalUplineCount: number;

  @Column({ type: 'int' })
  eligibleUplineCount: number;

  @Column({ type: 'int', default: 0 })
  inactiveUplineCount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  distributableAmount: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  retainedAmount: string;

  @Column({
    type: 'jsonb',
  })
  hierarchySnapshot: Record<string, any>[];

  @Column({
    type: 'enum',
    enum: SolarMitraNetworkPoolStatus,
    default: SolarMitraNetworkPoolStatus.GENERATED,
  })
  status: SolarMitraNetworkPoolStatus;

  @Index()
  @Column({ type: 'timestamp' })
  eligibleAt: Date;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}