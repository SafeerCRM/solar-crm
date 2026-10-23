import {
  Controller,
  Get,
  Param,
  Header,
} from '@nestjs/common';
import { MeetingService } from './meeting.service';

@Controller('public/meeting-contact')
export class MeetingPublicController {
  constructor(
    private readonly meetingService: MeetingService,
  ) {}

  @Get(':token')
  @Header('Cache-Control', 'no-store')
  getContact(@Param('token') token: string) {
    return this.meetingService.getPublicMeetingManagerContact(
      token,
    );
  }
}