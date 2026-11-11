
import { Repository, SelectQueryBuilder } from 'typeorm';

import {
  ProjectAccountExpense,
  ProjectAccountExpenseApprovalStatus,
} from '../../project/project-account-expense.entity';

import {
  ProjectPartyLedger,
  ProjectLedgerEntryType,
  ProjectLedgerSourceType,
} from '../../project/project-party-ledger.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class AccountsExpensesActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'ACCOUNTS_EXPENSES';
  readonly moduleLabel = 'Accounts & Expenses';

  constructor(
    private readonly expenseRepository: Repository<ProjectAccountExpense>,
    private readonly ledgerRepository: Repository<ProjectPartyLedger>,
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

    const expensesCreated = () =>
      this.expenseRepository
        .createQueryBuilder('expense')
        .where('expense.isHidden = false')
        .andWhere('expense.createdBy IN (:...ids)', { ids });

    const expenseApprovals = () =>
      this.expenseRepository
        .createQueryBuilder('expense')
        .where('expense.isHidden = false')
        .andWhere('expense.approvedBy IN (:...ids)', { ids });

    const ledgerCreated = () =>
      this.ledgerRepository
        .createQueryBuilder('ledger')
        .where('ledger.isHidden = false')
        .andWhere('ledger.createdBy IN (:...ids)', { ids });

    const manualLedger = () =>
      ledgerCreated()
        .andWhere('ledger.sourceType = :sourceType', {
          sourceType: ProjectLedgerSourceType.MANUAL_ADJUSTMENT,
        })
        .andWhere('ledger.entryType = :entryType', {
          entryType: ProjectLedgerEntryType.DEBIT,
        });

    const period = <T extends object>(
      qb: SelectQueryBuilder<T>,
      alias: 'expense' | 'ledger',
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
      alias: 'expense' | 'ledger',
    ): Promise<number> =>
      qb
        .select(`COALESCE(SUM(${alias}.amount), 0)`, 'amount')
        .getRawOne<{ amount: string }>()
        .then((row) => Number(row?.amount || 0));

    const expenseStatus = (
      status: ProjectAccountExpenseApprovalStatus,
    ) =>
      expensesCreated().andWhere(
        'expense.approvalStatus = :status',
        { status },
      );

    const approvalStatus = (
      status: ProjectAccountExpenseApprovalStatus,
    ) =>
      expenseApprovals().andWhere(
        'expense.approvalStatus = :status',
        { status },
      );

    const [
      createdTotal,
      createdPeriod,
      createdAmount,
      createdAmountPeriod,
      createdApproved,
      createdPending,
      createdRejected,
      createdApprovedAmount,
      createdPendingAmount,
      createdRejectedAmount,
      approvalRecords,
      approvalsPeriod,
      currentlyApproved,
      currentlyRejected,
      approvedAmount,
      approvedPeriod,
      approvedAmountPeriod,
      ledgerTotal,
      ledgerPeriod,
      manualTotal,
      manualPeriod,
      manualAmount,
      manualAmountPeriod,
      ledgerNonManual,
    ] = await Promise.all([
      expensesCreated().getCount(),
      period(expensesCreated(), 'expense', 'createdAt').getCount(),
      amount(expensesCreated(), 'expense'),
      amount(period(expensesCreated(), 'expense', 'createdAt'), 'expense'),

      expenseStatus(ProjectAccountExpenseApprovalStatus.APPROVED).getCount(),
      expenseStatus(ProjectAccountExpenseApprovalStatus.PENDING).getCount(),
      expenseStatus(ProjectAccountExpenseApprovalStatus.REJECTED).getCount(),

      amount(expenseStatus(ProjectAccountExpenseApprovalStatus.APPROVED), 'expense'),
      amount(expenseStatus(ProjectAccountExpenseApprovalStatus.PENDING), 'expense'),
      amount(expenseStatus(ProjectAccountExpenseApprovalStatus.REJECTED), 'expense'),

      expenseApprovals().getCount(),
      period(expenseApprovals(), 'expense', 'approvedAt').getCount(),

      approvalStatus(ProjectAccountExpenseApprovalStatus.APPROVED).getCount(),
      approvalStatus(ProjectAccountExpenseApprovalStatus.REJECTED).getCount(),

      amount(approvalStatus(ProjectAccountExpenseApprovalStatus.APPROVED), 'expense'),

      period(
        approvalStatus(ProjectAccountExpenseApprovalStatus.APPROVED),
        'expense',
        'approvedAt',
      ).getCount(),

      amount(
        period(
          approvalStatus(ProjectAccountExpenseApprovalStatus.APPROVED),
          'expense',
          'approvedAt',
        ),
        'expense',
      ),

      ledgerCreated().getCount(),
      period(ledgerCreated(), 'ledger', 'createdAt').getCount(),

      manualLedger().getCount(),
      period(manualLedger(), 'ledger', 'createdAt').getCount(),
      amount(manualLedger(), 'ledger'),
      amount(period(manualLedger(), 'ledger', 'createdAt'), 'ledger'),

      ledgerCreated()
        .andWhere('ledger.sourceType != :sourceType', {
          sourceType: ProjectLedgerSourceType.MANUAL_ADJUSTMENT,
        })
        .getCount(),
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

    add('expenses_created', 'Expenses Created by Employee',
      'CREATED_WORK', createdTotal, 'expense.createdBy', 'CURRENT');

    add('expenses_created_period', 'Expenses Created During Period',
      'CREATED_WORK', createdPeriod, 'expense.createdBy and createdAt', 'PERIOD');

    add('expenses_created_amount', 'Recorded Amount of Created Expenses',
      'FINANCIAL', createdAmount, 'expense.createdBy and amount', 'CURRENT', 'INR');

    add('expenses_created_amount_period', 'Recorded Expense Amount Created During Period',
      'FINANCIAL', createdAmountPeriod,
      'expense.createdBy, createdAt and amount', 'PERIOD', 'INR');

    add('created_expenses_approved', 'Created Expenses Currently Approved',
      'OUTCOME', createdApproved, 'expense.createdBy and approvalStatus', 'CURRENT');

    add('created_expenses_pending', 'Created Expenses Currently Pending',
      'PIPELINE', createdPending, 'expense.createdBy and approvalStatus', 'CURRENT');

    add('created_expenses_rejected', 'Created Expenses Currently Rejected',
      'PIPELINE', createdRejected, 'expense.createdBy and approvalStatus', 'CURRENT');

    add('created_approved_amount', 'Approved Amount of Created Expenses',
      'FINANCIAL', createdApprovedAmount,
      'expense.createdBy, approvalStatus and amount', 'CURRENT', 'INR');

    add('created_pending_amount', 'Pending Amount of Created Expenses',
      'FINANCIAL', createdPendingAmount,
      'expense.createdBy, approvalStatus and amount', 'CURRENT', 'INR');

    add('created_rejected_amount', 'Rejected Amount of Created Expenses',
      'FINANCIAL', createdRejectedAmount,
      'expense.createdBy, approvalStatus and amount', 'CURRENT', 'INR');

    add('expense_approval_records', 'Expense Approval-Attributed Records',
      'COMPLETED_WORK', approvalRecords, 'expense.approvedBy', 'CURRENT',
      'COUNT', 'Includes currently approved and rejected records.');

    add('expense_approval_records_period', 'Expense Approval Actions During Period',
      'COMPLETED_WORK', approvalsPeriod,
      'expense.approvedBy and approvedAt', 'PERIOD');

    add('expenses_approved_by_employee', 'Currently Approved Expenses by Approver',
      'COMPLETED_WORK', currentlyApproved,
      'expense.approvedBy and approvalStatus', 'CURRENT');

    add('expenses_rejected_by_employee', 'Currently Rejected Expenses by Approver',
      'OUTCOME', currentlyRejected,
      'expense.approvedBy and approvalStatus', 'CURRENT');

    add('expense_amount_approved_by_employee', 'Expense Amount Approved by Employee',
      'FINANCIAL', approvedAmount,
      'expense.approvedBy, approvalStatus and amount', 'CURRENT', 'INR',
      'Approval attribution, not proof that the employee paid the expense.');

    add('expenses_approved_period', 'Currently Approved Expenses Approved During Period',
      'COMPLETED_WORK', approvedPeriod,
      'expense.approvedBy, approvedAt and current approvalStatus', 'PERIOD');

    add('expense_amount_approved_period', 'Expense Amount Approved During Period',
      'FINANCIAL', approvedAmountPeriod,
      'expense.approvedBy, approvedAt, current approvalStatus and amount',
      'PERIOD', 'INR');

    add('ledger_entries_created', 'Ledger Entries Created by Employee',
      'CREATED_WORK', ledgerTotal, 'ledger.createdBy', 'CURRENT',
      'COUNT', 'Includes entries originating from payments, invoices and other workflows.');

    add('ledger_entries_created_period', 'Ledger Entries Created During Period',
      'CREATED_WORK', ledgerPeriod,
      'ledger.createdBy and createdAt', 'PERIOD');

    add('manual_ledger_entries', 'Manual Debit Adjustments Created',
      'CREATED_WORK', manualTotal,
      'ledger.createdBy, sourceType and entryType', 'CURRENT');

    add('manual_ledger_entries_period', 'Manual Debit Adjustments Created During Period',
      'CREATED_WORK', manualPeriod,
      'ledger.createdBy, sourceType, entryType and createdAt', 'PERIOD');

    add('manual_ledger_amount', 'Recorded Manual Debit Adjustment Amount',
      'FINANCIAL', manualAmount,
      'ledger.createdBy, sourceType, entryType and amount', 'CURRENT', 'INR',
      'Recorded debit adjustments; not necessarily cash paid or unique expenditure.');

    add('manual_ledger_amount_period', 'Manual Debit Adjustment Amount During Period',
      'FINANCIAL', manualAmountPeriod,
      'ledger.createdBy, sourceType, entryType, createdAt and amount',
      'PERIOD', 'INR');

    add('non_manual_ledger_entries', 'Non-Manual Ledger Entries Created',
      'PIPELINE', ledgerNonManual,
      'ledger.createdBy and non-manual sourceType', 'CURRENT',
      'COUNT', 'May include automatically generated records; not necessarily manual employee actions.');

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity:
        createdTotal > 0 ||
        approvalRecords > 0 ||
        ledgerTotal > 0,
    };
  }
}
