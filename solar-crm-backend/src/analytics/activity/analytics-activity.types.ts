
export type AnalyticsActivityKind =
  | 'ASSIGNED_WORK'
  | 'CREATED_WORK'
  | 'UPDATED_WORK'
  | 'COMPLETED_WORK'
  | 'OUTCOME'
  | 'PIPELINE'
  | 'FINANCIAL';

export type AnalyticsMetricValue = number | null;

export interface AnalyticsActivityMetric {
  key: string;
  label: string;
  kind: AnalyticsActivityKind;
  value: AnalyticsMetricValue;

  unit?: 'COUNT' | 'INR' | 'PERCENT';

  /**
   * Explains how the metric is attributed
   * to an employee.
   */
  attribution: string;

  /**
   * CURRENT: workload as of report generation.
   * PERIOD: activity within the selected dates.
   */
  timeScope: 'CURRENT' | 'PERIOD';

  description?: string;
}

export interface AnalyticsActivitySection {
  moduleKey: string;
  moduleLabel: string;

  metrics: AnalyticsActivityMetric[];

  /**
   * Whether the section contains measurable
   * activity for the selected employee(s).
   */
  hasActivity: boolean;
}

export interface AnalyticsActivityContext {
  userIds: number[];

  fromDate: Date;
  toDate: Date;

  role?: string;
}

export interface AnalyticsActivityProvider {
  readonly moduleKey: string;
  readonly moduleLabel: string;

  /**
   * Builds metrics for the selected employees.
   * Providers must enforce attribution and
   * reporting scope.
   */
  build(
    context: AnalyticsActivityContext,
  ): Promise<AnalyticsActivitySection>;
}
