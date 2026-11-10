import { Repository, SelectQueryBuilder } from 'typeorm';

import {
  ProjectElectricityDetail,
  ProjectElectricityStatus,
} from '../../project/project-electricity-detail.entity';

import {
  ProjectElectricityWork,
  ProjectElectricityWorkType,
  ProjectElectricityWorkStatus,
} from '../../project/project-electricity-work.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class ElectricityManagementActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'ELECTRICITY_MANAGEMENT';
  readonly moduleLabel = 'Electricity Management';

  constructor(
    private readonly electricityRepository: Repository<ProjectElectricityDetail>,
    private readonly workRepository: Repository<ProjectElectricityWork>,
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

    const electricity = () =>
      this.electricityRepository
        .createQueryBuilder('electricity')
        .innerJoin(
          'project',
          'project',
          'project.id = electricity.projectId',
        )
        .where('project.isHidden = false')
        .andWhere('electricity.updatedBy IN (:...ids)', { ids });

    const work = (type: ProjectElectricityWorkType) =>
      this.workRepository
        .createQueryBuilder('work')
        .innerJoin(
          'project',
          'project',
          'project.id = work.projectId',
        )
        .where('project.isHidden = false')
        .andWhere('work.updatedBy IN (:...ids)', { ids })
        .andWhere('work.workType = :workType', {
          workType: type,
        });

    const period = <T extends object>(
  qb: SelectQueryBuilder<T>,
  column: 'updatedAt' | 'createdAt',
  alias: 'electricity' | 'work',
): SelectQueryBuilder<T> =>
  qb.andWhere(
    `${alias}.${column} >= :fromDate AND ${alias}.${column} <= :toDate`,
    {
      fromDate: context.fromDate,
      toDate: context.toDate,
    },
  );

    const electricityStatuses = [
      ['document_pending', 'Document Pending', ProjectElectricityStatus.DOCUMENT_PENDING],
      ['file_submitted', 'File Submitted', ProjectElectricityStatus.FILE_SUBMITTED],
      ['site_visit_done', 'Site Visit Done', ProjectElectricityStatus.SITE_VISIT_DONE],
      ['demand_deposited', 'Demand Deposited', ProjectElectricityStatus.DEMAND_DEPOSITED],
      ['meter_testing_done', 'Meter Testing Done', ProjectElectricityStatus.METER_TESTING_DONE],
      ['net_meter_installed', 'Net Meter Installed', ProjectElectricityStatus.NET_METER_INSTALLED],
      ['connection_active', 'Connection Active', ProjectElectricityStatus.CONNECTION_ACTIVE],
      ['rejected', 'Rejected', ProjectElectricityStatus.REJECTED],
    ] as const;

    const workStatuses = [
      ['document_pending', 'Document Pending', ProjectElectricityWorkStatus.DOCUMENT_PENDING],
      ['file_submitted', 'File Submitted', ProjectElectricityWorkStatus.FILE_SUBMITTED],
      ['in_process', 'In Process', ProjectElectricityWorkStatus.IN_PROCESS],
      ['approved', 'Approved', ProjectElectricityWorkStatus.APPROVED],
      ['completed', 'Completed', ProjectElectricityWorkStatus.COMPLETED],
      ['rejected', 'Rejected', ProjectElectricityWorkStatus.REJECTED],
    ] as const;

    const milestones = [
      ['file_submission', 'File Submission Date', 'fileSubmissionDate'],
      ['site_visit', 'Site Visit Date', 'siteVisitDate'],
      ['demand_deposit', 'Demand Deposit Date', 'demandDepositDate'],
      ['meter_testing', 'Meter Testing Date', 'meterTestingDate'],
      ['net_meter_installation', 'Net Meter Installation Date', 'netMeterInstallationDate'],
    ] as const;

    const [
      totalFiles,
      updatedPeriod,
      createdPeriod,
      depositAmount,
      ...electricityCounts
    ] = await Promise.all([
      electricity().getCount(),
      period(electricity(), 'updatedAt', 'electricity').getCount(),
      period(electricity(), 'createdAt', 'electricity').getCount(),
      electricity()
        .select(
          'COALESCE(SUM(electricity.demandDepositAmount), 0)',
          'amount',
        )
        .getRawOne<{ amount: string }>()
        .then((row) => Number(row?.amount || 0)),
      ...electricityStatuses.map(([, , status]) =>
        electricity()
          .andWhere('electricity.status = :status', { status })
          .getCount(),
      ),
      ...milestones.map(([, , field]) =>
        electricity()
          .andWhere(`electricity.${field} IS NOT NULL`)
          .getCount(),
      ),
    ]);

    const metrics: AnalyticsActivitySection['metrics'] = [
      {
        key: 'latest_updated_files',
        label: 'Electricity Files with Latest Update Attributed',
        kind: 'UPDATED_WORK',
        value: totalFiles,
        unit: 'COUNT',
        attribution: 'updatedBy',
        timeScope: 'CURRENT',
        description:
          'Current electricity files whose latest updater is the selected employee. Not assigned workload or historical update count.',
      },
      {
        key: 'latest_updated_period',
        label: 'Latest Electricity Updates During Period',
        kind: 'UPDATED_WORK',
        value: updatedPeriod,
        unit: 'COUNT',
        attribution: 'updatedBy and updatedAt',
        timeScope: 'PERIOD',
      },
      {
        key: 'records_created_period',
        label: 'Electricity Records Created During Period',
        kind: 'PIPELINE',
        value: createdPeriod,
        unit: 'COUNT',
        attribution: 'updatedBy and createdAt',
        timeScope: 'PERIOD',
        description:
          'Records currently attributed to the latest updater. Original creator is not recorded.',
      },

      ...electricityStatuses.map(([key, label], index) => ({
        key: `status_${key}`,
        label: `Current Status: ${label}`,
        kind: 'PIPELINE' as const,
        value: Number(electricityCounts[index] || 0),
        unit: 'COUNT' as const,
        attribution: 'updatedBy and current electricity status',
        timeScope: 'CURRENT' as const,
      })),

      ...milestones.map(([key, label], index) => ({
        key: `${key}_date_recorded`,
        label: `${label} Recorded`,
        kind: 'PIPELINE' as const,
        value: Number(
          electricityCounts[electricityStatuses.length + index] || 0,
        ),
        unit: 'COUNT' as const,
        attribution: 'updatedBy and recorded milestone date',
        timeScope: 'CURRENT' as const,
      })),

      {
        key: 'recorded_demand_deposit_amount',
        label: 'Recorded Demand Deposit Amount',
        kind: 'FINANCIAL',
        value: depositAmount,
        unit: 'INR',
        attribution: 'updatedBy and demandDepositAmount',
        timeScope: 'CURRENT',
        description:
          'Sum of recorded demand deposit amounts, not verified payments personally collected by the employee.',
      },
    ];

    const workTypes = [
      {
        type: ProjectElectricityWorkType.NAME_CHANGE,
        key: 'name_change',
        label: 'Name Change',
      },
      {
        type: ProjectElectricityWorkType.NEW_CONNECTION,
        key: 'new_connection',
        label: 'New Connection',
      },
    ];

    let totalAdditionalWork = 0;

    for (const { type, key, label } of workTypes) {
      const [
        workTotal,
        workUpdatedPeriod,
        workCreatedPeriod,
        applicationDateCount,
        completionDateCount,
        ...statusCounts
      ] = await Promise.all([
        work(type).getCount(),
        period(work(type), 'updatedAt', 'work').getCount(),
        period(work(type), 'createdAt', 'work').getCount(),
        work(type)
          .andWhere('work.applicationDate IS NOT NULL')
          .getCount(),
        work(type)
          .andWhere('work.completionDate IS NOT NULL')
          .getCount(),
        ...workStatuses.map(([, , status]) =>
          work(type)
            .andWhere('work.status = :status', { status })
            .getCount(),
        ),
      ]);

      totalAdditionalWork += workTotal;

      metrics.push(
        {
          key: `${key}_latest_updated_records`,
          label: `${label}: Latest Updated Records`,
          kind: 'UPDATED_WORK',
          value: workTotal,
          unit: 'COUNT',
          attribution: 'updatedBy',
          timeScope: 'CURRENT',
        },
        {
          key: `${key}_latest_updated_period`,
          label: `${label}: Latest Updates During Period`,
          kind: 'UPDATED_WORK',
          value: workUpdatedPeriod,
          unit: 'COUNT',
          attribution: 'updatedBy and updatedAt',
          timeScope: 'PERIOD',
        },
        {
          key: `${key}_records_created_period`,
          label: `${label}: Records Created During Period`,
          kind: 'PIPELINE',
          value: workCreatedPeriod,
          unit: 'COUNT',
          attribution: 'updatedBy and createdAt',
          timeScope: 'PERIOD',
        },
        ...workStatuses.map(([statusKey, statusLabel], index) => ({
          key: `${key}_status_${statusKey}`,
          label: `${label}: ${statusLabel}`,
          kind: 'PIPELINE' as const,
          value: Number(statusCounts[index] || 0),
          unit: 'COUNT' as const,
          attribution: 'updatedBy and current work status',
          timeScope: 'CURRENT' as const,
        })),
        {
          key: `${key}_application_date_recorded`,
          label: `${label}: Application Date Recorded`,
          kind: 'PIPELINE',
          value: applicationDateCount,
          unit: 'COUNT',
          attribution: 'updatedBy and applicationDate',
          timeScope: 'CURRENT',
        },
        {
          key: `${key}_completion_date_recorded`,
          label: `${label}: Completion Date Recorded`,
          kind: 'PIPELINE',
          value: completionDateCount,
          unit: 'COUNT',
          attribution: 'updatedBy and completionDate',
          timeScope: 'CURRENT',
        },
      );
    }

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity: totalFiles + totalAdditionalWork > 0,
    };
  }
}