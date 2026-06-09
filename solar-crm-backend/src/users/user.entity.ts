import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
  OWNER = 'OWNER',
  TELECALLING_MANAGER = 'TELECALLING_MANAGER',
  TELECALLING_ASSISTANT = 'TELECALLING_ASSISTANT',
  LEAD_MANAGER = 'LEAD_MANAGER',
  LEAD_EXECUTIVE = 'LEAD_EXECUTIVE',
  MARKETING_HEAD = 'MARKETING_HEAD',
  MEETING_MANAGER = 'MEETING_MANAGER',
  MEETING_ASSISTANT = 'MEETING_ASSISTANT',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  PROJECT_EXECUTIVE = 'PROJECT_EXECUTIVE',
  CUSTOMER = 'CUSTOMER',
  TELECALLER = 'TELECALLER',
  LOAN_MANAGER = 'LOAN_MANAGER',
ELECTRICITY_MANAGER = 'ELECTRICITY_MANAGER',
SUBSIDY_MANAGER = 'SUBSIDY_MANAGER',
PAYMENT_COLLECTION_EXECUTIVE = 'PAYMENT_COLLECTION_EXECUTIVE',
PAYMENT_MANAGER = 'PAYMENT_MANAGER',
ACCOUNT_MANAGER = 'ACCOUNT_MANAGER',
STOCK_MANAGER = 'STOCK_MANAGER',
MAINTENANCE_MANAGER = 'MAINTENANCE_MANAGER',
CUSTOMER_MANAGER = 'CUSTOMER_MANAGER',
HR_MANAGER = 'HR_MANAGER',
TRADING_MANAGER = 'TRADING_MANAGER',
PROJECT_CONTRACTOR = 'PROJECT_CONTRACTOR',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  roles: UserRole[];

  @Column({ default: false })
isHidden: boolean;

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
}