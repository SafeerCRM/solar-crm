import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, SelectQueryBuilder } from 'typeorm';
import { Lead, LeadStatus } from '../leads/lead.entity';
import { CallLog } from '../telecalling/call-log.entity';
import { FollowUp, FollowUpStatus } from '../followup/follow-up.entity';
import { TelecallingContact } from '../telecalling/telecalling-contact.entity';
import { UserRole } from '../users/user.entity';
import { Meeting, MeetingCategory, MeetingStatus } from '../meeting/meeting.entity';


type DashboardFilters = {
  assignedTo?: number;
  zone?: string;
  city?: string;
  fromDate?: string;
  toDate?: string;
  month?: string;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,

    @InjectRepository(CallLog)
    private readonly callLogRepository: Repository<CallLog>,

    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,

    @InjectRepository(TelecallingContact)
private readonly telecallingContactRepository: Repository<TelecallingContact>,

@InjectRepository(Meeting)
private readonly meetingRepository: Repository<Meeting>,
) {}

  private hasAnyRole(userRoles: string[] = [], rolesToCheck: UserRole[]): boolean {
    return rolesToCheck.some((role) => userRoles.includes(role));
  }

  private isOwnOnlyRole(userRoles: string[] = []): boolean {
    return this.hasAnyRole(userRoles, [
      UserRole.TELECALLER,
      UserRole.LEAD_EXECUTIVE,
      UserRole.MEETING_MANAGER,
      UserRole.PROJECT_EXECUTIVE,
    ]);
  }

  private normalizeText(value?: string): string {
    return String(value || '').trim().toLowerCase();
  }

    private getDateRange(filters: DashboardFilters) {
    if (filters.month) {
      const [year, month] = String(filters.month).split('-').map(Number);
      if (year && month) {
        const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const end = new Date(year, month, 0, 23, 59, 59, 999);
        return { start, end };
      }
    }

    if (filters.fromDate || filters.toDate) {
      const start = filters.fromDate
        ? new Date(`${filters.fromDate}T00:00:00`)
        : new Date('2000-01-01T00:00:00');

      const end = filters.toDate
        ? new Date(`${filters.toDate}T23:59:59.999`)
        : new Date();

      return { start, end };
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  private applyContactFilters(
    qb: SelectQueryBuilder<TelecallingContact>,
    filters: DashboardFilters,
  ) {
    if (filters.assignedTo) {
      qb.andWhere('contact.assignedTo = :assignedTo', {
        assignedTo: filters.assignedTo,
      });
    }

    const zone = this.normalizeText(filters.zone);
    if (zone) {
      qb.andWhere('LOWER(COALESCE(contact.zone, \'\')) LIKE :zone', {
        zone: `%${zone}%`,
      });
    }

    const city = this.normalizeText(filters.city);
    if (city) {
      qb.andWhere(
        `(
          LOWER(COALESCE(contact.city, '')) LIKE :city
          OR LOWER(COALESCE(contact.address, '')) LIKE :city
          OR LOWER(COALESCE(contact.location, '')) LIKE :city
        )`,
        { city: `%${city}%` },
      );
    }

    const dateRange = this.getDateRange(filters);
    if (dateRange) {
      qb.andWhere('contact.createdAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    return qb;
  }

  private applyCallFilters(
    qb: SelectQueryBuilder<CallLog>,
    filters: DashboardFilters,
  ) {
    if (filters.assignedTo) {
      qb.andWhere('call.telecallerId = :assignedTo', {
        assignedTo: filters.assignedTo,
      });
    }

    const dateRange = this.getDateRange(filters);
    if (dateRange) {
      qb.andWhere('call.createdAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    return qb;
  }

    private applyLeadFilters(
    qb: SelectQueryBuilder<Lead>,
    filters: DashboardFilters,
  ) {
    if (filters.assignedTo) {
      qb.andWhere('lead.assignedTo = :assignedTo', {
        assignedTo: filters.assignedTo,
      });
    }

    const dateRange = this.getDateRange(filters);
    if (dateRange) {
      qb.andWhere('lead.createdAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    return qb;
  }

  private applyFollowUpFilters(
    qb: SelectQueryBuilder<FollowUp>,
    filters: DashboardFilters,
  ) {
    if (filters.assignedTo) {
      qb.andWhere('followUp.assignedTo = :assignedTo', {
        assignedTo: filters.assignedTo,
      });
    }

    const dateRange = this.getDateRange(filters);
    if (dateRange) {
      qb.andWhere('followUp.followUpDate BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    return qb;
  }
      async getSummary(
    filters: DashboardFilters = {},
    userRoles: string[] = [],
    currentUserId?: number,
  ) {
    const isOwnOnly = this.isOwnOnlyRole(userRoles);
    const effectiveAssignedTo =
      isOwnOnly && currentUserId ? currentUserId : filters.assignedTo;

    const effectiveFilters: DashboardFilters = {
      ...filters,
      assignedTo: effectiveAssignedTo,
    };

    const dateRange = this.getDateRange(effectiveFilters);

    const totalLeadsQb = this.leadRepository
      .createQueryBuilder('lead')
      .where('1=1');
    this.applyLeadFilters(totalLeadsQb, effectiveFilters);
    const totalLeads = await totalLeadsQb.getCount();

    const newLeadsQb = this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.status = :status', { status: LeadStatus.NEW });
    this.applyLeadFilters(newLeadsQb, effectiveFilters);
    const newLeads = await newLeadsQb.getCount();

    const interestedLeadsQb = this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.status = :status', { status: LeadStatus.INTERESTED });
    this.applyLeadFilters(interestedLeadsQb, effectiveFilters);
    const interestedLeads = await interestedLeadsQb.getCount();

    const callbackQb = this.callLogRepository
      .createQueryBuilder('call')
      .where('call.callStatus = :status', { status: 'CALLBACK' });
    this.applyCallFilters(callbackQb, effectiveFilters);
    const callbackCount = await callbackQb.getCount();

    const neverCalledQb = this.leadRepository
      .createQueryBuilder('lead')
      .where('1=1');
    this.applyLeadFilters(neverCalledQb, effectiveFilters);

    const subParams: Record<string, any> = {};
    let notExistsSql = `
      NOT EXISTS (
        SELECT 1
        FROM call_log call
        WHERE call."leadId" = lead.id
    `;

    if (effectiveAssignedTo) {
      notExistsSql += ` AND call."telecallerId" = :neverCalledAssignedTo`;
      subParams.neverCalledAssignedTo = effectiveAssignedTo;
    }

    if (dateRange) {
      notExistsSql += ` AND call."createdAt" BETWEEN :neverCalledStart AND :neverCalledEnd`;
      subParams.neverCalledStart = dateRange.start;
      subParams.neverCalledEnd = dateRange.end;
    }

    notExistsSql += `)`;

    neverCalledQb.andWhere(notExistsSql, subParams);
    const neverCalledCount = await neverCalledQb.getCount();

    const pendingFollowUpsQb = this.followUpRepository
      .createQueryBuilder('followUp')
      .where('followUp.status = :status', { status: FollowUpStatus.PENDING });
    this.applyFollowUpFilters(pendingFollowUpsQb, effectiveFilters);
    const todayFollowUps = await pendingFollowUpsQb.getCount();

    const overdueFollowUpsQb = this.followUpRepository
      .createQueryBuilder('followUp')
      .where('followUp.status = :status', { status: FollowUpStatus.PENDING });

    if (effectiveAssignedTo) {
      overdueFollowUpsQb.andWhere('followUp.assignedTo = :assignedTo', {
        assignedTo: effectiveAssignedTo,
      });
    }

    if (dateRange) {
      overdueFollowUpsQb.andWhere('followUp.followUpDate < :overdueBefore', {
        overdueBefore: dateRange.start,
      });
    }

    const overdueFollowUps = await overdueFollowUpsQb.getCount();

    const contactsQb = this.telecallingContactRepository
      .createQueryBuilder('contact')
      .where('1=1');

    this.applyContactFilters(contactsQb, effectiveFilters);
    const totalContacts = await contactsQb.getCount();

    const calledContactsQb = this.callLogRepository
      .createQueryBuilder('call')
      .select('COUNT(DISTINCT call.contactId)', 'count')
      .where('call.contactId IS NOT NULL')
      .andWhere(`UPPER(COALESCE(call.callStatus, '')) <> 'INITIATED'`);

    this.applyCallFilters(calledContactsQb, effectiveFilters);
    const calledContactsRaw = await calledContactsQb.getRawOne();
    const calledContacts = Number(calledContactsRaw?.count || 0);

    return {
      totalLeads,
      newLeads,
      interestedLeads,
      neverCalledCount,
      callbackCount,
      todayFollowUps,
      overdueFollowUps,
      totalContacts,
      calledContacts,
    };
  }

    async getContactsSummary(
    filters: DashboardFilters = {},
    userRoles: string[] = [],
    currentUserId?: number,
  ) {
    const isOwnOnly = this.isOwnOnlyRole(userRoles);
    const effectiveAssignedTo =
      isOwnOnly && currentUserId ? currentUserId : filters.assignedTo;

    const effectiveFilters: DashboardFilters = {
      ...filters,
      assignedTo: effectiveAssignedTo,
    };

    const totalQb = this.telecallingContactRepository
      .createQueryBuilder('contact')
      .where('1=1');

    if (effectiveAssignedTo) {
      totalQb.andWhere('contact.assignedTo = :assignedTo', {
        assignedTo: effectiveAssignedTo,
      });
    }

    const totalContacts = await totalQb.getCount();

    const filteredQb = this.telecallingContactRepository
      .createQueryBuilder('contact')
      .where('1=1');

    this.applyContactFilters(filteredQb, effectiveFilters);
    const filteredContacts = await filteredQb.getCount();

    return {
      totalContacts,
      filteredContacts,
    };
  }

    async getPerformance(
    filters: DashboardFilters = {},
    userRoles: string[] = [],
    currentUserId?: number,
  ) {
    const isOwnOnly = this.isOwnOnlyRole(userRoles);
    const effectiveAssignedTo =
      isOwnOnly && currentUserId ? currentUserId : filters.assignedTo;

    const effectiveFilters: DashboardFilters = {
      ...filters,
      assignedTo: effectiveAssignedTo,
    };

    const qb = this.callLogRepository
      .createQueryBuilder('call')
      .select('call.telecallerId', 'telecallerId')
      .addSelect('COUNT(*)', 'totalCalls')
      .addSelect(
        `SUM(CASE WHEN call.callStatus = 'INTERESTED' THEN 1 ELSE 0 END)`,
        'interested',
      )
      .where('call.telecallerId IS NOT NULL')
      .andWhere(`UPPER(COALESCE(call.callStatus, '')) <> 'INITIATED'`);

    this.applyCallFilters(qb, effectiveFilters);

    qb.groupBy('call.telecallerId').orderBy('COUNT(*)', 'DESC');

    return qb.getRawMany();
  }
    async getCharts(
    filters: DashboardFilters = {},
    userRoles: string[] = [],
    currentUserId?: number,
  ) {
    const isOwnOnly = this.isOwnOnlyRole(userRoles);
    const effectiveAssignedTo =
      isOwnOnly && currentUserId ? currentUserId : filters.assignedTo;

    const effectiveFilters: DashboardFilters = {
      ...filters,
      assignedTo: effectiveAssignedTo,
    };

    const contactsBaseQb = this.telecallingContactRepository
      .createQueryBuilder('contact')
      .where('1=1');

    this.applyContactFilters(contactsBaseQb, effectiveFilters);

    const contactsByZoneRaw = await contactsBaseQb
      .clone()
      .select('COALESCE(contact.zone, \'Unassigned Zone\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('contact.zone')
      .orderBy('value', 'DESC')
      .getRawMany();

    const contactsByCityRaw = await contactsBaseQb
      .clone()
      .select('COALESCE(contact.city, \'Unknown City\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('contact.city')
      .orderBy('value', 'DESC')
      .getRawMany();

    const callsBaseQb = this.callLogRepository
      .createQueryBuilder('call')
      .where('call.contactId IS NOT NULL');

    this.applyCallFilters(callsBaseQb, effectiveFilters);

    const calledContactsByStatusRaw = await callsBaseQb
      .clone()
      .select('COALESCE(call.callStatus, \'UNKNOWN\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('call.callStatus')
      .orderBy('value', 'DESC')
      .getRawMany();

    const calledContactsByMonthRaw = await callsBaseQb
      .clone()
      .select(`TO_CHAR(call.createdAt, 'YYYY-MM')`, 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy(`TO_CHAR(call.createdAt, 'YYYY-MM')`)
      .orderBy(`TO_CHAR(call.createdAt, 'YYYY-MM')`, 'ASC')
      .getRawMany();

    let contactsByTelecaller: Array<{ label: string; value: number }> = [];

    const telecallerRows = await this.telecallingContactRepository
      .createQueryBuilder('contact')
      .select('contact.assignedTo', 'assignedTo')
      .addSelect('COALESCE(contact.assignedToName, \'Unassigned\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .where('1=1')
      .andWhere(
        effectiveAssignedTo
          ? 'contact.assignedTo = :assignedTo'
          : '1=1',
        effectiveAssignedTo ? { assignedTo: effectiveAssignedTo } : {},
      )
      .andWhere(
        this.normalizeText(effectiveFilters.zone)
          ? 'LOWER(COALESCE(contact.zone, \'\')) LIKE :zone'
          : '1=1',
        this.normalizeText(effectiveFilters.zone)
          ? { zone: `%${this.normalizeText(effectiveFilters.zone)}%` }
          : {},
      )
      .andWhere(
        this.normalizeText(effectiveFilters.city)
          ? `(LOWER(COALESCE(contact.city, '')) LIKE :city OR LOWER(COALESCE(contact.address, '')) LIKE :city OR LOWER(COALESCE(contact.location, '')) LIKE :city)`
          : '1=1',
        this.normalizeText(effectiveFilters.city)
          ? { city: `%${this.normalizeText(effectiveFilters.city)}%` }
          : {},
      )
      .groupBy('contact.assignedTo')
      .addGroupBy('contact.assignedToName')
      .orderBy('value', 'DESC')
      .getRawMany();

    contactsByTelecaller = telecallerRows.map((row) => ({
      label: row.label,
      value: Number(row.value || 0),
    }));

    return {
      contactsByZone: contactsByZoneRaw.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      contactsByCity: contactsByCityRaw.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      contactsByTelecaller,
      calledContactsByStatus: calledContactsByStatusRaw.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      calledContactsByMonth: calledContactsByMonthRaw.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
    };
  }

  async getMeetingManagerAnalytics() {
  const qb = this.meetingRepository
    .createQueryBuilder('meeting')
    .select('meeting.assignedTo', 'managerId')
    .addSelect('COALESCE(meeting.assignedToName, \'Unassigned\')', 'managerName')
    .addSelect('COUNT(*)', 'totalMeetings')
    .addSelect(
      `SUM(CASE WHEN meeting."meetingCategory" = :company THEN 1 ELSE 0 END)`,
      'companyMeetings',
    )
    .addSelect(
      `SUM(CASE WHEN meeting."meetingCategory" = :self THEN 1 ELSE 0 END)`,
      'selfMeetings',
    )
    .addSelect(
      `SUM(CASE WHEN meeting.status = :converted THEN 1 ELSE 0 END)`,
      'convertedMeetings',
    )
    .setParameters({
      company: MeetingCategory.COMPANY_MEETING,
      self: MeetingCategory.SELF_MEETING,
      converted: MeetingStatus.CONVERTED_TO_PROJECT,
    })
    .groupBy('meeting.assignedTo')
    .addGroupBy('meeting.assignedToName')
    .orderBy('COUNT(*)', 'DESC');

  const rows = await qb.getRawMany();

  return rows.map((row) => ({
    managerId: row.managerId ? Number(row.managerId) : null,
    managerName: row.managerName,
    totalMeetings: Number(row.totalMeetings || 0),
    companyMeetings: Number(row.companyMeetings || 0),
    selfMeetings: Number(row.selfMeetings || 0),
    convertedMeetings: Number(row.convertedMeetings || 0),
  }));
}
}