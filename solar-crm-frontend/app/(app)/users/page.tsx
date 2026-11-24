'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import { getRoleDisplayName } from '@/lib/roleDisplay';

type User = {
  id: number;
  name: string;
  email: string;
  mobileNumber?: string | null;
  aadhaarNumber?: string | null;
  servingCity?: string | null;
  roles?: string[] | null;
  createdAt?: string;

  isHidden?: boolean;
  hiddenReason?: string;
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const allRoles = [
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
  'LEGAL_ADVISOR',
'TRADING_MANAGER',
'TRADING_HEAD',
'FRANCHISE_HEAD',
'FRANCHISE_MANAGER',
'SOLAR_MITRA_ASSISTANT',
'OFFICE_ASSISTANT',

'PROJECT_CONTRACTOR',

  'CUSTOMER',
  'SOLAR_FRANCHISE',
  'SOLAR_STORE',
];


export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
const [search, setSearch] = useState('');
const [roleFilter, setRoleFilter] = useState('');
const [cityFilter, setCityFilter] = useState('');
const [citySearch, setCitySearch] = useState('');
const [showCityDropdown, setShowCityDropdown] = useState(false);
const [showHidden, setShowHidden] = useState(false);
  const [editingRoles, setEditingRoles] = useState<Record<number, string[]>>({});

  const [expandedRoleUserId, setExpandedRoleUserId] =
  useState<number | null>(null);

  const [expandedActionUserId, setExpandedActionUserId] =
  useState<number | null>(null);

  const [editingDetailsUserId, setEditingDetailsUserId] =
  useState<number | null>(null);

const [editMobileNumber, setEditMobileNumber] = useState('');
const [editAadhaarNumber, setEditAadhaarNumber] = useState('');
const [editServingCity, setEditServingCity] = useState('');

const [savingDetailsId, setSavingDetailsId] =
  useState<number | null>(null);

const [detailsMessage, setDetailsMessage] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
const [aadhaarNumber, setAadhaarNumber] = useState('');
const [servingCity, setServingCity] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [showCreateRoles, setShowCreateRoles] = useState(false);

  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [resetPasswordMap, setResetPasswordMap] = useState<Record<number, string>>({});
  const [showResetPasswordMap, setShowResetPasswordMap] = useState<Record<number, boolean>>({});

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordUpdatingId, setPasswordUpdatingId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [savingRolesId, setSavingRolesId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token =
      localStorage.getItem('token') || localStorage.getItem('access_token');

    if (!storedUser || !token) {
      window.location.href = '/';
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);

      const parsedRoles = Array.isArray(parsedUser?.roles)
  ? parsedUser.roles
  : [];

if (
  !parsedRoles.some((role: string) =>
    ['OWNER', 'HR_MANAGER'].includes(role)
  )
) {
  window.location.href = '/dashboard';
  return;
}
    } catch {
      localStorage.clear();
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
  if (currentUser) {
    fetchUsers();
  }
}, [currentUser, showHidden]);

  useEffect(() => {
  let temp = [...users];

  // Solar Mitra-only accounts are managed in the Solar Mitra module,
  // not in the regular staff Users page.
  temp = temp.filter((user) => {
    const userRoles = Array.isArray(user.roles) ? user.roles : [];

    return !(
      userRoles.length === 1 &&
      userRoles[0] === 'SOLAR_MITRA'
    );
  });

  if (showHidden) {
    temp = temp.filter((user) => user.isHidden === true);
  } else {
    temp = temp.filter((user) => user.isHidden !== true);
  }

 const searchValue = search.trim().toLowerCase();

if (searchValue) {
  const numericSearch = searchValue.replace(/[\s()+-]/g, '');

  temp = temp.filter((user) => {
    const matchesText =
      user.name?.toLowerCase().includes(searchValue) ||
      user.email?.toLowerCase().includes(searchValue);

    const matchesNumber =
      /^\d+$/.test(numericSearch) &&
      (
        user.mobileNumber?.includes(numericSearch) ||
        user.aadhaarNumber?.includes(numericSearch) ||
        (
          numericSearch.startsWith('91') &&
          numericSearch.length === 12 &&
          user.mobileNumber === numericSearch.slice(2)
        ) ||
        (
          numericSearch.startsWith('0') &&
          numericSearch.length === 11 &&
          user.mobileNumber === numericSearch.slice(1)
        )
      );

    return matchesText || matchesNumber;
  });
}

if (roleFilter) {
  temp = temp.filter((user) =>
    user.roles?.includes(roleFilter),
  );
}

if (cityFilter) {
  temp = temp.filter(
    (user) =>
      user.servingCity?.trim().toUpperCase() === cityFilter,
  );
}

setFilteredUsers(temp);
}, [search, roleFilter, cityFilter, users, showHidden]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
  `${backendUrl}/users/management?includeHidden=${showHidden}`,
  {
    headers: getAuthHeaders(),
  },
);

      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(data);

      const roleMap: Record<number, string[]> = {};
      data.forEach((u: User) => {
        roleMap[u.id] = Array.isArray(u.roles) ? u.roles : [];
      });
      setEditingRoles(roleMap);
    } catch (error: any) {
      console.error(error);
      setUsers([]);
      setMessage(error?.response?.data?.message || 'Failed to fetch users');
    }
  };

  const toggleCreateRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role],
    );
  };

  const toggleEditRole = (userId: number, role: string) => {
    if (
  !currentUser?.roles?.includes('OWNER') &&
  role === 'OWNER'
) {
  return;
}

const targetUser = users.find((u) => u.id === userId);

if (
  !currentUser?.roles?.includes('OWNER') &&
  targetUser?.roles?.includes('OWNER')
) {
  return;
}
    setEditingRoles((prev) => {
      const current = prev[userId] || [];
      const userRow = users.find((u) => u.id === userId);
      const userSafeRoles = Array.isArray(userRow?.roles) ? userRow!.roles! : [];
      const isOwnerUser = userSafeRoles.includes('OWNER');

      if (isOwnerUser && role !== 'OWNER') {
        return prev;
      }

      return {
        ...prev,
        [userId]: current.includes(role)
          ? current.filter((r) => r !== role)
          : [...current, role],
      };
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (
  !name.trim() ||
  !email.trim() ||
  !password.trim() ||
  !mobileNumber.trim() ||
  !servingCity.trim() ||
  roles.length === 0
) {
  setMessage(
    'Please fill all required fields and select at least one role',
  );
  return;
}

if (
  aadhaarNumber.trim() &&
  !/^\d{12}$/.test(aadhaarNumber.trim())
) {
  setMessage('Aadhaar number must contain exactly 12 digits');
  return;
}

    try {
      setLoading(true);

      await axios.post(
        `${backendUrl}/users/create-role`,
        {
  name: name.trim(),
  email: email.trim(),
  password: password.trim(),
  mobileNumber: mobileNumber.trim(),
  aadhaarNumber: aadhaarNumber.trim() || null,
  servingCity: servingCity.trim().toUpperCase(),
  roles,
},
        { headers: getAuthHeaders() },
      );

      setMessage('User created successfully');
      setName('');
setEmail('');
setPassword('');
setMobileNumber('');
setAadhaarNumber('');
setServingCity('');
setRoles([]);
setShowCreateRoles(false);
await fetchUsers();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDetails = (user: User) => {
  setEditingDetailsUserId(user.id);
  setEditMobileNumber(user.mobileNumber || '');
  setEditAadhaarNumber(user.aadhaarNumber || '');
  setEditServingCity(user.servingCity || '');
  setDetailsMessage('');
};

const handleCancelEditDetails = () => {
  setEditingDetailsUserId(null);
  setEditMobileNumber('');
  setEditAadhaarNumber('');
  setEditServingCity('');
  setDetailsMessage('');
};

const handleSaveUserDetails = async (userId: number) => {
  setDetailsMessage('');

  const originalUser = users.find(
    (user) => user.id === userId,
  );

  if (!originalUser) {
    setDetailsMessage('User not found');
    return;
  }

  const mobile = editMobileNumber.trim();
  const aadhaar = editAadhaarNumber.trim();
  const city = editServingCity.trim().toUpperCase();

  if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
    setDetailsMessage(
      'Aadhaar number must contain exactly 12 digits',
    );
    return;
  }

  const payload: {
    mobileNumber?: string;
    aadhaarNumber?: string | null;
    servingCity?: string;
  } = {};

  if (mobile !== (originalUser.mobileNumber || '')) {
    if (!mobile) {
      setDetailsMessage('Mobile number cannot be empty');
      return;
    }

    payload.mobileNumber = mobile;
  }

  if (aadhaar !== (originalUser.aadhaarNumber || '')) {
    payload.aadhaarNumber = aadhaar || null;
  }

  if (city !== (originalUser.servingCity || '')) {
    if (!city) {
      setDetailsMessage(
        'City / Serving Area cannot be empty',
      );
      return;
    }

    payload.servingCity = city;
  }

  if (Object.keys(payload).length === 0) {
    setDetailsMessage('No changes to save');
    return;
  }

  try {
    setSavingDetailsId(userId);

    await axios.patch(
      `${backendUrl}/users/${userId}/details`,
      payload,
      { headers: getAuthHeaders() },
    );

    await fetchUsers();

    handleCancelEditDetails();

    setMessage('User details updated successfully');
  } catch (error: any) {
    const apiMessage = error?.response?.data?.message;

    setDetailsMessage(
      Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : apiMessage || 'Failed to update user details',
    );
  } finally {
    setSavingDetailsId(null);
  }
};

  const handleSaveRoles = async (userId: number) => {
    try {
      setSavingRolesId(userId);
      setMessage('');

      await axios.patch(
        `${backendUrl}/users/${userId}/roles`,
        { roles: editingRoles[userId] || [] },
        { headers: getAuthHeaders() },
      );

      await fetchUsers();

setMessage('Roles updated successfully');
setExpandedRoleUserId(null);
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to update roles');
    } finally {
      setSavingRolesId(null);
    }
  };

  const handlePasswordChange = async (userId: number) => {
    const newPassword = resetPasswordMap[userId];

    if (!newPassword || newPassword.trim().length < 4) {
      setMessage('New password must be at least 4 characters');
      return;
    }

    try {
      setPasswordUpdatingId(userId);
      setMessage('');

      await axios.patch(
        `${backendUrl}/users/${userId}/password`,
        { password: newPassword.trim() },
        { headers: getAuthHeaders() },
      );

      setMessage('Password updated successfully');
      setResetPasswordMap((prev) => ({
        ...prev,
        [userId]: '',
      }));
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
  const reason =
    window.prompt('Reason for hiding this user?')?.trim() || '';

  if (!reason) {
    return;
  }

  try {
    setDeletingUserId(userId);
    setMessage('');

    await axios.delete(`${backendUrl}/users/${userId}`, {
      headers: getAuthHeaders(),
      data: {
        reason,
      },
    });

    setMessage('User hidden successfully');
    await fetchUsers();
  } catch (error: any) {
    console.error(error);
    setMessage(error?.response?.data?.message || 'Failed to hide user');
  } finally {
    setDeletingUserId(null);
  }
};

const handleRestoreUser = async (userId: number) => {
  const reason =
    window.prompt('Reason for restoring this user?')?.trim() || '';

  if (!reason) {
    return;
  }

  try {
    await axios.patch(
      `${backendUrl}/users/${userId}/restore`,
      {
        reason,
      },
      {
        headers: getAuthHeaders(),
      },
    );

    setMessage('User restored successfully');
    await fetchUsers();
  } catch (error: any) {
    console.error(error);
    setMessage(error?.response?.data?.message || 'Failed to restore user');
  }
};

  if (!currentUser) {
    return <div className="p-6">Loading users...</div>;
  }

  const isCurrentOwner =
  Array.isArray(currentUser.roles) &&
  currentUser.roles.includes('OWNER');

  const availableCities = Array.from(
  new Set(
    users
      .filter((user) => {
        const userRoles = Array.isArray(user.roles)
          ? user.roles
          : [];

        const isSolarMitraOnly =
          userRoles.length === 1 &&
          userRoles[0] === 'SOLAR_MITRA';

        return (
          !isSolarMitraOnly &&
          (showHidden
            ? user.isHidden === true
            : user.isHidden !== true)
        );
      })
      .map((user) =>
        user.servingCity?.trim().toUpperCase(),
      )
      .filter((city): city is string => Boolean(city)),
  ),
).sort((a, b) => a.localeCompare(b));

const matchingCities = availableCities.filter((city) =>
  city.includes(citySearch.trim().toUpperCase()),
);

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-bold">Users Management</h1>

        <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border px-4 py-3"
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border px-4 py-3"
          />

          <input
  type="tel"
  inputMode="tel"
  placeholder="Mobile Number *"
  value={mobileNumber}
  onChange={(e) => setMobileNumber(e.target.value)}
  autoComplete="off"
  required
  className="w-full rounded-xl border px-4 py-3"
/>

<input
  type="text"
  inputMode="numeric"
  placeholder="Aadhaar Number (12 digits)"
  value={aadhaarNumber}
  onChange={(e) =>
    setAadhaarNumber(
      e.target.value.replace(/\D/g, '').slice(0, 12),
    )
  }
  maxLength={12}
  autoComplete="off"
  className="w-full rounded-xl border px-4 py-3"
/>

<input
  type="text"
  placeholder="City / Serving Area *"
  value={servingCity}
  onChange={(e) =>
    setServingCity(e.target.value.toUpperCase())
  }
  maxLength={150}
  required
  className="w-full rounded-xl border px-4 py-3 uppercase"
/>

          <div className="relative">
            <input
              type={showCreatePassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 pr-20"
            />
            <button
              type="button"
              onClick={() => setShowCreatePassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-gray-200 px-3 py-1 text-xs"
            >
              {showCreatePassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="md:col-span-2 space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="font-medium">Select Roles</p>

    <button
      type="button"
      onClick={() => setShowCreateRoles((prev) => !prev)}
      aria-expanded={showCreateRoles}
      className="rounded-lg border-2 border-blue-400 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-600 hover:bg-blue-100"
    >
      {showCreateRoles ? 'Close Role Selection' : '+ Select Roles'}
    </button>
  </div>

  {/* Show only selected roles */}
  <div className="flex flex-wrap gap-2">
    {roles.length > 0 ? (
      roles.map((role) => (
        <span
          key={role}
          className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
        >
          {getRoleDisplayName(role)}
        </span>
      ))
    ) : (
      <p className="text-sm text-gray-400">
        No roles selected
      </p>
    )}
  </div>

  {/* Expand available roles only when requested */}
  {showCreateRoles && (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
        {allRoles
          .filter((role) => isCurrentOwner || role !== 'OWNER')
          .map((role) => (
            <button
              type="button"
              key={role}
              onClick={() => toggleCreateRole(role)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                roles.includes(role)
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {getRoleDisplayName(role)}
            </button>
          ))}
      </div>
    </div>
  )}
</div>

          {message && (
            <p className="md:col-span-2 text-sm text-blue-600">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-6 py-3 text-white md:col-span-2"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
  <h2 className="text-2xl font-bold">
    {showHidden ? 'Hidden Users' : 'All Users'}
  </h2>

  <button
    type="button"
    onClick={() => {
  setShowHidden((prev) => !prev);
  setCityFilter('');
  setCitySearch('');
  setShowCityDropdown(false);
}}
    className="rounded bg-indigo-600 px-4 py-2 text-white"
  >
    {showHidden ? 'View Active Users' : 'View Hidden Users'}
  </button>
</div>

       <div className="mb-4 space-y-3">
  <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">

    {/* Combined user search */}
    <input
      type="text"
      placeholder="Search name, email, mobile or Aadhaar..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      autoComplete="off"
      className="w-full rounded-xl border px-4 py-3 text-sm lg:col-span-2"
    />

    {/* Existing role filter */}
    <select
      value={roleFilter}
      onChange={(e) => setRoleFilter(e.target.value)}
      className="w-full rounded-xl border px-4 py-3 text-sm"
    >
      <option value="">All Roles</option>

      {allRoles
        .filter(
          (role) => isCurrentOwner || role !== 'OWNER',
        )
        .map((role) => (
          <option key={role} value={role}>
            {getRoleDisplayName(role)}
          </option>
        ))}
    </select>

    {/* Searchable city filter */}
    <div className="relative">
      <button
        type="button"
        aria-expanded={showCityDropdown}
        onClick={() => {
          setShowCityDropdown((prev) => !prev);
          setCitySearch('');
        }}
        className="flex w-full items-center justify-between gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-left text-sm font-medium hover:border-blue-400"
      >
        <span className="truncate">
          {cityFilter || 'All Cities / Areas'}
        </span>

        <span className="shrink-0 text-gray-500">
          {showCityDropdown ? '▴' : '▾'}
        </span>
      </button>

      {showCityDropdown && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => {
              setShowCityDropdown(false);
              setCitySearch('');
            }}
          />

          <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-xl border border-gray-300 bg-white p-2 shadow-xl">

            <input
              type="text"
              placeholder="Search city / area..."
              value={citySearch}
              autoFocus
              onChange={(e) =>
                setCitySearch(e.target.value.toUpperCase())
              }
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowCityDropdown(false);
                  setCitySearch('');
                }
              }}
              className="mb-2 w-full rounded-lg border px-3 py-2 text-sm uppercase"
            />

            <div className="px-2 pb-2 text-xs text-gray-500">
              {matchingCities.length} cities / areas available
            </div>

            <div className="max-h-52 space-y-1 overflow-y-auto">

              <button
                type="button"
                onClick={() => {
                  setCityFilter('');
                  setCitySearch('');
                  setShowCityDropdown(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  !cityFilter
                    ? 'bg-blue-100 font-semibold text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                All Cities / Areas
              </button>

              {matchingCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setCityFilter(city);
                    setCitySearch('');
                    setShowCityDropdown(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    cityFilter === city
                      ? 'bg-blue-100 font-semibold text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="break-all">{city}</span>

                  {cityFilter === city && (
                    <span className="ml-2">✓</span>
                  )}
                </button>
              ))}

              {matchingCities.length === 0 && (
                <p className="px-3 py-3 text-center text-xs text-gray-500">
                  No matching cities / areas
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  </div>

  {/* Filter summary */}
  <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-sm font-medium text-gray-600">
      Showing {filteredUsers.length} users
    </p>

    {(search || roleFilter || cityFilter) && (
      <button
        type="button"
        onClick={() => {
          setSearch('');
          setRoleFilter('');
          setCityFilter('');
          setCitySearch('');
          setShowCityDropdown(false);
        }}
        className="rounded-lg border-2 border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
      >
        Clear Filters
      </button>
    )}
  </div>
</div>

{message && (
  <div
    role="status"
    className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700"
  >
    {message}
  </div>
)}

        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead>
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
<th className="border p-2">Mobile Number</th>
<th className="border p-2">Aadhaar Number</th>
<th className="border p-2">City / Serving Area</th>
<th className="border p-2">Roles</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => {
                const safeRoles = editingRoles[user.id] || [];
const originalRoles = Array.isArray(user.roles) ? user.roles : [];
const isOwnerUser = originalRoles.includes('OWNER');

const canManageThisUser = isCurrentOwner || !isOwnerUser;

                return (
                  <tr key={user.id}>
                    <td className="border p-2">{user.id}</td>
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{user.email}</td>

                    <td className="whitespace-nowrap border p-2">
  {user.mobileNumber || (
    <span className="text-xs text-gray-400">
      Not Added
    </span>
  )}
</td>

<td className="whitespace-nowrap border p-2">
  {user.aadhaarNumber || (
    <span className="text-xs text-gray-400">
      Not Added
    </span>
  )}
</td>

<td className="border p-2">
  {user.servingCity ? (
    <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {user.servingCity}
    </span>
  ) : (
    <span className="text-xs text-gray-400">
      Not Added
    </span>
  )}
</td>

                    <td className="border p-2 align-top">
  <div className="min-w-[180px] space-y-3">

    {/* Show only assigned roles by default */}
    <div className="flex flex-wrap gap-1.5">
      {safeRoles.length > 0 ? (
        safeRoles.map((role) => (
          <span
            key={role}
            className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
          >
            {getRoleDisplayName(role)}
          </span>
        ))
      ) : (
        <span className="text-xs text-gray-400">
          No roles assigned
        </span>
      )}
    </div>

    {/* Expand or collapse role editor */}
    {canManageThisUser && (
      <button
        type="button"
        onClick={() => {
          if (expandedRoleUserId === user.id) {
            setEditingRoles((prev) => ({
              ...prev,
              [user.id]: [...originalRoles],
            }));
            setExpandedRoleUserId(null);
          } else {
            setExpandedRoleUserId(user.id);
          }
        }}
        className="rounded-lg border-2 border-blue-400 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-600 hover:bg-blue-100"
      >
        {expandedRoleUserId === user.id
          ? 'Cancel Editing'
          : 'Edit Roles'}
      </button>
    )}

    {/* Available roles shown only when editing */}
    {expandedRoleUserId === user.id && canManageThisUser && (
      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3">

        <p className="text-xs font-semibold text-gray-600">
          Select Roles
        </p>

        <div className="flex max-h-52 flex-wrap gap-1.5 overflow-y-auto">
          {allRoles
            .filter((role) => isCurrentOwner || role !== 'OWNER')
            .map((role) => (
              <button
                key={`${user.id}-${role}`}
                type="button"
                onClick={() => toggleEditRole(user.id, role)}
                disabled={isOwnerUser && role !== 'OWNER'}
                className={`rounded-lg border px-2 py-1.5 text-xs ${
                  safeRoles.includes(role)
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
                } ${
                  isOwnerUser && role !== 'OWNER'
                    ? 'cursor-not-allowed opacity-50'
                    : ''
                }`}
              >
                {getRoleDisplayName(role)}
              </button>
            ))}
        </div>

        <button
          type="button"
          onClick={async () => {
            await handleSaveRoles(user.id);
          }}
          disabled={savingRolesId === user.id}
          className="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
        >
          {savingRolesId === user.id
            ? 'Saving...'
            : 'Save Roles'}
        </button>

      </div>
    )}
  </div>
</td>

                    <td className="border p-2 align-top">
  <div className="flex min-w-[160px] flex-col gap-2">

    <button
      type="button"
      onClick={() => {
  handleCancelEditDetails();

  setExpandedActionUserId((prev) =>
    prev === user.id ? null : user.id,
  );
}}
disabled={savingDetailsId !== null}
      aria-expanded={expandedActionUserId === user.id}
      className="rounded-lg border-2 border-slate-400 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-blue-500 hover:bg-blue-50"
    >
      {expandedActionUserId === user.id
        ? 'Close Actions'
        : 'Actions'}
    </button>

    {expandedActionUserId === user.id && (
      <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">

        {canManageThisUser && (
  <>
    <button
      type="button"
      disabled={savingDetailsId !== null}
      onClick={() => {
        if (editingDetailsUserId === user.id) {
          handleCancelEditDetails();
        } else {
          handleOpenEditDetails(user);
        }
      }}
      className="rounded-lg border-2 border-blue-400 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:border-blue-600 hover:bg-blue-100 disabled:opacity-50"
    >
      {editingDetailsUserId === user.id
        ? 'Close Edit Details'
        : 'Edit Details'}
    </button>

    {editingDetailsUserId === user.id && (
      <div className="min-w-[220px] space-y-3 rounded-xl border border-blue-200 bg-white p-3">

        <p className="text-xs font-semibold text-gray-700">
          Edit User Details
        </p>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">
            Mobile Number
          </label>

          <input
            type="tel"
            inputMode="tel"
            value={editMobileNumber}
            onChange={(e) =>
              setEditMobileNumber(e.target.value)
            }
            placeholder="Enter mobile number"
            autoComplete="off"
            disabled={savingDetailsId === user.id}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">
            Aadhaar Number
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={editAadhaarNumber}
            onChange={(e) =>
              setEditAadhaarNumber(
                e.target.value.replace(/\D/g, '').slice(0, 12),
              )
            }
            maxLength={12}
            placeholder="12-digit Aadhaar"
            autoComplete="off"
            disabled={savingDetailsId === user.id}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">
            City / Serving Area
          </label>

          <input
            type="text"
            value={editServingCity}
            onChange={(e) =>
              setEditServingCity(
                e.target.value.toUpperCase(),
              )
            }
            maxLength={150}
            placeholder="Enter city / area"
            disabled={savingDetailsId === user.id}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase"
          />
        </div>

        {detailsMessage && (
          <p className="break-words text-xs font-medium text-red-600">
            {detailsMessage}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              handleSaveUserDetails(user.id)
            }
            disabled={savingDetailsId === user.id}
            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {savingDetailsId === user.id
              ? 'Saving...'
              : 'Save Details'}
          </button>

          <button
            type="button"
            onClick={handleCancelEditDetails}
            disabled={savingDetailsId === user.id}
            className="rounded-lg border-2 border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )}

    <div className="my-1 border-t border-gray-200" />
  </>
)}
                        

                        <div className="relative">
                          <input
                            type={showResetPasswordMap[user.id] ? 'text' : 'password'}
                            placeholder="New password"
                            disabled={!canManageThisUser}
                            value={resetPasswordMap[user.id] || ''}
                            onChange={(e) =>
                              setResetPasswordMap((prev) => ({
                                ...prev,
                                [user.id]: e.target.value,
                              }))
                            }
                            className="w-full rounded border px-3 py-2 pr-16"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowResetPasswordMap((prev) => ({
                                ...prev,
                                [user.id]: !prev[user.id],
                              }))
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-gray-200 px-2 py-1 text-xs"
                          >
                            {showResetPasswordMap[user.id] ? 'Hide' : 'Show'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePasswordChange(user.id)}
                          disabled={
  !canManageThisUser ||
  passwordUpdatingId === user.id
}
                          className="rounded bg-black px-3 py-2 text-white"
                        >
                          {passwordUpdatingId === user.id
                            ? 'Updating...'
                            : 'Update Password'}
                        </button>

                        {!isOwnerUser && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                            className="rounded bg-red-600 px-3 py-2 text-white"
                          >
                            {deletingUserId === user.id ? 'Hiding...' : 'Hide User'}
                          </button>
                        )}

                        {showHidden && (
  <button
    type="button"
    onClick={() => handleRestoreUser(user.id)}
    className="rounded bg-blue-600 px-3 py-2 text-white"
  >
    Restore User
  </button>
)}
      </div>
    )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="border p-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}