
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
    Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

import { SolarStoreService } from './solar-store.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('solar-store')
export class SolarStoreController {
  constructor(
    private readonly solarStoreService:
      SolarStoreService,
  ) {}

  // Owner and Franchise Head register stores.
  @Roles('OWNER', 'FRANCHISE_HEAD')
  @Post()
  create(
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.solarStoreService.createSolarStore(
      body,
      user,
    );
  }

  // Management listing.
  @Roles('OWNER', 'FRANCHISE_HEAD')
  @Get()
  list(@Query() query: any) {
    return this.solarStoreService.listSolarStores(
      query,
    );
  }

  // Store's own profile.
  // The store ID is resolved from the JWT user.
  @Roles('SOLAR_STORE')
  @Get('me')
  getMyProfile(@CurrentUser() user: any) {
    return this.solarStoreService.getMySolarStore(
      Number(user.id),
    );
  }

  // Management profile lookup.
  @Roles('OWNER', 'FRANCHISE_HEAD')
  @Get(':id')
  getById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.solarStoreService.getSolarStore(
      id,
    );
  }

    @Roles('OWNER', 'FRANCHISE_HEAD')
  @Get(':id/onboarding')
  getOnboarding(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.solarStoreService.getOnboardingSummary(
      id,
    );
  }

  @Roles('OWNER', 'FRANCHISE_HEAD')
  @Post(':id/onboarding/payments')
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.solarStoreService.recordOnboardingPayment(
      id,
      body,
      user,
    );
  }

  @Roles('OWNER', 'FRANCHISE_HEAD')
@Patch(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.solarStoreService.updateSolarStore(
    id,
    body,
    user,
  );
}

@Roles('OWNER', 'FRANCHISE_HEAD')
@Get(':id/audit-history')
getAuditHistory(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.solarStoreService.getSolarStoreAuditHistory(id);
}

  @Roles('OWNER', 'FRANCHISE_HEAD')
  @Post('shop-photo/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  uploadShopPhoto(
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    return this.solarStoreService.uploadShopPhoto(
      file,
      user,
    );
  }
}
