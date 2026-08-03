import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';


export type PayrollMonthRange = {
  payrollMonth: string;
  startDate: Date;
  endDate: Date;
};

export type PayrollCalculationResult = {
  eligibilityMet: boolean;
  eligibilityReason: string;

  salaryPercentage: number;
  salaryAmount: number;
  incentiveAmount: number;

  actualMetrics: Record<string, number>;

  calculationSnapshot: Record<string, any>;
  ruleSnapshot: Record<string, any>;
};

import {
  StaffPayrollMetricResolverService,
} from './staff-payroll-metric-resolver.service';

import {
  StaffPayrollConditionOperator,
  StaffPayrollIncentiveCalculationType,
  StaffPayrollMetricType,
  StaffPayrollRule,
  StaffPayrollRuleScope,
  StaffPayrollSalaryMode,
  StaffPayrollTargetCalculationMode,
} from './staff-payroll-rule.entity';

@Injectable()
export class StaffPayrollCalculatorService {
  constructor(
  @InjectRepository(StaffPayrollRule)
  private readonly staffPayrollRuleRepository:
    Repository<StaffPayrollRule>,

  private readonly metricResolver:
    StaffPayrollMetricResolverService,
) {}

  /*
   * Convert YYYY-MM into an inclusive/exclusive
   * monthly date range.
   *
   * startDate: first moment of selected month
   * endDate: first moment of following month
   */
  getPayrollMonthRange(
    payrollMonth: string,
  ): PayrollMonthRange {
    const normalizedMonth = String(
      payrollMonth || '',
    ).trim();

    if (
      !/^\d{4}-\d{2}$/.test(
        normalizedMonth,
      )
    ) {
      throw new BadRequestException(
        'Payroll month must be in YYYY-MM format',
      );
    }

    const [
      year,
      month,
    ] = normalizedMonth
      .split('-')
      .map(Number);

    if (
      !year ||
      !month ||
      month < 1 ||
      month > 12
    ) {
      throw new BadRequestException(
        'Invalid payroll month',
      );
    }

    const startDate = new Date(
      year,
      month - 1,
      1,
      0,
      0,
      0,
      0,
    );

    const endDate = new Date(
      year,
      month,
      1,
      0,
      0,
      0,
      0,
    );

    return {
      payrollMonth: normalizedMonth,
      startDate,
      endDate,
    };
  }

  private async getActivePayrollRule(
  role: string,
  payrollMonth: string,
): Promise<StaffPayrollRule> {
  const {
    startDate,
    endDate,
  } = this.getPayrollMonthRange(
    payrollMonth,
  );

  const normalizedRole = String(
    role || '',
  )
    .trim()
    .toUpperCase();

  const payrollRule =
    await this.staffPayrollRuleRepository
      .createQueryBuilder('rule')
      .where(
        'rule.scope = :scope',
        {
          scope:
            StaffPayrollRuleScope.ROLE,
        },
      )
      .andWhere(
        'UPPER(TRIM(rule.applicableRole)) = :role',
        {
          role: normalizedRole,
        },
      )
      .andWhere(
        'rule.isActive = true',
      )
      .andWhere(
        'rule.isHidden = false',
      )
      .andWhere(
        `
        (
          rule.effectiveFrom IS NULL
          OR rule.effectiveFrom < :periodEnd
        )
        `,
        {
          periodEnd: endDate,
        },
      )
      .andWhere(
        `
        (
          rule.effectiveTo IS NULL
          OR rule.effectiveTo >= :periodStart
        )
        `,
        {
          periodStart: startDate,
        },
      )
      .orderBy(
        'rule.effectiveFrom',
        'DESC',
        'NULLS LAST',
      )
      .addOrderBy(
        'rule.version',
        'DESC',
      )
      .addOrderBy(
        'rule.updatedAt',
        'DESC',
      )
      .getOne();

  if (!payrollRule) {
    throw new BadRequestException(
      `No active payroll rule found for ${normalizedRole} in ${payrollMonth}`,
    );
  }

  return payrollRule;
}

private evaluateConditionValue(
  actualValue: number,
  operator:
    StaffPayrollConditionOperator,
  targetValue: number,
): boolean {
  const actual = Number(
    actualValue || 0,
  );

  const target = Number(
    targetValue || 0,
  );

  switch (operator) {
    case StaffPayrollConditionOperator
      .GREATER_THAN_OR_EQUAL:
      return actual >= target;

    case StaffPayrollConditionOperator
      .GREATER_THAN:
      return actual > target;

    case StaffPayrollConditionOperator
      .EQUAL:
      return actual === target;

    case StaffPayrollConditionOperator
      .LESS_THAN_OR_EQUAL:
      return actual <= target;

    case StaffPayrollConditionOperator
      .LESS_THAN:
      return actual < target;

    default:
      throw new BadRequestException(
        `Unsupported payroll condition operator: ${operator}`,
      );
  }
}

private async resolvePayrollMetric(
  metricType: StaffPayrollMetricType,
  payrollMonth: string,
  linkedUserId: number,
  staffRole: string,
  attendanceTargetDays?: number | null,
  salaryTargetValue?: number | null,
): Promise<number> {
  const userId = Number(
    linkedUserId || 0,
  );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return 0;
  }

  const {
    startDate,
    endDate,
  } = this.getPayrollMonthRange(
    payrollMonth,
  );

  const metricValue =
    await this.metricResolver.resolve({
      metricType,

      /*
       * The existing role calculators receive
       * the CRM user ID rather than the separate
       * StaffMember ID.
       *
       * This remains temporary until the generic
       * payroll entry point passes both IDs.
       */
      staffId: userId,

      linkedUserId: userId,

      staffRole: String(
        staffRole || '',
      )
        .trim()
        .toUpperCase(),

      periodStart: startDate,
periodEnd: endDate,

attendanceTargetDays:
  Number(
    attendanceTargetDays || 0,
  ),

  salaryTargetValue:
  Number(
    salaryTargetValue || 0,
  ),
    });

  const normalizedValue =
    Number(metricValue || 0);

  if (
    !Number.isFinite(
      normalizedValue,
    )
  ) {
    return 0;
  }

  return normalizedValue;
}

private async evaluateRuleEligibility(
  rule: StaffPayrollRule,
  payrollMonth: string,
  linkedUserId: number,
  staffRole: string,
  existingMetrics:
    Record<string, number> = {},
): Promise<{
  eligibilityMet: boolean;

  conditionResults: Array<{
    id: string;
    label: string;
    metricType:
      StaffPayrollMetricType;
    actualValue: number;
    targetValue: number;
    operator:
      StaffPayrollConditionOperator;
    passed: boolean;
    failureAction: string;
  }>;
}> {
  const enabledConditions =
    Array.isArray(
      rule.eligibilityConditions,
    )
      ? rule.eligibilityConditions.filter(
          (condition) =>
            condition?.isEnabled === true,
        )
      : [];

  /*
   * No enabled eligibility condition means
   * there is no eligibility restriction.
   */
  if (!enabledConditions.length) {
    return {
  eligibilityMet: true,
  conditionResults: [],
};
  }

  const actualMetrics =
  existingMetrics;

  const conditionResults: Array<{
    id: string;
    label: string;
    metricType:
      StaffPayrollMetricType;
    actualValue: number;
    targetValue: number;
    operator:
      StaffPayrollConditionOperator;
    passed: boolean;
    failureAction: string;
  }> = [];

  for (
    const condition of enabledConditions
  ) {
    if (
      condition.metricType ===
      StaffPayrollMetricType.MANUAL_NUMBER
    ) {
      throw new BadRequestException(
        `Manual payroll metric "${condition.label}" requires a manually entered value`,
      );
    }

    const metricKey = String(
      condition.metricType,
    );

    if (
      actualMetrics[metricKey] ===
      undefined
    ) {
      actualMetrics[metricKey] =
        await this.resolvePayrollMetric(
          condition.metricType,
          payrollMonth,
          linkedUserId,
          staffRole,
        );
    }

    const actualValue =
      actualMetrics[metricKey];

    const targetValue = Number(
      condition.targetValue || 0,
    );

    const passed =
      this.evaluateConditionValue(
        actualValue,
        condition.operator,
        targetValue,
      );

    conditionResults.push({
      id: String(
        condition.id || '',
      ),

      label:
        condition.label ||
        metricKey,

      metricType:
        condition.metricType,

      actualValue,
      targetValue,

      operator:
        condition.operator,

      passed,

      failureAction:
        String(
          condition.failureAction ||
            '',
        ),
    });
  }

  const eligibilityMet =
    rule.requireAllEligibilityConditions
      ? conditionResults.every(
          (result) =>
            result.passed,
        )
      : conditionResults.some(
          (result) =>
            result.passed,
        );

  return {
  eligibilityMet,
  conditionResults,
};
}

private buildEligibilityReason(
  conditionResults: Array<{
    label: string;
    actualValue: number;
    targetValue: number;
    passed: boolean;
  }>,
): string {
  if (!conditionResults.length) {
    return 'No eligibility restriction configured';
  }

  return conditionResults
    .map((condition) => {
      const status =
        condition.passed
          ? 'achieved'
          : 'not achieved';

      return `${condition.label} ${status}: ${condition.actualValue}/${condition.targetValue}`;
    })
    .join('; ');
}

private async calculateRuleSalaryPercentage(
  rule: StaffPayrollRule,
  payrollMonth: string,
  linkedUserId: number,
  staffRole: string,
  eligibilityMet: boolean,
  existingMetrics:
    Record<string, number> = {},
): Promise<{
  salaryPercentage: number;

  salaryMetricValue:
    number | null;
}> {
  const actualMetrics =
  existingMetrics;

  const maximumSalaryPercentage =
    Math.max(
      Number(
        rule.maximumSalaryPercentage ||
          100,
      ),
      0,
    );

  /*
   * Manual salary cannot be calculated
   * automatically.
   */
  if (
    rule.salaryMode ===
    StaffPayrollSalaryMode.MANUAL
  ) {
    return {
  salaryPercentage: 0,
  salaryMetricValue: null,
};
  }

  /*
   * Full salary when eligibility passes.
   */
  if (
    rule.salaryMode ===
    StaffPayrollSalaryMode.FULL_OR_ZERO
  ) {
    return {
  salaryPercentage:
    eligibilityMet
      ? this.roundCurrency(
          maximumSalaryPercentage,
        )
      : 0,

  salaryMetricValue: null,
};
  }

  let metricType:
    StaffPayrollMetricType | null =
      null;

  let targetValue = 0;

  switch (rule.salaryMode) {
    case StaffPayrollSalaryMode
      .PROPORTIONAL_TO_TARGET:
      metricType =
        rule.salaryMetricType;

      targetValue = Number(
        rule.salaryTargetValue || 0,
      );
      break;

    case StaffPayrollSalaryMode
      .ATTENDANCE_HOURS:
      metricType =
        StaffPayrollMetricType
          .WORKING_HOURS;

      targetValue = Number(
        rule.attendanceTargetHours || 0,
      );
      break;

    case StaffPayrollSalaryMode
      .ATTENDANCE_DAYS:
      metricType =
        StaffPayrollMetricType
          .PRESENT_DAYS;

      targetValue = Number(
        rule.attendanceTargetDays || 0,
      );
      break;

    case StaffPayrollSalaryMode
      .ATTENDANCE_PERCENTAGE:
      metricType =
        StaffPayrollMetricType
          .ATTENDANCE_PERCENTAGE;

      targetValue = Number(
        rule.attendanceTargetPercentage ||
          0,
      );
      break;

    default:
      throw new BadRequestException(
        `Unsupported payroll salary mode: ${rule.salaryMode}`,
      );
  }

    /*
   * Dynamic team-size target.
   *
   * Example:
   * TEAM_TELECALLERS ×
   * configured projects per telecaller.
   *
   * Existing FIXED rules continue using the
   * target selected by the salary-mode switch.
   */
  if (
    rule.targetCalculationMode ===
    StaffPayrollTargetCalculationMode
      .TEAM_SIZE_MULTIPLIER
  ) {
    const multiplierMetricType =
      rule.targetMultiplierMetricType;

    if (!multiplierMetricType) {
      throw new BadRequestException(
        `Target multiplier metric is not configured for payroll rule ${rule.ruleName}`,
      );
    }

    if (
      multiplierMetricType ===
      StaffPayrollMetricType.MANUAL_NUMBER
    ) {
      throw new BadRequestException(
        `Manual metric cannot be used as the team-size multiplier for payroll rule ${rule.ruleName}`,
      );
    }

    const perTeamMemberTarget =
      Number(
        rule.teamMemberTargetValue || 0,
      );

    if (
      !Number.isFinite(
        perTeamMemberTarget,
      ) ||
      perTeamMemberTarget <= 0
    ) {
      throw new BadRequestException(
        `Valid target per team member is not configured for payroll rule ${rule.ruleName}`,
      );
    }

    const multiplierMetricKey =
      String(
        multiplierMetricType,
      );

    if (
      actualMetrics[
        multiplierMetricKey
      ] === undefined
    ) {
      actualMetrics[
        multiplierMetricKey
      ] =
        await this.resolvePayrollMetric(
          multiplierMetricType,
          payrollMonth,
          linkedUserId,
          staffRole,
          rule.attendanceTargetDays,
          rule.salaryTargetValue,
        );
    }

    const teamMemberCount =
      Number(
        actualMetrics[
          multiplierMetricKey
        ] || 0,
      );

    if (
      !Number.isFinite(
        teamMemberCount,
      ) ||
      teamMemberCount <= 0
    ) {
      return {
        salaryPercentage: 0,
        salaryMetricValue: null,
      };
    }

    targetValue =
      teamMemberCount *
      perTeamMemberTarget;
  }

  if (!metricType) {
    throw new BadRequestException(
      `Salary metric is not configured for payroll rule ${rule.ruleName}`,
    );
  }


  if (
    metricType ===
    StaffPayrollMetricType.MANUAL_NUMBER
  ) {
    throw new BadRequestException(
      `Manual salary metric "${rule.salaryCustomMetricName || 'Manual metric'}" requires a manually entered value`,
    );
  }

  if (
    !Number.isFinite(targetValue) ||
    targetValue <= 0
  ) {
    throw new BadRequestException(
      `Valid salary target is not configured for payroll rule ${rule.ruleName}`,
    );
  }

  const metricKey = String(metricType);

  if (
    actualMetrics[metricKey] ===
    undefined
  ) {
    actualMetrics[metricKey] =
  await this.resolvePayrollMetric(
    metricType,
    payrollMonth,
    linkedUserId,
    staffRole,
    rule.attendanceTargetDays,
    rule.salaryTargetValue,
  );
  }

  const salaryMetricValue =
    Number(
      actualMetrics[metricKey] || 0,
    );

  const calculatedPercentage =
    Math.min(
      Math.max(
        (
          salaryMetricValue /
          targetValue
        ) * 100,
        0,
      ),
      maximumSalaryPercentage,
    );

  const salaryAllowed =
    eligibilityMet ||
    rule
      .allowProportionalSalaryOnEligibilityFailure;

  return {
  salaryPercentage:
    salaryAllowed
      ? this.roundCurrency(
          calculatedPercentage,
        )
      : 0,

  salaryMetricValue,
};
}

private calculateIncentiveComponentAmount(
  component:
    StaffPayrollRule[
      'incentiveComponents'
    ][number],
  metricValue: number,
  baselineTargetOverride?:
    number | null,
): number {
  const actualValue = Math.max(
    Number(metricValue || 0),
    0,
  );

  let amount = 0;

  switch (
    component.calculationType
  ) {
    case StaffPayrollIncentiveCalculationType
      .NONE:
      amount = 0;
      break;

    case StaffPayrollIncentiveCalculationType
      .FLAT:
      amount = Number(
        component.rateAmount || 0,
      );
      break;

    case StaffPayrollIncentiveCalculationType
      .PER_UNIT:
      amount =
        actualValue *
        Number(
          component.rateAmount || 0,
        );
      break;

    case StaffPayrollIncentiveCalculationType
      .PER_UNIT_ABOVE_TARGET: {
      const baselineTarget =
  Math.max(
    Number(
      baselineTargetOverride !==
        undefined &&
      baselineTargetOverride !==
        null
        ? baselineTargetOverride
        : component.baselineTarget ||
            0,
    ),
    0,
  );

      const payableUnits =
        Math.max(
          actualValue -
            baselineTarget,
          0,
        );

      amount =
        payableUnits *
        Number(
          component.rateAmount || 0,
        );

      break;
    }

    case StaffPayrollIncentiveCalculationType
      .PERCENTAGE:
      amount =
        actualValue *
        (
          Number(
            component.percentageRate ||
              0,
          ) /
          100
        );
      break;

    case StaffPayrollIncentiveCalculationType
      .SLAB: {
      const slabRules =
        Array.isArray(
          component.slabRules,
        )
          ? component.slabRules
          : [];

      const matchedSlab =
        slabRules.find(
          (slab) => {
            const minimumValue =
              Number(
                slab.minimumValue ||
                  0,
              );

            const maximumValue =
              slab.maximumValue ===
                null ||
              slab.maximumValue ===
                undefined
                ? null
                : Number(
                    slab.maximumValue,
                  );

            return (
              actualValue >=
                minimumValue &&
              (
                maximumValue ===
                  null ||
                actualValue <=
                  maximumValue
              )
            );
          },
        );

      if (!matchedSlab) {
        amount = 0;
        break;
      }

      if (
        Number(
          matchedSlab.flatAmount ||
            0,
        ) > 0
      ) {
        amount = Number(
          matchedSlab.flatAmount ||
            0,
        );

        break;
      }

      const rateAmount =
        Number(
          matchedSlab.rateAmount ||
            0,
        );

      const percentageRate =
        Number(
          matchedSlab
            .percentageRate ||
            0,
        );

      const applyRateToAllUnits =
        matchedSlab
          .applyRateToAllUnits ===
        true;

      const payableUnits =
        applyRateToAllUnits
          ? actualValue
          : Math.max(
              actualValue -
                Number(
                  matchedSlab
                    .minimumValue ||
                    0,
                ) +
                1,
              0,
            );

      if (rateAmount > 0) {
        amount =
          payableUnits *
          rateAmount;
      } else if (
        percentageRate > 0
      ) {
        amount =
          actualValue *
          (
            percentageRate /
            100
          );
      }

      break;
    }

    case StaffPayrollIncentiveCalculationType
      .POOL_SHARE:
      throw new BadRequestException(
        `Pool-share incentive "${component.label}" requires company-level calculation`,
      );

    case StaffPayrollIncentiveCalculationType
      .MANUAL:
      throw new BadRequestException(
        `Manual incentive "${component.label}" requires a manually entered value`,
      );

    default:
      throw new BadRequestException(
        `Unsupported payroll incentive calculation type: ${component.calculationType}`,
      );
  }

  const maximumAmount =
    component.maximumAmount ===
      null ||
    component.maximumAmount ===
      undefined
      ? null
      : Math.max(
          Number(
            component.maximumAmount,
          ),
          0,
        );

  if (maximumAmount !== null) {
    amount = Math.min(
      amount,
      maximumAmount,
    );
  }

  return this.roundCurrency(
    Math.max(amount, 0),
  );
}

private async calculateRuleIncentives(
  rule: StaffPayrollRule,
  payrollMonth: string,
  linkedUserId: number,
  staffRole: string,
  existingMetrics:
    Record<string, number> = {},
): Promise<{
  incentiveAmount: number;

  componentResults: Array<{
    id: string;
    label: string;
    metricType:
      StaffPayrollMetricType;
    metricValue: number;
    calculationType:
      StaffPayrollIncentiveCalculationType;
    amount: number;
  }>;
}> {
  const actualMetrics =
  existingMetrics;

  let effectiveSalaryTargetValue =
  Number(
    rule.salaryTargetValue || 0,
  );

/*
 * Calculate the effective dynamic target once
 * so percentage-based incentive metrics can use
 * the same target as salary calculation.
 */
if (
  rule.targetCalculationMode ===
    StaffPayrollTargetCalculationMode
      .TEAM_SIZE_MULTIPLIER
) {
  const multiplierMetricType =
    rule.targetMultiplierMetricType;

  if (!multiplierMetricType) {
    throw new BadRequestException(
      `Target multiplier metric is not configured for payroll rule ${rule.ruleName}`,
    );
  }

  if (
    multiplierMetricType ===
    StaffPayrollMetricType.MANUAL_NUMBER
  ) {
    throw new BadRequestException(
      `Manual metric cannot be used as the incentive target multiplier for payroll rule ${rule.ruleName}`,
    );
  }

  const multiplierMetricKey =
    String(
      multiplierMetricType,
    );

  if (
    actualMetrics[
      multiplierMetricKey
    ] === undefined
  ) {
    actualMetrics[
      multiplierMetricKey
    ] =
      await this.resolvePayrollMetric(
        multiplierMetricType,
        payrollMonth,
        linkedUserId,
        staffRole,
        rule.attendanceTargetDays,
        rule.salaryTargetValue,
      );
  }

  const teamMemberCount =
    Math.max(
      Number(
        actualMetrics[
          multiplierMetricKey
        ] || 0,
      ),
      0,
    );

  const targetPerTeamMember =
    Math.max(
      Number(
        rule.teamMemberTargetValue || 0,
      ),
      0,
    );

  effectiveSalaryTargetValue =
    teamMemberCount *
    targetPerTeamMember;
}

  const enabledComponents =
    Array.isArray(
      rule.incentiveComponents,
    )
      ? rule.incentiveComponents.filter(
          (component) =>
            component?.isEnabled ===
            true,
        )
      : [];

  if (!enabledComponents.length) {
    return {
  incentiveAmount: 0,
  componentResults: [],
};
  }

  const componentResults: Array<{
    id: string;
    label: string;
    metricType:
      StaffPayrollMetricType;
    metricValue: number;
    calculationType:
      StaffPayrollIncentiveCalculationType;
    amount: number;
  }> = [];

  for (
    const component of
      enabledComponents
  ) {
    if (
      component.metricType ===
      StaffPayrollMetricType
        .MANUAL_NUMBER
    ) {
      throw new BadRequestException(
        `Manual incentive metric "${component.label}" requires a manually entered value`,
      );
    }

    const metricKey = String(
      component.metricType,
    );

    if (
  actualMetrics[metricKey] ===
  undefined
) {
  actualMetrics[metricKey] =
    await this.resolvePayrollMetric(
      component.metricType,
      payrollMonth,
      linkedUserId,
      staffRole,
      rule.attendanceTargetDays,
      effectiveSalaryTargetValue,
    );
}

    const metricValue = Number(
  actualMetrics[metricKey] || 0,
);

let baselineTargetOverride:
  number | null = null;

/*
 * Dynamic above-target incentive baseline.
 *
 * Example:
 * TEAM_TELECALLERS ×
 * configured target per telecaller.
 *
 * This remains fully rule-driven and does not
 * hardcode any staff role or team metric.
 */
if (
  component.calculationType ===
    StaffPayrollIncentiveCalculationType
      .PER_UNIT_ABOVE_TARGET &&
  rule.targetCalculationMode ===
    StaffPayrollTargetCalculationMode
      .TEAM_SIZE_MULTIPLIER
) {
  const multiplierMetricType =
    rule.targetMultiplierMetricType;

  if (!multiplierMetricType) {
    throw new BadRequestException(
      `Target multiplier metric is not configured for payroll rule ${rule.ruleName}`,
    );
  }

  if (
    multiplierMetricType ===
    StaffPayrollMetricType.MANUAL_NUMBER
  ) {
    throw new BadRequestException(
      `Manual metric cannot be used as the incentive target multiplier for payroll rule ${rule.ruleName}`,
    );
  }

  const perTeamMemberTarget =
    Number(
      rule.teamMemberTargetValue || 0,
    );

  if (
    !Number.isFinite(
      perTeamMemberTarget,
    ) ||
    perTeamMemberTarget <= 0
  ) {
    throw new BadRequestException(
      `Valid target per team member is not configured for payroll rule ${rule.ruleName}`,
    );
  }

  const multiplierMetricKey =
    String(
      multiplierMetricType,
    );

  if (
    actualMetrics[
      multiplierMetricKey
    ] === undefined
  ) {
    actualMetrics[
      multiplierMetricKey
    ] =
      await this.resolvePayrollMetric(
        multiplierMetricType,
        payrollMonth,
        linkedUserId,
        staffRole,
        rule.attendanceTargetDays,
        rule.salaryTargetValue,
      );
  }

  const teamMemberCount =
    Math.max(
      Number(
        actualMetrics[
          multiplierMetricKey
        ] || 0,
      ),
      0,
    );

  baselineTargetOverride =
    teamMemberCount *
    perTeamMemberTarget;
}

let amount = 0;

if (
  component.calculationType ===
    StaffPayrollIncentiveCalculationType
      .SLAB &&
  component.slabCalculationMode ===
    'SEQUENTIAL_PROJECT_MARGIN'
) {
    const {
  startDate,
  endDate,
} = this.getPayrollMonthRange(
  payrollMonth,
);

  amount =
    await this
  .metricResolver
  .resolveSequentialProjectMarginSlab(
        {
  metricType:
    component
      .slabSelectorMetricType ||
    StaffPayrollMetricType
      .APPROVED_PROJECTS,

  staffId:
    Number(linkedUserId),

  linkedUserId:
    Number(linkedUserId),

  staffRole:
    String(
      staffRole || '',
    )
      .trim()
      .toUpperCase(),

  periodStart:
    startDate,

  periodEnd:
    endDate,

  attendanceTargetDays:
    rule.attendanceTargetDays,

  salaryTargetValue:
    effectiveSalaryTargetValue,
},
        component,
      );
} else if (
  component.calculationType ===
    StaffPayrollIncentiveCalculationType
      .POOL_SHARE
) {
  const companyMetricType =
    component.poolCompanyMetricType;

  if (!companyMetricType) {
    throw new BadRequestException(
      `Company pool metric is not configured for incentive "${component.label}"`,
    );
  }

  if (
    companyMetricType ===
    StaffPayrollMetricType.MANUAL_NUMBER
  ) {
    throw new BadRequestException(
      `Manual metric cannot be used as the company pool metric for incentive "${component.label}"`,
    );
  }

  const companyMetricKey =
    String(companyMetricType);

  if (
    actualMetrics[
      companyMetricKey
    ] === undefined
  ) {
    actualMetrics[
      companyMetricKey
    ] =
      await this.resolvePayrollMetric(
        companyMetricType,
        payrollMonth,
        linkedUserId,
        staffRole,
        rule.attendanceTargetDays,
        effectiveSalaryTargetValue,
      );
  }

  const companyUnits =
    Math.max(
      Number(
        actualMetrics[
          companyMetricKey
        ] || 0,
      ),
      0,
    );

  const poolAmountPerCompanyUnit =
    Math.max(
      Number(
        component
          .poolAmountPerCompanyUnit ||
          0,
      ),
      0,
    );

  const totalPoolAmount =
    companyUnits *
    poolAmountPerCompanyUnit;

  let poolDivisor = 0;

  switch (
    component.poolDivisorMode
  ) {
    case 'ALL_SUPPORTING_STAFF': {
      const supportingStaffMetricType =
        StaffPayrollMetricType
          .SELECTED_SUPPORTING_STAFF;

      const supportingStaffMetricKey =
        String(
          supportingStaffMetricType,
        );

      if (
        actualMetrics[
          supportingStaffMetricKey
        ] === undefined
      ) {
        actualMetrics[
          supportingStaffMetricKey
        ] =
          await this.resolvePayrollMetric(
            supportingStaffMetricType,
            payrollMonth,
            linkedUserId,
            staffRole,
            rule.attendanceTargetDays,
            effectiveSalaryTargetValue,
          );
      }

      poolDivisor =
        Math.max(
          Number(
            actualMetrics[
              supportingStaffMetricKey
            ] || 0,
          ),
          0,
        );

      break;
    }

    case 'FIXED_DIVISOR':
      poolDivisor =
        Math.max(
          Number(
            component.fixedPoolDivisor ||
              0,
          ),
          0,
        );
      break;

    case 'ALL_ELIGIBLE_STAFF':
      throw new BadRequestException(
        `Pool divisor mode ALL_ELIGIBLE_STAFF is not implemented for incentive "${component.label}"`,
      );

    default:
      throw new BadRequestException(
        `Valid pool divisor mode is not configured for incentive "${component.label}"`,
      );
  }

  const minimumPersonalMetricValue =
    Math.max(
      Number(
        component
          .minimumPersonalMetricValue ||
          0,
      ),
      0,
    );

  const personalEligibilityMet =
    metricValue >=
    minimumPersonalMetricValue;

  if (
    poolDivisor > 0 &&
    personalEligibilityMet
  ) {
    amount =
      totalPoolAmount /
      poolDivisor;
  }
} else {
  amount =
    this
      .calculateIncentiveComponentAmount(
        component,
        metricValue,
        baselineTargetOverride,
      );
}

    componentResults.push({
      id: String(
        component.id || '',
      ),

      label:
        component.label ||
        metricKey,

      metricType:
        component.metricType,

      metricValue,

      calculationType:
        component.calculationType,

      amount,
    });
  }

  const incentiveAmount =
    this.roundCurrency(
      componentResults.reduce(
        (
          total,
          component,
        ) =>
          total +
          Number(
            component.amount || 0,
          ),
        0,
      ),
    );

  return {
  incentiveAmount,
  componentResults,
};
}


  /*
   * Shared result builder.
   *
   * Every role calculator will return the same
   * predictable structure.
   */
  private createEmptyResult(
    ruleName: string,
  ): PayrollCalculationResult {
    return {
      eligibilityMet: false,
      eligibilityReason:
        'Calculation rule is not implemented yet',

      salaryPercentage: 0,
      salaryAmount: 0,
      incentiveAmount: 0,

      actualMetrics: {},

      calculationSnapshot: {
        ruleName,
        calculatedAt:
          new Date().toISOString(),
      },

      ruleSnapshot: {
        ruleName,
        version: 1,
      },
    };
  }

  /*
   * Currency values are rounded to two decimals
   * before payroll is persisted.
   */
  roundCurrency(
    value: number,
  ): number {
    const amount = Number(value || 0);

    if (!Number.isFinite(amount)) {
      return 0;
    }

    return Math.round(
      amount * 100,
    ) / 100;
  }

  calculateSalaryAmount(
    basicSalary: number,
    salaryPercentage: number,
  ): number {
    const normalizedBasicSalary =
      Math.max(
        Number(basicSalary || 0),
        0,
      );

    const normalizedPercentage =
      Math.min(
        Math.max(
          Number(
            salaryPercentage || 0,
          ),
          0,
        ),
        100,
      );

    return this.roundCurrency(
      normalizedBasicSalary *
        (normalizedPercentage / 100),
    );
  }

  async calculateMeetingManagerPayroll(
  payrollMonth: string,
  linkedUserId: number,
  basicSalary: number,
): Promise<PayrollCalculationResult> {
  const userId = Number(
    linkedUserId,
  );

  const normalizedBasicSalary =
    Math.max(
      Number(basicSalary || 0),
      0,
    );

  if (!userId) {
    return {
      eligibilityMet: false,

      eligibilityReason:
        'Staff member is not linked to a CRM user',

      salaryPercentage: 0,
      salaryAmount: 0,
      incentiveAmount: 0,

      actualMetrics: {
        actualGpsMeetings: 0,
        actualOrders: 0,
      },

      calculationSnapshot: {
        role: 'MEETING_MANAGER',
        payrollMonth,
        linkedUserId: null,
        basicSalary:
          normalizedBasicSalary,
        calculatedAt:
          new Date().toISOString(),
      },

      ruleSnapshot: {
        role: 'MEETING_MANAGER',
        version: 1,

        gpsVisitEligibilityTarget: 60,
        salaryOrderTarget: 5,

        normalIncentivePerOrder: 3000,

        enhancedIncentiveOrderThreshold: 8,
        enhancedIncentivePerOrder: 4000,
      },
    };
  }

  const rule =
  await this.getActivePayrollRule(
    'MEETING_MANAGER',
    payrollMonth,
  );

  const sharedMetrics:
  Record<string, number> = {};

const eligibilityEvaluation =
  await this.evaluateRuleEligibility(
    rule,
    payrollMonth,
    userId,
    'MEETING_MANAGER',
    sharedMetrics,
  );

const actualOrders =
  await this.resolvePayrollMetric(
    StaffPayrollMetricType
      .APPROVED_PROJECTS,
    payrollMonth,
    userId,
    'MEETING_MANAGER',
  );

const gpsMetricKey = String(
  StaffPayrollMetricType
    .GPS_SITE_VISITS_COMPLETED,
);

const actualGpsMeetings =
  sharedMetrics[gpsMetricKey] !==
  undefined
    ? Number(
        sharedMetrics[
          gpsMetricKey
        ] || 0,
      )
    : await this.resolvePayrollMetric(
        StaffPayrollMetricType
          .GPS_SITE_VISITS_COMPLETED,
        payrollMonth,
        userId,
        'MEETING_MANAGER',
      );

const eligibilityMet =
  eligibilityEvaluation
    .eligibilityMet;

const approvedProjectsMetricKey =
  String(
    StaffPayrollMetricType
      .APPROVED_PROJECTS,
  );

sharedMetrics[
  approvedProjectsMetricKey
] = actualOrders;

const salaryEvaluation =
  await this
    .calculateRuleSalaryPercentage(
      rule,
      payrollMonth,
      userId,
      'MEETING_MANAGER',
      eligibilityMet,
      sharedMetrics,
    );

const salaryPercentage =
  salaryEvaluation
    .salaryPercentage;

  const salaryAmount =
    this.calculateSalaryAmount(
      normalizedBasicSalary,
      salaryPercentage,
    );

  const incentiveEvaluation =
  await this.calculateRuleIncentives(
    rule,
    payrollMonth,
    userId,
    'MEETING_MANAGER',
    sharedMetrics,
  );

const incentiveAmount =
  incentiveEvaluation
    .incentiveAmount;

  const eligibilityReason =
  this.buildEligibilityReason(
    eligibilityEvaluation
      .conditionResults,
  );

  return {
    eligibilityMet,
    eligibilityReason,

    salaryPercentage,
    salaryAmount,
    incentiveAmount,

    actualMetrics: {
      actualGpsMeetings,
      actualOrders,
    },

    calculationSnapshot: {
      role: 'MEETING_MANAGER',

      payrollMonth,
      linkedUserId: userId,

      basicSalary:
        normalizedBasicSalary,

      actualGpsMeetings,
      actualOrders,

      eligibilityMet,
      salaryPercentage,
      salaryAmount,

      incentivePerOrder:
  actualOrders > 0
    ? this.roundCurrency(
        incentiveAmount /
          actualOrders,
      )
    : 0,
      incentiveAmount,

      calculatedAt:
        new Date().toISOString(),
    },

    ruleSnapshot: {
  role: 'MEETING_MANAGER',

  ruleId: rule.id,
  ruleName: rule.ruleName,
  version: rule.version,

  scope: rule.scope,

  effectiveFrom:
    rule.effectiveFrom,

  effectiveTo:
    rule.effectiveTo,

  requireAllEligibilityConditions:
    rule
      .requireAllEligibilityConditions,

  eligibilityConditions:
    rule.eligibilityConditions,

  salaryMode:
    rule.salaryMode,

  salaryMetricType:
    rule.salaryMetricType,

  salaryTargetValue:
    rule.salaryTargetValue,

  maximumSalaryPercentage:
    rule.maximumSalaryPercentage,

  allowProportionalSalaryOnEligibilityFailure:
    rule
      .allowProportionalSalaryOnEligibilityFailure,

  incentiveComponents:
    rule.incentiveComponents,
},
  };
}

  async calculateLeadManagerPayroll(
  payrollMonth: string,
  linkedUserId: number,
  basicSalary: number,
): Promise<PayrollCalculationResult> {
  const userId = Number(
    linkedUserId || 0,
  );

  const normalizedBasicSalary =
    Math.max(
      Number(
        basicSalary || 0,
      ),
      0,
    );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return this.createEmptyResult(
      'LEAD_MANAGER',
    );
  }

  const rule =
    await this.getActivePayrollRule(
      'LEAD_MANAGER',
      payrollMonth,
    );

  const sharedMetrics:
  Record<string, number> = {};

const eligibilityEvaluation =
  await this.evaluateRuleEligibility(
    rule,
    payrollMonth,
    userId,
    'LEAD_MANAGER',
    sharedMetrics,
  );

const eligibilityReason =
  this.buildEligibilityReason(
    eligibilityEvaluation
      .conditionResults,
  );

const eligibilityMet =
  eligibilityEvaluation
    .eligibilityMet;

const salaryEvaluation =
  await this
    .calculateRuleSalaryPercentage(
      rule,
      payrollMonth,
      userId,
      'LEAD_MANAGER',
      eligibilityMet,
      sharedMetrics,
    );

const salaryPercentage =
  salaryEvaluation
    .salaryPercentage;

const salaryAmount =
  this.calculateSalaryAmount(
    normalizedBasicSalary,
    salaryPercentage,
  );

const incentiveEvaluation =
  await this.calculateRuleIncentives(
    rule,
    payrollMonth,
    userId,
    'LEAD_MANAGER',
    sharedMetrics,
  );

const incentiveAmount =
  incentiveEvaluation
    .incentiveAmount;

return {
  eligibilityMet,
  eligibilityReason,

  salaryPercentage,
  salaryAmount,
  incentiveAmount,

  actualMetrics: {
    ...sharedMetrics,
  },

  calculationSnapshot: {
    role: 'LEAD_MANAGER',

    payrollMonth,
    linkedUserId: userId,

    basicSalary:
      normalizedBasicSalary,

    actualMetrics: {
      ...sharedMetrics,
    },

    eligibilityMet,
    eligibilityReason,

    salaryPercentage,
    salaryAmount,
    incentiveAmount,

    eligibilityConditions:
      eligibilityEvaluation
        .conditionResults,

    incentiveComponents:
      incentiveEvaluation
        .componentResults,

    calculatedAt:
      new Date().toISOString(),
  },

  ruleSnapshot: {
    role: 'LEAD_MANAGER',

    ruleId: rule.id,
    ruleName: rule.ruleName,
    version: rule.version,

    scope: rule.scope,

    effectiveFrom:
      rule.effectiveFrom,

    effectiveTo:
      rule.effectiveTo,

    requireAllEligibilityConditions:
      rule
        .requireAllEligibilityConditions,

    eligibilityConditions:
      rule.eligibilityConditions,

    salaryMode:
      rule.salaryMode,

    salaryMetricType:
      rule.salaryMetricType,

    salaryTargetValue:
      rule.salaryTargetValue,

    maximumSalaryPercentage:
      rule.maximumSalaryPercentage,

    allowProportionalSalaryOnEligibilityFailure:
      rule
        .allowProportionalSalaryOnEligibilityFailure,

    incentiveComponents:
      rule.incentiveComponents,
  },
};
}

async calculateTelecallingManagerPayroll(
  payrollMonth: string,
  linkedUserId: number,
  basicSalary: number,
): Promise<PayrollCalculationResult> {
  const userId = Number(
    linkedUserId || 0,
  );

  const normalizedBasicSalary =
    Math.max(
      Number(
        basicSalary || 0,
      ),
      0,
    );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return this.createEmptyResult(
      'TELECALLING_MANAGER',
    );
  }

  const rule =
    await this.getActivePayrollRule(
      'TELECALLING_MANAGER',
      payrollMonth,
    );

  const sharedMetrics:
    Record<string, number> = {};

  const eligibilityEvaluation =
    await this.evaluateRuleEligibility(
      rule,
      payrollMonth,
      userId,
      'TELECALLING_MANAGER',
      sharedMetrics,
    );

  const eligibilityReason =
    this.buildEligibilityReason(
      eligibilityEvaluation
        .conditionResults,
    );

  const eligibilityMet =
    eligibilityEvaluation
      .eligibilityMet;

  const salaryEvaluation =
    await this
      .calculateRuleSalaryPercentage(
        rule,
        payrollMonth,
        userId,
        'TELECALLING_MANAGER',
        eligibilityMet,
        sharedMetrics,
      );

  const salaryPercentage =
    salaryEvaluation
      .salaryPercentage;

  const salaryAmount =
    this.calculateSalaryAmount(
      normalizedBasicSalary,
      salaryPercentage,
    );

  const incentiveEvaluation =
    await this.calculateRuleIncentives(
      rule,
      payrollMonth,
      userId,
      'TELECALLING_MANAGER',
      sharedMetrics,
    );

  const incentiveAmount =
    incentiveEvaluation
      .incentiveAmount;

  return {
    eligibilityMet,
    eligibilityReason,

    salaryPercentage,
    salaryAmount,
    incentiveAmount,

    actualMetrics: {
      ...sharedMetrics,
    },

    calculationSnapshot: {
      role: 'TELECALLING_MANAGER',

      payrollMonth,
      linkedUserId: userId,

      basicSalary:
        normalizedBasicSalary,

      actualMetrics: {
        ...sharedMetrics,
      },

      eligibilityMet,
      eligibilityReason,

      salaryPercentage,
      salaryAmount,
      incentiveAmount,

      eligibilityConditions:
        eligibilityEvaluation
          .conditionResults,

      incentiveComponents:
        incentiveEvaluation
          .componentResults,

      calculatedAt:
        new Date().toISOString(),
    },

    ruleSnapshot: {
      role: 'TELECALLING_MANAGER',

      ruleId: rule.id,
      ruleName: rule.ruleName,
      version: rule.version,

      scope: rule.scope,

      effectiveFrom:
        rule.effectiveFrom,

      effectiveTo:
        rule.effectiveTo,

      requireAllEligibilityConditions:
        rule
          .requireAllEligibilityConditions,

      eligibilityConditions:
        rule.eligibilityConditions,

      salaryMode:
        rule.salaryMode,

      salaryMetricType:
        rule.salaryMetricType,

      salaryTargetValue:
        rule.salaryTargetValue,

      targetCalculationMode:
        rule.targetCalculationMode,

      targetMultiplierMetricType:
        rule.targetMultiplierMetricType,

      teamMemberTargetValue:
        rule.teamMemberTargetValue,

      maximumSalaryPercentage:
        rule.maximumSalaryPercentage,

      allowProportionalSalaryOnEligibilityFailure:
        rule
          .allowProportionalSalaryOnEligibilityFailure,

      incentiveComponents:
        rule.incentiveComponents,
    },
  };
}

  async calculateTelecallerPayroll(
  payrollMonth: string,
  linkedUserId: number,
  basicSalary: number,
): Promise<PayrollCalculationResult> {
  const userId = Number(
    linkedUserId || 0,
  );

  const normalizedBasicSalary =
    Math.max(
      Number(
        basicSalary || 0,
      ),
      0,
    );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return this.createEmptyResult(
      'TELECALLER',
    );
  }

  const rule =
    await this.getActivePayrollRule(
      'TELECALLER',
      payrollMonth,
    );

  const sharedMetrics:
    Record<string, number> = {};

  const eligibilityEvaluation =
    await this.evaluateRuleEligibility(
      rule,
      payrollMonth,
      userId,
      'TELECALLER',
      sharedMetrics,
    );

  const eligibilityReason =
    this.buildEligibilityReason(
      eligibilityEvaluation
        .conditionResults,
    );

  const eligibilityMet =
    eligibilityEvaluation
      .eligibilityMet;

  const salaryEvaluation =
    await this
      .calculateRuleSalaryPercentage(
        rule,
        payrollMonth,
        userId,
        'TELECALLER',
        eligibilityMet,
        sharedMetrics,
      );

  const salaryPercentage =
    salaryEvaluation
      .salaryPercentage;

  const salaryAmount =
    this.calculateSalaryAmount(
      normalizedBasicSalary,
      salaryPercentage,
    );

  const incentiveEvaluation =
    await this.calculateRuleIncentives(
      rule,
      payrollMonth,
      userId,
      'TELECALLER',
      sharedMetrics,
    );

  const incentiveAmount =
    incentiveEvaluation
      .incentiveAmount;

  return {
  eligibilityMet,
  eligibilityReason,

  salaryPercentage,
  salaryAmount,
  incentiveAmount,

  actualMetrics: {
    ...sharedMetrics,
  },

  calculationSnapshot: {
    role: 'TELECALLER',

    payrollMonth,
    linkedUserId: userId,

    basicSalary:
      normalizedBasicSalary,

    actualMetrics: {
      ...sharedMetrics,
    },

    eligibilityMet,
    eligibilityReason,

    salaryPercentage,
    salaryAmount,
    incentiveAmount,

    eligibilityConditions:
      eligibilityEvaluation
        .conditionResults,

    incentiveComponents:
      incentiveEvaluation
        .componentResults,

    calculatedAt:
      new Date().toISOString(),
  },

  ruleSnapshot: {
    role: 'TELECALLER',

    ruleId: rule.id,
    ruleName: rule.ruleName,
    version: rule.version,

    scope: rule.scope,

    effectiveFrom:
      rule.effectiveFrom,

    effectiveTo:
      rule.effectiveTo,

    requireAllEligibilityConditions:
      rule
        .requireAllEligibilityConditions,

    eligibilityConditions:
      rule.eligibilityConditions,

    salaryMode:
      rule.salaryMode,

    salaryMetricType:
      rule.salaryMetricType,

    salaryTargetValue:
      rule.salaryTargetValue,

    maximumSalaryPercentage:
      rule.maximumSalaryPercentage,

    allowProportionalSalaryOnEligibilityFailure:
      rule
        .allowProportionalSalaryOnEligibilityFailure,

    incentiveComponents:
      rule.incentiveComponents,
  },
};
}

  async calculateMeetingAssistantPayroll(
  payrollMonth: string,
  linkedUserId: number,
  basicSalary: number,
): Promise<PayrollCalculationResult> {
  const userId = Number(
    linkedUserId || 0,
  );

  const normalizedBasicSalary =
    Math.max(
      Number(
        basicSalary || 0,
      ),
      0,
    );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return this.createEmptyResult(
      'MEETING_ASSISTANT',
    );
  }

  const rule =
    await this.getActivePayrollRule(
      'MEETING_ASSISTANT',
      payrollMonth,
    );

  const sharedMetrics:
    Record<string, number> = {};

  const eligibilityEvaluation =
    await this.evaluateRuleEligibility(
      rule,
      payrollMonth,
      userId,
      'MEETING_ASSISTANT',
      sharedMetrics,
    );

  const eligibilityReason =
    this.buildEligibilityReason(
      eligibilityEvaluation
        .conditionResults,
    );

  const eligibilityMet =
    eligibilityEvaluation
      .eligibilityMet;

  const salaryEvaluation =
    await this
      .calculateRuleSalaryPercentage(
        rule,
        payrollMonth,
        userId,
        'MEETING_ASSISTANT',
        eligibilityMet,
        sharedMetrics,
      );

  const salaryPercentage =
    salaryEvaluation
      .salaryPercentage;

  const salaryAmount =
    this.calculateSalaryAmount(
      normalizedBasicSalary,
      salaryPercentage,
    );

  const incentiveEvaluation =
    await this.calculateRuleIncentives(
      rule,
      payrollMonth,
      userId,
      'MEETING_ASSISTANT',
      sharedMetrics,
    );

  const incentiveAmount =
    incentiveEvaluation
      .incentiveAmount;

  return {
    eligibilityMet,
    eligibilityReason,

    salaryPercentage,
    salaryAmount,
    incentiveAmount,

    actualMetrics: {
      ...sharedMetrics,
    },

    calculationSnapshot: {
      role: 'MEETING_ASSISTANT',

      payrollMonth,
      linkedUserId: userId,

      basicSalary:
        normalizedBasicSalary,

      actualMetrics: {
        ...sharedMetrics,
      },

      eligibilityMet,
      eligibilityReason,

      salaryPercentage,
      salaryAmount,
      incentiveAmount,

      eligibilityConditions:
        eligibilityEvaluation
          .conditionResults,

      incentiveComponents:
        incentiveEvaluation
          .componentResults,

      calculatedAt:
        new Date().toISOString(),
    },

    ruleSnapshot: {
      role: 'MEETING_ASSISTANT',

      ruleId: rule.id,
      ruleName: rule.ruleName,
      version: rule.version,

      scope: rule.scope,

      effectiveFrom:
        rule.effectiveFrom,

      effectiveTo:
        rule.effectiveTo,

      requireAllEligibilityConditions:
        rule
          .requireAllEligibilityConditions,

      eligibilityConditions:
        rule.eligibilityConditions,

      salaryMode:
        rule.salaryMode,

      salaryMetricType:
        rule.salaryMetricType,

      salaryTargetValue:
        rule.salaryTargetValue,

      maximumSalaryPercentage:
        rule.maximumSalaryPercentage,

      allowProportionalSalaryOnEligibilityFailure:
        rule
          .allowProportionalSalaryOnEligibilityFailure,

      incentiveComponents:
        rule.incentiveComponents,
    },
  };
}

  async calculateTradingManagerPayroll(
  payrollMonth: string,
  linkedUserId: number,
  basicSalary: number,
): Promise<PayrollCalculationResult> {
  const userId = Number(
    linkedUserId || 0,
  );

  const normalizedBasicSalary =
    Math.max(
      Number(
        basicSalary || 0,
      ),
      0,
    );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return this.createEmptyResult(
      'TRADING_MANAGER',
    );
  }

  const rule =
    await this.getActivePayrollRule(
      'TRADING_MANAGER',
      payrollMonth,
    );

  const sharedMetrics:
    Record<string, number> = {};

  const eligibilityEvaluation =
    await this.evaluateRuleEligibility(
      rule,
      payrollMonth,
      userId,
      'TRADING_MANAGER',
      sharedMetrics,
    );

  const eligibilityReason =
    this.buildEligibilityReason(
      eligibilityEvaluation
        .conditionResults,
    );

  const eligibilityMet =
    eligibilityEvaluation
      .eligibilityMet;

  const salaryEvaluation =
    await this
      .calculateRuleSalaryPercentage(
        rule,
        payrollMonth,
        userId,
        'TRADING_MANAGER',
        eligibilityMet,
        sharedMetrics,
      );

  const salaryPercentage =
    salaryEvaluation
      .salaryPercentage;

  const salaryAmount =
    this.calculateSalaryAmount(
      normalizedBasicSalary,
      salaryPercentage,
    );

  const incentiveEvaluation =
    await this.calculateRuleIncentives(
      rule,
      payrollMonth,
      userId,
      'TRADING_MANAGER',
      sharedMetrics,
    );

  const incentiveAmount =
    incentiveEvaluation
      .incentiveAmount;

  return {
    eligibilityMet,
    eligibilityReason,

    salaryPercentage,
    salaryAmount,
    incentiveAmount,

    actualMetrics: {
      ...sharedMetrics,
    },

    calculationSnapshot: {
      role: 'TRADING_MANAGER',

      payrollMonth,
      linkedUserId: userId,

      basicSalary:
        normalizedBasicSalary,

      actualMetrics: {
        ...sharedMetrics,
      },

      eligibilityMet,
      eligibilityReason,

      salaryPercentage,
      salaryAmount,
      incentiveAmount,

      eligibilityConditions:
        eligibilityEvaluation
          .conditionResults,

      incentiveComponents:
        incentiveEvaluation
          .componentResults,

      calculatedAt:
        new Date().toISOString(),
    },

    ruleSnapshot: {
      role: 'TRADING_MANAGER',

      ruleId: rule.id,
      ruleName: rule.ruleName,
      version: rule.version,

      scope: rule.scope,

      effectiveFrom:
        rule.effectiveFrom,

      effectiveTo:
        rule.effectiveTo,

      requireAllEligibilityConditions:
        rule
          .requireAllEligibilityConditions,

      eligibilityConditions:
        rule.eligibilityConditions,

      salaryMode:
        rule.salaryMode,

      salaryMetricType:
        rule.salaryMetricType,

      salaryTargetValue:
        rule.salaryTargetValue,

      maximumSalaryPercentage:
        rule.maximumSalaryPercentage,

      allowProportionalSalaryOnEligibilityFailure:
        rule
          .allowProportionalSalaryOnEligibilityFailure,

      incentiveComponents:
        rule.incentiveComponents,
    },
  };
}

  async calculateTradingHeadPayroll(
  payrollMonth: string,
  linkedUserId: number,
  basicSalary: number,
): Promise<PayrollCalculationResult> {
  const userId = Number(
    linkedUserId || 0,
  );

  const normalizedBasicSalary =
    Math.max(
      Number(
        basicSalary || 0,
      ),
      0,
    );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return this.createEmptyResult(
      'TRADING_HEAD',
    );
  }

  const rule =
    await this.getActivePayrollRule(
      'TRADING_HEAD',
      payrollMonth,
    );

  const sharedMetrics:
    Record<string, number> = {};

  const eligibilityEvaluation =
    await this.evaluateRuleEligibility(
      rule,
      payrollMonth,
      userId,
      'TRADING_HEAD',
      sharedMetrics,
    );

  const eligibilityReason =
    this.buildEligibilityReason(
      eligibilityEvaluation
        .conditionResults,
    );

  const eligibilityMet =
    eligibilityEvaluation
      .eligibilityMet;

  const salaryEvaluation =
    await this
      .calculateRuleSalaryPercentage(
        rule,
        payrollMonth,
        userId,
        'TRADING_HEAD',
        eligibilityMet,
        sharedMetrics,
      );

  const salaryPercentage =
    salaryEvaluation
      .salaryPercentage;

  const salaryAmount =
    this.calculateSalaryAmount(
      normalizedBasicSalary,
      salaryPercentage,
    );

  const incentiveEvaluation =
    await this.calculateRuleIncentives(
      rule,
      payrollMonth,
      userId,
      'TRADING_HEAD',
      sharedMetrics,
    );

  const incentiveAmount =
    incentiveEvaluation
      .incentiveAmount;

  return {
    eligibilityMet,
    eligibilityReason,

    salaryPercentage,
    salaryAmount,
    incentiveAmount,

    actualMetrics: {
      ...sharedMetrics,
    },

    calculationSnapshot: {
      role: 'TRADING_HEAD',

      payrollMonth,
      linkedUserId: userId,

      basicSalary:
        normalizedBasicSalary,

      actualMetrics: {
        ...sharedMetrics,
      },

      eligibilityMet,
      eligibilityReason,

      salaryPercentage,
      salaryAmount,
      incentiveAmount,

      eligibilityConditions:
        eligibilityEvaluation
          .conditionResults,

      incentiveComponents:
        incentiveEvaluation
          .componentResults,

      calculatedAt:
        new Date().toISOString(),
    },

    ruleSnapshot: {
      role: 'TRADING_HEAD',

      ruleId: rule.id,
      ruleName: rule.ruleName,
      version: rule.version,

      scope: rule.scope,

      effectiveFrom:
        rule.effectiveFrom,

      effectiveTo:
        rule.effectiveTo,

      requireAllEligibilityConditions:
        rule
          .requireAllEligibilityConditions,

      eligibilityConditions:
        rule.eligibilityConditions,

      salaryMode:
        rule.salaryMode,

      salaryMetricType:
        rule.salaryMetricType,

      salaryTargetValue:
        rule.salaryTargetValue,

      maximumSalaryPercentage:
        rule.maximumSalaryPercentage,

      allowProportionalSalaryOnEligibilityFailure:
        rule
          .allowProportionalSalaryOnEligibilityFailure,

      incentiveComponents:
        rule.incentiveComponents,
    },
  };
}

  async calculateSupportingStaffPayroll(
  payrollMonth: string,
  linkedUserId: number,
  basicSalary: number,
): Promise<PayrollCalculationResult> {
  const userId = Number(
    linkedUserId || 0,
  );

  const normalizedBasicSalary =
    Math.max(
      Number(
        basicSalary || 0,
      ),
      0,
    );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return this.createEmptyResult(
      'SUPPORTING_STAFF',
    );
  }

  const rule =
    await this.getActivePayrollRule(
      'SUPPORTING_STAFF',
      payrollMonth,
    );

  const sharedMetrics:
    Record<string, number> = {};

  const eligibilityEvaluation =
    await this.evaluateRuleEligibility(
      rule,
      payrollMonth,
      userId,
      'SUPPORTING_STAFF',
      sharedMetrics,
    );

  const eligibilityReason =
    this.buildEligibilityReason(
      eligibilityEvaluation
        .conditionResults,
    );

  const eligibilityMet =
    eligibilityEvaluation
      .eligibilityMet;

  const salaryEvaluation =
    await this
      .calculateRuleSalaryPercentage(
        rule,
        payrollMonth,
        userId,
        'SUPPORTING_STAFF',
        eligibilityMet,
        sharedMetrics,
      );

  const salaryPercentage =
    salaryEvaluation
      .salaryPercentage;

  const salaryAmount =
    this.calculateSalaryAmount(
      normalizedBasicSalary,
      salaryPercentage,
    );

  const incentiveEvaluation =
    await this.calculateRuleIncentives(
      rule,
      payrollMonth,
      userId,
      'SUPPORTING_STAFF',
      sharedMetrics,
    );

  const incentiveAmount =
    incentiveEvaluation
      .incentiveAmount;

  return {
    eligibilityMet,
    eligibilityReason,

    salaryPercentage,
    salaryAmount,
    incentiveAmount,

    actualMetrics: {
      ...sharedMetrics,
    },

    calculationSnapshot: {
      role: 'SUPPORTING_STAFF',

      payrollMonth,
      linkedUserId: userId,

      basicSalary:
        normalizedBasicSalary,

      actualMetrics: {
        ...sharedMetrics,
      },

      eligibilityMet,
      eligibilityReason,

      salaryPercentage,
      salaryAmount,
      incentiveAmount,

      eligibilityConditions:
        eligibilityEvaluation
          .conditionResults,

      incentiveComponents:
        incentiveEvaluation
          .componentResults,

      calculatedAt:
        new Date().toISOString(),
    },

    ruleSnapshot: {
      role: 'SUPPORTING_STAFF',

      ruleId: rule.id,
      ruleName: rule.ruleName,
      version: rule.version,

      scope: rule.scope,

      effectiveFrom:
        rule.effectiveFrom,

      effectiveTo:
        rule.effectiveTo,

      requireAllEligibilityConditions:
        rule
          .requireAllEligibilityConditions,

      eligibilityConditions:
        rule.eligibilityConditions,

      salaryMode:
        rule.salaryMode,

      salaryMetricType:
        rule.salaryMetricType,

      salaryTargetValue:
        rule.salaryTargetValue,

      maximumSalaryPercentage:
        rule.maximumSalaryPercentage,

      allowProportionalSalaryOnEligibilityFailure:
        rule
          .allowProportionalSalaryOnEligibilityFailure,

      incentiveComponents:
        rule.incentiveComponents,
    },
  };
}

  async calculateHrPayroll(
  payrollMonth: string,
  linkedUserId: number,
  basicSalary: number,
): Promise<PayrollCalculationResult> {
  const userId = Number(
    linkedUserId || 0,
  );

  const normalizedBasicSalary =
    Math.max(
      Number(
        basicSalary || 0,
      ),
      0,
    );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return this.createEmptyResult(
      'HR_MANAGER',
    );
  }

  const rule =
    await this.getActivePayrollRule(
      'HR_MANAGER',
      payrollMonth,
    );

  const sharedMetrics:
    Record<string, number> = {};

  const eligibilityEvaluation =
    await this.evaluateRuleEligibility(
      rule,
      payrollMonth,
      userId,
      'HR_MANAGER',
      sharedMetrics,
    );

  const eligibilityReason =
    this.buildEligibilityReason(
      eligibilityEvaluation
        .conditionResults,
    );

  const eligibilityMet =
    eligibilityEvaluation
      .eligibilityMet;

  const salaryEvaluation =
    await this
      .calculateRuleSalaryPercentage(
        rule,
        payrollMonth,
        userId,
        'HR_MANAGER',
        eligibilityMet,
        sharedMetrics,
      );

  const salaryPercentage =
    salaryEvaluation
      .salaryPercentage;

  const salaryAmount =
    this.calculateSalaryAmount(
      normalizedBasicSalary,
      salaryPercentage,
    );

  const incentiveEvaluation =
    await this.calculateRuleIncentives(
      rule,
      payrollMonth,
      userId,
      'HR_MANAGER',
      sharedMetrics,
    );

  const incentiveAmount =
    incentiveEvaluation
      .incentiveAmount;

  return {
    eligibilityMet,
    eligibilityReason,

    salaryPercentage,
    salaryAmount,
    incentiveAmount,

    actualMetrics: {
      ...sharedMetrics,
    },

    calculationSnapshot: {
      role: 'HR_MANAGER',

      payrollMonth,
      linkedUserId: userId,

      basicSalary:
        normalizedBasicSalary,

      actualMetrics: {
        ...sharedMetrics,
      },

      eligibilityMet,
      eligibilityReason,

      salaryPercentage,
      salaryAmount,
      incentiveAmount,

      eligibilityConditions:
        eligibilityEvaluation
          .conditionResults,

      incentiveComponents:
        incentiveEvaluation
          .componentResults,

      calculatedAt:
        new Date().toISOString(),
    },

    ruleSnapshot: {
      role: 'HR_MANAGER',

      ruleId: rule.id,
      ruleName: rule.ruleName,
      version: rule.version,

      scope: rule.scope,

      effectiveFrom:
        rule.effectiveFrom,

      effectiveTo:
        rule.effectiveTo,

      requireAllEligibilityConditions:
        rule
          .requireAllEligibilityConditions,

      eligibilityConditions:
        rule.eligibilityConditions,

      salaryMode:
        rule.salaryMode,

      salaryMetricType:
        rule.salaryMetricType,

      salaryTargetValue:
        rule.salaryTargetValue,

      maximumSalaryPercentage:
        rule.maximumSalaryPercentage,

      allowProportionalSalaryOnEligibilityFailure:
        rule
          .allowProportionalSalaryOnEligibilityFailure,

      incentiveComponents:
        rule.incentiveComponents,
    },
  };
}

  async calculateSolarFranchisePayroll(
  payrollMonth: string,
  linkedUserId: number,
  basicSalary: number,
): Promise<PayrollCalculationResult> {
  const userId = Number(
    linkedUserId || 0,
  );

  const normalizedBasicSalary =
    Math.max(
      Number(
        basicSalary || 0,
      ),
      0,
    );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return this.createEmptyResult(
      'SOLAR_FRANCHISE',
    );
  }

  const rule =
    await this.getActivePayrollRule(
      'SOLAR_FRANCHISE',
      payrollMonth,
    );

  const sharedMetrics:
    Record<string, number> = {};

  const eligibilityEvaluation =
    await this.evaluateRuleEligibility(
      rule,
      payrollMonth,
      userId,
      'SOLAR_FRANCHISE',
      sharedMetrics,
    );

  const eligibilityReason =
    this.buildEligibilityReason(
      eligibilityEvaluation
        .conditionResults,
    );

  const eligibilityMet =
    eligibilityEvaluation
      .eligibilityMet;

  const salaryEvaluation =
    await this
      .calculateRuleSalaryPercentage(
        rule,
        payrollMonth,
        userId,
        'SOLAR_FRANCHISE',
        eligibilityMet,
        sharedMetrics,
      );

  const salaryPercentage =
    salaryEvaluation
      .salaryPercentage;

  const salaryAmount =
    this.calculateSalaryAmount(
      normalizedBasicSalary,
      salaryPercentage,
    );

  const incentiveEvaluation =
    await this.calculateRuleIncentives(
      rule,
      payrollMonth,
      userId,
      'SOLAR_FRANCHISE',
      sharedMetrics,
    );

  const incentiveAmount =
    incentiveEvaluation
      .incentiveAmount;

  return {
    eligibilityMet,
    eligibilityReason,

    salaryPercentage,
    salaryAmount,
    incentiveAmount,

    actualMetrics: {
      ...sharedMetrics,
    },

    calculationSnapshot: {
      role: 'SOLAR_FRANCHISE',

      payrollMonth,
      linkedUserId: userId,

      basicSalary:
        normalizedBasicSalary,

      actualMetrics: {
        ...sharedMetrics,
      },

      eligibilityMet,
      eligibilityReason,

      salaryPercentage,
      salaryAmount,
      incentiveAmount,

      eligibilityConditions:
        eligibilityEvaluation
          .conditionResults,

      incentiveComponents:
        incentiveEvaluation
          .componentResults,

      calculatedAt:
        new Date().toISOString(),
    },

    ruleSnapshot: {
      role: 'SOLAR_FRANCHISE',

      ruleId: rule.id,
      ruleName: rule.ruleName,
      version: rule.version,

      scope: rule.scope,

      effectiveFrom:
        rule.effectiveFrom,

      effectiveTo:
        rule.effectiveTo,

      requireAllEligibilityConditions:
        rule
          .requireAllEligibilityConditions,

      eligibilityConditions:
        rule.eligibilityConditions,

      salaryMode:
        rule.salaryMode,

      salaryMetricType:
        rule.salaryMetricType,

      salaryTargetValue:
        rule.salaryTargetValue,

      maximumSalaryPercentage:
        rule.maximumSalaryPercentage,

      allowProportionalSalaryOnEligibilityFailure:
        rule
          .allowProportionalSalaryOnEligibilityFailure,

      incentiveComponents:
        rule.incentiveComponents,
    },
  };
}
}