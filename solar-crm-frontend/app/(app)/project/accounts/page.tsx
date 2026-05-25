'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type LedgerEntry = {
  id: number;
  partyName?: string;
  partyType?: string;
  projectId?: number;
  entryType?: string;
  sourceType?: string;
  sourceId?: number;
  amount?: number;
  remarks?: string;
  createdByName?: string;
  createdAt?: string;
};

export default function AccountsLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState({
    totalDebit: 0,
    totalCredit: 0,
    netBalance: 0,
  });

  const [loading, setLoading] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [partyType, setPartyType] = useState('');
  const [sourceType, setSourceType] = useState('');

  const fetchLedger = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const [ledgerRes, summaryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/project/ledger`, {
          params: {
            partyName,
            partyType,
            sourceType,
          },
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }),

        axios.get(`${API_BASE_URL}/project/ledger/summary`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }),
      ]);

      setEntries(ledgerRes.data || []);
      setSummary(
        summaryRes.data || {
          totalDebit: 0,
          totalCredit: 0,
          netBalance: 0,
        },
      );
    } catch (error) {
      console.error(error);
      alert('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyName, partyType, sourceType]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Accounts / Ledger
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Track party-wise debit, credit, receivables and payables.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total Debit</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            ₹{Number(summary.totalDebit || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total Credit</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            ₹{Number(summary.totalCredit || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Net Balance</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            ₹{Number(summary.netBalance || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            placeholder="Search Party Name"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={partyType}
            onChange={(e) => setPartyType(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Party Types</option>
            <option value="CUSTOMER">Customer</option>
            <option value="VENDOR">Vendor</option>
            <option value="DEALER">Dealer</option>
            <option value="BOTH">Both</option>
          </select>

          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Sources</option>
            <option value="PURCHASE_ORDER">Purchase Order</option>
            <option value="PROFORMA_INVOICE">Proforma Invoice</option>
            <option value="FINAL_INVOICE">Final Invoice</option>
            <option value="CUSTOMER_PAYMENT">Customer Payment</option>
            <option value="VENDOR_PAYMENT">Vendor Payment</option>
            <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Ledger Entries
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500">
            No ledger entries found.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-gray-800">
                      {entry.partyName || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {entry.partyType || '-'} | Project #{entry.projectId || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {entry.sourceType || '-'} #{entry.sourceId || '-'}
                    </p>

                    {entry.remarks && (
                      <p className="mt-2 text-sm text-gray-700">
                        {entry.remarks}
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <p
                      className={`text-lg font-bold ${
                        entry.entryType === 'DEBIT'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {entry.entryType}: ₹
                      {Number(entry.amount || 0).toLocaleString('en-IN')}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleString()
                        : '-'}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      By: {entry.createdByName || '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}