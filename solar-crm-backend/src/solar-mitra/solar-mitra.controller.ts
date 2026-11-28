import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';

import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

import { AuthGuard } from '@nestjs/passport';

import { SolarMitraService } from './solar-mitra.service';
import { UserRole } from '../users/user.entity';
import { SolarMitraReferralSourceType } from './solar-mitra-referral.entity';
import { SolarMitraNetworkService } from './solar-mitra-network.service';

@Controller('solar-mitra')
@UseGuards(AuthGuard('jwt'))
export class SolarMitraController {
  constructor(
    private readonly service: SolarMitraService,

    private readonly solarMitraNetworkService: SolarMitraNetworkService,
  ) {}

  private isSolarMitraOnly(user: any): boolean {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  return (
    roles.includes(UserRole.SOLAR_MITRA) &&
    roles.every(
      (role) => role === UserRole.SOLAR_MITRA,
    )
  );
}

private assertStaffManagementAccess(user: any): void {
  this.assertManagementAccess(user);

  if (this.isSolarMitraOnly(user)) {
    throw new ForbiddenException(
      'This operation is restricted to CRM staff',
    );
  }
}

private sanitizeMitraForNetworkMember(mitra: any) {
  const allowedFields = [
    'id',
    'name',
    'businessName',
    'primaryPhone',
    'secondaryPhone',
    'address',
    'area',
    'city',
    'state',
    'gpsLatitude',
    'gpsLongitude',
    'gpsAddress',
    'shopPhotoUrl',
    'shopStatus',
    'status',
    'interestStatus',
    'approvalStatus',
    'printingStatus',
    'standeePrintingStatus',
    'posterPrintingStatus',
    'posterVerificationStatus',
    'posterVerificationRemarks',
    'qrPosterInstallationPhotoUrl',
    'qrPosterInstallationPhotoUrl2',
    'createdBy',
    'createdByName',
    'createdByRole',
    'createdAt',
    'updatedAt',
    'isHidden',
  ];

  return Object.fromEntries(
    Object.entries(mitra || {}).filter(
      ([key]) => allowedFields.includes(key),
    ),
  );
}

  private assertManagementAccess(user: any) {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  if (roles.length === 0) {
    throw new ForbiddenException(
      'Solar Mitra management access denied',
    );
  }
}

  private assertSolarMitraCreateAccess(
  user: any,
) {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  if (roles.length === 0) {
    throw new ForbiddenException(
      'Solar Mitra creation access denied',
    );
  }
}

  private isOwner(user: any): boolean {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  return roles.includes(
    UserRole.OWNER,
  );
}

private isFranchiseManager(
  user: any,
): boolean {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  return roles.includes(
    UserRole.FRANCHISE_MANAGER,
  );
}

private isFranchiseHead(
  user: any,
): boolean {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  return (
  roles.includes(UserRole.FRANCHISE_HEAD) ||
  roles.includes(UserRole.MARKETING_HEAD)
);
}

private hasFullSolarMitraVisibility(
  user: any,
): boolean {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  return (
    this.isOwner(user) ||
    this.isFranchiseHead(user) ||
    roles.includes(
      UserRole.SOLAR_MITRA_ASSISTANT,
    )
  );
}

  private assertSolarMitraAccess(
  user: any,
) {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  if (
    !roles.includes(
      UserRole.SOLAR_MITRA,
    )
  ) {
    throw new ForbiddenException(
      'Solar Mitra access required',
    );
  }
}

  private assertOwner(user: any) {
    const roles: string[] =
      Array.isArray(user?.roles)
        ? user.roles
        : [];

    if (!roles.includes(UserRole.OWNER)) {
      throw new ForbiddenException(
  'Owner access required',
);
    }
  }

  private assertNetworkManagementAccess(
  user: any,
) {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  const allowedRoles = [
    UserRole.OWNER,
    UserRole.FRANCHISE_HEAD,
    UserRole.MARKETING_HEAD,
    UserRole.ACCOUNT_MANAGER,
  ];

  if (
    !allowedRoles.some(
      (role) => roles.includes(role),
    )
  ) {
    throw new ForbiddenException(
      'Solar Mitra network management access denied',
    );
  }
}

private assertNetworkApprovalAccess(
  user: any,
) {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  const allowedRoles = [
    UserRole.OWNER,
    UserRole.MARKETING_HEAD,
    UserRole.ACCOUNT_MANAGER,
  ];

  if (
    !allowedRoles.some(
      (role) => roles.includes(role),
    )
  ) {
    throw new ForbiddenException(
      'Solar Mitra network incentive approval access denied',
    );
  }
}

private assertNetworkPaymentAccess(
  user: any,
) {
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  const allowedRoles = [
    UserRole.OWNER,
    UserRole.ACCOUNT_MANAGER,
  ];

  if (
    !allowedRoles.some(
      (role) => roles.includes(role),
    )
  ) {
    throw new ForbiddenException(
      'Only Owner or Account Manager can settle network incentives',
    );
  }
}

  @Post()
async create(
    @Req() req: any,
    @Body() body: any,
  ) {
    this.assertSolarMitraCreateAccess(
  req.user,
);

    const createBody = {
  ...body,
};

if (
  !this.isOwner(req.user) &&
  !this.isFranchiseHead(req.user)
) {
  delete createBody.payoutAmountOverride;
  delete createBody.requiredPaymentPercentageOverride;
  delete createBody.franchiseManagerId;
  delete createBody.franchiseManagerName;
}

if (
  this.isFranchiseManager(req.user) &&
  !this.isOwner(req.user)
) {
  createBody.franchiseManagerId =
    Number(req.user.id);

  createBody.franchiseManagerName =
    String(
      req.user.name || '',
    ).trim();
}

const createdMitra =
  await this.service.createSolarMitra(
    createBody,
    req.user,
  );

if (this.isSolarMitraOnly(req.user)) {
  return this.sanitizeMitraForNetworkMember(
    createdMitra,
  );
}

return createdMitra;
  }

  @Get()
async list(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertManagementAccess(req.user);

  const scopedQuery = {
    ...query,
  };

  if (
    this.isFranchiseManager(req.user) &&
    !this.isOwner(req.user)
  ) {
    scopedQuery.franchiseManagerId =
      Number(req.user.id);
  } else if (
    !this.hasFullSolarMitraVisibility(
      req.user,
    )
  ) {
    scopedQuery.createdBy =
      Number(req.user.id);
  }

  const mitras =
  await this.service.listSolarMitras(
    scopedQuery,
  );

if (this.isSolarMitraOnly(req.user)) {
  return mitras.map((mitra) =>
    this.sanitizeMitraForNetworkMember(mitra),
  );
}

return mitras;
}

  @Get('referrals/list')
async listReferrals(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertManagementAccess(req.user);

  if (this.isSolarMitraOnly(req.user)) {
  return this.service.listMyReferrals(
    Number(req.user.id),
    query,
  );
}

  if (
    this.hasFullSolarMitraVisibility(
      req.user,
    )
  ) {
    return this.service.listReferrals(
      query,
    );
  }

  const mitras =
    await this.service.listSolarMitras(
      this.isFranchiseManager(req.user)
        ? {
            franchiseManagerId:
              Number(req.user.id),
          }
        : {
            createdBy:
              Number(req.user.id),
          },
    );

  const allowedMitraIds =
    new Set(
      mitras.map((item) =>
        Number(item.id),
      ),
    );

  const referrals =
    await this.service.listReferrals(
      query,
    );

  return referrals.filter(
    (item: any) =>
      allowedMitraIds.has(
        Number(item.solarMitraId),
      ),
  );
}

@Get('referrals/:id')
async referralDetail(
  @Req() req: any,
  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,
) {
  this.assertManagementAccess(req.user);

  if (this.isSolarMitraOnly(req.user)) {
  return this.service.getMyReferral(
    Number(req.user.id),
    id,
  );
}

  const referral =
    await this.service.getReferral(id);

  if (
    !this.hasFullSolarMitraVisibility(
      req.user,
    )
  ) {
    const mitra =
      await this.service.getSolarMitra(
        Number(
          referral.solarMitraId,
        ),
      );

    const allowed =
      this.isFranchiseManager(req.user)
        ? Number(
            mitra.franchiseManagerId,
          ) === Number(req.user.id)
        : Number(mitra.createdBy) ===
          Number(req.user.id);

    if (!allowed) {
      throw new ForbiddenException(
        'You can only access referrals from your Solar Mitras',
      );
    }
  }

  return referral;
}



  @Get('settings')
  settings(@Req() req: any) {
    this.assertStaffManagementAccess(req.user);

    return this.service.getOrCreateSettings();
  }

  @Patch('settings')
  updateSettings(
    @Req() req: any,
    @Body() body: any,
  ) {
    this.assertOwner(req.user);

    return this.service.updateSettings(
      body,
      req.user,
    );
  }

  @Post('creator-payouts/reconciliation/generate')
generateCreatorPayoutReconciliation(
  @Req() req: any,
  @Body() body: any,
) {
  const roles: string[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (!roles.includes(UserRole.OWNER)) {
    throw new ForbiddenException(
      'Only Owner can generate historical Creator Payouts',
    );
  }

  return this.service.generateCreatorPayoutReconciliation(
    body,
  );
}

  @Get('creator-payouts/reconciliation/preview')
previewCreatorPayoutReconciliation(
  @Req() req: any,
  @Query() query: any,
) {
  const roles: string[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (!roles.includes(UserRole.OWNER)) {
    throw new ForbiddenException(
      'Only Owner can preview historical Creator Payout reconciliation',
    );
  }

  return this.service.previewCreatorPayoutReconciliation(
    query,
  );
}

  @Get('creator-payouts/list')
async listCreatorPayouts(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertManagementAccess(req.user);

  if (this.isSolarMitraOnly(req.user)) {
  const payouts =
    await this.service.listCreatorPayouts(query);

  return payouts.filter(
    (item) =>
      Number(item.creatorId) === Number(req.user.id),
  );
}

  const roles: string[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (
    this.hasFullSolarMitraVisibility(req.user) ||
    roles.includes(UserRole.ACCOUNT_MANAGER)
  ) {
    return this.service.listCreatorPayouts(query);
  }

  const mitras =
    await this.service.listSolarMitras(
      this.isFranchiseManager(req.user)
        ? {
            franchiseManagerId: Number(req.user.id),
          }
        : {
            createdBy: Number(req.user.id),
          },
    );

  const allowedMitraIds = new Set(
    mitras.map((item) => Number(item.id)),
  );

  const payouts =
    await this.service.listCreatorPayouts(query);

  return payouts.filter((item) =>
    allowedMitraIds.has(Number(item.solarMitraId)),
  );
}

  @Get('payouts/list')
async listPayouts(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertManagementAccess(
    req.user,
  );

  if (this.isSolarMitraOnly(req.user)) {
  return this.service.listMyPayouts(
    Number(req.user.id),
    query,
  );
}

  const roles: string[] =
  Array.isArray(req.user?.roles)
    ? req.user.roles
    : [];

if (
  this.hasFullSolarMitraVisibility(req.user) ||
  roles.includes(UserRole.ACCOUNT_MANAGER)
) {
  return this.service.listPayouts(query);
}

  const mitras =
    await this.service.listSolarMitras(
      this.isFranchiseManager(req.user)
        ? {
            franchiseManagerId:
              Number(req.user.id),
          }
        : {
            createdBy:
              Number(req.user.id),
          },
    );

  const allowedMitraIds =
    new Set(
      mitras.map((item) =>
        Number(item.id),
      ),
    );

  const payouts =
    await this.service.listPayouts(
      query,
    );

  return payouts.filter(
    (item: any) =>
      allowedMitraIds.has(
        Number(item.solarMitraId),
      ),
  );
}

@Get('payouts/:id/payment-details')
getPayoutPaymentDetails(
  @Req() req: any,

  @Param('id', ParseIntPipe)
  id: number,
) {

  this.assertStaffManagementAccess(req.user);

  const roles: string[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (
    !roles.includes(UserRole.OWNER) &&
    !roles.includes(UserRole.ACCOUNT_MANAGER)
  ) {
    throw new ForbiddenException(
      'Only Owner or Account Manager can view payout payment details',
    );
  }

  return this.service.getPayoutPaymentDetails(id);
}

@Get('payouts/:id')
async payoutDetail(
  @Req() req: any,
  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,
) {
  this.assertManagementAccess(
    req.user,
  );

  if (this.isSolarMitraOnly(req.user)) {
  throw new ForbiddenException(
    'Please access your personal payouts through My Profile',
  );
}

  const payout =
    await this.service.getPayout(
      id,
    );

  const roles: string[] =
  Array.isArray(req.user?.roles)
    ? req.user.roles
    : [];

if (
  !this.hasFullSolarMitraVisibility(req.user) &&
  !roles.includes(UserRole.ACCOUNT_MANAGER)
) {
    const mitra =
      await this.service.getSolarMitra(
        Number(
          payout.solarMitraId,
        ),
      );

    const allowed =
      this.isFranchiseManager(req.user)
        ? Number(
            mitra.franchiseManagerId,
          ) === Number(req.user.id)
        : Number(mitra.createdBy) ===
          Number(req.user.id);

    if (!allowed) {
      throw new ForbiddenException(
        'You can only access payouts from your Solar Mitras',
      );
    }
  }

  return payout;
}

@Get('creator-payouts/:id/settlement-preview')
async previewCreatorSettlement(
  @Param('id', ParseIntPipe)
  id: number,

  @Req() req: any,
) {
  this.assertNetworkPaymentAccess(
    req.user,
  );

  return this.service.previewCreatorSettlement(
    id,
    req.user,
  );
}

@Get('payouts/:id/settlement-preview')
async previewProjectSettlement(
  @Param('id', ParseIntPipe)
  id: number,

  @Req() req: any,
) {
  this.assertNetworkPaymentAccess(
    req.user,
  );

  return this.service.previewProjectSettlement(
    id,
    req.user,
  );
}

@Patch('creator-payouts/:id/paid')
markCreatorPayoutPaid(
  @Req() req: any,

  @Param('id', ParseIntPipe)
  id: number,

  @Body()
  body: any,
) {
  const roles: string[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (
    !roles.includes(UserRole.OWNER) &&
    !roles.includes(UserRole.ACCOUNT_MANAGER)
  ) {
    throw new ForbiddenException(
      'Only Owner or Account Manager can mark Creator Payouts as paid',
    );
  }

  return this.service.markCreatorPayoutPaid(
    id,
    body,
    req.user,
  );
}

@Patch('payouts/:id/paid')
markPayoutPaid(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,

  @Body()
  body: any,
) {
  const roles: string[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (
    !roles.includes(UserRole.OWNER) &&
    !roles.includes(UserRole.ACCOUNT_MANAGER)
  ) {
    throw new ForbiddenException(
      'Only Owner or Account Manager can mark Solar Mitra payouts as paid',
    );
  }

  return this.service.markPayoutPaid(
    id,
    body,
    req.user,
  );
}

@Post('shop-photo/upload')
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  }),
)
uploadShopPhoto(
  @Req() req: any,
  @UploadedFile() file: any,
) {
  this.assertSolarMitraCreateAccess(
  req.user,
);

  return this.service.uploadShopPhoto(
    file,
    req.user,
  );
}

@Post('meetings')
createMeeting(
  @Req() req: any,
  @Body() body: any,
) {
  this.assertStaffManagementAccess(req.user);

  return this.service.createMeeting(
    body,
    req.user,
  );
}


@Get('meetings/list')
listMeetings(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertStaffManagementAccess(req.user);

  let managerId:
    number | undefined;

  let createdBy:
    number | undefined;

  if (
    this.isFranchiseManager(
      req.user,
    ) &&
    !this.isOwner(req.user)
  ) {
    managerId =
      Number(req.user.id);
  } else if (
    !this.hasFullSolarMitraVisibility(
      req.user,
    )
  ) {
    createdBy =
      Number(req.user.id);
  }

  return this.service.listMeetings(
    query,
    managerId,
    createdBy,
  );
}


@Get('meetings/:id')
async meetingDetail(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,
) {
  this.assertStaffManagementAccess(req.user);

  const meeting =
    await this.service.getMeeting(
      id,
    );

  if (
    !this.hasFullSolarMitraVisibility(
      req.user,
    )
  ) {
    const allowed =
      this.isFranchiseManager(req.user)
        ? Number(
            meeting.franchiseManagerId,
          ) === Number(req.user.id)
        : Number(
            meeting.createdBy,
          ) === Number(req.user.id);

    if (!allowed) {
      throw new ForbiddenException(
        'You can only access your own Solar Mitra meetings',
      );
    }
  }

  return meeting;
}


@Patch('meetings/:id')
async updateMeeting(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,

  @Body()
  body: any,
) {
  this.assertStaffManagementAccess(req.user);

  const meeting =
    await this.service.getMeeting(
      id,
    );

  if (
    !this.hasFullSolarMitraVisibility(
      req.user,
    )
  ) {
    const allowed =
      this.isFranchiseManager(req.user)
        ? Number(
            meeting.franchiseManagerId,
          ) === Number(req.user.id)
        : Number(
            meeting.createdBy,
          ) === Number(req.user.id);

    if (!allowed) {
      throw new ForbiddenException(
        'You can only update your own Solar Mitra meetings',
      );
    }
  }

  return this.service.updateMeeting(
    id,
    body,
    req.user,
  );
}

@Post(
  'meetings/:id/create-solar-mitra',
)
async convertMeetingToSolarMitra(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,

  @Body()
  body: any,
) {
  this.assertStaffManagementAccess(req.user);

  const meeting =
    await this.service.getMeeting(
      id,
    );

  if (
    !this.hasFullSolarMitraVisibility(
      req.user,
    )
  ) {
    const allowed =
      this.isFranchiseManager(req.user)
        ? Number(
            meeting.franchiseManagerId,
          ) === Number(req.user.id)
        : Number(
            meeting.createdBy,
          ) === Number(req.user.id);

    if (!allowed) {
      throw new ForbiddenException(
        'You can only convert your own Solar Mitra meetings',
      );
    }
  }

  body = { ...body };

delete body.createdBy;
delete body.createdByName;
delete body.createdByRole;
delete body.linkedUserId;

if (
  !this.isOwner(req.user) &&
  !this.isFranchiseHead(req.user)
) {
  delete body.payoutAmountOverride;
  delete body.requiredPaymentPercentageOverride;
  delete body.franchiseManagerId;
  delete body.franchiseManagerName;
}

  return this.service
    .convertMeetingToSolarMitra(
      id,
      body,
      req.user,
    );
}

@Post('meetings/photos/upload')
@UseInterceptors(
  FilesInterceptor(
    'files',
    2,
    {
      limits: {
        fileSize:
          10 * 1024 * 1024,
      },
    },
  ),
)
async uploadMeetingPhotos(
  @Req() req: any,
  @UploadedFiles()
  files: any[],
) {
  this.assertManagementAccess(
    req.user,
  );

  const uploaded: Array<{
  fileUrl: string;
  filePath: string;
  fileName: string;
  mimeType: string;
}> = [];

  for (const file of files || []) {
    uploaded.push(
      await this.service
        .uploadMeetingPhoto(
          file,
          req.user,
        ),
    );
  }

  return uploaded;
}

@Post('meetings/audio/upload')
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize:
        25 * 1024 * 1024,
    },
  }),
)
uploadMeetingAudio(
  @Req() req: any,
  @UploadedFile()
  file: any,
) {
  this.assertManagementAccess(
    req.user,
  );

  return this.service
    .uploadMeetingAudio(
      file,
      req.user,
    );
}

@Post(
  'meetings/:id/documents/upload',
)
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize:
        20 * 1024 * 1024,
    },
  }),
)
async uploadMeetingDocument(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,

  @UploadedFile()
  file: any,

  @Body()
  body: any,
) {
  this.assertManagementAccess(
    req.user,
  );

  const meeting =
    await this.service.getMeeting(
      id,
    );

  if (
    !this.hasFullSolarMitraVisibility(
      req.user,
    )
  ) {
    const allowed =
      this.isFranchiseManager(req.user)
        ? Number(
            meeting.franchiseManagerId,
          ) === Number(req.user.id)
        : Number(
            meeting.createdBy,
          ) === Number(req.user.id);

    if (!allowed) {
      throw new ForbiddenException(
        'You can only upload documents to your own Solar Mitra meetings',
      );
    }
  }

  return this.service
    .uploadMeetingDocument(
      id,
      file,
      body?.documentName,
      req.user,
    );
}

@Patch(':id/poster-verification')
async updatePosterVerification(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {

  this.assertStaffManagementAccess(req.user);

  const roles: string[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (
    !roles.includes(UserRole.OWNER) &&
!roles.includes(UserRole.FRANCHISE_HEAD) &&
!roles.includes(UserRole.MARKETING_HEAD)
  ) {
    throw new ForbiddenException(
      'Only Owner, Solar Mitra Head or Marketing Head can verify QR poster installation',
    );
  }

  return this.service.updateSolarMitraPosterVerification(
    id,
    body,
    req.user,
  );
}


@Post('printing-status/bulk')
async updateBulkPrintingStatus(
  @Req() req: any,
  @Body() body: any,
) {

  this.assertStaffManagementAccess(req.user);

  const roles: string[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (
    !roles.includes(UserRole.OWNER) &&
!roles.includes(UserRole.FRANCHISE_HEAD) &&
!roles.includes(UserRole.MARKETING_HEAD)
  ) {
    throw new ForbiddenException(
      'Only Owner, Solar Mitra Head or Marketing Head can update bulk printing status',
    );
  }

  return this.service.updateSolarMitraBulkPrintingStatus(
    body,
    req.user,
  );
}


@Patch(':id/printing-status')
async updatePrintingStatus(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {

  this.assertStaffManagementAccess(req.user);

  const roles: string[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (
    !roles.includes(UserRole.OWNER) &&
!roles.includes(UserRole.FRANCHISE_HEAD) &&
!roles.includes(UserRole.MARKETING_HEAD)
  ) {
    throw new ForbiddenException(
      'Only Owner, Solar Mitra Head or Marketing Head can update QR poster printing status',
    );
  }

  return this.service.updateSolarMitraPrintingStatus(
    id,
    body,
    req.user,
  );
}

@Patch(':id/shop-status')
async updateShopStatus(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  this.assertStaffManagementAccess(req.user);

  const roles: UserRole[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (
    !roles.includes(UserRole.OWNER) &&
!roles.includes(UserRole.FRANCHISE_HEAD) &&
!roles.includes(UserRole.MARKETING_HEAD)
  ) {
    throw new ForbiddenException(
      'Only Owner, Solar Mitra Head or Marketing Head can update Solar Mitra Shop Status',
    );
  }

  return this.service.updateSolarMitraShopStatus(
    id,
    body,
    req.user,
  );
}

@Patch(':id/interest-status')
async updateInterestStatus(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  this.assertManagementAccess(req.user);

    const roles: UserRole[] = Array.isArray(req.user?.roles)
    ? req.user.roles
    : [];

  if (
    !roles.includes(UserRole.OWNER) &&
!roles.includes(UserRole.FRANCHISE_HEAD) &&
!roles.includes(UserRole.MARKETING_HEAD)
  ) {
    throw new ForbiddenException(
      'Only Owner, Solar Mitra Head or Marketing Head can update Solar Mitra calling verification status',
    );
  }

  const mitra =
    await this.service.getSolarMitra(id);

  if (
    !this.hasFullSolarMitraVisibility(req.user)
  ) {
    const allowed =
      this.isFranchiseManager(req.user)
        ? Number(mitra.franchiseManagerId) ===
          Number(req.user.id)
        : Number(mitra.createdBy) ===
          Number(req.user.id);

    if (!allowed) {
      throw new ForbiddenException(
        'You can only verify interest for your accessible Solar Mitras',
      );
    }
  }

  return this.service.updateSolarMitraInterestStatus(
    id,
    body,
    req.user,
  );
}

@Patch(':id/approval-status')
async updateApprovalStatus(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  this.assertStaffManagementAccess(req.user);

  const roles: UserRole[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (
    !roles.includes(UserRole.OWNER) &&
    !roles.includes(UserRole.FRANCHISE_HEAD) &&
    !roles.includes(UserRole.MARKETING_HEAD)
  ) {
    throw new ForbiddenException(
      'Only Owner, Solar Mitra Head or Marketing Head can approve or reject Solar Mitras',
    );
  }

  return this.service.updateSolarMitraApprovalStatus(
    id,
    body,
    req.user,
  );
}

@Post(':id/poster-installation/upload')
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  }),
)
async uploadPosterInstallationPhoto(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
  @UploadedFile() file: any,
@Query('photoSlot') photoSlot?: string,
) {
  this.assertManagementAccess(req.user);

  const mitra =
    await this.service.getSolarMitra(id);

  if (
    !this.hasFullSolarMitraVisibility(req.user)
  ) {
    const allowed =
      this.isFranchiseManager(req.user)
        ? Number(mitra.franchiseManagerId) ===
          Number(req.user.id)
        : Number(mitra.createdBy) ===
          Number(req.user.id);

    if (!allowed) {
      throw new ForbiddenException(
        'You can only update your accessible Solar Mitras',
      );
    }
  }

  const slot =
  photoSlot === undefined
    ? 1
    : Number(photoSlot);

if (
  !Number.isInteger(slot) ||
  ![1, 2].includes(slot)
) {
  throw new BadRequestException(
    'Photo slot must be 1 or 2',
  );
}

const uploadResult =
  await this.service.uploadPosterInstallationPhoto(
    id,
    file,
    req.user.id,
    slot,
  );

if (this.isSolarMitraOnly(req.user)) {
  const updatedMitra =
    await this.service.getSolarMitra(id);

  return this.sanitizeMitraForNetworkMember(
    updatedMitra,
  );
}

return uploadResult;
}

@Patch(':id')
async update(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,

  @Body()
  body: any,
) {
  this.assertManagementAccess(
    req.user,
  );

  const mitra =
    await this.service.getSolarMitra(
      id,
    );

    body = { ...body };

delete body.createdBy;
delete body.createdByName;
delete body.createdByRole;
delete body.linkedUserId;

if (
  !this.isOwner(req.user) &&
  !this.isFranchiseHead(req.user)
) {
  delete body.payoutAmountOverride;
  delete body.requiredPaymentPercentageOverride;
  delete body.franchiseManagerId;
  delete body.franchiseManagerName;
}

  if (
    !this.hasFullSolarMitraVisibility(
      req.user,
    )
  ) {
    if (
      this.isFranchiseManager(req.user)
    ) {
      if (
        Number(
          mitra.franchiseManagerId,
        ) !== Number(req.user.id)
      ) {
        throw new ForbiddenException(
          'You can only update your assigned Solar Mitras',
        );
      }

      /*
       * Franchise Manager may update the
       * Solar Mitra, but cannot transfer
       * ownership to another manager.
       */
      body = {
        ...body,
        franchiseManagerId:
          Number(req.user.id),
        franchiseManagerName:
          String(
            req.user.name || '',
          ).trim(),
      };
    } else if (
      Number(mitra.createdBy) !==
      Number(req.user.id)
    ) {
      throw new ForbiddenException(
        'You can only update Solar Mitras created by you',
      );
    }
  }

  const updatedMitra =
  await this.service.updateSolarMitra(
    id,
    body,
    req.user,
  );

if (this.isSolarMitraOnly(req.user)) {
  return this.sanitizeMitraForNetworkMember(
    updatedMitra,
  );
}

return updatedMitra;
}

@Get('network/mitras/creator-options')
async searchHistoricalCreatorOptions(
  @Req() req: any,
  @Query('search') search: string,
) {
  if (!this.isOwner(req.user)) {
    throw new ForbiddenException(
      'Only Owner can search historical creator options',
    );
  }

  return this.solarMitraNetworkService
    .searchHistoricalCreatorOptions(
      req.user,
      search,
    );
}

@Get('network/mitras/missing-creators')
async getMissingCreatorMitras(
  @Req() req: any,
) {
  if (!this.isOwner(req.user)) {
    throw new ForbiddenException(
      'Only Owner can view Solar Mitras with missing creators',
    );
  }

  return this.solarMitraNetworkService
    .getMissingCreatorMitras(req.user);
}

@Patch('network/mitras/:id/assign-creator')
async assignHistoricalCreator(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  if (!this.isOwner(req.user)) {
    throw new ForbiddenException(
      'Only Owner can assign a missing Solar Mitra creator',
    );
  }

  return this.solarMitraNetworkService
    .assignHistoricalCreator(
      id,
      Number(body?.creatorUserId),
      req.user,
    );
}

@Get('network/reconciliation/preview')
async previewHistoricalNetworkPools(
  @Req() req: any,
) {
  const roles: string[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (!roles.includes(UserRole.OWNER)) {
    throw new ForbiddenException(
      'Only Owner can preview historical network reconciliation',
    );
  }

  return this.solarMitraNetworkService
    .reconcileHistoricalNetworkPools(true);
}

@Post('network/reconciliation/execute')
async executeHistoricalNetworkPools(
  @Req() req: any,
  @Body() body: any,
) {
  const roles: string[] =
    Array.isArray(req.user?.roles)
      ? req.user.roles
      : [];

  if (!roles.includes(UserRole.OWNER)) {
    throw new ForbiddenException(
      'Only Owner can execute historical network reconciliation',
    );
  }

  if (
    body?.confirmation !==
    'GENERATE_HISTORICAL_NETWORK_POOLS'
  ) {
    throw new BadRequestException(
      'Explicit historical reconciliation confirmation is required',
    );
  }

  return this.solarMitraNetworkService
  .reconcileHistoricalNetworkPools(
    false,
    body?.previewFingerprint,
  );
}

@Get('network/management/summary')
async getNetworkManagementSummary(
  @Req() req: any,
) {
  this.assertNetworkManagementAccess(
    req.user,
  );

  return this.solarMitraNetworkService
    .getNetworkManagementSummary();
}

@Get('network/management/payouts')
async getNetworkManagementPayouts(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertNetworkManagementAccess(
    req.user,
  );

  return this.solarMitraNetworkService
    .getNetworkManagementPayouts(query);
}

@Get('network/payouts/:id/settlement-preview')
async previewNetworkSettlement(
  @Param('id', ParseIntPipe) id: number,
  @Req() req: any,
) {
  this.assertNetworkPaymentAccess(
    req.user,
  );

  return this.solarMitraNetworkService
    .previewNetworkSettlement(id);
}

@Patch('network/payouts/:id/paid')
async markNetworkPayoutPaid(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @Req() req: any,
) {
  this.assertNetworkPaymentAccess(
    req.user,
  );

  return this.solarMitraNetworkService
    .markNetworkPayoutPaid(
      id,
      body,
      req.user,
    );
}

@Patch('network/payouts/bulk-approve')
async bulkApproveNetworkPayouts(
  @Req() req: any,
  @Body() body: any,
) {
  this.assertNetworkApprovalAccess(
    req.user,
  );

  return this.solarMitraNetworkService
    .bulkApproveNetworkPayouts(
      body?.payoutIds,
      req.user,
    );
}

@Patch('network/payouts/:id/approve')
async approveNetworkPayout(
  @Param('id', ParseIntPipe) id: number,
  @Req() req: any,
) {
  this.assertNetworkApprovalAccess(
    req.user,
  );

  return this.solarMitraNetworkService
    .approveNetworkPayout(
      id,
      req.user,
    );
}

@Get('me/network')
async getMyNetwork(
  @Req() req: any,
) {
  this.assertManagementAccess(req.user);

  const userId = Number(
    req.user?.id ||
    req.user?.userId ||
    req.user?.sub ||
    0,
  );

  return this.solarMitraNetworkService.getMyNetwork(
    userId,
  );
}

@Get('me/earnings')
async getMyEarnings(
  @Req() req: any,
) {
  this.assertManagementAccess(req.user);

  const userId = Number(
    req.user?.id ||
    req.user?.userId ||
    req.user?.sub ||
    0,
  );

  return this.solarMitraNetworkService.getMyEarnings(
    userId,
  );
}

@Get('me/network-payouts')
async getMyNetworkPayouts(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertManagementAccess(req.user);

  const userId = Number(
    req.user?.id ||
    req.user?.userId ||
    req.user?.sub ||
    0,
  );

  return this.solarMitraNetworkService.getMyNetworkPayouts(
    userId,
    query,
  );
}

@Get('me/profile')
myProfile(
  @Req() req: any,
) {
  this.assertSolarMitraAccess(
    req.user,
  );

  return this.service
    .getMySolarMitraProfile(
      req.user.id,
    );
}

@Patch('me/payment-details')
updateMyPaymentDetails(
  @Req() req: any,
  @Body() body: any,
) {
  this.assertSolarMitraAccess(
    req.user,
  );

  return this.service.updateMyPaymentDetails(
    req.user.id,
    body,
  );
}

@Post('me/payment-qr/upload')
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  }),
)
uploadMyPaymentQr(
  @Req() req: any,
  @UploadedFile() file: any,
) {
  this.assertSolarMitraAccess(
    req.user,
  );

  return this.service.uploadMyPaymentQr(
    req.user.id,
    file,
  );
}

@Get('me/referrals')
myReferrals(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertSolarMitraAccess(
    req.user,
  );

  return this.service.listMyReferrals(
    req.user.id,
    query,
  );
}

@Get('me/referrals/:id')
myReferralDetail(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,
) {
  this.assertSolarMitraAccess(
    req.user,
  );

  return this.service.getMyReferral(
    req.user.id,
    id,
  );
}

@Post('me/referrals')
createMyReferral(
  @Req() req: any,

  @Body()
  body: any,
) {
  this.assertSolarMitraAccess(
    req.user,
  );

  return this.service.createMyReferral(
    req.user.id,
    body,
    req.user,
  );
}

@Get('me/payouts')
myPayouts(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertSolarMitraAccess(
    req.user,
  );

  return this.service.listMyPayouts(
    req.user.id,
    query,
  );
}

@Get('me/payouts/:id')
myPayoutDetail(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,
) {
  this.assertSolarMitraAccess(
    req.user,
  );

  return this.service.getMyPayout(
    req.user.id,
    id,
  );
}

@Post(':id/referrals')
async createReferralByStaff(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  solarMitraId: number,

  @Body()
  body: any,
) {
  this.assertManagementAccess(req.user);

  if (this.isSolarMitraOnly(req.user)) {
  throw new ForbiddenException(
    'Please create referrals through your own Solar Mitra account',
  );
}

  if (
    !this.hasFullSolarMitraVisibility(
      req.user,
    )
  ) {
    const mitra =
      await this.service.getSolarMitra(
        solarMitraId,
      );

    const allowed =
      this.isFranchiseManager(req.user)
        ? Number(
            mitra.franchiseManagerId,
          ) === Number(req.user.id)
        : Number(mitra.createdBy) ===
          Number(req.user.id);

    if (!allowed) {
      throw new ForbiddenException(
        'You can only create referrals for your Solar Mitras',
      );
    }
  }

  return this.service.createReferralForMitra(
    solarMitraId,
    body,
    SolarMitraReferralSourceType.STAFF,
    {
      id: req.user?.id,
      name: req.user?.name,
      type: 'STAFF',
    },
  );
}

  @Get(':id')
async detail(
  @Req() req: any,
  @Param('id', ParseIntPipe)
  id: number,
) {
  this.assertManagementAccess(req.user);

  const mitra =
    await this.service.getSolarMitra(id);

  if (
    !this.hasFullSolarMitraVisibility(
      req.user,
    )
  ) {
    const allowed =
      this.isFranchiseManager(req.user)
        ? Number(
            mitra.franchiseManagerId,
          ) === Number(req.user.id)
        : Number(mitra.createdBy) ===
          Number(req.user.id);

    if (!allowed) {
      throw new ForbiddenException(
        'You can only access your Solar Mitras',
      );
    }
  }

  if (this.isSolarMitraOnly(req.user)) {
  return this.sanitizeMitraForNetworkMember(mitra);
}

return mitra;
}
}

@Controller('solar-mitra-public')
export class SolarMitraPublicController {
  constructor(
    private readonly solarMitraService: SolarMitraService,
  ) {}

  @Get(':token')
  getReferralPage(
    @Param('token') token: string,
  ) {
    return this.solarMitraService.getPublicReferralPage(
      token,
    );
  }

  @Post(':token/referrals')
  createReferral(
    @Param('token') token: string,
    @Body() body: any,
  ) {
    return this.solarMitraService.createPublicQrReferral(
      token,
      body,
    );
  }
}