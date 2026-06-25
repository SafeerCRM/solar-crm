import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between } from 'typeorm';

import { User, UserRole } from '../users/user.entity';
import { Lead, LeadPotential, LeadStatus } from '../leads/lead.entity';
import { CallLog, CallReviewStatus } from '../telecalling/call-log.entity';
import { TelecallingContact } from '../telecalling/telecalling-contact.entity';
import { Meeting, MeetingCategory, MeetingStatus, MeetingType } from '../meeting/meeting.entity';
import { Project, ProjectStatus, ProjectType } from '../project/project.entity';
import { ProjectPaymentInstallment } from '../project/project-payment-installment.entity';

type AnalyticsFilters = {
  month?: string;
  fromDate?: string;
  toDate?: string;
  userId?: string;
  branchName?: string;
  city?: string;
  zone?: string;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,

    @InjectRepository(CallLog)
    private readonly callLogRepository: Repository<CallLog>,

    @InjectRepository(TelecallingContact)
    private readonly contactRepository: Repository<TelecallingContact>,

    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProjectPaymentInstallment)
    private readonly paymentRepository: Repository<ProjectPaymentInstallment>,
  ) {}

  private getUserRoles(user?: any): string[] {
    if (Array.isArray(user?.roles)) return user.roles;
    if (user?.role) return [user.role];
    return [];
  }

  private canViewAll(user?: any): boolean {
    const roles = this.getUserRoles(user);

    return [
      UserRole.OWNER,
      UserRole.MARKETING_HEAD,
      UserRole.TELECALLING_MANAGER,
      UserRole.LEAD_MANAGER,
      UserRole.MEETING_MANAGER,
      UserRole.PROJECT_MANAGER,
      UserRole.PAYMENT_MANAGER,
      UserRole.ACCOUNT_MANAGER,
      UserRole.HR_MANAGER,
    ].some((role) => roles.includes(role));
  }

  private getEffectiveUserId(query: AnalyticsFilters, user: any): number | undefined {
    if (!this.canViewAll(user)) {
      return Number(user?.id || user?.userId);
    }

    return query.userId ? Number(query.userId) : undefined;
  }

  private getDateRange(query: AnalyticsFilters) {
    if (query.month) {
      const [year, month] = String(query.month).split('-').map(Number);

      if (year && month) {
        return {
          start: new Date(year, month - 1, 1, 0, 0, 0, 0),
          end: new Date(year, month, 0, 23, 59, 59, 999),
        };
      }
    }

    if (query.fromDate || query.toDate) {
      return {
        start: query.fromDate
          ? new Date(`${query.fromDate}T00:00:00`)
          : new Date('2000-01-01T00:00:00'),
        end: query.toDate
          ? new Date(`${query.toDate}T23:59:59.999`)
          : new Date(),
      };
    }

    const now = new Date();

    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  private normalize(value?: string) {
    return String(value || '').trim().toLowerCase();
  }

  private applyContactFilters(
    qb: SelectQueryBuilder<TelecallingContact>,
    query: AnalyticsFilters,
    user: any,
  ) {
    const { start, end } = this.getDateRange(query);
    const effectiveUserId = this.getEffectiveUserId(query, user);

    qb.andWhere('contact.createdAt BETWEEN :start AND :end', { start, end });

    if (effectiveUserId) {
      qb.andWhere('contact.assignedTo = :effectiveUserId', { effectiveUserId });
    }

    const city = this.normalize(query.city);
    if (city) {
      qb.andWhere(
        `(LOWER(COALESCE(contact.city, '')) LIKE :city
          OR LOWER(COALESCE(contact.address, '')) LIKE :city
          OR LOWER(COALESCE(contact.location, '')) LIKE :city)`,
        { city: `%${city}%` },
      );
    }

    const zone = this.normalize(query.zone);
    if (zone) {
      qb.andWhere('LOWER(COALESCE(contact.zone, \'\')) LIKE :zone', {
        zone: `%${zone}%`,
      });
    }

    return qb;
  }

  private applyCallFilters(
    qb: SelectQueryBuilder<CallLog>,
    query: AnalyticsFilters,
    user: any,
  ) {
    const { start, end } = this.getDateRange(query);
    const effectiveUserId = this.getEffectiveUserId(query, user);

    qb.andWhere('call.createdAt BETWEEN :start AND :end', { start, end });

    if (effectiveUserId) {
      qb.andWhere(
        `(call.telecallerId = :effectiveUserId OR call.reviewAssignedTo = :effectiveUserId)`,
        { effectiveUserId },
      );
    }

    return qb;
  }

  private applyProjectFilters(
    qb: SelectQueryBuilder<Project>,
    query: AnalyticsFilters,
    user: any,
  ) {
    const { start, end } = this.getDateRange(query);
    const effectiveUserId = this.getEffectiveUserId(query, user);

    qb.andWhere('project.isHidden = false');
    qb.andWhere('project.createdAt BETWEEN :start AND :end', { start, end });

    if (effectiveUserId) {
      qb.andWhere(
        `(project.projectOwnerId = :effectiveUserId OR project.createdBy = :effectiveUserId)`,
        { effectiveUserId },
      );
    }

    const branchName = this.normalize(query.branchName);
    if (branchName) {
      qb.andWhere('LOWER(COALESCE(project.branchName, \'\')) LIKE :branchName', {
        branchName: `%${branchName}%`,
      });
    }

    const city = this.normalize(query.city);
    if (city) {
      qb.andWhere('LOWER(COALESCE(project.city, \'\')) LIKE :city', {
        city: `%${city}%`,
      });
    }

    const zone = this.normalize(query.zone);
    if (zone) {
      qb.andWhere('LOWER(COALESCE(project.zone, \'\')) LIKE :zone', {
        zone: `%${zone}%`,
      });
    }

    return qb;
  }

  private applyPaymentFilters(
    qb: SelectQueryBuilder<ProjectPaymentInstallment>,
    query: AnalyticsFilters,
    user: any,
  ) {
    const { start, end } = this.getDateRange(query);
    const effectiveUserId = this.getEffectiveUserId(query, user);

    qb.andWhere('payment.isHidden = false');
    qb.andWhere('payment.createdAt BETWEEN :start AND :end', { start, end });

    if (effectiveUserId) {
      qb.andWhere(
        `(payment.collectedBy = :effectiveUserId OR payment.createdBy = :effectiveUserId)`,
        { effectiveUserId },
      );
    }

    return qb;
  }

    private async getDailyTrend(
    tableName: string,
    dateColumn: string,
    start: Date,
    end: Date,
    extraWhere = '1=1',
    params: Record<string, any> = {},
  ) {
    const raw = await this.userRepository.query(
      `
      SELECT TO_CHAR("${dateColumn}", 'YYYY-MM-DD') AS label, COUNT(*)::int AS value
      FROM ${tableName}
      WHERE "${dateColumn}" BETWEEN $1 AND $2
      AND ${extraWhere}
      GROUP BY TO_CHAR("${dateColumn}", 'YYYY-MM-DD')
      ORDER BY label ASC
      `,
      [start, end, ...Object.values(params)],
    );

    return raw.map((item: any) => ({
      label: item.label,
      value: Number(item.value || 0),
    }));
  }

  private async getPaymentDailyTrend(start: Date, end: Date) {
    const raw = await this.paymentRepository.query(
      `
      SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') AS label,
      COALESCE(SUM("paidAmount"), 0)::numeric AS value
      FROM project_payment_installments
      WHERE "createdAt" BETWEEN $1 AND $2
      AND "isHidden" = false
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY label ASC
      `,
      [start, end],
    );

    return raw.map((item: any) => ({
      label: item.label,
      value: Number(item.value || 0),
    }));
  }

  async getOverview(query: AnalyticsFilters, user: any) {
    const contactsQb = this.contactRepository.createQueryBuilder('contact').where('1=1');
    this.applyContactFilters(contactsQb, query, user);

    const callsQb = this.callLogRepository.createQueryBuilder('call').where('1=1');
    this.applyCallFilters(callsQb, query, user);

    const leadsQb = this.leadRepository.createQueryBuilder('lead').where('1=1');
    const { start, end } = this.getDateRange(query);
    leadsQb.andWhere('lead.createdAt BETWEEN :start AND :end', { start, end });

    const meetingsQb = this.meetingRepository.createQueryBuilder('meeting').where('1=1');
    meetingsQb.andWhere('meeting.createdAt BETWEEN :start AND :end', { start, end });

    const projectsQb = this.projectRepository.createQueryBuilder('project').where('1=1');
    this.applyProjectFilters(projectsQb, query, user);

    const paymentsQb = this.paymentRepository.createQueryBuilder('payment').where('1=1');
    this.applyPaymentFilters(paymentsQb, query, user);

        const trendRange = this.getDateRange(query);

    const [
      totalContacts,
      totalCalls,
      totalLeads,
      totalMeetings,
      totalProjects,
      paymentRaw,
    ] = await Promise.all([
      contactsQb.getCount(),
      callsQb.getCount(),
      leadsQb.getCount(),
      meetingsQb.getCount(),
      projectsQb.getCount(),
      paymentsQb
        .select('COALESCE(SUM(payment.amount), 0)', 'totalAmount')
        .addSelect('COALESCE(SUM(payment.paidAmount), 0)', 'paidAmount')
        .addSelect('COALESCE(SUM(payment.pendingAmount), 0)', 'pendingAmount')
        .getRawOne(),
    ]);

    return {
      period: this.getDateRange(query),
      cards: {
        totalContacts,
        totalCalls,
        totalLeads,
        totalMeetings,
        totalProjects,
        totalPaymentAmount: Number(paymentRaw?.totalAmount || 0),
        totalCollectedAmount: Number(paymentRaw?.paidAmount || 0),
        totalPendingAmount: Number(paymentRaw?.pendingAmount || 0),
      },

            trends: {
        contacts: await this.getDailyTrend(
          'telecalling_contact',
          'createdAt',
          trendRange.start,
          trendRange.end,
        ),
        calls: await this.getDailyTrend(
          'call_log',
          'createdAt',
          trendRange.start,
          trendRange.end,
        ),
        leads: await this.getDailyTrend(
          'lead',
          'createdAt',
          trendRange.start,
          trendRange.end,
        ),
        meetings: await this.getDailyTrend(
          'meetings',
          'createdAt',
          trendRange.start,
          trendRange.end,
        ),
        projects: await this.getDailyTrend(
          'project',
          'createdAt',
          trendRange.start,
          trendRange.end,
          `"isHidden" = false`,
        ),
        payments: await this.getPaymentDailyTrend(
          trendRange.start,
          trendRange.end,
        ),
      },
    };
  }

  async getTelecalling(query: AnalyticsFilters, user: any) {
    const callsBaseQb = this.callLogRepository.createQueryBuilder('call').where('1=1');
    this.applyCallFilters(callsBaseQb, query, user);

    const callsByStatus = await callsBaseQb
      .clone()
      .select('COALESCE(call.callStatus, \'UNKNOWN\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('call.callStatus')
      .orderBy('value', 'DESC')
      .getRawMany();

    const reviewsByStatus = await callsBaseQb
      .clone()
      .select('COALESCE(call.reviewStatus, \'UNKNOWN\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('call.reviewStatus')
      .orderBy('value', 'DESC')
      .getRawMany();

    const userWise = await callsBaseQb
      .clone()
      .select('call.telecallerId', 'userId')
      .addSelect('COUNT(*)', 'totalCalls')
      .addSelect(
        `SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'CONNECTED' THEN 1 ELSE 0 END)`,
        'connectedCalls',
      )
      .addSelect(
        `SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'CNR' THEN 1 ELSE 0 END)`,
        'cnrCalls',
      )
      .addSelect(
        `SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'CALLBACK' THEN 1 ELSE 0 END)`,
        'callbackCalls',
      )
      .addSelect(
        `SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'INTERESTED' THEN 1 ELSE 0 END)`,
        'interestedCalls',
      )
      .where('call.telecallerId IS NOT NULL')
      .groupBy('call.telecallerId')
      .orderBy('COUNT(*)', 'DESC')
      .limit(50)
      .getRawMany();

      const telecallerLeaderboard = await callsBaseQb
  .clone()
  .select('call.telecallerId', 'userId')
  .addSelect('COUNT(*)', 'totalCalls')
  .addSelect(
    `SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'INTERESTED' THEN 1 ELSE 0 END)`,
    'interestedCalls',
  )
  .addSelect(
    `SUM(CASE WHEN call.reviewStatus = :converted THEN 1 ELSE 0 END)`,
    'convertedCalls',
  )
  .setParameter('converted', CallReviewStatus.CONVERTED)
  .where('call.telecallerId IS NOT NULL')
  .groupBy('call.telecallerId')
  .orderBy('COUNT(*)', 'DESC')
  .limit(20)
  .getRawMany();

    return {
      callsByStatus: callsByStatus.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      reviewsByStatus: reviewsByStatus.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      userWise: userWise.map((row) => ({
        userId: Number(row.userId),
        totalCalls: Number(row.totalCalls || 0),
        connectedCalls: Number(row.connectedCalls || 0),
        cnrCalls: Number(row.cnrCalls || 0),
        callbackCalls: Number(row.callbackCalls || 0),
        interestedCalls: Number(row.interestedCalls || 0),
      })),
      leaderboard: telecallerLeaderboard.map((row) => ({
  userId: row.userId ? Number(row.userId) : null,
  totalCalls: Number(row.totalCalls || 0),
  interestedCalls: Number(row.interestedCalls || 0),
  convertedCalls: Number(row.convertedCalls || 0),
})),
    };
  }

  async getProjects(query: AnalyticsFilters, user: any) {
    const baseQb = this.projectRepository.createQueryBuilder('project').where('1=1');
    this.applyProjectFilters(baseQb, query, user);

    const byType = await baseQb
      .clone()
      .select('COALESCE(project.projectType, \'UNKNOWN\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('project.projectType')
      .orderBy('value', 'DESC')
      .getRawMany();

    const byStatus = await baseQb
      .clone()
      .select('COALESCE(project.status, \'UNKNOWN\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('project.status')
      .orderBy('value', 'DESC')
      .getRawMany();

    const cashProjects = await baseQb
      .clone()
      .andWhere('project.projectType = :type', { type: ProjectType.CASH })
      .getCount();

    const loanProjects = await baseQb
      .clone()
      .andWhere('project.projectType = :type', { type: ProjectType.LOAN })
      .getCount();

    const cashCancelledRejected = await baseQb
      .clone()
      .andWhere('project.projectType = :type', { type: ProjectType.CASH })
      .andWhere('project.status IN (:...statuses)', {
        statuses: [ProjectStatus.CANCELLED, ProjectStatus.REJECTED],
      })
      .getCount();

    const loanCancelledRejected = await baseQb
      .clone()
      .andWhere('project.projectType = :type', { type: ProjectType.LOAN })
      .andWhere('project.status IN (:...statuses)', {
        statuses: [ProjectStatus.CANCELLED, ProjectStatus.REJECTED],
      })
      .getCount();

      const branchWise = await baseQb
  .clone()
  .select('COALESCE(project.branchName, \'Unassigned Branch\')', 'label')
  .addSelect('COUNT(*)', 'projects')
  .addSelect('COALESCE(SUM(project.finalCost), 0)', 'value')
  .groupBy('project.branchName')
  .orderBy('projects', 'DESC')
  .limit(30)
  .getRawMany();

const cityWise = await baseQb
  .clone()
  .select('COALESCE(project.city, \'Unknown City\')', 'label')
  .addSelect('COUNT(*)', 'projects')
  .addSelect('COALESCE(SUM(project.finalCost), 0)', 'value')
  .groupBy('project.city')
  .orderBy('projects', 'DESC')
  .limit(30)
  .getRawMany();

const projectValueByType = await baseQb
  .clone()
  .select('COALESCE(project.projectType, \'UNKNOWN\')', 'label')
  .addSelect('COALESCE(SUM(project.finalCost), 0)', 'value')
  .groupBy('project.projectType')
  .orderBy('value', 'DESC')
  .getRawMany();

const projectValueByStatus = await baseQb
  .clone()
  .select('COALESCE(project.status, \'UNKNOWN\')', 'label')
  .addSelect('COALESCE(SUM(project.finalCost), 0)', 'value')
  .groupBy('project.status')
  .orderBy('value', 'DESC')
  .getRawMany();

    return {
      cards: {
        cashProjects,
        loanProjects,
        cashCancelledRejected,
        loanCancelledRejected,
      },
      byType: byType.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      byStatus: byStatus.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      branchWise: branchWise.map((row) => ({
  label: row.label,
  projects: Number(row.projects || 0),
  value: Number(row.value || 0),
})),

cityWise: cityWise.map((row) => ({
  label: row.label,
  projects: Number(row.projects || 0),
  value: Number(row.value || 0),
})),

projectValueByType: projectValueByType.map((row) => ({
  label: row.label,
  value: Number(row.value || 0),
})),

projectValueByStatus: projectValueByStatus.map((row) => ({
  label: row.label,
  value: Number(row.value || 0),
})),
    };
  }

  async getPayments(query: AnalyticsFilters, user: any) {
    const baseQb = this.paymentRepository.createQueryBuilder('payment').where('1=1');
    this.applyPaymentFilters(baseQb, query, user);

    const summary = await baseQb
      .clone()
      .select('COALESCE(SUM(payment.amount), 0)', 'totalAmount')
      .addSelect('COALESCE(SUM(payment.paidAmount), 0)', 'paidAmount')
      .addSelect('COALESCE(SUM(payment.pendingAmount), 0)', 'pendingAmount')
      .getRawOne();

    const byStatus = await baseQb
      .clone()
      .select('COALESCE(payment.status, \'UNKNOWN\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('payment.status')
      .orderBy('value', 'DESC')
      .getRawMany();

    const collectorWise = await baseQb
      .clone()
      .select('payment.collectedBy', 'userId')
      .addSelect('COALESCE(payment.collectedByName, \'Unassigned\')', 'name')
      .addSelect('COALESCE(SUM(payment.paidAmount), 0)', 'paidAmount')
      .addSelect('COALESCE(SUM(payment.pendingAmount), 0)', 'pendingAmount')
      .where('payment.collectedBy IS NOT NULL')
      .groupBy('payment.collectedBy')
      .addGroupBy('payment.collectedByName')
      .orderBy('paidAmount', 'DESC')
      .limit(50)
      .getRawMany();

    const totalAmount = Number(summary?.totalAmount || 0);
    const paidAmount = Number(summary?.paidAmount || 0);

    const paymentValueByStatus = await baseQb
  .clone()
  .select('COALESCE(payment.status, \'UNKNOWN\')', 'label')
  .addSelect('COALESCE(SUM(payment.paidAmount), 0)', 'paidAmount')
  .addSelect('COALESCE(SUM(payment.pendingAmount), 0)', 'pendingAmount')
  .groupBy('payment.status')
  .orderBy('paidAmount', 'DESC')
  .getRawMany();

    return {
      cards: {
        totalAmount,
        paidAmount,
        pendingAmount: Number(summary?.pendingAmount || 0),
        collectionPercent:
          totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
      },
      byStatus: byStatus.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      collectorWise: collectorWise.map((row) => ({
        userId: row.userId ? Number(row.userId) : null,
        name: row.name,
        paidAmount: Number(row.paidAmount || 0),
        pendingAmount: Number(row.pendingAmount || 0),
      })),
      paymentValueByStatus: paymentValueByStatus.map((row) => ({
  label: row.label,
  paidAmount: Number(row.paidAmount || 0),
  pendingAmount: Number(row.pendingAmount || 0),
})),
    };
  }

    private applyLeadAnalyticsFilters(
    qb: SelectQueryBuilder<Lead>,
    query: AnalyticsFilters,
    user: any,
  ) {
    const { start, end } = this.getDateRange(query);
    const effectiveUserId = this.getEffectiveUserId(query, user);

    qb.andWhere('lead.createdAt BETWEEN :start AND :end', { start, end });

    if (effectiveUserId) {
      qb.andWhere(
        `(lead.assignedTo = :effectiveUserId OR lead.createdBy = :effectiveUserId OR lead.originTelecallerId = :effectiveUserId)`,
        { effectiveUserId },
      );
    }

    const city = this.normalize(query.city);
    if (city) {
      qb.andWhere(
        `(LOWER(COALESCE(lead.city, '')) LIKE :city OR LOWER(COALESCE(lead.address, '')) LIKE :city)`,
        { city: `%${city}%` },
      );
    }

    const zone = this.normalize(query.zone);
    if (zone) {
      qb.andWhere('LOWER(COALESCE(lead.zone, \'\')) LIKE :zone', {
        zone: `%${zone}%`,
      });
    }

    return qb;
  }

  private applyMeetingAnalyticsFilters(
    qb: SelectQueryBuilder<Meeting>,
    query: AnalyticsFilters,
    user: any,
  ) {
    const { start, end } = this.getDateRange(query);
    const effectiveUserId = this.getEffectiveUserId(query, user);

    qb.andWhere('meeting.createdAt BETWEEN :start AND :end', { start, end });

    if (effectiveUserId) {
      qb.andWhere(
        `(meeting.assignedTo = :effectiveUserId OR meeting.createdBy = :effectiveUserId OR meeting.updatedBy = :effectiveUserId)`,
        { effectiveUserId },
      );
    }

    return qb;
  }

  async getLeads(query: AnalyticsFilters, user: any) {
    const baseQb = this.leadRepository.createQueryBuilder('lead').where('1=1');
    this.applyLeadAnalyticsFilters(baseQb, query, user);

    const byStatus = await baseQb
      .clone()
      .select('COALESCE(lead.status, \'UNKNOWN\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('lead.status')
      .orderBy('value', 'DESC')
      .getRawMany();

    const byPotential = await baseQb
      .clone()
      .select('COALESCE(lead.potential, \'UNKNOWN\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('lead.potential')
      .orderBy('value', 'DESC')
      .getRawMany();

    const userWise = await baseQb
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
      .where('lead.assignedTo IS NOT NULL')
      .groupBy('lead.assignedTo')
      .orderBy('COUNT(*)', 'DESC')
      .limit(50)
      .getRawMany();

    const cards = {
      totalLeads: await baseQb.clone().getCount(),
      newLeads: await baseQb.clone().andWhere('lead.status = :status', { status: LeadStatus.NEW }).getCount(),
      interestedLeads: await baseQb.clone().andWhere('lead.status = :status', { status: LeadStatus.INTERESTED }).getCount(),
      wonLeads: await baseQb.clone().andWhere('lead.status = :status', { status: LeadStatus.WON }).getCount(),
      lostLeads: await baseQb.clone().andWhere('lead.status = :status', { status: LeadStatus.LOST }).getCount(),
      highPotential: await baseQb.clone().andWhere('lead.potential = :potential', { potential: LeadPotential.HIGH }).getCount(),
      mediumPotential: await baseQb.clone().andWhere('lead.potential = :potential', { potential: LeadPotential.MEDIUM }).getCount(),
      lowPotential: await baseQb.clone().andWhere('lead.potential = :potential', { potential: LeadPotential.LOW }).getCount(),
    };

    return {
      cards,
      byStatus: byStatus.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      byPotential: byPotential.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      userWise: userWise.map((row) => ({
        userId: row.userId ? Number(row.userId) : null,
        totalLeads: Number(row.totalLeads || 0),
        highPotential: Number(row.highPotential || 0),
        mediumPotential: Number(row.mediumPotential || 0),
        lowPotential: Number(row.lowPotential || 0),
      })),
    };
  }

  async getMeetings(query: AnalyticsFilters, user: any) {
    const baseQb = this.meetingRepository.createQueryBuilder('meeting').where('1=1');
    this.applyMeetingAnalyticsFilters(baseQb, query, user);

    const byStatus = await baseQb
      .clone()
      .select('COALESCE(meeting.status, \'UNKNOWN\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('meeting.status')
      .orderBy('value', 'DESC')
      .getRawMany();

    const byType = await baseQb
      .clone()
      .select('COALESCE(meeting.meetingType, \'UNKNOWN\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('meeting.meetingType')
      .orderBy('value', 'DESC')
      .getRawMany();

    const byCategory = await baseQb
      .clone()
      .select('COALESCE(meeting.meetingCategory, \'UNKNOWN\')', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('meeting.meetingCategory')
      .orderBy('value', 'DESC')
      .getRawMany();

    const managerWise = await baseQb
      .clone()
      .select('meeting.assignedTo', 'userId')
      .addSelect('COALESCE(meeting.assignedToName, \'Unassigned\')', 'name')
      .addSelect('COUNT(*)', 'totalMeetings')
      .addSelect(
        `SUM(CASE WHEN meeting.status = :completed THEN 1 ELSE 0 END)`,
        'completedMeetings',
      )
      .addSelect(
        `SUM(CASE WHEN meeting.status = :converted THEN 1 ELSE 0 END)`,
        'convertedMeetings',
      )
      .setParameters({
        completed: MeetingStatus.COMPLETED,
        converted: MeetingStatus.CONVERTED_TO_PROJECT,
      })
      .where('meeting.assignedTo IS NOT NULL')
      .groupBy('meeting.assignedTo')
      .addGroupBy('meeting.assignedToName')
      .orderBy('COUNT(*)', 'DESC')
      .limit(50)
      .getRawMany();

    const cards = {
      totalMeetings: await baseQb.clone().getCount(),
      scheduled: await baseQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.SCHEDULED }).getCount(),
      completed: await baseQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.COMPLETED }).getCount(),
      rescheduled: await baseQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.RESCHEDULED }).getCount(),
      cancelled: await baseQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.CANCELLED }).getCount(),
      onHold: await baseQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.ON_HOLD }).getCount(),
      noShow: await baseQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.NO_SHOW }).getCount(),
      cnr: await baseQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.CNR }).getCount(),
      convertedToProject: await baseQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.CONVERTED_TO_PROJECT }).getCount(),
      siteVisits: await baseQb.clone().andWhere('meeting.meetingType = :type', { type: MeetingType.SITE_VISIT }).getCount(),
      companyMeetings: await baseQb.clone().andWhere('meeting.meetingCategory = :category', { category: MeetingCategory.COMPANY_MEETING }).getCount(),
      selfMeetings: await baseQb.clone().andWhere('meeting.meetingCategory = :category', { category: MeetingCategory.SELF_MEETING }).getCount(),
      solarMiterMeetings: await baseQb.clone().andWhere('meeting.meetingCategory = :category', { category: MeetingCategory.SOLARMITER }).getCount(),
    };

    return {
      cards,
      byStatus: byStatus.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      byType: byType.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      byCategory: byCategory.map((row) => ({
        label: row.label,
        value: Number(row.value || 0),
      })),
      managerWise: managerWise.map((row) => ({
        userId: row.userId ? Number(row.userId) : null,
        name: row.name,
        totalMeetings: Number(row.totalMeetings || 0),
        completedMeetings: Number(row.completedMeetings || 0),
        convertedMeetings: Number(row.convertedMeetings || 0),
      })),
    };
  }

  async getTelecallingAssistant(query: AnalyticsFilters, user: any) {
    const baseQb = this.callLogRepository.createQueryBuilder('call').where('1=1');
    this.applyCallFilters(baseQb, query, user);

    const assistantWise = await baseQb
      .clone()
      .select('call.reviewAssignedTo', 'assistantId')
      .addSelect('COALESCE(call.reviewAssignedToName, \'Unassigned\')', 'assistantName')
      .addSelect('COUNT(*)', 'assignedReviews')
      .addSelect(
        `SUM(CASE WHEN call.reviewStatus != :pending THEN 1 ELSE 0 END)`,
        'reviewed',
      )
      .addSelect(
        `SUM(CASE WHEN call.reviewStatus = :pending THEN 1 ELSE 0 END)`,
        'pending',
      )
      .addSelect(
        `SUM(CASE WHEN call.reviewStatus = :potential THEN 1 ELSE 0 END)`,
        'potential',
      )
      .addSelect(
        `SUM(CASE WHEN call.reviewStatus = :converted THEN 1 ELSE 0 END)`,
        'converted',
      )
      .addSelect(
        `SUM(CASE WHEN call.reviewStatus = :rejected THEN 1 ELSE 0 END)`,
        'rejected',
      )
      .setParameters({
        pending: CallReviewStatus.PENDING,
        potential: CallReviewStatus.POTENTIAL,
        converted: CallReviewStatus.CONVERTED,
        rejected: CallReviewStatus.REJECTED,
      })
      .where('call.reviewAssignedTo IS NOT NULL')
      .groupBy('call.reviewAssignedTo')
      .addGroupBy('call.reviewAssignedToName')
      .orderBy('COUNT(*)', 'DESC')
      .limit(50)
      .getRawMany();

    const cards = {
      assignedReviews: await baseQb.clone().andWhere('call.reviewAssignedTo IS NOT NULL').getCount(),
      pendingReviews: await baseQb.clone().andWhere('call.reviewStatus = :status', { status: CallReviewStatus.PENDING }).getCount(),
      potentialReviews: await baseQb.clone().andWhere('call.reviewStatus = :status', { status: CallReviewStatus.POTENTIAL }).getCount(),
      convertedReviews: await baseQb.clone().andWhere('call.reviewStatus = :status', { status: CallReviewStatus.CONVERTED }).getCount(),
      rejectedReviews: await baseQb.clone().andWhere('call.reviewStatus = :status', { status: CallReviewStatus.REJECTED }).getCount(),
    };

    return {
      cards,
      assistantWise: assistantWise.map((row) => ({
        assistantId: row.assistantId ? Number(row.assistantId) : null,
        assistantName: row.assistantName,
        assignedReviews: Number(row.assignedReviews || 0),
        reviewed: Number(row.reviewed || 0),
        pending: Number(row.pending || 0),
        potential: Number(row.potential || 0),
        converted: Number(row.converted || 0),
        rejected: Number(row.rejected || 0),
      })),
    };
  }

  async getConversions(query: AnalyticsFilters, user: any) {
    const { start, end } = this.getDateRange(query);

    const contactsQb = this.contactRepository.createQueryBuilder('contact').where('1=1');
    this.applyContactFilters(contactsQb, query, user);

    const callsQb = this.callLogRepository.createQueryBuilder('call').where('1=1');
    this.applyCallFilters(callsQb, query, user);

    const leadsQb = this.leadRepository.createQueryBuilder('lead').where('1=1');
    this.applyLeadAnalyticsFilters(leadsQb, query, user);

    const meetingsQb = this.meetingRepository.createQueryBuilder('meeting').where('1=1');
    this.applyMeetingAnalyticsFilters(meetingsQb, query, user);

    const projectsQb = this.projectRepository.createQueryBuilder('project').where('1=1');
    this.applyProjectFilters(projectsQb, query, user);

    const paymentsQb = this.paymentRepository.createQueryBuilder('payment').where('1=1');
    this.applyPaymentFilters(paymentsQb, query, user);

    const [
      contacts,
      calls,
      interestedCalls,
      leads,
      meetings,
      projects,
      paymentRaw,
    ] = await Promise.all([
      contactsQb.getCount(),
      callsQb.getCount(),
      callsQb.clone().andWhere('UPPER(COALESCE(call.callStatus, \'\')) = :status', { status: 'INTERESTED' }).getCount(),
      leadsQb.getCount(),
      meetingsQb.getCount(),
      projectsQb.getCount(),
      paymentsQb
        .select('COALESCE(SUM(payment.paidAmount), 0)', 'paidAmount')
        .getRawOne(),
    ]);

    const percent = (current: number, previous: number) =>
      previous > 0 ? Math.round((current / previous) * 100) : 0;

    return {
      range: { start, end },
      funnel: [
        { label: 'Contacts', value: contacts, conversionPercent: 100 },
        { label: 'Calls', value: calls, conversionPercent: percent(calls, contacts) },
        { label: 'Interested', value: interestedCalls, conversionPercent: percent(interestedCalls, calls) },
        { label: 'Leads', value: leads, conversionPercent: percent(leads, interestedCalls || calls) },
        { label: 'Meetings', value: meetings, conversionPercent: percent(meetings, leads) },
        { label: 'Projects', value: projects, conversionPercent: percent(projects, meetings) },
        {
          label: 'Payment Collected',
          value: Number(paymentRaw?.paidAmount || 0),
          conversionPercent: 0,
        },
      ],
    };
  }

  async getActivityStream(query: AnalyticsFilters, user: any) {
    const { start, end } = this.getDateRange(query);
    const limit = Math.min(Math.max(Number((query as any).limit || 20), 1), 50);

    const callsQb = this.callLogRepository
      .createQueryBuilder('call')
      .select([
        'call.id',
        'call.callStatus',
        'call.reviewStatus',
        'call.telecallerId',
        'call.reviewAssignedTo',
        'call.createdAt',
      ])
      .where('call.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('call.createdAt', 'DESC')
      .limit(limit);

    this.applyCallFilters(callsQb, query, user);

    const leadsQb = this.leadRepository
      .createQueryBuilder('lead')
      .select(['lead.id', 'lead.name', 'lead.phone', 'lead.status', 'lead.createdAt'])
      .where('lead.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('lead.createdAt', 'DESC')
      .limit(limit);

    this.applyLeadAnalyticsFilters(leadsQb, query, user);

    const meetingsQb = this.meetingRepository
      .createQueryBuilder('meeting')
      .select(['meeting.id', 'meeting.customerName', 'meeting.status', 'meeting.createdAt'])
      .where('meeting.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('meeting.createdAt', 'DESC')
      .limit(limit);

    this.applyMeetingAnalyticsFilters(meetingsQb, query, user);

    const projectsQb = this.projectRepository
      .createQueryBuilder('project')
      .select(['project.id', 'project.customerName', 'project.status', 'project.projectType', 'project.createdAt'])
      .where('1=1')
      .orderBy('project.createdAt', 'DESC')
      .limit(limit);

    this.applyProjectFilters(projectsQb, query, user);

    const [calls, leads, meetings, projects] = await Promise.all([
      callsQb.getMany(),
      leadsQb.getMany(),
      meetingsQb.getMany(),
      projectsQb.getMany(),
    ]);

    const stream = [
      ...calls.map((item) => ({
        type: 'CALL',
        id: item.id,
        title: `Call marked ${item.callStatus || 'UNKNOWN'}`,
        subtitle: `Review: ${item.reviewStatus || '-'}`,
        createdAt: item.createdAt,
      })),
      ...leads.map((item) => ({
        type: 'LEAD',
        id: item.id,
        title: item.name || 'Lead created',
        subtitle: `${item.phone || ''} • ${item.status || '-'}`,
        createdAt: item.createdAt,
      })),
      ...meetings.map((item) => ({
        type: 'MEETING',
        id: item.id,
        title: item.customerName || 'Meeting created',
        subtitle: item.status || '-',
        createdAt: item.createdAt,
      })),
      ...projects.map((item) => ({
        type: 'PROJECT',
        id: item.id,
        title: item.customerName || 'Project created',
        subtitle: `${item.projectType || '-'} • ${item.status || '-'}`,
        createdAt: item.createdAt,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt as any).getTime() -
          new Date(a.createdAt as any).getTime(),
      )
      .slice(0, limit);

    return { stream };
  }

    async getUsers(query: AnalyticsFilters, user: any) {
    const roles = this.getUserRoles(user);
    const canViewAll = this.canViewAll(user);

    const requestedRole = String((query as any).role || '').trim();
    const effectiveUserId = this.getEffectiveUserId(query, user);

    const usersQb = this.userRepository
      .createQueryBuilder('user')
      .where('user.isHidden = false');

    if (!canViewAll && effectiveUserId) {
      usersQb.andWhere('user.id = :effectiveUserId', { effectiveUserId });
    }

    if (canViewAll && query.userId) {
      usersQb.andWhere('user.id = :userId', {
        userId: Number(query.userId),
      });
    }

    const users = await usersQb.orderBy('user.name', 'ASC').getMany();

    const filteredUsers = requestedRole
      ? users.filter((item: any) =>
          Array.isArray(item.roles) && item.roles.includes(requestedRole),
        )
      : users;

    const result: any[] = [];

    for (const item of filteredUsers.slice(0, 100)) {
      const userId = Number(item.id);

      const callsQb = this.callLogRepository
        .createQueryBuilder('call')
        .where('1=1');
      this.applyCallFilters(callsQb, { ...query, userId: String(userId) }, user);

      const leadsQb = this.leadRepository
        .createQueryBuilder('lead')
        .where('1=1');
      this.applyLeadAnalyticsFilters(
        leadsQb,
        { ...query, userId: String(userId) },
        user,
      );

      const meetingsQb = this.meetingRepository
        .createQueryBuilder('meeting')
        .where('1=1');
      this.applyMeetingAnalyticsFilters(
        meetingsQb,
        { ...query, userId: String(userId) },
        user,
      );

      const projectsQb = this.projectRepository
        .createQueryBuilder('project')
        .where('1=1');
      this.applyProjectFilters(
        projectsQb,
        { ...query, userId: String(userId) },
        user,
      );

      const paymentsQb = this.paymentRepository
        .createQueryBuilder('payment')
        .where('1=1');
      this.applyPaymentFilters(
        paymentsQb,
        { ...query, userId: String(userId) },
        user,
      );

      const [
        totalCalls,
        totalLeads,
        totalMeetings,
        totalProjects,
        paymentRaw,
      ] = await Promise.all([
        callsQb.getCount(),
        leadsQb.getCount(),
        meetingsQb.getCount(),
        projectsQb.getCount(),
        paymentsQb
          .select('COALESCE(SUM(payment.paidAmount), 0)', 'paidAmount')
          .addSelect('COALESCE(SUM(payment.pendingAmount), 0)', 'pendingAmount')
          .getRawOne(),
      ]);

      result.push({
        userId,
        name: item.name,
        email: item.email,
        roles: Array.isArray(item.roles) ? item.roles : [],
        totalCalls,
        totalLeads,
        totalMeetings,
        totalProjects,
        collectedAmount: Number(paymentRaw?.paidAmount || 0),
        pendingAmount: Number(paymentRaw?.pendingAmount || 0),
      });
    }

    return {
      canViewAll,
      currentUserRoles: roles,
      users: result,
    };
  }

    async getFilterOptions(user: any) {
    const canViewAll = this.canViewAll(user);
    const currentUserId = Number(user?.id || user?.userId);

    const usersQb = this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email', 'user.roles'])
      .where('user.isHidden = false')
      .orderBy('user.name', 'ASC');

    if (!canViewAll && currentUserId) {
      usersQb.andWhere('user.id = :currentUserId', { currentUserId });
    }

    const users = await usersQb.getMany();

    const branchesRaw = await this.projectRepository
      .createQueryBuilder('project')
      .select('DISTINCT project.branchName', 'value')
      .where('project.isHidden = false')
      .andWhere('project.branchName IS NOT NULL')
      .andWhere("TRIM(project.branchName) <> ''")
      .orderBy('project.branchName', 'ASC')
      .limit(200)
      .getRawMany();

    const citiesRaw = await this.contactRepository
      .createQueryBuilder('contact')
      .select('DISTINCT contact.city', 'value')
      .where('contact.city IS NOT NULL')
      .andWhere("TRIM(contact.city) <> ''")
      .orderBy('contact.city', 'ASC')
      .limit(300)
      .getRawMany();

    const zonesRaw = await this.contactRepository
      .createQueryBuilder('contact')
      .select('DISTINCT contact.zone', 'value')
      .where('contact.zone IS NOT NULL')
      .andWhere("TRIM(contact.zone) <> ''")
      .orderBy('contact.zone', 'ASC')
      .limit(200)
      .getRawMany();

    return {
      canViewAll,
      users: users.map((item: any) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        roles: Array.isArray(item.roles) ? item.roles : [],
      })),
      roles: Object.values(UserRole),
      branches: branchesRaw.map((item) => item.value).filter(Boolean),
      cities: citiesRaw.map((item) => item.value).filter(Boolean),
      zones: zonesRaw.map((item) => item.value).filter(Boolean),
    };
  }

    async getWorkReport(query: AnalyticsFilters, user: any) {
    const canViewAll = this.canViewAll(user);
    const effectiveUserId = this.getEffectiveUserId(query, user);
    const requestedRole = String((query as any).role || '').trim();
    const { start, end } = this.getDateRange(query);

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.isHidden = false')
      .orderBy('user.name', 'ASC')
      .getMany();

    let reportUsers = users;

    if (!canViewAll && effectiveUserId) {
      reportUsers = users.filter((item) => Number(item.id) === Number(effectiveUserId));
    }

    if (canViewAll && effectiveUserId) {
      reportUsers = users.filter((item) => Number(item.id) === Number(effectiveUserId));
    }

    if (canViewAll && requestedRole) {
      reportUsers = reportUsers.filter(
        (item: any) =>
          Array.isArray(item.roles) && item.roles.includes(requestedRole),
      );
    }

    reportUsers = reportUsers.slice(0, 100);

    const rows: any[] = [];

    for (const reportUser of reportUsers) {
      const userId = Number(reportUser.id);

      const totalContactsAssigned = await this.contactRepository.count({
        where: {
          assignedTo: userId,
          createdAt: Between(start, end),
        } as any,
      });

      const totalCalls = await this.callLogRepository
        .createQueryBuilder('call')
        .where('call.telecallerId = :userId', { userId })
        .andWhere('call.createdAt BETWEEN :start AND :end', { start, end })
        .getCount();

      const connectedCalls = await this.callLogRepository
        .createQueryBuilder('call')
        .where('call.telecallerId = :userId', { userId })
        .andWhere('call.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'CONNECTED'`)
        .getCount();

      const cnrCalls = await this.callLogRepository
        .createQueryBuilder('call')
        .where('call.telecallerId = :userId', { userId })
        .andWhere('call.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'CNR'`)
        .getCount();

      const callbackCalls = await this.callLogRepository
        .createQueryBuilder('call')
        .where('call.telecallerId = :userId', { userId })
        .andWhere('call.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'CALLBACK'`)
        .getCount();

      const interestedCalls = await this.callLogRepository
        .createQueryBuilder('call')
        .where('call.telecallerId = :userId', { userId })
        .andWhere('call.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'INTERESTED'`)
        .getCount();

      const reviewsAssigned = await this.callLogRepository
        .createQueryBuilder('call')
        .where('call.reviewAssignedTo = :userId', { userId })
        .andWhere('call.createdAt BETWEEN :start AND :end', { start, end })
        .getCount();

      const reviewsConverted = await this.callLogRepository
        .createQueryBuilder('call')
        .where('call.reviewAssignedTo = :userId', { userId })
        .andWhere('call.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('call.reviewStatus = :status', {
          status: CallReviewStatus.CONVERTED,
        })
        .getCount();

      const reviewsPending = await this.callLogRepository
        .createQueryBuilder('call')
        .where('call.reviewAssignedTo = :userId', { userId })
        .andWhere('call.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('call.reviewStatus = :status', {
          status: CallReviewStatus.PENDING,
        })
        .getCount();

      const leadsCreated = await this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.createdBy = :userId', { userId })
        .andWhere('lead.createdAt BETWEEN :start AND :end', { start, end })
        .getCount();

      const leadsAssigned = await this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.assignedTo = :userId', { userId })
        .andWhere('lead.createdAt BETWEEN :start AND :end', { start, end })
        .getCount();

      const leadsOriginated = await this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.originTelecallerId = :userId', { userId })
        .andWhere('lead.createdAt BETWEEN :start AND :end', { start, end })
        .getCount();

      const highPotentialLeads = await this.leadRepository
        .createQueryBuilder('lead')
        .where(
          '(lead.createdBy = :userId OR lead.assignedTo = :userId OR lead.originTelecallerId = :userId)',
          { userId },
        )
        .andWhere('lead.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('lead.potential = :potential', {
          potential: LeadPotential.HIGH,
        })
        .getCount();

      const meetingsCreated = await this.meetingRepository
        .createQueryBuilder('meeting')
        .where('meeting.createdBy = :userId', { userId })
        .andWhere('meeting.createdAt BETWEEN :start AND :end', { start, end })
        .getCount();

      const meetingsAssigned = await this.meetingRepository
        .createQueryBuilder('meeting')
        .where('meeting.assignedTo = :userId', { userId })
        .andWhere('meeting.createdAt BETWEEN :start AND :end', { start, end })
        .getCount();

      const meetingsCompleted = await this.meetingRepository
        .createQueryBuilder('meeting')
        .where('(meeting.assignedTo = :userId OR meeting.updatedBy = :userId)', {
          userId,
        })
        .andWhere('meeting.updatedAt BETWEEN :start AND :end', { start, end })
        .andWhere('meeting.status = :status', {
          status: MeetingStatus.COMPLETED,
        })
        .getCount();

      const meetingsConverted = await this.meetingRepository
        .createQueryBuilder('meeting')
        .where('(meeting.assignedTo = :userId OR meeting.updatedBy = :userId)', {
          userId,
        })
        .andWhere('meeting.updatedAt BETWEEN :start AND :end', { start, end })
        .andWhere(
          '(meeting.convertToProject = true OR meeting.status = :status)',
          { status: MeetingStatus.CONVERTED_TO_PROJECT },
        )
        .getCount();

      const companyMeetings = await this.meetingRepository
        .createQueryBuilder('meeting')
        .where('(meeting.assignedTo = :userId OR meeting.createdBy = :userId)', {
          userId,
        })
        .andWhere('meeting.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('meeting.meetingCategory = :category', {
          category: MeetingCategory.COMPANY_MEETING,
        })
        .getCount();

      const selfMeetings = await this.meetingRepository
        .createQueryBuilder('meeting')
        .where('(meeting.assignedTo = :userId OR meeting.createdBy = :userId)', {
          userId,
        })
        .andWhere('meeting.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('meeting.meetingCategory = :category', {
          category: MeetingCategory.SELF_MEETING,
        })
        .getCount();

      const solarMiterMeetings = await this.meetingRepository
        .createQueryBuilder('meeting')
        .where('(meeting.assignedTo = :userId OR meeting.createdBy = :userId)', {
          userId,
        })
        .andWhere('meeting.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('meeting.meetingCategory = :category', {
          category: MeetingCategory.SOLARMITER,
        })
        .getCount();

      const projectsQb = this.projectRepository
        .createQueryBuilder('project')
        .where('project.isHidden = false')
        .andWhere('(project.projectOwnerId = :userId OR project.createdBy = :userId)', {
          userId,
        })
        .andWhere('project.createdAt BETWEEN :start AND :end', { start, end });

      const totalProjects = await projectsQb.clone().getCount();

      const cashProjects = await projectsQb
        .clone()
        .andWhere('project.projectType = :type', { type: ProjectType.CASH })
        .getCount();

      const loanProjects = await projectsQb
        .clone()
        .andWhere('project.projectType = :type', { type: ProjectType.LOAN })
        .getCount();

      const cashCancelledRejected = await projectsQb
        .clone()
        .andWhere('project.projectType = :type', { type: ProjectType.CASH })
        .andWhere('project.status IN (:...statuses)', {
          statuses: [ProjectStatus.CANCELLED, ProjectStatus.REJECTED],
        })
        .getCount();

      const loanCancelledRejected = await projectsQb
        .clone()
        .andWhere('project.projectType = :type', { type: ProjectType.LOAN })
        .andWhere('project.status IN (:...statuses)', {
          statuses: [ProjectStatus.CANCELLED, ProjectStatus.REJECTED],
        })
        .getCount();

      const projectValueRaw = await projectsQb
        .clone()
        .select('COALESCE(SUM(project.finalCost), 0)', 'finalCost')
        .addSelect('COALESCE(SUM(project.projectCost), 0)', 'projectCost')
        .getRawOne();

      const paymentRaw = await this.paymentRepository
        .createQueryBuilder('payment')
        .where('payment.isHidden = false')
        .andWhere('(payment.collectedBy = :userId OR payment.createdBy = :userId)', {
          userId,
        })
        .andWhere('payment.createdAt BETWEEN :start AND :end', { start, end })
        .select('COALESCE(SUM(payment.paidAmount), 0)', 'paidAmount')
        .addSelect('COALESCE(SUM(payment.pendingAmount), 0)', 'pendingAmount')
        .getRawOne();

      rows.push({
        userId,
        name: reportUser.name,
        roles: Array.isArray(reportUser.roles) ? reportUser.roles : [],

        totalContactsAssigned,

        totalCalls,
        connectedCalls,
        cnrCalls,
        callbackCalls,
        interestedCalls,

        reviewsAssigned,
        reviewsConverted,
        reviewsPending,

        leadsCreated,
        leadsAssigned,
        leadsOriginated,
        highPotentialLeads,

        meetingsCreated,
        meetingsAssigned,
        meetingsCompleted,
        meetingsConverted,
        companyMeetings,
        selfMeetings,
        solarMiterMeetings,

        totalProjects,
        cashProjects,
        loanProjects,
        cashCancelledRejected,
        loanCancelledRejected,
        finalProjectValue: Number(projectValueRaw?.finalCost || 0),
        projectCostValue: Number(projectValueRaw?.projectCost || 0),

        collectedAmount: Number(paymentRaw?.paidAmount || 0),
        pendingAmount: Number(paymentRaw?.pendingAmount || 0),
      });
    }

    const totals = rows.reduce(
      (acc, row) => {
        Object.keys(row).forEach((key) => {
          if (typeof row[key] === 'number' && key !== 'userId') {
            acc[key] = Number(acc[key] || 0) + Number(row[key] || 0);
          }
        });

        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      range: { start, end },
      selectedRole: requestedRole || null,
      canViewAll,
      totals,
      rows,
    };
  }
}