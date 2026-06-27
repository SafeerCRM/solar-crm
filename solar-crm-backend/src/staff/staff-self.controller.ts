import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  'TELECALLING_MANAGER',
  'TELECALLING_ASSISTANT',
  'TELECALLER',
  'LEAD_MANAGER',
  'LEAD_EXECUTIVE',
  'MARKETING_HEAD',
  'MEETING_MANAGER',
  'MEETING_ASSISTANT',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'LOAN_MANAGER',
  'ELECTRICITY_MANAGER',
  'SUBSIDY_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'MAINTENANCE_MANAGER',
  'CUSTOMER_MANAGER',
  'HR_MANAGER',
  'TRADING_MANAGER',
)
@Controller('staff/self')
export class StaffSelfController {
  constructor(private readonly staffService: StaffService) {}

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.staffService.getMyStaffProfile(user);
  }

  @Get('attendance')
  getMyAttendance(@Query() query: any, @CurrentUser() user: any) {
    return this.staffService.getMyAttendance(query, user);
  }

  @Post('attendance/punch-in')
  punchIn(@Body() body: any, @CurrentUser() user: any) {
    return this.staffService.punchIn(
      {
        ...body,
        staffId: undefined,
      },
      user,
    );
  }

  @Post('attendance/punch-out')
  punchOut(@Body() body: any, @CurrentUser() user: any) {
    return this.staffService.punchOut(
      {
        ...body,
        staffId: undefined,
      },
      user,
    );
  }

  @Post('attendance/photo-upload')
  @UseInterceptors(FilesInterceptor('files', 1))
  uploadAttendancePhoto(@UploadedFiles() files: any[]) {
    const file = files?.[0];
    return this.staffService.uploadAttendancePhoto(file);
  }
}