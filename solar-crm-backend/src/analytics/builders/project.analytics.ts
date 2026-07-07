import { Repository } from 'typeorm';

import { User } from '../../users/user.entity';
import { Project, ProjectStatus, ProjectType } from '../../project/project.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
  normalizeAnalyticsText,
  canViewAllAnalytics,
} from '../helpers/analytics-filter.helper';

export class ProjectAnalyticsBuilder {
  constructor(
    private readonly userRepository: Repository<User>,
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

    const branchName = normalizeAnalyticsText(query.branchName);
    if (branchName) {
      projectsQb.andWhere(
        'LOWER(COALESCE(project.branchName, \'\')) LIKE :branchName',
        { branchName: `%${branchName}%` },
      );
    }

    const city = normalizeAnalyticsText(query.city);
    if (city) {
      projectsQb.andWhere('LOWER(COALESCE(project.city, \'\')) LIKE :city', {
        city: `%${city}%`,
      });
    }

    const zone = normalizeAnalyticsText(query.zone);
    if (zone) {
      projectsQb.andWhere('LOWER(COALESCE(project.zone, \'\')) LIKE :zone', {
        zone: `%${zone}%`,
      });
    }

    if (query.projectType) {
      projectsQb.andWhere('project.projectType = :projectType', {
        projectType: query.projectType,
      });
    }

    if (query.status) {
      projectsQb.andWhere('project.status = :status', {
        status: query.status,
      });
    }

    const [
      totalProjects,
      cashProjects,
      loanProjects,
      completedProjects,
      cancelledProjects,
      rejectedProjects,
      loanProcess,
      projectManagement,
      subsidyProcess,
      electricityProcess,
      pendingApproval,
      approved,
      valueRaw,
      statusRows,
      typeRows,
      branchRows,
      ownerRows,
    ] = await Promise.all([
      projectsQb.clone().getCount(),

      projectsQb.clone().andWhere('project.projectType = :type', { type: ProjectType.CASH }).getCount(),
      projectsQb.clone().andWhere('project.projectType = :type', { type: ProjectType.LOAN }).getCount(),

      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.COMPLETED }).getCount(),
      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.CANCELLED }).getCount(),
      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.REJECTED }).getCount(),
      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.LOAN_PROCESS }).getCount(),
      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.PROJECT_MANAGEMENT }).getCount(),
      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.SUBSIDY_PROCESS }).getCount(),
      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.ELECTRICITY_PROCESS }).getCount(),
      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.PENDING_APPROVAL }).getCount(),
      projectsQb.clone().andWhere('project.status = :status', { status: ProjectStatus.APPROVED }).getCount(),

      projectsQb
        .clone()
        .select('COALESCE(SUM(project.finalCost), 0)', 'finalCost')
        .addSelect('COALESCE(SUM(project.projectCost), 0)', 'projectCost')
        .addSelect('COALESCE(SUM(project.expectedLagat), 0)', 'expectedLagat')
        .addSelect('COALESCE(SUM(project.expectedProfit), 0)', 'expectedProfit')
        .getRawOne(),

      projectsQb
        .clone()
        .select('project."status"::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('project."status"')
        .orderBy('value', 'DESC')
        .getRawMany(),

      projectsQb
        .clone()
        .select('project."projectType"::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('project."projectType"')
        .orderBy('value', 'DESC')
        .getRawMany(),

      projectsQb
        .clone()
        .select('COALESCE(project.branchName, \'Unassigned Branch\')', 'branchName')
        .addSelect('COUNT(*)', 'totalProjects')
        .addSelect('COALESCE(SUM(project.finalCost), 0)', 'finalCost')
        .addSelect('COALESCE(SUM(project.projectCost), 0)', 'projectCost')
        .groupBy('project.branchName')
        .orderBy('COUNT(*)', 'DESC')
        .limit(50)
        .getRawMany(),

      projectsQb
  .clone()
  .select('project.projectOwnerId', 'userId')
  .addSelect('COUNT(*)', 'totalProjects')
  .addSelect(`SUM(CASE WHEN project.projectType = :cash THEN 1 ELSE 0 END)`, 'cashProjects')
  .addSelect(`SUM(CASE WHEN project.projectType = :loan THEN 1 ELSE 0 END)`, 'loanProjects')
  .addSelect(`SUM(CASE WHEN project.status = :completed THEN 1 ELSE 0 END)`, 'completedProjects')
  .setParameters({
    cash: ProjectType.CASH,
    loan: ProjectType.LOAN,
    completed: ProjectStatus.COMPLETED,
  })
  .andWhere('project.projectOwnerId IS NOT NULL')
  .groupBy('project.projectOwnerId')
  .orderBy('COUNT(*)', 'DESC')
  .limit(50)
  .getRawMany(),
    ]);

    const rowUserIds = ownerRows
  .map((row) => Number(row.userId || 0))
  .filter(Boolean);

const rowUsers = rowUserIds.length
  ? await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...rowUserIds)', { rowUserIds })
      .getMany()
  : [];

const userNameMap = new Map(
  rowUsers.map((item) => [
    Number(item.id),
    item.name || item.email || `User #${item.id}`,
  ]),
);

    const activeProjects =
      totalProjects - completedProjects - cancelledProjects - rejectedProjects;

    return {
      department: 'PROJECTS',
      title: 'Project Intelligence Report',
      cards: {
        totalProjects,
        activeProjects,
        cashProjects,
        loanProjects,
        completedProjects,
        cancelledProjects,
        rejectedProjects,
        pendingApproval,
        approved,
        loanProcess,
        projectManagement,
        subsidyProcess,
        electricityProcess,
        finalCost: Number(valueRaw?.finalCost || 0),
        projectCost: Number(valueRaw?.projectCost || 0),
        expectedLagat: Number(valueRaw?.expectedLagat || 0),
        expectedProfit: Number(valueRaw?.expectedProfit || 0),
      },
      charts: {
        projectStatusDistribution: {
          type: 'bar',
          title: 'Project Status Distribution',
          data: statusRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },
        projectTypeDistribution: {
          type: 'bar',
          title: 'Cash vs Loan Projects',
          data: typeRows.map((row) => ({
            label: row.label || 'Unassigned',
            value: Number(row.value || 0),
          })),
        },
        projectLifecycleFunnel: {
          type: 'funnel',
          title: 'Project Lifecycle Funnel',
          data: [
            { label: 'Total Projects', value: totalProjects, percent: 100 },
            {
              label: 'Active Projects',
              value: activeProjects,
              percent: totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0,
            },
            {
              label: 'Completed Projects',
              value: completedProjects,
              percent: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
            },
            {
              label: 'Cancelled / Rejected',
              value: cancelledProjects + rejectedProjects,
              percent: totalProjects > 0 ? Math.round(((cancelledProjects + rejectedProjects) / totalProjects) * 100) : 0,
            },
          ],
        },
      },
      rows: ownerRows.map((row) => {
  const userId = row.userId ? Number(row.userId) : null;

  return {
    userId,
    name: userId ? userNameMap.get(userId) || `User #${userId}` : '-',
    totalProjects: Number(row.totalProjects || 0),
    cashProjects: Number(row.cashProjects || 0),
    loanProjects: Number(row.loanProjects || 0),
    completedProjects: Number(row.completedProjects || 0),
  };
}),
      branchRows: branchRows.map((row) => ({
        branchName: row.branchName,
        totalProjects: Number(row.totalProjects || 0),
        finalCost: Number(row.finalCost || 0),
        projectCost: Number(row.projectCost || 0),
      })),
    };
  }
}