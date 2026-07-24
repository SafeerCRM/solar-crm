'use client';

import axios from 'axios';
import Link from 'next/link';
import {
  useEffect,
  useState,
} from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type AttendanceLocation = {
  id: number;
  name: string;
  address?: string | null;
  latitude: number | string;
  longitude: number | string;
  allowedRadiusMeters: number;
  branchName?: string | null;
  isActive: boolean;
  isHidden: boolean;
  createdBy?: number | null;
  createdByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type LocationForm = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  allowedRadiusMeters: string;
  branchName: string;
  isActive: boolean;
};

type StaffMember = {
  id: number;
  fullName?: string | null;
  employeeCode?: string | null;
  department?: string | null;
  branchName?: string | null;
};

type AttendancePolicy = {
  id: number;
  staffId: number;
  staffName?: string | null;
  punchInRule:
    | 'ANYWHERE_ALLOWED'
    | 'OFFICE_LOCATION_REQUIRED';
  punchInLocationId?: number | null;
  punchOutRule:
    | 'ANYWHERE_ALLOWED'
    | 'OFFICE_LOCATION_REQUIRED';
  punchOutLocationId?: number | null;
  isActive: boolean;
  createdByName?: string | null;
  updatedByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type PolicyForm = {
  staffId: string;
  punchInRule:
    | 'ANYWHERE_ALLOWED'
    | 'OFFICE_LOCATION_REQUIRED';
  punchInLocationId: string;
  punchOutRule:
    | 'ANYWHERE_ALLOWED'
    | 'OFFICE_LOCATION_REQUIRED';
  punchOutLocationId: string;
  isActive: boolean;
};

type AttendanceOverride = {
  id: number;
  staffId: number;
  staffName?: string | null;
  attendanceDate: string;

  punchInRule:
    | 'ANYWHERE_ALLOWED'
    | 'OFFICE_LOCATION_REQUIRED'
    | null;

  punchInLocationId?: number | null;

  punchOutRule:
    | 'ANYWHERE_ALLOWED'
    | 'OFFICE_LOCATION_REQUIRED'
    | null;

  punchOutLocationId?: number | null;

  reason?: string | null;
  isActive: boolean;

  createdByName?: string | null;
  updatedByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type OverrideRuleValue =
  | ''
  | 'ANYWHERE_ALLOWED'
  | 'OFFICE_LOCATION_REQUIRED';

type OverrideForm = {
  id: number | null;
  staffId: string;
  attendanceDate: string;
  punchInRule: OverrideRuleValue;
  punchInLocationId: string;
  punchOutRule: OverrideRuleValue;
  punchOutLocationId: string;
  reason: string;
  isActive: boolean;
};

const emptyOverrideForm: OverrideForm = {
  id: null,
  staffId: '',
  attendanceDate:
    new Date().toISOString().split('T')[0],
  punchInRule: '',
  punchInLocationId: '',
  punchOutRule: '',
  punchOutLocationId: '',
  reason: '',
  isActive: true,
};

const emptyPolicyForm: PolicyForm = {
  staffId: '',
  punchInRule: 'ANYWHERE_ALLOWED',
  punchInLocationId: '',
  punchOutRule: 'ANYWHERE_ALLOWED',
  punchOutLocationId: '',
  isActive: true,
};

const emptyLocationForm: LocationForm = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  allowedRadiusMeters: '150',
  branchName: '',
  isActive: true,
};

export default function AttendanceSettingsPage() {
  const [locations, setLocations] = useState<
    AttendanceLocation[]
  >([]);

  const [locationForm, setLocationForm] =
    useState<LocationForm>(emptyLocationForm);

  const [editingLocationId, setEditingLocationId] =
    useState<number | null>(null);

  const [showHiddenLocations, setShowHiddenLocations] =
    useState(false);

  const [locationSearch, setLocationSearch] =
    useState('');

  const [loadingLocations, setLoadingLocations] =
    useState(false);

  const [savingLocation, setSavingLocation] =
    useState(false);

  const [capturingGps, setCapturingGps] =
    useState(false);
    const [staffMembers, setStaffMembers] =
  useState<StaffMember[]>([]);

const [activeLocations, setActiveLocations] =
  useState<AttendanceLocation[]>([]);

const [attendancePolicies, setAttendancePolicies] =
  useState<AttendancePolicy[]>([]);

const [policyForm, setPolicyForm] =
  useState<PolicyForm>(emptyPolicyForm);

const [staffSearch, setStaffSearch] =
  useState('');

const [showStaffOptions, setShowStaffOptions] =
  useState(false);

const [selectedStaffName, setSelectedStaffName] =
  useState('');

const [policySearch, setPolicySearch] =
  useState('');

const [loadingPolicies, setLoadingPolicies] =
  useState(false);

const [savingPolicy, setSavingPolicy] =
  useState(false);

  const [attendanceOverrides, setAttendanceOverrides] =
  useState<AttendanceOverride[]>([]);

const [overrideForm, setOverrideForm] =
  useState<OverrideForm>(emptyOverrideForm);

const [overrideStaffSearch, setOverrideStaffSearch] =
  useState('');

const [
  selectedOverrideStaffName,
  setSelectedOverrideStaffName,
] = useState('');

const [
  showOverrideStaffOptions,
  setShowOverrideStaffOptions,
] = useState(false);

const [overrideSearch, setOverrideSearch] =
  useState('');

const [overrideDateFilter, setOverrideDateFilter] =
  useState('');

const [overrideActiveFilter, setOverrideActiveFilter] =
  useState('');

const [loadingOverrides, setLoadingOverrides] =
  useState(false);

const [savingOverride, setSavingOverride] =
  useState(false);

  const headers = () => {
    const token = localStorage.getItem('token');

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  const extractList = (responseData: any) => {
    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (Array.isArray(responseData?.data)) {
      return responseData.data;
    }

    if (Array.isArray(responseData?.items)) {
      return responseData.items;
    }

    return [];
  };

  const getErrorMessage = (
    error: any,
    fallback: string,
  ) => {
    const message =
      error?.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }

    return error?.message || fallback;
  };

  const fetchAttendanceLocations =
    async () => {
      try {
        setLoadingLocations(true);

        const response = await axios.get(
          `${API_BASE_URL}/staff/attendance-locations`,
          {
            params: {
              page: 1,
              limit: 100,
              showHidden: showHiddenLocations,
              search:
                locationSearch.trim() || undefined,
            },
            headers: headers(),
          },
        );

        setLocations(
          extractList(response.data),
        );
      } catch (error: any) {
        console.error(error);

        alert(
          getErrorMessage(
            error,
            'Failed to load attendance locations',
          ),
        );
      } finally {
        setLoadingLocations(false);
      }
    };

    const fetchStaffMembers = async () => {
  try {
    const response = await axios.get(
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

    setStaffMembers(
      extractList(response.data),
    );
  } catch (error: any) {
    console.error(error);

    alert(
      getErrorMessage(
        error,
        'Failed to load staff members',
      ),
    );
  }
};

const fetchActiveLocations = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/staff/attendance-locations/active`,
      {
        headers: headers(),
      },
    );

    setActiveLocations(
      extractList(response.data),
    );
  } catch (error: any) {
    console.error(error);

    alert(
      getErrorMessage(
        error,
        'Failed to load active attendance locations',
      ),
    );
  }
};

const fetchAttendancePolicies =
  async () => {
    try {
      setLoadingPolicies(true);

      const response = await axios.get(
        `${API_BASE_URL}/staff/attendance-policies`,
        {
          params: {
            page: 1,
            limit: 100,
            search:
              policySearch.trim() ||
              undefined,
          },
          headers: headers(),
        },
      );

      setAttendancePolicies(
        extractList(response.data),
      );
    } catch (error: any) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to load attendance policies',
        ),
      );
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchAttendanceOverrides =
  async () => {
    try {
      setLoadingOverrides(true);

      const response = await axios.get(
        `${API_BASE_URL}/staff/attendance-overrides`,
        {
          params: {
            page: 1,
            limit: 100,
            search:
              overrideSearch.trim() ||
              undefined,
            attendanceDate:
              overrideDateFilter ||
              undefined,
            isActive:
              overrideActiveFilter === ''
                ? undefined
                : overrideActiveFilter ===
                    'ACTIVE',
          },
          headers: headers(),
        },
      );

      setAttendanceOverrides(
        extractList(response.data),
      );
    } catch (error: any) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to load attendance overrides',
        ),
      );
    } finally {
      setLoadingOverrides(false);
    }
  };

  useEffect(() => {
  fetchAttendanceLocations();
  fetchStaffMembers();
  fetchActiveLocations();
  fetchAttendancePolicies();
  fetchAttendanceOverrides();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [showHiddenLocations]);

  const resetLocationForm = () => {
    setLocationForm(emptyLocationForm);
    setEditingLocationId(null);
  };

  const captureCurrentCoordinates =
    async () => {
      if (!navigator.geolocation) {
        alert(
          'GPS is not supported on this device',
        );
        return;
      }

      try {
        setCapturingGps(true);

        const position =
          await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                  enableHighAccuracy: true,
                  timeout: 20000,
                  maximumAge: 0,
                },
              );
            },
          );

        setLocationForm((current) => ({
          ...current,
          latitude: String(
            position.coords.latitude,
          ),
          longitude: String(
            position.coords.longitude,
          ),
        }));

        alert(
          'Current GPS coordinates captured',
        );
      } catch (error: any) {
        console.error(error);

        const gpsMessage =
          error?.code === 1
            ? 'Location permission was denied'
            : error?.code === 2
              ? 'Current location is unavailable'
              : error?.code === 3
                ? 'Location request timed out'
                : 'Failed to capture current GPS location';

        alert(gpsMessage);
      } finally {
        setCapturingGps(false);
      }
    };

  const saveAttendanceLocation =
    async () => {
      const name = locationForm.name.trim();
      const latitude = Number(
        locationForm.latitude,
      );
      const longitude = Number(
        locationForm.longitude,
      );
      const allowedRadiusMeters = Number(
        locationForm.allowedRadiusMeters,
      );

      if (!name) {
        alert('Location name is required');
        return;
      }

      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        alert(
          'Enter a valid latitude between -90 and 90',
        );
        return;
      }

      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        alert(
          'Enter a valid longitude between -180 and 180',
        );
        return;
      }

      if (
        !Number.isFinite(
          allowedRadiusMeters,
        ) ||
        allowedRadiusMeters <= 0
      ) {
        alert(
          'Allowed radius must be greater than zero',
        );
        return;
      }

      const payload = {
        name,
        address:
          locationForm.address.trim() || null,
        latitude,
        longitude,
        allowedRadiusMeters:
          Math.round(
            allowedRadiusMeters,
          ),
        branchName:
          locationForm.branchName.trim() ||
          null,
        isActive:
          locationForm.isActive,
      };

      try {
        setSavingLocation(true);

        if (editingLocationId) {
          await axios.patch(
            `${API_BASE_URL}/staff/attendance-locations/${editingLocationId}`,
            payload,
            {
              headers: headers(),
            },
          );

          alert(
            'Attendance location updated',
          );
        } else {
          await axios.post(
            `${API_BASE_URL}/staff/attendance-locations`,
            payload,
            {
              headers: headers(),
            },
          );

          alert(
            'Attendance location created',
          );
        }

        resetLocationForm();
await fetchAttendanceLocations();
await fetchActiveLocations();
      } catch (error: any) {
        console.error(error);

        alert(
          getErrorMessage(
            error,
            editingLocationId
              ? 'Failed to update attendance location'
              : 'Failed to create attendance location',
          ),
        );
      } finally {
        setSavingLocation(false);
      }
    };

  const editAttendanceLocation = (
    location: AttendanceLocation,
  ) => {
    setEditingLocationId(location.id);

    setLocationForm({
      name: location.name || '',
      address: location.address || '',
      latitude: String(
        location.latitude ?? '',
      ),
      longitude: String(
        location.longitude ?? '',
      ),
      allowedRadiusMeters: String(
        location.allowedRadiusMeters ?? 150,
      ),
      branchName:
        location.branchName || '',
      isActive:
        location.isActive !== false,
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const hideAttendanceLocation =
    async (
      location: AttendanceLocation,
    ) => {
      const confirmed = window.confirm(
        `Hide attendance location "${location.name}"?`,
      );

      if (!confirmed) {
        return;
      }

      try {
        setLoadingLocations(true);

        await axios.patch(
          `${API_BASE_URL}/staff/attendance-locations/${location.id}/hide`,
          {},
          {
            headers: headers(),
          },
        );

        alert(
          'Attendance location hidden',
        );

        if (
          editingLocationId === location.id
        ) {
          resetLocationForm();
        }

        await fetchAttendanceLocations();
await fetchActiveLocations();
      } catch (error: any) {
        console.error(error);

        alert(
          getErrorMessage(
            error,
            'Failed to hide attendance location',
          ),
        );
      } finally {
        setLoadingLocations(false);
      }
    };

  const restoreAttendanceLocation =
    async (
      location: AttendanceLocation,
    ) => {
      const confirmed = window.confirm(
        `Restore attendance location "${location.name}"?`,
      );

      if (!confirmed) {
        return;
      }

      try {
        setLoadingLocations(true);

        await axios.patch(
          `${API_BASE_URL}/staff/attendance-locations/${location.id}/restore`,
          {},
          {
            headers: headers(),
          },
        );

        alert(
          'Attendance location restored',
        );

        await fetchAttendanceLocations();
await fetchActiveLocations();
      } catch (error: any) {
        console.error(error);

        alert(
          getErrorMessage(
            error,
            'Failed to restore attendance location',
          ),
        );
      } finally {
        setLoadingLocations(false);
      }
    };

    const resetPolicyForm = () => {
  setPolicyForm(emptyPolicyForm);
  setStaffSearch('');
  setSelectedStaffName('');
  setShowStaffOptions(false);
};

const saveAttendancePolicy =
  async () => {
    if (!policyForm.staffId) {
      alert('Please select a staff member');
      return;
    }

    if (
      policyForm.punchInRule ===
        'OFFICE_LOCATION_REQUIRED' &&
      !policyForm.punchInLocationId
    ) {
      alert(
        'Please select the office location required for punch in',
      );
      return;
    }

    if (
      policyForm.punchOutRule ===
        'OFFICE_LOCATION_REQUIRED' &&
      !policyForm.punchOutLocationId
    ) {
      alert(
        'Please select the office location required for punch out',
      );
      return;
    }

    const selectedStaff =
      staffMembers.find(
        (item) =>
          item.id ===
          Number(policyForm.staffId),
      );

    const payload = {
      staffId: Number(
        policyForm.staffId,
      ),
      staffName:
        selectedStaff?.fullName ||
        selectedStaffName ||
        null,

      punchInRule:
        policyForm.punchInRule,

      punchInLocationId:
        policyForm.punchInRule ===
        'OFFICE_LOCATION_REQUIRED'
          ? Number(
              policyForm.punchInLocationId,
            )
          : null,

      punchOutRule:
        policyForm.punchOutRule,

      punchOutLocationId:
        policyForm.punchOutRule ===
        'OFFICE_LOCATION_REQUIRED'
          ? Number(
              policyForm.punchOutLocationId,
            )
          : null,

      isActive:
        policyForm.isActive,
    };

    try {
      setSavingPolicy(true);

      await axios.post(
        `${API_BASE_URL}/staff/attendance-policies`,
        payload,
        {
          headers: headers(),
        },
      );

      alert(
        'Staff attendance policy saved',
      );

      resetPolicyForm();
      await fetchAttendancePolicies();
    } catch (error: any) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to save attendance policy',
        ),
      );
    } finally {
      setSavingPolicy(false);
    }
  };

const editAttendancePolicy = (
  policy: AttendancePolicy,
) => {
  const staffMember =
    staffMembers.find(
      (item) =>
        item.id === policy.staffId,
    );

  setPolicyForm({
    staffId: String(policy.staffId),

    punchInRule:
      policy.punchInRule ||
      'ANYWHERE_ALLOWED',

    punchInLocationId:
      policy.punchInLocationId
        ? String(
            policy.punchInLocationId,
          )
        : '',

    punchOutRule:
      policy.punchOutRule ||
      'ANYWHERE_ALLOWED',

    punchOutLocationId:
      policy.punchOutLocationId
        ? String(
            policy.punchOutLocationId,
          )
        : '',

    isActive:
      policy.isActive !== false,
  });

  setSelectedStaffName(
    staffMember
      ? `${staffMember.fullName || 'Unnamed'} ${
          staffMember.employeeCode
            ? `(${staffMember.employeeCode})`
            : ''
        }`
      : policy.staffName ||
          `Staff #${policy.staffId}`,
  );

  setStaffSearch('');
  setShowStaffOptions(false);

  document
    .getElementById(
      'staff-attendance-policy-form',
    )
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
};

const setAttendancePolicyActive =
  async (
    policy: AttendancePolicy,
    isActive: boolean,
  ) => {
    const action =
      isActive ? 'activate' : 'deactivate';

    const confirmed = window.confirm(
      `${action === 'activate' ? 'Activate' : 'Deactivate'} attendance policy for ${
        policy.staffName ||
        `Staff #${policy.staffId}`
      }?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoadingPolicies(true);

      await axios.patch(
        `${API_BASE_URL}/staff/attendance-policies/staff/${policy.staffId}/active`,
        {
          isActive,
        },
        {
          headers: headers(),
        },
      );

      alert(
        `Attendance policy ${
          isActive
            ? 'activated'
            : 'deactivated'
        }`,
      );

      await fetchAttendancePolicies();
    } catch (error: any) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to update attendance policy status',
        ),
      );
    } finally {
      setLoadingPolicies(false);
    }
  };

const getLocationName = (
  locationId?: number | null,
) => {
  if (!locationId) {
    return '-';
  }

  return (
    activeLocations.find(
      (location) =>
        location.id === locationId,
    )?.name ||
    locations.find(
      (location) =>
        location.id === locationId,
    )?.name ||
    `Location #${locationId}`
  );
};

const filteredStaffMembers =
  staffMembers.filter((staffMember) => {
    const text = `
      ${staffMember.fullName || ''}
      ${staffMember.employeeCode || ''}
      ${staffMember.department || ''}
      ${staffMember.branchName || ''}
    `.toLowerCase();

    return text.includes(
      staffSearch.toLowerCase(),
    );
  });

  const filteredOverrideStaffMembers =
  staffMembers.filter((staffMember) => {
    const text = `
      ${staffMember.fullName || ''}
      ${staffMember.employeeCode || ''}
      ${staffMember.department || ''}
      ${staffMember.branchName || ''}
    `.toLowerCase();

    return text.includes(
      overrideStaffSearch.toLowerCase(),
    );
  });

const resetOverrideForm = () => {
  setOverrideForm({
    ...emptyOverrideForm,
    attendanceDate:
      new Date().toISOString().split('T')[0],
  });

  setOverrideStaffSearch('');
  setSelectedOverrideStaffName('');
  setShowOverrideStaffOptions(false);
};

const saveAttendanceOverride =
  async () => {
    if (!overrideForm.staffId) {
      alert('Please select a staff member');
      return;
    }

    if (!overrideForm.attendanceDate) {
      alert('Attendance date is required');
      return;
    }

    if (
      !overrideForm.punchInRule &&
      !overrideForm.punchOutRule
    ) {
      alert(
        'Select at least one punch-in or punch-out override rule',
      );
      return;
    }

    if (
      overrideForm.punchInRule ===
        'OFFICE_LOCATION_REQUIRED' &&
      !overrideForm.punchInLocationId
    ) {
      alert(
        'Please select the override office location for punch in',
      );
      return;
    }

    if (
      overrideForm.punchOutRule ===
        'OFFICE_LOCATION_REQUIRED' &&
      !overrideForm.punchOutLocationId
    ) {
      alert(
        'Please select the override office location for punch out',
      );
      return;
    }

    const selectedStaff =
      staffMembers.find(
        (staffMember) =>
          staffMember.id ===
          Number(overrideForm.staffId),
      );

    const payload = {
      staffId: Number(
        overrideForm.staffId,
      ),

      staffName:
        selectedStaff?.fullName ||
        selectedOverrideStaffName ||
        null,

      attendanceDate:
        overrideForm.attendanceDate,

      punchInRule:
        overrideForm.punchInRule ||
        null,

      punchInLocationId:
        overrideForm.punchInRule ===
        'OFFICE_LOCATION_REQUIRED'
          ? Number(
              overrideForm.punchInLocationId,
            )
          : null,

      punchOutRule:
        overrideForm.punchOutRule ||
        null,

      punchOutLocationId:
        overrideForm.punchOutRule ===
        'OFFICE_LOCATION_REQUIRED'
          ? Number(
              overrideForm.punchOutLocationId,
            )
          : null,

      reason:
        overrideForm.reason.trim() ||
        null,

      isActive:
        overrideForm.isActive,
    };

    try {
      setSavingOverride(true);

      await axios.post(
        `${API_BASE_URL}/staff/attendance-overrides`,
        payload,
        {
          headers: headers(),
        },
      );

      alert(
        overrideForm.id
          ? 'Attendance override updated'
          : 'Attendance override saved',
      );

      resetOverrideForm();
      await fetchAttendanceOverrides();
    } catch (error: any) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to save attendance override',
        ),
      );
    } finally {
      setSavingOverride(false);
    }
  };

const editAttendanceOverride = (
  override: AttendanceOverride,
) => {
  const staffMember =
    staffMembers.find(
      (item) =>
        item.id === override.staffId,
    );

  setOverrideForm({
    id: override.id,
    staffId: String(override.staffId),
    attendanceDate:
      override.attendanceDate,

    punchInRule:
      override.punchInRule || '',

    punchInLocationId:
      override.punchInLocationId
        ? String(
            override.punchInLocationId,
          )
        : '',

    punchOutRule:
      override.punchOutRule || '',

    punchOutLocationId:
      override.punchOutLocationId
        ? String(
            override.punchOutLocationId,
          )
        : '',

    reason: override.reason || '',

    isActive:
      override.isActive !== false,
  });

  setSelectedOverrideStaffName(
    staffMember
      ? `${staffMember.fullName || 'Unnamed'} ${
          staffMember.employeeCode
            ? `(${staffMember.employeeCode})`
            : ''
        }`
      : override.staffName ||
          `Staff #${override.staffId}`,
  );

  setOverrideStaffSearch('');
  setShowOverrideStaffOptions(false);

  document
    .getElementById(
      'attendance-override-form',
    )
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
};

const setAttendanceOverrideActive =
  async (
    override: AttendanceOverride,
    isActive: boolean,
  ) => {
    const confirmed = window.confirm(
      `${
        isActive
          ? 'Activate'
          : 'Deactivate'
      } attendance override for ${
        override.staffName ||
        `Staff #${override.staffId}`
      } on ${override.attendanceDate}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoadingOverrides(true);

      await axios.patch(
        `${API_BASE_URL}/staff/attendance-overrides/${override.id}/active`,
        {
          isActive,
        },
        {
          headers: headers(),
        },
      );

      alert(
        `Attendance override ${
          isActive
            ? 'activated'
            : 'deactivated'
        }`,
      );

      await fetchAttendanceOverrides();
    } catch (error: any) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to update attendance override status',
        ),
      );
    } finally {
      setLoadingOverrides(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Attendance Settings
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Configure office GPS locations,
              allowed attendance radius, staff
              rules and date-specific overrides.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/staff/attendance"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Attendance Register
            </Link>

            <Link
              href="/hr-portal"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Back to HR Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Office GPS Locations
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Add every office or approved work
            location where attendance may be
            marked.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Location Name *
            </label>

            <input
              value={locationForm.name}
              onChange={(event) =>
                setLocationForm(
                  (current) => ({
                    ...current,
                    name: event.target.value,
                  }),
                )
              }
              placeholder="Example: Kota Head Office"
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Branch Name
            </label>

            <input
              value={
                locationForm.branchName
              }
              onChange={(event) =>
                setLocationForm(
                  (current) => ({
                    ...current,
                    branchName:
                      event.target.value,
                  }),
                )
              }
              placeholder="Example: Kota"
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">
              Address
            </label>

            <textarea
              value={locationForm.address}
              onChange={(event) =>
                setLocationForm(
                  (current) => ({
                    ...current,
                    address:
                      event.target.value,
                  }),
                )
              }
              placeholder="Complete office or work location address"
              className="mt-1 min-h-24 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Latitude *
            </label>

            <input
              type="number"
              step="any"
              value={
                locationForm.latitude
              }
              onChange={(event) =>
                setLocationForm(
                  (current) => ({
                    ...current,
                    latitude:
                      event.target.value,
                  }),
                )
              }
              placeholder="Example: 25.2138150"
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Longitude *
            </label>

            <input
              type="number"
              step="any"
              value={
                locationForm.longitude
              }
              onChange={(event) =>
                setLocationForm(
                  (current) => ({
                    ...current,
                    longitude:
                      event.target.value,
                  }),
                )
              }
              placeholder="Example: 75.8647520"
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Allowed Radius in Metres *
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={
                locationForm.allowedRadiusMeters
              }
              onChange={(event) =>
                setLocationForm(
                  (current) => ({
                    ...current,
                    allowedRadiusMeters:
                      event.target.value,
                  }),
                )
              }
              placeholder="150"
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Location Status
            </label>

            <select
              value={
                locationForm.isActive
                  ? 'ACTIVE'
                  : 'INACTIVE'
              }
              onChange={(event) =>
                setLocationForm(
                  (current) => ({
                    ...current,
                    isActive:
                      event.target.value ===
                      'ACTIVE',
                  }),
                )
              }
              className="mt-1 w-full rounded-xl border p-3"
            >
              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">
            Capture coordinates while physically
            present at the office.
          </p>

          <p className="mt-1 text-xs text-blue-700">
            The browser will request location
            permission and place the current GPS
            coordinates in the latitude and
            longitude fields.
          </p>

          <button
            type="button"
            onClick={
              captureCurrentCoordinates
            }
            disabled={capturingGps}
            className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {capturingGps
              ? 'Capturing GPS...'
              : 'Use My Current GPS Location'}
          </button>
        </div>

        {locationForm.latitude &&
          locationForm.longitude && (
            <div className="mt-4">
              <a
                href={`https://www.google.com/maps?q=${locationForm.latitude},${locationForm.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Preview Coordinates on Map
              </a>
            </div>
          )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={
              saveAttendanceLocation
            }
            disabled={savingLocation}
            className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {savingLocation
              ? 'Saving...'
              : editingLocationId
                ? 'Update Location'
                : 'Create Location'}
          </button>

          {editingLocationId && (
            <button
              type="button"
              onClick={resetLocationForm}
              disabled={savingLocation}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Saved Attendance Locations
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Review, edit, hide or restore office
              GPS locations.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={
                showHiddenLocations
              }
              onChange={(event) =>
                setShowHiddenLocations(
                  event.target.checked,
                )
              }
            />

            View Hidden
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            value={locationSearch}
            onChange={(event) =>
              setLocationSearch(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                fetchAttendanceLocations();
              }
            }}
            placeholder="Search by location, branch or address"
            className="w-full rounded-xl border p-3"
          />

          <button
            type="button"
            onClick={
              fetchAttendanceLocations
            }
            disabled={loadingLocations}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loadingLocations
              ? 'Loading...'
              : 'Search'}
          </button>

          <button
            type="button"
            onClick={() => {
              setLocationSearch('');

              setTimeout(() => {
                fetchAttendanceLocations();
              }, 0);
            }}
            disabled={loadingLocations}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
          >
            Clear
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {loadingLocations ? (
            <p className="text-sm text-gray-500">
              Loading attendance locations...
            </p>
          ) : locations.length === 0 ? (
            <p className="text-sm text-gray-500">
              No attendance locations found.
            </p>
          ) : (
            locations.map((location) => (
              <div
                key={location.id}
                className={`rounded-xl border p-4 ${
                  location.isHidden
                    ? 'border-red-200 bg-red-50'
                    : 'bg-white'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900">
                        {location.name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          location.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {location.isActive
                          ? 'ACTIVE'
                          : 'INACTIVE'}
                      </span>

                      {location.isHidden && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                          HIDDEN
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      Branch:{' '}
                      {location.branchName ||
                        '-'}
                    </p>

                    <p className="text-sm text-gray-600">
                      Address:{' '}
                      {location.address || '-'}
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      Latitude:{' '}
                      {location.latitude}
                    </p>

                    <p className="text-sm text-gray-600">
                      Longitude:{' '}
                      {location.longitude}
                    </p>

                    <p className="mt-2 font-semibold text-blue-700">
                      Allowed Radius:{' '}
                      {
                        location.allowedRadiusMeters
                      }{' '}
                      metres
                    </p>

                    {location.createdByName && (
                      <p className="mt-2 text-xs text-gray-500">
                        Created by:{' '}
                        {
                          location.createdByName
                        }
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Open Map
                    </a>

                    {!location.isHidden && (
                      <button
                        type="button"
                        onClick={() =>
                          editAttendanceLocation(
                            location,
                          )
                        }
                        disabled={
                          loadingLocations
                        }
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Edit
                      </button>
                    )}

                    {!location.isHidden ? (
                      <button
                        type="button"
                        onClick={() =>
                          hideAttendanceLocation(
                            location,
                          )
                        }
                        disabled={
                          loadingLocations
                        }
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Hide
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          restoreAttendanceLocation(
                            location,
                          )
                        }
                        disabled={
                          loadingLocations
                        }
                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
  id="staff-attendance-policy-form"
  className="rounded-2xl bg-white p-5 shadow"
>
  <div>
    <h2 className="text-xl font-bold text-gray-800">
      Staff Attendance Policies
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Set permanent punch-in and punch-out
      location rules for individual employees.
    </p>
  </div>

  <div className="mt-5 grid gap-4 md:grid-cols-2">
    <div className="relative md:col-span-2">
      <label className="text-sm font-semibold text-gray-700">
        Staff Member *
      </label>

      <input
        value={
          staffSearch ||
          selectedStaffName
        }
        onChange={(event) => {
          setStaffSearch(
            event.target.value,
          );
          setSelectedStaffName('');
          setPolicyForm(
            (current) => ({
              ...current,
              staffId: '',
            }),
          );
          setShowStaffOptions(true);
        }}
        onFocus={() =>
          setShowStaffOptions(true)
        }
        placeholder="Search by employee name, code, department or branch"
        className="mt-1 w-full rounded-xl border p-3"
      />

      {showStaffOptions && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow">
          {filteredStaffMembers.length ===
          0 ? (
            <div className="p-3 text-sm text-gray-500">
              No matching staff found
            </div>
          ) : (
            filteredStaffMembers.map(
              (staffMember) => (
                <button
                  key={staffMember.id}
                  type="button"
                  onClick={() => {
                    setPolicyForm(
                      (current) => ({
                        ...current,
                        staffId: String(
                          staffMember.id,
                        ),
                      }),
                    );

                    setSelectedStaffName(
                      `${
                        staffMember.fullName ||
                        'Unnamed'
                      } ${
                        staffMember.employeeCode
                          ? `(${staffMember.employeeCode})`
                          : ''
                      }`,
                    );

                    setStaffSearch('');
                    setShowStaffOptions(
                      false,
                    );
                  }}
                  className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
                >
                  <p className="font-semibold text-gray-800">
                    {staffMember.fullName ||
                      'Unnamed'}

                    {staffMember.employeeCode
                      ? ` (${staffMember.employeeCode})`
                      : ''}
                  </p>

                  <p className="text-xs text-gray-500">
                    {staffMember.department ||
                      '-'}{' '}
                    |{' '}
                    {staffMember.branchName ||
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
      <label className="text-sm font-semibold text-gray-700">
        Punch-In Rule *
      </label>

      <select
        value={
          policyForm.punchInRule
        }
        onChange={(event) => {
          const value =
            event.target.value as
              | 'ANYWHERE_ALLOWED'
              | 'OFFICE_LOCATION_REQUIRED';

          setPolicyForm(
            (current) => ({
              ...current,
              punchInRule: value,
              punchInLocationId:
                value ===
                'ANYWHERE_ALLOWED'
                  ? ''
                  : current.punchInLocationId,
            }),
          );
        }}
        className="mt-1 w-full rounded-xl border p-3"
      >
        <option value="ANYWHERE_ALLOWED">
          Anywhere Allowed
        </option>

        <option value="OFFICE_LOCATION_REQUIRED">
          Office Location Required
        </option>
      </select>
    </div>

    <div>
      <label className="text-sm font-semibold text-gray-700">
        Punch-In Office Location
      </label>

      <select
        value={
          policyForm.punchInLocationId
        }
        disabled={
          policyForm.punchInRule ===
          'ANYWHERE_ALLOWED'
        }
        onChange={(event) =>
          setPolicyForm(
            (current) => ({
              ...current,
              punchInLocationId:
                event.target.value,
            }),
          )
        }
        className="mt-1 w-full rounded-xl border p-3 disabled:bg-gray-100"
      >
        <option value="">
          Select office location
        </option>

        {activeLocations.map(
          (location) => (
            <option
              key={location.id}
              value={location.id}
            >
              {location.name}
              {location.branchName
                ? ` - ${location.branchName}`
                : ''}
            </option>
          ),
        )}
      </select>
    </div>

    <div>
      <label className="text-sm font-semibold text-gray-700">
        Punch-Out Rule *
      </label>

      <select
        value={
          policyForm.punchOutRule
        }
        onChange={(event) => {
          const value =
            event.target.value as
              | 'ANYWHERE_ALLOWED'
              | 'OFFICE_LOCATION_REQUIRED';

          setPolicyForm(
            (current) => ({
              ...current,
              punchOutRule: value,
              punchOutLocationId:
                value ===
                'ANYWHERE_ALLOWED'
                  ? ''
                  : current.punchOutLocationId,
            }),
          );
        }}
        className="mt-1 w-full rounded-xl border p-3"
      >
        <option value="ANYWHERE_ALLOWED">
          Anywhere Allowed
        </option>

        <option value="OFFICE_LOCATION_REQUIRED">
          Office Location Required
        </option>
      </select>
    </div>

    <div>
      <label className="text-sm font-semibold text-gray-700">
        Punch-Out Office Location
      </label>

      <select
        value={
          policyForm.punchOutLocationId
        }
        disabled={
          policyForm.punchOutRule ===
          'ANYWHERE_ALLOWED'
        }
        onChange={(event) =>
          setPolicyForm(
            (current) => ({
              ...current,
              punchOutLocationId:
                event.target.value,
            }),
          )
        }
        className="mt-1 w-full rounded-xl border p-3 disabled:bg-gray-100"
      >
        <option value="">
          Select office location
        </option>

        {activeLocations.map(
          (location) => (
            <option
              key={location.id}
              value={location.id}
            >
              {location.name}
              {location.branchName
                ? ` - ${location.branchName}`
                : ''}
            </option>
          ),
        )}
      </select>
    </div>

    <div>
      <label className="text-sm font-semibold text-gray-700">
        Policy Status
      </label>

      <select
        value={
          policyForm.isActive
            ? 'ACTIVE'
            : 'INACTIVE'
        }
        onChange={(event) =>
          setPolicyForm(
            (current) => ({
              ...current,
              isActive:
                event.target.value ===
                'ACTIVE',
            }),
          )
        }
        className="mt-1 w-full rounded-xl border p-3"
      >
        <option value="ACTIVE">
          Active
        </option>

        <option value="INACTIVE">
          Inactive
        </option>
      </select>
    </div>
  </div>

  <div className="mt-5 flex flex-wrap gap-3">
    <button
      type="button"
      onClick={saveAttendancePolicy}
      disabled={savingPolicy}
      className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
    >
      {savingPolicy
        ? 'Saving...'
        : 'Save Staff Policy'}
    </button>

    <button
      type="button"
      onClick={resetPolicyForm}
      disabled={savingPolicy}
      className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
    >
      Clear
    </button>
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Saved Staff Policies
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Existing permanent attendance rules
        for staff members.
      </p>
    </div>

    <button
      type="button"
      onClick={
        fetchAttendancePolicies
      }
      disabled={loadingPolicies}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      Refresh
    </button>
  </div>

  <div className="mt-4 flex gap-3">
    <input
      value={policySearch}
      onChange={(event) =>
        setPolicySearch(
          event.target.value,
        )
      }
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          fetchAttendancePolicies();
        }
      }}
      placeholder="Search employee policy"
      className="w-full rounded-xl border p-3"
    />

    <button
      type="button"
      onClick={
        fetchAttendancePolicies
      }
      disabled={loadingPolicies}
      className="rounded-xl bg-gray-800 px-5 py-3 font-semibold text-white disabled:opacity-50"
    >
      Search
    </button>
  </div>

  <div className="mt-5 space-y-3">
    {loadingPolicies ? (
      <p className="text-sm text-gray-500">
        Loading staff policies...
      </p>
    ) : attendancePolicies.length ===
      0 ? (
      <p className="text-sm text-gray-500">
        No staff attendance policies found.
      </p>
    ) : (
      attendancePolicies.map(
        (policy) => (
          <div
            key={policy.id}
            className="rounded-xl border p-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-900">
                    {policy.staffName ||
                      `Staff #${policy.staffId}`}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      policy.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {policy.isActive
                      ? 'ACTIVE'
                      : 'INACTIVE'}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Punch In
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {policy.punchInRule ===
                      'OFFICE_LOCATION_REQUIRED'
                        ? 'Office Required'
                        : 'Anywhere Allowed'}
                    </p>

                    {policy.punchInRule ===
                      'OFFICE_LOCATION_REQUIRED' && (
                      <p className="mt-1 text-sm text-blue-700">
                        {getLocationName(
                          policy.punchInLocationId,
                        )}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Punch Out
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {policy.punchOutRule ===
                      'OFFICE_LOCATION_REQUIRED'
                        ? 'Office Required'
                        : 'Anywhere Allowed'}
                    </p>

                    {policy.punchOutRule ===
                      'OFFICE_LOCATION_REQUIRED' && (
                      <p className="mt-1 text-sm text-blue-700">
                        {getLocationName(
                          policy.punchOutLocationId,
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {(policy.updatedByName ||
                  policy.createdByName) && (
                  <p className="mt-3 text-xs text-gray-500">
                    Last managed by:{' '}
                    {policy.updatedByName ||
                      policy.createdByName}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    editAttendancePolicy(
                      policy,
                    )
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Edit
                </button>

                {policy.isActive ? (
                  <button
                    type="button"
                    onClick={() =>
                      setAttendancePolicyActive(
                        policy,
                        false,
                      )
                    }
                    disabled={
                      loadingPolicies
                    }
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setAttendancePolicyActive(
                        policy,
                        true,
                      )
                    }
                    disabled={
                      loadingPolicies
                    }
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          </div>
        ),
      )
    )}
  </div>
</div>

      <div
  id="attendance-override-form"
  className="rounded-2xl bg-white p-5 shadow"
>
  <div>
    <h2 className="text-xl font-bold text-gray-800">
      Date-Specific Overrides
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Temporarily replace an employee’s normal
      attendance rule for one specific date.
      Leave a punch rule unchanged when no
      override is required for it.
    </p>
  </div>

  <div className="mt-5 grid gap-4 md:grid-cols-2">
    <div className="relative md:col-span-2">
      <label className="text-sm font-semibold text-gray-700">
        Staff Member *
      </label>

      <input
        value={
          overrideStaffSearch ||
          selectedOverrideStaffName
        }
        onChange={(event) => {
          setOverrideStaffSearch(
            event.target.value,
          );

          setSelectedOverrideStaffName('');

          setOverrideForm(
            (current) => ({
              ...current,
              id: null,
              staffId: '',
            }),
          );

          setShowOverrideStaffOptions(
            true,
          );
        }}
        onFocus={() =>
          setShowOverrideStaffOptions(
            true,
          )
        }
        placeholder="Search by employee name, code, department or branch"
        className="mt-1 w-full rounded-xl border p-3"
      />

      {showOverrideStaffOptions && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow">
          {filteredOverrideStaffMembers.length ===
          0 ? (
            <div className="p-3 text-sm text-gray-500">
              No matching staff found
            </div>
          ) : (
            filteredOverrideStaffMembers.map(
              (staffMember) => (
                <button
                  key={staffMember.id}
                  type="button"
                  onClick={() => {
                    setOverrideForm(
                      (current) => ({
                        ...current,
                        id: null,
                        staffId: String(
                          staffMember.id,
                        ),
                      }),
                    );

                    setSelectedOverrideStaffName(
                      `${
                        staffMember.fullName ||
                        'Unnamed'
                      } ${
                        staffMember.employeeCode
                          ? `(${staffMember.employeeCode})`
                          : ''
                      }`,
                    );

                    setOverrideStaffSearch('');
                    setShowOverrideStaffOptions(
                      false,
                    );
                  }}
                  className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
                >
                  <p className="font-semibold text-gray-800">
                    {staffMember.fullName ||
                      'Unnamed'}

                    {staffMember.employeeCode
                      ? ` (${staffMember.employeeCode})`
                      : ''}
                  </p>

                  <p className="text-xs text-gray-500">
                    {staffMember.department ||
                      '-'}{' '}
                    |{' '}
                    {staffMember.branchName ||
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
      <label className="text-sm font-semibold text-gray-700">
        Override Date *
      </label>

      <input
        type="date"
        value={
          overrideForm.attendanceDate
        }
        onChange={(event) =>
          setOverrideForm(
            (current) => ({
              ...current,
              attendanceDate:
                event.target.value,
            }),
          )
        }
        className="mt-1 w-full rounded-xl border p-3"
      />
    </div>

    <div>
      <label className="text-sm font-semibold text-gray-700">
        Override Status
      </label>

      <select
        value={
          overrideForm.isActive
            ? 'ACTIVE'
            : 'INACTIVE'
        }
        onChange={(event) =>
          setOverrideForm(
            (current) => ({
              ...current,
              isActive:
                event.target.value ===
                'ACTIVE',
            }),
          )
        }
        className="mt-1 w-full rounded-xl border p-3"
      >
        <option value="ACTIVE">
          Active
        </option>

        <option value="INACTIVE">
          Inactive
        </option>
      </select>
    </div>

    <div>
      <label className="text-sm font-semibold text-gray-700">
        Punch-In Override
      </label>

      <select
        value={
          overrideForm.punchInRule
        }
        onChange={(event) => {
          const value =
            event.target
              .value as OverrideRuleValue;

          setOverrideForm(
            (current) => ({
              ...current,
              punchInRule: value,
              punchInLocationId:
                value ===
                'OFFICE_LOCATION_REQUIRED'
                  ? current.punchInLocationId
                  : '',
            }),
          );
        }}
        className="mt-1 w-full rounded-xl border p-3"
      >
        <option value="">
          Keep Permanent Rule
        </option>

        <option value="ANYWHERE_ALLOWED">
          Anywhere Allowed
        </option>

        <option value="OFFICE_LOCATION_REQUIRED">
          Office Location Required
        </option>
      </select>
    </div>

    <div>
      <label className="text-sm font-semibold text-gray-700">
        Punch-In Override Location
      </label>

      <select
        value={
          overrideForm.punchInLocationId
        }
        disabled={
          overrideForm.punchInRule !==
          'OFFICE_LOCATION_REQUIRED'
        }
        onChange={(event) =>
          setOverrideForm(
            (current) => ({
              ...current,
              punchInLocationId:
                event.target.value,
            }),
          )
        }
        className="mt-1 w-full rounded-xl border p-3 disabled:bg-gray-100"
      >
        <option value="">
          Select office location
        </option>

        {activeLocations.map(
          (location) => (
            <option
              key={location.id}
              value={location.id}
            >
              {location.name}
              {location.branchName
                ? ` - ${location.branchName}`
                : ''}
            </option>
          ),
        )}
      </select>
    </div>

    <div>
      <label className="text-sm font-semibold text-gray-700">
        Punch-Out Override
      </label>

      <select
        value={
          overrideForm.punchOutRule
        }
        onChange={(event) => {
          const value =
            event.target
              .value as OverrideRuleValue;

          setOverrideForm(
            (current) => ({
              ...current,
              punchOutRule: value,
              punchOutLocationId:
                value ===
                'OFFICE_LOCATION_REQUIRED'
                  ? current.punchOutLocationId
                  : '',
            }),
          );
        }}
        className="mt-1 w-full rounded-xl border p-3"
      >
        <option value="">
          Keep Permanent Rule
        </option>

        <option value="ANYWHERE_ALLOWED">
          Anywhere Allowed
        </option>

        <option value="OFFICE_LOCATION_REQUIRED">
          Office Location Required
        </option>
      </select>
    </div>

    <div>
      <label className="text-sm font-semibold text-gray-700">
        Punch-Out Override Location
      </label>

      <select
        value={
          overrideForm.punchOutLocationId
        }
        disabled={
          overrideForm.punchOutRule !==
          'OFFICE_LOCATION_REQUIRED'
        }
        onChange={(event) =>
          setOverrideForm(
            (current) => ({
              ...current,
              punchOutLocationId:
                event.target.value,
            }),
          )
        }
        className="mt-1 w-full rounded-xl border p-3 disabled:bg-gray-100"
      >
        <option value="">
          Select office location
        </option>

        {activeLocations.map(
          (location) => (
            <option
              key={location.id}
              value={location.id}
            >
              {location.name}
              {location.branchName
                ? ` - ${location.branchName}`
                : ''}
            </option>
          ),
        )}
      </select>
    </div>

    <div className="md:col-span-2">
      <label className="text-sm font-semibold text-gray-700">
        Override Reason
      </label>

      <textarea
        value={overrideForm.reason}
        onChange={(event) =>
          setOverrideForm(
            (current) => ({
              ...current,
              reason:
                event.target.value,
            }),
          )
        }
        placeholder="Example: Field inspection at customer site"
        className="mt-1 min-h-24 w-full rounded-xl border p-3"
      />
    </div>
  </div>

  <div className="mt-5 flex flex-wrap gap-3">
    <button
      type="button"
      onClick={saveAttendanceOverride}
      disabled={savingOverride}
      className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
    >
      {savingOverride
        ? 'Saving...'
        : overrideForm.id
          ? 'Update Override'
          : 'Save Override'}
    </button>

    <button
      type="button"
      onClick={resetOverrideForm}
      disabled={savingOverride}
      className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
    >
      Clear
    </button>
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Saved Date Overrides
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Review, edit, activate or deactivate
        employee date-specific rules.
      </p>
    </div>

    <button
      type="button"
      onClick={fetchAttendanceOverrides}
      disabled={loadingOverrides}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      Refresh
    </button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
    <input
      value={overrideSearch}
      onChange={(event) =>
        setOverrideSearch(
          event.target.value,
        )
      }
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          fetchAttendanceOverrides();
        }
      }}
      placeholder="Search employee override"
      className="rounded-xl border p-3"
    />

    <input
      type="date"
      value={overrideDateFilter}
      onChange={(event) =>
        setOverrideDateFilter(
          event.target.value,
        )
      }
      className="rounded-xl border p-3"
    />

    <select
      value={overrideActiveFilter}
      onChange={(event) =>
        setOverrideActiveFilter(
          event.target.value,
        )
      }
      className="rounded-xl border p-3"
    >
      <option value="">
        All Statuses
      </option>

      <option value="ACTIVE">
        Active
      </option>

      <option value="INACTIVE">
        Inactive
      </option>
    </select>
  </div>

  <div className="mt-3 flex flex-wrap gap-3">
    <button
      type="button"
      onClick={fetchAttendanceOverrides}
      disabled={loadingOverrides}
      className="rounded-xl bg-gray-800 px-5 py-3 font-semibold text-white disabled:opacity-50"
    >
      Apply Filters
    </button>

    <button
      type="button"
      onClick={() => {
        setOverrideSearch('');
        setOverrideDateFilter('');
        setOverrideActiveFilter('');

        setTimeout(() => {
          fetchAttendanceOverrides();
        }, 0);
      }}
      disabled={loadingOverrides}
      className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
    >
      Clear Filters
    </button>
  </div>

  <div className="mt-5 space-y-3">
    {loadingOverrides ? (
      <p className="text-sm text-gray-500">
        Loading attendance overrides...
      </p>
    ) : attendanceOverrides.length === 0 ? (
      <p className="text-sm text-gray-500">
        No attendance overrides found.
      </p>
    ) : (
      attendanceOverrides.map(
        (override) => (
          <div
            key={override.id}
            className="rounded-xl border p-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-900">
                    {override.staffName ||
                      `Staff #${override.staffId}`}
                  </h3>

                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
                    {override.attendanceDate}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      override.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {override.isActive
                      ? 'ACTIVE'
                      : 'INACTIVE'}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Punch-In Override
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {!override.punchInRule
                        ? 'Permanent Rule Unchanged'
                        : override.punchInRule ===
                            'OFFICE_LOCATION_REQUIRED'
                          ? 'Office Required'
                          : 'Anywhere Allowed'}
                    </p>

                    {override.punchInRule ===
                      'OFFICE_LOCATION_REQUIRED' && (
                      <p className="mt-1 text-sm text-blue-700">
                        {getLocationName(
                          override.punchInLocationId,
                        )}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Punch-Out Override
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {!override.punchOutRule
                        ? 'Permanent Rule Unchanged'
                        : override.punchOutRule ===
                            'OFFICE_LOCATION_REQUIRED'
                          ? 'Office Required'
                          : 'Anywhere Allowed'}
                    </p>

                    {override.punchOutRule ===
                      'OFFICE_LOCATION_REQUIRED' && (
                      <p className="mt-1 text-sm text-blue-700">
                        {getLocationName(
                          override.punchOutLocationId,
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {override.reason && (
                  <div className="mt-3 rounded-xl bg-purple-50 p-3">
                    <p className="text-xs font-semibold uppercase text-purple-700">
                      Reason
                    </p>

                    <p className="mt-1 text-sm text-purple-900">
                      {override.reason}
                    </p>
                  </div>
                )}

                {(override.updatedByName ||
                  override.createdByName) && (
                  <p className="mt-3 text-xs text-gray-500">
                    Last managed by:{' '}
                    {override.updatedByName ||
                      override.createdByName}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    editAttendanceOverride(
                      override,
                    )
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Edit
                </button>

                {override.isActive ? (
                  <button
                    type="button"
                    onClick={() =>
                      setAttendanceOverrideActive(
                        override,
                        false,
                      )
                    }
                    disabled={loadingOverrides}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setAttendanceOverrideActive(
                        override,
                        true,
                      )
                    }
                    disabled={loadingOverrides}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          </div>
        ),
      )
    )}
  </div>
</div>
    </div>
  );
}