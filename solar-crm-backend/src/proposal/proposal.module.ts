import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Proposal } from './proposal.entity';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';

import { Calculator } from '../calculator/calculator.entity';
import { CalculatorPanelOption } from '../calculator/calculator-panel-option.entity';
import { CalculatorOngridOption } from '../calculator/calculator-ongrid-option.entity';
import { CalculatorStructureOption } from '../calculator/calculator-structure-option.entity';
import { CalculatorHybridOption } from '../calculator/calculator-hybrid-option.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proposal,
      Calculator,
      CalculatorPanelOption,
      CalculatorOngridOption,
      CalculatorStructureOption,
      CalculatorHybridOption,
    ]),
  ],
  providers: [ProposalService],
  controllers: [ProposalController],
})
export class ProposalModule {}