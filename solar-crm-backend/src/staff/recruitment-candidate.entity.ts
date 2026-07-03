import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RecruitmentStage {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  SELECTED = 'SELECTED',
  OFFER_SENT = 'OFFER_SENT',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_REJECTED = 'OFFER_REJECTED',
  JOINED = 'JOINED',
  REJECTED = 'REJECTED',
  ON_HOLD = 'ON_HOLD',
}

@Entity()
export class RecruitmentCandidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  candidateName: string;

  @Column({ nullable: true })
  mobile: string;

  @Column({ nullable: true })
  alternateMobile: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  appliedRole: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  expectedSalary: number;

  @Column({ nullable: true })
  experience: string;

  @Column({ nullable: true })
  noticePeriod: string;

  @Column({ type: 'text', nullable: true })
  resumeUrl: string;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  @Column({ type: 'text', nullable: true })
  documentUrl: string;

  @Column({
    type: 'enum',
    enum: RecruitmentStage,
    default: RecruitmentStage.APPLIED,
  })
  stage: RecruitmentStage;

  @Column({ nullable: true })
  interviewDate: Date;

  @Column({ nullable: true })
  interviewerName: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  interviewRating: number;

  @Column({ type: 'text', nullable: true })
  interviewRemarks: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  offeredSalary: number;

  @Column({ nullable: true })
  joiningDate: Date;

  @Column({ type: 'text', nullable: true })
  offerLetterUrl: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  updatedByName: string;

  @Column({ nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ type: 'text', nullable: true })
  hiddenByName: string;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ nullable: true })
  restoredAt: Date;

  @Column({ nullable: true })
  restoredBy: number;

  @Column({ type: 'text', nullable: true })
  restoredByName: string;

  @Column({ type: 'text', nullable: true })
  restoreReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}