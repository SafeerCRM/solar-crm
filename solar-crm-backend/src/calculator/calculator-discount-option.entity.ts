import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CalculatorDiscountOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  role: string; // TELECALLER, LEAD_MANAGER, etc.

  @Column()
  capacityKw: number;

  @Column()
  discountAmount: number;

  @Column({ default: true })
  isActive: boolean;
}