import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StaffComplaintService } from './staff-complaint.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff-complaints')
export class StaffComplaintController {
  constructor(
    private readonly staffComplaintService: StaffComplaintService,
  ) {}

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.staffComplaintService.create(body, user);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('department') department?: string,
@Query('staffName') staffName?: string,
@Query('followUpDate') followUpDate?: string,
    @CurrentUser() user?: any,
  ) {
    return this.staffComplaintService.findAll(
      {
        page: Number(page || 1),
        limit: Number(limit || 20),
        search: search || '',
        status: status || '',
        priority: priority || '',
        department: department || '',
staffName: staffName || '',
followUpDate: followUpDate || '',
      },
      user,
    );
  }

  @Patch(':id')
updateComplaint(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffComplaintService.updateComplaint(
    Number(id),
    body,
    user,
  );
}

@Roles('OWNER')
@Get('hidden')
findHidden(
  @CurrentUser() user: any,
) {
  return this.staffComplaintService.findHidden(
    user,
  );
}

@Roles('OWNER')
@Patch(':id/restore')
restore(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.staffComplaintService.restore(
    Number(id),
    user,
  );
}

  @Roles('OWNER')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.staffComplaintService.updateStatus(
      Number(id),
      body,
      user,
    );
  }

  @Roles('OWNER')
  @Patch(':id/hide')
  hide(@Param('id') id: string, @CurrentUser() user: any) {
    return this.staffComplaintService.hide(Number(id), user);
  }
}