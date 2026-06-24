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

  @Column({ type: 'boolean', default: true })
visibleToDealer: boolean;

@Column({ type: 'boolean', default: false })
visibleToCustomer: boolean;

@Column({ type: 'boolean', default: false })
isHidden: boolean;

@Column({ type: 'timestamp', nullable: true })
hiddenAt: Date;

@Column({ nullable: true })
hiddenBy: number;

@Column({ nullable: true })
hiddenByName: string;

@Column({ type: 'text', nullable: true })
hiddenReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}