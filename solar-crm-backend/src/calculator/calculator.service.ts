import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calculator } from './calculator.entity';
import { CreateCalculatorDto } from './dto/create-calculator.dto';
import { CalculatorSetting } from './calculator-setting.entity';

@Injectable()
export class CalculatorService {
  constructor(
    @InjectRepository(Calculator)
    private readonly calculatorRepository: Repository<Calculator>,
    @InjectRepository(CalculatorSetting)
private readonly calculatorSettingRepository: Repository<CalculatorSetting>,
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

async updateSettings(data: any) {
  const settings = await this.getSettings();

  Object.assign(settings, {
    ratePerWatt: Number(data?.ratePerWatt ?? settings.ratePerWatt),
    gstMultiplier: Number(data?.gstMultiplier ?? settings.gstMultiplier),
    ongridRate: Number(data?.ongridRate ?? settings.ongridRate),
    structureRate: Number(data?.structureRate ?? settings.structureRate),
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