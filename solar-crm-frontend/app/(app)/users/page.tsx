'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

type User = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  createdAt?: string;
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const allRoles = [
  'OWNER',
  'TELECALLING_MANAGER',
  'LEAD_MANAGER',
  'MEETING_MANAGER',
  'PROJECT_MANAGER',
  'CUSTOMER',
  'TELECALLER',
];

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      window.location.href = '/';
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);

      if (!parsedUser.roles?.includes('OWNER')) {
        window.location.href = '/dashboard';
        return;
      }
    } catch {
      localStorage.clear();
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    if (currentUser?.roles?.includes('OWNER')) {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users`, {
        headers: getAuthHeaders(),
      });

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setMessage('Failed to fetch users');
    }
  };

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!name || !email || !password || roles.length === 0) {
      setMessage('Please fill all fields and select at least one role');
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${backendUrl}/users/create-role`,
        {
          name,
          email,
          password,
          roles,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      setMessage('User created successfully');
      setName('');
      setEmail('');
      setPassword('');
      setRoles([]);

      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setMessage(error?.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
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
        { password: newPassword },
        { headers: getAuthHeaders() }
      );

      setMessage('Password updated successfully');
      setResetPasswordMap((prev) => ({
        ...prev,
        [userId]: '',
      }));
    } catch (error: any) {
      console.error('Failed to update password:', error);
      setMessage(error?.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordUpdatingId(null);
    }
  };

  if (!currentUser) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Users Management</h1>

        <form onSubmit={handleCreateUser} className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-gray-400 px-4 py-3"
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-gray-400 px-4 py-3"
          />

          <div className="relative">
            <input
              type={showCreatePassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-400 px-4 py-3 pr-20"
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
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-2 rounded-xl border ${
                    roles.includes(role)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            {message && (
              <p
                className={`mb-4 text-sm ${
                  message.toLowerCase().includes('success')
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">All Users</h2>

        {users.length === 0 ? (
          <p>No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2 text-left">ID</th>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">Roles</th>
                  <th className="border p-2 text-left">Created At</th>
                  <th className="border p-2 text-left">Change Password</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="border p-2">{user.id}</td>
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{user.email}</td>
                    <td className="border p-2">
                      {user.roles?.join(', ') || '-'}
                    </td>
                    <td className="border p-2">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleString()
                        : '-'}
                    </td>
                    <td className="border p-2 min-w-[260px]">
                      <div className="flex flex-col gap-2">
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
                            className="w-full rounded border px-3 py-2 pr-20"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowResetPasswordMap((prev) => ({
                                ...prev,
                                [user.id]: !prev[user.id],
                              }))
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-gray-200 px-3 py-1 text-xs"
                          >
                            {showResetPasswordMap[user.id] ? 'Hide' : 'Show'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePasswordChange(user.id)}
                          disabled={passwordUpdatingId === user.id}
                          className="rounded bg-black px-4 py-2 text-white"
                        >
                          {passwordUpdatingId === user.id
                            ? 'Updating...'
                            : 'Update Password'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}