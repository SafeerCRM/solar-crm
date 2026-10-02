import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';

import {
  SolarMitraReferralSourceType,
} from './solar-mitra-referral.entity';

import {
  SolarMitraService,
} from './solar-mitra.service';

@Controller('solar-mitra-portal')
export class SolarMitraPortalController {
  constructor(
    private readonly service:
      SolarMitraService,
  ) {}

  private getToken(
    req: any,
  ): string {
    const authHeader =
      req.headers?.authorization || '';

    return authHeader.replace(
      'Bearer ',
      '',
    );
  }

  @Post('login')
  login(
    @Body()
    body: {
      username: string;
      password: string;
    },
  ) {
    return this.service.solarMitraLogin(
      body.username,
      body.password,
    );
  }

  @Get('profile')
  profile(
    @Req()
    req: any,
  ) {
    const payload =
      this.service.verifySolarMitraToken(
        this.getToken(req),
      );

    return this.service
      .getSolarMitraPortalProfile(
        payload.solarMitraId,
      );
  }

  @Get('referrals')
  referrals(
    @Req()
    req: any,
  ) {
    const payload =
      this.service.verifySolarMitraToken(
        this.getToken(req),
      );

    return this.service
      .listSolarMitraPortalReferrals(
        payload.solarMitraId,
      );
  }

  @Get('referrals/:id')
referralDetail(
  @Req()
  req: any,

  @Param(
    'id',
    ParseIntPipe,
  )
  referralId: number,
) {
  const payload =
    this.service.verifySolarMitraToken(
      this.getToken(req),
    );

  return this.service
    .getSolarMitraPortalReferral(
      payload.solarMitraId,
      referralId,
    );
}

  @Post('referrals')
  createReferral(
    @Req()
    req: any,

    @Body()
    body: any,
  ) {
    const payload =
      this.service.verifySolarMitraToken(
        this.getToken(req),
      );

    return this.service
      .createReferralForMitra(
        payload.solarMitraId,
        body,
        SolarMitraReferralSourceType
          .MITRA_PORTAL,
        {
          id:
            payload.solarMitraId,
          name:
            payload.solarMitraName,
          type:
            'SOLAR_MITRA',
        },
      );
  }
}