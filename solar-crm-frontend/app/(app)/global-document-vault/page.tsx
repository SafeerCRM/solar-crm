'use client';

import {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

import {
  FFmpeg,
} from '@ffmpeg/ffmpeg';

import {
  fetchFile,
  toBlobURL,
} from '@ffmpeg/util';

import {
  LocalizationProvider,
} from '@mui/x-date-pickers/LocalizationProvider';

import {
  AdapterDayjs,
} from '@mui/x-date-pickers/AdapterDayjs';

import {
  DatePicker,
} from '@mui/x-date-pickers/DatePicker';

import TextField from '@mui/material/TextField';

import type {
  Dayjs,
} from 'dayjs';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type VaultDocument = {
  id: number;

  title: string;
  category: string;

  tags?: string[];
  remarks?: string;

  fileName: string;
  fileUrl: string;
  filePath?: string;

  mimeType?: string;
  fileSize?: number;

  uploadedBy?: number;
  uploadedByName?: string;
  uploadedByRole?: string;

  isHidden?: boolean;

  hiddenAt?: string;
  hiddenBy?: number;
  hiddenByName?: string;
  hiddenReason?: string;

  restoredAt?: string;
  restoredBy?: number;
  restoredByName?: string;
  restoreReason?: string;

  lastEditedAt?: string;
lastEditedBy?: number;
lastEditedByName?: string;

  createdAt?: string;
  updatedAt?: string;
};

type CurrentUser = {
  id?: number;
  name?: string;
  email?: string;
  roles?: string[];
};

const initialUploadForm = {
  title: '',
  category: '',
  tags: '',
  remarks: '',
};

const initialFilters = {
  search: '',
  category: '',
  tag: '',
  month: '',
  fromDate: '',
  toDate: '',
  showHidden: false,
};

const compressImageFile = async (
  file: File,
): Promise<File> => {
  if (
    !file.type.startsWith(
      'image/',
    )
  ) {
    return file;
  }

  if (
    file.size <=
    1024 * 1024
  ) {
    return file;
  }

  return new Promise(
    (resolve) => {
      const image =
        new Image();

      const objectUrl =
        URL.createObjectURL(
          file,
        );

      image.onload = () => {
        const maxWidth =
          1600;

        const scale =
          Math.min(
            1,
            maxWidth /
              image.width,
          );

        const canvas =
          document.createElement(
            'canvas',
          );

        canvas.width =
          Math.round(
            image.width *
              scale,
          );

        canvas.height =
          Math.round(
            image.height *
              scale,
          );

        const context =
          canvas.getContext(
            '2d',
          );

        if (!context) {
          URL.revokeObjectURL(
            objectUrl,
          );

          resolve(file);
          return;
        }

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(
              objectUrl,
            );

            if (!blob) {
              resolve(file);
              return;
            }

            const safeName =
              file.name.replace(
                /\.(png|jpg|jpeg|webp)$/i,
                '.jpg',
              );

            resolve(
              new File(
                [blob],
                safeName,
                {
                  type:
                    'image/jpeg',

                  lastModified:
                    Date.now(),
                },
              ),
            );
          },

          'image/jpeg',
          0.78,
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl,
        );

        resolve(file);
      };

      image.src =
        objectUrl;
    },
  );
};

const compressVideoFile = async (
  file: File,
  onProgress?: (
    progress: number,
  ) => void,
): Promise<File> => {
  if (
    !VIDEO_TYPES.includes(
      file.type,
    )
  ) {
    return file;
  }

  if (
    file.size >
    MAX_ORIGINAL_VIDEO_SIZE
  ) {
    throw new Error(
      'Video must be 250 MB or smaller before compression',
    );
  }

  if (
    file.size <=
    VIDEO_COMPRESSION_THRESHOLD
  ) {
    return file;
  }

  const ffmpeg =
    new FFmpeg();

  ffmpeg.on(
    'progress',
    ({
      progress,
    }) => {
      const percentage =
        Math.max(
          0,
          Math.min(
            100,
            Math.round(
              progress * 100,
            ),
          ),
        );

      onProgress?.(
        percentage,
      );
    },
  );

  /*
   * Load FFmpeg only when a video actually needs compression.
   * This prevents the heavy WASM runtime from loading merely
   * because someone opened the Document Vault page.
   */
  const baseURL =
    'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

  await ffmpeg.load({
    coreURL:
      await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        'text/javascript',
      ),

    wasmURL:
      await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm',
      ),
  });

  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase() ||
    'mp4';

  const inputName =
    `input-${Date.now()}.${extension}`;

  const outputName =
    `compressed-${Date.now()}.mp4`;

  await ffmpeg.writeFile(
    inputName,
    await fetchFile(file),
  );

  const exitCode =
    await ffmpeg.exec([
      '-i',
      inputName,

      '-vf',
      'scale=-2:min(720\\,ih)',

      '-c:v',
      'libx264',

      '-preset',
      'veryfast',

      '-crf',
      '28',

      '-c:a',
      'aac',

      '-b:a',
      '96k',

      '-movflags',
      '+faststart',

      outputName,
    ]);

  if (
    exitCode !== 0
  ) {
    throw new Error(
      'Video compression failed',
    );
  }

  const outputData =
    await ffmpeg.readFile(
      outputName,
    );

  await ffmpeg.deleteFile(
    inputName,
  );

  await ffmpeg.deleteFile(
    outputName,
  );

  ffmpeg.terminate();

  const outputBytes =
    outputData instanceof Uint8Array
      ? new Uint8Array(
          outputData,
        )
      : new TextEncoder().encode(
          outputData,
        );

  const blob =
    new Blob(
      [outputBytes],
      {
        type:
          'video/mp4',
      },
    );

  if (
    blob.size >
    MAX_FINAL_VIDEO_SIZE
  ) {
    throw new Error(
      'Compressed video is still larger than 100 MB',
    );
  }

  const originalBaseName =
    file.name.replace(
      /\.[^/.]+$/,
      '',
    );

  return new File(
    [blob],
    `${originalBaseName}-compressed.mp4`,
    {
      type:
        'video/mp4',

      lastModified:
        Date.now(),
    },
  );
};

const MB =
  1024 * 1024;

const MAX_ORIGINAL_VIDEO_SIZE =
  250 * MB;

const VIDEO_COMPRESSION_THRESHOLD =
  25 * MB;

const MAX_FINAL_VIDEO_SIZE =
  100 * MB;

const VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const formatDateTime = (
  value?: string,
) => {
  if (!value) {
    return '-';
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }

  return parsed.toLocaleString(
    'en-IN',
  );
};

const formatFileSize = (
  value?: number,
) => {
  const size =
    Number(value || 0);

  if (size <= 0) {
    return '-';
  }

  if (
    size <
    1024
  ) {
    return `${size} B`;
  }

  if (
    size <
    1024 * 1024
  ) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(2)} MB`;
};

export default function GlobalDocumentVaultPage() {
  const [
    documents,
    setDocuments,
  ] =
    useState<VaultDocument[]>(
      [],
    );

  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<CurrentUser | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

    const [
  videoCompressionProgress,
  setVideoCompressionProgress,
] =
  useState<number | null>(
    null,
  );

const [
  processingFileName,
  setProcessingFileName,
] =
  useState('');

  const [
    uploadForm,
    setUploadForm,
  ] =
    useState(
      initialUploadForm,
    );

  const [
    selectedFiles,
    setSelectedFiles,
  ] =
    useState<File[]>([]);

  const [
    filters,
    setFilters,
  ] =
    useState(
      initialFilters,
    );

  const [
    pagination,
    setPagination,
  ] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    });

    const [
  editingDocument,
  setEditingDocument,
] =
  useState<VaultDocument | null>(
    null,
  );

const [
  editForm,
  setEditForm,
] =
  useState({
    title: '',
    category: '',
    tags: '',
    remarks: '',
  });

const [
  savingEdit,
  setSavingEdit,
] =
  useState(false);

  const [
    titleSuggestions,
    setTitleSuggestions,
  ] =
    useState<string[]>([]);

  const [
    categorySuggestions,
    setCategorySuggestions,
  ] =
    useState<string[]>([]);

  const [
    tagSuggestions,
    setTagSuggestions,
  ] =
    useState<string[]>([]);

  const [
    fromDateValue,
    setFromDateValue,
  ] =
    useState<Dayjs | null>(
      null,
    );

  const [
    toDateValue,
    setToDateValue,
  ] =
    useState<Dayjs | null>(
      null,
    );

  const getHeaders = () => {
    const token =
      localStorage.getItem(
        'token',
      );

    return token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {};
  };

  const userRoles =
    Array.isArray(
      currentUser?.roles,
    )
      ? currentUser.roles
      : [];

  const isOwner =
    userRoles.includes(
      'OWNER',
    );

  useEffect(() => {
    const storedUser =
      localStorage.getItem(
        'user',
      );

    if (!storedUser) {
      return;
    }

    try {
      setCurrentUser(
        JSON.parse(
          storedUser,
        ),
      );
    } catch (
      error
    ) {
      console.error(
        'Failed to parse current user',
        error,
      );
    }
  }, []);

  const fetchSuggestions =
    async (
      type:
        | 'title'
        | 'category'
        | 'tag',

      search = '',
    ) => {
      try {
        const response =
          await axios.get(
            `${API_BASE_URL}/project/global-document-vault/suggestions`,
            {
              params: {
                type,
                search:
                  search ||
                  undefined,
              },

              headers:
                getHeaders(),
            },
          );

        const values =
          Array.isArray(
            response.data,
          )
            ? response.data
            : [];

        if (
          type ===
          'title'
        ) {
          setTitleSuggestions(
            values,
          );
        }

        if (
          type ===
          'category'
        ) {
          setCategorySuggestions(
            values,
          );
        }

        if (
          type ===
          'tag'
        ) {
          setTagSuggestions(
            values,
          );
        }
      } catch (
        error
      ) {
        console.error(
          `Failed to load ${type} suggestions`,
          error,
        );
      }
    };

  const fetchDocuments =
    async (
      overridePage?: number,

      overrideFilters?: typeof initialFilters,
    ) => {
      try {
        setLoading(true);

        const activePage =
          overridePage ||
          pagination.page;

        const activeFilters =
          overrideFilters ||
          filters;

        const response =
          await axios.get(
            `${API_BASE_URL}/project/global-document-vault`,
            {
              params: {
                page:
                  activePage,

                limit:
                  pagination.limit,

                search:
                  activeFilters
                    .search ||
                  undefined,

                category:
                  activeFilters
                    .category ||
                  undefined,

                tag:
                  activeFilters
                    .tag ||
                  undefined,

                month:
                  activeFilters
                    .month ||
                  undefined,

                fromDate:
                  activeFilters
                    .month
                    ? undefined
                    : activeFilters
                        .fromDate ||
                      undefined,

                toDate:
                  activeFilters
                    .month
                    ? undefined
                    : activeFilters
                        .toDate ||
                      undefined,

                showHidden:
                  activeFilters
                    .showHidden
                    ? 'true'
                    : 'false',
              },

              headers:
                getHeaders(),
            },
          );

        setDocuments(
          Array.isArray(
            response.data?.data,
          )
            ? response.data.data
            : [],
        );

        const pageInfo =
          response.data
            ?.pagination ||
          {};

        setPagination({
          page:
            Number(
              pageInfo.page ||
                activePage,
            ),

          limit:
            Number(
              pageInfo.limit ||
                20,
            ),

          total:
            Number(
              pageInfo.total ||
                0,
            ),

          totalPages:
            Number(
              pageInfo.totalPages ||
                1,
            ),
        });
      } catch (
        error: any
      ) {
        console.error(
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            'Failed to load Global Document Vault',
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchDocuments(
      1,
    );

    fetchSuggestions(
      'title',
    );

    fetchSuggestions(
      'category',
    );

    fetchSuggestions(
      'tag',
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          fetchSuggestions(
            'title',
            uploadForm.title,
          );
        },
        250,
      );

    return () =>
      window.clearTimeout(
        timeout,
      );
  }, [
    uploadForm.title,
  ]);

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          fetchSuggestions(
            'category',
            uploadForm.category,
          );
        },
        250,
      );

    return () =>
      window.clearTimeout(
        timeout,
      );
  }, [
    uploadForm.category,
  ]);

  const currentTagSearch =
    uploadForm.tags
      .split(',')
      .pop()
      ?.trim() || '';

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          fetchSuggestions(
            'tag',
            currentTagSearch,
          );
        },
        250,
      );

    return () =>
      window.clearTimeout(
        timeout,
      );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentTagSearch,
  ]);

  const addSuggestedTag = (
    tag: string,
  ) => {
    const existingTags =
      uploadForm.tags
        .split(',')
        .map((value) =>
          value.trim(),
        )
        .filter(Boolean);

    const withoutCurrentSearch =
      existingTags.filter(
        (value) =>
          value.toLowerCase() !==
          currentTagSearch.toLowerCase(),
      );

    if (
      !withoutCurrentSearch.some(
        (value) =>
          value.toLowerCase() ===
          tag.toLowerCase(),
      )
    ) {
      withoutCurrentSearch.push(
        tag,
      );
    }

    setUploadForm({
      ...uploadForm,

      tags:
        withoutCurrentSearch.join(
          ', ',
        ),
    });
  };

  const uploadDocuments =
  async () => {
    const title =
      uploadForm.title.trim();

    const category =
      uploadForm.category.trim();

    if (!title) {
      alert(
        'Document title is required',
      );

      return;
    }

    if (!category) {
      alert(
        'Document category is required',
      );

      return;
    }

    if (
      selectedFiles.length ===
      0
    ) {
      alert(
        'Select at least one document',
      );

      return;
    }

    try {
      setUploading(true);

      setVideoCompressionProgress(
        null,
      );

      setProcessingFileName(
        '',
      );

      for (
        const file of
          selectedFiles
      ) {
        setProcessingFileName(
          file.name,
        );

        let processedFile =
          file;

        // ============================
        // IMAGE
        // ============================

        if (
          file.type.startsWith(
            'image/',
          )
        ) {
          processedFile =
            await compressImageFile(
              file,
            );
        }

        // ============================
        // VIDEO
        // ============================

        else if (
          VIDEO_TYPES.includes(
            file.type,
          )
        ) {
          if (
            file.size >
            MAX_ORIGINAL_VIDEO_SIZE
          ) {
            throw new Error(
              `"${file.name}" is larger than 250 MB`,
            );
          }

          if (
            file.size >
            VIDEO_COMPRESSION_THRESHOLD
          ) {
            setVideoCompressionProgress(
              0,
            );

            processedFile =
              await compressVideoFile(
                file,

                (
                  progress,
                ) => {
                  setVideoCompressionProgress(
                    progress,
                  );
                },
              );
          } else {
            setVideoCompressionProgress(
              null,
            );
          }
        }

        // ============================
        // FINAL CLIENT-SIDE CHECKS
        // ============================

        if (
          processedFile.type.startsWith(
            'image/',
          ) &&
          processedFile.size >
            8 * MB
        ) {
          throw new Error(
            `"${file.name}" is still larger than 8 MB after image compression`,
          );
        }

        if (
          processedFile.type ===
            'application/pdf' &&
          processedFile.size >
            25 * MB
        ) {
          throw new Error(
            `"${file.name}" exceeds the 25 MB PDF limit`,
          );
        }

        if (
          VIDEO_TYPES.includes(
            processedFile.type,
          ) &&
          processedFile.size >
            MAX_FINAL_VIDEO_SIZE
        ) {
          throw new Error(
            `"${file.name}" exceeds the 100 MB final video limit`,
          );
        }

        setVideoCompressionProgress(
          null,
        );

        const formData =
          new FormData();

        formData.append(
          'file',
          processedFile,
        );

        formData.append(
          'title',
          title,
        );

        formData.append(
          'category',
          category,
        );

        formData.append(
          'tags',
          uploadForm.tags.trim(),
        );

        formData.append(
          'remarks',
          uploadForm.remarks.trim(),
        );

        await axios.post(
          `${API_BASE_URL}/project/global-document-vault/upload`,
          formData,
          {
            headers: {
              ...getHeaders(),

              'Content-Type':
                'multipart/form-data',
            },
          },
        );
      }

      alert(
        selectedFiles.length ===
          1
          ? 'Document uploaded successfully'
          : `${selectedFiles.length} documents uploaded successfully`,
      );

      setUploadForm(
        initialUploadForm,
      );

      setSelectedFiles(
        [],
      );

      setProcessingFileName(
        '',
      );

      setVideoCompressionProgress(
        null,
      );

      const fileInput =
        document.getElementById(
          'global-document-vault-files',
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value =
          '';
      }

      await Promise.all([
        fetchDocuments(1),

        fetchSuggestions(
          'title',
        ),

        fetchSuggestions(
          'category',
        ),

        fetchSuggestions(
          'tag',
        ),
      ]);
    } catch (
      error: any
    ) {
      console.error(
        error,
      );

      alert(
        error?.response?.data
          ?.message ||
          error?.message ||
          'Failed to upload document',
      );
    } finally {
      setUploading(false);

      setVideoCompressionProgress(
        null,
      );

      setProcessingFileName(
        '',
      );
    }
  };

  const startEditingDocument = (
  documentItem: VaultDocument,
) => {
  setEditingDocument(
    documentItem,
  );

  setEditForm({
    title:
      documentItem.title ||
      '',

    category:
      documentItem.category ||
      '',

    tags:
      Array.isArray(
        documentItem.tags,
      )
        ? documentItem.tags.join(
            ', ',
          )
        : '',

    remarks:
      documentItem.remarks ||
      '',
  });
};

const saveDocumentEdit =
  async () => {
    if (!editingDocument) {
      return;
    }

    const title =
      editForm.title.trim();

    const category =
      editForm.category.trim();

    if (!title) {
      alert(
        'Document title is required',
      );

      return;
    }

    if (!category) {
      alert(
        'Document category is required',
      );

      return;
    }

    try {
      setSavingEdit(true);

      await axios.patch(
        `${API_BASE_URL}/project/global-document-vault/${editingDocument.id}`,
        {
          title,
          category,

          tags:
            editForm.tags.trim(),

          remarks:
            editForm.remarks.trim(),
        },
        {
          headers:
            getHeaders(),
        },
      );

      setEditingDocument(
        null,
      );

      await Promise.all([
        fetchDocuments(
          pagination.page,
        ),

        fetchSuggestions(
          'title',
        ),

        fetchSuggestions(
          'category',
        ),

        fetchSuggestions(
          'tag',
        ),
      ]);

      alert(
        'Document details updated successfully',
      );
    } catch (
      error: any
    ) {
      console.error(
        error,
      );

      alert(
        error?.response?.data
          ?.message ||
          'Failed to update document',
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const hideDocument =
    async (
      documentItem: VaultDocument,
    ) => {
      const reason =
        window.prompt(
          `Reason for hiding "${documentItem.title}"?`,
        );

      if (reason === null) {
        return;
      }

      try {
        await axios.patch(
          `${API_BASE_URL}/project/global-document-vault/${documentItem.id}/hide`,
          {
            reason,
          },
          {
            headers:
              getHeaders(),
          },
        );

        await fetchDocuments(
          1,
        );
      } catch (
        error: any
      ) {
        console.error(
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            'Failed to hide document',
        );
      }
    };

  const restoreDocument =
    async (
      documentItem: VaultDocument,
    ) => {
      const reason =
        window.prompt(
          `Reason for restoring "${documentItem.title}"?`,
        );

      if (reason === null) {
        return;
      }

      try {
        await axios.patch(
          `${API_BASE_URL}/project/global-document-vault/${documentItem.id}/restore`,
          {
            reason,
          },
          {
            headers:
              getHeaders(),
          },
        );

        const normalFilters = {
          ...filters,
          showHidden:
            false,
        };

        setFilters(
          normalFilters,
        );

        await fetchDocuments(
          1,
          normalFilters,
        );
      } catch (
        error: any
      ) {
        console.error(
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            'Failed to restore document',
        );
      }
    };

  const resetFilters =
    () => {
      setFilters(
        initialFilters,
      );

      setFromDateValue(
        null,
      );

      setToDateValue(
        null,
      );

      fetchDocuments(
        1,
        initialFilters,
      );
    };

  return (
    <LocalizationProvider
      dateAdapter={
        AdapterDayjs
      }
    >
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-5 pb-10">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            Global Document Vault
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Central company document repository for policies,
            tenders, technical documents, drawings, vehicle
            records, office documents and other internal files.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Upload Document
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Titles, categories and tags remain custom.
                Existing values automatically appear as suggestions.
              </p>
            </div>

            <button
              type="button"
              onClick={
                uploadDocuments
              }
              disabled={
                uploading
              }
              className="shrink-0 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
  ? videoCompressionProgress !==
    null
    ? `Compressing Video ${videoCompressionProgress}%`
    : 'Uploading...'
  : 'Upload Document'}
            </button>
          </div>

          <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="min-w-0">
              <input
                list="vault-title-suggestions"
                placeholder="Document Title"
                value={
                  uploadForm.title
                }
                onChange={(event) =>
                  setUploadForm({
                    ...uploadForm,

                    title:
                      event.target.value,
                  })
                }
                className="w-full min-w-0 rounded-xl border p-3"
              />

              <datalist id="vault-title-suggestions">
                {titleSuggestions.map(
                  (value) => (
                    <option
                      key={
                        value
                      }
                      value={
                        value
                      }
                    />
                  ),
                )}
              </datalist>
            </div>

            <div className="min-w-0">
              <input
                list="vault-category-suggestions"
                placeholder="Document Category"
                value={
                  uploadForm.category
                }
                onChange={(event) =>
                  setUploadForm({
                    ...uploadForm,

                    category:
                      event.target.value,
                  })
                }
                className="w-full min-w-0 rounded-xl border p-3"
              />

              <datalist id="vault-category-suggestions">
                {categorySuggestions.map(
                  (value) => (
                    <option
                      key={
                        value
                      }
                      value={
                        value
                      }
                    />
                  ),
                )}
              </datalist>
            </div>

            <input
              id="global-document-vault-files"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm"
              onChange={(event) =>
                setSelectedFiles(
                  Array.from(
                    event.target.files ||
                      [],
                  ),
                )
              }
              className="min-w-0 rounded-xl border bg-white p-3"
            />

            <div className="min-w-0 md:col-span-2 xl:col-span-3">
              <input
                placeholder="Tags separated by commas"
                value={
                  uploadForm.tags
                }
                onChange={(event) =>
                  setUploadForm({
                    ...uploadForm,

                    tags:
                      event.target.value,
                  })
                }
                className="w-full min-w-0 rounded-xl border p-3"
              />

              {tagSuggestions.length >
                0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tagSuggestions.map(
                    (tag) => (
                      <button
                        key={
                          tag
                        }
                        type="button"
                        onClick={() =>
                          addSuggestedTag(
                            tag,
                          )
                        }
                        className="rounded-full border bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        + {tag}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            <textarea
              placeholder="Document Remarks / Notes"
              value={
                uploadForm.remarks
              }
              onChange={(event) =>
                setUploadForm({
                  ...uploadForm,

                  remarks:
                    event.target.value,
                })
              }
              rows={3}
              className="min-w-0 rounded-xl border p-3 md:col-span-2 xl:col-span-3"
            />
          </div>

          {selectedFiles.length >
            0 && (
            <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700">
              {
                selectedFiles.length
              }{' '}
              {selectedFiles.length}{' '}
file(s) selected. Images larger than 1 MB and videos larger than 25 MB will be automatically compressed before upload.
            </div>
          )}

          {uploading &&
  processingFileName && (
    <div className="mt-3 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
      <div className="font-semibold">
        {videoCompressionProgress !==
        null
          ? `Compressing video: ${processingFileName}`
          : `Processing: ${processingFileName}`}
      </div>

      {videoCompressionProgress !==
        null && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-yellow-200">
          <div
            className="h-full bg-yellow-600 transition-all duration-300"
            style={{
              width:
                `${videoCompressionProgress}%`,
            }}
          />
        </div>
      )}
    </div>
  )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Search Documents
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Search title, category, tags, remarks or file name.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  fetchDocuments(
                    1,
                  )
                }
                disabled={
                  loading
                }
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading
                  ? 'Loading...'
                  : 'Apply Filters'}
              </button>

              <button
                type="button"
                onClick={
                  resetFilters
                }
                className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              placeholder="Search Documents"
              value={
                filters.search
              }
              onChange={(event) =>
                setFilters({
                  ...filters,

                  search:
                    event.target.value,
                })
              }
              className="min-w-0 rounded-xl border p-3"
            />

            <div className="min-w-0">
              <input
                list="vault-filter-category-suggestions"
                placeholder="Category"
                value={
                  filters.category
                }
                onChange={(event) =>
                  setFilters({
                    ...filters,

                    category:
                      event.target.value,
                  })
                }
                className="w-full min-w-0 rounded-xl border p-3"
              />

              <datalist id="vault-filter-category-suggestions">
                {categorySuggestions.map(
                  (value) => (
                    <option
                      key={
                        value
                      }
                      value={
                        value
                      }
                    />
                  ),
                )}
              </datalist>
            </div>

            <input
              placeholder="Tag"
              value={
                filters.tag
              }
              onChange={(event) =>
                setFilters({
                  ...filters,

                  tag:
                    event.target.value,
                })
              }
              className="min-w-0 rounded-xl border p-3"
            />

            <TextField
              label="Month"
              type="month"
              fullWidth
              value={
                filters.month
              }
              onChange={(event) =>
                setFilters({
                  ...filters,

                  month:
                    event.target.value,

                  fromDate:
                    '',

                  toDate:
                    '',
                })
              }
              slotProps={{
                inputLabel: {
                  shrink:
                    true,
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root':
                  {
                    borderRadius:
                      '0.75rem',

                    height:
                      '54px',
                  },
              }}
            />

            <DatePicker
              label="From Date"
              value={
                fromDateValue
              }
              onChange={(
                value,
              ) => {
                setFromDateValue(
                  value,
                );

                setFilters({
                  ...filters,

                  month:
                    '',

                  fromDate:
                    value
                      ? value.format(
                          'YYYY-MM-DD',
                        )
                      : '',
                });
              }}
              slotProps={{
                textField: {
                  fullWidth:
                    true,
                },
              }}
            />

            <DatePicker
              label="To Date"
              value={
                toDateValue
              }
              onChange={(
                value,
              ) => {
                setToDateValue(
                  value,
                );

                setFilters({
                  ...filters,

                  month:
                    '',

                  toDate:
                    value
                      ? value.format(
                          'YYYY-MM-DD',
                        )
                      : '',
                });
              }}
              slotProps={{
                textField: {
                  fullWidth:
                    true,
                },
              }}
            />

            {isOwner && (
              <label className="flex min-h-[54px] items-center gap-3 rounded-xl border p-3">
                <input
                  type="checkbox"
                  checked={
                    filters.showHidden
                  }
                  onChange={(event) =>
                    setFilters({
                      ...filters,

                      showHidden:
                        event.target
                          .checked,
                    })
                  }
                />

                <span className="text-sm font-medium text-gray-700">
                  View Hidden
                </span>
              </label>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Document Vault
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {pagination.total.toLocaleString(
                  'en-IN',
                )}{' '}
                document(s)
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-semibold text-gray-500">
              Loading documents...
            </div>
          ) : documents.length ===
            0 ? (
            <div className="mt-5 rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">
              No documents found.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {documents.map(
  (
    documentItem,
  ) => {
    const canEditDocument =
      isOwner ||
      (
        Number(
          documentItem.uploadedBy ||
            0,
        ) > 0 &&
        Number(
          documentItem.uploadedBy,
        ) ===
          Number(
            currentUser?.id ||
              0,
          )
      );

    const isEditing =
      editingDocument?.id ===
      documentItem.id;

    return (
      <div
        key={
          documentItem.id
        }
        className={`rounded-2xl border p-4 ${
          documentItem.isHidden
            ? 'border-red-200 bg-red-50/40'
            : 'bg-white'
        }`}
      >
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-base font-bold text-gray-900">
                {
                  documentItem.title
                }
              </h3>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                {
                  documentItem.category
                }
              </span>

              {documentItem.isHidden && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                  HIDDEN
                </span>
              )}
            </div>

            <p className="mt-2 break-all text-sm font-semibold text-gray-700">
              {
                documentItem.fileName
              }
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Uploaded by:{' '}
              <span className="font-semibold">
                {documentItem.uploadedByName ||
                  '-'}
              </span>

              {' · '}

              {formatDateTime(
                documentItem.createdAt,
              )}

              {' · '}

              {formatFileSize(
                documentItem.fileSize,
              )}
            </p>

            {documentItem.uploadedByRole && (
              <p className="mt-1 text-xs text-gray-500">
                Role:{' '}
                {documentItem.uploadedByRole.replaceAll(
                  '_',
                  ' ',
                )}
              </p>
            )}

            {documentItem.lastEditedAt && (
              <p className="mt-1 text-xs text-gray-500">
                Last edited by:{' '}
                <span className="font-semibold">
                  {documentItem.lastEditedByName ||
                    '-'}
                </span>

                {' · '}

                {formatDateTime(
                  documentItem.lastEditedAt,
                )}
              </p>
            )}

            {Array.isArray(
              documentItem.tags,
            ) &&
              documentItem.tags.length >
                0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {documentItem.tags.map(
                    (
                      tag,
                      index,
                    ) => (
                      <span
                        key={`${documentItem.id}-${tag}-${index}`}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                      >
                        #{tag}
                      </span>
                    ),
                  )}
                </div>
              )}

            {documentItem.remarks && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                {
                  documentItem.remarks
                }
              </p>
            )}

            {documentItem.isHidden &&
              documentItem.hiddenReason && (
                <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  Hidden reason:{' '}
                  {
                    documentItem.hiddenReason
                  }
                </div>
              )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href={
                documentItem.fileUrl
              }
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              View
            </a>

            <a
              href={
                documentItem.fileUrl
              }
              download={
                documentItem.fileName
              }
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-gray-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-gray-800"
            >
              Download
            </a>

            {canEditDocument &&
              !documentItem.isHidden && (
                <button
                  type="button"
                  onClick={() =>
                    startEditingDocument(
                      documentItem,
                    )
                  }
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  Edit
                </button>
              )}

            {isOwner &&
              (filters.showHidden ? (
                <button
                  type="button"
                  onClick={() =>
                    restoreDocument(
                      documentItem,
                    )
                  }
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    hideDocument(
                      documentItem,
                    )
                  }
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Hide
                </button>
              ))}
          </div>
        </div>

        {isEditing && (
          <div className="mt-5 border-t pt-5">
            <div className="mb-4">
              <h4 className="text-base font-bold text-gray-900">
                Edit Document Details
              </h4>

              <p className="mt-1 text-xs text-gray-500">
                You can edit the document details. The uploaded
                file itself will remain unchanged.
              </p>
            </div>

            <div className="grid min-w-0 gap-3 md:grid-cols-2">
              <div className="min-w-0">
                <input
                  list="vault-edit-title-suggestions"
                  placeholder="Document Title"
                  value={
                    editForm.title
                  }
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,

                      title:
                        event.target.value,
                    })
                  }
                  className="w-full min-w-0 rounded-xl border p-3"
                />

                <datalist id="vault-edit-title-suggestions">
                  {titleSuggestions.map(
                    (value) => (
                      <option
                        key={
                          value
                        }
                        value={
                          value
                        }
                      />
                    ),
                  )}
                </datalist>
              </div>

              <div className="min-w-0">
                <input
                  list="vault-edit-category-suggestions"
                  placeholder="Document Category"
                  value={
                    editForm.category
                  }
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,

                      category:
                        event.target.value,
                    })
                  }
                  className="w-full min-w-0 rounded-xl border p-3"
                />

                <datalist id="vault-edit-category-suggestions">
                  {categorySuggestions.map(
                    (value) => (
                      <option
                        key={
                          value
                        }
                        value={
                          value
                        }
                      />
                    ),
                  )}
                </datalist>
              </div>

              <input
                placeholder="Tags separated by commas"
                value={
                  editForm.tags
                }
                onChange={(event) =>
                  setEditForm({
                    ...editForm,

                    tags:
                      event.target.value,
                  })
                }
                className="min-w-0 rounded-xl border p-3 md:col-span-2"
              />

              <textarea
                placeholder="Document Remarks / Notes"
                value={
                  editForm.remarks
                }
                onChange={(event) =>
                  setEditForm({
                    ...editForm,

                    remarks:
                      event.target.value,
                  })
                }
                rows={3}
                className="min-w-0 rounded-xl border p-3 md:col-span-2"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  saveDocumentEdit
                }
                disabled={
                  savingEdit
                }
                className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingEdit
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>

              <button
                type="button"
                disabled={
                  savingEdit
                }
                onClick={() =>
                  setEditingDocument(
                    null,
                  )
                }
                className="rounded-xl border px-5 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
)}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
              Page{' '}
              {pagination.page}{' '}
              of{' '}
              {pagination.totalPages}
              {' | '}
              Total{' '}
              {pagination.total}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  pagination.page <=
                    1 ||
                  loading
                }
                onClick={() =>
                  fetchDocuments(
                    pagination.page -
                      1,
                  )
                }
                className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  pagination.page >=
                    pagination.totalPages ||
                  loading
                }
                onClick={() =>
                  fetchDocuments(
                    pagination.page +
                      1,
                  )
                }
                className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}