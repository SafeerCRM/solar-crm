'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;


export default function EPCAccountPage() {

    const [summary, setSummary] = useState({
  totalScheduled: 0,
  totalReceived: 0,
  totalPending: 0,
  pendingApproval: 0,
});

useEffect(() => {
  loadSummary();
}, []);

const loadSummary = async () => {
  try {
    const token =
      localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/payment-collection`,
      {
        params: {
          limit: 10000,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    const rows = Array.isArray(
      res.data?.data,
    )
      ? res.data.data
      : [];

    let totalScheduled = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let pendingApproval = 0;

    rows.forEach((row: any) => {
      totalScheduled += Number(
        row.amount || 0,
      );

      totalReceived += Number(
        row.paidAmount || 0,
      );

      totalPending += Number(
        row.pendingAmount || 0,
      );

      if (
        Number(row.paidAmount || 0) > 0 &&
        row.approvalStatus ===
          'PENDING'
      ) {
        pendingApproval += Number(
          row.paidAmount || 0,
        );
      }
    });

    setSummary({
      totalScheduled,
      totalReceived,
      totalPending,
      pendingApproval,
    });
  } catch (error) {
    console.error(error);
  }
};

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          EPC Account
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage project collections, customer payments, expenses and EPC financial reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Total Scheduled
    </p>

    <p className="mt-2 text-2xl font-bold text-blue-700">
      ₹
      {summary.totalScheduled.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Total Received
    </p>

    <p className="mt-2 text-2xl font-bold text-green-700">
      ₹
      {summary.totalReceived.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Total Pending
    </p>

    <p className="mt-2 text-2xl font-bold text-red-700">
      ₹
      {summary.totalPending.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Pending Approval
    </p>

    <p className="mt-2 text-2xl font-bold text-yellow-700">
      ₹
      {summary.pendingApproval.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>
</div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/project/payment-collection"
          className="rounded-2xl bg-white p-5 shadow hover:shadow-lg"
        >
          <h2 className="text-lg font-bold text-gray-800">
            Customer Collections
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            View received, pending and overdue customer payments.
          </p>
        </Link>

        <Link
          href="/project/accounts/ledger"
          className="rounded-2xl bg-white p-5 shadow hover:shadow-lg"
        >
          <h2 className="text-lg font-bold text-gray-800">
            EPC Ledger
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            View EPC debit, credit, receivables and payables.
          </p>
        </Link>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            Contractor Payments
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Phase 2 Implementation.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            Labour Payments
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Phase 2 Implementation.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            Transportation
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Phase 2 Implementation.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            EPC Profit Reports
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Phase 3 Implementation.
          </p>
        </div>
      </div>
    </div>
  );
}