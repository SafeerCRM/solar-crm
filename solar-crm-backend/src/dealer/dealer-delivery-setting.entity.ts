import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dealer_delivery_setting')
export class DealerDeliverySetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  officeName: string;

  @Column({ type: 'text', nullable: true })
  officeAddress: string;

  @Column({ type: 'numeric', default: 0 })
  baseKm: number;

  @Column({ type: 'numeric', default: 0 })
  baseCharge: number;

  @Column({ type: 'numeric', default: 0 })
  perKmCharge: number;

  @Column({ type: 'numeric', default: 0 })
  minimumCharge: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'float', default: 0 })
warehouseLatitude: number;

@Column({ type: 'float', default: 0 })
warehouseLongitude: number;

@Column({ nullable: true })
warehouseAddress: string;

@Column({ default: true })
autoDeliveryChargeEnabled: boolean;
}