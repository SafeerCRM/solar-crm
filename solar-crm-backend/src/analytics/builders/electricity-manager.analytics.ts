import { Repository } from 'typeorm';

import { User } from '../../users/user.entity';
import { Project } from '../../project/project.entity';
import {
  ProjectElectricityDetail,
  ProjectElectricityStatus,
} from '../../project/project-electricity-detail.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
  normalizeAnalyticsText,
  canViewAllAnalytics,
} from '../helpers/analytics-filter.helper';

export class ElectricityManagerAnalyticsBuilder {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly projectRepository: Repository<Project>,
    private readonly electricityDetailRepository: Repository<ProjectElectricityDetail>,
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

    const electricityQb = this.electricityDetailRepository
      .createQueryBuilder('electricity')
      .innerJoin(
        Project,
        'project',
        'project.id = electricity.projectId AND project.isHidden = false',
      )
      .where(
        'electricity.updatedAt BETWEEN :start AND :end',
        { start, end },
      );

    if (userIds.length) {
      electricityQb.andWhere(
        'electricity.updatedBy IN (:...userIds)',
        { userIds },
      );
    }

    const branchName = normalizeAnalyticsText(
      query.branchName,
    );

    if (branchName) {
      electricityQb.andWhere(
        `LOWER(COALESCE(project.branchName, '')) LIKE :branchName`,
        {
          branchName: `%${branchName}%`,
        },
      );
    }

    const city = normalizeAnalyticsText(query.city);

    if (city) {
      electricityQb.andWhere(
        `LOWER(COALESCE(project.city, '')) LIKE :city`,
        {
          city: `%${city}%`,
        },
      );
    }

    const zone = normalizeAnalyticsText(query.zone);

    if (zone) {
      electricityQb.andWhere(
        `LOWER(COALESCE(project.zone, '')) LIKE :zone`,
        {
          zone: `%${zone}%`,
        },
      );
    }

    const [
      totalElectricityFiles,
      documentPending,
      fileSubmitted,
      siteVisitDone,
      demandDeposited,
      meterTestingDone,
      netMeterInstalled,
      connectionActive,
      rejected,

      fileSubmissionRecorded,
      siteVisitRecorded,
      demandDepositRecorded,
      meterTestingRecorded,
      netMeterInstallationRecorded,

      amountSummary,
      statusRows,
      discomRows,
      managerWiseRows,
      fileRows,
    ] = await Promise.all([
      electricityQb.clone().getCount(),

      electricityQb
        .clone()
        .andWhere('electricity.status = :status', {
          status:
            ProjectElectricityStatus.DOCUMENT_PENDING,
        })
        .getCount(),

      electricityQb
        .clone()
        .andWhere('electricity.status = :status', {
          status:
            ProjectElectricityStatus.FILE_SUBMITTED,
        })
        .getCount(),

      electricityQb
        .clone()
        .andWhere('electricity.status = :status', {
          status:
            ProjectElectricityStatus.SITE_VISIT_DONE,
        })
        .getCount(),

      electricityQb
        .clone()
        .andWhere('electricity.status = :status', {
          status:
            ProjectElectricityStatus.DEMAND_DEPOSITED,
        })
        .getCount(),

      electricityQb
        .clone()
        .andWhere('electricity.status = :status', {
          status:
            ProjectElectricityStatus.METER_TESTING_DONE,
        })
        .getCount(),

      electricityQb
        .clone()
        .andWhere('electricity.status = :status', {
          status:
            ProjectElectricityStatus.NET_METER_INSTALLED,
        })
        .getCount(),

      electricityQb
        .clone()
        .andWhere('electricity.status = :status', {
          status:
            ProjectElectricityStatus.CONNECTION_ACTIVE,
        })
        .getCount(),

      electricityQb
        .clone()
        .andWhere('electricity.status = :status', {
          status: ProjectElectricityStatus.REJECTED,
        })
        .getCount(),

      electricityQb
        .clone()
        .andWhere(
          'electricity.fileSubmissionDate IS NOT NULL',
        )
        .getCount(),

      electricityQb
        .clone()
        .andWhere(
          'electricity.siteVisitDate IS NOT NULL',
        )
        .getCount(),

      electricityQb
        .clone()
        .andWhere(
          'electricity.demandDepositDate IS NOT NULL',
        )
        .getCount(),

      electricityQb
        .clone()
        .andWhere(
          'electricity.meterTestingDate IS NOT NULL',
        )
        .getCount(),

      electricityQb
        .clone()
        .andWhere(
          'electricity.netMeterInstallationDate IS NOT NULL',
        )
        .getCount(),

      electricityQb
        .clone()
        .select(
          'COALESCE(SUM(electricity.demandDepositAmount), 0)',
          'demandDepositAmount',
        )
        .getRawOne(),

      electricityQb
        .clone()
        .select('electricity."status"::text', 'label')
        .addSelect('COUNT(*)', 'value')
        .groupBy('electricity."status"')
        .orderBy('COUNT(*)', 'DESC')
        .getRawMany(),

      electricityQb
        .clone()
        .select(
          `COALESCE(NULLIF(TRIM(electricity."discomName"), ''), 'UNASSIGNED')`,
          'label',
        )
        .addSelect('COUNT(*)', 'value')
        .groupBy(
          `COALESCE(NULLIF(TRIM(electricity."discomName"), ''), 'UNASSIGNED')`,
        )
        .orderBy('COUNT(*)', 'DESC')
        .getRawMany(),

      electricityQb
        .clone()
        .select('electricity.updatedBy', 'userId')
        .addSelect('COUNT(*)', 'totalFiles')
        .addSelect(
          `SUM(
            CASE
              WHEN electricity.status = :documentPending
              THEN 1 ELSE 0
            END
          )`,
          'documentPending',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN electricity.status = :fileSubmitted
              THEN 1 ELSE 0
            END
          )`,
          'fileSubmitted',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN electricity.status = :demandDeposited
              THEN 1 ELSE 0
            END
          )`,
          'demandDeposited',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN electricity.status = :netMeterInstalled
              THEN 1 ELSE 0
            END
          )`,
          'netMeterInstalled',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN electricity.status = :connectionActive
              THEN 1 ELSE 0
            END
          )`,
          'connectionActive',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN electricity.status = :rejected
              THEN 1 ELSE 0
            END
          )`,
          'rejected',
        )
        .addSelect(
          `COALESCE(
            SUM(electricity."demandDepositAmount"),
            0
          )`,
          'demandDepositAmount',
        )
        .setParameters({
          documentPending:
            ProjectElectricityStatus.DOCUMENT_PENDING,
          fileSubmitted:
            ProjectElectricityStatus.FILE_SUBMITTED,
          demandDeposited:
            ProjectElectricityStatus.DEMAND_DEPOSITED,
          netMeterInstalled:
            ProjectElectricityStatus.NET_METER_INSTALLED,
          connectionActive:
            ProjectElectricityStatus.CONNECTION_ACTIVE,
          rejected:
            ProjectElectricityStatus.REJECTED,
        })
        .andWhere('electricity.updatedBy IS NOT NULL')
        .groupBy('electricity.updatedBy')
        .orderBy('COUNT(*)', 'DESC')
        .limit(50)
        .getRawMany(),

      electricityQb
        .clone()
        .select('electricity.projectId', 'projectId')
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
        .addSelect(
          'electricity.discomName',
          'discomName',
        )
        .addSelect('electricity.status', 'status')
        .addSelect(
          'electricity.fileSubmissionDate',
          'fileSubmissionDate',
        )
        .addSelect(
          'electricity.siteVisitDate',
          'siteVisitDate',
        )
        .addSelect(
          'electricity.demandDepositDate',
          'demandDepositDate',
        )
        .addSelect(
          'electricity.demandDepositAmount',
          'demandDepositAmount',
        )
        .addSelect(
          'electricity.meterTestingDate',
          'meterTestingDate',
        )
        .addSelect(
          'electricity.netMeterInstallationDate',
          'netMeterInstallationDate',
        )
        .addSelect(
          'electricity.remarks',
          'remarks',
        )
        .addSelect(
          'electricity.updatedBy',
          'updatedBy',
        )
        .addSelect(
          'electricity.updatedByName',
          'updatedByName',
        )
        .addSelect(
          'electricity.updatedAt',
          'updatedAt',
        )
        .orderBy('electricity.updatedAt', 'DESC')
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
      fileSubmitted +
      siteVisitDone +
      demandDeposited +
      meterTestingDone +
      netMeterInstalled +
      connectionActive;

    const connectionSuccessPercent =
      totalElectricityFiles > 0
        ? Math.round(
            (connectionActive /
              totalElectricityFiles) *
              100,
          )
        : 0;

    /*
     * Data-quality checks intentionally follow the
     * CURRENT workflow status.
     *
     * A missing date is treated as an error only when
     * the file has reached that stage or a later stage.
     */

    const stageRank: Record<string, number> = {
      [ProjectElectricityStatus.DOCUMENT_PENDING]: 0,
      [ProjectElectricityStatus.FILE_SUBMITTED]: 1,
      [ProjectElectricityStatus.SITE_VISIT_DONE]: 2,
      [ProjectElectricityStatus.DEMAND_DEPOSITED]: 3,
      [ProjectElectricityStatus.METER_TESTING_DONE]: 4,
      [ProjectElectricityStatus.NET_METER_INSTALLED]: 5,
      [ProjectElectricityStatus.CONNECTION_ACTIVE]: 6,
    };

    const reachedStage = (
      status: string,
      target: ProjectElectricityStatus,
    ) => {
      const currentRank = stageRank[status];
      const targetRank = stageRank[target];

      return (
        currentRank !== undefined &&
        targetRank !== undefined &&
        currentRank >= targetRank
      );
    };

    const filesWithoutDiscom =
      fileRows.filter(
        (row) =>
          !String(row.discomName || '').trim(),
      ).length;

    const filesWithoutFileSubmissionDate =
      fileRows.filter(
        (row) =>
          reachedStage(
            row.status,
            ProjectElectricityStatus.FILE_SUBMITTED,
          ) &&
          !row.fileSubmissionDate,
      ).length;

    const filesWithoutSiteVisitDate =
      fileRows.filter(
        (row) =>
          reachedStage(
            row.status,
            ProjectElectricityStatus.SITE_VISIT_DONE,
          ) &&
          !row.siteVisitDate,
      ).length;

    const filesWithoutDemandDepositDate =
      fileRows.filter(
        (row) =>
          reachedStage(
            row.status,
            ProjectElectricityStatus.DEMAND_DEPOSITED,
          ) &&
          !row.demandDepositDate,
      ).length;

    const filesWithoutDemandDepositAmount =
      fileRows.filter(
        (row) =>
          reachedStage(
            row.status,
            ProjectElectricityStatus.DEMAND_DEPOSITED,
          ) &&
          Number(row.demandDepositAmount || 0) <= 0,
      ).length;

    const filesWithoutMeterTestingDate =
      fileRows.filter(
        (row) =>
          reachedStage(
            row.status,
            ProjectElectricityStatus.METER_TESTING_DONE,
          ) &&
          !row.meterTestingDate,
      ).length;

    const filesWithoutNetMeterInstallationDate =
      fileRows.filter(
        (row) =>
          reachedStage(
            row.status,
            ProjectElectricityStatus.NET_METER_INSTALLED,
          ) &&
          !row.netMeterInstallationDate,
      ).length;

    return {
      department: 'PROJECTS',
      role: 'ELECTRICITY_MANAGER',
      title: 'Electricity Manager Work Report',

      cards: {
        totalElectricityFiles,

        documentPending,
        fileSubmitted,
        siteVisitDone,
        demandDeposited,
        meterTestingDone,
        netMeterInstalled,
        connectionActive,
        rejected,

        processedFiles,
        connectionSuccessPercent,

        demandDepositAmount: Number(
          amountSummary?.demandDepositAmount || 0,
        ),

        fileSubmissionRecorded,
        siteVisitRecorded,
        demandDepositRecorded,
        meterTestingRecorded,
        netMeterInstallationRecorded,

        filesWithoutDiscom,
        filesWithoutFileSubmissionDate,
        filesWithoutSiteVisitDate,
        filesWithoutDemandDepositDate,
        filesWithoutDemandDepositAmount,
        filesWithoutMeterTestingDate,
        filesWithoutNetMeterInstallationDate,
      },

      charts: {
        electricityStatusDistribution: {
          type: 'bar',
          title: 'Electricity File Status Distribution',
          data: statusRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },

        discomDistribution: {
          type: 'bar',
          title: 'DISCOM Distribution',
          data: discomRows.map((row) => ({
            label: row.label,
            value: Number(row.value || 0),
          })),
        },

        electricityWorkflow: {
          type: 'funnel',
          title: 'Electricity Processing Workflow',
          data: [
            {
              label: 'Total Electricity Files',
              value: totalElectricityFiles,
              percent: 100,
            },
            {
              label: 'File Submitted',
              value: fileSubmitted,
              percent:
                totalElectricityFiles > 0
                  ? Math.round(
                      (fileSubmitted /
                        totalElectricityFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Site Visit Done',
              value: siteVisitDone,
              percent:
                totalElectricityFiles > 0
                  ? Math.round(
                      (siteVisitDone /
                        totalElectricityFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Demand Deposited',
              value: demandDeposited,
              percent:
                totalElectricityFiles > 0
                  ? Math.round(
                      (demandDeposited /
                        totalElectricityFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Meter Testing Done',
              value: meterTestingDone,
              percent:
                totalElectricityFiles > 0
                  ? Math.round(
                      (meterTestingDone /
                        totalElectricityFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Net Meter Installed',
              value: netMeterInstalled,
              percent:
                totalElectricityFiles > 0
                  ? Math.round(
                      (netMeterInstalled /
                        totalElectricityFiles) *
                        100,
                    )
                  : 0,
            },
            {
              label: 'Connection Active',
              value: connectionActive,
              percent: connectionSuccessPercent,
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

          totalFiles: Number(
            row.totalFiles || 0,
          ),

          documentPending: Number(
            row.documentPending || 0,
          ),

          fileSubmitted: Number(
            row.fileSubmitted || 0,
          ),

          demandDeposited: Number(
            row.demandDeposited || 0,
          ),

          netMeterInstalled: Number(
            row.netMeterInstalled || 0,
          ),

          connectionActive: Number(
            row.connectionActive || 0,
          ),

          rejected: Number(
            row.rejected || 0,
          ),

          demandDepositAmount: Number(
            row.demandDepositAmount || 0,
          ),
        };
      }),

      fileRows: fileRows.map((row) => ({
        projectId: Number(
          row.projectId || 0,
        ),

        customerName:
          row.customerName || '',

        customerPhone:
          row.customerPhone || '',

        branchName:
          row.branchName || '',

        city: row.city || '',
        zone: row.zone || '',

        discomName:
          row.discomName || '',

        status: row.status || '',

        fileSubmissionDate:
          row.fileSubmissionDate || null,

        siteVisitDate:
          row.siteVisitDate || null,

        demandDepositDate:
          row.demandDepositDate || null,

        demandDepositAmount: Number(
          row.demandDepositAmount || 0,
        ),

        meterTestingDate:
          row.meterTestingDate || null,

        netMeterInstallationDate:
          row.netMeterInstallationDate || null,

        remarks: row.remarks || '',

        updatedBy: row.updatedBy
          ? Number(row.updatedBy)
          : null,

        updatedByName:
          row.updatedByName || '',

        updatedAt: row.updatedAt,
      })),

      range: { start, end },
    };
  }
}