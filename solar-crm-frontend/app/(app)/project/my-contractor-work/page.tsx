'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type ContractorProject = {
  id: number;
  projectId: number;
  contractorName?: string;
  contractorPhone?: string;
  scheduledDate?: string;
  amount?: number;
  status?: string;
  remarks?: string;
  assignedByName?: string;
  createdAt?: string;
};

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString(
    'en-IN',
  )}`;
}

export default function MyContractorWorkPage() {
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<
    ContractorProject[]
  >([]);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const res = await axios.get(
        `${API_BASE_URL}/project/contractor/my-projects`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      setProjects(
        Array.isArray(res.data) ? res.data : [],
      );
    } catch (error) {
      console.error(error);
      alert(
        'Failed to load contractor assigned projects',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          My Contractor Work
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View assigned execution projects and work schedules.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Loading assigned projects...
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            No contractor work assigned yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white p-5 shadow"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-bold text-gray-800">
                    Project #{item.projectId}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Contractor:{' '}
                    {item.contractorName || '-'}
                  </p>

                  <p className="text-sm text-gray-500">
                    Phone:{' '}
                    {item.contractorPhone || '-'}
                  </p>

                  <p className="text-sm text-gray-500">
                    Scheduled:{' '}
                    {item.scheduledDate
                      ? new Date(
                          item.scheduledDate,
                        ).toLocaleDateString(
                          'en-IN',
                        )
                      : '-'}
                  </p>

                  <p className="text-sm text-gray-500">
                    Assigned By:{' '}
                    {item.assignedByName || '-'}
                  </p>

                  {item.remarks && (
                    <p className="mt-3 rounded-xl bg-gray-100 p-3 text-sm text-gray-700">
                      {item.remarks}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {item.status || 'ASSIGNED'}
                  </span>

                  <p className="text-xl font-bold text-green-700">
                    {money(item.amount)}
                  </p>

                  <Link
                    href={`/project/${item.projectId}`}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Open Project
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}