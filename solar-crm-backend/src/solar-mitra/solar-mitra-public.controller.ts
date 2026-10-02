import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { SolarMitraService } from './solar-mitra.service';

@Controller('solar-mitra-public')
export class SolarMitraPublicController {
  constructor(
    private readonly service:
      SolarMitraService,
  ) {}

  @Get(':token')
  getReferralPage(
    @Param('token')
    token: string,
  ) {
    return this.service
      .getPublicReferralPage(
        token,
      );
  }

  @Post(':token/referrals')
  createReferral(
    @Param('token')
    token: string,

    @Body()
    body: any,
  ) {
    return this.service
      .createPublicQrReferral(
        token,
        body,
      );
  }
}