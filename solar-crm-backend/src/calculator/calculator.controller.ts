import { Controller, Post, Body } from '@nestjs/common';
import { CalculatorService } from './calculator.service';

@Controller('calculator')
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Post('project-cost')
  calculateProjectCost(@Body() body: any) {
    return this.calculatorService.calculateProjectCost(body);
  }
}