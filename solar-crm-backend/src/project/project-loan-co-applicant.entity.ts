import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectLoanCoApplicant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  relationWithCustomer: string;

  @Column({ nullable: true })
  mobileNumber: string;

  @Column({ nullable: true })
  aadhaarNumber: string;

  @Column({ nullable: true })
  aadhaarFrontUrl: string;

  @Column({ nullable: true })
  aadhaarBackUrl: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ nullable: true })
  panCardUrl: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  ifscCode: string;

  @Column({ nullable: true })
  bankProofUrl: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  updatedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}