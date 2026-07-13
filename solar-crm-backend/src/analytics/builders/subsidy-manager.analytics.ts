import { Repository } from 'typeorm';

import { User } from '../../users/user.entity';
import { Project } from '../../project/project.entity';
import {
  ProjectSubsidyDetail,
  ProjectSubsidyStatus,
} from '../../project/project-subsidy-detail.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
  normalizeAnalyticsText,
  canViewAllAnalytics,
} from '../helpers/analytics-filter.helper';

export class SubsidyManagerAnalyticsBuilder {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly projectRepository: Repository<Project>,
    private readonly subsidyDetailRepository: Repository<ProjectSubsidyDetail>,
  ) {}

  private async getUserIds(query: AnalyticsQuery, user: any) {
    const canViewAll = canViewAllAnalytics(user);

    const currentUserId = Number(
      user?.id || user?.userId || user?.sub || 0,
    );

    const selectedUserId = query.userId
      ? Number(query.userId)
      : null;

    if (!canViewAll) {
      return currentUserId ? [currentUserId] : [];
    }

    if (selectedUserId) {
      return [selectedUserId];
    }

    return [];
  }

  async build(query: AnalyticsQuery, user: any) {
    const { start, end } = getAnalyticsDateRange(query);
    const userIds = await this.getUserIds(query, user);

    const subsidyQb = this.subsidyDetailRepository
      .createQueryBuilder('subsidy')
      .innerJoin(
        Project,
        'project',
        'project.id = subsidy.projectId AND project.isHidden = false',
      )
      .where('subsidy.updatedAt BETWEEN :start AND :end', {
        start,
        end,
      });

    if (userIds.length) {
      subsidyQb.andWhere(
        'subsidy.updatedBy IN (:...userIds)',
        { userIds },
      );
    }

    const branchName = normalizeAnalyticsText(
      query.branchName,
    );

    if (branchName) {
      subsidyQb.andWhere(
        `LOWER(COALESCE(project.branchName, '')) LIKE :branchName`,
        {
          branchName: `%${branchName}%`,
        },
      );
    }

    const city = normalizeAnalyticsText(query.city);

    if (city) {
      subsidyQb.andWhere(
        `LOWER(COALESCE(project.city, '')) LIKE :city`,
        {
          city: `%${city}%`,
        },
      );
    }

    const zone = normalizeAnalyticsText(query.zone);

    if (zone) {
      subsidyQb.andWhere(
        `LOWER(COALESCE(project.zone, '')) LIKE :zone`,
        {
          zone: `%${zone}%`,
        },
      );
    }

    const [
      totalSubsidyFiles,
      documentPending,
      plantImagesReceived,
      dcrCertificateReadyStatus,
      submissionDone,
      subsidyRequested,
      subsidyRedeemed,
      subsidyDisbursed,
      rejected,

      dcrCertificateReady,
      panelWarrantyReceived,
      inverterWarrantyReceived,
      vendorAgreementReady,
      wcrReady,

      portalSubmissionRecorded,
      subsidyRequestDateRecorded,
      subsidyDisbursementDateRecorded,

      amountSummary,
      statusRows,
      managerWiseRows,
      fileRows,
    ] = await Promise.all([
      subsidyQb.clone().getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.status = :status', {
          status: ProjectSubsidyStatus.DOCUMENT_PENDING,
        })
        .getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.status = :status', {
          status:
            ProjectSubsidyStatus.PLANT_IMAGES_RECEIVED,
        })
        .getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.status = :status', {
          status:
            ProjectSubsidyStatus.DCR_CERTIFICATE_READY,
        })
        .getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.status = :status', {
          status: ProjectSubsidyStatus.SUBMISSION_DONE,
        })
        .getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.status = :status', {
          status:
            ProjectSubsidyStatus.SUBSIDY_REQUESTED,
        })
        .getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.status = :status', {
          status:
            ProjectSubsidyStatus.SUBSIDY_REDEEMED,
        })
        .getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.status = :status', {
          status:
            ProjectSubsidyStatus.SUBSIDY_DISBURSED,
        })
        .getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.status = :status', {
          status: ProjectSubsidyStatus.REJECTED,
        })
        .getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.dcrCertificateReady = true')
        .getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.panelWarrantyReceived = true')
        .getCount(),

      subsidyQb
        .clone()
        .andWhere(
          'subsidy.inverterWarrantyReceived = true',
        )
        .getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.vendorAgreementReady = true')
        .getCount(),

      subsidyQb
        .clone()
        .andWhere('subsidy.wcrReady = true')
        .getCount(),

      subsidyQb
        .clone()
        .andWhere(
          'subsidy.portalSubmissionDate IS NOT NULL',
        )
        .getCount(),

      subsidyQb
        .clone()
        .andWhere(
          'subsidy.subsidyRequestedDate IS NOT NULL',
        )
        .getCount(),

      subsidyQb
        .clone()
        .andWhere(
          'subsidy.subsidyDisbursedDate IS NOT NULL',
        )
        .getCount(),

      subsidyQb
        .clone()
        .select(
          'COALESCE(SUM(subsidy.subsidyAmount), 0)',
          'subsidyAmount',
        )
        .addSelect(
          `COALESCE(
            SUM(
              CASE
                WHEN subsidy.status = :disbursedStatus
                THEN subsidy.subsidyAmount
                ELSE 0
              END
            ),
            0
          )`,
          'disbursedAmount',
        )
        .setParameter(
          'disbursedStatus',
          ProjectSubsidyStatus.SUBSIDY_DISBURSED,
        )
        .getRawOne(),

      subsidyQb
        .clone()
        .select('subsidy."status"::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('subsidy."status"')
        .orderBy('COUNT(*)', 'DESC')
        .getRawMany(),

      subsidyQb
        .clone()
        .select('subsidy.updatedBy', 'userId')
        .addSelect('COUNT(*)', 'totalFiles')
        .addSelect(
          `SUM(
            CASE
              WHEN subsidy.status = :documentPending
              THEN 1 ELSE 0
            END
          )`,
          'documentPending',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN subsidy.status = :submissionDone
              THEN 1 ELSE 0
            END
          )`,
          'submissionDone',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN subsidy.status = :subsidyRequested
              THEN 1 ELSE 0
            END
          )`,
          'subsidyRequested',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN subsidy.status = :subsidyDisbursed
              THEN 1 ELSE 0
            END
          )`,
          'subsidyDisbursed',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN subsidy.status = :rejected
              THEN 1 ELSE 0
            END
          )`,
          'rejected',
        )
        .addSelect(
          `COALESCE(
            SUM(
              CASE
                WHEN subsidy.status = :subsidyDisbursed
                THEN subsidy.subsidyAmount
                ELSE 0
              END
            ),
            0
          )`,
          'disbursedAmount',
        )
        .setParameters({
          documentPending:
            ProjectSubsidyStatus.DOCUMENT_PENDING,
          submissionDone:
            ProjectSubsidyStatus.SUBMISSION_DONE,
          subsidyRequested:
            ProjectSubsidyStatus.SUBSIDY_REQUESTED,
          subsidyDisbursed:
            ProjectSubsidyStatus.SUBSIDY_DISBURSED,
          rejected: ProjectSubsidyStatus.REJECTED,
        })
        .andWhere('subsidy.updatedBy IS NOT NULL')
        .groupBy('subsidy.updatedBy')
        .orderBy('COUNT(*)', 'DESC')
        .limit(50)
        .getRawMany(),

      subsidyQb
        .clone()
        .select('subsidy.projectId', 'projectId')
        .addSelect(
          'project.customerName',
          'customerName',
        )
        .addSelect(
          'project.customerPhone',
          'customerPhone',
        )
        .addSelect('project.branchName', 'branchName')
        .addSelect('project.city', 'city')
        .addSelect('project.zone', 'zone')
        .addSelect('subsidy.status', 'status')
        .addSelect(
          'subsidy.dcrCertificateReady',
          'dcrCertificateReady',
        )
        .addSelect(
          'subsidy.panelWarrantyReceived',
          'panelWarrantyReceived',
        )
        .addSelect(
          'subsidy.inverterWarrantyReceived',
          'inverterWarrantyReceived',
        )
        .addSelect(
          'subsidy.vendorAgreementReady',
          'vendorAgreementReady',
        )
        .addSelect('subsidy.wcrReady', 'wcrReady')
        .addSelect(
          'subsidy.portalSubmissionDate',
          'portalSubmissionDate',
        )
        .addSelect(
          'subsidy.subsidyRequestedDate',
          'subsidyRequestedDate',
        )
        .addSelect(
          'subsidy.subsidyDisbursedDate',
          'subsidyDisbursedDate',
        )
        .addSelect(
          'subsidy.subsidyAmount',
          'subsidyAmount',
        )
        .addSelect('subsidy.remarks', 'remarks')
        .addSelect('subsidy.updatedBy', 'updatedBy')
        .addSelect(
          'subsidy.updatedByName',
          'updatedByName',
        )
        .addSelect('subsidy.updatedAt', 'updatedAt')
        .orderBy('subsidy.updatedAt', 'DESC')
        .limit(100)
        .getRawMany(),
    ]);

    const managerIds = managerWiseRows
      .map((row) => Number(row.userId || 0))
      .filter(Boolean);

    const managers = managerIds.length
      ? await this.userRepository
          .createQueryBuilder('user')
          .where('user.id IN (:...managerIds)', {
            managerIds,
          })
          .getMany()
      : [];

    const managerNameMap = new Map(
      managers.map((manager) => [
        Number(manager.id),
        manager.name ||
          manager.email ||
          `User #${manager.id}`,
      ]),
    );

    const processedFiles =
      plantImagesReceived +
      dcrCertificateReadyStatus +
      submissionDone +
      subsidyRequested +
      subsidyRedeemed +
      subsidyDisbursed;

    const disbursementSuccessPercent =
      totalSubsidyFiles > 0
        ? Math.round(
            (subsidyDisbursed / totalSubsidyFiles) *
              100,
          )
        : 0;

    const filesMissingAnyChecklistItem =
      fileRows.filter((row) => {
        return !(
          row.dcrCertificateReady === true ||
          row.dcrCertificateReady === 'true'
        ) ||
          !(
            row.panelWarrantyReceived === true ||
            row.panelWarrantyReceived === 'true'
          ) ||
          !(
            row.inverterWarrantyReceived === true ||
            row.inverterWarrantyReceived === 'true'
          ) ||
          !(
            row.vendorAgreementReady === true ||
            row.vendorAgreementReady === 'true'
          ) ||
          !(
            row.wcrReady === true ||
            row.wcrReady === 'true'
          );
      }).length;

    const filesWithoutPortalSubmissionDate =
      fileRows.filter(
        (row) => !row.portalSubmissionDate,
      ).length;

    const filesWithoutSubsidyRequestedDate =
      fileRows.filter(
        (row) =>
          [
            ProjectSubsidyStatus.SUBSIDY_REQUESTED,
            ProjectSubsidyStatus.SUBSIDY_REDEEMED,
            ProjectSubsidyStatus.SUBSIDY_DISBURSED,
          ].includes(row.status) &&
          !row.subsidyRequestedDate,
      ).length;

    const filesWithoutDisbursementDate =
      fileRows.filter(
        (row) =>
          row.status ===
            ProjectSubsidyStatus.SUBSIDY_DISBURSED &&
          !row.subsidyDisbursedDate,
      ).length;

    const filesWithoutSubsidyAmount =
      fileRows.filter(
        (row) =>
          [
            ProjectSubsidyStatus.SUBSIDY_REDEEMED,
            ProjectSubsidyStatus.SUBSIDY_DISBURSED,
          ].includes(row.status) &&
          Number(row.subsidyAmount || 0) <= 0,
      ).length;

    return {
      department: 'PROJECTS',
      role: 'SUBSIDY_MANAGER',
      title: 'Subsidy Manager Work Report',

      cards: {
        totalSubsidyFiles,
        documentPending,
        plantImagesReceived,
        dcrCertificateReadyStatus,
        submissionDone,
        subsidyRequested,
        subsidyRedeemed,
        subsidyDisbursed,
        rejected,

        processedFiles,
        disbursementSuccessPercent,

        dcrCertificateReady,
        panelWarrantyReceived,
        inverterWarrantyReceived,
        vendorAgreementReady,
        wcrReady,

        portalSubmissionRecorded,
        subsidyRequestDateRecorded,
        subsidyDisbursementDateRecorded,

        subsidyAmount: Number(
          amountSummary?.subsidyAmount || 0,
        ),

        disbursedAmount: Number(
          amountSummary?.disbursedAmount || 0,
        ),

        filesMissingAnyChecklistItem,
        filesWithoutPortalSubmissionDate,
        filesWithoutSubsidyRequestedDate,
        filesWithoutDisbursementDate,
        filesWithoutSubsidyAmount,
      },

      charts: {
        subsidyStatusDistribution: {
          type: 'bar',
          title: 'Subsidy File Status Distribution',
          data: statusRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },

        subsidyChecklistProgress: {
          type: 'bar',
          title: 'Subsidy Document Readiness',
          data: [
            {
              label: 'DCR Certificate',
              value: dcrCertificateReady,
            },
            {
              label: 'Panel Warranty',
              value: panelWarrantyReceived,
            },
            {
              label: 'Inverter Warranty',
              value: inverterWarrantyReceived,
            },
            {
              label: 'Vendor Agreement',
              value: vendorAgreementReady,
            },
            {
              label: 'WCR',
              value: wcrReady,
            },
          ],
        },

        subsidyWorkflow: {
          type: 'funnel',
          title: 'Subsidy Processing Workflow',
          data: [
            {
              label: 'Total Subsidy Files',
              value: totalSubsidyFiles,
              percent: 100,
            },
            {
              label: 'Plant Images Received',
              value: plantImagesReceived,
              percent:
                totalSubsidyFiles > 0
                  ? Math.round(
                      (plantImagesReceived /
                        totalSubsidyFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'DCR Certificate Ready',
              value: dcrCertificateReadyStatus,
              percent:
                totalSubsidyFiles > 0
                  ? Math.round(
                      (dcrCertificateReadyStatus /
                        totalSubsidyFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Submission Done',
              value: submissionDone,
              percent:
                totalSubsidyFiles > 0
                  ? Math.round(
                      (submissionDone /
                        totalSubsidyFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Subsidy Requested',
              value: subsidyRequested,
              percent:
                totalSubsidyFiles > 0
                  ? Math.round(
                      (subsidyRequested /
                        totalSubsidyFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Subsidy Redeemed',
              value: subsidyRedeemed,
              percent:
                totalSubsidyFiles > 0
                  ? Math.round(
                      (subsidyRedeemed /
                        totalSubsidyFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Subsidy Disbursed',
              value: subsidyDisbursed,
              percent: disbursementSuccessPercent,
            },
          ],
        },
      },

      rows: managerWiseRows.map((row) => {
        const userId = row.userId
          ? Number(row.userId)
          : null;

        return {
          userId,

          userName: userId
            ? managerNameMap.get(userId) ||
              `User #${userId}`
            : '-',

          totalFiles: Number(row.totalFiles || 0),

          documentPending: Number(
            row.documentPending || 0,
          ),

          submissionDone: Number(
            row.submissionDone || 0,
          ),

          subsidyRequested: Number(
            row.subsidyRequested || 0,
          ),

          subsidyDisbursed: Number(
            row.subsidyDisbursed || 0,
          ),

          rejected: Number(row.rejected || 0),

          disbursedAmount: Number(
            row.disbursedAmount || 0,
          ),
        };
      }),

      fileRows: fileRows.map((row) => ({
        projectId: Number(row.projectId || 0),
        customerName: row.customerName || '',
        customerPhone: row.customerPhone || '',
        branchName: row.branchName || '',
        city: row.city || '',
        zone: row.zone || '',
        status: row.status || '',

        dcrCertificateReady:
          row.dcrCertificateReady === true ||
          row.dcrCertificateReady === 'true',

        panelWarrantyReceived:
          row.panelWarrantyReceived === true ||
          row.panelWarrantyReceived === 'true',

        inverterWarrantyReceived:
          row.inverterWarrantyReceived === true ||
          row.inverterWarrantyReceived === 'true',

        vendorAgreementReady:
          row.vendorAgreementReady === true ||
          row.vendorAgreementReady === 'true',

        wcrReady:
          row.wcrReady === true ||
          row.wcrReady === 'true',

        portalSubmissionDate:
          row.portalSubmissionDate || null,

        subsidyRequestedDate:
          row.subsidyRequestedDate || null,

        subsidyDisbursedDate:
          row.subsidyDisbursedDate || null,

        subsidyAmount: Number(
          row.subsidyAmount || 0,
        ),

        remarks: row.remarks || '',

        updatedBy: row.updatedBy
          ? Number(row.updatedBy)
          : null,

        updatedByName: row.updatedByName || '',
        updatedAt: row.updatedAt,
      })),

      range: { start, end },
    };
  }
}