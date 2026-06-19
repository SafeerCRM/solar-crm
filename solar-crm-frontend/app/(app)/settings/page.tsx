'use client';

const settingCards = [
  {
    title: 'Portal Settings',
    description: 'Manage dealer and customer portal settings, bank details, QR, UPI and future portal controls.',
    href: '/settings/portal',
  },
];

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-800">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Central place for CRM, dealer portal and customer portal settings.
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {settingCards.map((card) => (
            <a
              key={card.href}
              href={card.href}
              className="rounded-2xl bg-white p-5 shadow transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-lg font-bold text-gray-800">
                {card.title}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {card.description}
              </p>
              <p className="mt-4 text-sm font-bold text-blue-600">
                Open →
              </p>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}