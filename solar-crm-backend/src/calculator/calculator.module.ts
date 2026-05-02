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

@Module({
  imports: [TypeOrmModule.forFeature([
  Calculator,
  CalculatorSetting,
  CalculatorPanelOption,
  CalculatorOngridOption,
  CalculatorStructureOption,
  CalculatorElectricalOption,
])],
  controllers: [CalculatorController],
  providers: [CalculatorService],
  exports: [CalculatorService],
})
export class CalculatorModule {}