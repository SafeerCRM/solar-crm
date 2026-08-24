import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['performanceId'])
@Index([
  'staffId',
  'performanceMonth',
])
export class StaffPerformanceMetric {
  @PrimaryGeneratedColumn()
  id: number;

  /*
   * Parent StaffPerformance evaluation.
   */
  @Column()
  performanceId: number;

  @Column()
  staffId: number;

  @Column({
    length: 7,
  })
  performanceMonth: string;

  /*
   * Original template metric.
   *
   * Nullable so old evaluations remain
   * valid even if templates are later
   * reorganized.
   */
  @Column({
    type: 'int',
    nullable: true,
  })
  templateMetricId: number | null;

  @Column({
    default: '',
  })
  metricName: string;

  @Column({
    default: 'NUMBER',
  })
  metricType: string;

  @Column({
    default: 'COUNT',
  })
  metricUnit: string;

  @Column({
    default: 'MANUAL',
  })
  sourceType: string;

  @Column({
    default: '',
  })
  crmMetricType: string;

  @Column({
    default: '',
  })
  customMetricName: string;

  /*
   * Target is snapshotted from the
   * template.
   */
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  targetValue: number;

  /*
   * Actual employee result.
   */
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  actualValue: number;

  /*
   * Actual / Target * 100.
   *
   * This may exceed 100 to display
   * overachievement.
   */
  @Column({
    type: 'decimal',
    precision: 9,
    scale: 2,
    default: 0,
  })
  achievementPercent: number;

  @Column({
    type: 'decimal',
    precision: 7,
    scale: 2,
    default: 1,
  })
  weightage: number;

  /*
   * Contribution to final overall score.
   *
   * Example:
   * weight = 30
   * achievement = 80%
   * weightedScore = 24
   */
  @Column({
    type: 'decimal',
    precision: 9,
    scale: 2,
    default: 0,
  })
  weightedScore: number;

  @Column({
    default: false,
  })
  mandatory: boolean;

  @Column({
    default: true,
  })
  mandatoryMet: boolean;

  @Column({
    default: true,
  })
  capScoreAtTarget: boolean;

  /*
   * Useful for manual/rating/boolean
   * KPIs and manager explanation.
   */
  @Column({
    type: 'text',
    default: '',
  })
  remarks: string;

  /*
   * Where this actual value came from.
   *
   * Useful for audit/debugging.
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  calculationSnapshot: Record<
    string,
    any
  > | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}