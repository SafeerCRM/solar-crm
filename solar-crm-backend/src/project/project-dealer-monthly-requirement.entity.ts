import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectDealerMonthlyRequirement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dealerId: number;

  @Column({ nullable: true })
  dealerName: string;

  @Column()
  materialId: number;

  @Column({ nullable: true })
  materialName: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  unit: string;

  @Column()
  requirementMonth: string;

  @Column({ type: 'float', default: 0 })
  expectedQuantity: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ nullable: true })
  hiddenByName: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}