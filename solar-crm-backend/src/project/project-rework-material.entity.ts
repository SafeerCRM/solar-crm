
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('project_rework_material')
@Index(['reworkId'])
@Index(['projectId'])
export class ProjectReworkMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  reworkId: number;

  @Column({ type: 'integer' })
  projectId: number;

  @Column({ type: 'integer' })
  materialId: number;

  @Column({ type: 'text' })
  materialName: string;

  @Column({ type: 'text', nullable: true })
  unit: string | null;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 3,
    default: 0,
  })
  plannedQuantity: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 3,
    default: 0,
  })
  issuedQuantity: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  issuedCost: number;

  @Column({ type: 'integer', nullable: true })
  stockItemId: number | null;

  @Column({ type: 'integer', nullable: true })
  branchId: number | null;

  @Column({ type: 'text', nullable: true })
  branchName: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'integer', nullable: true })
  createdBy: number | null;

  @Column({ type: 'text', nullable: true })
  createdByName: string | null;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
