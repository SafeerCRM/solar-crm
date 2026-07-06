import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectEpcCustomerInvoiceStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class ProjectEpcCustomerInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ type: 'date', nullable: true })
  invoiceDate: string;

  @Column({
    type: 'enum',
    enum: ProjectEpcCustomerInvoiceStatus,
    default: ProjectEpcCustomerInvoiceStatus.DRAFT,
  })
  status: ProjectEpcCustomerInvoiceStatus;

  @Column({ type: 'text', nullable: true })
fromName: string;

@Column({ type: 'text', nullable: true })
fromAddress: string;

@Column({ type: 'text', nullable: true })
fromPincode: string;

@Column({ type: 'text', nullable: true })
fromGstin: string;

@Column({ type: 'text', nullable: true })
fromPhone: string;

@Column({ type: 'text', nullable: true })
fromEmail: string;

@Column({ type: 'text', nullable: true })
deliveryNote: string;

@Column({ type: 'text', nullable: true })
buyerOrderNo: string;

@Column({ type: 'text', nullable: true })
dispatchThrough: string;

@Column({ type: 'text', nullable: true })
termsOfDelivery: string;

@Column({ type: 'text', nullable: true })
placeOfSupply: string;

@Column({ type: 'text', nullable: true })
stateCode: string;

@Column({ type: 'text', nullable: true })
vehicleNumber: string;

@Column({ type: 'text', nullable: true })
ewayBillNumber: string;

  @Column({ type: 'text', nullable: true })
  billToName: string;

  @Column({ type: 'text', nullable: true })
  billToAddress: string;

  @Column({ type: 'text', nullable: true })
  billToPhone: string;

  @Column({ type: 'text', nullable: true })
  shipToName: string;

  @Column({ type: 'text', nullable: true })
  shipToAddress: string;

  @Column({ type: 'text', nullable: true })
  shipToPhone: string;

  @Column({ type: 'float', default: 0 })
  taxableAmount: number;

  @Column({ type: 'float', default: 0 })
  cgstAmount: number;

  @Column({ type: 'float', default: 0 })
  sgstAmount: number;

  @Column({ type: 'float', default: 0 })
  totalTaxAmount: number;

  @Column({ type: 'float', default: 0 })
  roundOff: number;

  @Column({ type: 'float', default: 0 })
  grandTotal: number;

  @Column({ type: 'text', nullable: true })
  amountInWords: string;

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @Column({ type: 'text', nullable: true })
  declaration: string;

  @Column({ type: 'text', nullable: true })
  sealUrl: string;

  @Column({ type: 'text', nullable: true })
  signatureUrl: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}