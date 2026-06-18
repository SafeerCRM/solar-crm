'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('dealer_token');
    const dealer = localStorage.getItem('dealer');

    if (token && dealer) {
      window.location.href = '/dealer-portal';
    }
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Login failed');
        return;
      }

      localStorage.setItem('dealer_token', data.access_token);
      localStorage.setItem('dealer', JSON.stringify(data.dealer));

      window.location.href = '/dealer-portal';
    } catch (error) {
      console.error(error);
      setMessage('Login error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/30 blur-3xl" />
      <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
      <div className="absolute bottom-[-140px] left-1/3 h-96 w-96 rounded-full bg-yellow-400/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8">
        <div className="grid w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
          <section className="relative hidden min-h-[660px] overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-slate-900 to-orange-500" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_35%)]" />

            <div className="relative">
              <div className="inline-flex rounded-full border border-white/25 bg-white/15 px-5 py-2 text-sm font-black backdrop-blur">
                ⚡ Aditya Solars Dealer Network
              </div>

              <h1 className="mt-8 max-w-xl text-5xl font-black leading-tight">
                Order solar materials faster, smarter and cleaner.
              </h1>

              <p className="mt-5 max-w-lg text-lg text-white/85">
                View live stock, GST pricing, create orders, track invoices,
                upload payment receipts and communicate with Aditya Solars.
              </p>
            </div>

            <div className="relative grid gap-4">
              <FeatureCard title="Live Stock & GST Rates" text="Check material availability with price including and excluding GST." />
              <FeatureCard title="Instant PI & Order Tracking" text="Place material orders and track acceptance, delivery and invoice status." />
              <FeatureCard title="Payments, Credit & Support" text="Upload receipts, manage credit timelines and raise complaints with photos." />
            </div>
          </section>

          <section className="flex items-center justify-center bg-white p-7 text-gray-900 md:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-blue-700 via-sky-500 to-orange-400 text-4xl shadow-xl">
                  ⚡
                </div>

                <h2 className="mt-5 text-3xl font-black">
                  Dealer Login
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Login with registered phone, email, or GST number.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Phone / Email / GST Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter dealer login ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 pr-24 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-gray-200 px-3 py-2 text-xs font-bold text-gray-700"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    For now, password may be phone / GST / assigned portal password.
                  </p>
                </div>

                {message && (
                  <p className="rounded-2xl bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-700 via-sky-500 to-orange-500 py-4 font-black text-white shadow-xl transition hover:scale-[1.01] hover:shadow-2xl disabled:opacity-60"
                >
                  {loading ? 'Logging in...' : 'Enter Dealer Portal'}
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center text-sm font-semibold text-blue-800">
                Need help? Contact Aditya Solars trading or stock team.
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/15 p-5 shadow-lg backdrop-blur">
      <p className="text-lg font-black">{title}</p>
      <p className="mt-1 text-sm text-white/80">{text}</p>
    </div>
  );
}