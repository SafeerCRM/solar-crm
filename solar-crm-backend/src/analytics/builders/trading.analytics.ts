import { Repository } from 'typeorm';

import { ProjectDealerOrder } from '../../project/project-dealer-order.entity';
import { ProjectDealerPayment } from '../../project/project-dealer-payment.entity';
import { ProjectPurchaseOrder } from '../../project/project-purchase-order.entity';
import { ProjectProformaInvoice } from '../../project/project-proforma-invoice.entity';
import { ProjectFinalInvoice } from '../../project/project-final-invoice.entity';
import { ProjectTradingMeeting } from '../../project/project-trading-meeting.entity';
import { Dealer } from '../../dealer/dealer.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
} from '../helpers/analytics-filter.helper';

export class TradingAnalyticsBuilder {
  constructor(
    private readonly dealerOrderRepository: Repository<ProjectDealerOrder>,
    private readonly dealerPaymentRepository: Repository<ProjectDealerPayment>,
    private readonly purchaseOrderRepository: Repository<ProjectPurchaseOrder>,
    private readonly proformaRepository: Repository<ProjectProformaInvoice>,
    private readonly finalInvoiceRepository: Repository<ProjectFinalInvoice>,
    private readonly tradingMeetingRepository: Repository<ProjectTradingMeeting>,
    private readonly dealerRepository: Repository<Dealer>,
  ) {}

  async build(query: AnalyticsQuery, user: any) {
  const { start, end } = getAnalyticsDateRange(query);

  const [
    dealerSummary,
    orderSummary,
    paymentSummary,
    purchaseSummary,
    proformaSummary,
    invoiceSummary,
    tradingMeetingSummary,
    orderStatusRows,
    paymentStatusRows,
    topDealerRows,
  ] = await Promise.all([
    this.dealerRepository
      .createQueryBuilder('dealer')
      .where('dealer.isHidden = false')
      .select('COUNT(*)', 'totalDealers')
      .addSelect(
        `COUNT(*) FILTER (WHERE dealer.status = 'ACTIVE')`,
        'activeDealers',
      )
      .getRawOne(),

    this.dealerOrderRepository
      .createQueryBuilder('dealerOrder')
      .where('dealerOrder.isHidden = false')
      .andWhere('dealerOrder.createdAt BETWEEN :start AND :end', {
        start,
        end,
      })
      .select('COUNT(*)', 'dealerOrders')
      .addSelect('COALESCE(SUM(dealerOrder.totalAmount), 0)', 'dealerOrderAmount')
      .addSelect(
        `COALESCE(SUM(CASE WHEN dealerOrder.status = 'DELIVERED' THEN dealerOrder.totalAmount ELSE 0 END), 0)`,
        'deliveredOrderAmount',
      )
      .getRawOne(),

    this.dealerPaymentRepository
      .createQueryBuilder('dealerPayment')
      .where('dealerPayment.createdAt BETWEEN :start AND :end', {
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

    this.purchaseOrderRepository
      .createQueryBuilder('po')
      .where('po.isHidden = false')
      .andWhere('po.createdAt BETWEEN :start AND :end', { start, end })
      .select('COUNT(*)', 'purchaseOrders')
      .addSelect('COALESCE(SUM(po.totalAmount), 0)', 'purchaseAmount')
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

    this.tradingMeetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.createdAt BETWEEN :start AND :end', { start, end })
      .select('COUNT(*)', 'tradingMeetings')
      .addSelect(
        `COUNT(*) FILTER (WHERE meeting.status = 'COMPLETED')`,
        'completedTradingMeetings',
      )
      .getRawOne(),

    this.dealerOrderRepository
      .createQueryBuilder('dealerOrder')
      .where('dealerOrder.isHidden = false')
      .andWhere('dealerOrder.createdAt BETWEEN :start AND :end', {
        start,
        end,
      })
      .select('dealerOrder."status"::text', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('dealerOrder."status"')
      .orderBy('value', 'DESC')
      .getRawMany(),

    this.dealerPaymentRepository
      .createQueryBuilder('dealerPayment')
      .where('dealerPayment.createdAt BETWEEN :start AND :end', {
        start,
        end,
      })
      .select('dealerPayment."status"::text', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('dealerPayment."status"')
      .orderBy('value', 'DESC')
      .getRawMany(),

    this.dealerOrderRepository
      .createQueryBuilder('dealerOrder')
      .where('dealerOrder.isHidden = false')
      .andWhere('dealerOrder.createdAt BETWEEN :start AND :end', {
        start,
        end,
      })
      .select('dealerOrder.dealerId', 'dealerId')
      .addSelect('COALESCE(dealerOrder.dealerName, \'Unknown Dealer\')', 'dealerName')
      .addSelect('COUNT(*)', 'orders')
      .addSelect('COALESCE(SUM(dealerOrder.totalAmount), 0)', 'orderAmount')
      .groupBy('dealerOrder.dealerId')
      .addGroupBy('dealerOrder.dealerName')
      .orderBy('orderAmount', 'DESC')
      .limit(50)
      .getRawMany(),
  ]);

  const dealerOrderAmount = Number(orderSummary?.dealerOrderAmount || 0);
  const approvedDealerPayments = Number(
    paymentSummary?.approvedDealerPayments || 0,
  );
  const purchaseAmount = Number(purchaseSummary?.purchaseAmount || 0);
  const tradingOutstanding = Math.max(
    dealerOrderAmount - approvedDealerPayments,
    0,
  );
  const tradingMargin = dealerOrderAmount - purchaseAmount;

  return {
    department: 'TRADING',
    title: 'Trading Intelligence Report',
    cards: {
      totalDealers: Number(dealerSummary?.totalDealers || 0),
      activeDealers: Number(dealerSummary?.activeDealers || 0),

      dealerOrders: Number(orderSummary?.dealerOrders || 0),
      dealerOrderAmount,
      deliveredOrderAmount: Number(orderSummary?.deliveredOrderAmount || 0),

      dealerPayments: Number(paymentSummary?.dealerPayments || 0),
      dealerPaymentAmount: Number(paymentSummary?.dealerPaymentAmount || 0),
      approvedDealerPayments,
      pendingDealerPayments: Number(paymentSummary?.pendingDealerPayments || 0),

      purchaseOrders: Number(purchaseSummary?.purchaseOrders || 0),
      purchaseAmount,

      proformaInvoices: Number(proformaSummary?.proformaInvoices || 0),
      proformaAmount: Number(proformaSummary?.proformaAmount || 0),

      finalInvoices: Number(invoiceSummary?.finalInvoices || 0),
      invoiceAmount: Number(invoiceSummary?.invoiceAmount || 0),

      tradingMeetings: Number(tradingMeetingSummary?.tradingMeetings || 0),
      completedTradingMeetings: Number(
        tradingMeetingSummary?.completedTradingMeetings || 0,
      ),

      tradingOutstanding,
      tradingMargin,
    },
    charts: {
      dealerOrderStatusDistribution: {
        type: 'bar',
        title: 'Dealer Order Status Distribution',
        data: orderStatusRows.map((row) => ({
          label: row.label,
          value: Number(row.value || 0),
        })),
      },
      dealerPaymentStatusDistribution: {
        type: 'bar',
        title: 'Dealer Payment Status Distribution',
        data: paymentStatusRows.map((row) => ({
          label: row.label,
          value: Number(row.value || 0),
        })),
      },
      tradingFinanceSummary: {
        type: 'bar',
        title: 'Trading Finance Summary',
        data: [
          { label: 'Dealer Orders', value: dealerOrderAmount },
          { label: 'Approved Payments', value: approvedDealerPayments },
          { label: 'Purchase Cost', value: purchaseAmount },
          { label: 'Outstanding', value: tradingOutstanding },
          { label: 'Margin', value: tradingMargin },
        ],
      },
    },
    rows: topDealerRows.map((row) => ({
      dealerId: row.dealerId ? Number(row.dealerId) : null,
      dealerName: row.dealerName,
      orders: Number(row.orders || 0),
      orderAmount: Number(row.orderAmount || 0),
    })),
    range: { start, end },
  };
}
}