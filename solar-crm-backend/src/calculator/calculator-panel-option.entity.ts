import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('calculator_panel_options')
export class CalculatorPanelOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  panelCategory: 'DCR' | 'NONDCR';

  @Column({ type: 'varchar', length: 20 })
  panelType: 'P Type' | 'N Type';

  @Column({ type: 'varchar', length: 100 })
  brandName: string;

  @Column({ type: 'int' })
  capacityWatt: number;

  @Column({ type: 'float' })
  rate: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}