import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calculator } from './calculator.entity';
import { CreateCalculatorDto } from './dto/create-calculator.dto';
import { CalculatorSetting } from './calculator-setting.entity';
import { CalculatorPanelOption } from './calculator-panel-option.entity';
import { CalculatorOngridOption } from './calculator-ongrid-option.entity';
import { CalculatorStructureOption } from './calculator-structure-option.entity';
import { CalculatorElectricalOption } from './calculator-electrical-option.entity';
import { CalculatorMarginOption } from './calculator-margin-option.entity';
import { CalculatorHybridOption } from './calculator-hybrid-option.entity';
import { CalculatorBatteryOption } from './calculator-battery-option.entity';
import { CalculatorKitOption } from './calculator-kit-option.entity';
import { CalculatorExpectedProfit } from './calculator-expected-profit.entity';
import { CalculatorDiscountOption } from './calculator-discount-option.entity';

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
@InjectRepository(CalculatorElectricalOption)
private readonly electricalOptionRepository: Repository<CalculatorElectricalOption>,
@InjectRepository(CalculatorMarginOption)
private readonly marginOptionRepository: Repository<CalculatorMarginOption>,
@InjectRepository(CalculatorHybridOption)
private readonly hybridOptionRepository: Repository<CalculatorHybridOption>,
@InjectRepository(CalculatorBatteryOption)
private readonly batteryOptionRepository: Repository<CalculatorBatteryOption>,
@InjectRepository(CalculatorKitOption)
private readonly kitOptionRepository: Repository<CalculatorKitOption>,
@InjectRepository(CalculatorExpectedProfit)
private readonly expectedProfitRepository: Repository<CalculatorExpectedProfit>,
@InjectRepository(CalculatorDiscountOption)
private readonly discountOptionRepository: Repository<CalculatorDiscountOption>,
  ) {}
private getHighestCalculatorRole(roles: string[] = []) {
  const priority = [
    'OWNER',
    'MARKETING_HEAD',
    'PROJECT_MANAGER',
    'MEETING_MANAGER',
    'LEAD_MANAGER',
    'TELECALLING_MANAGER',
    'PROJECT_EXECUTIVE',
    'LEAD_EXECUTIVE',
    'TELECALLING_ASSISTANT',
    'TELECALLER',
  ];

  for (const role of priority) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return roles[0] || 'TELECALLER';
}


async calculateProjectCost(data: any, user?: any) {
  const settings = await this.getSettings();

  // ===== SELECTED OPTIONS =====
  const panelOption = data?.panelOptionId
    ? await this.panelOptionRepository.findOne({
        where: { id: Number(data.panelOptionId) },
      })
    : null;

  const ongridOption = data?.ongridOptionId
    ? await this.ongridOptionRepository.findOne({
        where: { id: Number(data.ongridOptionId) },
      })
    : null;

  const structureOption = data?.structureOptionId
    ? await this.structureOptionRepository.findOne({
        where: { id: Number(data.structureOptionId) },
      })
    : null;

  const electricalOption = data?.electricalOptionId
    ? await this.electricalOptionRepository.findOne({
        where: { id: Number(data.electricalOptionId) },
      })
    : null;

  const hybridOption = data?.hybridOptionId
    ? await this.hybridOptionRepository.findOne({
        where: { id: Number(data.hybridOptionId) },
      })
    : null;

  const batteryOption = data?.batteryOptionId
    ? await this.batteryOptionRepository.findOne({
        where: { id: Number(data.batteryOptionId) },
      })
    : null;

  const kitOption = data?.kitOptionId
    ? await this.kitOptionRepository.findOne({
        where: { id: Number(data.kitOptionId) },
      })
    : null;

  const numberOfPanels = Number(data?.numberOfPanels || 0);
  const wattPerPanel = Number(data?.wattPerPanel || 0);

  // ===== RATES WITH SAFE FALLBACK =====
  const panelRate = Number(panelOption?.rate ?? settings.ratePerWatt ?? 0);
  const ongridRate = Number(ongridOption?.rate ?? settings.ongridRate ?? 0);
  const structureRate = Number(
    structureOption?.ratePerKw ?? settings.structureRate ?? 0,
  );
  const electricalRate = Number(
    electricalOption?.rate ?? settings.electricalRate ?? 0,
  );
  const hybridRate = Number(hybridOption?.rate ?? settings.hybridRate ?? 0);
  const batteryRate = Number(batteryOption?.rate ?? settings.batteryRate ?? 0);
  const kitRate = Number(kitOption?.rate ?? settings.tataRate ?? 0);

  // ===== COSTS =====
  const panelCost =
    panelRate *
    Number(settings.gstMultiplier || 1) *
    numberOfPanels *
    wattPerPanel;

  const ongridCost = Number(data?.ongridQuantity || 0) * ongridRate;

  const structureCost =
    Number(data?.structureQuantity || 0) * structureRate;

  const electricalCost =
    Number(data?.electricalQuantity || 0) * electricalRate;

  const transportationCost =
    Number(data?.distanceKm || 0) *
    Number(settings.transportRatePerKm || 0);

  const hybridCost = Number(data?.hybridQuantity || 0) * hybridRate;

  const batteryCost = Number(data?.batteryQuantity || 0) * batteryRate;

  const tataCost = Number(data?.tataQuantity || 0) * kitRate;

  // ===== MARGIN =====
  const marginCapacityKw = Number(data?.marginWatt || 0);
  const marginOptions = await this.getMarginOptions();

  let marginAmount = 0;

  for (const option of marginOptions) {
    if (marginCapacityKw >= Number(option.capacityKw || 0)) {
      marginAmount = Number(option.marginAmount || 0);
    }
  }

  const electricityDepartmentCost = Number(
    settings.electricityDepartmentCost || 0,
  );

  // ===== EXPECTED PROFIT =====
const projectCapacityKw =
  (Number(data?.numberOfPanels || 0) * Number(data?.wattPerPanel || 0)) / 1000;

  const requiredArea =
  projectCapacityKw * Number(settings.structureSqftPerKw || 0);

const expectedProfitOptions = await this.getExpectedProfitOptions();

let expectedProfit = 0;

for (const option of expectedProfitOptions) {
  if (projectCapacityKw >= Number(option.capacityKw || 0)) {
    expectedProfit = Number(option.profitAmount || 0);
  }
}

// ===== DISCOUNT AUTO LIMIT =====
const requestedDiscount = Number(data?.discountAmount || 0);
const userRoles = Array.isArray(user?.roles) ? user.roles : [];
const highestRole = this.getHighestCalculatorRole(userRoles);

const discountOptions = await this.getDiscountOptions();

let maxAllowedDiscount = 0;

for (const option of discountOptions) {
  if (
    option.role === highestRole &&
    projectCapacityKw >= Number(option.capacityKw || 0)
  ) {
    maxAllowedDiscount = Number(option.discountAmount || 0);
  }
}

const appliedDiscount =
  requestedDiscount > maxAllowedDiscount
    ? maxAllowedDiscount
    : requestedDiscount;

const discountAdjusted = requestedDiscount > maxAllowedDiscount;

  const totalProjectCost =
    panelCost +
    ongridCost +
    structureCost +
    electricalCost +
    marginAmount +
    transportationCost +
    hybridCost +
    batteryCost +
    tataCost +
    electricityDepartmentCost +
    Number(settings.netMeteringCost || 0) +
    Number(settings.installationCharges || 0) +
    Number(settings.labourCharges || 0) +
    Number(settings.governmentFees || 0) +
    Number(settings.wiringCost || 0) +
    Number(settings.mcbCost || 0) +
    Number(settings.dbBoxCost || 0) +
    Number(settings.cablesCost || 0) +
    Number(settings.earthingCost || 0) +
    Number(settings.lightningArrestorCost || 0);

    const finalCost = Math.max(totalProjectCost - appliedDiscount, 0);

  return {
  totalProjectCost,
  expectedProfit,
  requiredArea,
  projectCapacityKw,
  maxAllowedDiscount,
  appliedDiscount,
  discountAdjusted,
  finalCost,

  breakdown: {
      panelCost,
      ongridCost,
      structureCost,
      electricalCost,
      marginAmount,
      transportationCost,
      hybridCost,
      batteryCost,
      tataCost,
      electricityDepartmentCost,
    },
  };
}

async getDiscountOptions() {
  return this.discountOptionRepository.find({
    order: { capacityKw: 'ASC' },
  });
}

async createDiscountOption(data: any) {
  const option = this.discountOptionRepository.create({
    role: data.role,
    capacityKw: Number(data.capacityKw || 0),
    discountAmount: Number(data.discountAmount || 0),
  });

  return this.discountOptionRepository.save(option);
}

async updateDiscountOption(id: number, data: any) {
  const option = await this.discountOptionRepository.findOne({ where: { id } });

  if (!option) throw new Error('Discount option not found');

  Object.assign(option, {
    role: data.role ?? option.role,
    capacityKw:
      data.capacityKw !== undefined
        ? Number(data.capacityKw)
        : option.capacityKw,
    discountAmount:
      data.discountAmount !== undefined
        ? Number(data.discountAmount)
        : option.discountAmount,
  });

  return this.discountOptionRepository.save(option);
}

async deleteDiscountOption(id: number) {
  await this.discountOptionRepository.delete(id);
  return { message: 'Deleted successfully' };
}

async getExpectedProfitOptions() {
  return this.expectedProfitRepository.find({
    order: { capacityKw: 'ASC' },
  });
}

async createExpectedProfitOption(data: any) {
  const option = this.expectedProfitRepository.create({
    capacityKw: Number(data.capacityKw || 0),
    profitAmount: Number(data.profitAmount || 0),
  });

  return this.expectedProfitRepository.save(option);
}

async updateExpectedProfitOption(id: number, data: any) {
  const option = await this.expectedProfitRepository.findOne({ where: { id } });

  if (!option) throw new Error('Expected profit option not found');

  Object.assign(option, {
    capacityKw:
      data.capacityKw !== undefined
        ? Number(data.capacityKw)
        : option.capacityKw,
    profitAmount:
      data.profitAmount !== undefined
        ? Number(data.profitAmount)
        : option.profitAmount,
  });

  return this.expectedProfitRepository.save(option);
}

async deleteExpectedProfitOption(id: number) {
  await this.expectedProfitRepository.delete(id);
  return { message: 'Deleted successfully' };
}

async getKitOptions() {
  return this.kitOptionRepository.find({
    order: { capacity: 'ASC' },
  });
}

async createKitOption(data: any) {
  const option = this.kitOptionRepository.create({
    brandName: data.brandName,
    capacity: Number(data.capacity || 0),
    rate: Number(data.rate || 0),
  });

  return this.kitOptionRepository.save(option);
}

async updateKitOption(id: number, data: any) {
  const option = await this.kitOptionRepository.findOne({ where: { id } });

  if (!option) throw new Error('Kit option not found');

  Object.assign(option, {
    brandName: data.brandName ?? option.brandName,
    capacity:
      data.capacity !== undefined ? Number(data.capacity) : option.capacity,
    rate: data.rate !== undefined ? Number(data.rate) : option.rate,
  });

  return this.kitOptionRepository.save(option);
}

async deleteKitOption(id: number) {
  await this.kitOptionRepository.delete(id);
  return { message: 'Deleted successfully' };
}

async getBatteryOptions(type?: string) {
  return this.batteryOptionRepository.find({
    where: type ? { type } : {},
    order: { capacity: 'ASC' },
  });
}

async createBatteryOption(data: any) {
  const option = this.batteryOptionRepository.create({
    type: data.type,
    brandName: data.brandName,
    capacity: Number(data.capacity || 0),
    rate: Number(data.rate || 0),
  });

  return this.batteryOptionRepository.save(option);
}

async updateBatteryOption(id: number, data: any) {
  const option = await this.batteryOptionRepository.findOne({ where: { id } });

  if (!option) throw new Error('Battery option not found');

  Object.assign(option, {
    type: data.type ?? option.type,
    brandName: data.brandName ?? option.brandName,
    capacity:
      data.capacity !== undefined ? Number(data.capacity) : option.capacity,
    rate: data.rate !== undefined ? Number(data.rate) : option.rate,
  });

  return this.batteryOptionRepository.save(option);
}

async deleteBatteryOption(id: number) {
  await this.batteryOptionRepository.delete(id);
  return { message: 'Deleted successfully' };
}

async getHybridOptions(phase?: string) {
  return this.hybridOptionRepository.find({
    where: phase ? { phase } : {},
    order: { capacity: 'ASC' },
  });
}

async createHybridOption(data: any) {
  const option = this.hybridOptionRepository.create({
    phase: data.phase,
    brandName: data.brandName,
    capacity: Number(data.capacity || 0),
    rate: Number(data.rate || 0),
  });

  return this.hybridOptionRepository.save(option);
}

async updateHybridOption(id: number, data: any) {
  const option = await this.hybridOptionRepository.findOne({ where: { id } });

  if (!option) throw new Error('Hybrid option not found');

  Object.assign(option, {
    phase: data.phase ?? option.phase,
    brandName: data.brandName ?? option.brandName,
    capacity:
      data.capacity !== undefined ? Number(data.capacity) : option.capacity,
    rate: data.rate !== undefined ? Number(data.rate) : option.rate,
  });

  return this.hybridOptionRepository.save(option);
}

async deleteHybridOption(id: number) {
  await this.hybridOptionRepository.delete(id);
  return { message: 'Deleted successfully' };
}

async getMarginOptions() {
  return this.marginOptionRepository.find({
    order: { capacityKw: 'ASC' },
  });
}

async createMarginOption(data: any) {
  const option = this.marginOptionRepository.create({
    capacityKw: Number(data.capacityKw || 0),
    marginAmount: Number(data.marginAmount || 0),
    isActive: data.isActive !== false,
  });

  return this.marginOptionRepository.save(option);
}

async updateMarginOption(id: number, data: any) {
  const option = await this.marginOptionRepository.findOne({ where: { id } });

  if (!option) throw new Error('Margin option not found');

  Object.assign(option, {
    capacityKw:
      data.capacityKw !== undefined
        ? Number(data.capacityKw)
        : option.capacityKw,
    marginAmount:
      data.marginAmount !== undefined
        ? Number(data.marginAmount)
        : option.marginAmount,
  });

  return this.marginOptionRepository.save(option);
}

async deleteMarginOption(id: number) {
  await this.marginOptionRepository.delete(id);
  return { message: 'Deleted successfully' };
}

async getElectricalOptions() {
  return this.electricalOptionRepository.find({
    where: {
      isActive: true,
    },
    order: {
      capacityKw: 'ASC',
    },
  });
}

async createElectricalOption(data: any) {
  const option = this.electricalOptionRepository.create({
    itemName: String(data.itemName || '').trim(),
    capacityKw: Number(data.capacityKw || 0),
    rate: Number(data.rate || 0),
    isActive: data.isActive !== false,
  });

  return this.electricalOptionRepository.save(option);
}

async updateElectricalOption(id: number, data: any) {
  const option = await this.electricalOptionRepository.findOne({
    where: { id },
  });

  if (!option) {
    throw new Error('Electrical option not found');
  }

  Object.assign(option, {
  itemName:
    data.itemName !== undefined
      ? String(data.itemName || '').trim()
      : option.itemName,
  capacityKw:
      data.capacityKw !== undefined
        ? Number(data.capacityKw)
        : option.capacityKw,
    rate: data.rate !== undefined ? Number(data.rate) : option.rate,
    isActive:
      data.isActive !== undefined ? Boolean(data.isActive) : option.isActive,
  });

  return this.electricalOptionRepository.save(option);
}

async deleteElectricalOption(id: number) {
  await this.electricalOptionRepository.delete(id);

  return { message: 'Deleted successfully' };
}

async getStructureOptions(type?: string) {
  const where: any = {
    isActive: true,
  };

  if (type) {
    where.structureType = type as 'Rooftop' | 'Tin Shade';
  }

  return this.structureOptionRepository.find({
    where,
    order: {
      structureType: 'ASC',
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