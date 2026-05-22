// solar-crm-backend/src/project/project-material-master.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectMaterialMarginType {
  AMOUNT = 'AMOUNT',
  PERCENT = 'PERCENT',
}

@Entity()
export class ProjectMaterialMaster {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  hsnCode: string;

  @Column({ nullable: true })
  vendorPreferredName: string;

  // Current purchase price / laagat
  @Column({ type: 'float', default: 0 })
  rate: number;

  @Column({ type: 'float', default: 0 })
  gstPercent: number;

  @Column({
    type: 'enum',
    enum: ProjectMaterialMarginType,
    default: ProjectMaterialMarginType.AMOUNT,
  })
  marginType: ProjectMaterialMarginType;

  @Column({ type: 'float', default: 0 })
  expectedMargin: number;

  // Optional direct selling price override
  @Column({ type: 'float', default: 0 })
  sellingRate: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}