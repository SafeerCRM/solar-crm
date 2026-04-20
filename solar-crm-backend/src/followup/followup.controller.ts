import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FollowupService } from './followup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Query } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller('followup')
export class FollowupController {
  constructor(private readonly followupService: FollowupService) {}

  @Post('create')
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.followupService.create(body, user);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.followupService.findAll(user);
  }

  @Get('today')
  findToday(@CurrentUser() user: any) {
    return this.followupService.findToday(user);
  }

  @Get('overdue')
  findOverdue(@CurrentUser() user: any) {
    return this.followupService.findOverdue(user);
  }
@Get('by-date')
findByDate(
  @Query('date') date: string,
  @CurrentUser() user: any,
) {
  return this.followupService.findByDate(date, user);
}
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.followupService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.followupService.update(id, body, user);
  }

  @Patch(':id/complete')
  markCompleted(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.followupService.markCompleted(id, user);
  }

  @Get(':id/convert-to-meeting')
  getConvertToMeetingData(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.followupService.getConvertToMeetingData(id, user);
  }
}