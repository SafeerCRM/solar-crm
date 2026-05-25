import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectContractor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  contractorName: string;

  @Column({ type: 'text' })
  phone: string;

  @Column({ type: 'text', nullable: true })
  alternatePhone: string;

  @Column({ type: 'text', nullable: true })
  city: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  linkedUserId: number;

  @Column({ type: 'text', nullable: true })
  aadhaarFrontUrl: string;

  @Column({ type: 'text', nullable: true })
  aadhaarBackUrl: string;

  @Column({ type: 'text', nullable: true })
  bankProofUrl: string;

  @Column({ type: 'text', nullable: true })
  accountHolderName: string;

  @Column({ type: 'text', nullable: true })
  bankName: string;

  @Column({ type: 'text', nullable: true })
  accountNumber: string;

  @Column({ type: 'text', nullable: true })
  ifscCode: string;

  @Column({ type: 'text', nullable: true })
  upiId: string;

  @Column({ type: 'text', nullable: true })
  panNumber: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ type: 'text', nullable: true })
  createdByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}