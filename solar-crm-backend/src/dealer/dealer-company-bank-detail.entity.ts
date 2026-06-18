import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class DealerCompanyBankDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  accountName: string;

  @Column({ type: 'text', nullable: true })
  bankName: string;

  @Column({ type: 'text', nullable: true })
  accountNumber: string;

  @Column({ type: 'text', nullable: true })
  ifsc: string;

  @Column({ type: 'text', nullable: true })
  upiId: string;

  @Column({ type: 'text', nullable: true })
  qrCodeUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}