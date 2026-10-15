
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SolarStore } from './solar-store.entity';
import { SolarStoreOnboardingPayment } from './solar-store-onboarding-payment.entity';
import { SolarStoreService } from './solar-store.service';
import { SolarStoreController } from './solar-store.controller';
import { SolarStoreAudit } from './solar-store-audit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
  SolarStore,
  SolarStoreOnboardingPayment,
  SolarStoreAudit,
]),
  ],
  controllers: [SolarStoreController],
  providers: [SolarStoreService],
  exports: [TypeOrmModule],
})
export class SolarStoreModule {}
