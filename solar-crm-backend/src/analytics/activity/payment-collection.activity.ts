
import { Repository, SelectQueryBuilder } from 'typeorm';

import { ProjectPaymentReceipt } from '../../project/project-payment-receipt.entity';
import {
  ProjectPaymentInstallment,
  ProjectPaymentInstallmentStatus,
} from '../../project/project-payment-installment.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class PaymentCollectionActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'PAYMENT_COLLECTION';
  readonly moduleLabel = 'Payment Collection';

  constructor(
    private readonly receiptRepository: Repository<ProjectPaymentReceipt>,
    private readonly installmentRepository: Repository<ProjectPaymentInstallment>,
  ) {}

  async build(
    context: AnalyticsActivityContext,
  ): Promise<AnalyticsActivitySection> {
    const ids = context.userIds;

    if (!ids.length) {
      return {
        moduleKey: this.moduleKey,
        moduleLabel: this.moduleLabel,
        metrics: [],
        hasActivity: false,
      };
    }

    const receipts = () =>
      this.receiptRepository
        .createQueryBuilder('receipt')
        .innerJoin('project', 'project', 'project.id = receipt.projectId')
        .where('receipt.isHidden = false')
        .andWhere('project.isHidden = false')
        .andWhere('receipt.collectedBy IN (:...ids)', { ids });

    const receiptApprovals = () =>
      this.receiptRepository
        .createQueryBuilder('receipt')
        .innerJoin('project', 'project', 'project.id = receipt.projectId')
        .where('receipt.isHidden = false')
        .andWhere('project.isHidden = false')
        .andWhere('receipt.approvedBy IN (:...ids)', { ids });

    const installmentsCreated = () =>
      this.installmentRepository
        .createQueryBuilder('installment')
        .innerJoin('project', 'project', 'project.id = installment.projectId')
        .where('installment.isHidden = false')
        .andWhere('project.isHidden = false')
        .andWhere('installment.createdBy IN (:...ids)', { ids });

    const installmentApprovals = () =>
      this.installmentRepository
        .createQueryBuilder('installment')
        .innerJoin('project', 'project', 'project.id = installment.projectId')
        .where('installment.isHidden = false')
        .andWhere('project.isHidden = false')
        .andWhere('installment.approvedBy IN (:...ids)', { ids });

    const duringPeriod = <T extends object>(
      qb: SelectQueryBuilder<T>,
      alias: 'receipt' | 'installment',
      column: 'createdAt' | 'approvedAt',
    ): SelectQueryBuilder<T> =>
      qb.andWhere(
        `${alias}.${column} >= :fromDate AND ${alias}.${column} <= :toDate`,
        {
          fromDate: context.fromDate,
          toDate: context.toDate,
        },
      );

    const amount = <T extends object>(
      qb: SelectQueryBuilder<T>,
      alias: 'receipt' | 'installment',
      column: 'receivedAmount' | 'pendingAmount',
    ): Promise<number> =>
      qb
        .select(`COALESCE(SUM(${alias}.${column}), 0)`, 'amount')
        .getRawOne<{ amount: string }>()
        .then((row) => Number(row?.amount || 0));

    const approvedReceipts = () =>
      receipts().andWhere("receipt.approvalStatus = 'APPROVED'");

    const pendingReceipts = () =>
      receipts().andWhere("receipt.approvalStatus = 'PENDING'");

    const approvedReceiptActions = () =>
      receiptApprovals().andWhere("receipt.approvalStatus = 'APPROVED'");

    const approvedInstallmentActions = () =>
      installmentApprovals().andWhere(
        "installment.approvalStatus = 'APPROVED'",
      );

    const [
      totalReceipts,
      approvedReceiptCount,
      pendingReceiptCount,
      rejectedReceiptCount,
      approvedReceiptAmount,
      pendingReceiptAmount,
      receiptsCreatedPeriod,
      approvedReceiptsCreatedPeriod,
      approvedReceiptAmountPeriod,
      receiptApprovalsTotal,
      receiptApprovalsPeriod,
      receiptApprovedAmount,
      installmentsCreatedTotal,
      installmentsCreatedPeriod,
      installmentPaid,
      installmentPartial,
      installmentPending,
      installmentOverdue,
      installmentCancelled,
      installmentPendingAmount,
      installmentApprovalsTotal,
      installmentApprovalsPeriod,
      approvedInstallmentsTotal,
      approvedInstallmentsPeriod,
    ] = await Promise.all([
      receipts().getCount(),
      approvedReceipts().getCount(),
      pendingReceipts().getCount(),
      receipts()
        .andWhere("receipt.approvalStatus = 'REJECTED'")
        .getCount(),
      amount(approvedReceipts(), 'receipt', 'receivedAmount'),
      amount(pendingReceipts(), 'receipt', 'receivedAmount'),
      duringPeriod(receipts(), 'receipt', 'createdAt').getCount(),
      duringPeriod(approvedReceipts(), 'receipt', 'createdAt').getCount(),
      amount(
        duringPeriod(approvedReceipts(), 'receipt', 'createdAt'),
        'receipt',
        'receivedAmount',
      ),
      approvedReceiptActions().getCount(),
      duringPeriod(
        approvedReceiptActions(),
        'receipt',
        'approvedAt',
      ).getCount(),
      amount(
        approvedReceiptActions(),
        'receipt',
        'receivedAmount',
      ),
      installmentsCreated().getCount(),
      duringPeriod(
        installmentsCreated(),
        'installment',
        'createdAt',
      ).getCount(),
      installmentsCreated()
        .andWhere('installment.status = :status', {
          status: ProjectPaymentInstallmentStatus.PAID,
        })
        .getCount(),
      installmentsCreated()
        .andWhere('installment.status = :status', {
          status: ProjectPaymentInstallmentStatus.PARTIAL,
        })
        .getCount(),
      installmentsCreated()
        .andWhere('installment.status = :status', {
          status: ProjectPaymentInstallmentStatus.PENDING,
        })
        .getCount(),
      installmentsCreated()
        .andWhere('installment.status = :status', {
          status: ProjectPaymentInstallmentStatus.OVERDUE,
        })
        .getCount(),
      installmentsCreated()
        .andWhere('installment.status = :status', {
          status: ProjectPaymentInstallmentStatus.CANCELLED,
        })
        .getCount(),
      amount(installmentsCreated(), 'installment', 'pendingAmount'),
      installmentApprovals().getCount(),
      duringPeriod(
        installmentApprovals(),
        'installment',
        'approvedAt',
      ).getCount(),
      approvedInstallmentActions().getCount(),
      duringPeriod(
        approvedInstallmentActions(),
        'installment',
        'approvedAt',
      ).getCount(),
    ]);

    const metrics: AnalyticsActivitySection['metrics'] = [];

    const add = (
      key: string,
      label: string,
      kind: AnalyticsActivitySection['metrics'][number]['kind'],
      value: number,
      attribution: string,
      timeScope: 'CURRENT' | 'PERIOD',
      unit: 'COUNT' | 'INR' = 'COUNT',
      description?: string,
    ) => {
      metrics.push({
        key,
        label,
        kind,
        value,
        attribution,
        timeScope,
        unit,
        ...(description ? { description } : {}),
      });
    };

    add('receipts_attributed', 'Receipts Attributed to Collector',
      'ASSIGNED_WORK', totalReceipts, 'receipt.collectedBy', 'CURRENT');

    add('approved_receipts', 'Approved Receipts Attributed',
      'OUTCOME', approvedReceiptCount, 'receipt.collectedBy and approvalStatus', 'CURRENT');

    add('pending_receipts', 'Pending Receipts Attributed',
      'PIPELINE', pendingReceiptCount, 'receipt.collectedBy and approvalStatus', 'CURRENT');

    add('rejected_receipts', 'Rejected Receipts Attributed',
      'PIPELINE', rejectedReceiptCount, 'receipt.collectedBy and approvalStatus', 'CURRENT');

    add('approved_receipt_amount', 'Approved Receipt Amount Attributed',
      'FINANCIAL', approvedReceiptAmount, 'receipt.collectedBy and approved receivedAmount',
      'CURRENT', 'INR',
      'Approved receipt amounts attributed to the recorded collector; not proof of physical cash handling.');

    add('pending_receipt_amount', 'Pending Receipt Amount Attributed',
      'FINANCIAL', pendingReceiptAmount, 'receipt.collectedBy and pending receivedAmount',
      'CURRENT', 'INR');

    add('receipts_created_period', 'Collector-Attributed Receipts Created During Period',
      'CREATED_WORK', receiptsCreatedPeriod, 'receipt.collectedBy and createdAt',
      'PERIOD', 'COUNT',
      'The receipt entity does not record createdBy; this is attribution to the recorded collector.');

    add('approved_receipts_created_period', 'Currently Approved Receipts Created During Period',
      'OUTCOME', approvedReceiptsCreatedPeriod, 'receipt.collectedBy, createdAt and current approvalStatus',
      'PERIOD');

    add('approved_receipt_amount_created_period', 'Currently Approved Receipt Amount Created During Period',
      'FINANCIAL', approvedReceiptAmountPeriod,
      'receipt.collectedBy, createdAt and current approvalStatus', 'PERIOD', 'INR',
      'Grouped by receipt creation date, not approval date or bank settlement date.');

    add('receipt_approvals', 'Approved Receipts Attributed to Approver',
      'COMPLETED_WORK', receiptApprovalsTotal, 'receipt.approvedBy and approvalStatus',
      'CURRENT');

    add('receipt_approvals_period', 'Receipt Approvals During Period',
      'COMPLETED_WORK', receiptApprovalsPeriod, 'receipt.approvedBy and approvedAt',
      'PERIOD');

    add('receipt_approved_amount', 'Receipt Amount Approved by Employee',
      'FINANCIAL', receiptApprovedAmount, 'receipt.approvedBy and approved receivedAmount',
      'CURRENT', 'INR',
      'Approval responsibility, not collection attribution. Do not add to collector amount.');

    add('installments_created', 'Installments Created by Employee',
      'CREATED_WORK', installmentsCreatedTotal, 'installment.createdBy',
      'CURRENT');

    add('installments_created_period', 'Installments Created During Period',
      'CREATED_WORK', installmentsCreatedPeriod, 'installment.createdBy and createdAt',
      'PERIOD');

    const statuses = [
      ['paid', 'Paid', installmentPaid],
      ['partial', 'Partial', installmentPartial],
      ['pending', 'Pending', installmentPending],
      ['overdue', 'Overdue', installmentOverdue],
      ['cancelled', 'Cancelled', installmentCancelled],
    ] as const;

    for (const [key, label, value] of statuses) {
      add(`created_installments_${key}`, `Created Installments: ${label}`,
        'PIPELINE', value, 'installment.createdBy and current status', 'CURRENT');
    }

    add('created_installments_pending_amount',
      'Outstanding Amount on Created Installments',
      'FINANCIAL', installmentPendingAmount,
      'installment.createdBy and pendingAmount', 'CURRENT', 'INR',
      'Current outstanding balance on installments created by the employee, not a personal collection target.');

    add('installment_approval_records', 'Installment Approval-Attributed Records',
      'COMPLETED_WORK', installmentApprovalsTotal, 'installment.approvedBy',
      'CURRENT');

    add('installment_approval_records_period', 'Installment Approvals Recorded During Period',
      'COMPLETED_WORK', installmentApprovalsPeriod, 'installment.approvedBy and approvedAt',
      'PERIOD');

    add('approved_installments', 'Currently Approved Installments by Approver',
      'COMPLETED_WORK', approvedInstallmentsTotal,
      'installment.approvedBy and current approvalStatus', 'CURRENT');

    add('approved_installments_period', 'Currently Approved Installments Approved During Period',
      'COMPLETED_WORK', approvedInstallmentsPeriod,
      'installment.approvedBy, approvedAt and current approvalStatus', 'PERIOD');

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity:
        totalReceipts > 0 ||
        receiptApprovalsTotal > 0 ||
        installmentsCreatedTotal > 0 ||
        installmentApprovalsTotal > 0,
    };
  }
}
