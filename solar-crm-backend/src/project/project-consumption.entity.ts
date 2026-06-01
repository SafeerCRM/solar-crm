import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectConsumption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  projectName: string;

  @Column()
  materialId: number;

  @Column()
  materialName: string;

  @Column({ nullable: true })
  branchId: number;

  @Column({ nullable: true })
  branchName: string;

  @Column({ nullable: true })
  stockItemId: number;

  @Column({ nullable: true })
  stockMovementId: number;

  @Column({ type: 'float', default: 0 })
  quantity: number;

  @Column({ type: 'float', default: 0 })
  rate: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  issuedBy: number;

  @Column({ nullable: true })
  issuedByName: string;

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
}