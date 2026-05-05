import { Controller, Post, Body, Req, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProposalService } from './proposal.service';

@Controller('proposals')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.proposalService.createProposal(body, req.user);
  }

  @Post('from-calculator/:calculatorId')
createFromCalculator(
  @Param('calculatorId', ParseIntPipe) calculatorId: number,
  @Req() req: any,
) {
  return this.proposalService.createFromCalculator(calculatorId, req.user);
}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.proposalService.getProposalById(Number(id));
  }
}