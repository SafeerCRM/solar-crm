import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TelecallingService } from './telecalling.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CallReviewStatus } from './call-log.entity';

@UseGuards(JwtAuthGuard)
@Controller('telecalling')
export class TelecallingController {
  constructor(private readonly telecallingService: TelecallingService) {}

  private hasRole(user: any, role: string) {
    if (Array.isArray(user?.roles)) {
      return user.roles.includes(role);
    }
    return user?.role === role;
  }

  @Post()
  create(@Body() data: any, @CurrentUser() user: any) {
    const payload = {
      ...data,
      telecallerId: data.telecallerId ?? user?.id,
    };

    return this.telecallingService.create(payload);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    if (this.hasRole(user, 'TELECALLER')) {
      return this.telecallingService.getByTelecaller(user.id);
    }

    return this.telecallingService.findAll();
  }

  @Get('performance')
  getPerformance() {
    return this.telecallingService.getPerformance();
  }

  @Get('review-queue')
  getReviewQueue(@CurrentUser() user: any) {
    return this.telecallingService.getReviewQueue(user);
  }

  @Patch(':id/review')
  reviewCall(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: {
      reviewStatus: CallReviewStatus;
      reviewNotes?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.reviewCall(id, data, user);
  }

  @Get('never-called')
  getNeverCalled(@CurrentUser() user: any) {
    if (this.hasRole(user, 'TELECALLER')) {
      return this.telecallingService.getNeverCalledByTelecaller(user.id);
    }

    return this.telecallingService.getNeverCalled();
  }

  @Get('status')
  getByStatus(
    @Query('callStatus') callStatus: string,
    @CurrentUser() user: any,
  ) {
    if (this.hasRole(user, 'TELECALLER')) {
      return this.telecallingService.getByCallStatusAndTelecaller(
        callStatus,
        user.id,
      );
    }

    return this.telecallingService.getByCallStatus(callStatus);
  }

  @Get('today-followups')
  getTodayFollowUps(@CurrentUser() user: any) {
    if (this.hasRole(user, 'TELECALLER')) {
      return this.telecallingService.getTodayFollowUpsByTelecaller(user.id);
    }

    return this.telecallingService.getTodayFollowUps();
  }

  @Get('lead/:leadId')
  findByLead(
    @Param('leadId', ParseIntPipe) leadId: number,
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.findByLeadProtected(leadId, user);
  }

  @Post('contacts/import')
  @UseInterceptors(FileInterceptor('file'))
  importContacts(@UploadedFile() file: any, @CurrentUser() user: any) {
    return this.telecallingService.importContacts(file, user);
  }

  @Get('contacts')
  getContacts(
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.telecallingService.getContacts(
      user,
      Number(page),
      Number(limit),
    );
  }

  @Patch('contacts/bulk-assign')
  bulkAssignContacts(
    @Body('contactIds') contactIds: number[],
    @Body('assignedTo') assignedTo: number,
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.bulkAssignContacts(
      Array.isArray(contactIds) ? contactIds.map(Number) : [],
      Number(assignedTo),
      user,
    );
  }

  @Patch('contacts/:id/assign')
  assignContact(
    @Param('id', ParseIntPipe) id: number,
    @Body('assignedTo') assignedTo: number,
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.assignContact(id, Number(assignedTo), user);
  }

  @Post('contacts/:id/convert')
  convertContactToLead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.convertContactToLead(id, user);
  }
}