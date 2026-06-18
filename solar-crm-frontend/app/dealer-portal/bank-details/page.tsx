'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerBankDetailsPage() {
  const [data, setData] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadBankDetails();
  }, []);

  const getToken = () => {
    const token = localStorage.getItem('dealer_token');

    if (!token) {
      window.location.href = '/dealer-login';
      return '';
    }

    return token;
  };

  const loadBankDetails = async () => {
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/bank-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage(result.message || 'Unable to load bank details');
        return;
      }

      setData(result);
    } catch (error) {
      console.error(error);
      setMessage('Bank details loading error.');
    }
  };

  const bankDetails = Array.isArray(data?.bankDetails) ? data.bankDetails : [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto max-w-6xl px-4 py-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a href="/dealer-portal" className="text-sm font-black text-orange-300">
            ← Back to Dashboard
          </a>

          <h1 className="mt-3 text-3xl font-black md:text-4xl">
            Company Bank Details
          </h1>

          <p className="mt-1 text-sm text-white/60">
            Use Aditya Solars account details or QR code for payments.
          </p>
        </header>

        {message && (
          <p className="mt-5 rounded-2xl bg-red-100 p-3 text-center text-sm font-bold text-red-700">
            {message}
          </p>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-gradient-to-br from-orange-500 to-yellow-400 p-6 text-slate-950 shadow-xl">
            <div className="text-5xl">☀</div>
            <h2 className="mt-4 text-2xl font-black">
              {data?.companyName || 'ADITYA SOLARS'}
            </h2>

            <div className="mt-5 space-y-3 text-sm font-bold">
              <Info label="Email" value={data?.email || '-'} />
              <Info label="Phone 1" value={data?.phone1 || '-'} />
              <Info label="Phone 2" value={data?.phone2 || '-'} />
              <Info label="GSTIN" value={data?.gstin || '-'} />
            </div>
          </div>

          <section className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl lg:col-span-2">
            <h2 className="text-xl font-black">Active Payment Accounts</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {!bankDetails.length && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500 md:col-span-2">
                  No active bank details found.
                </div>
              )}

              {bankDetails.map((bank: any) => (
                <div
                  key={bank.id}
                  className="overflow-hidden rounded-[1.7rem] border border-slate-100 bg-slate-50 shadow"
                >
                  <div className="h-2 bg-gradient-to-r from-blue-700 via-sky-500 to-orange-400" />

                  <div className="p-5">
                    <p className="text-lg font-black">{bank.accountName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {bank.bankName || 'Bank details'}
                    </p>

                    <div className="mt-5 grid gap-3">
                      <BankRow label="Account No." value={bank.accountNumber || '-'} />
                      <BankRow label="IFSC" value={bank.ifsc || '-'} />
                      <BankRow label="UPI ID" value={bank.upiId || '-'} />
                    </div>

                    {bank.qrCodeUrl && (
                      <div className="mt-5 rounded-3xl bg-white p-4 text-center">
                        <p className="mb-3 text-xs font-black text-slate-400">
                          Scan QR Code
                        </p>

                        <img
                          src={bank.qrCodeUrl}
                          alt="Payment QR Code"
                          className="mx-auto h-56 w-56 rounded-2xl object-contain"
                        />

                        <a
                          href={bank.qrCodeUrl}
                          target="_blank"
                          className="mt-3 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white"
                        >
                          Open QR
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <p className="text-xs font-bold text-slate-600">{label}</p>
      <p className="mt-1 break-words font-black">{value}</p>
    </div>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words font-black">{value}</p>
    </div>
  );
}