import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Calculator } from './calculator.entity';
import { CalculatorService } from './calculator.service';
import { CalculatorController } from './calculator.controller';
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

@Module({
  imports: [TypeOrmModule.forFeature([
  Calculator,
  CalculatorSetting,
  CalculatorPanelOption,
  CalculatorOngridOption,
  CalculatorStructureOption,
  CalculatorElectricalOption,
  CalculatorMarginOption,
  CalculatorHybridOption,
  CalculatorBatteryOption,
  CalculatorKitOption,
  CalculatorExpectedProfit,
  CalculatorDiscountOption,
])],
  controllers: [CalculatorController],
  providers: [CalculatorService],
  exports: [CalculatorService],
})
export class CalculatorModule {}