import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Proposal } from './proposal.entity';
import { Repository } from 'typeorm';
import { Calculator } from '../calculator/calculator.entity';
import { CalculatorPanelOption } from '../calculator/calculator-panel-option.entity';
import { CalculatorOngridOption } from '../calculator/calculator-ongrid-option.entity';
import { CalculatorStructureOption } from '../calculator/calculator-structure-option.entity';
import { CalculatorHybridOption } from '../calculator/calculator-hybrid-option.entity';
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

@InjectRepository(CalculatorStructureOption)
private readonly structureOptionRepo: Repository<CalculatorStructureOption>,

@InjectRepository(CalculatorHybridOption)
private readonly hybridOptionRepo: Repository<CalculatorHybridOption>,
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
  where: {
    id: proposal.calculatorId,
  },
  relations: {
    batterySelections: true,
  },
  order: {
    batterySelections: {
      id: 'ASC',
    },
  },
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

        const structureOption = calculator.structureOptionId
  ? await this.structureOptionRepo.findOne({
      where: {
        id: Number(calculator.structureOptionId),
      },
    })
  : null;

const hybridOption = calculator.hybridOptionId
  ? await this.hybridOptionRepo.findOne({
      where: {
        id: Number(calculator.hybridOptionId),
      },
    })
  : null;

  const savedBatterySelections = Array.isArray(
  calculator.batterySelections,
)
  ? calculator.batterySelections
      .map((battery: any) => ({
        id: Number(battery.id || 0),

        batteryOptionId: battery.batteryOptionId
          ? Number(battery.batteryOptionId)
          : null,

        batteryType:
          String(battery.batteryType || '').trim() ||
          null,

        brandName:
          String(battery.brandName || '').trim() ||
          null,

        capacity: Number(battery.capacity || 0),

        quantity: Math.max(
          Number(battery.quantity || 1),
          1,
        ),

        rate: Number(battery.rate || 0),

        totalCost: Number(
          battery.totalCost ||
            Number(battery.rate || 0) *
              Math.max(
                Number(battery.quantity || 1),
                1,
              ),
        ),
      }))
      .filter(
        (battery: any) =>
          battery.batteryOptionId ||
          battery.brandName ||
          battery.batteryType ||
          battery.capacity > 0,
      )
  : [];

/*
 * Old calculators contain only the original singular battery fields.
 * This fallback keeps their existing proposals working.
 */
const proposalBatterySelections =
  savedBatterySelections.length > 0
    ? savedBatterySelections
    : calculator.batteryOptionId ||
        calculator.batteryType ||
        calculator.batteryStrength
      ? [
          {
            id: 0,

            batteryOptionId:
              calculator.batteryOptionId
                ? Number(calculator.batteryOptionId)
                : null,

            batteryType:
              String(
                calculator.batteryType || '',
              ).trim() || null,

            /*
             * Older calculators did not store a separate battery brand.
             * The frontend can therefore fall back to the generic
             * product title "Battery".
             */
            brandName: null,

            capacity: Number(
              calculator.batteryStrength || 0,
            ),

            quantity: Math.max(
              Number(
                calculator.batteryQuantity || 1,
              ),
              1,
            ),

            rate: Number(
              calculator.batteryRate || 0,
            ),

            totalCost: Number(
              calculator.batteryCost ||
                Number(
                  calculator.batteryRate || 0,
                ) *
                  Math.max(
                    Number(
                      calculator.batteryQuantity ||
                        1,
                    ),
                    1,
                  ),
            ),
          },
        ]
      : [];

      calculator = {
  ...calculator,

    batterySelections: proposalBatterySelections,

  batteryTotalCost:
    proposalBatterySelections.reduce(
      (total: number, battery: any) =>
        total +
        Number(battery.totalCost || 0),
      0,
    ),

  panelDisplayName: panelOption
    ? `${panelOption.brandName} - ${panelOption.capacityWatt}W`
    : null,

  ongridDisplayName: ongridOption
    ? `${ongridOption.brandName} - ${ongridOption.capacity}kW`
    : null,

  ongridPhase:
    ongridOption?.phaseType || null,

  structureDisplayName: structureOption
    ? `${structureOption.structureType} - ${structureOption.capacityKw}kW`
    : null,

  structureType:
    structureOption?.structureType ||
    calculator.structureType ||
    null,

  structureCapacityKw:
    structureOption
      ? Number(structureOption.capacityKw || 0)
      : Number(calculator.structureWatt || 0),

  hybridDisplayName: hybridOption
    ? `${hybridOption.brandName} - ${hybridOption.capacity}kW`
    : null,

  hybridBrand:
    hybridOption?.brandName ||
    calculator.hybridType ||
    null,

  hybridPhase:
    hybridOption?.phase ||
    calculator.hybridPhase ||
    null,

  hybridCapacityKw:
    hybridOption
      ? Number(hybridOption.capacity || 0)
      : 0,

  converterType:
    hybridOption || calculator.hybridOptionId
      ? 'HYBRID'
      : ongridOption || calculator.ongridOptionId
        ? 'ONGRID'
        : null,
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
  where: {
    id: calculatorId,
  },
  relations: {
    batterySelections: true,
  },
  order: {
    batterySelections: {
      id: 'ASC',
    },
  },
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