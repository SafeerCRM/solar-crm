
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

import {
  User,
  UserRole,
} from '../users/user.entity';

import {
  SolarStore,
  SolarStoreStatus,
} from './solar-store.entity';

import { SolarStoreOnboardingPayment } from './solar-store-onboarding-payment.entity';

import {
  SolarStoreAudit,
  SolarStoreAuditAction,
} from './solar-store-audit.entity';

@Injectable()
export class SolarStoreService {
  constructor(
    @InjectRepository(SolarStore)
    private readonly storeRepository:
      Repository<SolarStore>,

    private readonly dataSource: DataSource,

    @InjectRepository(SolarStoreOnboardingPayment)
private readonly onboardingPaymentRepository:
  Repository<SolarStoreOnboardingPayment>,
  ) {}

  private normalizePhone(value: any): string {
    const digits = String(value || '')
      .replace(/\D/g, '');

    return digits.length > 10
      ? digits.slice(-10)
      : digits;
  }

    async uploadShopPhoto(file: any, user: any) {
    if (!file) {
      throw new BadRequestException(
        'Shop photo is required',
      );
    }

    const mimeType = String(file.mimetype || '');

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException(
        'Only JPG, PNG, and WEBP images are allowed',
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new BadRequestException(
        'Shop photo must be less than 10 MB',
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const bucket =
      process.env.SUPABASE_PROJECT_DOCUMENTS_BUCKET ||
      'project-documents';

    if (!supabaseUrl || !serviceKey) {
      throw new BadRequestException(
        'Supabase storage is not configured',
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceKey,
    );

    const extensionByMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    const extension = extensionByMime[mimeType];

    const filePath =
      `solar-store/shop-photos/` +
      `user-${user?.id || user?.sub || 'unknown'}/` +
      `${Date.now()}-${randomUUID()}.${extension}`;

    const uploadResult = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadResult.error) {
      throw new BadRequestException(
        uploadResult.error.message,
      );
    }

    const publicUrlResult = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      message: 'Shop photo uploaded successfully',
      fileUrl: publicUrlResult.data.publicUrl,
      filePath,
    };
  }

  private validateAmount(
    value: any,
    field: string,
    defaultValue: number,
    maximum?: number,
  ): number {
    const result =
      value === undefined ||
      value === null ||
      value === ''
        ? defaultValue
        : Number(value);

    if (
      !Number.isFinite(result) ||
      result < 0 ||
      (maximum !== undefined &&
        result > maximum) ||
      Math.round(result * 100) / 100 !==
        result
    ) {
      throw new BadRequestException(
        `Invalid ${field}`,
      );
    }

    return result;
  }

  async createSolarStore(
    body: any,
    user: any,
  ) {
    const name = String(
      body?.name || '',
    ).trim();

    const primaryPhone =
      this.normalizePhone(
        body?.primaryPhone,
      );

    const email = String(
      body?.email || '',
    )
      .trim()
      .toLowerCase();

    const password = String(
      body?.password || '',
    );

    if (!name) {
      throw new BadRequestException(
        'Solar Store name is required',
      );
    }

    if (primaryPhone.length !== 10) {
      throw new BadRequestException(
        'Valid 10 digit primary phone is required',
      );
    }

    if (!email) {
      throw new BadRequestException(
        'Email is required for Solar Store login',
      );
    }

    if (password.trim().length < 8) {
      throw new BadRequestException(
        'Password must contain at least 8 characters',
      );
    }

    const secondaryPhone =
      body?.secondaryPhone
        ? this.normalizePhone(
            body.secondaryPhone,
          )
        : null;

    if (
      secondaryPhone &&
      secondaryPhone.length !== 10
    ) {
      throw new BadRequestException(
        'Valid 10 digit secondary phone is required',
      );
    }

    const onboardingAmount =
      this.validateAmount(
        body?.onboardingAmount,
        'onboarding amount',
        150000,
      );

    const marginPercentage =
      this.validateAmount(
        body?.marginPercentage,
        'margin percentage',
        30,
        100,
      );

    const paymentOverride =
      body?.requiredPaymentPercentageOverride ===
        undefined ||
      body?.requiredPaymentPercentageOverride ===
        null ||
      body?.requiredPaymentPercentageOverride ===
        ''
        ? null
        : this.validateAmount(
            body.requiredPaymentPercentageOverride,
            'payment percentage',
            20,
            100,
          );

    const existingStore =
      await this.storeRepository
        .createQueryBuilder('store')
        .where(
          'store."primaryPhone" = :phone',
          { phone: primaryPhone },
        )
        .getOne();

    if (existingStore) {
      throw new BadRequestException(
        'Solar Store with this phone already exists',
      );
    }

    const existingUser =
      await this.dataSource
        .getRepository(User)
        .findOne({
          where: { email },
        });

    if (existingUser) {
      throw new BadRequestException(
        'User with this email already exists',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        const userRepository =
          manager.getRepository(User);

        const storeRepository =
          manager.getRepository(SolarStore);

        // Recheck inside the transaction.
        const duplicateUser =
          await userRepository.findOne({
            where: { email },
          });

        if (duplicateUser) {
          throw new BadRequestException(
            'User with this email already exists',
          );
        }

        const duplicateStore =
          await storeRepository.findOne({
            where: { primaryPhone },
          });

        if (duplicateStore) {
          throw new BadRequestException(
            'Solar Store with this phone already exists',
          );
        }

        const hashedPassword =
          await bcrypt.hash(password, 10);

        const linkedUser =
          userRepository.create({
            name,
            email,
            password: hashedPassword,
            roles: [UserRole.SOLAR_STORE],
          });

        const savedUser =
          await userRepository.save(
            linkedUser,
          );

        const nullableText = (
          value: any,
        ): string | null =>
          String(value ?? '').trim() ||
          null;

        const store =
          storeRepository.create({
            name,
            ownerName: nullableText(
              body?.ownerName,
            ),
            primaryPhone,
            secondaryPhone,
            email,
            address: nullableText(
              body?.address,
            ),
            gpsLatitude:
              body?.gpsLatitude === undefined ||
              body?.gpsLatitude === null ||
              body?.gpsLatitude === ''
                ? null
                : Number(body.gpsLatitude),
            gpsLongitude:
              body?.gpsLongitude === undefined ||
              body?.gpsLongitude === null ||
              body?.gpsLongitude === ''
                ? null
                : Number(body.gpsLongitude),
            tehsil: nullableText(
              body?.tehsil,
            ),
            district: nullableText(
              body?.district,
            ),
            state: nullableText(
              body?.state,
            ),
            shopPhotoUrl: nullableText(
              body?.shopPhotoUrl,
            ),
            linkedUserId: savedUser.id,
            status: SolarStoreStatus.ACTIVE,
            onboardingAmount,
            marginPercentage,
            requiredPaymentPercentageOverride:
              paymentOverride,
            createdBy: user?.id
              ? Number(user.id)
              : null,
            createdByName:
              nullableText(user?.name),
            updatedBy: user?.id
              ? Number(user.id)
              : null,
            updatedByName:
              nullableText(user?.name),
          });

        return storeRepository.save(store);
      },
    );
  }

  async listSolarStores(query: any) {
    const qb = this.storeRepository
      .createQueryBuilder('store')
      .where('store."isHidden" = false');

    const search = String(
      query?.search || '',
    ).trim();

    if (search) {
      qb.andWhere(
        `(
          LOWER(store.name) LIKE LOWER(:search)
          OR LOWER(
            COALESCE(store."ownerName", '')
          ) LIKE LOWER(:search)
          OR store."primaryPhone" LIKE :search
          OR LOWER(
            COALESCE(store.district, '')
          ) LIKE LOWER(:search)
          OR LOWER(
            COALESCE(store.tehsil, '')
          ) LIKE LOWER(:search)
        )`,
        { search: `%${search}%` },
      );
    }

    if (
      query?.status &&
      Object.values(SolarStoreStatus).includes(
        query.status as SolarStoreStatus,
      )
    ) {
      qb.andWhere(
        'store.status = :status',
        { status: query.status },
      );
    }

    return qb
      .orderBy('store.createdAt', 'DESC')
      .getMany();
  }

  async getSolarStore(id: number) {
    const store =
      await this.storeRepository.findOne({
        where: {
          id: Number(id),
          isHidden: false,
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Solar Store not found',
      );
    }

    return store;
  }

  async getMySolarStore(userId: number) {
    const store =
      await this.storeRepository.findOne({
        where: {
          linkedUserId: Number(userId),
          isHidden: false,
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Solar Store profile not found',
      );
    }

    if (
      store.status !== SolarStoreStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Solar Store account is not active',
      );
    }

    return store;
  }


  async getOnboardingSummary(storeId: number) {
    const store = await this.getSolarStore(storeId);

    const payments =
      await this.onboardingPaymentRepository.find({
        where: { solarStoreId: store.id },
        order: {
          paymentDate: 'DESC',
          id: 'DESC',
        },
      });

    const totalAmount = Math.round(
      Number(store.onboardingAmount) * 100,
    );

    const receivedAmount = payments.reduce(
      (sum, payment) =>
        sum +
        Math.round(Number(payment.amount) * 100),
      0,
    );

    const balanceAmount = Math.max(
      0,
      totalAmount - receivedAmount,
    );

    const status =
      receivedAmount <= 0
        ? 'PENDING'
        : balanceAmount <= 0
          ? 'PAID'
          : 'PARTIAL';

    return {
      solarStoreId: store.id,
      onboardingAmount: totalAmount / 100,
      receivedAmount: receivedAmount / 100,
      balanceAmount: balanceAmount / 100,
      status,
      payments,
    };
  }

  async recordOnboardingPayment(
    storeId: number,
    body: any,
    user: any,
  ) {
    const amount = Number(body?.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      Math.round(amount * 100) / 100 !== amount
    ) {
      throw new BadRequestException(
        'Valid positive payment amount is required',
      );
    }

    const paymentDate = String(
      body?.paymentDate || '',
    ).trim();

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) ||
      !Number.isFinite(
        new Date(`${paymentDate}T00:00:00Z`).getTime(),
      ) ||
      new Date(`${paymentDate}T00:00:00Z`)
        .toISOString()
        .slice(0, 10) !== paymentDate
    ) {
      throw new BadRequestException(
        'Valid payment date in YYYY-MM-DD format is required',
      );
    }

    const amountInPaise = Math.round(amount * 100);

    return this.dataSource.transaction(
      async (manager) => {
        const storeRepository =
          manager.getRepository(SolarStore);

        const paymentRepository =
          manager.getRepository(
            SolarStoreOnboardingPayment,
          );

        // Serialize payments for the same store.
        const store = await storeRepository
          .createQueryBuilder('store')
          .setLock('pessimistic_write')
          .where('store.id = :id', {
            id: Number(storeId),
          })
          .andWhere('store."isHidden" = false')
          .getOne();

        if (!store) {
          throw new NotFoundException(
            'Solar Store not found',
          );
        }

        const existingPayments =
          await paymentRepository.find({
            where: { solarStoreId: store.id },
          });

        const alreadyReceived =
          existingPayments.reduce(
            (sum, payment) =>
              sum +
              Math.round(
                Number(payment.amount) * 100,
              ),
            0,
          );

        const totalPayable = Math.round(
          Number(store.onboardingAmount) * 100,
        );

        if (
          alreadyReceived + amountInPaise >
          totalPayable
        ) {
          throw new BadRequestException(
            'Payment exceeds outstanding onboarding balance',
          );
        }

        const payment =
          paymentRepository.create({
            solarStoreId: store.id,
            amount,
            paymentDate,
            paymentMode:
              String(
                body?.paymentMode || '',
              ).trim() || null,
            paymentReference:
              String(
                body?.paymentReference || '',
              ).trim() || null,
            proofUrl:
              String(
                body?.proofUrl || '',
              ).trim() || null,
            remarks:
              String(
                body?.remarks || '',
              ).trim() || null,
            receivedBy: user?.id
              ? Number(user.id)
              : null,
            receivedByName:
              String(
                user?.name || '',
              ).trim() || null,
          });

        return paymentRepository.save(payment);
      },
    );
  }


async updateSolarStore(
  id: number,
  body: any,
  user: any,
) {
  const storeId = Number(id);

  if (!Number.isInteger(storeId) || storeId <= 0) {
    throw new BadRequestException(
      'Invalid Solar Store ID',
    );
  }

  return this.dataSource.transaction(
    async (manager) => {
      const storeRepository =
        manager.getRepository(SolarStore);

      const userRepository =
        manager.getRepository(User);

      const paymentRepository =
        manager.getRepository(
          SolarStoreOnboardingPayment,
        );

      const auditRepository =
        manager.getRepository(SolarStoreAudit);

      const store = await storeRepository
        .createQueryBuilder('store')
        .setLock('pessimistic_write')
        .where('store.id = :id', { id: storeId })
        .andWhere('store."isHidden" = false')
        .getOne();

      if (!store) {
        throw new NotFoundException(
          'Solar Store not found',
        );
      }

      const previousValues = {
  onboardingAmount: store.onboardingAmount,
  marginPercentage: store.marginPercentage,
  requiredPaymentPercentageOverride:
    store.requiredPaymentPercentageOverride,
  status: store.status,
};

      if (!store.linkedUserId) {
        throw new BadRequestException(
          'Solar Store has no linked CRM account',
        );
      }

      const linkedUser =
        await userRepository.findOne({
          where: {
            id: Number(store.linkedUserId),
          },
        });

      if (!linkedUser) {
        throw new NotFoundException(
          'Linked Solar Store CRM user not found',
        );
      }

      const textOrNull = (
        value: any,
      ): string | null =>
        String(value ?? '').trim() || null;

      if (body?.name !== undefined) {
        const name = String(
          body.name ?? '',
        ).trim();

        if (!name) {
          throw new BadRequestException(
            'Solar Store name is required',
          );
        }

        store.name = name;
        linkedUser.name = name;
      }

      if (body?.email !== undefined) {
        const email = String(
          body.email ?? '',
        )
          .trim()
          .toLowerCase();

        if (!email) {
          throw new BadRequestException(
            'Email is required',
          );
        }

        const existingUser =
          await userRepository.findOne({
            where: { email },
          });

        if (
          existingUser &&
          existingUser.id !== linkedUser.id
        ) {
          throw new BadRequestException(
            'User with this email already exists',
          );
        }

        store.email = email;
        linkedUser.email = email;
      }

      if (
        body?.primaryPhone !== undefined
      ) {
        const phone = this.normalizePhone(
          body.primaryPhone,
        );

        if (phone.length !== 10) {
          throw new BadRequestException(
            'Valid 10 digit primary phone is required',
          );
        }

        const duplicate =
          await storeRepository.findOne({
            where: {
              primaryPhone: phone,
            },
          });

        if (
          duplicate &&
          duplicate.id !== store.id
        ) {
          throw new BadRequestException(
            'Solar Store with this phone already exists',
          );
        }

        store.primaryPhone = phone;
      }

      if (
        body?.secondaryPhone !== undefined
      ) {
        const phone = body.secondaryPhone
          ? this.normalizePhone(
              body.secondaryPhone,
            )
          : null;

        if (phone && phone.length !== 10) {
          throw new BadRequestException(
            'Invalid secondary phone',
          );
        }

        store.secondaryPhone = phone;
      }

      const editableTextFields = [
        'ownerName',
        'address',
        'tehsil',
        'district',
        'state',
        'shopPhotoUrl',
      ] as const;

            for (const field of editableTextFields) {
        if (body?.[field] !== undefined) {
          store[field] = textOrNull(
            body[field],
          );
        }
      }

      // Update GPS coordinates only when supplied.
      // Null or empty values clear the saved location.
      if (
        body?.gpsLatitude !== undefined ||
        body?.gpsLongitude !== undefined
      ) {
        const latitude =
          body?.gpsLatitude === undefined
            ? store.gpsLatitude
            : body.gpsLatitude === null ||
                body.gpsLatitude === ''
              ? null
              : Number(body.gpsLatitude);

        const longitude =
          body?.gpsLongitude === undefined
            ? store.gpsLongitude
            : body.gpsLongitude === null ||
                body.gpsLongitude === ''
              ? null
              : Number(body.gpsLongitude);

        if (
          (latitude === null) !== (longitude === null) ||
          (latitude !== null &&
            (!Number.isFinite(latitude) ||
              latitude < -90 ||
              latitude > 90)) ||
          (longitude !== null &&
            (!Number.isFinite(longitude) ||
              longitude < -180 ||
              longitude > 180))
        ) {
          throw new BadRequestException(
            'Invalid GPS coordinates',
          );
        }

        store.gpsLatitude = latitude;
        store.gpsLongitude = longitude;
      }

      if (
        body?.onboardingAmount !== undefined
      ) {
        const amount = this.validateAmount(
          body.onboardingAmount,
          'onboarding amount',
          150000,
        );

        const payments =
          await paymentRepository.find({
            where: {
              solarStoreId: store.id,
            },
          });

        const receivedPaise =
          payments.reduce(
            (sum, payment) =>
              sum +
              Math.round(
                Number(payment.amount) * 100,
              ),
            0,
          );

        if (
          Math.round(amount * 100) <
          receivedPaise
        ) {
          throw new BadRequestException(
            'Onboarding amount cannot be less than payments already received',
          );
        }

        store.onboardingAmount = amount;
      }

      if (
        body?.marginPercentage !== undefined
      ) {
        store.marginPercentage =
          this.validateAmount(
            body.marginPercentage,
            'margin percentage',
            30,
            100,
          );
      }

      if (
        body?.requiredPaymentPercentageOverride !==
        undefined
      ) {
        const value =
          body.requiredPaymentPercentageOverride;

        store.requiredPaymentPercentageOverride =
          value === null || value === ''
            ? null
            : this.validateAmount(
                value,
                'payment percentage',
                20,
                100,
              );
      }

      if (body?.status !== undefined) {
  const status = String(
    body.status ?? '',
  ).trim() as SolarStoreStatus;

  if (
    !Object.values(
      SolarStoreStatus,
    ).includes(status)
  ) {
    throw new BadRequestException(
      'Invalid Solar Store status',
    );
  }

  store.status = status;

  // Reuse the existing CRM account-disable mechanism.
  linkedUser.isHidden =
    status !== SolarStoreStatus.ACTIVE;
}

      if (body?.password !== undefined) {
        const password = String(
          body.password ?? '',
        );

        if (password) {
          if (password.trim().length < 8) {
            throw new BadRequestException(
              'Password must contain at least 8 characters',
            );
          }

          linkedUser.password =
            await bcrypt.hash(
              password,
              10,
            );
        }
      }

      // Preserve any additional CRM roles.
      const existingRoles =
        Array.isArray(linkedUser.roles)
          ? linkedUser.roles
          : [];

      if (
        !existingRoles.includes(
          UserRole.SOLAR_STORE,
        )
      ) {
        linkedUser.roles = [
          ...existingRoles,
          UserRole.SOLAR_STORE,
        ];
      }

      store.updatedBy = user?.id
        ? Number(user.id)
        : null;

      store.updatedByName =
        textOrNull(user?.name);

      const auditFields = [
  'onboardingAmount',
  'marginPercentage',
  'requiredPaymentPercentageOverride',
  'status',
] as const;

const auditRecords: SolarStoreAudit[] = [];

for (const field of auditFields) {
  const oldValue = previousValues[field];
  const newValue = store[field];

  const normalizeValue = (
    value: unknown,
  ): string | null => {
    if (value === null || value === undefined) {
      return null;
    }

    if (
      field !== 'status' &&
      value !== '' &&
      Number.isFinite(Number(value))
    ) {
      return Number(value).toFixed(2);
    }

    return String(value);
  };

  const previous = normalizeValue(oldValue);
  const current = normalizeValue(newValue);

  if (previous === current) {
    continue;
  }

  auditRecords.push(
    auditRepository.create({
      solarStoreId: store.id,
      action:
        field === 'status'
          ? SolarStoreAuditAction.STATUS_CHANGED
          : SolarStoreAuditAction.UPDATED,
      fieldName: field,
      oldValue: previous,
      newValue: current,
      changedBy: user?.id
        ? Number(user.id)
        : null,
      changedByName:
        String(user?.name ?? '').trim() || null,
      changedByRole:
        Array.isArray(user?.roles)
          ? user.roles.includes('OWNER')
            ? 'OWNER'
            : user.roles.includes('FRANCHISE_HEAD')
              ? 'FRANCHISE_HEAD'
              : user.roles.join(',')
          : null,
      remarks: null,
    }),
  );
}

await userRepository.save(linkedUser);

const savedStore =
  await storeRepository.save(store);

if (auditRecords.length > 0) {
  await auditRepository.save(auditRecords);
}

return savedStore;
    },
  );
}

async getSolarStoreAuditHistory(storeId: number) {
  await this.getSolarStore(storeId);

  return this.dataSource
    .getRepository(SolarStoreAudit)
    .find({
      where: { solarStoreId: storeId },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    });
}

}


