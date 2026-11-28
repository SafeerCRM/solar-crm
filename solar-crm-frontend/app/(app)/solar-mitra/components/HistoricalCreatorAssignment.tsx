'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type MissingCreatorMitra = {
  id: number;
  name: string;
  businessName: string;
  primaryPhone: string;
  city: string;
  area: string;
  status: string;
  approvalStatus: string;
  posterVerificationStatus: string;
  createdAt: string;
};

type CreatorOption = {
  id: number;
  name: string;
  roles: string[];
  solarMitraId: number | null;
  businessName: string | null;
  city: string | null;
};

export default function HistoricalCreatorAssignment({
  onChanged,
  refreshKey = 0,
}: {
  onChanged: () => void;
  refreshKey?: number;
}) {
  const [mitras, setMitras] =
    useState<MissingCreatorMitra[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [selectedMitra, setSelectedMitra] =
    useState<MissingCreatorMitra | null>(null);

  const [search, setSearch] =
    useState('');

  const [creatorOptions, setCreatorOptions] =
    useState<CreatorOption[]>([]);

  const [selectedCreator, setSelectedCreator] =
    useState<CreatorOption | null>(null);

  const [searching, setSearching] =
    useState(false);

  const [searchError, setSearchError] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadMissingCreators = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(
          `${API_BASE_URL}/solar-mitra/network/mitras/missing-creators`,
          {
            headers: getAuthHeaders(),
            signal: controller.signal,
          },
        );

        if (!controller.signal.aborted) {
          setMitras(response.data?.data || []);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setError(
            typeof err?.response?.data?.message === 'string'
              ? err.response.data.message
              : 'Unable to load missing creators.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadMissingCreators();

    return () => controller.abort();
  }, [refreshKey, reloadKey]);

  useEffect(() => {
    const term = search.trim();

    setCreatorOptions([]);
    setSearchError('');

    if (!selectedMitra || term.length < 2) {
      setSearching(false);
      return;
    }

    const controller = new AbortController();

    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/solar-mitra/network/mitras/creator-options`,
          {
            headers: getAuthHeaders(),
            params: {
              search: term,
            },
            signal: controller.signal,
          },
        );

        if (!controller.signal.aborted) {
          setCreatorOptions(
            response.data?.data || [],
          );
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setSearchError(
            typeof err?.response?.data?.message === 'string'
              ? err.response.data.message
              : 'Unable to search creators.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, selectedMitra]);

  const openAssignment = (
    mitra: MissingCreatorMitra,
  ) => {
    setSelectedMitra(mitra);
    setSelectedCreator(null);
    setSearch('');
    setCreatorOptions([]);
    setError('');
    setSuccess('');
    setSearchError('');
  };

  const closeAssignment = () => {
    if (saving) return;

    setSelectedMitra(null);
    setSelectedCreator(null);
    setSearch('');
    setCreatorOptions([]);
    setSearchError('');
    setError('');
  };

  const assignCreator = async () => {
    if (
      !selectedMitra ||
      !selectedCreator ||
      saving
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently assign ${selectedCreator.name} ` +
      `as the creator of ${selectedMitra.name}?\n\n` +
      `This assignment cannot be changed later.`,
    );

    if (!confirmed) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.patch(
        `${API_BASE_URL}/solar-mitra/network/mitras/${selectedMitra.id}/assign-creator`,
        {
          creatorUserId: selectedCreator.id,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setSuccess(
        `${selectedCreator.name} has been permanently assigned ` +
        `as the creator of ${selectedMitra.name}.`,
      );

      setSelectedMitra(null);
      setSelectedCreator(null);
      setSearch('');
      setCreatorOptions([]);

      setReloadKey(
        (previous) => previous + 1,
      );

      onChanged();
    } catch (err: any) {
      setError(
        typeof err?.response?.data?.message === 'string'
          ? err.response.data.message
          : 'Unable to assign creator. Refresh before retrying.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-gray-900">
            Historical Creator Assignment
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Assign permanent creators to historical
            Solar Mitras with missing hierarchy records.
          </p>
        </div>

        <button
          type="button"
          disabled={loading || saving}
          onClick={() =>
            setReloadKey(
              (previous) => previous + 1,
            )
          }
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
          Loading historical Solar Mitras...
        </div>
      ) : mitras.length === 0 && !error ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="font-bold text-green-800">
            All non-hidden Solar Mitras have assigned creators
          </p>

          <p className="mt-1 text-sm text-green-700">
            No historical creator assignment is required.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-bold text-orange-700">
            Missing Creators: {mitras.length}
          </p>

          {mitras.map((mitra) => (
            <div
              key={mitra.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4"
            >
              <div>
                <p className="font-bold text-gray-900">
                  {mitra.name}
                </p>

                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Mitra ID: {mitra.id}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {mitra.businessName || '—'}
                </p>

                <p className="text-sm text-gray-500">
                  {[mitra.area, mitra.city]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </p>

                <p className="text-sm text-gray-500">
                  {mitra.primaryPhone}
                </p>
              </div>

              <button
                type="button"
                disabled={saving || Boolean(error)}
                onClick={() => openAssignment(mitra)}
                className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
              >
                Assign Creator
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedMitra && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">

            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-gray-900">
                Assign Permanent Creator
              </h3>

              <button
                type="button"
                disabled={saving}
                onClick={closeAssignment}
                className="rounded-lg border px-3 py-1 text-sm font-bold text-gray-600 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500">
                Solar Mitra #{selectedMitra.id}
              </p>

              <p className="mt-1 font-black text-gray-900">
                {selectedMitra.name}
              </p>

              <p className="text-sm text-gray-600">
                {selectedMitra.businessName}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Search Creator
              </label>

              <input
                type="text"
                disabled={saving}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectedCreator(null);
                }}
                placeholder="Name, User ID, Mitra ID or business name"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {search.trim().length < 2 && (
              <p className="text-xs text-gray-500">
                Enter at least two characters to search.
              </p>
            )}

            {searching && (
              <p className="text-sm text-gray-500">
                Searching creators...
              </p>
            )}

            {searchError && (
              <p className="text-sm font-semibold text-red-700">
                {searchError}
              </p>
            )}

            {!searching &&
              !searchError &&
              search.trim().length >= 2 &&
              creatorOptions.length === 0 && (
                <p className="text-sm text-gray-500">
                  No matching active creators found.
                </p>
              )}

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {creatorOptions.map((creator) => (
                <button
                  key={creator.id}
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    setSelectedCreator(creator)
                  }
                  className={`w-full rounded-xl border p-3 text-left ${
                    selectedCreator?.id === creator.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-bold text-gray-900">
                    {creator.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    User ID: {creator.id}
                    {creator.solarMitraId != null
                      ? ` · Mitra ID: ${creator.solarMitraId}`
                      : ''}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-indigo-700">
                    {creator.roles.join(', ')}
                  </p>

                  {creator.businessName && (
                    <p className="mt-1 text-xs text-gray-500">
                      {creator.businessName}
                      {creator.city
                        ? ` · ${creator.city}`
                        : ''}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {selectedCreator && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-xs font-bold text-indigo-700">
                  Selected Creator
                </p>

                <p className="mt-1 font-black text-indigo-900">
                  {selectedCreator.name}
                </p>

                <p className="text-xs text-indigo-700">
                  User ID: {selectedCreator.id}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-orange-800">
              <strong>Important:</strong> This assignment
              is permanent and cannot be changed later.
              Existing incentive records will remain
              unchanged.
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
              <button
                type="button"
                disabled={saving}
                onClick={closeAssignment}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!selectedCreator || saving}
                onClick={assignCreator}
                className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? 'Assigning...'
                  : 'Confirm Permanent Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}