'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerPoliciesPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('dealer_token');

      if (!token) {
        window.location.href = '/dealer-login';
        return;
      }

      const res = await fetch(`${API_BASE_URL}/dealer-auth/policies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const openPdf = async (pdfUrl: string, title: string) => {
    try {
      const res = await fetch(pdfUrl);

      if (!res.ok) {
        alert('Unable to open document. Please try again.');
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

        const safeName = `${String(title || 'dealer-document')
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .toLowerCase()}.pdf`;

        const saved = await Filesystem.writeFile({
          path: safeName,
          data: base64,
          directory: Directory.Cache,
          recursive: true,
        });

        await Share.share({
          title,
          text: title,
          url: saved.uri,
          dialogTitle: 'Open / Share Document',
        });

        return;
      }

      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Unable to open document.');
    }
  };

  return (
    <main className="min-h-screen w-screen max-w-full overflow-x-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="pointer-events-none fixed right-[-120px] top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-full overflow-x-hidden px-4 py-6 lg:max-w-7xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl">
          <a href="/dealer-portal" className="text-sm font-black text-orange-300">
            ← Back to Dashboard
          </a>

          <h1 className="mt-3 text-4xl font-black">
            📜 Dealer Documents & Policies
          </h1>

          <p className="mt-2 text-sm text-white/70">
            View dealer policies, warranty documents, manuals, guides, agreements and important terms.
          </p>
        </div>

        {loading ? (
          <div className="mt-6 rounded-[2rem] bg-white p-8 text-center font-black text-slate-900 shadow-xl">
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="mt-6 rounded-[2rem] bg-white p-8 text-center shadow-xl">
            <p className="text-lg font-black text-gray-800">
              No dealer documents available.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Please contact company support if you need dealer policy or warranty documents.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5">
            {documents.map((item) => (
              <div
                key={item.id}
                className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">
                      {item.title}
                    </h2>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                        {item.documentType || 'POLICY'}
                      </span>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                        {item.language || 'HINDI'}
                      </span>
                    </div>
                  </div>

                  {item.pdfUrl && (
                    <button
                      type="button"
                      onClick={() => openPdf(item.pdfUrl, item.title)}
                      className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white"
                    >
                      View / Download PDF
                    </button>
                  )}
                </div>

                {item.content && (
                  <div className="mt-5 whitespace-pre-line rounded-3xl bg-gray-50 p-5 text-sm font-semibold leading-7 text-gray-700">
                    {item.content}
                  </div>
                )}

                {!item.content && !item.pdfUrl && (
                  <p className="mt-5 rounded-3xl bg-gray-50 p-5 text-sm font-semibold text-gray-500">
                    Document details are not available yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}