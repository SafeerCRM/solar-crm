import { Repository } from 'typeorm';

import { ProjectStockItem } from '../../project/project-stock-item.entity';
import { ProjectStockMovement } from '../../project/project-stock-movement.entity';
import { ProjectConsumption } from '../../project/project-consumption.entity';

import {
  AnalyticsQuery,
  getAnalyticsDateRange,
} from '../helpers/analytics-filter.helper';

export class StockAnalyticsBuilder {
  constructor(
    private readonly stockItemRepository: Repository<ProjectStockItem>,
    private readonly stockMovementRepository: Repository<ProjectStockMovement>,
    private readonly consumptionRepository: Repository<ProjectConsumption>,
  ) {}

  async build(query: AnalyticsQuery, user: any) {
  const { start, end } = getAnalyticsDateRange(query);

  const [
    stockSummary,
    movementSummary,
    consumptionSummary,
    categoryRows,
    branchRows,
    lowStockRows,
  ] = await Promise.all([
    this.stockItemRepository
      .createQueryBuilder('stock')
      .where('"stock"."isHidden" = false')
      .select('COUNT(*)', 'totalItems')
      .addSelect('COALESCE(SUM("stock"."currentQuantity"), 0)', 'currentQuantity')
      .addSelect('COALESCE(SUM("stock"."reservedQuantity"), 0)', 'reservedQuantity')
      .addSelect('COALESCE(SUM("stock"."stockValue"), 0)', 'stockValue')
      .addSelect(
        'COUNT(*) FILTER (WHERE "stock"."currentQuantity" <= 0)',
        'zeroStockItems',
      )
      .getRawOne(),

    this.stockMovementRepository
      .createQueryBuilder('movement')
      .where('"movement"."isHidden" = false')
      .andWhere('"movement"."createdAt" BETWEEN :start AND :end', { start, end })
      .select('COUNT(*)', 'movementEntries')
      .addSelect(
        `COALESCE(SUM(CASE WHEN "movement"."movementType" IN ('RECEIVE', 'ADJUST_IN', 'TRANSFER_IN') THEN "movement"."quantity" ELSE 0 END), 0)`,
        'inwardQuantity',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN "movement"."movementType" IN ('ISSUE', 'ADJUST_OUT', 'TRANSFER_OUT') THEN "movement"."quantity" ELSE 0 END), 0)`,
        'outwardQuantity',
      )
      .addSelect('COALESCE(SUM("movement"."totalAmount"), 0)', 'movementAmount')
      .getRawOne(),

    this.consumptionRepository
      .createQueryBuilder('consumption')
      .where('"consumption"."isHidden" = false')
      .andWhere('"consumption"."createdAt" BETWEEN :start AND :end', { start, end })
      .select('COUNT(*)', 'consumptionEntries')
      .addSelect('COALESCE(SUM("consumption"."quantity"), 0)', 'consumedQuantity')
      .addSelect('COALESCE(SUM("consumption"."totalAmount"), 0)', 'consumptionAmount')
      .getRawOne(),

    this.stockItemRepository
      .createQueryBuilder('stock')
      .where('"stock"."isHidden" = false')
      .select('COALESCE("stock"."category", \'Uncategorized\')', 'label')
      .addSelect('COUNT(*)', 'items')
      .addSelect('COALESCE(SUM("stock"."stockValue"), 0)', 'value')
      .groupBy('"stock"."category"')
      .orderBy('value', 'DESC')
      .limit(20)
      .getRawMany(),

    this.stockItemRepository
      .createQueryBuilder('stock')
      .where('"stock"."isHidden" = false')
      .select('COALESCE("stock"."branchName", \'Unassigned Branch\')', 'branchName')
      .addSelect('COUNT(*)', 'items')
      .addSelect('COALESCE(SUM("stock"."currentQuantity"), 0)', 'currentQuantity')
      .addSelect('COALESCE(SUM("stock"."stockValue"), 0)', 'stockValue')
      .groupBy('"stock"."branchName"')
      .orderBy('COALESCE(SUM("stock"."stockValue"), 0)', 'DESC')
      .limit(50)
      .getRawMany(),

    this.stockItemRepository
      .createQueryBuilder('stock')
      .where('"stock"."isHidden" = false')
      .andWhere('"stock"."currentQuantity" <= 0')
      .select('"stock"."materialName"', 'materialName')
      .addSelect('"stock"."category"', 'category')
      .addSelect('"stock"."branchName"', 'branchName')
      .addSelect('"stock"."currentQuantity"', 'currentQuantity')
      .addSelect('"stock"."stockValue"', 'stockValue')
      .orderBy('"stock"."currentQuantity"', 'ASC')
      .limit(50)
      .getRawMany(),
  ]);

  return {
    department: 'STOCK',
    title: 'Stock Intelligence Report',
    cards: {
      totalItems: Number(stockSummary?.totalItems || 0),
      currentQuantity: Number(stockSummary?.currentQuantity || 0),
      reservedQuantity: Number(stockSummary?.reservedQuantity || 0),
      stockValue: Number(stockSummary?.stockValue || 0),
      zeroStockItems: Number(stockSummary?.zeroStockItems || 0),
      movementEntries: Number(movementSummary?.movementEntries || 0),
      inwardQuantity: Number(movementSummary?.inwardQuantity || 0),
      outwardQuantity: Number(movementSummary?.outwardQuantity || 0),
      movementAmount: Number(movementSummary?.movementAmount || 0),
      consumptionEntries: Number(consumptionSummary?.consumptionEntries || 0),
      consumedQuantity: Number(consumptionSummary?.consumedQuantity || 0),
      consumptionAmount: Number(consumptionSummary?.consumptionAmount || 0),
    },
    charts: {
      stockCategoryValue: {
        type: 'bar',
        title: 'Stock Value by Category',
        data: categoryRows.map((row) => ({
          label: row.label,
          value: Number(row.value || 0),
        })),
      },
      stockMovementSummary: {
        type: 'bar',
        title: 'Stock Movement Summary',
        data: [
          { label: 'Inward', value: Number(movementSummary?.inwardQuantity || 0) },
          { label: 'Outward', value: Number(movementSummary?.outwardQuantity || 0) },
          { label: 'Consumed', value: Number(consumptionSummary?.consumedQuantity || 0) },
        ],
      },
    },
    rows: lowStockRows.map((row) => ({
      materialName: row.materialName,
      category: row.category,
      branchName: row.branchName,
      currentQuantity: Number(row.currentQuantity || 0),
      stockValue: Number(row.stockValue || 0),
    })),
    branchRows: branchRows.map((row) => ({
      branchName: row.branchName,
      items: Number(row.items || 0),
      currentQuantity: Number(row.currentQuantity || 0),
      stockValue: Number(row.stockValue || 0),
    })),
    range: { start, end },
  };
}
}