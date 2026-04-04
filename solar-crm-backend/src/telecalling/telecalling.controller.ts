import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TelecallingService } from './telecalling.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CallReviewStatus } from './call-log.entity';

@UseGuards(JwtAuthGuard)
@Controller('telecalling')
export class TelecallingController {
  constructor(private readonly telecallingService: TelecallingService) {}

  @Post()
  create(@Body() data: any, @CurrentUser() user: any) {
    const payload =
      user?.role === 'TELECALLER'
        ? { ...data, telecallerId: user.id }
        : data;

    return this.telecallingService.create(payload);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    if (user?.role === 'TELECALLER') {
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
    if (user?.role === 'TELECALLER') {
      return this.telecallingService.getNeverCalledByTelecaller(user.id);
    }

    return this.telecallingService.getNeverCalled();
  }

  @Get('status')
  getByCallStatus(@Query('callStatus') callStatus: string, @CurrentUser() user: any) {
    if (user?.role === 'TELECALLER') {
      return this.telecallingService.getByCallStatusAndTelecaller(
        callStatus,
        user.id,
      );
    }

    return this.telecallingService.getByCallStatus(callStatus);
  }

  @Get('today-followups')
  getTodayFollowUps(@CurrentUser() user: any) {
    if (user?.role === 'TELECALLER') {
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
}