'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const USER_ROLE_OPTIONS = [
  'OWNER',

  'TELECALLING_MANAGER',
  'TELECALLING_ASSISTANT',
  'TELECALLER',

  'LEAD_MANAGER',
  'LEAD_EXECUTIVE',

  'MARKETING_HEAD',

  'MEETING_MANAGER',
  'MEETING_ASSISTANT',

  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',

  'LOAN_MANAGER',
  'SUBSIDY_MANAGER',
  'ELECTRICITY_MANAGER',

  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',

  'ACCOUNT_MANAGER',

    'STOCK_MANAGER',
  'MAINTENANCE_MANAGER',
  'INSPECTION_MANAGER',
  'CUSTOMER_MANAGER',
  'HR_MANAGER',
'TRADING_MANAGER',
'TRADING_HEAD',

'OFFICE_ASSISTANT',

'PROJECT_CONTRACTOR',

  'CUSTOMER',
  'SOLAR_FRANCHISE'
];

const PENALTY_TYPES = [
  'LATE_COMING',
  'EARLY_LEAVING',
  'ABSENT',
  'NO_PUNCH',
  'DEADLINE_MISSED',
  'MISCONDUCT',
  'DAMAGE_LOSS',
  'CUSTOM',
];

const CALCULATION_TYPES = [
  'FIXED',
  'PERCENTAGE',
  'WARNING_ONLY',
  'MANUAL',
];

const emptyForm = {
  ruleName: '',
  description: '',
  applicableRoles: [] as string[],
  department: '',
  branchName: '',
  penaltyType: 'CUSTOM',
  calculationType: 'MANUAL',
  amount: '',
  percentageRate: '',
  requiresApproval: true,
  includeInPayroll: true,
  isActive: true,
};

const emptyPenaltyCaseForm = {
  staffId: '',
  penaltyRuleId: '',
  incidentDate:
    new Date().toISOString().split('T')[0],
  payrollMonth:
    new Date().toISOString().slice(0, 7),
  reason: '',
  proposedAmount: '',
  calculationBaseAmount: '',
  evidenceRemarks: '',
  includeInPayroll: true,
};

const PENALTY_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'APPLIED_TO_PAYROLL',
];

export default function PenaltiesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [staff, setStaff] =
  useState<any[]>([]);

const [allActiveRules, setAllActiveRules] =
  useState<any[]>([]);

const [penalties, setPenalties] =
  useState<any[]>([]);

const [penaltyForm, setPenaltyForm] =
  useState<any>(
    emptyPenaltyCaseForm,
  );

const [staffSearch, setStaffSearch] =
  useState('');

const [selectedStaffName, setSelectedStaffName] =
  useState('');

const [showStaffOptions, setShowStaffOptions] =
  useState(false);

const [penaltyStatusFilter, setPenaltyStatusFilter] =
  useState('');

const [penaltyMonthFilter, setPenaltyMonthFilter] =
  useState(
    new Date()
      .toISOString()
      .slice(0, 7),
  );

const [penaltySearch, setPenaltySearch] =
  useState('');

const [
  showHiddenPenalties,
  setShowHiddenPenalties,
] = useState(false);

const [penaltyPage, setPenaltyPage] =
  useState(1);

const [
  penaltyTotalPages,
  setPenaltyTotalPages,
] = useState(1);

const [
  loadingPenaltyAction,
  setLoadingPenaltyAction,
] = useState(false);

  const [search, setSearch] = useState('');
  const [penaltyType, setPenaltyType] = useState('');
  const [calculationType, setCalculationType] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRules = async () => {
    const res = await axios.get(`${API_BASE_URL}/staff/penalty-rules`, {
      params: {
        page,
        limit: 20,
        search,
        penaltyType,
        calculationType,
        showHidden,
      },
      headers: headers(),
    });

    setRules(res.data?.data || []);
    setTotalPages(res.data?.totalPages || 1);
  };

  const fetchStaff = async () => {
  const res = await axios.get(
    `${API_BASE_URL}/staff`,
    {
      params: {
        page: 1,
        limit: 100,
        showHidden: false,
      },
      headers: headers(),
    },
  );

  setStaff(
    res.data?.data || [],
  );
};

const fetchActivePenaltyRules =
  async () => {
    const res = await axios.get(
      `${API_BASE_URL}/staff/penalty-rules`,
      {
        params: {
          page: 1,
          limit: 100,
          showHidden: false,
        },
        headers: headers(),
      },
    );

    setAllActiveRules(
      (res.data?.data || []).filter(
        (rule: any) =>
          rule.isActive !== false &&
          !rule.isHidden,
      ),
    );
  };

const fetchPenalties = async () => {
  const res = await axios.get(
    `${API_BASE_URL}/staff/penalties`,
    {
      params: {
        page: penaltyPage,
        limit: 20,

        status:
          penaltyStatusFilter ||
          undefined,

        payrollMonth:
          penaltyMonthFilter ||
          undefined,

        search:
          penaltySearch.trim() ||
          undefined,

        showHidden:
          showHiddenPenalties,
      },
      headers: headers(),
    },
  );

  setPenalties(
    res.data?.data || [],
  );

  setPenaltyTotalPages(
    res.data?.totalPages || 1,
  );
};

  useEffect(() => {
  fetchRules();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  page,
  penaltyType,
  calculationType,
  showHidden,
]);

useEffect(() => {
  fetchStaff();
  fetchActivePenaltyRules();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
  fetchPenalties();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  penaltyPage,
  penaltyStatusFilter,
  penaltyMonthFilter,
  showHiddenPenalties,
]);

  const toggleRole = (role: string) => {
    const exists = form.applicableRoles.includes(role);

    setForm({
      ...form,
      applicableRoles: exists
        ? form.applicableRoles.filter((item: string) => item !== role)
        : [...form.applicableRoles, role],
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveRule = async () => {
    if (!form.ruleName.trim()) {
      alert('Penalty rule name is required');
      return;
    }

    const payload = {
      ...form,
      amount: Number(form.amount || 0),
      percentageRate: Number(form.percentageRate || 0),
    };

    if (editingId) {
      await axios.patch(
        `${API_BASE_URL}/staff/penalty-rule/${editingId}`,
        payload,
        { headers: headers() },
      );
      alert('Penalty rule updated');
    } else {
      await axios.post(`${API_BASE_URL}/staff/penalty-rule`, payload, {
        headers: headers(),
      });
      alert('Penalty rule created');
    }

    resetForm();
    fetchRules();
  };

  const startEdit = (rule: any) => {
    setEditingId(rule.id);
    setForm({
      ruleName: rule.ruleName || '',
      description: rule.description || '',
      applicableRoles: Array.isArray(rule.applicableRoles)
        ? rule.applicableRoles
        : [],
      department: rule.department || '',
      branchName: rule.branchName || '',
      penaltyType: rule.penaltyType || 'CUSTOM',
      calculationType: rule.calculationType || 'MANUAL',
      amount: String(rule.amount || ''),
      percentageRate: String(rule.percentageRate || ''),
      requiresApproval: rule.requiresApproval !== false,
      includeInPayroll: rule.includeInPayroll !== false,
      isActive: rule.isActive !== false,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hideRestore = async (rule: any, restore = false) => {
    const reason = window.prompt(
      restore ? 'Reason for restoring rule?' : 'Reason for hiding rule?',
      restore ? 'Valid rule' : 'Old / wrong penalty rule',
    );

    if (reason === null) return;

    await axios.patch(
      `${API_BASE_URL}/staff/penalty-rule/${rule.id}/${
        restore ? 'restore' : 'hide'
      }`,
      { reason },
      { headers: headers() },
    );

    fetchRules();
  };

  const filteredStaff =
  staff.filter((item) => {
    const text = `
      ${item.fullName || ''}
      ${item.employeeCode || ''}
      ${item.staffRole || ''}
      ${item.designation || ''}
      ${item.department || ''}
      ${item.branchName || ''}
    `.toLowerCase();

    return text.includes(
      staffSearch.toLowerCase(),
    );
  });

const selectedStaff =
  staff.find(
    (item) =>
      Number(item.id) ===
      Number(
        penaltyForm.staffId,
      ),
  );

const applicablePenaltyRules =
  allActiveRules.filter(
    (rule) => {
      if (!selectedStaff) {
        return true;
      }

      const roles =
        Array.isArray(
          rule.applicableRoles,
        )
          ? rule.applicableRoles.map(
              (role: string) =>
                String(role)
                  .trim()
                  .toUpperCase(),
            )
          : [];

      const staffRole =
        String(
          selectedStaff.staffRole ||
            selectedStaff.designation ||
            '',
        )
          .trim()
          .toUpperCase()
          .replaceAll(' ', '_');

      if (
        roles.length > 0 &&
        !roles.includes(
          staffRole,
        )
      ) {
        return false;
      }

      if (
        String(
          rule.department || '',
        ).trim() &&
        String(
          rule.department,
        )
          .trim()
          .toLowerCase() !==
          String(
            selectedStaff.department ||
              '',
          )
            .trim()
            .toLowerCase()
      ) {
        return false;
      }

      if (
        String(
          rule.branchName || '',
        ).trim() &&
        String(
          rule.branchName,
        )
          .trim()
          .toLowerCase() !==
          String(
            selectedStaff.branchName ||
              '',
          )
            .trim()
            .toLowerCase()
      ) {
        return false;
      }

      return true;
    },
  );

const selectedPenaltyRule =
  allActiveRules.find(
    (rule) =>
      Number(rule.id) ===
      Number(
        penaltyForm.penaltyRuleId,
      ),
  );

const resetPenaltyCaseForm =
  () => {
    setPenaltyForm({
      ...emptyPenaltyCaseForm,
      incidentDate:
        new Date()
          .toISOString()
          .split('T')[0],
      payrollMonth:
        new Date()
          .toISOString()
          .slice(0, 7),
    });

    setStaffSearch('');
    setSelectedStaffName('');
    setShowStaffOptions(false);
  };

const createPenaltyCase =
  async () => {
    if (!penaltyForm.staffId) {
      alert(
        'Please select staff member',
      );
      return;
    }

    if (
      !penaltyForm.penaltyRuleId
    ) {
      alert(
        'Please select penalty rule',
      );
      return;
    }

    if (
      !penaltyForm.incidentDate ||
      !penaltyForm.payrollMonth
    ) {
      alert(
        'Incident date and payroll month are required',
      );
      return;
    }

    if (
      !String(
        penaltyForm.reason || '',
      ).trim()
    ) {
      alert(
        'Penalty reason is required',
      );
      return;
    }

    if (
      selectedPenaltyRule
        ?.calculationType ===
        'MANUAL' &&
      (
        penaltyForm.proposedAmount ===
          '' ||
        Number(
          penaltyForm.proposedAmount,
        ) < 0
      )
    ) {
      alert(
        'Please enter manual penalty amount',
      );
      return;
    }

    try {
      setLoadingPenaltyAction(
        true,
      );

      await axios.post(
        `${API_BASE_URL}/staff/penalty`,
        {
          staffId:
            Number(
              penaltyForm.staffId,
            ),

          penaltyRuleId:
            Number(
              penaltyForm.penaltyRuleId,
            ),

          incidentDate:
            penaltyForm.incidentDate,

          payrollMonth:
            penaltyForm.payrollMonth,

          reason:
            String(
              penaltyForm.reason,
            ).trim(),

          proposedAmount:
            penaltyForm.proposedAmount ===
            ''
              ? undefined
              : Number(
                  penaltyForm.proposedAmount,
                ),

          calculationBaseAmount:
            penaltyForm
              .calculationBaseAmount ===
            ''
              ? undefined
              : Number(
                  penaltyForm
                    .calculationBaseAmount,
                ),

          evidenceRemarks:
            String(
              penaltyForm
                .evidenceRemarks ||
                '',
            ).trim(),

            includeInPayroll:
  penaltyForm.includeInPayroll ===
  true,
        },
        {
          headers: headers(),
        },
      );

      alert(
        selectedPenaltyRule
          ?.requiresApproval ===
        false
          ? 'Penalty created and automatically approved'
          : 'Penalty created and sent for approval',
      );

      resetPenaltyCaseForm();

      await Promise.all([
        fetchPenalties(),
        fetchActivePenaltyRules(),
      ]);
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to create staff penalty',
      );
    } finally {
      setLoadingPenaltyAction(
        false,
      );
    }
  };

const reviewPenaltyCase =
  async (
    penalty: any,
    status:
      | 'APPROVED'
      | 'REJECTED',
  ) => {
    const remarks =
      window.prompt(
        status === 'APPROVED'
          ? 'Approval remarks optional'
          : 'Reason for rejection',
        status === 'APPROVED'
          ? 'Approved'
          : '',
      );

    if (remarks === null) {
      return;
    }

    let approvedAmount:
      | number
      | undefined;

    if (status === 'APPROVED') {
      const input =
        window.prompt(
          'Approved penalty amount',
          String(
            penalty.proposedAmount ??
              0,
          ),
        );

      if (input === null) {
        return;
      }

      approvedAmount =
        Number(input);

      if (
        !Number.isFinite(
          approvedAmount,
        ) ||
        approvedAmount < 0
      ) {
        alert(
          'Enter a valid approved amount',
        );
        return;
      }
    }

    try {
      setLoadingPenaltyAction(
        true,
      );

      await axios.patch(
        `${API_BASE_URL}/staff/penalty/${penalty.id}/review`,
        {
          status,
          reviewRemarks:
            remarks,
          approvedAmount,
        },
        {
          headers: headers(),
        },
      );

      alert(
        status === 'APPROVED'
          ? 'Penalty approved'
          : 'Penalty rejected',
      );

      await fetchPenalties();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to review penalty',
      );
    } finally {
      setLoadingPenaltyAction(
        false,
      );
    }
  };

const hideRestorePenaltyCase =
  async (
    penalty: any,
    restore = false,
  ) => {
    const reason =
      window.prompt(
        restore
          ? 'Reason for restoring penalty?'
          : 'Reason for hiding penalty?',
        restore
          ? 'Valid penalty'
          : 'Wrong / duplicate penalty',
      );

    if (reason === null) {
      return;
    }

    try {
      await axios.patch(
        `${API_BASE_URL}/staff/penalty/${penalty.id}/${
          restore
            ? 'restore'
            : 'hide'
        }`,
        {
          reason,
        },
        {
          headers: headers(),
        },
      );

      await fetchPenalties();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to update penalty',
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Penalty Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and manage penalty rules for staff roles, departments and branches.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Loaded Rules</p>
          <p className="mt-2 text-2xl font-bold">{rules.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {rules.filter((r) => r.isActive).length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Payroll Linked</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {rules.filter((r) => r.includeInPayroll).length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Hidden View</p>
          <p className="mt-2 text-2xl font-bold text-orange-700">
            {showHidden ? 'On' : 'Off'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-blue-100 bg-white p-5 shadow">
  <div>
    <h2 className="text-xl font-bold text-gray-800">
      Raise Staff Penalty
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Record an actual employee violation
      using one of the configured penalty
      rules. Only rules applicable to the
      selected employee are shown.
    </p>
  </div>

  <div className="mt-5 grid gap-3 md:grid-cols-3">
    <div className="relative md:col-span-2">
      <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
        Staff Member
      </label>

      <input
        placeholder="Search staff by name / code / role / department / branch"
        value={
          staffSearch ||
          selectedStaffName
        }
        onChange={(e) => {
          setStaffSearch(
            e.target.value,
          );

          setSelectedStaffName(
            '',
          );

          setPenaltyForm({
            ...penaltyForm,
            staffId: '',
            penaltyRuleId: '',
          });

          setShowStaffOptions(
            true,
          );
        }}
        onFocus={() =>
          setShowStaffOptions(
            true,
          )
        }
        className="w-full rounded-xl border p-3"
      />

      {showStaffOptions && (
        <div className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow">
          {filteredStaff.length ===
          0 ? (
            <div className="p-3 text-sm text-gray-500">
              No matching staff found
            </div>
          ) : (
            filteredStaff.map(
              (item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPenaltyForm({
                      ...penaltyForm,
                      staffId:
                        String(
                          item.id,
                        ),
                      penaltyRuleId:
                        '',
                    });

                    setSelectedStaffName(
                      `${
                        item.fullName ||
                        'Staff'
                      } ${
                        item.employeeCode
                          ? `(${item.employeeCode})`
                          : ''
                      }`,
                    );

                    setStaffSearch(
                      '',
                    );

                    setShowStaffOptions(
                      false,
                    );
                  }}
                  className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
                >
                  <p className="font-semibold text-gray-900">
                    {item.fullName ||
                      'Unnamed'}
                  </p>

                  <p className="text-xs text-gray-500">
                    {item.employeeCode ||
                      '-'}{' '}
                    |{' '}
                    {item.staffRole ||
                      item.designation ||
                      '-'}{' '}
                    |{' '}
                    {item.department ||
                      '-'}{' '}
                    |{' '}
                    {item.branchName ||
                      '-'}
                  </p>
                </button>
              ),
            )
          )}
        </div>
      )}
    </div>

    <div>
      <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
        Applicable Penalty Rule
      </label>

      <select
        value={
          penaltyForm.penaltyRuleId
        }
        disabled={
          !penaltyForm.staffId
        }
        onChange={(e) => {
  const selectedRule =
    allActiveRules.find(
      (rule) =>
        Number(rule.id) ===
        Number(e.target.value),
    );

  setPenaltyForm({
    ...penaltyForm,

    penaltyRuleId:
      e.target.value,

    proposedAmount: '',

    calculationBaseAmount:
      '',

    includeInPayroll:
      selectedRule
        ? selectedRule.includeInPayroll !==
          false
        : true,
  });
}}
        className="w-full rounded-xl border p-3 disabled:bg-gray-100"
      >
        <option value="">
          Select Penalty Rule
        </option>

        {applicablePenaltyRules.map(
          (rule) => (
            <option
              key={rule.id}
              value={rule.id}
            >
              {rule.ruleName} —{' '}
              {String(
                rule.calculationType ||
                  '',
              ).replaceAll(
                '_',
                ' ',
              )}
            </option>
          ),
        )}
      </select>
    </div>

    <div>
      <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
        Incident Date
      </label>

      <input
        type="date"
        value={
          penaltyForm.incidentDate
        }
        onChange={(e) =>
          setPenaltyForm({
            ...penaltyForm,
            incidentDate:
              e.target.value,
          })
        }
        className="w-full rounded-xl border p-3"
      />
    </div>

    <div>
      <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
        Payroll Month
      </label>

      <input
        type="month"
        value={
          penaltyForm.payrollMonth
        }
        onChange={(e) =>
          setPenaltyForm({
            ...penaltyForm,
            payrollMonth:
              e.target.value,
          })
        }
        className="w-full rounded-xl border p-3"
      />
    </div>

    {selectedPenaltyRule
      ?.calculationType ===
      'MANUAL' && (
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
          Proposed Penalty Amount
        </label>

        <input
          type="number"
          min="0"
          value={
            penaltyForm.proposedAmount
          }
          onChange={(e) =>
            setPenaltyForm({
              ...penaltyForm,
              proposedAmount:
                e.target.value,
            })
          }
          placeholder="₹ Amount"
          className="w-full rounded-xl border p-3"
        />
      </div>
    )}

    {selectedPenaltyRule
      ?.calculationType ===
      'PERCENTAGE' && (
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
          Calculation Base
          (optional)
        </label>

        <input
          type="number"
          min="0"
          value={
            penaltyForm.calculationBaseAmount
          }
          onChange={(e) =>
            setPenaltyForm({
              ...penaltyForm,
              calculationBaseAmount:
                e.target.value,
            })
          }
          placeholder="Leave blank for basic salary"
          className="w-full rounded-xl border p-3"
        />
      </div>
    )}
  </div>

  {selectedPenaltyRule && (
    <div className="mt-4 rounded-xl bg-blue-50 p-4">
      <p className="font-semibold text-blue-900">
        {selectedPenaltyRule.ruleName}
      </p>

      <p className="mt-1 text-sm text-blue-800">
        Type:{' '}
        {String(
          selectedPenaltyRule.penaltyType ||
            '',
        ).replaceAll('_', ' ')}
        {' | '}
        Calculation:{' '}
        {String(
          selectedPenaltyRule.calculationType ||
            '',
        ).replaceAll('_', ' ')}
      </p>

      <p className="mt-1 text-sm text-blue-800">
        Fixed Amount: ₹
        {Number(
          selectedPenaltyRule.amount ||
            0,
        ).toLocaleString('en-IN')}
        {' | '}
        Percentage:{' '}
        {Number(
          selectedPenaltyRule.percentageRate ||
            0,
        )}
        %
      </p>

      <p className="mt-1 text-sm text-blue-800">
        Approval:{' '}
        {selectedPenaltyRule.requiresApproval !==
        false
          ? 'Required'
          : 'Not Required'}
        {' | '}
        Payroll:{' '}
        {selectedPenaltyRule.includeInPayroll !==
        false
          ? 'Included'
          : 'Not Included'}
      </p>

      {selectedPenaltyRule.description && (
        <p className="mt-2 text-sm text-blue-900">
          {
            selectedPenaltyRule.description
          }
        </p>
      )}
    </div>
  )}

  <label className="mt-4 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
  <input
    type="checkbox"
    checked={
      penaltyForm.includeInPayroll
    }
    onChange={(e) =>
      setPenaltyForm({
        ...penaltyForm,
        includeInPayroll:
          e.target.checked,
      })
    }
    className="mt-1"
  />

  <div>
    <p className="font-semibold text-gray-900">
      Include this penalty in payroll
    </p>

    <p className="mt-1 text-sm text-gray-600">
      If enabled, the approved penalty amount
      will be deducted from the employee&apos;s
      selected payroll month. If disabled, the
      penalty will remain in the employee&apos;s
      disciplinary history but will not reduce
      salary.
    </p>
  </div>
</label>

  <textarea
    placeholder="Reason / violation details *"
    value={
      penaltyForm.reason
    }
    onChange={(e) =>
      setPenaltyForm({
        ...penaltyForm,
        reason:
          e.target.value,
      })
    }
    className="mt-4 w-full rounded-xl border p-3"
    rows={3}
  />

  <textarea
    placeholder="Evidence / supporting remarks"
    value={
      penaltyForm.evidenceRemarks
    }
    onChange={(e) =>
      setPenaltyForm({
        ...penaltyForm,
        evidenceRemarks:
          e.target.value,
      })
    }
    className="mt-3 w-full rounded-xl border p-3"
    rows={2}
  />

  <div className="mt-4 flex flex-wrap gap-2">
    <button
      type="button"
      disabled={
        loadingPenaltyAction
      }
      onClick={
        createPenaltyCase
      }
      className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
    >
      {loadingPenaltyAction
        ? 'Saving...'
        : 'Raise Penalty'}
    </button>

    <button
      type="button"
      onClick={
        resetPenaltyCaseForm
      }
      disabled={
        loadingPenaltyAction
      }
      className="rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
    >
      Clear
    </button>
  </div>
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          {editingId ? 'Edit Penalty Rule' : 'Create Penalty Rule'}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            placeholder="Penalty Rule Name"
            value={form.ruleName}
            onChange={(e) => setForm({ ...form, ruleName: e.target.value })}
            className="rounded-xl border p-3 md:col-span-2"
          />

          <select
            value={form.penaltyType}
            onChange={(e) =>
              setForm({ ...form, penaltyType: e.target.value })
            }
            className="rounded-xl border p-3"
          >
            {PENALTY_TYPES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={form.calculationType}
            onChange={(e) =>
              setForm({ ...form, calculationType: e.target.value })
            }
            className="rounded-xl border p-3"
          >
            {CALCULATION_TYPES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <input
            placeholder="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Branch"
            value={form.branchName}
            onChange={(e) => setForm({ ...form, branchName: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Fixed Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Percentage Rate"
            value={form.percentageRate}
            onChange={(e) =>
              setForm({ ...form, percentageRate: e.target.value })
            }
            className="rounded-xl border p-3"
          />
        </div>

        <div className="mt-4 rounded-xl border p-4">
          <p className="font-semibold text-gray-800">Applicable Roles</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {USER_ROLE_OPTIONS.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                  form.applicableRoles.includes(role)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                {role.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <textarea
          placeholder="Description / rule explanation"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mt-3 w-full rounded-xl border p-3"
        />

        <div className="mt-3 flex flex-wrap gap-3">
          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.requiresApproval}
              onChange={(e) =>
                setForm({ ...form, requiresApproval: e.target.checked })
              }
            />{' '}
            Requires Approval
          </label>

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.includeInPayroll}
              onChange={(e) =>
                setForm({ ...form, includeInPayroll: e.target.checked })
              }
            />{' '}
            Include in Payroll
          </label>

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />{' '}
            Active
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={saveRule}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            {editingId ? 'Update Rule' : 'Create Rule'}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            placeholder="Search rule"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={penaltyType}
            onChange={(e) => {
              setPenaltyType(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value="">All Penalty Types</option>
            {PENALTY_TYPES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={calculationType}
            onChange={(e) => {
              setCalculationType(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value="">All Calculation Types</option>
            {CALCULATION_TYPES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => {
                setShowHidden(e.target.checked);
                setPage(1);
              }}
            />{' '}
            View Hidden
          </label>

          <button
            onClick={() => {
              setPage(1);
              fetchRules();
            }}
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply / Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Penalty Rule Register
        </h2>

        <div className="mt-4 space-y-3">
          {rules.length === 0 ? (
            <p className="text-sm text-gray-500">No penalty rules found.</p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className={`rounded-xl border p-4 ${
                  rule.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {rule.ruleName}
                    </p>

                    <p className="text-sm text-gray-500">
                      {rule.penaltyType} | {rule.calculationType} |{' '}
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </p>

                    <p className="mt-2 text-sm">
                      Amount: ₹{Number(rule.amount || 0).toLocaleString('en-IN')} | %:{' '}
                      {rule.percentageRate || 0}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Roles:{' '}
                      {Array.isArray(rule.applicableRoles) &&
                      rule.applicableRoles.length
                        ? rule.applicableRoles.join(', ')
                        : 'Any / Not specified'}
                    </p>

                    {rule.description && (
                      <p className="mt-2 text-sm text-gray-700">
                        {rule.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!rule.isHidden && (
                      <button
                        onClick={() => startEdit(rule)}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Edit
                      </button>
                    )}

                    <button
                      onClick={() => hideRestore(rule, !!rule.isHidden)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${
                        rule.isHidden ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {rule.isHidden ? 'Restore' : 'Hide'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Previous
          </button>

          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-red-100 bg-white p-5 shadow">
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Staff Penalty Register
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Actual penalties raised against
        employees, including approval and
        payroll status.
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
        setPenaltyPage(1);
        fetchPenalties();
      }}
      className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
    >
      Refresh
    </button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-4">
    <input
      placeholder="Search staff / rule / reason"
      value={
        penaltySearch
      }
      onChange={(e) =>
        setPenaltySearch(
          e.target.value,
        )
      }
      onKeyDown={(e) => {
        if (
          e.key === 'Enter'
        ) {
          setPenaltyPage(1);
          fetchPenalties();
        }
      }}
      className="rounded-xl border p-3"
    />

    <input
      type="month"
      value={
        penaltyMonthFilter
      }
      onChange={(e) => {
        setPenaltyMonthFilter(
          e.target.value,
        );
        setPenaltyPage(1);
      }}
      className="rounded-xl border p-3"
    />

    <select
      value={
        penaltyStatusFilter
      }
      onChange={(e) => {
        setPenaltyStatusFilter(
          e.target.value,
        );
        setPenaltyPage(1);
      }}
      className="rounded-xl border p-3"
    >
      <option value="">
        All Statuses
      </option>

      {PENALTY_STATUSES.map(
        (status) => (
          <option
            key={status}
            value={status}
          >
            {status.replaceAll(
              '_',
              ' ',
            )}
          </option>
        ),
      )}
    </select>

    <label className="rounded-xl border p-3 text-sm">
      <input
        type="checkbox"
        checked={
          showHiddenPenalties
        }
        onChange={(e) => {
          setShowHiddenPenalties(
            e.target.checked,
          );

          setPenaltyPage(1);
        }}
      />{' '}
      View Hidden
    </label>
  </div>

  <div className="mt-3 flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => {
        setPenaltyPage(1);
        fetchPenalties();
      }}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      Apply Filters
    </button>

    <button
      type="button"
      onClick={() => {
        setPenaltySearch('');
        setPenaltyStatusFilter('');
        setPenaltyMonthFilter('');
        setShowHiddenPenalties(
          false,
        );
        setPenaltyPage(1);
      }}
      className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700"
    >
      Clear Filters
    </button>
  </div>

  <div className="mt-5 space-y-4">
    {penalties.length === 0 ? (
      <p className="text-sm text-gray-500">
        No staff penalty cases found.
      </p>
    ) : (
      penalties.map(
        (penalty) => {
          const statusClass =
            penalty.status ===
            'APPROVED'
              ? 'bg-green-100 text-green-800'
              : penalty.status ===
                  'REJECTED'
                ? 'bg-red-100 text-red-800'
                : penalty.status ===
                    'APPLIED_TO_PAYROLL'
                  ? 'bg-blue-100 text-blue-800'
                  : penalty.status ===
                      'CANCELLED'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-amber-100 text-amber-800';

          return (
            <div
              key={penalty.id}
              className={`rounded-xl border p-4 ${
                penalty.isHidden
                  ? 'bg-gray-100 opacity-70'
                  : 'bg-white'
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-gray-900">
                      {penalty.staffName ||
                        `Staff #${penalty.staffId}`}
                    </p>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                    >
                      {String(
                        penalty.status ||
                          '',
                      ).replaceAll(
                        '_',
                        ' ',
                      )}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {penalty.employeeCode ||
                      '-'}{' '}
                    |{' '}
                    {penalty.staffRole ||
                      '-'}{' '}
                    |{' '}
                    {penalty.department ||
                      '-'}
                  </p>

                  <div className="mt-3 rounded-xl bg-gray-50 p-3">
                    <p className="font-semibold text-gray-900">
                      {
                        penalty.penaltyRuleName
                      }
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      {String(
                        penalty.penaltyType ||
                          '',
                      ).replaceAll(
                        '_',
                        ' ',
                      )}
                      {' | '}
                      {String(
                        penalty.calculationType ||
                          '',
                      ).replaceAll(
                        '_',
                        ' ',
                      )}
                    </p>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Incident Date
                      </p>

                      <p className="font-semibold">
                        {penalty.incidentDate ||
                          '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Payroll Month
                      </p>

                      <p className="font-semibold">
                        {penalty.payrollMonth ||
                          '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Proposed
                      </p>

                      <p className="font-bold text-orange-700">
                        ₹
                        {Number(
                          penalty.proposedAmount ||
                            0,
                        ).toLocaleString(
                          'en-IN',
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Approved
                      </p>

                      <p className="font-bold text-red-700">
                        ₹
                        {Number(
                          penalty.approvedAmount ||
                            0,
                        ).toLocaleString(
                          'en-IN',
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Reason
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {penalty.reason ||
                        '-'}
                    </p>
                  </div>

                  {penalty.evidenceRemarks && (
                    <div className="mt-3 rounded-xl bg-blue-50 p-3">
                      <p className="text-xs font-semibold uppercase text-blue-700">
                        Evidence / Remarks
                      </p>

                      <p className="mt-1 text-sm text-blue-900">
                        {
                          penalty.evidenceRemarks
                        }
                      </p>
                    </div>
                  )}

                  {penalty.reviewedAt && (
                    <p className="mt-3 text-xs text-gray-500">
                      Reviewed by{' '}
                      {penalty.reviewedByName ||
                        '-'}{' '}
                      on{' '}
                      {new Date(
                        penalty.reviewedAt,
                      ).toLocaleString(
                        'en-IN',
                      )}
                    </p>
                  )}

                  {penalty.reviewRemarks && (
                    <p className="mt-1 text-xs text-gray-600">
                      Review Remark:{' '}
                      {
                        penalty.reviewRemarks
                      }
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-500">
                    Payroll Deduction:{' '}
<span
  className={
    penalty.includeInPayroll
      ? 'font-semibold text-red-700'
      : 'font-semibold text-green-700'
  }
>
  {penalty.includeInPayroll
    ? 'Yes'
    : 'No'}
</span>
                    {' | '}
                    Approval Required:{' '}
                    <span className="font-semibold">
                      {penalty.requiresApproval
                        ? 'Yes'
                        : 'No'}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!penalty.isHidden &&
                    penalty.status ===
                      'PENDING' && (
                      <>
                        <button
                          type="button"
                          disabled={
                            loadingPenaltyAction
                          }
                          onClick={() =>
                            reviewPenaltyCase(
                              penalty,
                              'APPROVED',
                            )
                          }
                          className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={
                            loadingPenaltyAction
                          }
                          onClick={() =>
                            reviewPenaltyCase(
                              penalty,
                              'REJECTED',
                            )
                          }
                          className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                  {penalty.evidenceUrl && (
                    <a
                      href={
                        penalty.evidenceUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Evidence
                    </a>
                  )}

                  {penalty.status !==
                    'APPLIED_TO_PAYROLL' && (
                    <button
                      type="button"
                      onClick={() =>
                        hideRestorePenaltyCase(
                          penalty,
                          !!penalty.isHidden,
                        )
                      }
                      className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${
                        penalty.isHidden
                          ? 'bg-green-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      {penalty.isHidden
                        ? 'Restore'
                        : 'Hide'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        },
      )
    )}
  </div>

  <div className="mt-5 flex items-center justify-between">
    <button
      disabled={
        penaltyPage <= 1
      }
      onClick={() =>
        setPenaltyPage(
          penaltyPage - 1,
        )
      }
      className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
    >
      Previous
    </button>

    <p className="text-sm text-gray-500">
      Page {penaltyPage} of{' '}
      {penaltyTotalPages}
    </p>

    <button
      disabled={
        penaltyPage >=
        penaltyTotalPages
      }
      onClick={() =>
        setPenaltyPage(
          penaltyPage + 1,
        )
      }
      className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>
    </div>
  );
}