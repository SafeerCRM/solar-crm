import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectLoanStatus {
  DOCUMENT_PENDING = 'DOCUMENT_PENDING',
  DOCUMENT_COMPLETED = 'DOCUMENT_COMPLETED',
  REGISTRATION_COMPLETED = 'REGISTRATION_COMPLETED',
  IN_PRINCIPAL_GENERATED = 'IN_PRINCIPAL_GENERATED',
  QUOTATION_SUBMITTED = 'QUOTATION_SUBMITTED',
  BANK_VISITED = 'BANK_VISITED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  FILE_REJECTED = 'FILE_REJECTED',
  LOAN_REAPPLY = 'LOAN_REAPPLY',
}

export enum ProjectLoanType {
  SUBSIDY_LOAN = 'SUBSIDY_LOAN',
  PRIVATE_LOAN = 'PRIVATE_LOAN',
}

@Entity()
export class ProjectLoanDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({
    type: 'enum',
    enum: ProjectLoanType,
    nullable: true,
  })
  loanType: ProjectLoanType;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  applicationNumber: string;

    @Column({ default: false })
  requiresCoApplicant: boolean;

  @Column({ type: 'text', nullable: true })
  coApplicantReason: string;

  @Column({ type: 'float', default: 0 })
  marginMoney: number;

  @Column({ type: 'float', default: 0 })
  sanctionAmount: number;

  @Column({ type: 'float', default: 0 })
  firstEmiDisbursementAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  firstEmiDisbursementDate: Date;

  @Column({
    type: 'enum',
    enum: ProjectLoanStatus,
    default: ProjectLoanStatus.DOCUMENT_PENDING,
  })
  status: ProjectLoanStatus;

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