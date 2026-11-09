
import { Repository } from 'typeorm';

import {
  ProjectTradingMeeting,
  ProjectTradingMeetingStatus,
} from '../../project/project-trading-meeting.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityMetric,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class TradingMeetingActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'TRADING_MEETINGS';
  readonly moduleLabel = 'Trading Meetings';

  constructor(
    private readonly repository: Repository<ProjectTradingMeeting>,
  ) {}

  async build(
    context: AnalyticsActivityContext,
  ): Promise<AnalyticsActivitySection> {
    const userIds = [
      ...new Set(
        context.userIds.filter(
          (id) => Number.isInteger(id) && id > 0,
        ),
      ),
    ];

    // Never allow an empty employee selection to
    // accidentally become an unrestricted query.
    if (!userIds.length) {
      return {
        moduleKey: this.moduleKey,
        moduleLabel: this.moduleLabel,
        metrics: [],
        hasActivity: false,
      };
    }

    const baseQuery = () =>
      this.repository
        .createQueryBuilder('meeting')
        .where('meeting.isHidden = :hidden', {
          hidden: false,
        });

    const assigned = await baseQuery()
      .andWhere('meeting.assignedTo IN (:...userIds)', {
        userIds,
      })
      .getCount();

    const created = await baseQuery()
      .andWhere('meeting.createdBy IN (:...userIds)', {
        userIds,
      })
      .andWhere(
        'meeting.createdAt BETWEEN :start AND :end',
        {
          start: context.fromDate,
          end: context.toDate,
        },
      )
      .getCount();

    const involved = await baseQuery()
      .andWhere(
        `(
          meeting.assignedTo IN (:...userIds)
          OR meeting.createdBy IN (:...userIds)
          OR meeting.updatedBy IN (:...userIds)
        )`,
        { userIds },
      )
      .getCount();

    const outcomeCount = await baseQuery()
      .andWhere('meeting.assignedTo IN (:...userIds)', {
        userIds,
      })
      .andWhere(
        `NULLIF(TRIM(meeting.outcome), '') IS NOT NULL`,
      )
      .getCount();

    const followUpCount = await baseQuery()
      .andWhere('meeting.assignedTo IN (:...userIds)', {
        userIds,
      })
      .andWhere('meeting.nextFollowUpDate IS NOT NULL')
      .getCount();

    const overdueCount = await baseQuery()
      .andWhere('meeting.assignedTo IN (:...userIds)', {
        userIds,
      })
      .andWhere(
        'meeting.nextFollowUpDate < :today',
        {
          today: new Date(),
        },
      )
      .andWhere('meeting.status NOT IN (:...excluded)', {
        excluded: [
          ProjectTradingMeetingStatus.CANCELLED,
          ProjectTradingMeetingStatus.ORDER_RECEIVED,
          ProjectTradingMeetingStatus.COMPLETED,
        ],
      })
      .getCount();

    const pipeline = await baseQuery()
      .select(
        `COALESCE(
          SUM(
            CASE
              WHEN meeting.expectedOrderValue > 0
              THEN meeting.expectedOrderValue
              ELSE 0
            END
          ),
          0
        )`,
        'total',
      )
      .where('meeting.isHidden = :hidden', {
        hidden: false,
      })
      .andWhere('meeting.assignedTo IN (:...userIds)', {
        userIds,
      })
      .getRawOne<{ total: string | number }>();

    const metrics: AnalyticsActivityMetric[] = [
      {
        key: 'assigned',
        label: 'Assigned Trading Meetings',
        kind: 'ASSIGNED_WORK',
        value: assigned,
        unit: 'COUNT',
        attribution: 'assignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'created',
        label: 'Trading Meetings Created',
        kind: 'CREATED_WORK',
        value: created,
        unit: 'COUNT',
        attribution: 'createdBy',
        timeScope: 'PERIOD',
      },
      {
        key: 'involved',
        label: 'Trading Meetings Involved',
        kind: 'UPDATED_WORK',
        value: involved,
        unit: 'COUNT',
        attribution:
          'Distinct meetings matching assignedTo, createdBy or latest updatedBy',
        timeScope: 'CURRENT',
        description:
          'Unique records, not a count of individual actions.',
      },
      {
        key: 'outcomes',
        label: 'Meetings with Recorded Outcomes',
        kind: 'OUTCOME',
        value: outcomeCount,
        unit: 'COUNT',
        attribution: 'assignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'followups',
        label: 'Meetings with Follow-up Dates',
        kind: 'ASSIGNED_WORK',
        value: followUpCount,
        unit: 'COUNT',
        attribution: 'assignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'overdue',
        label: 'Overdue Trading Follow-ups',
        kind: 'ASSIGNED_WORK',
        value: overdueCount,
        unit: 'COUNT',
        attribution: 'assignedTo',
        timeScope: 'CURRENT',
        description:
          'Past follow-up dates excluding completed, cancelled and order-received meetings.',
      },
      {
        key: 'expected_pipeline',
        label: 'Expected Order Pipeline',
        kind: 'PIPELINE',
        value: Number(pipeline?.total || 0),
        unit: 'INR',
        attribution: 'assignedTo',
        timeScope: 'CURRENT',
        description:
          'Estimated order value, not realized revenue.',
      },
    ];

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity: involved > 0,
    };
  }
}
