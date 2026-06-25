'use client';

const POLICY_PDF_URL =
  'https://solar-crm-frontend.vercel.app/customer-policy/aditya-customer-policy.pdf';

export default function CustomerPoliciesPage() {
  const handlePolicyPdf = async () => {
    try {
      const res = await fetch(POLICY_PDF_URL);

      if (!res.ok) {
        alert('Unable to open policy PDF. Please try again.');
        return;
      }

      const blob = await res.blob();

      const isNativeCapacitor =
        typeof window !== 'undefined' &&
        !!(window as any).Capacitor &&
        (window as any).Capacitor.isNativePlatform?.() === true;

      if (isNativeCapacitor) {
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        let binaryString = '';

        for (let i = 0; i < uint8Array.length; i += 1) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }

        const base64 = btoa(binaryString);

        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const saved = await Filesystem.writeFile({
          path: 'customer-policy.pdf',
          data: base64,
          directory: Directory.Cache,
          recursive: true,
        });

        await Share.share({
          title: 'Customer Policy',
          text: 'Customer Policy PDF',
          url: saved.uri,
          dialogTitle: 'Open / Share Policy PDF',
        });

        return;
      }

      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch (error: any) {
      console.error('POLICY PDF ERROR', error);
      alert(error?.message || 'Unable to open policy PDF.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <a href="/customer-portal" className="text-sm font-black text-white/90">
            ← Back to Dashboard
          </a>

          <h1 className="mt-3 text-4xl font-black">📜 Customer Policies</h1>

          <p className="mt-2 text-sm text-white/90">
            Read company policies, payment rules, subsidy guidelines,
            project conditions and customer responsibilities.
          </p>

          <button
            type="button"
            onClick={handlePolicyPdf}
            className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-orange-600"
          >
            View / Download Policy PDF
          </button>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-6 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100 text-3xl">
            📄
          </div>

          <h2 className="mt-4 text-2xl font-black text-gray-900">
            Customer Policy PDF
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-gray-600">
            Tap the button above to view, download, or share the policy PDF.
          </p>
        </div>
      </div>
    </main>
  );
}