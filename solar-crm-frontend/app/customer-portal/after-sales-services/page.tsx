'use client';

import { useEffect, useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import dayjs from 'dayjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerAfterSalesServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingServiceId, setSavingServiceId] = useState<number | null>(null);

  const [formMap, setFormMap] = useState<Record<number, any>>({});

  const projects = dashboard?.projects || [];

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('customer_token')
      : '';

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('customer_token')}`,
    'Content-Type': 'application/json',
  });

  const loadData = async () => {
    try {
      setLoading(true);

      if (!token) {
        window.location.href = '/customer-login';
        return;
      }

      const [dashboardRes, servicesRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/customer-auth/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/customer-auth/after-sales-services`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/customer-auth/after-sales-requests`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const dashboardData = await dashboardRes.json();
      const servicesData = await servicesRes.json();
      const requestsData = await requestsRes.json();

      if (!dashboardRes.ok) {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer');
        window.location.href = '/customer-login';
        return;
      }

      setDashboard(dashboardData);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setRequests(Array.isArray(requestsData?.data) ? requestsData.data : []);
    } catch (error) {
      console.error(error);
      alert('Failed to load after-sales services');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (serviceId: number, key: string, value: any) => {
    setFormMap((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || {}),
        [key]: value,
      },
    }));
  };

  const submitRequest = async (service: any) => {
    const form = formMap[service.id] || {};

    if (!form.preferredDate) {
      alert('Please select preferred visit date');
      return;
    }

    try {
      setSavingServiceId(service.id);

      const res = await fetch(
        `${API_BASE_URL}/customer-auth/after-sales-requests`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            serviceId: service.id,
            projectId: form.projectId || projects[0]?.id || '',
            preferredDate: form.preferredDate,
            customerRemarks: form.customerRemarks || '',
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Failed to submit service request');
        return;
      }

      alert('Service request submitted successfully');

      setFormMap((prev) => ({
        ...prev,
        [service.id]: {
          projectId: '',
          preferredDate: '',
          customerRemarks: '',
        },
      }));

      await loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to submit service request');
    } finally {
      setSavingServiceId(null);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50">
        <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <p className="text-sm font-bold text-gray-600">
            Loading after-sales services...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50 pb-24">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <a
          href="/customer-portal"
          className="inline-flex rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
        >
          ← Back to Dashboard
        </a>

        <section className="mt-5 overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <p className="text-sm font-bold opacity-90">
            Aditya Solars After-Sales
          </p>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            Request Service
          </h1>

          <p className="mt-2 max-w-3xl text-sm font-semibold text-white/90">
            Select an after-sales service, check its charge, choose your preferred
            visit date and send a request to Aditya Solars team.
          </p>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">
            Available Services
          </h2>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {services.length === 0 ? (
              <div className="rounded-3xl border border-dashed p-8 text-center text-sm font-bold text-gray-500 lg:col-span-2">
                No after-sales services are available right now.
              </div>
            ) : (
              services.map((service) => {
                const form = formMap[service.id] || {};

                return (
                  <div
                    key={service.id}
                    className="rounded-[2rem] border bg-gray-50 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-black text-gray-900">
                          {service.serviceName}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-500">
                          {service.category || 'General Service'}
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
                        {service.isPaidService
                          ? `₹${Number(service.price || 0).toLocaleString(
                              'en-IN',
                            )}`
                          : 'Free'}
                      </span>
                    </div>

                    {service.estimatedVisitTime && (
                      <p className="mt-3 text-sm font-semibold text-blue-700">
                        Estimated Duration: {service.estimatedVisitTime}
                      </p>
                    )}

                    {service.description && (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600">
                        {service.description}
                      </p>
                    )}

                    <div className="mt-5 grid gap-3">
                      {projects.length > 1 && (
                        <select
                          value={form.projectId || ''}
                          onChange={(e) =>
                            updateForm(service.id, 'projectId', e.target.value)
                          }
                          className="rounded-2xl border bg-white p-3"
                        >
                          <option value="">Select Project</option>
                          {projects.map((project: any) => (
                            <option key={project.id} value={project.id}>
                              Project #{project.id} -{' '}
                              {project.projectSize || project.customerName || '-'}
                            </option>
                          ))}
                        </select>
                      )}

                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <MobileDatePicker
                          label="Preferred Visit Date"
                          value={
                            form.preferredDate
                              ? dayjs(form.preferredDate)
                              : null
                          }
                          minDate={dayjs()}
                          onChange={(newDate) =>
                            updateForm(
                              service.id,
                              'preferredDate',
                              newDate ? newDate.format('YYYY-MM-DD') : '',
                            )
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                            },
                          }}
                        />
                      </LocalizationProvider>

                      <textarea
                        rows={3}
                        placeholder="Remarks / issue details"
                        value={form.customerRemarks || ''}
                        onChange={(e) =>
                          updateForm(
                            service.id,
                            'customerRemarks',
                            e.target.value,
                          )
                        }
                        className="rounded-2xl border bg-white p-3"
                      />

                      <button
                        onClick={() => submitRequest(service)}
                        disabled={savingServiceId === service.id}
                        className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        {savingServiceId === service.id
                          ? 'Submitting...'
                          : 'Submit Service Request'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">
            My Service Requests
          </h2>

          <div className="mt-5 space-y-3">
            {requests.length === 0 ? (
              <div className="rounded-3xl border border-dashed p-6 text-center text-sm font-bold text-gray-500">
                No service requests yet.
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-3xl border bg-gray-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-gray-900">
                        #{request.id} {request.serviceName}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Project #{request.projectId || '-'} ·{' '}
                        {request.isPaidService
                          ? `₹${Number(request.servicePrice || 0).toLocaleString(
                              'en-IN',
                            )}`
                          : 'Free'}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Preferred:{' '}
                        {request.preferredDate
                          ? new Date(request.preferredDate).toLocaleDateString(
                              'en-IN',
                            )
                          : '-'}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-black text-blue-700">
                      {formatLabel(request.status)}
                    </span>
                  </div>

                  {request.customerRemarks && (
                    <p className="mt-3 whitespace-pre-line text-sm text-gray-600">
                      {request.customerRemarks}
                    </p>
                  )}

                  {request.adminRemarks && (
                    <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">
                      Admin Remarks: {request.adminRemarks}
                    </p>
                  )}

                  {request.completionRemarks && (
                    <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                      Completion: {request.completionRemarks}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}