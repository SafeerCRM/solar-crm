
'use client';

import { useEffect, useState } from 'react';

type Props = {
  destination: string;
};

export default function CustomerSmartLinkFallback({
  destination,
}: Props) {
  const [isAndroid, setIsAndroid] = useState(false);
  const [checking, setChecking] = useState(true);

  const playStoreUrl =
    'https://play.google.com/store/apps/details?id=com.adityasolars.customer';

  const webAppUrl =
    '/customer-login?next=' +
    encodeURIComponent(destination);

  useEffect(() => {
    const userAgent = navigator.userAgent || '';
    const android = /Android/i.test(userAgent);

    if (!android) {
      window.location.replace(webAppUrl);
      return;
    }

    setIsAndroid(true);
    setChecking(false);
  }, [webAppUrl]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Opening Aditya Solars Customer Portal...
        </p>
      </main>
    );
  }

  if (!isAndroid) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-7 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 text-4xl text-white shadow-lg">
          ☀
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Aditya Solars
        </h1>

        <p className="mt-2 text-sm font-medium text-orange-600">
          Customer App
        </p>

        <h2 className="mt-7 text-xl font-semibold text-slate-900">
          Access Your Solar Services
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Download the Aditya Solars Customer App to
          manage your solar project, payments, insurance,
          documents and services.
        </p>

        <a
          href={playStoreUrl}
          className="mt-8 flex w-full items-center justify-center rounded-xl bg-orange-500 px-5 py-4 text-base font-semibold text-white shadow-md transition hover:bg-orange-600"
        >
          Download Customer App
        </a>

        <p className="mt-5 text-xs text-slate-400">
          Prefer not to install the app?
        </p>

        <a
          href={webAppUrl}
          className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Continue on Web App
        </a>

        <p className="mt-7 text-xs leading-5 text-slate-400">
          Official Aditya Solars Customer Portal
        </p>
      </div>
    </main>
  );
}
