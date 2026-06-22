import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectSubsidyStatus {
  DOCUMENT_PENDING = 'DOCUMENT_PENDING',
  PLANT_IMAGES_RECEIVED = 'PLANT_IMAGES_RECEIVED',
  DCR_CERTIFICATE_READY = 'DCR_CERTIFICATE_READY',
  SUBMISSION_DONE = 'SUBMISSION_DONE',
  SUBSIDY_REQUESTED = 'SUBSIDY_REQUESTED',
  SUBSIDY_REDEEMED = 'SUBSIDY_REDEEMED',
  SUBSIDY_DISBURSED = 'SUBSIDY_DISBURSED',
  REJECTED = 'REJECTED',
}

@Entity()
export class ProjectSubsidyDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({
    type: 'enum',
    enum: ProjectSubsidyStatus,
    default: ProjectSubsidyStatus.DOCUMENT_PENDING,
  })
  status: ProjectSubsidyStatus;

  @Column({ default: false })
  dcrCertificateReady: boolean;

  @Column({ default: false })
  panelWarrantyReceived: boolean;

  @Column({ default: false })
  inverterWarrantyReceived: boolean;

  @Column({ default: false })
  vendorAgreementReady: boolean;

  @Column({ default: false })
  wcrReady: boolean;

  @Column({ type: 'timestamp', nullable: true })
  portalSubmissionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  subsidyRequestedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  subsidyDisbursedDate: Date;

  @Column({ type: 'float', default: 0 })
  subsidyAmount: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  updatedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}