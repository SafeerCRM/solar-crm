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

  @Patch(':id/complete')
  markCompleted(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.followupService.markCompleted(id, user);
  }
}