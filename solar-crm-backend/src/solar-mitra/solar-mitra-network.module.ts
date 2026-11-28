import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SolarMitra } from './solar-mitra.entity';
import { SolarMitraSetting } from './solar-mitra-setting.entity';
import { SolarMitraPayout } from './solar-mitra-payout.entity';

import { SolarMitraNetworkPool } from './solar-mitra-network-pool.entity';
import { SolarMitraNetworkPayout } from './solar-mitra-network-payout.entity';
import { SolarMitraNetworkRate } from './solar-mitra-network-rate.entity';
import { SolarMitraNetworkService } from './solar-mitra-network.service';
import { SolarMitraNetworkRecovery } from './solar-mitra-network-recovery.entity';
import { SolarMitraReferral } from './solar-mitra-referral.entity';

import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolarMitra,
      SolarMitraSetting,
      SolarMitraPayout,
      SolarMitraNetworkPool,
      SolarMitraNetworkPayout,
      SolarMitraNetworkRate,
      SolarMitraNetworkRecovery,
      SolarMitraReferral,
      User,
    ]),
  ],
  providers: [
    SolarMitraNetworkService,
  ],
  exports: [
    SolarMitraNetworkService,
  ],
})
export class SolarMitraNetworkModule {}