'use client';

const POLICY_PDF_URL = '/customer-policy/aditya-customer-policy.pdf';

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
              href={POLICY_PDF_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-orange-600"
            >
              View PDF
            </a>

            <a
              href={POLICY_PDF_URL}
              download
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-black/20 px-5 py-3 text-sm font-black text-white"
            >
              Download PDF
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-6 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100 text-3xl">
            📄
          </div>

          <h2 className="mt-4 text-2xl font-black text-gray-900">
            Customer Policy PDF
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-gray-600">
            For best compatibility on mobile app and browser, please use the
            buttons above to view or download the policy PDF.
          </p>

          <p className="mx-auto mt-3 max-w-2xl text-xs font-medium leading-5 text-gray-500">
            Some Android WebView versions do not display PDF previews inside the
            app. The PDF file is still available through View PDF and Download PDF.
          </p>
        </div>
      </div>
    </main>
  );
}