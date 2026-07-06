'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const POLICY_TYPES = [
  'ATTENDANCE',
  'LEAVE',
  'SALARY',
  'HOLIDAY',
  'GENERAL',
];

const DEFAULT_POLICY_DATA: Record<string, any> = {
  ATTENDANCE: {
    officeStartTime: '09:30',
    officeEndTime: '18:30',
    graceMinutes: 15,
    workingHours: 8,
    halfDayMinimumHours: 4,
    weeklyOff: 'SUNDAY',
    gpsMandatory: true,
    photoMandatory: true,
    allowOvertime: false,
  },
  LEAVE: {
    casualLeavePerYear: 12,
    sickLeavePerYear: 12,
    paidLeavePerYear: 0,
    carryForwardAllowed: false,
    maxConsecutiveLeaveDays: 7,
  },
  SALARY: {
    salaryCycle: 'MONTHLY',
    paymentDay: 7,
    attendanceBasedSalary: true,
    deductAbsent: true,
    deductHalfDay: true,
    ownerCanOverride: true,
  },
  HOLIDAY: {
    weeklyOff: 'SUNDAY',
    companyHolidayEnabled: true,
  },
  GENERAL: {
    remarks: '',
  },
};

export default function HrSettingsPage() {
  const [activeType, setActiveType] = useState('ATTENDANCE');
  const [policyId, setPolicyId] = useState<number | null>(null);
  const [policyData, setPolicyData] = useState<any>(
    DEFAULT_POLICY_DATA.ATTENDANCE,
  );
  const [description, setDescription] = useState('');
  const [changeRemarks, setChangeRemarks] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [version, setVersion] = useState(1);
  const [settings, setSettings] = useState<any[]>([]);
  const [showHidden, setShowHidden] = useState(false);

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadSetting = async (type = activeType) => {
    const res = await axios.get(`${API_BASE_URL}/staff/hr-settings/${type}`, {
      headers: headers(),
    });

    const item = res.data;
    setPolicyId(item.id);
    setPolicyData(
      Object.keys(item.policyData || {}).length
        ? item.policyData
        : DEFAULT_POLICY_DATA[type] || {},
    );
    setDescription(item.description || '');
    setIsActive(item.isActive !== false);
    setVersion(item.version || 1);
    setChangeRemarks('');
  };

  const loadSettingsList = async () => {
    const res = await axios.get(`${API_BASE_URL}/staff/hr-settings`, {
      params: {
        page: 1,
        limit: 50,
        showHidden,
      },
      headers: headers(),
    });

    setSettings(res.data?.data || []);
  };

  useEffect(() => {
    loadSetting(activeType);
    loadSettingsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, showHidden]);

  const updateField = (key: string, value: any) => {
    setPolicyData({
      ...policyData,
      [key]: value,
    });
  };

  const saveSetting = async () => {
    await axios.patch(
      `${API_BASE_URL}/staff/hr-settings/${activeType}`,
      {
        policyKey: 'DEFAULT',
        policyData,
        description,
        changeRemarks,
        isActive,
      },
      { headers: headers() },
    );

    alert('HR setting saved successfully');
    loadSetting(activeType);
    loadSettingsList();
  };

  const hideRestore = async (item: any, restore = false) => {
    const reason = window.prompt(
      restore ? 'Reason for restoring setting?' : 'Reason for hiding setting?',
      restore ? 'Valid setting' : 'Old / inactive setting',
    );

    if (reason === null) return;

    await axios.patch(
      `${API_BASE_URL}/staff/hr-settings/${item.id}/${restore ? 'restore' : 'hide'}`,
      { reason },
      { headers: headers() },
    );

    loadSettingsList();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">HR Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure HR rules used by attendance, leave, salary, incentive and
          penalty calculations.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {POLICY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              activeType === type
                ? 'bg-blue-600 text-white'
                : 'border bg-white text-gray-700'
            }`}
          >
            {type.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {activeType.replaceAll('_', ' ')} Rules
            </h2>
            <p className="text-sm text-gray-500">
              Version: {version} {policyId ? `| ID: ${policyId}` : ''}
            </p>
          </div>

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />{' '}
            Active
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Object.entries(policyData).map(([key, value]) => (
            <div key={key}>
              <p className="mb-1 text-xs font-semibold text-gray-600">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>

              {typeof value === 'boolean' ? (
                <label className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateField(key, e.target.checked)}
                  />
                  Enabled
                </label>
              ) : typeof value === 'number' ? (
                <input
                  type="number"
                  value={value}
                  onChange={(e) => updateField(key, Number(e.target.value))}
                  className="w-full rounded-xl border p-3"
                />
              ) : (
                <input
                  value={String(value || '')}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="w-full rounded-xl border p-3"
                />
              )}
            </div>
          ))}
        </div>

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-4 w-full rounded-xl border p-3"
        />

        <textarea
          placeholder="Change remarks / why this rule changed"
          value={changeRemarks}
          onChange={(e) => setChangeRemarks(e.target.value)}
          className="mt-3 w-full rounded-xl border p-3"
        />

        <button
          onClick={saveSetting}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          Save {activeType.replaceAll('_', ' ')} Rules
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800">
            Settings Register
          </h2>

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
            />{' '}
            View Hidden
          </label>
        </div>

        <div className="mt-4 space-y-3">
          {settings.length === 0 ? (
            <p className="text-sm text-gray-500">No settings found.</p>
          ) : (
            settings.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${
                  item.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {item.policyType} - {item.policyKey}
                    </p>
                    <p className="text-sm text-gray-500">
                      Version {item.version || 1} |{' '}
                      {item.isActive ? 'Active' : 'Inactive'}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveType(item.policyType)}
                      className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Open
                    </button>

                    <button
                      onClick={() => hideRestore(item, !!item.isHidden)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${
                        item.isHidden ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {item.isHidden ? 'Restore' : 'Hide'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}