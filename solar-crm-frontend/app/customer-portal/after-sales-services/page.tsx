'use client';

import { useEffect, useRef, useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import dayjs from 'dayjs';
import AudioRecorder from '@/components/AudioRecorder';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerAfterSalesServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingServiceId, setSavingServiceId] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
const [requestActivities, setRequestActivities] = useState<any[]>([]);
const [timelineLoading, setTimelineLoading] = useState(false);
const [ratingMap, setRatingMap] = useState<Record<number, any>>({});
const [ratingSavingId, setRatingSavingId] = useState<number | null>(null);
const [requestStatusFilter, setRequestStatusFilter] = useState('ALL');
const [requestPage, setRequestPage] = useState(1);
const [requestTotalPages, setRequestTotalPages] = useState(1);

const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
const [audioPreview, setAudioPreview] = useState('');
const [uploadingAttachments, setUploadingAttachments] = useState(false);

const photoInputRef = useRef<HTMLInputElement | null>(null);
const audioInputRef = useRef<HTMLInputElement | null>(null);


  const [selectedServiceId, setSelectedServiceId] = useState('');
const [serviceSearch, setServiceSearch] = useState('');
const [showServiceOptions, setShowServiceOptions] = useState(false);
const [requestForm, setRequestForm] = useState({
  projectId: '',
  preferredDate: '',
  customerRemarks: '',
});
const serviceSearchRef = useRef<HTMLDivElement>(null);
const remarksRef = useRef<HTMLTextAreaElement>(null);

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
        fetch(
  `${API_BASE_URL}/customer-auth/after-sales-requests?page=${requestPage}&limit=10&status=${
    requestStatusFilter === 'ALL' || requestStatusFilter === 'OPEN'
      ? ''
      : requestStatusFilter
  }`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
),
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
      const urlParams = new URLSearchParams(window.location.search);
const requestIdFromUrl = urlParams.get('requestId');

if (requestIdFromUrl && Array.isArray(requestsData?.data)) {
  const matchedRequest = requestsData.data.find(
    (item: any) => String(item.id) === String(requestIdFromUrl),
  );

  if (matchedRequest) {
    setTimeout(() => {
      loadRequestTimeline(matchedRequest);
    }, 300);
  }
}
      setRequestTotalPages(Number(requestsData?.totalPages || 1));
    } catch (error) {
      console.error(error);
      alert('Failed to load after-sales services');
    } finally {
      setLoading(false);
    }
  };

  const loadRequestTimeline = async (request: any) => {
  try {
    setSelectedRequest(request);
    setTimelineLoading(true);

    const res = await fetch(
      `${API_BASE_URL}/customer-auth/after-sales-requests/${request.id}/activities`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json();
    setRequestActivities(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error(error);
    setRequestActivities([]);
  } finally {
    setTimelineLoading(false);
  }
};

const filteredServices = services.filter((service) => {
  const text = `${service.serviceName || ''} ${service.category || ''} ${service.description || ''}`.toLowerCase();

  return text.includes(serviceSearch.toLowerCase());
});

const groupedFilteredServices = filteredServices.reduce(
  (groups: Record<string, any[]>, service) => {
    const category = service.category || 'General Service';

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(service);
    return groups;
  },
  {},
);

const selectedService = services.find(
  (service) => String(service.id) === String(selectedServiceId),
);

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
            height = Math.round(
              (height * maxWidth) / width,
            );
            width = maxWidth;
          }
        } else if (height > maxHeight) {
          width = Math.round(
            (width * maxHeight) / height,
          );
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height,
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const compressedFile =
              new File(
                [blob],
                file.name.replace(
                  /\.[^/.]+$/,
                  '.jpg',
                ),
                {
                  type: 'image/jpeg',
                  lastModified:
                    Date.now(),
                },
              );

            resolve(compressedFile);
          },
          'image/jpeg',
          0.72,
        );
      };

      img.src = String(
        event.target?.result || '',
      );
    };

    reader.readAsDataURL(file);
  });
};

const handlePhotoSelect = async (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const files =
    Array.from(
      event.target.files || [],
    );

  if (!files.length) return;

  const remainingSlots =
    10 - selectedPhotos.length;

  if (remainingSlots <= 0) {
    alert(
      'Maximum 10 photos allowed',
    );
    event.target.value = '';
    return;
  }

  const filesToProcess =
    files.slice(0, remainingSlots);

  const compressedFiles: File[] = [];

  for (const file of filesToProcess) {
    const compressed =
      await compressImage(file);

    compressedFiles.push(compressed);
  }

  const previews =
    compressedFiles.map((file) =>
      URL.createObjectURL(file),
    );

  setSelectedPhotos((prev) => [
    ...prev,
    ...compressedFiles,
  ]);

  setPhotoPreviews((prev) => [
    ...prev,
    ...previews,
  ]);

  if (files.length > remainingSlots) {
    alert(
      'Maximum 10 photos allowed',
    );
  }

  event.target.value = '';
};

const removePhoto = (
  index: number,
) => {
  setPhotoPreviews((prev) => {
    const preview = prev[index];

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    return prev.filter(
      (_, i) => i !== index,
    );
  });

  setSelectedPhotos((prev) =>
    prev.filter(
      (_, i) => i !== index,
    ),
  );
};

const handleAudioSelect = (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const file =
    event.target.files?.[0] ||
    null;

  if (!file) return;

  if (audioPreview) {
    URL.revokeObjectURL(
      audioPreview,
    );
  }

  setSelectedAudio(file);

  setAudioPreview(
    URL.createObjectURL(file),
  );

  event.target.value = '';
};

const removeAudio = () => {
  if (audioPreview) {
    URL.revokeObjectURL(
      audioPreview,
    );
  }

  setSelectedAudio(null);
  setAudioPreview('');
};

const uploadAfterSalesAttachments =
  async () => {
    if (
      !selectedPhotos.length &&
      !selectedAudio
    ) {
      return [];
    }

    const token =
      localStorage.getItem(
        'customer_token',
      );

    const formData =
      new FormData();

    selectedPhotos.forEach(
      (file) => {
        formData.append(
          'files',
          file,
        );
      },
    );

    if (selectedAudio) {
      formData.append(
        'files',
        selectedAudio,
      );
    }

    setUploadingAttachments(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/customer-auth/after-sales-attachments/upload`,
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            'Attachment upload failed',
        );
      }

      return (
        data?.attachments || []
      );
    } finally {
      setUploadingAttachments(
        false,
      );
    }
  };

  const submitRequest = async () => {
  const service = selectedService;

  if (!service) {
    alert('Please select a service');
    return;
  }

  if (!requestForm.preferredDate) {
    alert('Please select preferred visit date');
    return;
  }

  if (
  !service.isPaidService &&
  selectedPhotos.length === 0
) {
  alert(
    'Please upload at least one photo for this free service',
  );
  return;
}

  try {
    setSavingServiceId(service.id);

    const uploadedAttachments =
  await uploadAfterSalesAttachments();

    const res = await fetch(
      `${API_BASE_URL}/customer-auth/after-sales-requests`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
  serviceId: service.id,

  projectId:
    requestForm.projectId ||
    projects[0]?.id ||
    '',

  preferredDate:
    requestForm.preferredDate,

  customerRemarks:
    requestForm.customerRemarks ||
    '',

  attachments:
    uploadedAttachments,
}),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Failed to submit service request');
      return;
    }

    alert('Service request submitted successfully');

    setSelectedServiceId('');
    setServiceSearch('');
    setRequestForm({
      projectId: '',
      preferredDate: '',
      customerRemarks: '',
    });

    photoPreviews.forEach(
  (preview) =>
    URL.revokeObjectURL(
      preview,
    ),
);

if (audioPreview) {
  URL.revokeObjectURL(
    audioPreview,
  );
}

setSelectedPhotos([]);
setPhotoPreviews([]);
setSelectedAudio(null);
setAudioPreview('');

    await loadData();
  } catch (error) {
    console.error(error);
    alert('Failed to submit service request');
  } finally {
    setSavingServiceId(null);
  }
};

  const submitRating = async (request: any) => {
  const rating = ratingMap[request.id] || {};

  if (!rating.rating) {
    alert('Please select a rating.');
    return;
  }

  try {
    setRatingSavingId(request.id);

    const res = await fetch(
      `${API_BASE_URL}/customer-auth/after-sales-requests/${request.id}/rating`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: Number(rating.rating),
          feedback: rating.feedback || '',
          wouldRecommend: rating.wouldRecommend !== false,
        }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || 'Failed to submit rating');
    }

    alert('Thank you for your feedback!');

    await loadData();
  } catch (error: any) {
    console.error(error);
    alert(error.message);
  } finally {
    setRatingSavingId(null);
  }
};

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      serviceSearchRef.current &&
      !serviceSearchRef.current.contains(event.target as Node)
    ) {
      setShowServiceOptions(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);

  return () => {
    document.removeEventListener(
      'mousedown',
      handleClickOutside,
    );
  };
}, []);

useEffect(() => {
  if (!loading) {
    loadData();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [requestPage, requestStatusFilter]);

const filteredRequests =
  requestStatusFilter === 'ALL'
    ? requests
    : requests.filter((request) => {
        if (requestStatusFilter === 'OPEN') {
          return !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(
            request.status,
          );
        }

        return request.status === requestStatusFilter;
      });

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
    Request After-Sales Service
  </h2>

  <p className="mt-1 text-sm font-semibold text-gray-500">
    Search and select a service, review charges, choose preferred visit date and submit your request.
  </p>

  {services.length === 0 ? (
    <div className="mt-5 rounded-3xl border border-dashed p-8 text-center text-sm font-bold text-gray-500">
      No after-sales services are available right now.
    </div>
  ) : (
    <div className="mt-5 grid gap-4">
      <div
  ref={serviceSearchRef}
  className="relative"
>
        <div className="relative">
  <input
    placeholder="Search service by name, category or issue"
    value={serviceSearch}
    onChange={(e) => {
      setServiceSearch(e.target.value);
      setShowServiceOptions(true);
    }}
    onFocus={() => setShowServiceOptions(true)}
    className="w-full rounded-2xl border bg-white p-3 pr-12"
  />

  {selectedService && (
    <button
      type="button"
      onClick={() => {
  setSelectedServiceId('');
  setServiceSearch('');

  setRequestForm({
    projectId: '',
    preferredDate: '',
    customerRemarks: '',
  });

  photoPreviews.forEach(
    (preview) =>
      URL.revokeObjectURL(
        preview,
      ),
  );

  if (audioPreview) {
    URL.revokeObjectURL(
      audioPreview,
    );
  }

  setSelectedPhotos([]);
  setPhotoPreviews([]);
  setSelectedAudio(null);
  setAudioPreview('');
}}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-200 px-2 py-1 text-xs font-bold hover:bg-gray-300"
    >
      ✕
    </button>
  )}
</div>

        {showServiceOptions && (
          <div className="absolute z-40 mt-1 max-h-80 w-full overflow-y-auto rounded-2xl border bg-white shadow-xl">
            {filteredServices.length === 0 ? (
              <div className="p-4 text-sm font-semibold text-gray-500">
                No matching service found.
              </div>
            ) : (
              Object.entries(groupedFilteredServices).map(([category, categoryServices]) => (
  <div key={category}>
    <div className="bg-gray-100 px-4 py-2 text-xs font-black uppercase text-gray-500">
      {category}
    </div>

    {(categoryServices as any[]).map((service) => (
      <button
        key={service.id}
        type="button"
        onClick={() => {
          setSelectedServiceId(String(service.id));
          setServiceSearch(
            `${service.serviceName} - ${
              service.isPaidService
                ? `₹${Number(service.price || 0).toLocaleString('en-IN')}`
                : 'Free'
            }`,
          );
          setShowServiceOptions(false);

          setTimeout(() => {
            remarksRef.current?.focus();
          }, 100);
        }}
        className="block w-full border-b p-4 text-left hover:bg-orange-50"
      >
        <p className="font-black text-gray-900">
          {service.serviceName}
        </p>
        <p className="mt-1 text-xs font-semibold text-gray-500">
          {service.isPaidService
            ? `₹${Number(service.price || 0).toLocaleString('en-IN')}`
            : 'Free'}
        </p>
      </button>
    ))}
  </div>
))
            )}
          </div>
        )}
      </div>

      {selectedService && (
        <div className="rounded-3xl bg-emerald-50 p-4">
          <p className="text-lg font-black text-emerald-900">
            {selectedService.serviceName}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
    {selectedService.category || 'General Service'}
  </span>

  <span className="text-sm font-bold text-emerald-700">
    {selectedService.isPaidService
      ? `₹${Number(selectedService.price || 0).toLocaleString('en-IN')}`
      : 'Free'}
  </span>
</div>

          {selectedService.estimatedVisitTime && (
            <p className="mt-2 text-sm font-semibold text-blue-700">
              Estimated Duration: {selectedService.estimatedVisitTime}
            </p>
          )}

          {selectedService.description && (
            <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
              {selectedService.description}
            </p>
          )}
        </div>
      )}

      {projects.length > 1 && (
        <select
          value={requestForm.projectId}
          onChange={(e) =>
            setRequestForm({
              ...requestForm,
              projectId: e.target.value,
            })
          }
          className="rounded-2xl border bg-white p-3"
        >
          <option value="">Select Project</option>
          {projects.map((project: any) => (
            <option key={project.id} value={project.id}>
              Project #{project.id} - {project.projectSize || project.customerName || '-'}
            </option>
          ))}
        </select>
      )}

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MobileDatePicker
          label="Preferred Visit Date"
          value={
            requestForm.preferredDate
              ? dayjs(requestForm.preferredDate)
              : null
          }
          minDate={dayjs()}
          onChange={(newDate) =>
            setRequestForm({
              ...requestForm,
              preferredDate: newDate ? newDate.format('YYYY-MM-DD') : '',
            })
          }
          slotProps={{
            textField: {
              fullWidth: true,
            },
          }}
        />
      </LocalizationProvider>

      <textarea
  ref={remarksRef}
        rows={4}
        placeholder="Remarks / issue details"
        value={requestForm.customerRemarks}
        onChange={(e) =>
          setRequestForm({
            ...requestForm,
            customerRemarks: e.target.value,
          })
        }
        className="rounded-2xl border bg-white p-3"
      />

      <div className="rounded-[2rem] border-2 border-dashed border-orange-200 bg-orange-50 p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-sm font-black text-orange-800">
        📷 Add Service Photos
        {selectedService &&
          !selectedService.isPaidService && (
            <span className="ml-1 text-red-600">
              *
            </span>
          )}
      </p>

      <p className="mt-1 text-xs text-orange-700">
        {selectedService &&
        !selectedService.isPaidService
          ? 'At least one photo is required for this free service.'
          : 'Upload inverter, panel, meter, structure or site photos if relevant.'}
        {' '}Images are compressed automatically.
      </p>
    </div>

    <button
      type="button"
      onClick={() =>
        photoInputRef.current?.click()
      }
      className="rounded-2xl bg-orange-500 px-4 py-3 text-xs font-black text-white shadow hover:bg-orange-600"
    >
      Add Photos
    </button>

    <input
      ref={photoInputRef}
      type="file"
      accept="image/*"
      multiple
      capture="environment"
      onChange={
        handlePhotoSelect
      }
      className="hidden"
    />
  </div>

  {photoPreviews.length > 0 && (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {photoPreviews.map(
        (preview, index) => (
          <div
            key={preview}
            className="relative overflow-hidden rounded-2xl border bg-white shadow"
          >
            <img
              src={preview}
              alt={`Service photo ${
                index + 1
              }`}
              className="h-24 w-full object-cover"
            />

            <button
              type="button"
              onClick={() =>
                removePhoto(index)
              }
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs font-black text-white"
            >
              ×
            </button>
          </div>
        ),
      )}
    </div>
  )}

  {selectedPhotos.length > 0 && (
    <p className="mt-3 text-xs font-semibold text-orange-700">
      {selectedPhotos.length}{' '}
      photo(s) selected. Maximum
      10 photos allowed.
    </p>
  )}
</div>

<div className="rounded-[2rem] border-2 border-dashed border-blue-200 bg-blue-50 p-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-sm font-black text-blue-800">
        🎙 Add Voice Note
      </p>

      <p className="mt-1 text-xs text-blue-700">
        Record a voice note
        directly or upload audio
        from your phone recorder.
        Optional.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <AudioRecorder
        onRecordingReady={(
          file,
        ) => {
          if (
            audioPreview
          ) {
            URL.revokeObjectURL(
              audioPreview,
            );
          }

          setSelectedAudio(
            file,
          );

          if (file) {
            setAudioPreview(
              URL.createObjectURL(
                file,
              ),
            );
          } else {
            setAudioPreview(
              '',
            );
          }
        }}
      />

      <button
        type="button"
        onClick={() =>
          audioInputRef.current?.click()
        }
        className="rounded-2xl bg-gray-900 px-4 py-3 text-xs font-black text-white"
      >
        Upload Audio File
      </button>

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        capture
        onChange={
          handleAudioSelect
        }
        className="hidden"
      />
    </div>
  </div>

  {audioPreview && (
    <div className="mt-4 rounded-2xl bg-white p-3">
      <audio
        controls
        src={audioPreview}
        className="w-full"
      />

      <button
        type="button"
        onClick={
          removeAudio
        }
        className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-xs font-black text-red-700"
      >
        Remove Audio
      </button>
    </div>
  )}
</div>

      <button
        onClick={submitRequest}
        disabled={
  !!savingServiceId ||
  uploadingAttachments
}
        className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
      >
        {uploadingAttachments
  ? 'Uploading Attachments...'
  : savingServiceId
    ? 'Submitting...'
    : 'Submit Service Request'}
      </button>
    </div>
  )}
</section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">
            My Service Requests
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
  {[
    ['ALL', 'All'],
    ['OPEN', 'Open'],
    ['ASSIGNED', 'Assigned'],
    ['IN_PROGRESS', 'In Progress'],
    ['COMPLETED', 'Completed'],
    ['CANCELLED', 'Cancelled'],
  ].map(([value, label]) => (
    <button
      key={value}
      type="button"
      onClick={() => {
  setRequestStatusFilter(value);
  setRequestPage(1);
}}
      className={`rounded-full px-4 py-2 text-xs font-black ${
        requestStatusFilter === value
          ? 'bg-orange-600 text-white'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      {label}
    </button>
  ))}
</div>

          <div className="mt-5 space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed p-6 text-center text-sm font-bold text-gray-500">
                No service requests yet.
              </div>
            ) : (
              filteredRequests.map((request) => (
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

                    <button
  onClick={() => loadRequestTimeline(request)}
  className="rounded-full bg-gray-900 px-4 py-2 text-xs font-black text-white"
>
  View Timeline
</button>
                  </div>

                  {request.customerRemarks && (
                    <p className="mt-3 whitespace-pre-line text-sm text-gray-600">
                      {request.customerRemarks}
                    </p>
                  )}

                  {Array.isArray(
  request.customerAttachments,
) &&
  request.customerAttachments
    .length > 0 && (
    <div className="mt-4 rounded-2xl border bg-white p-4">
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">
        Your Attachments
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {request.customerAttachments
          .filter(
            (
              attachment: any,
            ) =>
              attachment.proofType ===
                'CUSTOMER_PHOTO' ||
              String(
                attachment.mimeType ||
                  '',
              ).startsWith(
                'image/',
              ),
          )
          .map(
            (
              attachment: any,
            ) => (
              <a
                key={
                  attachment.id ||
                  attachment.fileUrl
                }
                href={
                  attachment.fileUrl
                }
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <img
                  src={
                    attachment.fileUrl
                  }
                  alt={
                    attachment.fileName ||
                    'Service photo'
                  }
                  className="h-24 w-full object-cover"
                />
              </a>
            ),
          )}
      </div>

      {request.customerAttachments
        .filter(
          (
            attachment: any,
          ) =>
            attachment.proofType ===
              'CUSTOMER_AUDIO' ||
            String(
              attachment.mimeType ||
                '',
            ).startsWith(
              'audio/',
            ) ||
            attachment.mimeType ===
              'video/webm',
        )
        .map(
          (
            attachment: any,
          ) => (
            <div
              key={
                attachment.id ||
                attachment.fileUrl
              }
              className="mt-3 rounded-2xl bg-blue-50 p-3"
            >
              <p className="mb-2 text-xs font-black text-blue-700">
                Voice Note
              </p>

              <audio
                controls
                src={
                  attachment.fileUrl
                }
                className="w-full"
              />
            </div>
          ),
        )}
    </div>
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

                  {request.status === 'COMPLETED' && request.rating && (
  <div className="mt-4 rounded-3xl bg-emerald-50 p-4">
    <p className="font-black text-emerald-900">
      Thank you for your feedback
    </p>

    <p className="mt-2 text-2xl">
      {'⭐'.repeat(Number(request.rating.rating || 0))}
    </p>

    {request.rating.feedback && (
      <p className="mt-2 whitespace-pre-line text-sm text-emerald-800">
        {request.rating.feedback}
      </p>
    )}

    <p className="mt-2 text-xs font-bold text-emerald-700">
      Recommend: {request.rating.wouldRecommend ? 'Yes' : 'No'}
    </p>
  </div>
)}

{request.status === 'COMPLETED' && !request.rating && (
  <div className="mt-4 rounded-3xl bg-emerald-50 p-4">
    <p className="font-black text-emerald-900">Rate This Service</p>

    <div className="mt-3 flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() =>
            setRatingMap((prev) => ({
              ...prev,
              [request.id]: {
                ...(prev[request.id] || {}),
                rating: star,
              },
            }))
          }
          className="text-3xl"
        >
          {Number(ratingMap[request.id]?.rating || 0) >= star ? '⭐' : '☆'}
        </button>
      ))}
    </div>

    <textarea
      rows={3}
      placeholder="Share your feedback"
      value={ratingMap[request.id]?.feedback || ''}
      onChange={(e) =>
        setRatingMap((prev) => ({
          ...prev,
          [request.id]: {
            ...(prev[request.id] || {}),
            feedback: e.target.value,
          },
        }))
      }
      className="mt-3 w-full rounded-2xl border bg-white p-3"
    />

    <label className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-900">
      <input
        type="checkbox"
        checked={ratingMap[request.id]?.wouldRecommend !== false}
        onChange={(e) =>
          setRatingMap((prev) => ({
            ...prev,
            [request.id]: {
              ...(prev[request.id] || {}),
              wouldRecommend: e.target.checked,
            },
          }))
        }
      />
      I would recommend Aditya Solars
    </label>

    <button
      onClick={() => submitRating(request)}
      disabled={ratingSavingId === request.id}
      className="mt-3 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
    >
      {ratingSavingId === request.id ? 'Submitting...' : 'Submit Rating'}
    </button>
  </div>
)}
                </div>
              ))
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
  <button
    disabled={requestPage <= 1}
    onClick={() => setRequestPage(requestPage - 1)}
    className="rounded-2xl bg-gray-200 px-4 py-2 text-sm font-black text-gray-700 disabled:opacity-50"
  >
    Previous
  </button>

  <p className="text-sm font-bold text-gray-500">
    Page {requestPage} of {requestTotalPages}
  </p>

  <button
    disabled={requestPage >= requestTotalPages}
    onClick={() => setRequestPage(requestPage + 1)}
    className="rounded-2xl bg-gray-200 px-4 py-2 text-sm font-black text-gray-700 disabled:opacity-50"
  >
    Next
  </button>
</div>
        </section>
      </div>

      {selectedRequest && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            Service Request #{selectedRequest.id}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {selectedRequest.serviceName}
          </p>
        </div>

        <button
          onClick={() => setSelectedRequest(null)}
          className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
        >
          Close
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {timelineLoading ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm font-bold text-gray-500">
            Loading timeline...
          </div>
        ) : requestActivities.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm font-bold text-gray-500">
            No timeline yet.
          </div>
        ) : (
          requestActivities.map((activity) => (
            <div key={activity.id} className="rounded-3xl bg-gray-50 p-4">
              <p className="font-black text-gray-900">
                {activity.activityTitle}
              </p>

              {activity.activityDescription && (
                <p className="mt-1 text-sm text-gray-600">
                  {activity.activityDescription}
                </p>
              )}

              <p className="mt-2 text-xs font-semibold text-gray-500">
                {activity.performedByName || 'System'} ·{' '}
                {activity.createdAt
                  ? new Date(activity.createdAt).toLocaleString('en-IN')
                  : '-'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}
    </main>
  );
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}