'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

const COMPONENT_OPTIONS = [
  {
    value: 'STRUCTURE',
    label: 'Structure',
  },
  {
    value: 'PILLAR',
    label: 'Pillar',
  },
  {
    value: 'PANEL',
    label: 'Panels',
  },
  {
    value: 'INVERTER',
    label: 'Inverter',
  },
  {
    value: 'EARTHING',
    label: 'Earthing',
  },
  {
    value: 'WIRING',
    label: 'Wiring',
  },
  {
    value: 'SOLAR_METER',
    label: 'Solar Meter',
  },
  {
    value: 'NET_METER',
    label: 'Net Meter',
  },
];

type Project = {
  id: number;

  customerId?: number;
  customerCode?: string;
  customerName?: string;
  customerPhone?: string;

  city?: string;
  zone?: string;
  branchName?: string;

  address?: string;
  gpsAddress?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;

  projectStatus?: string;
  status?: string;
  projectWorkState?: string;

  projectSource?: string;
  isLegacyProject?: boolean;
  legacyYear?: number;

  electricityKNumber?: string;

  panelBrand?: string;
  dcrPanelCount?: number;
  nonDcrPanelCount?: number;

  converterBrand?: string;
  converterCapacity?: string;
  converterPhase?: string;

  structureType?: string;
  structureCapacityKw?: string;
  buildingHeight?: string;

  projectSize?: string;
  projectType?: string;

  finalCost?: number;
  projectCost?: number;
  netAmount?: number;
  subsidy?: number;

  paymentStatus?: string;

  projectOwnerName?: string;

  startDate?: string;
  actualCompletionDate?: string;

  remarks?: string;
};

type FindingForm = {
  componentType: string;
  label: string;

  qualityStatus:
    | 'GOOD'
    | 'DEFECTIVE'
    | 'NON_QUALITY'
    | 'NOT_INSPECTED';

  severity:
    | 'NONE'
    | 'MINOR'
    | 'MAJOR'
    | 'CRITICAL';

  resolutionStatus:
    | 'NOT_REQUIRED'
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'RESOLVED';

  remarks: string;
  resolutionRemarks: string;

  files: File[];
};

type InspectionFinding = {
  id: number;
  componentType?: string;
  qualityStatus?: string;
  severity?: string;
  resolutionStatus?: string;
  remarks?: string;
  resolutionRemarks?: string;
};

type InspectionPhoto = {
  id: number;
  defectId?: number;
  componentType?: string;
  fileUrl?: string;
  fileName?: string;
  remarks?: string;
  createdAt?: string;
};

type InspectionHistory = {
  id: number;

  status?: string;
  overallCondition?: string;

  inspectionDate?: string;
  startedAt?: string;
  completedAt?: string;

  inspectionManagerName?: string;
  inspectionManagerRole?: string;

  visitLatitude?: number;
  visitLongitude?: number;
  visitAddress?: string;

  comments?: string;

  defectsFound?: boolean;
  followUpRequired?: boolean;

  nextInspectionDate?: string;
  followUpRemarks?: string;

  findings?: InspectionFinding[];
  photos?: InspectionPhoto[];

  createdAt?: string;
};

type DefectUpdateForm = {
  severity: string;
  resolutionStatus: string;
  remarks: string;
  resolutionRemarks: string;
};

const createInitialFindings =
  (): FindingForm[] =>
    COMPONENT_OPTIONS.map(
      (component) => ({
        componentType:
          component.value,

        label:
          component.label,

        qualityStatus:
          'NOT_INSPECTED',

        severity:
          'NONE',

        resolutionStatus:
          'NOT_REQUIRED',

        remarks: '',
        resolutionRemarks: '',

        files: [],
      }),
    );

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

  /*
   * Preserve already-small images.
   */
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

function formatLabel(
  value?: string,
) {
  return String(
    value || '-',
  ).replaceAll(
    '_',
    ' ',
  );
}

function formatDateTime(
  value?: string,
) {
  if (!value) {
    return '-';
  }

  return new Date(
    value,
  ).toLocaleString(
    'en-IN',
  );
}

function formatDate(
  value?: string,
) {
  if (!value) {
    return '-';
  }

  return new Date(
    value,
  ).toLocaleDateString(
    'en-IN',
  );
}

function formatMoney(
  value?: number,
) {
  return `₹${Number(
    value || 0,
  ).toLocaleString(
    'en-IN',
  )}`;
}

export default function InspectionProjectPage() {
  const params =
    useParams();

  const projectId =
    String(
      params?.projectId ||
        '',
    );

  const [project, setProject] =
    useState<Project | null>(
      null,
    );

  const [
    inspectionHistory,
    setInspectionHistory,
  ] = useState<
    InspectionHistory[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

    const [
  defectUpdateForms,
  setDefectUpdateForms,
] = useState<
  Record<
    number,
    DefectUpdateForm
  >
>({});

const [
  updatingDefectId,
  setUpdatingDefectId,
] = useState<number | null>(
  null,
);

  const [
    locationCapturing,
    setLocationCapturing,
  ] = useState(false);

  const [
  locationSaving,
  setLocationSaving,
] = useState(false);

  const [
    inspectionDate,
    setInspectionDate,
  ] =
    useState<Dayjs | null>(
      dayjs(),
    );

  const [
    inspectionTime,
    setInspectionTime,
  ] =
    useState<Dayjs | null>(
      dayjs(),
    );

  const [
    overallCondition,
    setOverallCondition,
  ] = useState('PASS');

  const [
    inspectionStatus,
    setInspectionStatus,
  ] = useState(
    'COMPLETED',
  );

  const [
    comments,
    setComments,
  ] = useState('');

  const [
    followUpRequired,
    setFollowUpRequired,
  ] = useState(false);

  const [
    nextInspectionDate,
    setNextInspectionDate,
  ] =
    useState<Dayjs | null>(
      null,
    );

  const [
    followUpRemarks,
    setFollowUpRemarks,
  ] = useState('');

  const [
    visitLocation,
    setVisitLocation,
  ] = useState({
    latitude: '',
    longitude: '',
    address: '',
  });

  const [
    findings,
    setFindings,
  ] =
    useState<FindingForm[]>(
      createInitialFindings(),
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

  const fetchProject =
    async () => {
      const response =
        await axios.get(
          `${API_BASE_URL}/project/${projectId}`,
          {
            headers:
              getHeaders(),
          },
        );

      setProject(
        response.data ||
          null,
      );

      setVisitLocation(
        (previous) => ({
          ...previous,

          latitude:
            response.data
              ?.gpsLatitude !==
              null &&
            response.data
              ?.gpsLatitude !==
              undefined
              ? String(
                  response.data
                    .gpsLatitude,
                )
              : '',

          longitude:
            response.data
              ?.gpsLongitude !==
              null &&
            response.data
              ?.gpsLongitude !==
              undefined
              ? String(
                  response.data
                    .gpsLongitude,
                )
              : '',

          address:
            response.data
              ?.gpsAddress ||
            response.data
              ?.address ||
            '',
        }),
      );
    };

  const fetchInspectionHistory =
    async () => {
      const response =
        await axios.get(
          `${API_BASE_URL}/project/${projectId}/inspections`,
          {
            headers:
              getHeaders(),
          },
        );

      setInspectionHistory(
        Array.isArray(
          response.data,
        )
          ? response.data
          : [],
      );
    };

  const loadPage =
    async () => {
      try {
        setLoading(true);

        await Promise.all([
          fetchProject(),
          fetchInspectionHistory(),
        ]);
      } catch (error: any) {
        console.error(
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            'Failed to load inspection details',
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (!projectId) {
      return;
    }

    loadPage();
  }, [projectId]);

  const updateFinding = (
    index: number,
    updates:
      Partial<FindingForm>,
  ) => {
    setFindings(
      (previous) => {
        const next =
          [...previous];

        const current = {
          ...next[index],
          ...updates,
        };

        if (
          updates
            .qualityStatus ===
            'GOOD' ||
          updates
            .qualityStatus ===
            'NOT_INSPECTED'
        ) {
          current.severity =
            'NONE';

          current.resolutionStatus =
            'NOT_REQUIRED';
        }

        if (
          updates
            .qualityStatus ===
            'DEFECTIVE' ||
          updates
            .qualityStatus ===
            'NON_QUALITY'
        ) {
          if (
            current.severity ===
            'NONE'
          ) {
            current.severity =
              'MINOR';
          }

          if (
            current
              .resolutionStatus ===
            'NOT_REQUIRED'
          ) {
            current.resolutionStatus =
              'PENDING';
          }
        }

        next[index] =
          current;

        return next;
      },
    );
  };

  const captureVisitLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        alert(
          'GPS is not supported on this device',
        );

        return;
      }

      setLocationCapturing(
        true,
      );

      navigator.geolocation
        .getCurrentPosition(
          async (
            position,
          ) => {
            const latitude =
              String(
                position.coords
                  .latitude,
              );

            const longitude =
              String(
                position.coords
                  .longitude,
              );

            let address =
              '';

            try {
              const response =
                await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
                );

              if (
                response.ok
              ) {
                const data =
                  await response.json();

                address =
                  String(
                    data?.display_name ||
                      '',
                  ).trim();
              }
            } catch (
              error
            ) {
              console.error(
                'Reverse geocoding failed:',
                error,
              );
            }

            setVisitLocation({
              latitude,
              longitude,

              address:
                address ||
                project
                  ?.gpsAddress ||
                project
                  ?.address ||
                '',
            });

            setLocationCapturing(
              false,
            );

            alert(
              'Current inspection location captured',
            );
          },

          (error) => {
            console.error(
              error,
            );

            setLocationCapturing(
              false,
            );

            if (
              error.code ===
              error
                .PERMISSION_DENIED
            ) {
              alert(
                'Location permission was denied. Please allow GPS access and try again.',
              );

              return;
            }

            alert(
              'Unable to capture current location',
            );
          },

          {
            enableHighAccuracy:
              true,

            timeout:
              20000,

            maximumAge:
              0,
          },
        );
    };

    const updateProjectSiteLocation =
  async () => {
    const latitude =
      Number(
        visitLocation.latitude,
      );

    const longitude =
      Number(
        visitLocation.longitude,
      );

    const address =
      String(
        visitLocation.address ||
          '',
      ).trim();

    if (
      !Number.isFinite(
        latitude,
      ) ||
      latitude < -90 ||
      latitude > 90
    ) {
      alert(
        'Please capture or enter a valid latitude',
      );

      return;
    }

    if (
      !Number.isFinite(
        longitude,
      ) ||
      longitude < -180 ||
      longitude > 180
    ) {
      alert(
        'Please capture or enter a valid longitude',
      );

      return;
    }

    if (!address) {
      alert(
        'Project site address is required',
      );

      return;
    }

    const confirmed =
      window.confirm(
        'Update this location as the permanent project site location?',
      );

    if (!confirmed) {
      return;
    }

    try {
      setLocationSaving(
        true,
      );

      const response =
        await axios.patch(
          `${API_BASE_URL}/project/${projectId}/location`,
          {
            address,
            gpsAddress:
              address,

            gpsLatitude:
              latitude,

            gpsLongitude:
              longitude,
          },
          {
            headers:
              getHeaders(),
          },
        );

      setProject(
        response.data ||
          project,
      );

      setVisitLocation({
        latitude:
          String(
            response.data
              ?.gpsLatitude ??
              latitude,
          ),

        longitude:
          String(
            response.data
              ?.gpsLongitude ??
              longitude,
          ),

        address:
          response.data
            ?.gpsAddress ||
          response.data
            ?.address ||
          address,
      });

      alert(
        'Permanent project location updated successfully',
      );
    } catch (error: any) {
      console.error(
        error,
      );

      alert(
        error?.response?.data
          ?.message ||
          'Failed to update project location',
      );
    } finally {
      setLocationSaving(
        false,
      );
    }
  };

  const openNavigation =
    () => {
      const latitude =
  Number(
    visitLocation
      .latitude ||
      project
        ?.gpsLatitude ||
      0,
  );

const longitude =
  Number(
    visitLocation
      .longitude ||
      project
        ?.gpsLongitude ||
      0,
  );

      if (
        latitude &&
        longitude
      ) {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
          '_blank',
          'noopener,noreferrer',
        );

        return;
      }

      const address =
  String(
    visitLocation
      .address ||
      project
        ?.gpsAddress ||
      project?.address ||
      '',
  ).trim();

      if (!address) {
        alert(
          'Project location is not available',
        );

        return;
      }

      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          address,
        )}`,
        '_blank',
        'noopener,noreferrer',
      );
    };

  const inspectedFindings =
    useMemo(
      () =>
        findings.filter(
          (finding) =>
            finding
              .qualityStatus !==
            'NOT_INSPECTED',
        ),
      [findings],
    );

  const defectsFound =
    useMemo(
      () =>
        findings.some(
          (finding) =>
            finding
              .qualityStatus ===
              'DEFECTIVE' ||
            finding
              .qualityStatus ===
              'NON_QUALITY',
        ),
      [findings],
    );

  useEffect(() => {
    if (
      defectsFound &&
      overallCondition ===
        'PASS'
    ) {
      setOverallCondition(
        'MINOR_DEFECT',
      );
    }

    if (
      !defectsFound &&
      overallCondition !==
        'PASS'
    ) {
      setOverallCondition(
        'PASS',
      );
    }
  }, [defectsFound]);

  const validateInspection =
    () => {
      if (
        !inspectionDate ||
        !inspectionTime
      ) {
        alert(
          'Please select inspection date and time',
        );

        return false;
      }

      if (
        inspectedFindings
          .length === 0
      ) {
        alert(
          'Please inspect at least one component',
        );

        return false;
      }

      for (
        const finding of
          findings
      ) {
        const isDefective =
          finding
            .qualityStatus ===
            'DEFECTIVE' ||
          finding
            .qualityStatus ===
            'NON_QUALITY';

        if (
          isDefective &&
          !finding.remarks
            .trim()
        ) {
          alert(
            `Please enter defect remarks for ${finding.label}`,
          );

          return false;
        }

        if (
          isDefective &&
          finding.files
            .length === 0
        ) {
          alert(
            `Please upload at least one photo for defective ${finding.label}`,
          );

          return false;
        }
      }

      if (
        followUpRequired &&
        !nextInspectionDate
      ) {
        alert(
          'Please select the next inspection date',
        );

        return false;
      }

      return true;
    };

  const combineInspectionDateTime =
    () => {
      if (
        !inspectionDate ||
        !inspectionTime
      ) {
        return null;
      }

      return inspectionDate
        .hour(
          inspectionTime.hour(),
        )
        .minute(
          inspectionTime.minute(),
        )
        .second(0)
        .millisecond(0);
    };

    const getDefectUpdateForm = (
  finding: InspectionFinding,
): DefectUpdateForm => {
  return (
    defectUpdateForms[
      finding.id
    ] || {
      severity:
        finding.severity ||
        'NONE',

      resolutionStatus:
        finding.resolutionStatus ||
        'NOT_REQUIRED',

      remarks:
        finding.remarks ||
        '',

      resolutionRemarks:
        finding.resolutionRemarks ||
        '',
    }
  );
};

const updateDefectForm = (
  finding: InspectionFinding,
  updates:
    Partial<DefectUpdateForm>,
) => {
  setDefectUpdateForms(
    (previous) => ({
      ...previous,

      [finding.id]: {
        ...getDefectUpdateForm(
          finding,
        ),

        ...updates,
      },
    }),
  );
};

const saveDefectUpdate =
  async (
    finding:
      InspectionFinding,
  ) => {
    const update =
      getDefectUpdateForm(
        finding,
      );

    if (
      update.resolutionStatus ===
        'RESOLVED' &&
      !update.resolutionRemarks
        .trim()
    ) {
      alert(
        'Please enter resolution remarks before marking the defect as resolved',
      );

      return;
    }

    try {
      setUpdatingDefectId(
        finding.id,
      );

      await axios.patch(
        `${API_BASE_URL}/project/inspection-defects/${finding.id}`,
        {
          severity:
            update.severity,

          resolutionStatus:
            update.resolutionStatus,

          remarks:
            update.remarks.trim(),

          resolutionRemarks:
            update.resolutionRemarks.trim(),
        },
        {
          headers:
            getHeaders(),
        },
      );

      alert(
        update.resolutionStatus ===
          'RESOLVED'
          ? 'Defect resolved successfully'
          : 'Defect status updated successfully',
      );

      setDefectUpdateForms(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            finding.id
          ];

          return next;
        },
      );

      await fetchInspectionHistory();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to update inspection defect',
      );
    } finally {
      setUpdatingDefectId(
        null,
      );
    }
  };

  const submitInspection =
    async () => {
      if (
        !validateInspection()
      ) {
        return;
      }

      const combinedDateTime =
        combineInspectionDateTime();

      if (
        !combinedDateTime
      ) {
        return;
      }

      try {
        setSaving(true);

        const inspectionResponse =
          await axios.post(
            `${API_BASE_URL}/project/inspections`,
            {
              projectId:
                Number(
                  projectId,
                ),

              inspectionDate:
                combinedDateTime.toISOString(),

              startedAt:
                combinedDateTime.toISOString(),

              status:
                inspectionStatus,

              overallCondition,

              visitLatitude:
                visitLocation
                  .latitude
                  ? Number(
                      visitLocation
                        .latitude,
                    )
                  : undefined,

              visitLongitude:
                visitLocation
                  .longitude
                  ? Number(
                      visitLocation
                        .longitude,
                    )
                  : undefined,

              visitAddress:
                visitLocation
                  .address,

              comments:
                comments.trim(),

              defectsFound,

              followUpRequired,

              nextInspectionDate:
                nextInspectionDate
                  ? nextInspectionDate
                      .startOf(
                        'day',
                      )
                      .toISOString()
                  : undefined,

              followUpRemarks:
                followUpRemarks.trim(),
            },
            {
              headers:
                getHeaders(),
            },
          );

        const inspectionId =
          Number(
            inspectionResponse
              .data?.id ||
              0,
          );

        if (!inspectionId) {
          throw new Error(
            'Inspection ID was not returned',
          );
        }

        const findingsResponse =
          await axios.post(
            `${API_BASE_URL}/project/inspections/${inspectionId}/findings`,
            {
              findings:
                inspectedFindings.map(
                  (
                    finding,
                  ) => ({
                    componentType:
                      finding
                        .componentType,

                    qualityStatus:
                      finding
                        .qualityStatus,

                    severity:
                      finding
                        .severity,

                    resolutionStatus:
                      finding
                        .resolutionStatus,

                    remarks:
                      finding
                        .remarks
                        .trim(),

                    resolutionRemarks:
                      finding
                        .resolutionRemarks
                        .trim(),
                  }),
                ),
            },
            {
              headers:
                getHeaders(),
            },
          );

        const savedFindings:
          InspectionFinding[] =
          Array.isArray(
            findingsResponse
              .data,
          )
            ? findingsResponse
                .data
            : [];

        for (
          const finding of
            inspectedFindings
        ) {
          if (
            finding.files
              .length === 0
          ) {
            continue;
          }

          const savedFinding =
            savedFindings.find(
              (item) =>
                item.componentType ===
                finding.componentType,
            );

          const formData =
            new FormData();

          for (
            const file of
              finding.files
          ) {
            const compressedFile =
              await compressImageFile(
                file,
              );

            formData.append(
              'files',
              compressedFile,
            );
          }

          formData.append(
            'componentType',
            finding.componentType,
          );

          formData.append(
            'remarks',
            finding.remarks,
          );

          if (
            savedFinding?.id
          ) {
            formData.append(
              'defectId',
              String(
                savedFinding.id,
              ),
            );
          }

          await axios.post(
            `${API_BASE_URL}/project/inspections/${inspectionId}/photos/upload`,
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
          'Site inspection submitted successfully',
        );

        setInspectionDate(
          dayjs(),
        );

        setInspectionTime(
          dayjs(),
        );

        setOverallCondition(
          'PASS',
        );

        setInspectionStatus(
          'COMPLETED',
        );

        setComments('');

        setFollowUpRequired(
          false,
        );

        setNextInspectionDate(
          null,
        );

        setFollowUpRemarks(
          '',
        );

        setFindings(
          createInitialFindings(),
        );

        await fetchInspectionHistory();

        window.scrollTo({
          top: 0,
          behavior:
            'smooth',
        });
      } catch (error: any) {
        console.error(
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            error?.message ||
            'Failed to submit inspection',
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl bg-white p-6 text-center shadow">
          <p className="font-semibold text-gray-600">
            Loading inspection workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-6 text-center shadow">
          <p className="font-semibold text-red-600">
            Project not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <LocalizationProvider
      dateAdapter={
        AdapterDayjs
      }
    >
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Link
                href="/inspection"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                ← Inspection Management
              </Link>

              <h1 className="mt-3 text-2xl font-bold text-gray-900">
                Project #
                {project.id}
                {' - '}
                {project.customerName ||
                  'Customer'}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                {project.customerCode ||
                  '-'}
                {' · '}
                {project.customerPhone ||
                  '-'}
                {' · '}
                {project.city ||
                  '-'}
                {' · '}
                {project.branchName ||
                  '-'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  value={
                    project.status ||
                    project.projectStatus
                  }
                />

                <Badge
                  value={
                    project.projectWorkState
                  }
                />

                {project.isLegacyProject && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                    LEGACY
                    {project.legacyYear
                      ? ` ${project.legacyYear}`
                      : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <a
                href={
                  project.customerPhone
                    ? `tel:${project.customerPhone}`
                    : undefined
                }
                onClick={(event) => {
                  if (
                    !project.customerPhone
                  ) {
                    event.preventDefault();

                    alert(
                      'Customer phone number is not available',
                    );
                  }
                }}
                className="rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-700"
              >
                Call Client
              </a>

              <button
                type="button"
                onClick={
                  openNavigation
                }
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Navigate
              </button>

              <Link
                href={`/project/${project.id}`}
                className="col-span-2 rounded-xl bg-gray-800 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-black sm:col-span-1"
              >
                Open Project
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-900">
              Technical Details
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info
                label="Project Size"
                value={
                  project.projectSize
                }
              />

              <Info
                label="Panel Brand"
                value={
                  project.panelBrand
                }
              />

              <Info
                label="DCR Panels"
                value={
                  project.dcrPanelCount
                }
              />

              <Info
                label="Non-DCR Panels"
                value={
                  project.nonDcrPanelCount
                }
              />

              <Info
                label="Inverter"
                value={
                  [
                    project
                      .converterBrand,
                    project
                      .converterCapacity,
                    project
                      .converterPhase,
                  ]
                    .filter(Boolean)
                    .join(' | ')
                }
              />

              <Info
                label="Structure"
                value={
                  [
                    project
                      .structureType,
                    project
                      .structureCapacityKw,
                  ]
                    .filter(Boolean)
                    .join(' | ')
                }
              />

              <Info
                label="Building Height"
                value={
                  project.buildingHeight
                }
              />

              <Info
                label="Electricity K No."
                value={
                  project
                    .electricityKNumber
                }
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-900">
              Project & Financial Details
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info
                label="Project Type"
                value={
                  formatLabel(
                    project.projectType,
                  )
                }
              />

              <Info
                label="Project Cost"
                value={formatMoney(
                  Number(
                    project.finalCost ||
                      project.netAmount ||
                      project.projectCost ||
                      0,
                  ),
                )}
              />

              <Info
                label="Subsidy"
                value={formatMoney(
                  project.subsidy,
                )}
              />

              <Info
                label="Payment Status"
                value={
                  formatLabel(
                    project.paymentStatus,
                  )
                }
              />

              <Info
                label="Project Owner"
                value={
                  project.projectOwnerName
                }
              />

              <Info
                label="Completion Date"
                value={formatDate(
                  project
                    .actualCompletionDate,
                )}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-900">
            Project Site Location
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {project.gpsAddress ||
              project.address ||
              'No project location saved'}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              placeholder="Visit Latitude"
              value={
                visitLocation.latitude
              }
              onChange={(event) =>
                setVisitLocation(
                  (previous) => ({
                    ...previous,
                    latitude:
                      event.target
                        .value,
                  }),
                )
              }
              className="rounded-xl border p-3"
            />

            <input
              placeholder="Visit Longitude"
              value={
                visitLocation.longitude
              }
              onChange={(event) =>
                setVisitLocation(
                  (previous) => ({
                    ...previous,
                    longitude:
                      event.target
                        .value,
                  }),
                )
              }
              className="rounded-xl border p-3"
            />

            <div className="grid gap-2 sm:grid-cols-2 md:col-span-1">
  <button
    type="button"
    onClick={
      captureVisitLocation
    }
    disabled={
      locationCapturing ||
      locationSaving
    }
    className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {locationCapturing
      ? 'Capturing...'
      : 'Capture Location'}
  </button>

  <button
    type="button"
    onClick={
      updateProjectSiteLocation
    }
    disabled={
      locationSaving ||
      locationCapturing
    }
    className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {locationSaving
      ? 'Updating...'
      : 'Update Project Location'}
  </button>
</div>

            <textarea
              placeholder="Visit GPS Address"
              value={
                visitLocation.address
              }
              onChange={(event) =>
                setVisitLocation(
                  (previous) => ({
                    ...previous,
                    address:
                      event.target
                        .value,
                  }),
                )
              }
              rows={3}
              className="rounded-xl border p-3 md:col-span-3"
            />
          </div>
        </div>

        {(
  (project as any)
    .locationUpdatedAt ||
  (project as any)
    .locationUpdatedByName
) && (
  <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
    <p>
      Last location update:{' '}
      <span className="font-semibold text-gray-800">
        {formatDateTime(
          (project as any)
            .locationUpdatedAt,
        )}
      </span>
    </p>

    <p className="mt-1">
      Updated by:{' '}
      <span className="font-semibold text-gray-800">
        {(project as any)
          .locationUpdatedByName ||
          '-'}
      </span>

      {(project as any)
        .locationUpdatedByRole
        ? ` (${String(
            (project as any)
              .locationUpdatedByRole,
          ).replaceAll(
            '_',
            ' ',
          )})`
        : ''}
    </p>
  </div>
)}

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-xl font-bold text-gray-900">
            New Site Inspection
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DatePicker
              label="Inspection Date"
              value={
                inspectionDate
              }
              onChange={
                setInspectionDate
              }
              slotProps={{
                textField: {
                  fullWidth:
                    true,
                },
              }}
            />

            <MobileTimePicker
              label="Inspection Time"
              value={
                inspectionTime
              }
              onChange={
                setInspectionTime
              }
              ampm
              ampmInClock
              slotProps={{
                textField: {
                  fullWidth:
                    true,
                },
              }}
            />

            <select
              value={
                inspectionStatus
              }
              onChange={(event) =>
                setInspectionStatus(
                  event.target
                    .value,
                )
              }
              className="rounded-xl border p-3"
            >
              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="FOLLOW_UP_REQUIRED">
                Follow-up Required
              </option>
            </select>

            <select
              value={
                overallCondition
              }
              onChange={(event) =>
                setOverallCondition(
                  event.target
                    .value,
                )
              }
              className="rounded-xl border p-3"
            >
              <option value="PASS">
                Pass
              </option>

              <option value="MINOR_DEFECT">
                Minor Defect
              </option>

              <option value="MAJOR_DEFECT">
                Major Defect
              </option>

              <option value="CRITICAL">
                Critical
              </option>
            </select>
          </div>

          <textarea
            placeholder="Overall inspection comments"
            value={comments}
            onChange={(event) =>
              setComments(
                event.target.value,
              )
            }
            rows={4}
            className="mt-4 w-full rounded-xl border p-3"
          />
        </div>

        <div className="space-y-4">
          {findings.map(
            (
              finding,
              index,
            ) => {
              const isDefective =
                finding
                  .qualityStatus ===
                  'DEFECTIVE' ||
                finding
                  .qualityStatus ===
                  'NON_QUALITY';

              return (
                <div
                  key={
                    finding.componentType
                  }
                  className={`rounded-2xl border p-5 shadow ${
                    isDefective
                      ? 'border-red-200 bg-red-50'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {
                          finding.label
                        }
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Record quality,
                        defect details and
                        multiple supporting
                        photos.
                      </p>
                    </div>

                    {isDefective && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                        DEFECT FOUND
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <select
                      value={
                        finding
                          .qualityStatus
                      }
                      onChange={(
                        event,
                      ) =>
                        updateFinding(
                          index,
                          {
                            qualityStatus:
                              event
                                .target
                                .value as FindingForm['qualityStatus'],
                          },
                        )
                      }
                      className="rounded-xl border p-3"
                    >
                      <option value="NOT_INSPECTED">
                        Not Inspected
                      </option>

                      <option value="GOOD">
                        Good
                      </option>

                      <option value="DEFECTIVE">
                        Defective
                      </option>

                      <option value="NON_QUALITY">
                        Non-Quality
                      </option>
                    </select>

                    <select
                      value={
                        finding.severity
                      }
                      disabled={
                        !isDefective
                      }
                      onChange={(
                        event,
                      ) =>
                        updateFinding(
                          index,
                          {
                            severity:
                              event
                                .target
                                .value as FindingForm['severity'],
                          },
                        )
                      }
                      className="rounded-xl border p-3 disabled:bg-gray-100"
                    >
                      <option value="NONE">
                        No Severity
                      </option>

                      <option value="MINOR">
                        Minor
                      </option>

                      <option value="MAJOR">
                        Major
                      </option>

                      <option value="CRITICAL">
                        Critical
                      </option>
                    </select>

                    <select
                      value={
                        finding
                          .resolutionStatus
                      }
                      disabled={
                        !isDefective
                      }
                      onChange={(
                        event,
                      ) =>
                        updateFinding(
                          index,
                          {
                            resolutionStatus:
                              event
                                .target
                                .value as FindingForm['resolutionStatus'],
                          },
                        )
                      }
                      className="rounded-xl border p-3 disabled:bg-gray-100"
                    >
                      <option value="NOT_REQUIRED">
                        Resolution Not Required
                      </option>

                      <option value="PENDING">
                        Pending
                      </option>

                      <option value="IN_PROGRESS">
                        In Progress
                      </option>

                      <option value="RESOLVED">
                        Resolved
                      </option>
                    </select>

                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,image/*"
                      onChange={(
                        event,
                      ) =>
                        updateFinding(
                          index,
                          {
                            files:
                              Array.from(
                                event
                                  .target
                                  .files ||
                                  [],
                              ),
                          },
                        )
                      }
                      className="rounded-xl border bg-white p-3"
                    />
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <textarea
                      placeholder={
                        isDefective
                          ? `${finding.label} defect / non-quality comments`
                          : `${finding.label} inspection comments`
                      }
                      value={
                        finding.remarks
                      }
                      onChange={(
                        event,
                      ) =>
                        updateFinding(
                          index,
                          {
                            remarks:
                              event
                                .target
                                .value,
                          },
                        )
                      }
                      rows={3}
                      className="rounded-xl border bg-white p-3"
                    />

                    <textarea
                      placeholder="Resolution remarks"
                      value={
                        finding
                          .resolutionRemarks
                      }
                      disabled={
                        !isDefective
                      }
                      onChange={(
                        event,
                      ) =>
                        updateFinding(
                          index,
                          {
                            resolutionRemarks:
                              event
                                .target
                                .value,
                          },
                        )
                      }
                      rows={3}
                      className="rounded-xl border bg-white p-3 disabled:bg-gray-100"
                    />
                  </div>

                  {finding.files
                    .length > 0 && (
                    <div className="mt-3 rounded-xl bg-white p-3 text-sm font-semibold text-gray-700">
                      {
                        finding.files
                          .length
                      }{' '}
                      photo(s) selected.
                      Photos will be
                      automatically
                      compressed before
                      upload.
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={
                followUpRequired
              }
              onChange={(event) => {
                const checked =
                  event.target
                    .checked;

                setFollowUpRequired(
                  checked,
                );

                if (checked) {
                  setInspectionStatus(
                    'FOLLOW_UP_REQUIRED',
                  );
                } else {
                  setNextInspectionDate(
                    null,
                  );

                  setFollowUpRemarks(
                    '',
                  );
                }
              }}
              className="h-5 w-5"
            />

            <span className="font-bold text-gray-800">
              Follow-up inspection
              required
            </span>
          </label>

          {followUpRequired && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <DatePicker
                label="Next Inspection Date"
                value={
                  nextInspectionDate
                }
                onChange={
                  setNextInspectionDate
                }
                minDate={
                  dayjs()
                }
                slotProps={{
                  textField: {
                    fullWidth:
                      true,
                  },
                }}
              />

              <textarea
                placeholder="Follow-up reason / next action"
                value={
                  followUpRemarks
                }
                onChange={(event) =>
                  setFollowUpRemarks(
                    event.target
                      .value,
                  )
                }
                rows={3}
                className="rounded-xl border p-3"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={
            submitInspection
          }
          disabled={saving}
          className="w-full rounded-2xl bg-orange-500 px-5 py-4 text-lg font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? 'Compressing Photos and Submitting Inspection...'
            : 'Submit Site Inspection'}
        </button>

        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Inspection History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Every site visit is
                retained as a separate
                permanent inspection
                record.
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700">
              {
                inspectionHistory.length
              }{' '}
              Visit(s)
            </span>
          </div>

          <div className="mt-5 space-y-5">
            {inspectionHistory
              .length === 0 ? (
              <p className="text-sm text-gray-500">
                No inspection history
                available.
              </p>
            ) : (
              inspectionHistory.map(
                (
                  inspection,
                ) => (
                  <InspectionHistoryCard
  key={
    inspection.id
  }
  inspection={
    inspection
  }
  getDefectUpdateForm={
    getDefectUpdateForm
  }
  updateDefectForm={
    updateDefectForm
  }
  saveDefectUpdate={
    saveDefectUpdate
  }
  updatingDefectId={
    updatingDefectId
  }
/>
                ),
              )
            )}
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}

function InspectionHistoryCard({
  inspection,
  getDefectUpdateForm,
  updateDefectForm,
  saveDefectUpdate,
  updatingDefectId,
}: {
  inspection:
    InspectionHistory;

  getDefectUpdateForm: (
    finding:
      InspectionFinding,
  ) => DefectUpdateForm;

  updateDefectForm: (
    finding:
      InspectionFinding,

    updates:
      Partial<DefectUpdateForm>,
  ) => void;

  saveDefectUpdate: (
    finding:
      InspectionFinding,
  ) => Promise<void>;

  updatingDefectId:
    number | null;
}) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-bold text-gray-900">
            Inspection #
            {inspection.id}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {formatDateTime(
              inspection
                .inspectionDate ||
                inspection.createdAt,
            )}
            {' · '}
            {inspection
              .inspectionManagerName ||
              'Inspector'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            value={
              inspection.status
            }
          />

          <Badge
            value={
              inspection
                .overallCondition
            }
          />

          {inspection.defectsFound && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
              DEFECT FOUND
            </span>
          )}

          {inspection.followUpRequired && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
              FOLLOW-UP
            </span>
          )}
        </div>
      </div>

      {inspection.comments && (
        <div className="mt-4 rounded-xl bg-white p-4">
          <p className="text-xs font-semibold text-gray-500">
            Inspection Comments
          </p>

          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
            {
              inspection.comments
            }
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Info
          label="Visit Address"
          value={
            inspection.visitAddress
          }
        />

        <Info
          label="GPS"
          value={
            inspection
              .visitLatitude &&
            inspection
              .visitLongitude
              ? `${inspection.visitLatitude}, ${inspection.visitLongitude}`
              : '-'
          }
        />

        <Info
          label="Next Inspection"
          value={formatDate(
            inspection
              .nextInspectionDate,
          )}
        />
      </div>

      {inspection
        .followUpRemarks && (
        <div className="mt-3 rounded-xl bg-yellow-50 p-3">
          <p className="text-xs font-semibold text-yellow-700">
            Follow-up Details
          </p>

          <p className="mt-1 whitespace-pre-wrap text-sm text-yellow-900">
            {
              inspection
                .followUpRemarks
            }
          </p>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {(inspection.findings ||
          []).map(
          (finding) => {
            const componentPhotos =
              (
                inspection.photos ||
                []
              ).filter(
                (photo) =>
                  photo.componentType ===
                  finding.componentType,
              );

            return (
              <div
                key={
                  finding.id
                }
                className="rounded-xl border bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-gray-900">
                    {formatLabel(
                      finding
                        .componentType,
                    )}
                  </p>

                  <Badge
                    value={
                      finding
                        .qualityStatus
                    }
                  />

                  <Badge
                    value={
                      finding
                        .severity
                    }
                  />

                  <Badge
                    value={
                      finding
                        .resolutionStatus
                    }
                  />
                </div>

                {finding.remarks && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {
                      finding.remarks
                    }
                  </p>
                )}

                {finding
                  .resolutionRemarks && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-green-700">
                    Resolution:{' '}
                    {
                      finding
                        .resolutionRemarks
                    }
                  </p>
                )}

                {(
  finding.qualityStatus ===
    'DEFECTIVE' ||
  finding.qualityStatus ===
    'NON_QUALITY'
) && (
  <div className="mt-4 rounded-xl border bg-gray-50 p-4">
    <h4 className="font-bold text-gray-900">
      Defect Resolution
    </h4>

    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <select
        value={
          getDefectUpdateForm(
            finding,
          ).severity
        }
        onChange={(event) =>
          updateDefectForm(
            finding,
            {
              severity:
                event.target
                  .value,
            },
          )
        }
        className="rounded-xl border bg-white p-3"
      >
        <option value="NONE">
          No Severity
        </option>

        <option value="MINOR">
          Minor
        </option>

        <option value="MAJOR">
          Major
        </option>

        <option value="CRITICAL">
          Critical
        </option>
      </select>

      <select
        value={
          getDefectUpdateForm(
            finding,
          ).resolutionStatus
        }
        onChange={(event) =>
          updateDefectForm(
            finding,
            {
              resolutionStatus:
                event.target
                  .value,
            },
          )
        }
        className="rounded-xl border bg-white p-3"
      >
        <option value="PENDING">
          Pending
        </option>

        <option value="IN_PROGRESS">
          In Progress
        </option>

        <option value="RESOLVED">
          Resolved
        </option>
      </select>

      <textarea
        placeholder="Defect remarks"
        value={
          getDefectUpdateForm(
            finding,
          ).remarks
        }
        onChange={(event) =>
          updateDefectForm(
            finding,
            {
              remarks:
                event.target
                  .value,
            },
          )
        }
        rows={3}
        className="rounded-xl border bg-white p-3"
      />

      <textarea
        placeholder="Resolution remarks"
        value={
          getDefectUpdateForm(
            finding,
          ).resolutionRemarks
        }
        onChange={(event) =>
          updateDefectForm(
            finding,
            {
              resolutionRemarks:
                event.target
                  .value,
            },
          )
        }
        rows={3}
        className="rounded-xl border bg-white p-3"
      />
    </div>

    <button
      type="button"
      onClick={() =>
        saveDefectUpdate(
          finding,
        )
      }
      disabled={
        updatingDefectId ===
        finding.id
      }
      className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {updatingDefectId ===
      finding.id
        ? 'Updating Defect...'
        : getDefectUpdateForm(
              finding,
            )
              .resolutionStatus ===
            'RESOLVED'
          ? 'Mark Defect Resolved'
          : 'Update Defect Status'}
    </button>
  </div>
)}

                {componentPhotos
                  .length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {componentPhotos.map(
                      (
                        photo,
                      ) => (
                        <a
                          key={
                            photo.id
                          }
                          href={
                            photo.fileUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-xl border bg-gray-50"
                        >
                          <img
                            src={
                              photo.fileUrl
                            }
                            alt={
                              photo.fileName ||
                              'Inspection photo'
                            }
                            className="h-32 w-full object-cover"
                          />

                          <p className="truncate p-2 text-xs font-semibold text-gray-600">
                            {photo.fileName ||
                              'Photo'}
                          </p>
                        </a>
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;

  value?:
    | string
    | number
    | null;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-800">
        {value === 0
          ? '0'
          : value || '-'}
      </p>
    </div>
  );
}

function Badge({
  value,
}: {
  value?: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
      {formatLabel(value)}
    </span>
  );
}