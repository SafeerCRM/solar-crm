import { Repository } from 'typeorm';

import { ProjectExecutionActivity } from '../../project/project-execution-activity.entity';
import { ProjectExecutionProof } from '../../project/project-execution-proof.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class ProjectExecutionActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'PROJECT_EXECUTION';
  readonly moduleLabel = 'Project Execution Activities';

  constructor(
    private readonly activityRepository: Repository<ProjectExecutionActivity>,
    private readonly proofRepository: Repository<ProjectExecutionProof>,
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

    const visibleActivities = () =>
      this.activityRepository
        .createQueryBuilder('activity')
        .innerJoin(
          'project',
          'project',
          'project.id = activity.projectId',
        )
        .where('project.isHidden = false');

    const created = () =>
      visibleActivities().andWhere(
        'activity.createdBy IN (:...ids)',
        { ids },
      );

    const updated = () =>
      visibleActivities().andWhere(
        'activity.updatedBy IN (:...ids)',
        { ids },
      );

    const assigned = () =>
      visibleActivities().andWhere(
        'activity.assignedTo IN (:...ids)',
        { ids },
      );

    const proofs = () =>
      this.proofRepository
        .createQueryBuilder('proof')
        .innerJoin(
          'project',
          'project',
          'project.id = proof.projectId',
        )
        .where('project.isHidden = false')
        .andWhere('proof.uploadedBy IN (:...ids)', {
          ids,
        });

    const duringPeriod = (column: string) => ({
      clause: `${column} >= :fromDate AND ${column} <= :toDate`,
      params: {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    });

    const [
      assignedActivities,
      createdActivities,
      createdDuringPeriod,
      createdNowCompleted,
      createdNowPending,
      createdNowInProgress,
      createdNowOverdue,
      createdNowCancelled,
      latestUpdatedActivities,
      latestUpdatedDuringPeriod,
      completedMilestonesDuringPeriod,
      proofsUploaded,
      proofsUploadedDuringPeriod,
      structureCreated,
      pillarCreated,
      panelCreated,
      inverterCreated,
      wiringCreated,
      earthingCreated,
      generationCreated,
      structureInspectionCreated,
      generationInspectionCreated,
    ] = await Promise.all([
      assigned().getCount(),

      created().getCount(),

      created()
        .andWhere(
          duringPeriod('activity.createdAt').clause,
          duringPeriod('activity.createdAt').params,
        )
        .getCount(),

      created()
        .andWhere('activity.status = :status', {
          status: 'COMPLETED',
        })
        .getCount(),

      created()
        .andWhere('activity.status = :status', {
          status: 'PENDING',
        })
        .getCount(),

      created()
        .andWhere('activity.status = :status', {
          status: 'IN_PROGRESS',
        })
        .getCount(),

      created()
        .andWhere('activity.status = :status', {
          status: 'OVERDUE',
        })
        .getCount(),

      created()
        .andWhere('activity.status = :status', {
          status: 'CANCELLED',
        })
        .getCount(),

      updated().getCount(),

      updated()
        .andWhere(
          duringPeriod('activity.updatedAt').clause,
          duringPeriod('activity.updatedAt').params,
        )
        .getCount(),

      created()
        .andWhere('activity.status = :status', {
          status: 'COMPLETED',
        })
        .andWhere(
          duringPeriod('activity.completedDate').clause,
          duringPeriod('activity.completedDate').params,
        )
        .getCount(),

      proofs().getCount(),

      proofs()
        .andWhere(
          duringPeriod('proof.createdAt').clause,
          duringPeriod('proof.createdAt').params,
        )
        .getCount(),

      ...[
        'STRUCTURE_WORK',
        'PILLAR_WORK',
        'PANEL_INSTALLED',
        'INVERTER_INSTALLED',
        'WIRING',
        'EARTHING_PACKING',
        'GENERATION_STARTED',
        'STRUCTURE_INSPECTION',
        'GENERATION_INSPECTION',
      ].map((activityType) =>
        created()
          .andWhere(
            'activity.activityType = :activityType',
            { activityType },
          )
          .getCount(),
      ),
    ]);

    const metrics: AnalyticsActivitySection['metrics'] = [
      {
        key: 'assigned',
        label: 'Currently Assigned Execution Activities',
        kind: 'ASSIGNED_WORK',
        value: assignedActivities,
        unit: 'COUNT',
        attribution: 'assignedTo',
        timeScope: 'CURRENT',
        description:
          'Assignment field is currently unpopulated in production records.',
      },
      {
        key: 'created',
        label: 'Execution Activities Created',
        kind: 'CREATED_WORK',
        value: createdActivities,
        unit: 'COUNT',
        attribution: 'createdBy',
        timeScope: 'CURRENT',
      },
      {
        key: 'created_period',
        label: 'Execution Activities Created During Period',
        kind: 'CREATED_WORK',
        value: createdDuringPeriod,
        unit: 'COUNT',
        attribution: 'createdBy and createdAt',
        timeScope: 'PERIOD',
      },
      ...[
        ['completed', 'Currently Completed', createdNowCompleted],
        ['pending', 'Currently Pending', createdNowPending],
        ['in_progress', 'Currently In Progress', createdNowInProgress],
        ['overdue', 'Currently Overdue', createdNowOverdue],
        ['cancelled', 'Currently Cancelled', createdNowCancelled],
      ].map(([key, label, value]) => ({
        key: `created_${key}`,
        label: String(label),
        kind: 'PIPELINE' as const,
        value: Number(value),
        unit: 'COUNT' as const,
        attribution: 'createdBy and current activity status',
        timeScope: 'CURRENT' as const,
        description:
          'Current status of records created by the employee; not proof that the employee performed the physical work.',
      })),
      {
        key: 'latest_updated',
        label: 'Activities with Latest Update Attributed',
        kind: 'UPDATED_WORK',
        value: latestUpdatedActivities,
        unit: 'COUNT',
        attribution: 'updatedBy',
        timeScope: 'CURRENT',
        description:
          'Counts activities whose latest recorded updater matches; not total historical updates.',
      },
      {
        key: 'latest_updated_period',
        label: 'Latest Activity Updates During Period',
        kind: 'UPDATED_WORK',
        value: latestUpdatedDuringPeriod,
        unit: 'COUNT',
        attribution: 'updatedBy and updatedAt',
        timeScope: 'PERIOD',
      },
      {
        key: 'created_completed_period',
        label: 'Created Activities Completed During Period',
        kind: 'OUTCOME',
        value: completedMilestonesDuringPeriod,
        unit: 'COUNT',
        attribution: 'createdBy, current status and completedDate',
        timeScope: 'PERIOD',
        description:
          'Activities created by the employee that are currently completed with a completion date in the selected period. Does not identify who completed them.',
      },
      {
        key: 'proofs_uploaded',
        label: 'Execution Proofs Uploaded',
        kind: 'CREATED_WORK',
        value: proofsUploaded,
        unit: 'COUNT',
        attribution: 'uploadedBy',
        timeScope: 'CURRENT',
      },
      {
        key: 'proofs_uploaded_period',
        label: 'Execution Proofs Uploaded During Period',
        kind: 'CREATED_WORK',
        value: proofsUploadedDuringPeriod,
        unit: 'COUNT',
        attribution: 'uploadedBy and createdAt',
        timeScope: 'PERIOD',
      },
      ...[
        ['structure', 'Structure Work', structureCreated],
        ['pillar', 'Pillar Work', pillarCreated],
        ['panel', 'Panel Installation', panelCreated],
        ['inverter', 'Inverter Installation', inverterCreated],
        ['wiring', 'Wiring', wiringCreated],
        ['earthing', 'Earthing and Packing', earthingCreated],
        ['generation', 'Generation Started', generationCreated],
        [
          'structure_inspection',
          'Structure Inspection',
          structureInspectionCreated,
        ],
        [
          'generation_inspection',
          'Generation Inspection',
          generationInspectionCreated,
        ],
      ].map(([key, label, value]) => ({
        key: `created_${key}`,
        label: String(label),
        kind: 'CREATED_WORK' as const,
        value: Number(value),
        unit: 'COUNT' as const,
        attribution: 'createdBy and activityType',
        timeScope: 'CURRENT' as const,
        description:
          'Records created for this milestone type; not physical work credited to the creator.',
      })),
    ];

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity:
        assignedActivities > 0 ||
        createdActivities > 0 ||
        latestUpdatedActivities > 0 ||
        proofsUploaded > 0,
    };
  }
}