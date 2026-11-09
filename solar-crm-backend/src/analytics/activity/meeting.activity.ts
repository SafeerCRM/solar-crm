
import { Repository } from 'typeorm';

import { Meeting } from '../../meeting/meeting.entity';
import { Project } from '../../project/project.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class MeetingActivityProvider implements AnalyticsActivityProvider {
  readonly moduleKey = 'MEETINGS';
  readonly moduleLabel = 'Regular Meetings';

  constructor(
    private readonly meetingRepository: Repository<Meeting>,
    private readonly projectRepository: Repository<Project>,
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

    // The latest version represents the current meeting state.
    // The earliest version represents original creation.
    const rows = await this.meetingRepository.query(
      `
      WITH versioned AS (
        SELECT
          m.*,
          COALESCE(m."meetingGroupId", m.id) AS group_id,
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(m."meetingGroupId", m.id)
            ORDER BY m."updatedAt" DESC NULLS LAST,
                     m."createdAt" DESC NULLS LAST,
                     m.id DESC
          ) AS latest_rank,
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(m."meetingGroupId", m.id)
            ORDER BY m."createdAt" ASC NULLS LAST,
                     m.id ASC
          ) AS earliest_rank
        FROM meetings m
      ),
      latest AS (
        SELECT * FROM versioned WHERE latest_rank = 1
      ),
      earliest AS (
        SELECT * FROM versioned WHERE earliest_rank = 1
      ),
      historical AS (
        SELECT
          group_id,
          BOOL_OR("assignedTo" = ANY($1::int[])) AS ever_assigned,
          BOOL_OR(
            "createdBy" = ANY($1::int[])
            OR "updatedBy" = ANY($1::int[])
          ) AS ever_recorded_action
        FROM versioned
        GROUP BY group_id
      ),
      conversions AS (
        SELECT DISTINCT
          COALESCE(m."meetingGroupId", m.id) AS group_id
        FROM project p
        JOIN meetings m ON m.id = p."meetingId"
        WHERE p."isHidden" = false
      )
      SELECT
        COUNT(*) FILTER (
          WHERE l."assignedTo" = ANY($1::int[])
        ) AS assigned,

        COUNT(*) FILTER (
          WHERE e."createdBy" = ANY($1::int[])
            AND e."createdAt" BETWEEN $2 AND $3
        ) AS created,

        COUNT(*) FILTER (
          WHERE h.ever_assigned OR h.ever_recorded_action
        ) AS involved,

        COUNT(*) FILTER (
          WHERE l."assignedTo" = ANY($1::int[])
            AND l.status = 'SCHEDULED'
        ) AS scheduled,

        COUNT(*) FILTER (
          WHERE l."assignedTo" = ANY($1::int[])
            AND l.status = 'COMPLETED'
        ) AS completed,

        COUNT(*) FILTER (
          WHERE l."assignedTo" = ANY($1::int[])
            AND l.status = 'RESCHEDULED'
        ) AS rescheduled,

        COUNT(*) FILTER (
          WHERE l."assignedTo" = ANY($1::int[])
            AND l.status = 'CNR'
        ) AS cnr,

        COUNT(*) FILTER (
          WHERE l."assignedTo" = ANY($1::int[])
            AND l.status = 'CANCELLED'
        ) AS cancelled,

        COUNT(*) FILTER (
          WHERE l."assignedTo" = ANY($1::int[])
            AND (
              l."convertToProject" = true
              OR l.status = 'CONVERTED_TO_PROJECT'
            )
        ) AS marked_converted,

        COUNT(*) FILTER (
          WHERE l."assignedTo" = ANY($1::int[])
            AND c.group_id IS NOT NULL
        ) AS actual_converted

      FROM latest l
      JOIN earliest e ON e.group_id = l.group_id
      JOIN historical h ON h.group_id = l.group_id
      LEFT JOIN conversions c ON c.group_id = l.group_id
      `,
      [ids, context.fromDate, context.toDate],
    );

    const r = rows[0] || {};
    const num = (key: string) => Number(r[key] || 0);

    const metrics: AnalyticsActivitySection['metrics'] = [
      {
        key: 'assigned',
        label: 'Currently Assigned Meetings',
        kind: 'ASSIGNED_WORK',
        value: num('assigned'),
        unit: 'COUNT',
        attribution: 'Latest meeting version assignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'created',
        label: 'Meeting Groups Created',
        kind: 'CREATED_WORK',
        value: num('created'),
        unit: 'COUNT',
        attribution: 'Earliest meeting version createdBy',
        timeScope: 'PERIOD',
      },
      {
        key: 'involved',
        label: 'Meeting Groups with Recorded Involvement',
        kind: 'UPDATED_WORK',
        value: num('involved'),
        unit: 'COUNT',
        attribution: 'Any version assignedTo, createdBy or updatedBy',
        timeScope: 'CURRENT',
        description:
          'Unique meeting groups with recorded involvement, not individual actions.',
      },
      {
        key: 'scheduled',
        label: 'Currently Scheduled Meetings',
        kind: 'ASSIGNED_WORK',
        value: num('scheduled'),
        unit: 'COUNT',
        attribution: 'Latest version status and assignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'completed',
        label: 'Completed Meetings',
        kind: 'OUTCOME',
        value: num('completed'),
        unit: 'COUNT',
        attribution: 'Latest version status and assignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'rescheduled',
        label: 'Rescheduled Meetings',
        kind: 'OUTCOME',
        value: num('rescheduled'),
        unit: 'COUNT',
        attribution: 'Latest version status and assignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'cnr',
        label: 'CNR Meetings',
        kind: 'OUTCOME',
        value: num('cnr'),
        unit: 'COUNT',
        attribution: 'Latest version status and assignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'cancelled',
        label: 'Cancelled Meetings',
        kind: 'OUTCOME',
        value: num('cancelled'),
        unit: 'COUNT',
        attribution: 'Latest version status and assignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'marked_converted',
        label: 'Meetings Marked Converted',
        kind: 'PIPELINE',
        value: num('marked_converted'),
        unit: 'COUNT',
        attribution: 'Latest version conversion status and assignedTo',
        timeScope: 'CURRENT',
        description:
          'Conversion indication only; does not confirm project creation.',
      },
      {
        key: 'actual_converted',
        label: 'Meetings Linked to Actual Projects',
        kind: 'OUTCOME',
        value: num('actual_converted'),
        unit: 'COUNT',
        attribution: 'Latest assignedTo and visible linked project',
        timeScope: 'CURRENT',
        description:
          'Distinct meeting groups with at least one non-hidden linked project.',
      },
    ];

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity:
        num('assigned') > 0 ||
        num('created') > 0 ||
        num('involved') > 0,
    };
  }
}
