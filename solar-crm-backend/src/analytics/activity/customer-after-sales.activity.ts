
import { Repository } from 'typeorm';

import {
  CustomerAfterSalesRequest,
  CustomerAfterSalesRequestStatus,
} from '../../customer-portal/customer-after-sales-request.entity';

import {
  CustomerComplaint,
  CustomerComplaintStatus,
} from '../../customer-portal/customer-complaint.entity';

import {
  CustomerComplaintActivity,
  CustomerComplaintActivityType,
} from '../../customer-portal/customer-complaint-activity.entity';

import { CustomerAfterSalesRequestActivity } from '../../customer-portal/customer-after-sales-request-activity.entity';

import { CustomerComplaintAttachment } from '../../customer-portal/customer-complaint-attachment.entity';

import { CustomerAfterSalesRequestRating } from '../../customer-portal/customer-after-sales-request-rating.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class CustomerAfterSalesActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'CUSTOMER_AFTER_SALES';
  readonly moduleLabel = 'Customer After-Sales & Service Management';

constructor(
  private readonly requestRepository:
    Repository<CustomerAfterSalesRequest>,

  private readonly complaintRepository:
    Repository<CustomerComplaint>,

  private readonly complaintActivityRepository:
  Repository<CustomerComplaintActivity>,

  private readonly requestActivityRepository:
  Repository<CustomerAfterSalesRequestActivity>,

  private readonly complaintAttachmentRepository:
  Repository<CustomerComplaintAttachment>,

  private readonly requestRatingRepository:
  Repository<CustomerAfterSalesRequestRating>,
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

    const assignedRequests = () =>
      this.requestRepository
        .createQueryBuilder('request')
        .where('request.assignedTo IN (:...userIds)', {
          userIds,
        })
        .andWhere('request.isHidden = :isHidden', {
          isHidden: false,
        });

    const completedRequests = () =>
      this.requestRepository
        .createQueryBuilder('request')
        .where('request.completedBy IN (:...userIds)', {
          userIds,
        })
        .andWhere('request.isHidden = :isHidden', {
          isHidden: false,
        })
        .andWhere('request.completedAt IS NOT NULL');

    const [
      totalAssigned,
      pendingAssigned,
      totalCompleted,
      periodCompleted,
    ] = await Promise.all([
      assignedRequests().getCount(),

      assignedRequests()
        .andWhere('request.status NOT IN (:...statuses)', {
          statuses: [
            CustomerAfterSalesRequestStatus.COMPLETED,
            CustomerAfterSalesRequestStatus.REJECTED,
            CustomerAfterSalesRequestStatus.CANCELLED,
          ],
        })
        .getCount(),

      completedRequests().getCount(),

      completedRequests()
        .andWhere(
          'request.completedAt >= :fromDate AND request.completedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),
    ]);

    add(
      'after_sales_assigned_total',
      'Total Assigned Service Requests',
      'ASSIGNED_WORK',
      totalAssigned,
      'assignedTo',
      'CURRENT',
    );

    add(
      'after_sales_assigned_pending',
      'Pending Assigned Service Requests',
      'ASSIGNED_WORK',
      pendingAssigned,
      'assignedTo + status',
      'CURRENT',
    );

    add(
      'after_sales_completed_total',
      'Total Completed Service Requests',
      'COMPLETED_WORK',
      totalCompleted,
      'completedBy + completedAt',
      'CURRENT',
    );

    add(
      'after_sales_completed_period',
      'Service Requests Completed During Period',
      'COMPLETED_WORK',
      periodCompleted,
      'completedBy + completedAt',
      'PERIOD',
    );

    const complaintsCreated = () =>
  this.complaintRepository
    .createQueryBuilder('complaint')
    .where('complaint.createdBy IN (:...userIds)', { userIds })
    .andWhere('complaint.isHidden = :isHidden', {
      isHidden: false,
    })
    .andWhere('complaint.createdByRole IS NOT NULL')
    .andWhere("complaint.createdByRole NOT ILIKE :customerRole", {
      customerRole: '%CUSTOMER%',
    });

const complaintsAssigned = () =>
  this.complaintRepository
    .createQueryBuilder('complaint')
    .where('complaint.assignedTo IN (:...userIds)', { userIds })
    .andWhere('complaint.isHidden = :isHidden', {
      isHidden: false,
    });

const complaintsClosed = () =>
  this.complaintRepository
    .createQueryBuilder('complaint')
    .where('complaint.closedBy IN (:...userIds)', { userIds })
    .andWhere('complaint.isHidden = :isHidden', {
      isHidden: false,
    })
    .andWhere('complaint.closedAt IS NOT NULL');

const [
  complaintsCreatedTotal,
  complaintsCreatedPeriod,
  complaintsAssignedTotal,
  complaintsAssignedPending,
  complaintsClosedTotal,
  complaintsClosedPeriod,
] = await Promise.all([
  complaintsCreated().getCount(),

  complaintsCreated()
    .andWhere(
      'complaint.createdAt >= :fromDate AND complaint.createdAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    )
    .getCount(),

  complaintsAssigned().getCount(),

  complaintsAssigned()
    .andWhere('complaint.status NOT IN (:...statuses)', {
      statuses: [
        CustomerComplaintStatus.RESOLVED,
        CustomerComplaintStatus.CLOSED,
        CustomerComplaintStatus.REJECTED,
      ],
    })
    .getCount(),

  complaintsClosed().getCount(),

  complaintsClosed()
    .andWhere(
      'complaint.closedAt >= :fromDate AND complaint.closedAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    )
    .getCount(),
]);

add(
  'customer_complaints_created_total',
  'Customer Complaints Created — Total',
  'CREATED_WORK',
  complaintsCreatedTotal,
  'createdBy',
  'CURRENT',
);

add(
  'customer_complaints_created_period',
  'Customer Complaints Created During Period',
  'CREATED_WORK',
  complaintsCreatedPeriod,
  'createdBy + createdAt',
  'PERIOD',
);

add(
  'customer_complaints_assigned_total',
  'Currently Assigned Customer Complaints',
  'ASSIGNED_WORK',
  complaintsAssignedTotal,
  'assignedTo',
  'CURRENT',
);

add(
  'customer_complaints_assigned_pending',
  'Pending Assigned Customer Complaints',
  'ASSIGNED_WORK',
  complaintsAssignedPending,
  'assignedTo + status',
  'CURRENT',
);

add(
  'customer_complaints_closed_total',
  'Customer Complaints Closed — Total',
  'COMPLETED_WORK',
  complaintsClosedTotal,
  'closedBy + closedAt',
  'CURRENT',
);

add(
  'customer_complaints_closed_period',
  'Customer Complaints Closed During Period',
  'COMPLETED_WORK',
  complaintsClosedPeriod,
  'closedBy + closedAt',
  'PERIOD',
);

const complaintActivities = () =>
  this.complaintActivityRepository
    .createQueryBuilder('activity')
    .where('activity.performedBy IN (:...userIds)', {
      userIds,
    })
    .andWhere('activity.performedByRole IS NOT NULL')
    .andWhere(
      "activity.performedByRole NOT ILIKE :customerRole",
      { customerRole: '%CUSTOMER%' },
    );

const periodComplaintActivities = () =>
  complaintActivities().andWhere(
    'activity.createdAt >= :fromDate AND activity.createdAt <= :toDate',
    {
      fromDate: context.fromDate,
      toDate: context.toDate,
    },
  );

const [
  activitiesTotal,
  activitiesPeriod,
  resolutionsPeriod,
  scheduledPeriod,
  remarksPeriod,
  rejectionsPeriod,
] = await Promise.all([
  complaintActivities().getCount(),

  periodComplaintActivities().getCount(),

  periodComplaintActivities()
    .andWhere('activity.activityType = :activityType', {
      activityType: CustomerComplaintActivityType.RESOLUTION_ADDED,
    })
    .getCount(),

  periodComplaintActivities()
    .andWhere('activity.activityType = :activityType', {
      activityType: CustomerComplaintActivityType.SERVICE_SCHEDULED,
    })
    .getCount(),

  periodComplaintActivities()
    .andWhere('activity.activityType = :activityType', {
      activityType: CustomerComplaintActivityType.STAFF_REMARK_ADDED,
    })
    .getCount(),

  periodComplaintActivities()
    .andWhere('activity.activityType = :activityType', {
      activityType: CustomerComplaintActivityType.REJECTED,
    })
    .getCount(),
]);

add(
  'customer_complaint_activities_total',
  'Customer Complaint Activities — Total',
  'UPDATED_WORK',
  activitiesTotal,
  'performedBy',
  'CURRENT',
);

add(
  'customer_complaint_activities_period',
  'Customer Complaint Activities During Period',
  'UPDATED_WORK',
  activitiesPeriod,
  'performedBy + createdAt',
  'PERIOD',
);

add(
  'customer_complaint_resolutions_period',
  'Complaint Resolution Actions During Period',
  'OUTCOME',
  resolutionsPeriod,
  'performedBy + activityType',
  'PERIOD',
);

add(
  'customer_complaint_services_scheduled_period',
  'Complaint Service Visits Scheduled During Period',
  'UPDATED_WORK',
  scheduledPeriod,
  'performedBy + activityType',
  'PERIOD',
);

add(
  'customer_complaint_remarks_period',
  'Complaint Remarks Added During Period',
  'UPDATED_WORK',
  remarksPeriod,
  'performedBy + activityType',
  'PERIOD',
);

add(
  'customer_complaint_rejections_period',
  'Complaint Rejection Actions During Period',
  'OUTCOME',
  rejectionsPeriod,
  'performedBy + activityType',
  'PERIOD',
);

const afterSalesActivities = () =>
  this.requestActivityRepository
    .createQueryBuilder('activity')
    .where('activity.performedBy IN (:...userIds)', {
      userIds,
    })
    .andWhere('activity.activityType NOT IN (:...excludedTypes)', {
      excludedTypes: [
        'REQUEST_CREATED',
        'CUSTOMER_ATTACHMENTS_UPLOADED',
      ],
    });

const periodAfterSalesActivities = () =>
  afterSalesActivities()
    .andWhere(
      'activity.createdAt >= :fromDate AND activity.createdAt <= :toDate',
      {
        fromDate: context.fromDate,
        toDate: context.toDate,
      },
    );

const [
  afterSalesActivitiesTotal,
  afterSalesActivitiesPeriod,
  afterSalesProofActionsPeriod,
] = await Promise.all([
  afterSalesActivities().getCount(),

  periodAfterSalesActivities().getCount(),

  periodAfterSalesActivities()
    .andWhere('activity.activityType = :activityType', {
      activityType: 'PROOF_UPLOADED',
    })
    .getCount(),
]);

add(
  'after_sales_activities_total',
  'After-Sales Activities — Total',
  'UPDATED_WORK',
  afterSalesActivitiesTotal,
  'performedBy',
  'CURRENT',
);

add(
  'after_sales_activities_period',
  'After-Sales Activities During Period',
  'UPDATED_WORK',
  afterSalesActivitiesPeriod,
  'performedBy + createdAt',
  'PERIOD',
);

add(
  'after_sales_proof_actions_period',
  'After-Sales Proof Upload Actions During Period',
  'UPDATED_WORK',
  afterSalesProofActionsPeriod,
  'performedBy + activityType',
  'PERIOD',
);

const complaintAttachments = () =>
  this.complaintAttachmentRepository
    .createQueryBuilder('attachment')
    .where('attachment.uploadedBy IN (:...userIds)', {
      userIds,
    })
    .andWhere('attachment.uploadedByRole IS NOT NULL')
    .andWhere("TRIM(attachment.uploadedByRole) <> ''")
    .andWhere(
      'attachment.uploadedByRole NOT ILIKE :customerRole',
      { customerRole: '%CUSTOMER%' },
    );

const periodComplaintAttachments = () =>
  complaintAttachments().andWhere(
    'attachment.createdAt >= :fromDate AND attachment.createdAt <= :toDate',
    {
      fromDate: context.fromDate,
      toDate: context.toDate,
    },
  );

const [
  complaintAttachmentsTotal,
  complaintAttachmentsPeriod,
  complaintBeforePhotosPeriod,
  complaintAfterPhotosPeriod,
  complaintCompletionPhotosPeriod,
] = await Promise.all([
  complaintAttachments().getCount(),

  periodComplaintAttachments().getCount(),

  periodComplaintAttachments()
    .andWhere('attachment.purpose = :purpose', {
      purpose: 'BEFORE_PHOTO',
    })
    .getCount(),

  periodComplaintAttachments()
    .andWhere('attachment.purpose = :purpose', {
      purpose: 'AFTER_PHOTO',
    })
    .getCount(),

  periodComplaintAttachments()
    .andWhere('attachment.purpose = :purpose', {
      purpose: 'COMPLETION_PHOTO',
    })
    .getCount(),
]);

add(
  'customer_complaint_attachments_total',
  'Complaint Attachments Uploaded — Total',
  'UPDATED_WORK',
  complaintAttachmentsTotal,
  'uploadedBy + uploadedByRole',
  'CURRENT',
);

add(
  'customer_complaint_attachments_period',
  'Complaint Attachments Uploaded During Period',
  'UPDATED_WORK',
  complaintAttachmentsPeriod,
  'uploadedBy + uploadedByRole + createdAt',
  'PERIOD',
);

add(
  'customer_complaint_before_photos_period',
  'Complaint Before Photos Uploaded During Period',
  'UPDATED_WORK',
  complaintBeforePhotosPeriod,
  'uploadedBy + purpose',
  'PERIOD',
);

add(
  'customer_complaint_after_photos_period',
  'Complaint After Photos Uploaded During Period',
  'UPDATED_WORK',
  complaintAfterPhotosPeriod,
  'uploadedBy + purpose',
  'PERIOD',
);

add(
  'customer_complaint_completion_photos_period',
  'Complaint Completion Photos Uploaded During Period',
  'UPDATED_WORK',
  complaintCompletionPhotosPeriod,
  'uploadedBy + purpose',
  'PERIOD',
);

const serviceRatings = () =>
  this.requestRatingRepository
    .createQueryBuilder('rating')
    .innerJoin(
      CustomerAfterSalesRequest,
      'request',
      'request.id = rating.requestId',
    )
    .where('request.completedBy IN (:...userIds)', {
      userIds,
    })
    .andWhere('request.completedAt IS NOT NULL')
    .andWhere('request.isHidden = :isHidden', {
      isHidden: false,
    });

const periodServiceRatings = () =>
  serviceRatings().andWhere(
    'rating.createdAt >= :fromDate AND rating.createdAt <= :toDate',
    {
      fromDate: context.fromDate,
      toDate: context.toDate,
    },
  );

const [
  ratingsTotal,
  ratingsPeriod,
  positiveRatingsPeriod,
  negativeRatingsPeriod,
  recommendationsPeriod,
] = await Promise.all([
  serviceRatings().getCount(),

  periodServiceRatings().getCount(),

  periodServiceRatings()
    .andWhere('rating.rating >= :minimumRating', {
      minimumRating: 4,
    })
    .getCount(),

  periodServiceRatings()
    .andWhere('rating.rating <= :maximumRating', {
      maximumRating: 2,
    })
    .getCount(),

  periodServiceRatings()
    .andWhere('rating.wouldRecommend = :wouldRecommend', {
      wouldRecommend: true,
    })
    .getCount(),
]);

add(
  'after_sales_ratings_total',
  'Customer Ratings Received — Total',
  'OUTCOME',
  ratingsTotal,
  'request.completedBy + rating.requestId',
  'CURRENT',
);

add(
  'after_sales_ratings_period',
  'Customer Ratings Received During Period',
  'OUTCOME',
  ratingsPeriod,
  'request.completedBy + rating.createdAt',
  'PERIOD',
);

add(
  'after_sales_positive_ratings_period',
  'Positive Customer Ratings During Period',
  'OUTCOME',
  positiveRatingsPeriod,
  'completedBy + rating >= 4',
  'PERIOD',
);

add(
  'after_sales_negative_ratings_period',
  'Negative Customer Ratings During Period',
  'OUTCOME',
  negativeRatingsPeriod,
  'completedBy + rating <= 2',
  'PERIOD',
);

add(
  'after_sales_recommendations_period',
  'Customers Willing to Recommend During Period',
  'OUTCOME',
  recommendationsPeriod,
  'completedBy + wouldRecommend',
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
