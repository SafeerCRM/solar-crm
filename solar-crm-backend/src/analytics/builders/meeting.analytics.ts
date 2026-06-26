import { Repository } from 'typeorm';

import { User } from '../../users/user.entity';
import {
  Meeting,
  MeetingCategory,
  MeetingStatus,
  MeetingType,
} from '../../meeting/meeting.entity';
import { Project, ProjectStatus, ProjectType } from '../../project/project.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
  canViewAllAnalytics,
} from '../helpers/analytics-filter.helper';

export class MeetingAnalyticsBuilder {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly meetingRepository: Repository<Meeting>,
    private readonly projectRepository: Repository<Project>,
  ) {}

  private async getUserIds(query: AnalyticsQuery, user: any) {
    const canViewAll = canViewAllAnalytics(user);
    const currentUserId = Number(user?.id || user?.userId);
    const selectedUserId = query.userId ? Number(query.userId) : null;
    const selectedRole = String(query.role || '').trim();

    if (!canViewAll) return currentUserId ? [currentUserId] : [];
    if (selectedUserId) return [selectedUserId];

    if (selectedRole) {
      const users = await this.userRepository.find({
        where: { isHidden: false } as any,
      });

      return users
        .filter((item: any) => Array.isArray(item.roles) && item.roles.includes(selectedRole))
        .map((item) => Number(item.id));
    }

    return [];
  }

  async build(query: AnalyticsQuery, user: any) {
    const { start, end } = getAnalyticsDateRange(query);
    const userIds = await this.getUserIds(query, user);

    const meetingsQb = this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      meetingsQb.andWhere(
        '(meeting.assignedTo IN (:...userIds) OR meeting.createdBy IN (:...userIds) OR meeting.updatedBy IN (:...userIds))',
        { userIds },
      );
    }

    const convertedMeetingsQb = this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.updatedAt BETWEEN :start AND :end', { start, end })
      .andWhere(
        '(meeting.convertToProject = true OR meeting.status = :convertedStatus)',
        { convertedStatus: MeetingStatus.CONVERTED_TO_PROJECT },
      );

    if (userIds.length) {
      convertedMeetingsQb.andWhere(
        '(meeting.assignedTo IN (:...userIds) OR meeting.createdBy IN (:...userIds) OR meeting.updatedBy IN (:...userIds))',
        { userIds },
      );
    }

    const projectsQb = this.projectRepository
      .createQueryBuilder('project')
      .where('project.isHidden = false')
      .andWhere('project.createdAt BETWEEN :start AND :end', { start, end });

    if (userIds.length) {
      projectsQb.andWhere(
        '(project.projectOwnerId IN (:...userIds) OR project.createdBy IN (:...userIds))',
        { userIds },
      );
    }

    const [
      totalMeetings,
      scheduled,
      completed,
      rescheduled,
      cancelled,
      onHold,
      noShow,
      cnr,
      convertedToProject,
      siteVisits,
      companyMeetings,
      selfMeetings,
      solarMiterMeetings,
      cashProjects,
      loanProjects,
      cashCancelled,
      loanCancelled,
      cashRejected,
      loanRejected,
      statusRows,
      categoryRows,
      managerWiseRows,
    ] = await Promise.all([
      meetingsQb.clone().getCount(),

      meetingsQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.SCHEDULED }).getCount(),
      meetingsQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.COMPLETED }).getCount(),
      meetingsQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.RESCHEDULED }).getCount(),
      meetingsQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.CANCELLED }).getCount(),
      meetingsQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.ON_HOLD }).getCount(),
      meetingsQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.NO_SHOW }).getCount(),
      meetingsQb.clone().andWhere('meeting.status = :status', { status: MeetingStatus.CNR }).getCount(),

      convertedMeetingsQb.clone().getCount(),

      meetingsQb.clone().andWhere('meeting.meetingType = :type', { type: MeetingType.SITE_VISIT }).getCount(),
      meetingsQb.clone().andWhere('meeting.meetingCategory = :category', { category: MeetingCategory.COMPANY_MEETING }).getCount(),
      meetingsQb.clone().andWhere('meeting.meetingCategory = :category', { category: MeetingCategory.SELF_MEETING }).getCount(),
      meetingsQb.clone().andWhere('meeting.meetingCategory = :category', { category: MeetingCategory.SOLARMITER }).getCount(),

      projectsQb.clone().andWhere('project.projectType = :type', { type: ProjectType.CASH }).getCount(),
      projectsQb.clone().andWhere('project.projectType = :type', { type: ProjectType.LOAN }).getCount(),

      projectsQb
        .clone()
        .andWhere('project.projectType = :type', { type: ProjectType.CASH })
        .andWhere('project.status = :status', { status: ProjectStatus.CANCELLED })
        .getCount(),

      projectsQb
        .clone()
        .andWhere('project.projectType = :type', { type: ProjectType.LOAN })
        .andWhere('project.status = :status', { status: ProjectStatus.CANCELLED })
        .getCount(),

      projectsQb
        .clone()
        .andWhere('project.projectType = :type', { type: ProjectType.CASH })
        .andWhere('project.status = :status', { status: ProjectStatus.REJECTED })
        .getCount(),

      projectsQb
        .clone()
        .andWhere('project.projectType = :type', { type: ProjectType.LOAN })
        .andWhere('project.status = :status', { status: ProjectStatus.REJECTED })
        .getCount(),

      meetingsQb
        .clone()
        .select('meeting."status"::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('meeting."status"')
        .orderBy('value', 'DESC')
        .getRawMany(),

      meetingsQb
        .clone()
        .select('meeting."meetingCategory"::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('meeting."meetingCategory"')
        .orderBy('value', 'DESC')
        .getRawMany(),

      meetingsQb
        .clone()
        .select('meeting.assignedTo', 'userId')
        .addSelect('COALESCE(meeting.assignedToName, \'Unassigned\')', 'name')
        .addSelect('COUNT(*)', 'totalMeetings')
        .addSelect(
          `SUM(CASE WHEN meeting.status = :completed THEN 1 ELSE 0 END)`,
          'completed',
        )
        .addSelect(
          `SUM(CASE WHEN meeting.status = :cancelled THEN 1 ELSE 0 END)`,
          'cancelled',
        )
        .setParameters({
          completed: MeetingStatus.COMPLETED,
          cancelled: MeetingStatus.CANCELLED,
        })
        .andWhere('meeting.assignedTo IS NOT NULL')
        .groupBy('meeting.assignedTo')
        .addGroupBy('meeting.assignedToName')
        .orderBy('COUNT(*)', 'DESC')
        .limit(50)
        .getRawMany(),
    ]);

    const conversionPercent =
      totalMeetings > 0 ? Math.round((convertedToProject / totalMeetings) * 100) : 0;

    return {
      department: 'MEETINGS',
      title: 'Meeting Analytics Report',
      cards: {
        totalMeetings,
        scheduled,
        completed,
        rescheduled,
        cancelled,
        onHold,
        noShow,
        cnr,
        convertedToProject,
        conversionPercent,
        siteVisits,
        companyMeetings,
        selfMeetings,
        solarMiterMeetings,
        cashProjects,
        loanProjects,
        cashCancelled,
        loanCancelled,
        cashRejected,
        loanRejected,
      },
      charts: {
        meetingStatusSplit: {
          type: 'bar',
          title: 'Meeting Status Split',
          data: statusRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },
        meetingCategorySplit: {
          type: 'bar',
          title: 'Meeting Category Split',
          data: categoryRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },
        meetingConversionFunnel: {
          type: 'funnel',
          title: 'Meeting to Project Funnel',
          data: [
            { label: 'Total Meetings', value: totalMeetings, percent: 100 },
            { label: 'Completed', value: completed, percent: totalMeetings > 0 ? Math.round((completed / totalMeetings) * 100) : 0 },
            { label: 'Converted to Project', value: convertedToProject, percent: conversionPercent },
            { label: 'Cash Projects', value: cashProjects, percent: convertedToProject > 0 ? Math.round((cashProjects / convertedToProject) * 100) : 0 },
            { label: 'Loan Projects', value: loanProjects, percent: convertedToProject > 0 ? Math.round((loanProjects / convertedToProject) * 100) : 0 },
          ],
        },
      },
      rows: managerWiseRows.map((row) => ({
        userId: row.userId ? Number(row.userId) : null,
        name: row.name,
        totalMeetings: Number(row.totalMeetings || 0),
        completed: Number(row.completed || 0),
        cancelled: Number(row.cancelled || 0),
      })),
    };
  }
}