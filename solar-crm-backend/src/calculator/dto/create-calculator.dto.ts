import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCalculatorDto {
  @IsOptional()
  @IsNumber()
  meetingId?: number;

  @IsOptional()
  @IsNumber()
  leadId?: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerCity?: string;

  @IsOptional()
  @IsNumber()
  electricityBill?: number;

  @IsOptional()
  @IsString()
  panelCategory?: string;

  @IsOptional()
  @IsString()
  panelType?: string;

  @IsOptional()
  @IsNumber()
  ratePerWatt?: number;

  @IsOptional()
  @IsNumber()
  numberOfPanels?: number;

  @IsOptional()
  @IsNumber()
  wattPerPanel?: number;

  @IsOptional()
  @IsNumber()
  panelCost?: number;

  @IsOptional()
  @IsString()
  ongridBrand?: string;

  @IsOptional()
  @IsNumber()
  ongridWatt?: number;

  @IsOptional()
  @IsNumber()
  ongridQuantity?: number;

  @IsOptional()
  @IsNumber()
  ongridRate?: number;

  @IsOptional()
  @IsNumber()
  ongridCost?: number;

  @IsOptional()
  @IsString()
  structureType?: string;

  @IsOptional()
  @IsNumber()
  structureWatt?: number;

  @IsOptional()
  @IsNumber()
  structureQuantity?: number;

  @IsOptional()
  @IsNumber()
  structureRate?: number;

  @IsOptional()
  @IsNumber()
  structureCost?: number;

  @IsOptional()
  @IsString()
  electricalItemName?: string;

  @IsOptional()
  @IsNumber()
  electricalWatt?: number;

  @IsOptional()
  @IsNumber()
  electricalQuantity?: number;

  @IsOptional()
  @IsNumber()
  electricalRate?: number;

  @IsOptional()
  @IsNumber()
  electricalCost?: number;

  @IsOptional()
  @IsNumber()
  marginWatt?: number;

  @IsOptional()
  @IsNumber()
  marginAmount?: number;

  @IsOptional()
  @IsString()
  transportationRange?: string;

  @IsOptional()
  @IsNumber()
  distanceKm?: number;

  @IsOptional()
  @IsNumber()
  transportationCost?: number;

  @IsOptional()
  @IsString()
  hybridType?: string;

  @IsOptional()
  @IsString()
  hybridPhase?: string;

  @IsOptional()
  @IsNumber()
  hybridQuantity?: number;

  @IsOptional()
  @IsNumber()
  hybridRate?: number;

  @IsOptional()
  @IsNumber()
  hybridCost?: number;

  @IsOptional()
  @IsString()
  batteryType?: string;

  @IsOptional()
  @IsString()
  batteryStrength?: string;

  @IsOptional()
  @IsNumber()
  batteryQuantity?: number;

  @IsOptional()
  @IsNumber()
  batteryRate?: number;

  @IsOptional()
  @IsNumber()
  batteryCost?: number;

  @IsOptional()
  @IsString()
  celronicType?: string;

  @IsOptional()
  @IsNumber()
  celronicQuantity?: number;

  @IsOptional()
  @IsNumber()
  celronicRate?: number;

  @IsOptional()
  @IsNumber()
  celronicCost?: number;

  @IsOptional()
  @IsNumber()
  tataPanelQuantity?: number;

  @IsOptional()
  @IsNumber()
  tataPanelStrengthWatt?: number;

  @IsOptional()
  @IsNumber()
  tataQuantity?: number;

  @IsOptional()
  @IsNumber()
  tataRate?: number;

  @IsOptional()
  @IsNumber()
  tataCost?: number;

  @IsOptional()
  @IsNumber()
  electricityDepartmentCost?: number;

  @IsOptional()
  @IsNumber()
  totalProjectCost?: number;
}