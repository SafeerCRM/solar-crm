import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectInsurancePlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  companyName: string;

  @Column({ type: 'varchar', length: 200 })
  policyName: string;

  @Column({ type: 'int' })
  durationMonths: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  price: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  coverageAmount?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  benefits?: string;

  @Column({ type: 'text', nullable: true })
  terms?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'int', nullable: true })
  createdBy?: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  createdByName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}