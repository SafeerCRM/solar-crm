import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calculator } from './calculator.entity';
import { CreateCalculatorDto } from './dto/create-calculator.dto';

@Injectable()
export class CalculatorService {
  constructor(
    @InjectRepository(Calculator)
    private readonly calculatorRepository: Repository<Calculator>,
  ) {}

calculateProjectCost(data: any) {
  const ratePerWatt = Number(data?.ratePerWatt || 0);
  const numberOfPanels = Number(data?.numberOfPanels || 0);
  const wattPerPanel = Number(data?.wattPerPanel || 0);

  const panelCost =
    ratePerWatt * 1.05 * numberOfPanels * wattPerPanel;

  const ongridCost =
    Number(data?.ongridQuantity || 0) * Number(data?.ongridRate || 0);

  const structureCost =
    Number(data?.structureQuantity || 0) * Number(data?.structureRate || 0);

  const electricalCost =
    Number(data?.electricalQuantity || 0) * Number(data?.electricalRate || 0);

  const marginAmount = Number(data?.marginAmount || 0);

  const transportationCost =
    Number(data?.distanceKm || 0) * 50;

  const hybridCost =
    Number(data?.hybridQuantity || 0) * Number(data?.hybridRate || 0);

  const batteryCost =
    Number(data?.batteryQuantity || 0) * Number(data?.batteryRate || 0);

  const celronicCost =
    Number(data?.celronicQuantity || 0) * Number(data?.celronicRate || 0);

  const tataCost =
    Number(data?.tataQuantity || 0) * Number(data?.tataRate || 0);

  const electricityDepartmentCost = Number(
    data?.electricityDepartmentCost || 0,
  );

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
    electricityDepartmentCost;

  return {
    panelCost,
    ongridCost,
    structureCost,
    electricalCost,
    marginAmount,
    transportationCost,
    hybridCost,
    batteryCost,
    celronicCost,
    tataCost,
    electricityDepartmentCost,
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
}