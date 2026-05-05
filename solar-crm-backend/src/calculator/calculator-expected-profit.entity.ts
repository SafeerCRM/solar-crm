import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CalculatorExpectedProfit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  capacityKw: number;

  @Column()
  profitAmount: number;

  @Column({ default: true })
  isActive: boolean;
}