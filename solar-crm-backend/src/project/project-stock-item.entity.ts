import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectStockItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  materialId: number;

  @Column()
  materialName: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  branchId: number;

  @Column({ nullable: true })
  branchName: string;

  @Column({ type: 'float', default: 0 })
  currentQuantity: number;

  @Column({ type: 'float', default: 0 })
reservedQuantity: number;

  @Column({ type: 'float', default: 0 })
  averageRate: number;

  @Column({ type: 'float', default: 0 })
  stockValue: number;

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

  @Column({ type: 'text', nullable: true })
restoreReason: string;

@Column({ type: 'timestamp', nullable: true })
restoredAt: Date;

@Column({ nullable: true })
restoredBy: number;

@Column({ nullable: true })
restoredByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
dealerVisible: boolean;
}