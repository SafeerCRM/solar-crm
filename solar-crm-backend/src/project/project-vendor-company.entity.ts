import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectVendorCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyName: string;

  @Column({ nullable: true })
  legalName: string;

  @Column({ nullable: true })
  gstNumber: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  alternatePhone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  stateCode: string;

  @Column({ nullable: true })
  pinCode: string;

  /*
   * Marks firms which can issue CRM invoices.
   *
   * Examples:
   * - Aditya Solars
   * - Aditya Trading
   *
   * Normal vendor companies do not need this enabled.
   */
  @Column({ default: false })
  isBillingEntity: boolean;

  /*
   * Stable internal identifier for billing logic.
   *
   * Recommended:
   * ADITYA_SOLARS
   * ADITYA_TRADING
   */
  @Column({ nullable: true })
  billingEntityCode: string;

  /*
   * Prefix used while generating Tax Invoice numbers.
   *
   * Example:
   * AS
   * AT
   */
  @Column({ nullable: true })
  invoicePrefix: string;

  /*
   * The next sequential Tax Invoice number.
   *
   * Owner may adjust this from CRM settings later.
   *
   * Example:
   * Aditya Solars -> 456
   * Aditya Trading -> 1
   */
  @Column({ type: 'int', default: 1 })
  nextInvoiceNumber: number;

  /*
   * Optional logo reference used by dynamic PDF templates.
   *
   * We will wire upload/selection in a later step.
   */
  @Column({ type: 'text', nullable: true })
  logoUrl: string;

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

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}