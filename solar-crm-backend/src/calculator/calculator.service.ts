import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calculator } from './calculator.entity';
import { CreateCalculatorDto } from './dto/create-calculator.dto';
import { CalculatorSetting } from './calculator-setting.entity';
import { CalculatorPanelOption } from './calculator-panel-option.entity';
import { CalculatorOngridOption } from './calculator-ongrid-option.entity';
import { CalculatorStructureOption } from './calculator-structure-option.entity';

@Injectable()
export class CalculatorService {
  constructor(
    @InjectRepository(Calculator)
    private readonly calculatorRepository: Repository<Calculator>,
    @InjectRepository(CalculatorSetting)
private readonly calculatorSettingRepository: Repository<CalculatorSetting>,
@InjectRepository(CalculatorPanelOption)
private readonly panelOptionRepository: Repository<CalculatorPanelOption>,
@InjectRepository(CalculatorOngridOption)
private readonly ongridOptionRepository: Repository<CalculatorOngridOption>,
@InjectRepository(CalculatorStructureOption)
private readonly structureOptionRepository: Repository<CalculatorStructureOption>,
  ) {}

async calculateProjectCost(data: any) {
  const settings = await this.getSettings();

  const numberOfPanels = Number(data?.numberOfPanels || 0);
  const wattPerPanel = Number(data?.wattPerPanel || 0);

  const panelCost =
    settings.ratePerWatt *
    settings.gstMultiplier *
    numberOfPanels *
    wattPerPanel;

  const ongridCost =
    Number(data?.ongridQuantity || 0) * settings.ongridRate;

  const structureCost =
    Number(data?.structureQuantity || 0) * settings.structureRate;

  const electricalCost =
    Number(data?.electricalQuantity || 0) * settings.electricalRate;

  const marginAmount = settings.marginAmount;

  const transportationCost =
    Number(data?.distanceKm || 0) * settings.transportRatePerKm;

  const hybridCost =
    Number(data?.hybridQuantity || 0) * settings.hybridRate;

  const batteryCost =
    Number(data?.batteryQuantity || 0) * settings.batteryRate;

  const celronicCost =
    Number(data?.celronicQuantity || 0) * settings.celronicRate;

  const tataCost =
    Number(data?.tataQuantity || 0) * settings.tataRate;

  const electricityDepartmentCost = settings.electricityDepartmentCost;

  const totalProjectCost =
  panelCost +
  ongridCost +
  structureCost +
  electricalCost +
  marginAmount +
  transportationCost +
  hybridCost +
  batteryCost +
  celronicCost +
  tataCost +
  electricityDepartmentCost +

  // --- OTHER CHARGES ---
  settings.netMeteringCost +
  settings.installationCharges +
  settings.labourCharges +
  settings.governmentFees +

  // --- BOS ---
  settings.wiringCost +
  settings.mcbCost +
  settings.dbBoxCost +
  settings.cablesCost +
  settings.earthingCost +
  settings.lightningArrestorCost;

  return {
    totalProjectCost,
  };
}

async getStructureOptions(type: string) {
  return this.structureOptionRepository.find({
    where: {
      structureType: type as 'Rooftop' | 'Tin Shade',
      isActive: true,
    },
    order: {
      capacityKw: 'ASC',
    },
  });
}

async createStructureOption(data: any) {
  const option = this.structureOptionRepository.create({
    structureType: data.structureType,
    capacityKw: Number(data.capacityKw || 0),
    ratePerKw: Number(data.ratePerKw || 0),
    isActive: data.isActive !== false,
  });

  return this.structureOptionRepository.save(option);
}

async updateStructureOption(id: number, data: any) {
  const option = await this.structureOptionRepository.findOne({
    where: { id },
  });

  if (!option) {
    throw new Error('Structure option not found');
  }

  Object.assign(option, {
    structureType: data.structureType ?? option.structureType,
    capacityKw:
      data.capacityKw !== undefined
        ? Number(data.capacityKw)
        : option.capacityKw,
    ratePerKw:
      data.ratePerKw !== undefined
        ? Number(data.ratePerKw)
        : option.ratePerKw,
    isActive:
      data.isActive !== undefined ? Boolean(data.isActive) : option.isActive,
  });

  return this.structureOptionRepository.save(option);
}

async deleteStructureOption(id: number) {
  await this.structureOptionRepository.delete(id);

  return { message: 'Deleted successfully' };
}


async getOngridOptions(phase: string) {
  return this.ongridOptionRepository.find({
    where: {
      phaseType: phase as '1 Phase' | '3 Phase',
      isActive: true,
    },
    order: {
      capacity: 'ASC',
    },
  });
}

async createOngridOption(data: any) {
  const option = this.ongridOptionRepository.create({
    phaseType: data.phaseType,
    brandName: String(data.brandName || '').trim(),
    capacity: Number(data.capacity || 0),
    rate: Number(data.rate || 0),
    isActive: data.isActive !== false,
  });

  return this.ongridOptionRepository.save(option);
}

async updateOngridOption(id: number, data: any) {
  const option = await this.ongridOptionRepository.findOne({
    where: { id },
  });

  if (!option) {
    throw new Error('Ongrid option not found');
  }

  Object.assign(option, {
    phaseType: data.phaseType ?? option.phaseType,
    brandName:
      data.brandName !== undefined
        ? String(data.brandName || '').trim()
        : option.brandName,
    capacity:
      data.capacity !== undefined
        ? Number(data.capacity || 0)
        : option.capacity,
    rate: data.rate !== undefined ? Number(data.rate || 0) : option.rate,
    isActive:
      data.isActive !== undefined ? Boolean(data.isActive) : option.isActive,
  });

  return this.ongridOptionRepository.save(option);
}

async deleteOngridOption(id: number) {
  await this.ongridOptionRepository.delete(id);

  return { message: 'Deleted successfully' };
}

  async create(dto: CreateCalculatorDto, userId?: number) {
    const calculator = this.calculatorRepository.create({
      ...dto,
      createdBy: userId || null,
    });

    return this.calculatorRepository.save(calculator);
  }

  async findAll() {
    return this.calculatorRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    return this.calculatorRepository.findOne({
      where: { id },
    });
  }

  async findByMeetingId(meetingId: number) {
    return this.calculatorRepository.find({
      where: { meetingId },
      order: { createdAt: 'DESC' },
    });
  }
  async getSettings() {
  let settings = await this.calculatorSettingRepository.findOne({
    where: { id: 1 },
  });

  if (!settings) {
    settings = this.calculatorSettingRepository.create({});
    await this.calculatorSettingRepository.save(settings);
  }

  return settings;
}

async getPanelOptions(
  category: 'DCR' | 'NONDCR',
  type: 'P Type' | 'N Type',
) {
  return this.panelOptionRepository.find({
    where: {
      panelCategory: category,
      panelType: type,
      isActive: true,
    },
    order: {
      capacityWatt: 'ASC',
    },
  });
}

async createPanelOption(data: any) {
  const option = this.panelOptionRepository.create({
    panelCategory: data.panelCategory,
    panelType: data.panelType,
    brandName: String(data.brandName || '').trim(),
    capacityWatt: Number(data.capacityWatt || 0),
    rate: Number(data.rate || 0),
    isActive: data.isActive !== false,
  });

  return this.panelOptionRepository.save(option);
}

async updatePanelOption(id: number, data: any) {
  const option = await this.panelOptionRepository.findOne({
    where: { id },
  });

  if (!option) {
    throw new Error('Panel option not found');
  }

  Object.assign(option, {
    panelCategory: data.panelCategory ?? option.panelCategory,
    panelType: data.panelType ?? option.panelType,
    brandName:
      data.brandName !== undefined
        ? String(data.brandName || '').trim()
        : option.brandName,
    capacityWatt:
      data.capacityWatt !== undefined
        ? Number(data.capacityWatt || 0)
        : option.capacityWatt,
    rate: data.rate !== undefined ? Number(data.rate || 0) : option.rate,
    isActive:
      data.isActive !== undefined ? Boolean(data.isActive) : option.isActive,
  });

  return this.panelOptionRepository.save(option);
}

async deletePanelOption(id: number) {
  const option = await this.panelOptionRepository.findOne({
    where: { id },
  });

  if (!option) {
    throw new Error('Panel option not found');
  }

  await this.panelOptionRepository.delete(id);

  return {
    message: 'Panel option deleted successfully',
  };
}

async updateSettings(data: any) {
  const settings = await this.getSettings();

  Object.assign(settings, {
    ratePerWatt: Number(data?.ratePerWatt ?? settings.ratePerWatt),
    gstMultiplier: Number(data?.gstMultiplier ?? settings.gstMultiplier),
    ongridRate: Number(data?.ongridRate ?? settings.ongridRate),
    structureRate: Number(data?.structureRate ?? settings.structureRate),
    structureSqftPerKw: Number(
  data?.structureSqftPerKw ?? settings.structureSqftPerKw,
),
    electricalRate: Number(data?.electricalRate ?? settings.electricalRate),
    transportRatePerKm: Number(
      data?.transportRatePerKm ?? settings.transportRatePerKm,
    ),
    hybridRate: Number(data?.hybridRate ?? settings.hybridRate),
    batteryRate: Number(data?.batteryRate ?? settings.batteryRate),
    celronicRate: Number(data?.celronicRate ?? settings.celronicRate),
    tataRate: Number(data?.tataRate ?? settings.tataRate),
    marginAmount: Number(data?.marginAmount ?? settings.marginAmount),
    electricityDepartmentCost: Number(
      data?.electricityDepartmentCost ?? settings.electricityDepartmentCost,
    ),
    netMeteringCost: Number(data?.netMeteringCost ?? settings.netMeteringCost),
    installationCharges: Number(
      data?.installationCharges ?? settings.installationCharges,
    ),
    labourCharges: Number(data?.labourCharges ?? settings.labourCharges),
    governmentFees: Number(data?.governmentFees ?? settings.governmentFees),
    wiringCost: Number(data?.wiringCost ?? settings.wiringCost),
    mcbCost: Number(data?.mcbCost ?? settings.mcbCost),
    dbBoxCost: Number(data?.dbBoxCost ?? settings.dbBoxCost),
    cablesCost: Number(data?.cablesCost ?? settings.cablesCost),
    earthingCost: Number(data?.earthingCost ?? settings.earthingCost),
    lightningArrestorCost: Number(
      data?.lightningArrestorCost ?? settings.lightningArrestorCost,
    ),
  });

  return this.calculatorSettingRepository.save(settings);
}
}