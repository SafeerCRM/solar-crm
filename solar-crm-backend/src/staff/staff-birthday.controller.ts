import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

import {
  StaffService,
} from './staff.service';

@UseGuards(
  JwtAuthGuard,
)
@Controller(
  'staff-birthday',
)
export class StaffBirthdayController {
  constructor(
    private readonly staffService:
      StaffService,
  ) {}

  @Get('today')
  getTodaysBirthdays() {
    return this.staffService
      .getTodaysBirthdays();
  }
}