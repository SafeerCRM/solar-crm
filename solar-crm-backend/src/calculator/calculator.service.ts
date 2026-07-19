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
import { CalculatorBatterySelection } from './calculator-battery-selection.entity';
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
@InjectRepository(CalculatorBatterySelection)
private readonly batterySelectionRepository: Repository<CalculatorBatterySelection>,
@InjectRepository(CalculatorKitOption)
private readonly kitOptionRepository: Repository<CalculatorKitOption>,
@InjectRepository(CalculatorExpectedProfit)
private readonly expectedProfitRepository: Repository<CalculatorExpectedProfit>,
@InjectRepository(CalculatorDiscountOption)
private readonly discountOptionRepository: Repository<CalculatorDiscountOption>,
  ) {}

  private async resolveBatterySelections(data: any): Promise<{
  rows: Array<{
    batteryOptionId: number;
    batteryType: string;
    brandName: string;
    capacity: number;
    quantity: number;
    rate: number;
    totalCost: number;
  }>;
  totalCost: number;
}> {
  const requestedSelections = Array.isArray(data?.batterySelections)
    ? data.batterySelections
    : [];

  /*
   * New multi-battery request.
   */
  if (requestedSelections.length > 0) {
    const mergedQuantities = new Map<number, number>();

    for (const selection of requestedSelections) {
      const batteryOptionId = Number(selection?.batteryOptionId || 0);
      const quantity = Math.max(Number(selection?.quantity || 0), 1);

      if (!batteryOptionId) {
        continue;
      }

      mergedQuantities.set(
        batteryOptionId,
        Number(mergedQuantities.get(batteryOptionId) || 0) + quantity,
      );
    }

    const rows: Array<{
      batteryOptionId: number;
      batteryType: string;
      brandName: string;
      capacity: number;
      quantity: number;
      rate: number;
      totalCost: number;
    }> = [];

    for (const [batteryOptionId, quantity] of mergedQuantities.entries()) {
      const option = await this.batteryOptionRepository.findOne({
        where: {
          id: batteryOptionId,
        },
      });

      if (!option) {
        throw new Error(
          `Battery option ${batteryOptionId} was not found`,
        );
      }

      const rate = Number(option.rate || 0);
      const totalCost = rate * quantity;

      rows.push({
        batteryOptionId: Number(option.id),
        batteryType: String(option.type || ''),
        brandName: String(option.brandName || ''),
        capacity: Number(option.capacity || 0),
        quantity,
        rate,
        totalCost,
      });
    }

    return {
      rows,
      totalCost: rows.reduce(
        (sum, row) => sum + Number(row.totalCost || 0),
        0,
      ),
    };
  }

  /*
   * Backward-compatible single-battery request.
   */
  const legacyBatteryOptionId = Number(data?.batteryOptionId || 0);

  if (!legacyBatteryOptionId) {
    return {
      rows: [],
      totalCost: 0,
    };
  }

  const option = await this.batteryOptionRepository.findOne({
    where: {
      id: legacyBatteryOptionId,
    },
  });

  if (!option) {
    throw new Error(
      `Battery option ${legacyBatteryOptionId} was not found`,
    );
  }

  const quantity = Math.max(Number(data?.batteryQuantity || 1), 1);
  const rate = Number(option.rate || 0);
  const totalCost = rate * quantity;

  return {
    rows: [
      {
        batteryOptionId: Number(option.id),
        batteryType: String(option.type || ''),
        brandName: String(option.brandName || ''),
        capacity: Number(option.capacity || 0),
        quantity,
        rate,
        totalCost,
      },
    ],
    totalCost,
  };
}

private getHighestCalculatorRole(roles: string[] = []) {
  const priority = [
  'OWNER',
  'MARKETING_HEAD',

  'PROJECT_MANAGER',
  'SOLAR_FRANCHISE',
  'MEETING_MANAGER',
  'LEAD_MANAGER',
  'TELECALLING_MANAGER',

  'PROJECT_EXECUTIVE',
  'MEETING_ASSISTANT',
  'LEAD_EXECUTIVE',
  'TELECALLING_ASSISTANT',
  'TELECALLER',

  'LOAN_MANAGER',
  'SUBSIDY_MANAGER',
  'ELECTRICITY_MANAGER',

  'PAYMENT_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'ACCOUNT_MANAGER',

  'STOCK_MANAGER',
  'TRADING_MANAGER',
  'CUSTOMER_MANAGER',
  'MAINTENANCE_MANAGER',
  'HR_MANAGER',

  'PROJECT_CONTRACTOR',
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
  const kitRate = Number(kitOption?.rate ?? settings.tataRate ?? 0);

  // ===== COSTS =====
  const panelCost =
    panelRate *
    Number(settings.gstMultiplier || 1) *
    numberOfPanels *
    wattPerPanel;

  const ongridCapacityKw = Number(ongridOption?.capacity || data?.ongridWatt || 0);
const structureCapacityKw = Number(
  structureOption?.capacityKw || data?.structureWatt || 0,
);
const electricalCapacityKw = Number(
  electricalOption?.capacityKw || data?.electricalWatt || 0,
);
const hybridCapacityKw = Number(hybridOption?.capacity || 0);

const kitCapacity = Number(kitOption?.capacity || 0);

const ongridCost =
  ongridRate * Number(data?.ongridQuantity || 1);

const structureCost =
  structureRate * Number(data?.structureQuantity || 1);

const electricalCost =
  electricalRate * Number(data?.electricalQuantity || 1);

  const transportationCost =
  Number(data?.distanceKm || 0) *
  Number(settings.transportRatePerKm || 0);

const hybridCost =
  hybridRate * Number(data?.hybridQuantity || 1);

const resolvedBatteries =
  await this.resolveBatterySelections(data);

const batteryCost = Number(
  resolvedBatteries.totalCost || 0,
);

const tataCost =
  kitRate * Number(data?.tataQuantity || 1);

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

// ✅ Base cost (without margin)
const baseCostBeforeMargin =
  panelCost +
  ongridCost +
  structureCost +
  electricalCost +
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

// ✅ Add margin
const totalProjectCost =
  baseCostBeforeMargin + Number(marginAmount || 0);

const finalCost = Math.max(totalProjectCost - appliedDiscount, 0);

return {
  baseCostBeforeMargin,
  marginAmount,
  totalProjectCost,
  expectedProfit,
  requiredArea,
  projectCapacityKw,
  maxAllowedDiscount,
  appliedDiscount,
  discountAdjusted,
  finalCost,
    batterySelections: resolvedBatteries.rows,

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
  const {
    batterySelections = [],
    ...calculatorData
  } = dto;

  const resolvedBatteries =
    await this.resolveBatterySelections({
      ...calculatorData,
      batterySelections,
    });

  const firstBattery =
    resolvedBatteries.rows.length > 0
      ? resolvedBatteries.rows[0]
      : null;

  /*
   * Existing singular fields are preserved using the first selected
   * battery so old reports and old proposal fallback logic keep working.
   */
  const calculator = this.calculatorRepository.create({
    ...calculatorData,

    batteryOptionId:
      firstBattery?.batteryOptionId ??
      calculatorData.batteryOptionId ??
      null,

    batteryType:
      firstBattery?.batteryType ??
      calculatorData.batteryType ??
      null,

    batteryStrength:
      firstBattery
        ? String(firstBattery.capacity)
        : calculatorData.batteryStrength ?? null,

    batteryQuantity:
      firstBattery?.quantity ??
      Number(calculatorData.batteryQuantity || 0),

    batteryRate:
      firstBattery?.rate ??
      Number(calculatorData.batteryRate || 0),

    /*
     * The legacy calculator-level batteryCost now stores the total cost
     * of every selected battery row.
     */
    batteryCost:
      resolvedBatteries.rows.length > 0
        ? resolvedBatteries.totalCost
        : Number(calculatorData.batteryCost || 0),

    createdBy: userId || null,
  });

  const savedCalculator =
    await this.calculatorRepository.save(calculator);

  if (resolvedBatteries.rows.length > 0) {
    const selectionEntities =
      resolvedBatteries.rows.map((row) =>
        this.batterySelectionRepository.create({
          calculatorId: savedCalculator.id,
          batteryOptionId: row.batteryOptionId,
          batteryType: row.batteryType,
          brandName: row.brandName,
          capacity: row.capacity,
          quantity: row.quantity,
          rate: row.rate,
          totalCost: row.totalCost,
        }),
      );

    await this.batterySelectionRepository.save(
      selectionEntities,
    );
  }

  const savedBatterySelections =
    await this.batterySelectionRepository.find({
      where: {
        calculatorId: savedCalculator.id,
      },
      order: {
        id: 'ASC',
      },
    });

  return {
    ...savedCalculator,
    batterySelections: savedBatterySelections,
  };
}

  async findAll() {
  return this.calculatorRepository.find({
    relations: {
      batterySelections: true,
    },
    order: {
      createdAt: 'DESC',
      batterySelections: {
        id: 'ASC',
      },
    },
  });
}

  async findOne(id: number) {
  return this.calculatorRepository.findOne({
    where: {
      id,
    },
    relations: {
      batterySelections: true,
    },
    order: {
      batterySelections: {
        id: 'ASC',
      },
    },
  });
}

  async findByMeetingId(meetingId: number) {
  const calculators =
  await this.calculatorRepository.find({
    where: {
      meetingId,
    },
    relations: {
      batterySelections: true,
    },
    order: {
      createdAt: 'DESC',
      batterySelections: {
        id: 'ASC',
      },
    },
  });

  const enrichedCalculators: any[] = [];

  for (const calculator of calculators) {
    const recalculated = await this.calculateProjectCost(
      {
        ...calculator,
        discountAmount:
          Number((calculator as any).discountAmount || 0),
      },
    );

    enrichedCalculators.push({
      ...calculator,
      baseCostBeforeMargin:
        recalculated.baseCostBeforeMargin,
      marginAmount:
        recalculated.marginAmount,
      totalProjectCost:
        recalculated.totalProjectCost,
      expectedProfit:
        recalculated.expectedProfit,
      appliedDiscount:
        recalculated.appliedDiscount,
      finalCost:
        recalculated.finalCost,
    });
  }

  return enrichedCalculators;
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

    availableQuantity: Number(data.availableQuantity || 0),
    expectedDate:
      String(data.expectedDate || '').trim() || (null as any),
    availabilityNote:
      String(data.availabilityNote || '').trim(),

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
    availableQuantity:
  data.availableQuantity !== undefined
    ? Number(data.availableQuantity || 0)
    : option.availableQuantity,

expectedDate:
  data.expectedDate !== undefined
    ? String(data.expectedDate || '').trim() || (null as any)
    : option.expectedDate,

availabilityNote:
  data.availabilityNote !== undefined
    ? String(data.availabilityNote || '').trim()
    : option.availabilityNote,
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