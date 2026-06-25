import { Repository } from 'typeorm';

import { User } from '../../users/user.entity';
import { Lead } from '../../leads/lead.entity';
import { CallLog } from '../../telecalling/call-log.entity';
import { TelecallingContact } from '../../telecalling/telecalling-contact.entity';
import { Meeting, MeetingStatus } from '../../meeting/meeting.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
  normalizeAnalyticsText,
  canViewAllAnalytics,
} from '../helpers/analytics-filter.helper';

export class TelecallingAnalyticsBuilder {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly contactRepository: Repository<TelecallingContact>,
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

    const contactsQb = this.contactRepository
      .createQueryBuilder('contact')
      .where('contact.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      contactsQb.andWhere('contact.assignedTo IN (:...userIds)', { userIds });
    }

    const city = normalizeAnalyticsText(query.city);
    if (city) {
      contactsQb.andWhere(
        `(
          LOWER(COALESCE(contact.city, '')) LIKE :city
          OR LOWER(COALESCE(contact.address, '')) LIKE :city
          OR LOWER(COALESCE(contact.location, '')) LIKE :city
        )`,
        { city: `%${city}%` },
      );
    }

    const zone = normalizeAnalyticsText(query.zone);
    if (zone) {
      contactsQb.andWhere('LOWER(COALESCE(contact.zone, \'\')) LIKE :zone', {
        zone: `%${zone}%`,
      });
    }

    const callsQb = this.callLogRepository
      .createQueryBuilder('call')
      .where('call.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere(`UPPER(COALESCE(call.callStatus, '')) <> 'INITIATED'`);

    if (userIds.length) {
      callsQb.andWhere('call.telecallerId IN (:...userIds)', { userIds });
    }

    const leadsQb = this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      leadsQb.andWhere('lead.originTelecallerId IN (:...userIds)', { userIds });
    }

    const meetingsCreatedQb = this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      meetingsCreatedQb.andWhere(
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
      assignedContacts,
      totalCalls,
      connected,
      cnr,
      callback,
      interested,
      convertedLeads,
      meetingsScheduled,
      meetingsConverted,
      callStatusRows,
      userWiseRows,
    ] = await Promise.all([
      contactsQb.clone().getCount(),

      callsQb.clone().getCount(),

      callsQb
        .clone()
        .andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'CONNECTED'`)
        .getCount(),

      callsQb
        .clone()
        .andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'CNR'`)
        .getCount(),

      callsQb
        .clone()
        .andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'CALLBACK'`)
        .getCount(),

      callsQb
        .clone()
        .andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'INTERESTED'`)
        .getCount(),

      leadsQb.clone().getCount(),

      meetingsCreatedQb.clone().getCount(),

      meetingsConvertedQb.clone().getCount(),

      callsQb
        .clone()
        .select('COALESCE(call.callStatus, \'UNKNOWN\')', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('call.callStatus')
        .orderBy('value', 'DESC')
        .getRawMany(),

      callsQb
        .clone()
        .select('call.telecallerId', 'userId')
        .addSelect('COUNT(*)', 'totalCalls')
        .addSelect(
          `SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'CONNECTED' THEN 1 ELSE 0 END)`,
          'connected',
        )
        .addSelect(
          `SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'CNR' THEN 1 ELSE 0 END)`,
          'cnr',
        )
        .addSelect(
          `SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'CALLBACK' THEN 1 ELSE 0 END)`,
          'callback',
        )
        .addSelect(
          `SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'INTERESTED' THEN 1 ELSE 0 END)`,
          'interested',
        )
        .andWhere('call.telecallerId IS NOT NULL')
        .groupBy('call.telecallerId')
        .orderBy('COUNT(*)', 'DESC')
        .limit(50)
        .getRawMany(),
    ]);

    const connectedPercent =
      totalCalls > 0 ? Math.round((connected / totalCalls) * 100) : 0;

    const interestedPercent =
      totalCalls > 0 ? Math.round((interested / totalCalls) * 100) : 0;

    const meetingConversionPercent =
      meetingsScheduled > 0
        ? Math.round((meetingsConverted / meetingsScheduled) * 100)
        : 0;

    return {
      department: 'TELECALLING',
      title: 'Telecalling Report',
      cards: {
        assignedContacts,
        totalCalls,
        connected,
        connectedPercent,
        cnr,
        callback,
        interested,
        interestedPercent,
        convertedLeads,
        meetingsScheduled,
        meetingsConverted,
        meetingConversionPercent,
      },
      charts: {
        callOutcomeSplit: {
          type: 'bar',
          title: 'Call Outcome Split',
          data: callStatusRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },
        telecallingFunnel: {
          type: 'funnel',
          title: 'Telecalling Funnel',
          data: [
            { label: 'Assigned Contacts', value: assignedContacts, percent: 100 },
            {
              label: 'Calls',
              value: totalCalls,
              percent:
                assignedContacts > 0
                  ? Math.round((totalCalls / assignedContacts) * 100)
                  : 0,
            },
            {
              label: 'Interested',
              value: interested,
              percent: interestedPercent,
            },
            {
              label: 'Leads Created',
              value: convertedLeads,
              percent:
                interested > 0
                  ? Math.round((convertedLeads / interested) * 100)
                  : 0,
            },
            {
              label: 'Meetings Scheduled',
              value: meetingsScheduled,
              percent:
                convertedLeads > 0
                  ? Math.round((meetingsScheduled / convertedLeads) * 100)
                  : 0,
            },
          ],
        },
      },
      rows: userWiseRows.map((row) => ({
        userId: row.userId ? Number(row.userId) : null,
        totalCalls: Number(row.totalCalls || 0),
        connected: Number(row.connected || 0),
        cnr: Number(row.cnr || 0),
        callback: Number(row.callback || 0),
        interested: Number(row.interested || 0),
      })),
    };
  }
}