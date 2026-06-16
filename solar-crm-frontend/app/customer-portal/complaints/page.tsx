'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerComplaintsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    projectId: '',
    subject: 'OTHER',
    complaintText: '',
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('customer_token');

      if (!token) {
        window.location.href = '/customer-login';
        return;
      }

      const res = await fetch(`${API_BASE_URL}/customer-auth/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setDashboard(data);
      setProjects(data?.projects || []);
      setComplaints(data?.complaints || []);
    } catch (error) {
      console.error(error);
    }
  };

  const createComplaint = async () => {
    if (!form.projectId) {
      alert('Please select project');
      return;
    }

    if (!form.complaintText.trim()) {
      alert('Please enter complaint details');
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('customer_token');

      const res = await fetch(
        `${API_BASE_URL}/customer-auth/complaints`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || 'Failed to create complaint');
        return;
      }

      alert('Complaint submitted successfully');

      setForm({
        projectId: '',
        subject: 'OTHER',
        complaintText: '',
      });

      loadDashboard();
    } catch (error) {
      console.error(error);
      alert('Failed to create complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <h1 className="text-4xl font-black">
            🛠 Complaints & Service Support
          </h1>

          <p className="mt-2 text-white/90">
            Raise complaints and track service updates.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-gray-900">
                Raise Complaint
              </h2>

              <div className="mt-5 space-y-4">
                <select
                  value={form.projectId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      projectId: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border p-4"
                >
                  <option value="">Select Project</option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      Project #{project.id} - {project.customerName}
                    </option>
                  ))}
                </select>

                <select
                  value={form.subject}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subject: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border p-4"
                >
                  <option value="OTHER">Other</option>
                  <option value="INSTALLATION">
                    Installation Issue
                  </option>
                  <option value="INVERTER">
                    Inverter Issue
                  </option>
                  <option value="PANEL">
                    Panel Issue
                  </option>
                  <option value="SUBSIDY">
                    Subsidy Issue
                  </option>
                  <option value="PAYMENT">
                    Payment Issue
                  </option>
                  <option value="SERVICE">
                    Service Request
                  </option>
                </select>

                <textarea
                  rows={5}
                  value={form.complaintText}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      complaintText: e.target.value,
                    })
                  }
                  placeholder="Describe your issue"
                  className="w-full rounded-2xl border p-4"
                />

                <button
                  disabled={loading}
                  onClick={createComplaint}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-4 font-black text-white"
                >
                  {loading
                    ? 'Submitting...'
                    : 'Submit Complaint'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-gray-900">
                My Complaints
              </h2>

              <div className="mt-5 space-y-4">
                {complaints.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
                    No complaints found
                  </div>
                ) : (
                  complaints.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[2rem] border bg-gray-50 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black">
                            {item.subject}
                          </p>

                          <p className="mt-2 text-sm text-gray-600">
                            {item.complaintText}
                          </p>
                        </div>

                        <span className="rounded-full bg-orange-100 px-4 py-2 text-xs font-black text-orange-700">
                          {item.status || 'OPEN'}
                        </span>
                      </div>

                      {item.serviceDate && (
                        <div className="mt-4 rounded-2xl bg-blue-50 p-3">
                          <p className="text-sm font-semibold text-blue-700">
                            Service Date:
                          </p>

                          <p className="font-black text-blue-900">
                            {new Date(
                              item.serviceDate,
                            ).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      )}

                      {item.staffRemarks && (
                        <div className="mt-4 rounded-2xl bg-yellow-50 p-3">
                          <p className="text-sm font-semibold text-yellow-700">
                            Staff Remarks
                          </p>

                          <p className="font-medium">
                            {item.staffRemarks}
                          </p>
                        </div>
                      )}

                      {item.resolutionNote && (
                        <div className="mt-4 rounded-2xl bg-green-50 p-3">
                          <p className="text-sm font-semibold text-green-700">
                            Resolution
                          </p>

                          <p className="font-medium">
                            {item.resolutionNote}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}