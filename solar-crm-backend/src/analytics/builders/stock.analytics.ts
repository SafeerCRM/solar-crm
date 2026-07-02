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
      zeroStockRows,
    ] = await Promise.all([
      this.stockItemRepository
        .createQueryBuilder('stock')
        .where('"stock"."isHidden" = false')
        .select('COUNT(*)', 'totalItems')
        .addSelect('COALESCE(SUM("stock"."currentQuantity"), 0)', 'currentQuantity')
        .addSelect('COALESCE(SUM("stock"."reservedQuantity"), 0)', 'reservedQuantity')
        .addSelect('COALESCE(SUM("stock"."stockValue"), 0)', 'stockValue')
        .addSelect('COUNT(*) FILTER (WHERE "stock"."currentQuantity" <= 0)', 'zeroStockItems')
        .getRawOne(),

      this.stockMovementRepository
        .createQueryBuilder('movement')
        .where('"movement"."isHidden" = false')
        .andWhere('"movement"."createdAt" BETWEEN :start AND :end', { start, end })
        .select('COUNT(*)', 'movementEntries')
        .addSelect(`COALESCE(SUM(CASE WHEN "movement"."movementType" = 'RECEIVE' THEN "movement"."quantity" ELSE 0 END), 0)`, 'receiveQuantity')
        .addSelect(`COALESCE(SUM(CASE WHEN "movement"."movementType" = 'ISSUE' THEN "movement"."quantity" ELSE 0 END), 0)`, 'issueQuantity')
        .addSelect(`COALESCE(SUM(CASE WHEN "movement"."movementType" = 'ADJUST_IN' THEN "movement"."quantity" ELSE 0 END), 0)`, 'adjustInQuantity')
        .addSelect(`COALESCE(SUM(CASE WHEN "movement"."movementType" = 'ADJUST_OUT' THEN "movement"."quantity" ELSE 0 END), 0)`, 'adjustOutQuantity')
        .addSelect(`COALESCE(SUM(CASE WHEN "movement"."movementType" = 'TRANSFER_IN' THEN "movement"."quantity" ELSE 0 END), 0)`, 'transferInQuantity')
        .addSelect(`COALESCE(SUM(CASE WHEN "movement"."movementType" = 'TRANSFER_OUT' THEN "movement"."quantity" ELSE 0 END), 0)`, 'transferOutQuantity')
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
        .orderBy('COALESCE(SUM("stock"."stockValue"), 0)', 'DESC')
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
        receiveQuantity: Number(movementSummary?.receiveQuantity || 0),
        issueQuantity: Number(movementSummary?.issueQuantity || 0),
        adjustInQuantity: Number(movementSummary?.adjustInQuantity || 0),
        adjustOutQuantity: Number(movementSummary?.adjustOutQuantity || 0),
        transferInQuantity: Number(movementSummary?.transferInQuantity || 0),
        transferOutQuantity: Number(movementSummary?.transferOutQuantity || 0),
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
            { label: 'Receive', value: Number(movementSummary?.receiveQuantity || 0) },
            { label: 'Issue', value: Number(movementSummary?.issueQuantity || 0) },
            { label: 'Adjust In', value: Number(movementSummary?.adjustInQuantity || 0) },
            { label: 'Adjust Out', value: Number(movementSummary?.adjustOutQuantity || 0) },
            { label: 'Transfer In', value: Number(movementSummary?.transferInQuantity || 0) },
            { label: 'Transfer Out', value: Number(movementSummary?.transferOutQuantity || 0) },
            { label: 'Consumed', value: Number(consumptionSummary?.consumedQuantity || 0) },
          ],
        },
      },
      rows: zeroStockRows.map((row) => ({
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