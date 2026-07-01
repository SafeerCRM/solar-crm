import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum CustomerAfterSalesProofType {
  BEFORE_PHOTO = 'BEFORE_PHOTO',
  AFTER_PHOTO = 'AFTER_PHOTO',
  COMPLETION_PHOTO = 'COMPLETION_PHOTO',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER',
}

@Entity('customer_after_sales_request_proof')
export class CustomerAfterSalesRequestProof {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requestId: number;

  @Column({
    type: 'enum',
    enum: CustomerAfterSalesProofType,
    default: CustomerAfterSalesProofType.OTHER,
  })
  proofType: CustomerAfterSalesProofType;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  fileName: string;

  @Column({ type: 'text', nullable: true })
  mimeType: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  uploadedBy: number;

  @Column({ type: 'text', nullable: true })
  uploadedByName: string;

  @CreateDateColumn()
  createdAt: Date;
}