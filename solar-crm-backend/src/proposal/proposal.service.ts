import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Proposal } from './proposal.entity';
import { Repository } from 'typeorm';
import { Calculator } from '../calculator/calculator.entity';
import { CalculatorPanelOption } from '../calculator/calculator-panel-option.entity';
import { CalculatorOngridOption } from '../calculator/calculator-ongrid-option.entity';
import { randomBytes } from 'crypto';
import PDFDocument = require('pdfkit');
import { Response } from 'express';

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
    @InjectRepository(Calculator)
private readonly calculatorRepo: Repository<Calculator>,
@InjectRepository(CalculatorPanelOption)
private readonly panelOptionRepo: Repository<CalculatorPanelOption>,

@InjectRepository(CalculatorOngridOption)
private readonly ongridOptionRepo: Repository<CalculatorOngridOption>,
  ) {}

  generateProposalNumber() {
    const timestamp = Date.now();
    return `PR-${timestamp}`;
  }

  async createProposal(data: any, user: any) {
    const proposal = this.proposalRepo.create({
  ...data,
  proposalNumber: this.generateProposalNumber(),
  publicToken: this.generatePublicToken(),
  createdBy: user?.id,
} as Partial<Proposal>) as Proposal;
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

    if (calculator) {
      const panelOption = calculator.panelOptionId
        ? await this.panelOptionRepo.findOne({
            where: {
              id: Number(calculator.panelOptionId),
            },
          })
        : null;

      const ongridOption = calculator.ongridOptionId
        ? await this.ongridOptionRepo.findOne({
            where: {
              id: Number(calculator.ongridOptionId),
            },
          })
        : null;

      calculator = {
        ...calculator,

        panelDisplayName: panelOption
          ? `${panelOption.brandName} - ${panelOption.capacityWatt}W`
          : null,

        ongridDisplayName: ongridOption
          ? `${ongridOption.brandName} - ${ongridOption.capacity}kW`
          : null,

        ongridPhase: ongridOption?.phaseType || null,
      };
    }
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
  publicToken: this.generatePublicToken(),
  createdBy: user?.id || user?.userId || null,
} as Partial<Proposal>) as Proposal;

  return this.proposalRepo.save(proposal);
}

async generateProposalPdf(
  publicToken: string,
  res: Response,
) {
  const proposal = await this.proposalRepo.findOne({
    where: { publicToken },
  });

  if (!proposal) {
    throw new Error('Proposal not found');
  }

  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
  });

  const fileName = `${proposal.proposalNumber}.pdf`;

  res.setHeader(
    'Content-Disposition',
    `inline; filename="${fileName}"`,
  );

  res.setHeader('Content-Type', 'application/pdf');

  doc.pipe(res);

  // =========================
  // HEADER
  // =========================
  doc
    .fontSize(24)
    .fillColor('#0f172a')
    .text('SOLAR PROPOSAL', {
      align: 'center',
    });

  doc.moveDown();

  doc
    .fontSize(12)
    .fillColor('#111827')
    .text(`Proposal No: ${proposal.proposalNumber}`);

  doc.text(
    `Date: ${new Date(
      proposal.createdAt,
    ).toLocaleDateString('en-IN')}`,
  );

  doc.moveDown();

  // =========================
  // CUSTOMER DETAILS
  // =========================
  doc
    .fontSize(18)
    .fillColor('#2563eb')
    .text('Customer Details');

  doc.moveDown(0.5);

  doc
    .fontSize(12)
    .fillColor('#111827')
    .text(`Name: ${proposal.customerName || '-'}`);

  doc.text(`Phone: ${proposal.customerPhone || '-'}`);

  doc.text(`City: ${proposal.customerCity || '-'}`);

  doc.moveDown();

  // =========================
  // COST
  // =========================
  doc
    .fontSize(18)
    .fillColor('#16a34a')
    .text('Project Cost');

  doc.moveDown(0.5);

  doc
    .fontSize(24)
    .fillColor('#111827')
    .text(
      `₹ ${Number(
        proposal.finalCost || 0,
      ).toLocaleString('en-IN')}`,
    );

  doc.moveDown();

  // =========================
  // TERMS
  // =========================
  doc
    .fontSize(16)
    .fillColor('#2563eb')
    .text('Terms & Conditions');

  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .fillColor('#111827')
    .text(
      '• Prices are subject to site inspection.',
    );

  doc.text(
    '• Net metering depends on local DISCOM approval.',
  );

  doc.text(
    '• Installation timeline may vary by site conditions.',
  );

  doc.moveDown(2);

  // =========================
  // FOOTER
  // =========================
  doc
    .fontSize(14)
    .fillColor('#0f172a')
    .text('Thank you for choosing our solar solutions.', {
      align: 'center',
    });

  doc.end();
}

generatePublicToken() {
  return randomBytes(24).toString('hex');
}

}