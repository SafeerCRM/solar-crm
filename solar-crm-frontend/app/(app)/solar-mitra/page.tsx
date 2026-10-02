'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import { getAuthHeaders } from '@/lib/authHeaders';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Tab =
  | 'OVERVIEW'
  | 'MITRAS'
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

  const downloadQr = () => {
    if (!qrMitra || !qrDataUrl) {
      return;
    }

    const link =
      document.createElement('a');

    link.href = qrDataUrl;
    link.download =
      `solar-mitra-${qrMitra.id}-qr.png`;

    document.body.appendChild(link);
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
                        Portal Access
                      </p>
                      <p className="font-semibold text-gray-800">
                        {item.portalPassword
                          ? 'Enabled'
                          : 'Password not set'}
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
                  Referral partner profile and portal access
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
                    label="Portal Password"
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
                    <FormField
                      label="Shop Photo URL"
                      value={
                        mitraForm.shopPhotoUrl
                      }
                      onChange={(value) =>
                        setMitraForm(
                          (prev: any) => ({
                            ...prev,
                            shopPhotoUrl:
                              value,
                          }),
                        )
                      }
                    />
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
                  disabled={saving}
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
                Download QR
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