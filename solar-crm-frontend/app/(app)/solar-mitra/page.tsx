'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import { getAuthHeaders } from '@/lib/authHeaders';
import {
  LocalizationProvider,
} from '@mui/x-date-pickers/LocalizationProvider';

import {
  AdapterDayjs,
} from '@mui/x-date-pickers/AdapterDayjs';

import {
  DatePicker,
} from '@mui/x-date-pickers/DatePicker';

import {
  MobileTimePicker,
} from '@mui/x-date-pickers/MobileTimePicker';

import dayjs, {
  Dayjs,
} from 'dayjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Tab =
  | 'OVERVIEW'
  | 'MITRAS'
  | 'MEETINGS'
  | 'REFERRALS'
  | 'PAYOUTS'
  | 'SETTINGS';

type CurrentUser = {
  id?: number;
  name?: string;
  email?: string;
  roles?: string[];
};

type FranchiseManager = {
  id: number;
  name?: string;
  email?: string;
  roles?: string[];
};

type SolarMitra = {
  id: number;
  name: string;
  businessName?: string | null;
  primaryPhone: string;
  secondaryPhone?: string | null;
  email?: string | null;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  gpsAddress?: string | null;
  shopPhotoUrl?: string | null;
  portalPassword?: string | null;
  publicReferralToken?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  payoutAmountOverride?: number | null;
  requiredPaymentPercentageOverride?: number | null;
  franchiseManagerId?: number | null;
  franchiseManagerName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type SolarMitraReferral = {
  id: number;
  solarMitraId: number;
  solarMitraName: string;
  solarMitraBusinessName?: string | null;
  solarMitraPhone?: string | null;
  solarMitraAddress?: string | null;
  solarMitraArea?: string | null;
  solarMitraCity?: string | null;

  customerName: string;
  customerPhone: string;
  alternatePhone?: string | null;
  customerAddress?: string | null;
  customerArea?: string | null;
  customerCity?: string | null;

  remarks?: string | null;
  sourceType: string;
  status: string;

  linkedLeadId?: number | null;
  linkedMeetingId?: number | null;
  linkedProjectId?: number | null;

  payoutAmountSnapshot?: number | null;
  requiredPaymentPercentageSnapshot?: number | null;
  payoutTermsSnapshottedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

type SolarMitraPayout = {
  id: number;
  solarMitraId: number;
  solarMitraName?: string | null;
  solarMitraBusinessName?: string | null;

  referralId: number;
  projectId: number;

  customerName?: string | null;
  customerPhone?: string | null;

  payoutAmount: number;
  requiredProjectPaymentPercentage: number;
  qualifyingPaymentPercentage?: number | null;

  status: 'WAITING' | 'ELIGIBLE' | 'PAID' | 'CANCELLED';

  eligibleAt?: string | null;
  paidAt?: string | null;
  paidByName?: string | null;
  paymentMode?: string | null;
  paymentReference?: string | null;
  paymentRemarks?: string | null;

  createdAt?: string;
};

type SolarMitraSetting = {
  id: number;
  defaultPayoutAmount: number;
  payoutQualificationType: string;
  requiredProjectPaymentPercentage: number;
  isActive: boolean;
  updatedByName?: string | null;
  updatedAt?: string;
};

type SolarMitraMeetingStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD';

type SolarMitraMeetingDocument = {
  id: number;
  meetingId: number;
  documentName?: string | null;
  fileUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  createdAt?: string;
};

type SolarMitraMeeting = {
  id: number;

  solarMitraId?: number | null;
  solarMitraName?: string | null;

  name: string;
  primaryPhone: string;

  businessName?: string | null;
  area?: string | null;
  city?: string | null;
  address?: string | null;

  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  gpsAddress?: string | null;

  photoUrls?: string[];
  audioUrl?: string | null;

  status: SolarMitraMeetingStatus;

  meetingDateTime: string;

  notes?: string | null;
  nextFollowUpAt?: string | null;

  franchiseManagerId: number;
  franchiseManagerName?: string | null;

  convertedToSolarMitra: boolean;
  convertedAt?: string | null;

  documents?: SolarMitraMeetingDocument[];

  createdAt?: string;
  updatedAt?: string;
};

const emptyMitraForm = {
  name: '',
  businessName: '',
  primaryPhone: '',
  secondaryPhone: '',
  email: '',
  address: '',
  area: '',
  city: '',
  state: 'Rajasthan',
  gpsLatitude: '',
  gpsLongitude: '',
  gpsAddress: '',
  shopPhotoUrl: '',
  portalPassword: '',
  payoutAmountOverride: '',
  requiredPaymentPercentageOverride: '',
  franchiseManagerId: '',
  franchiseManagerName: '',
  status: 'ACTIVE',
};

const emptyReferralForm = {
  solarMitraId: '',
  customerName: '',
  customerPhone: '',
  alternatePhone: '',
  customerAddress: '',
  customerArea: '',
  customerCity: '',
  remarks: '',
};

const emptyMeetingForm = {
  solarMitraId: '',

  name: '',
  primaryPhone: '',
  businessName: '',

  area: '',
  city: '',
  address: '',

  gpsLatitude: '',
  gpsLongitude: '',
  gpsAddress: '',

  status:
    'SCHEDULED' as SolarMitraMeetingStatus,

  notes: '',
};

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function parseWallClockDateTime(
  value?: string | null,
) {
  if (!value) return null;

  const wallClockValue =
    value
      .replace(' ', 'T')
      .replace(/Z$/, '')
      .replace(
        /([+-]\d{2}:\d{2})$/,
        '',
      );

  const parsed = dayjs(
    wallClockValue,
  );

  return parsed.isValid()
    ? parsed
    : null;
}

function money(value?: number | string | null) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function cleanLabel(value?: string | null) {
  if (!value) return '—';

  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getErrorMessage(error: any, fallback: string) {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || fallback;
}

function StatusBadge({
  value,
}: {
  value?: string | null;
}) {
  const normalized = String(value || '').toUpperCase();

  let classes =
    'bg-gray-100 text-gray-700 border-gray-200';

  if (
    [
      'ACTIVE',
      'PAID',
      'PAYOUT_PAID',
      'PROJECT_CREATED',
      'MEETING_COMPLETED',
    ].includes(normalized)
  ) {
    classes =
      'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (
    [
      'ELIGIBLE',
      'PAYOUT_ELIGIBLE',
      'LEAD_CREATED',
      'MEETING_SCHEDULED',
    ].includes(normalized)
  ) {
    classes =
      'bg-blue-50 text-blue-700 border-blue-200';
  } else if (
    ['WAITING', 'SUBMITTED', 'INACTIVE'].includes(normalized)
  ) {
    classes =
      'bg-amber-50 text-amber-700 border-amber-200';
  } else if (
    ['BLOCKED', 'REJECTED', 'UNSUCCESSFUL', 'CANCELLED'].includes(
      normalized,
    )
  ) {
    classes =
      'bg-red-50 text-red-700 border-red-200';
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${classes}`}
    >
      {cleanLabel(value)}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-black text-gray-900">
        {value}
      </p>

      {subtitle ? (
        <p className="mt-1 text-xs text-gray-500">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default function SolarMitraPage() {
  const [activeTab, setActiveTab] =
    useState<Tab>('OVERVIEW');

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [mitras, setMitras] =
    useState<SolarMitra[]>([]);

  const [referrals, setReferrals] =
    useState<SolarMitraReferral[]>([]);

  const [payouts, setPayouts] =
    useState<SolarMitraPayout[]>([]);

  const [settings, setSettings] =
    useState<SolarMitraSetting | null>(null);

  const [franchiseManagers, setFranchiseManagers] =
    useState<FranchiseManager[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [capturingGps, setCapturingGps] =
  useState(false);

const [uploadingShopPhoto, setUploadingShopPhoto] =
  useState(false);

  const [mitraSearch, setMitraSearch] = useState('');
  const [mitraStatus, setMitraStatus] = useState('');

  const [referralSearch, setReferralSearch] =
    useState('');
  const [referralStatus, setReferralStatus] =
    useState('');
  const [referralMitraId, setReferralMitraId] =
    useState('');

  const [payoutSearch, setPayoutSearch] =
    useState('');
  const [payoutStatus, setPayoutStatus] =
    useState('');

  const [showMitraModal, setShowMitraModal] =
    useState(false);
  const [editingMitra, setEditingMitra] =
    useState<SolarMitra | null>(null);
  const [mitraForm, setMitraForm] =
    useState<any>(emptyMitraForm);

  const [managerSearch, setManagerSearch] =
    useState('');
  const [showManagerOptions, setShowManagerOptions] =
    useState(false);

  const [showReferralModal, setShowReferralModal] =
    useState(false);
  const [referralForm, setReferralForm] =
    useState<any>(emptyReferralForm);

  const [referralMitraSearch, setReferralMitraSearch] =
    useState('');
  const [showReferralMitraOptions, setShowReferralMitraOptions] =
    useState(false);

  const [showPaidModal, setShowPaidModal] =
    useState(false);
  const [selectedPayout, setSelectedPayout] =
    useState<SolarMitraPayout | null>(null);
  const [paidForm, setPaidForm] = useState({
    paymentMode: '',
    paymentReference: '',
    paymentRemarks: '',
  });

  const [settingsForm, setSettingsForm] = useState({
    defaultPayoutAmount: '',
    requiredProjectPaymentPercentage: '',
  });

  const [qrMitra, setQrMitra] =
    useState<SolarMitra | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const [meetings, setMeetings] =
  useState<SolarMitraMeeting[]>([]);

const [meetingSearch, setMeetingSearch] =
  useState('');

const [
  meetingStatusFilter,
  setMeetingStatusFilter,
] = useState('');

const [
  showMeetingModal,
  setShowMeetingModal,
] = useState(false);

const [
  editingMeeting,
  setEditingMeeting,
] =
  useState<SolarMitraMeeting | null>(
    null,
  );

const [
  meetingForm,
  setMeetingForm,
] = useState({
  ...emptyMeetingForm,
});

const [
  meetingDate,
  setMeetingDate,
] =
  useState<Dayjs | null>(
    dayjs(),
  );

const [
  meetingTime,
  setMeetingTime,
] =
  useState<Dayjs | null>(
    dayjs(),
  );

const [
  followUpDate,
  setFollowUpDate,
] =
  useState<Dayjs | null>(null);

const [
  followUpTime,
  setFollowUpTime,
] =
  useState<Dayjs | null>(null);

const [
  capturingMeetingGps,
  setCapturingMeetingGps,
] = useState(false);

const [
  meetingPhotoFiles,
  setMeetingPhotoFiles,
] = useState<File[]>([]);

const [
  meetingPhotoPreviews,
  setMeetingPhotoPreviews,
] = useState<string[]>([]);

const [
  meetingAudioFile,
  setMeetingAudioFile,
] =
  useState<File | null>(null);

const [
  meetingAudioPreview,
  setMeetingAudioPreview,
] = useState('');

const [
  meetingDocumentFile,
  setMeetingDocumentFile,
] =
  useState<File | null>(null);

const [
  meetingDocumentName,
  setMeetingDocumentName,
] = useState('');

const [
  uploadingMeetingFiles,
  setUploadingMeetingFiles,
] = useState(false);

const meetingPhotoInputRef =
  useRef<HTMLInputElement | null>(
    null,
  );

const meetingAudioInputRef =
  useRef<HTMLInputElement | null>(
    null,
  );

const meetingDocumentInputRef =
  useRef<HTMLInputElement | null>(
    null,
  );

const [
  convertingMeeting,
  setConvertingMeeting,
] =
  useState<SolarMitraMeeting | null>(
    null,
  );

const [
  convertSliderValue,
  setConvertSliderValue,
] = useState(0);

const [
  conversionForm,
  setConversionForm,
] = useState({
  email: '',
  password: '',
});

  const userRoles = currentUser?.roles || [];
  const isOwner = userRoles.includes('OWNER');

  useEffect(() => {
    const storedUser =
      localStorage.getItem('user');

    if (!storedUser) return;

    try {
      setCurrentUser(
        JSON.parse(storedUser),
      );
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const loadMitras = async () => {
    const res = await axios.get(
      `${API_BASE_URL}/solar-mitra`,
      {
        headers: getAuthHeaders(),
      },
    );

    setMitras(
      Array.isArray(res.data)
        ? res.data
        : [],
    );
  };

  const loadReferrals = async () => {
    const res = await axios.get(
      `${API_BASE_URL}/solar-mitra/referrals/list`,
      {
        headers: getAuthHeaders(),
      },
    );

    setReferrals(
      Array.isArray(res.data)
        ? res.data
        : [],
    );
  };

  const loadPayouts = async () => {
    const res = await axios.get(
      `${API_BASE_URL}/solar-mitra/payouts/list`,
      {
        headers: getAuthHeaders(),
      },
    );

    setPayouts(
      Array.isArray(res.data)
        ? res.data
        : [],
    );
  };

  const loadMeetings = async () => {
  const res = await axios.get(
    `${API_BASE_URL}/solar-mitra/meetings/list`,
    {
      headers: getAuthHeaders(),
    },
  );

  setMeetings(
    Array.isArray(res.data)
      ? res.data
      : [],
  );
};

  const loadSettings = async () => {
    const res = await axios.get(
      `${API_BASE_URL}/solar-mitra/settings`,
      {
        headers: getAuthHeaders(),
      },
    );

    setSettings(res.data);

    setSettingsForm({
      defaultPayoutAmount:
        String(
          res.data?.defaultPayoutAmount ??
            '',
        ),
      requiredProjectPaymentPercentage:
        String(
          res.data
            ?.requiredProjectPaymentPercentage ??
            '',
        ),
    });
  };

  const loadFranchiseManagers =
    async () => {
      const res = await axios.get(
        `${API_BASE_URL}/users/franchise-managers`,
        {
          headers: getAuthHeaders(),
        },
      );

      setFranchiseManagers(
        Array.isArray(res.data)
          ? res.data
          : [],
      );
    };

  const loadAll = async () => {
    try {
      setLoading(true);

      await Promise.all([
  loadMitras(),
  loadReferrals(),
  loadPayouts(),
  loadMeetings(),
  loadSettings(),
  loadFranchiseManagers(),
]);
    } catch (error) {
      console.error(
        'Failed to load Solar Mitra module:',
        error,
      );

      alert(
        getErrorMessage(
          error,
          'Failed to load Solar Mitra data',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  

  const filteredMitras =
    useMemo(() => {
      const search =
        mitraSearch.trim().toLowerCase();

      return mitras.filter((item) => {
        if (
          mitraStatus &&
          item.status !== mitraStatus
        ) {
          return false;
        }

        if (!search) return true;

        return [
          item.name,
          item.businessName,
          item.primaryPhone,
          item.secondaryPhone,
          item.city,
          item.area,
          item.franchiseManagerName,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(search),
        );
      });
    }, [
      mitras,
      mitraSearch,
      mitraStatus,
    ]);

    const filteredMeetings =
  useMemo(() => {
    const search =
      meetingSearch
        .trim()
        .toLowerCase();

    return meetings.filter(
      (item) => {
        if (
          meetingStatusFilter &&
          item.status !==
            meetingStatusFilter
        ) {
          return false;
        }

        if (!search) {
          return true;
        }

        return [
          item.name,
          item.primaryPhone,
          item.businessName,
          item.area,
          item.city,
          item.solarMitraName,
          item.franchiseManagerName,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(search),
        );
      },
    );
  }, [
    meetings,
    meetingSearch,
    meetingStatusFilter,
  ]);

  const filteredReferrals =
    useMemo(() => {
      const search =
        referralSearch
          .trim()
          .toLowerCase();

      return referrals.filter(
        (item) => {
          if (
            referralStatus &&
            item.status !==
              referralStatus
          ) {
            return false;
          }

          if (
            referralMitraId &&
            Number(item.solarMitraId) !==
              Number(referralMitraId)
          ) {
            return false;
          }

          if (!search) return true;

          return [
            item.customerName,
            item.customerPhone,
            item.customerCity,
            item.solarMitraName,
            item.solarMitraBusinessName,
            item.solarMitraPhone,
            item.solarMitraCity,
          ].some((value) =>
            String(value || '')
              .toLowerCase()
              .includes(search),
          );
        },
      );
    }, [
      referrals,
      referralSearch,
      referralStatus,
      referralMitraId,
    ]);

  const filteredPayouts =
    useMemo(() => {
      const search =
        payoutSearch.trim().toLowerCase();

      return payouts.filter((item) => {
        if (
          payoutStatus &&
          item.status !== payoutStatus
        ) {
          return false;
        }

        if (!search) return true;

        return [
          item.solarMitraName,
          item.solarMitraBusinessName,
          item.customerName,
          item.customerPhone,
          item.projectId,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(search),
        );
      });
    }, [
      payouts,
      payoutSearch,
      payoutStatus,
    ]);

  const activeMitras =
    mitras.filter(
      (item) =>
        item.status === 'ACTIVE',
    ).length;

  const waitingPayouts =
    payouts.filter(
      (item) =>
        item.status === 'WAITING',
    );

  const eligiblePayouts =
    payouts.filter(
      (item) =>
        item.status === 'ELIGIBLE',
    );

  const paidPayouts =
    payouts.filter(
      (item) =>
        item.status === 'PAID',
    );

  const eligibleAmount =
    eligiblePayouts.reduce(
      (sum, item) =>
        sum +
        Number(
          item.payoutAmount || 0,
        ),
      0,
    );

  const paidAmount =
    paidPayouts.reduce(
      (sum, item) =>
        sum +
        Number(
          item.payoutAmount || 0,
        ),
      0,
    );

  const openCreateMitra = () => {
    setEditingMitra(null);
    setMitraForm({
      ...emptyMitraForm,
    });
    setManagerSearch('');
    setShowManagerOptions(false);
    setShowMitraModal(true);
  };

  const openEditMitra = (
    item: SolarMitra,
  ) => {
    setEditingMitra(item);

    setMitraForm({
      name: item.name || '',
      businessName:
        item.businessName || '',
      primaryPhone:
        item.primaryPhone || '',
      secondaryPhone:
        item.secondaryPhone || '',
      email: item.email || '',
      address: item.address || '',
      area: item.area || '',
      city: item.city || '',
      state: item.state || '',
      gpsLatitude:
        item.gpsLatitude ?? '',
      gpsLongitude:
        item.gpsLongitude ?? '',
      gpsAddress:
        item.gpsAddress || '',
      shopPhotoUrl:
        item.shopPhotoUrl || '',
      portalPassword:
        item.portalPassword || '',
      payoutAmountOverride:
        item.payoutAmountOverride ??
        '',
      requiredPaymentPercentageOverride:
        item
          .requiredPaymentPercentageOverride ??
        '',
      franchiseManagerId:
        item.franchiseManagerId
          ? String(
              item.franchiseManagerId,
            )
          : '',
      franchiseManagerName:
        item.franchiseManagerName ||
        '',
      status:
        item.status || 'ACTIVE',
    });

    setManagerSearch(
      item.franchiseManagerName ||
        '',
    );

    setShowManagerOptions(false);
    setShowMitraModal(true);
  };

  const selectManager = (
    manager: FranchiseManager,
  ) => {
    setMitraForm((prev: any) => ({
      ...prev,
      franchiseManagerId:
        String(manager.id),
      franchiseManagerName:
        manager.name || '',
    }));

    setManagerSearch(
      manager.name ||
        manager.email ||
        '',
    );

    setShowManagerOptions(false);
  };

  const clearManager = () => {
    setMitraForm((prev: any) => ({
      ...prev,
      franchiseManagerId: '',
      franchiseManagerName: '',
    }));

    setManagerSearch('');
    setShowManagerOptions(false);
  };

  const filteredManagers =
    franchiseManagers.filter(
      (manager) => {
        const search =
          managerSearch
            .trim()
            .toLowerCase();

        if (!search) return true;

        return [
          manager.name,
          manager.email,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(search),
        );
      },
    );

    const compressMeetingImage = (
  file: File,
): Promise<File> => {
  return new Promise((resolve) => {
    if (
      !file.type.startsWith(
        'image/',
      )
    ) {
      resolve(file);
      return;
    }

    const reader =
      new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas =
          document.createElement(
            'canvas',
          );

        const maxWidth = 1280;
        const maxHeight = 1280;

        let {
          width,
          height,
        } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(
              (height * maxWidth) /
                width,
            );

            width = maxWidth;
          }
        } else if (
          height > maxHeight
        ) {
          width = Math.round(
            (width * maxHeight) /
              height,
          );

          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx =
          canvas.getContext('2d');

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

            resolve(
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
              ),
            );
          },
          'image/jpeg',
          0.72,
        );
      };

      img.src = String(
        event.target?.result ||
          '',
      );
    };

    reader.readAsDataURL(file);
  });
};

const handleMeetingPhotoSelect =
  async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected =
      Array.from(
        event.target.files || [],
      );

    if (!selected.length) {
      return;
    }

    const remaining =
      2 -
      meetingPhotoFiles.length;

    if (remaining <= 0) {
      alert(
        'Maximum 2 meeting photos are allowed',
      );

      event.target.value = '';
      return;
    }

    const files =
      selected.slice(
        0,
        remaining,
      );

    const compressed: File[] =
      [];

    for (const file of files) {
      compressed.push(
        await compressMeetingImage(
          file,
        ),
      );
    }

    const previews =
      compressed.map((file) =>
        URL.createObjectURL(file),
      );

    setMeetingPhotoFiles(
      (prev) =>
        [
          ...prev,
          ...compressed,
        ].slice(0, 2),
    );

    setMeetingPhotoPreviews(
      (prev) =>
        [
          ...prev,
          ...previews,
        ].slice(0, 2),
    );

    event.target.value = '';
  };

  const removeMeetingPhoto = (
  index: number,
) => {
  setMeetingPhotoFiles(
    (prev) =>
      prev.filter(
        (_, i) => i !== index,
      ),
  );

  setMeetingPhotoPreviews(
    (prev) => {
      const removed =
        prev[index];

      if (
        removed?.startsWith(
          'blob:',
        )
      ) {
        URL.revokeObjectURL(
          removed,
        );
      }

      return prev.filter(
        (_, i) => i !== index,
      );
    },
  );
};

  const handleMeetingAudioSelect = (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const file =
    event.target.files?.[0] ||
    null;

  if (!file) return;

  if (
    !file.type.startsWith(
      'audio/',
    )
  ) {
    alert(
      'Please select an audio file',
    );

    event.target.value = '';
    return;
  }

  if (
    meetingAudioPreview.startsWith(
      'blob:',
    )
  ) {
    URL.revokeObjectURL(
      meetingAudioPreview,
    );
  }

  setMeetingAudioFile(file);

  setMeetingAudioPreview(
    URL.createObjectURL(file),
  );

  event.target.value = '';
};

const removeMeetingAudio = () => {
  if (
    meetingAudioPreview.startsWith(
      'blob:',
    )
  ) {
    URL.revokeObjectURL(
      meetingAudioPreview,
    );
  }

  setMeetingAudioFile(null);
  setMeetingAudioPreview('');
};

    const captureMitraLocation = () => {
  if (!navigator.geolocation) {
    alert(
      'Location is not supported on this device',
    );
    return;
  }

  setCapturingGps(true);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      setMitraForm(
        (prev: any) => ({
          ...prev,
          gpsLatitude:
            String(latitude),
          gpsLongitude:
            String(longitude),
          gpsAddress:
            prev.gpsAddress ||
            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }),
      );

      setCapturingGps(false);
    },

    (error) => {
      console.error(
        'GPS capture failed:',
        error,
      );

      setCapturingGps(false);

      alert(
        'Unable to capture location. Please allow location permission and try again.',
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  );
};

const captureMeetingLocation =
  () => {
    if (
      !navigator.geolocation
    ) {
      alert(
        'Location is not supported on this device',
      );

      return;
    }

    setCapturingMeetingGps(
      true,
    );

    navigator.geolocation
      .getCurrentPosition(
        (position) => {
          const latitude =
            position.coords
              .latitude;

          const longitude =
            position.coords
              .longitude;

          setMeetingForm(
            (prev) => ({
              ...prev,

              gpsLatitude:
                String(latitude),

              gpsLongitude:
                String(longitude),

              gpsAddress:
                prev.gpsAddress ||
                `${latitude.toFixed(
                  6,
                )}, ${longitude.toFixed(
                  6,
                )}`,
            }),
          );

          setCapturingMeetingGps(
            false,
          );
        },

        (error) => {
          console.error(
            'Meeting GPS capture failed:',
            error,
          );

          setCapturingMeetingGps(
            false,
          );

          alert(
            'Unable to capture location. Please allow location permission and try again.',
          );
        },

        {
          enableHighAccuracy:
            true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
  };

  const mergeMeetingDateTime = (
  date: Dayjs | null,
  time: Dayjs | null,
) => {
  if (!date || !time) {
    return null;
  }

  return date
    .hour(time.hour())
    .minute(time.minute())
    .second(0)
    .millisecond(0)
    .format(
      'YYYY-MM-DDTHH:mm',
    );
};

const uploadShopPhoto = async (
  file: File,
) => {
  if (!file) return;

  if (
    ![
      'image/jpeg',
      'image/png',
      'image/webp',
    ].includes(file.type)
  ) {
    alert(
      'Only JPG, PNG, and WEBP images are allowed',
    );
    return;
  }

  try {
    setUploadingShopPhoto(true);

    const formData =
      new FormData();

    formData.append(
      'file',
      file,
    );

    const response =
      await axios.post(
        `${API_BASE_URL}/solar-mitra/shop-photo/upload`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type':
              'multipart/form-data',
          },
        },
      );

    const fileUrl =
      response.data?.fileUrl;

    if (!fileUrl) {
      throw new Error(
        'Upload URL was not returned',
      );
    }

    setMitraForm(
      (prev: any) => ({
        ...prev,
        shopPhotoUrl:
          fileUrl,
      }),
    );
  } catch (error: any) {
    console.error(
      'Shop photo upload failed:',
      error,
    );

    alert(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to upload shop photo',
    );
  } finally {
    setUploadingShopPhoto(false);
  }
};

const openNewMeetingModal =
  () => {
    setEditingMeeting(null);

    setMeetingForm({
      ...emptyMeetingForm,
    });

    setMeetingDate(dayjs());
    setMeetingTime(dayjs());

    setFollowUpDate(null);
    setFollowUpTime(null);

    setMeetingPhotoFiles([]);
    setMeetingPhotoPreviews([]);

    removeMeetingAudio();

    setMeetingDocumentFile(
      null,
    );

    setMeetingDocumentName('');

    setShowMeetingModal(true);
  };

  const uploadMeetingPhotos =
  async () => {
    if (
      !meetingPhotoFiles.length
    ) {
      return [];
    }

    const formData =
      new FormData();

    meetingPhotoFiles.forEach(
      (file) => {
        formData.append(
          'files',
          file,
        );
      },
    );

    const response =
      await axios.post(
        `${API_BASE_URL}/solar-mitra/meetings/photos/upload`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),

            'Content-Type':
              'multipart/form-data',
          },
        },
      );

    const uploaded =
      Array.isArray(
        response.data,
      )
        ? response.data
        : [];

    return uploaded
      .map(
        (item: any) =>
          item?.fileUrl,
      )
      .filter(Boolean);
  };

  const uploadMeetingAudio =
  async () => {
    if (!meetingAudioFile) {
      return '';
    }

    const formData =
      new FormData();

    formData.append(
      'file',
      meetingAudioFile,
    );

    const response =
      await axios.post(
        `${API_BASE_URL}/solar-mitra/meetings/audio/upload`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),

            'Content-Type':
              'multipart/form-data',
          },
        },
      );

    return (
      response.data?.fileUrl ||
      ''
    );
  };

  const uploadMeetingDocument =
  async (
    meetingId: number,
  ) => {
    if (
      !meetingDocumentFile
    ) {
      return;
    }

    const formData =
      new FormData();

    formData.append(
      'file',
      meetingDocumentFile,
    );

    formData.append(
      'documentName',
      meetingDocumentName.trim() ||
        meetingDocumentFile.name,
    );

    await axios.post(
      `${API_BASE_URL}/solar-mitra/meetings/${meetingId}/documents/upload`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),

          'Content-Type':
            'multipart/form-data',
        },
      },
    );
  };

  const saveMeeting = async (
  event: FormEvent,
) => {
  event.preventDefault();

  if (
    !meetingForm.name.trim()
  ) {
    alert(
      'Person name is required',
    );
    return;
  }

  if (
    !meetingForm.primaryPhone.trim()
  ) {
    alert(
      'Primary phone is required',
    );
    return;
  }

  const meetingDateTime =
    mergeMeetingDateTime(
      meetingDate,
      meetingTime,
    );

  if (!meetingDateTime) {
    alert(
      'Meeting date and time are required',
    );
    return;
  }

  if (
    (followUpDate &&
      !followUpTime) ||
    (!followUpDate &&
      followUpTime)
  ) {
    alert(
      'Please select both follow-up date and time',
    );
    return;
  }

  try {
    setSaving(true);
    setUploadingMeetingFiles(
      true,
    );

    let photoUrls =
      editingMeeting?.photoUrls ||
      [];

    if (
  meetingPhotoFiles.length
) {
  const uploadedPhotoUrls =
    await uploadMeetingPhotos();

  const existingPhotoUrls =
    meetingPhotoPreviews.filter(
      (url) =>
        !url.startsWith('blob:'),
    );

  photoUrls = [
    ...existingPhotoUrls,
    ...uploadedPhotoUrls,
  ].slice(0, 2);
}

    let audioUrl =
      editingMeeting?.audioUrl ||
      '';

    if (meetingAudioFile) {
      audioUrl =
        await uploadMeetingAudio();
    }

    const nextFollowUpAt =
      followUpDate &&
      followUpTime
        ? mergeMeetingDateTime(
            followUpDate,
            followUpTime,
          )
        : null;

        if (
  !meetingAudioFile &&
  !meetingAudioPreview
) {
  audioUrl = '';
}

    const payload = {

        solarMitraId:
  meetingForm.solarMitraId
    ? Number(
        meetingForm.solarMitraId,
      )
    : null,
      name:
        meetingForm.name.trim(),

      primaryPhone:
        meetingForm
          .primaryPhone
          .trim(),

      businessName:
        meetingForm
          .businessName
          .trim(),

      area:
        meetingForm.area.trim(),

      city:
        meetingForm.city.trim(),

      address:
        meetingForm
          .address
          .trim(),

      gpsLatitude:
        meetingForm.gpsLatitude
          ? Number(
              meetingForm
                .gpsLatitude,
            )
          : null,

      gpsLongitude:
        meetingForm.gpsLongitude
          ? Number(
              meetingForm
                .gpsLongitude,
            )
          : null,

      gpsAddress:
        meetingForm
          .gpsAddress
          .trim(),

      photoUrls,

      audioUrl:
        audioUrl || null,

      status:
        meetingForm.status,

      meetingDateTime,

      notes:
        meetingForm.notes.trim(),

      nextFollowUpAt,
    };

    let saved:
      | SolarMitraMeeting
      | null = null;

    if (editingMeeting) {
      const response =
        await axios.patch(
          `${API_BASE_URL}/solar-mitra/meetings/${editingMeeting.id}`,
          payload,
          {
            headers:
              getAuthHeaders(),
          },
        );

      saved = response.data;
    } else {
      const response =
        await axios.post(
          `${API_BASE_URL}/solar-mitra/meetings`,
          payload,
          {
            headers:
              getAuthHeaders(),
          },
        );

      saved = response.data;
    }

    if (
      saved?.id &&
      meetingDocumentFile
    ) {
      await uploadMeetingDocument(
        saved.id,
      );
    }

    alert(
      editingMeeting
        ? 'Meeting updated successfully'
        : 'Meeting created successfully',
    );

    setShowMeetingModal(false);

    await loadMeetings();
  } catch (error) {
    console.error(error);

    alert(
      getErrorMessage(
        error,
        'Failed to save Solar Mitra meeting',
      ),
    );
  } finally {
    setSaving(false);

    setUploadingMeetingFiles(
      false,
    );
  }
};

  const saveMitra = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (
      !mitraForm.name.trim() ||
      !mitraForm.primaryPhone.trim()
    ) {
      alert(
        'Name and primary phone are required',
      );
      return;
    }

    const payload = {
      ...mitraForm,

      payoutAmountOverride:
        mitraForm.payoutAmountOverride ===
        ''
          ? null
          : Number(
              mitraForm.payoutAmountOverride,
            ),

      requiredPaymentPercentageOverride:
        mitraForm
          .requiredPaymentPercentageOverride ===
        ''
          ? null
          : Number(
              mitraForm
                .requiredPaymentPercentageOverride,
            ),

      franchiseManagerId:
        mitraForm.franchiseManagerId
          ? Number(
              mitraForm.franchiseManagerId,
            )
          : null,

      gpsLatitude:
        mitraForm.gpsLatitude === ''
          ? null
          : Number(
              mitraForm.gpsLatitude,
            ),

      gpsLongitude:
        mitraForm.gpsLongitude === ''
          ? null
          : Number(
              mitraForm.gpsLongitude,
            ),
    };

    try {
      setSaving(true);

      if (editingMitra) {
        await axios.patch(
          `${API_BASE_URL}/solar-mitra/${editingMitra.id}`,
          payload,
          {
            headers:
              getAuthHeaders(),
          },
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/solar-mitra`,
          payload,
          {
            headers:
              getAuthHeaders(),
          },
        );
      }

      alert(
        editingMitra
          ? 'Solar Mitra updated successfully'
          : 'Solar Mitra created successfully',
      );

      setShowMitraModal(false);

      await loadMitras();
    } catch (error) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to save Solar Mitra',
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const openReferralModal = () => {
    setReferralForm({
      ...emptyReferralForm,
    });

    setReferralMitraSearch('');
    setShowReferralMitraOptions(
      false,
    );
    setShowReferralModal(true);
  };

  const activeMitraOptions =
    mitras.filter(
      (item) =>
        item.status === 'ACTIVE',
    );

  const filteredReferralMitraOptions =
    activeMitraOptions.filter(
      (item) => {
        const search =
          referralMitraSearch
            .trim()
            .toLowerCase();

        if (!search) return true;

        return [
          item.name,
          item.businessName,
          item.primaryPhone,
          item.city,
          item.area,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(search),
        );
      },
    );

  const selectReferralMitra = (
    item: SolarMitra,
  ) => {
    setReferralForm(
      (prev: any) => ({
        ...prev,
        solarMitraId:
          String(item.id),
      }),
    );

    setReferralMitraSearch(
      item.businessName
        ? `${item.name} — ${item.businessName}`
        : item.name,
    );

    setShowReferralMitraOptions(
      false,
    );
  };

  const saveReferral = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (!referralForm.solarMitraId) {
      alert(
        'Please select a Solar Mitra',
      );
      return;
    }

    if (
      !referralForm.customerName.trim() ||
      !referralForm.customerPhone.trim()
    ) {
      alert(
        'Customer name and phone are required',
      );
      return;
    }

    try {
      setSaving(true);

      await axios.post(
        `${API_BASE_URL}/solar-mitra/${referralForm.solarMitraId}/referrals`,
        {
          customerName:
            referralForm.customerName,
          customerPhone:
            referralForm.customerPhone,
          alternatePhone:
            referralForm.alternatePhone,
          customerAddress:
            referralForm.customerAddress,
          customerArea:
            referralForm.customerArea,
          customerCity:
            referralForm.customerCity,
          remarks:
            referralForm.remarks,
        },
        {
          headers:
            getAuthHeaders(),
        },
      );

      alert(
        'Referral submitted and Lead created successfully',
      );

      setShowReferralModal(false);

      await Promise.all([
        loadReferrals(),
        loadPayouts(),
      ]);
    } catch (error) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to create referral',
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const openMarkPaid = (
    payout: SolarMitraPayout,
  ) => {
    setSelectedPayout(payout);

    setPaidForm({
      paymentMode: '',
      paymentReference: '',
      paymentRemarks: '',
    });

    setShowPaidModal(true);
  };

  const markPaid = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (!selectedPayout) return;

    try {
      setSaving(true);

      await axios.patch(
        `${API_BASE_URL}/solar-mitra/payouts/${selectedPayout.id}/paid`,
        paidForm,
        {
          headers:
            getAuthHeaders(),
        },
      );

      alert(
        'Solar Mitra payout marked as paid',
      );

      setShowPaidModal(false);
      setSelectedPayout(null);

      await Promise.all([
        loadPayouts(),
        loadReferrals(),
      ]);
    } catch (error) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to mark payout as paid',
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (!isOwner) {
      alert(
        'Only Owner can update Solar Mitra payout settings',
      );
      return;
    }

    try {
      setSaving(true);

      await axios.patch(
        `${API_BASE_URL}/solar-mitra/settings`,
        {
          defaultPayoutAmount:
            Number(
              settingsForm
                .defaultPayoutAmount,
            ),
          requiredProjectPaymentPercentage:
            Number(
              settingsForm
                .requiredProjectPaymentPercentage,
            ),
        },
        {
          headers:
            getAuthHeaders(),
        },
      );

      alert(
        'Solar Mitra settings updated successfully',
      );

      await loadSettings();
    } catch (error) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to update settings',
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const callMitra = (
  item: SolarMitra,
) => {
  const phone = String(
    item.primaryPhone || '',
  ).trim();

  if (!phone) {
    alert(
      'Phone number is not available',
    );
    return;
  }

  window.location.href =
    `tel:${phone}`;
};

const navigateToMitra = (
  item: SolarMitra,
) => {
  const latitude =
    item.gpsLatitude;

  const longitude =
    item.gpsLongitude;

  let destination = '';

  if (
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined
  ) {
    destination =
      `${latitude},${longitude}`;
  } else {
    destination = [
      item.gpsAddress,
      item.address,
      item.area,
      item.city,
      item.state,
    ]
      .filter(Boolean)
      .join(', ');
  }

  if (!destination) {
    alert(
      'Location is not available for this Solar Mitra',
    );
    return;
  }

  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination,
    )}`,
    '_blank',
  );
};

const openEditMeeting = async (
  item: SolarMitraMeeting,
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/solar-mitra/meetings/${item.id}`,
      {
        headers: getAuthHeaders(),
      },
    );

    const meeting: SolarMitraMeeting =
      response.data;

    setEditingMeeting(meeting);

    setMeetingForm({
      solarMitraId: meeting.solarMitraId
        ? String(meeting.solarMitraId)
        : '',
      name: meeting.name || '',
      primaryPhone:
        meeting.primaryPhone || '',
      businessName:
        meeting.businessName || '',
      area: meeting.area || '',
      city: meeting.city || '',
      address: meeting.address || '',
      gpsLatitude:
        meeting.gpsLatitude != null
          ? String(meeting.gpsLatitude)
          : '',
      gpsLongitude:
        meeting.gpsLongitude != null
          ? String(meeting.gpsLongitude)
          : '',
      gpsAddress:
        meeting.gpsAddress || '',
      status: meeting.status,
      notes: meeting.notes || '',
    });

    const meetingValue =
  parseWallClockDateTime(
    meeting.meetingDateTime,
  );

    setMeetingDate(meetingValue);
    setMeetingTime(meetingValue);

    if (meeting.nextFollowUpAt) {
      const followUpValue =
  parseWallClockDateTime(
    meeting.nextFollowUpAt,
  );

      setFollowUpDate(followUpValue);
      setFollowUpTime(followUpValue);
    } else {
      setFollowUpDate(null);
      setFollowUpTime(null);
    }

    setMeetingPhotoFiles([]);

    setMeetingPhotoPreviews(
      meeting.photoUrls || [],
    );

    setMeetingAudioFile(null);
    setMeetingAudioPreview(
      meeting.audioUrl || '',
    );

    setMeetingDocumentFile(null);
    setMeetingDocumentName('');

    setShowMeetingModal(true);
  } catch (error) {
    console.error(error);

    alert(
      getErrorMessage(
        error,
        'Failed to load meeting',
      ),
    );
  }
};

const selectExistingMitraForMeeting = (
  item: SolarMitra,
) => {
  setMeetingForm((prev) => ({
    ...prev,
    solarMitraId: String(item.id),
    name: item.name || '',
    primaryPhone:
      item.primaryPhone || '',
    businessName:
      item.businessName || '',
    area: item.area || '',
    city: item.city || '',
    address: item.address || '',
    gpsLatitude:
      item.gpsLatitude != null
        ? String(item.gpsLatitude)
        : '',
    gpsLongitude:
      item.gpsLongitude != null
        ? String(item.gpsLongitude)
        : '',
    gpsAddress:
      item.gpsAddress || '',
  }));
};

const openMeetingConversion = (
  meeting: SolarMitraMeeting,
) => {
  if (
    meeting.convertedToSolarMitra ||
    meeting.solarMitraId
  ) {
    return;
  }

  setConvertingMeeting(meeting);
  setConvertSliderValue(0);

  setConversionForm({
    email: '',
    password: '',
  });
};

const convertMeetingToSolarMitra =
  async (event: FormEvent) => {
    event.preventDefault();

    if (!convertingMeeting) {
      return;
    }

    if (
      !conversionForm.email.trim() ||
      !conversionForm.password.trim()
    ) {
      alert(
        'Email and password are required',
      );
      return;
    }

    try {
      setSaving(true);

      await axios.post(
        `${API_BASE_URL}/solar-mitra/meetings/${convertingMeeting.id}/create-solar-mitra`,
        {
          email:
            conversionForm.email.trim(),
          password:
            conversionForm.password,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      alert(
        'Solar Mitra created successfully',
      );

      setConvertingMeeting(null);
      setConvertSliderValue(0);

      await Promise.all([
        loadMeetings(),
        loadMitras(),
      ]);
    } catch (error) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to create Solar Mitra',
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const getPublicReferralUrl = (
    item: SolarMitra,
  ) => {
    if (
      typeof window ===
        'undefined' ||
      !item.publicReferralToken
    ) {
      return '';
    }

    return `${window.location.origin}/solar-mitra-referral/${item.publicReferralToken}`;
  };

  const openQr = async (
    item: SolarMitra,
  ) => {
    if (!item.publicReferralToken) {
      alert(
        'Public referral token is not available for this Solar Mitra',
      );
      return;
    }

    const url =
      getPublicReferralUrl(item);

    try {
      const dataUrl =
        await QRCode.toDataURL(
          url,
          {
            width: 500,
            margin: 2,
            errorCorrectionLevel: 'H',
          },
        );

      setQrMitra(item);
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error(error);

      alert(
        'Failed to generate QR code',
      );
    }
  };

  const copyReferralLink = async (
    item: SolarMitra,
  ) => {
    const url =
      getPublicReferralUrl(item);

    if (!url) return;

    try {
      await navigator.clipboard.writeText(
        url,
      );

      alert(
        'Referral link copied',
      );
    } catch {
      alert(
        'Unable to copy referral link',
      );
    }
  };

  const downloadQr = async () => {
  if (!qrMitra || !qrDataUrl) {
    return;
  }

  const fileName =
    `solar-mitra-${qrMitra.id}-qr.png`;

  try {
    const { Capacitor } =
      await import(
        '@capacitor/core'
      );

    if (
      Capacitor.isNativePlatform()
    ) {
      const { Filesystem } =
        await import(
          '@capacitor/filesystem'
        );

      const { Share } =
        await import(
          '@capacitor/share'
        );

      const base64Data =
        qrDataUrl.split(',')[1];

      if (!base64Data) {
        throw new Error(
          'Invalid QR image data',
        );
      }

      const saved =
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory:
            (
              await import(
                '@capacitor/filesystem'
              )
            ).Directory.Cache,
        });

      await Share.share({
        title:
          'Solar Mitra Referral QR',
        text:
          `${qrMitra.name} - Solar Mitra Referral QR`,
        url: saved.uri,
        dialogTitle:
          'Save or share QR',
      });

      return;
    }
  } catch (error) {
    console.error(
      'Native QR save/share failed:',
      error,
    );
  }

  const link =
    document.createElement('a');

  link.href = qrDataUrl;
  link.download = fileName;

  document.body.appendChild(
    link,
  );

  link.click();
  link.remove();
};

  const tabs: {
    key: Tab;
    label: string;
  }[] = [
    {
      key: 'OVERVIEW',
      label: 'Overview',
    },
    {
      key: 'MITRAS',
      label: 'Mitras',
    },
    {
  key: 'MEETINGS',
  label: 'Meetings',
},
    {
      key: 'REFERRALS',
      label: 'Referrals',
    },
    {
      key: 'PAYOUTS',
      label: 'Payouts',
    },
    {
      key: 'SETTINGS',
      label: 'Settings',
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <p className="font-semibold text-gray-600">
            Loading Solar Mitra...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden bg-gray-50 p-3 md:p-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Solar Mitra
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage referral partners, customer referrals,
              project-linked payouts and payout rules.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openReferralModal}
              className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 hover:bg-orange-100"
            >
              + Add Referral
            </button>

            <button
              type="button"
              onClick={openCreateMitra}
              className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"
            >
              + Add Solar Mitra
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto border-t border-gray-100 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                setActiveTab(tab.key)
              }
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeTab === tab.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'OVERVIEW' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total Solar Mitras"
              value={mitras.length}
              subtitle={`${activeMitras} active`}
            />

            <SummaryCard
              title="Total Referrals"
              value={referrals.length}
              subtitle="Leads created directly"
            />

            <SummaryCard
              title="Eligible Payout"
              value={money(
                eligibleAmount,
              )}
              subtitle={`${eligiblePayouts.length} payout(s) ready`}
            />

            <SummaryCard
              title="Paid"
              value={money(paidAmount)}
              subtitle={`${paidPayouts.length} payout(s) completed`}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">
                  Referral Progress
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      'REFERRALS',
                    )
                  }
                  className="text-sm font-bold text-orange-600"
                >
                  View all
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {referrals
                  .slice(0, 6)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900">
                            {item.customerName}
                          </p>

                          <p className="text-sm text-gray-500">
                            {item.customerPhone}
                          </p>
                        </div>

                        <StatusBadge
                          value={
                            item.status
                          }
                        />
                      </div>

                      <p className="mt-3 text-sm text-gray-600">
                        Referred by{' '}
                        <span className="font-bold">
                          {
                            item.solarMitraName
                          }
                        </span>
                        {item.solarMitraBusinessName
                          ? ` · ${item.solarMitraBusinessName}`
                          : ''}
                      </p>
                    </div>
                  ))}

                {!referrals.length && (
                  <p className="py-8 text-center text-sm text-gray-500">
                    No referrals yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">
                  Payout Position
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      'PAYOUTS',
                    )
                  }
                  className="text-sm font-bold text-orange-600"
                >
                  View payouts
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase text-amber-700">
                    Waiting
                  </p>

                  <p className="mt-2 text-2xl font-black text-amber-900">
                    {
                      waitingPayouts.length
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase text-blue-700">
                    Eligible
                  </p>

                  <p className="mt-2 text-2xl font-black text-blue-900">
                    {
                      eligiblePayouts.length
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase text-emerald-700">
                    Paid
                  </p>

                  <p className="mt-2 text-2xl font-black text-emerald-900">
                    {paidPayouts.length}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-500">
                  Current Default Terms
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">
                      Default payout
                    </p>
                    <p className="font-black text-gray-900">
                      {money(
                        settings?.defaultPayoutAmount,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Project payment required
                    </p>
                    <p className="font-black text-gray-900">
                      {Number(
                        settings?.requiredProjectPaymentPercentage ||
                          0,
                      )}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'MITRAS' && (
        <div className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              value={mitraSearch}
              onChange={(event) =>
                setMitraSearch(
                  event.target.value,
                )
              }
              placeholder="Search name, business, phone, city, area or manager..."
              className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500"
            />

            <select
              value={mitraStatus}
              onChange={(event) =>
                setMitraStatus(
                  event.target.value,
                )
              }
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
            >
              <option value="">
                All Status
              </option>
              <option value="ACTIVE">
                Active
              </option>
              <option value="INACTIVE">
                Inactive
              </option>
              <option value="BLOCKED">
                Blocked
              </option>
            </select>

            <button
              type="button"
              onClick={openCreateMitra}
              className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white"
            >
              + Add Mitra
            </button>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {filteredMitras.map(
              (item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-gray-900">
                          {item.name}
                        </h3>

                        <StatusBadge
                          value={
                            item.status
                          }
                        />
                      </div>

                      {item.businessName && (
                        <p className="mt-1 font-semibold text-gray-600">
                          {
                            item.businessName
                          }
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openEditMitra(
                          item,
                        )
                      }
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        Phone
                      </p>
                      <p className="font-semibold text-gray-800">
                        {
                          item.primaryPhone
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        Location
                      </p>
                      <p className="font-semibold text-gray-800">
                        {[
                          item.area,
                          item.city,
                          item.state,
                        ]
                          .filter(Boolean)
                          .join(', ') ||
                          '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        Franchise Manager
                      </p>
                      <p className="font-semibold text-gray-800">
                        {item.franchiseManagerName ||
                          'Not assigned'}
                      </p>
                    </div>

                    

                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        Payout
                      </p>
                      <p className="font-semibold text-gray-800">
                        {item.payoutAmountOverride !==
                          null &&
                        item.payoutAmountOverride !==
                          undefined
                          ? `${money(
                              item.payoutAmountOverride,
                            )} override`
                          : `${money(
                              settings?.defaultPayoutAmount,
                            )} default`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        Payment Milestone
                      </p>
                      <p className="font-semibold text-gray-800">
                        {item.requiredPaymentPercentageOverride !==
                          null &&
                        item.requiredPaymentPercentageOverride !==
                          undefined
                          ? `${item.requiredPaymentPercentageOverride}% override`
                          : `${Number(
                              settings?.requiredProjectPaymentPercentage ||
                                0,
                            )}% default`}
                      </p>
                    </div>
                  </div>

                  {item.address && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-400">
                        Address
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {item.address}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">

                    <button
  type="button"
  onClick={() =>
    callMitra(item)
  }
  className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
>
  📞 Call
</button>

<button
  type="button"
  onClick={() =>
    navigateToMitra(item)
  }
  className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
>
  📍 Navigate
</button>
                    <button
                      type="button"
                      onClick={() =>
                        openQr(item)
                      }
                      className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white"
                    >
                      Show QR
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        copyReferralLink(
                          item,
                        )
                      }
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700"
                    >
                      Copy Referral Link
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReferralForm({
                          ...emptyReferralForm,
                          solarMitraId:
                            String(
                              item.id,
                            ),
                        });

                        setReferralMitraSearch(
                          item.businessName
                            ? `${item.name} — ${item.businessName}`
                            : item.name,
                        );

                        setShowReferralModal(
                          true,
                        );
                      }}
                      className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700"
                    >
                      Add Referral
                    </button>
                  </div>
                </div>
              ),
            )}

            {!filteredMitras.length && (
              <div className="col-span-full py-12 text-center text-sm text-gray-500">
                No Solar Mitras found.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'MEETINGS' && (
  <div className="space-y-4">
    <div className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900">
            Solar Mitra Meetings
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Prospect visits, Solar Mitra follow-ups and meeting proof.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewMeetingModal}
          className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
        >
          + New Meeting / Visit
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <input
          value={meetingSearch}
          onChange={(event) =>
            setMeetingSearch(
              event.target.value,
            )
          }
          placeholder="Search person, phone, shop, area, city or Solar Mitra..."
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
        />

        <select
          value={meetingStatusFilter}
          onChange={(event) =>
            setMeetingStatusFilter(
              event.target.value,
            )
          }
          className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
        >
          <option value="">
            All Status
          </option>

          <option value="SCHEDULED">
            Scheduled
          </option>

          <option value="COMPLETED">
            Completed
          </option>

          <option value="CANCELLED">
            Cancelled
          </option>

          <option value="ON_HOLD">
            On Hold
          </option>
        </select>
      </div>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      {filteredMeetings.map(
        (item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-black text-gray-900">
                  {item.name}
                </h3>

                {item.businessName && (
                  <p className="mt-0.5 text-sm font-semibold text-gray-600">
                    {item.businessName}
                  </p>
                )}

                <p className="mt-1 text-sm text-gray-500">
                  {item.primaryPhone}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  item.status ===
                  'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : item.status ===
                        'CANCELLED'
                      ? 'bg-red-100 text-red-700'
                      : item.status ===
                          'ON_HOLD'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                }`}
              >
                {item.status.replace(
                  '_',
                  ' ',
                )}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">
                  Meeting
                </p>

                <p className="mt-1 font-semibold text-gray-700">
                  {parseWallClockDateTime(
  item.meetingDateTime,
)?.format(
  'DD MMM YYYY, hh:mm A',
) || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-400">
                  Franchise Manager
                </p>

                <p className="mt-1 font-semibold text-gray-700">
                  {item.franchiseManagerName ||
                    '—'}
                </p>
              </div>

              {(item.area ||
                item.city) && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Area / City
                  </p>

                  <p className="mt-1 font-semibold text-gray-700">
                    {[
                      item.area,
                      item.city,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}

              {item.nextFollowUpAt && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Next Follow-up
                  </p>

                  <p className="mt-1 font-semibold text-orange-700">
                    {parseWallClockDateTime(
  item.nextFollowUpAt,
)?.format(
  'DD MMM YYYY, hh:mm A',
) || '—'}
                  </p>
                </div>
              )}
            </div>

            {item.notes && (
              <div className="mt-4 rounded-xl bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-400">
                  Update / Notes
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {item.notes}
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {(item.photoUrls || [])
                .slice(0, 2)
                .map(
                  (url, index) => (
                    <a
                      key={`${item.id}-photo-${index}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700"
                    >
                      Photo {index + 1}
                    </a>
                  ),
                )}

              {item.audioUrl && (
                <a
                  href={item.audioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700"
                >
                  Audio Proof
                </a>
              )}

              <button
                type="button"
                onClick={() =>
                  openEditMeeting(item)
                }
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
              >
                View / Update
              </button>
            </div>

            {item.solarMitraId ||
            item.convertedToSolarMitra ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-black text-emerald-700">
                ✓ Solar Mitra Created
                {item.solarMitraName
                  ? ` — ${item.solarMitraName}`
                  : ''}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border-2 border-orange-200 bg-orange-50 p-4">
                <p className="mb-2 text-center text-xs font-black uppercase tracking-wide text-orange-700">
                  Slide fully to create Solar Mitra
                </p>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={
                    convertingMeeting?.id ===
                    item.id
                      ? convertSliderValue
                      : 0
                  }
                  onChange={(event) => {
                    const value =
                      Number(
                        event.target.value,
                      );

                    setConvertSliderValue(
                      value,
                    );

                    if (value >= 100) {
                      openMeetingConversion(
                        item,
                      );
                    }
                  }}
                  className="h-3 w-full cursor-pointer accent-orange-600"
                />

                <div className="mt-2 flex justify-between text-xs font-black text-orange-700">
                  <span>SLIDE</span>
                  <span>
                    CREATE SOLAR MITRA →
                  </span>
                </div>
              </div>
            )}
          </div>
        ),
      )}

      {!filteredMeetings.length && (
        <div className="col-span-full rounded-2xl bg-white py-12 text-center text-sm text-gray-500 shadow-sm">
          No Solar Mitra meetings found.
        </div>
      )}
    </div>
  </div>
)}

      {activeTab === 'REFERRALS' && (
        <div className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_240px_auto]">
            <input
              value={referralSearch}
              onChange={(event) =>
                setReferralSearch(
                  event.target.value,
                )
              }
              placeholder="Search customer or Solar Mitra..."
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
            />

            <select
              value={referralStatus}
              onChange={(event) =>
                setReferralStatus(
                  event.target.value,
                )
              }
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
            >
              <option value="">
                All Status
              </option>
              <option value="LEAD_CREATED">
                Lead Created
              </option>
              <option value="MEETING_SCHEDULED">
                Meeting Scheduled
              </option>
              <option value="MEETING_COMPLETED">
                Meeting Completed
              </option>
              <option value="PROJECT_CREATED">
                Project Created
              </option>
              <option value="PAYOUT_ELIGIBLE">
                Payout Eligible
              </option>
              <option value="PAYOUT_PAID">
                Payout Paid
              </option>
              <option value="UNSUCCESSFUL">
                Unsuccessful
              </option>
              <option value="REJECTED">
                Rejected
              </option>
            </select>

            <select
              value={referralMitraId}
              onChange={(event) =>
                setReferralMitraId(
                  event.target.value,
                )
              }
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
            >
              <option value="">
                All Solar Mitras
              </option>

              {mitras.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                    {item.businessName
                      ? ` — ${item.businessName}`
                      : ''}
                  </option>
                ),
              )}
            </select>

            <button
              type="button"
              onClick={openReferralModal}
              className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white"
            >
              + Add Referral
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {filteredReferrals.map(
              (item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-gray-900">
                        {
                          item.customerName
                        }
                      </h3>

                      <p className="text-sm font-semibold text-gray-500">
                        {
                          item.customerPhone
                        }
                        {item.customerCity
                          ? ` · ${item.customerCity}`
                          : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        value={
                          item.status
                        }
                      />

                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-600">
                        {cleanLabel(
                          item.sourceType,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-orange-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                      Referred By
                    </p>

                    <p className="mt-1 font-black text-gray-900">
                      {
                        item.solarMitraName
                      }
                    </p>

                    <p className="text-sm text-gray-600">
                      {[
                        item.solarMitraBusinessName,
                        item.solarMitraPhone,
                        item.solarMitraArea,
                        item.solarMitraCity,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Lead
                      </p>
                      <p className="mt-1 font-black text-gray-900">
                        {item.linkedLeadId
                          ? `#${item.linkedLeadId}`
                          : '—'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Meeting
                      </p>
                      <p className="mt-1 font-black text-gray-900">
                        {item.linkedMeetingId
                          ? `#${item.linkedMeetingId}`
                          : '—'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Project
                      </p>
                      <p className="mt-1 font-black text-gray-900">
                        {item.linkedProjectId
                          ? `#${item.linkedProjectId}`
                          : '—'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Payout Terms
                      </p>
                      <p className="mt-1 font-black text-gray-900">
                        {money(
                          item.payoutAmountSnapshot,
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        at{' '}
                        {Number(
                          item.requiredPaymentPercentageSnapshot ||
                            0,
                        )}
                        % payment
                      </p>
                    </div>
                  </div>

                  {item.remarks && (
                    <p className="mt-4 text-sm text-gray-600">
                      <span className="font-bold">
                        Remarks:
                      </span>{' '}
                      {item.remarks}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-gray-400">
                    Referred{' '}
                    {formatDate(
                      item.createdAt,
                    )}
                  </p>
                </div>
              ),
            )}

            {!filteredReferrals.length && (
              <div className="py-12 text-center text-sm text-gray-500">
                No referrals found.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'PAYOUTS' && (
        <div className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <input
              value={payoutSearch}
              onChange={(event) =>
                setPayoutSearch(
                  event.target.value,
                )
              }
              placeholder="Search Mitra, customer, phone or project..."
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
            />

            <select
              value={payoutStatus}
              onChange={(event) =>
                setPayoutStatus(
                  event.target.value,
                )
              }
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
            >
              <option value="">
                All Payouts
              </option>
              <option value="WAITING">
                Waiting
              </option>
              <option value="ELIGIBLE">
                Eligible
              </option>
              <option value="PAID">
                Paid
              </option>
              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </div>

          <div className="mt-5 space-y-4">
            {filteredPayouts.map(
              (item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Solar Mitra
                      </p>

                      <h3 className="text-lg font-black text-gray-900">
                        {item.solarMitraName ||
                          `Mitra #${item.solarMitraId}`}
                      </h3>

                      {item.solarMitraBusinessName && (
                        <p className="text-sm font-semibold text-gray-500">
                          {
                            item.solarMitraBusinessName
                          }
                        </p>
                      )}
                    </div>

                    <StatusBadge
                      value={
                        item.status
                      }
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Customer
                      </p>
                      <p className="font-bold text-gray-900">
                        {item.customerName ||
                          '—'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.customerPhone ||
                          ''}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Project
                      </p>
                      <p className="font-black text-gray-900">
                        #
                        {
                          item.projectId
                        }
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Payout
                      </p>
                      <p className="font-black text-gray-900">
                        {money(
                          item.payoutAmount,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Required Payment
                      </p>
                      <p className="font-black text-gray-900">
                        {Number(
                          item.requiredProjectPaymentPercentage ||
                            0,
                        )}
                        %
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Eligible At
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatDate(
                          item.eligibleAt,
                        )}
                      </p>
                    </div>
                  </div>

                  {item.status ===
                    'PAID' && (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs text-emerald-600">
                            Paid At
                          </p>
                          <p className="text-sm font-bold text-emerald-900">
                            {formatDate(
                              item.paidAt,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-emerald-600">
                            Paid By
                          </p>
                          <p className="text-sm font-bold text-emerald-900">
                            {item.paidByName ||
                              '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-emerald-600">
                            Mode
                          </p>
                          <p className="text-sm font-bold text-emerald-900">
                            {item.paymentMode ||
                              '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-emerald-600">
                            Reference
                          </p>
                          <p className="text-sm font-bold text-emerald-900">
                            {item.paymentReference ||
                              '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">
                      Payout record created{' '}
                      {formatDate(
                        item.createdAt,
                      )}
                    </p>

                    {isOwner &&
                      item.status ===
                        'ELIGIBLE' && (
                        <button
                          type="button"
                          onClick={() =>
                            openMarkPaid(
                              item,
                            )
                          }
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                        >
                          Mark Paid
                        </button>
                      )}
                  </div>
                </div>
              ),
            )}

            {!filteredPayouts.length && (
              <div className="py-12 text-center text-sm text-gray-500">
                No payouts found.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              Solar Mitra Payout Settings
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              These are the default terms for new Solar Mitra
              referrals. A Mitra-specific override can be set
              from the Mitra profile.
            </p>
          </div>

          <form
            onSubmit={saveSettings}
            className="mt-6 space-y-5"
          >
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700">
                Default Payout Amount (₹)
              </label>

              <input
                type="number"
                min="0"
                value={
                  settingsForm.defaultPayoutAmount
                }
                disabled={!isOwner}
                onChange={(event) =>
                  setSettingsForm(
                    (prev) => ({
                      ...prev,
                      defaultPayoutAmount:
                        event.target.value,
                    }),
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700">
                Project Payment Required (%)
              </label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={
                  settingsForm.requiredProjectPaymentPercentage
                }
                disabled={!isOwner}
                onChange={(event) =>
                  setSettingsForm(
                    (prev) => ({
                      ...prev,
                      requiredProjectPaymentPercentage:
                        event.target.value,
                    }),
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 disabled:bg-gray-100"
              />
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              Qualification is based on the project payment
              percentage. Existing referral payout terms remain
              snapshotted and are not rewritten when these
              defaults change.
            </div>

            {isOwner ? (
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : 'Save Settings'}
              </button>
            ) : (
              <div className="rounded-xl bg-gray-100 p-4 text-sm font-semibold text-gray-600">
                Settings are read-only for Franchise Manager.
                Only Owner can change payout rules.
              </div>
            )}

            {settings?.updatedAt && (
              <p className="text-xs text-gray-400">
                Last updated{' '}
                {formatDate(
                  settings.updatedAt,
                )}
                {settings.updatedByName
                  ? ` by ${settings.updatedByName}`
                  : ''}
              </p>
            )}
          </form>
        </div>
      )}

      {showMitraModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {editingMitra
                    ? 'Edit Solar Mitra'
                    : 'Add Solar Mitra'}
                </h2>

                <p className="text-sm text-gray-500">
  Referral partner profile and CRM access
</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowMitraModal(
                    false,
                  )
                }
                className="rounded-lg px-3 py-2 text-xl font-bold text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={saveMitra}
              className="space-y-6 p-5"
            >
              <div>
                <h3 className="mb-3 font-black text-gray-900">
                  Basic Details
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Name *"
                    value={mitraForm.name}
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          name: value,
                        }),
                      )
                    }
                  />

                  <FormField
                    label="Business / Shop Name"
                    value={
                      mitraForm.businessName
                    }
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          businessName:
                            value,
                        }),
                      )
                    }
                  />

                  <FormField
                    label="Primary Phone *"
                    value={
                      mitraForm.primaryPhone
                    }
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          primaryPhone:
                            value,
                        }),
                      )
                    }
                  />

                  <FormField
                    label="Secondary Phone"
                    value={
                      mitraForm.secondaryPhone
                    }
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          secondaryPhone:
                            value,
                        }),
                      )
                    }
                  />

                  <FormField
                    label="Email"
                    value={mitraForm.email}
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          email: value,
                        }),
                      )
                    }
                  />

                  <FormField
                    label={
  editingMitra
    ? 'New CRM Password'
    : 'CRM Password *'
}
                    value={
                      mitraForm.portalPassword
                    }
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          portalPassword:
                            value,
                        }),
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-black text-gray-900">
                  Address & Location
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Area"
                    value={mitraForm.area}
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          area: value,
                        }),
                      )
                    }
                  />

                  <FormField
                    label="City"
                    value={mitraForm.city}
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          city: value,
                        }),
                      )
                    }
                  />

                  <FormField
                    label="State"
                    value={mitraForm.state}
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          state: value,
                        }),
                      )
                    }
                  />

                  <div className="md:col-span-2">
  <button
    type="button"
    onClick={
      captureMitraLocation
    }
    disabled={capturingGps}
    className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
  >
    {capturingGps
      ? 'Capturing Location...'
      : '📍 Capture GPS Location'}
  </button>

  {mitraForm.gpsLatitude &&
    mitraForm.gpsLongitude && (
      <p className="mt-2 text-xs font-semibold text-emerald-700">
        Location captured:{' '}
        {mitraForm.gpsLatitude},{' '}
        {mitraForm.gpsLongitude}
      </p>
    )}
</div>

                  <FormField
                    label="GPS Address"
                    value={
                      mitraForm.gpsAddress
                    }
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          gpsAddress:
                            value,
                        }),
                      )
                    }
                  />

                  <FormField
                    label="GPS Latitude"
                    type="number"
                    value={
                      mitraForm.gpsLatitude
                    }
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          gpsLatitude:
                            value,
                        }),
                      )
                    }
                  />

                  <FormField
                    label="GPS Longitude"
                    type="number"
                    value={
                      mitraForm.gpsLongitude
                    }
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          gpsLongitude:
                            value,
                        }),
                      )
                    }
                  />

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-bold text-gray-700">
                      Full Address
                    </label>

                    <textarea
                      rows={3}
                      value={
                        mitraForm.address
                      }
                      onChange={(event) =>
                        setMitraForm(
                          (prev: any) => ({
                            ...prev,
                            address:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
  <label className="mb-1 block text-sm font-bold text-gray-700">
    Shop Photo
  </label>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    capture="environment"
    disabled={uploadingShopPhoto}
    onChange={async (
      event,
    ) => {
      const file =
        event.target.files?.[0];

      if (file) {
        await uploadShopPhoto(
          file,
        );
      }

      event.target.value = '';
    }}
    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
  />

  {uploadingShopPhoto && (
    <p className="mt-2 text-xs font-semibold text-blue-600">
      Uploading shop photo...
    </p>
  )}

  {mitraForm.shopPhotoUrl && (
    <div className="mt-3">
      <img
        src={
          mitraForm.shopPhotoUrl
        }
        alt="Solar Mitra shop"
        className="h-40 w-full max-w-sm rounded-xl border border-gray-200 object-cover"
      />

      <button
        type="button"
        onClick={() =>
          setMitraForm(
            (prev: any) => ({
              ...prev,
              shopPhotoUrl: '',
            }),
          )
        }
        className="mt-2 text-xs font-bold text-red-600"
      >
        Remove Photo
      </button>
    </div>
  )}
</div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-black text-gray-900">
                  Management
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative">
                    <label className="mb-1 block text-sm font-bold text-gray-700">
                      Franchise Manager
                    </label>

                    <div className="flex gap-2">
                      <input
                        value={
                          managerSearch
                        }
                        onFocus={() =>
                          setShowManagerOptions(
                            true,
                          )
                        }
                        onChange={(
                          event,
                        ) => {
                          setManagerSearch(
                            event.target
                              .value,
                          );

                          setShowManagerOptions(
                            true,
                          );

                          setMitraForm(
                            (
                              prev: any,
                            ) => ({
                              ...prev,
                              franchiseManagerId:
                                '',
                              franchiseManagerName:
                                '',
                            }),
                          );
                        }}
                        placeholder="Search manager..."
                        className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm"
                      />

                      {managerSearch && (
                        <button
                          type="button"
                          onClick={
                            clearManager
                          }
                          className="rounded-xl border border-gray-300 px-3 text-sm font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {showManagerOptions && (
                      <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                        {filteredManagers.map(
                          (
                            manager,
                          ) => (
                            <button
                              key={
                                manager.id
                              }
                              type="button"
                              onClick={() =>
                                selectManager(
                                  manager,
                                )
                              }
                              className="block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
                            >
                              <p className="text-sm font-bold text-gray-900">
                                {manager.name ||
                                  `User #${manager.id}`}
                              </p>

                              <p className="text-xs text-gray-500">
                                {
                                  manager.email
                                }
                              </p>
                            </button>
                          ),
                        )}

                        {!filteredManagers.length && (
                          <p className="p-4 text-sm text-gray-500">
                            No Franchise
                            Manager found.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-gray-700">
                      Status
                    </label>

                    <select
                      value={
                        mitraForm.status
                      }
                      onChange={(
                        event,
                      ) =>
                        setMitraForm(
                          (prev: any) => ({
                            ...prev,
                            status:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                    >
                      <option value="ACTIVE">
                        Active
                      </option>
                      <option value="INACTIVE">
                        Inactive
                      </option>
                      <option value="BLOCKED">
                        Blocked
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-1 font-black text-gray-900">
                  Payout Override
                </h3>

                <p className="mb-3 text-xs text-gray-500">
                  Leave blank to use global Solar Mitra settings.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Payout Amount Override (₹)"
                    type="number"
                    value={
                      mitraForm.payoutAmountOverride
                    }
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          payoutAmountOverride:
                            value,
                        }),
                      )
                    }
                  />

                  <FormField
                    label="Required Project Payment Override (%)"
                    type="number"
                    value={
                      mitraForm.requiredPaymentPercentageOverride
                    }
                    onChange={(value) =>
                      setMitraForm(
                        (prev: any) => ({
                          ...prev,
                          requiredPaymentPercentageOverride:
                            value,
                        }),
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowMitraModal(
                      false,
                    )
                  }
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
  saving ||
  uploadingShopPhoto ||
  capturingGps
}
                  className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingMitra
                      ? 'Update Solar Mitra'
                      : 'Create Solar Mitra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMeetingModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
    <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white p-5">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            {editingMeeting
              ? 'Update Solar Mitra Meeting'
              : 'New Solar Mitra Meeting / Visit'}
          </h2>

          <p className="text-sm text-gray-500">
            Record prospect visits and ongoing Solar Mitra follow-ups.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowMeetingModal(false)
          }
          className="rounded-lg px-3 py-2 text-xl font-bold text-gray-500 hover:bg-gray-100"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={saveMeeting}
        className="space-y-6 p-5"
      >
        {!editingMeeting && (
          <div>
            <h3 className="mb-3 font-black text-gray-900">
              Existing Solar Mitra
            </h3>

            <p className="mb-3 text-xs text-gray-500">
              Optional. Select a Solar Mitra when this is an ongoing follow-up. Leave blank for a new prospect.
            </p>

            <select
              value={
                meetingForm.solarMitraId
              }
              onChange={(event) => {
                const id = Number(
                  event.target.value,
                );

                if (!id) {
                  setMeetingForm(
                    (prev) => ({
                      ...prev,
                      solarMitraId: '',
                    }),
                  );

                  return;
                }

                const selected =
                  mitras.find(
                    (item) =>
                      Number(item.id) ===
                      id,
                  );

                if (selected) {
                  selectExistingMitraForMeeting(
                    selected,
                  );
                }
              }}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
            >
              <option value="">
                New Prospect / Not Yet Solar Mitra
              </option>

              {mitras.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                  {item.businessName
                    ? ` — ${item.businessName}`
                    : ''}
                  {item.primaryPhone
                    ? ` — ${item.primaryPhone}`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <h3 className="mb-3 font-black text-gray-900">
            Person / Shop Details
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Name *"
              value={meetingForm.name}
              onChange={(value) =>
                setMeetingForm(
                  (prev) => ({
                    ...prev,
                    name: value,
                  }),
                )
              }
            />

            <FormField
              label="Primary Phone *"
              value={
                meetingForm.primaryPhone
              }
              onChange={(value) =>
                setMeetingForm(
                  (prev) => ({
                    ...prev,
                    primaryPhone: value,
                  }),
                )
              }
            />

            <FormField
              label="Business / Shop Name"
              value={
                meetingForm.businessName
              }
              onChange={(value) =>
                setMeetingForm(
                  (prev) => ({
                    ...prev,
                    businessName: value,
                  }),
                )
              }
            />

            <FormField
              label="Area"
              value={meetingForm.area}
              onChange={(value) =>
                setMeetingForm(
                  (prev) => ({
                    ...prev,
                    area: value,
                  }),
                )
              }
            />

            <FormField
              label="City"
              value={meetingForm.city}
              onChange={(value) =>
                setMeetingForm(
                  (prev) => ({
                    ...prev,
                    city: value,
                  }),
                )
              }
            />

            <FormField
              label="Address"
              value={meetingForm.address}
              onChange={(value) =>
                setMeetingForm(
                  (prev) => ({
                    ...prev,
                    address: value,
                  }),
                )
              }
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-black text-gray-900">
            Meeting Schedule
          </h3>

          <LocalizationProvider
            dateAdapter={AdapterDayjs}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <DatePicker
                label="Meeting Date *"
                value={meetingDate}
                onChange={(value) =>
                  setMeetingDate(value)
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <MobileTimePicker
                label="Meeting Time *"
                value={meetingTime}
                onChange={(value) =>
                  setMeetingTime(value)
                }
                ampm
                ampmInClock
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <DatePicker
                label="Next Follow-up Date"
                value={followUpDate}
                onChange={(value) =>
                  setFollowUpDate(value)
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <MobileTimePicker
                label="Next Follow-up Time"
                value={followUpTime}
                onChange={(value) =>
                  setFollowUpTime(value)
                }
                ampm
                ampmInClock
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </div>
          </LocalizationProvider>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-bold text-gray-700">
              Meeting Status *
            </label>

            <select
              value={meetingForm.status}
              onChange={(event) =>
                setMeetingForm(
                  (prev) => ({
                    ...prev,
                    status:
                      event.target
                        .value as SolarMitraMeetingStatus,
                  }),
                )
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
            >
              <option value="SCHEDULED">
                Scheduled
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>

              <option value="ON_HOLD">
                On Hold
              </option>
            </select>
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-black text-gray-900">
              Location
            </h3>

            <button
              type="button"
              onClick={
                captureMeetingLocation
              }
              disabled={
                capturingMeetingGps
              }
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 disabled:opacity-50"
            >
              {capturingMeetingGps
                ? 'Capturing...'
                : '📍 Capture Current GPS'}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="GPS Latitude"
              value={
                meetingForm.gpsLatitude
              }
              onChange={(value) =>
                setMeetingForm(
                  (prev) => ({
                    ...prev,
                    gpsLatitude: value,
                  }),
                )
              }
            />

            <FormField
              label="GPS Longitude"
              value={
                meetingForm.gpsLongitude
              }
              onChange={(value) =>
                setMeetingForm(
                  (prev) => ({
                    ...prev,
                    gpsLongitude: value,
                  }),
                )
              }
            />

            <div className="md:col-span-2">
              <FormField
                label="GPS Address"
                value={
                  meetingForm.gpsAddress
                }
                onChange={(value) =>
                  setMeetingForm(
                    (prev) => ({
                      ...prev,
                      gpsAddress: value,
                    }),
                  )
                }
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-1 font-black text-gray-900">
            Meeting Photos
          </h3>

          <p className="mb-3 text-xs text-gray-500">
            Add up to 2 photos. Images are compressed before upload.
          </p>

          <input
            ref={meetingPhotoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={
              handleMeetingPhotoSelect
            }
            className="hidden"
          />

          <button
            type="button"
            onClick={() =>
              meetingPhotoInputRef.current?.click()
            }
            disabled={
              meetingPhotoPreviews.length >=
              2
            }
            className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700 disabled:opacity-50"
          >
            📷 Add Photo
          </button>

          {!!meetingPhotoPreviews.length && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-lg">
              {meetingPhotoPreviews.map(
                (url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="relative overflow-hidden rounded-xl border bg-gray-50"
                  >
                    <img
                      src={url}
                      alt={`Meeting photo ${index + 1}`}
                      className="h-40 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeMeetingPhoto(
                          index,
                        )
                      }
                      className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-black text-white"
                    >
                      ×
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-1 font-black text-gray-900">
            Audio Proof
          </h3>

          <p className="mb-3 text-xs text-gray-500">
            Optional recorded call or other audio proof. Upload only.
          </p>

          <input
            ref={meetingAudioInputRef}
            type="file"
            accept="audio/*"
            onChange={
              handleMeetingAudioSelect
            }
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                meetingAudioInputRef.current?.click()
              }
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700"
            >
              🎵 Upload Audio
            </button>

            {meetingAudioPreview && (
              <>
                <audio
                  controls
                  src={
                    meetingAudioPreview
                  }
                  className="max-w-full"
                />

                <button
                  type="button"
                  onClick={
                    removeMeetingAudio
                  }
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-1 font-black text-gray-900">
            Supporting Document
          </h3>

          <p className="mb-3 text-xs text-gray-500">
            Optional PDF or image document.
          </p>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={
                meetingDocumentName
              }
              onChange={(event) =>
                setMeetingDocumentName(
                  event.target.value,
                )
              }
              placeholder="Document name (optional)"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm"
            />

            <input
              ref={
                meetingDocumentInputRef
              }
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(event) =>
                setMeetingDocumentFile(
                  event.target
                    .files?.[0] ||
                    null,
                )
              }
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {!!editingMeeting?.documents
            ?.length && (
            <div className="mt-3 flex flex-wrap gap-2">
              {editingMeeting.documents.map(
                (document) => (
                  <a
                    key={document.id}
                    href={
                      document.fileUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700"
                  >
                    {document.documentName ||
                      document.fileName ||
                      'View Document'}
                  </a>
                ),
              )}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-gray-700">
            Notes / Update
          </label>

          <textarea
            value={meetingForm.notes}
            onChange={(event) =>
              setMeetingForm(
                (prev) => ({
                  ...prev,
                  notes:
                    event.target.value,
                }),
              )
            }
            rows={4}
            placeholder="Meeting discussion, update, next action..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
          />
        </div>

        <div className="flex justify-end gap-3 border-t pt-5">
          <button
            type="button"
            onClick={() =>
              setShowMeetingModal(
                false,
              )
            }
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              uploadingMeetingFiles ||
              capturingMeetingGps
            }
            className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ||
            uploadingMeetingFiles
              ? 'Saving...'
              : editingMeeting
                ? 'Update Meeting'
                : 'Save Meeting'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{convertingMeeting && (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-3">
    <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Create Solar Mitra
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Prospect details will be taken from this meeting.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setConvertingMeeting(
              null,
            );
            setConvertSliderValue(
              0,
            );
          }}
          className="rounded-lg px-3 py-2 text-xl font-bold text-gray-500"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={
          convertMeetingToSolarMitra
        }
        className="space-y-5 p-5"
      >
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="font-black text-gray-900">
            {convertingMeeting.name}
          </p>

          {convertingMeeting.businessName && (
            <p className="mt-1 text-sm font-semibold text-gray-700">
              {
                convertingMeeting.businessName
              }
            </p>
          )}

          <p className="mt-1 text-sm text-gray-600">
            {
              convertingMeeting.primaryPhone
            }
          </p>

          {(convertingMeeting.area ||
            convertingMeeting.city) && (
            <p className="mt-1 text-sm text-gray-600">
              {[
                convertingMeeting.area,
                convertingMeeting.city,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}

          {convertingMeeting.address && (
            <p className="mt-1 text-sm text-gray-600">
              {
                convertingMeeting.address
              }
            </p>
          )}
        </div>

        <FormField
          label="CRM Email *"
          value={conversionForm.email}
          onChange={(value) =>
            setConversionForm(
              (prev) => ({
                ...prev,
                email: value,
              }),
            )
          }
        />

        <FormField
          label="CRM Password *"
          value={
            conversionForm.password
          }
          onChange={(value) =>
            setConversionForm(
              (prev) => ({
                ...prev,
                password: value,
              }),
            )
          }
        />

        <div className="flex justify-end gap-3 border-t pt-5">
          <button
            type="button"
            onClick={() => {
              setConvertingMeeting(
                null,
              );
              setConvertSliderValue(
                0,
              );
            }}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving
              ? 'Creating...'
              : 'Create Solar Mitra'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {showReferralModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Add Solar Mitra Referral
                </h2>

                <p className="text-sm text-gray-500">
                  Saving this referral creates the Lead immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowReferralModal(
                    false,
                  )
                }
                className="rounded-lg px-3 py-2 text-xl font-bold text-gray-500"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={saveReferral}
              className="space-y-4 p-5"
            >
              <div className="relative">
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Solar Mitra *
                </label>

                <input
                  value={
                    referralMitraSearch
                  }
                  onFocus={() =>
                    setShowReferralMitraOptions(
                      true,
                    )
                  }
                  onChange={(event) => {
                    setReferralMitraSearch(
                      event.target.value,
                    );

                    setReferralForm(
                      (prev: any) => ({
                        ...prev,
                        solarMitraId:
                          '',
                      }),
                    );

                    setShowReferralMitraOptions(
                      true,
                    );
                  }}
                  placeholder="Search name, business, phone or city..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                />

                {showReferralMitraOptions && (
                  <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                    {filteredReferralMitraOptions.map(
                      (item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            selectReferralMitra(
                              item,
                            )
                          }
                          className="block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <p className="font-bold text-gray-900">
                            {item.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            {[
                              item.businessName,
                              item.primaryPhone,
                              item.city,
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(
                                ' · ',
                              )}
                          </p>
                        </button>
                      ),
                    )}

                    {!filteredReferralMitraOptions.length && (
                      <p className="p-4 text-sm text-gray-500">
                        No active Solar Mitra found.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="Customer Name *"
                  value={
                    referralForm.customerName
                  }
                  onChange={(value) =>
                    setReferralForm(
                      (prev: any) => ({
                        ...prev,
                        customerName:
                          value,
                      }),
                    )
                  }
                />

                <FormField
                  label="Customer Phone *"
                  value={
                    referralForm.customerPhone
                  }
                  onChange={(value) =>
                    setReferralForm(
                      (prev: any) => ({
                        ...prev,
                        customerPhone:
                          value,
                      }),
                    )
                  }
                />

                <FormField
                  label="Alternate Phone"
                  value={
                    referralForm.alternatePhone
                  }
                  onChange={(value) =>
                    setReferralForm(
                      (prev: any) => ({
                        ...prev,
                        alternatePhone:
                          value,
                      }),
                    )
                  }
                />

                <FormField
                  label="City"
                  value={
                    referralForm.customerCity
                  }
                  onChange={(value) =>
                    setReferralForm(
                      (prev: any) => ({
                        ...prev,
                        customerCity:
                          value,
                      }),
                    )
                  }
                />

                <FormField
                  label="Area"
                  value={
                    referralForm.customerArea
                  }
                  onChange={(value) =>
                    setReferralForm(
                      (prev: any) => ({
                        ...prev,
                        customerArea:
                          value,
                      }),
                    )
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Customer Address
                </label>

                <textarea
                  rows={2}
                  value={
                    referralForm.customerAddress
                  }
                  onChange={(event) =>
                    setReferralForm(
                      (prev: any) => ({
                        ...prev,
                        customerAddress:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Remarks
                </label>

                <textarea
                  rows={3}
                  value={
                    referralForm.remarks
                  }
                  onChange={(event) =>
                    setReferralForm(
                      (prev: any) => ({
                        ...prev,
                        remarks:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                />
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                There is no separate approval or conversion step.
                This submission will create an unassigned CRM Lead
                immediately.
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setShowReferralModal(
                      false,
                    )
                  }
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {saving
                    ? 'Creating...'
                    : 'Create Referral & Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaidModal &&
        selectedPayout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="border-b p-5">
                <h2 className="text-xl font-black text-gray-900">
                  Mark Payout Paid
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {
                    selectedPayout.solarMitraName
                  }{' '}
                  ·{' '}
                  {money(
                    selectedPayout.payoutAmount,
                  )}
                </p>
              </div>

              <form
                onSubmit={markPaid}
                className="space-y-4 p-5"
              >
                <FormField
                  label="Payment Mode"
                  value={
                    paidForm.paymentMode
                  }
                  onChange={(value) =>
                    setPaidForm(
                      (prev) => ({
                        ...prev,
                        paymentMode:
                          value,
                      }),
                    )
                  }
                />

                <FormField
                  label="Payment Reference"
                  value={
                    paidForm.paymentReference
                  }
                  onChange={(value) =>
                    setPaidForm(
                      (prev) => ({
                        ...prev,
                        paymentReference:
                          value,
                      }),
                    )
                  }
                />

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">
                    Remarks
                  </label>

                  <textarea
                    rows={3}
                    value={
                      paidForm.paymentRemarks
                    }
                    onChange={(
                      event,
                    ) =>
                      setPaidForm(
                        (prev) => ({
                          ...prev,
                          paymentRemarks:
                            event.target
                              .value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                  />
                </div>

                <div className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  This records the payout as paid. Use the actual
                  payment mode/reference used by the company.
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setShowPaidModal(
                        false,
                      )
                    }
                    className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {saving
                      ? 'Saving...'
                      : 'Confirm Paid'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {qrMitra && qrDataUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-xl font-black text-gray-900">
              Solar Mitra Referral QR
            </h2>

            <p className="mt-1 font-bold text-orange-600">
              {qrMitra.name}
            </p>

            {qrMitra.businessName && (
              <p className="text-sm text-gray-500">
                {
                  qrMitra.businessName
                }
              </p>
            )}

            <img
              src={qrDataUrl}
              alt={`Referral QR for ${qrMitra.name}`}
              className="mx-auto mt-5 w-full max-w-[300px] rounded-xl border border-gray-200 p-2"
            />

            <p className="mt-4 break-all text-xs text-gray-500">
              {getPublicReferralUrl(
                qrMitra,
              )}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  copyReferralLink(
                    qrMitra,
                  )
                }
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold"
              >
                Copy Link
              </button>

              <button
                type="button"
                onClick={downloadQr}
                className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white"
              >
                Save / Share QR
              </button>

              <button
                type="button"
                onClick={() => {
                  setQrMitra(null);
                  setQrDataUrl('');
                }}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-gray-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
      />
    </div>
  );
}