import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from '../users/user.entity';
import { Lead, LeadPotential, LeadStatus } from '../leads/lead.entity';
import { FollowUp, FollowUpStatus } from '../followup/follow-up.entity';

import { CallLog, CallReviewStatus } from '../telecalling/call-log.entity';
import { TelecallingContact } from '../telecalling/telecalling-contact.entity';

import {
  Meeting,
  MeetingCategory,
  MeetingStatus,
  MeetingType,
} from '../meeting/meeting.entity';

import { Project, ProjectStatus, ProjectType } from '../project/project.entity';
import {
  ProjectPaymentInstallment,
  ProjectPaymentInstallmentStatus,
} from '../project/project-payment-installment.entity';

import {
  ProjectAccountExpense,
  ProjectAccountExpenseApprovalStatus,
} from '../project/project-account-expense.entity';

import {
  ProjectPartyLedger,
  ProjectLedgerEntryType,
} from '../project/project-party-ledger.entity';

import { ProjectContractor } from '../project/project-contractor.entity';
import {
  ProjectContractorAssignment,
  ProjectContractorWorkScope,
  ProjectContractorWorkStatus,
} from '../project/project-contractor-assignment.entity';
import { ProjectContractorProof } from '../project/project-contractor-proof.entity';
import { ProjectContractorComment } from '../project/project-contractor-comment.entity';
import {
  ProjectContractorRescheduleRequest,
  ContractorRescheduleStatus,
} from '../project/project-contractor-reschedule-request.entity';
import {
  ProjectCleaningAssignment,
  ProjectCleaningStatus,
} from '../project/project-cleaning-assignment.entity';

import {
  CustomerComplaint,
  CustomerComplaintPriority,
  CustomerComplaintStatus,
} from '../customer-portal/customer-complaint.entity';
import { CustomerComplaintActivity } from '../customer-portal/customer-complaint-activity.entity';

import {
  DealerComplaint,
  DealerComplaintStatus,
} from '../dealer/dealer-complaint.entity';

type AnalyticsQuery = {
  month?: string;
  fromDate?: string;
  toDate?: string;
  department?: string;
  role?: string;
  userId?: string;
  branchName?: string;
  city?: string;
  zone?: string;
  status?: string;
  projectType?: string;
  paymentStatus?: string;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,

    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,

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

    @InjectRepository(ProjectAccountExpense)
    private readonly expenseRepository: Repository<ProjectAccountExpense>,

    @InjectRepository(ProjectPartyLedger)
    private readonly ledgerRepository: Repository<ProjectPartyLedger>,

    @InjectRepository(ProjectContractor)
    private readonly contractorRepository: Repository<ProjectContractor>,

    @InjectRepository(ProjectContractorAssignment)
    private readonly contractorAssignmentRepository: Repository<ProjectContractorAssignment>,

    @InjectRepository(ProjectContractorProof)
    private readonly contractorProofRepository: Repository<ProjectContractorProof>,

    @InjectRepository(ProjectContractorComment)
    private readonly contractorCommentRepository: Repository<ProjectContractorComment>,

    @InjectRepository(ProjectContractorRescheduleRequest)
    private readonly contractorRescheduleRepository: Repository<ProjectContractorRescheduleRequest>,

    @InjectRepository(ProjectCleaningAssignment)
    private readonly cleaningAssignmentRepository: Repository<ProjectCleaningAssignment>,

    @InjectRepository(CustomerComplaint)
    private readonly customerComplaintRepository: Repository<CustomerComplaint>,

    @InjectRepository(CustomerComplaintActivity)
    private readonly customerComplaintActivityRepository: Repository<CustomerComplaintActivity>,

    @InjectRepository(DealerComplaint)
    private readonly dealerComplaintRepository: Repository<DealerComplaint>,
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
      UserRole.CUSTOMER_MANAGER,
    ].some((role) => roles.includes(role));
  }

  private normalize(value?: string) {
    return String(value || '').trim().toLowerCase();
  }

  private getDateRange(query: AnalyticsQuery) {
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

  private async getAllowedUserIds(query: AnalyticsQuery, user: any) {
    const canViewAll = this.canViewAll(user);
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

  private applyUserFilterSql(alias: string, fields: string[], userIds: number[]) {
    if (!userIds.length) return '1=1';

    return `(${fields.map((field) => `${alias}.${field} IN (:...userIds)`).join(' OR ')})`;
  }

  private projectBranchSubquery() {
    return `
      SELECT p.id
      FROM project p
      WHERE p."isHidden" = false
    `;
  }

  private applyProjectLocationFilters(qb: any, alias: string, query: AnalyticsQuery) {
    const branchName = this.normalize(query.branchName);
    if (branchName) {
      qb.andWhere(`LOWER(COALESCE(${alias}."branchName", '')) LIKE :branchName`, {
        branchName: `%${branchName}%`,
      });
    }

    const city = this.normalize(query.city);
    if (city) {
      qb.andWhere(`LOWER(COALESCE(${alias}.city, '')) LIKE :city`, {
        city: `%${city}%`,
      });
    }

    const zone = this.normalize(query.zone);
    if (zone) {
      qb.andWhere(`LOWER(COALESCE(${alias}.zone, '')) LIKE :zone`, {
        zone: `%${zone}%`,
      });
    }

    return qb;
  }

  private async chartDaily(tableName: string, dateColumn: string, start: Date, end: Date, extraWhere = '1=1') {
    const rows = await this.userRepository.query(
      `
      SELECT TO_CHAR("${dateColumn}", 'YYYY-MM-DD') AS label, COUNT(*)::int AS value
      FROM ${tableName}
      WHERE "${dateColumn}" BETWEEN $1 AND $2
      AND ${extraWhere}
      GROUP BY TO_CHAR("${dateColumn}", 'YYYY-MM-DD')
      ORDER BY label ASC
      `,
      [start, end],
    );

    return rows.map((row: any) => ({
      label: row.label,
      value: Number(row.value || 0),
    }));
  }

  async searchUsers(query: any, user: any) {
    const canViewAll = this.canViewAll(user);
    const currentUserId = Number(user?.id || user?.userId);
    const search = String(query?.q || '').trim().toLowerCase();
    const role = String(query?.role || '').trim();

    const qb = this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email', 'user.roles'])
      .where('user.isHidden = false');

    if (!canViewAll && currentUserId) {
      qb.andWhere('user.id = :currentUserId', { currentUserId });
    }

    if (search) {
      qb.andWhere(
        `(
          LOWER(user.name) LIKE :search
          OR LOWER(user.email) LIKE :search
          OR CAST(user.id AS TEXT) LIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    const users = await qb.orderBy('user.name', 'ASC').limit(20).getMany();

    const filteredUsers = role
      ? users.filter(
          (item: any) =>
            Array.isArray(item.roles) && item.roles.includes(role),
        )
      : users;

    return {
      users: filteredUsers.map((item: any) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        roles: Array.isArray(item.roles) ? item.roles : [],
      })),
    };
  }

  async getOverview(query: AnalyticsQuery, user: any) {
    return this.getOwnerOverview(query, user);
  }

  async getOwnerOverview(query: AnalyticsQuery, user: any) {
    const { start, end } = this.getDateRange(query);
    const userIds = await this.getAllowedUserIds(query, user);
    const userParams = { userIds, start, end };

    const contactsQb = this.contactRepository
      .createQueryBuilder('contact')
      .where('contact.createdAt BETWEEN :start AND :end', { start, end });

    const city = this.normalize(query.city);
    if (city) {
      contactsQb.andWhere(
        `(LOWER(COALESCE(contact.city, '')) LIKE :city OR LOWER(COALESCE(contact.address, '')) LIKE :city OR LOWER(COALESCE(contact.location, '')) LIKE :city)`,
        { city: `%${city}%` },
      );
    }

    const zone = this.normalize(query.zone);
    if (zone) {
      contactsQb.andWhere('LOWER(COALESCE(contact.zone, \'\')) LIKE :zone', {
        zone: `%${zone}%`,
      });
    }

    if (userIds.length) {
      contactsQb.andWhere('contact.assignedTo IN (:...userIds)', userParams);
    }

    const callsQb = this.callLogRepository
      .createQueryBuilder('call')
      .where('call.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      callsQb.andWhere(
        '(call.telecallerId IN (:...userIds) OR call.reviewAssignedTo IN (:...userIds))',
        userParams,
      );
    }

    const leadsQb = this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      leadsQb.andWhere(
        '(lead.assignedTo IN (:...userIds) OR lead.createdBy IN (:...userIds) OR lead.originTelecallerId IN (:...userIds))',
        userParams,
      );
    }

    const meetingsQb = this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      meetingsQb.andWhere(
        '(meeting.assignedTo IN (:...userIds) OR meeting.createdBy IN (:...userIds) OR meeting.updatedBy IN (:...userIds))',
        userParams,
      );
    }

    const projectsQb = this.projectRepository
      .createQueryBuilder('project')
      .where('project.isHidden = false')
      .andWhere('project.createdAt BETWEEN :start AND :end', { start, end });

    this.applyProjectLocationFilters(projectsQb, 'project', query);

    if (userIds.length) {
      projectsQb.andWhere(
        '(project.projectOwnerId IN (:...userIds) OR project.createdBy IN (:...userIds))',
        userParams,
      );
    }

    const paymentsQb = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.isHidden = false')
      .andWhere('payment.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      paymentsQb.andWhere(
        '(payment.collectedBy IN (:...userIds) OR payment.createdBy IN (:...userIds))',
        userParams,
      );
    }

    const branchName = this.normalize(query.branchName);
    if (branchName) {
      paymentsQb.andWhere(
        `payment.projectId IN (
          SELECT p.id FROM project p
          WHERE p."isHidden" = false
          AND LOWER(COALESCE(p."branchName", '')) LIKE :branchName
        )`,
        { branchName: `%${branchName}%` },
      );
    }

    const expensesQb = this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.isHidden = false')
      .andWhere('expense.createdAt BETWEEN :start AND :end', { start, end });

    if (branchName) {
      expensesQb.andWhere('LOWER(COALESCE(expense.branchName, \'\')) LIKE :branchName', {
        branchName: `%${branchName}%`,
      });
    }

    const customerComplaintsQb = this.customerComplaintRepository
      .createQueryBuilder('complaint')
      .where('complaint.isHidden = false')
      .andWhere('complaint.createdAt BETWEEN :start AND :end', { start, end });

    if (branchName) {
      customerComplaintsQb.andWhere(
        'LOWER(COALESCE(complaint.branchName, \'\')) LIKE :branchName',
        { branchName: `%${branchName}%` },
      );
    }

    const dealerComplaintsQb = this.dealerComplaintRepository
      .createQueryBuilder('dealerComplaint')
      .where('dealerComplaint.createdAt BETWEEN :start AND :end', { start, end });

    const [
      totalContacts,
      totalCalls,
      totalLeads,
      totalMeetings,
      totalProjects,
      paymentRaw,
      expenseRaw,
      customerComplaints,
      dealerComplaints,
      contractorAssignments,
      cleaningAssignments,
    ] = await Promise.all([
      contactsQb.getCount(),
      callsQb.getCount(),
      leadsQb.getCount(),
      meetingsQb.getCount(),
      projectsQb.getCount(),
      paymentsQb
        .select('COALESCE(SUM(payment.paidAmount), 0)', 'collectedAmount')
        .addSelect('COALESCE(SUM(payment.pendingAmount), 0)', 'pendingAmount')
        .getRawOne(),
      expensesQb
        .select('COALESCE(SUM(expense.amount), 0)', 'expenseAmount')
        .getRawOne(),
      customerComplaintsQb.getCount(),
      dealerComplaintsQb.getCount(),
      this.contractorAssignmentRepository
        .createQueryBuilder('assignment')
        .where('assignment.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),
      this.cleaningAssignmentRepository
        .createQueryBuilder('cleaning')
        .where('cleaning.isHidden = false')
        .andWhere('cleaning.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),
    ]);

    return {
      range: { start, end },
      cards: {
        totalContacts,
        totalCalls,
        totalLeads,
        totalMeetings,
        totalProjects,
        collectedAmount: Number(paymentRaw?.collectedAmount || 0),
        pendingAmount: Number(paymentRaw?.pendingAmount || 0),
        expenseAmount: Number(expenseRaw?.expenseAmount || 0),
        customerComplaints,
        dealerComplaints,
        contractorAssignments,
        cleaningAssignments,
      },
      charts: {
        contactsTrend: await this.chartDaily('telecalling_contact', 'createdAt', start, end),
        callsTrend: await this.chartDaily('call_log', 'createdAt', start, end),
        leadsTrend: await this.chartDaily('lead', 'createdAt', start, end),
        meetingsTrend: await this.chartDaily('meetings', 'createdAt', start, end),
        projectsTrend: await this.chartDaily('project', 'createdAt', start, end, `"isHidden" = false`),
      },
    };
  }

  async getDepartmentReport(query: AnalyticsQuery, user: any) {
    const department = String(query.department || '').trim().toUpperCase();

    if (department === 'TELECALLING') {
      return this.getTelecallingReport(query, user);
    }

    if (department === 'TELECALLING_ASSISTANT') {
      return this.getTelecallingAssistantReport(query, user);
    }

    if (department === 'LEADS') {
      return this.getLeadsReport(query, user);
    }

    if (department === 'MEETINGS') {
      return this.getMeetingsReport(query, user);
    }

    if (department === 'PROJECTS') {
      return this.getProjectsReport(query, user);
    }

    if (department === 'CONTRACTORS') {
      return this.getContractorsReport(query, user);
    }

    if (department === 'PAYMENTS') {
      return this.getPaymentsReport(query, user);
    }

    if (department === 'ACCOUNTS') {
      return this.getAccountsReport(query, user);
    }

    if (department === 'COMPLAINTS') {
      return this.getComplaintsReport(query, user);
    }

    return this.getOwnerOverview(query, user);
  }

  private async getTelecallingReport(query: AnalyticsQuery, user: any) {
    const { start, end } = this.getDateRange(query);
    const userIds = await this.getAllowedUserIds(query, user);

    const callsQb = this.callLogRepository
      .createQueryBuilder('call')
      .where('call.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere(`UPPER(COALESCE(call.callStatus, '')) <> 'INITIATED'`);

    if (userIds.length) {
      callsQb.andWhere('call.telecallerId IN (:...userIds)', { userIds });
    }

    const contactsQb = this.contactRepository
      .createQueryBuilder('contact')
      .where('contact.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      contactsQb.andWhere('contact.assignedTo IN (:...userIds)', { userIds });
    }

    const city = this.normalize(query.city);
    if (city) {
      contactsQb.andWhere(
        `(LOWER(COALESCE(contact.city, '')) LIKE :city OR LOWER(COALESCE(contact.address, '')) LIKE :city OR LOWER(COALESCE(contact.location, '')) LIKE :city)`,
        { city: `%${city}%` },
      );
    }

    const zone = this.normalize(query.zone);
    if (zone) {
      contactsQb.andWhere('LOWER(COALESCE(contact.zone, \'\')) LIKE :zone', {
        zone: `%${zone}%`,
      });
    }

    const [assignedContacts, totalCalls, connected, cnr, callback, interested, convertedLeads] =
      await Promise.all([
        contactsQb.getCount(),
        callsQb.clone().getCount(),
        callsQb.clone().andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'CONNECTED'`).getCount(),
        callsQb.clone().andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'CNR'`).getCount(),
        callsQb.clone().andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'CALLBACK'`).getCount(),
        callsQb.clone().andWhere(`UPPER(COALESCE(call.callStatus, '')) = 'INTERESTED'`).getCount(),
        this.leadRepository
          .createQueryBuilder('lead')
          .where('lead.createdAt BETWEEN :start AND :end', { start, end })
          .andWhere(
            userIds.length ? 'lead.originTelecallerId IN (:...userIds)' : '1=1',
            { userIds },
          )
          .getCount(),
      ]);

    const userWise = await callsQb
      .clone()
      .select('call.telecallerId', 'userId')
      .addSelect('COUNT(*)', 'totalCalls')
      .addSelect(`SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'CONNECTED' THEN 1 ELSE 0 END)`, 'connected')
      .addSelect(`SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'CNR' THEN 1 ELSE 0 END)`, 'cnr')
      .addSelect(`SUM(CASE WHEN UPPER(COALESCE(call.callStatus, '')) = 'INTERESTED' THEN 1 ELSE 0 END)`, 'interested')
      .andWhere('call.telecallerId IS NOT NULL')
      .groupBy('call.telecallerId')
      .orderBy('COUNT(*)', 'DESC')
      .limit(50)
      .getRawMany();

    return {
      department: 'TELECALLING',
      cards: {
        assignedContacts,
        totalCalls,
        connected,
        cnr,
        callback,
        interested,
        convertedLeads,
      },
      charts: {
        callsTrend: await this.chartDaily('call_log', 'createdAt', start, end),
      },
      rows: userWise.map((row) => ({
        userId: row.userId ? Number(row.userId) : null,
        totalCalls: Number(row.totalCalls || 0),
        connected: Number(row.connected || 0),
        cnr: Number(row.cnr || 0),
        interested: Number(row.interested || 0),
      })),
    };
  }

  private async getTelecallingAssistantReport(query: AnalyticsQuery, user: any) {
    const { start, end } = this.getDateRange(query);
    const userIds = await this.getAllowedUserIds(query, user);

    const callsQb = this.callLogRepository
      .createQueryBuilder('call')
      .where('call.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('call.reviewAssignedTo IS NOT NULL');

    if (userIds.length) {
      callsQb.andWhere('call.reviewAssignedTo IN (:...userIds)', { userIds });
    }

    const [assigned, pending, potential, converted, rejected] = await Promise.all([
      callsQb.clone().getCount(),
      callsQb.clone().andWhere('call.reviewStatus = :status', { status: CallReviewStatus.PENDING }).getCount(),
      callsQb.clone().andWhere('call.reviewStatus = :status', { status: CallReviewStatus.POTENTIAL }).getCount(),
      callsQb.clone().andWhere('call.reviewStatus = :status', { status: CallReviewStatus.CONVERTED }).getCount(),
      callsQb.clone().andWhere('call.reviewStatus = :status', { status: CallReviewStatus.REJECTED }).getCount(),
    ]);

    const assistantWise = await callsQb
      .clone()
      .select('call.reviewAssignedTo', 'userId')
      .addSelect('COALESCE(call.reviewAssignedToName, \'Unassigned\')', 'name')
      .addSelect('COUNT(*)', 'assigned')
      .addSelect(`SUM(CASE WHEN call.reviewStatus = :converted THEN 1 ELSE 0 END)`, 'converted')
      .addSelect(`SUM(CASE WHEN call.reviewStatus = :pending THEN 1 ELSE 0 END)`, 'pending')
      .setParameters({
        converted: CallReviewStatus.CONVERTED,
        pending: CallReviewStatus.PENDING,
      })
      .groupBy('call.reviewAssignedTo')
      .addGroupBy('call.reviewAssignedToName')
      .orderBy('COUNT(*)', 'DESC')
      .limit(50)
      .getRawMany();

    return {
      department: 'TELECALLING_ASSISTANT',
      cards: { assigned, pending, potential, converted, rejected },
      charts: {
        reviewTrend: await this.chartDaily('call_log', 'createdAt', start, end),
      },
      rows: assistantWise.map((row) => ({
        userId: row.userId ? Number(row.userId) : null,
        name: row.name,
        assigned: Number(row.assigned || 0),
        converted: Number(row.converted || 0),
        pending: Number(row.pending || 0),
      })),
    };
  }

  private async getLeadsReport(query: AnalyticsQuery, user: any) {
    const { start, end } = this.getDateRange(query);
    const userIds = await this.getAllowedUserIds(query, user);

    const leadsQb = this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      leadsQb.andWhere(
        '(lead.assignedTo IN (:...userIds) OR lead.createdBy IN (:...userIds) OR lead.originTelecallerId IN (:...userIds))',
        { userIds },
      );
    }

    const [
      totalLeads,
      newLeads,
      interestedLeads,
      highPotential,
      mediumPotential,
      lowPotential,
      convertedToMeeting,
    ] = await Promise.all([
      leadsQb.clone().getCount(),
      leadsQb.clone().andWhere('lead.status = :status', { status: LeadStatus.NEW }).getCount(),
      leadsQb.clone().andWhere('lead.status = :status', { status: LeadStatus.INTERESTED }).getCount(),
      leadsQb.clone().andWhere('lead.potential = :potential', { potential: LeadPotential.HIGH }).getCount(),
      leadsQb.clone().andWhere('lead.potential = :potential', { potential: LeadPotential.MEDIUM }).getCount(),
      leadsQb.clone().andWhere('lead.potential = :potential', { potential: LeadPotential.LOW }).getCount(),
      this.meetingRepository
        .createQueryBuilder('meeting')
        .where('meeting.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('meeting.leadId IS NOT NULL')
        .andWhere(
          userIds.length
            ? '(meeting.createdBy IN (:...userIds) OR meeting.assignedTo IN (:...userIds))'
            : '1=1',
          { userIds },
        )
        .getCount(),
    ]);

    return {
      department: 'LEADS',
      cards: {
        totalLeads,
        newLeads,
        interestedLeads,
        highPotential,
        mediumPotential,
        lowPotential,
        convertedToMeeting,
      },
      charts: {
        leadTrend: await this.chartDaily('lead', 'createdAt', start, end),
      },
      rows: [],
    };
  }

  private async getMeetingsReport(query: AnalyticsQuery, user: any) {
    const { start, end } = this.getDateRange(query);
    const userIds = await this.getAllowedUserIds(query, user);

    const meetingsQb = this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      meetingsQb.andWhere(
        '(meeting.assignedTo IN (:...userIds) OR meeting.createdBy IN (:...userIds) OR meeting.updatedBy IN (:...userIds))',
        { userIds },
      );
    }

    const [
      totalMeetings,
      companyMeetings,
      selfMeetings,
      solarMiterMeetings,
      siteVisits,
      completed,
      converted,
      cancelled,
      cnr,
    ] = await Promise.all([
      meetingsQb.clone().getCount(),
      meetingsQb.clone().andWhere('meeting.meetingCategory = :category', { category: MeetingCategory.COMPANY_MEETING }).getCount(),
      meetingsQb.clone().andWhere('meeting.meetingCategory = :category', { category: MeetingCategory.SELF_MEETING }).getCount(),
      meetingsQb.clone().andWhere('meeting.meetingCategory = :category', { category: MeetingCategory.SOLARMITER }).getCount(),
      meetingsQb.clone().andWhere('meeting.meetingType = :type', { type: MeetingType.SITE_VISIT }).getCount(),
      meetingsQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.COMPLETED }).getCount(),
      meetingsQb.clone().andWhere('(meeting.convertToProject = true OR meeting.status = :status)', { status: MeetingStatus.CONVERTED_TO_PROJECT }).getCount(),
      meetingsQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.CANCELLED }).getCount(),
      meetingsQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.CNR }).getCount(),
    ]);

    const projectQb = this.projectRepository
      .createQueryBuilder('project')
      .where('project.isHidden = false')
      .andWhere('project.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      projectQb.andWhere(
        '(project.projectOwnerId IN (:...userIds) OR project.createdBy IN (:...userIds))',
        { userIds },
      );
    }

    const cashProjects = await projectQb.clone().andWhere('project.projectType = :type', { type: ProjectType.CASH }).getCount();
    const loanProjects = await projectQb.clone().andWhere('project.projectType = :type', { type: ProjectType.LOAN }).getCount();

    return {
      department: 'MEETINGS',
      cards: {
        totalMeetings,
        companyMeetings,
        selfMeetings,
        solarMiterMeetings,
        siteVisits,
        completed,
        converted,
        cancelled,
        cnr,
        cashProjects,
        loanProjects,
      },
      charts: {
        meetingTrend: await this.chartDaily('meetings', 'createdAt', start, end),
      },
      rows: [],
    };
  }

  private async getProjectsReport(query: AnalyticsQuery, user: any) {
    const { start, end } = this.getDateRange(query);
    const userIds = await this.getAllowedUserIds(query, user);

    const projectsQb = this.projectRepository
      .createQueryBuilder('project')
      .where('project.isHidden = false')
      .andWhere('project.createdAt BETWEEN :start AND :end', { start, end });

    this.applyProjectLocationFilters(projectsQb, 'project', query);

    if (userIds.length) {
      projectsQb.andWhere(
        '(project.projectOwnerId IN (:...userIds) OR project.createdBy IN (:...userIds))',
        { userIds },
      );
    }

    if (query.projectType) {
      projectsQb.andWhere('project.projectType = :projectType', {
        projectType: query.projectType,
      });
    }

    if (query.status) {
      projectsQb.andWhere('project.status = :status', { status: query.status });
    }

    const [
      totalProjects,
      cashProjects,
      loanProjects,
      completedProjects,
      cancelledProjects,
      rejectedProjects,
      valueRaw,
    ] = await Promise.all([
      projectsQb.clone().getCount(),
      projectsQb.clone().andWhere('project.projectType = :type', { type: ProjectType.CASH }).getCount(),
      projectsQb.clone().andWhere('project.projectType = :type', { type: ProjectType.LOAN }).getCount(),
      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.COMPLETED }).getCount(),
      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.CANCELLED }).getCount(),
      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.REJECTED }).getCount(),
      projectsQb.clone()
        .select('COALESCE(SUM(project.finalCost), 0)', 'finalCost')
        .addSelect('COALESCE(SUM(project.projectCost), 0)', 'projectCost')
        .getRawOne(),
    ]);

    const branchWise = await projectsQb
      .clone()
      .select('COALESCE(project.branchName, \'Unassigned Branch\')', 'label')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(project.finalCost), 0)', 'value')
      .groupBy('project.branchName')
      .orderBy('count', 'DESC')
      .limit(30)
      .getRawMany();

    return {
      department: 'PROJECTS',
      cards: {
        totalProjects,
        cashProjects,
        loanProjects,
        completedProjects,
        cancelledProjects,
        rejectedProjects,
        finalCost: Number(valueRaw?.finalCost || 0),
        projectCost: Number(valueRaw?.projectCost || 0),
      },
      charts: {
        projectTrend: await this.chartDaily('project', 'createdAt', start, end, `"isHidden" = false`),
      },
      rows: branchWise.map((row) => ({
        label: row.label,
        count: Number(row.count || 0),
        value: Number(row.value || 0),
      })),
    };
  }

  private async getContractorsReport(query: AnalyticsQuery, user: any) {
    const { start, end } = this.getDateRange(query);
    const userIds = await this.getAllowedUserIds(query, user);

    const assignmentQb = this.contractorAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      assignmentQb.andWhere(
        '(assignment.assignedBy IN (:...userIds) OR assignment.contractorId IN (:...userIds))',
        { userIds },
      );
    }

    const [
      totalAssignments,
      fullProject,
      structureTeam,
      electricalTeam,
      installationTeam,
      assigned,
      inProgress,
      onHold,
      pendingProofs,
      completed,
      proofsUploaded,
      commentsAdded,
      reschedulePending,
      cleaningAssigned,
      cleaningCompleted,
    ] = await Promise.all([
      assignmentQb.clone().getCount(),
      assignmentQb.clone().andWhere('assignment.workScope = :scope', { scope: ProjectContractorWorkScope.FULL_PROJECT }).getCount(),
      assignmentQb.clone().andWhere('assignment.workScope = :scope', { scope: ProjectContractorWorkScope.STRUCTURE_TEAM }).getCount(),
      assignmentQb.clone().andWhere('assignment.workScope = :scope', { scope: ProjectContractorWorkScope.ELECTRICAL_TEAM }).getCount(),
      assignmentQb.clone().andWhere('assignment.workScope = :scope', { scope: ProjectContractorWorkScope.INSTALLATION_TEAM }).getCount(),
      assignmentQb.clone().andWhere('assignment.status = :status', { status: ProjectContractorWorkStatus.ASSIGNED }).getCount(),
      assignmentQb.clone().andWhere('assignment.status = :status', { status: ProjectContractorWorkStatus.IN_PROGRESS }).getCount(),
      assignmentQb.clone().andWhere('assignment.status = :status', { status: ProjectContractorWorkStatus.ON_HOLD }).getCount(),
      assignmentQb.clone().andWhere('assignment.status = :status', { status: ProjectContractorWorkStatus.PENDING_FINAL_PROOFS }).getCount(),
      assignmentQb.clone().andWhere('assignment.status = :status', { status: ProjectContractorWorkStatus.COMPLETED }).getCount(),
      this.contractorProofRepository
        .createQueryBuilder('proof')
        .where('proof.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),
      this.contractorCommentRepository
        .createQueryBuilder('comment')
        .where('comment.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),
      this.contractorRescheduleRepository
        .createQueryBuilder('request')
        .where('request.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('request.status = :status', { status: ContractorRescheduleStatus.PENDING })
        .getCount(),
      this.cleaningAssignmentRepository
        .createQueryBuilder('cleaning')
        .where('cleaning.isHidden = false')
        .andWhere('cleaning.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),
      this.cleaningAssignmentRepository
        .createQueryBuilder('cleaning')
        .where('cleaning.isHidden = false')
        .andWhere('cleaning.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('cleaning.status = :status', { status: ProjectCleaningStatus.COMPLETED })
        .getCount(),
    ]);

    return {
      department: 'CONTRACTORS',
      cards: {
        totalAssignments,
        fullProject,
        structureTeam,
        electricalTeam,
        installationTeam,
        assigned,
        inProgress,
        onHold,
        pendingProofs,
        completed,
        proofsUploaded,
        commentsAdded,
        reschedulePending,
        cleaningAssigned,
        cleaningCompleted,
      },
      charts: {},
      rows: [],
    };
  }

  private async getPaymentsReport(query: AnalyticsQuery, user: any) {
    const { start, end } = this.getDateRange(query);
    const userIds = await this.getAllowedUserIds(query, user);

    const paymentsQb = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.isHidden = false')
      .andWhere('payment.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      paymentsQb.andWhere(
        '(payment.collectedBy IN (:...userIds) OR payment.createdBy IN (:...userIds))',
        { userIds },
      );
    }

    if (query.paymentStatus) {
      paymentsQb.andWhere('payment.status = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }

    const summary = await paymentsQb
      .clone()
      .select('COALESCE(SUM(payment.amount), 0)', 'amount')
      .addSelect('COALESCE(SUM(payment.paidAmount), 0)', 'paid')
      .addSelect('COALESCE(SUM(payment.pendingAmount), 0)', 'pending')
      .getRawOne();

    return {
      department: 'PAYMENTS',
      cards: {
        totalReceivable: Number(summary?.amount || 0),
        collected: Number(summary?.paid || 0),
        pending: Number(summary?.pending || 0),
        paidInstallments: await paymentsQb.clone().andWhere('payment.status = :status', { status: ProjectPaymentInstallmentStatus.PAID }).getCount(),
        partialInstallments: await paymentsQb.clone().andWhere('payment.status = :status', { status: ProjectPaymentInstallmentStatus.PARTIAL }).getCount(),
        overdueInstallments: await paymentsQb.clone().andWhere('payment.status = :status', { status: ProjectPaymentInstallmentStatus.OVERDUE }).getCount(),
      },
      charts: {},
      rows: [],
    };
  }

  private async getAccountsReport(query: AnalyticsQuery, user: any) {
    const { start, end } = this.getDateRange(query);

    const expenseQb = this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.isHidden = false')
      .andWhere('expense.createdAt BETWEEN :start AND :end', { start, end });

    const branchName = this.normalize(query.branchName);
    if (branchName) {
      expenseQb.andWhere('LOWER(COALESCE(expense.branchName, \'\')) LIKE :branchName', {
        branchName: `%${branchName}%`,
      });
    }

    const approvedRaw = await expenseQb
      .clone()
      .andWhere('expense.approvalStatus = :status', {
        status: ProjectAccountExpenseApprovalStatus.APPROVED,
      })
      .select('COALESCE(SUM(expense.amount), 0)', 'amount')
      .getRawOne();

    const pendingRaw = await expenseQb
      .clone()
      .andWhere('expense.approvalStatus = :status', {
        status: ProjectAccountExpenseApprovalStatus.PENDING,
      })
      .select('COALESCE(SUM(expense.amount), 0)', 'amount')
      .getRawOne();

    const ledgerDebitRaw = await this.ledgerRepository
      .createQueryBuilder('ledger')
      .where('ledger.isHidden = false')
      .andWhere('ledger.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('ledger.entryType = :entryType', { entryType: ProjectLedgerEntryType.DEBIT })
      .select('COALESCE(SUM(ledger.amount), 0)', 'amount')
      .getRawOne();

    const ledgerCreditRaw = await this.ledgerRepository
      .createQueryBuilder('ledger')
      .where('ledger.isHidden = false')
      .andWhere('ledger.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('ledger.entryType = :entryType', { entryType: ProjectLedgerEntryType.CREDIT })
      .select('COALESCE(SUM(ledger.amount), 0)', 'amount')
      .getRawOne();

    return {
      department: 'ACCOUNTS',
      cards: {
        approvedExpenses: Number(approvedRaw?.amount || 0),
        pendingExpenses: Number(pendingRaw?.amount || 0),
        ledgerDebit: Number(ledgerDebitRaw?.amount || 0),
        ledgerCredit: Number(ledgerCreditRaw?.amount || 0),
      },
      charts: {},
      rows: [],
    };
  }

  private async getComplaintsReport(query: AnalyticsQuery, user: any) {
    const { start, end } = this.getDateRange(query);

    const customerQb = this.customerComplaintRepository
      .createQueryBuilder('complaint')
      .where('complaint.isHidden = false')
      .andWhere('complaint.createdAt BETWEEN :start AND :end', { start, end });

    const branchName = this.normalize(query.branchName);
    if (branchName) {
      customerQb.andWhere(
        'LOWER(COALESCE(complaint.branchName, \'\')) LIKE :branchName',
        { branchName: `%${branchName}%` },
      );
    }

    const dealerQb = this.dealerComplaintRepository
      .createQueryBuilder('dealerComplaint')
      .where('dealerComplaint.createdAt BETWEEN :start AND :end', { start, end });

    return {
      department: 'COMPLAINTS',
      cards: {
        customerComplaints: await customerQb.clone().getCount(),
        customerOpen: await customerQb.clone().andWhere('complaint.status = :status', { status: CustomerComplaintStatus.OPEN }).getCount(),
        customerInProgress: await customerQb.clone().andWhere('complaint.status = :status', { status: CustomerComplaintStatus.IN_PROGRESS }).getCount(),
        customerResolved: await customerQb.clone().andWhere('complaint.status = :status', { status: CustomerComplaintStatus.RESOLVED }).getCount(),
        customerUrgent: await customerQb.clone().andWhere('complaint.priority = :priority', { priority: CustomerComplaintPriority.URGENT }).getCount(),
        dealerComplaints: await dealerQb.clone().getCount(),
        dealerOpen: await dealerQb.clone().andWhere('dealerComplaint.status = :status', { status: DealerComplaintStatus.OPEN }).getCount(),
        dealerInProgress: await dealerQb.clone().andWhere('dealerComplaint.status = :status', { status: DealerComplaintStatus.IN_PROGRESS }).getCount(),
        dealerResolved: await dealerQb.clone().andWhere('dealerComplaint.status = :status', { status: DealerComplaintStatus.RESOLVED }).getCount(),
      },
      charts: {},
      rows: [],
    };
  }
}