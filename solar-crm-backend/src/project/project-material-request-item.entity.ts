import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectMaterialRequestItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requestId: number;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  materialId: number;

  @Column()
  materialName: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ type: 'float', default: 0 })
  rate: number;

  @Column({ type: 'float', default: 0 })
  quantity: number;

  @Column({ type: 'float', default: 0 })
  gstPercent: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}