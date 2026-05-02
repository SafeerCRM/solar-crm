import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('calculator_electrical_options')
export class CalculatorElectricalOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float' })
  capacityKw: number;

  @Column({ type: 'float' })
  rate: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}