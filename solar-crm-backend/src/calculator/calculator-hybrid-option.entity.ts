import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CalculatorHybridOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  phase: string;

  @Column()
  brandName: string;

  @Column()
  capacity: number;

  @Column()
  rate: number;

  @Column({ default: true })
  isActive: boolean;
}