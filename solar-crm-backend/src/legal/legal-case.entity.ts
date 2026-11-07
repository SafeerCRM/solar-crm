
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum LegalCaseDirection {
  FILED_BY_COMPANY = 'FILED_BY_COMPANY',
  FILED_AGAINST_COMPANY = 'FILED_AGAINST_COMPANY',
}

export enum LegalCaseStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  NOTICE_STAGE = 'NOTICE_STAGE',
  PROCEEDINGS = 'PROCEEDINGS',
  ON_HOLD = 'ON_HOLD',
  SETTLED = 'SETTLED',
  WITHDRAWN = 'WITHDRAWN',
  CLOSED = 'CLOSED',
}

export enum LegalCasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('legal_case')
export class LegalCase {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  caseNumber: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: LegalCaseDirection,
  })
  direction: LegalCaseDirection;

  @Column({ type: 'varchar', length: 100 })
  caseType: string;

  @Column({
    type: 'enum',
    enum: LegalCaseStatus,
    default: LegalCaseStatus.DRAFT,
  })
  status: LegalCaseStatus;

  @Column({
    type: 'enum',
    enum: LegalCasePriority,
    default: LegalCasePriority.MEDIUM,
  })
  priority: LegalCasePriority;

  @Index()
  @Column({ type: 'int', nullable: true })
  projectId: number | null;

  @Index()
  @Column({ type: 'int', nullable: true })
  assignedAdvisorId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  courtOrAuthority: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  externalCaseNumber: string | null;

  @Column({ type: 'date', nullable: true })
  filingDate: string | null;

  @Column({ type: 'date', nullable: true })
  nextHearingDate: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'boolean', default: false })
  isConfidential: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @Column({ type: 'int', nullable: true })
  updatedBy: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  archivedBy: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
