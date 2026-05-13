'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Project = {
  id: number;
  customerName?: string;
  customerPhone?: string;
  city?: string;
  zone?: string;
  branchName?: string;
  projectType?: string;
  projectCost?: number;
  netAmount?: number;
  status?: string;
  marketingHeadApprovalStatus?: string;
  ownerApprovalStatus?: string;
  createdAt?: string;
};

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const res = await axios.get(`${API_BASE_URL}/project`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setProjects(res.data || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      alert('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow">
  <h1 className="text-2xl font-bold text-gray-800">
    Project Department
  </h1>

  <p className="mt-1 text-sm text-gray-500">
    Project orders, approvals, documents, and department workflow will be managed here.
  </p>

  <div className="mt-4 flex flex-wrap gap-3">
    <Link
      href="/project/create"
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      + Create Project
    </Link>
  </div>
</div>

      {loading ? (
        <div className="rounded-2xl bg-white p-4 shadow">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow">
          No projects found yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div key={project.id} className="rounded-2xl bg-white p-4 shadow">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    #{project.id} - {project.customerName || 'Unnamed Customer'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {project.customerPhone || 'No phone'} | {project.branchName || 'No branch'} | {project.city || 'No city'} |{' '}
                    {project.zone || 'No zone'}
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {project.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Project Type</p>
                  <p className="font-semibold text-gray-800">{project.projectType || '-'}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Project Cost</p>
                  <p className="font-semibold text-gray-800">
                    ₹{Number(project.projectCost || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Net Amount</p>
                  <p className="font-semibold text-gray-800">
                    ₹{Number(project.netAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Created</p>
                  <p className="font-semibold text-gray-800">
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString('en-IN')
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
  <div className="rounded-xl bg-yellow-50 p-3">
    <p className="text-gray-500">Marketing Head Approval</p>
    <p className="font-semibold text-yellow-700">
      {project.marketingHeadApprovalStatus || 'PENDING'}
    </p>
  </div>

  <div className="rounded-xl bg-purple-50 p-3">
    <p className="text-gray-500">Owner Approval</p>
    <p className="font-semibold text-purple-700">
      {project.ownerApprovalStatus || 'PENDING'}
    </p>
  </div>
</div>

<div className="mt-4">
  <Link
    href={`/project/${project.id}`}
    className="inline-block rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
  >
    View Details
  </Link>
</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}