import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ProjectInsuranceRequestDocumentType {
  AADHAAR_CARD = 'AADHAAR_CARD',
  PAN_CARD = 'PAN_CARD',
  PROJECT_INVOICE = 'PROJECT_INVOICE',
  OTHER = 'OTHER',
}

@Entity()
@Index(['insuranceRequestId'])
@Index(['documentType'])
export class ProjectInsuranceRequestDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
  })
  insuranceRequestId: number;

  @Column({
    type: 'enum',
    enum:
      ProjectInsuranceRequestDocumentType,
  })
  documentType:
    ProjectInsuranceRequestDocumentType;

  @Column({
    type: 'varchar',
    length: 500,
  })
  fileName: string;

  @Column({
    type: 'text',
  })
  fileUrl: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  mimeType?: string;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  fileSize?: number;

  @Column({
    default: false,
  })
  isHidden: boolean;

  @Column({
    type: 'int',
    nullable: true,
  })
  uploadedBy?: number;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  uploadedByName?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  uploadedByRole?: string;

  @CreateDateColumn()
  createdAt: Date;
}