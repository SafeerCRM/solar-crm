import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './proposal.entity';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';
import { Calculator } from '../calculator/calculator.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, Calculator])],
  providers: [ProposalService],
  controllers: [ProposalController],
})
export class ProposalModule {}