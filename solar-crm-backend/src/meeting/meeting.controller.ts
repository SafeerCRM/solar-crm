import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post('proof/upload')
@UseInterceptors(FileInterceptor('file'))
uploadMeetingProof(
  @UploadedFile() file: any,
  @CurrentUser() user: any,
) {
  return this.meetingService.uploadMeetingProof(file, user);
}

  @Post()
  create(
    @Body() createMeetingDto: CreateMeetingDto,
    @CurrentUser() user: any,
  ) {
    return this.meetingService.create(createMeetingDto, user);
  }

  @Get()
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.meetingService.findAll(query, user);
  }

  @UseGuards(RolesGuard)
@Roles('OWNER')
@Get('export')
async exportCsv(
  @Query() query: any,
  @Res() res: any,
  @CurrentUser() user: any,
) {
  const csv =
    await this.meetingService.exportCsv(
      query,
      user,
    );

  res.setHeader(
    'Content-Type',
    'text/csv; charset=utf-8',
  );

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="meetings-${new Date()
      .toISOString()
      .slice(0, 10)}.csv"`,
  );

  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate',
  );

  return res.send(csv);
}

  @Get(':id/detail')
  getDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.meetingService.getDetail(id, user);
  }

  @Get(':id/review-remarks')
getReviewRemarks(
  @Param('id', ParseIntPipe) id: number,
  @CurrentUser() user: any,
) {
  return this.meetingService.getReviewRemarks(
    id,
    user,
  );
}

@Post(':id/review-remarks')
addReviewRemark(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.meetingService.addReviewRemark(
    id,
    body,
    user,
  );
}

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.meetingService.findOne(id, user);
  }

  @Patch('bulk/reassign')
bulkReassignMeetings(
  @Body()
  body: {
    assignedTo: number;
    assignedToName: string;
    filters?: any;
  },
  @CurrentUser() user: any,
) {
  return this.meetingService.bulkReassignMeetings(body, user);
}

  @Patch(':id/reassign')
reassignMeeting(
  @Param('id', ParseIntPipe) id: number,
  @Body()
  body: {
    assignedTo: number;
    assignedToName: string;
    scope?: 'single' | 'group';
  },
  @CurrentUser() user: any,
) {
  return this.meetingService.reassignMeeting(id, body, user);
}

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMeetingDto: UpdateMeetingDto,
    @CurrentUser() user: any,
  ) {
    return this.meetingService.update(id, updateMeetingDto, user);
  }

  @Patch(':id/action')
  applyAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.meetingService.applyAction(id, body, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.meetingService.updateStatus(id, body, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.meetingService.remove(id, user);
  }
}