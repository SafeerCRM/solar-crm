'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    const customer = localStorage.getItem('customer');

    if (token && customer) {
      window.location.href = '/customer-portal';
    }
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/customer-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('customer_token', data.access_token);
      localStorage.setItem('customer', JSON.stringify(data.customer));

      window.location.href = '/customer-portal';
    } catch (error) {
      console.error(error);
      setMessage('Login error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-screen max-w-full overflow-x-hidden bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="absolute left-[-80px] top-[-80px] h-64 w-64 rounded-full bg-yellow-300/40 blur-3xl" />
      <div className="absolute bottom-[-100px] right-[-80px] h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-full items-center justify-center overflow-x-hidden px-4 py-8 lg:max-w-6xl">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl md:grid-cols-2">
          <div className="relative hidden min-h-[620px] overflow-hidden bg-gradient-to-br from-orange-500 via-yellow-500 to-emerald-500 p-10 text-white md:flex md:flex-col md:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
                ☀ Aditya Solars Customer Portal
              </div>

              <h1 className="mt-8 text-5xl font-black leading-tight">
                Track your solar journey beautifully.
              </h1>

              <p className="mt-5 text-lg text-white/90">
                Project progress, work calendar, documents, payments,
                complaints, cleaning reminders and support — all in one place.
              </p>
            </div>

            <div className="grid gap-4">
              <FeatureCard title="Live Project Status" text="Know what is done and what is pending." />
              <FeatureCard title="Payments & Documents" text="View payment history and download documents." />
              <FeatureCard title="Complaints & Service" text="Raise complaints and track resolution status." />
            </div>
          </div>

          <div className="flex items-center justify-center p-7 md:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-yellow-400 text-4xl shadow-lg">
                  ☀
                </div>

                <h2 className="mt-5 text-3xl font-black text-gray-900">
                  Customer Login
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Login with your registered mobile number, K number, or portal username.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Mobile / K Number / Username
                  </label>

                  <input
                    type="text"
                    placeholder="Enter mobile or K number"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-gray-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
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
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 pr-24 text-gray-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
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
                    For now, password is usually your registered mobile number unless reset by company.
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
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 py-4 font-black text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl disabled:opacity-60"
                >
                  {loading ? 'Logging in...' : 'Enter Customer Portal'}
                </button>
              </form>

              <div className="mt-8 rounded-2xl bg-emerald-50 p-4 text-center text-sm text-emerald-800">
                Need help? Contact your project owner or Aditya Solars support team.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl bg-white/20 p-5 backdrop-blur">
      <p className="text-lg font-black">{title}</p>
      <p className="mt-1 text-sm text-white/85">{text}</p>
    </div>
  );
}