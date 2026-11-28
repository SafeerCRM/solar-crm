'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type Money = string | number;

type IncentiveCategory =
  | 'NETWORK'
  | 'CREATOR'
  | 'PROJECT';

type SettlementPreview = {
  payoutId: number;
  projectId?: number | null;
  beneficiaryUserId: number;
  beneficiaryName?: string | null;

  grossAmount: Money;
  outstandingRecovery: Money;
  recoveryDeductedAmount: Money;
  netPayableAmount: Money;
  remainingRecovery: Money;

  requiresExternalPayment: boolean;
  previewedAt: string;
};

type Props = {
  category: IncentiveCategory;
  payoutId: number;
  beneficiaryName: string;
  onClose: () => void;
  onSettled: () => void;
};

const CATEGORY_CONFIG = {
  NETWORK: {
    label: 'Network Incentive',
    path: 'network/payouts',
  },

  CREATOR: {
    label: 'Creator Incentive',
    path: 'creator-payouts',
  },

  PROJECT: {
    label: 'Direct Project Incentive',
    path: 'payouts',
  },
};

function formatMoney(value?: Money | null) {
  return Number(value || 0).toLocaleString(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

function getErrorMessage(
  error: any,
  fallback: string,
) {
  const message =
    error?.response?.data?.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return fallback;
}

export default function IncentiveSettlementModal({
  category,
  payoutId,
  beneficiaryName,
  onClose,
  onSettled,
}: Props) {
  const config = CATEGORY_CONFIG[category];

  const endpoint =
    `${API_BASE_URL}/solar-mitra/${config.path}/${payoutId}`;

  const [preview, setPreview] =
    useState<SettlementPreview | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState('');

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [paymentMode, setPaymentMode] =
    useState('');

  const [paymentReference, setPaymentReference] =
    useState('');

  const [paymentRemarks, setPaymentRemarks] =
    useState('');

  const [confirmed, setConfirmed] =
    useState(false);

  const [requiresRefresh, setRequiresRefresh] =
    useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPreview = async () => {
      setLoading(true);
      setError('');
      setPreview(null);
      setConfirmed(false);
      setRequiresRefresh(false);

      try {
        const response =
          await axios.get<SettlementPreview>(
            `${endpoint}/settlement-preview`,
            {
              headers: getAuthHeaders(),
              signal: controller.signal,
            },
          );

        if (!controller.signal.aborted) {
          setPreview(response.data);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setError(
            getErrorMessage(
              err,
              'Unable to load settlement preview.',
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => controller.abort();
  }, [endpoint, refreshKey]);

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, []);

  const refreshPreview = () => {
    if (submitting) return;

    setConfirmed(false);

    setRefreshKey(
      (previous) => previous + 1,
    );
  };

  const requiresPayment =
    Number(preview?.netPayableAmount || 0) > 0;

  const canSubmit =
    !!preview &&
    !loading &&
    !submitting &&
    !requiresRefresh &&
    confirmed &&
    (
      !requiresPayment ||
      (
        paymentMode.trim() !== '' &&
        paymentReference.trim() !== ''
      )
    );

  const submitSettlement = async () => {
    if (!preview || !canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      await axios.patch(
        `${endpoint}/paid`,
        {
          expectedNetPayableAmount:
            Number(
              preview.netPayableAmount,
            ).toFixed(2),

          paymentMode:
            requiresPayment
              ? paymentMode.trim()
              : '',

          paymentReference:
            requiresPayment
              ? paymentReference.trim()
              : '',

          paymentRemarks:
            paymentRemarks.trim(),
        },
        {
          headers: getAuthHeaders(),
        },
      );
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          'Unable to confirm settlement. Verify the payout status before attempting again.',
        ),
      );

      setConfirmed(false);
      setRequiresRefresh(true);
      setSubmitting(false);

      return;
    }

    setSubmitting(false);

    onSettled();
  };

  const inputClass =
    'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 md:p-5">

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="incentive-settlement-title"
        className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >

        {/* Header */}

        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-200 bg-white p-5">

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
              {config.label}
            </p>

            <h2
              id="incentive-settlement-title"
              className="mt-1 text-xl font-black text-gray-900"
            >
              Settlement Confirmation
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Payout #{payoutId}
            </p>

          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            aria-label="Close settlement modal"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-lg font-bold text-gray-600 disabled:opacity-40"
          >
            ×
          </button>

        </div>

        <div className="space-y-4 p-5">

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4"
            >

              <p className="text-sm font-semibold text-red-800">
                {error}
              </p>

              {requiresRefresh && (
                <p className="mt-2 text-xs text-red-700">
                  If an external payment has already
                  been made, verify its transaction
                  reference and the CRM payout status.
                  Do not make another payment.
                </p>
              )}

            </div>
          )}

          {loading ? (

            <div className="py-10 text-center text-sm font-semibold text-gray-500">
              Calculating settlement...
            </div>

          ) : !preview ? (

            <button
              type="button"
              onClick={refreshPreview}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700"
            >
              Retry Settlement Preview
            </button>

          ) : (

            <>

              {/* Beneficiary */}

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

                <p className="text-xs font-semibold text-gray-500">
                  Beneficiary
                </p>

                <p className="mt-1 text-lg font-black text-gray-900">
                  {preview.beneficiaryName ||
                    beneficiaryName}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  User #{preview.beneficiaryUserId}

                  {preview.projectId
                    ? ` · Project #${preview.projectId}`
                    : ''}
                </p>

              </div>

              {/* Financial calculation */}

              <div className="space-y-3 rounded-xl border border-gray-200 p-4">

                <div className="flex justify-between gap-3 text-sm">

                  <span className="font-semibold text-gray-600">
                    Gross Incentive
                  </span>

                  <span className="font-bold text-gray-900">
                    {formatMoney(
                      preview.grossAmount,
                    )}
                  </span>

                </div>

                <div className="flex justify-between gap-3 text-sm">

                  <span className="font-semibold text-gray-600">
                    Outstanding Recovery
                  </span>

                  <span className="font-bold text-red-700">
                    {formatMoney(
                      preview.outstandingRecovery,
                    )}
                  </span>

                </div>

                <div className="flex justify-between gap-3 text-sm">

                  <span className="font-semibold text-gray-600">
                    Recovery Deduction
                  </span>

                  <span className="font-bold text-orange-700">
                    − {formatMoney(
                      preview.recoveryDeductedAmount,
                    )}
                  </span>

                </div>

                <div className="border-t border-gray-200 pt-3">

                  <p className="text-sm font-semibold text-green-700">
                    Net Payable Amount
                  </p>

                  <p className="mt-1 text-3xl font-black text-green-800">
                    {formatMoney(
                      preview.netPayableAmount,
                    )}
                  </p>

                </div>

                <div className="flex justify-between gap-3 border-t border-gray-200 pt-3 text-xs">

                  <span className="font-semibold text-gray-500">
                    Remaining Recovery
                  </span>

                  <span className="font-bold text-gray-700">
                    {formatMoney(
                      preview.remainingRecovery,
                    )}
                  </span>

                </div>

              </div>

              {requiresPayment ? (

                <>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                    This action records an external
                    payment. It does not transfer money
                    through a bank or payment gateway.
                    Confirm only after verifying the
                    actual transaction.
                  </div>

                  <label className="block space-y-1">

                    <span className="text-sm font-bold text-gray-700">
                      Payment Mode *
                    </span>

                    <select
                      value={paymentMode}
                      disabled={submitting}
                      onChange={(event) => {
                        setPaymentMode(
                          event.target.value,
                        );
                        setConfirmed(false);
                      }}
                      className={inputClass}
                    >
                      <option value="">
                        Select Payment Mode
                      </option>

                      <option value="BANK_TRANSFER">
                        Bank Transfer
                      </option>

                      <option value="UPI">
                        UPI
                      </option>

                      <option value="CASH">
                        Cash
                      </option>

                      <option value="CHEQUE">
                        Cheque
                      </option>

                      <option value="OTHER">
                        Other
                      </option>

                    </select>

                  </label>

                  <label className="block space-y-1">

                    <span className="text-sm font-bold text-gray-700">
                      Payment Reference *
                    </span>

                    <input
                      type="text"
                      value={paymentReference}
                      disabled={submitting}
                      onChange={(event) => {
                        setPaymentReference(
                          event.target.value,
                        );
                        setConfirmed(false);
                      }}
                      placeholder="UTR, transaction ID or receipt number"
                      className={inputClass}
                    />

                  </label>

                </>

              ) : (

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                  <p className="text-sm font-black text-blue-900">
                    Recovery Adjustment Only
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-blue-800">
                    No external payment is required.
                    The entire incentive will be
                    adjusted against outstanding
                    recovery.
                  </p>

                </div>

              )}

              <label className="block space-y-1">

                <span className="text-sm font-bold text-gray-700">
                  Remarks
                </span>

                <textarea
                  rows={3}
                  value={paymentRemarks}
                  disabled={submitting}
                  onChange={(event) =>
                    setPaymentRemarks(
                      event.target.value,
                    )
                  }
                  placeholder="Optional settlement remarks"
                  className={inputClass}
                />

              </label>

              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">

                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={
                    submitting ||
                    requiresRefresh
                  }
                  onChange={(event) =>
                    setConfirmed(
                      event.target.checked,
                    )
                  }
                  className="mt-0.5 h-5 w-5 shrink-0 accent-green-700"
                />

                <span className="text-sm font-semibold leading-relaxed text-gray-700">

                  {requiresPayment
                    ? `I confirm that ${formatMoney(
                        preview.netPayableAmount,
                      )} has been paid to the correct beneficiary and the payment reference is accurate.`
                    : 'I confirm that this incentive should be fully adjusted against outstanding recovery.'}

                </span>

              </label>

              <p className="text-xs leading-relaxed text-gray-500">
                The preview does not reserve this
                amount. The server will recalculate
                recovery deductions before confirming
                settlement.
              </p>

              <button
                type="button"
                disabled={submitting}
                onClick={refreshPreview}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 disabled:opacity-50"
              >
                Refresh Settlement Preview
              </button>

            </>

          )}

        </div>

        {/* Footer */}

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-white p-4">

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 disabled:opacity-50"
          >
            Close
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submitSettlement}
            className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-40"
          >

            {submitting
              ? 'Confirming...'
              : requiresPayment
                ? 'Confirm & Mark Paid'
                : 'Confirm Recovery Adjustment'}

          </button>

        </div>

      </div>

    </div>
  );
}