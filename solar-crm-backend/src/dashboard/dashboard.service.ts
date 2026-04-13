import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, SelectQueryBuilder } from 'typeorm';
import { Lead, LeadStatus } from '../leads/lead.entity';
import { CallLog } from '../telecalling/call-log.entity';
import { FollowUp, FollowUpStatus } from '../followup/follow-up.entity';
import { TelecallingContact } from '../telecalling/telecalling-contact.entity';
import { UserRole } from '../users/user.entity';


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
        ? new Date(`${filters.fromDate}T00:00:00.000Z`)
        : new Date('2000-01-01T00:00:00.000Z');

      const end = filters.toDate
        ? new Date(`${filters.toDate}T23:59:59.999Z`)
        : new Date();

      return { start, end };
    }

    return null;
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

    const leadWhere =
      effectiveAssignedTo && isOwnOnly
        ? { assignedTo: effectiveAssignedTo }
        : effectiveAssignedTo
        ? { assignedTo: effectiveAssignedTo }
        : {};

    const callWhere =
      effectiveAssignedTo && isOwnOnly
        ? { telecallerId: effectiveAssignedTo }
        : effectiveAssignedTo
        ? { telecallerId: effectiveAssignedTo }
        : {};

    const followupWhereBase =
      effectiveAssignedTo && isOwnOnly
        ? { assignedTo: effectiveAssignedTo }
        : effectiveAssignedTo
        ? { assignedTo: effectiveAssignedTo }
        : {};

    const totalLeads = await this.leadRepository.count({
      where: leadWhere,
    });

    const newLeads = await this.leadRepository.count({
      where: {
        ...leadWhere,
        status: LeadStatus.NEW,
      },
    });

    const interestedLeads = await this.leadRepository.count({
      where: {
        ...leadWhere,
        status: LeadStatus.INTERESTED,
      },
    });

    const callbackCount = await this.callLogRepository.count({
      where: {
        ...callWhere,
        callStatus: 'CALLBACK',
      },
    });

    const allCallLogs = await this.callLogRepository.find({
      where: callWhere,
      select: ['leadId'],
    });

    const calledLeadIds = allCallLogs.map((log) => log.leadId).filter(Boolean);

    let neverCalledCount = 0;

    if (calledLeadIds.length === 0) {
      neverCalledCount = await this.leadRepository.count({
        where: leadWhere,
      });
    } else {
      const qb = this.leadRepository.createQueryBuilder('lead');

      if (effectiveAssignedTo) {
        qb.where('lead.assignedTo = :assignedTo', {
          assignedTo: effectiveAssignedTo,
        });
        qb.andWhere('lead.id NOT IN (:...ids)', { ids: calledLeadIds });
      } else {
        qb.where('lead.id NOT IN (:...ids)', { ids: calledLeadIds });
      }

      neverCalledCount = await qb.getCount();
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todayFollowUps = await this.followUpRepository.count({
      where: {
        ...followupWhereBase,
        followUpDate: Between(start, end),
        status: FollowUpStatus.PENDING,
      },
    });

    const overdueFollowUps = await this.followUpRepository.count({
      where: {
        ...followupWhereBase,
        followUpDate: LessThan(new Date()),
        status: FollowUpStatus.PENDING,
      },
    });

    const contactsQb = this.telecallingContactRepository
      .createQueryBuilder('contact')
      .where('1=1');

    this.applyContactFilters(contactsQb, effectiveFilters);

    const totalContacts = await contactsQb.getCount();

    const calledContactsQb = this.callLogRepository
      .createQueryBuilder('call')
      .select('COUNT(DISTINCT call.contactId)', 'count')
      .where('call.contactId IS NOT NULL');

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
    filters: {
      city?: string;
      zone?: string;
      assignedTo?: number;
    } = {},
    userRoles: string[] = [],
    currentUserId?: number,
  ) {
    const isOwnOnly = this.isOwnOnlyRole(userRoles);
    const effectiveAssignedTo =
      isOwnOnly && currentUserId ? currentUserId : filters.assignedTo;

    const effectiveFilters: DashboardFilters = {
      city: filters.city,
      zone: filters.zone,
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
}