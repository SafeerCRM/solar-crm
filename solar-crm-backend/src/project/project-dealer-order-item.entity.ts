import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectDealerOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dealerOrderId: number;

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

  @Column({ nullable: true })
  hsnCode: string;

  @Column({ type: 'float', default: 0 })
  quantity: number;

  @Column({ type: 'float', default: 0 })
  acceptedQuantity: number;

  @Column({ type: 'float', default: 0 })
reservedQuantity: number;

@Column({ type: 'float', default: 0 })
dispatchedQuantity: number;

  @Column({ type: 'float', default: 0 })
  pendingQuantity: number;

  @Column({ type: 'float', default: 0 })
  sellingRate: number;

  @Column({ type: 'text', default: 'MATERIAL' })
itemType: string;

@Column({ nullable: true })
kitId: number;

@Column({ type: 'text', nullable: true })
kitSpecification: string;

  @Column({ type: 'float', default: 0 })
  gstPercent: number;

  @Column({ type: 'float', default: 0 })
  discountAmount: number;

  @Column({ type: 'float', default: 0 })
  subtotalAmount: number;

  @Column({ type: 'float', default: 0 })
  gstAmount: number;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  stockAvailableQuantity: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}