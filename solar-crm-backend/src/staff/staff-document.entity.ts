import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum StaffDocumentType {
  AADHAAR = 'AADHAAR',
  PAN = 'PAN',
  OFFER_LETTER = 'OFFER_LETTER',
  AGREEMENT = 'AGREEMENT',
  BANK_DETAILS = 'BANK_DETAILS',
  OTHER = 'OTHER',
}

@Entity()
export class StaffDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  staffId: number;

  @Column({
    type: 'enum',
    enum: StaffDocumentType,
    default: StaffDocumentType.OTHER,
  })
  documentType: StaffDocumentType;

  @Column({ nullable: true })
  fileName: string;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ nullable: true })
  uploadedBy: number;

  @Column({ nullable: true })
  uploadedByName: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;
}