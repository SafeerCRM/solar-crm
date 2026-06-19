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
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'HR_MANAGER')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.staffService.findAll(query);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.staffService.create(body, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.staffService.update(Number(id), body);
  }

  @Patch(':id/hide')
  hide(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.staffService.hide(Number(id), body, user);
  }

  @Patch(':id/restore')
  restore(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.staffService.restore(Number(id), body, user);
  }

  @Patch(':id/photo')
  updatePhoto(@Param('id') id: string, @Body() body: any) {
    return this.staffService.updatePhoto(Number(id), body);
  }

  @Get(':id/documents')
  getDocuments(@Param('id') id: string) {
    return this.staffService.getDocuments(Number(id));
  }

  @Post('document')
  addDocument(@Body() body: any, @CurrentUser() user: any) {
    return this.staffService.addDocument(body, user);
  }

  @Patch('document/:id/hide')
  hideDocument(@Param('id') id: string) {
    return this.staffService.hideDocument(Number(id));
  }

  @Get(':id/assets')
  getAssets(@Param('id') id: string) {
    return this.staffService.getAssets(Number(id));
  }

  @Post('asset')
  addAsset(@Body() body: any) {
    return this.staffService.addAsset(body);
  }

  @Patch('asset/:id/hide')
  hideAsset(@Param('id') id: string) {
    return this.staffService.hideAsset(Number(id));
  }
}