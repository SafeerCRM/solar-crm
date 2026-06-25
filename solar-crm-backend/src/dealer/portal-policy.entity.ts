import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PortalPolicyType {
  CUSTOMER = 'CUSTOMER',
  DEALER = 'DEALER',
  STAFF = 'STAFF',
}

export enum PortalPolicyLanguage {
  HINDI = 'HINDI',
  ENGLISH = 'ENGLISH',
}

export enum PortalDocumentType {
  POLICY = 'POLICY',
  WARRANTY = 'WARRANTY',
  MANUAL = 'MANUAL',
  GUIDE = 'GUIDE',
  AGREEMENT = 'AGREEMENT',
  OTHER = 'OTHER',
}

@Entity('portal_policy')
export class PortalPolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PortalPolicyType,
    default: PortalPolicyType.CUSTOMER,
  })
  portalType: PortalPolicyType;

  @Column({ type: 'text' })
  title: string;

  @Column({
    type: 'enum',
    enum: PortalPolicyLanguage,
    default: PortalPolicyLanguage.HINDI,
  })
  language: PortalPolicyLanguage;

  @Column({
  type: 'enum',
  enum: PortalDocumentType,
  default: PortalDocumentType.POLICY,
})
documentType: PortalDocumentType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  pdfUrl: string;

  @Column({ default: true })
  visibleToCustomer: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ type: 'int', nullable: true })
  hiddenBy: number;

  @Column({ type: 'text', nullable: true })
  hiddenByName: string;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}