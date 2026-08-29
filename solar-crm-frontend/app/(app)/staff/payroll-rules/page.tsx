'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

import {
  Box,
  Button,
  Checkbox,
FormControlLabel,
MenuItem,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';

import { getAuthHeaders } from '@/lib/authHeaders';

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL;

  const PAYROLL_ROLES = [
  'TELECALLING_MANAGER',
  'MEETING_MANAGER',
  'MARKETING_HEAD',
  'LEAD_MANAGER',
  'TELECALLER',
  'MEETING_ASSISTANT',
  'TRADING_MANAGER',
  'TRADING_HEAD',
  'HR_MANAGER',
  'SUPPORTING_STAFF',
  'SOLAR_FRANCHISE',
];

const SALARY_MODES = [
  'FULL_OR_ZERO',
  'PROPORTIONAL_TO_TARGET',
  'ATTENDANCE_HOURS',
  'ATTENDANCE_DAYS',
  'ATTENDANCE_PERCENTAGE',
  'MANUAL',
];

const TARGET_CALCULATION_MODES = [
  'FIXED',
  'TEAM_SIZE_MULTIPLIER',
];

const METRIC_TYPES = [
  'CALLS_MADE',
  'UNIQUE_CONTACTS_CALLED',
  'CALL_DURATION_MINUTES',
  'LEADS_CREATED',
  'QUALIFIED_LEADS',
  'TEAM_TELECALLERS',
  'TEAM_TELECALLER_APPROVED_PROJECTS',
  'TEAM_MEETING_MANAGERS',
'TEAM_MEETING_MANAGER_APPROVED_PROJECTS',
'TEAM_MEETING_MANAGER_GPS_SITE_VISITS_COMPLETED',
  'MEETINGS_SCHEDULED',
  'MEETINGS_COMPLETED',
  'GPS_SITE_VISITS_COMPLETED',
  'DEALER_MEETINGS_COMPLETED',
  'APPROVED_PROJECTS',
  'SELF_APPROVED_PROJECTS',
  'COMPANY_APPROVED_PROJECTS',
  'SOLAR_FRANCHISE_APPROVED_PROJECT_MARGIN',
  'DEALER_ORDERS',
  'DEALER_SALES_AMOUNT',
  'DEALER_NET_PROFIT',
  'DEALER_NET_PROFIT_ABOVE_SALES_TARGET',
  'TEAM_TRADING_MANAGERS',
  'TEAM_DEALER_NET_PROFIT_ABOVE_SALES_TARGET',
  'TEAM_DEALER_ORDERS',
  'TEAM_DEALER_SALES_AMOUNT',
  'TEAM_DEALER_NET_PROFIT',
  'STAFF_JOININGS',
  'SELECTED_SUPPORTING_STAFF',
  'PRESENT_DAYS',
  'WORKING_DAYS',
  'WORKING_HOURS',
  'ATTENDANCE_PERCENTAGE',
  'PAYMENT_COLLECTION_AMOUNT',
  'PAYMENT_COLLECTION_PERCENTAGE',
  'COMPLAINTS_ASSIGNED',
  'COMPLAINTS_RESOLVED',
  'COMPLAINT_RESOLUTION_PERCENTAGE',
  'MANUAL_NUMBER',
];

const CONDITION_OPERATORS = [
  'GREATER_THAN_OR_EQUAL',
  'GREATER_THAN',
  'EQUAL',
  'LESS_THAN_OR_EQUAL',
  'LESS_THAN',
];

const CONDITION_FAILURE_ACTIONS = [
  'ZERO_SALARY',
  'ZERO_INCENTIVE',
  'ZERO_SALARY_AND_INCENTIVE',
  'NONE',
];

const INCENTIVE_CALCULATION_TYPES = [
  'NONE',
  'FLAT',
  'PER_UNIT',
  'PER_UNIT_ABOVE_TARGET',
  'PERCENTAGE',
  'SLAB',
  'POOL_SHARE',
  'MANUAL',
];

const POOL_DIVISOR_MODES = [
  'ALL_SUPPORTING_STAFF',
  'FIXED_DIVISOR',
  'ALL_ELIGIBLE_STAFF',
];

const SLAB_CALCULATION_MODES = [
  'VALUE_BASED',
  'SEQUENTIAL_PROJECT_MARGIN',
];

type IncentiveSlabForm = {
  minimumValue: number;
  maximumValue?: number | null;
  rateAmount?: number;
  percentageRate?: number;
  flatAmount?: number;
  applyRateToAllUnits?: boolean;
};

type IncentiveComponentForm = {
  id: string;
  label: string;
  metricType: string;
  customMetricName?: string;
  calculationType: string;

  rateAmount?: number;
  percentageRate?: number;
  baselineTarget?: number;

  slabSelectorMetricType?: string;
  slabCalculationMode?: string;
  slabRules?: IncentiveSlabForm[];

  poolAmountPerCompanyUnit?: number;
  poolCompanyMetricType?: string;
  poolDivisorMode?: string;
  fixedPoolDivisor?: number;
  minimumPersonalMetricValue?: number;

  independentFromSalaryEligibility: boolean;
  maximumAmount?: number | null;
  isEnabled: boolean;
};

type EligibilityConditionForm = {
  id: string;
  label: string;
  metricType: string;
  customMetricName?: string;
  operator: string;
  targetValue: number;

  targetCalculationMode?: string;
  targetMultiplierMetricType?: string;
  teamMemberTargetValue?: number;

  failureAction: string;
  isEnabled: boolean;
};

const createEmptyRuleForm = () => ({
  ruleName: '',
  description: '',

  scope: 'ROLE',
  applicableRole: '',
  staffId: '',
  staffName: '',

  effectiveFrom: '',
  effectiveTo: '',

  salaryMode: 'MANUAL',
  salaryMetricType: '',
  salaryCustomMetricName: '',
  salaryTargetValue: '0',

  minimumProjectPaymentPercentage: '0',

  targetCalculationMode: 'FIXED',
  targetMultiplierMetricType: '',
  teamMemberTargetValue: '0',

  maximumSalaryPercentage: '100',

  attendanceTargetHours: '0',
  attendanceTargetDays: '0',
  attendanceTargetPercentage: '0',

  requireAllEligibilityConditions: true,
  allowProportionalSalaryOnEligibilityFailure: false,

  maximumSalaryAmount: '',
  maximumIncentiveAmount: '',

  eligibilityConditionsJson: '[]',
  incentiveComponentsJson: '[]',
  additionalSettingsJson: '{}',

  isActive: true,
});

export default function PayrollRulesPage() {
  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [rules, setRules] =
    useState<any[]>([]);

    const [viewRule, setViewRule] =
  useState<any>(null);

const [viewOpen, setViewOpen] =
  useState(false);

const [viewLoading, setViewLoading] =
  useState(false);

  const [formOpen, setFormOpen] =
  useState(false);

const [editingRuleId, setEditingRuleId] =
  useState<number | null>(null);

const [ruleForm, setRuleForm] =
  useState(createEmptyRuleForm());

const [formLoading, setFormLoading] =
  useState(false);

const [formError, setFormError] =
  useState('');

  const [showHidden, setShowHidden] =
  useState(false);

const [actionLoadingId, setActionLoadingId] =
  useState<number | null>(null);

  async function loadRules() {
    try {
      setLoading(true);

      const res =
        await axios.get(
          `${API}/staff/payroll-rules`,
          {
            headers:
              await getAuthHeaders(),

            params: {
  search,
  showHidden,
},
          },
        );

      setRules(res.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function openRule(
  id: number,
) {
  try {
    setViewLoading(true);

    const res =
      await axios.get(
        `${API}/staff/payroll-rule/${id}`,
        {
          headers:
            await getAuthHeaders(),
        },
      );

    setViewRule(res.data);
    setViewOpen(true);
  } finally {
    setViewLoading(false);
  }
}

function openAddRule() {
  setEditingRuleId(null);

  setRuleForm({
    ...createEmptyRuleForm(),
    scope: 'ROLE',
  });

  setFormError('');
  setFormOpen(true);
}

async function openEditRule(
  id: number,
) {
  try {
    setFormLoading(true);
    setFormError('');

    const res =
      await axios.get(
        `${API}/staff/payroll-rule/${id}`,
        {
          headers:
            await getAuthHeaders(),
        },
      );

    const rule = res.data;

    setEditingRuleId(
      Number(rule.id),
    );

    setRuleForm({
      ruleName:
        String(rule.ruleName || ''),

      description:
        String(
          rule.description || '',
        ),

      scope:
        String(rule.scope || 'ROLE'),

      applicableRole:
        String(
          rule.applicableRole || '',
        ),

      staffId:
        rule.staffId === null ||
        rule.staffId === undefined
          ? ''
          : String(rule.staffId),

      staffName:
        String(rule.staffName || ''),

      effectiveFrom:
        String(
          rule.effectiveFrom || '',
        ),

      effectiveTo:
        String(rule.effectiveTo || ''),

      salaryMode:
        String(
          rule.salaryMode || 'MANUAL',
        ),

      salaryMetricType:
        String(
          rule.salaryMetricType || '',
        ),

      salaryCustomMetricName:
        String(
          rule.salaryCustomMetricName ||
            '',
        ),

      salaryTargetValue:
        String(
          rule.salaryTargetValue ?? 0,
        ),

        minimumProjectPaymentPercentage:
  String(
    rule.minimumProjectPaymentPercentage ??
      0,
  ),

      targetCalculationMode:
        String(
          rule.targetCalculationMode ||
            'FIXED',
        ),

      targetMultiplierMetricType:
        String(
          rule.targetMultiplierMetricType ||
            '',
        ),

      teamMemberTargetValue:
        String(
          rule.teamMemberTargetValue ??
            0,
        ),

      maximumSalaryPercentage:
        String(
          rule.maximumSalaryPercentage ??
            100,
        ),

      attendanceTargetHours:
        String(
          rule.attendanceTargetHours ??
            0,
        ),

      attendanceTargetDays:
        String(
          rule.attendanceTargetDays ??
            0,
        ),

      attendanceTargetPercentage:
        String(
          rule.attendanceTargetPercentage ??
            0,
        ),

      requireAllEligibilityConditions:
        rule.requireAllEligibilityConditions !==
        false,

      allowProportionalSalaryOnEligibilityFailure:
        rule.allowProportionalSalaryOnEligibilityFailure ===
        true,

      maximumSalaryAmount:
        rule.maximumSalaryAmount ===
          null ||
        rule.maximumSalaryAmount ===
          undefined
          ? ''
          : String(
              rule.maximumSalaryAmount,
            ),

      maximumIncentiveAmount:
        rule.maximumIncentiveAmount ===
          null ||
        rule.maximumIncentiveAmount ===
          undefined
          ? ''
          : String(
              rule.maximumIncentiveAmount,
            ),

      eligibilityConditionsJson:
        JSON.stringify(
          rule.eligibilityConditions ||
            [],
          null,
          2,
        ),

      incentiveComponentsJson:
        JSON.stringify(
          rule.incentiveComponents ||
            [],
          null,
          2,
        ),

      additionalSettingsJson:
        JSON.stringify(
          rule.additionalSettings || {},
          null,
          2,
        ),

      isActive:
        rule.isActive !== false,
    });

    setFormOpen(true);
  } catch (error: any) {
    setFormError(
      error?.response?.data?.message ||
        'Unable to load payroll rule',
    );
  } finally {
    setFormLoading(false);
  }
}

function getEligibilityConditions():
  EligibilityConditionForm[] {
  try {
    const parsed = JSON.parse(
      ruleForm.eligibilityConditionsJson ||
        '[]',
    );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function setEligibilityConditions(
  conditions:
    EligibilityConditionForm[],
) {
  setRuleForm({
    ...ruleForm,

    eligibilityConditionsJson:
      JSON.stringify(
        conditions,
        null,
        2,
      ),
  });
}

function addEligibilityCondition() {
  const conditions =
    getEligibilityConditions();

  conditions.push({
  id: `condition-${Date.now()}`,
  label: '',
  metricType: '',
  customMetricName: '',
  operator:
    'GREATER_THAN_OR_EQUAL',
  targetValue: 0,

  targetCalculationMode:
    'FIXED',
  targetMultiplierMetricType:
    '',
  teamMemberTargetValue: 0,

  failureAction:
    'ZERO_SALARY',
  isEnabled: true,
});

  setEligibilityConditions(
    conditions,
  );
}

function updateEligibilityCondition(
  index: number,
  field: keyof EligibilityConditionForm,
  value: any,
) {
  const conditions =
    getEligibilityConditions();

  if (!conditions[index]) {
    return;
  }

  conditions[index] = {
    ...conditions[index],
    [field]: value,
  };

  setEligibilityConditions(
    conditions,
  );
}

function removeEligibilityCondition(
  index: number,
) {
  const conditions =
    getEligibilityConditions();

  conditions.splice(index, 1);

  setEligibilityConditions(
    conditions,
  );
}

function getIncentiveComponents():
  IncentiveComponentForm[] {
  try {
    const parsed = JSON.parse(
      ruleForm.incentiveComponentsJson ||
        '[]',
    );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function setIncentiveComponents(
  components:
    IncentiveComponentForm[],
) {
  setRuleForm({
    ...ruleForm,

    incentiveComponentsJson:
      JSON.stringify(
        components,
        null,
        2,
      ),
  });
}

function addIncentiveComponent() {
  const components =
    getIncentiveComponents();

  components.push({
    id: `incentive-${Date.now()}`,
    label: '',
    metricType: '',
    customMetricName: '',
    calculationType: 'PER_UNIT',

    rateAmount: 0,
    percentageRate: 0,
    baselineTarget: 0,

    slabSelectorMetricType: '',
    slabCalculationMode:
      'VALUE_BASED',
    slabRules: [],

    poolAmountPerCompanyUnit: 0,
    poolCompanyMetricType: '',
    poolDivisorMode:
      'ALL_SUPPORTING_STAFF',
    fixedPoolDivisor: 0,
    minimumPersonalMetricValue: 0,

    independentFromSalaryEligibility:
      true,

    maximumAmount: null,
    isEnabled: true,
  });

  setIncentiveComponents(
    components,
  );
}

function updateIncentiveComponent(
  index: number,
  field: keyof IncentiveComponentForm,
  value: any,
) {
  const components =
    getIncentiveComponents();

  if (!components[index]) {
    return;
  }

  components[index] = {
    ...components[index],
    [field]: value,
  };

  setIncentiveComponents(
    components,
  );
}

function removeIncentiveComponent(
  index: number,
) {
  const components =
    getIncentiveComponents();

  components.splice(index, 1);

  setIncentiveComponents(
    components,
  );
}

function addIncentiveSlab(
  componentIndex: number,
) {
  const components =
    getIncentiveComponents();

  const component =
    components[componentIndex];

  if (!component) {
    return;
  }

  const slabRules =
    Array.isArray(
      component.slabRules,
    )
      ? [...component.slabRules]
      : [];

  slabRules.push({
    minimumValue: 0,
    maximumValue: null,
    rateAmount: 0,
    percentageRate: 0,
    flatAmount: 0,
    applyRateToAllUnits: false,
  });

  components[componentIndex] = {
    ...component,
    slabRules,
  };

  setIncentiveComponents(
    components,
  );
}

function updateIncentiveSlab(
  componentIndex: number,
  slabIndex: number,
  field: keyof IncentiveSlabForm,
  value: any,
) {
  const components =
    getIncentiveComponents();

  const component =
    components[componentIndex];

  if (!component) {
    return;
  }

  const slabRules =
    Array.isArray(
      component.slabRules,
    )
      ? [...component.slabRules]
      : [];

  if (!slabRules[slabIndex]) {
    return;
  }

  slabRules[slabIndex] = {
    ...slabRules[slabIndex],
    [field]: value,
  };

  components[componentIndex] = {
    ...component,
    slabRules,
  };

  setIncentiveComponents(
    components,
  );
}

function removeIncentiveSlab(
  componentIndex: number,
  slabIndex: number,
) {
  const components =
    getIncentiveComponents();

  const component =
    components[componentIndex];

  if (!component) {
    return;
  }

  const slabRules =
    Array.isArray(
      component.slabRules,
    )
      ? [...component.slabRules]
      : [];

  slabRules.splice(
    slabIndex,
    1,
  );

  components[componentIndex] = {
    ...component,
    slabRules,
  };

  setIncentiveComponents(
    components,
  );
}

async function saveRule() {
  try {
    setFormLoading(true);
    setFormError('');

    let eligibilityConditions: any[] = [];
    let incentiveComponents: any[] = [];
    let additionalSettings: Record<string, any> = {};

    try {
      eligibilityConditions =
        JSON.parse(
          ruleForm.eligibilityConditionsJson ||
            '[]',
        );

      if (
        !Array.isArray(
          eligibilityConditions,
        )
      ) {
        throw new Error();
      }
    } catch {
      throw new Error(
        'Eligibility Conditions must contain a valid JSON array.',
      );
    }

    try {
      incentiveComponents =
        JSON.parse(
          ruleForm.incentiveComponentsJson ||
            '[]',
        );

      if (
        !Array.isArray(
          incentiveComponents,
        )
      ) {
        throw new Error();
      }
    } catch {
      throw new Error(
        'Incentive Components must contain a valid JSON array.',
      );
    }

    try {
      additionalSettings =
        JSON.parse(
          ruleForm.additionalSettingsJson ||
            '{}',
        );

      if (
        !additionalSettings ||
        Array.isArray(
          additionalSettings,
        ) ||
        typeof additionalSettings !==
          'object'
      ) {
        throw new Error();
      }
    } catch {
      throw new Error(
        'Additional Settings must contain a valid JSON object.',
      );
    }

    const payload = {
      ruleName:
        ruleForm.ruleName.trim(),

      description:
        ruleForm.description.trim(),

      scope:
        ruleForm.scope,

      applicableRole:
        ruleForm.scope === 'ROLE'
          ? ruleForm.applicableRole
          : null,

      staffId:
        ruleForm.scope === 'STAFF'
          ? Number(ruleForm.staffId)
          : null,

      staffName:
        ruleForm.scope === 'STAFF'
          ? ruleForm.staffName.trim()
          : null,

      effectiveFrom:
        ruleForm.effectiveFrom ||
        null,

      effectiveTo:
        ruleForm.effectiveTo ||
        null,

      salaryMode:
        ruleForm.salaryMode,

      salaryMetricType:
        ruleForm.salaryMetricType ||
        null,

      salaryCustomMetricName:
        ruleForm.salaryCustomMetricName.trim() ||
        null,

      salaryTargetValue:
        Number(
          ruleForm.salaryTargetValue ||
            0,
        ),

        minimumProjectPaymentPercentage:
  Number(
    ruleForm
      .minimumProjectPaymentPercentage ||
      0,
  ),


      targetCalculationMode:
        ruleForm.targetCalculationMode,

      targetMultiplierMetricType:
        ruleForm.targetMultiplierMetricType ||
        null,

      teamMemberTargetValue:
        Number(
          ruleForm.teamMemberTargetValue ||
            0,
        ),

      maximumSalaryPercentage:
        Number(
          ruleForm.maximumSalaryPercentage ||
            0,
        ),

      attendanceTargetHours:
        Number(
          ruleForm.attendanceTargetHours ||
            0,
        ),

      attendanceTargetDays:
        Number(
          ruleForm.attendanceTargetDays ||
            0,
        ),

      attendanceTargetPercentage:
        Number(
          ruleForm.attendanceTargetPercentage ||
            0,
        ),

      requireAllEligibilityConditions:
        ruleForm.requireAllEligibilityConditions,

      allowProportionalSalaryOnEligibilityFailure:
        ruleForm.allowProportionalSalaryOnEligibilityFailure,

      maximumSalaryAmount:
        ruleForm.maximumSalaryAmount ===
        ''
          ? null
          : Number(
              ruleForm.maximumSalaryAmount,
            ),

      maximumIncentiveAmount:
        ruleForm.maximumIncentiveAmount ===
        ''
          ? null
          : Number(
              ruleForm.maximumIncentiveAmount,
            ),

      eligibilityConditions,
      incentiveComponents,
      additionalSettings,

      isActive:
        ruleForm.isActive,
    };

    if (editingRuleId) {
      await axios.patch(
        `${API}/staff/payroll-rule/${editingRuleId}`,
        payload,
        {
          headers:
            await getAuthHeaders(),
        },
      );
    } else {
      await axios.post(
        `${API}/staff/payroll-rule`,
        payload,
        {
          headers:
            await getAuthHeaders(),
        },
      );
    }

    setFormOpen(false);
    setEditingRuleId(null);
    setRuleForm(
      createEmptyRuleForm(),
    );

    await loadRules();
  } catch (error: any) {
    const responseMessage =
      error?.response?.data?.message;

    setFormError(
      Array.isArray(responseMessage)
        ? responseMessage.join(', ')
        : responseMessage ||
            error?.message ||
            'Unable to save payroll rule',
    );
  } finally {
    setFormLoading(false);
  }
}

async function hideRule(
  id: number,
) {
  const reason =
    window.prompt(
      'Reason for hiding this payroll rule:',
    );

  if (reason === null) {
    return;
  }

  try {
    setActionLoadingId(id);

    await axios.patch(
      `${API}/staff/payroll-rule/${id}/hide`,
      {
        reason:
          reason.trim(),
      },
      {
        headers:
          await getAuthHeaders(),
      },
    );

    await loadRules();
  } catch (error: any) {
    window.alert(
      error?.response?.data?.message ||
        'Unable to hide payroll rule',
    );
  } finally {
    setActionLoadingId(null);
  }
}

async function restoreRule(
  id: number,
) {
  const reason =
    window.prompt(
      'Reason for restoring this payroll rule:',
    );

  if (reason === null) {
    return;
  }

  try {
    setActionLoadingId(id);

    await axios.patch(
      `${API}/staff/payroll-rule/${id}/restore`,
      {
        reason:
          reason.trim(),
        isActive: true,
      },
      {
        headers:
          await getAuthHeaders(),
      },
    );

    await loadRules();
  } catch (error: any) {
    window.alert(
      error?.response?.data?.message ||
        'Unable to restore payroll rule',
    );
  } finally {
    setActionLoadingId(null);
  }
}

  useEffect(() => {
  loadRules();
}, [showHidden]);

  return (
    <Box className="space-y-5">

      <Paper className="rounded-2xl p-5">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold">
              Payroll Rules
            </h1>

            <p className="text-sm text-gray-500">
              Configure salary,
              eligibility,
              incentives,
              slabs,
              pools
              and
              payroll
              calculations.
            </p>

          </div>

          <Button
  variant="contained"
  onClick={openAddRule}
>
  Add Payroll Rule
</Button>

        </div>

      </Paper>

      <Paper className="rounded-2xl p-5">

        <div className="mb-5 flex gap-3">

          <TextField
            label="Search"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
            fullWidth
          />

          <Button
            variant="contained"
            onClick={loadRules}
          >
            Search
          </Button>

          <FormControlLabel
  control={
    <Checkbox
      checked={showHidden}
      onChange={(e) =>
        setShowHidden(
          e.target.checked,
        )
      }
    />
  }
  label="Show Hidden"
/>

        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <CircularProgress />
          </div>
        ) : (

          <Table>

            <TableHead>

              <TableRow>

                <TableCell>
                  Rule
                </TableCell>

                <TableCell>
                  Role
                </TableCell>

                <TableCell>
                  Salary Mode
                </TableCell>

                <TableCell>
                  Active
                </TableCell>

                <TableCell>
                  Effective From
                </TableCell>

                <TableCell>
                  Effective To
                </TableCell>

                <TableCell>
                  Actions
                </TableCell>

              </TableRow>

            </TableHead>

            <TableBody>

              {rules.map(
                (rule) => (

                  <TableRow
                    key={rule.id}
                  >

                    <TableCell>
                      {rule.ruleName}
                    </TableCell>

                    <TableCell>
                      {rule.applicableRole}
                    </TableCell>

                    <TableCell>
                      {rule.salaryMode}
                    </TableCell>

                    <TableCell>

                      <Chip
                        color={
                          rule.isActive
                            ? 'success'
                            : 'default'
                        }
                        label={
                          rule.isActive
                            ? 'Active'
                            : 'Inactive'
                        }
                      />

                    </TableCell>

                    <TableCell>
                      {rule.effectiveFrom ||
                        '-'}
                    </TableCell>

                    <TableCell>
                      {rule.effectiveTo ||
                        '-'}
                    </TableCell>

                    <TableCell>

                      <div className="flex gap-2">

                        <Button
  size="small"
  variant="outlined"
  onClick={() =>
    openRule(rule.id)
  }
>
  View
</Button>

                        <Button
  size="small"
  variant="outlined"
  onClick={() =>
    openEditRule(rule.id)
  }
>
  Edit
</Button>

                        {showHidden ? (
  <Button
    size="small"
    color="success"
    variant="outlined"
    disabled={
      actionLoadingId ===
      rule.id
    }
    onClick={() =>
      restoreRule(rule.id)
    }
  >
    {actionLoadingId ===
    rule.id
      ? 'Restoring...'
      : 'Restore'}
  </Button>
) : (
  <Button
    size="small"
    color="error"
    variant="outlined"
    disabled={
      actionLoadingId ===
      rule.id
    }
    onClick={() =>
      hideRule(rule.id)
    }
  >
    {actionLoadingId ===
    rule.id
      ? 'Hiding...'
      : 'Hide'}
  </Button>
)}

                      </div>

                    </TableCell>

                  </TableRow>

                ),
              )}

            </TableBody>

          </Table>

        )}

      </Paper>

      <Dialog
  open={viewOpen}
  onClose={() => setViewOpen(false)}
  fullWidth
  maxWidth="lg"
>
  <DialogTitle>
    Payroll Rule Details
  </DialogTitle>

  <DialogContent dividers>
    {viewLoading ? (
      <div className="flex justify-center py-10">
        <CircularProgress />
      </div>
    ) : viewRule ? (
      <div className="space-y-5">

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">
              Rule Name
            </p>
            <p className="font-semibold">
              {viewRule.ruleName || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Scope
            </p>
            <p className="font-semibold">
              {viewRule.scope || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Applicable Role
            </p>
            <p className="font-semibold">
              {viewRule.applicableRole || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Staff
            </p>
            <p className="font-semibold">
              {viewRule.staffName || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Salary Mode
            </p>
            <p className="font-semibold">
              {viewRule.salaryMode || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Salary Metric
            </p>
            <p className="font-semibold">
              {viewRule.salaryMetricType || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Salary Target
            </p>
            <p className="font-semibold">
              {viewRule.salaryTargetValue ?? 0}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Maximum Salary %
            </p>
            <p className="font-semibold">
              {viewRule.maximumSalaryPercentage ?? 0}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Target Calculation
            </p>
            <p className="font-semibold">
              {viewRule.targetCalculationMode || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Target Multiplier Metric
            </p>
            <p className="font-semibold">
              {viewRule.targetMultiplierMetricType || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Effective From
            </p>
            <p className="font-semibold">
              {viewRule.effectiveFrom || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Effective To
            </p>
            <p className="font-semibold">
              {viewRule.effectiveTo || '-'}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs text-gray-500">
            Description
          </p>
          <p className="rounded bg-gray-50 p-3 text-sm">
            {viewRule.description || '-'}
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-bold">
            Eligibility Conditions
          </h3>

          <pre className="max-h-80 overflow-auto rounded bg-gray-100 p-3 text-xs">
            {JSON.stringify(
              viewRule.eligibilityConditions || [],
              null,
              2,
            )}
          </pre>
        </div>

        <div>
          <h3 className="mb-2 font-bold">
            Incentive Components
          </h3>

          <pre className="max-h-96 overflow-auto rounded bg-gray-100 p-3 text-xs">
            {JSON.stringify(
              viewRule.incentiveComponents || [],
              null,
              2,
            )}
          </pre>
        </div>

        <div>
          <h3 className="mb-2 font-bold">
            Additional Settings
          </h3>

          <pre className="max-h-80 overflow-auto rounded bg-gray-100 p-3 text-xs">
            {JSON.stringify(
              viewRule.additionalSettings || {},
              null,
              2,
            )}
          </pre>
        </div>

      </div>
    ) : (
      <p className="py-8 text-center text-gray-500">
        Payroll rule details are unavailable.
      </p>
    )}
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => setViewOpen(false)}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>

<Dialog
  open={formOpen}
  onClose={() => {
    if (!formLoading) {
      setFormOpen(false);
    }
  }}
  fullWidth
  maxWidth="lg"
>
  <DialogTitle>
    {editingRuleId
      ? 'Edit Payroll Rule'
      : 'Add Payroll Rule'}
  </DialogTitle>

  <DialogContent dividers>
    {formLoading ? (
      <div className="flex justify-center py-10">
        <CircularProgress />
      </div>
    ) : (
      <div className="space-y-6">
        {formError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </div>
        ) : null}

        <div>
          <h3 className="mb-3 font-bold">
            General
          </h3>

          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              label="Rule Name"
              value={ruleForm.ruleName}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  ruleName:
                    e.target.value,
                })
              }
              required
              fullWidth
            />

            <TextField
  select
  label="Scope"
  value={ruleForm.scope}
  onChange={(e) =>
    setRuleForm({
      ...ruleForm,
      scope: e.target.value,
    })
  }
  fullWidth
>
  <MenuItem value="ROLE">
    Role
  </MenuItem>

  <MenuItem
    value="STAFF"
    disabled
  >
    Staff — Individual override coming later
  </MenuItem>
</TextField>

            {ruleForm.scope ===
            'ROLE' ? (
              <TextField
                select
                label="Applicable Role"
                value={
                  ruleForm.applicableRole
                }
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    applicableRole:
                      e.target.value,
                  })
                }
                required
                fullWidth
              >
                {PAYROLL_ROLES.map(
                  (role) => (
                    <MenuItem
                      key={role}
                      value={role}
                    >
                      {role}
                    </MenuItem>
                  ),
                )}
              </TextField>
            ) : (
              <>
                <TextField
                  label="Staff ID"
                  type="number"
                  value={
                    ruleForm.staffId
                  }
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      staffId:
                        e.target.value,
                    })
                  }
                  required
                  fullWidth
                />

                <TextField
                  label="Staff Name"
                  value={
                    ruleForm.staffName
                  }
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      staffName:
                        e.target.value,
                    })
                  }
                  fullWidth
                />
              </>
            )}

            <TextField
              label="Effective From"
              type="date"
              value={
                ruleForm.effectiveFrom
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  effectiveFrom:
                    e.target.value,
                })
              }
              slotProps={{
  inputLabel: {
    shrink: true,
  },
}}
              fullWidth
            />

            <TextField
              label="Effective To"
              type="date"
              value={
                ruleForm.effectiveTo
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  effectiveTo:
                    e.target.value,
                })
              }
              slotProps={{
  inputLabel: {
    shrink: true,
  },
}}
              fullWidth
            />

            <div className="md:col-span-2">
              <TextField
                label="Description"
                value={
                  ruleForm.description
                }
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    description:
                      e.target.value,
                  })
                }
                multiline
                minRows={3}
                fullWidth
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-bold">
            Salary
          </h3>

          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              select
              label="Salary Mode"
              value={
                ruleForm.salaryMode
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  salaryMode:
                    e.target.value,
                })
              }
              fullWidth
            >
              {SALARY_MODES.map(
                (mode) => (
                  <MenuItem
                    key={mode}
                    value={mode}
                  >
                    {mode}
                  </MenuItem>
                ),
              )}
            </TextField>

            <TextField
              select
              label="Salary Metric"
              value={
                ruleForm.salaryMetricType
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  salaryMetricType:
                    e.target.value,
                })
              }
              fullWidth
            >
              <MenuItem value="">
                None
              </MenuItem>

              {METRIC_TYPES.map(
                (metric) => (
                  <MenuItem
                    key={metric}
                    value={metric}
                  >
                    {metric}
                  </MenuItem>
                ),
              )}
            </TextField>

            <TextField
              label="Salary Custom Metric Name"
              value={
                ruleForm.salaryCustomMetricName
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  salaryCustomMetricName:
                    e.target.value,
                })
              }
              fullWidth
            />

            <TextField
              label="Salary Target Value"
              type="number"
              value={
                ruleForm.salaryTargetValue
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  salaryTargetValue:
                    e.target.value,
                })
              }
              fullWidth
            />

            <TextField
  label="Minimum Project Payment %"
  disabled={
  Number(
    ruleForm.minimumProjectPaymentPercentage || 0,
  ) <= 0
}
  type="number"
  value={
    ruleForm
      .minimumProjectPaymentPercentage
  }
  onChange={(e) =>
    setRuleForm({
      ...ruleForm,
      minimumProjectPaymentPercentage:
        e.target.value,
    })
  }
  helperText="0 disables payment-based project qualification."
  fullWidth
/>

<div className="rounded-xl border border-gray-200 p-4">
  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={
        Number(
          ruleForm.minimumProjectPaymentPercentage || 0,
        ) > 0
      }
      onChange={(e) =>
        setRuleForm({
          ...ruleForm,
          minimumProjectPaymentPercentage:
            e.target.checked
              ? Number(
                  ruleForm.minimumProjectPaymentPercentage || 0,
                ) > 0
                ? ruleForm.minimumProjectPaymentPercentage
                : '20'
              : '0',
        })
      }
      className="h-4 w-4"
    />

    <span className="font-medium">
      Require Minimum Project Payment Before Project Counts For Payroll
    </span>
  </label>

  <p className="mt-2 text-sm text-gray-500">
    When enabled, every project-based payroll metric
    (eligibility, salary and incentive) counts only after
    the configured payment percentage has been received.
  </p>
</div>

            <TextField
              select
              label="Target Calculation Mode"
              value={
                ruleForm.targetCalculationMode
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  targetCalculationMode:
                    e.target.value,
                })
              }
              fullWidth
            >
              {TARGET_CALCULATION_MODES.map(
                (mode) => (
                  <MenuItem
                    key={mode}
                    value={mode}
                  >
                    {mode}
                  </MenuItem>
                ),
              )}
            </TextField>

            <TextField
              select
              label="Target Multiplier Metric"
              value={
                ruleForm.targetMultiplierMetricType
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  targetMultiplierMetricType:
                    e.target.value,
                })
              }
              fullWidth
            >
              <MenuItem value="">
                None
              </MenuItem>

              {METRIC_TYPES.map(
                (metric) => (
                  <MenuItem
                    key={metric}
                    value={metric}
                  >
                    {metric}
                  </MenuItem>
                ),
              )}
            </TextField>

            <TextField
              label="Target Per Team Member"
              type="number"
              value={
                ruleForm.teamMemberTargetValue
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  teamMemberTargetValue:
                    e.target.value,
                })
              }
              fullWidth
            />

            <TextField
              label="Maximum Salary %"
              type="number"
              value={
                ruleForm.maximumSalaryPercentage
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  maximumSalaryPercentage:
                    e.target.value,
                })
              }
              fullWidth
            />

            <TextField
              label="Maximum Salary Amount"
              type="number"
              value={
                ruleForm.maximumSalaryAmount
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  maximumSalaryAmount:
                    e.target.value,
                })
              }
              fullWidth
            />

            <TextField
              label="Maximum Incentive Amount"
              type="number"
              value={
                ruleForm.maximumIncentiveAmount
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  maximumIncentiveAmount:
                    e.target.value,
                })
              }
              fullWidth
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-bold">
            Attendance Targets
          </h3>

          <div className="grid gap-3 md:grid-cols-3">
            <TextField
              label="Attendance Target Hours"
              type="number"
              value={
                ruleForm.attendanceTargetHours
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  attendanceTargetHours:
                    e.target.value,
                })
              }
              fullWidth
            />

            <TextField
              label="Attendance Target Days"
              type="number"
              value={
                ruleForm.attendanceTargetDays
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  attendanceTargetDays:
                    e.target.value,
                })
              }
              fullWidth
            />

            <TextField
              label="Attendance Target %"
              type="number"
              value={
                ruleForm.attendanceTargetPercentage
              }
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  attendanceTargetPercentage:
                    e.target.value,
                })
              }
              fullWidth
            />
          </div>
        </div>

        <div>
  <div className="mb-3 flex items-center justify-between gap-3">
    <div>
      <h3 className="font-bold">
        Eligibility Conditions
      </h3>

      <p className="text-xs text-gray-500">
        Configure the conditions required
        for salary or incentive eligibility.
      </p>
    </div>

    <Button
      variant="outlined"
      onClick={
        addEligibilityCondition
      }
    >
      Add Condition
    </Button>
  </div>

  <div className="space-y-4">
    {getEligibilityConditions()
      .length === 0 ? (
      <div className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-500">
        No eligibility condition configured.
      </div>
    ) : (
      getEligibilityConditions().map(
        (
          condition,
          index,
        ) => (
          <Paper
            key={
              condition.id ||
              index
            }
            variant="outlined"
            className="rounded-xl p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold">
                Condition {index + 1}
              </h4>

              <Button
                color="error"
                size="small"
                onClick={() =>
                  removeEligibilityCondition(
                    index,
                  )
                }
              >
                Remove
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <TextField
                label="Condition Label"
                value={
                  condition.label ||
                  ''
                }
                onChange={(e) =>
                  updateEligibilityCondition(
                    index,
                    'label',
                    e.target.value,
                  )
                }
                fullWidth
              />

              <TextField
                select
                label="Metric"
                value={
                  condition.metricType ||
                  ''
                }
                onChange={(e) =>
                  updateEligibilityCondition(
                    index,
                    'metricType',
                    e.target.value,
                  )
                }
                fullWidth
              >
                <MenuItem value="">
                  Select Metric
                </MenuItem>

                {METRIC_TYPES.map(
                  (metric) => (
                    <MenuItem
                      key={metric}
                      value={metric}
                    >
                      {metric}
                    </MenuItem>
                  ),
                )}
              </TextField>

              {condition.metricType ===
              'MANUAL_NUMBER' ? (
                <TextField
                  label="Custom Metric Name"
                  value={
                    condition
                      .customMetricName ||
                    ''
                  }
                  onChange={(e) =>
                    updateEligibilityCondition(
                      index,
                      'customMetricName',
                      e.target.value,
                    )
                  }
                  fullWidth
                />
              ) : null}

              <TextField
                select
                label="Operator"
                value={
                  condition.operator ||
                  'GREATER_THAN_OR_EQUAL'
                }
                onChange={(e) =>
                  updateEligibilityCondition(
                    index,
                    'operator',
                    e.target.value,
                  )
                }
                fullWidth
              >
                {CONDITION_OPERATORS.map(
                  (operator) => (
                    <MenuItem
                      key={operator}
                      value={operator}
                    >
                      {operator}
                    </MenuItem>
                  ),
                )}
              </TextField>

              <TextField
  label="Target Value"
  type="number"
  value={
    condition.targetValue ??
    0
  }
  onChange={(e) =>
    updateEligibilityCondition(
      index,
      'targetValue',
      Number(
        e.target.value ||
          0,
      ),
    )
  }
  disabled={
    condition.targetCalculationMode ===
    'TEAM_SIZE_MULTIPLIER'
  }
  helperText={
    condition.targetCalculationMode ===
    'TEAM_SIZE_MULTIPLIER'
      ? 'Calculated automatically from team size.'
      : ''
  }
  fullWidth
/>

              <TextField
  select
  label="Target Calculation Mode"
  value={
    condition.targetCalculationMode ||
    'FIXED'
  }
  onChange={(e) =>
    updateEligibilityCondition(
      index,
      'targetCalculationMode',
      e.target.value,
    )
  }
  fullWidth
>
  {TARGET_CALCULATION_MODES.map(
    (mode) => (
      <MenuItem
        key={mode}
        value={mode}
      >
        {mode}
      </MenuItem>
    ),
  )}
</TextField>

{condition.targetCalculationMode ===
'TEAM_SIZE_MULTIPLIER' ? (
  <TextField
    select
    label="Target Multiplier Metric"
    value={
      condition.targetMultiplierMetricType ||
      ''
    }
    onChange={(e) =>
      updateEligibilityCondition(
        index,
        'targetMultiplierMetricType',
        e.target.value,
      )
    }
    fullWidth
  >
    <MenuItem value="">
      Select Multiplier Metric
    </MenuItem>

    {METRIC_TYPES.map(
      (metric) => (
        <MenuItem
          key={metric}
          value={metric}
        >
          {metric}
        </MenuItem>
      ),
    )}
  </TextField>
) : null}

{condition.targetCalculationMode ===
'TEAM_SIZE_MULTIPLIER' ? (
  <TextField
    label="Target Per Team Member"
    type="number"
    value={
      condition.teamMemberTargetValue ??
      0
    }
    onChange={(e) =>
      updateEligibilityCondition(
        index,
        'teamMemberTargetValue',
        Number(
          e.target.value ||
            0,
        ),
      )
    }
    helperText="Final target = active team members × this value."
    fullWidth
  />
) : null}

              <TextField
                select
                label="Failure Action"
                value={
                  condition.failureAction ||
                  'ZERO_SALARY'
                }
                onChange={(e) =>
                  updateEligibilityCondition(
                    index,
                    'failureAction',
                    e.target.value,
                  )
                }
                fullWidth
              >
                {CONDITION_FAILURE_ACTIONS.map(
                  (action) => (
                    <MenuItem
                      key={action}
                      value={action}
                    >
                      {action}
                    </MenuItem>
                  ),
                )}
              </TextField>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      condition.isEnabled !==
                      false
                    }
                    onChange={(e) =>
                      updateEligibilityCondition(
                        index,
                        'isEnabled',
                        e.target
                          .checked,
                      )
                    }
                  />
                }
                label="Condition Enabled"
              />
            </div>
          </Paper>
        ),
      )
    )}
  </div>
</div>

        <div>
  <div className="mb-3 flex items-center justify-between gap-3">
    <div>
      <h3 className="font-bold">
        Incentive Components
      </h3>

      <p className="text-xs text-gray-500">
        Configure fixed, per-unit,
        percentage, slab and pool-share
        incentives.
      </p>
    </div>

    <Button
      variant="outlined"
      onClick={
        addIncentiveComponent
      }
    >
      Add Incentive
    </Button>
  </div>

  <div className="space-y-4">
    {getIncentiveComponents()
      .length === 0 ? (
      <div className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-500">
        No incentive component configured.
      </div>
    ) : (
      getIncentiveComponents().map(
        (
          component,
          componentIndex,
        ) => (
          <Paper
            key={
              component.id ||
              componentIndex
            }
            variant="outlined"
            className="rounded-xl p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold">
                Incentive{' '}
                {componentIndex + 1}
              </h4>

              <Button
                color="error"
                size="small"
                onClick={() =>
                  removeIncentiveComponent(
                    componentIndex,
                  )
                }
              >
                Remove
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <TextField
                label="Incentive Label"
                value={
                  component.label ||
                  ''
                }
                onChange={(e) =>
                  updateIncentiveComponent(
                    componentIndex,
                    'label',
                    e.target.value,
                  )
                }
                fullWidth
              />

              <TextField
                select
                label="Metric"
                value={
                  component.metricType ||
                  ''
                }
                onChange={(e) =>
                  updateIncentiveComponent(
                    componentIndex,
                    'metricType',
                    e.target.value,
                  )
                }
                fullWidth
              >
                <MenuItem value="">
                  Select Metric
                </MenuItem>

                {METRIC_TYPES.map(
                  (metric) => (
                    <MenuItem
                      key={metric}
                      value={metric}
                    >
                      {metric}
                    </MenuItem>
                  ),
                )}
              </TextField>

              {component.metricType ===
              'MANUAL_NUMBER' ? (
                <TextField
                  label="Custom Metric Name"
                  value={
                    component
                      .customMetricName ||
                    ''
                  }
                  onChange={(e) =>
                    updateIncentiveComponent(
                      componentIndex,
                      'customMetricName',
                      e.target.value,
                    )
                  }
                  fullWidth
                />
              ) : null}

              <TextField
                select
                label="Calculation Type"
                value={
                  component
                    .calculationType ||
                  'PER_UNIT'
                }
                onChange={(e) =>
                  updateIncentiveComponent(
                    componentIndex,
                    'calculationType',
                    e.target.value,
                  )
                }
                fullWidth
              >
                {INCENTIVE_CALCULATION_TYPES.map(
                  (type) => (
                    <MenuItem
                      key={type}
                      value={type}
                    >
                      {type}
                    </MenuItem>
                  ),
                )}
              </TextField>

              {[
                'FLAT',
                'PER_UNIT',
                'PER_UNIT_ABOVE_TARGET',
              ].includes(
                component.calculationType,
              ) ? (
                <TextField
                  label="Rate Amount"
                  type="number"
                  value={
                    component.rateAmount ??
                    0
                  }
                  onChange={(e) =>
                    updateIncentiveComponent(
                      componentIndex,
                      'rateAmount',
                      Number(
                        e.target.value ||
                          0,
                      ),
                    )
                  }
                  fullWidth
                />
              ) : null}

              {component.calculationType ===
              'PER_UNIT_ABOVE_TARGET' ? (
                <TextField
                  label="Baseline Target"
                  type="number"
                  value={
                    component.baselineTarget ??
                    0
                  }
                  onChange={(e) =>
                    updateIncentiveComponent(
                      componentIndex,
                      'baselineTarget',
                      Number(
                        e.target.value ||
                          0,
                      ),
                    )
                  }
                  fullWidth
                />
              ) : null}

              {component.calculationType ===
              'PERCENTAGE' ? (
                <TextField
                  label="Percentage Rate"
                  type="number"
                  value={
                    component.percentageRate ??
                    0
                  }
                  onChange={(e) =>
                    updateIncentiveComponent(
                      componentIndex,
                      'percentageRate',
                      Number(
                        e.target.value ||
                          0,
                      ),
                    )
                  }
                  fullWidth
                />
              ) : null}

              {component.calculationType ===
              'SLAB' ? (
                <>
                  <TextField
                    select
                    label="Slab Calculation Mode"
                    value={
                      component
                        .slabCalculationMode ||
                      'VALUE_BASED'
                    }
                    onChange={(e) =>
                      updateIncentiveComponent(
                        componentIndex,
                        'slabCalculationMode',
                        e.target.value,
                      )
                    }
                    fullWidth
                  >
                    {SLAB_CALCULATION_MODES.map(
                      (mode) => (
                        <MenuItem
                          key={mode}
                          value={mode}
                        >
                          {mode}
                        </MenuItem>
                      ),
                    )}
                  </TextField>

                  {component.slabCalculationMode ===
                  'SEQUENTIAL_PROJECT_MARGIN' ? (
                    <TextField
                      select
                      label="Slab Selector Metric"
                      value={
                        component
                          .slabSelectorMetricType ||
                        ''
                      }
                      onChange={(e) =>
                        updateIncentiveComponent(
                          componentIndex,
                          'slabSelectorMetricType',
                          e.target.value,
                        )
                      }
                      fullWidth
                    >
                      <MenuItem value="">
                        Select Metric
                      </MenuItem>

                      {METRIC_TYPES.map(
                        (metric) => (
                          <MenuItem
                            key={metric}
                            value={metric}
                          >
                            {metric}
                          </MenuItem>
                        ),
                      )}
                    </TextField>
                  ) : null}
                </>
              ) : null}

              {component.calculationType ===
              'POOL_SHARE' ? (
                <>
                  <TextField
                    select
                    label="Company Pool Metric"
                    value={
                      component
                        .poolCompanyMetricType ||
                      ''
                    }
                    onChange={(e) =>
                      updateIncentiveComponent(
                        componentIndex,
                        'poolCompanyMetricType',
                        e.target.value,
                      )
                    }
                    fullWidth
                  >
                    <MenuItem value="">
                      Select Metric
                    </MenuItem>

                    {METRIC_TYPES.map(
                      (metric) => (
                        <MenuItem
                          key={metric}
                          value={metric}
                        >
                          {metric}
                        </MenuItem>
                      ),
                    )}
                  </TextField>

                  <TextField
                    label="Pool Amount Per Company Unit"
                    type="number"
                    value={
                      component
                        .poolAmountPerCompanyUnit ??
                      0
                    }
                    onChange={(e) =>
                      updateIncentiveComponent(
                        componentIndex,
                        'poolAmountPerCompanyUnit',
                        Number(
                          e.target.value ||
                            0,
                        ),
                      )
                    }
                    fullWidth
                  />

                  <TextField
                    select
                    label="Pool Divisor Mode"
                    value={
                      component
                        .poolDivisorMode ||
                      'ALL_SUPPORTING_STAFF'
                    }
                    onChange={(e) =>
                      updateIncentiveComponent(
                        componentIndex,
                        'poolDivisorMode',
                        e.target.value,
                      )
                    }
                    fullWidth
                  >
                    {POOL_DIVISOR_MODES.map(
                      (mode) => (
                        <MenuItem
                          key={mode}
                          value={mode}
                        >
                          {mode}
                        </MenuItem>
                      ),
                    )}
                  </TextField>

                  {component.poolDivisorMode ===
                  'FIXED_DIVISOR' ? (
                    <TextField
                      label="Fixed Pool Divisor"
                      type="number"
                      value={
                        component
                          .fixedPoolDivisor ??
                        0
                      }
                      onChange={(e) =>
                        updateIncentiveComponent(
                          componentIndex,
                          'fixedPoolDivisor',
                          Number(
                            e.target.value ||
                              0,
                          ),
                        )
                      }
                      fullWidth
                    />
                  ) : null}

                  <TextField
                    label="Minimum Personal Metric"
                    type="number"
                    value={
                      component
                        .minimumPersonalMetricValue ??
                      0
                    }
                    onChange={(e) =>
                      updateIncentiveComponent(
                        componentIndex,
                        'minimumPersonalMetricValue',
                        Number(
                          e.target.value ||
                            0,
                        ),
                      )
                    }
                    fullWidth
                  />
                </>
              ) : null}

              <TextField
                label="Maximum Amount"
                type="number"
                value={
                  component.maximumAmount ===
                    null ||
                  component.maximumAmount ===
                    undefined
                    ? ''
                    : component.maximumAmount
                }
                onChange={(e) =>
                  updateIncentiveComponent(
                    componentIndex,
                    'maximumAmount',
                    e.target.value === ''
                      ? null
                      : Number(
                          e.target.value,
                        ),
                  )
                }
                fullWidth
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      component
                        .independentFromSalaryEligibility !==
                      false
                    }
                    onChange={(e) =>
                      updateIncentiveComponent(
                        componentIndex,
                        'independentFromSalaryEligibility',
                        e.target.checked,
                      )
                    }
                  />
                }
                label="Independent from salary eligibility"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      component.isEnabled !==
                      false
                    }
                    onChange={(e) =>
                      updateIncentiveComponent(
                        componentIndex,
                        'isEnabled',
                        e.target.checked,
                      )
                    }
                  />
                }
                label="Incentive Enabled"
              />
            </div>

            {component.calculationType ===
            'SLAB' ? (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h5 className="font-semibold">
                    Slabs
                  </h5>

                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      addIncentiveSlab(
                        componentIndex,
                      )
                    }
                  >
                    Add Slab
                  </Button>
                </div>

                <div className="space-y-3">
                  {Array.isArray(
                    component.slabRules,
                  ) &&
                  component.slabRules
                    .length > 0 ? (
                    component.slabRules.map(
                      (
                        slab,
                        slabIndex,
                      ) => (
                        <Paper
                          key={
                            slabIndex
                          }
                          variant="outlined"
                          className="rounded-xl p-3"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span className="font-medium">
                              Slab{' '}
                              {slabIndex +
                                1}
                            </span>

                            <Button
                              color="error"
                              size="small"
                              onClick={() =>
                                removeIncentiveSlab(
                                  componentIndex,
                                  slabIndex,
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="grid gap-3 md:grid-cols-3">
                            <TextField
                              label="Minimum Value"
                              type="number"
                              value={
                                slab.minimumValue ??
                                0
                              }
                              onChange={(e) =>
                                updateIncentiveSlab(
                                  componentIndex,
                                  slabIndex,
                                  'minimumValue',
                                  Number(
                                    e.target.value ||
                                      0,
                                  ),
                                )
                              }
                              fullWidth
                            />

                            <TextField
                              label="Maximum Value"
                              type="number"
                              value={
                                slab.maximumValue ===
                                  null ||
                                slab.maximumValue ===
                                  undefined
                                  ? ''
                                  : slab.maximumValue
                              }
                              onChange={(e) =>
                                updateIncentiveSlab(
                                  componentIndex,
                                  slabIndex,
                                  'maximumValue',
                                  e.target.value ===
                                  ''
                                    ? null
                                    : Number(
                                        e.target.value,
                                      ),
                                )
                              }
                              fullWidth
                            />

                            <TextField
                              label="Rate Amount"
                              type="number"
                              value={
                                slab.rateAmount ??
                                0
                              }
                              onChange={(e) =>
                                updateIncentiveSlab(
                                  componentIndex,
                                  slabIndex,
                                  'rateAmount',
                                  Number(
                                    e.target.value ||
                                      0,
                                  ),
                                )
                              }
                              fullWidth
                            />

                            <TextField
                              label="Percentage Rate"
                              type="number"
                              value={
                                slab.percentageRate ??
                                0
                              }
                              onChange={(e) =>
                                updateIncentiveSlab(
                                  componentIndex,
                                  slabIndex,
                                  'percentageRate',
                                  Number(
                                    e.target.value ||
                                      0,
                                  ),
                                )
                              }
                              fullWidth
                            />

                            <TextField
                              label="Flat Amount"
                              type="number"
                              value={
                                slab.flatAmount ??
                                0
                              }
                              onChange={(e) =>
                                updateIncentiveSlab(
                                  componentIndex,
                                  slabIndex,
                                  'flatAmount',
                                  Number(
                                    e.target.value ||
                                      0,
                                  ),
                                )
                              }
                              fullWidth
                            />

                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={
                                    slab.applyRateToAllUnits ===
                                    true
                                  }
                                  onChange={(e) =>
                                    updateIncentiveSlab(
                                      componentIndex,
                                      slabIndex,
                                      'applyRateToAllUnits',
                                      e.target
                                        .checked,
                                    )
                                  }
                                />
                              }
                              label="Apply rate to all units"
                            />
                          </div>
                        </Paper>
                      ),
                    )
                  ) : (
                    <div className="rounded-xl border border-dashed p-4 text-center text-sm text-gray-500">
                      No slab configured.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </Paper>
        ),
      )
    )}
  </div>
</div>

        <div>
          <h3 className="mb-3 font-bold">
            Additional Settings JSON
          </h3>

          <TextField
            value={
              ruleForm.additionalSettingsJson
            }
            onChange={(e) =>
              setRuleForm({
                ...ruleForm,
                additionalSettingsJson:
                  e.target.value,
              })
            }
            multiline
            minRows={6}
            fullWidth
            slotProps={{
  htmlInput: {
    style: {
      fontFamily:
        'monospace',
    },
  },
}}
          />
        </div>

        <div className="space-y-1">
          <FormControlLabel
            control={
              <Checkbox
                checked={
                  ruleForm.requireAllEligibilityConditions
                }
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    requireAllEligibilityConditions:
                      e.target.checked,
                  })
                }
              />
            }
            label="Require all eligibility conditions"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={
                  ruleForm.allowProportionalSalaryOnEligibilityFailure
                }
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    allowProportionalSalaryOnEligibilityFailure:
                      e.target.checked,
                  })
                }
              />
            }
            label="Allow proportional salary when eligibility fails"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={
                  ruleForm.isActive
                }
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    isActive:
                      e.target.checked,
                  })
                }
              />
            }
            label="Active"
          />
        </div>
      </div>
    )}
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() =>
        setFormOpen(false)
      }
      disabled={formLoading}
    >
      Cancel
    </Button>

    <Button
  variant="contained"
  disabled={formLoading}
  onClick={saveRule}
>
  {formLoading
    ? 'Saving...'
    : editingRuleId
      ? 'Update Rule'
      : 'Create Rule'}
</Button>
  </DialogActions>
</Dialog>

    </Box>
  );
}