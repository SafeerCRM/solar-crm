import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ProjectStockMovementType {
  RECEIVE = 'RECEIVE',
  ISSUE = 'ISSUE',
  RESERVE = 'RESERVE',
RELEASE_RESERVED = 'RELEASE_RESERVED',
ISSUE_FROM_AVAILABLE = 'ISSUE_FROM_AVAILABLE',
ISSUE_FROM_RESERVED = 'ISSUE_FROM_RESERVED',
TRANSFER_OUT_FROM_AVAILABLE =
  'TRANSFER_OUT_FROM_AVAILABLE',

TRANSFER_OUT_FROM_RESERVED =
  'TRANSFER_OUT_FROM_RESERVED',
  ADJUST_IN = 'ADJUST_IN',
  ADJUST_OUT = 'ADJUST_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

@Entity()
export class ProjectStockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  stockItemId: number;

  @Column()
  materialId: number;

  @Column()
  materialName: string;

  @Column({ nullable: true })
  branchId: number;

  @Column({ nullable: true })
  branchName: string;

  @Column({
    type: 'enum',
    enum: ProjectStockMovementType,
  })
  movementType: ProjectStockMovementType;

  @Column({ type: 'float', default: 0 })
  quantity: number;

  @Column({ type: 'float', default: 0 })
  rate: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  sourceType: string;

  @Column({ nullable: true })
  sourceId: number;

  @Column({ nullable: true })
dealerId: number;

@Column({ nullable: true })
dealerName: string;

@Column({ nullable: true })
dealerPhone: string;

  @Column({ nullable: true })
  projectId: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

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
}