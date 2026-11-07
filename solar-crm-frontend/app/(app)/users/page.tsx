'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

type User = {
  id: number;
  name: string;
  email: string;
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
const [showHidden, setShowHidden] = useState(false);
  const [editingRoles, setEditingRoles] = useState<Record<number, string[]>>({});

  const [expandedRoleUserId, setExpandedRoleUserId] =
  useState<number | null>(null);

  const [expandedActionUserId, setExpandedActionUserId] =
  useState<number | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  if (search) {
    temp = temp.filter(
      (user) =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()),
    );
  }

  if (roleFilter) {
    temp = temp.filter((user) => user.roles?.includes(roleFilter));
  }

  setFilteredUsers(temp);
}, [search, roleFilter, users, showHidden]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
  `${backendUrl}/users?includeHidden=${showHidden}`,
  {
    headers: getAuthHeaders(),
  },
);

      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(data);
      setFilteredUsers(data);

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

    if (!name.trim() || !email.trim() || !password.trim() || roles.length === 0) {
      setMessage('Please fill all fields and select at least one role');
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
          roles,
        },
        { headers: getAuthHeaders() },
      );

      setMessage('User created successfully');
      setName('');
      setEmail('');
      setPassword('');
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

          <div className="relative md:col-span-2">
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
          {role.replace(/_/g, ' ')}
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
              {role.replace(/_/g, ' ')}
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
    onClick={() => setShowHidden((prev) => !prev)}
    className="rounded bg-indigo-600 px-4 py-2 text-white"
  >
    {showHidden ? 'View Active Users' : 'View Hidden Users'}
  </button>
</div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row">
  <input
    type="text"
    placeholder="Search by name or email..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full rounded-xl border px-4 py-3 md:w-1/2"
  />

  <select
    value={roleFilter}
    onChange={(e) => setRoleFilter(e.target.value)}
    className="w-full rounded-xl border px-4 py-3 md:w-1/4"
  >
    <option value="">All Roles</option>
    {allRoles
  .filter((role) => isCurrentOwner || role !== 'OWNER')
  .map((role) => (
      <option key={role} value={role}>
        {role}
      </option>
    ))}
  </select>
</div>

        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead>
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
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
            {role.replace(/_/g, ' ')}
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
                {role.replace(/_/g, ' ')}
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
      onClick={() =>
        setExpandedActionUserId((prev) =>
          prev === user.id ? null : user.id
        )
      }
      aria-expanded={expandedActionUserId === user.id}
      className="rounded-lg border-2 border-slate-400 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-blue-500 hover:bg-blue-50"
    >
      {expandedActionUserId === user.id
        ? 'Close Actions'
        : 'Actions'}
    </button>

    {expandedActionUserId === user.id && (
      <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                        

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
                  <td colSpan={5} className="border p-4 text-center text-gray-500">
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