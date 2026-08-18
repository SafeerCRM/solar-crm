import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectProformaInvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
}

export enum ProjectInvoiceBuyerType {
  PROJECT = 'PROJECT',
  DEALER = 'DEALER',
  INTERNAL_COMPANY = 'INTERNAL_COMPANY',
}

@Entity()
export class ProjectProformaInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  /*
   * Nullable because Dealer and Inter-Company
   * invoices do not belong to a Project.
   */
  @Column({ nullable: true })
  projectId: number;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({
    type: 'enum',
    enum: ProjectProformaInvoiceStatus,
    default: ProjectProformaInvoiceStatus.DRAFT,
  })
  status: ProjectProformaInvoiceStatus;

  /*
   * PROJECT
   * DEALER
   * INTER_COMPANY
   */
  @Column({ default: 'PROJECT' })
  invoiceType: string;

  @Column({
    type: 'enum',
    enum: ProjectInvoiceBuyerType,
    default: ProjectInvoiceBuyerType.PROJECT,
  })
  buyerType: ProjectInvoiceBuyerType;

  /*
   * =========================================================
   * SELLER / ISSUING ENTITY SNAPSHOT
   * =========================================================
   *
   * Snapshot fields ensure old invoices never change
   * when company master data changes later.
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
   *
   * Used for:
   * Aditya Solars -> Aditya Trading
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

  @Column({ type: 'date', nullable: true })
  invoiceDate: Date;

  @Column({ type: 'date', nullable: true })
  validUntil: Date;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}