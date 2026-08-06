import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, SelectQueryBuilder } from 'typeorm';
import { Lead, LeadStatus, LeadPotential } from '../leads/lead.entity';
import { CallLog, CallReviewStatus } from '../telecalling/call-log.entity';
import { FollowUp, FollowUpStatus } from '../followup/follow-up.entity';
import { TelecallingContact } from '../telecalling/telecalling-contact.entity';
import { UserRole } from '../users/user.entity';
import {
  Meeting,
  MeetingCategory,
  MeetingStatus,
  MeetingType,
} from '../meeting/meeting.entity';
import { User } from '../users/user.entity';
import {
  Project,
  ProjectStatus,
  ProjectType,
} from '../project/project.entity';


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
  private ownerSummaryCache: any = null;
  private ownerSummaryCacheAt = 0;

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,

    @InjectRepository(CallLog)
    private readonly callLogRepository: Repository<CallLog>,

    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,

    @InjectRepository(TelecallingContact)
private readonly telecallingContactRepository: Repository<TelecallingContact>,

@InjectRepository(User)
private readonly userRepository: Repository<User>,

@InjectRepository(Meeting)
private readonly meetingRepository: Repository<Meeting>,

@InjectRepository(Project)
private readonly projectRepository: Repository<Project>,
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

  private getTodayIndiaRange() {
  const now = new Date();

  const indiaDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const start = new Date(`${indiaDate}T00:00:00+05:30`);
  const end = new Date(`${indiaDate}T23:59:59.999+05:30`);

  return { start, end };
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

  async getMeetingManagerAnalytics(
  userRoles: string[] = [],
  currentUserId?: number,
) {
  const { start, end } = this.getTodayIndiaRange();

  const now = new Date();

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const meetingManagers = await this.userRepository.find({
    where: {
      isHidden: false,
    },
  });

  let filteredManagers = meetingManagers.filter(
    (user: any) =>
      Array.isArray(user.roles) &&
      user.roles.includes(UserRole.MEETING_MANAGER),
  );

  if (
    userRoles.includes(UserRole.MEETING_MANAGER) &&
    !userRoles.includes(UserRole.OWNER) &&
    !userRoles.includes(UserRole.MARKETING_HEAD)
  ) {
    const currentManager =
      meetingManagers.find(
        (manager: any) =>
          Number(manager.id) === Number(currentUserId),
      ) || {
        id: Number(currentUserId),
        name: 'My Analytics',
        roles: [UserRole.MEETING_MANAGER],
      };

    filteredManagers = [currentManager as any];
  }

  const managerIds = filteredManagers
    .map((manager: any) => Number(manager.id))
    .filter((id: number) => Number.isFinite(id) && id > 0);

  if (managerIds.length === 0) {
    return [];
  }

  /*
   * Query 1:
   * Counts based on meeting.assignedTo.
   */
  const assignedMeetingRows: any[] =
    await this.meetingRepository.query(
      `
      SELECT
        meeting."assignedTo" AS "managerId",

        COUNT(
          DISTINCT COALESCE(
            meeting."meetingGroupId",
            meeting.id
          )
        ) FILTER (
          WHERE meeting."scheduledAt"
            BETWEEN $1 AND $2
        ) AS "totalMeetings",

        COUNT(*) FILTER (
          WHERE meeting."scheduledAt"
            BETWEEN $3 AND $4
        ) AS "todayMeetings",

        COUNT(*) FILTER (
          WHERE meeting."meetingCategory" = $5
            AND meeting."scheduledAt"
              BETWEEN $3 AND $4
        ) AS "companyMeetingsToday",

        COUNT(*) FILTER (
          WHERE meeting."meetingCategory" = $6
            AND meeting."scheduledAt"
              BETWEEN $3 AND $4
        ) AS "selfMeetingsToday",

        COUNT(*) FILTER (
          WHERE meeting.status = $7
            AND meeting."updatedAt"
              BETWEEN $3 AND $4
        ) AS "completedMeetingsToday",

        COUNT(
          DISTINCT COALESCE(
            meeting."meetingGroupId",
            meeting.id
          )
        ) FILTER (
          WHERE (
            meeting."convertToProject" = true
            OR meeting.status = $8
          )
          AND meeting."updatedAt"
            BETWEEN $3 AND $4
        ) AS "convertedMeetingsToday"

      FROM meetings meeting

      WHERE meeting."assignedTo" =
        ANY($9::int[])

      GROUP BY meeting."assignedTo"
      `,
      [
        monthStart,
        monthEnd,
        start,
        end,
        MeetingCategory.COMPANY_MEETING,
        MeetingCategory.SELF_MEETING,
        MeetingStatus.COMPLETED,
        MeetingStatus.CONVERTED_TO_PROJECT,
        managerIds,
      ],
    );

  /*
   * Query 2:
   * Site visits based on meeting.updatedBy.
   */
  const siteVisitRows: any[] =
    await this.meetingRepository.query(
      `
      SELECT
        meeting."updatedBy" AS "managerId",

        COUNT(
          DISTINCT COALESCE(
            meeting."meetingGroupId",
            meeting.id
          )
        ) FILTER (
          WHERE meeting."meetingType" = $1
            AND meeting."updatedAt"
              BETWEEN $2 AND $3
        ) AS "siteVisitsToday",

        COUNT(
          DISTINCT COALESCE(
            meeting."meetingGroupId",
            meeting.id
          )
        ) FILTER (
          WHERE meeting."meetingType" = $1
            AND meeting."meetingCategory" = $4
            AND meeting."updatedAt"
              BETWEEN $2 AND $3
        ) AS "companySiteVisitsToday",

        COUNT(
          DISTINCT COALESCE(
            meeting."meetingGroupId",
            meeting.id
          )
        ) FILTER (
          WHERE meeting."meetingType" = $1
            AND meeting."meetingCategory" = $5
            AND meeting."updatedAt"
              BETWEEN $2 AND $3
        ) AS "selfSiteVisitsToday"

      FROM meetings meeting

      WHERE meeting."updatedBy" =
        ANY($6::int[])

      GROUP BY meeting."updatedBy"
      `,
      [
        MeetingType.SITE_VISIT,
        start,
        end,
        MeetingCategory.COMPANY_MEETING,
        MeetingCategory.SELF_MEETING,
        managerIds,
      ],
    );

  /*
   * Query 3:
   * Meeting-form creation counts based on meeting.createdBy.
   */
  const createdMeetingRows: any[] =
    await this.meetingRepository.query(
      `
      SELECT
        meeting."createdBy" AS "managerId",

        COUNT(*) FILTER (
          WHERE meeting."createdAt"
            BETWEEN $1 AND $2
        ) AS "meetingFormsCreatedToday",

        COUNT(*) FILTER (
          WHERE meeting."meetingCategory" = $3
            AND meeting."createdAt"
              BETWEEN $1 AND $2
        ) AS "companyMeetingsCreatedToday",

        COUNT(*) FILTER (
          WHERE meeting."meetingCategory" = $4
            AND meeting."createdAt"
              BETWEEN $1 AND $2
        ) AS "selfMeetingsCreatedToday",

        COUNT(*) FILTER (
          WHERE meeting."meetingCategory" = $5
            AND meeting."createdAt"
              BETWEEN $1 AND $2
        ) AS "solarMiterMeetingsCreatedToday",

        COUNT(*) FILTER (
          WHERE meeting."meetingCategory" = $3
            AND meeting."createdAt"
              BETWEEN $6 AND $7
        ) AS "companyMeetingsCreatedThisMonth",

        COUNT(*) FILTER (
          WHERE meeting."meetingCategory" = $4
            AND meeting."createdAt"
              BETWEEN $6 AND $7
        ) AS "selfMeetingsCreatedThisMonth"

      FROM meetings meeting

      WHERE meeting."createdBy" =
        ANY($8::int[])

      GROUP BY meeting."createdBy"
      `,
      [
        start,
        end,
        MeetingCategory.COMPANY_MEETING,
        MeetingCategory.SELF_MEETING,
        MeetingCategory.SOLARMITER,
        monthStart,
        monthEnd,
        managerIds,
      ],
    );

  /*
   * Query 4:
   * Project counts based on project.projectOwnerId.
   */
  const projectRows: any[] =
    await this.projectRepository.query(
      `
      SELECT
        project."projectOwnerId" AS "managerId",

        COUNT(*) FILTER (
          WHERE project."projectType" = $1
            AND project."createdAt"
              BETWEEN $3 AND $4
        ) AS "loanProjectsCreatedThisMonth",

        COUNT(*) FILTER (
          WHERE project."projectType" = $2
            AND project."createdAt"
              BETWEEN $3 AND $4
        ) AS "cashProjectsCreatedThisMonth",

        COUNT(*) FILTER (
          WHERE project."projectWorkState" = 'RUNNING'
        ) AS "runningProjects",

        COUNT(*) FILTER (
          WHERE project."projectType" = $2
            AND project."projectWorkState" = 'RUNNING'
        ) AS "runningCashProjects",

        COUNT(*) FILTER (
          WHERE project."projectType" = $1
            AND project."projectWorkState" = 'RUNNING'
        ) AS "runningLoanProjects",

        COUNT(*) FILTER (
          WHERE project."projectType" = $2
            AND project.status IN ($5, $6)
            AND project."cancelledAt"
              BETWEEN $3 AND $4
        ) AS "cashProjectsCancelledRejectedThisMonth",

        COUNT(*) FILTER (
          WHERE project."projectType" = $1
            AND project.status IN ($5, $6)
            AND project."cancelledAt"
              BETWEEN $3 AND $4
        ) AS "loanProjectsCancelledRejectedThisMonth"

      FROM project project

      WHERE project."isHidden" = false
        AND project."projectOwnerId" =
          ANY($7::int[])

      GROUP BY project."projectOwnerId"
      `,
      [
        ProjectType.LOAN,
        ProjectType.CASH,
        monthStart,
        monthEnd,
        ProjectStatus.CANCELLED,
        ProjectStatus.REJECTED,
        managerIds,
      ],
    );

  const createRowMap = (rows: any[]) =>
    new Map<number, any>(
      rows.map((row: any) => [
        Number(row.managerId),
        row,
      ]),
    );

  const assignedMeetingMap =
    createRowMap(assignedMeetingRows);

  const siteVisitMap =
    createRowMap(siteVisitRows);

  const createdMeetingMap =
    createRowMap(createdMeetingRows);

  const projectMap =
    createRowMap(projectRows);

  const toNumber = (value: any) =>
    Number(value || 0);

  return filteredManagers.map((manager: any) => {
    const managerId = Number(manager.id);

    const assigned =
      assignedMeetingMap.get(managerId) || {};

    const siteVisits =
      siteVisitMap.get(managerId) || {};

    const created =
      createdMeetingMap.get(managerId) || {};

    const projects =
      projectMap.get(managerId) || {};

    const totalMeetings =
      toNumber(assigned.totalMeetings);

    const todayMeetings =
      toNumber(assigned.todayMeetings);

    const companyMeetingsToday =
      toNumber(assigned.companyMeetingsToday);

    const selfMeetingsToday =
      toNumber(assigned.selfMeetingsToday);

    const completedMeetingsToday =
      toNumber(assigned.completedMeetingsToday);

    const convertedMeetingsToday =
      toNumber(assigned.convertedMeetingsToday);

    const siteVisitsToday =
      toNumber(siteVisits.siteVisitsToday);

    const companySiteVisitsToday =
      toNumber(siteVisits.companySiteVisitsToday);

    const selfSiteVisitsToday =
      toNumber(siteVisits.selfSiteVisitsToday);

    const meetingFormsCreatedToday =
      toNumber(created.meetingFormsCreatedToday);

    const companyMeetingsCreatedToday =
      toNumber(created.companyMeetingsCreatedToday);

    const selfMeetingsCreatedToday =
      toNumber(created.selfMeetingsCreatedToday);

    const solarMiterMeetingsCreatedToday =
      toNumber(created.solarMiterMeetingsCreatedToday);

    const companyMeetingsCreatedThisMonth =
      toNumber(created.companyMeetingsCreatedThisMonth);

    const selfMeetingsCreatedThisMonth =
      toNumber(created.selfMeetingsCreatedThisMonth);

    const loanProjectsCreatedThisMonth =
      toNumber(projects.loanProjectsCreatedThisMonth);

    const cashProjectsCreatedThisMonth =
      toNumber(projects.cashProjectsCreatedThisMonth);

    const runningProjects =
      toNumber(projects.runningProjects);

    const runningCashProjects =
      toNumber(projects.runningCashProjects);

    const runningLoanProjects =
      toNumber(projects.runningLoanProjects);

    const cashProjectsCancelledRejectedThisMonth =
      toNumber(
        projects.cashProjectsCancelledRejectedThisMonth,
      );

    const loanProjectsCancelledRejectedThisMonth =
      toNumber(
        projects.loanProjectsCancelledRejectedThisMonth,
      );

    return {
      managerId,
      managerName: manager.name,

      totalMeetings,

      todayMeetings,
      companyMeetingsToday,
      selfMeetingsToday,

      siteVisitsToday,
      companySiteVisitsToday,
      selfSiteVisitsToday,

      meetingFormsCreatedToday,
      completedMeetingsToday,
      convertedMeetingsToday,

      companyMeetingsCreatedToday,
      selfMeetingsCreatedToday,
      solarMiterMeetingsCreatedToday,

      companyMeetingsCreatedThisMonth,
      selfMeetingsCreatedThisMonth,

      loanProjectsCreatedThisMonth,
      cashProjectsCreatedThisMonth,

      runningProjects,
      runningCashProjects,
      runningLoanProjects,

      cashProjectsCancelledRejectedThisMonth,
      loanProjectsCancelledRejectedThisMonth,

      // Existing frontend aliases remain unchanged.
      companyMeetings: companyMeetingsToday,
      selfMeetings: selfMeetingsToday,
      convertedMeetings: convertedMeetingsToday,
    };
  });
}

async getLeadManagerAnalytics() {
  const { start, end } = this.getTodayIndiaRange();

  const leadManagers = await this.userRepository.find();

  const filteredManagers = leadManagers.filter(
    (u: any) =>
      Array.isArray(u.roles) &&
      u.roles.includes(UserRole.LEAD_MANAGER),
  );

  const result: any[] = [];

  for (const manager of filteredManagers) {
    const totalLeads = await this.leadRepository.count({
      where: {
        assignedTo: manager.id,
      },
    });

    const todayLeads = await this.leadRepository.count({
      where: {
        assignedTo: manager.id,
        createdAt: Between(start, end),
      },
    });

    const callsToday = await this.callLogRepository.count({
      where: {
        telecallerId: manager.id,
        createdAt: Between(start, end),
      },
    });

    const meetingsScheduledToday = await this.meetingRepository.count({
  where: {
    createdBy: manager.id,
    updatedAt: Between(start, end),
  },
});

    const meetingsCompletedToday = await this.meetingRepository.count({
      where: {
        createdBy: manager.id,
        status: MeetingStatus.COMPLETED,
        updatedAt: Between(start, end),
      },
    });

    const convertedToMeetingToday = meetingsScheduledToday;

    const lowPotential = await this.leadRepository.count({
      where: {
        assignedTo: manager.id,
        potential: LeadPotential.LOW,
      },
    });

    const mediumPotential = await this.leadRepository.count({
      where: {
        assignedTo: manager.id,
        potential: LeadPotential.MEDIUM,
      },
    });

    const highPotential = await this.leadRepository.count({
      where: {
        assignedTo: manager.id,
        potential: LeadPotential.HIGH,
      },
    });

    result.push({
      managerId: manager.id,
      managerName: manager.name,

      totalLeads,
      todayLeads,

      callsToday,
      meetingsScheduledToday,
      meetingsCompletedToday,
      convertedToMeetingToday,

      lowPotential,
      mediumPotential,
      highPotential,
    });
  }

  return result;
}

async getTelecallingAssistantAnalytics() {
  const { start, end } = this.getTodayIndiaRange();

  const users = await this.userRepository.find();

  const assistants = users.filter(
    (u: any) =>
      Array.isArray(u.roles) &&
      u.roles.includes(UserRole.TELECALLING_ASSISTANT),
  );

  const result: any[] = [];

  for (const assistant of assistants) {
    const reviewedToday = await this.callLogRepository.count({
      where: {
        reviewAssignedTo: assistant.id,
        createdAt: Between(start, end),
      },
    });

    const convertedToday = await this.callLogRepository.count({
      where: {
        reviewAssignedTo: assistant.id,
        reviewStatus: CallReviewStatus.CONVERTED,
        createdAt: Between(start, end),
      },
    });

    const lowPotentialConverted = await this.leadRepository.count({
  where: {
    createdBy: assistant.id,
    potential: LeadPotential.LOW,
    createdAt: Between(start, end),
  },
});

const mediumPotentialConverted = await this.leadRepository.count({
  where: {
    createdBy: assistant.id,
    potential: LeadPotential.MEDIUM,
    createdAt: Between(start, end),
  },
});

const highPotentialConverted = await this.leadRepository.count({
  where: {
    createdBy: assistant.id,
    potential: LeadPotential.HIGH,
    createdAt: Between(start, end),
  },
});

    const leadsCreatedToday = await this.leadRepository.count({
      where: {
        createdBy: assistant.id,
        createdAt: Between(start, end),
      },
    });

    const meetingsScheduledToday = await this.meetingRepository.count({
  where: {
    createdBy: assistant.id,
    updatedAt: Between(start, end),
  },
});

    result.push({
      assistantId: assistant.id,
      assistantName: assistant.name,

      reviewedToday,
      convertedToday,
      leadsCreatedToday,
      meetingsScheduledToday,

      lowPotentialConverted,
      mediumPotentialConverted,
      highPotentialConverted,
    });
  }

  return result;
}

async getOwnerSummary() {
  const nowMs = Date.now();

if (this.ownerSummaryCache && nowMs - this.ownerSummaryCacheAt < 30000) {
  return this.ownerSummaryCache;
}
  // TODAY RANGE
  const now = new Date();

const indiaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(now);

const start = new Date(`${indiaDate}T00:00:00+05:30`);
const end = new Date(`${indiaDate}T23:59:59.999+05:30`);

  // CALLS TODAY
  const callsToday = await this.callLogRepository
    .createQueryBuilder('call')
    .where('call.createdAt BETWEEN :start AND :end', { start, end })
    .andWhere(`UPPER(COALESCE(call.callStatus, '')) <> 'INITIATED'`)
    .getCount();

  // INTERESTED TODAY
  const interestedToday = await this.callLogRepository
    .createQueryBuilder('call')
    .where('call.createdAt BETWEEN :start AND :end', { start, end })
    .andWhere(`call.callStatus = 'INTERESTED'`)
    .getCount();

  // LEADS TODAY
  const leadsToday = await this.leadRepository
    .createQueryBuilder('lead')
    .where('lead.createdAt BETWEEN :start AND :end', { start, end })
    .getCount();

  // MEETINGS TODAY
  const meetingsToday = await this.meetingRepository
    .createQueryBuilder('meeting')
    .where('meeting.scheduledAt BETWEEN :start AND :end', { start, end })
    .getCount();

  // SITE VISITS TODAY
const siteVisitsToday = await this.meetingRepository
  .createQueryBuilder('meeting')
  .where('meeting.updatedAt BETWEEN :start AND :end', { start, end })
  .andWhere('meeting.meetingType = :type', {
    type: MeetingType.SITE_VISIT,
  })
  .getCount();

  // TOTAL MEETINGS
  const totalMeetings = await this.meetingRepository.count();

  const result = {
  callsToday,
  interestedToday,
  leadsToday,
  meetingsToday,
  siteVisitsToday,
  totalMeetings,
};

this.ownerSummaryCache = result;
this.ownerSummaryCacheAt = Date.now();

return result;
}

}