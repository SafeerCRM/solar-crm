'use client';

import { useState } from 'react';

export default function CalculatorSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

        <span
          className={`text-xl transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          ⌄
        </span>
      </button>

      {open && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
}