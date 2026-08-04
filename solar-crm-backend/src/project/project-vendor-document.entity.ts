import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProjectVendorDocumentType {
  BILL = 'BILL',
  INVOICE = 'INVOICE',
  DELIVERY_CHALLAN = 'DELIVERY_CHALLAN',
  EWAY_BILL = 'EWAY_BILL',
  TRANSPORT_RECEIPT = 'TRANSPORT_RECEIPT',
  OTHER = 'OTHER',
}

@Entity()
export class ProjectVendorDocument {
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

  @Column({ nullable: true })
  vendorBillId: number;

  @Column({ nullable: true })
  purchaseOrderId: number;

  @Column({
    type: 'enum',
    enum: ProjectVendorDocumentType,
    default: ProjectVendorDocumentType.OTHER,
  })
  documentType: ProjectVendorDocumentType;

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