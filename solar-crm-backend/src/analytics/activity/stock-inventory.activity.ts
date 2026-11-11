
import { Repository, SelectQueryBuilder } from 'typeorm';

import {
  ProjectStockMovement,
  ProjectStockMovementType,
} from '../../project/project-stock-movement.entity';

import { ProjectStockFile } from '../../project/project-stock-file.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class StockInventoryActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'STOCK_INVENTORY';
  readonly moduleLabel = 'Stock & Inventory';

  constructor(
    private readonly movementRepository: Repository<ProjectStockMovement>,
    private readonly fileRepository: Repository<ProjectStockFile>,
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

    const movements = () =>
      this.movementRepository
        .createQueryBuilder('movement')
        .where('movement.isHidden = false')
        .andWhere('movement.createdBy IN (:...ids)', { ids });

    const files = () =>
      this.fileRepository
        .createQueryBuilder('file')
        .where('file.isHidden = false')
        .andWhere('file.uploadedBy IN (:...ids)', { ids });

    const period = <T extends object>(
      qb: SelectQueryBuilder<T>,
      alias: 'movement' | 'file',
    ): SelectQueryBuilder<T> =>
      qb.andWhere(
        `${alias}.createdAt >= :fromDate AND ${alias}.createdAt <= :toDate`,
        {
          fromDate: context.fromDate,
          toDate: context.toDate,
        },
      );

    const byType = (...types: ProjectStockMovementType[]) =>
      movements().andWhere(
        'movement.movementType IN (:...types)',
        { types },
      );

    const sumAmount = (
      qb: SelectQueryBuilder<ProjectStockMovement>,
    ): Promise<number> =>
      qb
        .select('COALESCE(SUM(movement.totalAmount), 0)', 'amount')
        .getRawOne<{ amount: string }>()
        .then((row) => Number(row?.amount || 0));

    const receiveTypes = [
      ProjectStockMovementType.RECEIVE,
    ];

    const issueTypes = [
      ProjectStockMovementType.ISSUE,
      ProjectStockMovementType.ISSUE_FROM_AVAILABLE,
      ProjectStockMovementType.ISSUE_FROM_RESERVED,
    ];

    const adjustmentTypes = [
      ProjectStockMovementType.ADJUST_IN,
      ProjectStockMovementType.ADJUST_OUT,
    ];

    const transferTypes = [
      ProjectStockMovementType.TRANSFER_IN,
      ProjectStockMovementType.TRANSFER_OUT,
      ProjectStockMovementType.TRANSFER_OUT_FROM_AVAILABLE,
      ProjectStockMovementType.TRANSFER_OUT_FROM_RESERVED,
    ];

    const reservationTypes = [
      ProjectStockMovementType.RESERVE,
      ProjectStockMovementType.RELEASE_RESERVED,
    ];

    const [
      totalMovements,
      periodMovements,
      received,
      receivedPeriod,
      issued,
      issuedPeriod,
      adjusted,
      adjustedPeriod,
      transferred,
      transferredPeriod,
      reserved,
      reservedPeriod,
      receivedValue,
      receivedValuePeriod,
      issuedValue,
      issuedValuePeriod,
      adjustedValue,
      transferredValue,
      totalFiles,
      periodFiles,
      projectFiles,
      dealerFiles,
      allocatedFiles,
      nonAllocatedFiles,
    ] = await Promise.all([
      movements().getCount(),
      period(movements(), 'movement').getCount(),

      byType(...receiveTypes).getCount(),
      period(byType(...receiveTypes), 'movement').getCount(),

      byType(...issueTypes).getCount(),
      period(byType(...issueTypes), 'movement').getCount(),

      byType(...adjustmentTypes).getCount(),
      period(byType(...adjustmentTypes), 'movement').getCount(),

      byType(...transferTypes).getCount(),
      period(byType(...transferTypes), 'movement').getCount(),

      byType(...reservationTypes).getCount(),
      period(byType(...reservationTypes), 'movement').getCount(),

      sumAmount(byType(...receiveTypes)),
      sumAmount(period(byType(...receiveTypes), 'movement')),

      sumAmount(byType(...issueTypes)),
      sumAmount(period(byType(...issueTypes), 'movement')),

      sumAmount(byType(...adjustmentTypes)),
      sumAmount(byType(...transferTypes)),

      files().getCount(),
      period(files(), 'file').getCount(),

      files()
        .andWhere('file.projectId IS NOT NULL')
        .getCount(),

      files()
        .andWhere('file.dealerId IS NOT NULL')
        .getCount(),

      files()
        .andWhere('file.allocationType IS NOT NULL')
        .getCount(),

      files()
        .andWhere('file.allocationType IS NULL')
        .getCount(),
    ]);

    const metrics: AnalyticsActivitySection['metrics'] = [];

    const add = (
      key: string,
      label: string,
      kind: AnalyticsActivitySection['metrics'][number]['kind'],
      value: number,
      attribution: string,
      timeScope: 'CURRENT' | 'PERIOD',
      unit: 'COUNT' | 'INR' = 'COUNT',
      description?: string,
    ) => {
      metrics.push({
        key,
        label,
        kind,
        value,
        attribution,
        timeScope,
        unit,
        ...(description ? { description } : {}),
      });
    };

    add('stock_movements', 'Stock Movements Recorded',
      'CREATED_WORK', totalMovements, 'movement.createdBy', 'CURRENT');

    add('stock_movements_period', 'Stock Movements During Period',
      'CREATED_WORK', periodMovements,
      'movement.createdBy and createdAt', 'PERIOD');

    add('stock_received', 'Stock Receiving Transactions',
      'COMPLETED_WORK', received,
      'movement.createdBy and movementType', 'CURRENT');

    add('stock_received_period', 'Stock Receiving Transactions During Period',
      'COMPLETED_WORK', receivedPeriod,
      'movement.createdBy, movementType and createdAt', 'PERIOD');

    add('stock_issued', 'Stock Issue Transactions',
      'COMPLETED_WORK', issued,
      'movement.createdBy and movementType', 'CURRENT');

    add('stock_issued_period', 'Stock Issue Transactions During Period',
      'COMPLETED_WORK', issuedPeriod,
      'movement.createdBy, movementType and createdAt', 'PERIOD');

    add('stock_adjustments', 'Stock Adjustment Transactions',
      'UPDATED_WORK', adjusted,
      'movement.createdBy and movementType', 'CURRENT');

    add('stock_adjustments_period', 'Stock Adjustments During Period',
      'UPDATED_WORK', adjustedPeriod,
      'movement.createdBy, movementType and createdAt', 'PERIOD');

    add('stock_transfers', 'Stock Transfer Movement Records',
      'COMPLETED_WORK', transferred,
      'movement.createdBy and movementType', 'CURRENT',
      'COUNT', 'Counts movement records, not unique end-to-end transfers.');

    add('stock_transfers_period', 'Stock Transfer Movement Records During Period',
      'COMPLETED_WORK', transferredPeriod,
      'movement.createdBy, movementType and createdAt', 'PERIOD');

    add('stock_reservations', 'Stock Reservation and Release Records',
      'UPDATED_WORK', reserved,
      'movement.createdBy and movementType', 'CURRENT');

    add('stock_reservations_period', 'Stock Reservations and Releases During Period',
      'UPDATED_WORK', reservedPeriod,
      'movement.createdBy, movementType and createdAt', 'PERIOD');

    add('stock_received_value', 'Recorded Stock Receiving Value',
      'FINANCIAL', receivedValue,
      'movement.createdBy, movementType and totalAmount', 'CURRENT', 'INR');

    add('stock_received_value_period', 'Recorded Receiving Value During Period',
      'FINANCIAL', receivedValuePeriod,
      'movement.createdBy, movementType, createdAt and totalAmount',
      'PERIOD', 'INR');

    add('stock_issued_value', 'Recorded Stock Issue Value',
      'FINANCIAL', issuedValue,
      'movement.createdBy, movementType and totalAmount', 'CURRENT', 'INR');

    add('stock_issued_value_period', 'Recorded Issue Value During Period',
      'FINANCIAL', issuedValuePeriod,
      'movement.createdBy, movementType, createdAt and totalAmount',
      'PERIOD', 'INR');

    add('stock_adjustment_value', 'Recorded Stock Adjustment Value',
      'FINANCIAL', adjustedValue,
      'movement.createdBy, movementType and totalAmount', 'CURRENT', 'INR');

    add('stock_transfer_value', 'Recorded Stock Transfer Movement Value',
      'FINANCIAL', transferredValue,
      'movement.createdBy, movementType and totalAmount', 'CURRENT', 'INR',
      'May include both incoming and outgoing legs of a transfer.');

    add('stock_files_uploaded', 'Stock Documents Uploaded',
      'CREATED_WORK', totalFiles, 'file.uploadedBy', 'CURRENT');

    add('stock_files_uploaded_period', 'Stock Documents Uploaded During Period',
      'CREATED_WORK', periodFiles,
      'file.uploadedBy and createdAt', 'PERIOD');

    add('stock_project_files', 'Stock Documents Linked to Projects',
      'CREATED_WORK', projectFiles,
      'file.uploadedBy and projectId', 'CURRENT');

    add('stock_dealer_files', 'Stock Documents Linked to Dealers',
      'CREATED_WORK', dealerFiles,
      'file.uploadedBy and dealerId', 'CURRENT');

    add('stock_allocated_files', 'Stock Documents with Allocation Type',
      'CREATED_WORK', allocatedFiles,
      'file.uploadedBy and allocationType', 'CURRENT');

    add('stock_unallocated_files', 'Stock Documents without Allocation Type',
      'PIPELINE', nonAllocatedFiles,
      'file.uploadedBy and allocationType', 'CURRENT');

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity: totalMovements > 0 || totalFiles > 0,
    };
  }
}
