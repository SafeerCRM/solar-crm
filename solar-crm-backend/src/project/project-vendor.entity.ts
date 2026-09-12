import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectVendor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vendorName: string;

  @Column({ nullable: true })
  firmName: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  alternatePhone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  gstNumber: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  pinCode: string;

  @Column({ nullable: true })
  materialCategory: string;

  @Column({ nullable: true })
  partyType: string;

  @Column({ default: true })
  canSellToUs: boolean;

  @Column({ default: false })
  canBuyFromUs: boolean;

  @Column({ type: 'float', default: 0 })
  openingBalance: number;

  @Column({ type: 'int', default: 0 })
  creditDays: number;

  @Column({ type: 'float', default: 0 })
  creditLimit: number;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccountName: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  bankIfsc: string;

  @Column({ nullable: true })
  upiId: string;

  @Column({
  type: 'int',
  nullable: true,
})
tradingManagerId: number | null;

@Column({
  nullable: true,
})
tradingManagerName: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ nullable: true })
  hiddenByName: string;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ type: 'timestamp', nullable: true })
  restoredAt: Date;

  @Column({ nullable: true })
  restoredBy: number;

  @Column({ nullable: true })
  restoredByName: string;

  @Column({ type: 'text', nullable: true })
  restoreReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}