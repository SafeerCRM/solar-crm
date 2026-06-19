import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffMember } from './staff-member.entity';
import { StaffDocument } from './staff-document.entity';
import { StaffAsset } from './staff-asset.entity';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StaffMember,
      StaffDocument,
      StaffAsset,
    ]),
  ],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}