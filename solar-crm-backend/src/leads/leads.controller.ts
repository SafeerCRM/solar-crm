import {
  Body,
  Controller,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { LeadsService } from './leads.service';
import { Lead } from './lead.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Req } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @UseGuards(RolesGuard)
@Roles('OWNER')
@Get('storage-list')
getLeadStorage(@Query() query: any) {
  return this.leadsService.getLeadStorage(query);
}

@UseGuards(RolesGuard)
@Roles('OWNER')
@Get('storage-filtered-ids')
getLeadStorageFilteredIds(@Query() query: any) {
  return this.leadsService.getLeadStorageFilteredIds(query);
}

@UseGuards(RolesGuard)
@Roles('OWNER')
@Patch('storage-assign')
assignStorageLeads(
  @Body()
  body: {
    contactIds: number[];
    assignedTo: number;
  },
  @CurrentUser() user: any,
) {
  return this.leadsService.assignStorageLeads(body, user);
}

@UseGuards(RolesGuard)
@Roles('OWNER')
@Post('storage-convert')
convertStorageToLeads(
  @Body()
  body: {
    contactIds: number[];
    assignedTo?: number;
  },
  @CurrentUser() user: any,
) {
  return this.leadsService.convertStorageToLeads(body, user);
}

  @Post()
  create(@Body() data: Partial<Lead>, @CurrentUser() user: any) {
    return this.leadsService.create(data, user);
  }
@Get('archived')
getArchivedLeads(@CurrentUser() user: any) {
  return this.leadsService.getArchivedLeads(user);
}

@Get('lead-manager-count/:id')
getLeadManagerLeadCount(@Param('id') id: string, @Req() req: any) {
  return this.leadsService.getLeadManagerLeadCount(Number(id), req.user);
}

  @Get()
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.leadsService.findAll(query, user);
  }

  @Get('hot')
  getHotLeads(@CurrentUser() user: any) {
    return this.leadsService.getHotLeads(user);
  }

  @Get('autocall')
getLeadsForAutoCall(@CurrentUser() user: any) {
  return this.leadsService.getLeadsForAutoCall(user);
}

@Patch('transfer-leads')
transferLeadsBetweenManagers(@Body() body: any, @Req() req: any) {
  return this.leadsService.transferLeadsBetweenManagers(
  Number(body.fromUserId),
  Number(body.toUserId),
  body.count ? Number(body.count) : undefined,
  req.user,
  body.filters,
);
}

  @Get('export')
  async exportCsv(@Res() res: any, @CurrentUser() user: any) {
    const csv = await this.leadsService.exportCsv(user);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    return res.send(csv);
  }

  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importCsv(@UploadedFile() file: any, @CurrentUser() user: any) {
    return this.leadsService.importCsv(file, user);
  }

  @Get('assigned/:userId')
  findByAssignedUser(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.findByAssignedUser(userId, user);
  }

  @Get(':id/history')
  getLeadHistory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.getLeadHistory(id, user);
  }

  @Post(':id/notes')
  addLeadNote(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note: string,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.addLeadNote(id, note, user);
  }

  @Patch('storage/assign-latest')
assignStorageLeadsByCount(
  @Body('assignCount') assignCount: number,
  @Body('assignedTo') assignedTo: number,
  @Body('filters') filters: any,
  @CurrentUser() user: any,
) {
  return this.leadsService.assignStorageLeadsByCount(
    Number(assignCount),
    Number(assignedTo),
    filters || {},
    user,
  );
}

  @Patch('assign-latest')
assignLeadsByCount(
  @Body('assignCount') assignCount: number,
  @Body('assignedTo') assignedTo: number,
  @CurrentUser() user: any,
) {
  return this.leadsService.assignLeadsByCount(
    Number(assignCount),
    Number(assignedTo),
    user,
  );
}

  @Patch(':id/notes/:noteId')
  updateLeadNote(
    @Param('id', ParseIntPipe) id: number,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Body('note') note: string,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.updateLeadNote(id, noteId, note, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.leadsService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Lead>,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.update(id, data, user);
  }
  @Post(':id/quick-call')
  quickCall(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      callStatus?: string;
      callNotes?: string;
      nextFollowUpDate?: string;
      leadPotential?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.leadsService.quickCall(id, body, user);
  }
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'LEAD_MANAGER')
  @Patch(':id/archive')
  archiveLead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.archiveLead(id, user);
  }

  @Patch(':id/restore')
restoreLead(
  @Param('id', ParseIntPipe) id: number,
  @CurrentUser() user: any,
) {
  return this.leadsService.restoreLead(id, user);
}

  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @Patch('assign-bulk')
  assignBulk(
    @Body()
    body: {
      leadIds: number[];
      assignedTo: number;
    },
  ) {
    return this.leadsService.assignBulk(body);
  }

  @Patch(':id/assign')
  assignLead(
    @Param('id', ParseIntPipe) id: number,
    @Body('assignedTo') assignedTo: number,
  ) {
    return this.leadsService.assignLead(id, Number(assignedTo));
  }
}