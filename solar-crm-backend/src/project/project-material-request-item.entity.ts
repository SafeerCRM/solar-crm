import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProjectMaterialPurchaseStatus {
  PENDING = 'PENDING',
  PARTIALLY_PURCHASED = 'PARTIALLY_PURCHASED',
  PURCHASED = 'PURCHASED',
}

export enum ProjectMaterialIssueStatus {
  PENDING = 'PENDING',
  PARTIALLY_ISSUED = 'PARTIALLY_ISSUED',
  ISSUED = 'ISSUED',
}

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
reservedQuantity: number;

  @Column({ type: 'float', default: 0 })
purchasedQuantity: number;

@Column({ type: 'float', default: 0 })
pendingQuantity: number;

@Column({
  type: 'enum',
  enum: ProjectMaterialPurchaseStatus,
  default: ProjectMaterialPurchaseStatus.PENDING,
})
purchaseStatus: ProjectMaterialPurchaseStatus;

@Column({ type: 'timestamp', nullable: true })
purchasedAt: Date;

@Column({ nullable: true })
purchasedBy: number;

@Column({ nullable: true })
purchasedByName: string;

  @Column({ type: 'float', default: 0 })
  gstPercent: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'float', default: 0 })
issuedQuantity: number;

@Column({ type: 'float', default: 0 })
issuePendingQuantity: number;

@Column({
  type: 'enum',
  enum: ProjectMaterialIssueStatus,
  default: ProjectMaterialIssueStatus.PENDING,
})
issueStatus: ProjectMaterialIssueStatus;

@Column({ type: 'timestamp', nullable: true })
issuedAt: Date;

@Column({ nullable: true })
issuedBy: number;

@Column({ nullable: true })
issuedByName: string;

  @CreateDateColumn()
  createdAt: Date;
}