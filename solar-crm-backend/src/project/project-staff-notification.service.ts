import {
  Injectable,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import {
  ProjectStaffNotification,
} from './project-staff-notification.entity';

import {
  ProjectNotificationGateway,
} from './project-notification.gateway';

import {
  Project,
} from './project.entity';

import {
  User,
  UserRole,
} from '../users/user.entity';

type CreateProjectStaffNotificationInput = {
  recipientUserId: number;

  projectId: number;

  module: string;

  eventType?: string;

  title: string;

  message: string;

  targetTab?: string | null;

  targetSection?: string | null;

  relatedEntityType?: string | null;

  relatedEntityId?: number | null;

  createdBy?: number | null;

  createdByName?: string | null;
};

type NotifyProjectUsersInput = {
  projectId: number;

  module: string;

  eventType?: string;

  title: string;

  message: string;

  targetTab?: string | null;

  targetSection?: string | null;

  relatedEntityType?: string | null;

  relatedEntityId?: number | null;

  createdBy?: number | null;

  createdByName?: string | null;
};

@Injectable()
export class ProjectStaffNotificationService {
  constructor(
  @InjectRepository(
    ProjectStaffNotification,
  )
  private readonly notificationRepository: Repository<ProjectStaffNotification>,

  @InjectRepository(
    Project,
  )
  private readonly projectRepository: Repository<Project>,

  @InjectRepository(
    User,
  )
  private readonly userRepository: Repository<User>,

  private readonly notificationGateway: ProjectNotificationGateway,
) {}

  async createForUser(
    input: CreateProjectStaffNotificationInput,
  ) {
    const recipientUserId =
      Number(
        input.recipientUserId,
      );

    const projectId =
      Number(input.projectId);

    if (
      !recipientUserId ||
      !projectId
    ) {
      return null;
    }

    const notification =
      this.notificationRepository.create({
        recipientUserId,

        projectId,

        module:
          String(
            input.module || '',
          ).trim(),

        eventType:
          String(
            input.eventType ||
              'REMARK_ADDED',
          ).trim(),

        title:
          String(
            input.title || '',
          ).trim(),

        message:
          String(
            input.message || '',
          ).trim(),

        targetTab:
          input.targetTab
            ? String(
                input.targetTab,
              )
            : null,

        targetSection:
          input.targetSection
            ? String(
                input.targetSection,
              )
            : null,

        relatedEntityType:
          input.relatedEntityType
            ? String(
                input.relatedEntityType,
              )
            : null,

        relatedEntityId:
          input.relatedEntityId
            ? Number(
                input.relatedEntityId,
              )
            : null,

        createdBy:
          input.createdBy
            ? Number(
                input.createdBy,
              )
            : null,

        createdByName:
          input.createdByName
            ? String(
                input.createdByName,
              )
            : null,

        isRead: false,

        readAt: null,
      });

    const saved =
      await this.notificationRepository.save(
        notification,
      );

    this.notificationGateway.emitToUser(
      recipientUserId,
      saved,
    );

    return saved;
  }

  async createForUsers(
    recipientUserIds: number[],
    input: Omit<
      CreateProjectStaffNotificationInput,
      'recipientUserId'
    >,
  ) {
    const uniqueUserIds = [
      ...new Set(
        (recipientUserIds || [])
          .map((id) =>
            Number(id),
          )
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0,
          ),
      ),
    ];

    if (!uniqueUserIds.length) {
      return [];
    }

    const results: ProjectStaffNotification[] =
      [];

    for (
      const recipientUserId of
      uniqueUserIds
    ) {
      const saved =
        await this.createForUser({
          ...input,
          recipientUserId,
        });

      if (saved) {
        results.push(saved);
      }
    }

    return results;
  }

  async notifyProjectUsers(
  input: NotifyProjectUsersInput,
) {
  const projectId =
    Number(input.projectId);

  if (!projectId) {
    return [];
  }

  const project =
    await this.projectRepository.findOne({
      where: {
        id: projectId,
      },
    });

  if (!project) {
    return [];
  }

  const requiredRoles =
    this.getRecipientRolesForModule(
      input.module,
    );

  const users =
    await this.userRepository.find();

  const recipientUserIds =
    new Set<number>();

  // Project-specific current owner
  const projectOwnerId =
    Number(
      project.projectOwnerId,
    );

  if (projectOwnerId) {
    recipientUserIds.add(
      projectOwnerId,
    );
  }

  // Current users holding relevant operational roles
  for (const user of users) {
    if (user.isHidden) {
      continue;
    }

    const userRoles =
      Array.isArray(user.roles)
        ? user.roles
        : [];

    const hasRelevantRole =
      userRoles.some((role) =>
        requiredRoles.includes(
          role,
        ),
      );

    if (hasRelevantRole) {
      recipientUserIds.add(
        Number(user.id),
      );
    }
  }

  // Never notify the person who performed the action
  const createdBy =
    Number(
      input.createdBy || 0,
    );

  if (createdBy) {
    recipientUserIds.delete(
      createdBy,
    );
  }

  const recipients = [
    ...recipientUserIds,
  ].filter(
    (id) =>
      Number.isInteger(id) &&
      id > 0,
  );

  if (!recipients.length) {
    return [];
  }

  return this.createForUsers(
    recipients,
    {
      projectId,

      module:
        String(
          input.module || '',
        ).trim(),

      eventType:
        String(
          input.eventType ||
            'REMARK_ADDED',
        ).trim(),

      title:
        String(
          input.title || '',
        ).trim(),

      message:
        String(
          input.message || '',
        ).trim(),

      targetTab:
        input.targetTab ??
        null,

      targetSection:
        input.targetSection ??
        null,

      relatedEntityType:
        input.relatedEntityType ??
        null,

      relatedEntityId:
        input.relatedEntityId ??
        null,

      createdBy:
        createdBy || null,

      createdByName:
        input.createdByName ??
        null,
    },
  );
}

private getRecipientRolesForModule(
  module: string,
): UserRole[] {
  const normalizedModule =
    String(module || '')
      .trim()
      .toUpperCase();

  switch (normalizedModule) {
    case 'LOAN':
      return [
        UserRole.OWNER,
        UserRole.LOAN_MANAGER,
      ];

    case 'SUBSIDY':
      return [
        UserRole.OWNER,
        UserRole.SUBSIDY_MANAGER,
      ];

    case 'ELECTRICITY':
      return [
        UserRole.OWNER,
        UserRole.ELECTRICITY_MANAGER,
      ];

    case 'PAYMENT':
      return [
        UserRole.OWNER,
        UserRole.PAYMENT_MANAGER,
        UserRole.PAYMENT_COLLECTION_EXECUTIVE,
        UserRole.ACCOUNT_MANAGER,
      ];

    case 'EXECUTION':
      return [
        UserRole.OWNER,
        UserRole.PROJECT_MANAGER,
        UserRole.PROJECT_EXECUTIVE,
      ];

    case 'CONTRACTOR':
      return [
        UserRole.OWNER,
        UserRole.PROJECT_MANAGER,
        UserRole.PROJECT_EXECUTIVE,
      ];

    case 'INSPECTION':
      return [
        UserRole.OWNER,
        UserRole.INSPECTION_MANAGER,
        UserRole.PROJECT_MANAGER,
      ];

    case 'MAINTENANCE':
      return [
        UserRole.OWNER,
        UserRole.MAINTENANCE_MANAGER,
        UserRole.CUSTOMER_MANAGER,
      ];

    case 'PROJECT':
    default:
      return [
        UserRole.OWNER,
        UserRole.PROJECT_MANAGER,
      ];
  }
}

  async getUnreadCount(
    userId: number,
  ) {
    const unreadCount =
      await this.notificationRepository.count({
        where: {
          recipientUserId:
            Number(userId),

          isRead: false,
        },
      });

    return {
      unreadCount,
    };
  }

  async getMyNotifications(
    userId: number,
    limit = 30,
  ) {
    const normalizedLimit =
      Math.min(
        Math.max(
          Number(limit) || 30,
          1,
        ),
        100,
      );

    return this.notificationRepository.find({
      where: {
        recipientUserId:
          Number(userId),
      },

      order: {
        createdAt: 'DESC',
      },

      take: normalizedLimit,
    });
  }

  async markRead(
    notificationId: number,
    userId: number,
  ) {
    const notification =
      await this.notificationRepository.findOne({
        where: {
          id: Number(
            notificationId,
          ),

          recipientUserId:
            Number(userId),
        },
      });

    if (!notification) {
      return {
        success: false,
      };
    }

    if (!notification.isRead) {
      notification.isRead =
        true;

      notification.readAt =
        new Date();

      await this.notificationRepository.save(
        notification,
      );
    }

    return {
      success: true,
    };
  }

  async markAllRead(
    userId: number,
  ) {
    await this.notificationRepository
      .createQueryBuilder()
      .update(
        ProjectStaffNotification,
      )
      .set({
        isRead: true,

        readAt: () =>
          'CURRENT_TIMESTAMP',
      })
      .where(
        '"recipientUserId" = :userId',
        {
          userId:
            Number(userId),
        },
      )
      .andWhere(
        '"isRead" = false',
      )
      .execute();

    return {
      success: true,
    };
  }
}