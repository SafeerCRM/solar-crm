import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('calculators')
export class Calculator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  meetingId?: number | null;

  @Column({ type: 'int', nullable: true })
  leadId?: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerName?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  customerPhone?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerCity?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  electricityBill: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  panelCategory?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  panelType?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ratePerWatt: number;

  @Column({ type: 'int', default: 0 })
  numberOfPanels: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  wattPerPanel: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  panelCost: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ongridBrand?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ongridWatt: number;

  @Column({ type: 'int', default: 0 })
  ongridQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ongridRate: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  ongridCost: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  structureType?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  structureWatt: number;

  @Column({ type: 'int', default: 0 })
  structureQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  structureRate: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  structureCost: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  electricalItemName?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  electricalWatt: number;

  @Column({ type: 'int', default: 0 })
  electricalQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  electricalRate: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  electricalCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  marginWatt: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  marginAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  transportationRange?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  distanceKm: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  transportationCost: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hybridType?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  hybridPhase?: string | null;

  @Column({ type: 'int', default: 0 })
  hybridQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  hybridRate: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  hybridCost: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  batteryType?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  batteryStrength?: string | null;

  @Column({ type: 'int', default: 0 })
  batteryQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  batteryRate: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  batteryCost: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  celronicType?: string | null;

  @Column({ type: 'int', default: 0 })
  celronicQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  celronicRate: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  celronicCost: number;

  @Column({ type: 'int', default: 0 })
  tataPanelQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tataPanelStrengthWatt: number;

  @Column({ type: 'int', default: 0 })
  tataQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tataRate: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  tataCost: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  electricityDepartmentCost: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  totalProjectCost: number;

  @Column({ type: 'int', nullable: true })
  createdBy?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ===== SELECTED OPTION IDS (IMPORTANT FOR TRACKING) =====

@Column({ type: 'int', nullable: true })
panelOptionId?: number | null;

@Column({ type: 'int', nullable: true })
ongridOptionId?: number | null;

@Column({ type: 'int', nullable: true })
structureOptionId?: number | null;

@Column({ type: 'int', nullable: true })
electricalOptionId?: number | null;

@Column({ type: 'int', nullable: true })
hybridOptionId?: number | null;

@Column({ type: 'int', nullable: true })
batteryOptionId?: number | null;

@Column({ type: 'int', nullable: true })
kitOptionId?: number | null;

@Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
expectedProfit?: number;

@Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
discountAmount?: number;

@Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
appliedDiscount?: number;

@Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
finalCost?: number;
}