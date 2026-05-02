import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('calculator_structure_options')
export class CalculatorStructureOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  structureType: 'Rooftop' | 'Tin Shade';

  @Column({ type: 'float' })
  capacityKw: number;

  @Column({ type: 'float' })
  ratePerKw: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}