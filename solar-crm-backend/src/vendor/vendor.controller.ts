import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('vendor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post('create')
  @Roles('ADMIN')
  create(@Body() body: any) {
    return this.vendorService.create(body);
  }

  @Get()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'VENDOR')
  findAll() {
    return this.vendorService.findAll();
  }

  @Patch('assign-project')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  assignToProject(@Body() body: any) {
    return this.vendorService.assignToProject(
      Number(body.vendorId),
      Number(body.projectId),
    );
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: any) {
    return this.vendorService.update(Number(id), body);
  }
}