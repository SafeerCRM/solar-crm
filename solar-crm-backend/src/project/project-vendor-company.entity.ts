import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectVendorCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyName: string;

  @Column({ nullable: true })
  legalName: string;

  @Column({ nullable: true })
  gstNumber: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  alternatePhone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  pinCode: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccountName: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  bankIfsc: string;

  @Column({ nullable: true })
  upiId: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ nullable: true })
  hiddenByName: string;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}