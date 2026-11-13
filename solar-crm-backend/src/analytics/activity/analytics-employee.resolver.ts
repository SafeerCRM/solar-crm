
import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { User, UserRole } from '../../users/user.entity';
import { UserRoleHistory } from '../../users/user-role-history.entity';

export interface AnalyticsEmployeeSelection {
  userIds: number[];
  selectedRole?: string;
}

export class AnalyticsEmployeeResolver {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly roleHistoryRepository: Repository<UserRoleHistory>,
  ) {}

  private normalizeRoles(value: unknown): string[] {
    const values = Array.isArray(value)
      ? value
      : String(value ?? '').split(',');

    return values
      .map((role) => String(role).trim().toUpperCase())
      .filter(Boolean);
  }

  private async getHistoricalRoleUserIds(
    role: string,
    start: Date,
    end: Date,
    candidateUserIds?: number[],
  ): Promise<number[]> {
    if (candidateUserIds && candidateUserIds.length === 0) {
      return [];
    }

    const qb = this.roleHistoryRepository
      .createQueryBuilder('history')
      .where('history.createdAt <= :end', { end })
      .orderBy('history.userId', 'ASC')
      .addOrderBy('history.createdAt', 'ASC')
      .addOrderBy('history.id', 'ASC');

    if (candidateUserIds) {
      qb.andWhere('history.userId IN (:...candidateUserIds)', {
        candidateUserIds,
      });
    }

    const history = await qb.getMany();

    const byUser = new Map<number, UserRoleHistory[]>();

    for (const record of history) {
      const userId = Number(record.userId);
      const records = byUser.get(userId) ?? [];
      records.push(record);
      byUser.set(userId, records);
    }

    const matchedUserIds: number[] = [];

    for (const [userId, records] of byUser) {
      for (let index = 0; index < records.length; index++) {
        const record = records[index];
        const intervalStart = record.createdAt;
        const intervalEnd =
          records[index + 1]?.createdAt ?? null;

        const overlaps =
          intervalStart <= end &&
          (intervalEnd === null || intervalEnd > start);

        if (
          overlaps &&
          this.normalizeRoles(record.newRoles).includes(role)
        ) {
          matchedUserIds.push(userId);
          break;
        }
      }
    }

    return matchedUserIds;
  }

  async resolve(
  requester: any,
  query: {
    userId?: string;
    role?: string;
    roleFilterMode?: string;
  },
  period: {
    start: Date;
    end: Date;
  },
): Promise<AnalyticsEmployeeSelection> {
    const requesterId = Number(
      requester?.id ?? requester?.userId,
    );

    if (
      !Number.isInteger(requesterId) ||
      requesterId <= 0
    ) {
      throw new ForbiddenException(
        'Invalid analytics requester',
      );
    }

    const requesterRecord =
      await this.userRepository.findOne({
        where: { id: requesterId },
      });

    if (
      !requesterRecord ||
      requesterRecord.isHidden
    ) {
      throw new ForbiddenException(
        'Analytics requester is not active',
      );
    }

    const requesterRoles = this.normalizeRoles(
      requesterRecord.roles,
    );

    const isOwner = requesterRoles.includes(
      UserRole.OWNER,
    );

    const selectedRole = String(
  query.role ?? '',
).trim().toUpperCase();

const roleFilterMode = String(
  query.roleFilterMode ?? 'CURRENT',
).trim().toUpperCase();

if (
  roleFilterMode !== 'CURRENT' &&
  roleFilterMode !== 'HISTORICAL'
) {
  throw new ForbiddenException(
    'Invalid role filter mode',
  );
}

    const rawSelectedId = String(
      query.userId ?? '',
    ).trim();

    const selectedUserId = rawSelectedId
      ? Number(rawSelectedId)
      : null;

    if (
      selectedUserId !== null &&
      (!Number.isInteger(selectedUserId) ||
        selectedUserId <= 0)
    ) {
      throw new ForbiddenException(
        'Invalid selected employee',
      );
    }

    if (!isOwner) {
      if (
        selectedUserId !== null &&
        selectedUserId !== requesterId
      ) {
        throw new ForbiddenException(
          'Not authorized to view another employee',
        );
      }

      if (
        selectedRole &&
        !requesterRoles.includes(selectedRole)
      ) {
        throw new ForbiddenException(
          'Not authorized for selected role',
        );
      }

      return {
        userIds: [requesterId],
        selectedRole: selectedRole || undefined,
      };
    }

    if (selectedUserId !== null) {
      const selectedUser =
        await this.userRepository.findOne({
          where: { id: selectedUserId },
        });

      if (!selectedUser) {
        return {
          userIds: [],
          selectedRole: selectedRole || undefined,
        };
      }

      if (selectedRole) {
  const matchesRole =
    roleFilterMode === 'CURRENT'
      ? this.normalizeRoles(
          selectedUser.roles,
        ).includes(selectedRole)
      : (
          await this.getHistoricalRoleUserIds(
            selectedRole,
            period.start,
            period.end,
            [selectedUserId],
          )
        ).includes(selectedUserId);

  if (!matchesRole) {
    return {
      userIds: [],
      selectedRole,
    };
  }
}

      return {
        userIds: [selectedUserId],
        selectedRole: selectedRole || undefined,
      };
    }

    if (selectedRole) {
  const users = await this.userRepository.find({
    where: { isHidden: false },
  });

  if (roleFilterMode === 'CURRENT') {
    return {
      userIds: users
        .filter((item) =>
          this.normalizeRoles(item.roles).includes(
            selectedRole,
          ),
        )
        .map((item) => Number(item.id)),
      selectedRole,
    };
  }

  const eligibleIds = users.map((item) =>
    Number(item.id),
  );

  return {
    userIds: await this.getHistoricalRoleUserIds(
      selectedRole,
      period.start,
      period.end,
      eligibleIds,
    ),
    selectedRole,
  };
}

    return {
      userIds: [requesterId],
    };
  }
}
