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
     * 1A. EXECUTION PLANNING / CREATION
     *
     * Measures work actually CREATED by Project Manager.
     *
     * Attribution:
     * activity.createdBy
     *
     * Date attribution:
     * activity.createdAt
     * =====================================================
     */

    const executionCreatedQb =
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
          activity.createdAt
          BETWEEN :start AND :end
          `,
          {
            start,
            end,
          },
        );

    if (userIds.length) {
      executionCreatedQb.andWhere(
        `
        activity.createdBy
        IN (:...userIds)
        `,
        {
          userIds,
        },
      );
    }

    this.applyProjectFilters(
      executionCreatedQb,
      query,
    );

    /*
     * =====================================================
     * 1B. EXECUTION UPDATES / COMPLETION
     *
     * Measures work actually UPDATED by Project Manager.
     *
     * Attribution:
     * activity.updatedBy
     *
     * Date attribution:
     * activity.updatedAt
     * =====================================================
     */

    const executionUpdatedQb =
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
      executionUpdatedQb.andWhere(
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
      executionUpdatedQb,
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
      activitiesCreated,

      projectsPlannedRows,

      createdActivityTypeRows,

      activitiesUpdated,

      updatedCompletedActivities,
      updatedOverdueActivities,
      updatedPendingActivities,
      updatedInProgressActivities,
      updatedCancelledActivities,

      updatedActivityStatusRows,
      updatedActivityTypeRows,

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

      createdManagerRows,
      updatedManagerRows,
      contractorManagerRows,
      delayManagerRows,
    ] = await Promise.all([
      /*
       * Execution activities CREATED
       * by Project Manager in period.
       */
      executionCreatedQb
        .clone()
        .getCount(),

      executionCreatedQb
        .clone()
        .select(
          'DISTINCT activity.projectId',
          'projectId',
        )
        .getRawMany(),

      executionCreatedQb
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

      /*
       * Execution activities UPDATED
       * by Project Manager in period.
       */
      executionUpdatedQb
        .clone()
        .getCount(),

      executionUpdatedQb
        .clone()
        .andWhere(
          'activity.status = :updatedCompletedStatus',
          {
            updatedCompletedStatus:
              ProjectExecutionActivityStatus.COMPLETED,
          },
        )
        .getCount(),

      executionUpdatedQb
        .clone()
        .andWhere(
          'activity.status = :updatedOverdueStatus',
          {
            updatedOverdueStatus:
              ProjectExecutionActivityStatus.OVERDUE,
          },
        )
        .getCount(),

      executionUpdatedQb
        .clone()
        .andWhere(
          'activity.status = :updatedPendingStatus',
          {
            updatedPendingStatus:
              ProjectExecutionActivityStatus.PENDING,
          },
        )
        .getCount(),

      executionUpdatedQb
        .clone()
        .andWhere(
          'activity.status = :updatedInProgressStatus',
          {
            updatedInProgressStatus:
              ProjectExecutionActivityStatus.IN_PROGRESS,
          },
        )
        .getCount(),

      executionUpdatedQb
        .clone()
        .andWhere(
          'activity.status = :updatedCancelledStatus',
          {
            updatedCancelledStatus:
              ProjectExecutionActivityStatus.CANCELLED,
          },
        )
        .getCount(),

      executionUpdatedQb
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

      executionUpdatedQb
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

      /*
       * Contractor assignments
       */
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

      /*
       * Delay handling
       */
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

      /*
       * Manager-wise execution creation.
       */
      executionCreatedQb
        .clone()
        .andWhere(
          'activity.createdBy IS NOT NULL',
        )
        .select(
          'activity.createdBy',
          'userId',
        )
        .addSelect(
          'MAX(activity.createdByName)',
          'userName',
        )
        .addSelect(
          'COUNT(*)',
          'activitiesCreated',
        )
        .addSelect(
          'COUNT(DISTINCT activity.projectId)',
          'projectsPlanned',
        )
        .groupBy(
          'activity.createdBy',
        )
        .getRawMany(),

      /*
       * Manager-wise execution updates.
       */
      executionUpdatedQb
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
          'activitiesUpdated',
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
        .groupBy(
          'activity.updatedBy',
        )
        .getRawMany(),

      /*
       * Manager-wise contractor assignment.
       */
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

      /*
       * Manager-wise delay notes.
       */
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
        .addSelect(
          `
          COUNT(*) FILTER (
            WHERE delay.expectedResolutionDate
              IS NOT NULL
          )
          `,
          'delayNotesWithResolutionDate',
        )
        .groupBy(
          'delay.createdBy',
        )
        .getRawMany(),
    ]);

    const projectsPlanned =
      Array.isArray(
        projectsPlannedRows,
      )
        ? projectsPlannedRows.length
        : 0;

    const contractorAmount =
      Number(
        contractorAmountRaw?.amount ||
          0,
      );

    
        /*
     * =====================================================
     * PROJECT MANAGER PERFORMANCE TABLE
     *
     * Keep genuine responsibilities separate:
     *
     * activity.createdBy
     *   = execution planning / activity creation
     *
     * activity.updatedBy
     *   = execution activity updates
     *
     * assignment.assignedBy
     *   = contractor assignment
     *
     * delay.createdBy
     *   = delay handling
     * =====================================================
     */

    const managerMap =
      new Map<
        number,
        {
          userId: number;
          userName: string;

          projectsPlanned: number;
          activitiesCreated: number;

          activitiesUpdated: number;
          activitiesCompleted: number;
          activitiesOverdue: number;

          contractorAssignments: number;
          contractorCompleted: number;
          contractorAmount: number;

          delayNotes: number;
          delayNotesWithResolutionDate: number;
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

            projectsPlanned: 0,
            activitiesCreated: 0,

            activitiesUpdated: 0,
            activitiesCompleted: 0,
            activitiesOverdue: 0,

            contractorAssignments: 0,
            contractorCompleted: 0,
            contractorAmount: 0,

            delayNotes: 0,
            delayNotesWithResolutionDate: 0,
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

    /*
     * Execution activities CREATED.
     */
    for (
      const item of
        createdManagerRows || []
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

      row.projectsPlanned =
        Number(
          item.projectsPlanned ||
            0,
        );

      row.activitiesCreated =
        Number(
          item.activitiesCreated ||
            0,
        );
    }

    /*
     * Execution activities UPDATED.
     */
    for (
      const item of
        updatedManagerRows || []
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

      row.activitiesUpdated =
        Number(
          item.activitiesUpdated ||
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

    /*
     * Contractor assignments.
     */
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

    /*
     * Delay handling.
     */
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

      row.delayNotesWithResolutionDate =
        Number(
          item.delayNotesWithResolutionDate ||
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
        b.activitiesCreated -
          a.activitiesCreated ||
        b.activitiesUpdated -
          a.activitiesUpdated ||
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
        projectsPlanned,

        activitiesCreated,

        activitiesUpdated,

        activitiesCompleted:
          updatedCompletedActivities,

        activitiesOverdue:
          updatedOverdueActivities,

        activitiesPendingAfterUpdate:
          updatedPendingActivities,

        activitiesInProgressAfterUpdate:
          updatedInProgressActivities,

        activitiesCancelledAfterUpdate:
          updatedCancelledActivities,

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
        executionActivitiesCreated: {
          type: 'bar',
          title:
            'Execution Activities Created by Work Type',
          data:
            normalizeChartRows(
              createdActivityTypeRows,
            ),
        },

        executionActivitiesUpdated: {
          type: 'bar',
          title:
            'Execution Activities Updated by Status',
          data:
            normalizeChartRows(
              updatedActivityStatusRows,
            ),
        },

        executionUpdatedWorkType: {
          type: 'bar',
          title:
            'Execution Activities Updated by Work Type',
          data:
            normalizeChartRows(
              updatedActivityTypeRows,
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