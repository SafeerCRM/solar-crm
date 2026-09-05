'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type BirthdayStaff = {
  id: number;
  fullName: string;
  designation?: string;
  department?: string;
  staffRole?: string;
  photoUrl?: string;
  birthdayRemarks?: string;
};

type BirthdayResponse = {
  date: string;
  birthdays: BirthdayStaff[];
};

export default function BirthdayPopupManager() {
  const [birthdays, setBirthdays] =
    useState<BirthdayStaff[]>([]);

  const [birthdayDate, setBirthdayDate] =
    useState('');

  const [showPopup, setShowPopup] =
    useState(false);

  const checkBirthdays =
    useCallback(async () => {
      try {
        const token =
          localStorage.getItem(
            'access_token',
          ) ||
          localStorage.getItem(
            'token',
          );

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${API_BASE_URL}/staff-birthday/today`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              cache: 'no-store',
            },
          );

        if (!response.ok) {
          return;
        }

        const data: BirthdayResponse =
          await response.json();

        const today =
          String(
            data?.date || '',
          ).trim();

        const todaysBirthdays =
          Array.isArray(
            data?.birthdays,
          )
            ? data.birthdays
            : [];

        if (
          !today ||
          todaysBirthdays.length ===
            0
        ) {
          setShowPopup(false);
          setBirthdays([]);
          return;
        }

        const userRaw =
          localStorage.getItem(
            'user',
          );

        let userId = 'unknown';

        if (userRaw) {
          try {
            const parsed =
              JSON.parse(userRaw);

            userId =
              String(
                parsed?.id ||
                  parsed?.userId ||
                  'unknown',
              );
          } catch {
            // Ignore malformed local storage data.
          }
        }

        const seenKey =
          `crm-birthday-popup-seen:${userId}:${today}`;

        const alreadySeen =
          localStorage.getItem(
            seenKey,
          ) === 'true';

        if (alreadySeen) {
          setShowPopup(false);
          return;
        }

        setBirthdayDate(today);

        setBirthdays(
          todaysBirthdays,
        );

        setShowPopup(true);
      } catch (error) {
        console.error(
          'Birthday popup check failed',
          error,
        );
      }
    }, []);

  useEffect(() => {
    checkBirthdays();

    const interval =
      window.setInterval(
        () => {
          checkBirthdays();
        },
        15 * 60 * 1000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [checkBirthdays]);

  const closePopup = () => {
    const userRaw =
      localStorage.getItem(
        'user',
      );

    let userId = 'unknown';

    if (userRaw) {
      try {
        const parsed =
          JSON.parse(userRaw);

        userId =
          String(
            parsed?.id ||
              parsed?.userId ||
              'unknown',
          );
      } catch {
        // Ignore malformed local storage data.
      }
    }

    if (birthdayDate) {
      localStorage.setItem(
        `crm-birthday-popup-seen:${userId}:${birthdayDate}`,
        'true',
      );
    }

    setShowPopup(false);
  };

  if (
    !showPopup ||
    birthdays.length === 0
  ) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[99999]
        flex items-center justify-center
        bg-black/50 px-4
        backdrop-blur-sm
      "
    >
      <div
        className="
          w-full max-w-lg
          overflow-hidden
          rounded-[2rem]
          bg-white
          shadow-2xl
        "
      >
        <div
          className="
            bg-gradient-to-r
            from-orange-500
            via-yellow-400
            to-emerald-500
            px-6 py-6
            text-center text-white
          "
        >
          <div className="text-5xl">
            🎉
          </div>

          <h2
            className="
              mt-3 text-3xl
              font-black
            "
          >
            Happy Birthday!
          </h2>

          <p
            className="
              mt-2 text-sm
              font-semibold
              text-white/90
            "
          >
            A special day for our
            team
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {birthdays.map(
              (staff) => (
                <div
                  key={staff.id}
                  className="
                    flex items-center
                    gap-4 rounded-3xl
                    border
                    bg-orange-50
                    p-4
                  "
                >
                  {staff.photoUrl ? (
                    <img
                      src={
                        staff.photoUrl
                      }
                      alt={
                        staff.fullName
                      }
                      className="
                        h-16 w-16
                        shrink-0
                        rounded-full
                        object-cover
                      "
                    />
                  ) : (
                    <div
                      className="
                        flex h-16 w-16
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        text-3xl
                        shadow
                      "
                    >
                      🎂
                    </div>
                  )}

                  <div className="min-w-0">
                    <p
                      className="
                        text-xl
                        font-black
                        text-gray-900
                      "
                    >
                      {
                        staff.fullName
                      }
                    </p>

                    {(staff.designation ||
                      staff.department ||
                      staff.staffRole) && (
                      <p
                        className="
                          mt-1 text-sm
                          font-semibold
                          text-gray-500
                        "
                      >
                        {staff.designation ||
                          staff.department ||
                          formatLabel(
                            staff.staffRole,
                          )}
                      </p>
                    )}

                    {staff.birthdayRemarks && (
                      <p
                        className="
                          mt-2 text-sm
                          leading-6
                          text-gray-600
                        "
                      >
                        {
                          staff.birthdayRemarks
                        }
                      </p>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>

          <p
            className="
              mt-5 text-center
              text-sm
              font-semibold
              leading-6
              text-gray-600
            "
          >
            Wishing{' '}
            {birthdays.length === 1
              ? 'them'
              : 'everyone'}{' '}
            happiness, success and a
            wonderful year ahead. 🎊
          </p>

          <button
            type="button"
            onClick={closePopup}
            className="
              mt-6 w-full
              rounded-2xl
              bg-gray-900
              px-5 py-3
              text-sm font-black
              text-white
              transition
              hover:bg-black
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function formatLabel(
  value?: string,
) {
  return String(
    value || '',
  )
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase(),
    );
}