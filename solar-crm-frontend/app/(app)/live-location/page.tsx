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
import LiveLocationHistory from '@/components/live-location/LiveLocationHistory';
import {
  LiveLocationTab,
} from '@/components/live-location/LiveLocationTabs';

import LiveLocationTabs from '@/components/live-location/LiveLocationTabs';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL;

  const HISTORY_PAGE_LIMIT = 10;

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

      const [activeTab, setActiveTab] =
    useState<LiveLocationTab>('ACTIVE');

      const [historySessions, setHistorySessions] =
    useState<LocationRequestSession[]>([]);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  const [historyError, setHistoryError] =
    useState<string | null>(null);

  const [historyPage, setHistoryPage] =
    useState(1);

  const [historyTotal, setHistoryTotal] =
    useState(0);

  const [historyTotalPages, setHistoryTotalPages] =
    useState(1);

  const [historyStaffUserId, setHistoryStaffUserId] =
    useState('');

  const [historyStatus, setHistoryStatus] =
    useState('');

  const [historyFromDate, setHistoryFromDate] =
    useState('');

  const [historyToDate, setHistoryToDate] =
    useState('');

  const [
    appliedHistoryStaffUserId,
    setAppliedHistoryStaffUserId,
  ] = useState('');

  const [
    appliedHistoryStatus,
    setAppliedHistoryStatus,
  ] = useState('');

  const [
    appliedHistoryFromDate,
    setAppliedHistoryFromDate,
  ] = useState('');

  const [
    appliedHistoryToDate,
    setAppliedHistoryToDate,
  ] = useState('');

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

    const fetchHistory = useCallback(
    async (
      requestedPage = historyPage,
      filters?: {
        staffUserId?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
      },
    ) => {
      if (!currentUser || !isOwner) {
        return;
      }

      const selectedFilters = {
        staffUserId:
          filters?.staffUserId ??
          appliedHistoryStaffUserId,
        status:
          filters?.status ??
          appliedHistoryStatus,
        fromDate:
          filters?.fromDate ??
          appliedHistoryFromDate,
        toDate:
          filters?.toDate ??
          appliedHistoryToDate,
      };

      setLoadingHistory(true);
      setHistoryError(null);

      try {
        const params: Record<
          string,
          string | number | boolean
        > = {
          page: requestedPage,
          limit: HISTORY_PAGE_LIMIT,
          active: false,
        };

        if (selectedFilters.staffUserId) {
          params.staffUserId = Number(
            selectedFilters.staffUserId,
          );
        }

        if (selectedFilters.status) {
          params.status =
            selectedFilters.status;
        }

        if (selectedFilters.fromDate) {
          params.fromDate =
            selectedFilters.fromDate;
        }

        if (selectedFilters.toDate) {
          params.toDate =
            selectedFilters.toDate;
        }

        const response = await axios.get(
          `${apiBaseUrl}/staff-location/owner/history`,
          {
            headers: getAuthHeaders(),
            params,
          },
        );

        const responseData = response.data;

        const sessions =
          Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData?.data)
              ? responseData.data
              : Array.isArray(
                    responseData?.items,
                  )
                ? responseData.items
                : [];

        const total = Number(
          responseData?.total ??
            responseData?.meta?.total ??
            sessions.length,
        );

        const responsePage = Number(
          responseData?.page ??
            responseData?.meta?.page ??
            requestedPage,
        );

        const responseLimit = Number(
          responseData?.limit ??
            responseData?.meta?.limit ??
            HISTORY_PAGE_LIMIT,
        );

        const calculatedTotalPages =
          Math.max(
            1,
            Math.ceil(
              total /
                Math.max(
                  1,
                  responseLimit,
                ),
            ),
          );

        const totalPages = Number(
          responseData?.totalPages ??
            responseData?.meta?.totalPages ??
            calculatedTotalPages,
        );

        setHistorySessions(sessions);
        setHistoryTotal(
          Number.isFinite(total)
            ? total
            : sessions.length,
        );

        setHistoryPage(
          Number.isFinite(responsePage)
            ? responsePage
            : requestedPage,
        );

        setHistoryTotalPages(
          Number.isFinite(totalPages)
            ? Math.max(1, totalPages)
            : calculatedTotalPages,
        );

        setSelectedSession((current) => {
          if (!current) {
            return null;
          }

          return (
            sessions.find(
              (
                session: LocationRequestSession,
              ) =>
                session.id === current.id,
            ) || current
          );
        });

        setSelectedRouteSession(
          (current) => {
            if (!current) {
              return null;
            }

            return (
              sessions.find(
                (
                  session: LocationRequestSession,
                ) =>
                  session.id === current.id,
              ) || current
            );
          },
        );
      } catch (error) {
        setHistorySessions([]);

        setHistoryError(
          getAxiosErrorMessage(error),
        );
      } finally {
        setLoadingHistory(false);
      }
    },
    [
      appliedHistoryFromDate,
      appliedHistoryStaffUserId,
      appliedHistoryStatus,
      appliedHistoryToDate,
      currentUser,
      historyPage,
      isOwner,
    ],
  );

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

  useEffect(() => {
    if (
      !currentUser ||
      !isOwner ||
      activeTab !== 'HISTORY'
    ) {
      return;
    }

    void fetchHistory(historyPage);
  }, [
    activeTab,
    currentUser,
    fetchHistory,
    historyPage,
    isOwner,
  ]);

    const handleApplyHistoryFilters =
    useCallback(() => {
      const nextFilters = {
        staffUserId:
          historyStaffUserId,
        status:
          historyStatus,
        fromDate:
          historyFromDate,
        toDate:
          historyToDate,
      };

      setAppliedHistoryStaffUserId(
        nextFilters.staffUserId,
      );

      setAppliedHistoryStatus(
        nextFilters.status,
      );

      setAppliedHistoryFromDate(
        nextFilters.fromDate,
      );

      setAppliedHistoryToDate(
        nextFilters.toDate,
      );

      setHistoryPage(1);

      void fetchHistory(1, nextFilters);
    }, [
      fetchHistory,
      historyFromDate,
      historyStaffUserId,
      historyStatus,
      historyToDate,
    ]);

  const handleClearHistoryFilters =
    useCallback(() => {
      const clearedFilters = {
        staffUserId: '',
        status: '',
        fromDate: '',
        toDate: '',
      };

      setHistoryStaffUserId('');
      setHistoryStatus('');
      setHistoryFromDate('');
      setHistoryToDate('');

      setAppliedHistoryStaffUserId('');
      setAppliedHistoryStatus('');
      setAppliedHistoryFromDate('');
      setAppliedHistoryToDate('');

      setHistoryPage(1);

      void fetchHistory(
        1,
        clearedFilters,
      );
    }, [fetchHistory]);

  const handleHistoryPageChange =
    useCallback(
      (page: number) => {
        if (
          loadingHistory ||
          page < 1 ||
          page > historyTotalPages
        ) {
          return;
        }

        setHistoryPage(page);
      },
      [
        historyTotalPages,
        loadingHistory,
      ],
    );

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

    if (activeTab === 'HISTORY') {
      await fetchHistory(historyPage);
    }
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

                  <LiveLocationTabs
        activeTab={activeTab}
        activeCount={activeSessions.length}
        historyCount={historyTotal}
        onChange={setActiveTab}
      />

      {activeTab === 'ACTIVE' ? (
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
            ) : (
        <LiveLocationHistory
          sessions={historySessions}
          usersById={usersById}
          loading={loadingHistory}
          error={historyError}
          page={historyPage}
          total={historyTotal}
          totalPages={historyTotalPages}
          staffUserId={historyStaffUserId}
          status={historyStatus}
          fromDate={historyFromDate}
          toDate={historyToDate}
          onStaffUserIdChange={
            setHistoryStaffUserId
          }
          onStatusChange={
            setHistoryStatus
          }
          onFromDateChange={
            setHistoryFromDate
          }
          onToDateChange={
            setHistoryToDate
          }
          onApplyFilters={
            handleApplyHistoryFilters
          }
          onClearFilters={
            handleClearHistoryFilters
          }
          onRefresh={() => {
            void fetchHistory(
              historyPage,
            );
          }}
          onPageChange={
            handleHistoryPageChange
          }
          onViewDetails={
            setSelectedSession
          }
          onViewRoute={
            setSelectedRouteSession
          }
        />
      )}

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