'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const EXECUTION_ORDER = [
  'STRUCTURE_WORK',
  'STRUCTURE_INSPECTION',
  'PILLAR_WORK',
  'PILLAR_INSPECTION',
  'PANEL_INSTALLED',
  'INVERTER_INSTALLED',
  'EARTHING_PACKING',
  'GENERATION_STARTED',
  'GENERATION_INSPECTION',
  'INVOICE_FILE_GIVEN',
  'NON_DCR_PENDING',
];

export default function CustomerProjectTrackerPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const projects = dashboard?.projects || [];
  const executionActivities = dashboard?.executionActivities || [];
  const paymentSummary = dashboard?.paymentSummary || {};
  const paymentInstallments = dashboard?.paymentInstallments || [];
  const documents = dashboard?.customerDocuments || [];
  const complaints = dashboard?.complaints || [];

  const selectedProject =
    projects.find((project: any) => String(project.id) === selectedProjectId) ||
    projects[0];

  const projectActivities = useMemo(() => {
    if (!selectedProject) return [];

    return executionActivities
      .filter((item: any) => Number(item.projectId) === Number(selectedProject.id))
      .sort(
        (a: any, b: any) =>
          EXECUTION_ORDER.indexOf(a.activityType) -
          EXECUTION_ORDER.indexOf(b.activityType),
      );
  }, [executionActivities, selectedProject]);

  const projectInstallments = paymentInstallments.filter(
    (item: any) => Number(item.projectId) === Number(selectedProject?.id),
  );

  const projectDocuments = documents.filter(
    (item: any) => Number(item.projectId) === Number(selectedProject?.id),
  );

  const projectComplaints = complaints.filter(
    (item: any) => Number(item.projectId) === Number(selectedProject?.id),
  );

  const completedActivities = projectActivities.filter(
    (item: any) => item.status === 'COMPLETED',
  ).length;

  const executionPercent = projectActivities.length
    ? Math.round((completedActivities / projectActivities.length) * 100)
    : 0;

  const projectPaid = projectInstallments.reduce(
    (sum: number, item: any) => sum + Number(item.paidAmount || 0),
    0,
  );

  const projectTotal = projectInstallments.reduce(
    (sum: number, item: any) => sum + Number(item.amount || 0),
    0,
  );

  const paymentPercent = projectTotal
    ? Math.round((projectPaid / projectTotal) * 100)
    : 0;

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('customer_token');

      if (!token) {
        window.location.href = '/customer-login';
        return;
      }

      const res = await fetch(`${API_BASE_URL}/customer-auth/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        window.location.href = '/customer-login';
        return;
      }

      setDashboard(data);

      if (data?.projects?.[0]?.id) {
        setSelectedProjectId(String(data.projects[0].id));
      }
    } catch (error) {
      console.error(error);
      alert('Failed to load project tracker');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50">
        <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-3xl">
            📊
          </div>
          <p className="text-sm font-semibold text-gray-600">
            Loading project tracker...
          </p>
        </div>
      </main>
    );
  }

  if (!selectedProject) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-gray-900">
            No linked project found
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Please contact Aditya Solars team to link your project.
          </p>
        </div>
      </main>
    );
  }

  const stages = buildMainStages(selectedProject);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <p className="text-sm font-bold opacity-90">Solar Project Tracker</p>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            📊 My Project Progress
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-white/90">
            Track project approval, installation work, payments, documents and
            support status in one place.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <HeroCard title="Project" value={`#${selectedProject.id}`} />
            <HeroCard
              title="Current Stage"
              value={customerStatus(selectedProject.status)}
            />
            <HeroCard title="Execution" value={`${executionPercent}%`} />
            <HeroCard title="Payment" value={`${paymentPercent}%`} />
          </div>
        </div>

        {projects.length > 1 && (
          <div className="mt-6 rounded-[2rem] bg-white p-5 shadow-xl">
            <label className="mb-2 block text-sm font-black text-gray-700">
              Select Project
            </label>
            <select
              value={String(selectedProject.id)}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-2xl border p-3"
            >
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  Project #{project.id} - {project.projectSize || project.customerName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl lg:col-span-2">
            <h2 className="text-2xl font-black text-gray-900">
              Main Project Journey
            </h2>

            <div className="mt-6 space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-black ${
                        stage.done
                          ? 'bg-emerald-500 text-white'
                          : stage.active
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {stage.done ? '✓' : index + 1}
                    </div>

                    {index < stages.length - 1 && (
                      <div
                        className={`h-14 w-1 ${
                          stage.done ? 'bg-emerald-300' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>

                  <div
                    className={`flex-1 rounded-3xl border p-4 ${
                      stage.active
                        ? 'border-orange-200 bg-orange-50'
                        : stage.done
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-gray-900">
                          {stage.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {stage.description}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          stage.done
                            ? 'bg-emerald-100 text-emerald-700'
                            : stage.active
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {stage.done ? 'Completed' : stage.active ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <SummaryCard
              title="Project Details"
              rows={[
                ['Project Size', selectedProject.projectSize || '-'],
                ['Project Type', selectedProject.projectType || '-'],
                ['Branch', selectedProject.branchName || '-'],
                ['Owner', selectedProject.projectOwnerName || '-'],
                ['K Number', selectedProject.electricityKNumber || '-'],
              ]}
            />

            <SummaryCard
              title="Quick Counts"
              rows={[
                ['Visible Documents', String(projectDocuments.length)],
                ['Complaints', String(projectComplaints.length)],
                ['Installments', String(projectInstallments.length)],
                ['Activities', String(projectActivities.length)],
              ]}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-gray-900">
                Installation Work Progress
              </h2>

              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">
                {executionPercent}%
              </span>
            </div>

            <ProgressBar percent={executionPercent} />

            <div className="mt-5 space-y-3">
              {projectActivities.length === 0 ? (
                <EmptyCard text="No execution activities scheduled yet." />
              ) : (
                projectActivities.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="rounded-3xl border bg-gray-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-gray-900">
                          {formatLabel(activity.activityType)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Scheduled:{' '}
                          {activity.scheduledDate
                            ? new Date(activity.scheduledDate).toLocaleDateString('en-IN')
                            : '-'}
                        </p>
                      </div>

                      <StatusBadge status={activity.status} />
                    </div>

                    {activity.remarks && (
                      <p className="mt-2 text-sm text-gray-600">
                        {activity.remarks}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-gray-900">
                Payment Progress
              </h2>

              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
                {paymentPercent}%
              </span>
            </div>

            <ProgressBar percent={paymentPercent} />

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <InfoBox label="Total" value={formatCurrency(projectTotal)} />
              <InfoBox label="Paid" value={formatCurrency(projectPaid)} />
              <InfoBox
                label="Pending"
                value={formatCurrency(projectTotal - projectPaid)}
              />
            </div>

            <div className="mt-5 space-y-3">
              {projectInstallments.length === 0 ? (
                <EmptyCard text="No installments found." />
              ) : (
                projectInstallments.map((item: any) => (
                  <div key={item.id} className="rounded-3xl border bg-gray-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-gray-900">
                          {formatLabel(item.label)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Due:{' '}
                          {item.dueDate
                            ? new Date(item.dueDate).toLocaleDateString('en-IN')
                            : '-'}
                        </p>
                      </div>

                      <StatusBadge status={item.status} />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <InfoBox label="Amount" value={formatCurrency(item.amount)} />
                      <InfoBox label="Paid" value={formatCurrency(item.paidAmount)} />
                      <InfoBox
                        label="Pending"
                        value={formatCurrency(item.pendingAmount)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-4">
          <a href="/customer-portal/work-calendar">
            <ActionCard
              icon="📅"
              title="Work Calendar"
              text="View upcoming work and request date changes."
            />
          </a>

          <a href="/customer-portal/documents">
            <ActionCard
              icon="📁"
              title="Documents"
              text="View customer-visible project documents."
            />
          </a>

          <a href="/customer-portal/payments">
            <ActionCard
              icon="💳"
              title="Payments"
              text="View installments and upload receipts."
            />
          </a>

          <a href="/customer-portal/complaints">
            <ActionCard
              icon="🛠"
              title="Support"
              text="Raise and track complaints."
            />
          </a>
        </div>
      </div>
    </main>
  );
}

function buildMainStages(project: any) {
  const status = project.status || '';

  return [
    {
      title: 'Project Created',
      description: 'Your solar project has been created in Aditya Solars system.',
      done: true,
      active: status === 'PENDING_APPROVAL' || status === 'DRAFT',
    },
    {
      title: 'Approval Process',
      description: 'Project details are being reviewed by the internal team.',
      done: ['APPROVED', 'LOAN_PROCESS', 'PROJECT_MANAGEMENT', 'SUBSIDY_PROCESS', 'ELECTRICITY_PROCESS', 'COMPLETED'].includes(status),
      active: status === 'PENDING_APPROVAL',
    },
    {
      title: project.projectType === 'LOAN' ? 'Loan Process' : 'Payment Process',
      description:
        project.projectType === 'LOAN'
          ? 'Loan related work is being processed.'
          : 'Payment and project confirmation are being processed.',
      done: ['PROJECT_MANAGEMENT', 'SUBSIDY_PROCESS', 'ELECTRICITY_PROCESS', 'COMPLETED'].includes(status),
      active: status === 'LOAN_PROCESS' || status === 'PAYMENT_PENDING',
    },
    {
      title: 'Installation & Project Work',
      description: 'Structure, panels, inverter, earthing and generation work.',
      done: ['SUBSIDY_PROCESS', 'ELECTRICITY_PROCESS', 'COMPLETED'].includes(status),
      active: status === 'PROJECT_MANAGEMENT' || status === 'INSTALLATION',
    },
    {
      title: 'Subsidy / Electricity Process',
      description: 'Subsidy, DISCOM and net-metering related process.',
      done: status === 'COMPLETED',
      active: status === 'SUBSIDY_PROCESS' || status === 'ELECTRICITY_PROCESS',
    },
    {
      title: 'Project Completed',
      description: 'Your project is completed.',
      done: status === 'COMPLETED',
      active: false,
    },
  ];
}

function HeroCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/20 p-4 backdrop-blur">
      <p className="text-xs font-bold opacity-90">{title}</p>
      <p className="mt-2 break-words text-2xl font-black">{value}</p>
    </div>
  );
}

function SummaryCard({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-xl">
      <h2 className="text-xl font-black text-gray-900">{title}</h2>

      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl bg-gray-50 px-4 py-3"
          >
            <p className="text-xs font-bold text-gray-500">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-gray-900">
              {value || '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const safePercent = Math.max(0, Math.min(100, percent || 0));

  return (
    <div className="mt-4 h-4 overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-500"
        style={{ width: `${safePercent}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const value = status || 'PENDING';

  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
      {formatLabel(value)}
    </span>
  );
}

function InfoBox({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-gray-900">
        {value || '-'}
      </p>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed p-6 text-center text-sm font-semibold text-gray-500">
      {text}
    </div>
  );
}

function ActionCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="h-full rounded-[2rem] bg-white p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-100 text-3xl">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-black text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-500">{text}</p>
    </div>
  );
}

function customerStatus(status?: string) {
  const map: Record<string, string> = {
    PENDING_APPROVAL: 'Approval Pending',
    APPROVED: 'Approved',
    LOAN_PROCESS: 'Loan In Process',
    PROJECT_MANAGEMENT: 'Installation In Progress',
    SUBSIDY_PROCESS: 'Subsidy In Process',
    ELECTRICITY_PROCESS: 'Electricity In Process',
    PAYMENT_PENDING: 'Payment Pending',
    INSTALLATION: 'Installation In Progress',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
  };

  return map[status || ''] || formatLabel(status);
}

function formatCurrency(value?: number | string) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}