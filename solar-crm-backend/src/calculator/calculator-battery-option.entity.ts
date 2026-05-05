import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CalculatorBatteryOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string; // Lead Acid / Lithium-ion

  @Column()
  brandName: string;

  @Column()
  capacity: number;

  @Column()
  rate: number;

  @Column({ default: true })
  isActive: boolean;
}