import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('calculator_ongrid_options')
export class CalculatorOngridOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  phaseType: '1 Phase' | '3 Phase';

  @Column({ type: 'varchar', length: 100 })
  brandName: string;

  @Column({ type: 'float' })
  capacity: number;

  @Column({ type: 'float' })
  rate: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}