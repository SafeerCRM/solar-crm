import { Repository } from 'typeorm';

import { User } from '../../users/user.entity';
import {
  CustomerComplaint,
  CustomerComplaintPriority,
  CustomerComplaintStatus,
} from '../../customer-portal/customer-complaint.entity';
import {
  DealerComplaint,
  DealerComplaintStatus,
} from '../../dealer/dealer-complaint.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
  normalizeAnalyticsText,
  canViewAllAnalytics,
} from '../helpers/analytics-filter.helper';

export class CustomerAnalyticsBuilder {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly customerComplaintRepository: Repository<CustomerComplaint>,
    private readonly dealerComplaintRepository: Repository<DealerComplaint>,
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


    const customerQb = this.customerComplaintRepository
      .createQueryBuilder('complaint')
      .where('complaint.isHidden = false')
      .andWhere('complaint.createdAt BETWEEN :start AND :end', {
        start,
        end,
      });

    if (userIds.length) {
      customerQb.andWhere(
        `(
          complaint.assignedTo IN (:...userIds)
          OR complaint.createdBy IN (:...userIds)
          OR complaint.projectOwnerId IN (:...userIds)
        )`,
        { userIds },
      );
    }

    const branchName = normalizeAnalyticsText(query.branchName);
    if (branchName) {
      customerQb.andWhere(
        'LOWER(COALESCE(complaint.branchName, \'\')) LIKE :branchName',
        { branchName: `%${branchName}%` },
      );
    }

    const dealerQb = this.dealerComplaintRepository
      .createQueryBuilder('dealerComplaint')
      .where('dealerComplaint.createdAt BETWEEN :start AND :end', {
        start,
        end,
      });

    if (userIds.length) {
      dealerQb.andWhere(
        `(
          dealerComplaint.createdBy IN (:...userIds)
          OR dealerComplaint.lastResponseBy IN (:...userIds)
        )`,
        { userIds },
      );
    }

    const [
      customerComplaints,
      customerOpen,
      customerAssigned,
      customerInProgress,
      customerResolved,
      customerClosed,
      customerRejected,
      urgentComplaints,
      highComplaints,
      dealerComplaints,
      dealerOpen,
      dealerInProgress,
      dealerResolved,
      dealerClosed,
      customerStatusRows,
      customerPriorityRows,
      dealerStatusRows,
      branchRows,
      assigneeRows,
    ] = await Promise.all([
      customerQb.clone().getCount(),

      customerQb
        .clone()
        .andWhere('complaint.status = :status', {
          status: CustomerComplaintStatus.OPEN,
        })
        .getCount(),

      customerQb
        .clone()
        .andWhere('complaint.status = :status', {
          status: CustomerComplaintStatus.ASSIGNED,
        })
        .getCount(),

      customerQb
        .clone()
        .andWhere('complaint.status = :status', {
          status: CustomerComplaintStatus.IN_PROGRESS,
        })
        .getCount(),

      customerQb
        .clone()
        .andWhere('complaint.status = :status', {
          status: CustomerComplaintStatus.RESOLVED,
        })
        .getCount(),

      customerQb
        .clone()
        .andWhere('complaint.status = :status', {
          status: CustomerComplaintStatus.CLOSED,
        })
        .getCount(),

      customerQb
        .clone()
        .andWhere('complaint.status = :status', {
          status: CustomerComplaintStatus.REJECTED,
        })
        .getCount(),

      customerQb
        .clone()
        .andWhere('complaint.priority = :priority', {
          priority: CustomerComplaintPriority.URGENT,
        })
        .getCount(),

      customerQb
        .clone()
        .andWhere('complaint.priority = :priority', {
          priority: CustomerComplaintPriority.HIGH,
        })
        .getCount(),

      dealerQb.clone().getCount(),

      dealerQb
        .clone()
        .andWhere('dealerComplaint.status = :status', {
          status: DealerComplaintStatus.OPEN,
        })
        .getCount(),

      dealerQb
        .clone()
        .andWhere('dealerComplaint.status = :status', {
          status: DealerComplaintStatus.IN_PROGRESS,
        })
        .getCount(),

      dealerQb
        .clone()
        .andWhere('dealerComplaint.status = :status', {
          status: DealerComplaintStatus.RESOLVED,
        })
        .getCount(),

      dealerQb
        .clone()
        .andWhere('dealerComplaint.status = :status', {
          status: DealerComplaintStatus.CLOSED,
        })
        .getCount(),

      customerQb
        .clone()
        .select('complaint."status"::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('complaint."status"')
        .orderBy('value', 'DESC')
        .getRawMany(),

      customerQb
        .clone()
        .select('complaint."priority"::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('complaint."priority"')
        .orderBy('value', 'DESC')
        .getRawMany(),

      dealerQb
  .clone()
  .select('"dealerComplaint"."status"::text', 'label')
  .addSelect('COUNT(*)', 'value')
  .groupBy('"dealerComplaint"."status"')
  .orderBy('value', 'DESC')
  .getRawMany(),

      customerQb
        .clone()
        .select('COALESCE(complaint.branchName, \'Unassigned Branch\')', 'branchName')
        .addSelect('COUNT(*)', 'customerComplaints')
        .addSelect(
          `SUM(CASE WHEN complaint.status = :open THEN 1 ELSE 0 END)`,
          'openComplaints',
        )
        .addSelect(
          `SUM(CASE WHEN complaint.status = :resolved THEN 1 ELSE 0 END)`,
          'resolvedComplaints',
        )
        .setParameters({
          open: CustomerComplaintStatus.OPEN,
          resolved: CustomerComplaintStatus.RESOLVED,
        })
        .groupBy('complaint.branchName')
        .orderBy('COUNT(*)', 'DESC')
        .limit(50)
        .getRawMany(),

      customerQb
        .clone()
        .select('complaint.assignedTo', 'userId')
        .addSelect('COALESCE(complaint.assignedToName, \'Unassigned\')', 'name')
        .addSelect('COUNT(*)', 'totalComplaints')
        .addSelect(
          `SUM(CASE WHEN complaint.status = :open THEN 1 ELSE 0 END)`,
          'openComplaints',
        )
        .addSelect(
          `SUM(CASE WHEN complaint.status = :resolved THEN 1 ELSE 0 END)`,
          'resolvedComplaints',
        )
        .setParameters({
          open: CustomerComplaintStatus.OPEN,
          resolved: CustomerComplaintStatus.RESOLVED,
        })
        .andWhere('complaint.assignedTo IS NOT NULL')
        .groupBy('complaint.assignedTo')
        .addGroupBy('complaint.assignedToName')
        .orderBy('COUNT(*)', 'DESC')
        .limit(50)
        .getRawMany(),
    ]);

    const totalComplaints = customerComplaints + dealerComplaints;
    const totalOpen = customerOpen + dealerOpen;
    const totalResolved = customerResolved + dealerResolved;
    const totalClosed = customerClosed + dealerClosed;

    const resolutionPercent =
      totalComplaints > 0
        ? Math.round(((totalResolved + totalClosed) / totalComplaints) * 100)
        : 0;

    return {
      department: 'CUSTOMERS',
      title: 'Customer Intelligence Report',
      cards: {
        totalComplaints,
        customerComplaints,
        dealerComplaints,
        totalOpen,
        customerOpen,
        dealerOpen,
        customerAssigned,
        customerInProgress,
        customerResolved,
        customerClosed,
        customerRejected,
        urgentComplaints,
        highComplaints,
        dealerInProgress,
        dealerResolved,
        dealerClosed,
        resolutionPercent,
      },
      charts: {
        customerComplaintStatusDistribution: {
          type: 'bar',
          title: 'Customer Complaint Status Distribution',
          data: customerStatusRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },
        customerComplaintPriorityDistribution: {
          type: 'bar',
          title: 'Customer Complaint Priority Distribution',
          data: customerPriorityRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },
        dealerComplaintStatusDistribution: {
          type: 'bar',
          title: 'Dealer Complaint Status Distribution',
          data: dealerStatusRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },
        complaintResolutionFunnel: {
          type: 'funnel',
          title: 'Complaint Resolution Funnel',
          data: [
            { label: 'Total Complaints', value: totalComplaints, percent: 100 },
            {
              label: 'Open Complaints',
              value: totalOpen,
              percent:
                totalComplaints > 0
                  ? Math.round((totalOpen / totalComplaints) * 100)
                  : 0,
            },
            {
              label: 'Resolved / Closed',
              value: totalResolved + totalClosed,
              percent: resolutionPercent,
            },
          ],
        },
      },
      rows: assigneeRows.map((row) => ({
        userId: row.userId ? Number(row.userId) : null,
        name: row.name,
        totalComplaints: Number(row.totalComplaints || 0),
        openComplaints: Number(row.openComplaints || 0),
        resolvedComplaints: Number(row.resolvedComplaints || 0),
      })),
      branchRows: branchRows.map((row) => ({
        branchName: row.branchName,
        customerComplaints: Number(row.customerComplaints || 0),
        openComplaints: Number(row.openComplaints || 0),
        resolvedComplaints: Number(row.resolvedComplaints || 0),
      })),
    };
  }
}