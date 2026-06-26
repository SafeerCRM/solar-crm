import { Repository } from 'typeorm';

import { User } from '../../users/user.entity';
import { Lead, LeadPotential, LeadStatus } from '../../leads/lead.entity';
import { Meeting } from '../../meeting/meeting.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
  normalizeAnalyticsText,
  canViewAllAnalytics,
} from '../helpers/analytics-filter.helper';

export class LeadAnalyticsBuilder {
  constructor(
    private readonly userRepository: Repository<User>,
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

    const leadsQb = this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      leadsQb.andWhere(
        '(lead.assignedTo IN (:...userIds) OR lead.createdBy IN (:...userIds) OR lead.originTelecallerId IN (:...userIds))',
        { userIds },
      );
    }

    const city = normalizeAnalyticsText(query.city);
    if (city) {
      leadsQb.andWhere(
        `(LOWER(COALESCE(lead.city, '')) LIKE :city OR LOWER(COALESCE(lead.address, '')) LIKE :city)`,
        { city: `%${city}%` },
      );
    }

    const zone = normalizeAnalyticsText(query.zone);
    if (zone) {
      leadsQb.andWhere('LOWER(COALESCE(lead.zone, \'\')) LIKE :zone', {
        zone: `%${zone}%`,
      });
    }

    const meetingsQb = this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('meeting.leadId IS NOT NULL');

    if (userIds.length) {
      meetingsQb.andWhere(
        '(meeting.createdBy IN (:...userIds) OR meeting.assignedTo IN (:...userIds))',
        { userIds },
      );
    }

    const [
      totalLeads,
      newLeads,
      contactedLeads,
      interestedLeads,
      notInterestedLeads,
      wonLeads,
      lostLeads,
      highPotential,
      mediumPotential,
      lowPotential,
      convertedToMeeting,
uniqueLeadsConvertedToMeeting,
statusRows,
potentialRows,
userWiseRows,
    ] = await Promise.all([
      leadsQb.clone().getCount(),

      leadsQb
        .clone()
        .andWhere('lead.status = :status', { status: LeadStatus.NEW })
        .getCount(),

      leadsQb
        .clone()
        .andWhere('lead.status = :status', { status: LeadStatus.CONTACTED })
        .getCount(),

      leadsQb
        .clone()
        .andWhere('lead.status = :status', { status: LeadStatus.INTERESTED })
        .getCount(),

      leadsQb
        .clone()
        .andWhere('lead.status = :status', {
          status: LeadStatus.NOT_INTERESTED,
        })
        .getCount(),

      leadsQb
        .clone()
        .andWhere('lead.status = :status', { status: LeadStatus.WON })
        .getCount(),

      leadsQb
        .clone()
        .andWhere('lead.status = :status', { status: LeadStatus.LOST })
        .getCount(),

      leadsQb
        .clone()
        .andWhere('lead.potential = :potential', {
          potential: LeadPotential.HIGH,
        })
        .getCount(),

      leadsQb
        .clone()
        .andWhere('lead.potential = :potential', {
          potential: LeadPotential.MEDIUM,
        })
        .getCount(),

      leadsQb
        .clone()
        .andWhere('lead.potential = :potential', {
          potential: LeadPotential.LOW,
        })
        .getCount(),

      meetingsQb.clone().getCount(),

      meetingsQb
  .clone()
  .select('COUNT(DISTINCT meeting.leadId)', 'count')
  .getRawOne(),

      leadsQb
        .clone()
        .select('lead.status::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('lead.status')
        .orderBy('value', 'DESC')
        .getRawMany(),

      leadsQb
        .clone()
        .select('lead.potential::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('lead.potential')
        .orderBy('value', 'DESC')
        .getRawMany(),

      leadsQb
        .clone()
        .select('lead.assignedTo', 'userId')
        .addSelect('COUNT(*)', 'totalLeads')
        .addSelect(
          `SUM(CASE WHEN lead.potential = :high THEN 1 ELSE 0 END)`,
          'highPotential',
        )
        .addSelect(
          `SUM(CASE WHEN lead.potential = :medium THEN 1 ELSE 0 END)`,
          'mediumPotential',
        )
        .addSelect(
          `SUM(CASE WHEN lead.potential = :low THEN 1 ELSE 0 END)`,
          'lowPotential',
        )
        .setParameters({
          high: LeadPotential.HIGH,
          medium: LeadPotential.MEDIUM,
          low: LeadPotential.LOW,
        })
        .andWhere('lead.assignedTo IS NOT NULL')
        .groupBy('lead.assignedTo')
        .orderBy('COUNT(*)', 'DESC')
        .limit(50)
        .getRawMany(),
    ]);

    const uniqueLeadConvertedCount = Number(
  uniqueLeadsConvertedToMeeting?.count || 0,
);

const meetingConversionPercent =
  totalLeads > 0
    ? Math.round((uniqueLeadConvertedCount / totalLeads) * 100)
    : 0;

    return {
      department: 'LEADS',
      title: 'Lead Analytics Report',
      cards: {
        totalLeads,
        newLeads,
        contactedLeads,
        interestedLeads,
        notInterestedLeads,
        wonLeads,
        lostLeads,
        highPotential,
        mediumPotential,
        lowPotential,
        convertedToMeeting,
        uniqueLeadConvertedCount,
        meetingConversionPercent,
      },
      charts: {
        leadStatusSplit: {
          type: 'bar',
          title: 'Lead Status Split',
          data: statusRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },
        potentialSplit: {
          type: 'bar',
          title: 'Lead Potential Split',
          data: potentialRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },
        leadToMeetingFunnel: {
          type: 'funnel',
          title: 'Lead to Meeting Funnel',
          data: [
            { label: 'Total Leads', value: totalLeads, percent: 100 },
            {
              label: 'Interested',
              value: interestedLeads,
              percent:
                totalLeads > 0
                  ? Math.round((interestedLeads / totalLeads) * 100)
                  : 0,
            },
            {
  label: 'Unique Leads Converted',
  value: uniqueLeadConvertedCount,
  percent: meetingConversionPercent,
},
{
  label: 'Meetings Generated',
  value: convertedToMeeting,
  percent: 0,
},
          ],
        },
      },
      rows: userWiseRows.map((row) => ({
        userId: row.userId ? Number(row.userId) : null,
        totalLeads: Number(row.totalLeads || 0),
        highPotential: Number(row.highPotential || 0),
        mediumPotential: Number(row.mediumPotential || 0),
        lowPotential: Number(row.lowPotential || 0),
      })),
    };
  }
}