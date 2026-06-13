'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type UserOption = {
  id: number;
  name?: string;
  email?: string;
  roles?: string[];
};

export default function SearchableUserSelect({
  label,
  selectedUserId,
  selectedUserName,
  selectedUserRole,
  onSelect,
}: {
  label: string;
  selectedUserId?: string;
  selectedUserName?: string;
  selectedUserRole?: string;
  onSelect: (user: {
    id: number;
    name: string;
    role: string;
  }) => void;
}) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.get(`${API_BASE_URL}/users`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const text = search.toLowerCase().trim();

    if (!text) return users.slice(0, 20);

    return users
      .filter((user) => {
        const roleText = Array.isArray(user.roles)
          ? user.roles.join(' ')
          : '';

        return `${user.name || ''} ${user.email || ''} ${roleText}`
          .toLowerCase()
          .includes(text);
      })
      .slice(0, 20);
  }, [search, users]);

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={
          selectedUserName
            ? `${selectedUserName} (${selectedUserRole || '-'})`
            : 'Search user by name, email or role'
        }
        className="w-full rounded-xl border p-3"
      />

      {selectedUserName && (
        <p className="mt-1 text-xs text-gray-500">
          Current: {selectedUserName} ({selectedUserRole || '-'})
        </p>
      )}

      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
          {filteredUsers.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">
              No users found
            </p>
          ) : (
            filteredUsers.map((user) => {
              const role = Array.isArray(user.roles)
                ? user.roles.join(', ')
                : '';

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    onSelect({
                      id: user.id,
                      name: user.name || user.email || `User #${user.id}`,
                      role,
                    });

                    setSearch('');
                    setOpen(false);
                  }}
                  className="block w-full border-b px-3 py-2 text-left hover:bg-blue-50"
                >
                  <p className="text-sm font-semibold text-gray-800">
                    {user.name || `User #${user.id}`}
                  </p>

                  <p className="text-xs text-gray-500">
                    {user.email || '-'} · {role || 'No role'}
                  </p>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}