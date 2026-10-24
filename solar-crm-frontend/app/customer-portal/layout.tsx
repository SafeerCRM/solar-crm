
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CustomerPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const isDashboard =
    pathname === "/customer-portal" ||
    pathname === "/customer-portal/";

  return (
    <>
      {!isDashboard && (
        <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center">
            <Link
              href="/customer-portal"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 active:bg-slate-200"
            >
              <span aria-hidden="true">←</span>
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
