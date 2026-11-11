import { Repository } from 'typeorm';

import { ProjectDealerOrder } from '../../project/project-dealer-order.entity';
import {
  ProjectDealerPayment,
  ProjectDealerPaymentStatus,
} from '../../project/project-dealer-payment.entity';
import { ProjectDealerComment } from '../../project/project-dealer-comment.entity';
import { ProjectDealerNotification } from '../../project/project-dealer-notification.entity';

import { DealerComplaint } from '../../dealer/dealer-complaint.entity';
import { DealerAnnouncement } from '../../dealer/dealer-announcement.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class DealerOperationsActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'DEALER_OPERATIONS';
  readonly moduleLabel = 'Dealer Operations & Support';

  constructor(
    private readonly orderRepository:
      Repository<ProjectDealerOrder>,

    private readonly paymentRepository:
      Repository<ProjectDealerPayment>,

    private readonly commentRepository:
      Repository<ProjectDealerComment>,

    private readonly notificationRepository:
      Repository<ProjectDealerNotification>,

    private readonly complaintRepository:
      Repository<DealerComplaint>,

    private readonly announcementRepository:
      Repository<DealerAnnouncement>,
  ) {}

  async build(
    context: AnalyticsActivityContext,
  ): Promise<AnalyticsActivitySection> {
    const userIds = context.userIds;

    const metrics: AnalyticsActivitySection['metrics'] = [];

    if (!userIds.length) {
      return {
        moduleKey: this.moduleKey,
        moduleLabel: this.moduleLabel,
        metrics,
        hasActivity: false,
      };
    }

    const add = (
      key: string,
      label: string,
      kind: AnalyticsActivitySection['metrics'][number]['kind'],
      value: number,
      attribution: string,
      timeScope: 'CURRENT' | 'PERIOD',
    ) => {
      metrics.push({
        key,
        label,
        kind,
        value,
        attribution,
        timeScope,
        unit: 'COUNT',
      });
    };

    // 1. Dealer Order Staff Referrals

const referredOrders = () =>
  this.orderRepository
    .createQueryBuilder('dealerOrder')
    .where(
      'dealerOrder.referredByStaffId IN (:...userIds)',
      { userIds },
    )
    .andWhere('dealerOrder.isHidden = :isHidden', {
      isHidden: false,
    });

const [
  totalReferredOrders,
  periodReferredOrders,
] = await Promise.all([
  referredOrders().getCount(),

  referredOrders()
    .andWhere(
      'dealerOrder.createdAt >= :fromDate AND dealerOrder.createdAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    )
    .getCount(),
]);

add(
  'dealer_staff_referrals_total',
  'Total Dealer Orders Referred',
  'PIPELINE',
  totalReferredOrders,
  'referredByStaffId',
  'CURRENT',
);

add(
  'dealer_staff_referrals_period',
  'Dealer Orders Referred During Period',
  'PIPELINE',
  periodReferredOrders,
  'referredByStaffId',
  'PERIOD',
);

// 2. Dealer Payment Approvals

const approvedPayments = () =>
  this.paymentRepository
    .createQueryBuilder('payment')
    .where('payment.approvedBy IN (:...userIds)', {
      userIds,
    })
    .andWhere('payment.status = :status', {
      status: ProjectDealerPaymentStatus.APPROVED,
    })
    .andWhere('payment.approvedAt IS NOT NULL');

const [
  totalApprovedPayments,
  periodApprovedPayments,
  totalApprovedAmount,
  periodApprovedAmount,
] = await Promise.all([
  approvedPayments().getCount(),

  approvedPayments()
    .andWhere(
      'payment.approvedAt >= :fromDate AND payment.approvedAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    )
    .getCount(),

  approvedPayments()
    .select('COALESCE(SUM(payment.amount), 0)', 'total')
    .getRawOne(),

  approvedPayments()
    .andWhere(
      'payment.approvedAt >= :fromDate AND payment.approvedAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    )
    .select('COALESCE(SUM(payment.amount), 0)', 'total')
    .getRawOne(),
]);

add(
  'dealer_payments_approved_total',
  'Total Dealer Payments Approved',
  'COMPLETED_WORK',
  totalApprovedPayments,
  'approvedBy',
  'CURRENT',
);

add(
  'dealer_payments_approved_period',
  'Dealer Payments Approved During Period',
  'COMPLETED_WORK',
  periodApprovedPayments,
  'approvedBy + approvedAt',
  'PERIOD',
);

metrics.push({
  key: 'dealer_payments_approved_amount_total',
  label: 'Total Dealer Payment Amount Approved',
  kind: 'FINANCIAL',
  value: Number(totalApprovedAmount?.total || 0),
  unit: 'INR',
  attribution: 'approvedBy',
  timeScope: 'CURRENT',
});

metrics.push({
  key: 'dealer_payments_approved_amount_period',
  label: 'Dealer Payment Amount Approved During Period',
  kind: 'FINANCIAL',
  value: Number(periodApprovedAmount?.total || 0),
  unit: 'INR',
  attribution: 'approvedBy + approvedAt',
  timeScope: 'PERIOD',
});

// 3. Dealer Order Comments

const employeeDealerComments = () =>
  this.commentRepository
    .createQueryBuilder('comment')
    .where('comment.createdBy IN (:...userIds)', {
      userIds,
    })
    .andWhere('comment.createdByRole IS NOT NULL')
    .andWhere("TRIM(comment.createdByRole) <> ''")
    .andWhere(
      'comment.createdByRole NOT ILIKE :dealerRole',
      {
        dealerRole: '%DEALER%',
      },
    );

const [
  totalEmployeeComments,
  periodEmployeeComments,
] = await Promise.all([
  employeeDealerComments().getCount(),

  employeeDealerComments()
    .andWhere(
      'comment.createdAt >= :fromDate AND comment.createdAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    )
    .getCount(),
]);

add(
  'dealer_order_comments_total',
  'Total Dealer Order Comments Added',
  'UPDATED_WORK',
  totalEmployeeComments,
  'createdBy + createdByRole',
  'CURRENT',
);

add(
  'dealer_order_comments_period',
  'Dealer Order Comments Added During Period',
  'UPDATED_WORK',
  periodEmployeeComments,
  'createdBy + createdByRole + createdAt',
  'PERIOD',
);

// 4. Dealer Complaint Management

const employeeCreatedComplaints = () =>
  this.complaintRepository
    .createQueryBuilder('complaint')
    .where('complaint.createdBy IN (:...userIds)', {
      userIds,
    })
    .andWhere('complaint.createdByRole IS NOT NULL')
    .andWhere("TRIM(complaint.createdByRole) <> ''")
    .andWhere(
      'complaint.createdByRole NOT ILIKE :dealerRole',
      {
        dealerRole: '%DEALER%',
      },
    );

const employeeRespondedComplaints = () =>
  this.complaintRepository
    .createQueryBuilder('complaint')
    .where('complaint.lastResponseBy IN (:...userIds)', {
      userIds,
    })
    .andWhere('complaint.lastResponseAt IS NOT NULL');

const [
  totalCreatedComplaints,
  periodCreatedComplaints,
  totalRespondedComplaints,
  periodRespondedComplaints,
] = await Promise.all([
  employeeCreatedComplaints().getCount(),

  employeeCreatedComplaints()
    .andWhere(
      'complaint.createdAt >= :fromDate AND complaint.createdAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    )
    .getCount(),

  employeeRespondedComplaints().getCount(),

  employeeRespondedComplaints()
    .andWhere(
      'complaint.lastResponseAt >= :fromDate AND complaint.lastResponseAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    )
    .getCount(),
]);

add(
  'dealer_complaints_created_total',
  'Total Dealer Complaints Created by Staff',
  'CREATED_WORK',
  totalCreatedComplaints,
  'createdBy + createdByRole',
  'CURRENT',
);

add(
  'dealer_complaints_created_period',
  'Dealer Complaints Created During Period',
  'CREATED_WORK',
  periodCreatedComplaints,
  'createdBy + createdByRole + createdAt',
  'PERIOD',
);

add(
  'dealer_complaints_last_responded_total',
  'Dealer Complaints Last Responded to by Staff',
  'UPDATED_WORK',
  totalRespondedComplaints,
  'lastResponseBy',
  'CURRENT',
);

add(
  'dealer_complaints_last_responded_period',
  'Dealer Complaints Last Responded to During Period',
  'UPDATED_WORK',
  periodRespondedComplaints,
  'lastResponseBy + lastResponseAt',
  'PERIOD',
);

// 5. Dealer Announcements

const employeeAnnouncements = () =>
  this.announcementRepository
    .createQueryBuilder('announcement')
    .where('announcement.createdBy IN (:...userIds)', {
      userIds,
    })
    .andWhere('announcement.isHidden = :isHidden', {
      isHidden: false,
    });

const publishedAnnouncements = () =>
  employeeAnnouncements()
    .andWhere('announcement.publishedAt IS NOT NULL');

const [
  totalAnnouncementsCreated,
  periodAnnouncementsCreated,
  totalAnnouncementsPublished,
  periodAnnouncementsPublished,
] = await Promise.all([
  employeeAnnouncements().getCount(),

  employeeAnnouncements()
    .andWhere(
      'announcement.createdAt >= :fromDate AND announcement.createdAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    )
    .getCount(),

  publishedAnnouncements().getCount(),

  publishedAnnouncements()
    .andWhere(
      'announcement.publishedAt >= :fromDate AND announcement.publishedAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    )
    .getCount(),
]);

add(
  'dealer_announcements_created_total',
  'Total Dealer Announcements Created',
  'CREATED_WORK',
  totalAnnouncementsCreated,
  'createdBy',
  'CURRENT',
);

add(
  'dealer_announcements_created_period',
  'Dealer Announcements Created During Period',
  'CREATED_WORK',
  periodAnnouncementsCreated,
  'createdBy + createdAt',
  'PERIOD',
);

add(
  'dealer_announcements_published_total',
  'Total Dealer Announcements Published',
  'OUTCOME',
  totalAnnouncementsPublished,
  'createdBy + publishedAt',
  'CURRENT',
);

add(
  'dealer_announcements_published_period',
  'Dealer Announcements Published During Period',
  'OUTCOME',
  periodAnnouncementsPublished,
  'createdBy + publishedAt',
  'PERIOD',
);

// 6. Manual Dealer Notifications

const manualDealerNotifications = () =>
  this.notificationRepository
    .createQueryBuilder('notification')
    .where('notification.createdBy IN (:...userIds)', {
      userIds,
    })
    .andWhere('notification.notificationType = :type', {
      type: 'GENERAL',
    });

const [
  totalManualNotifications,
  periodManualNotifications,
] = await Promise.all([
  manualDealerNotifications().getCount(),

  manualDealerNotifications()
    .andWhere(
      'notification.createdAt >= :fromDate AND notification.createdAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    )
    .getCount(),
]);

add(
  'dealer_manual_notifications_total',
  'Total Manual Dealer Notifications',
  'CREATED_WORK',
  totalManualNotifications,
  'createdBy + notificationType',
  'CURRENT',
);

add(
  'dealer_manual_notifications_period',
  'Manual Dealer Notifications During Period',
  'CREATED_WORK',
  periodManualNotifications,
  'createdBy + notificationType + createdAt',
  'PERIOD',
);

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity: metrics.some(
        (metric) =>
          metric.value !== null &&
          metric.value > 0,
      ),
    };
  }
}