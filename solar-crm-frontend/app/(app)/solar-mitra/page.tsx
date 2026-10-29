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
  | 'CREATOR_PAYOUTS'
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
  bankAccountNumber?: string | null;
bankIfscCode?: string | null;
paymentQrCodeUrl?: string | null;
qrPosterInstallationPhotoUrl?: string | null;
qrPosterInstallationPhotoUrl2?: string | null;
  portalPassword?: string | null;
  publicReferralToken?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  payoutAmountOverride?: number | null;
  requiredPaymentPercentageOverride?: number | null;
  franchiseManagerId?: number | null;
franchiseManagerName?: string | null;

  createdBy?: number | null;
  createdByName?: string | null;
  createdByRole?: string | null;

  interestStatus?:
    | 'PENDING'
    | 'INTERESTED'
    | 'NOT_INTERESTED';

  interestUpdatedAt?: string | null;
  interestUpdatedBy?: number | null;
  interestUpdatedByName?: string | null;

  printingStatus?:
    | 'UNPRINTED'
    | 'PRINTED';

    printingUpdatedAt?: string | null;
  printingUpdatedBy?: number | null;
  printingUpdatedByName?: string | null;

  posterVerificationStatus?:
    | 'NOT_ATTACHED'
    | 'PENDING_VERIFICATION'
    | 'ATTACHED'
    | 'REJECTED';

  posterVerifiedAt?: string | null;
  posterVerifiedBy?: number | null;
  posterVerifiedByName?: string | null;
  posterVerificationRemarks?: string | null;

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

type SolarMitraCreatorPayout = {
  id: number;

  solarMitraId: number;
  solarMitraName: string;

  creatorId: number;
  creatorName?: string | null;
  creatorRole?: string | null;

  payoutAmount: number;

  status:
    | 'ELIGIBLE'
    | 'PAID'
    | 'CANCELLED';

  eligibleAt: string;

  paidAt?: string | null;
  paidBy?: number | null;
  paidByName?: string | null;

  paymentMode?: string | null;
  paymentReference?: string | null;
  paymentRemarks?: string | null;

  cancelledAt?: string | null;
  cancellationReason?: string | null;

  mitraCreatedAt?: string | null;
  posterApprovedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

type SolarMitraSetting = {
  id: number;
  defaultPayoutAmount: number;
  creatorPayoutAmount: number;
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
  qrPosterInstallationPhotoUrl: '',
  qrPosterInstallationPhotoUrl2: '',
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

    const [
  creatorReconciliationCreationMonth,
  setCreatorReconciliationCreationMonth,
] = useState('');

const [
  creatorReconciliationApprovalMonth,
  setCreatorReconciliationApprovalMonth,
] = useState('');

const [
  creatorReconciliationCreatorId,
  setCreatorReconciliationCreatorId,
] = useState('');

const [
  creatorReconciliationPreview,
  setCreatorReconciliationPreview,
] = useState<{
  creationMonth: string | null;
  posterApprovalMonth: string | null;
  creatorId: string | number | null;
  configuredPayoutAmount: number;
  totalCandidates: number;
  eligibleCount: number;
  excludedCount: number;
  estimatedTotalAmount: number;
  canGenerate: boolean;
  records: {
    solarMitraId: number;
    solarMitraName: string;
    creatorId: number;
    creatorName: string | null;
    posterVerifiedAt: string | null;
  }[];
} | null>(null);

const [
  creatorReconciliationLoading,
  setCreatorReconciliationLoading,
] = useState(false);

const [
  creatorReconciliationGenerating,
  setCreatorReconciliationGenerating,
] = useState(false);

    const [
  selectedCreatorPayout,
  setSelectedCreatorPayout,
] = useState<SolarMitraCreatorPayout | null>(null);

const [
  showCreatorPayoutPaidModal,
  setShowCreatorPayoutPaidModal,
] = useState(false);

const [
  creatorPayoutPaidForm,
  setCreatorPayoutPaidForm,
] = useState({
  paymentMode: '',
  paymentReference: '',
  paymentRemarks: '',
});

const [
  savingCreatorPayoutPayment,
  setSavingCreatorPayoutPayment,
] = useState(false);

const [creatorPayouts, setCreatorPayouts] =
  useState<SolarMitraCreatorPayout[]>([]);

const [
  creatorPayoutsLoading,
  setCreatorPayoutsLoading,
] = useState(false);

const [
  creatorPayoutCreationMonth,
  setCreatorPayoutCreationMonth,
] = useState('');

const [
  creatorPayoutApprovalMonth,
  setCreatorPayoutApprovalMonth,
] = useState('');

const [
  creatorPayoutStatus,
  setCreatorPayoutStatus,
] = useState('');

const [
  creatorPayoutSearch,
  setCreatorPayoutSearch,
] = useState('');

const [
  creatorPayoutCreatorId,
  setCreatorPayoutCreatorId,
] = useState('');

const [
  creatorPayoutMitraId,
  setCreatorPayoutMitraId,
] = useState('');

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

  const [
  uploadingPosterPhoto,
  setUploadingPosterPhoto,
] = useState(false);

  const [mitraSearch, setMitraSearch] = useState('');
  const [mitraStatus, setMitraStatus] = useState('');

  const [
  mitraInterestStatus,
  setMitraInterestStatus,
] = useState('');

const [
  mitraPrintingStatus,
  setMitraPrintingStatus,
] = useState('');

const [
  mitraPosterVerificationStatus,
  setMitraPosterVerificationStatus,
] = useState('');

const [
  mitraDateFilterType,
  setMitraDateFilterType,
] = useState<'ALL' | 'MONTH' | 'CUSTOM'>('ALL');

const [mitraSelectedMonth, setMitraSelectedMonth] =
  useState(dayjs().format('YYYY-MM'));

const [mitraDateFrom, setMitraDateFrom] =
  useState('');

const [mitraDateTo, setMitraDateTo] =
  useState('');

  const [
  mitraCreatedBy,
  setMitraCreatedBy,
] = useState('');

  const [referralSearch, setReferralSearch] =
    useState('');
  const [referralStatus, setReferralStatus] =
    useState('');
  const [referralMitraId, setReferralMitraId] =
    useState('');

    const [
  referralDateFilterType,
  setReferralDateFilterType,
] = useState<'ALL' | 'MONTH' | 'CUSTOM'>('ALL');

const [
  referralSelectedMonth,
  setReferralSelectedMonth,
] = useState(dayjs().format('YYYY-MM'));

const [referralDateFrom, setReferralDateFrom] =
  useState('');

const [referralDateTo, setReferralDateTo] =
  useState('');

  const [payoutSearch, setPayoutSearch] =
    useState('');
  const [payoutStatus, setPayoutStatus] =
    useState('');

  const [showMitraModal, setShowMitraModal] =
    useState(false);
  const [editingMitra, setEditingMitra] =
    useState<SolarMitra | null>(null);
    const [viewingBankMitra, setViewingBankMitra] =
  useState<SolarMitra | null>(null);

  const [viewingPayoutPaymentDetails, setViewingPayoutPaymentDetails] =
  useState<{
    payoutId: number;
    solarMitraId: number;
    solarMitraName: string;
    solarMitraBusinessName: string | null;
    payoutAmount: number;
    payoutStatus: string;
    bankAccountNumber: string | null;
    bankIfscCode: string | null;
    paymentQrCodeUrl: string | null;
  } | null>(null);

const [loadingPayoutPaymentDetails, setLoadingPayoutPaymentDetails] =
  useState(false);

const [viewingPosterMitra, setViewingPosterMitra] =
  useState<SolarMitra | null>(null);
  const [updatingPosterVerification, setUpdatingPosterVerification] =
  useState(false);

const [posterRejectionRemarks, setPosterRejectionRemarks] =
  useState('');

const [showPosterRejectionForm, setShowPosterRejectionForm] =
  useState(false);
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
    creatorPayoutAmount: '',
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

const isOwner =
  userRoles.includes('OWNER');

const isAccountManager =
  userRoles.includes('ACCOUNT_MANAGER');

const canManagePayoutPayments =
  isOwner || isAccountManager;

const isFranchiseHead =
  userRoles.includes('FRANCHISE_HEAD');

const canAssignFranchiseManager =
  isOwner || isFranchiseHead;

  const canFilterByCreator =
  isOwner || isFranchiseHead;

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

  const [updatingMitraStatusId, setUpdatingMitraStatusId] =
  useState<number | null>(null);

  const submitPosterVerification = async (
  status: 'ATTACHED' | 'REJECTED',
) => {
  if (!viewingPosterMitra || updatingPosterVerification) {
    return;
  }

  const mitra = viewingPosterMitra;

  if (
    !mitra.qrPosterInstallationPhotoUrl &&
    !mitra.qrPosterInstallationPhotoUrl2
  ) {
    alert('Upload at least one poster installation photo first.');
    return;
  }

  const remarks = posterRejectionRemarks.trim();

  if (status === 'REJECTED' && !remarks) {
    alert('Please enter rejection remarks.');
    return;
  }

  const confirmed = window.confirm(
    status === 'ATTACHED'
      ? `Confirm that the QR poster is attached at ${mitra.name}'s shop?`
      : `Reject the QR poster installation proof for ${mitra.name}?`,
  );

  if (!confirmed) return;

  try {
    setUpdatingPosterVerification(true);

    const response = await axios.patch(
      `${API_BASE_URL}/solar-mitra/${mitra.id}/poster-verification`,
      {
        posterVerificationStatus: status,
        remarks: status === 'REJECTED' ? remarks : '',
      },
      {
        headers: getAuthHeaders(),
      },
    );

    const updated = response.data;

    setViewingPosterMitra((previous) =>
      previous?.id === mitra.id
        ? {
            ...previous,
            posterVerificationStatus:
              updated.posterVerificationStatus,
            posterVerifiedAt: updated.posterVerifiedAt,
            posterVerifiedBy: updated.posterVerifiedBy,
            posterVerifiedByName: updated.posterVerifiedByName,
            posterVerificationRemarks:
              updated.posterVerificationRemarks,
          }
        : previous,
    );

    setMitras((previous) =>
      previous.map((item) =>
        item.id === mitra.id
          ? {
              ...item,
              posterVerificationStatus:
                updated.posterVerificationStatus,
              posterVerifiedAt: updated.posterVerifiedAt,
              posterVerifiedBy: updated.posterVerifiedBy,
              posterVerifiedByName:
                updated.posterVerifiedByName,
              posterVerificationRemarks:
                updated.posterVerificationRemarks,
            }
          : item,
      ),
    );

    setShowPosterRejectionForm(false);
    setPosterRejectionRemarks('');

    alert(
      status === 'ATTACHED'
        ? 'QR poster installation verified successfully.'
        : 'QR poster installation proof rejected.',
    );
  } catch (error) {
    alert(
      getErrorMessage(
        error,
        'Failed to update QR poster verification',
      ),
    );
  } finally {
    setUpdatingPosterVerification(false);
  }
};

const updateMitraVerificationStatus = async (
  item: SolarMitra,
  field: 'interestStatus' | 'printingStatus',
  value: string,
) => {
  if (updatingMitraStatusId !== null) return;

  const isInterest = field === 'interestStatus';

  const confirmed = window.confirm(
    `Update ${item.name}'s ${
      isInterest ? 'calling verification' : 'QR printing'
    } status to ${cleanLabel(value)}?`,
  );

  if (!confirmed) return;

  try {
    setUpdatingMitraStatusId(item.id);

    await axios.patch(
      `${API_BASE_URL}/solar-mitra/${item.id}/${
        isInterest ? 'interest-status' : 'printing-status'
      }`,
      { [field]: value },
      { headers: getAuthHeaders() },
    );

    await loadMitras();
  } catch (error) {
    alert(
      getErrorMessage(
        error,
        'Failed to update Solar Mitra status',
      ),
    );
  } finally {
    setUpdatingMitraStatusId(null);
  }
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

  const generateCreatorReconciliation = async () => {
  if (!userRoles.includes('OWNER')) {
    alert('Only Owner can generate historical Creator Payouts');
    return;
  }

  const preview = creatorReconciliationPreview;

  if (
    !preview ||
    !preview.canGenerate ||
    creatorReconciliationGenerating ||
    creatorReconciliationLoading
  ) {
    return;
  }

  const filtersMatch =
    (preview.creationMonth || '') ===
      creatorReconciliationCreationMonth &&
    (preview.posterApprovalMonth || '') ===
      creatorReconciliationApprovalMonth &&
    String(preview.creatorId || '') ===
      creatorReconciliationCreatorId.trim();

  if (!filtersMatch) {
    setCreatorReconciliationPreview(null);

    alert(
      'Reconciliation filters have changed. Please preview again.',
    );
    return;
  }

  const confirmation = window.confirm(
    `Generate ${preview.eligibleCount} historical Creator Payout(s)?\n\n` +
      `Amount per payout: ${money(preview.configuredPayoutAmount)}\n` +
      `Estimated total: ${money(preview.estimatedTotalAmount)}\n\n` +
      `This will create ELIGIBLE payout records. It will not transfer money or mark them paid.\n\n` +
      `Proceed?`,
  );

  if (!confirmation) {
    return;
  }

  setCreatorReconciliationGenerating(true);

  try {
    const response = await axios.post(
  `${API_BASE_URL}/solar-mitra/creator-payouts/reconciliation/generate`,
  {
    creationMonth:
      creatorReconciliationCreationMonth || undefined,

    posterApprovalMonth:
      creatorReconciliationApprovalMonth || undefined,

    creatorId:
      creatorReconciliationCreatorId.trim() || undefined,

    expectedPayoutAmount:
      preview.configuredPayoutAmount,

    expectedEligibleCount:
      preview.eligibleCount,
  },
  {
    headers: getAuthHeaders(),
  },
);

    setCreatorReconciliationPreview(null);

    await loadCreatorPayouts();

    alert(
      `Historical reconciliation completed.\n\n` +
        `Created: ${response.data.createdCount}\n` +
        `Excluded: ${response.data.excludedCount}\n` +
        `Skipped: ${response.data.skippedCount}\n` +
        `Total created amount: ${money(
          response.data.createdTotalAmount,
        )}`,
    );
  } catch (error) {
    console.error(
      'Historical Creator Payout generation failed',
      error,
    );

    setCreatorReconciliationPreview(null);

    alert(
      getErrorMessage(
        error,
        'Failed to generate historical Creator Payouts. Refresh the preview before retrying.',
      ),
    );
  } finally {
    setCreatorReconciliationGenerating(false);
  }
};

  const loadCreatorReconciliationPreview = async () => {
  if (!userRoles.includes('OWNER')) {
    alert(
      'Only Owner can preview historical Creator Payouts',
    );
    return;
  }

  setCreatorReconciliationLoading(true);
  setCreatorReconciliationPreview(null);

  try {
    const params: Record<string, string> = {};

    if (creatorReconciliationCreationMonth) {
      params.creationMonth =
        creatorReconciliationCreationMonth;
    }

    if (creatorReconciliationApprovalMonth) {
      params.posterApprovalMonth =
        creatorReconciliationApprovalMonth;
    }

    if (creatorReconciliationCreatorId.trim()) {
      params.creatorId =
        creatorReconciliationCreatorId.trim();
    }

    const response = await axios.get(
      `${API_BASE_URL}/solar-mitra/creator-payouts/reconciliation/preview`,
      {
        headers: getAuthHeaders(),
        params,
      },
    );

    setCreatorReconciliationPreview(response.data);
  } catch (error) {
    console.error(
      'Creator Payout reconciliation preview failed',
      error,
    );

    alert(
      getErrorMessage(
        error,
        'Failed to preview historical Creator Payouts',
      ),
    );
  } finally {
    setCreatorReconciliationLoading(false);
  }
};

  const loadCreatorPayouts = async () => {
  setCreatorPayoutsLoading(true);

  try {
    const params: Record<string, string> = {};

    if (creatorPayoutCreationMonth) {
      params.creationMonth = creatorPayoutCreationMonth;
    }

    if (creatorPayoutApprovalMonth) {
      params.posterApprovalMonth = creatorPayoutApprovalMonth;
    }

    if (creatorPayoutStatus) {
      params.status = creatorPayoutStatus;
    }

    if (creatorPayoutSearch.trim()) {
      params.search = creatorPayoutSearch.trim();
    }

    if (creatorPayoutCreatorId.trim()) {
      params.creatorId = creatorPayoutCreatorId.trim();
    }

    if (creatorPayoutMitraId.trim()) {
      params.solarMitraId = creatorPayoutMitraId.trim();
    }

    const response = await axios.get<
      SolarMitraCreatorPayout[]
    >(
      `${API_BASE_URL}/solar-mitra/creator-payouts/list`,
      {
        headers: getAuthHeaders(),
        params,
      },
    );

    setCreatorPayouts(
      Array.isArray(response.data)
        ? response.data
        : [],
    );
  } catch (error) {
    console.error(
      'Failed to load Creator Payouts',
      error,
    );

    setCreatorPayouts([]);
  } finally {
    setCreatorPayoutsLoading(false);
  }
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
      creatorPayoutAmount:
        String(
          res.data?.creatorPayoutAmount ??
            0,
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

    useEffect(() => {
    if (activeTab !== 'CREATOR_PAYOUTS') {
      return;
    }

    loadCreatorPayouts();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    creatorPayoutCreationMonth,
    creatorPayoutApprovalMonth,
    creatorPayoutStatus,
    creatorPayoutSearch,
    creatorPayoutCreatorId,
    creatorPayoutMitraId,
  ]);

  const posterSummaryMitras = useMemo(() => {
  const search = mitraSearch.trim().toLowerCase();

  return mitras.filter((item) => {
    if (mitraStatus && item.status !== mitraStatus) {
      return false;
    }

    if (
      mitraInterestStatus &&
      (item.interestStatus || 'PENDING') !== mitraInterestStatus
    ) {
      return false;
    }

    if (
      mitraPrintingStatus &&
      (item.printingStatus || 'UNPRINTED') !== mitraPrintingStatus
    ) {
      return false;
    }

    if (
      mitraCreatedBy &&
      Number(item.createdBy) !== Number(mitraCreatedBy)
    ) {
      return false;
    }

    if (mitraDateFilterType !== 'ALL') {
      if (!item.createdAt) return false;

      const createdDate = dayjs(item.createdAt);
      if (!createdDate.isValid()) return false;

      if (
        mitraDateFilterType === 'MONTH' &&
        createdDate.format('YYYY-MM') !== mitraSelectedMonth
      ) {
        return false;
      }

      if (mitraDateFilterType === 'CUSTOM') {
        const createdDay = createdDate.format('YYYY-MM-DD');

        if (mitraDateFrom && createdDay < mitraDateFrom) {
          return false;
        }

        if (mitraDateTo && createdDay > mitraDateTo) {
          return false;
        }
      }
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
      item.createdByName,
      item.createdByRole,
    ].some((value) =>
      String(value || '').toLowerCase().includes(search),
    );
  });
}, [
  mitras,
  mitraSearch,
  mitraStatus,
  mitraInterestStatus,
  mitraPrintingStatus,
  mitraCreatedBy,
  mitraDateFilterType,
  mitraSelectedMonth,
  mitraDateFrom,
  mitraDateTo,
]);

const posterCreatorPerformance = useMemo(() => {
  const creatorMap = new Map<
    number,
    {
      id: number;
      name: string;
      role: string;
      total: number;
      notAttached: number;
      pending: number;
      attached: number;
      rejected: number;
    }
  >();

  for (const item of posterSummaryMitras) {
    const creatorId = Number(item.createdBy || 0);

    if (!creatorMap.has(creatorId)) {
      creatorMap.set(creatorId, {
        id: creatorId,
        name: item.createdByName || 'Unknown Creator',
        role: item.createdByRole || '',
        total: 0,
        notAttached: 0,
        pending: 0,
        attached: 0,
        rejected: 0,
      });
    }

    const creator = creatorMap.get(creatorId)!;

    creator.total++;

    switch (item.posterVerificationStatus || 'NOT_ATTACHED') {
      case 'ATTACHED':
        creator.attached++;
        break;

      case 'PENDING_VERIFICATION':
        creator.pending++;
        break;

      case 'REJECTED':
        creator.rejected++;
        break;

      default:
        creator.notAttached++;
    }
  }

  return Array.from(creatorMap.values()).sort(
    (a, b) =>
      b.attached - a.attached ||
      b.total - a.total ||
      a.name.localeCompare(b.name),
  );
}, [posterSummaryMitras]);

const posterVerificationCounts = useMemo(() => {
  const counts = {
    total: posterSummaryMitras.length,
    notAttached: 0,
    pending: 0,
    attached: 0,
    rejected: 0,
  };

  for (const item of posterSummaryMitras) {
    switch (item.posterVerificationStatus || 'NOT_ATTACHED') {
      case 'ATTACHED':
        counts.attached++;
        break;
      case 'PENDING_VERIFICATION':
        counts.pending++;
        break;
      case 'REJECTED':
        counts.rejected++;
        break;
      default:
        counts.notAttached++;
    }
  }

  return counts;
}, [posterSummaryMitras]);

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

        if (
  mitraInterestStatus &&
  (item.interestStatus || 'PENDING') !==
    mitraInterestStatus
) {
  return false;
}

if (
  mitraPrintingStatus &&
  (item.printingStatus || 'UNPRINTED') !==
    mitraPrintingStatus
) {
  return false;
}

if (
  mitraPosterVerificationStatus &&
  (item.posterVerificationStatus || 'NOT_ATTACHED') !==
    mitraPosterVerificationStatus
) {
  return false;
}

if (mitraDateFilterType !== 'ALL') {
  if (!item.createdAt) {
    return false;
  }

  const createdDate = dayjs(item.createdAt);

  if (!createdDate.isValid()) {
    return false;
  }

  if (mitraDateFilterType === 'MONTH') {
    if (
      createdDate.format('YYYY-MM') !==
      mitraSelectedMonth
    ) {
      return false;
    }
  }

  if (mitraDateFilterType === 'CUSTOM') {
    const createdDay =
      createdDate.format('YYYY-MM-DD');

    if (
      mitraDateFrom &&
      createdDay < mitraDateFrom
    ) {
      return false;
    }

    if (
      mitraDateTo &&
      createdDay > mitraDateTo
    ) {
      return false;
    }
  }
}

        if (
  mitraCreatedBy &&
  Number(item.createdBy) !==
    Number(mitraCreatedBy)
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
  item.createdByName,
  item.createdByRole,
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
  mitraInterestStatus,
  mitraPrintingStatus,
  mitraPosterVerificationStatus,
  mitraCreatedBy,
  mitraDateFilterType,
  mitraSelectedMonth,
  mitraDateFrom,
  mitraDateTo,
]);

    const mitraCreators =
  useMemo(() => {
    const creatorMap =
      new Map<
        number,
        {
          id: number;
          name: string;
          role: string;
        }
      >();

    mitras.forEach((item) => {
      if (!item.createdBy) {
        return;
      }

      const creatorId =
        Number(item.createdBy);

      if (
        !creatorMap.has(creatorId)
      ) {
        creatorMap.set(
          creatorId,
          {
            id: creatorId,
            name:
              item.createdByName ||
              `User #${creatorId}`,
            role:
              item.createdByRole ||
              '',
          },
        );
      }
    });

    return Array.from(
      creatorMap.values(),
    ).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [mitras]);

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

          if (referralDateFilterType !== 'ALL') {
  if (!item.createdAt) {
    return false;
  }

  const createdDate = dayjs(item.createdAt);

  if (!createdDate.isValid()) {
    return false;
  }

  if (referralDateFilterType === 'MONTH') {
    if (
      createdDate.format('YYYY-MM') !==
      referralSelectedMonth
    ) {
      return false;
    }
  }

  if (referralDateFilterType === 'CUSTOM') {
    const createdDay =
      createdDate.format('YYYY-MM-DD');

    if (
      referralDateFrom &&
      createdDay < referralDateFrom
    ) {
      return false;
    }

    if (
      referralDateTo &&
      createdDay > referralDateTo
    ) {
      return false;
    }
  }
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
  referralDateFilterType,
  referralSelectedMonth,
  referralDateFrom,
  referralDateTo,
]);

const referralPerformance = useMemo(() => {
  const mitraById = new Map(
    mitras.map((mitra) => [
      Number(mitra.id),
      mitra,
    ]),
  );

  const creatorCounts = new Map<
    string,
    {
      creatorName: string;
      mitraIds: Set<number>;
      referralCount: number;
    }
  >();

  const mitraCounts = new Map<
    number,
    {
      mitraName: string;
      creatorName: string;
      referralCount: number;
    }
  >();

  for (const referral of filteredReferrals) {
    const mitraId = Number(referral.solarMitraId);
    const mitra = mitraById.get(mitraId);

    const creatorName =
      mitra?.createdByName?.trim() ||
      'Unknown Creator';

    const creatorKey =
      mitra?.createdBy != null
        ? String(mitra.createdBy)
        : `unknown-${mitraId}`;

    if (!creatorCounts.has(creatorKey)) {
      creatorCounts.set(creatorKey, {
        creatorName,
        mitraIds: new Set<number>(),
        referralCount: 0,
      });
    }

    const creator = creatorCounts.get(creatorKey)!;
    creator.mitraIds.add(mitraId);
    creator.referralCount += 1;

    if (!mitraCounts.has(mitraId)) {
      mitraCounts.set(mitraId, {
        mitraName:
          mitra?.name ||
          referral.solarMitraName ||
          `Solar Mitra #${mitraId}`,
        creatorName,
        referralCount: 0,
      });
    }

    mitraCounts.get(mitraId)!.referralCount += 1;
  }

  return {
    creators: Array.from(creatorCounts.values())
      .map((item) => ({
        creatorName: item.creatorName,
        mitraCount: item.mitraIds.size,
        referralCount: item.referralCount,
      }))
      .sort(
        (a, b) =>
          b.referralCount - a.referralCount,
      ),

    mitras: Array.from(mitraCounts.values())
      .sort(
        (a, b) =>
          b.referralCount - a.referralCount,
      ),
  };
}, [mitras, filteredReferrals]);

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
        qrPosterInstallationPhotoUrl:
  item.qrPosterInstallationPhotoUrl || '',
  qrPosterInstallationPhotoUrl2:
  item.qrPosterInstallationPhotoUrl2 || '',
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

const uploadPosterInstallationPhoto = async (
  file: File,
  photoSlot: 1 | 2 = 1,
) => {
  if (!editingMitra?.id) {
    alert('Please save the Solar Mitra first.');
    return;
  }

  if (
    ![
      'image/jpeg',
      'image/png',
      'image/webp',
    ].includes(file.type)
  ) {
    alert(
      'Only JPG, PNG and WEBP images are allowed.',
    );
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert('Image must be less than 10 MB.');
    return;
  }

  try {
    setUploadingPosterPhoto(true);

    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `${API_BASE_URL}/solar-mitra/${editingMitra.id}/poster-installation/upload?photoSlot=${photoSlot}`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const fileUrl = response.data?.fileUrl;

    if (!fileUrl) {
      throw new Error(
        'Upload URL was not returned.',
      );
    }

    setMitraForm((prev: any) => ({
  ...prev,
  [photoSlot === 1
    ? 'qrPosterInstallationPhotoUrl'
    : 'qrPosterInstallationPhotoUrl2']: fileUrl,
}));

    setEditingMitra((prev: any) =>
  prev
    ? {
        ...prev,
        [photoSlot === 1
          ? 'qrPosterInstallationPhotoUrl'
          : 'qrPosterInstallationPhotoUrl2']: fileUrl,
      }
    : prev,
);

    alert(
      'Poster installation photo uploaded successfully.',
    );
  } catch (error: any) {
    console.error(
      'Poster installation photo upload failed:',
      error,
    );

    alert(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to upload poster installation photo.',
    );
  } finally {
    setUploadingPosterPhoto(false);
  }
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

        if (
      userRoles.includes('SOLAR_MITRA_ASSISTANT') &&
      !isOwner &&
      !isFranchiseHead
    ) {
      delete (payload as Partial<typeof payload>).payoutAmountOverride;
      delete (payload as Partial<typeof payload>).requiredPaymentPercentageOverride;
      delete (payload as Partial<typeof payload>).franchiseManagerId;
    }

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

  const openPayoutPaymentDetails = async (
  payout: SolarMitraPayout,
) => {
  try {
    setLoadingPayoutPaymentDetails(true);
    setViewingPayoutPaymentDetails(null);

    const response = await axios.get(
      `${API_BASE_URL}/solar-mitra/payouts/${payout.id}/payment-details`,
      {
        headers: getAuthHeaders(),
      },
    );

    setViewingPayoutPaymentDetails(
      response.data,
    );
  } catch (error) {
    console.error(
      'Failed to load payout payment details:',
      error,
    );

    alert(
      getErrorMessage(
        error,
        'Unable to load Solar Mitra payment details',
      ),
    );
  } finally {
    setLoadingPayoutPaymentDetails(false);
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

  const markCreatorPayoutPaid = async (
  event: FormEvent,
) => {
  event.preventDefault();

  if (!selectedCreatorPayout) {
    return;
  }

  if (
    !userRoles.includes('OWNER') &&
    !userRoles.includes('ACCOUNT_MANAGER')
  ) {
    alert(
      'Only Owner or Account Manager can mark Creator Payouts as paid',
    );
    return;
  }

  const paymentMode =
    creatorPayoutPaidForm.paymentMode.trim();

  const paymentReference =
    creatorPayoutPaidForm.paymentReference.trim();

  const paymentRemarks =
    creatorPayoutPaidForm.paymentRemarks.trim();

  if (!paymentMode || !paymentReference) {
    alert(
      'Payment mode and transaction reference are required',
    );
    return;
  }

  if (savingCreatorPayoutPayment) {
    return;
  }

  setSavingCreatorPayoutPayment(true);

  try {
    await axios.patch(
      `${API_BASE_URL}/solar-mitra/creator-payouts/${selectedCreatorPayout.id}/paid`,
      {
        paymentMode,
        paymentReference,
        paymentRemarks,
      },
      {
        headers: getAuthHeaders(),
      },
    );

    setShowCreatorPayoutPaidModal(false);
    setSelectedCreatorPayout(null);

    setCreatorPayoutPaidForm({
      paymentMode: '',
      paymentReference: '',
      paymentRemarks: '',
    });

    await loadCreatorPayouts();

    alert(
      'Creator Payout marked as paid successfully',
    );
  } catch (error) {
    console.error(
      'Failed to mark Creator Payout as paid',
      error,
    );

    alert(
      getErrorMessage(
        error,
        'Failed to mark Creator Payout as paid',
      ),
    );
  } finally {
    setSavingCreatorPayoutPayment(false);
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
          creatorPayoutAmount:
            Number(
              settingsForm
                .creatorPayoutAmount,
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

  const exportSolarMitrasCsv = async (
    action: 'download' | 'share',
  ) => {
    if (filteredMitras.length === 0) {
      alert('No Solar Mitras found for the selected filters.');
      return;
    }

    try {
      const escapeCsv = (value: unknown) => {
        const text = String(value ?? '');

        // Prevent spreadsheet formula injection.
        const safeText = /^[\s]*[=+\-@\t\r]/.test(text)
          ? `'${text}`
          : text;

        return `"${safeText.replace(/"/g, '""')}"`;
      };

const headers = [
  'Solar Mitra Name',
  'Shop Name',
  'City',
  'Area',
  'Contact Number',
  'Creator Name',
];

const rows = filteredMitras.map((item) => [
  item.name,
  item.businessName,
  item.city,
  item.area,
  item.primaryPhone,
  item.createdByName || 'Unknown Creator',
]);

      const csvContent =
        '\uFEFF' +
        [headers, ...rows]
          .map((row) =>
            row.map(escapeCsv).join(','),
          )
          .join('\r\n');

      const date = new Date()
        .toLocaleDateString('en-CA');

      const fileName =
        `solar-mitras-${date}.csv`;

      const { Capacitor } = await import(
        '@capacitor/core'
      );

      if (Capacitor.isNativePlatform()) {
        const {
          Filesystem,
          Directory,
          Encoding,
        } = await import(
          '@capacitor/filesystem'
        );

        const { Share } = await import(
          '@capacitor/share'
        );

        const saved = await Filesystem.writeFile({
          path: fileName,
          data: csvContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
          recursive: true,
        });

        await Share.share({
          title: 'Solar Mitra Report',
          text: `${filteredMitras.length} Solar Mitra records`,
          files: [saved.uri],
          dialogTitle:
            action === 'download'
              ? 'Save Solar Mitra CSV'
              : 'Share Solar Mitra CSV',
        });

        return;
      }

      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8',
      });

      if (action === 'share') {
        const file = new File(
          [blob],
          fileName,
          { type: 'text/csv' },
        );

        if (
          navigator.canShare?.({
            files: [file],
          })
        ) {
          try {
            await navigator.share({
              title: 'Solar Mitra Report',
              files: [file],
            });
            return;
          } catch (error: any) {
            if (error?.name === 'AbortError') {
              return;
            }
            console.error(
              'Web CSV sharing failed:',
              error,
            );
          }
        }

        // Browser does not support file sharing.
        // Download the actual CSV instead.
      }

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error(
        'Solar Mitra CSV export failed:',
        error,
      );

      alert(
        'Unable to prepare Solar Mitra CSV. Please try again.',
      );
    }
  };

  const exportSolarMeetingsCsv = async (
  action: 'download' | 'share',
) => {
  if (filteredMeetings.length === 0) {
    alert('No meetings found for the selected filters.');
    return;
  }

  try {
    const escapeCsv = (value: unknown) => {
      const text = String(value ?? '');
      const safeText = /^[\s]*[=+\-@\t\r]/.test(text)
        ? `'${text}`
        : text;

      return `"${safeText.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Solar Mitra Name',
      'Contact Number',
      'City',
      'Franchise Manager Name',
      'Meeting Status',
    ];

    const rows = filteredMeetings.map((item) => [
      item.solarMitraName || '',
      item.primaryPhone,
      item.city || '',
      item.franchiseManagerName || '',
      cleanLabel(item.status),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map(escapeCsv).join(','))
        .join('\r\n');

    const date = new Date().toLocaleDateString('en-CA');
    const fileName = `solar-mitra-meetings-${date}.csv`;

    const { Capacitor } = await import('@capacitor/core');

    if (Capacitor.isNativePlatform()) {
      const {
        Filesystem,
        Directory,
        Encoding,
      } = await import('@capacitor/filesystem');

      const { Share } = await import('@capacitor/share');

      const saved = await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
        recursive: true,
      });

      await Share.share({
        title: 'Solar Mitra Meetings Report',
        text: `${filteredMeetings.length} meeting records`,
        files: [saved.uri],
        dialogTitle:
          action === 'download'
            ? 'Save Meetings CSV'
            : 'Share Meetings CSV',
      });

      return;
    }

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8',
    });

    if (action === 'share') {
      const file = new File([blob], fileName, {
        type: 'text/csv',
      });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Solar Mitra Meetings Report',
            files: [file],
          });
          return;
        } catch (error: any) {
          if (error?.name === 'AbortError') return;
          console.error('Meeting CSV sharing failed:', error);
        }
      }
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Meeting CSV export failed:', error);
    alert('Unable to prepare Meetings CSV. Please try again.');
  }
};

const exportSolarReferralsCsv = async (
  action: 'download' | 'share',
) => {
  if (filteredReferrals.length === 0) {
    alert('No referrals found for the selected filters.');
    return;
  }

  try {
    const escapeCsv = (value: unknown) => {
      const text = String(value ?? '');
      const safeText = /^[\s]*[=+\-@\t\r]/.test(text)
        ? `'${text}`
        : text;

      return `"${safeText.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Referral ID',
      'Solar Mitra ID',
      'Solar Mitra Name',
      'Solar Mitra Shop',
      'Solar Mitra Phone',
      'Solar Mitra Address',
      'Solar Mitra Area',
      'Solar Mitra City',
      'Customer Name',
      'Customer Phone',
      'Alternate Phone',
      'Customer Address',
      'Customer Area',
      'Customer City',
      'Remarks',
      'Source Type',
      'Referral Status',
      'Linked Lead ID',
      'Linked Meeting ID',
      'Linked Project ID',
      'Payout Amount Snapshot',
      'Required Payment Percentage',
      'Payout Terms Snapshotted At',
      'Created At',
      'Updated At',
    ];

    const rows = filteredReferrals.map((item) => [
      item.id,
      item.solarMitraId,
      item.solarMitraName,
      item.solarMitraBusinessName,
      item.solarMitraPhone,
      item.solarMitraAddress,
      item.solarMitraArea,
      item.solarMitraCity,
      item.customerName,
      item.customerPhone,
      item.alternatePhone,
      item.customerAddress,
      item.customerArea,
      item.customerCity,
      item.remarks,
      item.sourceType,
      cleanLabel(item.status),
      item.linkedLeadId,
      item.linkedMeetingId,
      item.linkedProjectId,
      item.payoutAmountSnapshot,
      item.requiredPaymentPercentageSnapshot,
      item.payoutTermsSnapshottedAt,
      item.createdAt,
      item.updatedAt,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map(escapeCsv).join(','))
        .join('\r\n');

    const date = new Date().toLocaleDateString('en-CA');
    const fileName = `solar-mitra-referrals-${date}.csv`;

    const { Capacitor } = await import('@capacitor/core');

    if (Capacitor.isNativePlatform()) {
      const {
        Filesystem,
        Directory,
        Encoding,
      } = await import('@capacitor/filesystem');

      const { Share } = await import('@capacitor/share');

      const saved = await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
        recursive: true,
      });

      await Share.share({
        title: 'Solar Mitra Referrals Report',
        text: `${filteredReferrals.length} referral records`,
        files: [saved.uri],
        dialogTitle:
          action === 'download'
            ? 'Save Referrals CSV'
            : 'Share Referrals CSV',
      });

      return;
    }

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8',
    });

    if (action === 'share') {
      const file = new File([blob], fileName, {
        type: 'text/csv',
      });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Solar Mitra Referrals Report',
            files: [file],
          });
          return;
        } catch (error: any) {
          if (error?.name === 'AbortError') return;
          console.error('Referral CSV sharing failed:', error);
        }
      }
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Referral CSV export failed:', error);
    alert('Unable to prepare Referrals CSV. Please try again.');
  }
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
      key: 'CREATOR_PAYOUTS',
      label: 'Creator Payouts',
    },
        ...(!userRoles.includes('SOLAR_MITRA_ASSISTANT') ||
    isOwner ||
    isFranchiseHead
      ? [
          {
            key: 'SETTINGS' as Tab,
            label: 'Settings',
          },
        ]
      : []),
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
          <div className="flex flex-col flex-wrap gap-3 lg:flex-row lg:items-center">
            <input
              value={mitraSearch}
              onChange={(event) =>
                setMitraSearch(
                  event.target.value,
                )
              }
              placeholder="Search name, business, phone, city, area or manager..."
              className="w-full min-w-[220px] flex-[2_1_280px] rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500"
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

            <select
              value={mitraInterestStatus}
              onChange={(event) =>
                setMitraInterestStatus(
                  event.target.value,
                )
              }
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
            >
              <option value="">
                All Calling Status
              </option>
              <option value="PENDING">
                Pending Verification
              </option>
              <option value="INTERESTED">
                Interested
              </option>
              <option value="NOT_INTERESTED">
                Not Interested
              </option>
            </select>

            <select
  value={mitraDateFilterType}
  onChange={(event) =>
    setMitraDateFilterType(
      event.target.value as
        | 'ALL'
        | 'MONTH'
        | 'CUSTOM',
    )
  }
  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
>
  <option value="ALL">All Dates</option>
  <option value="MONTH">Monthly</option>
  <option value="CUSTOM">Custom Date Range</option>
</select>

{mitraDateFilterType === 'MONTH' && (
  <input
    type="month"
    value={mitraSelectedMonth}
    onChange={(event) =>
      setMitraSelectedMonth(event.target.value)
    }
    className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
  />
)}

{mitraDateFilterType === 'CUSTOM' && (
  <>
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600">
        From Date
      </label>
      <input
        type="date"
        value={mitraDateFrom}
        max={mitraDateTo || undefined}
        onChange={(event) =>
          setMitraDateFrom(event.target.value)
        }
        className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
      />
    </div>

    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600">
        To Date
      </label>
      <input
        type="date"
        value={mitraDateTo}
        min={mitraDateFrom || undefined}
        onChange={(event) =>
          setMitraDateTo(event.target.value)
        }
        className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
      />
    </div>
  </>
)}

            <select
              value={mitraPrintingStatus}
              onChange={(event) =>
                setMitraPrintingStatus(
                  event.target.value,
                )
              }
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
            >
              <option value="">
                All Printing Status
              </option>
              <option value="UNPRINTED">
                Unprinted
              </option>
              <option value="PRINTED">
                Printed
              </option>
            </select>

            <select
  value={mitraPosterVerificationStatus}
  onChange={(event) =>
    setMitraPosterVerificationStatus(event.target.value)
  }
  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
>
  <option value="">All Poster Verification</option>
  <option value="NOT_ATTACHED">Not Attached</option>
  <option value="PENDING_VERIFICATION">
    Pending Verification
  </option>
  <option value="ATTACHED">Attached & Verified</option>
  <option value="REJECTED">Rejected</option>
</select>

            {canFilterByCreator && (
  <select
    value={mitraCreatedBy}
    onChange={(event) =>
      setMitraCreatedBy(
        event.target.value,
      )
    }
    className="w-full min-w-0 lg:w-[220px] lg:max-w-[220px] rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
  >
    <option value="">
      All Creators
    </option>

    {mitraCreators.map(
      (creator) => (
        <option
          key={creator.id}
          value={creator.id}
        >
          {creator.name}
          {creator.role
            ? ` — ${cleanLabel(
                creator.role,
              )}`
            : ''}
        </option>
      ),
    )}
  </select>
)}

<button
  type="button"
  onClick={() => {
    setMitraSearch('');
    setMitraStatus('');
    setMitraCreatedBy('');
    setMitraInterestStatus('');
    setMitraPrintingStatus('');
    setMitraPosterVerificationStatus('');
    setMitraDateFilterType('ALL');
    setMitraSelectedMonth(dayjs().format('YYYY-MM'));
    setMitraDateFrom('');
    setMitraDateTo('');
  }}
  className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
>
  Clear Filters
</button>

            <button
              type="button"
              onClick={() =>
                void exportSolarMitrasCsv('download')
              }
              disabled={filteredMitras.length === 0}
              className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↓ Download CSV
            </button>

            <button
              type="button"
              onClick={() =>
                void exportSolarMitrasCsv('share')
              }
              disabled={filteredMitras.length === 0}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↗ Share CSV
            </button>

            <button
              type="button"
              onClick={openCreateMitra}
              className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white"
            >
              + Add Mitra
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
  {[
  {
    label: 'Total Mitras',
    count: posterVerificationCounts.total,
    status: '',
    color: 'border-gray-200 bg-gray-50 text-gray-900',
  },
  {
    label: 'Poster Not Attached',
    count: posterVerificationCounts.notAttached,
    status: 'NOT_ATTACHED',
    color: 'border-gray-200 bg-gray-50 text-gray-800',
  },
  {
    label: 'Pending Poster Verification',
    count: posterVerificationCounts.pending,
    status: 'PENDING_VERIFICATION',
    color: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  {
    label: 'Attached & Verified',
    count: posterVerificationCounts.attached,
    status: 'ATTACHED',
    color: 'border-green-200 bg-green-50 text-green-800',
  },
  {
    label: 'Poster Rejected',
    count: posterVerificationCounts.rejected,
    status: 'REJECTED',
    color: 'border-red-200 bg-red-50 text-red-800',
  },
].map((summary) => (
    <button
  key={summary.label}
  type="button"
  onClick={() =>
    setMitraPosterVerificationStatus(summary.status)
  }
  aria-pressed={
    mitraPosterVerificationStatus === summary.status
  }
  className={`min-w-0 rounded-xl border p-4 text-left transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
    mitraPosterVerificationStatus === summary.status
      ? 'ring-2 ring-blue-500 ring-offset-2'
      : ''
  } ${summary.color}`}
>
      <p className="text-xs font-semibold">
        {summary.label}
      </p>

      <p className="mt-2 text-2xl font-black">
        {summary.count}
      </p>
        </button>
  ))}
</div>

{canFilterByCreator && mitraCreatedBy !== '' && (
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
    <div>
      <p className="text-sm font-bold text-gray-900">
        QR Poster Performance —{' '}
        {posterCreatorPerformance[0]?.name || 'Selected Creator'}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {posterVerificationCounts.attached} verified installations
        out of {posterVerificationCounts.total} registered Solar Mitras
      </p>
    </div>

    <div className="text-right">
      <p className="text-2xl font-black text-green-700">
        {posterVerificationCounts.total > 0
          ? `${(
              (posterVerificationCounts.attached /
                posterVerificationCounts.total) *
              100
            ).toFixed(1)}%`
          : '0.0%'}
      </p>

      <p className="text-xs font-medium text-gray-500">
        Verified Installation Rate
      </p>
    </div>
  </div>
)}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
  <div>
    <p className="text-sm font-semibold text-gray-600">
      Solar Mitra Results
    </p>

    <p className="mt-1 text-2xl font-black text-gray-900">
      {filteredMitras.length}
      <span className="ml-2 text-sm font-medium text-gray-500">
        of {mitras.length} Solar Mitras
      </span>
    </p>
  </div>

  <p className="text-xs font-medium text-gray-500">
    Count updates automatically with selected filters
  </p>
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

                    {canFilterByCreator && (
  <div>
    <p className="text-xs font-semibold text-gray-400">
      Created By
    </p>

    <p className="font-semibold text-gray-800">
      {item.createdByName ||
        '—'}
    </p>

    {item.createdByRole && (
      <p className="mt-0.5 text-xs text-gray-500">
        {cleanLabel(
          item.createdByRole,
        )}
      </p>
    )}

    {item.createdAt && (
      <p className="mt-0.5 text-xs text-gray-400">
        {formatDate(
          item.createdAt,
        )}
      </p>
    )}
  </div>
)}

                    

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

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
  {/* Calling Interest Verification */}
  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3">
    <p className="text-xs font-bold text-gray-700">
      📞 Calling Verification
    </p>

    <div className="mt-2">
      <StatusBadge
        value={item.interestStatus || 'PENDING'}
      />
    </div>

    <select
      value={item.interestStatus || 'PENDING'}
            disabled={
        (!isOwner && !isFranchiseHead) ||
        updatingMitraStatusId !== null
      }
      onChange={(event) =>
        updateMitraVerificationStatus(
          item,
          'interestStatus',
          event.target.value,
        )
      }
      className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    >
      <option value="PENDING" disabled>
        Pending Verification
      </option>
      <option value="INTERESTED">
        Interested
      </option>
      <option value="NOT_INTERESTED">
        Not Interested
      </option>
    </select>

    {item.interestUpdatedAt && (
      <p className="mt-2 text-xs text-gray-500">
        Updated by{' '}
        {item.interestUpdatedByName ||
          `User #${item.interestUpdatedBy || '—'}`}
        {' • '}
        {formatDate(item.interestUpdatedAt)}
      </p>
    )}
  </div>

  {/* QR Poster Printing */}
  <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-3">
    <p className="text-xs font-bold text-gray-700">
      🖨️ QR Poster Printing
    </p>

    <div className="mt-2">
      <StatusBadge
        value={item.printingStatus || 'UNPRINTED'}
      />
    </div>

    {isOwner || isFranchiseHead ? (
      <select
        value={item.printingStatus || 'UNPRINTED'}
        disabled={updatingMitraStatusId !== null}
        onChange={(event) =>
          updateMitraVerificationStatus(
            item,
            'printingStatus',
            event.target.value,
          )
        }
        className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="UNPRINTED">
          Unprinted
        </option>
        <option value="PRINTED">
          Printed
        </option>
      </select>
    ) : (
      <p className="mt-3 text-xs text-gray-500">
        Managed by Franchise Head
      </p>
    )}

    {item.printingUpdatedAt && (
      <p className="mt-2 text-xs text-gray-500">
        Updated by{' '}
        {item.printingUpdatedByName ||
          `User #${item.printingUpdatedBy || '—'}`}
        {' • '}
        {formatDate(item.printingUpdatedAt)}
      </p>
    )}
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
  onClick={() => setViewingBankMitra(item)}
  className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700"
>
  🏦 Bank Details
</button>

<button
  type="button"
  onClick={() => setViewingPosterMitra(item)}
  className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700"
>
  📷 Poster Photo
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

        <div className="flex flex-wrap items-center gap-2">
  <button
    type="button"
    onClick={() => {
      void exportSolarMeetingsCsv('download');
    }}
    disabled={filteredMeetings.length === 0}
    className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
  >
    ↓ Download CSV
  </button>

  <button
    type="button"
    onClick={() => {
      void exportSolarMeetingsCsv('share');
    }}
    disabled={filteredMeetings.length === 0}
    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
  >
    ↗ Share CSV
  </button>

  <button
    type="button"
    onClick={openNewMeetingModal}
    className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
  >
    + New Meeting / Visit
  </button>
</div>
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
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-black text-gray-900">
          Solar Mitra Referrals
        </h2>
        <p className="text-xs text-gray-500">
          {filteredReferrals.length} referral records matching the selected filters
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            void exportSolarReferralsCsv('download');
          }}
          disabled={filteredReferrals.length === 0}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ↓ Download CSV
        </button>

        <button
          type="button"
          onClick={() => {
            void exportSolarReferralsCsv('share');
          }}
          disabled={filteredReferrals.length === 0}
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ↗ Share CSV
        </button>
      </div>
    </div>

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

            <div className="relative min-w-0">
  <input
    type="text"
    value={
      showReferralMitraOptions
        ? referralMitraSearch
        : referralMitraId
          ? (
              mitras.find(
                (item) =>
                  Number(item.id) ===
                  Number(referralMitraId),
              )?.name || ''
            )
          : ''
    }
    onFocus={() => {
      setReferralMitraSearch('');
      setShowReferralMitraOptions(true);
    }}
    onChange={(event) => {
      setReferralMitraSearch(event.target.value);
      setShowReferralMitraOptions(true);
    }}
    placeholder="Search Solar Mitra name, shop or phone..."
    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm"
  />

  {referralMitraId && (
    <button
      type="button"
      onClick={() => {
        setReferralMitraId('');
        setReferralMitraSearch('');
        setShowReferralMitraOptions(false);
      }}
      className="absolute right-3 top-3 text-sm font-bold text-gray-500 hover:text-red-600"
      title="Clear selected Solar Mitra"
    >
      ✕
    </button>
  )}

  {showReferralMitraOptions && (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
      <button
        type="button"
        onClick={() => {
          setReferralMitraId('');
          setReferralMitraSearch('');
          setShowReferralMitraOptions(false);
        }}
        className="w-full border-b border-gray-100 px-3 py-2 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50"
      >
        All Solar Mitras
      </button>

      {mitras
        .filter((item) => {
          const search = referralMitraSearch
            .trim()
            .toLowerCase();

          return [
            item.name,
            item.businessName,
            item.primaryPhone,
          ].some((value) =>
            String(value || '')
              .toLowerCase()
              .includes(search),
          );
        })
        .map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setReferralMitraId(String(item.id));
              setReferralMitraSearch('');
              setShowReferralMitraOptions(false);
            }}
            className="w-full border-b border-gray-100 px-3 py-2 text-left hover:bg-gray-50"
          >
            <p className="text-sm font-semibold text-gray-900">
              {item.name}
            </p>

            {item.businessName && (
              <p className="text-xs text-gray-500">
                {item.businessName}
              </p>
            )}

            <p className="text-xs text-gray-400">
              {item.primaryPhone}
            </p>
          </button>
        ))}
    </div>
  )}
</div>

            <button
              type="button"
              onClick={openReferralModal}
              className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white"
            >
              + Add Referral
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-600">
      Referral Date Filter
    </label>
    <select
      value={referralDateFilterType}
      onChange={(event) =>
        setReferralDateFilterType(
          event.target.value as 'ALL' | 'MONTH' | 'CUSTOM',
        )
      }
      className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm"
    >
      <option value="ALL">All Dates</option>
      <option value="MONTH">Monthly</option>
      <option value="CUSTOM">Custom Date Range</option>
    </select>
  </div>

  {referralDateFilterType === 'MONTH' && (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600">
        Select Month
      </label>
      <input
        type="month"
        value={referralSelectedMonth}
        onChange={(event) =>
          setReferralSelectedMonth(event.target.value)
        }
        className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
      />
    </div>
  )}

  {referralDateFilterType === 'CUSTOM' && (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">
          From Date
        </label>
        <input
          type="date"
          value={referralDateFrom}
          max={referralDateTo || undefined}
          onChange={(event) =>
            setReferralDateFrom(event.target.value)
          }
          className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">
          To Date
        </label>
        <input
          type="date"
          value={referralDateTo}
          min={referralDateFrom || undefined}
          onChange={(event) =>
            setReferralDateTo(event.target.value)
          }
          className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
        />
      </div>
    </>
  )}

  <button
    type="button"
    onClick={() => {
      setReferralSearch('');
      setReferralStatus('');
      setReferralMitraId('');
      setReferralMitraSearch('');
setShowReferralMitraOptions(false);
      setReferralDateFilterType('ALL');
      setReferralSelectedMonth(dayjs().format('YYYY-MM'));
      setReferralDateFrom('');
      setReferralDateTo('');
    }}
    className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200"
  >
    Clear Filters
  </button>

  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
    <p className="text-xs font-semibold text-blue-700">
      Matching Referrals
    </p>
    <p className="text-xl font-black text-blue-900">
      {filteredReferrals.length}
      <span className="ml-2 text-xs font-medium text-blue-700">
        of {referrals.length}
      </span>
    </p>
  </div>
</div>

<div className="mt-5 grid gap-4 xl:grid-cols-2">
  {/* Creator-wise referral performance */}
  <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
      <h3 className="text-base font-bold text-gray-900">
        Creator-wise Referrals
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Referrals generated by Solar Mitras registered by each staff member.
      </p>
    </div>

    <div className="max-h-80 overflow-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="sticky top-0 bg-gray-100 text-xs text-gray-600">
          <tr>
            <th className="px-4 py-3">Creator</th>
            <th className="px-4 py-3 text-center">
              Mitras
            </th>
            <th className="px-4 py-3 text-right">
              Referrals
            </th>
          </tr>
        </thead>

        <tbody>
          {referralPerformance.creators.map((item, index) => (
            <tr
              key={`${item.creatorName}-${index}`}
              className="border-t border-gray-100"
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                {item.creatorName}
              </td>
              <td className="px-4 py-3 text-center">
                {item.mitraCount}
              </td>
              <td className="px-4 py-3 text-right font-bold text-blue-700">
                {item.referralCount}
              </td>
            </tr>
          ))}

          {referralPerformance.creators.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="px-4 py-8 text-center text-gray-500"
              >
                No referrals found for the selected filters.
              </td>
            </tr>
          )}
        </tbody>

        <tfoot className="sticky bottom-0 bg-blue-50 font-bold text-gray-900">
          <tr>
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3 text-center">
              {referralPerformance.creators.reduce(
                (sum, item) => sum + item.mitraCount,
                0,
              )}
            </td>
            <td className="px-4 py-3 text-right">
              {filteredReferrals.length}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  {/* Solar Mitra-wise referral performance */}
  <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
      <h3 className="text-base font-bold text-gray-900">
        Solar Mitra-wise Referrals
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Individual Solar Mitra referral counts for the selected period.
      </p>
    </div>

    <div className="max-h-80 overflow-auto">
      <table className="w-full min-w-[500px] text-left text-sm">
        <thead className="sticky top-0 bg-gray-100 text-xs text-gray-600">
          <tr>
            <th className="px-4 py-3">Solar Mitra</th>
            <th className="px-4 py-3">Created By</th>
            <th className="px-4 py-3 text-right">
              Referrals
            </th>
          </tr>
        </thead>

        <tbody>
          {referralPerformance.mitras.map((item, index) => (
            <tr
              key={`${item.mitraName}-${index}`}
              className="border-t border-gray-100"
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                {item.mitraName}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {item.creatorName}
              </td>
              <td className="px-4 py-3 text-right font-bold text-blue-700">
                {item.referralCount}
              </td>
            </tr>
          ))}

          {referralPerformance.mitras.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="px-4 py-8 text-center text-gray-500"
              >
                No referrals found for the selected filters.
              </td>
            </tr>
          )}
        </tbody>

        <tfoot className="sticky bottom-0 bg-blue-50 font-bold text-gray-900">
          <tr>
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3">
              {referralPerformance.mitras.length} Mitras
            </td>
            <td className="px-4 py-3 text-right">
              {filteredReferrals.length}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
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

                    {canManagePayoutPayments && (
  <div className="flex flex-wrap items-center gap-2">
    <button
      type="button"
      onClick={() =>
        openPayoutPaymentDetails(item)
      }
      disabled={loadingPayoutPaymentDetails}
      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
    >
      View Bank Details & QR
    </button>

    {item.status === 'ELIGIBLE' && (
      <button
        type="button"
        onClick={() =>
          openMarkPaid(item)
        }
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
      >
        Mark Paid
      </button>
    )}
  </div>
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

            {activeTab === 'CREATOR_PAYOUTS' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Solar Mitra Creator Payouts
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              One-time rewards for eligible Solar Mitra
              creators after QR poster verification approval.
              These are separate from referral payouts and
              Assistant payroll incentives.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: 'Eligible',
                  count: creatorPayouts.filter(
                    (item) => item.status === 'ELIGIBLE',
                  ).length,
                },
                {
                  label: 'Paid',
                  count: creatorPayouts.filter(
                    (item) => item.status === 'PAID',
                  ).length,
                },
                {
                  label: 'Cancelled',
                  count: creatorPayouts.filter(
                    (item) => item.status === 'CANCELLED',
                  ).length,
                },
              ].map((summary) => (
                <div
                  key={summary.label}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <p className="text-sm text-gray-500">
                    {summary.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {summary.count}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-900">
              Creator Payout Filters
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium">
                  Solar Mitra Creation Month
                </span>
                <input
                  type="month"
                  value={creatorPayoutCreationMonth}
                  onChange={(event) =>
                    setCreatorPayoutCreationMonth(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border p-3"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium">
                  Poster Approval Month
                </span>
                <input
                  type="month"
                  value={creatorPayoutApprovalMonth}
                  onChange={(event) =>
                    setCreatorPayoutApprovalMonth(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border p-3"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium">
                  Payment Status
                </span>
                <select
                  value={creatorPayoutStatus}
                  onChange={(event) =>
                    setCreatorPayoutStatus(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border p-3"
                >
                  <option value="">All Statuses</option>
                  <option value="ELIGIBLE">Eligible</option>
                  <option value="PAID">Paid</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium">
                  Search
                </span>
                <input
                  type="text"
                  placeholder="Mitra or creator name"
                  value={creatorPayoutSearch}
                  onChange={(event) =>
                    setCreatorPayoutSearch(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border p-3"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium">
                  Creator ID
                </span>
                <input
                  type="number"
                  min="1"
                  placeholder="Creator user ID"
                  value={creatorPayoutCreatorId}
                  onChange={(event) =>
                    setCreatorPayoutCreatorId(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border p-3"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium">
                  Solar Mitra ID
                </span>
                <input
                  type="number"
                  min="1"
                  placeholder="Solar Mitra ID"
                  value={creatorPayoutMitraId}
                  onChange={(event) =>
                    setCreatorPayoutMitraId(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border p-3"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreatorPayoutCreationMonth('');
                setCreatorPayoutApprovalMonth('');
                setCreatorPayoutStatus('');
                setCreatorPayoutSearch('');
                setCreatorPayoutCreatorId('');
                setCreatorPayoutMitraId('');
              }}
              className="mt-4 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold"
            >
              Clear Filters
            </button>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold">
              Creator Payout Records
            </h3>

            {creatorPayoutsLoading ? (
              <p className="text-sm text-gray-500">
                Loading Creator Payouts...
              </p>
            ) : creatorPayouts.length === 0 ? (
              <p className="text-sm text-gray-500">
                No Creator Payout records found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        'Payout ID',
                        'Solar Mitra',
                        'Creator',
                        'Creation Date',
                        'Poster Approval',
                        'Amount',
                        'Status',
                        'Paid Date',
                        'Payment Reference',
                        'Actions',
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-3 py-3 font-semibold"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {creatorPayouts.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-3">
                          {item.id}
                        </td>
                        <td className="px-3 py-3">
                          {item.solarMitraName}
                          <div className="text-xs text-gray-500">
                            ID: {item.solarMitraId}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {item.creatorName || '-'}
                          <div className="text-xs text-gray-500">
                            ID: {item.creatorId}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          {item.mitraCreatedAt
                            ? new Date(
                                item.mitraCreatedAt,
                              ).toLocaleDateString('en-IN')
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          {item.posterApprovedAt
                            ? new Date(
                                item.posterApprovedAt,
                              ).toLocaleDateString('en-IN')
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold">
                          ₹{Number(
                            item.payoutAmount,
                          ).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-3">
                          {item.status}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          {item.paidAt
                            ? new Date(
                                item.paidAt,
                              ).toLocaleDateString('en-IN')
                            : '-'}
                        </td>
                        <td className="px-3 py-3">
                          {item.paymentReference || '-'}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3">
  {item.status === 'ELIGIBLE' &&
  (userRoles.includes('OWNER') ||
    userRoles.includes('ACCOUNT_MANAGER')) ? (
    <button
      type="button"
      onClick={() => {
        setSelectedCreatorPayout(item);

        setCreatorPayoutPaidForm({
          paymentMode: '',
          paymentReference: '',
          paymentRemarks: '',
        });

        setShowCreatorPayoutPaidModal(true);
      }}
      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
    >
      Mark Paid
    </button>
  ) : (
    <span className="text-xs text-gray-400">
      {item.status === 'PAID'
        ? 'Payment completed'
        : item.status === 'CANCELLED'
          ? 'Cancelled'
          : 'View only'}
    </span>
  )}
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

                {userRoles.includes('OWNER') && (
            <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                Historical Creator Payout Reconciliation
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Preview previously approved Solar Mitras
                that do not yet have Creator Payout records.
                This preview does not create or pay anything.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="text-sm">
                  <span className="mb-1 block font-medium">
                    Solar Mitra Creation Month
                  </span>
                  <input
                    type="month"
                    value={creatorReconciliationCreationMonth}
                    onChange={(event) => {
                      setCreatorReconciliationCreationMonth(
                        event.target.value,
                      );
                      setCreatorReconciliationPreview(null);
                    }}
                    className="w-full rounded-xl border p-3"
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium">
                    Poster Approval Month
                  </span>
                  <input
                    type="month"
                    value={creatorReconciliationApprovalMonth}
                    onChange={(event) => {
                      setCreatorReconciliationApprovalMonth(
                        event.target.value,
                      );
                      setCreatorReconciliationPreview(null);
                    }}
                    className="w-full rounded-xl border p-3"
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium">
                    Creator ID (Optional)
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={creatorReconciliationCreatorId}
                    onChange={(event) => {
                      setCreatorReconciliationCreatorId(
                        event.target.value,
                      );
                      setCreatorReconciliationPreview(null);
                    }}
                    placeholder="Original creator ID"
                    className="w-full rounded-xl border p-3"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={creatorReconciliationLoading}
                  onClick={loadCreatorReconciliationPreview}
                  className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {creatorReconciliationLoading
                    ? 'Checking Eligibility...'
                    : 'Preview Eligible Payouts'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreatorReconciliationCreationMonth('');
                    setCreatorReconciliationApprovalMonth('');
                    setCreatorReconciliationCreatorId('');
                    setCreatorReconciliationPreview(null);
                  }}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold"
                >
                  Clear
                </button>
              </div>

              {creatorReconciliationPreview && (
                <div className="mt-5 space-y-4 border-t pt-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        label: 'Eligible',
                        value:
                          creatorReconciliationPreview.eligibleCount,
                      },
                      {
                        label: 'Excluded',
                        value:
                          creatorReconciliationPreview.excludedCount,
                      },
                      {
                        label: 'Configured Amount',
                        value: money(
                          creatorReconciliationPreview
                            .configuredPayoutAmount,
                        ),
                      },
                      {
                        label: 'Estimated Total',
                        value: money(
                          creatorReconciliationPreview
                            .estimatedTotalAmount,
                        ),
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <p className="text-xs text-gray-500">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xl font-bold text-gray-900">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {!creatorReconciliationPreview.canGenerate && (
                    <p className="text-sm text-amber-700">
                      Generation is unavailable when there are
                      no eligible records or the configured
                      Creator Payout amount is zero.
                    </p>
                  )}

                  {creatorReconciliationPreview.canGenerate && (
  <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
    <p className="text-sm font-semibold text-gray-900">
      Ready for historical reconciliation
    </p>

    <p className="mt-2 text-sm text-gray-700">
      This will create{' '}
      <strong>
        {creatorReconciliationPreview.eligibleCount}
      </strong>{' '}
      eligible Creator Payout records, with an estimated
      total of{' '}
      <strong>
        {money(
          creatorReconciliationPreview.estimatedTotalAmount,
        )}
      </strong>.
    </p>

    <p className="mt-2 text-xs text-gray-600">
      No money will be transferred automatically.
      The records will be created with ELIGIBLE status.
    </p>

    <button
      type="button"
      disabled={
        creatorReconciliationGenerating ||
        creatorReconciliationLoading
      }
      onClick={generateCreatorReconciliation}
      className="mt-4 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {creatorReconciliationGenerating
        ? 'Generating Payouts...'
        : 'Generate Historical Payouts'}
    </button>
  </div>
)}

                  <div className="max-h-80 overflow-auto rounded-xl border border-gray-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr>
                          {[
                            'Solar Mitra ID',
                            'Solar Mitra',
                            'Creator',
                            'Poster Approved',
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="whitespace-nowrap px-3 py-3"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {creatorReconciliationPreview.records.map(
                          (item) => (
                            <tr key={item.solarMitraId}>
                              <td className="px-3 py-3">
                                {item.solarMitraId}
                              </td>
                              <td className="px-3 py-3">
                                {item.solarMitraName}
                              </td>
                              <td className="px-3 py-3">
                                {item.creatorName || '-'}
                                <div className="text-xs text-gray-500">
                                  ID: {item.creatorId}
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3">
                                {item.posterVerifiedAt
                                  ? new Date(
                                      item.posterVerifiedAt,
                                    ).toLocaleDateString('en-IN')
                                  : '-'}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>

                    {!creatorReconciliationPreview.records.length && (
                      <p className="p-4 text-sm text-gray-500">
                        No eligible historical Creator Payouts
                        found for these filters.
                      </p>
                    )}
                  </div>
                </div>
              )}
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
                Creator Payout Amount (₹)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={settingsForm.creatorPayoutAmount}
                disabled={!isOwner}
                onChange={(event) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    creatorPayoutAmount: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 disabled:bg-gray-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                One-time payout to the staff member who originally
                registered the Solar Mitra, eligible only after QR
                poster verification is approved. Solar Mitra
                Assistants are excluded because their incentives
                are handled through payroll. Creator payouts are
                separate from referral and project payouts.
              </p>
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
                Settings are read-only.
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

      {viewingPayoutPaymentDetails && (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-900">
            Payout Bank & Payment Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {viewingPayoutPaymentDetails.solarMitraName}
          </p>

          {viewingPayoutPaymentDetails.solarMitraBusinessName && (
            <p className="text-xs text-gray-500">
              {viewingPayoutPaymentDetails.solarMitraBusinessName}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setViewingPayoutPaymentDetails(null)}
          className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700"
        >
          ✕ Close
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold text-emerald-700">
          Payout Amount
        </p>

        <p className="mt-1 text-2xl font-black text-emerald-900">
          {money(viewingPayoutPaymentDetails.payoutAmount)}
        </p>

        <p className="mt-1 text-xs font-semibold text-emerald-700">
          Status: {viewingPayoutPaymentDetails.payoutStatus}
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500">
            Bank Account Number
          </p>

          <p className="mt-2 break-all text-sm font-bold text-gray-900">
            {viewingPayoutPaymentDetails.bankAccountNumber ||
              'Not provided'}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500">
            IFSC Code
          </p>

          <p className="mt-2 text-sm font-bold text-gray-900">
            {viewingPayoutPaymentDetails.bankIfscCode ||
              'Not provided'}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-bold text-gray-900">
          UPI Payment QR
        </h3>

        {viewingPayoutPaymentDetails.paymentQrCodeUrl ? (
          <a
            href={viewingPayoutPaymentDetails.paymentQrCodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block"
          >
            <img
              src={viewingPayoutPaymentDetails.paymentQrCodeUrl}
              alt="Solar Mitra UPI payment QR"
              className="h-56 w-56 rounded-xl border border-gray-200 bg-white object-contain p-2"
            />
          </a>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            No UPI payment QR uploaded yet.
          </p>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
        Verify the recipient's bank or UPI details before making
        payment. After completing the transfer, use Mark Paid
        to record the transaction in CRM.
      </div>

      {canManagePayoutPayments &&
        viewingPayoutPaymentDetails.payoutStatus === 'ELIGIBLE' && (
          <button
            type="button"
            onClick={() => {
              const payout = payouts.find(
                (item) =>
                  item.id === viewingPayoutPaymentDetails.payoutId,
              );

              if (!payout) {
                alert('Payout record not found. Please refresh.');
                return;
              }

              setViewingPayoutPaymentDetails(null);
              openMarkPaid(payout);
            }}
            className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Mark Payout Paid
          </button>
        )}
    </div>
  </div>
)}

      {viewingBankMitra && (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-900">
            Bank & Payment Details
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {viewingBankMitra.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewingBankMitra(null)}
          className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700"
        >
          ✕ Close
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500">
            Bank Account Number
          </p>
          <p className="mt-2 break-all text-sm font-bold text-gray-900">
            {viewingBankMitra.bankAccountNumber || 'Not provided'}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500">
            IFSC Code
          </p>
          <p className="mt-2 text-sm font-bold text-gray-900">
            {viewingBankMitra.bankIfscCode || 'Not provided'}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-bold text-gray-900">
          UPI Payment QR
        </h3>

        {viewingBankMitra.paymentQrCodeUrl ? (
          <a
            href={viewingBankMitra.paymentQrCodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block"
          >
            <img
              src={viewingBankMitra.paymentQrCodeUrl}
              alt="UPI payment QR"
              className="h-56 w-56 rounded-xl border border-gray-200 bg-white object-contain p-2"
            />
          </a>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            No UPI payment QR uploaded yet.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        These details can only be updated by the Solar Mitra
        through their own login.
      </p>
    </div>
  </div>
)}

{viewingPosterMitra && (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-900">
            QR Poster Installation Photo
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {viewingPosterMitra.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewingPosterMitra(null)}
          className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700"
        >
          ✕ Close
        </button>
      </div>

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          QR Poster Attachment Verification
        </p>

        <div className="mt-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
              viewingPosterMitra.posterVerificationStatus === 'ATTACHED'
                ? 'bg-green-100 text-green-800'
                : viewingPosterMitra.posterVerificationStatus === 'REJECTED'
                  ? 'bg-red-100 text-red-800'
                  : viewingPosterMitra.posterVerificationStatus ===
                      'PENDING_VERIFICATION'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-200 text-gray-700'
            }`}
          >
            {viewingPosterMitra.posterVerificationStatus === 'ATTACHED'
              ? '✓ Attached & Verified'
              : viewingPosterMitra.posterVerificationStatus === 'REJECTED'
                ? '✕ Proof Rejected'
                : viewingPosterMitra.posterVerificationStatus ===
                    'PENDING_VERIFICATION'
                  ? '⏳ Pending Verification'
                  : 'Not Attached'}
          </span>
        </div>

        {viewingPosterMitra.posterVerifiedAt && (
          <p className="mt-3 text-xs text-gray-600">
            Reviewed by:{' '}
            <span className="font-semibold">
              {viewingPosterMitra.posterVerifiedByName || 'Unknown'}
            </span>
            {' · '}
            {new Date(
              viewingPosterMitra.posterVerifiedAt,
            ).toLocaleString('en-IN')}
          </p>
        )}

        {viewingPosterMitra.posterVerificationRemarks && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
            <span className="font-semibold">Review remarks:</span>{' '}
            {viewingPosterMitra.posterVerificationRemarks}
          </p>
        )}
      </div>

      {viewingPosterMitra.qrPosterInstallationPhotoUrl ||
viewingPosterMitra.qrPosterInstallationPhotoUrl2 ? (
  <div className="mt-5 grid gap-4 sm:grid-cols-2">
    {(
      [
        {
          label: 'Poster Photo',
          url: viewingPosterMitra.qrPosterInstallationPhotoUrl,
        },
        {
          label: 'QR Photo',
          url: viewingPosterMitra.qrPosterInstallationPhotoUrl2,
        },
      ] as const
    ).map((photo) => (
      <div
        key={photo.label}
        className="rounded-xl border border-gray-200 p-3"
      >
        <p className="mb-3 text-sm font-bold text-gray-800">
          {photo.label}
        </p>

        {photo.url ? (
          <a
            href={photo.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={photo.url}
              alt={photo.label}
              className="h-52 w-full rounded-lg bg-gray-50 object-contain"
            />
          </a>
        ) : (
          <div className="flex h-52 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
            Not uploaded
          </div>
        )}
      </div>
    ))}
  </div>
) : (
  <div className="mt-5 rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
    No poster installation photos uploaded yet.
  </div>
)}

{(isOwner || isFranchiseHead) &&
  (viewingPosterMitra.qrPosterInstallationPhotoUrl ||
    viewingPosterMitra.qrPosterInstallationPhotoUrl2) &&
  viewingPosterMitra.posterVerificationStatus !== 'ATTACHED' && (
    <div className="mt-5 border-t border-gray-200 pt-5">
      <h3 className="text-sm font-black text-gray-900">
        Review QR Poster Installation
      </h3>

      <p className="mt-1 text-xs text-gray-500">
        Verify that the uploaded photos clearly show the QR
        poster attached at the Solar Mitra shop.
      </p>

      {viewingPosterMitra.posterVerificationStatus ===
        'REJECTED' && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
          This proof was previously rejected. Review the
          current photos before approving.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={updatingPosterVerification}
          onClick={() => submitPosterVerification('ATTACHED')}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {updatingPosterVerification
            ? 'Processing...'
            : '✓ Approve — Attached'}
        </button>

        <button
          type="button"
          disabled={updatingPosterVerification}
          onClick={() =>
            setShowPosterRejectionForm((previous) => !previous)
          }
          className="rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50"
        >
          ✕ Reject Proof
        </button>
      </div>

      {showPosterRejectionForm && (
        <div className="mt-4 space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <label
            htmlFor="poster-rejection-remarks"
            className="block text-sm font-semibold text-gray-800"
          >
            Rejection remarks (required)
          </label>

          <textarea
            id="poster-rejection-remarks"
            value={posterRejectionRemarks}
            onChange={(event) =>
              setPosterRejectionRemarks(event.target.value)
            }
            rows={3}
            placeholder="Explain why the installation proof is rejected..."
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none focus:border-red-500"
          />

          <button
            type="button"
            disabled={
              updatingPosterVerification ||
              !posterRejectionRemarks.trim()
            }
            onClick={() => submitPosterVerification('REJECTED')}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {updatingPosterVerification
              ? 'Submitting...'
              : 'Confirm Rejection'}
          </button>
        </div>
      )}
    </div>
  )}
    </div>
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

  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
  <label className="flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
    📷 Take Photo

    <input
      type="file"
      accept="image/*"
      capture="environment"
      disabled={uploadingShopPhoto}
      className="hidden"
      onChange={async (event) => {
        const file = event.target.files?.[0];

        if (file) {
          await uploadShopPhoto(file);
        }

        event.target.value = '';
      }}
    />
  </label>

  <label className="flex cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
    🖼️ Upload from Gallery

    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      disabled={uploadingShopPhoto}
      className="hidden"
      onChange={async (event) => {
        const file = event.target.files?.[0];

        if (file) {
          await uploadShopPhoto(file);
        }

        event.target.value = '';
      }}
    />
  </label>
</div>

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

              {editingMitra && (
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <h3 className="text-sm font-black text-gray-900">
      Solar Mitra Payment Details
    </h3>

    <p className="mt-1 text-xs text-gray-500">
      These details are managed by the Solar Mitra
      through their own login. CRM staff can view
      them but cannot edit them.
    </p>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-xs font-semibold text-gray-500">
          Bank Account Number
        </p>

        <p className="mt-1 break-all text-sm font-bold text-gray-900">
          {editingMitra.bankAccountNumber || 'Not provided'}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500">
          IFSC Code
        </p>

        <p className="mt-1 text-sm font-bold text-gray-900">
          {editingMitra.bankIfscCode || 'Not provided'}
        </p>
      </div>
    </div>

    <div className="mt-5 border-t border-gray-200 pt-4">
      <p className="text-xs font-semibold text-gray-500">
        UPI Payment QR
      </p>

      {editingMitra.paymentQrCodeUrl ? (
        <a
          href={editingMitra.paymentQrCodeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block"
        >
          <img
            src={editingMitra.paymentQrCodeUrl}
            alt="Solar Mitra UPI Payment QR"
            className="h-48 w-48 rounded-xl border border-gray-200 bg-white object-contain p-2"
          />
        </a>
      ) : (
        <p className="mt-2 text-sm text-gray-500">
          No payment QR uploaded yet.
        </p>
      )}
    </div>
  </div>
)}

              {editingMitra && (
  <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
    <h3 className="text-sm font-black text-gray-900">
      QR Poster Installation Photos
    </h3>

    <p className="mt-1 text-xs text-gray-500">
      Upload a photo showing the Solar Mitra referral
      QR poster installed at the shop or location.
      This is separate from the UPI payment QR.
    </p>

<h4 className="mb-2 text-sm font-bold text-gray-800">
  Poster Photo
</h4>
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">
        📷 Take Photo

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          disabled={uploadingPosterPhoto}
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];

            if (file) {
              await uploadPosterInstallationPhoto(file, 1);
            }

            event.target.value = '';
          }}
        />
      </label>

      <label className="flex cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700">
        🖼️ Upload from Gallery

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploadingPosterPhoto}
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];

            if (file) {
              await uploadPosterInstallationPhoto(file, 1);
            }

            event.target.value = '';
          }}
        />
      </label>
    </div>

    

    {uploadingPosterPhoto && (
      <p className="mt-3 text-xs font-semibold text-blue-600">
        Uploading poster installation photo...
      </p>
    )}

    {mitraForm.qrPosterInstallationPhotoUrl && (
      <div className="mt-4">
        <a
          href={mitraForm.qrPosterInstallationPhotoUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={mitraForm.qrPosterInstallationPhotoUrl}
            alt="Solar Mitra QR poster installation"
            className="h-48 w-full max-w-sm rounded-xl border border-gray-200 bg-white object-contain"
          />
        </a>

        <p className="mt-2 text-xs text-gray-500">
          Upload another photo to replace the existing one.
        </p>
      </div>
    )}

    <div className="mt-6 border-t border-gray-200 pt-5">
  <h4 className="text-sm font-bold text-gray-800">
    QR Photo
  </h4>

  <p className="mt-1 text-xs text-gray-500">
    Upload an additional poster installation photo.
    This photo is optional and independent of Photo 1.
  </p>

  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
    <label className="flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">
      📷 Take Photo

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        disabled={uploadingPosterPhoto}
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];

          if (file) {
            await uploadPosterInstallationPhoto(file, 2);
          }

          event.target.value = '';
        }}
      />
    </label>

    <label className="flex cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700">
      🖼️ Upload from Gallery

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploadingPosterPhoto}
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];

          if (file) {
            await uploadPosterInstallationPhoto(file, 2);
          }

          event.target.value = '';
        }}
      />
    </label>
  </div>

  {mitraForm.qrPosterInstallationPhotoUrl2 && (
    <div className="mt-4">
      <a
        href={mitraForm.qrPosterInstallationPhotoUrl2}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={mitraForm.qrPosterInstallationPhotoUrl2}
          alt="Solar Mitra poster installation photo 2"
          className="h-48 w-full max-w-sm rounded-xl border border-gray-200 bg-white object-contain"
        />
      </a>

      <p className="mt-2 text-xs text-gray-500">
        Upload another photo to replace Photo 2.
      </p>
    </div>
  )}
</div>
  </div>
)}

              <div>
                <h3 className="mb-3 font-black text-gray-900">
                  Management
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {canAssignFranchiseManager && (
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
       )}

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

                         {(!userRoles.includes('SOLAR_MITRA_ASSISTANT') ||
  isOwner ||
  isFranchiseHead) && (
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
        value={mitraForm.payoutAmountOverride}
        onChange={(value) =>
          setMitraForm((prev: any) => ({
            ...prev,
            payoutAmountOverride: value,
          }))
        }
      />

      <FormField
        label="Required Project Payment Override (%)"
        type="number"
        value={mitraForm.requiredPaymentPercentageOverride}
        onChange={(value) =>
          setMitraForm((prev: any) => ({
            ...prev,
            requiredPaymentPercentageOverride: value,
          }))
        }
      />
    </div>
  </div>
)}

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

              {showCreatorPayoutPaidModal &&
        selectedCreatorPayout && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-gray-200 p-5">
                <h2 className="text-xl font-black text-gray-900">
                  Mark Creator Payout as Paid
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Solar Mitra:{' '}
                  <span className="font-semibold">
                    {selectedCreatorPayout.solarMitraName}
                  </span>
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Creator:{' '}
                  <span className="font-semibold">
                    {selectedCreatorPayout.creatorName || '-'}
                  </span>
                </p>

                <p className="mt-2 text-lg font-bold text-emerald-700">
                  {money(selectedCreatorPayout.payoutAmount)}
                </p>
              </div>

              <form
                onSubmit={markCreatorPayoutPaid}
                className="space-y-4 p-5"
              >
                <FormField
                  label="Payment Mode"
                  value={creatorPayoutPaidForm.paymentMode}
                  onChange={(value) =>
                    setCreatorPayoutPaidForm((prev) => ({
                      ...prev,
                      paymentMode: value,
                    }))
                  }
                />

                <FormField
                  label="Transaction Reference"
                  value={creatorPayoutPaidForm.paymentReference}
                  onChange={(value) =>
                    setCreatorPayoutPaidForm((prev) => ({
                      ...prev,
                      paymentReference: value,
                    }))
                  }
                />

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">
                    Payment Remarks (Optional)
                  </label>

                  <textarea
                    rows={3}
                    value={creatorPayoutPaidForm.paymentRemarks}
                    onChange={(event) =>
                      setCreatorPayoutPaidForm((prev) => ({
                        ...prev,
                        paymentRemarks: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
                    placeholder="Additional payment details"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Confirm only after the payment has actually
                  been transferred. This action records the
                  payment in CRM; it does not transfer money.
                </p>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    disabled={savingCreatorPayoutPayment}
                    onClick={() => {
                      setShowCreatorPayoutPaidModal(false);
                      setSelectedCreatorPayout(null);
                    }}
                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      savingCreatorPayoutPayment ||
                      !creatorPayoutPaidForm.paymentMode.trim() ||
                      !creatorPayoutPaidForm.paymentReference.trim()
                    }
                    className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingCreatorPayoutPayment
                      ? 'Saving Payment...'
                      : 'Confirm Payment'}
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