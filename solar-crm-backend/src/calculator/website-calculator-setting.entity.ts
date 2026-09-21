import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('website_calculator_settings')
export class WebsiteCalculatorSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  // Default electricity tariff shown/used on public website.
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 8 })
  defaultElectricityRate: number;

  // Allow visitor to change electricity tariff.
  @Column({ type: 'boolean', default: true })
  allowElectricityRateEdit: boolean;

  // Estimated monthly generation from 1 kW solar.
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 120 })
  monthlyGenerationPerKw: number;

  // Percentage of consumption we try to cover when recommending capacity.
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 100 })
  recommendedCoveragePercent: number;

  // Roof area assumption used for public estimate.
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 80 })
  roofAreaSqftPerKw: number;

  @Column({ type: 'boolean', default: true })
  showProjectCost: boolean;

  @Column({ type: 'boolean', default: true })
  showMonthlySavings: boolean;

  @Column({ type: 'boolean', default: true })
  showAnnualSavings: boolean;

  @Column({ type: 'boolean', default: true })
  showPaybackPeriod: boolean;

  @Column({ type: 'boolean', default: true })
  showRoofArea: boolean;

  @Column({
    type: 'text',
    default:
      'All calculations are indicative estimates only. Actual generation, project cost, savings and payback may vary based on site conditions, electricity tariff, equipment selection and applicable government policies.',
  })
  disclaimer: string;

  @UpdateDateColumn()
  updatedAt: Date;
}