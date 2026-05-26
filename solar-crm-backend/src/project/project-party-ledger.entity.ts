import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProjectLedgerEntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum ProjectLedgerSourceType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  PROFORMA_INVOICE = 'PROFORMA_INVOICE',
  FINAL_INVOICE = 'FINAL_INVOICE',
  CUSTOMER_PAYMENT = 'CUSTOMER_PAYMENT',
  VENDOR_PAYMENT = 'VENDOR_PAYMENT',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

@Entity()
export class ProjectPartyLedger {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  partyId: number;

  @Column({ nullable: true })
  partyName: string;

  @Column({ nullable: true })
  partyType: string;

  @Column({ nullable: true })
  projectId: number;

  @Column({
    type: 'enum',
    enum: ProjectLedgerEntryType,
  })
  entryType: ProjectLedgerEntryType;

  @Column({
    type: 'enum',
    enum: ProjectLedgerSourceType,
  })
  sourceType: ProjectLedgerSourceType;

  @Column({ nullable: true })
  sourceId: number;

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ default: false })
isHidden: boolean;

@Column({ type: 'text', nullable: true })
hiddenReason: string;

@Column({ type: 'timestamp', nullable: true })
hiddenAt: Date;

@Column({ nullable: true })
hiddenBy: number;

@Column({ nullable: true })
hiddenByName: string;

  @CreateDateColumn()
  createdAt: Date;
}