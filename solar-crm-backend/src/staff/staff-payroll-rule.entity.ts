import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StaffPayrollRuleScope {
  ROLE = 'ROLE',
  STAFF = 'STAFF',
}

export enum StaffPayrollSalaryMode {
  /*
   * Full basic salary when every enabled
   * eligibility condition is achieved.
   */
  FULL_OR_ZERO = 'FULL_OR_ZERO',

  /*
   * Salary percentage is calculated against
   * a selected metric target.
   */
  PROPORTIONAL_TO_TARGET =
    'PROPORTIONAL_TO_TARGET',

  /*
   * Salary is calculated from attendance
   * hours against configured target hours.
   */
  ATTENDANCE_HOURS =
    'ATTENDANCE_HOURS',

  /*
   * Salary is calculated from attendance days
   * against configured target days.
   */
  ATTENDANCE_DAYS =
    'ATTENDANCE_DAYS',

  /*
   * Salary is calculated from attendance
   * percentage.
   */
  ATTENDANCE_PERCENTAGE =
    'ATTENDANCE_PERCENTAGE',

  /*
   * Owner will manually decide salary.
   */
  MANUAL = 'MANUAL',
}

export enum StaffPayrollTargetCalculationMode {
  /*
   * Owner enters the target directly.
   *
   * Example:
   * 15 meetings
   * ₹10,00,000 sales
   */
  FIXED = 'FIXED',

  /*
   * Target is calculated from the team size.
   *
   * Example:
   * Telecalling Manager:
   * Active Telecallers ×
   * Configured target per telecaller.
   */
  TEAM_SIZE_MULTIPLIER =
    'TEAM_SIZE_MULTIPLIER',
}

export enum StaffPayrollMetricType {
  /*
   * TELECALLING
   */
  CALLS_MADE = 'CALLS_MADE',

  UNIQUE_CONTACTS_CALLED =
    'UNIQUE_CONTACTS_CALLED',

  CALL_DURATION_MINUTES =
    'CALL_DURATION_MINUTES',

  LEADS_CREATED = 'LEADS_CREATED',

  QUALIFIED_LEADS =
    'QUALIFIED_LEADS',

    /*
 * TELECALLING TEAM
 */
TEAM_TELECALLERS =
  'TEAM_TELECALLERS',

TEAM_TELECALLER_APPROVED_PROJECTS =
  'TEAM_TELECALLER_APPROVED_PROJECTS',

  /*
   * MEETINGS
   */
  MEETINGS_SCHEDULED =
    'MEETINGS_SCHEDULED',

  MEETINGS_COMPLETED =
    'MEETINGS_COMPLETED',

  GPS_SITE_VISITS_COMPLETED =
    'GPS_SITE_VISITS_COMPLETED',

  DEALER_MEETINGS_COMPLETED =
    'DEALER_MEETINGS_COMPLETED',

  /*
   * CRM PROJECTS
   *
   * The client may verbally call these
   * "orders", but these are approved solar
   * projects, not dealer orders.
   */
  APPROVED_PROJECTS =
    'APPROVED_PROJECTS',

  SELF_APPROVED_PROJECTS =
    'SELF_APPROVED_PROJECTS',

  COMPANY_APPROVED_PROJECTS =
    'COMPANY_APPROVED_PROJECTS',

    SOLAR_FRANCHISE_APPROVED_PROJECT_MARGIN =
  'SOLAR_FRANCHISE_APPROVED_PROJECT_MARGIN',

  /*
   * TRADING / DEALER ORDERS
   *
   * These are intentionally separate from
   * CRM projects.
   */
  DEALER_ORDERS =
    'DEALER_ORDERS',

  DEALER_SALES_AMOUNT =
    'DEALER_SALES_AMOUNT',

  DEALER_NET_PROFIT =
    'DEALER_NET_PROFIT',

    /*
 * Net profit attributable only to the portion
 * of dealer sales above the owner-configured
 * monthly sales target.
 */
DEALER_NET_PROFIT_ABOVE_SALES_TARGET =
  'DEALER_NET_PROFIT_ABOVE_SALES_TARGET',

  TEAM_TRADING_MANAGERS =
  'TEAM_TRADING_MANAGERS',

TEAM_DEALER_NET_PROFIT_ABOVE_SALES_TARGET =
  'TEAM_DEALER_NET_PROFIT_ABOVE_SALES_TARGET',

  TEAM_DEALER_ORDERS =
    'TEAM_DEALER_ORDERS',

  TEAM_DEALER_SALES_AMOUNT =
    'TEAM_DEALER_SALES_AMOUNT',

  TEAM_DEALER_NET_PROFIT =
    'TEAM_DEALER_NET_PROFIT',

  /*
   * HR / ATTENDANCE
   */
  STAFF_JOININGS =
    'STAFF_JOININGS',

    SELECTED_SUPPORTING_STAFF =
  'SELECTED_SUPPORTING_STAFF',

  PRESENT_DAYS =
    'PRESENT_DAYS',

  WORKING_DAYS =
    'WORKING_DAYS',

  WORKING_HOURS =
    'WORKING_HOURS',

  ATTENDANCE_PERCENTAGE =
    'ATTENDANCE_PERCENTAGE',

  /*
   * PAYMENTS / COLLECTION
   */
  PAYMENT_COLLECTION_AMOUNT =
    'PAYMENT_COLLECTION_AMOUNT',

  PAYMENT_COLLECTION_PERCENTAGE =
    'PAYMENT_COLLECTION_PERCENTAGE',

  /*
   * SUPPORT / MAINTENANCE
   */
  COMPLAINTS_ASSIGNED =
    'COMPLAINTS_ASSIGNED',

  COMPLAINTS_RESOLVED =
    'COMPLAINTS_RESOLVED',

  COMPLAINT_RESOLUTION_PERCENTAGE =
    'COMPLAINT_RESOLUTION_PERCENTAGE',

  /*
   * Manual metrics are allowed only when
   * Owner/HR will enter the achieved value
   * during payroll generation.
   *
   * They will never pretend to fetch data
   * automatically.
   */
  MANUAL_NUMBER =
    'MANUAL_NUMBER',
}

export enum StaffPayrollConditionOperator {
  GREATER_THAN_OR_EQUAL =
    'GREATER_THAN_OR_EQUAL',

  GREATER_THAN = 'GREATER_THAN',

  EQUAL = 'EQUAL',

  LESS_THAN_OR_EQUAL =
    'LESS_THAN_OR_EQUAL',

  LESS_THAN = 'LESS_THAN',
}

export enum StaffPayrollConditionFailureAction {
  /*
   * Failed condition makes base salary zero.
   */
  ZERO_SALARY = 'ZERO_SALARY',

  /*
   * Failed condition blocks incentive.
   */
  ZERO_INCENTIVE = 'ZERO_INCENTIVE',

  /*
   * Failed condition blocks both.
   */
  ZERO_SALARY_AND_INCENTIVE =
    'ZERO_SALARY_AND_INCENTIVE',

  /*
   * Condition is informational only.
   */
  NONE = 'NONE',
}

export enum StaffPayrollIncentiveCalculationType {
  NONE = 'NONE',

  /*
   * Fixed amount regardless of metric result.
   */
  FLAT = 'FLAT',

  /*
   * Metric value multiplied by rate.
   */
  PER_UNIT = 'PER_UNIT',

  /*
   * Only units above target are paid.
   */
  PER_UNIT_ABOVE_TARGET =
    'PER_UNIT_ABOVE_TARGET',

  /*
   * Percentage of a selected amount metric.
   */
  PERCENTAGE = 'PERCENTAGE',

  /*
   * Different rates according to configured
   * thresholds.
   */
  SLAB = 'SLAB',

  /*
   * Equal share of a company-level pool.
   */
  POOL_SHARE = 'POOL_SHARE',

  /*
   * Owner enters incentive manually.
   */
  MANUAL = 'MANUAL',
}

export type StaffPayrollEligibilityCondition = {
  id: string;

  label: string;

  metricType: StaffPayrollMetricType;

  /*
 * Used only when metricType is MANUAL_NUMBER.
 * This is a display label, not a database
 * column or automatic metric resolver.
 */

  customMetricName?: string;

  operator:
    StaffPayrollConditionOperator;

  targetValue: number;

  failureAction:
    StaffPayrollConditionFailureAction;

  isEnabled: boolean;
};

export type StaffPayrollIncentiveComponent = {
  id: string;

  label: string;

  metricType:
    StaffPayrollMetricType;

    slabSelectorMetricType?:
  StaffPayrollMetricType;

slabCalculationMode?:
  | 'VALUE_BASED'
  | 'SEQUENTIAL_PROJECT_MARGIN';

    /*
 * Used only when metricType is MANUAL_NUMBER.
 * This is a display label, not a database
 * column or automatic metric resolver.
 */

  customMetricName?: string;

  calculationType:
    StaffPayrollIncentiveCalculationType;

  /*
   * Used by FLAT, PER_UNIT and
   * PER_UNIT_ABOVE_TARGET.
   */
  rateAmount?: number;

  /*
   * Used by PERCENTAGE.
   */
  percentageRate?: number;

  /*
   * Used by PER_UNIT_ABOVE_TARGET.
   */
  baselineTarget?: number;

  /*
   * Used by SLAB.
   *
   * Example:
   * [
   *   {
   *     minimumValue: 0,
   *     maximumValue: 7,
   *     rateAmount: 3000,
   *     applyRateToAllUnits: true
   *   },
   *   {
   *     minimumValue: 8,
   *     maximumValue: null,
   *     rateAmount: 4000,
   *     applyRateToAllUnits: true
   *   }
   * ]
   */
  slabRules?: Array<{
    minimumValue: number;

    maximumValue?: number | null;

    rateAmount?: number;

    percentageRate?: number;

    flatAmount?: number;

    applyRateToAllUnits?: boolean;
  }>;

  /*
   * Pool settings remain configurable.
   */
  poolAmountPerCompanyUnit?: number;

  poolCompanyMetricType?:
    StaffPayrollMetricType;

  poolDivisorMode?:
    | 'ALL_ELIGIBLE_STAFF'
    | 'ALL_SUPPORTING_STAFF'
    | 'FIXED_DIVISOR';

  fixedPoolDivisor?: number;

  minimumPersonalMetricValue?: number;

  /*
   * Allows incentive to remain payable even
   * when salary eligibility is not achieved.
   */
  independentFromSalaryEligibility:
    boolean;

  maximumAmount?: number | null;

  isEnabled: boolean;
};

@Entity('staff_payroll_rule')
@Index(
  'IDX_staff_payroll_rule_scope_role',
  [
    'scope',
    'applicableRole',
    'isActive',
    'isHidden',
  ],
)
@Index(
  'IDX_staff_payroll_rule_staff',
  [
    'staffId',
    'isActive',
    'isHidden',
  ],
)
@Index(
  'IDX_staff_payroll_rule_effective',
  [
    'effectiveFrom',
    'effectiveTo',
  ],
)
export class StaffPayrollRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 200,
  })
  ruleName: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  /*
   * ROLE = default rule for a role.
   * STAFF = override for one staff member.
   */
  @Column({
    type: 'enum',
    enum: StaffPayrollRuleScope,
    default:
      StaffPayrollRuleScope.ROLE,
  })
  scope: StaffPayrollRuleScope;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  applicableRole: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  staffId: number | null;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  staffName: string | null;

  /*
   * The owner may activate a rule from any
   * selected month/date.
   */
  @Column({
    type: 'date',
    nullable: true,
  })
  effectiveFrom: string | null;

  @Column({
    type: 'date',
    nullable: true,
  })
  effectiveTo: string | null;

  @Column({
    type: 'enum',
    enum: StaffPayrollSalaryMode,
    default:
      StaffPayrollSalaryMode.MANUAL,
  })
  salaryMode:
    StaffPayrollSalaryMode;

  /*
   * Used only when salary is proportional
   * to an operational target.
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  salaryMetricType:
    StaffPayrollMetricType | null;

    /*
 * Used only when salaryMetricType is
 * MANUAL_NUMBER.
 */

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  salaryCustomMetricName:
    string | null;

  /*
   * All numeric values are owner-controlled.
   *
   * Zero means no configured target—not a
   * hardcoded system assumption.
   */
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 4,
    default: 0,
  })
  salaryTargetValue: number;

  /*
 * Determines whether salaryTargetValue is
 * used directly or calculated dynamically.
 */
@Column({
  type: 'enum',
  enum: StaffPayrollTargetCalculationMode,
  default:
    StaffPayrollTargetCalculationMode.FIXED,
})
targetCalculationMode:
  StaffPayrollTargetCalculationMode;

  /*
 * Metric whose value is multiplied by
 * teamMemberTargetValue when the target
 * calculation mode is TEAM_SIZE_MULTIPLIER.
 *
 * Telecalling Manager example:
 * TEAM_TELECALLERS × projects per telecaller.
 */
@Column({
  type: 'varchar',
  length: 100,
  nullable: true,
})
targetMultiplierMetricType:
  StaffPayrollMetricType | null;

/*
 * Used only when targetCalculationMode is
 * TEAM_SIZE_MULTIPLIER.
 *
 * Example:
 * Telecalling Manager:
 * 3 projects per telecaller.
 */
@Column({
  type: 'decimal',
  precision: 10,
  scale: 2,
  default: 0,
})
teamMemberTargetValue: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 100,
  })
  maximumSalaryPercentage: number;

  /*
 * Optional project-payment qualification.
 *
 * Example:
 * minimumProjectPaymentPercentage = 20
 *
 * Project-based payroll metrics may count
 * only projects that have collected at least
 * the configured percentage.
 *
 * Zero means this qualification is disabled.
 */
@Column({
  type: 'decimal',
  precision: 8,
  scale: 4,
  default: 0,
})
minimumProjectPaymentPercentage: number;

/*
 * Controls where the project-payment
 * qualification applies.
 *
 * NONE      = no payment qualification
 * SALARY    = salary metric only
 * INCENTIVE = incentive metrics only
 * BOTH      = salary and incentive metrics
 */
@Column({
  type: 'varchar',
  length: 20,
  default: 'NONE',
})
applyProjectPaymentQualificationTo:
  | 'NONE'
  | 'SALARY'
  | 'INCENTIVE'
  | 'BOTH';

  /*
   * For attendance-hour salary mode.
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  attendanceTargetHours: number;

  /*
   * For attendance-day salary mode.
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  attendanceTargetDays: number;

  /*
   * For full-month or percentage-based
   * attendance eligibility.
   */
  @Column({
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 0,
  })
  attendanceTargetPercentage: number;

  /*
   * The owner may decide that attendance is:
   * - ignored
   * - one condition among several
   * - mandatory for salary
   * - mandatory for incentive
   *
   * The exact behavior is stored in the
   * eligibility condition array.
   */
  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  eligibilityConditions:
    StaffPayrollEligibilityCondition[];

  /*
   * Multiple incentive parts can coexist.
   *
   * Example:
   * - per-order incentive
   * - additional slab incentive
   * - company pool share
   */
  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  incentiveComponents:
    StaffPayrollIncentiveComponent[];

  /*
   * If true, all enabled eligibility
   * conditions must pass.
   *
   * If false, at least one enabled condition
   * must pass.
   */
  @Column({
    type: 'boolean',
    default: true,
  })
  requireAllEligibilityConditions:
    boolean;

  /*
   * Owner can decide whether salary should
   * remain proportional even if a condition
   * fails.
   */
  @Column({
    type: 'boolean',
    default: false,
  })
  allowProportionalSalaryOnEligibilityFailure:
    boolean;

  /*
   * Final salary/incentive caps are also
   * owner-controlled.
   */
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  maximumSalaryAmount: number | null;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  maximumIncentiveAmount: number | null;

  /*
   * Used for owner notes or future
   * calculation options without schema
   * modification.
   */
  @Column({
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  additionalSettings:
    Record<string, any>;

  @Column({
    type: 'int',
    default: 1,
  })
  version: number;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  isHidden: boolean;

  @Column({
    type: 'int',
    nullable: true,
  })
  createdBy: number | null;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  createdByName: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  updatedBy: number | null;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  updatedByName: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  hiddenAt: Date | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  hiddenBy: number | null;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  hiddenByName: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  hiddenReason: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  restoredAt: Date | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  restoredBy: number | null;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  restoredByName: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  restoreReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}