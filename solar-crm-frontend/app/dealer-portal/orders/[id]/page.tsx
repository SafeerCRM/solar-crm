'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const compressDealerOrderDocumentImage = async (
  file: File,
): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (file.size <= 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const image = new Image();

    const objectUrl =
      URL.createObjectURL(file);

    image.onload = () => {
      const maxWidth = 1600;

      const scale = Math.min(
        1,
        maxWidth / image.width,
      );

      const canvas =
        document.createElement('canvas');

      canvas.width = Math.round(
        image.width * scale,
      );

      canvas.height = Math.round(
        image.height * scale,
      );

      const context =
        canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);

          if (!blob) {
            resolve(file);
            return;
          }

          const safeName =
            file.name.replace(
              /\.(png|jpg|jpeg|webp)$/i,
              '.jpg',
            );

          resolve(
            new File(
              [blob],
              safeName,
              {
                type: 'image/jpeg',
                lastModified:
                  Date.now(),
              },
            ),
          );
        },
        'image/jpeg',
        0.78,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    image.src = objectUrl;
  });
};

export default function DealerOrderDetailPage() {
  const params = useParams();
  const orderId = String(params?.id || '');

  const [detail, setDetail] = useState<any>(null);
  const [pi, setPi] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [documents, setDocuments] =
  useState<any[]>([]);

const [documentsLoading, setDocumentsLoading] =
  useState(false);

const [documentUploading, setDocumentUploading] =
  useState(false);

const [documentFiles, setDocumentFiles] =
  useState<File[]>([]);

const [
  editingDocumentId,
  setEditingDocumentId,
] = useState<number | null>(null);

const [documentForm, setDocumentForm] =
  useState({
    title: '',
    category: '',
    documentType: '',
    tags: '',
    remarks: '',
  });

const [
  titleSuggestions,
  setTitleSuggestions,
] = useState<string[]>([]);

const [
  categorySuggestions,
  setCategorySuggestions,
] = useState<string[]>([]);

const [
  typeSuggestions,
  setTypeSuggestions,
] = useState<string[]>([]);

const [
  tagSuggestions,
  setTagSuggestions,
] = useState<string[]>([]);

  useEffect(() => {
    loadDetail();
  }, []);

    const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('dealer_token');

    if (!token) {
      window.location.href = '/dealer-login';
      return {};
    }

    return { Authorization: `Bearer ${token}` };
  };

  const loadDocuments = async () => {
  if (!orderId) {
    return;
  }

  try {
    setDocumentsLoading(true);

    const res = await fetch(
      `${API_BASE_URL}/dealer-auth/orders/${orderId}/documents`,
      {
        headers: authHeaders(),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data?.message ||
          'Failed to load documents',
      );
    }

    setDocuments(
      Array.isArray(data?.documents)
        ? data.documents
        : [],
    );
  } catch (error) {
    console.error(error);
  } finally {
    setDocumentsLoading(false);
  }
};

const loadDocumentSuggestions = async (
  type:
    | 'title'
    | 'category'
    | 'documentType'
    | 'tag',

  search = '',
) => {
  if (!orderId) {
    return;
  }

  try {
    const params =
      new URLSearchParams();

    params.set('type', type);

    if (search.trim()) {
      params.set(
        'search',
        search.trim(),
      );
    }

    const res = await fetch(
      `${API_BASE_URL}/dealer-auth/orders/${orderId}/documents/suggestions?${params}`,
      {
        headers: authHeaders(),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return;
    }

    const values =
      Array.isArray(data)
        ? data
        : [];

    if (type === 'title') {
      setTitleSuggestions(values);
    }

    if (type === 'category') {
      setCategorySuggestions(values);
    }

    if (type === 'documentType') {
      setTypeSuggestions(values);
    }

    if (type === 'tag') {
      setTagSuggestions(values);
    }
  } catch (error) {
    console.error(error);
  }
};

const resetDocumentForm = () => {
  setEditingDocumentId(null);

  setDocumentForm({
    title: '',
    category: '',
    documentType: '',
    tags: '',
    remarks: '',
  });

  setDocumentFiles([]);

  const input =
    document.getElementById(
      'dealer-order-document-files',
    ) as HTMLInputElement | null;

  if (input) {
    input.value = '';
  }
};

const saveDocuments = async () => {
  const title =
    documentForm.title.trim();

  const category =
    documentForm.category.trim();

  const documentType =
    documentForm.documentType.trim();

  if (!title) {
    alert('Document title is required');
    return;
  }

  if (!category) {
    alert('Document category is required');
    return;
  }

  if (!documentType) {
    alert('Document type is required');
    return;
  }

  const token =
    localStorage.getItem(
      'dealer_token',
    );

  if (!token) {
    window.location.href =
      '/dealer-login';

    return;
  }

  try {
    setDocumentUploading(true);

    if (editingDocumentId) {
      const res = await fetch(
        `${API_BASE_URL}/dealer-auth/orders/${orderId}/documents/${editingDocumentId}`,
        {
          method: 'PATCH',

          headers: {
            Authorization:
              `Bearer ${token}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            title,
            category,
            documentType,
            tags:
              documentForm.tags,
            remarks:
              documentForm.remarks,
          }),
        },
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            'Failed to update document',
        );
      }

      alert(
        'Document details updated successfully',
      );

      resetDocumentForm();

      await loadDocuments();

      return;
    }

    if (!documentFiles.length) {
      alert(
        'Select at least one document',
      );

      return;
    }

    for (
      const file of
        documentFiles
    ) {
      const preparedFile =
        await compressDealerOrderDocumentImage(
          file,
        );

      const formData =
        new FormData();

      formData.append(
        'file',
        preparedFile,
      );

      formData.append(
        'title',
        title,
      );

      formData.append(
        'category',
        category,
      );

      formData.append(
        'documentType',
        documentType,
      );

      formData.append(
        'tags',
        documentForm.tags.trim(),
      );

      formData.append(
        'remarks',
        documentForm.remarks.trim(),
      );

      const res = await fetch(
        `${API_BASE_URL}/dealer-auth/orders/${orderId}/documents/upload`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body:
            formData,
        },
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            'Document upload failed',
        );
      }
    }

    alert(
      documentFiles.length === 1
        ? 'Document uploaded successfully'
        : `${documentFiles.length} documents uploaded successfully`,
    );

    resetDocumentForm();

    await loadDocuments();

    await Promise.all([
      loadDocumentSuggestions(
        'title',
      ),

      loadDocumentSuggestions(
        'category',
      ),

      loadDocumentSuggestions(
        'documentType',
      ),

      loadDocumentSuggestions(
        'tag',
      ),
    ]);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.message ||
        'Failed to save document',
    );
  } finally {
    setDocumentUploading(false);
  }
};

const startEditDocument = (
  item: any,
) => {
  setEditingDocumentId(
    Number(item.id),
  );

  setDocumentForm({
    title:
      item.title || '',

    category:
      item.category || '',

    documentType:
      item.documentType || '',

    tags:
      Array.isArray(item.tags)
        ? item.tags.join(', ')
        : String(
            item.tags || '',
          ),

    remarks:
      item.remarks || '',
  });

  setDocumentFiles([]);
};

  const loadDetail = async () => {
    try {
      const headers = authHeaders();

      const [detailRes, commentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dealer-auth/orders/${orderId}`, { headers }),
        fetch(`${API_BASE_URL}/dealer-auth/orders/${orderId}/comments`, { headers }),
      ]);

      const detailData = await detailRes.json();
      const commentsData = await commentsRes.json();

      setDetail(detailData);
      setComments(Array.isArray(commentsData) ? commentsData : []);

      try {
  const invoiceRes = await fetch(
    `${API_BASE_URL}/dealer-auth/orders/${orderId}/invoices`,
    { headers },
  );

  if (invoiceRes.ok) {
    const invoiceData = await invoiceRes.json();

    const latestPi =
      Array.isArray(invoiceData?.proformaInvoices) &&
      invoiceData.proformaInvoices.length
        ? invoiceData.proformaInvoices[0]
        : null;

    const latestFinalInvoice =
      Array.isArray(invoiceData?.finalInvoices) &&
      invoiceData.finalInvoices.length
        ? invoiceData.finalInvoices[0]
        : null;

    setPi(latestPi ? { invoice: latestPi } : null);
    setInvoice(latestFinalInvoice ? { invoice: latestFinalInvoice } : null);
  }
} catch {}
await loadDocuments();

await Promise.all([
  loadDocumentSuggestions(
    'title',
  ),

  loadDocumentSuggestions(
    'category',
  ),

  loadDocumentSuggestions(
    'documentType',
  ),

  loadDocumentSuggestions(
    'tag',
  ),
]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (e: FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/dealer-auth/orders/${orderId}/comments`,
        {
          method: 'POST',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Comment failed');
        return;
      }

      setComment('');
      setMessage('Comment added successfully');
      loadDetail();
    } catch (error) {
      console.error(error);
      setMessage('Comment error');
    }
  };

    const openPdf = async (
  type: 'pi' | 'invoice',
  id: number,
  download = false,
) => {
  try {
    const token = localStorage.getItem('dealer_token');

    if (!token) {
      window.location.href = '/dealer-login';
      return;
    }

    const endpoint =
      type === 'pi'
        ? `/dealer-auth/proforma-invoice/${id}/pdf`
        : `/dealer-auth/final-invoice/${id}/pdf`;

    const url = `${API_BASE_URL}${endpoint}?token=${encodeURIComponent(token)}`;

    if (download) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${
        type === 'pi' ? 'Proforma-Invoice' : 'Final-Invoice'
      }-${id}.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    window.open(url, '_blank');
  } catch (error) {
    console.error(error);
    alert('PDF error. Please try again.');
  }
};

  const openPdfInBrowser = (
  type: 'pi' | 'invoice',
  id: number,
) => {
  const endpoint =
    type === 'pi'
      ? `/dealer-auth/proforma-invoice/${id}/pdf`
      : `/dealer-auth/final-invoice/${id}/pdf`;

  window.open(`${API_BASE_URL}${endpoint}`, '_blank');
};

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl bg-white/10 px-8 py-6 font-black">
          Loading order...
        </div>
      </main>
    );
  }

  const order = detail?.order;
  const items = detail?.items || [];
  const payments = detail?.payments || [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a href="/dealer-portal/orders" className="text-sm font-black text-orange-300">
            ← Back to Orders
          </a>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">
                {order?.orderNumber || `Order #${order?.id}`}
              </h1>
              <p className="mt-1 text-sm text-white/60">
                {order?.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '-'}
              </p>
            </div>

            <StatusBadge status={order?.status} />
          </div>
        </header>

        <section className="mt-6 grid gap-5 md:grid-cols-4">
          <SummaryCard label="Total" value={`₹${Number(order?.totalAmount || 0).toLocaleString('en-IN')}`} />
          <SummaryCard label="Paid" value={`₹${Number(order?.paidAmount || 0).toLocaleString('en-IN')}`} />
          <SummaryCard label="Pending" value={`₹${Number(order?.pendingAmount || 0).toLocaleString('en-IN')}`} />
          <SummaryCard label="Payment" value={order?.paymentType || '-'} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl lg:col-span-2">
            <h2 className="text-xl font-black">Order Items</h2>

            <div className="mt-4 space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-black">{item.materialName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {item.brand || '-'} · HSN {item.hsnCode || '-'}
                      </p>
                    </div>

                    <p className="font-black">
                      ₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-5">
                    <Info
  label="Ordered"
  value={`${item.quantity || 0}${item.unit && item.unit !== '1' ? ` ${item.unit}` : ''}`}
/>
                    <Info
  label="Accepted"
  value={`${item.acceptedQuantity || 0}${item.unit && item.unit !== '1' ? ` ${item.unit}` : ''}`}
/>

<Info
  label="Pending"
  value={`${item.pendingQuantity || 0}${item.unit && item.unit !== '1' ? ` ${item.unit}` : ''}`}
/>
                    <Info label="Rate" value={`₹${Number(item.sellingRate || 0).toLocaleString('en-IN')}`} />
                    <Info label="GST" value={`${item.gstPercent || 0}%`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] bg-gradient-to-br from-orange-500 to-yellow-400 p-6 text-slate-950 shadow-xl">
              <h2 className="text-xl font-black">Delivery & Pickup</h2>

              <div className="mt-4 space-y-3 text-sm font-bold">
                <Info label="Expected Delivery" value={order?.expectedDeliveryAt ? new Date(order.expectedDeliveryAt).toLocaleString('en-IN') : '-'} />
                <Info label="Pickup Staff" value={order?.assignedStaffName || '-'} />
                <Info label="Pickup Phone" value={order?.assignedStaffPhone || '-'} />
                <Info label="Remarks" value={order?.remarks || '-'} />
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl">
              <h2 className="text-xl font-black">Invoices</h2>

              <div className="mt-4 grid gap-3">
                <InvoiceBox
  title="Proforma Invoice"
  value={pi?.invoice?.invoiceNumber || 'Not generated'}
  amount={pi?.invoice?.totalAmount}
  invoiceId={pi?.invoice?.id}
  onView={() => openPdf('pi', pi.invoice.id, false)}
  onDownload={() => openPdf('pi', pi.invoice.id, true)}
  onOpenBrowser={() => openPdfInBrowser('pi', pi.invoice.id)}
/>

<InvoiceBox
  title="Final Invoice"
  value={invoice?.invoice?.invoiceNumber || 'Not generated'}
  amount={invoice?.invoice?.totalAmount}
  invoiceId={invoice?.invoice?.id}
  onView={() => openPdf('invoice', invoice.invoice.id, false)}
  onDownload={() => openPdf('invoice', invoice.invoice.id, true)}
  onOpenBrowser={() => openPdfInBrowser('invoice', invoice.invoice.id)}
/>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl">
              <h2 className="text-xl font-black">Payments</h2>

              <div className="mt-4 space-y-3">
                {!payments.length && (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                    No payment submitted yet.
                  </p>
                )}

                {payments.map((payment: any) => (
  <div key={payment.id} className="rounded-2xl bg-slate-50 p-4">
    <p className="font-black">
      ₹{Number(payment.amount || 0).toLocaleString('en-IN')}
    </p>

    <p className="mt-1 text-xs font-semibold text-slate-500">
      {payment.paymentMode || '-'}
    </p>

    <div className="mt-3 flex flex-wrap gap-2">
      <span
        className={`rounded-full px-3 py-1 text-xs font-black ${
          payment.status === 'APPROVED'
            ? 'bg-green-100 text-green-700'
            : payment.status === 'REJECTED'
            ? 'bg-red-100 text-red-700'
            : 'bg-amber-100 text-amber-700'
        }`}
      >
        {payment.status || 'SUBMITTED'}
      </span>
    </div>

    {payment.approvalNote && (
      <div className="mt-3 rounded-2xl bg-blue-50 p-3">
        <p className="text-xs font-black text-blue-500">
          Company Remark
        </p>

        <p className="mt-1 text-sm font-semibold text-blue-900">
          {payment.approvalNote}
        </p>
      </div>
    )}

    {payment.receiptUrl && (
      <a
        href={payment.receiptUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"
      >
        View Receipt
      </a>
    )}
  </div>
))}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl">
  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
    <div>
      <h2 className="text-xl font-black">
        Order Documents
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        View and store certificates,
        warranty documents, reports and
        other files permanently against
        this Dealer Order.
      </p>
    </div>

    {editingDocumentId && (
      <button
        type="button"
        onClick={
          resetDocumentForm
        }
        className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700"
      >
        Cancel Edit
      </button>
    )}
  </div>

  <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4">
    <p className="font-black">
      {editingDocumentId
        ? 'Edit Document Details'
        : 'Upload Document'}
    </p>

    <p className="mt-1 text-xs font-semibold text-slate-500">
      Document names, categories and
      types are flexible. Images larger
      than 1 MB are compressed before
      upload.
    </p>

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <div>
        <input
          list="dealer-document-title-suggestions"
          value={
            documentForm.title
          }
          onChange={(e) => {
            const value =
              e.target.value;

            setDocumentForm({
              ...documentForm,
              title: value,
            });

            loadDocumentSuggestions(
              'title',
              value,
            );
          }}
          placeholder="Document Title"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
        />

        <datalist id="dealer-document-title-suggestions">
          {titleSuggestions.map(
            (value) => (
              <option
                key={value}
                value={value}
              />
            ),
          )}
        </datalist>
      </div>

      <div>
        <input
          list="dealer-document-category-suggestions"
          value={
            documentForm.category
          }
          onChange={(e) => {
            const value =
              e.target.value;

            setDocumentForm({
              ...documentForm,
              category:
                value,
            });

            loadDocumentSuggestions(
              'category',
              value,
            );
          }}
          placeholder="Document Category"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
        />

        <datalist id="dealer-document-category-suggestions">
          {categorySuggestions.map(
            (value) => (
              <option
                key={value}
                value={value}
              />
            ),
          )}
        </datalist>
      </div>

      <div>
        <input
          list="dealer-document-type-suggestions"
          value={
            documentForm.documentType
          }
          onChange={(e) => {
            const value =
              e.target.value;

            setDocumentForm({
              ...documentForm,
              documentType:
                value,
            });

            loadDocumentSuggestions(
              'documentType',
              value,
            );
          }}
          placeholder="Document Type"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
        />

        <datalist id="dealer-document-type-suggestions">
          {typeSuggestions.map(
            (value) => (
              <option
                key={value}
                value={value}
              />
            ),
          )}
        </datalist>
      </div>

      {!editingDocumentId && (
        <input
          id="dealer-order-document-files"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) =>
            setDocumentFiles(
              Array.from(
                e.target.files ||
                  [],
              ),
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
        />
      )}

      <div className="md:col-span-2">
        <input
          list="dealer-document-tag-suggestions"
          value={
            documentForm.tags
          }
          onChange={(e) => {
            const value =
              e.target.value;

            setDocumentForm({
              ...documentForm,
              tags: value,
            });

            const currentTag =
              value
                .split(',')
                .pop()
                ?.trim() ||
              '';

            loadDocumentSuggestions(
              'tag',
              currentTag,
            );
          }}
          placeholder="Tags separated by commas"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
        />

        <datalist id="dealer-document-tag-suggestions">
          {tagSuggestions.map(
            (value) => (
              <option
                key={value}
                value={value}
              />
            ),
          )}
        </datalist>
      </div>

      <textarea
        value={
          documentForm.remarks
        }
        onChange={(e) =>
          setDocumentForm({
            ...documentForm,
            remarks:
              e.target.value,
          })
        }
        placeholder="Remarks / Notes"
        rows={3}
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold md:col-span-2"
      />
    </div>

    {documentFiles.length >
      0 && (
      <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">
        {documentFiles.length}{' '}
        file(s) selected
      </p>
    )}

    <button
      type="button"
      onClick={saveDocuments}
      disabled={
        documentUploading
      }
      className="mt-4 rounded-xl bg-gradient-to-r from-blue-700 to-sky-500 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
    >
      {documentUploading
        ? editingDocumentId
          ? 'Saving...'
          : 'Uploading...'
        : editingDocumentId
          ? 'Update Document'
          : 'Upload Document'}
    </button>
  </div>

  <div className="mt-5 space-y-3">
    {documentsLoading ? (
      <div className="rounded-xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
        Loading documents...
      </div>
    ) : !documents.length ? (
      <div className="rounded-xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
        No documents uploaded for this
        order yet.
      </div>
    ) : (
      documents.map(
        (item: any) => (
          <div
            key={item.id}
            className="rounded-[1.3rem] border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words font-black">
                    {item.title}
                  </p>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black text-blue-700">
                    {item.category}
                  </span>

                  <span className="rounded-full bg-purple-100 px-3 py-1 text-[10px] font-black text-purple-700">
                    {
                      item.documentType
                    }
                  </span>
                </div>

                <p className="mt-2 break-all text-xs font-semibold text-slate-500">
                  {item.fileName}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Uploaded by:{' '}
                  {item.uploadedByName ||
                    '-'}
                  {' · '}
                  {item.uploadedSource ||
                    '-'}
                  {' · '}
                  {item.createdAt
                    ? new Date(
                        item.createdAt,
                      ).toLocaleString(
                        'en-IN',
                      )
                    : '-'}
                </p>

                {Array.isArray(
                  item.tags,
                ) &&
                  item.tags.length >
                    0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.tags.map(
                        (
                          tag: string,
                          index: number,
                        ) => (
                          <span
                            key={`${item.id}-${tag}-${index}`}
                            className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600"
                          >
                            #{tag}
                          </span>
                        ),
                      )}
                    </div>
                  )}

                {item.remarks && (
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold text-slate-600">
                    {item.remarks}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white"
                >
                  View
                </a>

                <a
                  href={item.fileUrl}
                  download={
                    item.fileName
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"
                >
                  Download
                </a>

                <button
                  type="button"
                  onClick={() =>
                    startEditDocument(
                      item,
                    )
                  }
                  className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white"
                >
                  Edit Details
                </button>
              </div>
            </div>
          </div>
        ),
      )
    )}
  </div>
</section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-xl font-black">Order Comments</h2>

          <div className="mt-4 space-y-3">
            {!comments.length && (
              <p className="text-sm text-white/60">No comments yet.</p>
            )}

            {comments.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/10 p-4">
                <p className="font-black">{item.createdByName || 'User'}</p>
                <p className="mt-1 text-sm text-white/75">{item.comment}</p>
              </div>
            ))}
          </div>

          <form onSubmit={submitComment} className="mt-5 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write comment..."
              className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            />

            <button className="rounded-2xl bg-gradient-to-r from-blue-700 to-sky-500 px-6 py-3 text-sm font-black text-white">
              Send
            </button>
          </form>

          {message && <p className="mt-3 text-sm font-bold text-orange-200">{message}</p>}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.7rem] bg-white p-5 text-slate-900 shadow-xl">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function InvoiceBox({
  title,
  value,
  amount,
  invoiceId,
  onView,
  onDownload,
  onOpenBrowser,
}: {
  title: string;
  value: string;
  amount?: number;
  invoiceId?: number;
  onView?: () => void;
  onDownload?: () => void;
  onOpenBrowser?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-400">{title}</p>

      <p className="mt-1 font-black">{value}</p>

      {amount !== undefined && (
        <p className="mt-1 text-sm font-bold text-slate-500">
          ₹{Number(amount || 0).toLocaleString('en-IN')}
        </p>
      )}

      {invoiceId ? (
        <div className="mt-4 grid gap-2">
  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={onView}
      className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
    >
      View
    </button>

    <button
      type="button"
      onClick={onDownload}
      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
    >
      Download
    </button>
  </div>
</div>
      ) : (
        <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
          PDF not available yet
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full bg-blue-100 px-5 py-3 text-sm font-black text-blue-700">
      {status || 'SUBMITTED'}
    </span>
  );
}