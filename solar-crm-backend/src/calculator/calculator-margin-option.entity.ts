import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CalculatorMarginOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  capacityKw: number;

  @Column()
  marginAmount: number;

  @Column({ default: true })
  isActive: boolean;
}