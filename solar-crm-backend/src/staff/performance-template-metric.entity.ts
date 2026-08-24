import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum PerformanceMetricSourceType {
  CRM_METRIC = 'CRM_METRIC',
  MANUAL = 'MANUAL',
  MANAGER_RATING = 'MANAGER_RATING',
  BOOLEAN = 'BOOLEAN',
}

@Entity()
export class PerformanceTemplateMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  templateId: number;

  @Column()
  metricName: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  targetValue: number;

  @Column({
    default: 'NUMBER',
  })
  metricType: string;

  @Column({
    default: 'COUNT',
  })
  metricUnit: string;

  /*
   * Where the actual employee value
   * comes from during evaluation.
   *
   * CRM_METRIC:
   *   automatically resolved from CRM.
   *
   * MANUAL:
   *   HR / manager enters actual value.
   *
   * MANAGER_RATING:
   *   manager enters rating such as 4/5.
   *
   * BOOLEAN:
   *   yes/no performance requirement.
   */
  @Column({
    default:
      PerformanceMetricSourceType.MANUAL,
  })
  sourceType: string;

  /*
   * Used when sourceType = CRM_METRIC.
   *
   * Example:
   * MEETINGS_COMPLETED
   * APPROVED_PROJECTS
   * DEALER_SALES_AMOUNT
   * WORKING_HOURS
   */
  @Column({
    default: '',
  })
  crmMetricType: string;

  /*
   * Optional custom source/reference
   * name for manual metrics.
   */
  @Column({
    default: '',
  })
  customMetricName: string;

  @Column({
    default: false,
  })
  mandatory: boolean;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1,
  })
  weightage: number;

  /*
   * Normally an employee cannot score
   * more than the configured KPI
   * weightage even if target is exceeded.
   *
   * Example:
   * target 60, actual 90
   * achievement may display 150%,
   * but weighted score remains capped.
   */
  @Column({
    default: true,
  })
  capScoreAtTarget: boolean;

  @CreateDateColumn()
  createdAt: Date;
}