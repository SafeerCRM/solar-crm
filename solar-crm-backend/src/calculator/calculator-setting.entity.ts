import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CalculatorSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float', default: 1 })
  ratePerWatt: number;

  @Column({ type: 'float', default: 1.05 })
  gstMultiplier: number;

  @Column({ type: 'float', default: 0 })
  ongridRate: number;

  @Column({ type: 'float', default: 0 })
  structureRate: number;

  @Column({ type: 'float', default: 0 })
  electricalRate: number;

  @Column({ type: 'float', default: 50 })
  transportRatePerKm: number;

  @Column({ type: 'float', default: 0 })
  hybridRate: number;

  @Column({ type: 'float', default: 0 })
  batteryRate: number;

  @Column({ type: 'float', default: 0 })
  celronicRate: number;

  @Column({ type: 'float', default: 0 })
  tataRate: number;

  @Column({ type: 'float', default: 0 })
  marginAmount: number;

  @Column({ type: 'float', default: 0 })
  electricityDepartmentCost: number;

  // --- OTHER CHARGES ---
@Column({ type: 'float', default: 0 })
netMeteringCost: number;

@Column({ type: 'float', default: 0 })
installationCharges: number;

@Column({ type: 'float', default: 0 })
labourCharges: number;

@Column({ type: 'float', default: 0 })
governmentFees: number;

// --- ELECTRICAL / BOS ---
@Column({ type: 'float', default: 0 })
wiringCost: number;

@Column({ type: 'float', default: 0 })
mcbCost: number;

@Column({ type: 'float', default: 0 })
dbBoxCost: number;

@Column({ type: 'float', default: 0 })
cablesCost: number;

@Column({ type: 'float', default: 0 })
earthingCost: number;

@Column({ type: 'float', default: 0 })
lightningArrestorCost: number;

@Column({ type: 'float', default: 40 })
structureSqftPerKw: number;
}