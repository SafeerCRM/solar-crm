import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import {
  DataSource,
  EntityManager,
  LessThanOrEqual,
} from 'typeorm';

import {
  SolarMitra,
  SolarMitraStatus,
} from './solar-mitra.entity';

import {
  SolarMitraReferral,
  SolarMitraReferralStatus,
} from './solar-mitra-referral.entity';

import {
  SolarMitraPayout,
  SolarMitraPayoutStatus,
} from './solar-mitra-payout.entity';

import {
  SolarMitraNetworkPool,
  SolarMitraNetworkPoolStatus,
} from './solar-mitra-network-pool.entity';

import {
  SolarMitraNetworkPayout,
  SolarMitraNetworkPayoutStatus,
} from './solar-mitra-network-payout.entity';

import {
  SolarMitraNetworkRate,
} from './solar-mitra-network-rate.entity';

import { User } from '../users/user.entity';

import {
  Project,
  ProjectStatus,
  ProjectApprovalStatus,
} from '../project/project.entity';

import { SolarMitraNetworkRecovery } from './solar-mitra-network-recovery.entity';

import {
  SolarMitraCreatorPayout,
  SolarMitraCreatorPayoutStatus,
} from './solar-mitra-creator-payout.entity';

import {
  StaffPayroll,
  StaffPayrollStatus,
} from '../staff/staff-payroll.entity';

import { createHash } from 'crypto';

type NetworkUpline = {
  userId: number;
  name: string;
  role: string | null;
  solarMitraId: number | null;
  level: number;
  eligible: boolean;
  retentionReason: string | null;
};

@Injectable()
export class SolarMitraNetworkService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  private readonly effectiveFrom =
    new Date('2026-11-01T00:00:00+05:30');

    async searchHistoricalCreatorOptions(
  user: any,
  search: string = '',
) {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  if (!roles.includes('OWNER')) {
    throw new ForbiddenException(
      'Only Owner can search historical creator options',
    );
  }

  const term = String(search || '').trim();

  if (term.length < 2) {
    return {
      data: [],
    };
  }

  const rows = await this.dataSource.query(
    `
      SELECT
        u.id,
        u.name,
        u.roles,
        m.id AS "solarMitraId",
        m.businessName AS "businessName",
        m.city
      FROM "user" u
      LEFT JOIN solar_mitra m
        ON m."linkedUserId" = u.id
      WHERE
        u."isHidden" = false
        AND COALESCE(u.roles, '') <> ''
        AND (
          m.id IS NOT NULL
          OR NOT (
            'SOLAR_MITRA' = ANY(
              string_to_array(
                COALESCE(u.roles, ''),
                ','
              )
            )
          )
        )
        AND (
          m.id IS NULL
          OR (
            m."isHidden" = false
            AND m.status = 'ACTIVE'
          )
        )
        AND (
          u.name ILIKE $1
          OR CAST(u.id AS text) = $2
          OR m."businessName" ILIKE $1
          OR CAST(m.id AS text) = $2
        )
      ORDER BY u.name ASC, u.id ASC
      LIMIT 50
    `.replace(
      'm.businessName AS',
      'm."businessName" AS',
    ),
    [`%${term}%`, term],
  );

  return {
    data: rows.map((row: any) => ({
      id: Number(row.id),
      name: row.name,
      roles: String(row.roles || '')
        .split(',')
        .filter(Boolean),
      solarMitraId:
        row.solarMitraId == null
          ? null
          : Number(row.solarMitraId),
      businessName: row.businessName,
      city: row.city,
    })),
  };
}

    async getMissingCreatorMitras(user: any) {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  if (!roles.includes('OWNER')) {
    throw new ForbiddenException(
      'Only Owner can view Solar Mitras with missing creators',
    );
  }

  const rows = await this.dataSource
    .getRepository(SolarMitra)
    .createQueryBuilder('mitra')
    .select([
      'mitra.id',
      'mitra.name',
      'mitra.businessName',
      'mitra.primaryPhone',
      'mitra.city',
      'mitra.area',
      'mitra.status',
      'mitra.approvalStatus',
      'mitra.posterVerificationStatus',
      'mitra.createdAt',
    ])
    .where('mitra."createdBy" IS NULL')
    .andWhere('mitra."isHidden" = false')
    .orderBy('mitra.id', 'ASC')
    .getMany();

  return {
    total: rows.length,
    data: rows,
  };
}

    async assignHistoricalCreator(
  solarMitraId: number,
  creatorUserId: number,
  user: any,
) {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  if (!roles.includes('OWNER')) {
    throw new ForbiddenException(
      'Only Owner can assign a missing Solar Mitra creator',
    );
  }

  solarMitraId = Number(solarMitraId);
  creatorUserId = Number(creatorUserId);

  if (
    !Number.isSafeInteger(solarMitraId) ||
    solarMitraId <= 0 ||
    !Number.isSafeInteger(creatorUserId) ||
    creatorUserId <= 0
  ) {
    throw new BadRequestException(
      'Valid Solar Mitra ID and creator User ID are required',
    );
  }

  return this.dataSource.transaction(
    async (manager) => {
      await this.lockNetworkFinancialOperations(
        manager,
      );

      const mitraRepository =
        manager.getRepository(SolarMitra);

      const userRepository =
        manager.getRepository(User);

      const mitra =
        await mitraRepository.findOne({
          where: {
            id: solarMitraId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (!mitra || mitra.isHidden) {
        throw new NotFoundException(
          'Solar Mitra not found',
        );
      }

      if (mitra.createdBy != null) {
        throw new ConflictException(
          'This Solar Mitra already has a permanent creator',
        );
      }

      if (
        Number(mitra.linkedUserId) ===
        creatorUserId
      ) {
        throw new BadRequestException(
          'A Solar Mitra cannot be its own creator',
        );
      }

      const creator =
        await userRepository.findOne({
          where: {
            id: creatorUserId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (!creator || creator.isHidden) {
        throw new BadRequestException(
          'Selected creator must be an active CRM user',
        );
      }

     const creatorRoles: string[] =
  Array.isArray(creator.roles)
    ? creator.roles.map((role) => String(role))
    : [];

      if (!creatorRoles.length) {
        throw new BadRequestException(
          'Selected creator has no valid CRM role',
        );
      }

      const creatorMitra =
        await mitraRepository.findOne({
          where: {
            linkedUserId: creatorUserId,
          },
        });

      if (
        creatorRoles.includes('SOLAR_MITRA') &&
        !creatorMitra
      ) {
        throw new BadRequestException(
          'Selected Solar Mitra creator has no linked profile',
        );
      }

      if (
        creatorMitra &&
        (
          creatorMitra.isHidden ||
          creatorMitra.status !==
            SolarMitraStatus.ACTIVE
        )
      ) {
        throw new BadRequestException(
          'Selected Solar Mitra creator is not active',
        );
      }

      /*
       * Traverse the proposed creator's existing
       * ancestry to prevent circular relationships.
       */
      const visitedUserIds =
        new Set<number>();

      let currentUserId:
        number | null = creatorUserId;

      while (currentUserId !== null) {
        if (
          Number(mitra.linkedUserId) ===
          currentUserId
        ) {
          throw new ConflictException(
            'This assignment would create a circular Solar Mitra hierarchy',
          );
        }

        if (
          visitedUserIds.has(currentUserId)
        ) {
          throw new ConflictException(
            'Circular relationship detected in the existing hierarchy',
          );
        }

        visitedUserIds.add(currentUserId);

        const parentMitra =
          await mitraRepository.findOne({
            where: {
              linkedUserId: currentUserId,
            },
          });

        if (
          parentMitra?.id === mitra.id
        ) {
          throw new ConflictException(
            'This assignment would create a circular Solar Mitra hierarchy',
          );
        }

        if (!parentMitra?.createdBy) {
          break;
        }

        currentUserId =
          Number(parentMitra.createdBy);
      }

      /*
       * Permanently assign the missing creator.
       * Existing incentive records are not modified.
       */
      mitra.createdBy = creator.id;

      mitra.createdByName =
  String(creator.name || '').trim();

      mitra.createdByRole =
        creatorRoles.includes(
          'SOLAR_MITRA_ASSISTANT',
        )
          ? 'SOLAR_MITRA_ASSISTANT'
          : String(creatorRoles[0]);

      mitra.updatedBy =
        Number(user.id);

      mitra.updatedByName =
  String(user.name || '').trim();

      const savedMitra =
        await mitraRepository.save(mitra);

      return {
        success: true,
        solarMitraId: savedMitra.id,
        solarMitraName: savedMitra.name,
        creatorUserId: savedMitra.createdBy,
        creatorName: savedMitra.createdByName,
        creatorRole: savedMitra.createdByRole,
        assignedBy: savedMitra.updatedBy,
        assignedAt: savedMitra.updatedAt,
      };
    },
  );
}

  private toPaise(value: string | number): number {
    const amount = Number(value);

    const paise = Math.round(amount * 100);

    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      !Number.isSafeInteger(paise)
    ) {
      throw new ConflictException(
        'Invalid network incentive amount',
      );
    }

    return paise;
  }

  private fromPaise(value: number): string {
    return (value / 100).toFixed(2);
  }

  private async getUplineChain(
    sourceMitra: SolarMitra,
    manager: EntityManager,
  ): Promise<NetworkUpline[]> {
    const chain: NetworkUpline[] = [];

    const visited = new Set<number>();

    if (sourceMitra.linkedUserId) {
      visited.add(
        Number(sourceMitra.linkedUserId),
      );
    }

    let creatorId = Number(
      sourceMitra.createdBy || 0,
    );

    while (creatorId > 0) {
      if (visited.has(creatorId)) {
        throw new ConflictException(
          'Circular Solar Mitra hierarchy detected',
        );
      }

      visited.add(creatorId);

      const user = await manager.findOne(
        User,
        {
          where: {
            id: creatorId,
          },
          select: {
            id: true,
            name: true,
            roles: true,
            isHidden: true,
          },
        },
      );

      const parentMitra =
        await manager.findOne(
          SolarMitra,
          {
            where: {
              linkedUserId: creatorId,
            },
          },
        );

      let retentionReason: string | null =
        null;

      if (!user) {
        retentionReason =
          'CREATOR_USER_NOT_FOUND';
      } else if (user.isHidden) {
        retentionReason =
          'USER_HIDDEN';
      } else if (parentMitra?.isHidden) {
        retentionReason =
          'SOLAR_MITRA_HIDDEN';
      } else if (
        parentMitra &&
        parentMitra.status !==
          SolarMitraStatus.ACTIVE
      ) {
        retentionReason =
          `SOLAR_MITRA_${parentMitra.status}`;
      }

      chain.push({
        userId: creatorId,

        name:
          user?.name ||
          parentMitra?.name ||
          `User #${creatorId}`,

        role:
          parentMitra
            ? 'SOLAR_MITRA'
            : user?.roles?.[0] || null,

        solarMitraId:
          parentMitra?.id || null,

        level: chain.length + 1,

        eligible:
          retentionReason === null,

        retentionReason,
      });

      if (!parentMitra) {
        break;
      }

      creatorId = Number(
        parentMitra.createdBy || 0,
      );
    }

    return chain;
  }

  async markNetworkPayoutPaid(
  payoutId: number,
  body: any,
  user: any,
) {
  const normalizedPayoutId =
    Number(payoutId);

  const paidBy = Number(
    user?.id ||
    user?.userId ||
    user?.sub ||
    0,
  );

  if (
    !Number.isSafeInteger(normalizedPayoutId) ||
    normalizedPayoutId <= 0 ||
    normalizedPayoutId > 2147483647
  ) {
    throw new ConflictException(
      'Invalid network payout ID',
    );
  }

  if (
    !Number.isSafeInteger(paidBy) ||
    paidBy <= 0
  ) {
    throw new ConflictException(
      'Invalid payment user ID',
    );
  }

  const paymentMode = String(
    body?.paymentMode || '',
  ).trim();

  const paymentReference = String(
    body?.paymentReference || '',
  ).trim();

  const paymentRemarks = String(
    body?.paymentRemarks || '',
  ).trim();

  const expectedAmount =
    body?.expectedNetPayableAmount;

  if (
    expectedAmount === undefined ||
    expectedAmount === null ||
    !/^\d+(\.\d{1,2})?$/.test(
      String(expectedAmount),
    )
  ) {
    throw new ConflictException(
      'Valid expected net payable amount is required',
    );
  }

  const expectedNetPaise =
    this.toPaise(expectedAmount);

  return this.dataSource.transaction(
    async (manager) => {
      await this.lockNetworkFinancialOperations(
        manager,
      );

      const payoutRepository =
        manager.getRepository(
          SolarMitraNetworkPayout,
        );

      const existingPayout =
        await payoutRepository.findOne({
          where: {
            id: normalizedPayoutId,
          },
        });

      if (!existingPayout) {
        throw new ConflictException(
          'Network payout not found',
        );
      }

      await this.lockNetworkBeneficiary(
        manager,
        existingPayout.beneficiaryUserId,
      );

      const pool = await manager.findOne(
        SolarMitraNetworkPool,
        {
          where: {
            id: existingPayout.poolId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        },
      );

      if (
        !pool ||
        pool.status !==
          SolarMitraNetworkPoolStatus.GENERATED
      ) {
        throw new ConflictException(
          'Network incentive pool is not active',
        );
      }

      const payout =
        await payoutRepository.findOne({
          where: {
            id: normalizedPayoutId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (!payout) {
        throw new ConflictException(
          'Network payout not found',
        );
      }

      await this.assertNetworkProjectStillValid(
  manager,
  pool,
  payout,
);

      if (
        payout.status !==
        SolarMitraNetworkPayoutStatus.APPROVED
      ) {
        throw new ConflictException(
          'Only approved network incentives can be settled',
        );
      }

      if (
        payout.payrollId ||
        payout.settlementType ||
        payout.paidAt
      ) {
        throw new ConflictException(
          'Network incentive already linked to a settlement',
        );
      }

      await this.assertManualIncentiveSettlementAllowed(
  manager,
  payout.beneficiaryUserId,
);

      const recovery =
        await this.applyNetworkRecovery(
          manager,
          payout,
          'MANUAL',
          user,
          null,
        );

      const actualNetPaise =
        this.toPaise(
          recovery.netPayableAmount,
        );

      if (
        actualNetPaise !==
        expectedNetPaise
      ) {
        throw new ConflictException(
          'Net payable amount has changed. Refresh settlement preview before proceeding.',
        );
      }

      if (
        actualNetPaise > 0 &&
        (
          !paymentMode ||
          !paymentReference ||
          paymentMode.toUpperCase() ===
            'RECOVERY_ADJUSTMENT'
        )
      ) {
        throw new ConflictException(
          'Valid payment mode and transaction reference are required',
        );
      }

      payout.status =
        SolarMitraNetworkPayoutStatus.PAID;

      payout.recoveryDeductedAmount =
        recovery.recoveryDeductedAmount;

      payout.netPaidAmount =
        recovery.netPayableAmount;

      payout.settlementType =
        'MANUAL';

      payout.payrollId = null;

      payout.paidAt = new Date();

      payout.paidBy = paidBy;

      payout.paidByName =
        String(
          user?.name ||
          user?.email ||
          '',
        ).trim() || null;

      payout.paymentMode =
        actualNetPaise === 0
          ? 'RECOVERY_ADJUSTMENT'
          : paymentMode;

      payout.paymentReference =
        actualNetPaise === 0
          ? `RECOVERY-NETWORK-${payout.id}`
          : paymentReference;

      payout.remarks =
        paymentRemarks || null;

      const savedPayout =
        await payoutRepository.save(
          payout,
        );

      return {
        success: true,

        message:
          'Network incentive settled successfully',

        payout: savedPayout,

        settlement: recovery,
      };
    },
  );
}

async assertManualIncentiveSettlementAllowed(
  manager: EntityManager,
  beneficiaryUserId: number,
) {
  await this.lockNetworkFinancialOperations(
    manager,
  );

  const userId = Number(
    beneficiaryUserId,
  );

  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    userId > 2147483647
  ) {
    throw new ConflictException(
      'Invalid incentive beneficiary',
    );
  }

  const staffRows = await manager.query(
    `
      SELECT
        id,
        "fullName",
        "employeeCode"

      FROM public.staff_member

      WHERE "linkedUserId" = $1
        AND "isActive" = true
        AND "isHidden" = false

      LIMIT 1
    `,
    [userId],
  );

  if (staffRows.length > 0) {
    throw new ConflictException(
      'This beneficiary is an active staff member. Solar Mitra incentives must be settled through monthly salary payroll.',
    );
  }
}

async calculateIncentiveSettlementPreview(
  manager: EntityManager,
  beneficiaryUserId: number,
  payoutAmount: number | string,
) {
  await this.lockNetworkFinancialOperations(
    manager,
  );

  const userId = Number(
    beneficiaryUserId,
  );

  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    userId > 2147483647
  ) {
    throw new ConflictException(
      'Invalid incentive beneficiary',
    );
  }

  const recoveryRows = await manager.query(
    `
      SELECT
        COALESCE(
          SUM(outstanding),
          0
        )::text AS outstanding

      FROM (
        SELECT
          GREATEST(
            n."recoveryAmount" -
            n."recoveredAmount",
            0
          ) AS outstanding

        FROM public.solar_mitra_network_payout n

        WHERE n."beneficiaryUserId" = $1
          AND n.status = 'RECOVERY_PENDING'

        UNION ALL

        SELECT
          GREATEST(
            p."recoveryAmount" -
            p."recoveredAmount",
            0
          ) AS outstanding

        FROM public.solar_mitra_payout p

        INNER JOIN public.solar_mitra m
          ON m.id = p."solarMitraId"

        WHERE m."linkedUserId" = $1
          AND p.status = 'RECOVERY_PENDING'
      ) recovery
    `,
    [userId],
  );

  const grossPaise =
    this.toPaise(payoutAmount);

  const outstandingPaise =
    this.toPaise(
      recoveryRows[0]?.outstanding ||
      '0.00',
    );

  const deductionPaise = Math.min(
    grossPaise,
    outstandingPaise,
  );

  const netPaise =
    grossPaise - deductionPaise;

  return {
    grossAmount:
      this.fromPaise(grossPaise),

    outstandingRecovery:
      this.fromPaise(outstandingPaise),

    recoveryDeductedAmount:
      this.fromPaise(deductionPaise),

    netPayableAmount:
      this.fromPaise(netPaise),

    remainingRecovery:
      this.fromPaise(
        outstandingPaise -
        deductionPaise,
      ),

    requiresExternalPayment:
      netPaise > 0,

    previewedAt:
      new Date(),
  };
}

  async previewNetworkSettlement(
  payoutId: number,
) {
  const normalizedPayoutId =
    Number(payoutId);

  if (
    !Number.isSafeInteger(normalizedPayoutId) ||
    normalizedPayoutId <= 0 ||
    normalizedPayoutId > 2147483647
  ) {
    throw new ConflictException(
      'Invalid network payout ID',
    );
  }

  return this.dataSource.transaction(
    async (manager) => {
      await this.lockNetworkFinancialOperations(
        manager,
      );

      const payoutRepository =
        manager.getRepository(
          SolarMitraNetworkPayout,
        );

      const payout =
        await payoutRepository.findOne({
          where: {
            id: normalizedPayoutId,
          },
        });

      if (!payout) {
        throw new ConflictException(
          'Network payout not found',
        );
      }

      const pool =
        await manager.findOne(
          SolarMitraNetworkPool,
          {
            where: {
              id: payout.poolId,
            },
            lock: {
              mode: 'pessimistic_write',
            },
          },
        );

      if (
        !pool ||
        pool.status !==
          SolarMitraNetworkPoolStatus.GENERATED
      ) {
        throw new ConflictException(
          'Network incentive pool is not active',
        );
      }

      const lockedPayout =
        await payoutRepository.findOne({
          where: {
            id: normalizedPayoutId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (
        !lockedPayout ||
        lockedPayout.status !==
          SolarMitraNetworkPayoutStatus.APPROVED
      ) {
        throw new ConflictException(
          'Only approved network incentives can be settled',
        );
      }

      await this.assertNetworkProjectStillValid(
  manager,
  pool,
  lockedPayout,
);

      if (lockedPayout.payrollId != null) {
  throw new ConflictException(
    `Network payout is linked to Payroll #${lockedPayout.payrollId} and cannot be paid manually`,
  );
}

if (
  lockedPayout.paidAt ||
  lockedPayout.settlementType
) {
  throw new ConflictException(
    'Network payout has already been settled',
  );
}

await this.assertManualIncentiveSettlementAllowed(
  manager,
  lockedPayout.beneficiaryUserId,
);

const settlement =
  await this.calculateIncentiveSettlementPreview(
    manager,
    lockedPayout.beneficiaryUserId,
    lockedPayout.payoutAmount,
  );

return {
  payoutId:
    lockedPayout.id,

  projectId:
    lockedPayout.projectId,

  beneficiaryUserId:
    lockedPayout.beneficiaryUserId,

  beneficiaryName:
    lockedPayout.beneficiaryName,

  ...settlement,
};
    },
  );
}

async calculatePayrollNetworkRecovery(
  manager: EntityManager,
  payroll: StaffPayroll,
) {
  await this.lockNetworkFinancialOperations(
    manager,
  );

  const userId = Number(
    payroll.linkedUserId || 0,
  );

  const creatorPaise = this.toPaise(
    payroll.solarMitraCreatorIncentiveAmount || 0,
  );

  const projectPaise = this.toPaise(
    payroll.solarMitraProjectIncentiveAmount || 0,
  );

  const networkPaise = this.toPaise(
    payroll.solarMitraNetworkIncentiveAmount || 0,
  );

  const totalIncentivePaise =
    creatorPaise +
    projectPaise +
    networkPaise;

  let outstandingPaise = 0;

  if (userId > 0) {
    const rows = await manager.query(
      `
        SELECT COALESCE(
          SUM(r.outstanding),
          0
        ) AS "outstandingRecovery"
        FROM (
          SELECT GREATEST(
            p."recoveryAmount" -
            p."recoveredAmount",
            0
          ) AS outstanding
          FROM public.solar_mitra_network_payout p
          WHERE p."beneficiaryUserId" = $1
          AND p.status = 'RECOVERY_PENDING'

          UNION ALL

          SELECT GREATEST(
            p."recoveryAmount" -
            p."recoveredAmount",
            0
          ) AS outstanding
          FROM public.solar_mitra_payout p
          INNER JOIN public.solar_mitra sm
            ON sm.id = p."solarMitraId"
          WHERE sm."linkedUserId" = $1
          AND p.status = 'RECOVERY_PENDING'
        ) r
      `,
      [userId],
    );

    outstandingPaise = this.toPaise(
      rows[0]?.outstandingRecovery || 0,
    );
  }

  /*
   * Recovery settlement order:
   * 1. Creator incentives
   * 2. Direct Project incentives
   * 3. Network incentives
   *
   * Ordinary salary is never included.
   */

  const creatorDeductionPaise = Math.min(
    creatorPaise,
    outstandingPaise,
  );

  const projectDeductionPaise = Math.min(
    projectPaise,
    outstandingPaise -
      creatorDeductionPaise,
  );

  const networkDeductionPaise = Math.min(
    networkPaise,
    outstandingPaise -
      creatorDeductionPaise -
      projectDeductionPaise,
  );

  const deductionPaise =
    creatorDeductionPaise +
    projectDeductionPaise +
    networkDeductionPaise;

  return {
    outstandingRecovery:
      this.fromPaise(outstandingPaise),

    recoveryDeduction:
      this.fromPaise(deductionPaise),

    remainingRecovery:
      this.fromPaise(
        outstandingPaise -
        deductionPaise,
      ),

    totalIncentiveAmount:
      this.fromPaise(totalIncentivePaise),

    creatorRecoveryDeduction:
      this.fromPaise(creatorDeductionPaise),

    projectRecoveryDeduction:
      this.fromPaise(projectDeductionPaise),

    networkRecoveryDeduction:
      this.fromPaise(networkDeductionPaise),

    netCreatorIncentive:
      this.fromPaise(
        creatorPaise -
        creatorDeductionPaise,
      ),

    netProjectIncentive:
      this.fromPaise(
        projectPaise -
        projectDeductionPaise,
      ),

    netNetworkIncentive:
      this.fromPaise(
        networkPaise -
        networkDeductionPaise,
      ),

    netTotalIncentive:
      this.fromPaise(
        totalIncentivePaise -
        deductionPaise,
      ),
  };
}

async validatePayrollIncentives(
  manager: EntityManager,
  payroll: StaffPayroll,
) {
  await this.lockNetworkFinancialOperations(
    manager,
  );

  const userId = Number(
    payroll.linkedUserId || 0,
  );

  const creatorPayouts = await manager
    .getRepository(SolarMitraCreatorPayout)
    .createQueryBuilder('p')
    .where('p.payrollId = :payrollId', {
      payrollId: payroll.id,
    })
    .orderBy('p.id', 'ASC')
    .setLock('pessimistic_write')
    .getMany();

  const projectPayouts = await manager
    .getRepository(SolarMitraPayout)
    .createQueryBuilder('p')
    .where('p.payrollId = :payrollId', {
      payrollId: payroll.id,
    })
    .orderBy('p.id', 'ASC')
    .setLock('pessimistic_write')
    .getMany();

  const networkPayouts = await manager
    .getRepository(SolarMitraNetworkPayout)
    .createQueryBuilder('p')
    .where('p.payrollId = :payrollId', {
      payrollId: payroll.id,
    })
    .orderBy('p.id', 'ASC')
    .setLock('pessimistic_write')
    .getMany();

  let creatorPaise = 0;
  let projectPaise = 0;
  let networkPaise = 0;

  for (const payout of creatorPayouts) {
  if (
    !userId ||
    Number(payout.creatorId) !== userId ||
    payout.status !==
      SolarMitraCreatorPayoutStatus.ELIGIBLE ||
    payout.paidAt
  ) {
    throw new ConflictException(
      `Creator incentive #${payout.id} is no longer valid for this payroll`,
    );
  }

  const eligibleRows = await manager.query(
    `
      SELECT sm.id
      FROM public.solar_mitra sm
      INNER JOIN public."user" u
        ON u.id = sm."createdBy"
      WHERE sm.id = $1
        AND sm."createdBy" = $2
        AND sm.status = 'ACTIVE'
        AND sm."isHidden" = false
        AND sm."posterVerificationStatus" = 'ATTACHED'
        AND COALESCE(
          sm."createdByRole", ''
        ) <> 'SOLAR_MITRA_ASSISTANT'
        AND NOT (
          'SOLAR_MITRA_ASSISTANT' = ANY(
            string_to_array(
              COALESCE(u.roles, ''),
              ','
            )
          )
        )
      LIMIT 1
    `,
    [
      payout.solarMitraId,
      payout.creatorId,
    ],
  );

  if (!eligibleRows.length) {
    throw new ConflictException(
      `Creator incentive #${payout.id} is no longer eligible. Regenerate payroll before proceeding.`,
    );
  }

  creatorPaise += this.toPaise(
    payout.payoutAmount,
  );
}

  for (const payout of projectPayouts) {
    const mitra = await manager.findOne(
      SolarMitra,
      {
        where: {
          id: payout.solarMitraId,
        },
      },
    );

    if (
      !userId ||
      !mitra ||
      Number(mitra.linkedUserId) !== userId ||
      payout.status !==
        SolarMitraPayoutStatus.ELIGIBLE
    ) {
      throw new ConflictException(
        `Project incentive #${payout.id} is no longer valid for this payroll`,
      );
    }

    const project = payout.projectId
  ? await manager.findOne(Project, {
      where: {
        id: Number(payout.projectId),
      },
    })
  : null;

if (
  !project ||
  project.status === ProjectStatus.CANCELLED ||
  project.status === ProjectStatus.REJECTED ||
  project.ownerApprovalStatus !==
    ProjectApprovalStatus.APPROVED
) {
  throw new ConflictException(
    `Project incentive #${payout.id} is no longer payable because the associated project is missing, cancelled or not approved. Regenerate payroll before proceeding.`,
  );
}

    projectPaise += this.toPaise(
      payout.payoutAmount,
    );
  }

  for (const payout of networkPayouts) {
    const pool = await manager.findOne(
      SolarMitraNetworkPool,
      {
        where: {
          id: payout.poolId,
        },
      },
    );

    if (
      !userId ||
      Number(payout.beneficiaryUserId) !== userId ||
      payout.status !==
        SolarMitraNetworkPayoutStatus.APPROVED ||
      payout.paidAt ||
      payout.settlementType ||
      !pool ||
      pool.status !==
        SolarMitraNetworkPoolStatus.GENERATED
    ) {
      throw new ConflictException(
        `Network incentive #${payout.id} is no longer valid for this payroll`,
      );
    }

    const project = await manager.findOne(
  Project,
  {
    where: {
      id: Number(payout.projectId),
    },
  },
);

if (
  !project ||
  Number(pool.projectId) !==
    Number(payout.projectId) ||
  project.status === ProjectStatus.CANCELLED ||
  project.status === ProjectStatus.REJECTED ||
  project.ownerApprovalStatus !==
    ProjectApprovalStatus.APPROVED
) {
  throw new ConflictException(
    `Network incentive #${payout.id} is no longer payable because the associated Project is invalid. Regenerate payroll before proceeding.`,
  );
}

    networkPaise += this.toPaise(
      payout.payoutAmount,
    );
  }

  if (
    creatorPaise !== this.toPaise(
      payroll.solarMitraCreatorIncentiveAmount || 0,
    ) ||
    projectPaise !== this.toPaise(
      payroll.solarMitraProjectIncentiveAmount || 0,
    ) ||
    networkPaise !== this.toPaise(
      payroll.solarMitraNetworkIncentiveAmount || 0,
    )
  ) {
    throw new ConflictException(
      'Reserved Solar Mitra incentives do not match payroll amounts. Regenerate payroll before proceeding.',
    );
  }

  const recovery =
  await this.calculatePayrollNetworkRecovery(
    manager,
    payroll,
  );

const expectedRecoveryPaise =
  this.toPaise(
    payroll.solarMitraRecoveryDeduction || 0,
  );

const currentRecoveryPaise =
  this.toPaise(
    recovery.recoveryDeduction,
  );

if (
  expectedRecoveryPaise !==
  currentRecoveryPaise
) {
  throw new ConflictException(
    'Solar Mitra recovery deduction has changed. Regenerate payroll before proceeding.',
  );
}

  return {
    creatorPayouts,
    projectPayouts,
    networkPayouts,

    recovery,

    creatorAmount:
      this.fromPaise(creatorPaise),

    projectAmount:
      this.fromPaise(projectPaise),

    networkAmount:
      this.fromPaise(networkPaise),

    totalAmount:
      this.fromPaise(
        creatorPaise +
        projectPaise +
        networkPaise,
      ),
  };
}

async settlePayrollIncentives(
  manager: EntityManager,
  payroll: StaffPayroll,
  user: any,
) {
  await this.lockNetworkFinancialOperations(
    manager,
  );

  if (
    payroll.isHidden ||
    payroll.status !== StaffPayrollStatus.APPROVED
  ) {
    throw new ConflictException(
      'Only active and approved payroll can settle Solar Mitra incentives',
    );
  }

  const validated =
    await this.validatePayrollIncentives(
      manager,
      payroll,
    );

  /*
   * Calculate expected deductions before
   * any recovery liability is reduced.
   */
  const expectedRecovery =
    await this.calculatePayrollNetworkRecovery(
      manager,
      payroll,
    );

  const directSettlement =
    await this.settlePayrollDirectIncentives(
      manager,
      payroll,
      validated.creatorPayouts,
      validated.projectPayouts,
      user,
    );

  const networkSettlement =
    await this.settlePayrollNetworkIncentives(
      manager,
      payroll,
      validated.networkPayouts,
      user,
      expectedRecovery.networkRecoveryDeduction,
    );

  const expectedCreatorGrossPaise =
    this.toPaise(
      payroll.solarMitraCreatorIncentiveAmount || 0,
    );

  const expectedProjectGrossPaise =
    this.toPaise(
      payroll.solarMitraProjectIncentiveAmount || 0,
    );

  const expectedNetworkGrossPaise =
    this.toPaise(
      payroll.solarMitraNetworkIncentiveAmount || 0,
    );

  const expectedTotalGrossPaise =
    expectedCreatorGrossPaise +
    expectedProjectGrossPaise +
    expectedNetworkGrossPaise;

  const expectedTotalRecoveryPaise =
    this.toPaise(
      payroll.solarMitraRecoveryDeduction || 0,
    );

  const actualCreatorGrossPaise =
    this.toPaise(
      directSettlement.grossCreatorAmount,
    );

  const actualProjectGrossPaise =
    this.toPaise(
      directSettlement.grossProjectAmount,
    );

  const actualNetworkGrossPaise =
    this.toPaise(
      networkSettlement.grossNetworkAmount,
    );

  const actualCreatorRecoveryPaise =
    this.toPaise(
      directSettlement.creatorRecoveryDeductedAmount,
    );

  const actualProjectRecoveryPaise =
    this.toPaise(
      directSettlement.projectRecoveryDeductedAmount,
    );

  const actualNetworkRecoveryPaise =
    this.toPaise(
      networkSettlement.networkRecoveryDeductedAmount,
    );

  const actualTotalGrossPaise =
    actualCreatorGrossPaise +
    actualProjectGrossPaise +
    actualNetworkGrossPaise;

  const actualTotalRecoveryPaise =
    actualCreatorRecoveryPaise +
    actualProjectRecoveryPaise +
    actualNetworkRecoveryPaise;

  const actualTotalNetPaise =
    this.toPaise(
      directSettlement.netCreatorAmount,
    ) +
    this.toPaise(
      directSettlement.netProjectAmount,
    ) +
    this.toPaise(
      networkSettlement.netNetworkAmount,
    );

  /*
   * Validate individual category amounts
   * and the combined approved payroll totals.
   */

  if (
    actualCreatorGrossPaise !==
      expectedCreatorGrossPaise ||

    actualProjectGrossPaise !==
      expectedProjectGrossPaise ||

    actualNetworkGrossPaise !==
      expectedNetworkGrossPaise ||

    actualCreatorRecoveryPaise !==
      this.toPaise(
        expectedRecovery.creatorRecoveryDeduction,
      ) ||

    actualProjectRecoveryPaise !==
      this.toPaise(
        expectedRecovery.projectRecoveryDeduction,
      ) ||

    actualNetworkRecoveryPaise !==
      this.toPaise(
        expectedRecovery.networkRecoveryDeduction,
      ) ||

    actualTotalGrossPaise !==
      expectedTotalGrossPaise ||

    actualTotalRecoveryPaise !==
      expectedTotalRecoveryPaise ||

    actualTotalNetPaise !==
      expectedTotalGrossPaise -
        expectedTotalRecoveryPaise
  ) {
    throw new ConflictException(
      'Actual Solar Mitra incentive settlement does not match the approved payroll calculation.',
    );
  }

  return {
    ...directSettlement,
    ...networkSettlement,

    grossTotalIncentiveAmount:
      this.fromPaise(
        actualTotalGrossPaise,
      ),

    recoveryDeductedAmount:
      this.fromPaise(
        actualTotalRecoveryPaise,
      ),

    netTotalIncentiveAmount:
      this.fromPaise(
        actualTotalNetPaise,
      ),

    outstandingRecoveryBefore:
      expectedRecovery.outstandingRecovery,

    outstandingRecoveryAfter:
      expectedRecovery.remainingRecovery,

    settledAt:
      new Date().toISOString(),
  };
}

private async settlePayrollNetworkIncentives(
  manager: EntityManager,
  payroll: StaffPayroll,
  networkPayouts: SolarMitraNetworkPayout[],
  user: any,
  expectedNetworkRecoveryDeduction: string,
) {
  const payoutRepo =
    manager.getRepository(
      SolarMitraNetworkPayout,
    );

  const paidAt = new Date();

  const paidBy = Number(
    user?.id ||
    user?.userId ||
    user?.sub ||
    0,
  );

  const paidByName = String(
    user?.name ||
    user?.email ||
    '',
  ).trim();

  let totalGrossPaise = 0;
  let totalRecoveryPaise = 0;
  let totalNetPaise = 0;

  const sortedPayouts = [
    ...networkPayouts,
  ].sort((a, b) => a.id - b.id);

  for (const payout of sortedPayouts) {
    const settlement =
      await this.applyNetworkRecovery(
        manager,
        payout,
        'PAYROLL',
        user,
        payroll.id,
      );

    totalGrossPaise += this.toPaise(
      settlement.grossAmount,
    );

    totalRecoveryPaise += this.toPaise(
      settlement.recoveryDeductedAmount,
    );

    totalNetPaise += this.toPaise(
      settlement.netPayableAmount,
    );

    payout.status =
      SolarMitraNetworkPayoutStatus.PAID;

    payout.paidAt = paidAt;
    payout.paidBy = paidBy;
    payout.paidByName = paidByName;

    payout.paymentMode = 'PAYROLL';

    payout.paymentReference =
      `PAYROLL-${payroll.id}`;

    payout.settlementType = 'PAYROLL';

    payout.payrollId = payroll.id;

    payout.recoveryDeductedAmount =
      settlement.recoveryDeductedAmount;

    payout.netPaidAmount =
      settlement.netPayableAmount;

    await payoutRepo.save(payout);
  }

  const expectedGrossPaise =
    this.toPaise(
      payroll.solarMitraNetworkIncentiveAmount || 0,
    );

  const expectedRecoveryPaise =
  this.toPaise(
    expectedNetworkRecoveryDeduction,
  );

  if (
    totalGrossPaise !== expectedGrossPaise ||
    totalRecoveryPaise !== expectedRecoveryPaise ||
    totalNetPaise !==
      expectedGrossPaise - expectedRecoveryPaise
  ) {
    throw new ConflictException(
      'Actual network incentive settlement does not match the approved payroll calculation.',
    );
  }

  return {
    networkPayoutsSettled:
      sortedPayouts.length,

    grossNetworkAmount:
      this.fromPaise(totalGrossPaise),

    networkRecoveryDeductedAmount:
  this.fromPaise(totalRecoveryPaise),

    netNetworkAmount:
      this.fromPaise(totalNetPaise),
  };
}

private async settlePayrollDirectIncentives(
  manager: EntityManager,
  payroll: StaffPayroll,
  creatorPayouts: SolarMitraCreatorPayout[],
  projectPayouts: SolarMitraPayout[],
  user: any,
) {
  const paidAt = new Date();

  const paidBy = Number(
    user?.id ||
    user?.userId ||
    user?.sub ||
    0,
  );

  const paidByName = String(
    user?.name ||
    user?.email ||
    '',
  ).trim();

  const beneficiaryUserId = Number(
    payroll.linkedUserId || 0,
  );

  if (
    (
      creatorPayouts.length > 0 ||
      projectPayouts.length > 0
    ) &&
    (
      !Number.isSafeInteger(beneficiaryUserId) ||
      beneficiaryUserId <= 0
    )
  ) {
    throw new ConflictException(
      'Invalid payroll incentive beneficiary',
    );
  }

  const paymentReference =
    `PAYROLL-${payroll.id}`;

  const paymentRemarks =
    `Settled through staff payroll for ${payroll.payrollMonth}`;

  const creatorRepo =
    manager.getRepository(
      SolarMitraCreatorPayout,
    );

  const projectRepo =
    manager.getRepository(
      SolarMitraPayout,
    );

  const referralRepo =
    manager.getRepository(
      SolarMitraReferral,
    );

  let grossCreatorPaise = 0;
  let creatorRecoveryPaise = 0;
  let netCreatorPaise = 0;

  let grossProjectPaise = 0;
  let projectRecoveryPaise = 0;
  let netProjectPaise = 0;

  /*
   * 1. Settle Creator incentives first.
   */

  for (
    const payout of [...creatorPayouts].sort(
      (a, b) => a.id - b.id,
    )
  ) {
    const settlement =
      await this.applyIncentiveRecovery(
        manager,
        {
          category: 'CREATOR',
          payoutId: payout.id,
          beneficiaryUserId,
          payoutAmount: payout.payoutAmount,
        },
        'PAYROLL',
        user,
        payroll.id,
      );

    payout.recoveryDeductedAmount =
      Number(
        settlement.recoveryDeductedAmount,
      );

    payout.netPaidAmount =
      Number(
        settlement.netPayableAmount,
      );

    grossCreatorPaise += this.toPaise(
      settlement.grossAmount,
    );

    creatorRecoveryPaise += this.toPaise(
      settlement.recoveryDeductedAmount,
    );

    netCreatorPaise += this.toPaise(
      settlement.netPayableAmount,
    );

    payout.status =
      SolarMitraCreatorPayoutStatus.PAID;

    payout.paidAt = paidAt;
    payout.paidBy = paidBy;
    payout.paidByName = paidByName;
    payout.paymentMode = 'PAYROLL';
    payout.paymentReference = paymentReference;
    payout.paymentRemarks = paymentRemarks;

    await creatorRepo.save(payout);
  }

  /*
   * 2. Settle direct Project incentives.
   */

  for (
    const payout of [...projectPayouts].sort(
      (a, b) => a.id - b.id,
    )
  ) {
    if (payout.projectId) {
      await this.generateForProject(
        Number(payout.projectId),
        manager,
      );
    }

    const settlement =
      await this.applyIncentiveRecovery(
        manager,
        {
          category: 'PROJECT',
          payoutId: payout.id,
          beneficiaryUserId,
          payoutAmount: payout.payoutAmount,
        },
        'PAYROLL',
        user,
        payroll.id,
      );

    payout.recoveryDeductedAmount =
      Number(
        settlement.recoveryDeductedAmount,
      );

    payout.netPaidAmount =
      Number(
        settlement.netPayableAmount,
      );

    grossProjectPaise += this.toPaise(
      settlement.grossAmount,
    );

    projectRecoveryPaise += this.toPaise(
      settlement.recoveryDeductedAmount,
    );

    netProjectPaise += this.toPaise(
      settlement.netPayableAmount,
    );

    payout.status =
      SolarMitraPayoutStatus.PAID;

    payout.paidAt = paidAt;
    payout.paidBy = paidBy;
    payout.paidByName = paidByName;
    payout.paymentMode = 'PAYROLL';
    payout.paymentReference = paymentReference;
    payout.paymentRemarks = paymentRemarks;

    await projectRepo.save(payout);

    await referralRepo.update(
      {
        id: payout.referralId,
        isHidden: false,
      },
      {
        status:
          SolarMitraReferralStatus.PAYOUT_PAID,
      },
    );
  }

  return {
    creatorPayoutsSettled:
      creatorPayouts.length,

    projectPayoutsSettled:
      projectPayouts.length,

    grossCreatorAmount:
      this.fromPaise(grossCreatorPaise),

    creatorRecoveryDeductedAmount:
      this.fromPaise(creatorRecoveryPaise),

    netCreatorAmount:
      this.fromPaise(netCreatorPaise),

    grossProjectAmount:
      this.fromPaise(grossProjectPaise),

    projectRecoveryDeductedAmount:
      this.fromPaise(projectRecoveryPaise),

    netProjectAmount:
      this.fromPaise(netProjectPaise),

    directRecoveryDeductedAmount:
      this.fromPaise(
        creatorRecoveryPaise +
        projectRecoveryPaise,
      ),

    netDirectIncentiveAmount:
      this.fromPaise(
        netCreatorPaise +
        netProjectPaise,
      ),
  };
}

async releasePayrollIncentives(
  manager: EntityManager,
  payroll: StaffPayroll,
) {
  await this.lockNetworkFinancialOperations(
    manager,
  );

  if (
    payroll.status === StaffPayrollStatus.PAID
  ) {
    throw new ConflictException(
      'Paid payroll incentives cannot be released',
    );
  }

  const creatorResult = await manager
    .getRepository(SolarMitraCreatorPayout)
    .createQueryBuilder()
    .update(SolarMitraCreatorPayout)
    .set({
      payrollId: null,
      payrollReservedAt: null,
    })
    .where('"payrollId" = :payrollId', {
      payrollId: payroll.id,
    })
    .andWhere('status IN (:...statuses)', {
      statuses: [
        SolarMitraCreatorPayoutStatus.ELIGIBLE,
        SolarMitraCreatorPayoutStatus.CANCELLED,
      ],
    })
    .execute();

  const projectResult = await manager
    .getRepository(SolarMitraPayout)
    .createQueryBuilder()
    .update(SolarMitraPayout)
    .set({
      payrollId: null,
      payrollReservedAt: null,
    })
    .where('"payrollId" = :payrollId', {
      payrollId: payroll.id,
    })
    .andWhere('status IN (:...statuses)', {
      statuses: [
        SolarMitraPayoutStatus.ELIGIBLE,
        SolarMitraPayoutStatus.CANCELLED,
      ],
    })
    .execute();

  const networkResult = await manager
    .getRepository(SolarMitraNetworkPayout)
    .createQueryBuilder()
    .update(SolarMitraNetworkPayout)
    .set({
      payrollId: null,
      payrollReservedAt: null,
    })
    .where('"payrollId" = :payrollId', {
      payrollId: payroll.id,
    })
    .andWhere('status IN (:...statuses)', {
      statuses: [
        SolarMitraNetworkPayoutStatus.APPROVED,
        SolarMitraNetworkPayoutStatus.CANCELLED,
      ],
    })
    .andWhere('"paidAt" IS NULL')
    .andWhere('"settlementType" IS NULL')
    .execute();

  return {
    creatorReleased:
      creatorResult.affected || 0,

    projectReleased:
      projectResult.affected || 0,

    networkReleased:
      networkResult.affected || 0,
  };
}

async reservePayrollIncentives(
  manager: EntityManager,
  payroll: StaffPayroll,
) {
  const emptyResult = {
    creatorAmount: '0.00',
    projectAmount: '0.00',
    networkAmount: '0.00',
    creatorPayoutIds: [] as number[],
    projectPayoutIds: [] as number[],
    networkPayoutIds: [] as number[],
  };

    /*
   * Keep Solar Mitra payroll incentive integration
   * disabled until production activation.
   */
  if (
    process.env.SOLAR_MITRA_NETWORK_ENABLED !== 'true'
  ) {
    return emptyResult;
  }

  const userId = Number(
    payroll.linkedUserId || 0,
  );

  if (!userId) {
    return emptyResult;
  }

  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    !payroll.id ||
    payroll.isHidden ||
    payroll.status !==
      StaffPayrollStatus.GENERATED
  ) {
    throw new ConflictException(
      'Invalid payroll for Solar Mitra incentive reservation',
    );
  }

  const month = String(
    payroll.payrollMonth || '',
  );

  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
  ) {
    throw new ConflictException(
      'Invalid payroll month',
    );
  }

  const [year, monthNumber] =
    month.split('-').map(Number);

  const cutoff = new Date(
    Date.UTC(year, monthNumber, 1) -
      330 * 60 * 1000,
  );

  const reservedAt = new Date();

  await this.lockNetworkFinancialOperations(
    manager,
  );

  await this.lockNetworkBeneficiary(
    manager,
    userId,
  );

  /*
   * Creator incentives
   */
  const creatorPayouts = await manager
  .getRepository(SolarMitraCreatorPayout)
  .createQueryBuilder('p')
  .where('p.creatorId = :userId', {
    userId,
  })
  .andWhere('p.status = :status', {
    status:
      SolarMitraCreatorPayoutStatus.ELIGIBLE,
  })
  .andWhere('p.payrollId IS NULL')
  .andWhere('p."paidAt" IS NULL')
  .andWhere('p.eligibleAt < :cutoff', {
    cutoff,
  })
  .andWhere(
    `EXISTS (
      SELECT 1
      FROM public.solar_mitra sm
      WHERE sm.id = p."solarMitraId"
        AND sm."createdBy" = p."creatorId"
        AND sm.status = 'ACTIVE'
        AND sm."isHidden" = false
        AND sm."posterVerificationStatus" = 'ATTACHED'
        AND COALESCE(sm."createdByRole", '') <> 'SOLAR_MITRA_ASSISTANT'
    )`,
  )
  .andWhere(
    `EXISTS (
      SELECT 1
      FROM public."user" u
      WHERE u.id = p."creatorId"
        AND NOT (
          'SOLAR_MITRA_ASSISTANT' = ANY(
            string_to_array(
              COALESCE(u.roles, ''),
              ','
            )
          )
        )
    )`,
  )
  .orderBy('p.id', 'ASC')
  .setLock('pessimistic_write')
  .getMany();

  /*
   * Direct project incentives
   */
  const projectPayouts = await manager
    .getRepository(SolarMitraPayout)
    .createQueryBuilder('p')
    .where(
      `EXISTS (
        SELECT 1
        FROM public.solar_mitra sm
        WHERE sm.id = p."solarMitraId"
        AND sm."linkedUserId" = :userId
      )`,
      { userId },
    )
    .andWhere('p.status = :status', {
      status:
        SolarMitraPayoutStatus.ELIGIBLE,
    })
    .andWhere(
  (qb) => {
    const projectQuery = qb
      .subQuery()
      .select('1')
      .from(Project, 'pr')
      .where('pr.id = p."projectId"')
      .andWhere(
  'pr.status NOT IN (:...excludedProjectStatuses)',
)
      .andWhere(
        'pr.ownerApprovalStatus = :approvedProjectStatus',
      )
      .getQuery();

    return `EXISTS ${projectQuery}`;
  },
)
.setParameters({
  excludedProjectStatuses: [
  ProjectStatus.CANCELLED,
  ProjectStatus.REJECTED,
],

  approvedProjectStatus:
    ProjectApprovalStatus.APPROVED,
})
    .andWhere('p.payrollId IS NULL')
    .andWhere('p.eligibleAt < :cutoff', {
      cutoff,
    })
    .orderBy('p.id', 'ASC')
    .setLock('pessimistic_write')
    .getMany();

  /*
   * Approved network incentives
   */
  const networkPayouts = await manager
    .getRepository(SolarMitraNetworkPayout)
    .createQueryBuilder('p')
    .where(
      'p.beneficiaryUserId = :userId',
      { userId },
    )
    .andWhere('p.status = :status', {
      status:
        SolarMitraNetworkPayoutStatus.APPROVED,
    })
    .andWhere('p.payrollId IS NULL')
    .andWhere('p.settlementType IS NULL')
    .andWhere('p.paidAt IS NULL')
    .andWhere('p.eligibleAt < :cutoff', {
      cutoff,
    })
    .andWhere(
  `EXISTS (
    SELECT 1
    FROM public.solar_mitra_network_pool pool
    INNER JOIN public.project pr
      ON pr.id = pool."projectId"
    WHERE pool.id = p."poolId"
      AND pool.status = 'GENERATED'
      AND pool."projectId" = p."projectId"
      AND pr.status NOT IN (
        'CANCELLED',
        'REJECTED'
      )
      AND pr."ownerApprovalStatus" = 'APPROVED'
  )`,
)
    .orderBy('p.id', 'ASC')
    .setLock('pessimistic_write')
    .getMany();

  let creatorPaise = 0;
  let projectPaise = 0;
  let networkPaise = 0;

  for (const payout of creatorPayouts) {
    payout.payrollId = payroll.id;
    payout.payrollReservedAt = reservedAt;

    creatorPaise += this.toPaise(
      payout.payoutAmount,
    );
  }

  for (const payout of projectPayouts) {
    payout.payrollId = payroll.id;
    payout.payrollReservedAt = reservedAt;

    projectPaise += this.toPaise(
      payout.payoutAmount,
    );
  }

  for (const payout of networkPayouts) {
    payout.payrollId = payroll.id;
    payout.payrollReservedAt = reservedAt;

    networkPaise += this.toPaise(
      payout.payoutAmount,
    );
  }

  if (creatorPayouts.length) {
    await manager.save(
      SolarMitraCreatorPayout,
      creatorPayouts,
    );
  }

  if (projectPayouts.length) {
    await manager.save(
      SolarMitraPayout,
      projectPayouts,
    );
  }

  if (networkPayouts.length) {
    await manager.save(
      SolarMitraNetworkPayout,
      networkPayouts,
    );
  }

  return {
    creatorAmount:
      this.fromPaise(creatorPaise),

    projectAmount:
      this.fromPaise(projectPaise),

    networkAmount:
      this.fromPaise(networkPaise),

    creatorPayoutIds:
      creatorPayouts.map((p) => p.id),

    projectPayoutIds:
      projectPayouts.map((p) => p.id),

    networkPayoutIds:
      networkPayouts.map((p) => p.id),
  };
}

async lockNetworkFinancialOperations(
  manager: EntityManager,
): Promise<void> {
  await manager.query(
    `
    SELECT pg_advisory_xact_lock(
      $1::integer,
      $2::integer
    )
    `,
    [
      72611002,
      0,
    ],
  );
}

  private async lockNetworkBeneficiary(
  manager: EntityManager,
  beneficiaryUserId: number,
): Promise<void> {
  const normalizedUserId =
    Number(beneficiaryUserId);

  if (
    !Number.isSafeInteger(normalizedUserId) ||
    normalizedUserId <= 0 ||
    normalizedUserId > 2147483647
  ) {
    throw new ConflictException(
      'Invalid network beneficiary ID',
    );
  }

  await manager.query(
    `
    SELECT pg_advisory_xact_lock(
      $1::integer,
      $2::integer
    )
    `,
    [
      72611002,
      normalizedUserId,
    ],
  );
}

  private async applyNetworkRecovery(
  manager: EntityManager,
  settlementPayout: SolarMitraNetworkPayout,
  settlementType: 'MANUAL' | 'PAYROLL',
  user: any,
  payrollId: number | null = null,
) {
  return this.applyIncentiveRecovery(
    manager,
    {
      category: 'NETWORK',
      payoutId: settlementPayout.id,
      beneficiaryUserId:
        settlementPayout.beneficiaryUserId,
      payoutAmount: settlementPayout.payoutAmount,
    },
    settlementType,
    user,
    payrollId,
  );
}

async applyIncentiveRecovery(
  manager: EntityManager,
  settlement: {
    category: 'CREATOR' | 'PROJECT' | 'NETWORK';
    payoutId: number;
    beneficiaryUserId: number;
    payoutAmount: number | string;
  },
  settlementType: 'MANUAL' | 'PAYROLL',
  user: any,
  payrollId: number | null = null,
) {
  await this.lockNetworkFinancialOperations(manager);

  const beneficiaryUserId =
    Number(settlement.beneficiaryUserId);

  if (
    !Number.isSafeInteger(beneficiaryUserId) ||
    beneficiaryUserId <= 0
  ) {
    throw new ConflictException(
      'Invalid incentive beneficiary',
    );
  }

  const networkRepository =
    manager.getRepository(
      SolarMitraNetworkPayout,
    );

  const projectRepository =
    manager.getRepository(
      SolarMitraPayout,
    );

  const recoveryRepository =
    manager.getRepository(
      SolarMitraNetworkRecovery,
    );

  const originalPaise =
    this.toPaise(settlement.payoutAmount);

  let availablePaise = originalPaise;
  let totalDeductedPaise = 0;

  const networkRecoveries =
    await networkRepository
      .createQueryBuilder('p')
      .where(
        'p."beneficiaryUserId" = :userId',
        { userId: beneficiaryUserId },
      )
      .andWhere(
        'p.status = :status',
        {
          status:
            SolarMitraNetworkPayoutStatus.RECOVERY_PENDING,
        },
      )
      .orderBy('p.id', 'ASC')
      .setLock('pessimistic_write')
      .getMany();

  const projectRecoveries =
    await projectRepository
      .createQueryBuilder('p')
      .where(
        'p.status = :status',
        {
          status:
            SolarMitraPayoutStatus.RECOVERY_PENDING,
        },
      )
      .andWhere(
        `EXISTS (
          SELECT 1
          FROM solar_mitra sm
          WHERE sm.id = p."solarMitraId"
          AND sm."linkedUserId" = :userId
        )`,
        { userId: beneficiaryUserId },
      )
      .orderBy('p.id', 'ASC')
      .setLock('pessimistic_write')
      .getMany();

  const recoveries: (
    | {
        category: 'NETWORK';
        payout: SolarMitraNetworkPayout;
      }
    | {
        category: 'PROJECT';
        payout: SolarMitraPayout;
      }
  )[] = [
    ...networkRecoveries.map((payout) => ({
      category: 'NETWORK' as const,
      payout,
    })),
    ...projectRecoveries.map((payout) => ({
      category: 'PROJECT' as const,
      payout,
    })),
  ];

  recoveries.sort((a, b) => {
    const aTime = a.payout.cancelledAt
      ? new Date(a.payout.cancelledAt).getTime()
      : Number.MAX_SAFE_INTEGER;

    const bTime = b.payout.cancelledAt
      ? new Date(b.payout.cancelledAt).getTime()
      : Number.MAX_SAFE_INTEGER;

    return (
      aTime - bTime ||
      a.category.localeCompare(b.category) ||
      a.payout.id - b.payout.id
    );
  });

  const processedBy =
    Number(
      user?.id ||
      user?.userId ||
      user?.sub ||
      0,
    ) || null;

  const processedByName =
    String(
      user?.name ||
      user?.email ||
      '',
    ).trim() || null;

  const deductions: {
    recoveryCategory: 'PROJECT' | 'NETWORK';
    recoveryPayoutId: number;
    recoveredAmount: string;
    outstandingAfter: string;
  }[] = [];

  for (const recovery of recoveries) {
    if (availablePaise <= 0) {
      break;
    }

    const recoveryPayout = recovery.payout;

    if (
      recovery.category === settlement.category &&
      recoveryPayout.id === settlement.payoutId
    ) {
      continue;
    }

    const recoveryPaise =
      this.toPaise(
        recoveryPayout.recoveryAmount,
      );

    const alreadyRecoveredPaise =
      this.toPaise(
        recoveryPayout.recoveredAmount,
      );

    const outstandingPaise =
      recoveryPaise - alreadyRecoveredPaise;

    if (outstandingPaise <= 0) {
      continue;
    }

    const deductionPaise = Math.min(
      availablePaise,
      outstandingPaise,
    );

    const outstandingAfterPaise =
      outstandingPaise - deductionPaise;

    const updatedRecoveredAmount =
      this.fromPaise(
        alreadyRecoveredPaise + deductionPaise,
      );

    if (recovery.category === 'NETWORK') {
      recovery.payout.recoveredAmount =
        updatedRecoveredAmount;

      if (outstandingAfterPaise === 0) {
        recovery.payout.status =
          SolarMitraNetworkPayoutStatus.RECOVERED;

        recovery.payout.recoveredAt =
          new Date();
      }

      await networkRepository.save(
        recovery.payout,
      );
    } else {
      recovery.payout.recoveredAmount =
        Number(updatedRecoveredAmount);

      if (outstandingAfterPaise === 0) {
        recovery.payout.status =
          SolarMitraPayoutStatus.RECOVERED;

        recovery.payout.recoveredAt =
          new Date();
      }

      await projectRepository.save(
        recovery.payout,
      );
    }

    const recoveryRecord =
      recoveryRepository.create({
        beneficiaryUserId,

        recoveryCategory:
          recovery.category,

        recoveryPayoutId:
          recoveryPayout.id,

        settlementCategory:
          settlement.category,

        settlementPayoutId:
          settlement.payoutId,

        recoveredAmount:
          this.fromPaise(deductionPaise),

        outstandingBefore:
          this.fromPaise(outstandingPaise),

        outstandingAfter:
          this.fromPaise(outstandingAfterPaise),

        settlementType,

        payrollId,

        processedBy,

        processedByName,

        remarks:
          `Recovery against ${settlement.category} payout #${settlement.payoutId}`,
      });

    await recoveryRepository.save(
      recoveryRecord,
    );

    availablePaise -= deductionPaise;

    totalDeductedPaise += deductionPaise;

    deductions.push({
      recoveryCategory:
        recovery.category,

      recoveryPayoutId:
        recoveryPayout.id,

      recoveredAmount:
        this.fromPaise(deductionPaise),

      outstandingAfter:
        this.fromPaise(outstandingAfterPaise),
    });
  }

  return {
    grossAmount:
      this.fromPaise(originalPaise),

    recoveryDeductedAmount:
      this.fromPaise(totalDeductedPaise),

    netPayableAmount:
      this.fromPaise(availablePaise),

    deductions,
  };
}

private async assertNetworkProjectStillValid(
  manager: EntityManager,
  pool: SolarMitraNetworkPool,
  payout: SolarMitraNetworkPayout,
): Promise<void> {
  if (
    Number(pool.id) !== Number(payout.poolId) ||
    Number(pool.projectId) !==
      Number(payout.projectId) ||
    pool.status !==
      SolarMitraNetworkPoolStatus.GENERATED
  ) {
    throw new ConflictException(
      `Network incentive #${payout.id} has an invalid or inactive pool`,
    );
  }

  const project = await manager.findOne(
    Project,
    {
      where: {
        id: Number(payout.projectId),
      },
    },
  );

  if (
    !project ||
    project.status === ProjectStatus.CANCELLED ||
    project.status === ProjectStatus.REJECTED ||
    project.ownerApprovalStatus !==
      ProjectApprovalStatus.APPROVED
  ) {
    throw new ConflictException(
      `Network incentive #${payout.id} cannot be processed because the associated Project is missing, cancelled, rejected or not approved`,
    );
  }
}

  async bulkApproveNetworkPayouts(
  payoutIds: number[],
  user: any,
) {
  if (
    !Array.isArray(payoutIds) ||
    payoutIds.length === 0
  ) {
    throw new ConflictException(
      'Select at least one network payout',
    );
  }

  const normalizedIds = [
    ...new Set(
      payoutIds.map((id) => Number(id)),
    ),
  ].sort((a, b) => a - b);

  if (
    normalizedIds.some(
      (id) =>
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        id > 2147483647,
    )
  ) {
    throw new ConflictException(
      'Invalid network payout IDs',
    );
  }

  if (normalizedIds.length > 500) {
    throw new ConflictException(
      'Maximum 500 payouts can be approved at once',
    );
  }

  const approverId = Number(
    user?.id ||
    user?.userId ||
    user?.sub ||
    0,
  );

  if (
    !Number.isSafeInteger(approverId) ||
    approverId <= 0
  ) {
    throw new ConflictException(
      'Invalid approver ID',
    );
  }

  const approverName =
    String(
      user?.name ||
      user?.email ||
      '',
    ).trim() || null;

  return this.dataSource.transaction(
  async (manager) => {
    await this.lockNetworkFinancialOperations(
      manager,
    );

    const payoutRepository =
        manager.getRepository(
          SolarMitraNetworkPayout,
        );

      const poolRepository =
        manager.getRepository(
          SolarMitraNetworkPool,
        );

      const existingPayouts =
        await payoutRepository
          .createQueryBuilder('p')
          .where(
            'p.id IN (:...ids)',
            { ids: normalizedIds },
          )
          .getMany();

      if (
        existingPayouts.length !==
        normalizedIds.length
      ) {
        throw new ConflictException(
          'One or more network payouts were not found',
        );
      }

      const poolIds = [
        ...new Set(
          existingPayouts.map(
            (payout) => payout.poolId,
          ),
        ),
      ].sort((a, b) => a - b);

      const pools =
        await poolRepository
          .createQueryBuilder('pool')
          .where(
            'pool.id IN (:...ids)',
            { ids: poolIds },
          )
          .orderBy('pool.id', 'ASC')
          .setLock('pessimistic_write')
          .getMany();

      if (
        pools.length !== poolIds.length ||
        pools.some(
          (pool) =>
            pool.status !==
            SolarMitraNetworkPoolStatus.GENERATED,
        )
      ) {
        throw new ConflictException(
          'One or more network incentive pools are not active',
        );
      }

      const payouts =
        await payoutRepository
          .createQueryBuilder('p')
          .where(
            'p.id IN (:...ids)',
            { ids: normalizedIds },
          )
          .orderBy('p.id', 'ASC')
          .setLock('pessimistic_write')
          .getMany();

      if (
        payouts.length !==
        normalizedIds.length
      ) {
        throw new ConflictException(
          'One or more network payouts were not found',
        );
      }

      const poolsById = new Map(
  pools.map((pool) => [
    Number(pool.id),
    pool,
  ]),
);

for (const payout of payouts) {
  const pool = poolsById.get(
    Number(payout.poolId),
  );

  if (!pool) {
    throw new ConflictException(
      `Network incentive #${payout.id} has no valid pool`,
    );
  }

  await this.assertNetworkProjectStillValid(
    manager,
    pool,
    payout,
  );
}

      const invalidPayouts =
        payouts.filter(
          (payout) =>
            payout.status !==
            SolarMitraNetworkPayoutStatus.PENDING_APPROVAL,
        );

      if (invalidPayouts.length > 0) {
        throw new ConflictException(
          `Payouts not pending approval: ${
            invalidPayouts
              .map((payout) => payout.id)
              .join(', ')
          }`,
        );
      }

      const approvedAt = new Date();

      let totalApprovedPaise = 0;

      for (const payout of payouts) {
        payout.status =
          SolarMitraNetworkPayoutStatus.APPROVED;

        payout.approvedAt = approvedAt;
        payout.approvedBy = approverId;
        payout.approvedByName = approverName;

        totalApprovedPaise +=
          this.toPaise(payout.payoutAmount);
      }

      await payoutRepository.save(payouts);

      return {
        success: true,

        message:
          'Network incentives approved successfully',

        approvedCount: payouts.length,

        totalApprovedAmount:
          this.fromPaise(totalApprovedPaise),

        approvedPayoutIds:
          payouts.map((payout) => payout.id),

        approvedAt,
      };
    },
  );
}

  async approveNetworkPayout(
  payoutId: number,
  user: any,
) {
  const normalizedPayoutId = Number(payoutId);

  const approverId = Number(
    user?.id ||
    user?.userId ||
    user?.sub ||
    0,
  );

  if (
    !Number.isSafeInteger(normalizedPayoutId) ||
    normalizedPayoutId <= 0
  ) {
    throw new ConflictException(
      'Invalid network payout ID',
    );
  }

  if (
    !Number.isSafeInteger(approverId) ||
    approverId <= 0
  ) {
    throw new ConflictException(
      'Invalid approver ID',
    );
  }

  return this.dataSource.transaction(
  async (manager) => {
    await this.lockNetworkFinancialOperations(
      manager,
    );

    const payoutRepository =
        manager.getRepository(
          SolarMitraNetworkPayout,
        );

      const poolRepository =
        manager.getRepository(
          SolarMitraNetworkPool,
        );

      const existingPayout =
        await payoutRepository.findOne({
          where: {
            id: normalizedPayoutId,
          },
        });

      if (!existingPayout) {
        throw new ConflictException(
          'Network payout not found',
        );
      }

      const pool =
        await poolRepository.findOne({
          where: {
            id: existingPayout.poolId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (
        !pool ||
        pool.status !==
          SolarMitraNetworkPoolStatus.GENERATED
      ) {
        throw new ConflictException(
          'Network incentive pool is not active',
        );
      }

      const payout =
        await payoutRepository.findOne({
          where: {
            id: normalizedPayoutId,
            poolId: pool.id,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (!payout) {
        throw new ConflictException(
          'Network payout not found',
        );
      }

      await this.assertNetworkProjectStillValid(
  manager,
  pool,
  payout,
);

      if (
        payout.status !==
        SolarMitraNetworkPayoutStatus.PENDING_APPROVAL
      ) {
        throw new ConflictException(
          `Network payout cannot be approved in ${payout.status} status`,
        );
      }

      payout.status =
        SolarMitraNetworkPayoutStatus.APPROVED;

      payout.approvedAt = new Date();

      payout.approvedBy = approverId;

      payout.approvedByName =
        String(
          user?.name ||
          user?.email ||
          '',
        ).trim() || null;

      const savedPayout =
        await payoutRepository.save(payout);

      return {
        success: true,
        message:
          'Network incentive approved successfully',
        payout: savedPayout,
      };
    },
  );
}

  async getNetworkManagementPayouts(
  query: any = {},
) {
  const requestedPage = Number(query?.page);
  const requestedLimit = Number(query?.limit);

  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const limit =
    Number.isSafeInteger(requestedLimit) &&
    requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 20;

  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    throw new ConflictException(
      'Invalid pagination',
    );
  }

  const conditions: string[] = [];
  const parameters: any[] = [];

  const addCondition = (
    expression: string,
    value: any,
  ) => {
    parameters.push(value);

    conditions.push(
      expression.replace(
        '?',
        `$${parameters.length}`,
      ),
    );
  };

  const status = String(
    query?.status || '',
  ).trim().toUpperCase();

  const allowedStatuses = [
    'PENDING_APPROVAL',
    'APPROVED',
    'PAID',
    'RETAINED',
    'CANCELLED',
    'RECOVERY_PENDING',
    'RECOVERED',
  ];

  if (status && status !== 'ALL') {
    if (!allowedStatuses.includes(status)) {
      throw new ConflictException(
        'Invalid network payout status',
      );
    }

    addCondition(
      'p.status::text = ?',
      status,
    );
  }

  const idFilters = [
    ['projectId', 'p."projectId"'],
    ['beneficiaryUserId', 'p."beneficiaryUserId"'],
    ['sourceSolarMitraId', 'p."sourceSolarMitraId"'],
    ['poolId', 'p."poolId"'],
  ];

  for (const [key, column] of idFilters) {
    const value = query?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      const id = Number(value);

      if (
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        id > 2147483647
      ) {
        throw new ConflictException(
          `Invalid ${key}`,
        );
      }

      addCondition(
        `${column} = ?`,
        id,
      );
    }
  }

  const beneficiaryRole = String(
    query?.beneficiaryRole || '',
  ).trim().toUpperCase();

  if (
    beneficiaryRole &&
    beneficiaryRole !== 'ALL'
  ) {
    addCondition(
      'p."beneficiaryRole" = ?',
      beneficiaryRole,
    );
  }

  const month = String(
    query?.month || '',
  ).trim();

  if (month && month !== 'ALL') {
    if (
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
      Number(month.slice(0, 4)) < 1
    ) {
      throw new ConflictException(
        'Invalid month. Use YYYY-MM',
      );
    }

    parameters.push(`${month}-01`);

    const monthParameter =
      `$${parameters.length}`;

    conditions.push(`
      p."eligibleAt" >= (
        (${monthParameter}::date::timestamp
          AT TIME ZONE 'Asia/Kolkata')
          AT TIME ZONE 'UTC'
      )
      AND p."eligibleAt" < (
        (
          (
            ${monthParameter}::date
            + INTERVAL '1 month'
          ) AT TIME ZONE 'Asia/Kolkata'
        ) AT TIME ZONE 'UTC'
      )
    `);
  }

  const search = String(
    query?.search || '',
  ).trim();

  if (search) {
    if (search.length > 200) {
      throw new ConflictException(
        'Search text is too long',
      );
    }

    parameters.push(`%${search}%`);

    const searchParameter =
      `$${parameters.length}`;

    conditions.push(`
      (
        p."beneficiaryName"
          ILIKE ${searchParameter}

        OR p."sourceSolarMitraName"
          ILIKE ${searchParameter}

        OR d."customerName"
          ILIKE ${searchParameter}

        OR p."projectId"::text
          ILIKE ${searchParameter}

        OR p."beneficiaryUserId"::text
          ILIKE ${searchParameter}

        OR p."sourceSolarMitraId"::text
          ILIKE ${searchParameter}
      )
    `);
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

  const fromClause = `
    FROM public.solar_mitra_network_payout p

    INNER JOIN public.solar_mitra_network_pool pool
      ON pool.id = p."poolId"

    LEFT JOIN public.solar_mitra_payout d
      ON d.id = pool."directPayoutId"
  `;

  const summaryRows =
    await this.dataSource.query(
      `
      SELECT
        COUNT(*)::int AS total,

        COALESCE(
          SUM(p."payoutAmount"),
          0
        )::text AS "totalAmount",

        COALESCE(
          SUM(
            GREATEST(
              p."recoveryAmount" -
              p."recoveredAmount",
              0
            )
          ) FILTER (
            WHERE p.status = 'RECOVERY_PENDING'
          ),
          0
        )::text AS "outstandingRecovery"

      ${fromClause}

      ${whereClause}
      `,
      parameters,
    );

  const rows =
    await this.dataSource.query(
      `
      SELECT
        p.*,

        d."customerName",

        pool."poolAmount",
        pool."totalUplineCount",
        pool."eligibleUplineCount",
        pool."inactiveUplineCount",
        pool."distributableAmount",
        pool."retainedAmount",

        pool.status AS "poolStatus",

        GREATEST(
          p."recoveryAmount" -
          p."recoveredAmount",
          0
        ) AS "outstandingRecovery"

      ${fromClause}

      ${whereClause}

      ORDER BY
        p."eligibleAt" DESC,
        p.id DESC

      LIMIT $${parameters.length + 1}
      OFFSET $${parameters.length + 2}
      `,
      [
        ...parameters,
        limit,
        offset,
      ],
    );

  const summary = summaryRows[0] || {};

  const total = Number(
    summary.total || 0,
  );

  return {
    data: rows,

    total,
    page,
    limit,

    totalPages:
      Math.ceil(total / limit),

    summary: {
      totalAmount:
        Number(summary.totalAmount || 0),

      outstandingRecovery:
        Number(
          summary.outstandingRecovery || 0,
        ),
    },
  };
}

  async getNetworkManagementSummary() {
  const [hierarchyRows, poolRows, payoutRows] =
    await Promise.all([
      this.dataSource.query(`
        SELECT
          COUNT(*)::int AS "totalSolarMitras",

          COUNT(*) FILTER (
            WHERE m."createdBy" IS NOT NULL
          )::int AS "assignedCreators",

          COUNT(*) FILTER (
            WHERE m."createdBy" IS NULL
          )::int AS "missingCreators",

          COUNT(*) FILTER (
            WHERE parent.id IS NOT NULL
          )::int AS "createdBySolarMitras",

          COUNT(*) FILTER (
            WHERE m.status = 'ACTIVE'
            AND m."isHidden" = false
            AND u.id IS NOT NULL
            AND u."isHidden" = false
          )::int AS "activeSolarMitras"

        FROM public.solar_mitra m

        LEFT JOIN public."user" u
          ON u.id = m."linkedUserId"

        LEFT JOIN public.solar_mitra parent
          ON parent."linkedUserId" = m."createdBy"
      `),

      this.dataSource.query(`
        SELECT
          COUNT(*)::int AS "totalPools",

          COUNT(*) FILTER (
            WHERE status = 'GENERATED'
          )::int AS "activePools",

          COUNT(*) FILTER (
            WHERE status = 'CANCELLED'
          )::int AS "cancelledPools",

          COALESCE(
            SUM("poolAmount") FILTER (
              WHERE status = 'GENERATED'
            ),
            0
          )::text AS "totalPoolAmount",

          COALESCE(
            SUM("distributableAmount") FILTER (
              WHERE status = 'GENERATED'
            ),
            0
          )::text AS "distributableAmount",

          COALESCE(
            SUM("retainedAmount") FILTER (
              WHERE status = 'GENERATED'
            ),
            0
          )::text AS "retainedAmount"

        FROM public.solar_mitra_network_pool
      `),

      this.dataSource.query(`
        SELECT
          status::text AS status,
          COUNT(*)::int AS count,

          COALESCE(
            SUM("payoutAmount"),
            0
          )::text AS amount,

          COALESCE(
  SUM("payoutAmount")
    FILTER (WHERE "paidAt" IS NOT NULL),
  0
)::text AS "grossSettledAmount",

COALESCE(
  SUM(COALESCE("netPaidAmount", "payoutAmount"))
    FILTER (WHERE "paidAt" IS NOT NULL),
  0
)::text AS "netPaidAmount",

COALESCE(
  SUM("recoveryDeductedAmount")
    FILTER (WHERE "paidAt" IS NOT NULL),
  0
)::text AS "recoveryDeductedAmount",

COALESCE(
  SUM("recoveredAmount"),
  0
)::text AS "recoveredAmount",

          COALESCE(
            SUM(
              GREATEST(
                "recoveryAmount" -
                "recoveredAmount",
                0
              )
            ),
            0
          )::text AS "outstandingRecovery"

        FROM public.solar_mitra_network_payout

        GROUP BY status
      `),
    ]);

  const hierarchy = hierarchyRows[0] || {};
  const pools = poolRows[0] || {};

  const getFinancialTotal = (
  field:
    | 'grossSettledAmount'
    | 'netPaidAmount'
    | 'recoveryDeductedAmount'
    | 'recoveredAmount',
): number => {
  const totalPaise = payoutRows.reduce(
    (total: number, row: any) =>
      total + this.toPaise(row[field] || 0),
    0,
  );

  return Number(this.fromPaise(totalPaise));
};

  const getStatus = (status: string) => {
    const row = payoutRows.find(
      (item: any) =>
        item.status === status,
    );

    return {
      count: Number(row?.count || 0),
      amount: Number(row?.amount || 0),
    };
  };

  const totalSolarMitras = Number(
    hierarchy.totalSolarMitras || 0,
  );

  const activeSolarMitras = Number(
    hierarchy.activeSolarMitras || 0,
  );

  const recoveryPending = payoutRows.find(
    (item: any) =>
      item.status === 'RECOVERY_PENDING',
  );

  return {
    hierarchy: {
      totalSolarMitras,

      activeSolarMitras,

      inactiveSolarMitras:
        totalSolarMitras - activeSolarMitras,

      assignedCreators:
        Number(hierarchy.assignedCreators || 0),

      missingCreators:
        Number(hierarchy.missingCreators || 0),

      createdBySolarMitras:
        Number(
          hierarchy.createdBySolarMitras || 0,
        ),
    },

    pools: {
      totalPools:
        Number(pools.totalPools || 0),

      activePools:
        Number(pools.activePools || 0),

      cancelledPools:
        Number(pools.cancelledPools || 0),

      totalPoolAmount:
        Number(pools.totalPoolAmount || 0),

      distributableAmount:
        Number(pools.distributableAmount || 0),

      retainedAmount:
        Number(pools.retainedAmount || 0),
    },

    payouts: {
      pendingApproval:
        getStatus('PENDING_APPROVAL'),

      approved:
        getStatus('APPROVED'),

      paid:
        getStatus('PAID'),

      retained:
        getStatus('RETAINED'),

      cancelled:
        getStatus('CANCELLED'),

      recoveryPending:
        getStatus('RECOVERY_PENDING'),

      recovered:
        getStatus('RECOVERED'),

        grossSettledAmount:
  getFinancialTotal('grossSettledAmount'),

netPaidAmount:
  getFinancialTotal('netPaidAmount'),

recoveryDeductedAmount:
  getFinancialTotal('recoveryDeductedAmount'),

recoveredAmount:
  getFinancialTotal('recoveredAmount'),

      outstandingRecovery:
        Number(
          recoveryPending?.outstandingRecovery || 0,
        ),
    },
  };
}

  async getMyNetworkPayouts(
  userId: number,
  query: any = {},
) {
  const normalizedUserId = Number(userId);

  if (
    !Number.isSafeInteger(normalizedUserId) ||
    normalizedUserId <= 0
  ) {
    throw new ConflictException(
      'Valid user ID is required',
    );
  }

  const requestedPage = Number(query?.page);
  const requestedLimit = Number(query?.limit);

  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const limit =
    Number.isSafeInteger(requestedLimit) &&
    requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 20;

  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    throw new ConflictException(
      'Invalid pagination',
    );
  }

  const status = String(
    query?.status || '',
  ).trim().toUpperCase();

  const allowedStatuses = [
    'PENDING_APPROVAL',
    'APPROVED',
    'PAID',
    'CANCELLED',
    'RECOVERY_PENDING',
    'RECOVERED',
  ];

  if (
    status &&
    !allowedStatuses.includes(status)
  ) {
    throw new ConflictException(
      'Invalid network payout status',
    );
  }

  const conditions = [
    'p."beneficiaryUserId" = $1',
    `p.status <> 'RETAINED'`,
  ];

  const parameters: any[] = [
    normalizedUserId,
  ];

  if (status) {
    parameters.push(status);

    conditions.push(
      `p.status::text = $${parameters.length}`,
    );
  }

  const whereClause =
    conditions.join(' AND ');

  const countRows =
    await this.dataSource.query(
      `
      SELECT COUNT(*)::int AS total
      FROM public.solar_mitra_network_payout p
      WHERE ${whereClause}
      `,
      parameters,
    );

  const total = Number(
    countRows[0]?.total || 0,
  );

  const rows =
    await this.dataSource.query(
      `
      SELECT
        p.id,
        p."projectId",
        p."referralId",
        p."sourceSolarMitraId",
        p."sourceSolarMitraName",

        d."customerName",

        p."networkLevel",
        p."payoutAmount",
        p.status,

        pool."poolAmount",
        pool."totalUplineCount",

        p."eligibleAt",
        p."approvedAt",
        p."paidAt",

        p."paymentMode",
        p."paymentReference",

        p."recoveryDeductedAmount",

CASE
  WHEN p."paidAt" IS NOT NULL
  THEN COALESCE(
    p."netPaidAmount",
    p."payoutAmount"
  )
  ELSE NULL
END AS "netPaidAmount",

p."settlementType",
p."payrollId",
p."payrollReservedAt",

        p."cancelledAt",
        p."cancellationReason",

        p."recoveryAmount",
        p."recoveredAmount",
        p."recoveredAt",

        GREATEST(
          p."recoveryAmount" -
          p."recoveredAmount",
          0
        ) AS "outstandingRecovery"

      FROM public.solar_mitra_network_payout p

      INNER JOIN public.solar_mitra_network_pool pool
        ON pool.id = p."poolId"

      LEFT JOIN public.solar_mitra_payout d
        ON d.id = pool."directPayoutId"

      WHERE ${whereClause}

      ORDER BY
        p."eligibleAt" DESC,
        p.id DESC

      LIMIT $${parameters.length + 1}
      OFFSET $${parameters.length + 2}
      `,
      [
        ...parameters,
        limit,
        offset,
      ],
    );

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

  async getMyEarnings(userId: number) {
  const normalizedUserId = Number(userId);

  if (
    !Number.isSafeInteger(normalizedUserId) ||
    normalizedUserId <= 0
  ) {
    throw new ConflictException(
      'Valid user ID is required',
    );
  }

  const rows = await this.dataSource.query(
    `
    SELECT
      'CREATION' AS category,
      status::text AS status,
      COUNT(*)::int AS count,
      COALESCE(SUM("payoutAmount"), 0)::text AS amount,

COALESCE(
  SUM(COALESCE("netPaidAmount", "payoutAmount"))
    FILTER (WHERE "paidAt" IS NOT NULL),
  0
)::text AS "netPaidAmount",

COALESCE(
  SUM("recoveryDeductedAmount")
    FILTER (WHERE "paidAt" IS NOT NULL),
  0
)::text AS "recoveryDeductedAmount"

FROM public.solar_mitra_creator_payout
    WHERE "creatorId" = $1
    GROUP BY status

    UNION ALL

    SELECT
      'DIRECT_PROJECT' AS category,
      p.status::text AS status,
      COUNT(*)::int AS count,
      COALESCE(SUM(p."payoutAmount"), 0)::text AS amount,

COALESCE(
  SUM(COALESCE(p."netPaidAmount", p."payoutAmount"))
    FILTER (WHERE p."paidAt" IS NOT NULL),
  0
)::text AS "netPaidAmount",

COALESCE(
  SUM(p."recoveryDeductedAmount")
    FILTER (WHERE p."paidAt" IS NOT NULL),
  0
)::text AS "recoveryDeductedAmount"

FROM public.solar_mitra_payout p
    INNER JOIN public.solar_mitra m
      ON m.id = p."solarMitraId"
    WHERE m."linkedUserId" = $1
    GROUP BY p.status

    UNION ALL

    SELECT
      'NETWORK' AS category,
      status::text AS status,
      COUNT(*)::int AS count,
      COALESCE(SUM("payoutAmount"), 0)::text AS amount,

COALESCE(
  SUM(COALESCE("netPaidAmount", "payoutAmount"))
    FILTER (WHERE "paidAt" IS NOT NULL),
  0
)::text AS "netPaidAmount",

COALESCE(
  SUM("recoveryDeductedAmount")
    FILTER (WHERE "paidAt" IS NOT NULL),
  0
)::text AS "recoveryDeductedAmount"

FROM public.solar_mitra_network_payout
    WHERE "beneficiaryUserId" = $1
    GROUP BY status
    `,
    [normalizedUserId],
  );

  const getAmount = (
    category: string,
    status: string,
  ): number => {
    const row = rows.find(
      (item: any) =>
        item.category === category &&
        item.status === status,
    );

    return Number(row?.amount || 0);
  };

  const getCount = (
    category: string,
    status: string,
  ): number => {
    const row = rows.find(
      (item: any) =>
        item.category === category &&
        item.status === status,
    );

    return Number(row?.count || 0);
  };

  const getSettlementTotal = (
  category: string,
  field: 'netPaidAmount' | 'recoveryDeductedAmount',
): number => {
  const totalPaise = rows
    .filter(
      (item: any) =>
        item.category === category,
    )
    .reduce(
      (total: number, item: any) =>
        total + this.toPaise(item[field] || 0),
      0,
    );

  return Number(this.fromPaise(totalPaise));
};

  const recoveryRows =
  await this.dataSource.query(
    `
    SELECT
      COALESCE(
        SUM(recovery."outstandingAmount"),
        0
      )::text AS "outstandingRecovery",

      COALESCE(
        SUM(recovery."outstandingAmount")
          FILTER (
            WHERE recovery.category = 'NETWORK'
          ),
        0
      )::text AS "networkRecovery",

      COALESCE(
        SUM(recovery."outstandingAmount")
          FILTER (
            WHERE recovery.category = 'DIRECT_PROJECT'
          ),
        0
      )::text AS "directProjectRecovery"

    FROM (
      SELECT
        'NETWORK' AS category,

        GREATEST(
          p."recoveryAmount" -
          p."recoveredAmount",
          0
        ) AS "outstandingAmount"

      FROM public.solar_mitra_network_payout p

      WHERE p."beneficiaryUserId" = $1
        AND p.status = 'RECOVERY_PENDING'

      UNION ALL

      SELECT
        'DIRECT_PROJECT' AS category,

        GREATEST(
          p."recoveryAmount" -
          p."recoveredAmount",
          0
        ) AS "outstandingAmount"

      FROM public.solar_mitra_payout p

      INNER JOIN public.solar_mitra m
        ON m.id = p."solarMitraId"

      WHERE m."linkedUserId" = $1
        AND p.status = 'RECOVERY_PENDING'
    ) recovery
    `,
    [normalizedUserId],
  );

  return {
  outstandingRecovery: Number(
    recoveryRows[0]?.outstandingRecovery || 0,
  ),

  creation: {
      eligibleAmount:
        getAmount('CREATION', 'ELIGIBLE'),

      eligibleCount:
        getCount('CREATION', 'ELIGIBLE'),

      paidAmount:
        getAmount('CREATION', 'PAID'),

      paidCount:
        getCount('CREATION', 'PAID'),

        netPaidAmount:
  getSettlementTotal(
    'CREATION',
    'netPaidAmount',
  ),

recoveryDeductedAmount:
  getSettlementTotal(
    'CREATION',
    'recoveryDeductedAmount',
  ),

      cancelledAmount:
        getAmount('CREATION', 'CANCELLED'),
    },

    directProject: {
      waitingAmount:
        getAmount('DIRECT_PROJECT', 'WAITING'),

      waitingCount:
        getCount('DIRECT_PROJECT', 'WAITING'),

      eligibleAmount:
        getAmount('DIRECT_PROJECT', 'ELIGIBLE'),

      eligibleCount:
        getCount('DIRECT_PROJECT', 'ELIGIBLE'),

      paidAmount:
        getAmount('DIRECT_PROJECT', 'PAID'),

      paidCount:
        getCount('DIRECT_PROJECT', 'PAID'),

        netPaidAmount:
  getSettlementTotal(
    'DIRECT_PROJECT',
    'netPaidAmount',
  ),

recoveryDeductedAmount:
  getSettlementTotal(
    'DIRECT_PROJECT',
    'recoveryDeductedAmount',
  ),

      cancelledAmount:
        getAmount('DIRECT_PROJECT', 'CANCELLED'),

        outstandingRecovery: Number(
  recoveryRows[0]?.directProjectRecovery || 0,
),
    },

    network: {
      pendingApprovalAmount:
        getAmount('NETWORK', 'PENDING_APPROVAL'),

      pendingApprovalCount:
        getCount('NETWORK', 'PENDING_APPROVAL'),

      approvedAmount:
        getAmount('NETWORK', 'APPROVED'),

      approvedCount:
        getCount('NETWORK', 'APPROVED'),

      paidAmount:
        getAmount('NETWORK', 'PAID'),

      paidCount:
        getCount('NETWORK', 'PAID'),

        netPaidAmount:
  getSettlementTotal(
    'NETWORK',
    'netPaidAmount',
  ),

recoveryDeductedAmount:
  getSettlementTotal(
    'NETWORK',
    'recoveryDeductedAmount',
  ),

      cancelledAmount:
        getAmount('NETWORK', 'CANCELLED'),

      outstandingRecovery: Number(
  recoveryRows[0]?.networkRecovery || 0,
),
    },
  };
}

  async getMyNetwork(userId: number) {
  const normalizedUserId = Number(userId);

  if (
    !Number.isSafeInteger(normalizedUserId) ||
    normalizedUserId <= 0
  ) {
    throw new ConflictException(
      'Valid user ID is required',
    );
  }

  const rows = await this.dataSource.query(
    `
    WITH RECURSIVE network AS (
      SELECT
        m.id,
        m.name,
        m."linkedUserId",
        m.id AS root_id,
        m.status,
        m."isHidden",

(
  m.status = 'ACTIVE'
  AND m."isHidden" = false
  AND u.id IS NOT NULL
  AND u."isHidden" = false
) AS "isActiveMember",

1 AS level,
        ARRAY[m.id] AS path
      FROM solar_mitra m
      LEFT JOIN public."user" u
  ON u.id = m."linkedUserId"
      WHERE m."createdBy" = $1
        AND m."linkedUserId" IS DISTINCT FROM $1

      UNION ALL

      SELECT
  m.id,
  m.name,
  m."linkedUserId",
  n.root_id,
  m.status,
  m."isHidden",

  (
    m.status = 'ACTIVE'
    AND m."isHidden" = false
    AND u.id IS NOT NULL
    AND u."isHidden" = false
  ) AS "isActiveMember",

    n.level + 1,
  n.path || m.id
      FROM solar_mitra m
      INNER JOIN network n
        ON m."createdBy" = n."linkedUserId"
        LEFT JOIN public."user" u
  ON u.id = m."linkedUserId"
      WHERE NOT (m.id = ANY(n.path))
        AND m."linkedUserId" IS DISTINCT FROM $1
    ),

    branch_summary AS (
      SELECT
        root_id,

        COUNT(*) FILTER (
          WHERE level = 2
        )::int AS "directMembers",

        COUNT(*) FILTER (
          WHERE level > 2
        )::int AS "indirectMembers",

        COUNT(*) FILTER (
          WHERE level > 1
        )::int AS "totalDownline",

        COUNT(*) FILTER (
          WHERE level > 1
AND "isActiveMember" = true
        )::int AS "activeDownline",

        BOOL_OR(
  level = 1
  AND "isActiveMember" = true
) AS "isActiveMember",

        (MAX(level) - 1)::int AS "networkDepth",

COUNT(*) FILTER (
  WHERE m."approvalStatus" = 'APPROVED'
    AND m."isHidden" = false
)::int AS "approvedMitras",

COUNT(*) FILTER (
  WHERE m."posterVerificationStatus" = 'ATTACHED'
    AND m."isHidden" = false
)::int AS "posterVerifiedMitras"

     FROM network
INNER JOIN solar_mitra m
  ON m.id = network.id
GROUP BY root_id
),

referral_performance AS (
  SELECT
    n.root_id,

    COUNT(DISTINCT r.id)::int
      AS "totalReferrals",

    COUNT(DISTINCT r.id) FILTER (
      WHERE r."linkedLeadId" IS NOT NULL
    )::int AS "leadsCreated",

    COUNT(DISTINCT r.id) FILTER (
      WHERE r."linkedMeetingId" IS NOT NULL
    )::int AS "meetingsCreated"

  FROM network n

  INNER JOIN solar_mitra_referral r
    ON r."solarMitraId" = n.id
    AND r."isHidden" = false

  GROUP BY n.root_id
),

project_performance AS (
  SELECT
    n.root_id,

    COUNT(DISTINCT p."projectId")::int
      AS "projectsCreated",

    COUNT(DISTINCT p."projectId") FILTER (
      WHERE p.status IN ('ELIGIBLE', 'PAID')
    )::int AS "qualifiedProjects"

  FROM network n

  INNER JOIN solar_mitra_payout p
    ON p."solarMitraId" = n.id

  INNER JOIN solar_mitra_referral r
    ON r.id = p."referralId"
    AND r."isHidden" = false

  WHERE p."projectId" IS NOT NULL

  GROUP BY n.root_id
)

SELECT
  m.id AS "solarMitraId",
      m.name,
      m."businessName",
      m.city,
      m.area,
      m."primaryPhone",
      m.status,
      m."isHidden",
      m."approvalStatus",
      m."posterVerificationStatus",
      m."createdAt",

      b."directMembers",
      b."indirectMembers",
      b."totalDownline",
      b."activeDownline",
      b."isActiveMember",
b."networkDepth",

b."approvedMitras",
b."posterVerifiedMitras",

COALESCE(
  rp."totalReferrals", 0
)::int AS "totalReferrals",

COALESCE(
  rp."leadsCreated", 0
)::int AS "leadsCreated",

COALESCE(
  rp."meetingsCreated", 0
)::int AS "meetingsCreated",

COALESCE(
  pp."projectsCreated", 0
)::int AS "projectsCreated",

COALESCE(
  pp."qualifiedProjects", 0
)::int AS "qualifiedProjects"

FROM branch_summary b

INNER JOIN solar_mitra m
  ON m.id = b.root_id

LEFT JOIN referral_performance rp
  ON rp.root_id = b.root_id

LEFT JOIN project_performance pp
  ON pp.root_id = b.root_id

    ORDER BY m."createdAt" DESC, m.id DESC
    `,
    [normalizedUserId],
  );

  const actualTeam = rows.length;

  const activeActualTeam = rows.filter(
  (row: any) =>
    row.isActiveMember === true,
).length;

  const virtualTeam = rows.reduce(
    (total: number, row: any) =>
      total + Number(row.totalDownline || 0),
    0,
  );

  const activeVirtualTeam = rows.reduce(
    (total: number, row: any) =>
      total + Number(row.activeDownline || 0),
    0,
  );

  const networkDepth = rows.reduce(
    (maximum: number, row: any) =>
      Math.max(
        maximum,
        Number(row.networkDepth || 0) + 1,
      ),
    0,
  );

  const performance = rows.reduce(
  (total: any, row: any) => ({
    approvedMitras:
      total.approvedMitras +
      Number(row.approvedMitras || 0),

    posterVerifiedMitras:
      total.posterVerifiedMitras +
      Number(row.posterVerifiedMitras || 0),

    totalReferrals:
      total.totalReferrals +
      Number(row.totalReferrals || 0),

    leadsCreated:
      total.leadsCreated +
      Number(row.leadsCreated || 0),

    meetingsCreated:
      total.meetingsCreated +
      Number(row.meetingsCreated || 0),

    projectsCreated:
      total.projectsCreated +
      Number(row.projectsCreated || 0),

    qualifiedProjects:
      total.qualifiedProjects +
      Number(row.qualifiedProjects || 0),
  }),
  {
    approvedMitras: 0,
    posterVerifiedMitras: 0,
    totalReferrals: 0,
    leadsCreated: 0,
    meetingsCreated: 0,
    projectsCreated: 0,
    qualifiedProjects: 0,
  },
);

  return {
    summary: {
      actualTeam,
      activeActualTeam,
      inactiveActualTeam:
        actualTeam - activeActualTeam,

      virtualTeam,
      activeVirtualTeam,
      inactiveVirtualTeam:
        virtualTeam - activeVirtualTeam,

      totalNetwork:
        actualTeam + virtualTeam,

      activeNetwork:
        activeActualTeam + activeVirtualTeam,

      inactiveNetwork:
        actualTeam +
        virtualTeam -
        activeActualTeam -
        activeVirtualTeam,

    networkDepth,
    },

    performance,

    actualTeam: rows,
  };
}

  async cancelForProject(
  projectId: number,
  reason: string,
  user: any,
  existingManager?: EntityManager,
): Promise<void> {
  const normalizedProjectId =
    Number(projectId);

  if (
    !Number.isInteger(normalizedProjectId) ||
    normalizedProjectId <= 0
  ) {
    return;
  }

  const cancel = async (
    manager: EntityManager,
  ): Promise<void> => {

    await this.lockNetworkFinancialOperations(
  manager,
);
    const directPayout = await manager.findOne(
  SolarMitraPayout,
  {
    where: {
      projectId: normalizedProjectId,
    },
    lock: {
      mode: 'pessimistic_write',
    },
  },
);

if (
  directPayout &&
  (
    directPayout.status ===
      SolarMitraPayoutStatus.WAITING ||
    directPayout.status ===
      SolarMitraPayoutStatus.ELIGIBLE ||
    directPayout.status ===
      SolarMitraPayoutStatus.PAID
  )
) {
  if (
    directPayout.status ===
    SolarMitraPayoutStatus.PAID
  ) {
    directPayout.status =
      SolarMitraPayoutStatus.RECOVERY_PENDING;

    directPayout.recoveryAmount =
      Number(directPayout.payoutAmount);

    directPayout.recoveredAmount = 0;

    directPayout.recoveredAt = null;
  } else {
    directPayout.status =
      SolarMitraPayoutStatus.CANCELLED;
  }

  directPayout.cancelledAt = new Date();

  directPayout.cancelledBy =
    Number(
      user?.id ||
      user?.userId ||
      user?.sub ||
      0,
    ) || null;

  directPayout.cancelledByName =
    String(
      user?.name ||
      user?.email ||
      '',
    ).trim();

  directPayout.cancellationReason =
    String(reason || '').trim() ||
    'Project cancelled or rejected';

  await manager.save(
    SolarMitraPayout,
    directPayout,
  );
}

    const pool = await manager.findOne(
      SolarMitraNetworkPool,
      {
        where: {
          projectId: normalizedProjectId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      },
    );

    if (!pool) {
      return;
    }

    if (
      pool.status ===
      SolarMitraNetworkPoolStatus.CANCELLED
    ) {
      return;
    }

    const cancelledAt = new Date();

    const cancelledBy =
      Number(
        user?.id ||
        user?.userId ||
        user?.sub ||
        0,
      ) || null;

    const cancellationReason =
      String(reason || '').trim() ||
      'Project cancelled or rejected';

    const payouts = await manager
      .getRepository(SolarMitraNetworkPayout)
      .createQueryBuilder('payout')
      .setLock('pessimistic_write')
      .where('payout."poolId" = :poolId', {
        poolId: pool.id,
      })
      .orderBy('payout.id', 'ASC')
      .getMany();

    for (const payout of payouts) {
      if (
        payout.status ===
          SolarMitraNetworkPayoutStatus.PENDING_APPROVAL ||
        payout.status ===
          SolarMitraNetworkPayoutStatus.APPROVED
      ) {
        payout.status =
          SolarMitraNetworkPayoutStatus.CANCELLED;

      } else if (
        payout.status ===
        SolarMitraNetworkPayoutStatus.PAID
      ) {
        payout.status =
          SolarMitraNetworkPayoutStatus.RECOVERY_PENDING;

        payout.recoveryAmount =
          payout.payoutAmount;

        payout.recoveredAmount =
          '0.00';

      } else {
        continue;
      }

      payout.cancelledAt =
        cancelledAt;

      payout.cancelledBy =
        cancelledBy;

      payout.cancellationReason =
        cancellationReason;

      await manager.save(
        SolarMitraNetworkPayout,
        payout,
      );
    }

    pool.status =
      SolarMitraNetworkPoolStatus.CANCELLED;

    pool.cancelledAt =
      cancelledAt;

    pool.cancelledBy =
      cancelledBy;

    pool.cancellationReason =
      cancellationReason;

    await manager.save(
      SolarMitraNetworkPool,
      pool,
    );
  };

  if (existingManager) {
    await cancel(existingManager);
    return;
  }

  await this.dataSource.transaction(
    cancel,
  );
}

async reconcileHistoricalNetworkPools(
  previewOnly: boolean = true,
  expectedPreviewFingerprint?: string,
) {

    if (
  !previewOnly &&
  (
    typeof expectedPreviewFingerprint !== 'string' ||
    !/^[a-f0-9]{64}$/.test(
      expectedPreviewFingerprint,
    )
  )
) {
  throw new ConflictException(
    'A valid historical reconciliation preview fingerprint is required',
  );
}

  return this.dataSource.transaction(
    async (manager) => {
      await this.lockNetworkFinancialOperations(
        manager,
      );

      const candidates = await manager
        .getRepository(SolarMitraPayout)
        .createQueryBuilder('p')
        .where('p.status = :status', {
          status: SolarMitraPayoutStatus.ELIGIBLE,
        })
        .andWhere('p."projectId" IS NOT NULL')
        .andWhere('p."eligibleAt" >= :effectiveFrom', {
          effectiveFrom: this.effectiveFrom,
        })
        .andWhere('p."paidAt" IS NULL')
        .orderBy('p.id', 'ASC')
        .getMany();

      const results: any[] = [];

      let totalPoolPaise = 0;
      let totalDistributablePaise = 0;
      let totalRetainedPaise = 0;

      for (const payout of candidates) {
        const projectId = Number(payout.projectId);

        const existingPool = await manager.findOne(
          SolarMitraNetworkPool,
          {
            where: { projectId },
          },
        );

        if (existingPool) {
          results.push({
            projectId,
            directPayoutId: payout.id,
            action: 'ALREADY_EXISTS',
            poolId: existingPool.id,
          });

          continue;
        }

        const pool = await this.generateForProject(
          projectId,
          manager,
          previewOnly,
        );

        if (!pool) {
          results.push({
            projectId,
            directPayoutId: payout.id,
            action: 'NOT_QUALIFIED',
          });

          continue;
        }

        totalPoolPaise += this.toPaise(
          pool.poolAmount,
        );

        totalDistributablePaise += this.toPaise(
          pool.distributableAmount,
        );

        totalRetainedPaise += this.toPaise(
          pool.retainedAmount,
        );

        results.push({
          projectId,
          directPayoutId: payout.id,

          action: previewOnly
            ? 'WOULD_GENERATE'
            : 'GENERATED',

          poolId: pool.id ?? null,

          sourceSolarMitraId:
            pool.sourceSolarMitraId,

          sourceSolarMitraName:
            pool.sourceSolarMitraName,

          eligibleAt: pool.eligibleAt,

          poolAmount: pool.poolAmount,

          totalUplineCount:
            pool.totalUplineCount,

          eligibleUplineCount:
            pool.eligibleUplineCount,

          distributableAmount:
            pool.distributableAmount,

          retainedAmount:
            pool.retainedAmount,

          hierarchySnapshot:
            pool.hierarchySnapshot,
        });
      }

      const fingerprintData = results
  .filter(
    (item) =>
      item.action === 'WOULD_GENERATE' ||
      item.action === 'GENERATED',
  )
  .map((item) => ({
    projectId: item.projectId,
    directPayoutId: item.directPayoutId,
    sourceSolarMitraId: item.sourceSolarMitraId,
    sourceSolarMitraName: item.sourceSolarMitraName,
    eligibleAt: item.eligibleAt,
    poolAmount: item.poolAmount,
    totalUplineCount: item.totalUplineCount,
    eligibleUplineCount: item.eligibleUplineCount,
    distributableAmount: item.distributableAmount,
    retainedAmount: item.retainedAmount,
    hierarchySnapshot: item.hierarchySnapshot,
  }))
  .sort(
    (a, b) => a.projectId - b.projectId,
  );

const previewFingerprint = createHash('sha256')
  .update(
    JSON.stringify(fingerprintData),
  )
  .digest('hex');

if (
  !previewOnly &&
  previewFingerprint !== expectedPreviewFingerprint
) {
  throw new ConflictException(
    'Historical reconciliation data has changed. Generate and review a fresh preview before executing.',
  );
}

      return {
  previewOnly,

  previewFingerprint,

  effectiveFrom: this.effectiveFrom,

        candidatesChecked: candidates.length,

        poolsToGenerate: results.filter(
          (item) =>
            item.action === 'WOULD_GENERATE',
        ).length,

        poolsGenerated: results.filter(
          (item) =>
            item.action === 'GENERATED',
        ).length,

        alreadyExisting: results.filter(
          (item) =>
            item.action === 'ALREADY_EXISTS',
        ).length,

        notQualified: results.filter(
          (item) =>
            item.action === 'NOT_QUALIFIED',
        ).length,

        totalPoolAmount:
          this.fromPaise(totalPoolPaise),

        totalDistributableAmount:
          this.fromPaise(
            totalDistributablePaise,
          ),

        totalRetainedAmount:
          this.fromPaise(totalRetainedPaise),

        results,
      };
    },
  );
}

 async generateForProject(
  projectId: number,
  existingManager?: EntityManager,
  previewOnly: boolean = false,
): Promise<SolarMitraNetworkPool | null> {
    /*
     * Allow read-only previews while keeping actual
     * network incentive generation disabled until activation.
     */
    if (
      !previewOnly &&
      process.env.SOLAR_MITRA_NETWORK_ENABLED !== 'true'
    ) {
      return null;
    }

    const normalizedProjectId =
      Number(projectId);

    if (
      !Number.isInteger(
        normalizedProjectId,
      ) ||
      normalizedProjectId <= 0
    ) {
      return null;
    }

    const generate = async (
  manager: EntityManager,
): Promise<SolarMitraNetworkPool | null> => {
  await this.lockNetworkFinancialOperations(
    manager,
  );

  const directPayout =
          await manager.findOne(
            SolarMitraPayout,
            {
              where: {
                projectId:
                  normalizedProjectId,
              },
              lock: {
                mode: 'pessimistic_write',
              },
            },
          );

        if (!directPayout) {
          return null;
        }

        const project = await manager.findOne(
  Project,
  {
    where: {
      id: normalizedProjectId,
    },
  },
);

if (
  !project ||
  project.ownerApprovalStatus !==
    ProjectApprovalStatus.APPROVED ||
  project.status === ProjectStatus.REJECTED ||
  project.status === ProjectStatus.CANCELLED
) {
  return null;
}

        const existingPool =
          await manager.findOne(
            SolarMitraNetworkPool,
            {
              where: {
                projectId:
                  normalizedProjectId,
              },
            },
          );

        if (existingPool) {
          return existingPool;
        }

        if (
          directPayout.status !==
            SolarMitraPayoutStatus.ELIGIBLE ||
          !directPayout.eligibleAt
        ) {
          return null;
        }

        const eligibleAt = new Date(
          directPayout.eligibleAt,
        );

        if (
          Number.isNaN(
            eligibleAt.getTime(),
          ) ||
          eligibleAt < this.effectiveFrom
        ) {
          return null;
        }

        const rate =
          await manager.findOne(
            SolarMitraNetworkRate,
            {
              where: {
                effectiveFrom:
                  LessThanOrEqual(
                    eligibleAt,
                  ),
              },
              order: {
                effectiveFrom: 'DESC',
              },
            },
          );

        if (!rate) {
          throw new ConflictException(
            'Applicable network incentive rate not found',
          );
        }

        const poolPaise =
          this.toPaise(rate.poolAmount);

        if (poolPaise <= 0) {
          return null;
        }

        const sourceMitra =
          await manager.findOne(
            SolarMitra,
            {
              where: {
                id: directPayout.solarMitraId,
              },
            },
          );

        if (!sourceMitra) {
          throw new ConflictException(
            'Source Solar Mitra not found',
          );
        }

        const chain =
          await this.getUplineChain(
            sourceMitra,
            manager,
          );

        if (chain.length === 0) {
          return null;
        }

        const eligibleCount =
          chain.filter(
            (item) => item.eligible,
          ).length;

        if (eligibleCount === 0) {
          return null;
        }

        const baseShare = Math.floor(
          poolPaise / chain.length,
        );

        const remainder =
          poolPaise % chain.length;

        const shares = chain.map(
          (item, index) => ({
            ...item,

            sharePaise:
              baseShare +
              (index < remainder ? 1 : 0),
          }),
        );

        const distributablePaise =
          shares.reduce(
            (total, item) =>
              total +
              (
                item.eligible
                  ? item.sharePaise
                  : 0
              ),
            0,
          );

        const retainedPaise =
          poolPaise - distributablePaise;

        const pool = manager.create(
          SolarMitraNetworkPool,
          {
            projectId:
              normalizedProjectId,

            referralId:
              directPayout.referralId,

            directPayoutId:
              directPayout.id,

            sourceSolarMitraId:
              sourceMitra.id,

            sourceSolarMitraName:
              sourceMitra.name,

            poolAmount:
              this.fromPaise(poolPaise),

            totalUplineCount:
              chain.length,

            eligibleUplineCount:
              eligibleCount,

            inactiveUplineCount:
              chain.length - eligibleCount,

            distributableAmount:
              this.fromPaise(
                distributablePaise,
              ),

            retainedAmount:
              this.fromPaise(
                retainedPaise,
              ),

            hierarchySnapshot:
              shares.map((item) => ({
                ...item,
                payoutAmount:
                  this.fromPaise(
                    item.sharePaise,
                  ),
              })),

            status:
              SolarMitraNetworkPoolStatus
                .GENERATED,

            eligibleAt,
          },
        );

        if (previewOnly) {
  return pool;
}

        const savedPool =
          await manager.save(
            SolarMitraNetworkPool,
            pool,
          );

        const payouts = shares.map(
          (item) =>
            manager.create(
              SolarMitraNetworkPayout,
              {
                poolId:
                  savedPool.id,

                projectId:
                  normalizedProjectId,

                referralId:
                  directPayout.referralId,

                sourceSolarMitraId:
                  sourceMitra.id,

                sourceSolarMitraName:
                  sourceMitra.name,

                beneficiaryUserId:
                  item.userId,

                beneficiaryName:
                  item.name,

                beneficiaryRole:
                  item.role,

                beneficiarySolarMitraId:
                  item.solarMitraId,

                networkLevel:
                  item.level,

                payoutAmount:
                  this.fromPaise(
                    item.sharePaise,
                  ),

                status:
                  item.eligible
                    ? SolarMitraNetworkPayoutStatus
                        .PENDING_APPROVAL
                    : SolarMitraNetworkPayoutStatus
                        .RETAINED,

                retentionReason:
                  item.retentionReason,

                eligibleAt,
              },
            ),
        );

        await manager.save(
          SolarMitraNetworkPayout,
          payouts,
        );

               return savedPool;
    };

    if (existingManager) {
      return generate(existingManager);
    }

    return this.dataSource.transaction(
      generate,
    );
  }
}