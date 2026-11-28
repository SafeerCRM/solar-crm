import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('solar_mitra_network_rate')
export class SolarMitraNetworkRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  poolAmount: string;

  @Index({ unique: true })
  @Column({
    type: 'timestamptz',
  })
  effectiveFrom: Date;

  @Column({
    type: 'int',
    nullable: true,
  })
  createdBy: number | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  createdByName: string | null;

  @CreateDateColumn()
  createdAt: Date;
}