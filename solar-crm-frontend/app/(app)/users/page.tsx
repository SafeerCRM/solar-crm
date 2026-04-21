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
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const allRoles = [
  'OWNER',
  'TELECALLING_MANAGER',
  'TELECALLING_ASSISTANT',
  'LEAD_MANAGER',
  'LEAD_EXECUTIVE',
  'MARKETING_HEAD',
  'MEETING_MANAGER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'CUSTOMER',
  'TELECALLER',
];

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
const [search, setSearch] = useState('');
const [roleFilter, setRoleFilter] = useState('');
  const [editingRoles, setEditingRoles] = useState<Record<number, string[]>>({});

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<string[]>([]);

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

      const parsedRoles = Array.isArray(parsedUser?.roles) ? parsedUser.roles : [];
      if (!parsedRoles.includes('OWNER')) {
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
  }, [currentUser]);

  useEffect(() => {
  let temp = [...users];

  if (search) {
    temp = temp.filter((user) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (roleFilter) {
    temp = temp.filter((user) =>
      user.roles?.includes(roleFilter)
    );
  }

  setFilteredUsers(temp);
}, [search, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users`, {
        headers: getAuthHeaders(),
      });

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

      setMessage('Roles updated successfully');
      await fetchUsers();
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
    const ok = window.confirm('Are you sure you want to delete this user?');
    if (!ok) return;

    try {
      setDeletingUserId(userId);
      setMessage('');

      await axios.delete(`${backendUrl}/users/${userId}`, {
        headers: getAuthHeaders(),
      });

      setMessage('User deleted successfully');
      await fetchUsers();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  if (!currentUser) {
    return <div className="p-6">Loading users...</div>;
  }

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

          <div className="md:col-span-2">
            <p className="mb-2 font-medium">Select Roles</p>

            <div className="flex flex-wrap gap-2">
              {allRoles.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => toggleCreateRole(role)}
                  className={`rounded-xl border px-3 py-2 ${
                    roles.includes(role)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
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
        <h2 className="mb-4 text-2xl font-bold">All Users</h2>

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
    {allRoles.map((role) => (
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

                return (
                  <tr key={user.id}>
                    <td className="border p-2">{user.id}</td>
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{user.email}</td>

                    <td className="border p-2">
                      <div className="flex flex-wrap gap-2">
                        {allRoles.map((role) => (
                          <button
                            type="button"
                            key={`${user.id}-${role}`}
                            onClick={() => toggleEditRole(user.id, role)}
                            disabled={isOwnerUser && role !== 'OWNER'}
                            className={`rounded px-2 py-1 text-xs ${
                              safeRoles.includes(role)
                                ? 'bg-gray-300 text-gray-900'
                                : 'bg-gray-100 text-gray-500'
                            } ${isOwnerUser && role !== 'OWNER' ? 'cursor-not-allowed opacity-60' : ''}`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="border p-2">
                      <div className="flex min-w-[160px] flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveRoles(user.id)}
                          disabled={savingRolesId === user.id}
                          className="rounded bg-green-600 px-3 py-2 text-white"
                        >
                          {savingRolesId === user.id ? 'Saving...' : 'Save Roles'}
                        </button>

                        <div className="relative">
                          <input
                            type={showResetPasswordMap[user.id] ? 'text' : 'password'}
                            placeholder="New password"
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
                          disabled={passwordUpdatingId === user.id}
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
                            {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                          </button>
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