
import { Repository } from 'typeorm';

import {
  ProjectSubsidyDetail,
  ProjectSubsidyStatus,
} from '../../project/project-subsidy-detail.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class SubsidyManagementActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'SUBSIDY_MANAGEMENT';
  readonly moduleLabel = 'Subsidy Management';

  constructor(
    private readonly subsidyRepository: Repository<ProjectSubsidyDetail>,
  ) {}

  async build(
    context: AnalyticsActivityContext,
  ): Promise<AnalyticsActivitySection> {
    const ids = context.userIds;

    if (!ids.length) {
      return {
        moduleKey: this.moduleKey,
        moduleLabel: this.moduleLabel,
        metrics: [],
        hasActivity: false,
      };
    }

    const subsidies = () =>
      this.subsidyRepository
        .createQueryBuilder('subsidy')
        .innerJoin(
          'project',
          'project',
          'project.id = subsidy.projectId',
        )
        .where('project.isHidden = false')
        .andWhere('subsidy.updatedBy IN (:...ids)', { ids });

    const inPeriod = (
      column: 'updatedAt' | 'createdAt',
    ) =>
      subsidies().andWhere(
        `subsidy.${column} >= :fromDate AND subsidy.${column} <= :toDate`,
        {
          fromDate: context.fromDate,
          toDate: context.toDate,
        },
      );

    const statusDefinitions = [
      ['document_pending', 'Document Pending', ProjectSubsidyStatus.DOCUMENT_PENDING],
      ['plant_images_received', 'Plant Images Received', ProjectSubsidyStatus.PLANT_IMAGES_RECEIVED],
      ['dcr_certificate_ready', 'DCR Certificate Ready', ProjectSubsidyStatus.DCR_CERTIFICATE_READY],
      ['submission_done', 'Submission Done', ProjectSubsidyStatus.SUBMISSION_DONE],
      ['subsidy_requested', 'Subsidy Requested', ProjectSubsidyStatus.SUBSIDY_REQUESTED],
      ['subsidy_redeemed', 'Subsidy Redeemed', ProjectSubsidyStatus.SUBSIDY_REDEEMED],
      ['subsidy_disbursed', 'Subsidy Disbursed', ProjectSubsidyStatus.SUBSIDY_DISBURSED],
      ['rejected', 'Rejected', ProjectSubsidyStatus.REJECTED],
    ] as const;

    const checklistDefinitions = [
      ['registration_completed', 'Registration Completed', 'registrationCompleted'],
      ['dcr_ready', 'DCR Certificate Ready Flag', 'dcrCertificateReady'],
      ['panel_warranty', 'Panel Warranty Received', 'panelWarrantyReceived'],
      ['inverter_warranty', 'Inverter Warranty Received', 'inverterWarrantyReceived'],
      ['vendor_agreement', 'Vendor Agreement Ready', 'vendorAgreementReady'],
      ['wcr_ready', 'WCR Ready', 'wcrReady'],
    ] as const;

    const [
      totalFiles,
      latestUpdatesPeriod,
      recordsCreatedPeriod,
      portalSubmissionRecorded,
      subsidyRequestDateRecorded,
      subsidyDisbursementDateRecorded,
      registrationCompletionDateRecorded,
      totalSubsidyAmount,
      disbursedStatusAmount,
      ...counts
    ] = await Promise.all([
      subsidies().getCount(),

      inPeriod('updatedAt').getCount(),

      inPeriod('createdAt').getCount(),

      subsidies()
        .andWhere('subsidy.portalSubmissionDate IS NOT NULL')
        .getCount(),

      subsidies()
        .andWhere('subsidy.subsidyRequestedDate IS NOT NULL')
        .getCount(),

      subsidies()
        .andWhere('subsidy.subsidyDisbursedDate IS NOT NULL')
        .getCount(),

      subsidies()
        .andWhere('subsidy.registrationCompletedAt IS NOT NULL')
        .getCount(),

      subsidies()
        .select(
          'COALESCE(SUM(subsidy.subsidyAmount), 0)',
          'amount',
        )
        .getRawOne<{ amount: string }>()
        .then((row) => Number(row?.amount || 0)),

      subsidies()
        .select(
          'COALESCE(SUM(subsidy.subsidyAmount), 0)',
          'amount',
        )
        .andWhere('subsidy.status = :status', {
          status: ProjectSubsidyStatus.SUBSIDY_DISBURSED,
        })
        .getRawOne<{ amount: string }>()
        .then((row) => Number(row?.amount || 0)),

      ...statusDefinitions.map(([, , status]) =>
        subsidies()
          .andWhere('subsidy.status = :status', { status })
          .getCount(),
      ),

      ...checklistDefinitions.map(([, , field]) =>
        subsidies()
          .andWhere(`subsidy.${field} = true`)
          .getCount(),
      ),
    ]);

    const statusCounts = counts.slice(
      0,
      statusDefinitions.length,
    );

    const checklistCounts = counts.slice(
      statusDefinitions.length,
    );

    const metrics: AnalyticsActivitySection['metrics'] = [
      {
        key: 'latest_updated_files',
        label: 'Subsidy Files with Latest Update Attributed',
        kind: 'UPDATED_WORK',
        value: totalFiles,
        unit: 'COUNT',
        attribution: 'updatedBy',
        timeScope: 'CURRENT',
        description:
          'Current subsidy files whose latest updater is the selected employee. Not assigned workload or total historical updates.',
      },
      {
        key: 'latest_updated_period',
        label: 'Latest Subsidy Updates During Period',
        kind: 'UPDATED_WORK',
        value: latestUpdatesPeriod,
        unit: 'COUNT',
        attribution: 'updatedBy and updatedAt',
        timeScope: 'PERIOD',
        description:
          'Files whose latest stored update occurred during the reporting period.',
      },
      {
        key: 'records_created_period',
        label: 'Subsidy Records Created During Period',
        kind: 'PIPELINE',
        value: recordsCreatedPeriod,
        unit: 'COUNT',
        attribution: 'updatedBy and createdAt',
        timeScope: 'PERIOD',
        description:
          'New records currently attributed to this latest updater. Original creator is not recorded.',
      },

      ...statusDefinitions.map(([key, label], index) => ({
        key: `status_${key}`,
        label: `Current Status: ${label}`,
        kind: 'PIPELINE' as const,
        value: Number(statusCounts[index] || 0),
        unit: 'COUNT' as const,
        attribution: 'updatedBy and current subsidy status',
        timeScope: 'CURRENT' as const,
        description:
          'Current status of files last updated by this employee; not proof that the employee personally completed the milestone.',
      })),

      ...checklistDefinitions.map(([key, label], index) => ({
        key: `checklist_${key}`,
        label,
        kind: 'PIPELINE' as const,
        value: Number(checklistCounts[index] || 0),
        unit: 'COUNT' as const,
        attribution: 'updatedBy and current checklist flag',
        timeScope: 'CURRENT' as const,
        description:
          'Current checklist or registration state on files last updated by the employee; does not identify who completed the item.',
      })),

      {
        key: 'portal_submission_date_recorded',
        label: 'Portal Submission Date Recorded',
        kind: 'PIPELINE',
        value: portalSubmissionRecorded,
        unit: 'COUNT',
        attribution: 'updatedBy and portalSubmissionDate',
        timeScope: 'CURRENT',
      },
      {
        key: 'subsidy_request_date_recorded',
        label: 'Subsidy Request Date Recorded',
        kind: 'PIPELINE',
        value: subsidyRequestDateRecorded,
        unit: 'COUNT',
        attribution: 'updatedBy and subsidyRequestedDate',
        timeScope: 'CURRENT',
      },
      {
        key: 'subsidy_disbursement_date_recorded',
        label: 'Subsidy Disbursement Date Recorded',
        kind: 'PIPELINE',
        value: subsidyDisbursementDateRecorded,
        unit: 'COUNT',
        attribution: 'updatedBy and subsidyDisbursedDate',
        timeScope: 'CURRENT',
      },
      {
        key: 'registration_completion_date_recorded',
        label: 'Registration Completion Date Recorded',
        kind: 'PIPELINE',
        value: registrationCompletionDateRecorded,
        unit: 'COUNT',
        attribution: 'updatedBy and registrationCompletedAt',
        timeScope: 'CURRENT',
      },
      {
        key: 'recorded_subsidy_amount',
        label: 'Recorded Subsidy Amount',
        kind: 'FINANCIAL',
        value: totalSubsidyAmount,
        unit: 'INR',
        attribution: 'updatedBy and subsidyAmount',
        timeScope: 'CURRENT',
        description:
          'Sum of recorded subsidy amounts on files attributed to the latest updater; not an employee financial achievement.',
      },
      {
        key: 'disbursed_status_subsidy_amount',
        label: 'Recorded Amount on Disbursed-Status Files',
        kind: 'FINANCIAL',
        value: disbursedStatusAmount,
        unit: 'INR',
        attribution: 'updatedBy, current status and subsidyAmount',
        timeScope: 'CURRENT',
        description:
          'Recorded amounts for files currently marked SUBSIDY_DISBURSED. Not independently verified payments or employee achievements.',
      },
    ];

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity: totalFiles > 0,
    };
  }
}
