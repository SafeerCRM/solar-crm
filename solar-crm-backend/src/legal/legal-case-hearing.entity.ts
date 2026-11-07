import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum LegalHearingStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  ADJOURNED = 'ADJOURNED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
}

@Entity('legal_case_hearing')
export class LegalCaseHearing {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  caseId: number;

  @Index()
  @Column({ type: 'date' })
  hearingDate: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  courtOrAuthority: string | null;

  @Column({
    type: 'enum',
    enum: LegalHearingStatus,
    default: LegalHearingStatus.SCHEDULED,
  })
  status: LegalHearingStatus;

  @Column({ type: 'text', nullable: true })
  outcome: string | null;

  @Column({ type: 'text', nullable: true })
  proceedingsNotes: string | null;

  @Column({ type: 'date', nullable: true })
  nextHearingDate: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @Column({ type: 'int', nullable: true })
  updatedBy: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}