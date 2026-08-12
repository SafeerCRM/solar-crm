import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum InsuranceReminderType {
  ADMIN_7_DAY = 'ADMIN_7_DAY',
  ADMIN_EXPIRY_DAY = 'ADMIN_EXPIRY_DAY',
  CUSTOMER_7_DAY = 'CUSTOMER_7_DAY',
}

@Entity()
@Index(['insuranceId', 'reminderType'], { unique: true })
export class ProjectInsuranceReminderLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  insuranceId: number;

  @Column({
    type: 'enum',
    enum: InsuranceReminderType,
  })
  reminderType: InsuranceReminderType;

  @Column({ type: 'date' })
  expiryDate: Date;

  @CreateDateColumn()
  sentAt: Date;
}