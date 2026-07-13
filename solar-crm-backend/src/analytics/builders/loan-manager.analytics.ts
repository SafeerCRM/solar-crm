import { Repository } from 'typeorm';

import { User } from '../../users/user.entity';
import { Project } from '../../project/project.entity';
import {
  ProjectLoanDetail,
  ProjectLoanStatus,
  ProjectLoanType,
} from '../../project/project-loan-detail.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
  normalizeAnalyticsText,
  canViewAllAnalytics,
} from '../helpers/analytics-filter.helper';

export class LoanManagerAnalyticsBuilder {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly projectRepository: Repository<Project>,
    private readonly loanDetailRepository: Repository<ProjectLoanDetail>,
  ) {}

  private async getUserIds(query: AnalyticsQuery, user: any) {
    const canViewAll = canViewAllAnalytics(user);
    const currentUserId = Number(
      user?.id || user?.userId || user?.sub || 0,
    );
    const selectedUserId = query.userId
      ? Number(query.userId)
      : null;

    if (!canViewAll) {
      return currentUserId ? [currentUserId] : [];
    }

    if (selectedUserId) {
      return [selectedUserId];
    }

    return [];
  }

  async build(query: AnalyticsQuery, user: any) {
    const { start, end } = getAnalyticsDateRange(query);
    const userIds = await this.getUserIds(query, user);

    const loanQb = this.loanDetailRepository
      .createQueryBuilder('loan')
      .innerJoin(
        Project,
        'project',
        'project.id = loan.projectId AND project.isHidden = false',
      )
      .where('loan.updatedAt BETWEEN :start AND :end', {
        start,
        end,
      });

    if (userIds.length) {
      loanQb.andWhere('loan.updatedBy IN (:...userIds)', {
        userIds,
      });
    }

    const branchName = normalizeAnalyticsText(query.branchName);

    if (branchName) {
      loanQb.andWhere(
        `LOWER(COALESCE(project.branchName, '')) LIKE :branchName`,
        {
          branchName: `%${branchName}%`,
        },
      );
    }

    const city = normalizeAnalyticsText(query.city);

    if (city) {
      loanQb.andWhere(
        `LOWER(COALESCE(project.city, '')) LIKE :city`,
        {
          city: `%${city}%`,
        },
      );
    }

    const zone = normalizeAnalyticsText(query.zone);

    if (zone) {
      loanQb.andWhere(
        `LOWER(COALESCE(project.zone, '')) LIKE :zone`,
        {
          zone: `%${zone}%`,
        },
      );
    }

    const [
      totalLoanFiles,
      documentPending,
      documentCompleted,
      registrationCompleted,
      inPrincipalGenerated,
      quotationSubmitted,
      bankVisited,
      loanDisbursed,
      fileRejected,
      loanReapply,
      subsidyLoans,
      privateLoans,
      requiresCoApplicant,
      amountSummary,
      statusRows,
      loanTypeRows,
      managerWiseRows,
      fileRows,
    ] = await Promise.all([
      loanQb.clone().getCount(),

      loanQb
        .clone()
        .andWhere('loan.status = :status', {
          status: ProjectLoanStatus.DOCUMENT_PENDING,
        })
        .getCount(),

      loanQb
        .clone()
        .andWhere('loan.status = :status', {
          status: ProjectLoanStatus.DOCUMENT_COMPLETED,
        })
        .getCount(),

      loanQb
        .clone()
        .andWhere('loan.status = :status', {
          status: ProjectLoanStatus.REGISTRATION_COMPLETED,
        })
        .getCount(),

      loanQb
        .clone()
        .andWhere('loan.status = :status', {
          status: ProjectLoanStatus.IN_PRINCIPAL_GENERATED,
        })
        .getCount(),

      loanQb
        .clone()
        .andWhere('loan.status = :status', {
          status: ProjectLoanStatus.QUOTATION_SUBMITTED,
        })
        .getCount(),

      loanQb
        .clone()
        .andWhere('loan.status = :status', {
          status: ProjectLoanStatus.BANK_VISITED,
        })
        .getCount(),

      loanQb
        .clone()
        .andWhere('loan.status = :status', {
          status: ProjectLoanStatus.LOAN_DISBURSED,
        })
        .getCount(),

      loanQb
        .clone()
        .andWhere('loan.status = :status', {
          status: ProjectLoanStatus.FILE_REJECTED,
        })
        .getCount(),

      loanQb
        .clone()
        .andWhere('loan.status = :status', {
          status: ProjectLoanStatus.LOAN_REAPPLY,
        })
        .getCount(),

      loanQb
        .clone()
        .andWhere('loan.loanType = :loanType', {
          loanType: ProjectLoanType.SUBSIDY_LOAN,
        })
        .getCount(),

      loanQb
        .clone()
        .andWhere('loan.loanType = :loanType', {
          loanType: ProjectLoanType.PRIVATE_LOAN,
        })
        .getCount(),

      loanQb
        .clone()
        .andWhere('loan.requiresCoApplicant = true')
        .getCount(),

      loanQb
        .clone()
        .select(
          'COALESCE(SUM(loan.marginMoney), 0)',
          'marginMoney',
        )
        .addSelect(
          'COALESCE(SUM(loan.sanctionAmount), 0)',
          'sanctionAmount',
        )
        .addSelect(
          'COALESCE(SUM(loan.firstEmiDisbursementAmount), 0)',
          'firstEmiDisbursementAmount',
        )
        .getRawOne(),

      loanQb
        .clone()
        .select('loan."status"::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('loan."status"')
        .orderBy('COUNT(*)', 'DESC')
        .getRawMany(),

      loanQb
        .clone()
        .select(
          `COALESCE(loan."loanType"::text, 'UNASSIGNED')`,
          'label',
        )
        .addSelect('COUNT(*)', 'value')
        .groupBy('loan."loanType"')
        .orderBy('COUNT(*)', 'DESC')
        .getRawMany(),

      loanQb
        .clone()
        .select('loan.updatedBy', 'userId')
        .addSelect('COUNT(*)', 'totalFiles')
        .addSelect(
          `SUM(CASE WHEN loan.status = :documentPending THEN 1 ELSE 0 END)`,
          'documentPending',
        )
        .addSelect(
          `SUM(CASE WHEN loan.status = :documentCompleted THEN 1 ELSE 0 END)`,
          'documentCompleted',
        )
        .addSelect(
          `SUM(CASE WHEN loan.status = :bankVisited THEN 1 ELSE 0 END)`,
          'bankVisited',
        )
        .addSelect(
          `SUM(CASE WHEN loan.status = :loanDisbursed THEN 1 ELSE 0 END)`,
          'loanDisbursed',
        )
        .addSelect(
          `SUM(CASE WHEN loan.status = :fileRejected THEN 1 ELSE 0 END)`,
          'fileRejected',
        )
        .setParameters({
          documentPending:
            ProjectLoanStatus.DOCUMENT_PENDING,
          documentCompleted:
            ProjectLoanStatus.DOCUMENT_COMPLETED,
          bankVisited: ProjectLoanStatus.BANK_VISITED,
          loanDisbursed:
            ProjectLoanStatus.LOAN_DISBURSED,
          fileRejected: ProjectLoanStatus.FILE_REJECTED,
        })
        .andWhere('loan.updatedBy IS NOT NULL')
        .groupBy('loan.updatedBy')
        .orderBy('COUNT(*)', 'DESC')
        .limit(50)
        .getRawMany(),

      loanQb
        .clone()
        .select('loan.projectId', 'projectId')
        .addSelect('project.customerName', 'customerName')
        .addSelect('project.customerPhone', 'customerPhone')
        .addSelect('project.branchName', 'branchName')
        .addSelect('loan.loanType', 'loanType')
        .addSelect('loan.bankName', 'bankName')
        .addSelect(
          'loan.applicationNumber',
          'applicationNumber',
        )
        .addSelect('loan.status', 'status')
        .addSelect('loan.sanctionAmount', 'sanctionAmount')
        .addSelect(
          'loan.firstEmiDisbursementAmount',
          'firstEmiDisbursementAmount',
        )
        .addSelect(
          'loan.requiresCoApplicant',
          'requiresCoApplicant',
        )
        .addSelect('loan.updatedBy', 'updatedBy')
        .addSelect('loan.updatedByName', 'updatedByName')
        .addSelect('loan.updatedAt', 'updatedAt')
        .orderBy('loan.updatedAt', 'DESC')
        .limit(100)
        .getRawMany(),
    ]);

    const managerIds = managerWiseRows
      .map((row) => Number(row.userId || 0))
      .filter(Boolean);

    const managers = managerIds.length
      ? await this.userRepository
          .createQueryBuilder('user')
          .where('user.id IN (:...managerIds)', {
            managerIds,
          })
          .getMany()
      : [];

    const managerNameMap = new Map(
      managers.map((manager) => [
        Number(manager.id),
        manager.name ||
          manager.email ||
          `User #${manager.id}`,
      ]),
    );

    const completedWork =
      documentCompleted +
      registrationCompleted +
      inPrincipalGenerated +
      quotationSubmitted +
      bankVisited +
      loanDisbursed;

    const processingSuccessPercent =
      totalLoanFiles > 0
        ? Math.round(
            (loanDisbursed / totalLoanFiles) * 100,
          )
        : 0;

    return {
      department: 'PROJECTS',
      role: 'LOAN_MANAGER',
      title: 'Loan Manager Work Report',

      cards: {
        totalLoanFiles,
        documentPending,
        documentCompleted,
        registrationCompleted,
        inPrincipalGenerated,
        quotationSubmitted,
        bankVisited,
        loanDisbursed,
        fileRejected,
        loanReapply,

        completedWork,
        processingSuccessPercent,

        subsidyLoans,
        privateLoans,
        requiresCoApplicant,

        marginMoney: Number(
          amountSummary?.marginMoney || 0,
        ),
        sanctionAmount: Number(
          amountSummary?.sanctionAmount || 0,
        ),
        firstEmiDisbursementAmount: Number(
          amountSummary?.firstEmiDisbursementAmount || 0,
        ),
      },

      charts: {
        loanStatusDistribution: {
          type: 'bar',
          title: 'Loan File Status Distribution',
          data: statusRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },

        loanTypeDistribution: {
          type: 'bar',
          title: 'Loan Type Distribution',
          data: loanTypeRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },

        loanWorkflow: {
          type: 'funnel',
          title: 'Loan Processing Workflow',
          data: [
            {
              label: 'Total Loan Files',
              value: totalLoanFiles,
              percent: 100,
            },
            {
              label: 'Documents Completed',
              value: documentCompleted,
              percent:
                totalLoanFiles > 0
                  ? Math.round(
                      (documentCompleted /
                        totalLoanFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Registration Completed',
              value: registrationCompleted,
              percent:
                totalLoanFiles > 0
                  ? Math.round(
                      (registrationCompleted /
                        totalLoanFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'In Principal Generated',
              value: inPrincipalGenerated,
              percent:
                totalLoanFiles > 0
                  ? Math.round(
                      (inPrincipalGenerated /
                        totalLoanFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Quotation Submitted',
              value: quotationSubmitted,
              percent:
                totalLoanFiles > 0
                  ? Math.round(
                      (quotationSubmitted /
                        totalLoanFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Bank Visited',
              value: bankVisited,
              percent:
                totalLoanFiles > 0
                  ? Math.round(
                      (bankVisited / totalLoanFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Loan Disbursed',
              value: loanDisbursed,
              percent: processingSuccessPercent,
            },
          ],
        },
      },

      rows: managerWiseRows.map((row) => {
        const userId = row.userId
          ? Number(row.userId)
          : null;

        return {
          userId,
          userName: userId
            ? managerNameMap.get(userId) ||
              `User #${userId}`
            : '-',
          totalFiles: Number(row.totalFiles || 0),
          documentPending: Number(
            row.documentPending || 0,
          ),
          documentCompleted: Number(
            row.documentCompleted || 0,
          ),
          bankVisited: Number(row.bankVisited || 0),
          loanDisbursed: Number(
            row.loanDisbursed || 0,
          ),
          fileRejected: Number(
            row.fileRejected || 0,
          ),
        };
      }),

      fileRows: fileRows.map((row) => ({
        projectId: Number(row.projectId || 0),
        customerName: row.customerName || '',
        customerPhone: row.customerPhone || '',
        branchName: row.branchName || '',
        loanType: row.loanType || '',
        bankName: row.bankName || '',
        applicationNumber: row.applicationNumber || '',
        status: row.status || '',
        sanctionAmount: Number(
          row.sanctionAmount || 0,
        ),
        firstEmiDisbursementAmount: Number(
          row.firstEmiDisbursementAmount || 0,
        ),
        requiresCoApplicant:
          row.requiresCoApplicant === true ||
          row.requiresCoApplicant === 'true',
        updatedBy: row.updatedBy
          ? Number(row.updatedBy)
          : null,
        updatedByName: row.updatedByName || '',
        updatedAt: row.updatedAt,
      })),

      range: { start, end },
    };
  }
}