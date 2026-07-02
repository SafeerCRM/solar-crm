import { Repository } from 'typeorm';

import { Project } from '../../project/project.entity';
import { ProjectPartyLedger } from '../../project/project-party-ledger.entity';
import { ProjectPaymentInstallment } from '../../project/project-payment-installment.entity';
import { ProjectAccountExpense } from '../../project/project-account-expense.entity';
import { ProjectPurchaseOrder } from '../../project/project-purchase-order.entity';
import { ProjectProformaInvoice } from '../../project/project-proforma-invoice.entity';
import { ProjectFinalInvoice } from '../../project/project-final-invoice.entity';
import { ProjectDealerOrder } from '../../project/project-dealer-order.entity';
import { ProjectDealerPayment } from '../../project/project-dealer-payment.entity';
import { ProjectConsumption } from '../../project/project-consumption.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
} from '../helpers/analytics-filter.helper';

export class FinanceAnalyticsBuilder {
  constructor(
  private readonly projectRepository: Repository<Project>,
  private readonly ledgerRepository: Repository<ProjectPartyLedger>,
  private readonly installmentRepository: Repository<ProjectPaymentInstallment>,
  private readonly expenseRepository: Repository<ProjectAccountExpense>,
  private readonly purchaseOrderRepository: Repository<ProjectPurchaseOrder>,
  private readonly proformaRepository: Repository<ProjectProformaInvoice>,
  private readonly finalInvoiceRepository: Repository<ProjectFinalInvoice>,
  private readonly dealerOrderRepository: Repository<ProjectDealerOrder>,
  private readonly dealerPaymentRepository: Repository<ProjectDealerPayment>,
  private readonly consumptionRepository: Repository<ProjectConsumption>,
) {}

  async build(query: AnalyticsQuery, user: any) {
  const { start, end } = getAnalyticsDateRange(query);

  const [
    ledgerSummary,
    paymentSummary,
    expenseSummary,
    purchaseSummary,
    proformaSummary,
    invoiceSummary,
    dealerOrderSummary,
    dealerPaymentSummary,
    consumptionSummary,
  ] = await Promise.all([
    this.ledgerRepository
      .createQueryBuilder('ledger')
      .where('ledger.isHidden = false')
      .andWhere('ledger.createdAt BETWEEN :start AND :end', { start, end })
      .select(
        `COALESCE(SUM(CASE WHEN ledger.entryType = 'CREDIT' THEN ledger.amount ELSE 0 END), 0)`,
        'ledgerCredit',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN ledger.entryType = 'DEBIT' THEN ledger.amount ELSE 0 END), 0)`,
        'ledgerDebit',
      )
      .addSelect('COUNT(*)', 'ledgerEntries')
      .getRawOne(),

    this.installmentRepository
      .createQueryBuilder('payment')
      .where('payment.isHidden = false')
      .andWhere('payment.createdAt BETWEEN :start AND :end', { start, end })
      .select('COALESCE(SUM(payment.amount), 0)', 'scheduledAmount')
      .addSelect('COALESCE(SUM(payment.paidAmount), 0)', 'collectedAmount')
      .addSelect('COALESCE(SUM(payment.pendingAmount), 0)', 'pendingAmount')
      .addSelect(
        `COUNT(*) FILTER (WHERE payment.status = 'PAID')`,
        'paidInstallments',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE payment.status = 'PARTIAL')`,
        'partialInstallments',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE payment.status = 'OVERDUE')`,
        'overdueInstallments',
      )
      .getRawOne(),

    this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.isHidden = false')
      .andWhere('expense.createdAt BETWEEN :start AND :end', { start, end })
      .select('COALESCE(SUM(expense.amount), 0)', 'totalExpenses')
      .addSelect(
        `COALESCE(SUM(CASE WHEN expense.approvalStatus = 'APPROVED' THEN expense.amount ELSE 0 END), 0)`,
        'approvedExpenses',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN expense.approvalStatus = 'PENDING' THEN expense.amount ELSE 0 END), 0)`,
        'pendingExpenses',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN expense.approvalStatus = 'REJECTED' THEN expense.amount ELSE 0 END), 0)`,
        'rejectedExpenses',
      )
      .addSelect('COUNT(*)', 'expenseEntries')
      .getRawOne(),

    this.purchaseOrderRepository
      .createQueryBuilder('po')
      .where('po.isHidden = false')
      .andWhere('po.createdAt BETWEEN :start AND :end', { start, end })
      .select('COUNT(*)', 'purchaseOrders')
      .addSelect('COALESCE(SUM(po.totalAmount), 0)', 'purchaseOrderAmount')
      .getRawOne(),

    this.proformaRepository
      .createQueryBuilder('pi')
      .where('pi.isHidden = false')
      .andWhere('pi.createdAt BETWEEN :start AND :end', { start, end })
      .select('COUNT(*)', 'proformaInvoices')
      .addSelect('COALESCE(SUM(pi.totalAmount), 0)', 'proformaAmount')
      .getRawOne(),

    this.finalInvoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.isHidden = false')
      .andWhere('invoice.createdAt BETWEEN :start AND :end', { start, end })
      .select('COUNT(*)', 'finalInvoices')
      .addSelect('COALESCE(SUM(invoice.totalAmount), 0)', 'invoiceAmount')
      .getRawOne(),

    this.dealerOrderRepository
      .createQueryBuilder('dealerOrder')
      .where('"dealerOrder"."isHidden" = false')
      .andWhere('dealerOrder.createdAt BETWEEN :start AND :end', {
        start,
        end,
      })
      .select('COUNT(*)', 'dealerOrders')
      .addSelect('COALESCE(SUM(dealerOrder.totalAmount), 0)', 'dealerOrderAmount')
      .getRawOne(),

    this.dealerPaymentRepository
      .createQueryBuilder('dealerPayment')
      .where('"dealerPayment"."isHidden" = false')
      .andWhere('dealerPayment.createdAt BETWEEN :start AND :end', {
        start,
        end,
      })
      .select('COUNT(*)', 'dealerPayments')
      .addSelect('COALESCE(SUM(dealerPayment.amount), 0)', 'dealerPaymentAmount')
      .addSelect(
        `COALESCE(SUM(CASE WHEN dealerPayment.status = 'APPROVED' THEN dealerPayment.amount ELSE 0 END), 0)`,
        'approvedDealerPayments',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN dealerPayment.status = 'PENDING' THEN dealerPayment.amount ELSE 0 END), 0)`,
        'pendingDealerPayments',
      )
      .getRawOne(),

    this.consumptionRepository
      .createQueryBuilder('consumption')
      .where('consumption.createdAt BETWEEN :start AND :end', { start, end })
      .select('COUNT(*)', 'consumptionEntries')
      .addSelect('COALESCE(SUM(consumption.totalAmount), 0)', 'consumptionAmount')
      .getRawOne(),
  ]);

  const collectedAmount = Number(paymentSummary?.collectedAmount || 0);
  const pendingAmount = Number(paymentSummary?.pendingAmount || 0);
  const approvedExpenses = Number(expenseSummary?.approvedExpenses || 0);
  const purchaseOrderAmount = Number(purchaseSummary?.purchaseOrderAmount || 0);
  const consumptionAmount = Number(consumptionSummary?.consumptionAmount || 0);
  const dealerOrderAmount = Number(dealerOrderSummary?.dealerOrderAmount || 0);
  const approvedDealerPayments = Number(
    dealerPaymentSummary?.approvedDealerPayments || 0,
  );

  const totalCost =
    approvedExpenses + purchaseOrderAmount + consumptionAmount;

  const grossInflow = collectedAmount + approvedDealerPayments;
  const grossBusinessValue = collectedAmount + dealerOrderAmount;

  const netCashFlow =
    grossInflow -
    approvedExpenses -
    purchaseOrderAmount -
    consumptionAmount;

  const collectionPercent =
    collectedAmount + pendingAmount > 0
      ? Math.round(
          (collectedAmount / (collectedAmount + pendingAmount)) * 100,
        )
      : 0;

  return {
    department: 'FINANCE',
    title: 'Finance Intelligence Report',
    cards: {
      ledgerCredit: Number(ledgerSummary?.ledgerCredit || 0),
      ledgerDebit: Number(ledgerSummary?.ledgerDebit || 0),
      ledgerEntries: Number(ledgerSummary?.ledgerEntries || 0),

      scheduledCollection: Number(paymentSummary?.scheduledAmount || 0),
      collectedAmount,
      pendingAmount,
      collectionPercent,
      paidInstallments: Number(paymentSummary?.paidInstallments || 0),
      partialInstallments: Number(paymentSummary?.partialInstallments || 0),
      overdueInstallments: Number(paymentSummary?.overdueInstallments || 0),

      totalExpenses: Number(expenseSummary?.totalExpenses || 0),
      approvedExpenses,
      pendingExpenses: Number(expenseSummary?.pendingExpenses || 0),
      rejectedExpenses: Number(expenseSummary?.rejectedExpenses || 0),
      expenseEntries: Number(expenseSummary?.expenseEntries || 0),

      purchaseOrders: Number(purchaseSummary?.purchaseOrders || 0),
      purchaseOrderAmount,

      proformaInvoices: Number(proformaSummary?.proformaInvoices || 0),
      proformaAmount: Number(proformaSummary?.proformaAmount || 0),

      finalInvoices: Number(invoiceSummary?.finalInvoices || 0),
      invoiceAmount: Number(invoiceSummary?.invoiceAmount || 0),

      dealerOrders: Number(dealerOrderSummary?.dealerOrders || 0),
      dealerOrderAmount,

      dealerPayments: Number(dealerPaymentSummary?.dealerPayments || 0),
      dealerPaymentAmount: Number(
        dealerPaymentSummary?.dealerPaymentAmount || 0,
      ),
      approvedDealerPayments,
      pendingDealerPayments: Number(
        dealerPaymentSummary?.pendingDealerPayments || 0,
      ),

      consumptionEntries: Number(consumptionSummary?.consumptionEntries || 0),
      consumptionAmount,

      totalCost,
      grossInflow,
      grossBusinessValue,
      netCashFlow,
    },
    charts: {
      cashFlowSummary: {
        type: 'bar',
        title: 'Finance Cash Flow Summary',
        data: [
          { label: 'Customer Collection', value: collectedAmount },
          { label: 'Dealer Payments', value: approvedDealerPayments },
          { label: 'Approved Expenses', value: approvedExpenses },
          { label: 'Purchase Orders', value: purchaseOrderAmount },
          { label: 'Consumption', value: consumptionAmount },
        ],
      },
      collectionSplit: {
        type: 'bar',
        title: 'Collection Split',
        data: [
          { label: 'Collected', value: collectedAmount },
          { label: 'Pending', value: pendingAmount },
        ],
      },
      expenseSplit: {
        type: 'bar',
        title: 'Expense Approval Split',
        data: [
          {
            label: 'Approved',
            value: Number(expenseSummary?.approvedExpenses || 0),
          },
          {
            label: 'Pending',
            value: Number(expenseSummary?.pendingExpenses || 0),
          },
          {
            label: 'Rejected',
            value: Number(expenseSummary?.rejectedExpenses || 0),
          },
        ],
      },
    },
    rows: [],
    range: { start, end },
  };
}
}