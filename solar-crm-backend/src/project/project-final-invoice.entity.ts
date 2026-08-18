import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectFinalInvoiceStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
}

export enum ProjectFinalInvoiceBuyerType {
  PROJECT = 'PROJECT',
  DEALER = 'DEALER',
  INTERNAL_COMPANY = 'INTERNAL_COMPANY',
}

@Entity()
export class ProjectFinalInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  /*
   * Nullable for Dealer / Inter-Company invoices.
   *
   * Existing Project invoices continue storing projectId normally.
   */
  @Column({ nullable: true })
  projectId: number;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({
    type: 'enum',
    enum: ProjectFinalInvoiceStatus,
    default: ProjectFinalInvoiceStatus.DRAFT,
  })
  status: ProjectFinalInvoiceStatus;

  /*
   * PROJECT
   * DEALER
   * INTER_COMPANY
   */
  @Column({ default: 'PROJECT' })
  invoiceType: string;

  @Column({
    type: 'enum',
    enum: ProjectFinalInvoiceBuyerType,
    default: ProjectFinalInvoiceBuyerType.PROJECT,
  })
  buyerType: ProjectFinalInvoiceBuyerType;

  /*
   * =========================================================
   * SELLER / ISSUING ENTITY SNAPSHOT
   * =========================================================
   */

  @Column({ nullable: true })
  sellerCompanyId: number;

  @Column({ nullable: true })
  sellerCompanyCode: string;

  @Column({ nullable: true })
  sellerCompanyName: string;

  @Column({ nullable: true })
  sellerLegalName: string;

  @Column({ nullable: true })
  sellerGstNumber: string;

  @Column({ type: 'text', nullable: true })
  sellerAddress: string;

  @Column({ nullable: true })
  sellerCity: string;

  @Column({ nullable: true })
  sellerState: string;

  @Column({ nullable: true })
  sellerStateCode: string;

  @Column({ nullable: true })
  sellerPinCode: string;

  @Column({ nullable: true })
  sellerPhone: string;

  @Column({ nullable: true })
  sellerEmail: string;

  @Column({ type: 'text', nullable: true })
  sellerLogoUrl: string;

  /*
   * =========================================================
   * INTERNAL COMPANY BUYER SNAPSHOT
   * =========================================================
   */

  @Column({ nullable: true })
  buyerCompanyId: number;

  @Column({ nullable: true })
  buyerCompanyCode: string;

  @Column({ nullable: true })
  buyerCompanyName: string;

  @Column({ nullable: true })
  buyerLegalName: string;

  @Column({ nullable: true })
  buyerGstNumber: string;

  @Column({ type: 'text', nullable: true })
  buyerAddress: string;

  @Column({ nullable: true })
  buyerCity: string;

  @Column({ nullable: true })
  buyerState: string;

  @Column({ nullable: true })
  buyerStateCode: string;

  @Column({ nullable: true })
  buyerPinCode: string;

  @Column({ nullable: true })
  buyerPhone: string;

  @Column({ nullable: true })
  buyerEmail: string;

  /*
   * =========================================================
   * EXISTING DEALER BUYER SNAPSHOT
   * =========================================================
   */

  @Column({ nullable: true })
  dealerId: number;

  @Column({ nullable: true })
  dealerName: string;

  @Column({ nullable: true })
  dealerPhone: string;

  @Column({ nullable: true })
  dealerGstNumber: string;

  @Column({ type: 'text', nullable: true })
  dealerAddress: string;

  /*
   * =========================================================
   * AMOUNTS
   * =========================================================
   */

  @Column({ type: 'float', default: 0 })
  subtotalAmount: number;

  @Column({ type: 'float', default: 0 })
  discountAmount: number;

  @Column({ type: 'float', default: 0 })
  gstAmount: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ type: 'float', default: 0 })
  paidAmount: number;

  @Column({ type: 'float', default: 0 })
  pendingAmount: number;

  @Column({ type: 'date', nullable: true })
  invoiceDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true })
  createdByRole: string;

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

  /*
   * Records whether Owner manually changed the
   * automatically suggested invoice number.
   */
  @Column({ default: false })
  invoiceNumberOverridden: boolean;

  @Column({ nullable: true })
  invoiceNumberOverriddenBy: number;

  @Column({ nullable: true })
  invoiceNumberOverriddenByName: string;

  @Column({ type: 'timestamp', nullable: true })
  invoiceNumberOverriddenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}