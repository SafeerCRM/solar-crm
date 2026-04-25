import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Calculator } from './calculator.entity';
import { CalculatorService } from './calculator.service';
import { CalculatorController } from './calculator.controller';
import { CalculatorSetting } from './calculator-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Calculator,CalculatorSetting])],
  controllers: [CalculatorController],
  providers: [CalculatorService],
  exports: [CalculatorService],
})
export class CalculatorModule {}