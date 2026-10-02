import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
} from 'typeorm';
import {
  randomBytes,
  randomUUID,
} from 'crypto';
import * as bcrypt from 'bcrypt';

import { createClient } from '@supabase/supabase-js';


import {
  User,
  UserRole,
} from '../users/user.entity';

import {
  SolarMitra,
  SolarMitraStatus,
} from './solar-mitra.entity';

import {
  SolarMitraSetting,
  SolarMitraPayoutQualificationType,
} from './solar-mitra-setting.entity';

import {
  SolarMitraReferral,
  SolarMitraReferralSourceType,
  SolarMitraReferralStatus,
} from './solar-mitra-referral.entity';

import { LeadsService } from '../leads/leads.service';
import { Lead } from '../leads/lead.entity';

import {
  SolarMitraPayout,
  SolarMitraPayoutStatus,
} from './solar-mitra-payout.entity';


@Injectable()
export class SolarMitraService {
  constructor(
  @InjectRepository(SolarMitra)
  private readonly solarMitraRepository: Repository<SolarMitra>,

  @InjectRepository(SolarMitraReferral)
  private readonly referralRepository: Repository<SolarMitraReferral>,

  @InjectRepository(SolarMitraSetting)
  private readonly settingRepository: Repository<SolarMitraSetting>,

  @InjectRepository(SolarMitraPayout)
private readonly payoutRepository:
  Repository<SolarMitraPayout>,

private readonly leadsService: LeadsService,

private readonly dataSource: DataSource,
) {}

  private normalizePhone(value: any): string {
    const digits = String(value || '').replace(/\D/g, '');

    if (digits.length > 10) {
      return digits.slice(-10);
    }

    return digits;
  }

  async uploadShopPhoto(
  file: any,
  user: any,
) {
  if (!file) {
    throw new BadRequestException(
      'Shop photo is required',
    );
  }

  const mimeType = String(
    file.mimetype || '',
  );

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

  const maxSize =
    10 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new BadRequestException(
      'Shop photo must be less than 10 MB',
    );
  }

  const supabaseUrl =
    process.env.SUPABASE_URL;

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const bucket =
    process.env
      .SUPABASE_PROJECT_DOCUMENTS_BUCKET ||
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

  const originalName = String(
    file.originalname || 'shop-photo',
  );

  const extension =
    originalName.includes('.')
      ? originalName.split('.').pop()
      : mimeType.split('/')[1] || 'jpg';

  const safeExtension = String(
    extension || 'jpg',
  ).replace(
    /[^a-zA-Z0-9]/g,
    '',
  );

  const filePath =
    `solar-mitra/shop-photos/` +
    `user-${user?.id || 'unknown'}/` +
    `${Date.now()}-${randomUUID()}.` +
    `${safeExtension}`;

  const uploadResult =
    await supabase.storage
      .from(bucket)
      .upload(
        filePath,
        file.buffer,
        {
          contentType: mimeType,
          upsert: false,
        },
      );

  if (uploadResult.error) {
    throw new BadRequestException(
      uploadResult.error.message,
    );
  }

  const publicUrlResult =
    supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

  const fileUrl =
    publicUrlResult.data.publicUrl;

  return {
    message:
      'Shop photo uploaded successfully',
    fileUrl,
    filePath,
  };
}

  private async generatePublicReferralToken(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const token = randomBytes(24).toString('hex');

      const existing =
        await this.solarMitraRepository.findOne({
          where: {
            publicReferralToken: token,
          },
        });

      if (!existing) {
        return token;
      }
    }

    throw new BadRequestException(
      'Unable to generate Solar Mitra referral token',
    );
  }

  async solarMitraLogin(
  username: string,
  password: string,
) {
  const loginUsername =
    String(username || '').trim();

  const loginPassword =
    String(password || '');

  if (
    !loginUsername ||
    !loginPassword.trim()
  ) {
    throw new UnauthorizedException(
      'Username and password are required',
    );
  }

  const mitras =
    await this.solarMitraRepository
      .createQueryBuilder('mitra')
      .where(
        'mitra."isHidden" = false',
      )
      .andWhere(
        'mitra.status = :activeStatus',
        {
          activeStatus:
            SolarMitraStatus.ACTIVE,
        },
      )
      .andWhere(
        `(
          LOWER(
            TRIM(
              COALESCE(
                mitra.email,
                ''
              )
            )
          ) =
          LOWER(
            TRIM(
              :loginUsername
            )
          )

          OR

          REGEXP_REPLACE(
            COALESCE(
              mitra."primaryPhone",
              ''
            ),
            '[^0-9]',
            '',
            'g'
          ) =
          REGEXP_REPLACE(
            :loginUsername,
            '[^0-9]',
            '',
            'g'
          )
        )`,
        {
          loginUsername,
        },
      )
      .orderBy(
        'mitra.id',
        'ASC',
      )
      .getMany();

  if (!mitras.length) {
    throw new UnauthorizedException(
      'Solar Mitra portal access not found',
    );
  }

  if (mitras.length > 1) {
    throw new UnauthorizedException(
      'Multiple active Solar Mitra accounts match this login. Please contact admin.',
    );
  }

  const mitra =
    mitras[0];

  if (!mitra.portalPassword) {
    throw new UnauthorizedException(
      'Solar Mitra portal access is not enabled',
    );
  }

  if (
    loginPassword !==
    mitra.portalPassword
  ) {
    throw new UnauthorizedException(
      'Invalid Solar Mitra password',
    );
  }

  const access_token =
    jwt.sign(
      {
        sub: mitra.id,

        solarMitraId:
          mitra.id,

        solarMitraName:
          mitra.name,

        roleType:
          'SOLAR_MITRA_PORTAL',

        roles: [
          'SOLAR_MITRA',
        ],
      },
      'mysecretkey',
      {
        expiresIn: '7d',
      },
    );

  return {
    access_token,

    solarMitra: {
      id: mitra.id,
      name: mitra.name,
      businessName:
        mitra.businessName,
      primaryPhone:
        mitra.primaryPhone,
      secondaryPhone:
        mitra.secondaryPhone,
      email:
        mitra.email,
      address:
        mitra.address,
      area:
        mitra.area,
      city:
        mitra.city,
      state:
        mitra.state,
      shopPhotoUrl:
        mitra.shopPhotoUrl,
    },
  };
}

verifySolarMitraToken(
  token: string,
) {
  if (!token) {
    throw new UnauthorizedException(
      'Solar Mitra token missing',
    );
  }

  try {
    const payload: any =
      jwt.verify(
        token,
        'mysecretkey',
      );

    if (
      !payload?.solarMitraId ||
      payload?.roleType !==
        'SOLAR_MITRA_PORTAL'
    ) {
      throw new UnauthorizedException(
        'Invalid Solar Mitra token',
      );
    }

    return payload;
  } catch (error) {
    if (
      error instanceof
      UnauthorizedException
    ) {
      throw error;
    }

    throw new UnauthorizedException(
      'Invalid or expired Solar Mitra token',
    );
  }
}

async getSolarMitraPortalProfile(
  solarMitraId: number,
) {
  const mitra =
    await this.solarMitraRepository.findOne({
      where: {
        id: Number(solarMitraId),
        isHidden: false,
        status: SolarMitraStatus.ACTIVE,
      },
    });

  if (!mitra) {
    throw new UnauthorizedException(
      'Solar Mitra portal access not found',
    );
  }

  return {
    id: mitra.id,
    name: mitra.name,
    businessName:
      mitra.businessName,
    primaryPhone:
      mitra.primaryPhone,
    secondaryPhone:
      mitra.secondaryPhone,
    email:
      mitra.email,
    address:
      mitra.address,
    area:
      mitra.area,
    city:
      mitra.city,
    state:
      mitra.state,
    gpsLatitude:
      mitra.gpsLatitude,
    gpsLongitude:
      mitra.gpsLongitude,
    gpsAddress:
      mitra.gpsAddress,
    shopPhotoUrl:
      mitra.shopPhotoUrl,
  };
}

private buildPortalPayoutInfo(
  payout?: SolarMitraPayout | null,
) {
  if (!payout) {
    return null;
  }

  return {
    payoutAmount:
      payout.payoutAmount,

    requiredPaymentPercentage:
      payout.requiredProjectPaymentPercentage,

    qualifyingPaymentPercentage:
      payout.qualifyingPaymentPercentage,

    status:
      payout.status,

    eligibleAt:
      payout.eligibleAt,

    paidAt:
      payout.paidAt,

    paymentMode:
      payout.paymentMode,

    paymentReference:
      payout.paymentReference,
  };
}

async listSolarMitraPortalReferrals(
  solarMitraId: number,
) {
  const referrals =
    await this.referralRepository.find({
      where: {
        solarMitraId:
          Number(solarMitraId),
        isHidden: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

  const referralIds =
  referrals.map(
    (referral) =>
      Number(referral.id),
  );

const payouts =
  referralIds.length
    ? await this.payoutRepository
        .createQueryBuilder('payout')
        .where(
          'payout."referralId" IN (:...referralIds)',
          {
            referralIds,
          },
        )
        .getMany()
    : [];

const payoutByReferralId =
  new Map<number, SolarMitraPayout>();

for (const payout of payouts) {
  payoutByReferralId.set(
    Number(payout.referralId),
    payout,
  );
}

return referrals.map(
  (referral) => ({
    id: referral.id,

    customerName:
      referral.customerName,

    customerPhone:
      referral.customerPhone,

    alternatePhone:
      referral.alternatePhone,

    customerAddress:
      referral.customerAddress,

    customerArea:
      referral.customerArea,

    customerCity:
      referral.customerCity,

    remarks:
      referral.remarks,

    sourceType:
      referral.sourceType,

    status:
      referral.status,

    linkedLeadId:
      referral.linkedLeadId,

    linkedMeetingId:
      referral.linkedMeetingId,

    linkedProjectId:
      referral.linkedProjectId,

    payoutAmount:
      referral.payoutAmountSnapshot,

    requiredPaymentPercentage:
      referral
        .requiredPaymentPercentageSnapshot,

    payoutTermsSnapshottedAt:
      referral.payoutTermsSnapshottedAt,

    payout:
      this.buildPortalPayoutInfo(
        payoutByReferralId.get(
          Number(referral.id),
        ),
      ),

    createdAt:
      referral.createdAt,

    updatedAt:
      referral.updatedAt,
  }),
);
}

async getSolarMitraPortalReferral(
  solarMitraId: number,
  referralId: number,
) {
  const referral =
    await this.referralRepository.findOne({
      where: {
        id: Number(referralId),

        /*
         * Critical ownership condition.
         */
        solarMitraId:
          Number(solarMitraId),

        isHidden: false,
      },
    });

  if (!referral) {
    throw new NotFoundException(
      'Solar Mitra referral not found',
    );
  }

  const payout =
  await this.payoutRepository.findOne({
    where: {
      referralId:
        referral.id,
    },
  });

  return {
    id: referral.id,

    customerName:
      referral.customerName,

    customerPhone:
      referral.customerPhone,

    alternatePhone:
      referral.alternatePhone,

    customerAddress:
      referral.customerAddress,

    customerArea:
      referral.customerArea,

    customerCity:
      referral.customerCity,

    customerGpsAddress:
      referral.customerGpsAddress,

    remarks:
      referral.remarks,

    sourceType:
      referral.sourceType,

    status:
      referral.status,

    linkedLeadId:
      referral.linkedLeadId,

    linkedMeetingId:
      referral.linkedMeetingId,

    linkedProjectId:
      referral.linkedProjectId,

    payoutAmount:
      referral.payoutAmountSnapshot,

    requiredPaymentPercentage:
      referral
        .requiredPaymentPercentageSnapshot,

    payoutTermsSnapshottedAt:
      referral.payoutTermsSnapshottedAt,

      payout:
  this.buildPortalPayoutInfo(
    payout,
  ),

    createdAt:
      referral.createdAt,

    updatedAt:
      referral.updatedAt,
  };
}

  async createSolarMitra(
  body: any,
  user: any,
) {
  const name =
    String(body?.name || '').trim();

  const primaryPhone =
    this.normalizePhone(
      body?.primaryPhone,
    );

  if (!name) {
    throw new BadRequestException(
      'Solar Mitra name is required',
    );
  }

  if (primaryPhone.length !== 10) {
    throw new BadRequestException(
      'Valid 10 digit primary phone is required',
    );
  }

  const email =
    String(body?.email || '')
      .trim()
      .toLowerCase();

  const password =
    String(
      body?.password ||
      body?.portalPassword ||
      '',
    );

  if (!email) {
    throw new BadRequestException(
      'Email is required for Solar Mitra login',
    );
  }

  if (!password.trim()) {
    throw new BadRequestException(
      'Password is required for Solar Mitra login',
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

  const existingMitra =
    await this.solarMitraRepository
      .createQueryBuilder('mitra')
      .where(
        `RIGHT(
          REGEXP_REPLACE(
            COALESCE(mitra."primaryPhone", ''),
            '[^0-9]',
            '',
            'g'
          ),
          10
        ) = :phone`,
        {
          phone: primaryPhone,
        },
      )
      .andWhere(
        'mitra."isHidden" = false',
      )
      .getOne();

  if (existingMitra) {
    throw new BadRequestException(
      'Solar Mitra with this phone already exists',
    );
  }

  const existingUser =
    await this.dataSource
      .getRepository(User)
      .findOne({
        where: {
          email,
        },
      });

  if (existingUser) {
    throw new BadRequestException(
      'User with this email already exists',
    );
  }

  const publicReferralToken =
    await this.generatePublicReferralToken();

  return this.dataSource.transaction(
    async (manager) => {
      const userRepository =
        manager.getRepository(User);

      const mitraRepository =
        manager.getRepository(SolarMitra);

      const hashedPassword =
        await bcrypt.hash(
          password,
          10,
        );

      const linkedUser =
        userRepository.create({
          name,
          email,
          password: hashedPassword,
          roles: [
            UserRole.SOLAR_MITRA,
          ],
        });

      const savedUser =
        await userRepository.save(
          linkedUser,
        );

      const mitra =
        mitraRepository.create({
          name,

          businessName:
            String(
              body?.businessName || '',
            ).trim() || null,

          primaryPhone,

          secondaryPhone,

          email,

          address:
            String(
              body?.address || '',
            ).trim() || null,

          area:
            String(
              body?.area || '',
            ).trim() || null,

          city:
            String(
              body?.city || '',
            ).trim() || null,

          state:
            String(
              body?.state || '',
            ).trim() || null,

          gpsLatitude:
            body?.gpsLatitude !== undefined &&
            body?.gpsLatitude !== null &&
            body?.gpsLatitude !== ''
              ? Number(
                  body.gpsLatitude,
                )
              : null,

          gpsLongitude:
            body?.gpsLongitude !== undefined &&
            body?.gpsLongitude !== null &&
            body?.gpsLongitude !== ''
              ? Number(
                  body.gpsLongitude,
                )
              : null,

          gpsAddress:
            String(
              body?.gpsAddress || '',
            ).trim() || null,

          shopPhotoUrl:
            String(
              body?.shopPhotoUrl || '',
            ).trim() || null,

          linkedUserId:
            savedUser.id,

          portalPassword:
  undefined,

          publicReferralToken,

          status:
            SolarMitraStatus.ACTIVE,

          payoutAmountOverride:
            body?.payoutAmountOverride !==
              undefined &&
            body?.payoutAmountOverride !==
              null &&
            body?.payoutAmountOverride !== ''
              ? Number(
                  body.payoutAmountOverride,
                )
              : null,

          requiredPaymentPercentageOverride:
            body
              ?.requiredPaymentPercentageOverride !==
                undefined &&
            body
              ?.requiredPaymentPercentageOverride !==
                null &&
            body
              ?.requiredPaymentPercentageOverride !==
                ''
              ? Number(
                  body
                    .requiredPaymentPercentageOverride,
                )
              : null,

          franchiseManagerId:
            body?.franchiseManagerId
              ? Number(
                  body.franchiseManagerId,
                )
              : null,

          franchiseManagerName:
            String(
              body?.franchiseManagerName ||
                '',
            ).trim() || null,

          createdBy:
            user?.id
              ? Number(user.id)
              : null,

          createdByName:
            String(
              user?.name || '',
            ).trim() || null,

          updatedBy:
            user?.id
              ? Number(user.id)
              : null,

          updatedByName:
            String(
              user?.name || '',
            ).trim() || null,
        } as Partial<SolarMitra>);

      return mitraRepository.save(
        mitra,
      );
    },
  );
}

  async listSolarMitras(query: any) {
    const qb =
      this.solarMitraRepository
        .createQueryBuilder('mitra')
        .where('mitra."isHidden" = false');

    const search =
      String(query?.search || '').trim();

    if (search) {
      qb.andWhere(
        `(
          LOWER(mitra.name) LIKE LOWER(:search)
          OR LOWER(
            COALESCE(mitra."businessName", '')
          ) LIKE LOWER(:search)
          OR LOWER(
            COALESCE(mitra.city, '')
          ) LIKE LOWER(:search)
          OR LOWER(
            COALESCE(mitra.area, '')
          ) LIKE LOWER(:search)
          OR mitra."primaryPhone" LIKE :search
          OR COALESCE(
            mitra."secondaryPhone",
            ''
          ) LIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (query?.status) {
      qb.andWhere(
        'mitra.status = :status',
        {
          status: query.status,
        },
      );
    }

    if (query?.city) {
      qb.andWhere(
        'LOWER(mitra.city) = LOWER(:city)',
        {
          city: String(query.city).trim(),
        },
      );
    }

    if (query?.franchiseManagerId) {
      qb.andWhere(
        'mitra."franchiseManagerId" = :managerId',
        {
          managerId: Number(
            query.franchiseManagerId,
          ),
        },
      );
    }

    qb.orderBy(
      'mitra."createdAt"',
      'DESC',
    );

    return qb.getMany();
  }

  async getSolarMitra(id: number) {
    const mitra =
      await this.solarMitraRepository.findOne({
        where: {
          id: Number(id),
          isHidden: false,
        },
      });

    if (!mitra) {
      throw new NotFoundException(
        'Solar Mitra not found',
      );
    }

    return mitra;
  }

  async getSolarMitraByLinkedUserId(
  userId: number,
) {
  const normalizedUserId =
    Number(userId);

  if (
    !Number.isInteger(normalizedUserId) ||
    normalizedUserId <= 0
  ) {
    throw new NotFoundException(
      'Solar Mitra profile not found',
    );
  }

  const mitra =
    await this.solarMitraRepository.findOne({
      where: {
        linkedUserId: normalizedUserId,
        isHidden: false,
      },
    });

  if (!mitra) {
    throw new NotFoundException(
      'Solar Mitra profile not found',
    );
  }

  return mitra;
}

async getMySolarMitraProfile(
  userId: number,
) {
  const mitra =
    await this.getSolarMitraByLinkedUserId(
      userId,
    );

  return {
    id: mitra.id,
    name: mitra.name,
    businessName:
      mitra.businessName || null,
    primaryPhone:
      mitra.primaryPhone,
    secondaryPhone:
      mitra.secondaryPhone || null,
    email:
      mitra.email || null,
    address:
      mitra.address || null,
    area:
      mitra.area || null,
    city:
      mitra.city || null,
    state:
      mitra.state || null,
    gpsLatitude:
      mitra.gpsLatitude ?? null,
    gpsLongitude:
      mitra.gpsLongitude ?? null,
    gpsAddress:
      mitra.gpsAddress || null,
    shopPhotoUrl:
      mitra.shopPhotoUrl || null,
    publicReferralToken:
      mitra.publicReferralToken,
    status:
      mitra.status,
  };
}

  async updateSolarMitra(
  id: number,
  body: any,
  user: any,
) {
  const mitra =
    await this.getSolarMitra(id);

  /*
   * Prepare login-account changes separately from
   * ordinary Solar Mitra profile changes.
   */
  const requestedName =
    body?.name !== undefined
      ? String(body.name || '').trim()
      : mitra.name;

  if (!requestedName) {
    throw new BadRequestException(
      'Solar Mitra name is required',
    );
  }

  const requestedEmail =
    body?.email !== undefined
      ? String(body.email || '')
          .trim()
          .toLowerCase()
      : String(mitra.email || '')
          .trim()
          .toLowerCase();

  if (!requestedEmail) {
    throw new BadRequestException(
      'Email is required for Solar Mitra login',
    );
  }

  const requestedPassword =
    String(
      body?.password ||
      body?.portalPassword ||
      '',
    ).trim();

  if (
    requestedPassword &&
    requestedPassword.length < 4
  ) {
    throw new BadRequestException(
      'Password must be at least 4 characters',
    );
  }

  /*
   * Validate primary phone before entering the
   * transaction.
   */
  let requestedPrimaryPhone =
    mitra.primaryPhone;

  if (body?.primaryPhone !== undefined) {
    requestedPrimaryPhone =
      this.normalizePhone(
        body.primaryPhone,
      );

    if (
      requestedPrimaryPhone.length !== 10
    ) {
      throw new BadRequestException(
        'Valid 10 digit primary phone is required',
      );
    }

    const existing =
      await this.solarMitraRepository
        .createQueryBuilder('other')
        .where(
          `RIGHT(
            REGEXP_REPLACE(
              COALESCE(
                other."primaryPhone",
                ''
              ),
              '[^0-9]',
              '',
              'g'
            ),
            10
          ) = :phone`,
          {
            phone:
              requestedPrimaryPhone,
          },
        )
        .andWhere(
          'other."isHidden" = false',
        )
        .andWhere(
          'other.id != :id',
          {
            id: mitra.id,
          },
        )
        .getOne();

    if (existing) {
      throw new BadRequestException(
        'Solar Mitra with this phone already exists',
      );
    }
  }

  let requestedSecondaryPhone:
    string | null =
      (mitra as any).secondaryPhone ||
      null;

  if (
    body?.secondaryPhone !== undefined
  ) {
    requestedSecondaryPhone =
      body.secondaryPhone
        ? this.normalizePhone(
            body.secondaryPhone,
          )
        : null;

    if (
      requestedSecondaryPhone &&
      requestedSecondaryPhone.length !== 10
    ) {
      throw new BadRequestException(
        'Valid 10 digit secondary phone is required',
      );
    }
  }

  /*
   * Validate payout percentage before making
   * either profile or login-account changes.
   */
  let requestedPaymentPercentage:
    number | null =
      (mitra as any)
        .requiredPaymentPercentageOverride ??
      null;

  if (
    body
      ?.requiredPaymentPercentageOverride !==
    undefined
  ) {
    const value =
      body
        .requiredPaymentPercentageOverride;

    requestedPaymentPercentage =
      value !== null &&
      value !== ''
        ? Number(value)
        : null;

    if (
      requestedPaymentPercentage !==
        null &&
      (
        !Number.isFinite(
          requestedPaymentPercentage,
        ) ||
        requestedPaymentPercentage < 0 ||
        requestedPaymentPercentage > 100
      )
    ) {
      throw new BadRequestException(
        'Project payment percentage must be between 0 and 100',
      );
    }
  }

  /*
   * Validate status before the transaction.
   */
  let requestedStatus =
    mitra.status;

  if (body?.status !== undefined) {
    requestedStatus =
      String(
        body.status || '',
      ).trim() as SolarMitraStatus;

    if (
      !Object.values(
        SolarMitraStatus,
      ).includes(requestedStatus)
    ) {
      throw new BadRequestException(
        'Invalid Solar Mitra status',
      );
    }
  }

  /*
   * If this Mitra already has a CRM User,
   * protect against changing the email to one
   * belonging to another CRM user.
   *
   * If it is an older Mitra without linkedUserId,
   * the same check prevents us from silently
   * taking over somebody else's CRM account.
   */
  const emailOwner =
    await this.dataSource
      .getRepository(User)
      .findOne({
        where: {
          email: requestedEmail,
        },
      });

  if (
    emailOwner &&
    (
      !mitra.linkedUserId ||
      emailOwner.id !==
        Number(mitra.linkedUserId)
    )
  ) {
    throw new BadRequestException(
      'User with this email already exists',
    );
  }

  /*
   * Older Solar Mitra records may pre-date the
   * CRM User linkage.
   *
   * We can create their CRM login during edit,
   * but only when a password has been supplied.
   */
  if (
    !mitra.linkedUserId &&
    !requestedPassword
  ) {
    throw new BadRequestException(
      'Password is required to create CRM login for this Solar Mitra',
    );
  }

  return this.dataSource.transaction(
    async (manager) => {
      const userRepository =
        manager.getRepository(User);

      const mitraRepository =
        manager.getRepository(
          SolarMitra,
        );

      const transactionalMitra =
        await mitraRepository.findOne({
          where: {
            id: mitra.id,
          },
        });

      if (!transactionalMitra) {
        throw new NotFoundException(
          'Solar Mitra not found',
        );
      }

      /*
       * Existing linked CRM User:
       * synchronize name/email and optionally
       * password.
       */
      if (
        transactionalMitra.linkedUserId
      ) {
        const linkedUser =
          await userRepository.findOne({
            where: {
              id: Number(
                transactionalMitra
                  .linkedUserId,
              ),
            },
          });

        if (!linkedUser) {
          throw new NotFoundException(
            'Linked Solar Mitra CRM user not found',
          );
        }

        linkedUser.name =
          requestedName;

        linkedUser.email =
          requestedEmail;

        /*
         * Keep this account as a Solar Mitra.
         * Do not replace other roles if any were
         * intentionally added later.
         */
        const currentRoles =
          Array.isArray(
            linkedUser.roles,
          )
            ? linkedUser.roles
            : [];

        if (
          !currentRoles.includes(
            UserRole.SOLAR_MITRA,
          )
        ) {
          linkedUser.roles = [
            ...currentRoles,
            UserRole.SOLAR_MITRA,
          ];
        }

        if (requestedPassword) {
          linkedUser.password =
            await bcrypt.hash(
              requestedPassword,
              10,
            );
        }

        await userRepository.save(
          linkedUser,
        );
      } else {
        /*
         * Legacy Solar Mitra:
         * create its normal CRM User now and
         * permanently link the profile.
         */
        const hashedPassword =
          await bcrypt.hash(
            requestedPassword,
            10,
          );

        const linkedUser =
          userRepository.create({
            name: requestedName,
            email: requestedEmail,
            password: hashedPassword,
            roles: [
              UserRole.SOLAR_MITRA,
            ],
          });

        const savedUser =
          await userRepository.save(
            linkedUser,
          );

        transactionalMitra.linkedUserId =
          savedUser.id;
      }

      transactionalMitra.name =
        requestedName;

      transactionalMitra.primaryPhone =
        requestedPrimaryPhone;

      (transactionalMitra as any)
        .secondaryPhone =
        requestedSecondaryPhone;

      /*
       * Login email and profile email stay
       * synchronized.
       */
      transactionalMitra.email =
        requestedEmail;

      const nullableTextFields = [
        'businessName',
        'address',
        'area',
        'city',
        'state',
        'gpsAddress',
        'shopPhotoUrl',
        'franchiseManagerName',
      ];

      for (
        const field of nullableTextFields
      ) {
        if (
          body?.[field] !== undefined
        ) {
          (transactionalMitra as any)[
            field
          ] =
            String(
              body[field] || '',
            ).trim() || null;
        }
      }

      if (
        body?.gpsLatitude !== undefined
      ) {
        (transactionalMitra as any)
          .gpsLatitude =
          body.gpsLatitude !== null &&
          body.gpsLatitude !== ''
            ? Number(
                body.gpsLatitude,
              )
            : null;
      }

      if (
        body?.gpsLongitude !== undefined
      ) {
        (transactionalMitra as any)
          .gpsLongitude =
          body.gpsLongitude !== null &&
          body.gpsLongitude !== ''
            ? Number(
                body.gpsLongitude,
              )
            : null;
      }

      if (
        body?.payoutAmountOverride !==
        undefined
      ) {
        const value =
          body.payoutAmountOverride;

        (transactionalMitra as any)
          .payoutAmountOverride =
          value !== null &&
          value !== ''
            ? Number(value)
            : null;
      }

      (transactionalMitra as any)
        .requiredPaymentPercentageOverride =
        requestedPaymentPercentage;

      if (
        body?.franchiseManagerId !==
        undefined
      ) {
        (transactionalMitra as any)
          .franchiseManagerId =
          body.franchiseManagerId
            ? Number(
                body.franchiseManagerId,
              )
            : null;
      }

      transactionalMitra.status =
        requestedStatus;

      /*
       * portalPassword is legacy only.
       * Never persist a real password here.
       */
      (transactionalMitra as any)
        .portalPassword = null;

      (transactionalMitra as any)
        .updatedBy =
        user?.id
          ? Number(user.id)
          : null;

      (transactionalMitra as any)
        .updatedByName =
        String(
          user?.name || '',
        ).trim() || null;

      return mitraRepository.save(
        transactionalMitra,
      );
    },
  );
}

  async getPublicSolarMitraByToken(
  token: string,
) {
  const normalizedToken =
    String(token || '').trim();

  if (!normalizedToken) {
    throw new NotFoundException(
      'Solar Mitra referral link not found',
    );
  }

  const mitra =
    await this.solarMitraRepository.findOne({
      where: {
        publicReferralToken:
          normalizedToken,
        isHidden: false,
        status: SolarMitraStatus.ACTIVE,
      },
    });

  if (!mitra) {
    throw new NotFoundException(
      'Solar Mitra referral link not found',
    );
  }

  return mitra;
}

async getPublicReferralPage(
  token: string,
) {
  const mitra =
    await this.getPublicSolarMitraByToken(
      token,
    );

  /*
   * Return only information suitable for the
   * public referral page.
   *
   * Never return portalPassword, payout settings,
   * internal manager IDs or other CRM fields.
   */
  return {
    solarMitraName: mitra.name,
    businessName:
      mitra.businessName || null,
    area:
      mitra.area || null,
    city:
      mitra.city || null,
  };
}

async createPublicQrReferral(
  token: string,
  body: any,
) {
  const mitra =
    await this.getPublicSolarMitraByToken(
      token,
    );

  return this.createReferralForMitra(
    mitra.id,
    body,
    SolarMitraReferralSourceType.PUBLIC_QR,
    {
      id: null,
      name: null,
      type: 'PUBLIC_QR',
    },
  );
}

  async createReferralForMitra(
  solarMitraId: number,
  body: any,
  sourceType:
    SolarMitraReferralSourceType =
      SolarMitraReferralSourceType.MITRA_PORTAL,
  submittedBy?: {
    id?: number | null;
    name?: string | null;
    type?: string | null;
  },
) {
  const mitra =
    await this.solarMitraRepository.findOne({
      where: {
        id: Number(solarMitraId),
        isHidden: false,
      },
    });

  if (!mitra) {
    throw new NotFoundException(
      'Solar Mitra not found',
    );
  }

  if (mitra.status !== SolarMitraStatus.ACTIVE) {
    throw new BadRequestException(
      'Solar Mitra is not active',
    );
  }

  const customerName =
    String(body?.customerName || '').trim();

  const customerPhone =
    this.normalizePhone(body?.customerPhone);

  if (!customerName) {
    throw new BadRequestException(
      'Customer name is required',
    );
  }

  if (customerPhone.length !== 10) {
    throw new BadRequestException(
      'Valid 10 digit customer phone is required',
    );
  }

  /*
 * Prevent duplicate Solar Mitra attribution for the same
 * customer phone.
 *
 * A valid Solar Mitra referral creates its CRM Lead
 * immediately below. There is no separate referral
 * approval/conversion stage.
 */
  const existingReferral =
    await this.referralRepository
      .createQueryBuilder('referral')
      .where(
        `RIGHT(
          REGEXP_REPLACE(
            COALESCE(referral."customerPhone", ''),
            '[^0-9]',
            '',
            'g'
          ),
          10
        ) = :phone`,
        {
          phone: customerPhone,
        },
      )
      .andWhere(
        'referral."isHidden" = false',
      )
      .andWhere(
        'referral.status != :rejectedStatus',
        {
          rejectedStatus:
            SolarMitraReferralStatus.REJECTED,
        },
      )
      .getOne();

  if (existingReferral) {
    throw new BadRequestException(
      'A Solar Mitra referral already exists for this customer phone',
    );
  }

  const alternatePhone =
    body?.alternatePhone
      ? this.normalizePhone(body.alternatePhone)
      : null;

  if (
    alternatePhone &&
    alternatePhone.length !== 10
  ) {
    throw new BadRequestException(
      'Valid 10 digit alternate phone is required',
    );
  }

  const referral =
    this.referralRepository.create({
      solarMitraId: mitra.id,

      solarMitraName: mitra.name,

      solarMitraBusinessName:
        mitra.businessName || null,

      solarMitraPhone:
        mitra.primaryPhone || null,

      solarMitraAddress:
        mitra.address || null,

      solarMitraArea:
        mitra.area || null,

      solarMitraCity:
        mitra.city || null,

      customerName,

      customerPhone,

      alternatePhone,

      customerAddress:
        String(
          body?.customerAddress || '',
        ).trim() || null,

      customerArea:
        String(
          body?.customerArea || '',
        ).trim() || null,

      customerCity:
        String(
          body?.customerCity || '',
        ).trim() || null,

      customerGpsLatitude:
        body?.customerGpsLatitude !== undefined &&
        body?.customerGpsLatitude !== null &&
        body?.customerGpsLatitude !== ''
          ? Number(body.customerGpsLatitude)
          : null,

      customerGpsLongitude:
        body?.customerGpsLongitude !== undefined &&
        body?.customerGpsLongitude !== null &&
        body?.customerGpsLongitude !== ''
          ? Number(body.customerGpsLongitude)
          : null,

      customerGpsAddress:
        String(
          body?.customerGpsAddress || '',
        ).trim() || null,

      remarks:
        String(body?.remarks || '').trim() ||
        null,

      sourceType,

      status:
        SolarMitraReferralStatus.SUBMITTED,

      submittedBy:
        submittedBy?.id
          ? Number(submittedBy.id)
          : null,

      submittedByName:
        String(
          submittedBy?.name || '',
        ).trim() || null,

      submittedByType:
        String(
          submittedBy?.type || '',
        ).trim() || null,
    } as Partial<SolarMitraReferral>);

  const savedReferral =
  await this.referralRepository.save(
    referral,
  );

try {
  const leadData: Partial<Lead> = {
    name: savedReferral.customerName,

    phone: savedReferral.customerPhone,

    alternatePhone:
      savedReferral.alternatePhone ||
      undefined,

    address:
      savedReferral.customerAddress ||
      undefined,

    city:
      savedReferral.customerCity ||
      undefined,

    source: 'SOLAR_MITRA',

    remarks:
      savedReferral.remarks ||
      undefined,
  };

  const lead =
    await this.leadsService
      .createSolarMitraLead(
        leadData,
      );

  savedReferral.linkedLeadId =
    lead.id;

  savedReferral.status =
    SolarMitraReferralStatus
      .LEAD_CREATED;

  /*
   * Snapshot the applicable payout terms
   * when this referral successfully enters
   * the CRM as a Lead.
   */
  const setting =
    await this.getOrCreateSettings();

  savedReferral.payoutAmountSnapshot =
    mitra.payoutAmountOverride !==
      null &&
    mitra.payoutAmountOverride !==
      undefined
      ? Number(
          mitra.payoutAmountOverride,
        )
      : Number(
          setting.defaultPayoutAmount,
        );

  savedReferral
    .requiredPaymentPercentageSnapshot =
    mitra
      .requiredPaymentPercentageOverride !==
        null &&
    mitra
      .requiredPaymentPercentageOverride !==
        undefined
      ? Number(
          mitra
            .requiredPaymentPercentageOverride,
        )
      : Number(
          setting
            .requiredProjectPaymentPercentage,
        );

  savedReferral
    .payoutTermsSnapshottedAt =
    new Date();

  return this.referralRepository.save(
    savedReferral,
  );
} catch (error) {
  /*
   * The referral must not remain stored if
   * the corresponding Lead could not be
   * created.
   */
  await this.referralRepository.delete(
    savedReferral.id,
  );

  throw error;
}
}

async listReferrals(query: any) {
  const qb =
    this.referralRepository
      .createQueryBuilder('referral')
      .where(
        'referral."isHidden" = false',
      );

  const search =
    String(query?.search || '').trim();

  if (search) {
    qb.andWhere(
      `(
        LOWER(
          referral."customerName"
        ) LIKE LOWER(:search)

        OR referral."customerPhone"
          LIKE :search

        OR LOWER(
          COALESCE(
            referral."customerCity",
            ''
          )
        ) LIKE LOWER(:search)

        OR LOWER(
          referral."solarMitraName"
        ) LIKE LOWER(:search)

        OR LOWER(
          COALESCE(
            referral."solarMitraBusinessName",
            ''
          )
        ) LIKE LOWER(:search)

        OR COALESCE(
          referral."solarMitraPhone",
          ''
        ) LIKE :search

        OR LOWER(
          COALESCE(
            referral."solarMitraCity",
            ''
          )
        ) LIKE LOWER(:search)

        OR LOWER(
          COALESCE(
            referral."solarMitraArea",
            ''
          )
        ) LIKE LOWER(:search)
      )`,
      {
        search: `%${search}%`,
      },
    );
  }

  if (query?.status) {
    qb.andWhere(
      'referral.status = :status',
      {
        status: query.status,
      },
    );
  }

  if (query?.solarMitraId) {
    qb.andWhere(
      'referral."solarMitraId" = :solarMitraId',
      {
        solarMitraId:
          Number(query.solarMitraId),
      },
    );
  }

  if (query?.linkedProjectId) {
    qb.andWhere(
      'referral."linkedProjectId" = :projectId',
      {
        projectId:
          Number(query.linkedProjectId),
      },
    );
  }

  qb.orderBy(
    'referral."createdAt"',
    'DESC',
  );

  return qb.getMany();
}

async getReferral(id: number) {
  const referral =
    await this.referralRepository.findOne({
      where: {
        id: Number(id),
        isHidden: false,
      },
    });

  if (!referral) {
    throw new NotFoundException(
      'Solar Mitra referral not found',
    );
  }

  return referral;
}

async listPayouts(query: any) {
  const qb =
    this.payoutRepository
      .createQueryBuilder('payout');

  const search =
    String(query?.search || '').trim();

  if (search) {
    qb.andWhere(
      `(
        LOWER(
          COALESCE(
            payout."solarMitraName",
            ''
          )
        ) LIKE LOWER(:search)

        OR LOWER(
          COALESCE(
            payout."solarMitraBusinessName",
            ''
          )
        ) LIKE LOWER(:search)

        OR LOWER(
          COALESCE(
            payout."customerName",
            ''
          )
        ) LIKE LOWER(:search)

        OR COALESCE(
          payout."customerPhone",
          ''
        ) LIKE :search
      )`,
      {
        search: `%${search}%`,
      },
    );
  }

  if (query?.status) {
    qb.andWhere(
      'payout.status = :status',
      {
        status: query.status,
      },
    );
  }

  if (query?.solarMitraId) {
    qb.andWhere(
      'payout."solarMitraId" = :solarMitraId',
      {
        solarMitraId:
          Number(query.solarMitraId),
      },
    );
  }

  if (query?.projectId) {
    qb.andWhere(
      'payout."projectId" = :projectId',
      {
        projectId:
          Number(query.projectId),
      },
    );
  }

  qb.orderBy(
    'payout."createdAt"',
    'DESC',
  );

  return qb.getMany();
}

async getPayout(id: number) {
  const payout =
    await this.payoutRepository.findOne({
      where: {
        id: Number(id),
      },
    });

  if (!payout) {
    throw new NotFoundException(
      'Solar Mitra payout not found',
    );
  }

  return payout;
}

async createMyReferral(
  userId: number,
  body: any,
  user: any,
) {
  const mitra =
    await this.getSolarMitraByLinkedUserId(
      userId,
    );

  return this.createReferralForMitra(
    mitra.id,
    body,
    SolarMitraReferralSourceType.MITRA_PORTAL,
    {
      id: userId,
      name:
        String(user?.name || '').trim() ||
        mitra.name,
      type: 'SOLAR_MITRA',
    },
  );
}

async listMyReferrals(
  userId: number,
  query: any,
) {
  const mitra =
    await this.getSolarMitraByLinkedUserId(
      userId,
    );

  /*
   * Reuse the normal referral filtering,
   * but force solarMitraId from the authenticated
   * CRM account.
   *
   * A query-string solarMitraId supplied by the
   * caller can never override this value.
   */
  return this.listReferrals({
    ...query,
    solarMitraId: mitra.id,
  });
}

async getMyReferral(
  userId: number,
  referralId: number,
) {
  const mitra =
    await this.getSolarMitraByLinkedUserId(
      userId,
    );

  const referral =
    await this.referralRepository.findOne({
      where: {
        id: Number(referralId),
        solarMitraId: mitra.id,
        isHidden: false,
      },
    });

  if (!referral) {
    throw new NotFoundException(
      'Solar Mitra referral not found',
    );
  }

  return referral;
}

async listMyPayouts(
  userId: number,
  query: any,
) {
  const mitra =
    await this.getSolarMitraByLinkedUserId(
      userId,
    );

  /*
   * Same ownership rule as referrals:
   * never trust solarMitraId from the request.
   */
  return this.listPayouts({
    ...query,
    solarMitraId: mitra.id,
  });
}

async getMyPayout(
  userId: number,
  payoutId: number,
) {
  const mitra =
    await this.getSolarMitraByLinkedUserId(
      userId,
    );

  const payout =
    await this.payoutRepository.findOne({
      where: {
        id: Number(payoutId),
        solarMitraId: mitra.id,
      },
    });

  if (!payout) {
    throw new NotFoundException(
      'Solar Mitra payout not found',
    );
  }

  return payout;
}


async markPayoutPaid(
  id: number,
  body: any,
  user: any,
) {
  const payout =
    await this.payoutRepository.findOne({
      where: {
        id: Number(id),
      },
    });

  if (!payout) {
    throw new NotFoundException(
      'Solar Mitra payout not found',
    );
  }

  if (
    payout.status ===
    SolarMitraPayoutStatus.PAID
  ) {
    throw new BadRequestException(
      'Solar Mitra payout is already paid',
    );
  }

  if (
    payout.status !==
    SolarMitraPayoutStatus.ELIGIBLE
  ) {
    throw new BadRequestException(
      'Only an eligible Solar Mitra payout can be marked as paid',
    );
  }

  const paymentMode =
    String(
      body?.paymentMode || '',
    ).trim();

  const paymentReference =
    String(
      body?.paymentReference || '',
    ).trim();

  const paymentRemarks =
    String(
      body?.paymentRemarks || '',
    ).trim();

  payout.status =
    SolarMitraPayoutStatus.PAID;

  payout.paidAt =
    new Date();

  payout.paidBy =
  Number(
    user?.id ||
      user?.userId ||
      user?.sub ||
      0,
  );

payout.paidByName =
  String(
    user?.name ||
      user?.email ||
      '',
  ).trim();

payout.paymentMode =
  paymentMode;

payout.paymentReference =
  paymentReference;

payout.paymentRemarks =
  paymentRemarks;

  const savedPayout =
    await this.payoutRepository.save(
      payout,
    );

  const referral =
    await this.referralRepository.findOne({
      where: {
        id: payout.referralId,
        isHidden: false,
      },
    });

  if (referral) {
    referral.status =
      SolarMitraReferralStatus
        .PAYOUT_PAID;

    await this.referralRepository.save(
      referral,
    );
  }

  return savedPayout;
}

  async getOrCreateSettings() {
    let setting =
      await this.settingRepository.findOne({
        where: {
          isActive: true,
        },
        order: {
          id: 'DESC',
        },
      });

    if (setting) {
      return setting;
    }

    setting =
      this.settingRepository.create({
        defaultPayoutAmount: 5000,
        payoutQualificationType:
          SolarMitraPayoutQualificationType
            .PROJECT_PAYMENT_PERCENTAGE,
        requiredProjectPaymentPercentage: 20,
        isActive: true,
      });

    return this.settingRepository.save(setting);
  }

  async updateSettings(
    body: any,
    user: any,
  ) {
    const setting =
      await this.getOrCreateSettings();

    const payoutAmount =
      Number(body?.defaultPayoutAmount);

    const requiredPercentage =
      Number(
        body?.requiredProjectPaymentPercentage,
      );

    if (
      !Number.isFinite(payoutAmount) ||
      payoutAmount < 0
    ) {
      throw new BadRequestException(
        'Valid payout amount is required',
      );
    }

    if (
      !Number.isFinite(requiredPercentage) ||
      requiredPercentage < 0 ||
      requiredPercentage > 100
    ) {
      throw new BadRequestException(
        'Project payment percentage must be between 0 and 100',
      );
    }

    setting.defaultPayoutAmount =
      payoutAmount;

    setting.requiredProjectPaymentPercentage =
      requiredPercentage;

    setting.payoutQualificationType =
      SolarMitraPayoutQualificationType
        .PROJECT_PAYMENT_PERCENTAGE;

    setting.updatedBy =
      user?.id ? Number(user.id) : null;

    setting.updatedByName =
      String(user?.name || '').trim() || null;

    return this.settingRepository.save(setting);
  }
}