import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SolarMitra } from './solar-mitra.entity';
import { SolarMitraReferral } from './solar-mitra-referral.entity';
import { SolarMitraSetting } from './solar-mitra-setting.entity';
import { SolarMitraPayout } from './solar-mitra-payout.entity';

import { SolarMitraService } from './solar-mitra.service';

import {
  SolarMitraController,
} from './solar-mitra.controller';

import {
  SolarMitraPublicController,
} from './solar-mitra-public.controller';

import {
  SolarMitraPortalController,
} from './solar-mitra-portal.controller';

import { LeadsModule } from '../leads/leads.module';


import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
  SolarMitra,
  SolarMitraReferral,
  SolarMitraSetting,
  SolarMitraPayout,
  User,
]),
    LeadsModule,

  ],
  controllers: [
  SolarMitraController,
  SolarMitraPublicController,
  SolarMitraPortalController,
],
  providers: [SolarMitraService],
  exports: [SolarMitraService],
})
export class SolarMitraModule {}