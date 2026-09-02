import { In, Repository } from 'typeorm';

import { User } from '../../users/user.entity';
import { Project } from '../../project/project.entity';

import {
  ProjectExecutionActivity,
  ProjectExecutionActivityStatus,
} from '../../project/project-execution-activity.entity';

import {
  ProjectContractorAssignment,
  ProjectContractorWorkStatus,
} from '../../project/project-contractor-assignment.entity';

import { ProjectTimelineDelayNote } from '../../project/project-timeline-delay-note.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
  normalizeAnalyticsText,
  canViewAllAnalytics,
} from '../helpers/analytics-filter.helper';

export class ProjectManagerAnalyticsBuilder {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly projectRepository: Repository<Project>,
    private readonly executionActivityRepository: Repository<ProjectExecutionActivity>,
    private readonly contractorAssignmentRepository: Repository<ProjectContractorAssignment>,
    private readonly timelineDelayNoteRepository: Repository<ProjectTimelineDelayNote>,
  ) {}

  private async getUserIds(
    query: AnalyticsQuery,
    user: any,
  ): Promise<number[]> {
    const canViewAll = canViewAllAnalytics(user);

    const currentUserId = Number(
      user?.id ||
        user?.userId ||
        user?.sub ||
        0,
    );

    const selectedUserId = query.userId
      ? Number(query.userId)
      : null;

    const selectedRole = String(
      query.role || '',
    )
      .trim()
      .toUpperCase();

    if (!canViewAll) {
      return currentUserId > 0
        ? [currentUserId]
        : [];
    }

    if (
      selectedUserId &&
      Number.isInteger(selectedUserId) &&
      selectedUserId > 0
    ) {
      return [selectedUserId];
    }

    if (selectedRole) {
      const users =
        await this.userRepository.find({
          where: {
            isHidden: false,
          } as any,
        });

      return users
        .filter((item: any) => {
          const roles =
            Array.isArray(item.roles)
              ? item.roles.map((role: any) =>
                  String(role || '')
                    .trim()
                    .toUpperCase(),
                )
              : [];

          return roles.includes(
            selectedRole,
          );
        })
        .map((item) => Number(item.id))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0,
        );
    }

    return [];
  }

  private applyProjectFilters(
    qb: any,
    query: AnalyticsQuery,
  ) {
    const branchName =
      normalizeAnalyticsText(
        query.branchName,
      );

    const city =
      normalizeAnalyticsText(
        query.city,
      );

    const zone =
      normalizeAnalyticsText(
        query.zone,
      );

    const projectType =
      String(
        query.projectType || '',
      )
        .trim()
        .toUpperCase();

    const status =
      String(
        query.status || '',
      )
        .trim()
        .toUpperCase();

    if (branchName) {
      qb.andWhere(
        `LOWER(
          COALESCE(
            project.branchName,
            ''
          )
        ) LIKE :branchName`,
        {
          branchName:
            `%${branchName}%`,
        },
      );
    }

    if (city) {
      qb.andWhere(
        `LOWER(
          COALESCE(
            project.city,
            ''
          )
        ) LIKE :city`,
        {
          city: `%${city}%`,
        },
      );
    }

    if (zone) {
      qb.andWhere(
        `LOWER(
          COALESCE(
            project.zone,
            ''
          )
        ) LIKE :zone`,
        {
          zone: `%${zone}%`,
        },
      );
    }

    if (projectType) {
      qb.andWhere(
        'project.projectType = :projectType',
        {
          projectType,
        },
      );
    }

    if (status) {
      qb.andWhere(
        'project.status = :projectStatus',
        {
          projectStatus: status,
        },
      );
    }

    return qb;
  }

  async build(
    query: AnalyticsQuery,
    user: any,
  ) {
    const { start, end } =
      getAnalyticsDateRange(query);

    const userIds =
      await this.getUserIds(
        query,
        user,
      );

    /*
     * =====================================================
     * 1. EXECUTION ACTIVITY
     *
     * Project Manager work attribution:
     * activity.updatedBy
     *
     * Date attribution:
     * activity.updatedAt
     * =====================================================
     */

    const executionQb =
      this.executionActivityRepository
        .createQueryBuilder(
          'activity',
        )
        .innerJoin(
          Project,
          'project',
          `
          project.id =
            activity.projectId
          AND project.isHidden = false
          `,
        )
        .where(
          `
          activity.updatedAt
          BETWEEN :start AND :end
          `,
          {
            start,
            end,
          },
        );

    if (userIds.length) {
      executionQb.andWhere(
        `
        activity.updatedBy
        IN (:...userIds)
        `,
        {
          userIds,
        },
      );
    }

    this.applyProjectFilters(
      executionQb,
      query,
    );

    /*
     * =====================================================
     * 2. CONTRACTOR ASSIGNMENTS
     *
     * Attribution:
     * assignment.assignedBy
     *
     * The entity has no updatedBy.
     * Therefore we measure assignments CREATED by manager.
     * =====================================================
     */

    const contractorQb =
      this.contractorAssignmentRepository
        .createQueryBuilder(
          'assignment',
        )
        .innerJoin(
          Project,
          'project',
          `
          project.id =
            assignment.projectId
          AND project.isHidden = false
          `,
        )
        .where(
          `
          assignment.createdAt
          BETWEEN :start AND :end
          `,
          {
            start,
            end,
          },
        );

    if (userIds.length) {
      contractorQb.andWhere(
        `
        assignment.assignedBy
        IN (:...userIds)
        `,
        {
          userIds,
        },
      );
    }

    this.applyProjectFilters(
      contractorQb,
      query,
    );

    /*
     * =====================================================
     * 3. TIMELINE DELAY HANDLING
     *
     * Attribution:
     * delay.createdBy
     *
     * This measures delay explanations entered by manager.
     * =====================================================
     */

    const delayQb =
      this.timelineDelayNoteRepository
        .createQueryBuilder(
          'delay',
        )
        .innerJoin(
          Project,
          'project',
          `
          project.id =
            delay.projectId
          AND project.isHidden = false
          `,
        )
        .where(
          `
          delay.createdAt
          BETWEEN :start AND :end
          `,
          {
            start,
            end,
          },
        );

    if (userIds.length) {
      delayQb.andWhere(
        `
        delay.createdBy
        IN (:...userIds)
        `,
        {
          userIds,
        },
      );
    }

    this.applyProjectFilters(
      delayQb,
      query,
    );

    /*
     * =====================================================
     * AGGREGATED METRICS
     * =====================================================
     */

    const [
      totalExecutionActivities,

      pendingActivities,
      inProgressActivities,
      completedActivities,
      overdueActivities,
      cancelledActivities,

      executionProjectRows,

      executionStatusRows,
      executionTypeRows,

      contractorAssignments,

      contractorAssigned,
      contractorInProgress,
      contractorOnHold,
      contractorPendingFinalProofs,
      contractorCompleted,

      contractorAmountRaw,

      contractorStatusRows,
      contractorScopeRows,

      delayNotes,
      delayNotesWithResolutionDate,

      executionManagerRows,
      contractorManagerRows,
      delayManagerRows,
    ] = await Promise.all([
      executionQb
        .clone()
        .getCount(),

      executionQb
        .clone()
        .andWhere(
          'activity.status = :pendingStatus',
          {
            pendingStatus:
              ProjectExecutionActivityStatus.PENDING,
          },
        )
        .getCount(),

      executionQb
        .clone()
        .andWhere(
          'activity.status = :inProgressStatus',
          {
            inProgressStatus:
              ProjectExecutionActivityStatus.IN_PROGRESS,
          },
        )
        .getCount(),

      executionQb
        .clone()
        .andWhere(
          'activity.status = :completedStatus',
          {
            completedStatus:
              ProjectExecutionActivityStatus.COMPLETED,
          },
        )
        .getCount(),

      executionQb
        .clone()
        .andWhere(
          'activity.status = :overdueStatus',
          {
            overdueStatus:
              ProjectExecutionActivityStatus.OVERDUE,
          },
        )
        .getCount(),

      executionQb
        .clone()
        .andWhere(
          'activity.status = :cancelledStatus',
          {
            cancelledStatus:
              ProjectExecutionActivityStatus.CANCELLED,
          },
        )
        .getCount(),

      executionQb
        .clone()
        .select(
          'DISTINCT activity.projectId',
          'projectId',
        )
        .getRawMany(),

      executionQb
        .clone()
        .select(
          'activity.status',
          'label',
        )
        .addSelect(
          'COUNT(*)',
          'value',
        )
        .groupBy(
          'activity.status',
        )
        .orderBy(
          'COUNT(*)',
          'DESC',
        )
        .getRawMany(),

      executionQb
        .clone()
        .select(
          'activity.activityType',
          'label',
        )
        .addSelect(
          'COUNT(*)',
          'value',
        )
        .groupBy(
          'activity.activityType',
        )
        .orderBy(
          'COUNT(*)',
          'DESC',
        )
        .getRawMany(),

      contractorQb
        .clone()
        .getCount(),

      contractorQb
        .clone()
        .andWhere(
          'assignment.status = :assignedStatus',
          {
            assignedStatus:
              ProjectContractorWorkStatus.ASSIGNED,
          },
        )
        .getCount(),

      contractorQb
        .clone()
        .andWhere(
          'assignment.status = :contractorInProgressStatus',
          {
            contractorInProgressStatus:
              ProjectContractorWorkStatus.IN_PROGRESS,
          },
        )
        .getCount(),

      contractorQb
        .clone()
        .andWhere(
          'assignment.status = :onHoldStatus',
          {
            onHoldStatus:
              ProjectContractorWorkStatus.ON_HOLD,
          },
        )
        .getCount(),

      contractorQb
        .clone()
        .andWhere(
          'assignment.status = :pendingProofStatus',
          {
            pendingProofStatus:
              ProjectContractorWorkStatus.PENDING_FINAL_PROOFS,
          },
        )
        .getCount(),

      contractorQb
        .clone()
        .andWhere(
          'assignment.status = :contractorCompletedStatus',
          {
            contractorCompletedStatus:
              ProjectContractorWorkStatus.COMPLETED,
          },
        )
        .getCount(),

      contractorQb
        .clone()
        .select(
          `
          COALESCE(
            SUM(assignment.amount),
            0
          )
          `,
          'amount',
        )
        .getRawOne(),

      contractorQb
        .clone()
        .select(
          'assignment.status',
          'label',
        )
        .addSelect(
          'COUNT(*)',
          'value',
        )
        .groupBy(
          'assignment.status',
        )
        .orderBy(
          'COUNT(*)',
          'DESC',
        )
        .getRawMany(),

      contractorQb
        .clone()
        .select(
          'assignment.workScope',
          'label',
        )
        .addSelect(
          'COUNT(*)',
          'value',
        )
        .groupBy(
          'assignment.workScope',
        )
        .orderBy(
          'COUNT(*)',
          'DESC',
        )
        .getRawMany(),

      delayQb
        .clone()
        .getCount(),

      delayQb
        .clone()
        .andWhere(
          `
          delay.expectedResolutionDate
          IS NOT NULL
          `,
        )
        .getCount(),

      executionQb
        .clone()
        .andWhere(
          'activity.updatedBy IS NOT NULL',
        )
        .select(
          'activity.updatedBy',
          'userId',
        )
        .addSelect(
          'MAX(activity.updatedByName)',
          'userName',
        )
        .addSelect(
          'COUNT(*)',
          'activitiesManaged',
        )
        .addSelect(
          `
          COUNT(*) FILTER (
            WHERE activity.status =
              'COMPLETED'
          )
          `,
          'activitiesCompleted',
        )
        .addSelect(
          `
          COUNT(*) FILTER (
            WHERE activity.status =
              'OVERDUE'
          )
          `,
          'activitiesOverdue',
        )
        .addSelect(
          'COUNT(DISTINCT activity.projectId)',
          'projectsHandled',
        )
        .groupBy(
          'activity.updatedBy',
        )
        .getRawMany(),

      contractorQb
        .clone()
        .andWhere(
          'assignment.assignedBy IS NOT NULL',
        )
        .select(
          'assignment.assignedBy',
          'userId',
        )
        .addSelect(
          'MAX(assignment.assignedByName)',
          'userName',
        )
        .addSelect(
          'COUNT(*)',
          'contractorAssignments',
        )
        .addSelect(
          `
          COUNT(*) FILTER (
            WHERE assignment.status =
              'COMPLETED'
          )
          `,
          'contractorCompleted',
        )
        .addSelect(
          `
          COALESCE(
            SUM(assignment.amount),
            0
          )
          `,
          'contractorAmount',
        )
        .groupBy(
          'assignment.assignedBy',
        )
        .getRawMany(),

      delayQb
        .clone()
        .andWhere(
          'delay.createdBy IS NOT NULL',
        )
        .select(
          'delay.createdBy',
          'userId',
        )
        .addSelect(
          'MAX(delay.createdByName)',
          'userName',
        )
        .addSelect(
          'COUNT(*)',
          'delayNotes',
        )
        .groupBy(
          'delay.createdBy',
        )
        .getRawMany(),
    ]);

    const executionProjectsHandled =
      Array.isArray(
        executionProjectRows,
      )
        ? executionProjectRows.length
        : 0;

    const completionPercent =
      totalExecutionActivities > 0
        ? Math.round(
            (
              completedActivities /
              totalExecutionActivities
            ) * 100,
          )
        : 0;

    const contractorAmount =
      Number(
        contractorAmountRaw?.amount ||
          0,
      );

    /*
     * =====================================================
     * MANAGER PERFORMANCE TABLE
     *
     * Merge the three genuine attribution sources:
     *
     * execution.updatedBy
     * contractor.assignedBy
     * delay.createdBy
     * =====================================================
     */

    const managerMap =
      new Map<
        number,
        {
          userId: number;
          userName: string;
          projectsHandled: number;
          activitiesManaged: number;
          activitiesCompleted: number;
          activitiesOverdue: number;
          contractorAssignments: number;
          contractorCompleted: number;
          contractorAmount: number;
          delayNotes: number;
        }
      >();

    const ensureManager = (
      userId: number,
      userName = '',
    ) => {
      if (
        !managerMap.has(userId)
      ) {
        managerMap.set(
          userId,
          {
            userId,
            userName:
              userName ||
              `User #${userId}`,
            projectsHandled: 0,
            activitiesManaged: 0,
            activitiesCompleted: 0,
            activitiesOverdue: 0,
            contractorAssignments: 0,
            contractorCompleted: 0,
            contractorAmount: 0,
            delayNotes: 0,
          },
        );
      }

      const row =
        managerMap.get(userId)!;

      if (
        userName &&
        (
          !row.userName ||
          row.userName.startsWith(
            'User #',
          )
        )
      ) {
        row.userName =
          userName;
      }

      return row;
    };

    for (
      const item of
        executionManagerRows || []
    ) {
      const userId =
        Number(item.userId || 0);

      if (!userId) continue;

      const row =
        ensureManager(
          userId,
          String(
            item.userName || '',
          ),
        );

      row.projectsHandled =
        Number(
          item.projectsHandled ||
            0,
        );

      row.activitiesManaged =
        Number(
          item.activitiesManaged ||
            0,
        );

      row.activitiesCompleted =
        Number(
          item.activitiesCompleted ||
            0,
        );

      row.activitiesOverdue =
        Number(
          item.activitiesOverdue ||
            0,
        );
    }

    for (
      const item of
        contractorManagerRows || []
    ) {
      const userId =
        Number(item.userId || 0);

      if (!userId) continue;

      const row =
        ensureManager(
          userId,
          String(
            item.userName || '',
          ),
        );

      row.contractorAssignments =
        Number(
          item.contractorAssignments ||
            0,
        );

      row.contractorCompleted =
        Number(
          item.contractorCompleted ||
            0,
        );

      row.contractorAmount =
        Number(
          item.contractorAmount ||
            0,
        );
    }

    for (
      const item of
        delayManagerRows || []
    ) {
      const userId =
        Number(item.userId || 0);

      if (!userId) continue;

      const row =
        ensureManager(
          userId,
          String(
            item.userName || '',
          ),
        );

      row.delayNotes =
        Number(
          item.delayNotes ||
            0,
        );
    }

    /*
     * Prefer User master names wherever available.
     */
    const managerIds = [
      ...managerMap.keys(),
    ];

    if (managerIds.length) {
      const users =
        await this.userRepository.find({
          where: {
            id: In(managerIds),
          } as any,
        });

      for (const item of users) {
        const row =
          managerMap.get(
            Number(item.id),
          );

        if (row) {
          row.userName =
            item.name ||
            row.userName;
        }
      }
    }

    const rows = [
      ...managerMap.values(),
    ].sort(
      (a, b) =>
        b.activitiesManaged -
          a.activitiesManaged ||
        b.contractorAssignments -
          a.contractorAssignments ||
        b.delayNotes -
          a.delayNotes,
    );

    const normalizeChartRows = (
      data: any[],
    ) =>
      (data || []).map(
        (item) => ({
          label:
            String(
              item.label || '',
            ),
          value:
            Number(
              item.value || 0,
            ),
        }),
      );

    return {
      title:
        'Project Manager Work Report',

      cards: {
        executionProjectsHandled,

        totalExecutionActivities,

        pendingActivities,

        inProgressActivities,

        completedActivities,

        overdueActivities,

        cancelledActivities,

        executionCompletionPercent:
          completionPercent,

        contractorAssignments,

        contractorAssigned,

        contractorInProgress,

        contractorOnHold,

        contractorPendingFinalProofs,

        contractorCompleted,

        contractorAmount,

        delayNotes,

        delayNotesWithResolutionDate,
      },

      charts: {
        executionActivityStatus: {
          type: 'bar',
          title:
            'Execution Activity Status',
          data:
            normalizeChartRows(
              executionStatusRows,
            ),
        },

        executionWorkType: {
          type: 'bar',
          title:
            'Execution Work Type',
          data:
            normalizeChartRows(
              executionTypeRows,
            ),
        },

        contractorWorkStatus: {
          type: 'bar',
          title:
            'Contractor Work Status',
          data:
            normalizeChartRows(
              contractorStatusRows,
            ),
        },

        contractorWorkScope: {
          type: 'bar',
          title:
            'Contractor Work Scope',
          data:
            normalizeChartRows(
              contractorScopeRows,
            ),
        },
      },

      rows,
    };
  }
}