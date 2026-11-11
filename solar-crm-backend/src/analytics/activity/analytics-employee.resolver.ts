
import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { User, UserRole } from '../../users/user.entity';

export interface AnalyticsEmployeeSelection {
  userIds: number[];
  selectedRole?: string;
}

export class AnalyticsEmployeeResolver {
  constructor(
    private readonly userRepository: Repository<User>,
  ) {}

  private normalizeRoles(value: unknown): string[] {
    const values = Array.isArray(value)
      ? value
      : String(value ?? '').split(',');

    return values
      .map((role) => String(role).trim().toUpperCase())
      .filter(Boolean);
  }

  async resolve(
    requester: any,
    query: {
      userId?: string;
      role?: string;
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

    // Use the current database record rather than
    // trusting role information supplied in a request.
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
       return { userIds: [], selectedRole };
     }

      const selectedRoles = this.normalizeRoles(
        selectedUser.roles,
      );

      if (
        selectedRole &&
        !selectedRoles.includes(selectedRole)
      ) {
        return { userIds: [], selectedRole };
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

    // No explicit selection means the owner's
    // own activity, not unrestricted access.
    return {
      userIds: [requesterId],
    };
  }
}
