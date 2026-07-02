import { Repository } from 'typeorm';

import { ProjectDealerOrder } from '../../project/project-dealer-order.entity';
import { ProjectDealerPayment } from '../../project/project-dealer-payment.entity';
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
      proformaSummary,
      invoiceSummary,
      tradingMeetingSummary,
      orderStatusRows,
      paymentStatusRows,
      topDealerRows,
    ] = await Promise.all([
      this.dealerRepository
        .createQueryBuilder('dealer')
        .where('"dealer"."isHidden" = false')
        .select('COUNT(*)', 'totalDealers')
        .getRawOne(),

      this.dealerOrderRepository
        .createQueryBuilder('dealerOrder')
        .where('"dealerOrder"."isHidden" = false')
        .andWhere('"dealerOrder"."createdAt" BETWEEN :start AND :end', {
          start,
          end,
        })
        .select('COUNT(*)', 'dealerOrders')
        .addSelect(
          'COALESCE(SUM("dealerOrder"."totalAmount"), 0)',
          'dealerOrderAmount',
        )
        .addSelect(
          'COALESCE(SUM("dealerOrder"."paidAmount"), 0)',
          'dealerOrderPaidAmount',
        )
        .addSelect(
          'COALESCE(SUM("dealerOrder"."pendingAmount"), 0)',
          'dealerOrderPendingAmount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN "dealerOrder"."status" = 'DELIVERED' THEN "dealerOrder"."totalAmount" ELSE 0 END), 0)`,
          'deliveredOrderAmount',
        )
        .getRawOne(),

      this.dealerPaymentRepository
        .createQueryBuilder('dealerPayment')
        .where('"dealerPayment"."createdAt" BETWEEN :start AND :end', {
          start,
          end,
        })
        .select('COUNT(*)', 'dealerPaymentsThisPeriod')
        .addSelect(
          'COALESCE(SUM("dealerPayment"."amount"), 0)',
          'dealerPaymentAmountThisPeriod',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN "dealerPayment"."status" = 'APPROVED' THEN "dealerPayment"."amount" ELSE 0 END), 0)`,
          'approvedDealerPaymentsThisPeriod',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN "dealerPayment"."status" IN ('PENDING', 'SUBMITTED') THEN "dealerPayment"."amount" ELSE 0 END), 0)`,
          'pendingDealerPaymentsThisPeriod',
        )
        .getRawOne(),

      this.proformaRepository
        .createQueryBuilder('pi')
        .where('"pi"."isHidden" = false')
        .andWhere('"pi"."createdAt" BETWEEN :start AND :end', {
          start,
          end,
        })
        .select('COUNT(*)', 'proformaInvoices')
        .addSelect('COALESCE(SUM("pi"."totalAmount"), 0)', 'proformaAmount')
        .getRawOne(),

      this.finalInvoiceRepository
        .createQueryBuilder('invoice')
        .where('"invoice"."isHidden" = false')
        .andWhere('"invoice"."createdAt" BETWEEN :start AND :end', {
          start,
          end,
        })
        .select('COUNT(*)', 'finalInvoices')
        .addSelect('COALESCE(SUM("invoice"."totalAmount"), 0)', 'invoiceAmount')
        .getRawOne(),

      this.tradingMeetingRepository
        .createQueryBuilder('meeting')
        .where('"meeting"."isHidden" = false')
        .andWhere('"meeting"."createdAt" BETWEEN :start AND :end', {
          start,
          end,
        })
        .select('COUNT(*)', 'tradingMeetings')
        .addSelect(
          `COUNT(*) FILTER (WHERE "meeting"."status" = 'COMPLETED')`,
          'completedTradingMeetings',
        )
        .addSelect(
          'COALESCE(SUM("meeting"."expectedOrderValue"), 0)',
          'expectedOrderValue',
        )
        .getRawOne(),

      this.dealerOrderRepository
        .createQueryBuilder('dealerOrder')
        .where('"dealerOrder"."isHidden" = false')
        .andWhere('"dealerOrder"."createdAt" BETWEEN :start AND :end', {
          start,
          end,
        })
        .select('"dealerOrder"."status"::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('"dealerOrder"."status"')
        .orderBy('value', 'DESC')
        .getRawMany(),

      this.dealerPaymentRepository
        .createQueryBuilder('dealerPayment')
        .where('"dealerPayment"."createdAt" BETWEEN :start AND :end', {
          start,
          end,
        })
        .select('"dealerPayment"."status"::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('"dealerPayment"."status"')
        .orderBy('value', 'DESC')
        .getRawMany(),

      this.dealerOrderRepository
        .createQueryBuilder('dealerOrder')
        .where('"dealerOrder"."isHidden" = false')
        .andWhere('"dealerOrder"."createdAt" BETWEEN :start AND :end', {
          start,
          end,
        })
        .select('"dealerOrder"."dealerId"', 'dealerId')
        .addSelect(
          'COALESCE("dealerOrder"."dealerName", \'Unknown Dealer\')',
          'dealerName',
        )
        .addSelect('COUNT(*)', 'orders')
        .addSelect(
          'COALESCE(SUM("dealerOrder"."totalAmount"), 0)',
          'orderAmount',
        )
        .addSelect(
          'COALESCE(SUM("dealerOrder"."paidAmount"), 0)',
          'paidAmount',
        )
        .addSelect(
          'COALESCE(SUM("dealerOrder"."pendingAmount"), 0)',
          'pendingAmount',
        )
        .groupBy('"dealerOrder"."dealerId"')
        .addGroupBy('"dealerOrder"."dealerName"')
        .orderBy('COALESCE(SUM("dealerOrder"."totalAmount"), 0)', 'DESC')
        .limit(50)
        .getRawMany(),
    ]);

    const dealerOrderAmount = Number(orderSummary?.dealerOrderAmount || 0);
    const dealerOrderPaidAmount = Number(
      orderSummary?.dealerOrderPaidAmount || 0,
    );
    const dealerOrderPendingAmount = Number(
      orderSummary?.dealerOrderPendingAmount || 0,
    );

    return {
      department: 'TRADING',
      title: 'Trading Intelligence Report',
      cards: {
        totalDealers: Number(dealerSummary?.totalDealers || 0),

        dealerOrders: Number(orderSummary?.dealerOrders || 0),
        dealerOrderAmount,
        dealerOrderPaidAmount,
        dealerOrderPendingAmount,
        deliveredOrderAmount: Number(orderSummary?.deliveredOrderAmount || 0),

        dealerPaymentsThisPeriod: Number(
          paymentSummary?.dealerPaymentsThisPeriod || 0,
        ),
        dealerPaymentAmountThisPeriod: Number(
          paymentSummary?.dealerPaymentAmountThisPeriod || 0,
        ),
        approvedDealerPaymentsThisPeriod: Number(
          paymentSummary?.approvedDealerPaymentsThisPeriod || 0,
        ),
        pendingDealerPaymentsThisPeriod: Number(
          paymentSummary?.pendingDealerPaymentsThisPeriod || 0,
        ),

        proformaInvoices: Number(proformaSummary?.proformaInvoices || 0),
        proformaAmount: Number(proformaSummary?.proformaAmount || 0),

        finalInvoices: Number(invoiceSummary?.finalInvoices || 0),
        invoiceAmount: Number(invoiceSummary?.invoiceAmount || 0),

        tradingMeetings: Number(tradingMeetingSummary?.tradingMeetings || 0),
        completedTradingMeetings: Number(
          tradingMeetingSummary?.completedTradingMeetings || 0,
        ),
        expectedOrderValue: Number(
          tradingMeetingSummary?.expectedOrderValue || 0,
        ),

        tradingOutstanding: dealerOrderPendingAmount,
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
            { label: 'Order Amount', value: dealerOrderAmount },
            { label: 'Order Paid', value: dealerOrderPaidAmount },
            { label: 'Order Pending', value: dealerOrderPendingAmount },
            {
              label: 'Payments This Period',
              value: Number(paymentSummary?.dealerPaymentAmountThisPeriod || 0),
            },
          ],
        },
      },
      rows: topDealerRows.map((row) => ({
        dealerId: row.dealerId ? Number(row.dealerId) : null,
        dealerName: row.dealerName,
        orders: Number(row.orders || 0),
        orderAmount: Number(row.orderAmount || 0),
        paidAmount: Number(row.paidAmount || 0),
        pendingAmount: Number(row.pendingAmount || 0),
      })),
      range: { start, end },
    };
  }
}