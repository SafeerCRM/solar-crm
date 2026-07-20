import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
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

  @Post('recordings/upload')
@UseInterceptors(FileInterceptor('file'))
uploadCallRecording(
  @UploadedFile() file: any,
  @Body()
  body: {
    contactId?: string;
    callLogId?: string;
    historyId?: string;
  },
  @CurrentUser() user: any,
) {
  return this.telecallingService.uploadCallRecording(file, body, user);
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
  findAll(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('name') name = '',
    @Query('phone') phone = '',
    @Query('city') city = '',
    @Query('callResult') callResult = '',
    @Query('leadPotential') leadPotential = '',
  ) {
    if (this.hasRole(user, 'TELECALLER')) {
      return this.telecallingService.getByTelecaller(user.id, {
        page: Number(page),
        limit: Number(limit),
        name: String(name || ''),
        phone: String(phone || ''),
        city: String(city || ''),
        callResult: String(callResult || ''),
        leadPotential: String(leadPotential || ''),
      });
    }

    return this.telecallingService.findAll();
  }

  @Get('performance')
  getPerformance() {
    return this.telecallingService.getPerformance();
  }

  @Get('performance/today')
getTodayPerformance() {
  return this.telecallingService.getTodayPerformance();
}

  @Get('review-queue')
getReviewQueue(
  @Query('page') page = 1,
  @Query('limit') limit = 50,
  @Query('name') name = '',
  @Query('phone') phone = '',
  @Query('city') city = '',
    @Query('telecallerName') telecallerName = '',
  @Query('callResult') callResult = '',
  @Query('leadPotential') leadPotential = '',
  @CurrentUser() user: any,
) {
  return this.telecallingService.getReviewQueue(user, {
    page: Number(page),
    limit: Number(limit),
    name: String(name || ''),
    phone: String(phone || ''),
    city: String(city || ''),
        telecallerName: String(telecallerName || ''),
    callResult: String(callResult || ''),
    leadPotential: String(leadPotential || ''),
  });
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

@Get('contacts/cnr-recall')
getCnrRecallContacts(
  @CurrentUser() user: any,
  @Query('page') page = '1',
  @Query('limit') limit = '50',
  @Query('locationFilter') locationFilter = '',
) {
  return this.telecallingService.getCnrRecallContacts(
    user,
    Number(page),
    Number(limit),
    String(locationFilter || ''),
  );
}


  @Get('contacts')
  getContacts(
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('view') view = 'active',
    @Query('locationFilter') locationFilter = '',
  ) {
    return this.telecallingService.getContacts(
      user,
      Number(page),
      Number(limit),
      String(view || 'active'),
      String(locationFilter || ''),
    );
  }

  @Get('contacts/all-ids')
  getAllContactIdsForAutoCall(
    @CurrentUser() user: any,
    @Query('view') view = 'active',
    @Query('locationFilter') locationFilter = '',
  ) {
    return this.telecallingService.getAllContactIdsForAutoCall(
      user,
      String(view || 'active'),
      String(locationFilter || ''),
    );
  }

  @Get('contacts/filter-options')
  getContactFilterOptions(@CurrentUser() user: any) {
    return this.telecallingService.getContactFilterOptions(user);
  }

  @Get('contacts/filter-count')
  getFilteredContactsCount(
    @Query('locationFilter') locationFilter = '',
    @Query('view') view = 'active',
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.getFilteredContactsCount(
      String(locationFilter || ''),
      String(view || 'active'),
      user,
    );
  }

  @Patch('contacts/assign-latest')
  assignLatestContactsByFilter(
    @Body('locationFilter') locationFilter: string,
    @Body('assignCount') assignCount: number,
    @Body('assignedTo') assignedTo: number,
    @Body('view') view: string,
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.assignLatestContactsByFilter(
      String(locationFilter || ''),
      Number(assignCount),
      Number(assignedTo),
      String(view || 'active'),
      user,
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

     @Post('contacts/latest-summary')
  getLatestContactSummaries(
    @Body('contactIds') contactIds: number[],
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.getLatestContactSummaries(
      Array.isArray(contactIds) ? contactIds.map(Number) : [],
      user,
    );
  }

  @Get('contacts/history')
getContactHistory(
  @CurrentUser() user: any,

  @Query('page') page = '1',
  @Query('limit') limit = '50',

  @Query('fromDate') fromDate = '',
  @Query('toDate') toDate = '',

  @Query('mode') mode = 'history',

  @Query('telecallerId') telecallerId = '',

  @Query('name') name = '',
  @Query('phone') phone = '',
  @Query('city') city = '',
  @Query('zone') zone = '',

  @Query('contactStatus') contactStatus = '',
  @Query('callStatus') callStatus = '',
  @Query('stage') stage = '',
  @Query('sourceModule') sourceModule = '',

  @Query('hasCalled') hasCalled = '',
  @Query('convertedToLead') convertedToLead = '',
  @Query('storageState') storageState = '',
) {
  return this.telecallingService.getContactHistory(
    user,
    {
      page: Number(page),
      limit: Number(limit),

      fromDate: String(fromDate || ''),
      toDate: String(toDate || ''),

      mode:
  mode === 'reassignment'
    ? 'reassignment'
    : 'history',

      telecallerId: telecallerId
        ? Number(telecallerId)
        : undefined,

      name: String(name || ''),
      phone: String(phone || ''),
      city: String(city || ''),
      zone: String(zone || ''),

      contactStatus: String(
        contactStatus || '',
      ),

      callStatus: String(callStatus || ''),
      stage: String(stage || ''),
      sourceModule: String(
        sourceModule || '',
      ),

      hasCalled: String(hasCalled || ''),

      convertedToLead: String(
        convertedToLead || '',
      ),

      storageState: String(
        storageState || '',
      ),
    },
  );
}

@Get('contacts/recycle-preview')
getRecycleContactPreview(
  @Req() req: any,
  @Query('page') page?: string,
  @Query('limit') limit?: string,

  @Query('fromTelecallerId')
  fromTelecallerId?: string,

  @Query('name') name?: string,
  @Query('phone') phone?: string,
  @Query('city') city?: string,
  @Query('zone') zone?: string,

  @Query('contactStatus')
  contactStatus?: string,

  @Query('callStatus')
  callStatus?: string,

  @Query('sourceModule')
  sourceModule?: string,

  @Query('hasCalled')
  hasCalled?: string,

  @Query('recycleDays')
  recycleDays?: string,
) {
  return this.telecallingService
    .getRecycleContactPreview(
      req.user,
      {
        page: page
          ? Number(page)
          : undefined,

        limit: limit
          ? Number(limit)
          : undefined,

        fromTelecallerId:
          Number(fromTelecallerId),

        name,
        phone,
        city,
        zone,
        contactStatus,
        callStatus,
        sourceModule,
        hasCalled,

        recycleDays:
          recycleDays
            ? Number(recycleDays)
            : undefined,
      },
    );
}

@Post('contacts/reassign-filtered')
reassignFilteredRecycleContacts(
  @Req() req: any,
  @Body()
  body: {
    fromTelecallerId: number;
    toTelecallerId: number;
    count: number;

    name?: string;
    phone?: string;
    city?: string;
    zone?: string;

    contactStatus?: string;
    callStatus?: string;
    sourceModule?: string;

    hasCalled?: string;
    recycleDays?: number;
  },
) {
  return this.telecallingService
    .reassignFilteredRecycleContacts(
      body,
      req.user,
    );
}

    @Get('contacts/:id/work-history')
  getContactWorkHistory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.getContactWorkHistory(id, user);
  }

  @Post('contacts/:id/call-history')
addContactCallHistory(
  @Param('id', ParseIntPipe) id: number,
  @Body()
  body: {
    callStatus?: string;
    notes?: string;
    recordingUrl?: string;
    nextFollowUpDate?: string;
  },
  @CurrentUser() user: any,
) {
  return this.telecallingService.addContactCallHistory(id, body, user);
}

  @Patch('contacts/:id/call-history/:historyId')
  updateContactCallHistory(
    @Param('id', ParseIntPipe) id: number,
    @Param('historyId', ParseIntPipe) historyId: number,
    @Body()
    body: {
      callStatus?: string;
      notes?: string;
      nextFollowUpDate?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.updateContactCallHistory(
      id,
      historyId,
      body,
      user,
    );
  }

  @Post('contacts/:id/notes')
  addContactNote(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note: string,
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.addContactNote(id, note, user);
  }

  @Patch('contacts/:id/notes/:noteId')
  updateContactNote(
    @Param('id', ParseIntPipe) id: number,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Body('note') note: string,
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.updateContactNote(id, noteId, note, user);
  }

  @Post('contacts/:id/quick-call/start')
  startQuickContactCall(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      providerName?: string;
      callerNumber?: string;
      receiverNumber?: string;
      providerCallId?: string;
      notes?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.startQuickContactCall(id, body, user);
  }

  @Post('contacts/:id/quick-call/complete')
  completeQuickContactCall(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      callLogId?: number;
      callStatus?: string;
      disposition?: string;
      callNotes?: string;
      nextFollowUpDate?: string;
      recordingUrl?: string;
      providerName?: string;
      providerCallId?: string;
      durationInSeconds?: number;
      callerNumber?: string;
      receiverNumber?: string;
      leadPotential?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.completeQuickContactCall(id, body, user);
  }

  @Patch('contacts/:id/assign')
  assignContact(
    @Param('id', ParseIntPipe) id: number,
    @Body('assignedTo') assignedTo: number,
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.assignContact(id, Number(assignedTo), user);
  }

  @Patch('contacts/:id/assign-review')
assignContactForReview(
  @Param('id', ParseIntPipe) id: number,
  @Body('assignedTo') assignedTo: number,
  @Body('note') note: string,
  @CurrentUser() user: any,
) {
  return this.telecallingService.assignContactForReview(
    id,
    Number(assignedTo),
    user,
    note,
  );
}

  @Post('contacts/:id/convert')
convertContactToLead(
  @Param('id', ParseIntPipe) id: number,
  @Body('leadManagerId') leadManagerId: number,
  @Body('assignedTo') assignedTo: number,
  @Body('potentialPercentage') potentialPercentage: number,
  @Body('note') note: string,
  @CurrentUser() user: any,
) {
  return this.telecallingService.convertContactToLead(
    id,
    Number(leadManagerId || assignedTo),
    Number(potentialPercentage || 50),
    user,
    note,
  );
}

  @Post('contacts/:id/convert-to-meeting')
convertContactToMeeting(
  @Param('id', ParseIntPipe) id: number,
  @Body('meetingManagerId') meetingManagerId: number,
  @Body('note') note: string,
  @CurrentUser() user: any,
) {
  return this.telecallingService.convertContactToMeeting(
    id,
    Number(meetingManagerId),
    user,
    note,
  );
}

@Get('telecaller-contact-count/:userId')
getTelecallerContactCount(
  @Param('userId', ParseIntPipe) userId: number,
) {
  return this.telecallingService.getTelecallerContactCount(userId);
}

  @Get('contacts/:id')
  getContactById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.getContactById(id, user);
  }
  @Patch('contacts/:id/update-name')
  updateContactName(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
    @CurrentUser() user: any,
  ) {
    return this.telecallingService.updateContactName(id, name, user);
  }

  @Post('contacts/reassign-selected')
reassignSelectedContacts(
  @Body()
  body: {
    fromTelecallerId: number;
    toTelecallerId: number;
    contactIds: number[];
  },
  @CurrentUser() user: any,
) {
  return this.telecallingService.reassignSelectedContacts(
    {
      fromTelecallerId: Number(
        body?.fromTelecallerId,
      ),

      toTelecallerId: Number(
        body?.toTelecallerId,
      ),

      contactIds: Array.isArray(
        body?.contactIds,
      )
        ? body.contactIds.map(Number)
        : [],
    },

    user,
  );
}

  @Patch('transfer-contacts')
transferContacts(
  @Body()
  body: {
  fromUserId: number;
  toUserId: number;
  count?: number;
  city?: string;
},
) {
  return this.telecallingService.transferContacts(body);
}
}