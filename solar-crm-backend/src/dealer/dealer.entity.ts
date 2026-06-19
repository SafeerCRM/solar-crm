import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DealerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

@Entity()
export class Dealer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  dealerName: string;

  @Column({ type: 'text', nullable: true })
  firmName: string;

  @Column({ type: 'text', nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  gstNumber: string;

  @Column({ type: 'text', nullable: true })
  branchName: string;

  @Column({ type: 'text', nullable: true })
  city: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
portalPassword: string;

  @Column({ default: false })
  creditEnabled: boolean;

  @Column({ type: 'numeric', default: 0 })
  creditLimit: number;

  @Column({ type: 'int', default: 0 })
  creditDays: number;

  @Column({
    type: 'enum',
    enum: DealerStatus,
    default: DealerStatus.ACTIVE,
  })
  status: DealerStatus;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ type: 'text', nullable: true })
  hiddenByName: string;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ nullable: true })
  restoredAt: Date;

  @Column({ nullable: true })
  restoredBy: number;

  @Column({ type: 'text', nullable: true })
  restoredByName: string;

  @Column({ type: 'text', nullable: true })
  restoreReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}