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
} from '@nestjs/common';

import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

import { AuthGuard } from '@nestjs/passport';

import { SolarMitraService } from './solar-mitra.service';
import { UserRole } from '../users/user.entity';
import { SolarMitraReferralSourceType } from './solar-mitra-referral.entity';

@Controller('solar-mitra')
@UseGuards(AuthGuard('jwt'))
export class SolarMitraController {
  constructor(
    private readonly service: SolarMitraService,
  ) {}

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

  return roles.includes(
    UserRole.FRANCHISE_HEAD,
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

  @Post()
  create(
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

return this.service.createSolarMitra(
  createBody,
  req.user,
);
  }

  @Get()
  list(
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
}

return this.service.listSolarMitras(
  scopedQuery,
);
  }

  @Get('referrals/list')
async listReferrals(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertManagementAccess(req.user);

  if (
    this.isFranchiseManager(req.user) &&
    !this.isOwner(req.user)
  ) {
    const mitras =
      await this.service.listSolarMitras({
        franchiseManagerId:
          Number(req.user.id),
      });

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

  return this.service.listReferrals(
    query,
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

  const referral =
    await this.service.getReferral(id);

  if (
    this.isFranchiseManager(req.user) &&
    !this.isOwner(req.user)
  ) {
    const mitra =
      await this.service.getSolarMitra(
        Number(
          referral.solarMitraId,
        ),
      );

    if (
      Number(
        mitra.franchiseManagerId,
      ) !== Number(req.user.id)
    ) {
      throw new ForbiddenException(
        'You can only access referrals from your assigned Solar Mitras',
      );
    }
  }

  return referral;
}



  @Get('settings')
  settings(@Req() req: any) {
    this.assertManagementAccess(req.user);

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

  @Get('payouts/list')
async listPayouts(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertManagementAccess(
    req.user,
  );

  if (
    this.isFranchiseManager(req.user) &&
    !this.isOwner(req.user)
  ) {
    const mitras =
      await this.service.listSolarMitras({
        franchiseManagerId:
          Number(req.user.id),
      });

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

  return this.service.listPayouts(
    query,
  );
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

  const payout =
    await this.service.getPayout(
      id,
    );

  if (
    this.isFranchiseManager(req.user) &&
    !this.isOwner(req.user)
  ) {
    const mitra =
      await this.service.getSolarMitra(
        Number(
          payout.solarMitraId,
        ),
      );

    if (
      Number(
        mitra.franchiseManagerId,
      ) !== Number(req.user.id)
    ) {
      throw new ForbiddenException(
        'You can only access payouts from your assigned Solar Mitras',
      );
    }
  }

  return payout;
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
  this.assertOwner(
    req.user,
  );

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
  this.assertManagementAccess(
    req.user,
  );

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
  this.assertManagementAccess(
    req.user,
  );

  const managerId =
    this.isFranchiseManager(
      req.user,
    ) &&
    !this.isOwner(req.user)
      ? Number(req.user.id)
      : undefined;

  return this.service.listMeetings(
    query,
    managerId,
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
  this.assertManagementAccess(
    req.user,
  );

  const meeting =
    await this.service.getMeeting(
      id,
    );

  if (
    this.isFranchiseManager(
      req.user,
    ) &&
    !this.isOwner(req.user) &&
    Number(
      meeting.franchiseManagerId,
    ) !== Number(req.user.id)
  ) {
    throw new ForbiddenException(
      'You can only access your own Solar Mitra meetings',
    );
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
  this.assertManagementAccess(
    req.user,
  );

  const meeting =
    await this.service.getMeeting(
      id,
    );

  if (
    this.isFranchiseManager(
      req.user,
    ) &&
    !this.isOwner(req.user) &&
    Number(
      meeting.franchiseManagerId,
    ) !== Number(req.user.id)
  ) {
    throw new ForbiddenException(
      'You can only update your own Solar Mitra meetings',
    );
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
  this.assertManagementAccess(
    req.user,
  );

  const meeting =
    await this.service.getMeeting(
      id,
    );

  if (
    this.isFranchiseManager(
      req.user,
    ) &&
    !this.isOwner(req.user) &&
    Number(
      meeting.franchiseManagerId,
    ) !== Number(req.user.id)
  ) {
    throw new ForbiddenException(
      'You can only convert your own Solar Mitra meetings',
    );
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
    this.isFranchiseManager(
      req.user,
    ) &&
    !this.isOwner(req.user) &&
    Number(
      meeting.franchiseManagerId,
    ) !== Number(req.user.id)
  ) {
    throw new ForbiddenException(
      'You can only upload documents to your own Solar Mitra meetings',
    );
  }

  return this.service
    .uploadMeetingDocument(
      id,
      file,
      body?.documentName,
      req.user,
    );
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

  if (
    this.isFranchiseManager(req.user) &&
    !this.isOwner(req.user)
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
  }

  return this.service.updateSolarMitra(
    id,
    body,
    req.user,
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

  if (
  this.isFranchiseManager(req.user) &&
  !this.isOwner(req.user)
) {
  const mitra =
    await this.service.getSolarMitra(
      solarMitraId,
    );

  if (
    Number(
      mitra.franchiseManagerId,
    ) !== Number(req.user.id)
  ) {
    throw new ForbiddenException(
      'You can only create referrals for your assigned Solar Mitras',
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
    this.isFranchiseManager(req.user) &&
    !this.isOwner(req.user) &&
    Number(mitra.franchiseManagerId) !==
      Number(req.user.id)
  ) {
    throw new ForbiddenException(
      'You can only access your assigned Solar Mitras',
    );
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