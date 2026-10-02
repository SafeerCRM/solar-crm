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
  UseGuards,
} from '@nestjs/common';

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

    const allowed =
      roles.includes(UserRole.OWNER) ||
      roles.includes(
        UserRole.FRANCHISE_MANAGER,
      );

    if (!allowed) {
      throw new ForbiddenException(
  'Solar Mitra management access denied',
);
    }
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
    this.assertManagementAccess(req.user);

    return this.service.createSolarMitra(
      body,
      req.user,
    );
  }

  @Get()
  list(
    @Req() req: any,
    @Query() query: any,
  ) {
    this.assertManagementAccess(req.user);

    return this.service.listSolarMitras(
      query,
    );
  }

  @Get('referrals/list')
listReferrals(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertManagementAccess(req.user);

  return this.service.listReferrals(
    query,
  );
}

@Get('referrals/:id')
referralDetail(
  @Req() req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  id: number,
) {
  this.assertManagementAccess(req.user);

  return this.service.getReferral(id);
}

@Post(':id/referrals')
createReferralByStaff(
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
listPayouts(
  @Req() req: any,
  @Query() query: any,
) {
  this.assertManagementAccess(
    req.user,
  );

  return this.service.listPayouts(
    query,
  );
}

@Get('payouts/:id')
payoutDetail(
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

  return this.service.getPayout(
    id,
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
  this.assertOwner(
    req.user,
  );

  return this.service.markPayoutPaid(
    id,
    body,
    req.user,
  );
}

@Patch(':id')
update(
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

  @Get(':id')
  detail(
    @Req() req: any,
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    this.assertManagementAccess(req.user);

    return this.service.getSolarMitra(id);
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