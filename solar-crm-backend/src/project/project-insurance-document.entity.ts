import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ProjectInsuranceDocumentType {
  POLICY = 'POLICY',
  RECEIPT = 'RECEIPT',
  INVOICE = 'INVOICE',
  CLAIM_DOCUMENT = 'CLAIM_DOCUMENT',
  RENEWAL_DOCUMENT = 'RENEWAL_DOCUMENT',
  OTHER = 'OTHER',
}

@Entity()
@Index(['insuranceId'])
export class ProjectInsuranceDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  insuranceId: number;

  @Column({
    type: 'enum',
    enum: ProjectInsuranceDocumentType,
    default: ProjectInsuranceDocumentType.POLICY,
  })
  documentType: ProjectInsuranceDocumentType;

  @Column({ type: 'varchar', length: 500 })
  fileName: string;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType?: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize?: number;

  @Column({ default: true })
  visibleToCustomer: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'int', nullable: true })
  uploadedBy?: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  uploadedByName?: string;

  @CreateDateColumn()
  createdAt: Date;
}