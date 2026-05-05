import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Proposal } from './proposal.entity';
import { Repository } from 'typeorm';
import { Calculator } from '../calculator/calculator.entity';

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
    @InjectRepository(Calculator)
private readonly calculatorRepo: Repository<Calculator>,
  ) {}

  generateProposalNumber() {
    const timestamp = Date.now();
    return `PR-${timestamp}`;
  }

  async createProposal(data: any, user: any) {
    const proposal = this.proposalRepo.create({
      ...data,
      proposalNumber: this.generateProposalNumber(),
      createdBy: user?.id,
    });

    return this.proposalRepo.save(proposal);
  }

  async getProposalById(id: number) {
  const proposal = await this.proposalRepo.findOne({
    where: { id },
  });

  if (!proposal) {
    throw new Error('Proposal not found');
  }

  let calculator: any = null;

  if (proposal.calculatorId) {
    calculator = await this.calculatorRepo.findOne({
      where: { id: proposal.calculatorId },
    });
  }

  return {
    ...proposal,
    calculator,
  };
}

  async createFromCalculator(calculatorId: number, user: any) {
  const calculator = await this.calculatorRepo.findOne({
    where: { id: calculatorId },
  });

  if (!calculator) {
    throw new Error('Calculator not found');
  }

  const proposal = this.proposalRepo.create({
  calculatorId: Number(calculator.id),
  meetingId: calculator.meetingId ? Number(calculator.meetingId) : null,
  leadId: calculator.leadId ? Number(calculator.leadId) : null,
  customerName: calculator.customerName || null,
  customerPhone: calculator.customerPhone || null,
  customerCity: calculator.customerCity || null,
  finalCost: Number(calculator.finalCost || calculator.totalProjectCost || 0),
  proposalNumber: this.generateProposalNumber(),
  createdBy: user?.id || user?.userId || null,
} as Proposal);

  return this.proposalRepo.save(proposal);
}
}