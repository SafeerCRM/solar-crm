
import { Repository } from 'typeorm';

import {
  FollowUp,
  FollowUpStatus,
} from '../../followup/follow-up.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class FollowUpActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'FOLLOWUPS';
  readonly moduleLabel = 'Follow-ups';

  constructor(
    private readonly followUpRepository: Repository<FollowUp>,
  ) {}

  async build(
    context: AnalyticsActivityContext,
  ): Promise<AnalyticsActivitySection> {
    const empty = (): AnalyticsActivitySection => ({
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics: [],
      hasActivity: false,
    });

    if (!context.userIds.length) return empty();

    const ids = context.userIds;

    const assignedQuery = () =>
      this.followUpRepository
        .createQueryBuilder('followup')
        .where('followup.assignedTo IN (:...ids)', { ids });

    const [
      assigned,
      created,
      involved,
      pending,
      completed,
      missed,
      overdue,
      lead,
      meeting,
      telecalling,
      trading,
    ] = await Promise.all([
      assignedQuery().getCount(),

      this.followUpRepository
        .createQueryBuilder('followup')
        .where('followup.createdBy IN (:...ids)', { ids })
        .andWhere(
          'followup.createdAt BETWEEN :start AND :end',
          {
            start: context.fromDate,
            end: context.toDate,
          },
        )
        .getCount(),

      this.followUpRepository
        .createQueryBuilder('followup')
        .where(
          '(followup.assignedTo IN (:...ids) OR followup.createdBy IN (:...ids))',
          { ids },
        )
        .getCount(),

      assignedQuery()
        .andWhere('followup.status = :status', {
          status: FollowUpStatus.PENDING,
        })
        .getCount(),

      assignedQuery()
        .andWhere('followup.status = :status', {
          status: FollowUpStatus.COMPLETED,
        })
        .getCount(),

      assignedQuery()
        .andWhere('followup.status = :status', {
          status: FollowUpStatus.MISSED,
        })
        .getCount(),

      assignedQuery()
        .andWhere('followup.status = :status', {
          status: FollowUpStatus.PENDING,
        })
        .andWhere('followup.followUpDate < :now', {
          now: new Date(),
        })
        .getCount(),

      assignedQuery()
        .andWhere('followup.sourceModule = :source', {
          source: 'LEAD',
        })
        .getCount(),

      assignedQuery()
        .andWhere('followup.sourceModule = :source', {
          source: 'MEETING',
        })
        .getCount(),

      assignedQuery()
        .andWhere('followup.sourceModule = :source', {
          source: 'TELECALLING',
        })
        .getCount(),

      assignedQuery()
        .andWhere('followup.sourceModule = :source', {
          source: 'TRADING',
        })
        .getCount(),
    ]);

    const metrics: AnalyticsActivitySection['metrics'] = [
      {
        key: 'assigned',
        label: 'Assigned Follow-ups',
        kind: 'ASSIGNED_WORK',
        value: assigned,
        unit: 'COUNT',
        attribution: 'assignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'created',
        label: 'Follow-ups Created',
        kind: 'CREATED_WORK',
        value: created,
        unit: 'COUNT',
        attribution: 'createdBy',
        timeScope: 'PERIOD',
      },
      {
        key: 'involved',
        label: 'Follow-ups Involved',
        kind: 'UPDATED_WORK',
        value: involved,
        unit: 'COUNT',
        attribution: 'assignedTo or createdBy',
        timeScope: 'CURRENT',
        description:
          'Distinct follow-up records, not individual actions.',
      },
      {
        key: 'pending',
        label: 'Pending Follow-ups',
        kind: 'ASSIGNED_WORK',
        value: pending,
        unit: 'COUNT',
        attribution: 'assignedTo and current status',
        timeScope: 'CURRENT',
      },
      {
        key: 'completed',
        label: 'Completed Follow-ups Assigned',
        kind: 'OUTCOME',
        value: completed,
        unit: 'COUNT',
        attribution: 'assignedTo and current status',
        timeScope: 'CURRENT',
        description:
          'Does not prove the assigned employee performed completion.',
      },
      {
        key: 'missed',
        label: 'Missed Follow-ups Assigned',
        kind: 'OUTCOME',
        value: missed,
        unit: 'COUNT',
        attribution: 'assignedTo and current status',
        timeScope: 'CURRENT',
      },
      {
        key: 'overdue',
        label: 'Overdue Pending Follow-ups',
        kind: 'ASSIGNED_WORK',
        value: overdue,
        unit: 'COUNT',
        attribution: 'assignedTo, pending status and past follow-up date',
        timeScope: 'CURRENT',
        description:
          'Past-due pending records, not confirmed employee negligence.',
      },
      ...[
        ['lead', 'Lead Follow-ups', lead],
        ['meeting', 'Meeting Follow-ups', meeting],
        ['telecalling', 'Telecalling Follow-ups', telecalling],
        ['trading', 'Trading Follow-ups', trading],
      ].map(([key, label, value]) => ({
        key: `source_${key}`,
        label: String(label),
        kind: 'ASSIGNED_WORK' as const,
        value: Number(value),
        unit: 'COUNT' as const,
        attribution: 'assignedTo and sourceModule',
        timeScope: 'CURRENT' as const,
      })),
    ];

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity: involved > 0,
    };
  }
}
