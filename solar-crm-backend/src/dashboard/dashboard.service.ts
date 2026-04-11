import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Lead, LeadStatus } from '../leads/lead.entity';
import { CallLog } from '../telecalling/call-log.entity';
import { FollowUp, FollowUpStatus } from '../followup/follow-up.entity';
import { TelecallingContact } from '../telecalling/telecalling-contact.entity';
import { UserRole } from '../users/user.entity';

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

  private isProjectManagerRole(userRoles: string[] = []): boolean {
    return userRoles.includes(UserRole.PROJECT_MANAGER);
  }

  async getSummary(assignedTo?: number, userRoles: string[] = []) {
    const isOwnOnly = this.isOwnOnlyRole(userRoles);
    const isProjectManager = this.isProjectManagerRole(userRoles);

    const leadWhere = isOwnOnly && assignedTo ? { assignedTo } : {};
    const callWhere = isOwnOnly && assignedTo ? { telecallerId: assignedTo } : {};
    const followupWhereBase = isOwnOnly && assignedTo ? { assignedTo } : {};

    let totalLeads = 0;
    let newLeads = 0;
    let interestedLeads = 0;
    let callbackCount = 0;
    let neverCalledCount = 0;
    let todayFollowUps = 0;
    let overdueFollowUps = 0;

    if (isProjectManager) {
      const projectStatuses = [
        LeadStatus.INTERESTED,
        LeadStatus.SITE_VISIT,
        LeadStatus.QUOTATION,
        LeadStatus.NEGOTIATION,
        LeadStatus.WON,
      ];

      totalLeads = await this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.status IN (:...statuses)', { statuses: projectStatuses })
        .getCount();

      newLeads = await this.leadRepository.count({
        where: { status: LeadStatus.SITE_VISIT },
      });

      interestedLeads = await this.leadRepository.count({
        where: { status: LeadStatus.INTERESTED },
      });

      callbackCount = await this.callLogRepository.count({
        where: { callStatus: 'CALLBACK' },
      });

      neverCalledCount = 0;
    } else {
      totalLeads = await this.leadRepository.count({
        where: leadWhere,
      });

      newLeads = await this.leadRepository.count({
        where: {
          ...leadWhere,
          status: LeadStatus.NEW,
        },
      });

      interestedLeads = await this.leadRepository.count({
        where: {
          ...leadWhere,
          status: LeadStatus.INTERESTED,
        },
      });

      callbackCount = await this.callLogRepository.count({
        where: {
          ...callWhere,
          callStatus: 'CALLBACK',
        },
      });

      const allCallLogs = await this.callLogRepository.find({
        where: callWhere,
        select: ['leadId'],
      });

      const calledLeadIds = allCallLogs.map((log) => log.leadId);

      if (isOwnOnly && assignedTo) {
        const visibleLeads = await this.leadRepository
          .createQueryBuilder('lead')
          .where('(lead.assignedTo = :assignedTo OR lead.assignedTo IS NULL)', {
            assignedTo,
          })
          .select(['lead.id'])
          .getMany();

        const visibleLeadIds = visibleLeads.map((lead) => lead.id);

        if (visibleLeadIds.length === 0) {
          neverCalledCount = 0;
        } else if (calledLeadIds.length === 0) {
          neverCalledCount = visibleLeadIds.length;
        } else {
          neverCalledCount = visibleLeadIds.filter(
            (id) => !calledLeadIds.includes(id),
          ).length;
        }
      } else {
        if (calledLeadIds.length === 0) {
          neverCalledCount = await this.leadRepository.count();
        } else {
          neverCalledCount = await this.leadRepository
            .createQueryBuilder('lead')
            .where('lead.id NOT IN (:...ids)', { ids: calledLeadIds })
            .getCount();
        }
      }
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    todayFollowUps = await this.followUpRepository.count({
      where: {
        ...followupWhereBase,
        followUpDate: Between(start, end),
        status: FollowUpStatus.PENDING,
      },
    });

    overdueFollowUps = await this.followUpRepository.count({
      where: {
        ...followupWhereBase,
        followUpDate: LessThan(new Date()),
        status: FollowUpStatus.PENDING,
      },
    });

    return {
      totalLeads,
      newLeads,
      interestedLeads,
      neverCalledCount,
      callbackCount,
      todayFollowUps,
      overdueFollowUps,
    };
  }

  async getContactsSummary(
    cityFilter?: string,
    assignedTo?: number,
    userRoles: string[] = [],
  ) {
    const isOwnOnly = this.isOwnOnlyRole(userRoles);

    const baseWhere = isOwnOnly && assignedTo ? { assignedTo } : {};

    const totalContacts = await this.telecallingContactRepository.count({
      where: baseWhere,
    });

    const normalizedFilter = String(cityFilter || '').trim().toLowerCase();

    if (!normalizedFilter) {
      return {
        totalContacts,
        filteredContacts: totalContacts,
      };
    }

    const contacts = await this.telecallingContactRepository.find({
      where: baseWhere,
      select: ['id', 'city'] as any,
    });

    const filteredContacts = contacts.filter((contact: any) => {
      const city = String(contact?.city || '').toLowerCase();
      const address = String(contact?.address || '').toLowerCase();
      const location = String(contact?.location || '').toLowerCase();

      return (
        city.includes(normalizedFilter) ||
        address.includes(normalizedFilter) ||
        location.includes(normalizedFilter)
      );
    }).length;

    return {
      totalContacts,
      filteredContacts,
    };
  }
}