'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

type User = {
  id: number;
  name: string;
  email: string;
  role: 'OWNER' | 'LEAD_MANAGER' | 'TELECALLER' | 'PROJECT_MANAGER';
  createdAt?: string;
};

const backendUrl = 'https://solar-crm-backend-38n0.onrender.com';

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'OWNER' | 'LEAD_MANAGER' | 'TELECALLER' | 'PROJECT_MANAGER'>('TELECALLER');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

      if (parsedUser.role !== 'OWNER') {
        window.location.href = '/dashboard';
        return;
      }
    } catch {
      localStorage.clear();
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'OWNER') {
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!name || !email || !password || !role) {
      setMessage('Please fill all fields');
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
          role,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      setMessage('User created successfully');
      setName('');
      setEmail('');
      setPassword('');
      setRole('TELECALLER');

      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setMessage(error?.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
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

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-gray-400 px-4 py-3"
          />

          <select
            value={role}
            onChange={(e) =>
              setRole(
                e.target.value as
                  | 'OWNER'
                  | 'LEAD_MANAGER'
                  | 'TELECALLER'
                  | 'PROJECT_MANAGER'
              )
            }
            className="rounded-xl border border-gray-400 px-4 py-3"
          >
            <option value="OWNER">OWNER</option>
            <option value="LEAD_MANAGER">LEAD_MANAGER</option>
            <option value="TELECALLER">TELECALLER</option>
            <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
          </select>

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
                  <th className="border p-2 text-left">Role</th>
                  <th className="border p-2 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="border p-2">{user.id}</td>
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{user.email}</td>
                    <td className="border p-2">{user.role}</td>
                    <td className="border p-2">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleString()
                        : '-'}
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