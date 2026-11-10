import { Repository } from 'typeorm';

import {
  ProjectLoanDetail,
  ProjectLoanStatus,
  ProjectLoanType,
} from '../../project/project-loan-detail.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class LoanManagementActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'LOAN_MANAGEMENT';
  readonly moduleLabel = 'Loan Management';

  constructor(
    private readonly loanRepository: Repository<ProjectLoanDetail>,
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

    const loans = () =>
      this.loanRepository
        .createQueryBuilder('loan')
        .innerJoin(
          'project',
          'project',
          'project.id = loan.projectId',
        )
        .where('project.isHidden = false')
        .andWhere('loan.updatedBy IN (:...ids)', { ids });

    const periodLoans = () =>
      loans().andWhere(
        'loan.updatedAt >= :fromDate AND loan.updatedAt <= :toDate',
        {
          fromDate: context.fromDate,
          toDate: context.toDate,
        },
      );

    const statusMetrics = [
      ['document_pending', 'Document Pending', ProjectLoanStatus.DOCUMENT_PENDING],
      ['document_completed', 'Document Completed', ProjectLoanStatus.DOCUMENT_COMPLETED],
      ['registration_completed', 'Registration Completed', ProjectLoanStatus.REGISTRATION_COMPLETED],
      ['in_principal_generated', 'In-Principle Generated', ProjectLoanStatus.IN_PRINCIPAL_GENERATED],
      ['quotation_submitted', 'Quotation Submitted', ProjectLoanStatus.QUOTATION_SUBMITTED],
      ['bank_visited', 'Bank Visited', ProjectLoanStatus.BANK_VISITED],
      ['loan_disbursed', 'Loan Disbursed', ProjectLoanStatus.LOAN_DISBURSED],
      ['file_rejected', 'File Rejected', ProjectLoanStatus.FILE_REJECTED],
      ['loan_reapply', 'Loan Reapply', ProjectLoanStatus.LOAN_REAPPLY],
    ] as const;

    const [
      totalLoans,
      periodUpdates,
      periodRecordsCreated,
      subsidyLoans,
      privateLoans,
      unspecifiedLoanType,
      requiresCoApplicant,
      recordedFirstDisbursementAmount,
      recordedSanctionAmount,
      ...statusCounts
    ] = await Promise.all([
      loans().getCount(),

      periodLoans().getCount(),

      loans()
        .andWhere(
          'loan.createdAt >= :fromDate AND loan.createdAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      loans()
        .andWhere('loan.loanType = :loanType', {
          loanType: ProjectLoanType.SUBSIDY_LOAN,
        })
        .getCount(),

      loans()
        .andWhere('loan.loanType = :loanType', {
          loanType: ProjectLoanType.PRIVATE_LOAN,
        })
        .getCount(),

      loans()
        .andWhere('loan.loanType IS NULL')
        .getCount(),

      loans()
        .andWhere('loan.requiresCoApplicant = true')
        .getCount(),

      loans()
        .select(
          'COALESCE(SUM(loan.firstEmiDisbursementAmount), 0)',
          'amount',
        )
        .getRawOne<{ amount: string }>()
        .then((row) => Number(row?.amount || 0)),

      loans()
        .select(
          'COALESCE(SUM(loan.sanctionAmount), 0)',
          'amount',
        )
        .getRawOne<{ amount: string }>()
        .then((row) => Number(row?.amount || 0)),

      ...statusMetrics.map(([, , status]) =>
        loans()
          .andWhere('loan.status = :status', { status })
          .getCount(),
      ),
    ]);

    const metrics: AnalyticsActivitySection['metrics'] = [
      {
        key: 'latest_updated_loans',
        label: 'Loan Files with Latest Update Attributed',
        kind: 'UPDATED_WORK',
        value: totalLoans,
        unit: 'COUNT',
        attribution: 'updatedBy',
        timeScope: 'CURRENT',
        description:
          'Current loan records whose latest updater is the selected employee. Not total historical updates or assigned workload.',
      },
      {
        key: 'latest_updated_period',
        label: 'Latest Loan Updates During Period',
        kind: 'UPDATED_WORK',
        value: periodUpdates,
        unit: 'COUNT',
        attribution: 'updatedBy and updatedAt',
        timeScope: 'PERIOD',
        description:
          'Counts loan records whose latest stored update occurred during the reporting period.',
      },
      {
        key: 'records_created_period',
        label: 'Loan Records Created During Period',
        kind: 'PIPELINE',
        value: periodRecordsCreated,
        unit: 'COUNT',
        attribution: 'updatedBy and createdAt',
        timeScope: 'PERIOD',
        description:
          'New loan records currently attributed to this latest updater. The original creator is not recorded.',
      },
      ...statusMetrics.map(([key, label], index) => ({
        key: `status_${key}`,
        label: `Current Status: ${label}`,
        kind: 'PIPELINE' as const,
        value: Number(statusCounts[index] || 0),
        unit: 'COUNT' as const,
        attribution: 'updatedBy and current loan status',
        timeScope: 'CURRENT' as const,
        description:
          'Current loan status of files last updated by this employee; not proof that the employee personally achieved this milestone.',
      })),
      {
        key: 'subsidy_loans',
        label: 'Subsidy Loan Files',
        kind: 'PIPELINE',
        value: subsidyLoans,
        unit: 'COUNT',
        attribution: 'updatedBy and loanType',
        timeScope: 'CURRENT',
      },
      {
        key: 'private_loans',
        label: 'Private Loan Files',
        kind: 'PIPELINE',
        value: privateLoans,
        unit: 'COUNT',
        attribution: 'updatedBy and loanType',
        timeScope: 'CURRENT',
      },
      {
        key: 'unspecified_loan_type',
        label: 'Loan Type Not Specified',
        kind: 'PIPELINE',
        value: unspecifiedLoanType,
        unit: 'COUNT',
        attribution: 'updatedBy and loanType',
        timeScope: 'CURRENT',
      },
      {
        key: 'requires_co_applicant',
        label: 'Files Requiring Co-Applicant',
        kind: 'PIPELINE',
        value: requiresCoApplicant,
        unit: 'COUNT',
        attribution: 'updatedBy and requiresCoApplicant',
        timeScope: 'CURRENT',
      },
      {
        key: 'recorded_sanction_amount',
        label: 'Recorded Sanction Amount',
        kind: 'FINANCIAL',
        value: recordedSanctionAmount,
        unit: 'INR',
        attribution: 'updatedBy and sanctionAmount',
        timeScope: 'CURRENT',
        description:
          'Sum of recorded sanction amounts on files currently attributed to the employee; not personal financial achievement.',
      },
      {
        key: 'recorded_first_disbursement_amount',
        label: 'Recorded First Disbursement Amount',
        kind: 'FINANCIAL',
        value: recordedFirstDisbursementAmount,
        unit: 'INR',
        attribution: 'updatedBy and firstEmiDisbursementAmount',
        timeScope: 'CURRENT',
        description:
          'Sum of recorded first disbursement amounts, regardless of current loan status. Not independently verified bank disbursements.',
      },
    ];

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity: totalLoans > 0,
    };
  }
}