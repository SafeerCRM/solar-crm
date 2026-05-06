import { Controller, Post, Body, Req, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { Res } from '@nestjs/common';
import type { Response } from 'express';

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

@Get('public/:token/pdf')
generatePdf(
  @Param('token') token: string,
  @Res() res: Response,
) {
  return this.proposalService.generateProposalPdf(
    token,
    res,
  );
}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.proposalService.getProposalById(Number(id));
  }
  
}