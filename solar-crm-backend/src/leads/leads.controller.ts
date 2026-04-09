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

@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Body() data: Partial<Lead>, @CurrentUser() user: any) {
    return this.leadsService.create(data, user);
  }

  @Get()
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.leadsService.findAll(query, user);
  }

  @Get('hot')
  getHotLeads() {
    return this.leadsService.getHotLeads();
  }

  @Get('export')
  async exportCsv(@Res() res: any, @CurrentUser() user: any) {
    const csv = await this.leadsService.exportCsv(user);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    return res.send(csv);
  }

  @UseGuards(RolesGuard)
  @Roles('OWNER', 'LEAD_MANAGER')
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

  @UseGuards(RolesGuard)
  @Roles('OWNER', 'LEAD_MANAGER')
  @Patch(':id/assign')
  assignLead(
    @Param('id', ParseIntPipe) id: number,
    @Body('assignedTo') assignedTo: number,
  ) {
    return this.leadsService.assignLead(id, Number(assignedTo));
  }
}