'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerComplaintsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
const [uploadingPhotos, setUploadingPhotos] = useState(false);

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

  const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');

        const maxWidth = 1280;
        const maxHeight = 1280;

        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.jpg'),
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              },
            );

            resolve(compressedFile);
          },
          'image/jpeg',
          0.72,
        );
      };

      img.src = String(event.target?.result || '');
    };

    reader.readAsDataURL(file);
  });
};

const handlePhotoSelect = async (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const files = Array.from(event.target.files || []);

  if (!files.length) return;

  const compressedFiles: File[] = [];

  for (const file of files) {
    const compressed = await compressImage(file);
    compressedFiles.push(compressed);
  }

  const previews = compressedFiles.map((file) =>
    URL.createObjectURL(file),
  );

  setSelectedPhotos((prev) => [...prev, ...compressedFiles].slice(0, 10));
  setPhotoPreviews((prev) => [...prev, ...previews].slice(0, 10));

  event.target.value = '';
};

const removePhoto = (index: number) => {
  setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
};

const uploadComplaintPhotos = async () => {
  if (!selectedPhotos.length) {
    return [];
  }

  const token = localStorage.getItem('customer_token');

  const formData = new FormData();

  selectedPhotos.forEach((file) => {
    formData.append('files', file);
  });

  setUploadingPhotos(true);

  try {
    const res = await fetch(
      `${API_BASE_URL}/customer-auth/complaint-attachments/upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || 'Photo upload failed');
    }

    return data?.attachments || [];
  } finally {
    setUploadingPhotos(false);
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

      const uploadedAttachments = await uploadComplaintPhotos();

      const res = await fetch(
        `${API_BASE_URL}/customer-auth/complaints`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
  ...form,
  attachments: uploadedAttachments,
}),
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

      setSelectedPhotos([]);
setPhotoPreviews([]);

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

                <div className="rounded-[2rem] border-2 border-dashed border-orange-200 bg-orange-50 p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-sm font-black text-orange-800">
        📷 Add Complaint Photos
      </p>
      <p className="mt-1 text-xs text-orange-700">
        Upload inverter, panel, meter, structure or site photos. Images are compressed automatically.
      </p>
    </div>

    <label className="cursor-pointer rounded-2xl bg-orange-500 px-4 py-3 text-xs font-black text-white shadow hover:bg-orange-600">
      Add Photos
      <input
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handlePhotoSelect}
        className="hidden"
      />
    </label>
  </div>

  {photoPreviews.length > 0 && (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {photoPreviews.map((preview, index) => (
        <div
          key={preview}
          className="relative overflow-hidden rounded-2xl border bg-white shadow"
        >
          <img
            src={preview}
            alt={`Complaint photo ${index + 1}`}
            className="h-24 w-full object-cover"
          />

          <button
            type="button"
            onClick={() => removePhoto(index)}
            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs font-black text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )}

  {selectedPhotos.length > 0 && (
    <p className="mt-3 text-xs font-semibold text-orange-700">
      {selectedPhotos.length} photo(s) selected. Maximum 10 photos allowed.
    </p>
  )}
</div>

                <button
                  disabled={loading}
                  onClick={createComplaint}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-4 font-black text-white"
                >
                  {loading || uploadingPhotos
  ? uploadingPhotos
    ? 'Uploading Photos...'
    : 'Submitting...'
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

                          {Array.isArray(item.attachments) && item.attachments.length > 0 && (
  <div className="mt-4 grid grid-cols-3 gap-3">
    {item.attachments.map((attachment: any) => (
      <a
        key={attachment.id || attachment.fileUrl}
        href={attachment.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="overflow-hidden rounded-2xl border bg-white shadow"
      >
        <img
          src={attachment.fileUrl}
          alt={attachment.fileName || 'Complaint attachment'}
          className="h-24 w-full object-cover"
        />
      </a>
    ))}
  </div>
)}
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