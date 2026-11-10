
import { Repository } from 'typeorm';

import { Project } from '../../project/project.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class ProjectManagementActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'PROJECT_MANAGEMENT';
  readonly moduleLabel = 'Project Management';

  constructor(
    private readonly projectRepository: Repository<Project>,
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

    const visible = () =>
      this.projectRepository
        .createQueryBuilder('project')
        .where('project.isHidden = false');

    const owned = () =>
      visible().andWhere(
        'project.projectOwnerId IN (:...ids)',
        { ids },
      );

    const approvedByManager = () =>
      visible().andWhere(
        'project.projectManagerApprovedBy IN (:...ids)',
        { ids },
      );

    const period = (
      column: string,
    ) => ({
      clause:
        `${column} >= :fromDate AND ${column} <= :toDate`,
      params: {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    });

    const [
      ownedProjects,
      completedOwned,
      managementOwned,
      subsidyOwned,
      loanOwned,
      pendingApprovalOwned,
      rejectedOwned,
      cancelledOwned,
      createdDuringPeriod,
      managerApprovals,
      managerApproved,
      managerRejected,
      periodManagerDecisions,
      marketingDecisions,
      ownerDecisions,
      latestWorkStateUpdates,
      periodLatestWorkStateUpdates,
    ] = await Promise.all([
      owned().getCount(),

      owned()
        .andWhere('project.status = :status', {
          status: 'COMPLETED',
        })
        .getCount(),

      owned()
        .andWhere('project.status = :status', {
          status: 'PROJECT_MANAGEMENT',
        })
        .getCount(),

      owned()
        .andWhere('project.status = :status', {
          status: 'SUBSIDY_PROCESS',
        })
        .getCount(),

      owned()
        .andWhere('project.status = :status', {
          status: 'LOAN_PROCESS',
        })
        .getCount(),

      owned()
        .andWhere('project.status = :status', {
          status: 'PENDING_APPROVAL',
        })
        .getCount(),

      owned()
        .andWhere('project.status = :status', {
          status: 'REJECTED',
        })
        .getCount(),

      owned()
        .andWhere('project.status = :status', {
          status: 'CANCELLED',
        })
        .getCount(),

      visible()
        .andWhere('project.createdBy IN (:...ids)', { ids })
        .andWhere(
          period('project.createdAt').clause,
          period('project.createdAt').params,
        )
        .getCount(),

      approvedByManager().getCount(),

      approvedByManager()
        .andWhere(
          'project.projectManagerApprovalStatus = :status',
          { status: 'APPROVED' },
        )
        .getCount(),

      approvedByManager()
        .andWhere(
          'project.projectManagerApprovalStatus = :status',
          { status: 'REJECTED' },
        )
        .getCount(),

      approvedByManager()
        .andWhere(
          period('project.projectManagerApprovedAt').clause,
          period('project.projectManagerApprovedAt').params,
        )
        .getCount(),

      visible()
        .andWhere(
          'project.marketingHeadApprovedBy IN (:...ids)',
          { ids },
        )
        .getCount(),

      visible()
        .andWhere(
          'project.ownerApprovedBy IN (:...ids)',
          { ids },
        )
        .getCount(),

      visible()
        .andWhere(
          'project.projectWorkStateUpdatedBy IN (:...ids)',
          { ids },
        )
        .getCount(),

      visible()
        .andWhere(
          'project.projectWorkStateUpdatedBy IN (:...ids)',
          { ids },
        )
        .andWhere(
          period('project.projectWorkStateUpdatedAt').clause,
          period('project.projectWorkStateUpdatedAt').params,
        )
        .getCount(),
    ]);

    const metrics: AnalyticsActivitySection['metrics'] = [
      {
        key: 'owned',
        label: 'Currently Owned Visible Projects',
        kind: 'ASSIGNED_WORK',
        value: ownedProjects,
        unit: 'COUNT',
        attribution: 'projectOwnerId',
        timeScope: 'CURRENT',
      },
      ...[
        ['completed', 'Completed Projects', completedOwned],
        ['management', 'Project Management Stage', managementOwned],
        ['subsidy', 'Subsidy Process Stage', subsidyOwned],
        ['loan', 'Loan Process Stage', loanOwned],
        ['pending_approval', 'Pending Approval Stage', pendingApprovalOwned],
        ['rejected', 'Rejected Projects', rejectedOwned],
        ['cancelled', 'Cancelled Projects', cancelledOwned],
      ].map(([key, label, value]) => ({
        key: `owned_${key}`,
        label: String(label),
        kind: 'PIPELINE' as const,
        value: Number(value),
        unit: 'COUNT' as const,
        attribution: 'projectOwnerId and current project status',
        timeScope: 'CURRENT' as const,
      })),
      {
        key: 'created_period',
        label: 'Projects Created During Period',
        kind: 'CREATED_WORK',
        value: createdDuringPeriod,
        unit: 'COUNT',
        attribution: 'createdBy and createdAt',
        timeScope: 'PERIOD',
        description:
          'Only projects with recorded creator attribution.',
      },
      {
        key: 'manager_decisions',
        label: 'Project Manager Decisions Recorded',
        kind: 'UPDATED_WORK',
        value: managerApprovals,
        unit: 'COUNT',
        attribution: 'projectManagerApprovedBy',
        timeScope: 'CURRENT',
        description:
          'Projects currently attributed to this approver, not a complete decision history.',
      },
      {
        key: 'manager_approved',
        label: 'Manager Approved Projects',
        kind: 'OUTCOME',
        value: managerApproved,
        unit: 'COUNT',
        attribution: 'projectManagerApprovedBy and approval status',
        timeScope: 'CURRENT',
      },
      {
        key: 'manager_rejected',
        label: 'Manager Rejected Projects',
        kind: 'OUTCOME',
        value: managerRejected,
        unit: 'COUNT',
        attribution: 'projectManagerApprovedBy and approval status',
        timeScope: 'CURRENT',
      },
      {
        key: 'manager_decisions_period',
        label: 'Manager Decisions During Period',
        kind: 'UPDATED_WORK',
        value: periodManagerDecisions,
        unit: 'COUNT',
        attribution: 'projectManagerApprovedBy and projectManagerApprovedAt',
        timeScope: 'PERIOD',
      },
      {
        key: 'marketing_decisions',
        label: 'Marketing Approval Decisions Recorded',
        kind: 'UPDATED_WORK',
        value: marketingDecisions,
        unit: 'COUNT',
        attribution: 'marketingHeadApprovedBy',
        timeScope: 'CURRENT',
      },
      {
        key: 'owner_decisions',
        label: 'Owner Approval Decisions Recorded',
        kind: 'UPDATED_WORK',
        value: ownerDecisions,
        unit: 'COUNT',
        attribution: 'ownerApprovedBy',
        timeScope: 'CURRENT',
      },
      {
        key: 'latest_state_updates',
        label: 'Projects with Latest Work-State Update Attributed',
        kind: 'UPDATED_WORK',
        value: latestWorkStateUpdates,
        unit: 'COUNT',
        attribution: 'projectWorkStateUpdatedBy',
        timeScope: 'CURRENT',
        description:
          'Counts projects whose last work-state updater matches; not total update events.',
      },
      {
        key: 'period_latest_state_updates',
        label: 'Latest Work-State Updates During Period',
        kind: 'UPDATED_WORK',
        value: periodLatestWorkStateUpdates,
        unit: 'COUNT',
        attribution: 'projectWorkStateUpdatedBy and projectWorkStateUpdatedAt',
        timeScope: 'PERIOD',
        description:
          'Only latest stored work-state updates within the reporting period.',
      },
    ];

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity:
        ownedProjects > 0 ||
        createdDuringPeriod > 0 ||
        managerApprovals > 0 ||
        marketingDecisions > 0 ||
        ownerDecisions > 0 ||
        latestWorkStateUpdates > 0,
    };
  }
}
