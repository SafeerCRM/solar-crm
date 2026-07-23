'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';

import { getAuthHeaders } from '@/lib/authHeaders';
import {
  LiveLocationSession,
  LiveLocationUser,
} from '@/components/live-location/LiveLocationSessionCard';

import ActiveLiveLocationSessions from '@/components/live-location/ActiveLiveLocationSessions';
import LiveLocationRequestForm from '@/components/live-location/LiveLocationRequestForm';
import LiveLocationSessionDrawer from '@/components/live-location/LiveLocationSessionDrawer';
import LiveLocationRouteModal from '@/components/live-location/LiveLocationRouteModal';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type StoredUser = LiveLocationUser;

type LocationRequestSession =
  LiveLocationSession;

type MessageState = {
  type: 'SUCCESS' | 'ERROR';
  text: string;
} | null;

function getUserRoles(
  user: StoredUser | null,
): string[] {
  if (!user) {
    return [];
  }

  const roles = Array.isArray(user.roles)
    ? user.roles
    : [];

  if (
    typeof user.role === 'string' &&
    user.role.trim()
  ) {
    roles.push(user.role);
  }

  return Array.from(
    new Set(
      roles
        .map((role) =>
          String(role || '')
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean),
    ),
  );
}

function getAxiosErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      error.response?.data?.message;

    if (Array.isArray(responseMessage)) {
      return responseMessage.join(', ');
    }

    if (
      typeof responseMessage === 'string' &&
      responseMessage.trim()
    ) {
      return responseMessage;
    }

    if (
      typeof error.message === 'string' &&
      error.message.trim()
    ) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to create live location request';
}

function formatRoles(
  roles?: string[] | null,
): string {
  if (!Array.isArray(roles) || roles.length === 0) {
    return 'No role assigned';
  }

  return roles
    .map((role) =>
      String(role)
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (character) =>
          character.toUpperCase(),
        ),
    )
    .join(', ');
}


export default function LiveLocationOwnerPage() {
  const [currentUser, setCurrentUser] =
    useState<StoredUser | null>(null);

  const [users, setUsers] =
    useState<StoredUser[]>([]);

  const [selectedStaffUserId, setSelectedStaffUserId] =
    useState('');

  const [staffSearch, setStaffSearch] =
    useState('');

  const [requestRemark, setRequestRemark] =
    useState('');

  const [loadingUsers, setLoadingUsers] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState<MessageState>(null);

  const [createdSession, setCreatedSession] =
    useState<LocationRequestSession | null>(
      null,
    );

    const [activeSessions, setActiveSessions] =
  useState<LocationRequestSession[]>([]);

const [loadingActiveSessions, setLoadingActiveSessions] =
  useState(false);

const [activeSessionsError, setActiveSessionsError] =
  useState<string | null>(null);

const [stoppingSessionId, setStoppingSessionId] =
  useState<number | null>(null);
  const [
  selectedSession,
  setSelectedSession,
] =
  useState<LocationRequestSession | null>(
    null,
  );
    const [
    selectedRouteSession,
    setSelectedRouteSession,
  ] =
    useState<LocationRequestSession | null>(
      null,
    );

  const currentUserRoles =
    useMemo(
      () => getUserRoles(currentUser),
      [currentUser],
    );

  const isOwner =
    currentUserRoles.includes('OWNER');

  const availableStaff = useMemo(() => {
    const normalizedSearch =
      staffSearch.trim().toLowerCase();

    return users
      .filter(
        (user) =>
          user.isHidden !== true &&
          user.id !== currentUser?.id,
      )
      .filter((user) => {
        if (!normalizedSearch) {
          return true;
        }

        const searchableValue = [
          user.name,
          user.email,
          ...(Array.isArray(user.roles)
            ? user.roles
            : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableValue.includes(
          normalizedSearch,
        );
      })
      .sort((first, second) =>
        String(first.name || '').localeCompare(
          String(second.name || ''),
        ),
      );
  }, [
    currentUser?.id,
    staffSearch,
    users,
  ]);

  const selectedStaff = useMemo(
    () =>
      users.find(
        (user) =>
          user.id ===
          Number(selectedStaffUserId),
      ) || null,
    [selectedStaffUserId, users],
  );

  const usersById = useMemo(() => {
  const map = new Map<number, StoredUser>();

  users.forEach((user) => {
    map.set(user.id, user);
  });

  return map;
}, [users]);

  useEffect(() => {
    const storedUser =
      window.localStorage.getItem('user');

    const token =
      window.localStorage.getItem('token') ||
      window.localStorage.getItem(
        'access_token',
      );

    if (!storedUser || !token) {
      window.location.href = '/';
      return;
    }

    try {
      const parsedUser =
        JSON.parse(storedUser) as StoredUser;

      const roles =
        getUserRoles(parsedUser);

      if (!roles.includes('OWNER')) {
        window.location.href =
          '/dashboard';
        return;
      }

      setCurrentUser(parsedUser);
    } catch {
      window.localStorage.clear();
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    if (!currentUser || !isOwner) {
      return;
    }

    let cancelled = false;

    const loadUsers = async () => {
      setLoadingUsers(true);
      setMessage(null);

      try {
        const response = await axios.get(
          `${apiBaseUrl}/users?includeHidden=false`,
          {
            headers: getAuthHeaders(),
          },
        );

        if (cancelled) {
          return;
        }

        const responseUsers =
          Array.isArray(response.data)
            ? response.data
            : [];

        setUsers(responseUsers);
      } catch (error) {
        if (!cancelled) {
          setUsers([]);

          setMessage({
            type: 'ERROR',
            text: getAxiosErrorMessage(error),
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [currentUser, isOwner]);

  const fetchActiveSessions =
  useCallback(async () => {
    if (!currentUser || !isOwner) {
      return;
    }

    setLoadingActiveSessions(true);

    try {
      const response = await axios.get(
        `${apiBaseUrl}/staff-location/owner/active`,
        {
          headers: getAuthHeaders(),
        },
      );

      const responseData = response.data;

      const sessions = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.data)
          ? responseData.data
          : [];

      const activeResponseSessions =
  sessions.filter(
    (session: LocationRequestSession) =>
      session?.isActive !== false,
  );

setActiveSessions(
  activeResponseSessions,
);

setSelectedSession((current) => {
  if (!current) {
    return null;
  }

  return (
    activeResponseSessions.find(
      (
        session: LocationRequestSession,
      ) => session.id === current.id,
    ) || current
  );
});

setSelectedRouteSession((current) => {
  if (!current) {
    return null;
  }

  return (
    activeResponseSessions.find(
      (
        session: LocationRequestSession,
      ) => session.id === current.id,
    ) || current
  );
});

setActiveSessionsError(null);
    } catch (error) {
      setActiveSessionsError(
        getAxiosErrorMessage(error),
      );
    } finally {
      setLoadingActiveSessions(false);
    }
  }, [currentUser, isOwner]);

useEffect(() => {
  if (!currentUser || !isOwner) {
    return;
  }

  void fetchActiveSessions();

  const intervalId = window.setInterval(
    () => {
      void fetchActiveSessions();
    },
    10_000,
  );

  return () => {
    window.clearInterval(intervalId);
  };
}, [
  currentUser,
  fetchActiveSessions,
  isOwner,
]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const staffUserId =
      Number(selectedStaffUserId);

    if (
      !Number.isInteger(staffUserId) ||
      staffUserId < 1
    ) {
      setMessage({
        type: 'ERROR',
        text: 'Please select a staff member.',
      });

      return;
    }

    if (staffUserId === currentUser?.id) {
      setMessage({
        type: 'ERROR',
        text: 'You cannot request tracking for your own account.',
      });

      return;
    }

    setSubmitting(true);
    setMessage(null);
    setCreatedSession(null);

    try {
      const response =
        await axios.post<LocationRequestSession>(
          `${apiBaseUrl}/staff-location/owner/request`,
          {
            staffUserId,
            requestRemark:
              requestRemark.trim() || undefined,
          },
          {
            headers: getAuthHeaders(),
          },
        );

      setCreatedSession(response.data);

      setMessage({
        type: 'SUCCESS',
        text: `Live location request sent to ${
          selectedStaff?.name ||
          'the selected staff member'
        }.`,
      });

      setRequestRemark('');
setSelectedStaffUserId('');
setStaffSearch('');

await fetchActiveSessions();
    } catch (error) {
      setMessage({
        type: 'ERROR',
        text: getAxiosErrorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStopSession = async (
  session: LocationRequestSession,
) => {
  if (
    stoppingSessionId !== null ||
    session.isActive === false
  ) {
    return;
  }

  const staff =
    usersById.get(session.staffUserId);

  const confirmed = window.confirm(
    `Stop live location tracking for ${
      staff?.name || `staff user #${session.staffUserId}`
    }?`,
  );

  if (!confirmed) {
    return;
  }

  const remark =
    window.prompt(
      'Optional reason for stopping this tracking session:',
      'Tracking stopped by OWNER',
    )?.trim() || '';

  setStoppingSessionId(session.id);
  setActiveSessionsError(null);

  try {
    await axios.post(
      `${apiBaseUrl}/staff-location/owner/session/${session.id}/stop`,
      {
        reason: 'OWNER_STOPPED',
        remark:
          remark || 'Tracking stopped by OWNER',
      },
      {
        headers: getAuthHeaders(),
      },
    );

    setActiveSessions((current) =>
  current.filter(
    (item) => item.id !== session.id,
  ),
);

setSelectedSession((current) =>
  current?.id === session.id
    ? null
    : current,
);

setSelectedRouteSession((current) =>
  current?.id === session.id
    ? null
    : current,
);

setMessage({
      type: 'SUCCESS',
      text: `Live location tracking stopped for ${
        staff?.name || 'the selected staff member'
      }.`,
    });

    await fetchActiveSessions();
  } catch (error) {
    setActiveSessionsError(
      getAxiosErrorMessage(error),
    );
  } finally {
    setStoppingSessionId(null);
  }
};

  if (!currentUser) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow">
        <p className="text-sm text-gray-500">
          Loading live location controls...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
          OWNER Control
        </p>

        <h1 className="mt-2 text-2xl font-black md:text-3xl">
          Staff Live Location
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-blue-100">
          Send a live-location request to a staff
          member. Tracking begins only after the
          selected staff member accepts the request
          and grants location permission.
        </p>
      </section>

      <LiveLocationRequestForm
  loadingUsers={loadingUsers}
  submitting={submitting}
  availableStaff={availableStaff}
  selectedStaff={selectedStaff}
  selectedStaffUserId={selectedStaffUserId}
  staffSearch={staffSearch}
  requestRemark={requestRemark}
  message={message}
  createdSessionId={createdSession?.id}
  createdSessionStatus={createdSession?.status}
  formatRoles={formatRoles}
  onSubmit={handleSubmit}
  onStaffSearchChange={setStaffSearch}
  onRemarkChange={setRequestRemark}
  onStaffChange={(value) => {
    setSelectedStaffUserId(value);
    setMessage(null);
    setCreatedSession(null);
  }}
/>

      <ActiveLiveLocationSessions
  sessions={activeSessions}
  usersById={usersById}
  loading={loadingActiveSessions}
  error={activeSessionsError}
  stoppingSessionId={stoppingSessionId}
    onRefresh={fetchActiveSessions}
  onView={setSelectedSession}
  onViewRoute={setSelectedRouteSession}
  onStop={handleStopSession}
/>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="font-black text-amber-900">
          How this request works
        </h3>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          The staff member receives a request inside
          the CRM. GPS sharing does not start until
          they press Accept and grant the required
          device permission. Rejecting the request
          does not start location tracking.
        </p>
            </section>

      <LiveLocationSessionDrawer
        session={selectedSession}
        staff={
          selectedSession
            ? usersById.get(
                selectedSession.staffUserId,
              )
            : undefined
        }
        onClose={() => {
          setSelectedSession(null);
        }}
      />

            <LiveLocationRouteModal
        session={selectedRouteSession}
        staff={
          selectedRouteSession
            ? usersById.get(
                selectedRouteSession.staffUserId,
              )
            : undefined
        }
        onClose={() => {
          setSelectedRouteSession(null);
        }}
      />
    </div>
  );
}