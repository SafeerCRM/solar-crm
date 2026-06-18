import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LeadsModule } from './leads/leads.module';
import { TelecallingModule } from './telecalling/telecalling.module';
import { FollowupModule } from './followup/followup.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MastersModule } from './masters/masters.module';
import { ProjectModule } from './project/project.module';
import { CalculatorModule } from './calculator/calculator.module';
import { VendorModule } from './vendor/vendor.module';
import { MeetingModule } from './meeting/meeting.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ProposalModule } from './proposal/proposal.module';
import { CustomerModule } from './customer/customer.module';
import { StaffComplaintModule } from './staff-complaint/staff-complaint.module';
import { CustomerPortalModule } from './customer-portal/customer-portal.module';
import { DealerModule } from './dealer/dealer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV !== 'production',
}),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    LeadsModule,
    TelecallingModule,
    FollowupModule,
    DashboardModule,
    MastersModule,
    ProjectModule,
    CalculatorModule,
    VendorModule,
    MeetingModule,
    ProposalModule,
    CustomerModule,
    StaffComplaintModule,
    CustomerPortalModule,
    DealerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}