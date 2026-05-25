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

type ContractorProof = {
  id: number;
  projectId: number;
  assignmentId: number;
  proofType?: string;
  fileUrl?: string;
  latitude?: string;
  longitude?: string;
  gpsAddress?: string;
  remarks?: string;
  uploadedByName?: string;
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
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [proofs, setProofs] =
  useState<Record<number, ContractorProof[]>>({});

const [proofFiles, setProofFiles] =
  useState<Record<number, File[]>>({});

const [proofType, setProofType] =
  useState<Record<number, string>>({});

const [proofRemarks, setProofRemarks] =
  useState<Record<number, string>>({});

const [gpsData, setGpsData] =
  useState<Record<number, {
    latitude?: string;
    longitude?: string;
    gpsAddress?: string;
  }>>({});

const [uploadingProofId, setUploadingProofId] =
  useState<number | null>(null);

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

      const assignedProjects = Array.isArray(res.data)
  ? res.data
  : [];

setProjects(assignedProjects);

assignedProjects.forEach((item: ContractorProject) => {
  if (item?.id) {
    fetchProofs(item.id);
  }
});
    } catch (error) {
      console.error(error);
      alert(
        'Failed to load contractor assigned projects',
      );
    } finally {
      setLoading(false);
    }
  };

  const updateContractorWork = async (
  assignmentId: number,
  status: string,
  remarks?: string,
) => {
  try {
    setUpdatingId(assignmentId);

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/contractor-assignment/${assignmentId}`,
      {
        status,
        remarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Work updated');

    fetchProjects();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to update work',
    );
  } finally {
    setUpdatingId(null);
  }
};

const fetchProofs = async (assignmentId: number) => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/contractor-assignment/${assignmentId}/proofs`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setProofs((prev) => ({
      ...prev,
      [assignmentId]: Array.isArray(res.data)
        ? res.data
        : [],
    }));
  } catch (error) {
    console.error('Failed to load contractor proofs:', error);
  }
};

const captureGps = (assignmentId: number) => {
  if (!navigator.geolocation) {
    alert('GPS is not supported on this device');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
  const latitude = String(
    position.coords.latitude,
  );

  const longitude = String(
    position.coords.longitude,
  );

  let gpsAddress = '';

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    );

    const data = await response.json();

    gpsAddress =
      data?.display_name || '';
  } catch (error) {
    console.error(
      'Failed to fetch GPS address:',
      error,
    );
  }

  setGpsData((prev) => ({
    ...prev,
    [assignmentId]: {
      latitude,
      longitude,
      gpsAddress,
    },
  }));

  alert('GPS captured successfully');
},
    () => {
      alert('Unable to capture GPS location');
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  );
};

const uploadContractorProofs = async (
  item: ContractorProject,
) => {
  const files = proofFiles[item.id] || [];

  if (!files.length) {
    alert('Please select proof photos');
    return;
  }

  if (!proofType[item.id]) {
    alert('Please select proof type');
    return;
  }

  const gps = gpsData[item.id];

  if (!gps?.latitude || !gps?.longitude) {
    alert('Please capture GPS before uploading proof');
    return;
  }

  try {
    setUploadingProofId(item.id);

    const token = localStorage.getItem('token');

    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('assignmentId', String(item.id));
    formData.append('projectId', String(item.projectId));
    formData.append('proofType', proofType[item.id]);
    formData.append('latitude', gps.latitude);
    formData.append('longitude', gps.longitude);
    formData.append('gpsAddress', gps.gpsAddress || '');
    formData.append('remarks', proofRemarks[item.id] || '');

    await axios.post(
      `${API_BASE_URL}/project/contractor-proof/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    alert('Proof uploaded successfully');

    setProofFiles((prev) => ({
      ...prev,
      [item.id]: [],
    }));

    setProofRemarks((prev) => ({
      ...prev,
      [item.id]: '',
    }));

    fetchProofs(item.id);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to upload proof',
    );
  } finally {
    setUploadingProofId(null);
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

                  <div className="flex flex-wrap justify-end gap-2">
  {['IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].map((status) => (
    <button
      key={status}
      onClick={() =>
        updateContractorWork(
          item.id,
          status,
          item.remarks || '',
        )
      }
      disabled={updatingId === item.id}
      className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
    >
      {status.replaceAll('_', ' ')}
    </button>
  ))}
</div>

<div className="mt-5 rounded-xl border bg-gray-50 p-4">
  <h3 className="font-bold text-gray-800">
    Upload GPS Proof Photos
  </h3>

  <div className="mt-3 grid gap-3 md:grid-cols-2">
    <select
      value={proofType[item.id] || ''}
      onChange={(e) =>
        setProofType((prev) => ({
          ...prev,
          [item.id]: e.target.value,
        }))
      }
      className="rounded-xl border p-3"
    >
      <option value="">Select Proof Type</option>
      <option value="STRUCTURE_PHOTO">Structure Photo</option>
      <option value="PILLAR_PHOTO">Pillar Photo</option>
      <option value="PANEL_SERIAL_NUMBER_PHOTO">
        Panel Serial Number Photo
      </option>
      <option value="INVERTER_PHOTO">Inverter Photo</option>
      <option value="SOLAR_METER_PHOTO">Solar Meter Photo</option>
      <option value="NET_METER_PHOTO">Net Meter Photo</option>
      <option value="EARTHING_WITH_CLIENT_PHOTO">
        Earthing With Client Photo
      </option>
      <option value="PANEL_WITH_CLIENT_PHOTO">
        Panel With Client Photo
      </option>
      <option value="OTHER">Other</option>
    </select>

    <input
      type="file"
      accept="image/*"
      multiple
      onChange={(e) =>
        setProofFiles((prev) => ({
          ...prev,
          [item.id]: Array.from(e.target.files || []),
        }))
      }
      className="rounded-xl border bg-white p-3"
    />

    <input
      placeholder="GPS Address / Site Note"
      value={gpsData[item.id]?.gpsAddress || ''}
      onChange={(e) =>
        setGpsData((prev) => ({
          ...prev,
          [item.id]: {
            ...(prev[item.id] || {}),
            gpsAddress: e.target.value,
          },
        }))
      }
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Proof Remarks"
      value={proofRemarks[item.id] || ''}
      onChange={(e) =>
        setProofRemarks((prev) => ({
          ...prev,
          [item.id]: e.target.value,
        }))
      }
      className="rounded-xl border p-3"
    />
  </div>

  <div className="mt-3 flex flex-wrap gap-2">
    <button
      onClick={() => captureGps(item.id)}
      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
    >
      Capture GPS
    </button>

    <button
      onClick={() => uploadContractorProofs(item)}
      disabled={uploadingProofId === item.id}
      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
    >
      {uploadingProofId === item.id
        ? 'Uploading...'
        : 'Upload Proof'}
    </button>
  </div>

  {gpsData[item.id]?.latitude && (
    <p className="mt-2 text-xs text-gray-500">
      GPS: {gpsData[item.id]?.latitude},{' '}
      {gpsData[item.id]?.longitude}
    </p>
  )}

  <div className="mt-5">
    <h4 className="font-semibold text-gray-800">
      Uploaded Proofs
    </h4>

    {(!proofs[item.id] || proofs[item.id].length === 0) ? (
      <p className="mt-2 text-sm text-gray-500">
        No proofs uploaded yet.
      </p>
    ) : (
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {proofs[item.id].map((proof) => (
          <a
            key={proof.id}
            href={proof.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border bg-white p-3 hover:bg-gray-50"
          >
            {proof.fileUrl && (
              <img
                src={proof.fileUrl}
                alt={proof.proofType || 'Proof'}
                className="h-32 w-full rounded-lg object-cover"
              />
            )}

            <p className="mt-2 text-xs font-semibold text-gray-700">
              {(proof.proofType || 'OTHER').replaceAll('_', ' ')}
            </p>

            <p className="text-xs text-gray-500">
              By: {proof.uploadedByName || '-'}
            </p>

            {proof.latitude && proof.longitude && (
              <p className="text-xs text-gray-500">
                GPS: {proof.latitude}, {proof.longitude}
              </p>
            )}
          </a>
        ))}
      </div>
    )}
  </div>
</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}