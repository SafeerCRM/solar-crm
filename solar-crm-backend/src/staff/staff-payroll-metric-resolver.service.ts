import {
  BadRequestException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import {
  StaffPayrollIncentiveComponent,
  StaffPayrollMetricType,
} from './staff-payroll-rule.entity';

import {
  Project,
  ProjectApprovalStatus,
  ProjectStatus,
} from '../project/project.entity';

import {
  Meeting,
  MeetingStatus,
  MeetingType,
} from '../meeting/meeting.entity';

import { ProjectPaymentReceipt } from '../project/project-payment-receipt.entity';

import {
  Lead,
} from '../leads/lead.entity';

import {
  StaffMember,
} from './staff-member.entity';

import {
  ProjectTradingMeeting,
  ProjectTradingMeetingStatus,
} from '../project/project-trading-meeting.entity';

import {
  ProjectDealerOrder,
  ProjectDealerOrderStatus,
} from '../project/project-dealer-order.entity';

import {
  ProjectDealerOrderItem,
} from '../project/project-dealer-order-item.entity';

import {
  ProjectStockItem,
} from '../project/project-stock-item.entity';
import { CallLog } from '../telecalling/call-log.entity';

import {
  StaffAttendance,
} from './staff-attendance.entity';

import {
  RecruitmentCandidate,
  RecruitmentStage,
} from './recruitment-candidate.entity';


export type StaffPayrollMetricRequest = {
  metricType: StaffPayrollMetricType;

  /*
   * StaffMember database ID.
   */
  staffId: number;

  /*
   * User ID linked to StaffMember.
   *
   * Project journey attribution fields store
   * User IDs, not StaffMember IDs.
   */
  linkedUserId?: number | null;

  /*
   * Current CRM role of the staff member.
   */
  staffRole?: string | null;

  periodStart: Date;

/*
 * Exclusive end boundary.
 *
 * Example:
 * 1 July 00:00 <= metric date < 1 August 00:00
 */
periodEnd: Date;

/*
 * Owner-configured number of attendance days
 * required for 100% salary.
 *
 * Examples:
 * 26 days when four monthly holidays are
 * allowed, or 25 days after a future policy
 * change.
 *
 * This value must come from the active payroll
 * rule. It must never be hardcoded inside the
 * metric resolver.
 */
attendanceTargetDays?: number | null;

/*
 * Owner-configured salary target used by
 * percentage-based payroll metrics such as
 * payment collection percentage.
 */
salaryTargetValue?: number | null;
};

@Injectable()
export class StaffPayrollMetricResolverService {

      constructor(
  @InjectRepository(Project)
  private readonly projectRepository:
    Repository<Project>,


  @InjectRepository(ProjectPaymentReceipt)
  private readonly projectPaymentReceiptRepository:
    Repository<ProjectPaymentReceipt>,

  @InjectRepository(Meeting)
  private readonly meetingRepository:
    Repository<Meeting>,

    @InjectRepository(Lead)
private readonly leadRepository:
  Repository<Lead>,

  @InjectRepository(StaffMember)
private readonly staffMemberRepository:
  Repository<StaffMember>,

  @InjectRepository(ProjectTradingMeeting)
private readonly projectTradingMeetingRepository:
  Repository<ProjectTradingMeeting>,

@InjectRepository(ProjectDealerOrder)
private readonly projectDealerOrderRepository:
  Repository<ProjectDealerOrder>,

  @InjectRepository(ProjectDealerOrderItem)
private readonly projectDealerOrderItemRepository:
  Repository<ProjectDealerOrderItem>,

@InjectRepository(ProjectStockItem)
private readonly projectStockItemRepository:
  Repository<ProjectStockItem>,

  @InjectRepository(CallLog)
private readonly callLogRepository:
  Repository<CallLog>,

    @InjectRepository(StaffAttendance)
  private readonly staffAttendanceRepository:
    Repository<StaffAttendance>,

    @InjectRepository(RecruitmentCandidate)
private readonly recruitmentCandidateRepository:
  Repository<RecruitmentCandidate>,
) {}

    private getLinkedUserId(
    request: StaffPayrollMetricRequest,
  ): number {
    const linkedUserId = Number(
      request.linkedUserId || 0,
    );

    if (
      !Number.isInteger(linkedUserId) ||
      linkedUserId <= 0
    ) {
      throw new BadRequestException(
        `Staff member ${request.staffId} is not linked to a CRM user. Project metrics cannot be calculated.`,
      );
    }

    return linkedUserId;
  }

  private async getStaffMemberId(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId =
    this.getLinkedUserId(request);

  const staff =
    await this.staffMemberRepository
      .createQueryBuilder('staff')
      .select([
        'staff.id',
      ])
      .where(
        'staff.linkedUserId = :linkedUserId',
        {
          linkedUserId,
        },
      )
      .andWhere(
        'COALESCE(staff.isHidden, false) = false',
      )
      .getOne();

  if (!staff?.id) {
    throw new BadRequestException(
      `No active staff record is linked to CRM user ${linkedUserId}`,
    );
  }

  return Number(staff.id);
}

  private normalizeStaffRole(
    request: StaffPayrollMetricRequest,
  ): string {
    return String(
      request.staffRole || '',
    )
      .trim()
      .toUpperCase();
  }

  private validateMetricPeriod(
    request: StaffPayrollMetricRequest,
  ) {
    const periodStart =
      new Date(request.periodStart);

    const periodEnd =
      new Date(request.periodEnd);

    if (
      Number.isNaN(periodStart.getTime()) ||
      Number.isNaN(periodEnd.getTime())
    ) {
      throw new BadRequestException(
        'Valid payroll period is required',
      );
    }

    if (
      periodEnd.getTime() <=
      periodStart.getTime()
    ) {
      throw new BadRequestException(
        'Payroll period end must be after payroll period start',
      );
    }

    return {
      periodStart,
      periodEnd,
    };
  }

  private createPayrollEligibleProjectQuery(
    request: StaffPayrollMetricRequest,
  ): SelectQueryBuilder<Project> {
    const {
      periodStart,
      periodEnd,
    } = this.validateMetricPeriod(
      request,
    );

    /*
 * Payroll project eligibility rule:
 *
 * A project becomes eligible on the exact date when
 * cumulative approved payment receipts first reach
 * at least 20% of the project amount.
 *
 * Project amount priority:
 * finalCost -> netAmount -> projectCost
 *
 * Receipt approval compatibility:
 *
 * 1. Receipts directly marked APPROVED are counted.
 *
 * 2. Older receipts still marked PENDING are also
 *    counted when their parent installment was later
 *    approved. The existing payment approval workflow
 *    approves the installment but does not always update
 *    the receipt's approvalStatus.
 *
 * The project is attributed only to the payroll month
 * in which the running approved receipt total first
 * crosses the 20% threshold.
 */
const projectAmountSql = `
  COALESCE(
    NULLIF(project."finalCost", 0),
    NULLIF(project."netAmount", 0),
    NULLIF(project."projectCost", 0),
    0
  )
`;

const paymentEligibilityDateSql = `
  (
    SELECT
      MIN(threshold_row."eligibilityDate")

    FROM (
      SELECT
        approved_receipt."eligibilityDate",

        SUM(
          approved_receipt."receivedAmount"
        ) OVER (
          ORDER BY
            approved_receipt."eligibilityDate" ASC,
            approved_receipt."receiptId" ASC

          ROWS BETWEEN
            UNBOUNDED PRECEDING
            AND CURRENT ROW
        ) AS "runningTotal"

      FROM (
        SELECT
          receipt.id AS "receiptId",

          COALESCE(
            receipt."receivedAmount",
            0
          ) AS "receivedAmount",

          COALESCE(
            receipt."approvedAt",
            installment."approvedAt",
            receipt."paymentDate",
            receipt."createdAt"
          ) AS "eligibilityDate"

        FROM project_payment_receipts receipt

        INNER JOIN project_payment_installments installment
          ON installment.id =
            receipt."installmentId"

        WHERE
          receipt."projectId" = project.id

          AND COALESCE(
            receipt."isHidden",
            false
          ) = false

          AND COALESCE(
            installment."isHidden",
            false
          ) = false

          AND COALESCE(
            receipt."receivedAmount",
            0
          ) > 0

          AND (
            receipt."approvalStatus" = 'APPROVED'

            OR (
              receipt."approvalStatus" = 'PENDING'
              AND installment."approvalStatus" = 'APPROVED'
            )
          )
      ) approved_receipt
    ) threshold_row

    WHERE
      threshold_row."runningTotal" >=
        (${projectAmountSql} * 0.20)
  )
`;

return this.projectRepository
  .createQueryBuilder('project')
  .where(
    'project.ownerApprovalStatus = :ownerApprovalStatus',
    {
      ownerApprovalStatus:
        ProjectApprovalStatus.APPROVED,
    },
  )
  .andWhere(
    'COALESCE(project.isHidden, false) = false',
  )
  .andWhere(
    `project.status NOT IN (:...excludedStatuses)`,
    {
      excludedStatuses: [
        ProjectStatus.CANCELLED,
        ProjectStatus.REJECTED,
      ],
    },
  )
  .andWhere(
    'COALESCE(project.isLegacyProject, false) = false',
  )
  .andWhere(
    `${projectAmountSql} > 0`,
  )
  .andWhere(
    `${paymentEligibilityDateSql} >= :periodStart`,
    {
      periodStart,
    },
  )
  .andWhere(
    `${paymentEligibilityDateSql} < :periodEnd`,
    {
      periodEnd,
    },
  );
  }

  private applyApprovedProjectStaffAttribution(
    query:
      SelectQueryBuilder<Project>,

    request:
      StaffPayrollMetricRequest,
  ): SelectQueryBuilder<Project> {
    const linkedUserId =
      this.getLinkedUserId(request);

    const role =
      this.normalizeStaffRole(request);

    switch (role) {
      case 'TELECALLER':
        query.andWhere(
          'project.telecallerId = :linkedUserId',
          {
            linkedUserId,
          },
        );
        break;

      case 'TELECALLING_ASSISTANT':
        query.andWhere(
          'project.telecallingAssistantId = :linkedUserId',
          {
            linkedUserId,
          },
        );
        break;

      case 'LEAD_MANAGER':
      case 'LEAD_EXECUTIVE':
        query.andWhere(
          'project.leadManagerId = :linkedUserId',
          {
            linkedUserId,
          },
        );
        break;

      case 'MEETING_MANAGER':
  query.andWhere(
    'project.meetingManagerId = :linkedUserId',
    {
      linkedUserId,
    },
  );
  break;

case 'MEETING_ASSISTANT':
  query.andWhere(
    `
    EXISTS (
      SELECT 1
      FROM meetings payrollMeeting
      WHERE payrollMeeting.id =
        project."meetingId"
      AND payrollMeeting."createdBy" =
        :linkedUserId
    )
    `,
    {
      linkedUserId,
    },
  );
  break;

      case 'SOLAR_FRANCHISE':
        query.andWhere(
          `(
            project.solarFranchiseUserId = :linkedUserId

            OR (
              project.projectOwnerId = :linkedUserId
              AND UPPER(
                TRIM(
                  COALESCE(
                    project.projectOwnerRole,
                    ''
                  )
                )
              ) = :solarFranchiseRole
            )
          )`,
          {
            linkedUserId,
            solarFranchiseRole:
              'SOLAR_FRANCHISE',
          },
        );
        break;

      default:
        throw new BadRequestException(
          `Approved Projects attribution is not configured for role ${role || 'UNKNOWN'}`,
        );
    }

    return query;
  }

  async resolveSequentialProjectMarginSlab(
  request: StaffPayrollMetricRequest,
  component: StaffPayrollIncentiveComponent,
): Promise<number> {
  const slabRules =
    Array.isArray(
      component.slabRules,
    )
      ? component.slabRules
      : [];

  if (!slabRules.length) {
    throw new BadRequestException(
      `Sequential project margin slabs are not configured for incentive "${component.label}"`,
    );
  }

  /*
   * Reuse the existing payroll project
   * eligibility definition.
   *
   * This preserves:
   * - owner approval
   * - non-hidden status
   * - cancellation/rejection exclusion
   * - non-legacy restriction
   * - existing payroll month eligibility
   */
  const query =
    this.createPayrollEligibleProjectQuery(
      request,
    );

  /*
   * Reuse the existing staff attribution logic.
   *
   * For Solar Franchise this uses:
   * solarFranchiseUserId, or the legacy
   * project-owner franchise attribution.
   */
  this.applyApprovedProjectStaffAttribution(
    query,
    request,
  );

  const projectRows =
    await query
      .select(
        'project.id',
        'projectId',
      )
      .addSelect(
        `
        COALESCE(
          project."applicableMargin",
          0
        )
        `,
        'applicableMargin',
      )
      .addSelect(
        `
        COALESCE(
          project."orderDate",
          project."ownerApprovedAt",
          project."createdAt"
        )
        `,
        'sequenceDate',
      )
      .orderBy(
        `
        COALESCE(
          project."orderDate",
          project."ownerApprovedAt",
          project."createdAt"
        )
        `,
        'ASC',
      )
      .addOrderBy(
        'project.id',
        'ASC',
      )
      .getRawMany<{
        projectId:
          string | number;

        applicableMargin:
          string | number | null;

        sequenceDate:
          string | Date | null;
      }>();

  let totalPayout = 0;

  projectRows.forEach(
    (
      projectRow,
      projectIndex,
    ) => {
      /*
       * Project position is one-based:
       *
       * first project  = 1
       * fifth project  = 5
       */
      const projectPosition =
        projectIndex + 1;

      const matchedSlab =
        slabRules.find(
          (slab) => {
            const minimumValue =
              Math.max(
                Number(
                  slab.minimumValue ||
                    0,
                ),
                0,
              );

            const maximumValue =
              slab.maximumValue ===
                null ||
              slab.maximumValue ===
                undefined
                ? null
                : Math.max(
                    Number(
                      slab.maximumValue,
                    ),
                    0,
                  );

            return (
              projectPosition >=
                minimumValue &&
              (
                maximumValue ===
                  null ||
                projectPosition <=
                  maximumValue
              )
            );
          },
        );

      if (!matchedSlab) {
        return;
      }

      const applicableMargin =
        Math.max(
          Number(
            projectRow
              .applicableMargin ||
              0,
          ),
          0,
        );

      const percentageRate =
        Math.max(
          Number(
            matchedSlab
              .percentageRate ||
              0,
          ),
          0,
        );

      /*
       * Sequential project-margin mode is
       * percentage based.
       *
       * Thresholds and percentage values come
       * entirely from the payroll rule JSON.
       */
      totalPayout +=
        applicableMargin *
        (
          percentageRate /
          100
        );
    },
  );

  if (
    !Number.isFinite(
      totalPayout,
    )
  ) {
    return 0;
  }

  return (
    Math.round(
      Math.max(
        totalPayout,
        0,
      ) * 100,
    ) / 100
  );
}


  async resolve(
    request: StaffPayrollMetricRequest,
  ): Promise<number> {
    switch (request.metricType) {
      /*
       * TELECALLING
       */

      case StaffPayrollMetricType.CALLS_MADE:
        return this.resolveCallsMade(request);

      case StaffPayrollMetricType.UNIQUE_CONTACTS_CALLED:
        return this.resolveUniqueContacts(request);

      case StaffPayrollMetricType.CALL_DURATION_MINUTES:
        return this.resolveCallDuration(request);

      case StaffPayrollMetricType.LEADS_CREATED:
        return this.resolveLeadsCreated(request);

      case StaffPayrollMetricType.QUALIFIED_LEADS:
        return this.resolveQualifiedLeads(request);

        case StaffPayrollMetricType.TEAM_TELECALLERS:
  return this.resolveTeamTelecallers(
    request,
  );

case StaffPayrollMetricType.TEAM_TELECALLER_APPROVED_PROJECTS:
  return this.resolveTeamTelecallerApprovedProjects(
    request,
  );

      /*
       * MEETINGS
       */

      case StaffPayrollMetricType.MEETINGS_SCHEDULED:
        return this.resolveMeetingsScheduled(request);

      case StaffPayrollMetricType.MEETINGS_COMPLETED:
        return this.resolveMeetingsCompleted(request);

      case StaffPayrollMetricType.GPS_SITE_VISITS_COMPLETED:
        return this.resolveGpsMeetings(request);

      case StaffPayrollMetricType.DEALER_MEETINGS_COMPLETED:
        return this.resolveDealerMeetings(request);

      /*
       * PROJECTS
       */

      case StaffPayrollMetricType.APPROVED_PROJECTS:
        return this.resolveApprovedProjects(request);

      case StaffPayrollMetricType.SELF_APPROVED_PROJECTS:
        return this.resolveSelfApprovedProjects(request);

      case StaffPayrollMetricType.COMPANY_APPROVED_PROJECTS:
        return this.resolveCompanyApprovedProjects(request);

        case StaffPayrollMetricType
  .SOLAR_FRANCHISE_APPROVED_PROJECT_MARGIN:
  return this
    .resolveSolarFranchiseApprovedProjectMargin(
      request,
    );

      /*
       * TRADING
       */

      case StaffPayrollMetricType.DEALER_ORDERS:
        return this.resolveDealerOrders(request);

      case StaffPayrollMetricType.DEALER_SALES_AMOUNT:
        return this.resolveDealerSales(request);

      case StaffPayrollMetricType.DEALER_NET_PROFIT:
        return this.resolveDealerProfit(request);

        case StaffPayrollMetricType
  .DEALER_NET_PROFIT_ABOVE_SALES_TARGET:
  return this
    .resolveDealerProfitAboveSalesTarget(
      request,
    );

    case StaffPayrollMetricType.TEAM_TRADING_MANAGERS:
  return this.resolveTeamTradingManagers(
    request,
  );

      case StaffPayrollMetricType.TEAM_DEALER_ORDERS:
        return this.resolveTeamDealerOrders(request);

      case StaffPayrollMetricType.TEAM_DEALER_SALES_AMOUNT:
        return this.resolveTeamDealerSales(request);

        case StaffPayrollMetricType
  .TEAM_DEALER_NET_PROFIT_ABOVE_SALES_TARGET:
  return this
    .resolveTeamDealerProfitAboveSalesTarget(
      request,
    );

      case StaffPayrollMetricType.TEAM_DEALER_NET_PROFIT:
        return this.resolveTeamDealerProfit(request);

      /*
       * ATTENDANCE
       */

      case StaffPayrollMetricType.PRESENT_DAYS:
        return this.resolvePresentDays(request);

      case StaffPayrollMetricType.WORKING_DAYS:
        return this.resolveWorkingDays(request);

      case StaffPayrollMetricType.WORKING_HOURS:
        return this.resolveWorkingHours(request);

      case StaffPayrollMetricType.ATTENDANCE_PERCENTAGE:
        return this.resolveAttendancePercentage(request);

      /*
       * HR
       */

      case StaffPayrollMetricType.STAFF_JOININGS:
        return this.resolveStaffJoinings(request);

        case StaffPayrollMetricType.SELECTED_SUPPORTING_STAFF:
  return this.resolveSelectedSupportingStaff(
    request,
  );

      /*
       * PAYMENTS
       */

      case StaffPayrollMetricType.PAYMENT_COLLECTION_AMOUNT:
        return this.resolvePaymentCollectionAmount(request);

      case StaffPayrollMetricType.PAYMENT_COLLECTION_PERCENTAGE:
        return this.resolvePaymentCollectionPercentage(request);

      /*
       * SUPPORT
       */

      case StaffPayrollMetricType.COMPLAINTS_ASSIGNED:
        return this.resolveComplaintsAssigned(request);

      case StaffPayrollMetricType.COMPLAINTS_RESOLVED:
        return this.resolveComplaintsResolved(request);

      case StaffPayrollMetricType.COMPLAINT_RESOLUTION_PERCENTAGE:
        return this.resolveComplaintResolutionPercentage(request);

      /*
       * MANUAL
       */

      case StaffPayrollMetricType.MANUAL_NUMBER:
        return 0;

      default:
        throw new NotImplementedException(
          `Metric resolver not implemented for ${request.metricType}`,
        );
    }
  }

  /*
   * Skeleton methods.
   * SQL will be added individually.
   */

  private async notImplemented(): Promise<number> {
    throw new NotImplementedException();
  }

  private async resolveCallsMade(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId = Number(
    request.linkedUserId || 0,
  );

  if (
    !Number.isInteger(linkedUserId) ||
    linkedUserId <= 0
  ) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  return this.callLogRepository
    .createQueryBuilder('callLog')
    .where(
      'callLog.telecallerId = :linkedUserId',
      {
        linkedUserId,
      },
    )
    .andWhere(
      'callLog.createdAt >= :periodStart',
      {
        periodStart,
      },
    )
    .andWhere(
      'callLog.createdAt < :periodEnd',
      {
        periodEnd,
      },
    )
    .getCount();
}
  private async resolveUniqueContacts(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId = Number(
    request.linkedUserId || 0,
  );

  if (
    !Number.isInteger(linkedUserId) ||
    linkedUserId <= 0
  ) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  const result =
    await this.callLogRepository
      .createQueryBuilder('callLog')
      .select(
        `
        COUNT(
          DISTINCT callLog.contactId
        )
        `,
        'uniqueContacts',
      )
      .where(
        'callLog.telecallerId = :linkedUserId',
        {
          linkedUserId,
        },
      )
      .andWhere(
        'callLog.contactId IS NOT NULL',
      )
      .andWhere(
        'callLog.createdAt >= :periodStart',
        {
          periodStart,
        },
      )
      .andWhere(
        'callLog.createdAt < :periodEnd',
        {
          periodEnd,
        },
      )
      .getRawOne<{
        uniqueContacts:
          string | number | null;
      }>();

  return Number(
    result?.uniqueContacts || 0,
  );
}
  private async resolveCallDuration(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId = Number(
    request.linkedUserId || 0,
  );

  if (
    !Number.isInteger(linkedUserId) ||
    linkedUserId <= 0
  ) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  const result =
    await this.callLogRepository
      .createQueryBuilder('callLog')
      .select(
        `
        COALESCE(
          SUM(
            COALESCE(
              callLog.durationInSeconds,
              0
            )
          ),
          0
        )
        `,
        'totalDurationInSeconds',
      )
      .where(
        'callLog.telecallerId = :linkedUserId',
        {
          linkedUserId,
        },
      )
      .andWhere(
        'callLog.createdAt >= :periodStart',
        {
          periodStart,
        },
      )
      .andWhere(
        'callLog.createdAt < :periodEnd',
        {
          periodEnd,
        },
      )
      .getRawOne<{
        totalDurationInSeconds:
          string | number | null;
      }>();

  return Number(
    result?.totalDurationInSeconds || 0,
  );
}
  private async resolveLeadsCreated(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId =
    this.getLinkedUserId(request);

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  return this.leadRepository
    .createQueryBuilder('lead')
    .where(
      'lead.originTelecallerId = :linkedUserId',
      {
        linkedUserId,
      },
    )
    .andWhere(
      'lead.createdAt >= :periodStart',
      {
        periodStart,
      },
    )
    .andWhere(
      'lead.createdAt < :periodEnd',
      {
        periodEnd,
      },
    )
    .andWhere(
  'COALESCE(lead.isArchived, false) = false',
)
    .getCount();
}
  private async resolveQualifiedLeads(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId = Number(
    request.linkedUserId || 0,
  );

  if (
    !Number.isInteger(linkedUserId) ||
    linkedUserId <= 0
  ) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  return this.leadRepository
    .createQueryBuilder('lead')
    .where(
      'lead.originTelecallerId = :linkedUserId',
      {
        linkedUserId,
      },
    )
    .andWhere(
      'lead.createdAt >= :periodStart',
      {
        periodStart,
      },
    )
    .andWhere(
      'lead.createdAt < :periodEnd',
      {
        periodEnd,
      },
    )
    .andWhere(
      'COALESCE(lead.isArchived, false) = false',
    )
    .getCount();
}

  private async resolveMeetingsScheduled(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId =
    this.getLinkedUserId(request);

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  return this.meetingRepository
    .createQueryBuilder('meeting')
    .where(
      'meeting.createdBy = :linkedUserId',
      {
        linkedUserId,
      },
    )
    .andWhere(
      'meeting.scheduledAt >= :periodStart',
      {
        periodStart,
      },
    )
    .andWhere(
      'meeting.scheduledAt < :periodEnd',
      {
        periodEnd,
      },
    )
    .andWhere(
      'meeting.status != :cancelledStatus',
      {
        cancelledStatus:
          MeetingStatus.CANCELLED,
      },
    )
    .andWhere((queryBuilder) => {
      const newerMeetingSubQuery =
        queryBuilder
          .subQuery()
          .select('1')
          .from(
            Meeting,
            'newerMeeting',
          )
          .where(`
            COALESCE(
              "newerMeeting"."meetingGroupId",
              "newerMeeting"."id"
            ) = COALESCE(
              "meeting"."meetingGroupId",
              "meeting"."id"
            )
          `)
          .andWhere(`
            (
              "newerMeeting"."updatedAt" >
                "meeting"."updatedAt"

              OR (
                "newerMeeting"."updatedAt" =
                  "meeting"."updatedAt"

                AND "newerMeeting"."createdAt" >
                  "meeting"."createdAt"
              )

              OR (
                "newerMeeting"."updatedAt" =
                  "meeting"."updatedAt"

                AND "newerMeeting"."createdAt" =
                  "meeting"."createdAt"

                AND "newerMeeting"."id" >
                  "meeting"."id"
              )
            )
          `)
          .getQuery();

      return `NOT EXISTS ${newerMeetingSubQuery}`;
    })
    .getCount();
}
  private async resolveMeetingsCompleted(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId = Number(
    request.linkedUserId || 0,
  );

  if (
    !Number.isInteger(linkedUserId) ||
    linkedUserId <= 0
  ) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  return this.meetingRepository
    .createQueryBuilder('meeting')
    .where(
      'meeting.assignedTo = :linkedUserId',
      {
        linkedUserId,
      },
    )
    .andWhere(
      'meeting.meetingType = :meetingType',
      {
        meetingType:
          MeetingType.SITE_VISIT,
      },
    )
    .andWhere(
      'meeting.status = :meetingStatus',
      {
        meetingStatus:
          MeetingStatus.COMPLETED,
      },
    )
    .andWhere(
      `
      NULLIF(
        TRIM(
          COALESCE(
            meeting.gpsPhotoUrl,
            ''
          )
        ),
        ''
      ) IS NOT NULL
      `,
    )
    .andWhere(
      'meeting.createdAt >= :periodStart',
      {
        periodStart,
      },
    )
    .andWhere(
      'meeting.createdAt < :periodEnd',
      {
        periodEnd,
      },
    )
    .andWhere(
      `
      NOT EXISTS (
        SELECT 1
        FROM meetings newerMeeting
        WHERE
          COALESCE(
            newerMeeting."meetingGroupId",
            newerMeeting.id
          ) =
          COALESCE(
            meeting."meetingGroupId",
            meeting.id
          )
          AND (
            newerMeeting."updatedAt" >
              meeting."updatedAt"

            OR (
              newerMeeting."updatedAt" =
                meeting."updatedAt"
              AND newerMeeting."createdAt" >
                meeting."createdAt"
            )

            OR (
              newerMeeting."updatedAt" =
                meeting."updatedAt"
              AND newerMeeting."createdAt" =
                meeting."createdAt"
              AND newerMeeting.id >
                meeting.id
            )
          )
      )
      `,
    )
    .getCount();
}

  private async resolveGpsMeetings(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  return this.resolveMeetingsCompleted(
    request,
  );
}

  private async resolveDealerMeetings(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId =
    this.getLinkedUserId(request);

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  return this.projectTradingMeetingRepository
    .createQueryBuilder('tradingMeeting')
    .where(
      'tradingMeeting.assignedTo = :linkedUserId',
      {
        linkedUserId,
      },
    )
    .andWhere(
      'tradingMeeting.status IN (:...completedStatuses)',
      {
        completedStatuses: [
          ProjectTradingMeetingStatus.COMPLETED,
          ProjectTradingMeetingStatus.ORDER_EXPECTED,
          ProjectTradingMeetingStatus.ORDER_RECEIVED,
        ],
      },
    )
    .andWhere(
      'tradingMeeting.scheduledAt >= :periodStart',
      {
        periodStart,
      },
    )
    .andWhere(
      'tradingMeeting.scheduledAt < :periodEnd',
      {
        periodEnd,
      },
    )
    .andWhere(
      'COALESCE(tradingMeeting.isHidden, false) = false',
    )
    .getCount();
}

    private async resolveApprovedProjects(
    request: StaffPayrollMetricRequest,
  ): Promise<number> {
    const query =
      this.createPayrollEligibleProjectQuery(
        request,
      );

    this.applyApprovedProjectStaffAttribution(
      query,
      request,
    );

    return query.getCount();
  }

  private async resolveSelfApprovedProjects(
    request: StaffPayrollMetricRequest,
  ): Promise<number> {
    const linkedUserId =
      this.getLinkedUserId(request);

    const query =
      this.createPayrollEligibleProjectQuery(
        request,
      );

    query.andWhere(
      'project.projectOwnerId = :linkedUserId',
      {
        linkedUserId,
      },
    );

    return query.getCount();
  }

  private async resolveCompanyApprovedProjects(
    request: StaffPayrollMetricRequest,
  ): Promise<number> {
    const query =
      this.createPayrollEligibleProjectQuery(
        request,
      );

    return query.getCount();
  }

  private async resolveSolarFranchiseApprovedProjectMargin(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId =
    this.getLinkedUserId(request);

  const result =
    await this
      .createPayrollEligibleProjectQuery(
        request,
      )
      .andWhere(
        `(
          project."solarFranchiseUserId" =
            :linkedUserId

          OR (
            project."projectOwnerId" =
              :linkedUserId

            AND UPPER(
              TRIM(
                COALESCE(
                  project."projectOwnerRole",
                  ''
                )
              )
            ) = :solarFranchiseRole
          )
        )`,
        {
          linkedUserId,

          solarFranchiseRole:
            'SOLAR_FRANCHISE',
        },
      )
      .select(
        `
        COALESCE(
          SUM(
            COALESCE(
              project."applicableMargin",
              0
            )
          ),
          0
        )
        `,
        'totalApplicableMargin',
      )
      .getRawOne<{
        totalApplicableMargin:
          string | number | null;
      }>();

  const totalApplicableMargin =
    Number(
      result?.totalApplicableMargin ||
        0,
    );

  if (
    !Number.isFinite(
      totalApplicableMargin,
    )
  ) {
    return 0;
  }

  return (
  Math.round(
    Math.max(
      totalApplicableMargin,
      0,
    ) * 100,
  ) / 100
);
}

  private async resolveDealerOrders(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId =
    this.getLinkedUserId(request);

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  return this.projectDealerOrderRepository
    .createQueryBuilder('dealerOrder')
    .where(
      'dealerOrder.createdBy = :linkedUserId',
      {
        linkedUserId,
      },
    )
    .andWhere(
      'dealerOrder.status IN (:...eligibleStatuses)',
      {
        eligibleStatuses: [
          ProjectDealerOrderStatus.ACCEPTED,
          ProjectDealerOrderStatus.PARTIALLY_ACCEPTED,
          ProjectDealerOrderStatus.DISPATCHED,
          ProjectDealerOrderStatus.DELIVERED,
        ],
      },
    )
    .andWhere(
      'dealerOrder.createdAt >= :periodStart',
      {
        periodStart,
      },
    )
    .andWhere(
      'dealerOrder.createdAt < :periodEnd',
      {
        periodEnd,
      },
    )
    .andWhere(
      'COALESCE(dealerOrder.isHidden, false) = false',
    )
    .getCount();
}
  private async resolveDealerSales(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId =
    this.getLinkedUserId(request);

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  const result =
    await this.projectDealerOrderRepository
      .createQueryBuilder('dealerOrder')
      .select(
        `
        COALESCE(
          SUM(
            COALESCE(
              dealerOrder.totalAmount,
              0
            )
          ),
          0
        )
        `,
        'totalSales',
      )
      .where(
        'dealerOrder.createdBy = :linkedUserId',
        {
          linkedUserId,
        },
      )
      .andWhere(
        'dealerOrder.status IN (:...eligibleStatuses)',
        {
          eligibleStatuses: [
            ProjectDealerOrderStatus.ACCEPTED,
            ProjectDealerOrderStatus.PARTIALLY_ACCEPTED,
            ProjectDealerOrderStatus.DISPATCHED,
            ProjectDealerOrderStatus.DELIVERED,
          ],
        },
      )
      .andWhere(
        'dealerOrder.createdAt >= :periodStart',
        {
          periodStart,
        },
      )
      .andWhere(
        'dealerOrder.createdAt < :periodEnd',
        {
          periodEnd,
        },
      )
      .andWhere(
        'COALESCE(dealerOrder.isHidden, false) = false',
      )
      .getRawOne<{
        totalSales: string | number | null;
      }>();

  return Number(
    result?.totalSales || 0,
  );
}
  private async resolveDealerProfit(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId =
    this.getLinkedUserId(request);

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  const result =
    await this.projectDealerOrderItemRepository
      .createQueryBuilder('dealerOrderItem')
      .innerJoin(
        ProjectDealerOrder,
        'dealerOrder',
        `
        dealerOrder.id =
          dealerOrderItem.dealerOrderId
        `,
      )
      .leftJoin(
        ProjectStockItem,
        'stockItem',
        `
        stockItem.id =
          dealerOrderItem.stockItemId
        `,
      )
      .select(
        `
        COALESCE(
          SUM(
            CASE
              WHEN stockItem.id IS NOT NULL
              THEN (
                COALESCE(
                  dealerOrderItem.sellingRate,
                  0
                ) -
                COALESCE(
                  stockItem.averageRate,
                  0
                )
              ) *
              COALESCE(
                NULLIF(
                  dealerOrderItem.acceptedQuantity,
                  0
                ),
                dealerOrderItem.dispatchedQuantity,
                0
              )

              ELSE 0
            END
          ),
          0
        )
        `,
        'totalProfit',
      )
      .where(
        'dealerOrder.createdBy = :linkedUserId',
        {
          linkedUserId,
        },
      )
      .andWhere(
        'dealerOrder.status IN (:...eligibleStatuses)',
        {
          eligibleStatuses: [
            ProjectDealerOrderStatus.ACCEPTED,
            ProjectDealerOrderStatus.PARTIALLY_ACCEPTED,
            ProjectDealerOrderStatus.DISPATCHED,
            ProjectDealerOrderStatus.DELIVERED,
          ],
        },
      )
      .andWhere(
        'dealerOrder.createdAt >= :periodStart',
        {
          periodStart,
        },
      )
      .andWhere(
        'dealerOrder.createdAt < :periodEnd',
        {
          periodEnd,
        },
      )
      .andWhere(
        'COALESCE(dealerOrder.isHidden, false) = false',
      )
      .getRawOne<{
        totalProfit:
          string | number | null;
      }>();

  return Number(
    result?.totalProfit || 0,
  );
}

private async getTradingHeadTeamUserIds(
  request: StaffPayrollMetricRequest,
): Promise<number[]> {
  const tradingHeadStaffId =
  await this.getStaffMemberId(
    request,
  );

  const teamMembers =
    await this.staffMemberRepository
      .createQueryBuilder('staff')
      .select(
        'staff.linkedUserId',
        'linkedUserId',
      )
      .where(
        'staff.reportingManagerId = :tradingHeadStaffId',
        {
          tradingHeadStaffId,
        },
      )
      .andWhere(
        'UPPER(TRIM(COALESCE(staff.staffRole, \'\'))) = :tradingManagerRole',
        {
          tradingManagerRole:
            'TRADING_MANAGER',
        },
      )
      .andWhere(
        'staff.linkedUserId IS NOT NULL',
      )
      .andWhere(
        'staff.isActive = true',
      )
      .andWhere(
        'COALESCE(staff.isHidden, false) = false',
      )
      .getRawMany<{
        linkedUserId:
          string | number | null;
      }>();

  return Array.from(
    new Set(
      teamMembers
        .map((member) =>
          Number(member.linkedUserId),
        )
        .filter(
          (linkedUserId) =>
            Number.isInteger(linkedUserId) &&
            linkedUserId > 0,
        ),
    ),
  );
}

  private async resolveTeamDealerOrders(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const teamUserIds =
    await this.getTradingHeadTeamUserIds(
      request,
    );

  if (teamUserIds.length === 0) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  return this.projectDealerOrderRepository
    .createQueryBuilder('dealerOrder')
    .where(
      'dealerOrder.createdBy IN (:...teamUserIds)',
      {
        teamUserIds,
      },
    )
    .andWhere(
      'dealerOrder.status IN (:...eligibleStatuses)',
      {
        eligibleStatuses: [
          ProjectDealerOrderStatus.ACCEPTED,
          ProjectDealerOrderStatus.PARTIALLY_ACCEPTED,
          ProjectDealerOrderStatus.DISPATCHED,
          ProjectDealerOrderStatus.DELIVERED,
        ],
      },
    )
    .andWhere(
      'dealerOrder.createdAt >= :periodStart',
      {
        periodStart,
      },
    )
    .andWhere(
      'dealerOrder.createdAt < :periodEnd',
      {
        periodEnd,
      },
    )
    .andWhere(
      'COALESCE(dealerOrder.isHidden, false) = false',
    )
    .getCount();
}
  private async resolveTeamDealerSales(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const teamUserIds =
    await this.getTradingHeadTeamUserIds(
      request,
    );

  if (teamUserIds.length === 0) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  const result =
    await this.projectDealerOrderRepository
      .createQueryBuilder('dealerOrder')
      .select(
        `
        COALESCE(
          SUM(
            COALESCE(
              dealerOrder.totalAmount,
              0
            )
          ),
          0
        )
        `,
        'totalSales',
      )
      .where(
        'dealerOrder.createdBy IN (:...teamUserIds)',
        {
          teamUserIds,
        },
      )
      .andWhere(
        'dealerOrder.status IN (:...eligibleStatuses)',
        {
          eligibleStatuses: [
            ProjectDealerOrderStatus.ACCEPTED,
            ProjectDealerOrderStatus.PARTIALLY_ACCEPTED,
            ProjectDealerOrderStatus.DISPATCHED,
            ProjectDealerOrderStatus.DELIVERED,
          ],
        },
      )
      .andWhere(
        'dealerOrder.createdAt >= :periodStart',
        {
          periodStart,
        },
      )
      .andWhere(
        'dealerOrder.createdAt < :periodEnd',
        {
          periodEnd,
        },
      )
      .andWhere(
        'COALESCE(dealerOrder.isHidden, false) = false',
      )
      .getRawOne<{
        totalSales:
          string | number | null;
      }>();

  return Number(
    result?.totalSales || 0,
  );
}
  private async resolveTeamDealerProfit(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const teamUserIds =
    await this.getTradingHeadTeamUserIds(
      request,
    );

  if (teamUserIds.length === 0) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  const result =
    await this.projectDealerOrderItemRepository
      .createQueryBuilder('dealerOrderItem')
      .innerJoin(
        ProjectDealerOrder,
        'dealerOrder',
        `
        dealerOrder.id =
          dealerOrderItem.dealerOrderId
        `,
      )
      .leftJoin(
        ProjectStockItem,
        'stockItem',
        `
        stockItem.id =
          dealerOrderItem.stockItemId
        `,
      )
      .select(
        `
        COALESCE(
          SUM(
            CASE
              WHEN stockItem.id IS NOT NULL
              THEN (
                COALESCE(
                  dealerOrderItem.sellingRate,
                  0
                ) -
                COALESCE(
                  stockItem.averageRate,
                  0
                )
              ) *
              COALESCE(
                NULLIF(
                  dealerOrderItem.acceptedQuantity,
                  0
                ),
                dealerOrderItem.dispatchedQuantity,
                0
              )

              ELSE 0
            END
          ),
          0
        )
        `,
        'totalProfit',
      )
      .where(
        'dealerOrder.createdBy IN (:...teamUserIds)',
        {
          teamUserIds,
        },
      )
      .andWhere(
        'dealerOrder.status IN (:...eligibleStatuses)',
        {
          eligibleStatuses: [
            ProjectDealerOrderStatus.ACCEPTED,
            ProjectDealerOrderStatus.PARTIALLY_ACCEPTED,
            ProjectDealerOrderStatus.DISPATCHED,
            ProjectDealerOrderStatus.DELIVERED,
          ],
        },
      )
      .andWhere(
        'dealerOrder.createdAt >= :periodStart',
        {
          periodStart,
        },
      )
      .andWhere(
        'dealerOrder.createdAt < :periodEnd',
        {
          periodEnd,
        },
      )
      .andWhere(
        'COALESCE(dealerOrder.isHidden, false) = false',
      )
      .getRawOne<{
        totalProfit:
          string | number | null;
      }>();

  return Number(
    result?.totalProfit || 0,
  );
}

private async resolveTeamTradingManagers(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const teamUserIds =
    await this.getTradingHeadTeamUserIds(
      request,
    );

  return teamUserIds.length;
}

private async resolveTeamDealerProfitAboveSalesTarget(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const teamUserIds =
    await this.getTradingHeadTeamUserIds(
      request,
    );

  if (teamUserIds.length === 0) {
    return 0;
  }

  const salesTarget = Number(
    request.salaryTargetValue || 0,
  );

  if (
    !Number.isFinite(salesTarget) ||
    salesTarget <= 0
  ) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  const orderResults =
    await this.projectDealerOrderRepository
      .createQueryBuilder('dealerOrder')
      .leftJoin(
        ProjectDealerOrderItem,
        'dealerOrderItem',
        `
        dealerOrderItem.dealerOrderId =
          dealerOrder.id
        `,
      )
      .leftJoin(
        ProjectStockItem,
        'stockItem',
        `
        stockItem.id =
          dealerOrderItem.stockItemId
        `,
      )
      .select(
        'dealerOrder.id',
        'orderId',
      )
      .addSelect(
        'dealerOrder.createdAt',
        'createdAt',
      )
      .addSelect(
        `
        COALESCE(
          dealerOrder.totalAmount,
          0
        )
        `,
        'orderSales',
      )
      .addSelect(
        `
        COALESCE(
          SUM(
            CASE
              WHEN stockItem.id IS NOT NULL
              THEN (
                COALESCE(
                  dealerOrderItem.sellingRate,
                  0
                ) -
                COALESCE(
                  stockItem.averageRate,
                  0
                )
              ) *
              COALESCE(
                NULLIF(
                  dealerOrderItem.acceptedQuantity,
                  0
                ),
                dealerOrderItem.dispatchedQuantity,
                0
              )

              ELSE 0
            END
          ),
          0
        )
        `,
        'orderProfit',
      )
      .where(
        'dealerOrder.createdBy IN (:...teamUserIds)',
        {
          teamUserIds,
        },
      )
      .andWhere(
        'dealerOrder.status IN (:...eligibleStatuses)',
        {
          eligibleStatuses: [
            ProjectDealerOrderStatus.ACCEPTED,
            ProjectDealerOrderStatus.PARTIALLY_ACCEPTED,
            ProjectDealerOrderStatus.DISPATCHED,
            ProjectDealerOrderStatus.DELIVERED,
          ],
        },
      )
      .andWhere(
        'dealerOrder.createdAt >= :periodStart',
        {
          periodStart,
        },
      )
      .andWhere(
        'dealerOrder.createdAt < :periodEnd',
        {
          periodEnd,
        },
      )
      .andWhere(
        'COALESCE(dealerOrder.isHidden, false) = false',
      )
      .groupBy(
        'dealerOrder.id',
      )
      .addGroupBy(
        'dealerOrder.createdAt',
      )
      .addGroupBy(
        'dealerOrder.totalAmount',
      )
      .orderBy(
        'dealerOrder.createdAt',
        'ASC',
      )
      .addOrderBy(
        'dealerOrder.id',
        'ASC',
      )
      .getRawMany<{
        orderId:
          string | number;

        createdAt:
          string | Date;

        orderSales:
          string | number | null;

        orderProfit:
          string | number | null;
      }>();

  let cumulativeSales = 0;
  let aboveTargetProfit = 0;

  for (const order of orderResults) {
    const orderSales = Math.max(
      Number(
        order.orderSales || 0,
      ),
      0,
    );

    const orderProfit = Number(
      order.orderProfit || 0,
    );

    if (
      !Number.isFinite(orderSales) ||
      !Number.isFinite(orderProfit) ||
      orderSales <= 0
    ) {
      continue;
    }

    const salesBeforeOrder =
      cumulativeSales;

    const salesAfterOrder =
      cumulativeSales +
      orderSales;

    if (
      salesAfterOrder <=
      salesTarget
    ) {
      cumulativeSales =
        salesAfterOrder;

      continue;
    }

    if (
      salesBeforeOrder >=
      salesTarget
    ) {
      aboveTargetProfit +=
        orderProfit;

      cumulativeSales =
        salesAfterOrder;

      continue;
    }

    const aboveTargetSalesInOrder =
      salesAfterOrder -
      salesTarget;

    const eligibleOrderRatio =
      Math.min(
        Math.max(
          aboveTargetSalesInOrder /
            orderSales,
          0,
        ),
        1,
      );

    aboveTargetProfit +=
      orderProfit *
      eligibleOrderRatio;

    cumulativeSales =
      salesAfterOrder;
  }

  return Number.isFinite(
    aboveTargetProfit,
  )
    ? Math.round(
        aboveTargetProfit * 100,
      ) / 100
    : 0;
}

private async resolveDealerProfitAboveSalesTarget(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId =
    this.getLinkedUserId(request);

  const salesTarget = Number(
    request.salaryTargetValue || 0,
  );

  if (
    !Number.isFinite(salesTarget) ||
    salesTarget <= 0
  ) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  /*
   * Fetch every eligible dealer order in
   * chronological order together with its
   * actual recorded order-level profit.
   *
   * Profit:
   * (selling rate - stock average rate)
   * × accepted/dispatched quantity
   */
  const orderResults =
    await this.projectDealerOrderRepository
      .createQueryBuilder('dealerOrder')
      .leftJoin(
        ProjectDealerOrderItem,
        'dealerOrderItem',
        `
        dealerOrderItem.dealerOrderId =
          dealerOrder.id
        `,
      )
      .leftJoin(
        ProjectStockItem,
        'stockItem',
        `
        stockItem.id =
          dealerOrderItem.stockItemId
        `,
      )
      .select(
        'dealerOrder.id',
        'orderId',
      )
      .addSelect(
        'dealerOrder.createdAt',
        'createdAt',
      )
      .addSelect(
        `
        COALESCE(
          dealerOrder.totalAmount,
          0
        )
        `,
        'orderSales',
      )
      .addSelect(
        `
        COALESCE(
          SUM(
            CASE
              WHEN stockItem.id IS NOT NULL
              THEN (
                COALESCE(
                  dealerOrderItem.sellingRate,
                  0
                ) -
                COALESCE(
                  stockItem.averageRate,
                  0
                )
              ) *
              COALESCE(
                NULLIF(
                  dealerOrderItem.acceptedQuantity,
                  0
                ),
                dealerOrderItem.dispatchedQuantity,
                0
              )

              ELSE 0
            END
          ),
          0
        )
        `,
        'orderProfit',
      )
      .where(
        'dealerOrder.createdBy = :linkedUserId',
        {
          linkedUserId,
        },
      )
      .andWhere(
        'dealerOrder.status IN (:...eligibleStatuses)',
        {
          eligibleStatuses: [
            ProjectDealerOrderStatus.ACCEPTED,
            ProjectDealerOrderStatus.PARTIALLY_ACCEPTED,
            ProjectDealerOrderStatus.DISPATCHED,
            ProjectDealerOrderStatus.DELIVERED,
          ],
        },
      )
      .andWhere(
        'dealerOrder.createdAt >= :periodStart',
        {
          periodStart,
        },
      )
      .andWhere(
        'dealerOrder.createdAt < :periodEnd',
        {
          periodEnd,
        },
      )
      .andWhere(
        'COALESCE(dealerOrder.isHidden, false) = false',
      )
      .groupBy(
        'dealerOrder.id',
      )
      .addGroupBy(
        'dealerOrder.createdAt',
      )
      .addGroupBy(
        'dealerOrder.totalAmount',
      )
      .orderBy(
        'dealerOrder.createdAt',
        'ASC',
      )
      .addOrderBy(
        'dealerOrder.id',
        'ASC',
      )
      .getRawMany<{
        orderId:
          string | number;

        createdAt:
          string | Date;

        orderSales:
          string | number | null;

        orderProfit:
          string | number | null;
      }>();

  let cumulativeSales = 0;

  let aboveTargetProfit = 0;

  for (const order of orderResults) {
    const orderSales = Math.max(
      Number(
        order.orderSales || 0,
      ),
      0,
    );

    const orderProfit = Number(
      order.orderProfit || 0,
    );

    if (
      !Number.isFinite(orderSales) ||
      !Number.isFinite(orderProfit) ||
      orderSales <= 0
    ) {
      continue;
    }

    const salesBeforeOrder =
      cumulativeSales;

    const salesAfterOrder =
      cumulativeSales +
      orderSales;

    /*
     * No part of this order exceeds the target.
     */
    if (
      salesAfterOrder <=
      salesTarget
    ) {
      cumulativeSales =
        salesAfterOrder;

      continue;
    }

    /*
     * Entire order is above target.
     */
    if (
      salesBeforeOrder >=
      salesTarget
    ) {
      aboveTargetProfit +=
        orderProfit;

      cumulativeSales =
        salesAfterOrder;

      continue;
    }

    /*
     * This order crosses the target.
     *
     * Only the proportion of this order's
     * profit belonging to sales above the
     * target becomes incentive-eligible.
     */
    const aboveTargetSalesInOrder =
      salesAfterOrder -
      salesTarget;

    const eligibleOrderRatio =
      Math.min(
        Math.max(
          aboveTargetSalesInOrder /
            orderSales,
          0,
        ),
        1,
      );

    aboveTargetProfit +=
      orderProfit *
      eligibleOrderRatio;

    cumulativeSales =
      salesAfterOrder;
  }

  return Number.isFinite(
    aboveTargetProfit,
  )
    ? Math.round(
        aboveTargetProfit * 100,
      ) / 100
    : 0;
}

  private async resolvePresentDays(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const staffId =
  await this.getStaffMemberId(
    request,
  );

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  const result =
    await this.staffAttendanceRepository
      .createQueryBuilder('attendance')
      .select(
        `
        COALESCE(
          SUM(
            CASE
              WHEN attendance.status = 'PRESENT'
                THEN 1
              WHEN attendance.status = 'HALF_DAY'
                THEN 0.5
              ELSE 0
            END
          ),
          0
        )
        `,
        'presentDays',
      )
      .where(
        'attendance.staffId = :staffId',
        {
          staffId,
        },
      )
      .andWhere(
        'attendance.attendanceDate >= :startDate',
        {
          startDate: periodStart
            .toISOString()
            .slice(0, 10),
        },
      )
      .andWhere(
        'attendance.attendanceDate < :endDate',
        {
          endDate: periodEnd
            .toISOString()
            .slice(0, 10),
        },
      )
      .getRawOne<{
        presentDays:
          string | number | null;
      }>();

  const presentDays = Number(
    result?.presentDays || 0,
  );

  return Number.isFinite(
    presentDays,
  )
    ? presentDays
    : 0;
}
  private async resolveWorkingDays(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const configuredWorkingDays =
    Number(
      request.attendanceTargetDays || 0,
    );

  if (
    !Number.isFinite(
      configuredWorkingDays,
    ) ||
    configuredWorkingDays <= 0
  ) {
    return 0;
  }

  return configuredWorkingDays;
}
  private async resolveWorkingHours(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const staffId =
  await this.getStaffMemberId(
    request,
  );

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  const result =
    await this.staffAttendanceRepository
      .createQueryBuilder('attendance')
      .select(
        'COALESCE(SUM(attendance.workingHours), 0)',
        'workingHours',
      )
      .where(
        'attendance.staffId = :staffId',
        {
          staffId,
        },
      )
      .andWhere(
        'attendance.attendanceDate >= :startDate',
        {
          startDate: periodStart
            .toISOString()
            .slice(0, 10),
        },
      )
      .andWhere(
        'attendance.attendanceDate < :endDate',
        {
          endDate: periodEnd
            .toISOString()
            .slice(0, 10),
        },
      )
      .getRawOne<{
        workingHours:
          string | number | null;
      }>();

  const workingHours = Number(
    result?.workingHours || 0,
  );

  return Number.isFinite(
    workingHours,
  )
    ? workingHours
    : 0;
}
  private async resolveAttendancePercentage(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const presentDays =
    await this.resolvePresentDays(
      request,
    );

  const workingDays =
    await this.resolveWorkingDays(
      request,
    );

  if (
    !Number.isFinite(
      workingDays,
    ) ||
    workingDays <= 0
  ) {
    return 0;
  }

  return (
    presentDays / workingDays
  ) * 100;
}

  private async resolveStaffJoinings(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const linkedUserId = Number(
    request.linkedUserId || 0,
  );

  if (
    !Number.isInteger(linkedUserId) ||
    linkedUserId <= 0
  ) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  return this.recruitmentCandidateRepository
    .createQueryBuilder('candidate')
    .where(
      'candidate.stage = :joinedStage',
      {
        joinedStage:
          RecruitmentStage.JOINED,
      },
    )
    .andWhere(
      'candidate.joiningDate IS NOT NULL',
    )
    .andWhere(
      'candidate.joiningDate >= :periodStart',
      {
        periodStart,
      },
    )
    .andWhere(
      'candidate.joiningDate < :periodEnd',
      {
        periodEnd,
      },
    )
    .andWhere(
      'candidate.joinedBy = :linkedUserId',
      {
        linkedUserId,
      },
    )
    .andWhere(
      'candidate.isActive = true',
    )
    .andWhere(
      'COALESCE(candidate.isHidden, false) = false',
    )
    .getCount();
}

private async resolveSelectedSupportingStaff(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  void request;

  return this.staffMemberRepository
    .createQueryBuilder('staff')
    .where(
      'staff.isSupportingStaff = true',
    )
    .andWhere(
      'staff.isActive = true',
    )
    .andWhere(
      'COALESCE(staff.isHidden, false) = false',
    )
    .getCount();
}

  private async resolvePaymentCollectionAmount(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const userId = Number(
    request.linkedUserId || 0,
  );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return 0;
  }

  const {
    periodStart,
    periodEnd,
  } = this.validateMetricPeriod(
    request,
  );

  const result =
    await this.projectPaymentReceiptRepository
      .createQueryBuilder('receipt')
      .select(
        'COALESCE(SUM(receipt.receivedAmount), 0)',
        'amount',
      )
      .where(
        'receipt.collectedBy = :userId',
        {
          userId,
        },
      )
      .andWhere(
        'receipt.approvalStatus = :status',
        {
          status: 'APPROVED',
        },
      )
      .andWhere(
        'receipt.isHidden = false',
      )
      .andWhere(
        'receipt.paymentDate >= :startDate',
        {
          startDate: periodStart,
        },
      )
      .andWhere(
        'receipt.paymentDate < :endDate',
        {
          endDate: periodEnd,
        },
      )
      .getRawOne<{
        amount:
          string | number | null;
      }>();

  const amount = Number(
    result?.amount || 0,
  );

  return Number.isFinite(amount)
    ? amount
    : 0;
}
  private async resolvePaymentCollectionPercentage(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const collectedAmount =
    await this.resolvePaymentCollectionAmount(
      request,
    );

  const targetAmount = Number(
    request.salaryTargetValue || 0,
  );

  if (
    !Number.isFinite(
      targetAmount,
    ) ||
    targetAmount <= 0
  ) {
    return 0;
  }

  return (
    collectedAmount /
    targetAmount
  ) * 100;
}

  private resolveComplaintsAssigned(r: StaffPayrollMetricRequest) { return this.notImplemented(); }
  private resolveComplaintsResolved(r: StaffPayrollMetricRequest) { return this.notImplemented(); }
  private resolveComplaintResolutionPercentage(r: StaffPayrollMetricRequest) { return this.notImplemented(); }

  private async resolveTeamTelecallers(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const managerLinkedUserId = Number(
    request.linkedUserId || 0,
  );

  if (
    !Number.isInteger(
      managerLinkedUserId,
    ) ||
    managerLinkedUserId <= 0
  ) {
    return 0;
  }

  const managerStaff =
    await this.staffMemberRepository
      .createQueryBuilder('staff')
      .select([
        'staff.id',
      ])
      .where(
        'staff.linkedUserId = :linkedUserId',
        {
          linkedUserId:
            managerLinkedUserId,
        },
      )
      .andWhere(
        'staff.isActive = true',
      )
      .andWhere(
        'staff.isHidden = false',
      )
      .getOne();

  if (!managerStaff?.id) {
    return 0;
  }

  const teamCount =
    await this.staffMemberRepository
      .createQueryBuilder('staff')
      .where(
        'staff.reportingManagerId = :managerStaffId',
        {
          managerStaffId:
            managerStaff.id,
        },
      )
      .andWhere(
        `
        UPPER(
          TRIM(
            COALESCE(
              staff.staffRole,
              ''
            )
          )
        ) = :telecallerRole
        `,
        {
          telecallerRole:
            'TELECALLER',
        },
      )
      .andWhere(
        'staff.isActive = true',
      )
      .andWhere(
        'staff.isHidden = false',
      )
      .getCount();

  return Number(
    teamCount || 0,
  );
}

private async resolveTeamTelecallerApprovedProjects(
  request: StaffPayrollMetricRequest,
): Promise<number> {
  const managerLinkedUserId = Number(
    request.linkedUserId || 0,
  );

  if (
    !Number.isInteger(
      managerLinkedUserId,
    ) ||
    managerLinkedUserId <= 0
  ) {
    return 0;
  }

  /*
   * reportingManagerId stores the manager's
   * StaffMember ID, not their CRM user ID.
   */
  const managerStaff =
    await this.staffMemberRepository
      .createQueryBuilder('staff')
      .select([
        'staff.id',
      ])
      .where(
        'staff.linkedUserId = :linkedUserId',
        {
          linkedUserId:
            managerLinkedUserId,
        },
      )
      .andWhere(
        'staff.isActive = true',
      )
      .andWhere(
        'staff.isHidden = false',
      )
      .getOne();

  if (!managerStaff?.id) {
    return 0;
  }

  /*
   * Find active telecallers directly reporting
   * to this Telecalling Manager.
   */
  const teamTelecallers =
    await this.staffMemberRepository
      .createQueryBuilder('staff')
      .select([
        'staff.linkedUserId',
      ])
      .where(
        'staff.reportingManagerId = :managerStaffId',
        {
          managerStaffId:
            managerStaff.id,
        },
      )
      .andWhere(
        `
        UPPER(
          TRIM(
            COALESCE(
              staff.staffRole,
              ''
            )
          )
        ) = :telecallerRole
        `,
        {
          telecallerRole:
            'TELECALLER',
        },
      )
      .andWhere(
        'staff.isActive = true',
      )
      .andWhere(
        'staff.isHidden = false',
      )
      .andWhere(
        'staff.linkedUserId IS NOT NULL',
      )
      .getMany();

  const telecallerUserIds =
    Array.from(
      new Set(
        teamTelecallers
          .map((staff) =>
            Number(
              staff.linkedUserId || 0,
            ),
          )
          .filter(
            (userId) =>
              Number.isInteger(userId) &&
              userId > 0,
          ),
      ),
    );

  if (
    telecallerUserIds.length === 0
  ) {
    return 0;
  }

  /*
   * Reuse the existing payroll-eligible project
   * definition so the 20% approved-payment rule,
   * approval checks and payroll-month attribution
   * remain identical to all other project metrics.
   */
  const query =
    this.createPayrollEligibleProjectQuery(
      request,
    );

  query.andWhere(
    'project.telecallerId IN (:...telecallerUserIds)',
    {
      telecallerUserIds,
    },
  );

  return query.getCount();
}
}