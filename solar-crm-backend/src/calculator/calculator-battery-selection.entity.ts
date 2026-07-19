import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Calculator } from './calculator.entity';

@Entity('calculator_battery_selections')
export class CalculatorBatterySelection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  calculatorId: number;

  @ManyToOne(
    () => Calculator,
    (calculator) => calculator.batterySelections,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'calculatorId' })
  calculator: Calculator;

  /**
   * Reference to CalculatorBatteryOption master.
   *
   * This is intentionally stored as a normal ID rather than a strict
   * foreign-key relation so that an old calculator remains readable even
   * if a battery option is later hidden or removed from the master.
   */
  @Column({ type: 'int', nullable: true })
  batteryOptionId?: number | null;

  /**
   * Snapshot fields preserve exactly what was selected when the calculator
   * was saved.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  batteryType?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brandName?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  capacity: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  rate: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalCost: number;

  @CreateDateColumn()
  createdAt: Date;
}