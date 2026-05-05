import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CalculatorKitOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  brandName: string;

  @Column()
  capacity: number;

  @Column()
  rate: number;

  @Column({ default: true })
  isActive: boolean;
}