'use client';

export type LiveLocationTab =
  | 'ACTIVE'
  | 'HISTORY';

type LiveLocationTabsProps = {
  activeTab: LiveLocationTab;
  activeCount: number;
  historyCount?: number;
  onChange: (tab: LiveLocationTab) => void;
};

export default function LiveLocationTabs({
  activeTab,
  activeCount,
  historyCount,
  onChange,
}: LiveLocationTabsProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange('ACTIVE')}
          className={`rounded-xl px-4 py-3 text-sm font-black transition ${
            activeTab === 'ACTIVE'
              ? 'bg-blue-700 text-white shadow'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>Active Sessions</span>

          <span
            className={`ml-2 inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs ${
              activeTab === 'ACTIVE'
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange('HISTORY')}
          className={`rounded-xl px-4 py-3 text-sm font-black transition ${
            activeTab === 'HISTORY'
              ? 'bg-indigo-700 text-white shadow'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>History</span>

          {historyCount !== undefined && (
            <span
              className={`ml-2 inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs ${
                activeTab === 'HISTORY'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {historyCount}
            </span>
          )}
        </button>
      </div>
    </section>
  );
}