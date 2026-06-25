import { Repository } from 'typeorm';

import { User } from '../../users/user.entity';
import { Lead } from '../../leads/lead.entity';
import { CallLog, CallReviewStatus } from '../../telecalling/call-log.entity';
import { Meeting, MeetingStatus } from '../../meeting/meeting.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
  canViewAllAnalytics,
} from '../helpers/analytics-filter.helper';

export class TelecallingAssistantAnalyticsBuilder {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly callLogRepository: Repository<CallLog>,
    private readonly leadRepository: Repository<Lead>,
    private readonly meetingRepository: Repository<Meeting>,
  ) {}

  private async getUserIds(query: AnalyticsQuery, user: any) {
    const canViewAll = canViewAllAnalytics(user);
    const currentUserId = Number(user?.id || user?.userId);
    const selectedUserId = query.userId ? Number(query.userId) : null;
    const selectedRole = String(query.role || '').trim();

    if (!canViewAll) {
      return currentUserId ? [currentUserId] : [];
    }

    if (selectedUserId) {
      return [selectedUserId];
    }

    if (selectedRole) {
      const users = await this.userRepository.find({
        where: { isHidden: false } as any,
      });

      return users
        .filter(
          (item: any) =>
            Array.isArray(item.roles) && item.roles.includes(selectedRole),
        )
        .map((item) => Number(item.id));
    }

    return [];
  }

  async build(query: AnalyticsQuery, user: any) {
    const { start, end } = getAnalyticsDateRange(query);
    const userIds = await this.getUserIds(query, user);

    const reviewsQb = this.callLogRepository
      .createQueryBuilder('call')
      .where('call.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('call.reviewAssignedTo IS NOT NULL');

    if (userIds.length) {
      reviewsQb.andWhere('call.reviewAssignedTo IN (:...userIds)', {
        userIds,
      });
    }

    const leadsCreatedQb = this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      leadsCreatedQb.andWhere('lead.createdBy IN (:...userIds)', { userIds });
    }

    const meetingsScheduledQb = this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      meetingsScheduledQb.andWhere(
        '(meeting.createdBy IN (:...userIds) OR meeting.assignedTo IN (:...userIds))',
        { userIds },
      );
    }

    const meetingsConvertedQb = this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.updatedAt BETWEEN :start AND :end', { start, end })
      .andWhere(
        '(meeting.convertToProject = true OR meeting.status = :convertedStatus)',
        { convertedStatus: MeetingStatus.CONVERTED_TO_PROJECT },
      );

    if (userIds.length) {
      meetingsConvertedQb.andWhere(
        '(meeting.createdBy IN (:...userIds) OR meeting.assignedTo IN (:...userIds) OR meeting.updatedBy IN (:...userIds))',
        { userIds },
      );
    }

    const [
      assignedReviews,
      pendingReviews,
      potentialReviews,
      convertedReviews,
      rejectedReviews,
      leadsCreated,
      meetingsScheduled,
      meetingsConverted,
      reviewStatusRows,
      assistantWiseRows,
    ] = await Promise.all([
      reviewsQb.clone().getCount(),

      reviewsQb
        .clone()
        .andWhere('call.reviewStatus = :status', {
          status: CallReviewStatus.PENDING,
        })
        .getCount(),

      reviewsQb
        .clone()
        .andWhere('call.reviewStatus = :status', {
          status: CallReviewStatus.POTENTIAL,
        })
        .getCount(),

      reviewsQb
        .clone()
        .andWhere('call.reviewStatus = :status', {
          status: CallReviewStatus.CONVERTED,
        })
        .getCount(),

      reviewsQb
        .clone()
        .andWhere('call.reviewStatus = :status', {
          status: CallReviewStatus.REJECTED,
        })
        .getCount(),

      leadsCreatedQb.clone().getCount(),

      meetingsScheduledQb.clone().getCount(),

      meetingsConvertedQb.clone().getCount(),

      reviewsQb
  .clone()
  .select('call."reviewStatus"::text', 'label')
  .addSelect('COUNT(*)', 'value')
  .groupBy('call."reviewStatus"')
  .orderBy('value', 'DESC')
  .getRawMany(),

      reviewsQb
        .clone()
        .select('call.reviewAssignedTo', 'userId')
        .addSelect('COALESCE(call.reviewAssignedToName, \'Unassigned\')', 'name')
        .addSelect('COUNT(*)', 'assignedReviews')
        .addSelect(
          `SUM(CASE WHEN call.reviewStatus = :pending THEN 1 ELSE 0 END)`,
          'pendingReviews',
        )
        .addSelect(
          `SUM(CASE WHEN call.reviewStatus = :potential THEN 1 ELSE 0 END)`,
          'potentialReviews',
        )
        .addSelect(
          `SUM(CASE WHEN call.reviewStatus = :converted THEN 1 ELSE 0 END)`,
          'convertedReviews',
        )
        .addSelect(
          `SUM(CASE WHEN call.reviewStatus = :rejected THEN 1 ELSE 0 END)`,
          'rejectedReviews',
        )
        .setParameters({
          pending: CallReviewStatus.PENDING,
          potential: CallReviewStatus.POTENTIAL,
          converted: CallReviewStatus.CONVERTED,
          rejected: CallReviewStatus.REJECTED,
        })
        .groupBy('call.reviewAssignedTo')
        .addGroupBy('call.reviewAssignedToName')
        .orderBy('COUNT(*)', 'DESC')
        .limit(50)
        .getRawMany(),
    ]);

    const reviewedReviews =
      potentialReviews + convertedReviews + rejectedReviews;

    const reviewedPercent =
      assignedReviews > 0
        ? Math.round((reviewedReviews / assignedReviews) * 100)
        : 0;

    const conversionPercent =
      assignedReviews > 0
        ? Math.round((convertedReviews / assignedReviews) * 100)
        : 0;

    const meetingConversionPercent =
      meetingsScheduled > 0
        ? Math.round((meetingsConverted / meetingsScheduled) * 100)
        : 0;

    return {
      department: 'TELECALLING_ASSISTANT',
      title: 'Telecalling Assistant Report',
      cards: {
        assignedReviews,
        reviewedReviews,
        reviewedPercent,
        pendingReviews,
        potentialReviews,
        convertedReviews,
        rejectedReviews,
        conversionPercent,
        leadsCreated,
        meetingsScheduled,
        meetingsConverted,
        meetingConversionPercent,
      },
      charts: {
        reviewStatusSplit: {
          type: 'bar',
          title: 'Review Status Split',
          data: reviewStatusRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },
        assistantReviewFunnel: {
          type: 'funnel',
          title: 'Assistant Review Funnel',
          data: [
            { label: 'Assigned Reviews', value: assignedReviews, percent: 100 },
            {
              label: 'Reviewed',
              value: reviewedReviews,
              percent: reviewedPercent,
            },
            {
              label: 'Potential',
              value: potentialReviews,
              percent:
                assignedReviews > 0
                  ? Math.round((potentialReviews / assignedReviews) * 100)
                  : 0,
            },
            {
              label: 'Converted',
              value: convertedReviews,
              percent: conversionPercent,
            },
            {
              label: 'Meetings Scheduled',
              value: meetingsScheduled,
              percent:
                convertedReviews > 0
                  ? Math.round((meetingsScheduled / convertedReviews) * 100)
                  : 0,
            },
          ],
        },
      },
      rows: assistantWiseRows.map((row) => ({
        userId: row.userId ? Number(row.userId) : null,
        name: row.name,
        assignedReviews: Number(row.assignedReviews || 0),
        pendingReviews: Number(row.pendingReviews || 0),
        potentialReviews: Number(row.potentialReviews || 0),
        convertedReviews: Number(row.convertedReviews || 0),
        rejectedReviews: Number(row.rejectedReviews || 0),
      })),
    };
  }
}