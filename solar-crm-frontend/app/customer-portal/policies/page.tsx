'use client';

export default function CustomerPoliciesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-6">

        <div className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <a
            href="/customer-portal"
            className="text-sm font-black text-white/90"
          >
            ← Back to Dashboard
          </a>

          <h1 className="mt-3 text-4xl font-black">
            📜 Customer Policies
          </h1>

          <p className="mt-2 text-sm text-white/90">
            Read company policies, payment rules, subsidy guidelines,
            project conditions and customer responsibilities.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/customer-policy/aditya-customer-policy.pdf"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-orange-600"
            >
              View PDF
            </a>

            <a
              href="/customer-policy/aditya-customer-policy.pdf"
              download
              className="rounded-2xl bg-black/20 px-5 py-3 text-sm font-black text-white"
            >
              Download PDF
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-4 shadow-xl">
          <iframe
            src="/customer-policy/aditya-customer-policy.pdf"
            className="h-[80vh] w-full rounded-3xl border"
            title="Customer Policy"
          />
        </div>

      </div>
    </main>
  );
}