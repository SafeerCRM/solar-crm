import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffLocationEvent } from './staff-location-event.entity';
import { StaffLocationPoint } from './staff-location-point.entity';
import { StaffLocationTrackingSession } from './staff-location-tracking-session.entity';
import { StaffLocationHealthMonitorService } from './staff-location-health-monitor.service';
import { StaffLocationService } from './staff-location.service';
import { StaffLocationController } from './staff-location.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StaffLocationTrackingSession,
      StaffLocationPoint,
      StaffLocationEvent,
    ]),
  ],
  providers: [
  StaffLocationService,
  StaffLocationHealthMonitorService,
],
  controllers: [
  StaffLocationController,
],
  exports: [TypeOrmModule, StaffLocationService],
})
export class StaffLocationModule {}