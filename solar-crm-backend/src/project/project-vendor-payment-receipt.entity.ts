import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProjectVendorPaymentReceiptType {
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
  BANK_SCREENSHOT = 'BANK_SCREENSHOT',
  UTR_PROOF = 'UTR_PROOF',
  CHEQUE_COPY = 'CHEQUE_COPY',
  VENDOR_ACKNOWLEDGEMENT = 'VENDOR_ACKNOWLEDGEMENT',
  OTHER = 'OTHER',
}

@Entity()
export class ProjectVendorPaymentReceipt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @Column()
  companyName: string;

  @Column()
  vendorId: number;

  @Column()
  vendorName: string;

  @Column()
  vendorPaymentId: number;

  @Column({
    type: 'enum',
    enum: ProjectVendorPaymentReceiptType,
    default:
      ProjectVendorPaymentReceiptType.PAYMENT_RECEIPT,
  })
  receiptType: ProjectVendorPaymentReceiptType;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'int', default: 0 })
  fileSize: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  uploadedBy: number;

  @Column({ nullable: true })
  uploadedByName: string;

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

  @CreateDateColumn()
  createdAt: Date;
}